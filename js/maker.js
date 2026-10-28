'use strict';
// =====================================================
//  做紙片人：拍照（有倒數）或從相簿選一張正面全身照 → 去背 → 切成紙偶 → 預覽 → 存起來
// =====================================================
const Maker = (() => {
  let cur = null, prevPup = null, busy = false, stream = null, facing = 'user', timer = Store.get('camTimer', 10), counting = 0;
  const part = id => { for (const s of ['mkStart', 'mkBusy', 'mkResult']) $(s).classList.toggle('hidden', s !== id); };
  const err = m => { $('mkErr').textContent = m || ''; };

  function open() { err(''); part(cur ? 'mkResult' : 'mkStart'); App.go('maker'); }

  async function process(src) {
    if (busy) return; busy = true; err(''); part('mkBusy');
    try {
      const r = await Cutout.cut(src, m => { $('mkMsg').textContent = m; }, +$('mkStr').value);
      setResult(r);
    } catch (e) { console.error(e); part(cur ? 'mkResult' : 'mkStart'); err('失敗了：' + (e && e.message || e)); }
    busy = false;
  }
  function setResult(r) {
    cur = r;
    const J = Puppet.jointsFromLandmarks(r.lm, r.canvas);
    cur.J = J; prevPup = Puppet.build(r.canvas, J);
    $('mkWarn').innerHTML = r.warn.map(w => '⚠ ' + w).join('<br>');
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
  $('mkRetry').onclick = () => { Sfx.play('click'); cur = null; prevPup = null; part('mkStart'); };
  $('fileIn').addEventListener('change', e => { const f = e.target.files && e.target.files[0]; if (f) process(f); });
  $('mkUse').onclick = async () => {
    if (!cur) return; Sfx.play('win');
    App.pup = prevPup; App.hasPhoto = true; $('bMake').textContent = '📷 換我的紙片人';
    try { await Store.saveChar(cur.canvas, cur.J); } catch (e) { console.warn('存檔失敗', e); }
    FX.burst(V.W / 2, V.H * 0.5, 30);
    App.go('home');
  };
  $('mkDefault').onclick = async () => { Sfx.play('click'); App.setPuppet(Puppet.makeDefault()); App.hasPhoto = false; $('bMake').textContent = '📷 做我的紙片人'; await Store.clearChar(); App.go('home'); };

  // 預覽：在面板裡的小畫布上跳舞
  function drawPreview(t) {
    if (!prevPup || $('mkResult').classList.contains('hidden')) return;
    const c = $('mkPrev'), x = c.getContext('2d'), d = Math.min(2, devicePixelRatio || 1), w = c.clientWidth, h = c.clientHeight;
    if (c.width !== Math.round(w * d)) { c.width = Math.round(w * d); c.height = Math.round(h * d); }
    x.setTransform(d, 0, 0, d, 0, 0); x.clearRect(0, 0, w, h);
    const ph = h * 0.86, pose = Math.floor(t / 3) % 3 === 0 ? Puppet.Poses.dance(t) : Math.floor(t / 3) % 3 === 1 ? Puppet.Poses.run(t) : Puppet.Poses.jump(Math.sin(t * 3));
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

  return { open, drawPreview, process };
})();
