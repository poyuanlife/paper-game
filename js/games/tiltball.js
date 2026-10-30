'use strict';
// =====================================================
//  傾斜滾球的遊戲：迷你高爾夫、寶石收集、相撲推推、滾滾彩繪、冰上射門
//  共用：球的物理（慣性、撞牆反彈、球跟球互撞）
// =====================================================
const BallPhys = {
  arena() { const P = Kid.portrait(), top = P ? 120 : 76; return { x: 16, y: top, w: V.W - 32, h: V.H - top - (P ? 40 : 20) }; },
  move(b, dt, acc = 1150, fr = 1.0, max = 620) {
    b.vx += Tilt.x * acc * dt; b.vy += Tilt.y * acc * dt; b.vx *= 1 - Math.min(1, fr * dt); b.vy *= 1 - Math.min(1, fr * dt);
    const s = Math.hypot(b.vx, b.vy); if (s > max) { b.vx *= max / s; b.vy *= max / s; }
    b.x += b.vx * dt; b.y += b.vy * dt;
  },
  bounds(b, A, e = 0.6) {
    let hit = 0;
    if (b.x < A.x + b.r) { b.x = A.x + b.r; b.vx = Math.abs(b.vx) * e; hit = 1; } if (b.x > A.x + A.w - b.r) { b.x = A.x + A.w - b.r; b.vx = -Math.abs(b.vx) * e; hit = 1; }
    if (b.y < A.y + b.r) { b.y = A.y + b.r; b.vy = Math.abs(b.vy) * e; hit = 1; } if (b.y > A.y + A.h - b.r) { b.y = A.y + A.h - b.r; b.vy = -Math.abs(b.vy) * e; hit = 1; }
    return hit;
  },
  rect(b, R, e = 0.6) {   // R = {x, y, w, h}
    const px = clamp(b.x, R.x, R.x + R.w), py = clamp(b.y, R.y, R.y + R.h), dx = b.x - px, dy = b.y - py, d = Math.hypot(dx, dy);
    if (d >= b.r || d < 1e-6) return 0;
    const nx = dx / d, ny = dy / d; b.x = px + nx * b.r; b.y = py + ny * b.r; const vn = b.vx * nx + b.vy * ny; if (vn < 0) { b.vx -= (1 + e) * vn * nx; b.vy -= (1 + e) * vn * ny; } return 1;
  },
  bump(b, c, e = 1.3) {   // 圓形彈簧柱
    const dx = b.x - c.x, dy = b.y - c.y, d = Math.hypot(dx, dy), m = b.r + c.r; if (d >= m || d < 1e-6) return 0;
    const nx = dx / d, ny = dy / d; b.x = c.x + nx * m; b.y = c.y + ny * m; const vn = b.vx * nx + b.vy * ny; if (vn < 0) { b.vx -= (1 + e) * vn * nx; b.vy -= (1 + e) * vn * ny; } return 1;
  },
  hit(a, b, e = 0.95) {   // 兩顆球互撞（質量 m）
    const dx = b.x - a.x, dy = b.y - a.y, d = Math.hypot(dx, dy), m = a.r + b.r; if (d >= m || d < 1e-6) return 0;
    const nx = dx / d, ny = dy / d, ma = a.m || 1, mb = b.m || 1, rv = (b.vx - a.vx) * nx + (b.vy - a.vy) * ny;
    const push = (m - d) / 2; a.x -= nx * push; a.y -= ny * push; b.x += nx * push; b.y += ny * push;
    if (rv < 0) { const j = -(1 + e) * rv / (1 / ma + 1 / mb); a.vx -= j * nx / ma; a.vy -= j * ny / ma; b.vx += j * nx / mb; b.vy += j * ny / mb; }
    return Math.abs(rv);
  },
  // 彈珠：玻璃球裡面是紙片人的頭
  draw(c, b, sc = 1) {
    c.save(); c.translate(b.x, b.y); c.scale(sc, sc); const R = b.r;
    c.fillStyle = 'rgba(30,40,60,0.25)'; c.beginPath(); c.ellipse(3, R * 0.75, R * 0.9, R * 0.35, 0, 0, Math.PI * 2); c.fill();
    Paper.circle(c, 0, 0, R, b.col || '#dff3ff', { border: 3, blur: 5 }); if (!b.noHead) Kid.head(c, 0, 0, R * 0.62, {}, R - 2);
    const g = c.createRadialGradient(-R * 0.35, -R * 0.4, 1, 0, 0, R); g.addColorStop(0, 'rgba(255,255,255,0.7)'); g.addColorStop(0.45, 'rgba(255,255,255,0.05)'); g.addColorStop(1, 'rgba(120,170,255,0.3)');
    c.fillStyle = g; c.beginPath(); c.arc(0, 0, R, 0, Math.PI * 2); c.fill(); c.restore();
  },
  hole(c, x, y, r) { const g = c.createRadialGradient(x, y, 1, x, y, r); g.addColorStop(0, '#000'); g.addColorStop(1, '#2a2a2a'); c.fillStyle = g; c.beginPath(); c.arc(x, y, r, 0, Math.PI * 2); c.fill(); },
};

// ---- 迷你高爾夫 ----
registerGame({
  id: 'minigolf', name: '迷你高爾夫', icon: '⛳', color: '#45ad4a', tilt: true,
  desc: '傾斜手機把球滾進洞，小心水池！（手機限定）',
  howto: '📱 手機限定：傾斜手機讓高爾夫球滾動，滾進 ⛳ 旗子的洞就過關（太快會彈出來）。掉進水池會回到起點。🔴 彈簧柱會把球彈開。一共 5 洞，越快進洞分數越高！（電腦用方向鍵）',
  LEVELS: [
    { s: [0.5, 0.85], cup: [0.5, 0.15] },
    { s: [0.2, 0.86], cup: [0.8, 0.14], walls: [[0, 0.46, 0.66, 0.05]] },
    { s: [0.5, 0.88], cup: [0.5, 0.12], water: [[0.5, 0.5, 0.17]], bump: [[0.22, 0.28, 0.05], [0.78, 0.28, 0.05]] },
    { s: [0.15, 0.88], cup: [0.85, 0.12], walls: [[0.3, 0.32, 0.7, 0.05], [0, 0.62, 0.7, 0.05]], water: [[0.86, 0.84, 0.09]] },
    { s: [0.5, 0.9], cup: [0.5, 0.1], water: [[0.22, 0.5, 0.13], [0.78, 0.5, 0.13]], walls: [[0.4, 0.28, 0.2, 0.04]], bump: [[0.5, 0.62, 0.06]] },
  ],
  start() { this.t = 0; this.score = 0; this.over = false; this.overText = '五洞全部完成！'; this.lv = 0; this.splash = 0; this.newLevel(); },
  geo() {
    const A = BallPhys.arena(), L = this.LEVELS[this.lv], m = Math.min(A.w, A.h), P = (u, v) => ({ x: A.x + u * A.w, y: A.y + v * A.h });
    return { A, m, s: P(...L.s), cup: P(...L.cup), walls: (L.walls || []).map(w => ({ x: A.x + w[0] * A.w, y: A.y + w[1] * A.h, w: w[2] * A.w, h: w[3] * A.h })),
      water: (L.water || []).map(w => ({ ...P(w[0], w[1]), r: w[2] * m })), bump: (L.bump || []).map(w => ({ ...P(w[0], w[1]), r: w[2] * m })) };
  },
  newLevel() { const G = this.geo(); this.b = { x: G.s.x, y: G.s.y, vx: 0, vy: 0, r: 15, col: '#ffffff', noHead: true }; this.lt = 0; this.wet = 0; this.sink = 0; },
  tap() { Tilt.calibrate(); },
  update(dt) {
    this.t += dt; const b = this.b, G = this.geo();
    if (this.sink) { this.sink += dt; b.x += (G.cup.x - b.x) * dt * 8; b.y += (G.cup.y - b.y) * dt * 8; if (this.sink > 1.4) { if (this.lv + 1 >= this.LEVELS.length) { this.over = true; return; } this.lv++; this.newLevel(); } return; }
    if (this.splash) { this.splash -= dt; if (this.splash <= 0) { this.splash = 0; b.x = G.s.x; b.y = G.s.y; b.vx = b.vy = 0; } return; }
    this.lt += dt;
    BallPhys.move(b, dt, 900, 0.9, 560);
    if (BallPhys.bounds(b, G.A, 0.55)) Sfx.play('thud');
    for (const w of G.walls) if (BallPhys.rect(b, w, 0.55) && Math.hypot(b.vx, b.vy) > 120) Sfx.play('thud');
    for (const p of G.bump) if (BallPhys.bump(b, p, 1.4)) Sfx.play('boing');
    for (const w of G.water) if (Math.hypot(b.x - w.x, b.y - w.y) < w.r) { this.splash = 0.8; this.wet++; Sfx.play('splash'); FX.burst(b.x, b.y, 16, ['#bfe8ff', '#4fb3e8', '#ffffff'], 0.7); FX.text(b.x, b.y - 40, '噗通！', '#2f7fc1', 30); return; }
    const d = Math.hypot(b.x - G.cup.x, b.y - G.cup.y), sp = Math.hypot(b.vx, b.vy);
    if (d < 16) {
      if (sp < 330) { this.sink = 0.001; const pts = Math.max(20, Math.round(100 - this.lt * 3 - this.wet * 15)); this.score += pts; Sfx.play('win'); FX.burst(G.cup.x, G.cup.y, 30, undefined, 1); FX.text(G.cup.x, G.cup.y - 60, this.lt < 6 ? `一桿進洞！+${pts}` : `進洞！+${pts}`, '#e0573c', 36); }
      else { b.vx *= -0.4; b.vy *= -0.4; Sfx.play('block'); FX.text(G.cup.x, G.cup.y - 40, '太快了！', '#7a62b8', 24); }
    }
  },
  draw(c) {
    const G = this.geo(), A = G.A;
    c.fillStyle = '#5a9a45'; c.fillRect(-20, -20, V.W + 40, V.H + 40);
    Paper.rect(c, A.x - 8, A.y - 8, A.w + 16, A.h + 16, '#8a5a34', 14, { border: 4 });
    c.fillStyle = '#7dcc5c'; c.fillRect(A.x, A.y, A.w, A.h);
    c.fillStyle = 'rgba(255,255,255,0.08)'; for (let i = 0; i < A.h; i += 40) c.fillRect(A.x, A.y + i, A.w, 20);
    for (const w of G.water) { Paper.circle(c, w.x, w.y, w.r, '#4fb3e8', { border: 4, edge: '#e6c88a' }); c.strokeStyle = 'rgba(255,255,255,0.5)'; c.lineWidth = 2; c.beginPath(); c.arc(w.x, w.y, w.r * 0.6, 0.3, 1.4); c.stroke(); }
    for (const w of G.walls) Paper.rect(c, w.x, w.y, w.w, w.h, '#c98a4b', 4, { border: 3 });
    for (const p of G.bump) Paper.circle(c, p.x, p.y, p.r, '#e8453c', { border: 4 });
    BallPhys.hole(c, G.cup.x, G.cup.y, 15); c.fillStyle = '#ddd'; c.fillRect(G.cup.x - 1.5, G.cup.y - 56, 3, 56); Paper.shape(c, cc => { cc.moveTo(G.cup.x + 1, G.cup.y - 56); cc.lineTo(G.cup.x + 30, G.cup.y - 46); cc.lineTo(G.cup.x + 1, G.cup.y - 36); cc.closePath(); }, '#e8453c', { border: 2, blur: 2 });
    c.fillStyle = 'rgba(255,255,255,0.5)'; c.beginPath(); c.arc(G.s.x, G.s.y, 8, 0, Math.PI * 2); c.fill();
    if (!this.splash) BallPhys.draw(c, this.b, this.sink ? Math.max(0.1, 1 - this.sink) : 1);
    Puppet.draw(c, App.pup, A.x + 50, A.y + A.h - 4, 90, this.sink ? Puppet.Poses.cheer(this.t) : Puppet.Poses.idle(this.t));
    TiltUI.hint(c, this, V.H - 16, '#ffffff');
  },
  hud() { return { L: `<b>${this.score}</b> 分　第 ${this.lv + 1} / 5 洞`, R: `⏱ ${Math.floor(this.lt || 0)}　💧 ${this.wet || 0}` }; },
});

// ---- 寶石收集（有洞） ----
registerGame({
  id: 'gems', name: '寶石彈珠台', icon: '💎', color: '#3fa9e0', tilt: true,
  desc: '滾彈珠收集寶石，不要掉進洞裡！（手機限定）',
  howto: '📱 手機限定：傾斜手機滾彈珠，收集所有 💎 寶石就換下一關（洞會越來越多）。掉進黑洞會少一條命，3 條命，限時 90 秒。（電腦用方向鍵）',
  TIME: 90,
  start() { this.t = 0; this.left = this.TIME; this.score = 0; this.over = false; this.overText = '時間到！'; this.lives = 3; this.round = 1; this.fall = 0; this.newRound(); },
  newRound() {
    const A = BallPhys.arena(); this.b = { x: A.x + A.w / 2, y: A.y + A.h / 2, vx: 0, vy: 0, r: 17 };
    const far = (x, y, list, m) => Math.hypot(x - this.b.x, y - this.b.y) > 90 && list.every(q => Math.hypot(q.x - x, q.y - y) > m);
    this.holes = []; for (let i = 0, k = 0; i < 3 + this.round * 2 && k < 400; k++) { const x = rand(A.x + 30, A.x + A.w - 30), y = rand(A.y + 30, A.y + A.h - 30); if (far(x, y, this.holes, 80)) { this.holes.push({ x, y, r: rand(20, 28) }); i++; } }
    this.gems = []; for (let i = 0, k = 0; i < 6 && k < 400; k++) { const x = rand(A.x + 24, A.x + A.w - 24), y = rand(A.y + 24, A.y + A.h - 24); if (far(x, y, this.holes.concat(this.gems), 60)) { this.gems.push({ x, y, e: pick(['💎', '💎', '🔶', '🔷']) }); i++; } }
  },
  tap() { Tilt.calibrate(); },
  update(dt) {
    this.t += dt; this.left -= dt; if (this.left <= 0) { this.left = 0; this.over = true; return; }
    const b = this.b, A = BallPhys.arena();
    if (this.fall) { this.fall += dt; if (this.fall > 0.8) { this.fall = 0; b.x = A.x + A.w / 2; b.y = A.y + A.h / 2; b.vx = b.vy = 0; if (this.lives <= 0) { this.over = true; this.overText = '彈珠掉光了！'; } } return; }
    BallPhys.move(b, dt); BallPhys.bounds(b, A);
    for (const h of this.holes) if (Math.hypot(b.x - h.x, b.y - h.y) < h.r * 0.75) { this.fall = 0.001; this.lives--; b.x = h.x; b.y = h.y; Sfx.play('whiff'); FX.text(h.x, h.y - 40, '掉下去了！', '#e8453c', 26); return; }
    for (const g of this.gems) if (!g.got && Math.hypot(b.x - g.x, b.y - g.y) < b.r + 16) { g.got = 1; this.score += 15; Sfx.play('coin'); FX.burst(g.x, g.y, 10, ['#7fd8ff', '#fff'], 0.5); }
    if (this.gems.every(g => g.got)) { this.score += 50; this.round++; Sfx.play('win'); FX.text(V.W / 2, V.H * 0.4, `第 ${this.round} 關！`, '#3f8fe0', 44); this.newRound(); }
  },
  draw(c) {
    const A = BallPhys.arena();
    c.fillStyle = '#2b3a6b'; c.fillRect(-20, -20, V.W + 40, V.H + 40);
    Paper.rect(c, A.x - 6, A.y - 6, A.w + 12, A.h + 12, '#5b6fd6', 14, { border: 4 }); c.fillStyle = '#e8ecf5'; c.fillRect(A.x, A.y, A.w, A.h);
    c.strokeStyle = 'rgba(91,111,214,0.12)'; c.lineWidth = 1; for (let x = A.x; x < A.x + A.w; x += 30) { c.beginPath(); c.moveTo(x, A.y); c.lineTo(x, A.y + A.h); c.stroke(); } for (let y = A.y; y < A.y + A.h; y += 30) { c.beginPath(); c.moveTo(A.x, y); c.lineTo(A.x + A.w, y); c.stroke(); }
    for (const h of this.holes) BallPhys.hole(c, h.x, h.y, h.r);
    for (const g of this.gems) if (!g.got) Kid.emoji(c, g.e, g.x, g.y + Math.sin(this.t * 3 + g.x) * 3, 30);
    BallPhys.draw(c, this.b, this.fall ? Math.max(0.1, 1 - this.fall * 1.2) : 1);
    TiltUI.hint(c, this, V.H - 16, '#ffffff');
  },
  hud() { return { L: `<b>${this.score}</b> 分　第 ${this.round} 關`, R: TiltUI.lives(this.lives) + `　⏱ ${Math.ceil(this.left)}` }; },
});

// ---- 相撲推推 ----
registerGame({
  id: 'sumo', name: '彈珠相撲', icon: '🟠', color: '#d9643a', tilt: true,
  desc: '把對手的彈珠撞出擂台！（手機限定）',
  howto: '📱 手機限定：傾斜手機讓你的彈珠（有紙片人的那顆）衝過去，把紅色彈珠撞出圓形擂台！自己掉出去會少一條命。一共 5 回合，對手會越來越多。（電腦用方向鍵）',
  start() { this.t = 0; this.score = 0; this.over = false; this.overText = '相撲冠軍！'; this.round = 0; this.lives = 3; this.newRound(); },
  ring() { const A = BallPhys.arena(); return { x: A.x + A.w / 2, y: A.y + A.h / 2, r: Math.min(A.w, A.h) * 0.44 }; },
  newRound() {
    const R = this.ring(), n = [1, 1, 2, 2, 3][this.round]; this.me = { x: R.x, y: R.y + R.r * 0.55, vx: 0, vy: 0, r: 24, m: 1.2 };
    this.foes = []; for (let i = 0; i < n; i++) { const a = -Math.PI / 2 + (i - (n - 1) / 2) * 0.9; this.foes.push({ x: R.x + Math.cos(a) * R.r * 0.55, y: R.y + Math.sin(a) * R.r * 0.55, vx: 0, vy: 0, r: 22, m: 1, col: '#e8453c', noHead: true, fall: 0, ai: 380 + this.round * 60 }); }
    this.wait = 1.2; this.fallMe = 0;
  },
  tap() { Tilt.calibrate(); },
  update(dt) {
    this.t += dt; const R = this.ring(), me = this.me;
    if (this.wait > 0) { this.wait -= dt; return; }
    if (this.fallMe) { this.fallMe += dt; if (this.fallMe > 1) { if (this.lives <= 0) { this.over = true; this.overText = '被推出去了！'; return; } this.newRound(); } return; }
    BallPhys.move(me, dt, 1300, 0.8, 600);
    for (const f of this.foes) {
      if (f.fall) { f.fall += dt; continue; }
      // 電腦：往你衝，太靠邊的時候往中間跑
      const dc = Math.hypot(f.x - R.x, f.y - R.y), toMe = Math.hypot(me.x - f.x, me.y - f.y) || 1;
      let ax = (me.x - f.x) / toMe, ay = (me.y - f.y) / toMe;
      if (dc > R.r * 0.7) { ax = ax * 0.3 + (R.x - f.x) / dc; ay = ay * 0.3 + (R.y - f.y) / dc; }
      f.vx += ax * f.ai * dt; f.vy += ay * f.ai * dt; f.vx *= 1 - 0.8 * dt; f.vy *= 1 - 0.8 * dt; f.x += f.vx * dt; f.y += f.vy * dt;
      const imp = BallPhys.hit(me, f, 1.05); if (imp > 120) { Sfx.play('thud'); FX.burst((me.x + f.x) / 2, (me.y + f.y) / 2, 5, ['#fff6c8'], 0.3); }
      for (const g of this.foes) if (g !== f && !g.fall) BallPhys.hit(f, g);
      if (Math.hypot(f.x - R.x, f.y - R.y) > R.r) { f.fall = 0.001; this.score += 30; Sfx.play('whiff'); FX.text(f.x, f.y - 40, '出界！+30', '#e0573c', 28); }
    }
    if (Math.hypot(me.x - R.x, me.y - R.y) > R.r) { this.fallMe = 0.001; this.lives--; Sfx.play('hit'); FX.text(me.x, me.y - 40, '掉出去了！', '#7a62b8', 28); }
    if (this.foes.every(f => f.fall > 0.6)) { this.round++; this.score += 50; Sfx.play('win'); if (this.round >= 5) { this.over = true; return; } FX.text(V.W / 2, V.H * 0.3, `第 ${this.round + 1} 回合`, '#e0573c', 44); this.newRound(); }
  },
  draw(c) {
    const R = this.ring(); c.fillStyle = '#3a2f55'; c.fillRect(-20, -20, V.W + 40, V.H + 40);
    Paper.circle(c, R.x, R.y, R.r + 14, '#c9a24b', { border: 5, blur: 16 }); Paper.circle(c, R.x, R.y, R.r, '#f0d9a8', { border: 0, shadow: false });
    c.strokeStyle = '#ffffff'; c.lineWidth = 4; c.beginPath(); c.moveTo(R.x - 30, R.y - 10); c.lineTo(R.x - 30, R.y + 10); c.moveTo(R.x + 30, R.y - 10); c.lineTo(R.x + 30, R.y + 10); c.stroke();
    for (const f of this.foes) BallPhys.draw(c, f, f.fall ? Math.max(0.05, 1 - f.fall * 1.5) : 1);
    BallPhys.draw(c, this.me, this.fallMe ? Math.max(0.05, 1 - this.fallMe * 1.3) : 1);
    if (this.wait > 0) Kid.text(c, this.wait > 0.5 ? '預備…' : '開始！', V.W / 2, R.y - R.r - 30 < 130 ? R.y : R.y - R.r - 30, 44, '#ffd23f');
    TiltUI.hint(c, this, V.H - 16, '#ffffff');
  },
  hud() { return { L: `<b>${this.score}</b> 分　第 ${Math.min(5, this.round + 1)} / 5 回合`, R: TiltUI.lives(this.lives) }; },
});

// ---- 滾滾彩繪 ----
registerGame({
  id: 'rollpaint', name: '滾滾彩繪', icon: '🖌️', color: '#ff7eb6', tilt: true, kid: true,
  desc: '彈珠沾顏料滾來滾去，把畫紙塗滿！（手機限定）',
  howto: '📱 手機限定：歪歪手機讓沾了顏料的彈珠滾來滾去，滾過的地方就會畫上顏色！滾到角落的顏料盤可以換顏色。把畫紙塗滿 7 成就完成一幅畫，不會輸，限時 60 秒。（電腦用方向鍵）',
  TIME: 60, COLS: ['#e8453c', '#ffcc1f', '#3fa9e0', '#45ad4a'],
  start() { this.t = 0; this.left = this.TIME; this.score = 0; this.over = false; this.overText = '好漂亮的畫！'; this.done = 0; this.newPaper(); },
  newPaper() { const A = BallPhys.arena(); this.pad = Paper.offscreen(A.w, A.h); this.pad.x.fillStyle = '#ffffff'; this.pad.x.fillRect(0, 0, A.w, A.h); this.cells = new Set(); this.col = this.done % 4; if (!this.b) this.b = { x: A.x + A.w / 2, y: A.y + A.h / 2, vx: 0, vy: 0, r: 20 }; },
  pads() { const A = BallPhys.arena(); return [[A.x + 34, A.y + 34], [A.x + A.w - 34, A.y + 34], [A.x + 34, A.y + A.h - 34], [A.x + A.w - 34, A.y + A.h - 34]].map(([x, y], i) => ({ x, y, i })); },
  tap() { Tilt.calibrate(); },
  update(dt) {
    this.t += dt; this.left -= dt; if (this.left <= 0) { this.left = 0; this.over = true; return; }
    const b = this.b, A = BallPhys.arena(); BallPhys.move(b, dt, 1100, 1.2, 520); BallPhys.bounds(b, A, 0.4);
    for (const p of this.pads()) if (p.i !== this.col && Math.hypot(b.x - p.x, b.y - p.y) < 30) { this.col = p.i; Sfx.play('pop'); }
    const x = this.pad.x, lx = b.x - A.x, ly = b.y - A.y; x.fillStyle = this.COLS[this.col]; x.beginPath(); x.arc(lx, ly, b.r * 1.1, 0, Math.PI * 2); x.fill();
    const cs = 24; for (let dx = -1; dx <= 1; dx++) for (let dy = -1; dy <= 1; dy++) { const cx = Math.floor((lx + dx * 10) / cs), cy = Math.floor((ly + dy * 10) / cs); if (cx >= 0 && cy >= 0 && cx * cs < A.w && cy * cs < A.h) this.cells.add(cx + ',' + cy); }
    const total = Math.ceil(A.w / cs) * Math.ceil(A.h / cs); this.pct = this.cells.size / total;
    if (this.pct >= 0.7) { this.done++; this.score += 100; Sfx.play('win'); FX.burst(V.W / 2, V.H / 2, 40, undefined, 1.2); FX.text(V.W / 2, V.H * 0.4, '畫好了！換一張紙', '#e0573c', 40); Kid.say('好漂亮！'); this.newPaper(); }
    this.score = this.done * 100 + Math.floor((this.pct || 0) * 100);
  },
  draw(c) {
    const A = BallPhys.arena(); c.fillStyle = '#f6e7c8'; c.fillRect(-20, -20, V.W + 40, V.H + 40);
    Paper.rect(c, A.x - 6, A.y - 6, A.w + 12, A.h + 12, '#ffffff', 8, { border: 5 }); c.drawImage(this.pad.c, A.x, A.y, A.w, A.h);
    for (const p of this.pads()) { Paper.circle(c, p.x, p.y, 24, this.COLS[p.i], { border: p.i === this.col ? 6 : 3, edge: p.i === this.col ? '#4a3520' : undefined }); }
    this.b.col = this.COLS[this.col]; BallPhys.draw(c, this.b);
    const w = Math.min(260, V.W * 0.5); Paper.rect(c, V.W / 2 - w / 2, A.y - 34, w, 18, '#fffdf5', 9, { border: 3 }); c.fillStyle = '#ff7eb6'; c.fillRect(V.W / 2 - w / 2 + 3, A.y - 31, (w - 6) * Math.min(1, (this.pct || 0) / 0.7), 12);
    TiltUI.hint(c, this, V.H - 16);
  },
  hud() { return { L: `<b>${this.score}</b> 分　🖼️ ${this.done}`, R: `⏱ ${Math.ceil(this.left)}` }; },
});

// ---- 冰上射門 ----
registerGame({
  id: 'icehockey', name: '冰上射門', icon: '🏒', color: '#5aa9e6', tilt: true,
  desc: '傾斜手機推冰球，射進守門員後面的球門！（手機限定）',
  howto: '📱 手機限定：傾斜手機讓你的彈珠去撞黑色冰球，把冰球撞進上面的球門！守門員會左右擋球，越後面越快。限時 60 秒，看你能進幾球。（電腦用方向鍵）',
  TIME: 60,
  start() { this.t = 0; this.left = this.TIME; this.score = 0; this.over = false; this.overText = '比賽結束！'; this.goals = 0; this.reset(); },
  reset() { const A = BallPhys.arena(); this.me = { x: A.x + A.w / 2, y: A.y + A.h * 0.82, vx: 0, vy: 0, r: 24, m: 1.5 }; this.puck = { x: A.x + A.w / 2 + rand(-40, 40), y: A.y + A.h * 0.55, vx: 0, vy: 0, r: 16, m: 0.5, col: '#2a2a33', noHead: true }; this.gx = A.x + A.w / 2; this.cool = 0.6; },
  goal() { const A = BallPhys.arena(), w = A.w * 0.36; return { x: A.x + A.w / 2 - w / 2, w, y: A.y }; },
  tap() { Tilt.calibrate(); },
  update(dt) {
    this.t += dt; this.left -= dt; if (this.left <= 0) { this.left = 0; this.over = true; this.overText = `進了 ${this.goals} 球！`; return; }
    if (this.cool > 0) { this.cool -= dt; return; }
    const A = BallPhys.arena(), me = this.me, pk = this.puck, G = this.goal();
    BallPhys.move(me, dt, 1300, 1.0, 600); BallPhys.bounds(me, A, 0.5);
    pk.vx *= 1 - 0.25 * dt; pk.vy *= 1 - 0.25 * dt; pk.x += pk.vx * dt; pk.y += pk.vy * dt;
    if (BallPhys.hit(me, pk, 1.0) > 100) Sfx.play('block');
    // 守門員
    const gsp = 140 + this.goals * 25; this.gx += clamp(pk.x - this.gx, -gsp * dt, gsp * dt); this.gx = clamp(this.gx, G.x + 30, G.x + G.w - 30);
    const goalie = { x: this.gx - 32, y: A.y + 34, w: 64, h: 16 }; if (BallPhys.rect(pk, goalie, 0.9)) Sfx.play('thud');
    // 進球：冰球從球門的位置碰到上面
    if (pk.y < A.y + pk.r + 2 && pk.x > G.x + 6 && pk.x < G.x + G.w - 6) { this.goals++; this.score += 20 + this.goals * 2; Sfx.play('win'); FX.burst(pk.x, A.y + 10, 30, undefined, 1); FX.text(V.W / 2, V.H * 0.4, '進球！', '#e0573c', 50); this.reset(); return; }
    if (BallPhys.bounds(pk, A, 0.85)) Sfx.play('thud');
  },
  draw(c) {
    const A = BallPhys.arena(), G = this.goal();
    c.fillStyle = '#3a6ea5'; c.fillRect(-20, -20, V.W + 40, V.H + 40);
    Paper.rect(c, A.x - 6, A.y - 6, A.w + 12, A.h + 12, '#e8453c', 20, { border: 4 }); c.fillStyle = '#eef7ff'; c.fillRect(A.x, A.y, A.w, A.h);
    c.strokeStyle = 'rgba(232,69,60,0.4)'; c.lineWidth = 4; c.beginPath(); c.moveTo(A.x, A.y + A.h / 2); c.lineTo(A.x + A.w, A.y + A.h / 2); c.stroke(); c.beginPath(); c.arc(A.x + A.w / 2, A.y + A.h / 2, 50, 0, Math.PI * 2); c.stroke();
    c.fillStyle = '#ffffff'; c.fillRect(G.x, A.y - 4, G.w, 10); c.strokeStyle = '#e8453c'; c.lineWidth = 4; c.strokeRect(G.x, A.y - 4, G.w, 10);
    c.strokeStyle = 'rgba(150,150,170,0.5)'; c.lineWidth = 1; for (let x = G.x; x < G.x + G.w; x += 10) { c.beginPath(); c.moveTo(x, A.y - 4); c.lineTo(x, A.y + 6); c.stroke(); }
    Paper.rect(c, this.gx - 32, A.y + 34, 64, 16, '#3f5bd6', 8, { border: 3 }); Kid.emoji(c, '🧤', this.gx, A.y + 28, 28);
    BallPhys.draw(c, this.puck); BallPhys.draw(c, this.me);
    TiltUI.hint(c, this, V.H - 16, '#ffffff');
  },
  hud() { return { L: `<b>${this.score}</b> 分　🥅 ${this.goals}`, R: `⏱ ${Math.ceil(this.left)}` }; },
});
