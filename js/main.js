'use strict';
// =====================================================
//  主程式：畫面大小、輸入、紙片風格的繪圖工具、畫面切換、遊戲迴圈
// =====================================================
const $ = id => document.getElementById(id);
const rand = (a, b) => a + Math.random() * (b - a);
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const pick = a => a[Math.floor(Math.random() * a.length)];

// 畫面：邏輯高度固定 720，寬度跟著螢幕比例（直向手機約 405，電腦約 1280）
const V = { W: 1280, H: 720, // 會在 resize() 重新計算
  k: 1, dpr: 1, shake: 0 };
const cv = $('cv'), ctx = cv.getContext('2d');
function resize() {
  V.dpr = Math.min(2, devicePixelRatio || 1);
  const w = innerWidth, h = innerHeight;
  // 直向手機：寬度至少 540，畫面變高（障礙物不會太晚才出現）
  V.k = Math.min(h / 720, w / 540); V.H = Math.round(h / V.k); V.W = Math.round(w / V.k);
  cv.width = Math.round(w * V.dpr); cv.height = Math.round(h * V.dpr);
  cv.style.width = w + 'px'; cv.style.height = h + 'px';
  Paper.clearCache();
}

// ---- 輸入 ----
const Input = { down: false, x: 0, y: 0, keys: {} };
const toView = e => ({ x: e.clientX / V.k, y: e.clientY / V.k });
cv.addEventListener('pointerdown', e => { e.preventDefault(); Sfx.unlock(); const p = toView(e); Object.assign(Input, p, { down: true }); App.tap(p.x, p.y); });
addEventListener('pointermove', e => { const p = toView(e); Input.x = p.x; Input.y = p.y; });
addEventListener('pointerup', () => { Input.down = false; });
addEventListener('pointercancel', () => { Input.down = false; });
addEventListener('keydown', e => {
  const k = e.key === ' ' ? 'space' : e.key.toLowerCase();
  if (['space', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright'].includes(k)) e.preventDefault();
  if (e.repeat) { Input.keys[k] = true; return; }
  Input.keys[k] = true; Sfx.unlock(); App.key(k);
});
addEventListener('keyup', e => { Input.keys[e.key === ' ' ? 'space' : e.key.toLowerCase()] = false; });
addEventListener('blur', () => { Input.keys = {}; Input.down = false; if (App.state === 'play') App.pause(); });
document.addEventListener('visibilitychange', () => { if (document.hidden && App.state === 'play') App.pause(); });
const keyDir = () => (Input.keys.arrowright || Input.keys.d ? 1 : 0) - (Input.keys.arrowleft || Input.keys.a ? 1 : 0);

// ---- 紙片風格繪圖：每個形狀都有白色紙邊和影子 ----
const Paper = (() => {
  const PAPER = '#fffdf5';
  let cache = {};
  function shape(c, path, color, opt = {}) {
    const bw = opt.border == null ? 5 : opt.border;
    c.save();
    if (opt.shadow !== false) { c.shadowColor = opt.shadowColor || 'rgba(60,40,10,0.28)'; c.shadowBlur = opt.blur == null ? 8 : opt.blur; c.shadowOffsetY = opt.oy == null ? 4 : opt.oy; c.shadowOffsetX = 1; }
    c.beginPath(); path(c);
    if (bw > 0) { c.lineJoin = 'round'; c.lineCap = 'round'; c.lineWidth = bw * 2; c.strokeStyle = opt.edge || PAPER; c.stroke(); }
    c.fillStyle = bw > 0 ? (opt.edge || PAPER) : color; c.fill();
    c.restore();
    if (bw > 0) { c.beginPath(); path(c); c.fillStyle = color; c.fill(); }
  }
  const circle = (c, x, y, r, color, opt) => shape(c, c => c.arc(x, y, r, 0, Math.PI * 2), color, opt);
  const rrect = (c, x, y, w, h, r) => { r = Math.min(r, w / 2, h / 2); c.moveTo(x + r, y); c.arcTo(x + w, y, x + w, y + h, r); c.arcTo(x + w, y + h, x, y + h, r); c.arcTo(x, y + h, x, y, r); c.arcTo(x, y, x + w, y, r); c.closePath(); };
  const rect = (c, x, y, w, h, color, r = 6, opt) => shape(c, c => rrect(c, x, y, w, h, r), color, opt);
  const star = (c, x, y, r, color, rot = 0, opt) => shape(c, c => { for (let i = 0; i < 10; i++) { const a = rot - Math.PI / 2 + i * Math.PI / 5, rr = i % 2 ? r * 0.45 : r; c.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr); } c.closePath(); }, color, opt);

  // 離屏畫布（解析度最多 1.5 倍，省記憶體）
  function offscreen(w, h) { const q = Math.min(1.5, V.k * V.dpr), c = document.createElement('canvas'); c.width = Math.ceil(w * q); c.height = Math.ceil(h * q); const x = c.getContext('2d'); x.scale(q, q); return { c, x, w, h }; }

  // 可以左右無限接起來的山丘
  const TW = 1200;
  function hills(L0) {
    const layer = Object.assign({}, L0, { base: L0.base + (V.H - 720) * 0.85 });
    const top = layer.base - layer.amp * 1.6 - (layer.decoKind === 'tree' ? 90 : 10), h = V.H - top + 10, o = offscreen(TW, h);
    const y = x => layer.base - top + Math.sin(x / TW * Math.PI * 2 * layer.n + layer.ph) * layer.amp * 0.6 + Math.sin(x / TW * Math.PI * 2 * (layer.n * 2 + 1) + layer.ph * 2) * layer.amp * 0.4;
    shape(o.x, c => { c.moveTo(-20, h + 20); for (let x = -20; x <= TW + 20; x += 8) c.lineTo(x, y(x)); c.lineTo(TW + 20, h + 20); c.closePath(); }, layer.color, { border: 4, blur: 6, oy: -2 });
    // 山上的樹、花
    if (layer.deco) for (let i = 0; i < layer.deco; i++) {
      const x = (i + 0.5) / layer.deco * TW, yy = y(x);
      if (layer.decoKind === 'tree') { o.x.save(); shape(o.x, c => { c.rect(x - 5, yy - 30, 10, 34); }, '#8a5a34', { border: 3, blur: 3 }); circle(o.x, x, yy - 46, 26, layer.decoColor, { border: 4, blur: 5 }); o.x.restore(); }
      else { circle(o.x, x, yy + 6, 7, layer.decoColor, { border: 2, blur: 2, oy: 1 }); }
    }
    return { img: o.c, top, h };
  }
  function cloud() {
    const o = offscreen(200, 110);
    shape(o.x, c => { c.arc(60, 70, 34, Math.PI * 0.5, Math.PI * 1.5); c.arc(95, 45, 38, Math.PI, Math.PI * 1.9); c.arc(145, 65, 30, Math.PI * 1.3, Math.PI * 0.5); c.closePath(); }, '#ffffff', { border: 4, blur: 7, oy: 3, shadowColor: 'rgba(40,70,120,0.18)' });
    return o.c;
  }
  const THEMES = {
    meadow: { sky: ['#9fd8ef', '#e8f6e9'], layers: [
      { base: 430, amp: 60, n: 2, ph: 0.4, color: '#9fcf7e', sp: 0.15, deco: 5, decoKind: 'tree', decoColor: '#5f9e4a' },
      { base: 520, amp: 45, n: 3, ph: 1.7, color: '#7dbb5c', sp: 0.35, deco: 9, decoColor: '#f6d65b' },
    ], ground: '#c99b62', grass: '#5fa344' },
    orchard: { sky: ['#ffd3a6', '#fff2d9'], layers: [
      { base: 420, amp: 50, n: 2, ph: 2.1, color: '#e7c27a', sp: 0, deco: 4, decoKind: 'tree', decoColor: '#77a94e' },
      { base: 520, amp: 30, n: 3, ph: 0.6, color: '#b9d77a', sp: 0, deco: 8, decoColor: '#e9654b' },
    ], ground: '#9fc36a', grass: '#7aae4f' },
    sky: { sky: ['#6ec3f0', '#d5f0ff'], layers: [
      { base: 560, amp: 50, n: 2, ph: 0.9, color: '#b6dfa5', sp: 0.12, deco: 6, decoKind: 'tree', decoColor: '#78b85d' },
      { base: 640, amp: 30, n: 3, ph: 2.5, color: '#8ac46e', sp: 0.3 },
    ], ground: null },
  };
  function bg(c, theme, scroll = 0, t = 0) {
    const T = THEMES[theme] || THEMES.meadow, key = theme + V.W + 'x' + V.H + '@' + V.k;
    if (!cache[key]) cache[key] = { layers: T.layers.map(hills), cloud: cache.cloud || (cache.cloud = cloud()) };
    const C = cache[key];
    const g = c.createLinearGradient(0, 0, 0, V.H); g.addColorStop(0, T.sky[0]); g.addColorStop(1, T.sky[1]);
    c.fillStyle = g; c.fillRect(-20, -20, V.W + 40, V.H + 40);
    // 太陽
    circle(c, V.W - (V.W < 700 ? 90 : 120), V.W < 700 ? 190 : 110, V.W < 700 ? 40 : 46, '#ffe07a', { border: 5, blur: 10, shadowColor: 'rgba(255,170,40,0.4)' });
    // 雲
    for (let i = 0; i < 5; i++) {
      const sp = 0.05 + i * 0.02, span = V.W + 260, x = ((i * 397 - scroll * sp - t * 12) % span + span) % span - 220, y = 50 + (i * 71) % 170, s = 0.6 + (i % 3) * 0.25;
      c.drawImage(C.cloud, x, y, 200 * s, 110 * s);
    }
    T.layers.forEach((L, i) => {
      const im = C.layers[i], off = ((scroll * L.sp) % TW + TW) % TW;
      for (let x = -off; x < V.W; x += TW) c.drawImage(im.img, x - 0.5, im.top, TW + 1, im.h);
    });
    return T;
  }
  // 紙的質感：細小雜點，最後蓋在整個畫面上
  let grain = null;
  function texture(c) {
    if (!grain) {
      const g = document.createElement('canvas'); g.width = g.height = 160; const x = g.getContext('2d'), d = x.createImageData(160, 160);
      for (let i = 0; i < d.data.length; i += 4) { const v = Math.random() < 0.5 ? 0 : 255; d.data[i] = d.data[i + 1] = d.data[i + 2] = v; d.data[i + 3] = Math.random() * 14; }
      x.putImageData(d, 0, 0); grain = c.createPattern(g, 'repeat');
    }
    c.save(); c.setTransform(1, 0, 0, 1, 0, 0); c.fillStyle = grain; c.fillRect(0, 0, cv.width, cv.height); c.restore();
  }
  return { shape, circle, rect, rrect, star, bg, texture, offscreen, clearCache: () => { cache = {}; }, PAPER };
})();

// ---- 特效：紙花、跳出來的字 ----
const FX = (() => {
  let list = [];
  const COLORS = ['#ff6b6b', '#ffd93d', '#6bcB77', '#4d96ff', '#c77dff', '#ff9f43'];
  return {
    burst(x, y, n = 14, colors = COLORS, power = 1) {
      for (let i = 0; i < n; i++) { const a = rand(0, Math.PI * 2), s = rand(150, 420) * power; list.push({ k: 'bit', x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s - 200 * power, r: rand(0, 6), vr: rand(-12, 12), w: rand(8, 15), h: rand(5, 9), c: pick(colors), t: 0, life: rand(0.7, 1.3) }); }
    },
    text(x, y, s, color = '#ff8a00', size = 34) { list.push({ k: 'txt', x, y, s, c: color, size, t: 0, life: 0.9 }); },
    clear() { list = []; },
    update(dt) {
      for (const p of list) { p.t += dt; if (p.k === 'bit') { p.vy += 900 * dt; p.vx *= 0.98; p.x += p.vx * dt; p.y += p.vy * dt; p.r += p.vr * dt; } else p.y -= 60 * dt; }
      list = list.filter(p => p.t < p.life);
    },
    draw(c) {
      for (const p of list) {
        const a = Math.min(1, (p.life - p.t) / 0.3);
        c.save(); c.globalAlpha = a; c.translate(p.x, p.y);
        if (p.k === 'bit') { c.rotate(p.r); c.scale(1, Math.cos(p.t * 9 + p.r)); c.fillStyle = p.c; c.fillRect(-p.w / 2, -p.h / 2, p.w, p.h); }
        else {
          const s = 1 + Math.max(0, 0.3 - p.t) * 1.5; c.scale(s, s);
          c.font = `900 ${p.size}px "Noto Sans TC", system-ui, sans-serif`; c.textAlign = 'center'; c.textBaseline = 'middle';
          c.lineJoin = 'round'; c.lineWidth = 8; c.strokeStyle = Paper.PAPER; c.strokeText(p.s, 0, 0); c.fillStyle = p.c; c.fillText(p.s, 0, 0);
        }
        c.restore();
      }
    },
  };
})();

// ---- 遊戲清單（每個遊戲檔案用 registerGame 加進來） ----
const GAMES = [];
function registerGame(g) { GAMES.push(g); }

// ---- 畫面切換、遊戲狀態 ----
const App = {
  state: 'home', game: null, pup: null, t: 0, stateT: 0, resultNew: false,
  screens: ['scrHome', 'scrSelect', 'scrMaker', 'scrCam', 'scrReady', 'scrPause', 'scrResult'],
  show(id) {
    for (const s of this.screens) $(s).classList.toggle('hidden', s !== id);
    $('hud').classList.toggle('hidden', !(this.state === 'play' || this.state === 'pause'));
  },
  go(state) {
    const prev = this.state, g = this.game;
    this.state = state; this.stateT = 0;
    // 讓遊戲知道開始 / 離開遊玩（例如節奏遊戲要停音樂）
    if (g && prev === 'play' && state !== 'play' && g.onLeave) g.onLeave(state);
    if (g && state === 'play' && prev !== 'play' && g.onEnter) g.onEnter(prev);
    const map = { home: 'scrHome', select: 'scrSelect', maker: 'scrMaker', cam: 'scrCam', ready: 'scrReady', pause: 'scrPause', result: 'scrResult', play: null };
    this.show(map[state]);
    if (state === 'select') renderGameList();
    if (state === 'home') FX.clear();
  },
  startGame(g) {
    if (this.game && this.game.onLeave && this.state === 'play') this.game.onLeave('restart');
    this.game = g; FX.clear(); g.start();
    $('rdName').textContent = g.name; $('rdHow').textContent = g.howto; $('rdIcon').textContent = g.icon;
    const b = Store.best(g.id); $('rdBest').textContent = b ? `最高分：${b}` : '';
    this.go('ready'); this.updateHud();
  },
  tap(x, y) {
    if (this.state === 'ready') { this.go('play'); if (this.game.tapOnStart) this.game.tap(x, y); return; }
    if (this.state === 'play' && this.game.tap) this.game.tap(x, y);
  },
  key(k) {
    if (k === 'escape' || k === 'p') { if (this.state === 'play') this.pause(); else if (this.state === 'pause') this.resume(); return; }
    if (this.state === 'ready' && (k === 'space' || k === 'enter' || k === 'arrowup' || k === 'w')) { this.tap(V.W / 2, V.H / 2); return; }
    if (this.state === 'result' && (k === 'enter' || k === 'space') && this.stateT > 0.8) { this.startGame(this.game); return; }
    if (this.state === 'play' && this.game.key) this.game.key(k);
  },
  pause() { if (this.state !== 'play') return; this.go('pause'); },
  resume() { if (this.state === 'pause') this.go('play'); },
  finish() {
    const g = this.game, s = Math.floor(g.score || 0);
    this.resultNew = Store.setBest(g.id, s);
    $('rsScore').textContent = s; $('rsBest').textContent = Store.best(g.id);
    $('rsNew').classList.toggle('hidden', !this.resultNew); $('rsTitle').textContent = g.overText || '結束！';
    Sfx.play(this.resultNew ? 'win' : 'over');
    if (this.resultNew) FX.burst(V.W / 2, V.H * 0.35, 40, undefined, 1.4);
    this.go('result');
  },
  updateHud() {
    const g = this.game; if (!g || !g.hud) return;
    const h = g.hud(); $('hudL').innerHTML = h.L || ''; $('hudR').innerHTML = h.R || '';
  },
  async setPuppet(src) { this.pup = Puppet.build(src.canvas, src.J); },
  // 角色：'me' 人、'pet' 寵物、'default' 預設紙娃娃
  chars: { me: null, pet: null }, charSlot: 'default',
  useChar(slot, pup) {
    if (slot !== 'default' && !this.chars[slot]) slot = 'default';
    this.charSlot = slot; Store.set('active', slot);
    if (pup) this.pup = pup;
    else { const src = slot === 'default' ? Puppet.makeDefault() : this.chars[slot]; this.pup = Puppet.build(src.canvas, src.J); }
    syncCharBtn();
  },
};

function renderGameList() {
  const box = $('gameList'); box.innerHTML = '';
  GAMES.forEach((g, i) => {
    const b = document.createElement('button'); b.className = 'gcard'; b.style.setProperty('--c', g.color); b.style.setProperty('--r', (i % 2 ? 1.2 : -1.2) + 'deg');
    const best = Store.best(g.id);
    b.innerHTML = `<span class="gIcon">${g.icon}</span><span class="gName">${g.name}</span><span class="gDesc">${g.desc}</span><span class="gBest">${best ? '最高分 ' + best : '還沒玩過'}</span>`;
    b.onclick = () => { Sfx.play('click'); App.startGame(g); };
    box.appendChild(b);
  });
}

// ---- 主迴圈 ----
let lastT = performance.now();
function frame(now) {
  requestAnimationFrame(frame);
  const dt = Math.min(1 / 30, (now - lastT) / 1000); lastT = now;
  App.t += dt; App.stateT += dt;
  try { step(dt); } catch (e) { console.error(e); }
}
function step(dt) {
  const st = App.state, g = App.game;
  if (st === 'play' && g) { g.update(dt); App.updateHud(); if (g.over) App.finish(); }
  if (st === 'play' || st === 'result' || st === 'home' || st === 'select' || st === 'maker') FX.update(dt);
  V.shake = Math.max(0, V.shake - dt * 30);

  ctx.setTransform(V.k * V.dpr, 0, 0, V.k * V.dpr, 0, 0);
  if (V.shake > 0) ctx.translate(rand(-V.shake, V.shake), rand(-V.shake, V.shake));
  if ((st === 'play' || st === 'ready' || st === 'pause' || st === 'result') && g) {
    g.draw(ctx, st === 'play' ? dt : 0);
    if (st === 'result') {
      ctx.fillStyle = 'rgba(255,250,235,0.55)'; ctx.fillRect(-20, -20, V.W + 40, V.H + 40);
      const wide = V.W > 900, h = wide ? Math.min(380, V.H * 0.55) : Math.min(300, V.H * 0.4);
      Puppet.draw(ctx, App.pup, wide ? V.W * 0.17 : V.W / 2, V.H * 0.97, h, App.resultNew ? Puppet.Poses.cheer(App.t) : Puppet.Poses.dance(App.t * 0.8));
    }
  } else {
    // 首頁、選遊戲、做角色：背景 + 紙片人跳舞
    Paper.bg(ctx, 'meadow', App.t * 40, App.t);
    ctx.fillStyle = '#c99b62'; ctx.fillRect(-20, V.H * 0.9, V.W + 40, V.H);
    ctx.fillStyle = '#5fa344'; ctx.fillRect(-20, V.H * 0.9 - 8, V.W + 40, 14);
    if (st === 'home') {
      const portrait = V.W < 700, h = portrait ? 300 : 360;
      Puppet.draw(ctx, App.pup, portrait ? V.W / 2 : V.W * 0.72, V.H * 0.91, h, Puppet.Poses.dance(App.t * 0.9));
    }
  }
  FX.draw(ctx);
  Paper.texture(ctx);
  if (st === 'maker') Maker.drawPreview(App.t);
}

// ---- 按鈕 ----
document.querySelectorAll('[data-go]').forEach(b => b.addEventListener('click', () => { Sfx.play('click'); App.go(b.dataset.go); }));
$('bPlay').onclick = () => { Sfx.play('click'); App.go('select'); };
$('bMake').onclick = () => { Sfx.play('click'); Maker.open(); };
$('bPause').onclick = () => { Sfx.play('click'); App.pause(); };
$('psResume').onclick = () => { Sfx.play('click'); App.resume(); };
$('psRestart').onclick = () => { Sfx.play('click'); App.startGame(App.game); };
$('psQuit').onclick = () => { Sfx.play('click'); App.go('select'); };
$('rsAgain').onclick = () => { Sfx.play('click'); App.startGame(App.game); };
$('rsBack').onclick = () => { Sfx.play('click'); App.go('select'); };
$('scrReady').addEventListener('pointerdown', e => { if (e.target.closest('button')) return; e.preventDefault(); Sfx.unlock(); App.tap(e.clientX / V.k, e.clientY / V.k); });
const syncSound = () => { $('bSound').textContent = Sfx.on ? '🔊' : '🔈'; };
$('bSound').onclick = () => { Sfx.toggle(); syncSound(); Sfx.play('click'); };

// ---- 分享：把紙片人 + 分數做成一張圖 ----
async function shareResult() {
  const g = App.game; if (!g) return;
  const W = 1080, H = 1350, c = document.createElement('canvas'); c.width = W; c.height = H; const x = c.getContext('2d');
  const bg = x.createLinearGradient(0, 0, 0, H); bg.addColorStop(0, '#9fd8ef'); bg.addColorStop(1, '#e8f6e9'); x.fillStyle = bg; x.fillRect(0, 0, W, H);
  Paper.circle(x, W - 140, 600, 70, '#ffe07a', { border: 8, blur: 14 });
  Paper.shape(x, cc => { cc.moveTo(-20, H + 20); cc.lineTo(-20, H - 260); cc.quadraticCurveTo(W * 0.3, H - 340, W * 0.55, H - 270); cc.quadraticCurveTo(W * 0.8, H - 210, W + 20, H - 280); cc.lineTo(W + 20, H + 20); cc.closePath(); }, '#7dbb5c', { border: 8 });
  const font = (s, w = 900) => `${w} ${s}px "Noto Sans TC", system-ui, sans-serif`;
  const txt = (s, X, Y, size, col, edge = 14) => { x.font = font(size); x.textAlign = 'center'; x.textBaseline = 'middle'; x.lineJoin = 'round'; x.lineWidth = edge; x.strokeStyle = Paper.PAPER; x.strokeText(s, X, Y); x.fillStyle = col; x.fillText(s, X, Y); };
  Paper.rect(x, 90, 70, W - 180, 150, g.color, 30, { border: 10 });
  txt(`${g.icon} ${g.name}`, W / 2, 145, 72, '#fff', 0);
  txt(`${Math.floor(g.score || 0)}`, W / 2, 330, 170, '#e0573c', 22);
  txt(g.overText || '', W / 2, 455, 48, '#4a3520', 12);
  Puppet.draw(x, App.pup, W / 2, H - 120, 700, App.resultNew ? Puppet.Poses.cheer(0.13) : Puppet.Poses.dance(0.3));
  txt('紙片人遊樂園', W / 2, H - 70, 46, '#e0573c', 12);
  const blob = await new Promise(r => c.toBlob(r, 'image/png')), name = `紙片人-${g.id}-${Math.floor(g.score || 0)}.png`;
  try {
    const file = new File([blob], name, { type: 'image/png' });
    if (navigator.canShare && navigator.canShare({ files: [file] })) { await navigator.share({ files: [file], title: '紙片人遊樂園', text: `我在「${g.name}」拿到 ${Math.floor(g.score || 0)} 分！` }); return; }
  } catch (e) { if (e && e.name === 'AbortError') return; }
  const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = name; document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 5000);
}
$('rsShare').onclick = () => { Sfx.play('click'); shareResult(); };

// ---- PWA：離線也能玩、可以加到主畫面 ----
if ('serviceWorker' in navigator && (location.protocol === 'https:' || location.hostname === 'localhost')) addEventListener('load', () => navigator.serviceWorker.register('sw.js').catch(() => {}));
let installEvt = null;
const standalone = () => matchMedia('(display-mode: standalone), (display-mode: fullscreen)').matches || navigator.standalone;
const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
addEventListener('beforeinstallprompt', e => { e.preventDefault(); installEvt = e; $('bInstall').classList.remove('hidden'); });
addEventListener('appinstalled', () => { installEvt = null; $('bInstall').classList.add('hidden'); $('installTip').classList.add('hidden'); });
if (isIOS && !standalone()) $('bInstall').classList.remove('hidden');
$('bInstall').onclick = async () => {
  Sfx.play('click');
  if (installEvt) { try { installEvt.prompt(); await installEvt.userChoice; installEvt = null; $('bInstall').classList.add('hidden'); return; } catch (e) {} }
  $('installTip').innerHTML = !isIOS ? '請用瀏覽器選單裡的「安裝應用程式」或「加到主畫面」。' : 'iPhone / iPad：用 <b>Safari</b> 開這個網頁 → 點下面的 <b>分享</b> 按鈕（方塊加箭頭）→ 選 <b>加入主畫面</b>。';
  $('installTip').classList.toggle('hidden');
};

// ---- 換角色（人 / 寵物 / 預設）----
const CHAR_NAMES = { me: '🧍 我', pet: '🐶 寵物', default: '🧒 預設' };
function charCycle() { return ['me', 'pet', 'default'].filter(s => s === 'default' || App.chars[s]); }
function syncCharBtn() {
  const list = charCycle(), b = $('bChar');
  b.classList.toggle('hidden', list.length < 2);
  b.textContent = `🔄 換角色（現在：${CHAR_NAMES[App.charSlot].slice(2).trim()}）`;
  $('bMake').textContent = App.chars.me || App.chars.pet ? '📷 換 / 做紙片人' : '📷 做我的紙片人';
}
$('bChar').onclick = () => {
  Sfx.play('click'); const list = charCycle(), i = list.indexOf(App.charSlot);
  App.useChar(list[(i + 1) % list.length]); FX.burst(V.W / 2, V.H * 0.6, 16, undefined, 0.7);
};

// ---- 開始 ----
addEventListener('resize', resize);
resize(); syncSound();
(async () => {
  const [me, pet] = await Promise.all([Store.loadChar('me'), Store.loadChar('pet')]);
  App.chars = { me, pet };
  try { App.useChar(Store.get('active', me ? 'me' : pet ? 'pet' : 'default')); } catch (e) { console.error(e); App.useChar('default'); }
  App.go('home');
  requestAnimationFrame(frame);
  if (/#play-(\w+)/.test(location.hash)) { const g = GAMES.find(g => g.id === RegExp.$1); if (g) App.startGame(g); }
})();
