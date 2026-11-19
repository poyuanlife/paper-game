'use strict';
// =====================================================
//  做紙片人：選「拍人」「拍貓狗」或「拍畫畫」→ 拍照（有倒數）或從相簿選 → 去背 → 切成紙偶 → 預覽 → 存起來
//  拍畫畫：先讓使用者用手指把畫裡的那個人圈起來，再去背。
//  人（和畫）存在 'me'、寵物存在 'pet'，首頁可以切換。寵物、畫、插圖的關節可以用手拖拉修正。
// =====================================================
const Maker = (() => {
  let cur = null, prevPup = null, busy = false, stream = null, facing = 'user', timer = Store.get('camTimer', 10), counting = 0;
  let mode = Store.get('makeMode', 'human'), editing = false, drag = null;
  let lasImg = null, lasPts = [], lasClosed = false, lasDraw = false, lasBmp = null;
  const part = id => { for (const s of ['mkStart', 'mkLasso', 'mkBusy', 'mkResult']) $(s).classList.toggle('hidden', s !== id); };
  const err = m => { $('mkErr').textContent = m || ''; };

  function setMode(m) {
    mode = m; Store.set('makeMode', m);
    $('scrMaker').dataset.mode = m; $('scrCam').dataset.mode = m;
    document.querySelectorAll('#mkMode button').forEach(b => b.classList.toggle('on', b.dataset.m === m));
    $('camHint').textContent = m === 'pet' ? '從側面拍，讓牠的全身（四隻腳）都在框裡' : m === 'draw' ? '把畫放平，從正上方拍，整個人都要在畫面裡' : '把手機立好，退到全身都在框裡，再按快門（有倒數）';
    $('mkStrHint').textContent = m === 'draw' ? '線條沒抓到 → 往「寬鬆」；紙上的髒點也被抓到 → 往「嚴格」' : '背景沒去乾淨 → 往「嚴格」；身體被切掉 → 往「寬鬆」';
    // 拍寵物、拍畫通常是拿著手機拍別的東西，用後鏡頭；自拍全身用前鏡頭
    facing = m === 'human' ? 'user' : 'environment';
  }
  document.querySelectorAll('#mkMode button').forEach(b => b.onclick = () => { Sfx.play('click'); setMode(b.dataset.m); });
  setMode(mode);

  function open() { err(''); setEdit(false); part(cur ? 'mkResult' : 'mkStart'); App.go('maker'); }

  async function process(src) {
    if (busy) return; busy = true; err(''); part('mkBusy');
    try {
      if (mode === 'draw') {
        $('mkMsg').textContent = '讀取照片中…';
        lasImg = await Cutout.loadImage(src); busy = false;
        part('mkLasso'); lasReset(); return;
      }
      const r = await Cutout.cut(src, m => { $('mkMsg').textContent = m; }, +$('mkStr').value, mode);
      setResult(r);
    } catch (e) { console.error(e); part(cur ? 'mkResult' : 'mkStart'); err('失敗了：' + (e && e.message || e)); }
    busy = false;
  }
  function setResult(r) {
    cur = r;
    const J = r.J || Puppet.jointsFromLandmarks(r.lm, r.canvas);
    cur.J = J; prevPup = Puppet.build(r.canvas, J);
    $('mkWarn').innerHTML = r.warn.map(w => '⚠ ' + w).join('<br>');
    $('mkEdit').classList.toggle('hidden', !canEdit());
    setEdit(false);
    part('mkResult');
  }

  // 去背強度：放開滑桿時才重算
  $('mkStr').addEventListener('change', () => {
    if (!cur) return;
    try { setResult(Cutout.recut(+$('mkStr').value)); err(''); } catch (e) { err(e.message || String(e)); }
  });
  $('mkStr').addEventListener('input', () => { $('mkStrVal').textContent = $('mkStr').value; });

  // 相簿（不加 capture，手機才會打開相簿而不是相機）
  $('mkAlbum').onclick = () => { Sfx.play('click'); $('fileIn').value = ''; $('fileIn').click(); };
  $('mkRetry').onclick = () => { Sfx.play('click'); cur = null; prevPup = null; setEdit(false); part('mkStart'); };
  $('fileIn').addEventListener('change', e => { const f = e.target.files && e.target.files[0]; if (f) process(f); });
  $('mkUse').onclick = async () => {
    if (!cur) return; Sfx.play('win');
    const slot = cur.J.kind === 'pet' ? 'pet' : 'me';
    App.chars[slot] = { canvas: cur.canvas, J: cur.J };
    App.useChar(slot, prevPup);
    try { await Store.saveChar(cur.canvas, cur.J, slot); } catch (e) { console.warn('存檔失敗', e); }
    FX.burst(V.W / 2, V.H * 0.5, 30);
    App.go('home');
  };
  $('mkDefault').onclick = () => { Sfx.play('click'); App.useChar('default'); App.go('home'); };

  // ---- 畫畫：用手指圈出要的那個人 ----
  function lasFit() {
    const c = $('mkLas'), w = c.clientWidth, h = c.clientHeight, s = Math.min(w / lasImg.width, h / lasImg.height);
    return { s, ox: (w - lasImg.width * s) / 2, oy: (h - lasImg.height * s) / 2 };
  }
  function lasReset() { lasPts = []; lasClosed = false; lasDraw = false; $('mkLasOk').disabled = true; lasBmp = null; requestAnimationFrame(drawLasso); }
  const lasPath = (x, f) => { x.beginPath(); lasPts.forEach((p, i) => { const a = f.ox + p.x * f.s, b = f.oy + p.y * f.s; i ? x.lineTo(a, b) : x.moveTo(a, b); }); };
  function drawLasso() {
    if (!lasImg || $('mkLasso').classList.contains('hidden')) return;
    const c = $('mkLas'), x = c.getContext('2d'), d = Math.min(2, devicePixelRatio || 1), w = c.clientWidth, h = c.clientHeight;
    if (c.width !== Math.round(w * d) || c.height !== Math.round(h * d)) { c.width = Math.round(w * d); c.height = Math.round(h * d); }
    if (!lasBmp) { lasBmp = document.createElement('canvas'); lasBmp.width = lasImg.width; lasBmp.height = lasImg.height; lasBmp.getContext('2d', { willReadFrequently: true }).putImageData(lasImg, 0, 0); }
    const f = lasFit();
    x.setTransform(d, 0, 0, d, 0, 0); x.clearRect(0, 0, w, h);
    x.drawImage(lasBmp, f.ox, f.oy, lasImg.width * f.s, lasImg.height * f.s);
    if (lasPts.length < 2) return;
    if (lasClosed) {   // 圈外面變暗
      x.save(); lasPath(x, f); x.closePath(); x.rect(0, 0, w, h); x.fillStyle = 'rgba(0,0,0,0.5)'; x.fill('evenodd'); x.restore();
    }
    lasPath(x, f); if (lasClosed) x.closePath();
    x.lineJoin = 'round'; x.lineCap = 'round';
    x.strokeStyle = '#fff'; x.lineWidth = 6; x.stroke();
    x.strokeStyle = '#ff8a3d'; x.lineWidth = 3.5; x.setLineDash([9, 6]); x.stroke(); x.setLineDash([]);
  }
  const lasLocal = e => { const r = $('mkLas').getBoundingClientRect(), f = lasFit(); return { x: clamp((e.clientX - r.left - f.ox) / f.s, 0, lasImg.width), y: clamp((e.clientY - r.top - f.oy) / f.s, 0, lasImg.height) }; };
  $('mkLas').addEventListener('pointerdown', e => {
    if (!lasImg) return; e.preventDefault();
    lasPts = [lasLocal(e)]; lasClosed = false; lasDraw = true; $('mkLasOk').disabled = true;
    try { $('mkLas').setPointerCapture(e.pointerId); } catch (er) {}
    drawLasso();
  });
  $('mkLas').addEventListener('pointermove', e => {
    if (!lasDraw) return;
    const p = lasLocal(e), q = lasPts[lasPts.length - 1];
    if (Math.hypot(p.x - q.x, p.y - q.y) * lasFit().s >= 4) { lasPts.push(p); drawLasso(); }
  });
  const lasEnd = () => {
    if (!lasDraw) return; lasDraw = false;
    // 圈太小（只是點一下）就不算
    let a = 0; for (let i = 0; i < lasPts.length; i++) { const p = lasPts[i], q = lasPts[(i + 1) % lasPts.length]; a += p.x * q.y - q.x * p.y; }
    lasClosed = lasPts.length >= 6 && Math.abs(a) / 2 > lasImg.width * lasImg.height * 0.004;
    if (!lasClosed) lasPts = [];
    $('mkLasOk').disabled = !lasClosed; if (lasClosed) Sfx.play('pop');
    drawLasso();
  };
  $('mkLas').addEventListener('pointerup', lasEnd);
  $('mkLas').addEventListener('pointercancel', lasEnd);
  addEventListener('resize', () => requestAnimationFrame(drawLasso));
  $('mkLasRe').onclick = () => { Sfx.play('click'); lasReset(); };
  $('mkLasBack').onclick = () => { Sfx.play('click'); lasImg = null; part('mkStart'); };
  $('mkLasOk').onclick = async () => {
    if (!lasClosed || busy) return; Sfx.play('click');
    busy = true; err(''); part('mkBusy'); $('mkMsg').textContent = '把畫變成紙片人中…';
    await new Promise(r => setTimeout(r, 30));
    try { setResult(Cutout.cutDrawing(lasImg, lasPts, +$('mkStr').value)); }
    catch (e) { console.error(e); part('mkLasso'); requestAnimationFrame(drawLasso); err('失敗了：' + (e && e.message || e)); }
    busy = false;
  };

  // ---- 關節編輯：在預覽上拖拉圓點（寵物、畫、插圖、拍人都可以） ----
  const PET_PTS = [['head', '#e8453c'], ['neck', '#d9a400'], ['tailB', '#1fa7b5'], ['tailT', '#3b5bdb'], ['footF', '#c23bc9'], ['footB', '#777']];
  const PET_BONES = [['head', 'neck'], ['neck', 'tailB'], ['tailB', 'tailT'], ['neck', 'footF'], ['tailB', 'footB']];
  const HUM_PTS = [['top', '#e8453c'], ['neck', '#d9a400'], ['pelvis', '#1fa7b5'], ['hnL', '#c23bc9'], ['hnR', '#c23bc9'], ['ftL', '#3b5bdb'], ['ftR', '#3b5bdb']];
  const HUM_BONES = [['top', 'neck'], ['neck', 'pelvis'], ['neck', 'hnL'], ['neck', 'hnR'], ['pelvis', 'ftL'], ['pelvis', 'ftR']];
  // 拍人（MediaPipe 偵測的）：關節比較完整，肩膀、手肘、膝蓋也能拖；手腕、腳踝、髖關節跟著手、腳、屁股一起移動
  const FULL_PTS = [['top', '#e8453c'], ['neck', '#d9a400'], ['shL', '#f08c00'], ['shR', '#f08c00'], ['elL', '#2f9e44'], ['elR', '#2f9e44'], ['hnL', '#c23bc9'], ['hnR', '#c23bc9'],
    ['pelvis', '#1fa7b5'], ['knL', '#0c8599'], ['knR', '#0c8599'], ['ftL', '#3b5bdb'], ['ftR', '#3b5bdb']];
  const FULL_BONES = [['top', 'neck'], ['neck', 'shL'], ['neck', 'shR'], ['shL', 'elL'], ['elL', 'hnL'], ['shR', 'elR'], ['elR', 'hnR'], ['neck', 'pelvis'], ['pelvis', 'knL'], ['knL', 'ftL'], ['pelvis', 'knR'], ['knR', 'ftR']];
  const FOLLOW = { hnL: ['wrL'], hnR: ['wrR'], ftL: ['anL'], ftR: ['anR'], pelvis: ['hipL', 'hipR'] };
  const isPet = () => !!cur && cur.J.kind === 'pet';
  const isFull = () => !!cur && !isPet() && !cur.J.auto && !!cur.J.elL;
  const canEdit = () => !!cur && (isPet() || !!cur.J.auto || isFull());
  const PTS = () => isPet() ? PET_PTS : isFull() ? FULL_PTS : HUM_PTS;
  const BONES = () => isPet() ? PET_BONES : isFull() ? FULL_BONES : HUM_BONES;
  function setEdit(on) {
    editing = on && canEdit();
    const names = isPet() ? ['頭', '脖子', '尾巴根', '尾巴尖', '前腳', '後腳']
      : isFull() ? ['頭頂', '脖子', '肩膀', null, '手肘', null, '手', null, '屁股', '膝蓋', null, '腳', null]
      : ['頭頂', '脖子', '屁股', '兩隻手', null, '兩隻腳'];
    if (editing) $('mkEditHint').innerHTML = '拖拉圓點到正確的位置：' + PTS().map(([, col], i) => names[i] && `<b style="color:${col}">${names[i]}</b>`).filter(Boolean).join(I18N.lang === 'zh' || I18N.lang === 'ja' ? '、' : ', ');
    $('mkPrev').classList.toggle('edit', editing);
    $('mkEditHint').classList.toggle('hidden', !editing);
    $('mkEdit').textContent = editing ? '✔ 調整好了' : '🦴 調整關節';
  }
  $('mkEdit').onclick = () => { Sfx.play('click'); setEdit(!editing); };
  // 預覽畫布上：圖片的位置和縮放
  function fit() {
    const c = $('mkPrev'), w = c.clientWidth, h = c.clientHeight, s = Math.min(w * 0.92 / cur.canvas.width, h * 0.92 / cur.canvas.height);
    return { s, ox: (w - cur.canvas.width * s) / 2, oy: (h - cur.canvas.height * s) / 2 };
  }
  const local = e => { const r = $('mkPrev').getBoundingClientRect(); return { x: e.clientX - r.left, y: e.clientY - r.top }; };
  $('mkPrev').addEventListener('pointerdown', e => {
    if (!editing) return; e.preventDefault();
    const p = local(e), f = fit(); let best = null, bd = 34;
    for (const [n] of PTS()) { const q = cur.J[n], d = Math.hypot(f.ox + q.x * f.s - p.x, f.oy + q.y * f.s - p.y); if (d < bd) { bd = d; best = n; } }
    if (best) { drag = best; try { $('mkPrev').setPointerCapture(e.pointerId); } catch (er) {} }
  });
  $('mkPrev').addEventListener('pointermove', e => {
    if (!drag) return; const p = local(e), f = fit();
    const old = cur.J[drag], q = { x: clamp((p.x - f.ox) / f.s, 0, cur.canvas.width), y: clamp((p.y - f.oy) / f.s, 0, cur.canvas.height) };
    if (isFull()) for (const n of FOLLOW[drag] || []) if (cur.J[n]) cur.J[n] = { x: cur.J[n].x + q.x - old.x, y: cur.J[n].y + q.y - old.y };
    cur.J[drag] = q;
  });
  const endDrag = () => {
    if (!drag) return; drag = null;
    // 畫畫、插圖：只拖了 7 個主要的點，肩膀、手肘、膝蓋…跟著重算（拍人的關節每個都能拖，不用重算）
    if (!isPet() && !isFull()) cur.J = Object.assign(Cutout.humanFromKeys(cur.J), cur.J.draw ? { draw: 1 } : {});
    try { prevPup = Puppet.build(cur.canvas, cur.J); } catch (e) { err(e.message); }
  };
  $('mkPrev').addEventListener('pointerup', endDrag);
  $('mkPrev').addEventListener('pointercancel', endDrag);

  // 預覽：在面板裡的小畫布上跳舞（編輯關節時改成顯示照片 + 圓點）
  function drawPreview(t) {
    if (!prevPup || $('mkResult').classList.contains('hidden')) return;
    const c = $('mkPrev'), x = c.getContext('2d'), d = Math.min(2, devicePixelRatio || 1), w = c.clientWidth, h = c.clientHeight;
    if (c.width !== Math.round(w * d) || c.height !== Math.round(h * d)) { c.width = Math.round(w * d); c.height = Math.round(h * d); }
    x.setTransform(d, 0, 0, d, 0, 0); x.clearRect(0, 0, w, h);
    if (editing) {
      const f = fit(), J = cur.J, P = n => ({ x: f.ox + J[n].x * f.s, y: f.oy + J[n].y * f.s });
      x.globalAlpha = 0.85; x.drawImage(cur.canvas, f.ox, f.oy, cur.canvas.width * f.s, cur.canvas.height * f.s); x.globalAlpha = 1;
      x.strokeStyle = 'rgba(255,255,255,0.9)'; x.lineWidth = 3; x.setLineDash([6, 5]); x.beginPath();
      for (const [a, b] of BONES()) { const p = P(a), q = P(b); x.moveTo(p.x, p.y); x.lineTo(q.x, q.y); }
      x.stroke(); x.setLineDash([]);
      for (const [n, col] of PTS()) { const p = P(n), r = drag === n ? 13 : 10; x.fillStyle = col; x.strokeStyle = '#fff'; x.lineWidth = 3; x.beginPath(); x.arc(p.x, p.y, r, 0, Math.PI * 2); x.fill(); x.stroke(); }
      return;
    }
    const ph = h * 0.86, k = Math.floor(t / 3) % 3, pose = k === 0 ? Puppet.Poses.dance(t) : k === 1 ? Puppet.Poses.run(t) : Puppet.Poses.jump(Math.sin(t * 3));
    Puppet.draw(x, prevPup, w / 2, h * 0.95, ph, pose);
  }

  // ---- 相機 ----
  async function startCam() {
    stopCam();
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) throw new Error('這個瀏覽器不能開相機，請改用「從相簿選」。');
    stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: facing, width: { ideal: 1920 }, height: { ideal: 1920 } }, audio: false });
    const v = $('camV'); v.srcObject = stream; v.classList.toggle('mirror', facing === 'user');
    await v.play().catch(() => {});
    fitGuide();
  }
  // 人形框要對齊「實際拍得到的範圍」：預覽是完整顯示（螢幕和相機比例不同時會有黑邊），框跟著影像區域擺
  const GUIDE = { guideHuman: [0.06, 0.76, 0], guidePet: [0.22, 0.52, 0.92] };   // 上緣、高度、寬度（佔影像的比例）
  function fitGuide() {
    const v = $('camV'), S = $('scrCam');
    if (!v.videoWidth || !S.clientWidth) return;
    const sw = S.clientWidth, sh = S.clientHeight, k = Math.min(sw / v.videoWidth, sh / v.videoHeight);
    const dw = v.videoWidth * k, dh = v.videoHeight * k, ox = (sw - dw) / 2, oy = (sh - dh) / 2;
    for (const g of S.querySelectorAll('.guide')) {
      const [t, h, w] = GUIDE[g.classList.contains('guidePet') ? 'guidePet' : 'guideHuman'];
      Object.assign(g.style, { top: oy + dh * t + 'px', height: dh * h + 'px', left: ox + dw / 2 + 'px', maxWidth: dw * 0.96 + 'px', width: w ? dw * w + 'px' : '' });
    }
  }
  $('camV').addEventListener('loadedmetadata', fitGuide);
  $('camV').addEventListener('resize', fitGuide);   // 轉向時影像尺寸會變
  addEventListener('resize', () => { if (stream) fitGuide(); });
  function stopCam() { if (stream) { stream.getTracks().forEach(t => t.stop()); stream = null; } $('camV').srcObject = null; }
  const syncTimer = () => { $('camTimer').textContent = timer ? `⏱ ${timer} 秒` : '⏱ 不倒數'; };
  $('mkCam').onclick = async () => {
    Sfx.play('click'); err('');
    App.go('cam'); syncTimer(); $('camCount').textContent = '';
    try { await startCam(); } catch (e) { App.go('maker'); part('mkStart'); err('打不開相機：' + (e.name === 'NotAllowedError' ? '請允許使用相機，或改用「從相簿選」。' : (e.message || e))); }
  };
  $('camCancel').onclick = () => { counting = 0; stopCam(); App.go('maker'); };
  $('camFlip').onclick = async () => { facing = facing === 'user' ? 'environment' : 'user'; try { await startCam(); } catch (e) { err(e.message); } };
  $('camTimer').onclick = () => { timer = timer === 10 ? 3 : timer === 3 ? 0 : 10; Store.set('camTimer', timer); syncTimer(); };
  $('camShot').onclick = async () => {
    if (counting || !stream) return;
    counting = 1; Sfx.unlock();
    for (let i = mode === 'draw' ? 0 : timer; i > 0; i--) {   // 拍畫不用倒數
      if (!counting) return;
      $('camCount').textContent = i; Sfx.play('tick');
      await new Promise(r => setTimeout(r, 1000));
    }
    if (!counting) return;
    counting = 0; $('camCount').textContent = ''; Sfx.play('shutter');
    const v = $('camV'), c = document.createElement('canvas'); c.width = v.videoWidth; c.height = v.videoHeight;
    const x = c.getContext('2d');
    if (facing === 'user') { x.translate(c.width, 0); x.scale(-1, 1); }   // 前鏡頭：存成跟預覽一樣（像照鏡子）
    x.drawImage(v, 0, 0);
    stopCam(); App.go('maker');
    process(c);
  };

  return { open, drawPreview, process, setMode, drawLasso };
})();
