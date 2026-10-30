'use strict';
// =====================================================
//  「搖一搖」遊戲：用力搖手機（沒有感應器時：狂點畫面或按空白鍵）
//  每個遊戲用 Shk.d(this) 取得「這一幀多搖了幾下」
// =====================================================
const Shk = {
  d(g) { if (g.ls == null || Tilt.shakes < g.ls) g.ls = Tilt.shakes; const d = Tilt.shakes - g.ls; g.ls = Tilt.shakes; return d; },
  base: { tilt: true, shake: true, tap() { Tilt.pulse(); }, key(k) { if (k === 'space' || k === 'enter') Tilt.pulse(); } },
};
const ShakeGame = cfg => registerGame(Object.assign({}, Shk.base, cfg));

// ---- 搖搖果樹 ----
ShakeGame({
  id: 'shaketree', name: '搖搖果樹', icon: '🌳', color: '#4f9a45', kid: true,
  desc: '搖一搖手機，樹上的水果就會掉下來！（手機限定）',
  howto: '📱 手機限定：用力搖一搖手機，果樹就會晃，水果會掉進籃子裡！金蘋果分數最多。不會輸，限時 30 秒。（電腦：狂點畫面或按空白鍵）',
  TIME: 30, FRUIT: ['🍎', '🍐', '🍊', '🍑', '🍒', '🍋'],
  start() { this.t = 0; this.left = this.TIME; this.score = 0; this.over = false; this.overText = '籃子滿滿！'; this.sway = 0; this.falling = []; this.n = 0; this.ls = null; this.grow(); },
  grow() { this.onTree = []; for (let i = 0; i < 12; i++) { const a = rand(0, Math.PI * 2), r = Math.sqrt(Math.random()) * 0.85; this.onTree.push({ u: Math.cos(a) * r, v: Math.sin(a) * r * 0.7, e: Math.random() < 0.08 ? '🍏' : pick(this.FRUIT) }); } },
  tree() { return { x: V.W / 2, y: V.H * 0.38, R: Math.min(V.W * 0.42, 260) }; },
  update(dt) {
    this.t += dt; this.left -= dt; if (this.left <= 0) { this.left = 0; this.over = true; return; }
    const d = Shk.d(this), T = this.tree();
    if (d) { this.sway = Math.min(1, this.sway + 0.35 * d); Sfx.play('rustle'); for (let i = 0; i < d; i++) if (this.onTree.length && Math.random() < 0.75) { const f = this.onTree.splice(Math.floor(Math.random() * this.onTree.length), 1)[0]; this.falling.push({ x: T.x + f.u * T.R, y: T.y + f.v * T.R, vy: 0, e: f.e, rot: 0 }); } }
    this.sway = Math.max(0, this.sway - dt * 1.5);
    const by = V.H * 0.86;
    for (const f of this.falling) { f.vy += 1400 * dt; f.y += f.vy * dt; f.rot += dt * 4; if (f.y > by - 20 && !f.got) { f.got = 1; const gold = f.e === '🍏'; this.score += gold ? 30 : 10; this.n++; Sfx.play(gold ? 'star' : 'catch'); FX.text(f.x, by - 70, gold ? '金蘋果！+30' : '+10', gold ? '#e0a000' : '#ff7a00', 26); } }
    this.falling = this.falling.filter(f => !f.got);
    if (!this.onTree.length && !this.falling.length) { this.grow(); FX.text(V.W / 2, V.H * 0.2, '又長出新的水果了！', '#3d8b2a', 32); }
  },
  draw(c) {
    const gy = Kid.ground(c, 'meadow', this.t, 0.92), T = this.tree(), sw = Math.sin(this.t * 30) * this.sway * 0.06;
    c.save(); c.translate(T.x, gy); c.rotate(sw); c.translate(-T.x, -gy);
    Paper.rect(c, T.x - 22, T.y, 44, gy - T.y, '#8a5a34', 10, { border: 4 });
    for (const [dx, dy, r] of [[-0.45, 0.1, 0.55], [0.45, 0.1, 0.55], [0, -0.25, 0.65], [0, 0.2, 0.6]]) Paper.circle(c, T.x + dx * T.R, T.y + dy * T.R, r * T.R, '#5fae55', { border: 4 });
    for (const f of this.onTree) Kid.emoji(c, f.e, T.x + f.u * T.R, T.y + f.v * T.R, 40);
    c.restore();
    for (const f of this.falling) Kid.emoji(c, f.e, f.x, f.y, 42, f.rot);
    const bx = V.W / 2, by = V.H * 0.86; Paper.shape(c, cc => { cc.moveTo(bx - 120, by - 30); cc.lineTo(bx + 120, by - 30); cc.lineTo(bx + 95, by + 20); cc.lineTo(bx - 95, by + 20); cc.closePath(); }, '#c98a4b', { border: 4 });
    Puppet.draw(c, App.pup, V.W * 0.12 + 30, gy, 150, this.sway > 0.3 ? Puppet.Poses.cheer(this.t) : Puppet.Poses.idle(this.t));
    TiltUI.hint(c, this, Kid.portrait() ? 120 : 80, '#3d6b2a', true);
  },
  hud() { return { L: `<b>${this.score}</b> 分　🧺 ${this.n}`, R: `⏱ ${Math.ceil(this.left)}` }; },
});

// ---- 汽水火箭 ----
ShakeGame({
  id: 'sodarocket', name: '汽水火箭', icon: '🚀', color: '#e8453c',
  desc: '搖汽水累積氣壓，按發射衝上天！（手機限定）',
  howto: '📱 手機限定：先用力搖手機讓汽水瓶的氣壓變高（氣壓會慢慢漏掉，要一直搖），覺得夠了就按「發射！」，紙片人會坐著汽水瓶衝上天！搖太久瓶子會爆掉喔。一共 3 次。（電腦：狂點畫面搖、按 Enter 或點按鈕發射）',
  start() { this.t = 0; this.score = 0; this.over = false; this.overText = '太空人！'; this.tries = 0; this.ls = null; this.reset(); this.best = 0; },
  reset() { this.p = 0; this.st = 'shake'; this.h = 0; this.vy = 0; this.stT = 0; this.danger = rand(0.9, 1.1); },
  get btn() { return { x: V.W / 2, y: V.H - 80, w: 220, h: 80 }; },
  tap(x, y) { if (this.st === 'shake' && Kid.hit(this.btn, x, y)) return this.launch(); Tilt.pulse(); },
  key(k) { if (k === 'enter') this.launch(); else if (k === 'space') Tilt.pulse(); },
  launch() { if (this.st !== 'shake' || this.p < 0.08) return; this.st = 'fly'; this.vy = 600 + this.p * 2600; Sfx.play('boom'); FX.burst(V.W / 2, V.H * 0.7, 30, ['#ffffff', '#bfe8ff'], 1.2); },
  update(dt) {
    this.t += dt; this.stT += dt; const d = Shk.d(this);
    if (this.st === 'shake') {
      this.p = Math.max(0, this.p + d * 0.045 - dt * 0.035);
      if (d) Sfx.play('blow');
      if (this.p > this.danger) { this.st = 'pop'; this.stT = 0; Sfx.play('boom'); V.shake = 14; FX.burst(V.W / 2, V.H * 0.6, 40, ['#ffffff', '#bfe8ff', '#e8453c'], 1.4); FX.text(V.W / 2, V.H * 0.4, '碰！爆掉了～', '#e8453c', 40); }
    } else if (this.st === 'fly') {
      this.vy -= 900 * dt; this.h += this.vy * dt;
      if (this.vy <= 0) { const m = Math.round(this.h / 10); this.score += m; this.best = Math.max(this.best, m); FX.text(V.W / 2, V.H * 0.3, `飛了 ${m} 公尺！`, '#3f6fe0', 40); Sfx.play('win'); this.st = 'done'; this.stT = 0; }
    } else if (this.stT > 1.8) { this.tries++; if (this.tries >= 3) { this.over = true; this.overText = `最高飛了 ${this.best} 公尺！`; return; } this.reset(); }
  },
  draw(c) {
    const k = clamp(this.h / 6000, 0, 1), g = c.createLinearGradient(0, 0, 0, V.H); g.addColorStop(0, `rgb(${Math.round(110 - 90 * k)},${Math.round(195 - 170 * k)},${Math.round(240 - 180 * k)})`); g.addColorStop(1, '#d5f0ff'); c.fillStyle = g; c.fillRect(-20, -20, V.W + 40, V.H + 40);
    const gy = V.H * 0.82 + Math.min(this.h, 3000) * 0.3; c.fillStyle = '#7dbb5c'; c.fillRect(-20, gy, V.W + 40, V.H);
    for (let i = 0; i < 6; i++) { const y = ((i * 170 + this.h * 0.5) % (V.H + 200)) - 100; Paper.circle(c, (i * 233) % V.W, y, 40, '#ffffff', { border: 0, blur: 6 }); }
    const bx = V.W / 2, by = this.st === 'fly' || this.st === 'done' ? V.H * 0.55 : V.H * 0.72, sh = this.st === 'shake' ? Math.sin(this.t * 50) * Tilt.shake * 10 : 0;
    if (this.st !== 'pop') {
      c.save(); c.translate(bx + sh, by);
      if (this.st === 'fly') { c.fillStyle = 'rgba(255,255,255,0.85)'; for (let i = 0; i < 6; i++) { c.beginPath(); c.arc(rand(-14, 14), 70 + i * 22, 10 + i * 3, 0, Math.PI * 2); c.fill(); } }
      Paper.rect(c, -26, -40, 52, 110, 'rgba(120,200,120,0.85)', 14, { border: 4 }); Paper.rect(c, -12, -64, 24, 28, 'rgba(120,200,120,0.85)', 6, { border: 3 }); Paper.rect(c, -14, -72, 28, 10, '#e8453c', 4, { border: 2 });
      c.fillStyle = 'rgba(255,255,255,0.6)'; for (let i = 0; i < 8 * this.p; i++) { c.beginPath(); c.arc(rand(-18, 18), rand(-30, 60), 3, 0, Math.PI * 2); c.fill(); }
      Puppet.draw(c, App.pup, 0, -70, 90, this.st === 'fly' ? Puppet.Poses.cheer(this.t) : Puppet.Poses.idle(this.t)); c.restore();
    }
    if (this.st === 'shake') {
      const w = Math.min(V.W * 0.7, 360), x0 = V.W / 2 - w / 2, y0 = Kid.portrait() ? 130 : 90;
      Paper.rect(c, x0, y0, w, 26, '#fffdf5', 13, { border: 3 }); c.fillStyle = 'rgba(232,69,60,0.25)'; c.fillRect(x0 + w * 0.85, y0 + 3, w * 0.15 - 3, 20);
      c.fillStyle = this.p > 0.8 ? '#e8453c' : '#45ad4a'; c.fillRect(x0 + 3, y0 + 3, (w - 6) * Math.min(1, this.p), 20);
      Kid.text(c, `氣壓 ${Math.round(this.p * 100)}%`, V.W / 2, y0 + 50, 22, '#4a3520');
      Kid.button(c, this.btn, '🚀 發射！', this.p > 0.08 ? '#e8453c' : '#b8a890', { size: 30 });
      TiltUI.hint(c, this, y0 + 84, '#4a3520', true);
    }
    if (this.st === 'fly' || this.st === 'done') Kid.text(c, `${Math.round(this.h / 10)} m`, V.W / 2, Kid.portrait() ? 130 : 90, 40, '#3f6fe0');
  },
  hud() { return { L: `<b>${this.score}</b> 分`, R: `🚀 ${Math.min(this.tries + 1, 3)} / 3` }; },
});

// ---- 搖骰子比大小 ----
ShakeGame({
  id: 'dicebattle', name: '搖骰子比大小', icon: '🎲', color: '#5b6fd6', kid: true,
  desc: '搖一搖擲骰子，跟紙片人比誰的點數大！（手機限定）',
  howto: '📱 手機限定：搖一搖手機擲出兩顆骰子，停下來就會跟紙片人比點數，大的贏！一共 5 回合。（電腦：狂點畫面或按空白鍵）',
  ZH: ['零', '一', '二', '三', '四', '五', '六', '七', '八', '九', '十', '十一', '十二'],
  start() { this.t = 0; this.score = 0; this.over = false; this.overText = ''; this.round = 0; this.win = 0; this.ls = null; this.reset(); },
  reset() { this.st = 'wait'; this.my = [1, 1]; this.ai = [1, 1]; this.rollT = 0; this.idle = 0; this.n = 0; this.stT = 0; },
  update(dt) {
    this.t += dt; this.stT += dt; const d = Shk.d(this);
    if (this.st === 'wait' || this.st === 'roll') {
      if (d) { this.st = 'roll'; this.n += d; this.idle = 0; Sfx.play('rustle'); } else this.idle += dt;
      if (this.st === 'roll') { this.rollT += dt; if (this.rollT > 0.06) { this.rollT = 0; this.my = [1 + Math.floor(Math.random() * 6), 1 + Math.floor(Math.random() * 6)]; } }
      if (this.st === 'roll' && this.idle > 0.5 && this.n >= 2) { this.st = 'ai'; this.stT = 0; const s = this.my[0] + this.my[1]; Sfx.play('thud'); Kid.say(`你擲出${this.ZH[s]}點`); }
    } else if (this.st === 'ai') {
      if (this.stT < 1.2) { if (Math.random() < 0.4) this.ai = [1 + Math.floor(Math.random() * 6), 1 + Math.floor(Math.random() * 6)]; }
      else { this.st = 'res'; this.stT = 0; const a = this.my[0] + this.my[1], b = this.ai[0] + this.ai[1];
        if (a > b) { this.win++; this.score += 20 + a; Sfx.play('win'); this.res = '你贏了！'; Kid.say('你贏了！'); } else if (a < b) { this.score += a; Sfx.play('nope'); this.res = '紙片人贏了～'; Kid.say('紙片人贏了'); } else { this.score += 10 + a; Sfx.play('ding'); this.res = '平手！'; Kid.say('平手'); } }
    } else if (this.st === 'res' && this.stT > 2) { this.round++; if (this.round >= 5) { this.over = true; this.overText = `贏了 ${this.win} 回合！`; return; } this.reset(); }
  },
  die(c, x, y, n, s, rot) {
    c.save(); c.translate(x, y); c.rotate(rot); Paper.rect(c, -s / 2, -s / 2, s, s, '#ffffff', s * 0.18, { border: 4 });
    const P = { 1: [[0, 0]], 2: [[-1, -1], [1, 1]], 3: [[-1, -1], [0, 0], [1, 1]], 4: [[-1, -1], [1, -1], [-1, 1], [1, 1]], 5: [[-1, -1], [1, -1], [0, 0], [-1, 1], [1, 1]], 6: [[-1, -1], [1, -1], [-1, 0], [1, 0], [-1, 1], [1, 1]] }[n];
    c.fillStyle = n === 1 ? '#e8453c' : '#2a2a33'; for (const [u, v] of P) { c.beginPath(); c.arc(u * s * 0.27, v * s * 0.27, s * 0.09, 0, Math.PI * 2); c.fill(); } c.restore();
  },
  draw(c) {
    c.fillStyle = '#2f7a5a'; c.fillRect(-20, -20, V.W + 40, V.H + 40); c.fillStyle = 'rgba(0,0,0,0.12)'; c.fillRect(20, 100, V.W - 40, V.H - 130);
    const s = Math.min(110, V.W * 0.2), rolling = this.st === 'roll', jit = rolling ? 0.5 : 0;
    const ay = V.H * 0.3, my = V.H * 0.68;
    Kid.text(c, '紙片人', V.W / 2, ay - s * 0.9, 24, '#ffffff', 0);
    Kid.head(c, V.W / 2 - s * 1.6, ay, 30, {}, 34);
    this.die(c, V.W / 2 - s * 0.6, ay, this.ai[0], s, this.st === 'ai' ? rand(-0.4, 0.4) : 0.1); this.die(c, V.W / 2 + s * 0.6, ay, this.ai[1], s, this.st === 'ai' ? rand(-0.4, 0.4) : -0.1);
    if (this.st !== 'wait') { this.die(c, V.W / 2 - s * 0.6, my, this.my[0], s, rand(-jit, jit) + 0.05); this.die(c, V.W / 2 + s * 0.6, my, this.my[1], s, rand(-jit, jit) - 0.08); }
    else Kid.text(c, '🎲 搖一搖擲骰子！', V.W / 2, my, 34, '#ffd23f');
    Kid.text(c, '你', V.W / 2, my + s * 0.95, 24, '#ffffff', 0);
    if (this.st === 'res') { Kid.text(c, this.res, V.W / 2, V.H * 0.49, 44, '#ffd23f'); Kid.text(c, `${this.my[0] + this.my[1]}　vs　${this.ai[0] + this.ai[1]}`, V.W / 2, V.H * 0.49 + 48, 28, '#ffffff', 0); }
    TiltUI.hint(c, this, V.H - 30, '#ffffff', true);
  },
  hud() { return { L: `<b>${this.score}</b> 分　🏆 ${this.win}`, R: `第 ${Math.min(this.round + 1, 5)} / 5 回合` }; },
});

// ---- 沙鈴樂團 ----
ShakeGame({
  id: 'maracas', name: '沙鈴樂團', icon: '🎶', color: '#e05ab0',
  desc: '跟著節拍搖沙鈴，搖得準分數高！（手機限定）',
  howto: '📱 手機限定：手機就是沙鈴！看著中間的圈圈，圈圈縮到最小、跟節拍一起「咚」的時候搖一下。搖得越準分數越高，一共 32 拍。（電腦：跟著節拍點畫面或按空白鍵）',
  BPM: 96, N: 32,
  start() { this.t = 0; this.score = 0; this.over = false; this.overText = ''; this.ls = null; this.beat = -1; this.hits = 0; this.combo = 0; this.judged = new Set(); this.res = null; this.resT = 0; this.flash = 0; },
  get B() { return 60 / this.BPM; },
  update(dt) {
    this.t += dt; this.resT = Math.max(0, this.resT - dt); this.flash = Math.max(0, this.flash - dt * 3);
    const B = this.B, t0 = 2 * B, bt = (this.t - t0) / B, bi = Math.floor(bt);
    if (bi !== this.beat && this.t >= t0) { this.beat = bi; Sfx.drum(bi % 4 === 0 ? 120 : 200, bi % 4 === 0 ? 0.5 : 0.3); this.flash = 1; if (bi >= this.N) { this.over = true; this.overText = `準確 ${this.hits} / ${this.N} 拍！`; return; } }
    // 錯過的拍子
    if (this.t > t0) { const prev = Math.floor((this.t - t0) / B - 0.35); if (prev >= 0 && prev < this.N && !this.judged.has(prev)) { this.judged.add(prev); this.combo = 0; this.res = { s: 'MISS', c: '#9a8f86' }; this.resT = 0.4; } }
    const d = Shk.d(this);
    if (d && this.t > t0 - 0.3) {
      Sfx.play('rustle'); const n = Math.round((this.t - t0) / B), off = Math.abs(this.t - (t0 + n * B));
      if (n >= 0 && n < this.N && !this.judged.has(n) && off < 0.3) {
        this.judged.add(n); const G = off < 0.1 ? ['PERFECT', '#ff4fa3', 30] : off < 0.2 ? ['GOOD', '#ff9f1c', 15] : ['OK', '#2fa7e0', 5];
        this.combo++; this.hits++; this.score += G[2] + Math.min(20, this.combo); this.res = { s: G[0], c: G[1] }; this.resT = 0.5;
      }
    }
  },
  draw(c) {
    const g = c.createLinearGradient(0, 0, 0, V.H); g.addColorStop(0, '#5b2f7a'); g.addColorStop(1, '#c77dff'); c.fillStyle = g; c.fillRect(-20, -20, V.W + 40, V.H + 40);
    const B = this.B, t0 = 2 * B, ph = ((this.t - t0) / B % 1 + 1) % 1, cx = V.W / 2, cy = V.H * 0.42, R = Math.min(V.W, V.H) * 0.22;
    c.strokeStyle = 'rgba(255,255,255,0.35)'; c.lineWidth = 8; c.beginPath(); c.arc(cx, cy, R * (0.4 + (1 - ph) * 0.9), 0, Math.PI * 2); c.stroke();
    Paper.circle(c, cx, cy, R * 0.4, this.flash ? '#ffd23f' : '#ff7eb6', { border: 5 });
    const sh = Math.sin(this.t * 40) * Tilt.shake * 0.4;
    for (const s of [-1, 1]) { c.save(); c.translate(cx + s * R * 1.25, cy + R * 0.3); c.rotate(s * 0.4 + sh); Paper.rect(c, -8, 0, 16, 90, '#8a5a34', 6, { border: 3 }); Paper.circle(c, 0, -10, 36, s < 0 ? '#e8453c' : '#ffcc1f', { border: 4 }); c.restore(); }
    Puppet.draw(c, App.pup, cx, V.H * 0.95, Math.min(V.H * 0.3, 240), Puppet.Poses.dance(this.t * this.BPM / 120));
    if (this.resT) Kid.text(c, this.res.s, cx, cy - R - 20, 40, this.res.c);
    if (this.t < 2 * B) Kid.text(c, '準備…', cx, cy, 36, '#ffffff', 0);
    Kid.text(c, `${Math.max(0, Math.min(this.N, this.beat + 1))} / ${this.N}`, cx, cy + 6, 26, '#ffffff', 0);
    TiltUI.hint(c, this, Kid.portrait() ? 120 : 80, '#ffffff', true);
  },
  hud() { return { L: `<b>${this.score}</b> 分${this.combo >= 4 ? `　<span class="combo">${this.combo} 連擊</span>` : ''}`, R: `🎶 ${this.hits}` }; },
});

// ---- 叫醒紙片人 ----
ShakeGame({
  id: 'wakeup', name: '叫醒紙片人', icon: '⏰', color: '#ff9a2e', kid: true,
  desc: '紙片人睡著了！搖一搖鬧鐘叫醒牠！（手機限定）',
  howto: '📱 手機限定：紙片人睡得好熟！用力搖手機讓鬧鐘響，把「起床條」搖滿就會醒來。不搖的話又會睡回去喔！一共 6 次，越後面越難叫醒。（電腦：狂點畫面或按空白鍵）',
  start() { this.t = 0; this.score = 0; this.over = false; this.overText = '早安！大家都起床了！'; this.n = 0; this.ls = null; this.reset(); },
  reset() { this.m = 0; this.st = 'sleep'; this.stT = 0; this.need = 1 + this.n * 0.3; },
  update(dt) {
    this.t += dt; this.stT += dt; const d = Shk.d(this);
    if (this.st === 'sleep') {
      if (d) { this.m += d * 0.06 / this.need; Sfx.play('tick'); }
      this.m = Math.max(0, this.m - dt * (0.06 + this.n * 0.015));
      if (this.m >= 1) { this.st = 'awake'; this.stT = 0; const pts = Math.max(10, Math.round(60 - (this.t - (this.st0 || 0)) * 3)); this.score += pts; Sfx.play('bell'); Kid.say('早安！'); FX.burst(V.W / 2, V.H * 0.5, 30, undefined, 1); FX.text(V.W / 2, V.H * 0.3, `早安！+${pts}`, '#ff7a00', 44); }
    } else if (this.stT > 2) { this.n++; if (this.n >= 6) { this.over = true; return; } this.reset(); this.st0 = this.t; Kid.say('又睡著了'); }
  },
  draw(c) {
    const k = this.st === 'awake' ? 1 : this.m, g = c.createLinearGradient(0, 0, 0, V.H); g.addColorStop(0, `rgb(${Math.round(40 + 200 * k)},${Math.round(50 + 170 * k)},${Math.round(110 + 120 * k)})`); g.addColorStop(1, '#f6e7c8'); c.fillStyle = g; c.fillRect(-20, -20, V.W + 40, V.H + 40);
    const by = V.H * 0.72; Paper.rect(c, V.W * 0.15, by - 20, V.W * 0.7, 70, '#c98a4b', 14, { border: 4 }); Paper.rect(c, V.W * 0.17, by - 40, V.W * 0.2, 30, '#ffffff', 12, { border: 3 });
    if (this.st === 'sleep') {
      c.save(); c.translate(V.W * 0.5, by - 30); c.rotate(-Math.PI / 2); Puppet.draw(c, App.pup, 0, 0, Math.min(V.W * 0.5, 260), { aL: 0.3, aR: 0.3, head: 0.1 + Math.sin(this.t * 2) * 0.03 }); c.restore();
      Paper.rect(c, V.W * 0.32, by - 50, V.W * 0.5, 50, '#7fb3e0', 14, { border: 3 });
      for (let i = 0; i < 3; i++) { const p = (this.t * 0.6 + i / 3) % 1; c.globalAlpha = 1 - p; Kid.text(c, 'Z', V.W * 0.28 + p * 60, by - 90 - p * 90, 24 + p * 20, '#ffffff', 4); c.globalAlpha = 1; }
    } else Puppet.draw(c, App.pup, V.W / 2, by - 10, Math.min(V.H * 0.4, 300), Puppet.Poses.cheer(this.t));
    const sh = Math.sin(this.t * 60) * Tilt.shake * 12; Kid.emoji(c, '⏰', V.W * 0.8 + sh, V.H * 0.32, 80, sh * 0.02);
    const w = Math.min(V.W * 0.7, 360), x0 = V.W / 2 - w / 2, y0 = Kid.portrait() ? 135 : 90;
    Paper.rect(c, x0, y0, w, 24, '#fffdf5', 12, { border: 3 }); c.fillStyle = '#ffcc1f'; c.fillRect(x0 + 3, y0 + 3, (w - 6) * Math.min(1, k), 18); Kid.emoji(c, '☀️', x0 + w + 20, y0 + 12, 30);
    TiltUI.hint(c, this, y0 + 50, '#ffffff', true);
  },
  hud() { return { L: `<b>${this.score}</b> 分`, R: `⏰ ${Math.min(this.n + 1, 6)} / 6` }; },
});

// ---- 雪花水晶球 ----
ShakeGame({
  id: 'snowglobe', name: '雪花水晶球', icon: '🔮', color: '#7fb3e0', kid: true,
  desc: '搖一搖水晶球，裡面會下雪、下星星！（手機限定）',
  howto: '📱 手機限定：紙片人住在水晶球裡！搖一搖手機，裡面就會下雪。搖越多次，會變成下星星、下愛心、下花瓣…看看還有什麼！不會輸，限時 30 秒。（電腦：狂點畫面或按空白鍵）',
  TIME: 30, KINDS: [['❄️', '#ffffff', '下雪了！'], ['⭐', '#ffd23f', '下星星了！'], ['💖', '#ff7eb6', '下愛心了！'], ['🌸', '#ffc0d8', '下花瓣了！'], ['🍬', '#ff9a2e', '下糖果了！'], ['🎈', '#e8453c', '氣球飄飄！']],
  start() { this.t = 0; this.left = this.TIME; this.score = 0; this.over = false; this.overText = '好美的水晶球！'; this.ls = null; this.parts = []; this.n = 0; this.kind = 0; },
  get G() { return { x: V.W / 2, y: V.H * 0.48, r: Math.min(V.W * 0.42, V.H * 0.3) }; },
  update(dt) {
    this.t += dt; this.left -= dt; if (this.left <= 0) { this.left = 0; this.over = true; return; }
    const d = Shk.d(this), G = this.G;
    if (d) { this.n += d; this.score += d * 2; Sfx.play('rustle'); for (let i = 0; i < d * 6; i++) { const a = rand(0, Math.PI * 2), r = Math.sqrt(Math.random()) * G.r * 0.85; this.parts.push({ x: Math.cos(a) * r, y: Math.sin(a) * r, vx: rand(-120, 120), vy: rand(-160, 40), k: this.kind, rot: rand(0, 6) }); } }
    const nk = Math.min(this.KINDS.length - 1, Math.floor(this.n / 20)); if (nk !== this.kind) { this.kind = nk; Sfx.play('star'); FX.text(G.x, G.y - G.r - 30, this.KINDS[nk][2], '#ffffff', 36); Kid.say(this.KINDS[nk][2]); }
    for (const p of this.parts) { p.vx *= 1 - dt; p.vy += 60 * dt; p.vy *= 1 - dt * 0.8; p.x += p.vx * dt; p.y += p.vy * dt; p.rot += dt; const d2 = Math.hypot(p.x, p.y); if (d2 > G.r * 0.88) { p.x *= G.r * 0.88 / d2; p.y *= G.r * 0.88 / d2; p.vx *= -0.3; p.vy *= -0.3; if (p.y > G.r * 0.5) p.rest = 1; } }
    if (this.parts.length > 260) this.parts.splice(0, this.parts.length - 260);
  },
  draw(c) {
    c.fillStyle = '#3a4a7a'; c.fillRect(-20, -20, V.W + 40, V.H + 40);
    const G = this.G; Paper.rect(c, G.x - G.r * 0.8, G.y + G.r * 0.75, G.r * 1.6, G.r * 0.45, '#8a5a34', 18, { border: 5 });
    c.save(); c.beginPath(); c.arc(G.x, G.y, G.r, 0, Math.PI * 2); c.clip();
    const g = c.createRadialGradient(G.x, G.y - G.r * 0.3, 10, G.x, G.y, G.r); g.addColorStop(0, '#cfe9ff'); g.addColorStop(1, '#6ea8de'); c.fillStyle = g; c.fillRect(G.x - G.r, G.y - G.r, G.r * 2, G.r * 2);
    c.fillStyle = '#ffffff'; c.beginPath(); c.ellipse(G.x, G.y + G.r * 0.75, G.r * 0.95, G.r * 0.3, 0, 0, Math.PI * 2); c.fill();
    Puppet.draw(c, App.pup, G.x, G.y + G.r * 0.6, G.r * 0.9, Tilt.shake > 0.2 ? Puppet.Poses.cheer(this.t) : Puppet.Poses.idle(this.t));
    for (const p of this.parts) Kid.emoji(c, this.KINDS[p.k][0], G.x + p.x, G.y + p.y, 16, p.rot);
    c.restore();
    c.strokeStyle = 'rgba(255,255,255,0.8)'; c.lineWidth = 6; c.beginPath(); c.arc(G.x, G.y, G.r, 0, Math.PI * 2); c.stroke();
    c.fillStyle = 'rgba(255,255,255,0.35)'; c.beginPath(); c.ellipse(G.x - G.r * 0.45, G.y - G.r * 0.5, G.r * 0.15, G.r * 0.3, 0.6, 0, Math.PI * 2); c.fill();
    TiltUI.hint(c, this, Kid.portrait() ? 125 : 80, '#ffffff', true);
  },
  hud() { return { L: `<b>${this.score}</b> 分　🔮 ${this.n} 下`, R: `⏱ ${Math.ceil(this.left)}` }; },
});

// ---- 搖搖飲料店 ----
ShakeGame({
  id: 'shakedrink', name: '搖搖飲料店', icon: '🧋', color: '#c98a4b',
  desc: '客人點飲料了！快搖好一杯送出去！（手機限定）',
  howto: '📱 手機限定：客人點了飲料，用力搖手機把雪克杯搖好（搖滿條條就會自動送出）。客人等太久會生氣走掉喔！越快送出小費越多，限時 45 秒。（電腦：狂點畫面或按空白鍵）',
  TIME: 45, DRINKS: [['🧋', '珍珠奶茶', '#c9a07a'], ['🍹', '水果茶', '#ff9a4a'], ['🥤', '汽水', '#7fd8ff'], ['🍵', '綠茶', '#8fd16a'], ['🥛', '牛奶', '#ffffff']],
  FACES: ['🐶', '🐱', '🐰', '🐻', '🐼', '🦊', '🐸', '🐵'],
  start() { this.t = 0; this.left = this.TIME; this.score = 0; this.over = false; this.overText = '打烊囉！'; this.ls = null; this.served = 0; this.q = []; this.m = 0; this.cool = 0; this.nextT = 0; },
  update(dt) {
    this.t += dt; this.left -= dt; if (this.left <= 0) { this.left = 0; this.over = true; this.overText = `賣出 ${this.served} 杯！`; return; }
    this.nextT -= dt; if (this.nextT <= 0 && this.q.length < 3) { this.q.push({ d: pick(this.DRINKS), f: pick(this.FACES), wait: 0, max: Math.max(6, 12 - this.t / 8), need: Math.round(rand(8, 14)) }); this.nextT = rand(2.5, 4.5); Sfx.play('ding'); }
    for (const c of this.q) c.wait += dt;
    const first = this.q[0], gone = this.q.filter(c => c.wait > c.max); if (gone.length) { this.q = this.q.filter(c => c.wait <= c.max); if (gone.includes(first)) this.m = 0; Sfx.play('nope'); FX.text(V.W / 2, V.H * 0.25, `${gone[0].f} 等太久走掉了…`, '#7a62b8', 28); }
    this.cool = Math.max(0, this.cool - dt);
    const cur = this.q[0]; this.cur = cur; const d = Shk.d(this);
    if (cur && d && !this.cool) { this.m += d / cur.need; Sfx.play('rustle'); }
    if (cur && this.m >= 1) {
      const tip = Math.max(0, Math.round((1 - cur.wait / cur.max) * 20)); this.score += 20 + tip; this.served++; this.m = 0; this.cool = 0.4; this.q.shift();
      Sfx.play('coin'); FX.text(V.W / 2, V.H * 0.3, tip > 10 ? `謝謝！小費 +${tip}` : '謝謝！', '#3d8b2a', 34);
    }
  },
  draw(c) {
    c.fillStyle = '#fff1d6'; c.fillRect(-20, -20, V.W + 40, V.H + 40); c.fillStyle = '#e8453c'; for (let x = 0; x < V.W; x += 60) { c.fillRect(x, 0, 30, 60); } c.fillStyle = '#c98a4b'; c.fillRect(-20, V.H * 0.62, V.W + 40, V.H);
    // 客人
    this.q.forEach((q, i) => { const x = V.W * (0.2 + i * 0.3), y = V.H * 0.32, k = q.wait / q.max; Kid.emoji(c, q.f, x, y, 70); Paper.rect(c, x - 40, y - 100, 80, 50, '#fffdf5', 14, { border: 3 }); Kid.emoji(c, q.d[0], x, y - 75, 34); c.fillStyle = k > 0.7 ? '#e8453c' : '#45ad4a'; c.fillRect(x - 35, y + 44, 70 * (1 - k), 8); if (i === 0) Kid.text(c, '▼', x, y - 120, 22, '#e0573c', 0); });
    // 雪克杯
    const cur = this.q[0], cx = V.W / 2, cy = V.H * 0.72, sh = Math.sin(this.t * 50) * Tilt.shake * 14;
    c.save(); c.translate(cx + sh, cy); c.rotate(sh * 0.02); Paper.rect(c, -40, -70, 80, 140, '#c9cdd8', 16, { border: 4 }); Paper.rect(c, -30, -96, 60, 30, '#9aa0b5', 10, { border: 3 });
    if (cur) { c.fillStyle = cur.d[2]; c.fillRect(-32, 60 - 120 * Math.max(0.3, this.m), 64, 120 * Math.max(0.3, this.m)); }
    c.restore();
    const w = Math.min(V.W * 0.6, 300); Paper.rect(c, cx - w / 2, V.H * 0.9, w, 20, '#fffdf5', 10, { border: 3 }); c.fillStyle = '#ff9a4a'; c.fillRect(cx - w / 2 + 3, V.H * 0.9 + 3, (w - 6) * Math.min(1, this.m), 14);
    Puppet.draw(c, App.pup, V.W * 0.85, V.H * 0.95, Math.min(V.H * 0.28, 200), Puppet.Poses.idle(this.t));
    TiltUI.hint(c, this, V.H * 0.55, '#4a3520', true);
  },
  hud() { return { L: `<b>${this.score}</b> 分　🧋 ${this.served}`, R: `⏱ ${Math.ceil(this.left)}` }; },
});

// ---- 搖存錢筒 ----
ShakeGame({
  id: 'piggybank', name: '搖存錢筒', icon: '🐷', color: '#ff7eb6', kid: true,
  desc: '搖一搖小豬存錢筒，數數看掉出多少錢！（手機限定）',
  howto: '📱 手機限定：用力搖小豬存錢筒，硬幣會掉出來！有 1 元、5 元、10 元和 50 元。時間到會告訴你一共掉出幾元喔。不會輸，限時 25 秒。（電腦：狂點畫面或按空白鍵）',
  TIME: 25, COINS: [[1, '#d9a066', 14], [5, '#c9cdd8', 16], [10, '#c9cdd8', 18], [50, '#ffd23f', 20]],
  start() { this.t = 0; this.left = this.TIME; this.score = 0; this.over = false; this.overText = ''; this.ls = null; this.coins = []; this.money = 0; },
  update(dt) {
    this.t += dt; this.left -= dt;
    if (this.left <= 0) { this.left = 0; this.over = true; this.overText = `一共 ${this.money} 元！`; Kid.say(`一共${this.money}元`); return; }
    const d = Shk.d(this);
    for (let i = 0; i < d; i++) if (Math.random() < 0.55) {
      const r = Math.random(), C = r < 0.45 ? this.COINS[0] : r < 0.75 ? this.COINS[1] : r < 0.95 ? this.COINS[2] : this.COINS[3];
      this.coins.push({ C, x: V.W / 2 + rand(-20, 20), y: V.H * 0.45, vx: rand(-260, 260), vy: rand(-500, -200), rot: 0, rest: 0 });
      this.money += C[0]; this.score = this.money; Sfx.play(C[0] >= 50 ? 'star' : 'coin');
    }
    const fl = V.H * 0.9;
    for (const k of this.coins) { if (k.rest) continue; k.vy += 1400 * dt; k.x += k.vx * dt; k.y += k.vy * dt; k.rot += k.vx * dt * 0.05; if (k.x < 20 || k.x > V.W - 20) k.vx *= -0.6; if (k.y > fl - k.C[2]) { k.y = fl - k.C[2]; k.vy *= -0.35; k.vx *= 0.6; if (Math.abs(k.vy) < 60) k.rest = 1; } }
    if (this.coins.length > 120) this.coins.splice(0, this.coins.length - 120);
  },
  draw(c) {
    const gy = Kid.ground(c, 'orchard', this.t, 0.9), sh = Math.sin(this.t * 50) * Tilt.shake * 16;
    for (const k of this.coins) { c.save(); c.translate(k.x, k.y); c.scale(Math.max(0.3, Math.abs(Math.cos(k.rot))), 1); Paper.circle(c, 0, 0, k.C[2], k.C[1], { border: 2, blur: 3 }); c.restore(); Kid.text(c, String(k.C[0]), k.x, k.y + 1, k.C[2] * 0.9, '#6a4300', 0); }
    c.save(); c.translate(V.W / 2 + sh, V.H * 0.45); c.rotate(sh * 0.02);
    Paper.shape(c, cc => cc.ellipse(0, 0, 110, 80, 0, 0, Math.PI * 2), '#ff9ec4', { border: 5 });
    Paper.circle(c, 100, 0, 30, '#ff9ec4', { border: 4 }); c.fillStyle = '#e06a98'; c.beginPath(); c.arc(94, -6, 5, 0, Math.PI * 2); c.arc(108, -6, 5, 0, Math.PI * 2); c.fill();
    c.fillStyle = '#6a3a4a'; c.fillRect(-30, -78, 60, 8); for (const [x, y] of [[-60, 70], [-20, 75], [20, 75], [60, 70]]) Paper.rect(c, x - 10, y - 10, 20, 26, '#ff9ec4', 6, { border: 3 });
    Kid.head(c, 50, -20, 26, {}, 30);
    c.restore();
    Kid.text(c, `💰 ${this.money} 元`, V.W / 2, Kid.portrait() ? 135 : 95, 40, '#c9822f');
    TiltUI.hint(c, this, Kid.portrait() ? 180 : 135, '#4a3520', true);
  },
  hud() { return { L: `<b>${this.money}</b> 元`, R: `⏱ ${Math.ceil(this.left)}` }; },
});
