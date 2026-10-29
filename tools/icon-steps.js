// 產生 PWA 圖示（用遊戲裡的預設紙片人）：
//   node tools/serve.js --no-open  然後  node _test/cdp5.js http://localhost:8090/ out tools/icon-steps.js > icons.txt
//   再用 tools/save-icons.js 把 icons.txt 存成 icons/*.png
(() => {
  const pup = Puppet.build(Puppet.makeDefault().canvas, Puppet.makeDefault().J);
  function make(size, maskable) {
    const c = document.createElement('canvas'); c.width = c.height = size; const x = c.getContext('2d'), s = size / 512;
    x.scale(s, s);
    const g = x.createLinearGradient(0, 0, 0, 512); g.addColorStop(0, '#9fd8ef'); g.addColorStop(1, '#e8f6e9');
    x.fillStyle = g;
    if (maskable) x.fillRect(0, 0, 512, 512); else { x.beginPath(); Paper.rrect(x, 0, 0, 512, 512, 110); x.fill(); x.save(); x.clip(); }
    // 太陽、草地
    Paper.circle(x, 400, 110, 46, '#ffe07a', { border: 6, blur: 10 });
    Paper.shape(x, c => { c.moveTo(-20, 600); c.lineTo(-20, 420); c.quadraticCurveTo(140, 370, 256, 410); c.quadraticCurveTo(380, 450, 540, 400); c.lineTo(540, 600); c.closePath(); }, '#7dbb5c', { border: 6 });
    const k = maskable ? 0.78 : 0.9;
    x.translate(256, 256); x.scale(k, k); x.translate(-256, -256);
    Puppet.draw(x, pup, 256, 470, 400, Puppet.Poses.cheer(0.13));
    if (!maskable) x.restore();
    return c.toDataURL('image/png');
  }
  return JSON.stringify({ 'icon-512.png': make(512), 'icon-192.png': make(192), 'apple-touch-icon.png': make(180, true), 'maskable-512.png': make(512, true) });
})()
