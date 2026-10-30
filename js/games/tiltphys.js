'use strict';
// =====================================================
//  體感滾球第二彈：傾斜足球、滾球進洞、小水滴回家
// =====================================================

// ---- 傾斜足球 ----
registerGame({
  id: 'tiltsoccer', name: '傾斜足球', icon: '⚽', color: '#3c9a4a', tilt: true,
  desc: '傾斜手機滾彈珠，把足球撞進球門！（手機限定）',
  howto: '📱 手機限定：你是裡面有紙片人的彈珠，傾斜手機滾過去撞足球，把 ⚽ 撞進上面的球門！守門員會左右擋球，越後面越厲害。限時 60 秒，看你能進幾球。（電腦用方向鍵）',
  TIME: 60,
  start() { this.t = 0; this.left = this.TIME; this.score = 0; this.goals = 0; this.over = false; this.overText = '比賽結束！'; this.cele = 0; this.reset(); },
  reset() { const A = BallPhys.arena(); this.me = { x: A.x + A.w / 2, y: A.y + A.h * 0.85, vx: 0, vy: 0, r: 26, m: 2 }; this.ball = { x: A.x + A.w / 2 + rand(-60, 60), y: A.y + A.h * 0.55, vx: 0, vy: 0, r: 20, m: 1 }; this.kx = A.x + A.w / 2; },
  goal() { const A = BallPhys.arena(), w = Math.min(A.w * 0.42, 260); return { x: A.x + A.w / 2 - w / 2, w, y: A.y }; },
  keeper() { const G = this.goal(); return { x: this.kx - 40, y: G.y + 34, w: 80, h: 16 }; },
  tap() { Tilt.calibrate(); },
  update(dt) {
    this.t += dt; this.left -= dt; if (this.left <= 0) { this.left = 0; this.over = true; this.overText = `進了 ${this.goals} 球！`; return; }
    if (this.cele) { this.cele -= dt; if (this.cele <= 0) { this.cele = 0; this.reset(); } return; }
    const A = BallPhys.arena(), G = this.goal(), me = this.me, b = this.ball;
    BallPhys.move(me, dt, 1200, 1.1, 600);
    b.vx *= 1 - Math.min(1, dt * 0.7); b.vy *= 1 - Math.min(1, dt * 0.7); b.x += b.vx * dt; b.y += b.vy * dt;
    // 守門員：跟著球跑，速度有限
    const ks = 120 + this.goals * 25, want = clamp(b.x, G.x + 40, G.x + G.w - 40); this.kx += clamp(want - this.kx, -ks * dt, ks * dt);
    const K = this.keeper();
    for (const o of [me, b]) BallPhys.rect(o, K, 0.8);
    const sp = BallPhys.hit(me, b, 0.9); if (sp > 120) Sfx.play('thud');
    if (b.y - b.r <= A.y + 2 && b.x > G.x + b.r * 0.5 && b.x < G.x + G.w - b.r * 0.5) {
      this.goals++; this.score += 100; this.cele = 1.6; Sfx.play('win'); V.shake = 6; FX.burst(b.x, A.y + 30, 30, undefined, 1.1); FX.text(V.W / 2, V.H * 0.45, '進球！GOAL！', '#e0573c', 50); return;
    }
    BallPhys.bounds(me, A, 0.5); if (BallPhys.bounds(b, A, 0.75) && Math.hypot(b.vx, b.vy) > 200) Sfx.play('block');
  },
  draw(c) {
    const A = BallPhys.arena(), G = this.goal();
    c.fillStyle = '#2f7d3a'; c.fillRect(-20, -20, V.W + 40, V.H + 40);
    for (let i = 0; i < 8; i++) { c.fillStyle = i % 2 ? '#3f9a4a' : '#45a651'; c.fillRect(A.x, A.y + i * A.h / 8, A.w, A.h / 8 + 1); }
    c.strokeStyle = '#ffffff'; c.lineWidth = 4; c.strokeRect(A.x, A.y, A.w, A.h);
    c.beginPath(); c.moveTo(A.x, A.y + A.h / 2); c.lineTo(A.x + A.w, A.y + A.h / 2); c.stroke();
    c.beginPath(); c.arc(A.x + A.w / 2, A.y + A.h / 2, Math.min(A.w, A.h) * 0.14, 0, Math.PI * 2); c.stroke();
    c.strokeRect(G.x - 30, A.y, G.w + 60, Math.min(110, A.h * 0.18));
    // 球門
    c.fillStyle = 'rgba(255,255,255,0.5)'; c.fillRect(G.x, A.y - 14, G.w, 14);
    c.strokeStyle = '#ffffff'; c.lineWidth = 6; c.beginPath(); c.moveTo(G.x, A.y + 4); c.lineTo(G.x, A.y - 16); c.lineTo(G.x + G.w, A.y - 16); c.lineTo(G.x + G.w, A.y + 4); c.stroke();
    const K = this.keeper(); Paper.rect(c, K.x, K.y, K.w, K.h, '#e8453c', 8, { border: 3 }); Kid.emoji(c, '🧤', K.x + K.w / 2, K.y - 8, 30);
    const b = this.ball; c.fillStyle = 'rgba(0,0,0,0.2)'; c.beginPath(); c.ellipse(b.x + 3, b.y + b.r * 0.8, b.r, b.r * 0.35, 0, 0, Math.PI * 2); c.fill();
    Kid.emoji(c, '⚽', b.x, b.y, b.r * 2.1, (b.x + b.y) / 30);
    BallPhys.draw(c, this.me);
    TiltUI.hint(c, this, V.H - 22);
  },
  hud() { return { L: `<b>${this.score}</b> 分　⚽ ${this.goals}`, R: `⏱ ${Math.ceil(this.left)}` }; },
});

// ---- 滾球進洞 ----
registerGame({
  id: 'pocketball', name: '滾球進洞', icon: '🎱', color: '#1f7a55', tilt: true,
  desc: '傾斜手機滾彈珠，把彩色球撞進洞裡！（手機限定）',
  howto: '📱 手機限定：傾斜手機讓有紙片人的彈珠滾動，去撞彩色的球，把它們撞進桌子的 6 個洞裡！自己掉進洞會扣分。全部撞進去就過關，越快剩下的時間越多分。限時 90 秒。（電腦用方向鍵）',
  TIME: 90, COLS: ['#ffd23f', '#3f8fe0', '#e8453c', '#9b5bd6', '#ff9a2e', '#45ad4a', '#8a4a24', '#e86fae'],
  start() {
    this.t = 0; this.left = this.TIME; this.score = 0; this.over = false; this.overText = '時間到！'; this.fall = 0; this.combo = 0; this.comboT = 0;
    const A = this.table(); this.me = { x: A.x + A.w / 2, y: A.y + A.h * 0.82, vx: 0, vy: 0, r: 20, m: 1.4 };
    this.balls = []; const cx = A.x + A.w / 2, cy = A.y + A.h * 0.32, r = 16; let k = 0;
    for (let row = 0; row < 4 && k < 8; row++) for (let i = 0; i <= row && k < 8; i++) this.balls.push({ x: cx + (i - row / 2) * r * 2.1, y: cy - row * r * 1.85, vx: 0, vy: 0, r, m: 1, col: this.COLS[k++] });
  },
  table() { const A = BallPhys.arena(); return { x: A.x + 18, y: A.y + 18, w: A.w - 36, h: A.h - 36 }; },
  pockets() { const A = this.table(), P = []; for (const v of [0, 0.5, 1]) for (const u of [0, 1]) P.push({ x: A.x + u * A.w, y: A.y + v * A.h }); return P; },
  tap() { Tilt.calibrate(); },
  update(dt) {
    this.t += dt; this.left -= dt; this.comboT -= dt; if (this.comboT <= 0) this.combo = 0;
    if (this.left <= 0) { this.left = 0; this.over = true; this.overText = `還剩 ${this.balls.length} 顆球`; return; }
    const A = this.table(), me = this.me, PK = this.pockets(), pr = 26;
    if (this.fall) { this.fall -= dt; if (this.fall <= 0) { this.fall = 0; me.x = A.x + A.w / 2; me.y = A.y + A.h * 0.82; me.vx = me.vy = 0; } }
    else BallPhys.move(me, dt, 1100, 1.0, 620);
    for (let s = 0; s < 2; s++) {
      for (const b of this.balls) { b.x += b.vx * dt / 2; b.y += b.vy * dt / 2; }
      for (const b of this.balls) { b.vx *= 1 - Math.min(1, dt * 0.45); b.vy *= 1 - Math.min(1, dt * 0.45); }
      if (!this.fall) for (const b of this.balls) { const v = BallPhys.hit(me, b, 0.92); if (v > 100) Sfx.play('thud'); }
      for (let i = 0; i < this.balls.length; i++) for (let j = i + 1; j < this.balls.length; j++) { const v = BallPhys.hit(this.balls[i], this.balls[j], 0.92); if (v > 140) Sfx.play('pins'); }
    }
    for (const b of this.balls) {
      for (const p of PK) if (Math.hypot(b.x - p.x, b.y - p.y) < pr) { b.dead = 1; this.combo++; this.comboT = 2.5; const pts = 20 * this.combo; this.score += pts; Sfx.play('coin'); FX.burst(p.x, p.y, 12, [b.col, '#ffffff'], 0.6); FX.text(clamp(p.x, 80, V.W - 80), clamp(p.y, 140, V.H - 60), this.combo > 1 ? `連續 ${this.combo}！+${pts}` : `+${pts}`, '#ffd23f', 30); break; }
      if (!b.dead) BallPhys.bounds(b, A, 0.7);
    }
    this.balls = this.balls.filter(b => !b.dead);
    if (!this.fall) {
      for (const p of PK) if (Math.hypot(me.x - p.x, me.y - p.y) < pr - 4) { this.fall = 1; this.score = Math.max(0, this.score - 15); Sfx.play('boing'); FX.text(clamp(p.x, 80, V.W - 80), clamp(p.y, 140, V.H - 60), '自己掉進去了！-15', '#e8453c', 26); break; }
      if (!this.fall) BallPhys.bounds(me, A, 0.6);
    }
    if (!this.balls.length) { const bonus = Math.ceil(this.left) * 3; this.score += bonus; this.over = true; this.overText = `全部進洞！時間獎勵 +${bonus}`; }
  },
  draw(c) {
    const A = this.table();
    c.fillStyle = '#5a3a22'; c.fillRect(-20, -20, V.W + 40, V.H + 40);
    Paper.rect(c, A.x - 18, A.y - 18, A.w + 36, A.h + 36, '#8a5a34', 22, { border: 4, blur: 8 });
    Paper.rect(c, A.x, A.y, A.w, A.h, '#1f8a5e', 8, { border: 0, shadow: false });
    for (const p of this.pockets()) BallPhys.hole(c, p.x, p.y, 24);
    for (const b of this.balls) { c.fillStyle = 'rgba(0,0,0,0.25)'; c.beginPath(); c.ellipse(b.x + 3, b.y + b.r * 0.7, b.r, b.r * 0.4, 0, 0, Math.PI * 2); c.fill(); Paper.circle(c, b.x, b.y, b.r, b.col, { border: 2, blur: 3 }); c.fillStyle = 'rgba(255,255,255,0.55)'; c.beginPath(); c.arc(b.x - b.r * 0.35, b.y - b.r * 0.35, b.r * 0.3, 0, Math.PI * 2); c.fill(); }
    if (!this.fall) BallPhys.draw(c, this.me); else BallPhys.draw(c, this.me, Math.max(0.05, this.fall));
    TiltUI.hint(c, this, V.H - 22);
  },
  hud() { return { L: `<b>${this.score}</b> 分　🎱 剩 ${this.balls.length}`, R: `⏱ ${Math.ceil(this.left)}` }; },
});

// ---- 小水滴回家 ----
registerGame({
  id: 'waterdrop', name: '小水滴回家', icon: '💧', color: '#2f9be0', tilt: true, kid: true,
  desc: '傾斜手機讓一大群小水滴流進杯子裡！（手機限定）',
  howto: '📱 手機限定：手機往哪邊歪，小水滴就往哪邊流！繞過牆壁，把水滴倒進杯子裡，小心不要流進黑黑的排水孔。一共 4 關，每關 40 秒，流進杯子的水滴越多分數越高。（電腦用方向鍵）',
  N: 50, LT: 40,
  LEVELS: [
    { s: [0.15, 0.15], cup: [0.7, 0.7, 0.3, 0.3], walls: [[0, 0.45, 0.6, 0.04]] },
    { s: [0.82, 0.12], cup: [0, 0.7, 0.3, 0.3], walls: [[0.35, 0.3, 0.65, 0.04], [0, 0.56, 0.62, 0.04]] },
    { s: [0.5, 0.1], cup: [0.36, 0.72, 0.28, 0.28], walls: [[0.3, 0.38, 0.4, 0.04]], holes: [[0.15, 0.62, 0.07], [0.85, 0.62, 0.07]] },
    { s: [0.18, 0.82], cup: [0.7, 0.7, 0.3, 0.3], walls: [[0.5, 0.34, 0.05, 0.66]], holes: [[0.5, 0.12, 0.06]] },
  ],
  start() { this.t = 0; this.score = 0; this.over = false; this.overText = '水滴都回家了！'; this.lv = 0; this.total = 0; this.newLevel(); },
  geo() {
    const A = BallPhys.arena(), L = this.LEVELS[this.lv], m = Math.min(A.w, A.h), R = r => ({ x: A.x + r[0] * A.w, y: A.y + r[1] * A.h, w: r[2] * A.w, h: r[3] * A.h });
    const cu = R(L.cup), th = 10, walls = L.walls.map(R);
    walls.push({ x: cu.x, y: cu.y, w: th, h: cu.h }, { x: cu.x + cu.w - th, y: cu.y, w: th, h: cu.h }, { x: cu.x, y: cu.y + cu.h - th, w: cu.w, h: th });
    return { A, cup: cu, inner: { x: cu.x + th, y: cu.y + cu.h * 0.3, w: cu.w - th * 2, h: cu.h * 0.7 - th }, walls, holes: (L.holes || []).map(h => ({ x: A.x + h[0] * A.w, y: A.y + h[1] * A.h, r: h[2] * m })), s: { x: A.x + L.s[0] * A.w, y: A.y + L.s[1] * A.h } };
  },
  newLevel() {
    const G = this.geo(); this.drops = []; this.home = 0; this.lost = 0; this.lt = 0; this.done = 0;
    for (let i = 0; i < this.N; i++) { const a = rand(0, Math.PI * 2), r = Math.sqrt(Math.random()) * 50; this.drops.push({ x: G.s.x + Math.cos(a) * r, y: G.s.y + Math.sin(a) * r, vx: 0, vy: 0, r: 8 }); }
  },
  tap() { Tilt.calibrate(); },
  update(dt) {
    this.t += dt; const G = this.geo();
    if (this.done) { this.done -= dt; if (this.done <= 0) { if (this.lv + 1 >= this.LEVELS.length) { this.over = true; this.overText = `一共救回 ${this.total} 滴水！`; return; } this.lv++; this.newLevel(); } return; }
    this.lt += dt;
    const gx = Tilt.x * 1100, gy = Tilt.y * 1100, D = this.drops;
    for (let s = 0; s < 2; s++) {
      const h = dt / 2;
      for (const d of D) { d.vx += gx * h; d.vy += gy * h; d.vx *= 1 - Math.min(1, h * 1.2); d.vy *= 1 - Math.min(1, h * 1.2); const sp = Math.hypot(d.vx, d.vy); if (sp > 650) { d.vx *= 650 / sp; d.vy *= 650 / sp; } d.x += d.vx * h; d.y += d.vy * h; }
      for (let i = 0; i < D.length; i++) for (let j = i + 1; j < D.length; j++) {
        const a = D[i], b = D[j], dx = b.x - a.x, dy = b.y - a.y, dd = dx * dx + dy * dy, m = a.r + b.r;
        if (dd < m * m && dd > 1e-6) { const d0 = Math.sqrt(dd), push = (m - d0) / 2, nx = dx / d0, ny = dy / d0; a.x -= nx * push; a.y -= ny * push; b.x += nx * push; b.y += ny * push; const rv = (b.vx - a.vx) * nx + (b.vy - a.vy) * ny; if (rv < 0) { a.vx += rv * nx * 0.5; a.vy += rv * ny * 0.5; b.vx -= rv * nx * 0.5; b.vy -= rv * ny * 0.5; } }
      }
      for (const d of D) { for (const w of G.walls) BallPhys.rect(d, w, 0.2); BallPhys.bounds(d, G.A, 0.2); }
    }
    const I = G.inner;
    for (const d of D) {
      if (d.x > I.x && d.x < I.x + I.w && d.y > I.y && d.y < I.y + I.h) { d.dead = 1; this.home++; this.total++; this.score += 4; if (this.home % 5 === 0) Sfx.play('splash'); continue; }
      for (const o of G.holes) if (Math.hypot(d.x - o.x, d.y - o.y) < o.r) { d.dead = 1; this.lost++; Sfx.play('pop'); break; }
    }
    this.drops = D.filter(d => !d.dead);
    if (!this.drops.length || this.lt >= this.LT) {
      const pct = this.home / this.N, bonus = pct >= 0.9 ? 50 : pct >= 0.6 ? 20 : 0; this.score += bonus; this.done = 2;
      Sfx.play(pct >= 0.6 ? 'win' : 'over'); FX.burst(G.cup.x + G.cup.w / 2, G.cup.y, 24, ['#bfe8ff', '#4fb3e8', '#ffffff'], 1);
      FX.text(V.W / 2, V.H * 0.4, `${this.home} / ${this.N} 滴回家了！` + (bonus ? ` +${bonus}` : ''), '#2f7fc1', 36); Kid.say(pct >= 0.6 ? '好棒！' : '加油！');
    }
  },
  draw(c) {
    const G = this.geo(), A = G.A;
    c.fillStyle = '#d7ecf5'; c.fillRect(-20, -20, V.W + 40, V.H + 40);
    Paper.rect(c, A.x, A.y, A.w, A.h, '#f4fbff', 16, { border: 4, blur: 6 });
    for (const o of G.holes) BallPhys.hole(c, o.x, o.y, o.r);
    for (const w of G.walls) Paper.rect(c, w.x, w.y, w.w, w.h, '#8a6a4a', 4, { border: 2, blur: 3 });
    const cu = G.cup, fill = this.home / this.N;
    c.fillStyle = '#4fb3e8'; c.fillRect(cu.x + 10, cu.y + cu.h - 10 - (cu.h - 20) * fill, cu.w - 20, (cu.h - 20) * fill);
    c.fillStyle = 'rgba(255,255,255,0.3)'; c.fillRect(cu.x + 14, cu.y + 6, 8, cu.h - 20);
    Kid.text(c, '🏠 杯子', cu.x + cu.w / 2, cu.y - 18, 20, '#2f7fc1', 5);
    for (const d of this.drops) { c.fillStyle = '#3fa4ea'; c.beginPath(); c.arc(d.x, d.y, d.r + 2, 0, Math.PI * 2); c.fill(); }
    for (const d of this.drops) { c.fillStyle = 'rgba(255,255,255,0.7)'; c.beginPath(); c.arc(d.x - 2.5, d.y - 2.5, 2.5, 0, Math.PI * 2); c.fill(); }
    if (this.drops[0] && this.lt < 3) { const d = this.drops[0]; Kid.head(c, d.x, d.y - 26, 16, {}, 18); }
    TiltUI.hint(c, this, V.H - 20);
  },
  hud() { return { L: `<b>${this.score}</b> 分　第 ${this.lv + 1}/${this.LEVELS.length} 關`, R: `💧 ${this.home}/${this.N}　⏱ ${Math.max(0, Math.ceil(this.LT - this.lt))}` }; },
});
