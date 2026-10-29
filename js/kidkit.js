'use strict';
// =====================================================
//  小小孩遊戲共用工具：畫 emoji、把題目念出來（語音）、大按鈕、拖拉
// =====================================================
const Kid = (() => {
  const FONT = '"Segoe UI Emoji","Apple Color Emoji","Noto Color Emoji",sans-serif';
  const TXT = '"Noto Sans TC", system-ui, sans-serif';

  function emoji(c, s, x, y, size, rot = 0) {
    c.save(); c.translate(x, y); if (rot) c.rotate(rot);
    c.font = `${Math.round(size)}px ${FONT}`; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(s, 0, size * 0.05);
    c.restore();
  }
  // 有白色紙邊的字
  function text(c, s, x, y, size, color = '#4a3520', edge = 8) {
    c.save(); c.font = `900 ${Math.round(size)}px ${TXT}`; c.textAlign = 'center'; c.textBaseline = 'middle';
    if (edge) { c.lineJoin = 'round'; c.lineWidth = edge; c.strokeStyle = Paper.PAPER; c.strokeText(s, x, y); }
    c.fillStyle = color; c.fillText(s, x, y); c.restore();
  }

  // 念出來（還不認得字的小朋友也知道要做什麼）；跟著音效開關
  let voice = null;
  function pickVoice() {
    const vs = window.speechSynthesis ? speechSynthesis.getVoices() : [];
    voice = vs.find(v => /zh[-_]TW/i.test(v.lang)) || vs.find(v => /zh[-_](HK|Hant)/i.test(v.lang)) || vs.find(v => /^zh/i.test(v.lang)) || null;
  }
  if (window.speechSynthesis) { pickVoice(); speechSynthesis.onvoiceschanged = pickVoice; }
  function say(s) {
    if (!Sfx.on || !window.speechSynthesis) return;
    try {
      speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(s); u.lang = 'zh-TW'; u.rate = 1; u.pitch = 1.25;
      if (voice) u.voice = voice;
      speechSynthesis.speak(u);
    } catch (e) {}
  }

  // 大按鈕：b = {x, y, w, h}（x, y 是中心）
  function button(c, b, label, color, opt = {}) {
    const s = 1 + (opt.pop || 0) * 0.12, sh = opt.shake ? Math.sin(opt.shake * 50) * opt.shake * 14 : 0;
    c.save(); c.translate(b.x + sh, b.y); c.scale(s, s); if (opt.alpha != null) c.globalAlpha = opt.alpha;
    Paper.rect(c, -b.w / 2, -b.h / 2, b.w, b.h, color, Math.min(22, b.h * 0.3), { border: 5 });
    if (label) text(c, label, 0, 2, opt.size || b.h * 0.5, opt.color || '#fff', 0);
    c.restore();
  }
  const hit = (b, x, y, pad = 6) => Math.abs(x - b.x) <= b.w / 2 + pad && Math.abs(y - b.y) <= b.h / 2 + pad;

  // 拖拉：在 tap() 裡 grab(物件, x, y)；每次 update 呼叫 step(放開時要做的事)
  function makeDrag() {
    return {
      obj: null, dx: 0, dy: 0,
      grab(o, x, y) { this.obj = o; this.dx = o.x - x; this.dy = o.y - y; },
      step(onDrop) {
        if (!this.obj) return;
        if (Input.down) { this.obj.x = clamp(Input.x + this.dx, 0, V.W); this.obj.y = clamp(Input.y + this.dy, 0, V.H); }
        else { const o = this.obj; this.obj = null; onDrop(o); }
      },
    };
  }

  // 背景 + 地面，回傳地面高度
  function ground(c, theme, t, frac = 0.93) {
    const T = Paper.bg(c, theme, 0, t), gy = V.H * frac;
    c.fillStyle = T.ground || '#c99b62'; c.fillRect(-20, gy, V.W + 40, V.H);
    Paper.rect(c, -20, gy - 8, V.W + 40, 18, T.grass || '#5fa344', 4, { blur: 4 });
    return gy;
  }
  const shuffle = a => { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  const portrait = () => V.W < 700;

  return { FONT, emoji, text, say, button, hit, makeDrag, ground, shuffle, portrait };
})();
