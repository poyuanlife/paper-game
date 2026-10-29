'use strict';
// =====================================================
//  做紙片人：選「拍人」或「拍貓狗」→ 拍照（有倒數）或從相簿選 → 去背 → 切成紙偶 → 預覽 → 存起來
//  人存在 'me'、寵物存在 'pet'，首頁可以切換。寵物的關節可以用手拖拉修正。
// =====================================================
const Maker = (() => {
  let cur = null, prevPup = null, busy = false, stream = null, facing = 'user', timer = Store.get('camTimer', 10), counting = 0;
  let mode = Store.get('makeMode', 'human'), editing = false, drag = null;
  const part = id => { for (const s of ['mkStart', 'mkBusy', 'mkResult']) $(s).classList.toggle('hidden', s !== id); };
  const err = m => { $('mkErr').textContent = m || ''; };

  function setMode(m) {
    mode = m; Store.set('makeMode', m);
    $('scrMaker').dataset.mode = m; $('scrCam').dataset.mode = m;
    document.querySelectorAll('#mkMode button').forEach(b => b.classList.toggle('on', b.dataset.m === m));
    $('camHint').textContent = m === 'pet' ? '從側面拍，讓牠的全身（四隻腳）都在框裡' : '把手機立好，退到全身都在框裡，再按快門（有倒數）';
    // 拍寵物通常是別人拿手機，用後鏡頭；自拍全身用前鏡頭
    facing = m === 'pet' ? 'environment' : 'user';
  }
  document.querySelectorAll('#mkMode button').forEach(b => b.onclick = () => { Sfx.play('click'); setMode(b.dataset.m); });
  setMode(mode);

  function open() { err(''); setEdit(false); part(cur ? 'mkResult' : 'mkStart'); App.go('maker'); }

  async function process(src) {
    if (busy) return; busy = true; err(''); part('mkBusy');
    try {
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
    $('mkEdit').classList.toggle('hidden', J.kind !== 'pet');
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

  // ---- 寵物關節編輯：在預覽上拖拉圓點 ----
  const PTS = [['head', '#e8453c'], ['neck', '#d9a400'], ['tailB', '#1fa7b5'], ['tailT', '#3b5bdb'], ['footF', '#c23bc9'], ['footB', '#777']];
  function setEdit(on) {
    editing = on && !!cur && cur.J.kind === 'pet';
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
    for (const [n] of PTS) { const q = cur.J[n], d = Math.hypot(f.ox + q.x * f.s - p.x, f.oy + q.y * f.s - p.y); if (d < bd) { bd = d; best = n; } }
    if (best) { drag = best; try { $('mkPrev').setPointerCapture(e.pointerId); } catch (er) {} }
  });
  $('mkPrev').addEventListener('pointermove', e => {
    if (!drag) return; const p = local(e), f = fit();
    cur.J[drag] = { x: clamp((p.x - f.ox) / f.s, 0, cur.canvas.width), y: clamp((p.y - f.oy) / f.s, 0, cur.canvas.height) };
  });
  const endDrag = () => { if (!drag) return; drag = null; try { prevPup = Puppet.build(cur.canvas, cur.J); } catch (e) { err(e.message); } };
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
      for (const [a, b] of [['head', 'neck'], ['neck', 'tailB'], ['tailB', 'tailT'], ['neck', 'footF'], ['tailB', 'footB']]) { const p = P(a), q = P(b); x.moveTo(p.x, p.y); x.lineTo(q.x, q.y); }
      x.stroke(); x.setLineDash([]);
      for (const [n, col] of PTS) { const p = P(n), r = drag === n ? 13 : 10; x.fillStyle = col; x.strokeStyle = '#fff'; x.lineWidth = 3; x.beginPath(); x.arc(p.x, p.y, r, 0, Math.PI * 2); x.fill(); x.stroke(); }
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
  }
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
    for (let i = timer; i > 0; i--) {
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

  return { open, drawPreview, process, setMode };
})();
