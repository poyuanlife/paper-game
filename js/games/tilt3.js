'use strict';
// =====================================================
//  體感第三彈（傾斜）：企鵝溜冰、紙片大砲、陽光照小花、磁鐵吸吸樂、冰淇淋疊疊、泡泡飄飄、澆花小幫手
// =====================================================

// 傾斜方向 → 一次一步（要回正才會再走）
const TiltStep = g => {
  const ax = Math.abs(Tilt.x), ay = Math.abs(Tilt.y);
  if (ax < 0.3 && ay < 0.3) { g.armed = true; return null; }
  if (!g.armed || Math.max(ax, ay) < 0.6) return null;
  g.armed = false; return ax > ay ? [Math.sign(Tilt.x), 0] : [0, Math.sign(Tilt.y)];
};

// ---- 企鵝溜冰 ----
registerGame({
  id: 'iceslide', name: '企鵝溜冰', icon: '🐧', color: '#5fb8e8', tilt: true,
  desc: '歪一下手機，企鵝就一路滑到撞牆為止，滑到魚旁邊！（手機限定）',
  howto: '📱 手機限定：往上、下、左、右歪一下手機，企鵝就會在冰上一直滑，撞到石頭或邊邊才停下來（雪地會讓牠停住）。想辦法停在 🐟 上面！歪完要把手機放平才能再滑。一共 6 關，步數越少分數越高。（電腦用方向鍵）',
  // # 石頭  . 冰  s 雪（滑到會停）  P 企鵝  F 魚
  LV: [
    ['#######', '#.....#', '#P.#..#', '#...#.#', '#.....#', '#.##..#', '#..#.F#', '#######'],
    ['#######', '#.....#', '###.#.#', '#.....#', '#.F...#', '#P....#', '##....#', '#######'],
    ['#######', '#.....#', '#F..#.#', '#..#.##', '##....#', '#.....#', '#...#P#', '#######'],
    ['#######', '#.F##.#', '#..s..#', '##...##', '##....#', '#....##', '#...P.#', '#######'],
    ['#######', '#F#..s#', '#...#.#', '##.#..#', '#.....#', '#...P##', '#..#..#', '#######'],
    ['#######', '#s....#', '#.....#', '#...F.#', '#P#...#', '##....#', '#....##', '#######'],
  ],
  start() { this.t = 0; this.score = 0; this.over = false; this.overText = '企鵝吃飽飽！'; this.lv = 0; this.armed = true; this.newLevel(); },
  newLevel() { const L = this.LV[this.lv]; this.map = L.map(r => r.split('')); this.map.forEach((r, y) => r.forEach((ch, x) => { if (ch === 'P') { this.px = x; this.py = y; r[x] = '.'; } if (ch === 'F') { this.fx = x; this.fy = y; r[x] = '.'; } })); this.dx = this.px; this.dy = this.py; this.moving = null; this.moves = 0; this.doneT = 0; this.face = 1; },
  geo() { const P = Kid.portrait(), R = this.map.length, C = this.map[0].length, s = Math.min((V.W - 30) / C, (V.H - (P ? 220 : 130)) / R, 90); return { s, x0: V.W / 2 - C * s / 2, y0: (P ? 130 : 84) + (V.H - (P ? 220 : 130) - R * s) / 2 }; },
  free(x, y) { const r = this.map[y]; return r && r[x] && r[x] !== '#'; },
  go(d) {
    if (this.moving || this.doneT) return; let x = this.px, y = this.py, n = 0;
    while (this.free(x + d[0], y + d[1])) { x += d[0]; y += d[1]; n++; if (this.map[y][x] === 's' || (x === this.fx && y === this.fy)) break; }
    if (!n) { Sfx.play('thud'); return; }
    this.moving = { x, y }; this.moves++; if (d[0]) this.face = d[0]; Sfx.play('swish');
  },
  tap() { Tilt.calibrate(); },
  update(dt) {
    this.t += dt;
    if (this.doneT) { this.doneT -= dt; if (this.doneT <= 0) { if (this.lv + 1 >= this.LV.length) { this.over = true; return; } this.lv++; this.newLevel(); } return; }
    const d = TiltStep(this); if (d) this.go(d);
    if (this.moving) {
      const M = this.moving, sp = dt * 12, ddx = M.x - this.dx, ddy = M.y - this.dy, L = Math.hypot(ddx, ddy);
      if (L <= sp) { this.dx = M.x; this.dy = M.y; this.px = M.x; this.py = M.y; this.moving = null;
        if (this.px === this.fx && this.py === this.fy) { const pts = Math.max(20, 100 - (this.moves - 2) * 10); this.score += pts; this.doneT = 1.6; Sfx.play('chomp'); FX.burst(V.W / 2, V.H / 2, 24, undefined, 1); FX.text(V.W / 2, V.H * 0.3, `好吃！${this.moves} 步 +${pts}`, '#2f7fc1', 38); } }
      else { this.dx += ddx / L * sp; this.dy += ddy / L * sp; }
    }
  },
  draw(c) {
    c.fillStyle = '#cfe9f7'; c.fillRect(-20, -20, V.W + 40, V.H + 40); const G = this.geo(), s = G.s;
    this.map.forEach((r, y) => r.forEach((ch, x) => {
      const X = G.x0 + x * s, Y = G.y0 + y * s;
      if (ch === '#') { c.fillStyle = '#e6f4fb'; c.fillRect(X, Y, s, s); TiltUI.rock(c, X + s / 2, Y + s / 2, s * 0.42); }
      else { c.fillStyle = ch === 's' ? '#ffffff' : (x + y) % 2 ? '#a9daf2' : '#b8e2f6'; c.fillRect(X, Y, s + 0.5, s + 0.5); if (ch === 's') { c.fillStyle = '#e8eef2'; c.beginPath(); c.arc(X + s * 0.3, Y + s * 0.4, s * 0.12, 0, Math.PI * 2); c.arc(X + s * 0.7, Y + s * 0.65, s * 0.1, 0, Math.PI * 2); c.fill(); } else { c.strokeStyle = 'rgba(255,255,255,0.6)'; c.lineWidth = 2; c.beginPath(); c.moveTo(X + s * 0.2, Y + s * 0.3); c.lineTo(X + s * 0.45, Y + s * 0.2); c.stroke(); } }
    }));
    if (!(this.doneT && this.px === this.fx)) Kid.emoji(c, '🐟', G.x0 + (this.fx + 0.5) * s, G.y0 + (this.fy + 0.5) * s + Math.sin(this.t * 4) * 3, s * 0.7);
    c.save(); c.translate(G.x0 + (this.dx + 0.5) * s, G.y0 + (this.dy + 0.5) * s); c.scale(-this.face, 1); Kid.emoji(c, '🐧', 0, 0, s * 0.85, this.moving ? 0.25 : Math.sin(this.t * 3) * 0.08); c.restore();
    Kid.text(c, `第 ${this.lv + 1} 關　步數 ${this.moves}`, V.W / 2, V.H - (Kid.portrait() ? 60 : 30), 24, '#2f7fc1', 6);
    TiltUI.hint(c, this, V.H - (Kid.portrait() ? 24 : 8));
  },
  hud() { return { L: `<b>${this.score}</b> 分`, R: `第 ${this.lv + 1} / ${this.LV.length} 關` }; },
});

// ---- 紙片大砲 ----
registerGame({
  id: 'cannon', name: '紙片大砲', icon: '💥', color: '#8a4a24', tilt: true,
  desc: '前後歪手機調整大砲角度，點一下發射打中目標！（手機限定）',
  howto: '📱 手機限定：手機往前、往後歪可以把大砲抬高或放低，點畫面就發射紙球！看虛線預測會飛到哪裡，打中 🎯 靶子得分，打中 🎁 禮物分數加倍。一共 10 發。（電腦：↑ ↓ 調角度，空白鍵發射）',
  N: 10,
  start() { this.t = 0; this.score = 0; this.over = false; this.overText = ''; this.k = 0; this.ang = 0.7; this.ball = null; this.res = 0; this.newTargets(); },
  get base() { return { x: Kid.portrait() ? 50 : 90, y: V.H * 0.86 }; },
  get v() { return Math.sqrt((V.W - this.base.x) * 1.05 * 900); },
  newTargets() { this.tg = []; const n = 3; for (let i = 0; i < n; i++) this.tg.push({ x: rand(V.W * 0.4, V.W - 50), y: rand(V.H * (Kid.portrait() ? 0.3 : 0.25), V.H * 0.8), e: Math.random() < 0.25 ? '🎁' : '🎯', r: 30, ph: rand(0, 6) }); },
  tap() { if (Tilt.active) Tilt.calibrate(); this.fire(); },
  key(k) { if (k === 'space' || k === 'enter') this.fire(); },
  fire() { if (this.ball || this.res || this.k >= this.N) return; const B = this.base, v = this.v; this.ball = { x: B.x + Math.cos(this.ang) * 50, y: B.y - Math.sin(this.ang) * 50, vx: Math.cos(this.ang) * v, vy: -Math.sin(this.ang) * v, hit: 0 }; this.k++; Sfx.play('boom'); V.shake = 5; FX.burst(B.x + Math.cos(this.ang) * 60, B.y - Math.sin(this.ang) * 60, 10, ['#ffffff', '#cccccc'], 0.4); },
  update(dt) {
    this.t += dt;
    const want = Tilt.active ? clamp(0.75 - Tilt.y * 0.75, 0.1, 1.45) : null;
    if (want != null) this.ang += (want - this.ang) * Math.min(1, dt * 8);
    else { const d = (Input.keys.arrowup || Input.keys.w ? 1 : 0) - (Input.keys.arrowdown || Input.keys.s ? 1 : 0); this.ang = clamp(this.ang + d * 1.2 * dt, 0.1, 1.45); }
    if (this.res) { this.res -= dt; if (this.res <= 0) { this.res = 0; if (this.k >= this.N) { this.over = true; this.overText = `${this.N} 發共 ${this.score} 分！`; return; } } return; }
    const b = this.ball; if (!b) return;
    b.vy += 900 * dt; b.x += b.vx * dt; b.y += b.vy * dt;
    for (const t of this.tg) if (!t.dead && Math.hypot(b.x - t.x, b.y - t.y) < t.r + 16) { t.dead = 1; b.hit++; const pts = (t.e === '🎁' ? 20 : 10) * b.hit; this.score += pts; Sfx.play(t.e === '🎁' ? 'star' : 'pins'); FX.burst(t.x, t.y, 18, undefined, 0.8); FX.text(t.x, t.y - 40, b.hit > 1 ? `連中！+${pts}` : '+' + pts, '#e0573c', 32); }
    if (b.y > V.H * 0.9 || b.x > V.W + 40) { if (!b.hit) { Sfx.play('thud'); FX.text(clamp(b.x, 60, V.W - 60), V.H * 0.82, '沒打到', '#7a62b8', 26); } this.ball = null; this.res = 0.6; this.tg = this.tg.filter(t => !t.dead); if (this.tg.length < 2) this.newTargets(); }
  },
  draw(c) {
    const gy = Kid.ground(c, 'meadow', this.t, 0.9), B = this.base, v = this.v;
    for (const t of this.tg) { c.strokeStyle = '#8a5a34'; c.lineWidth = 4; c.beginPath(); c.moveTo(t.x, t.y + 26); c.lineTo(t.x, gy); c.stroke(); Kid.emoji(c, t.e, t.x, t.y + Math.sin(this.t * 2 + t.ph) * 3, 56); }
    if (!this.ball && !this.res) { let x = B.x + Math.cos(this.ang) * 50, y = B.y - Math.sin(this.ang) * 50, vx = Math.cos(this.ang) * v, vy = -Math.sin(this.ang) * v; c.fillStyle = 'rgba(255,255,255,0.9)'; for (let i = 0; i < 9; i++) { for (let s = 0; s < 4; s++) { vy += 900 * 0.014; x += vx * 0.014; y += vy * 0.014; } c.beginPath(); c.arc(x, y, 5 - i * 0.35, 0, Math.PI * 2); c.fill(); } }
    c.save(); c.translate(B.x, B.y); c.rotate(-this.ang); Paper.rect(c, -10, -18, 80, 36, '#4a4f5a', 14, { border: 4 }); c.restore();
    Paper.circle(c, B.x, B.y + 8, 26, '#8a5a34', { border: 4 });
    if (this.ball) { const b = this.ball; Paper.circle(c, b.x, b.y, 16, '#ffffff', { border: 2, blur: 3 }); Kid.head(c, b.x, b.y, 11, {}, 14); }
    Kid.text(c, `${Math.round(this.ang * 180 / Math.PI)}°`, B.x + 40, B.y - 70, 22, '#4a3520', 5);
    TiltUI.hint(c, this, Kid.portrait() ? 140 : 96);
  },
  hud() { return { L: `<b>${this.score}</b> 分`, R: `💥 剩 ${this.N - this.k} 發` }; },
});

// ---- 陽光照小花 ----
registerGame({
  id: 'sunbeam', name: '陽光照小花', icon: '🌞', color: '#ffb31f', tilt: true, kid: true,
  desc: '左右歪手機轉動鏡子，把陽光反射到小花苞上！（手機限定）',
  howto: '📱 手機限定：左右歪手機，下面的鏡子就會轉動。把太陽光反射到 🌱 花苞上照一下下，它就會開花！照到 🦋 蝴蝶有額外分數。不會輸，限時 45 秒。（電腦用 ← → 鍵）',
  TIME: 45,
  start() { this.t = 0; this.left = this.TIME; this.score = 0; this.over = false; this.overText = '花都開了！'; this.th = 0; this.n = 0; this.tg = null; this.newTarget(); },
  get sun() { return { x: 70, y: Kid.portrait() ? 170 : 120 }; },
  get mir() { return { x: V.W * 0.5, y: V.H * 0.82 }; },
  newTarget() { const top = Kid.portrait() ? 170 : 110, bf = this.n > 2 && Math.random() < 0.3; this.tg = { x: rand(V.W * 0.15, V.W * 0.9), y: rand(top + 30, V.H * 0.62), e: bf ? '🦋' : '🌱', bf, ch: 0, vx: bf ? rand(-80, 80) : 0, vy: bf ? rand(-40, 40) : 0, bloom: 0 }; if (Math.hypot(this.tg.x - this.sun.x, this.tg.y - this.sun.y) < 160) this.tg.x = V.W * 0.75; },
  ray() {
    const S = this.sun, M = this.mir, dx = M.x - S.x, dy = M.y - S.y, L = Math.hypot(dx, dy), d = { x: dx / L, y: dy / L };
    const n = { x: Math.sin(this.th), y: -Math.cos(this.th) }, k = d.x * n.x + d.y * n.y; return { x: d.x - 2 * k * n.x, y: d.y - 2 * k * n.y };
  },
  tap() { Tilt.calibrate(); },
  update(dt) {
    this.t += dt; this.left -= dt; if (this.left <= 0) { this.left = 0; this.over = true; this.overText = `開了 ${this.n} 朵花！`; return; }
    const want = clamp(Tilt.x, -1, 1) * 0.75 - 0.25; this.th += (want - this.th) * Math.min(1, dt * 8);
    const T = this.tg; if (!T) return;
    if (T.bloom) { T.bloom += dt; if (T.bloom > 1.2) this.newTarget(); return; }
    if (T.bf) { T.x += T.vx * dt; T.y += T.vy * dt; if (T.x < 40 || T.x > V.W - 40) T.vx *= -1; if (T.y < 140 || T.y > V.H * 0.65) T.vy *= -1; }
    const M = this.mir, r = this.ray(), px = T.x - M.x, py = T.y - M.y, along = px * r.x + py * r.y, perp = Math.abs(px * r.y - py * r.x);
    if (along > 0 && perp < 34) { T.ch += dt; if (Math.random() < dt * 6) Sfx.play('tick'); if (T.ch >= (T.bf ? 0.6 : 1)) { T.bloom = 0.01; this.n++; const pts = T.bf ? 25 : 15; this.score += pts; Sfx.play('star'); FX.burst(T.x, T.y, 18, undefined, 0.8); FX.text(T.x, T.y - 50, T.bf ? `蝴蝶好開心 +${pts}` : `開花了！+${pts}`, '#e86fae', 30); if (this.n % 4 === 0) Kid.say('好漂亮！'); } }
    else T.ch = Math.max(0, T.ch - dt * 0.5);
  },
  draw(c) {
    const gy = Kid.ground(c, 'meadow', this.t, 0.88), S = this.sun, M = this.mir, r = this.ray();
    Paper.circle(c, S.x, S.y, 44, '#ffd23f', { border: 5, blur: 14, shadowColor: 'rgba(255,190,40,0.7)' }); Kid.head(c, S.x, S.y + 2, 26, {}, 30);
    c.save(); c.lineCap = 'round'; c.strokeStyle = 'rgba(255,230,90,0.75)'; c.lineWidth = 12; c.beginPath(); c.moveTo(S.x, S.y); c.lineTo(M.x, M.y); c.lineTo(M.x + r.x * 2000, M.y + r.y * 2000); c.stroke(); c.strokeStyle = 'rgba(255,255,220,0.95)'; c.lineWidth = 4; c.stroke(); c.restore();
    const T = this.tg;
    if (T) { if (T.ch > 0 && !T.bloom) { c.strokeStyle = '#ffb31f'; c.lineWidth = 5; c.beginPath(); c.arc(T.x, T.y, 38, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * T.ch / (T.bf ? 0.6 : 1)); c.stroke(); }
      if (!T.bf) { c.strokeStyle = '#3d8b2a'; c.lineWidth = 4; c.beginPath(); c.moveTo(T.x, T.y + 20); c.lineTo(T.x, T.y + 60); c.stroke(); }
      Kid.emoji(c, T.bloom && !T.bf ? '🌸' : T.e, T.x, T.y, 50 * (T.bloom && !T.bf ? 1 + Math.min(0.4, T.bloom) : 1), T.bf ? Math.sin(this.t * 12) * 0.2 : 0); }
    c.save(); c.translate(M.x, M.y); c.rotate(this.th); Paper.rect(c, -60, -6, 120, 12, '#bfe8ff', 4, { border: 3, blur: 4 }); c.fillStyle = 'rgba(255,255,255,0.8)'; c.fillRect(-50, -4, 40, 3); c.restore();
    Paper.rect(c, M.x - 8, M.y + 6, 16, gy - M.y, '#8a5a34', 4, { border: 2 });
    TiltUI.hint(c, this, V.H - 22);
  },
  hud() { return { L: `<b>${this.score}</b> 分　🌸 ${this.n}`, R: `⏱ ${Math.ceil(this.left)}` }; },
});

// ---- 磁鐵吸吸樂 ----
TiltRoam({
  id: 'magnet', name: '磁鐵吸吸樂', icon: '🧲', color: '#e8453c', lives: 3, n: 8, r: 30,
  desc: '開著大磁鐵到處跑，鐵做的東西會被吸過來！小心炸彈也會！（手機限定）',
  howto: '📱 手機限定：傾斜手機移動磁鐵。靠近 📎 迴紋針、🔩 螺絲、🔑 鑰匙，它們就會被吸過來！🍎 蘋果不是鐵做的吸不動，要自己碰到。小心 💣 炸彈也是鐵做的，靠太近會被吸過來！撞到 3 次就結束，限時 45 秒。（電腦用方向鍵）',
  end: '吸了好多東西！', lose: '被炸彈炸到了！',
  thing: () => { const k = pick([['📎', 10, 1], ['🔩', 10, 1], ['🔑', 15, 1], ['⚙️', 15, 1], ['🍎', 20, 0]]); return { e: k[0], pts: k[1], iron: k[2], r: 20 }; },
  touch(g, o) { g.collect(o, o.pts, o.iron ? 'snap' : 'catch'); },
  foes: g => 1 + Math.floor(g.t / 15),
  foe: () => ({ e: '💣', r: 26, speed: 40 }),
  hit(g, f) { f.dead = 1; V.shake = 10; Sfx.play('boom'); FX.burst(f.x, f.y, 24, ['#ff9f43', '#ffd93d', '#5a5a5a'], 1); g.ouch(f, '碰！'); },
  tick(g, dt) {
    const p = g.p, R = 170;
    for (const o of g.things) { if (!o.iron) continue; const dx = p.x - o.x, dy = p.y - o.y, d = Math.hypot(dx, dy); if (d < R && d > 1) { const k = (1 - d / R) * 900 * dt; o.x += dx / d * k; o.y += dy / d * k; o.pull = 1; } else o.pull = 0; }
    for (const f of g.foes) { const dx = p.x - f.x, dy = p.y - f.y, d = Math.hypot(dx, dy); if (d < R * 0.9 && d > 1) { f.vx += dx / d * 260 * dt; f.vy += dy / d * 260 * dt; } }
  },
  drawThing(c, o, g) { if (o.pull) c.rotate(Math.sin(g.t * 30) * 0.2); Kid.emoji(c, o.e, 0, 0, 36); },
  bg(c, g) {
    c.fillStyle = '#e8e2d6'; c.fillRect(-20, -20, V.W + 40, V.H + 40); c.strokeStyle = 'rgba(120,100,80,0.12)'; c.lineWidth = 2;
    for (let x = 0; x < V.W; x += 60) { c.beginPath(); c.moveTo(x, 0); c.lineTo(x, V.H); c.stroke(); } for (let y = 0; y < V.H; y += 60) { c.beginPath(); c.moveTo(0, y); c.lineTo(V.W, y); c.stroke(); }
  },
  player(c, p, g) {
    c.strokeStyle = 'rgba(232,69,60,0.18)'; c.lineWidth = 3; for (let i = 1; i <= 3; i++) { const r = ((g.t * 60 + i * 50) % 160) + 20; c.beginPath(); c.arc(p.x, p.y, r, 0, Math.PI * 2); c.stroke(); }
    c.save(); c.translate(p.x, p.y); Kid.emoji(c, '🧲', 0, 0, 70, Math.PI * 0.75); c.restore(); Kid.head(c, p.x + 26, p.y - 30, 18, {}, 20);
  },
  hudL: g => `　🧲 ${g.got}`,
});

// ---- 冰淇淋疊疊 ----
registerGame({
  id: 'icecream', name: '冰淇淋疊疊', icon: '🍦', color: '#f28fb8', tilt: true,
  desc: '傾斜手機移動甜筒接冰淇淋球，疊越高越會晃！（手機限定）',
  howto: '📱 手機限定：左右傾斜手機移動甜筒，接住掉下來的冰淇淋球疊起來！動作太快冰淇淋會晃，晃太大就會倒掉。不要接到 🥦 花椰菜（會把最上面那球弄掉）。倒掉 3 次就結束，限時 60 秒。（電腦用 ← → 鍵）',
  TIME: 60, COLS: ['#ffd3e0', '#8a5a34', '#c8f0c0', '#fff6c8', '#d8c8ff', '#ffb0a0'],
  start() { this.t = 0; this.left = this.TIME; this.score = 0; this.over = false; this.overText = ''; this.x = V.W / 2; this.vx = 0; this.sway = 0; this.sv = 0; this.stack = []; this.fall = []; this.spawnT = 0.5; this.lives = 3; this.best = 0; this.topple = 0; },
  get cy() { return V.H * 0.86; },
  tap() { Tilt.calibrate(); },
  update(dt) {
    this.t += dt; this.left -= dt; if (this.left <= 0) { this.left = 0; this.over = true; this.overText = `最高疊了 ${this.best} 球！`; return; }
    const ov = this.vx; this.vx += (Tilt.x * 900 - this.vx) * Math.min(1, dt * 6); this.x = clamp(this.x + this.vx * dt, 50, V.W - 50);
    const acc = (this.vx - ov) / Math.max(dt, 0.001), h = this.stack.length;
    this.sv += (-acc * 0.0006 * (1 + h * 0.12) - this.sway * 14 - this.sv * 3.2) * dt; this.sway += this.sv * dt;
    if (this.topple) { this.topple -= dt; if (this.topple <= 0) this.topple = 0; }
    else if (Math.abs(this.sway) > 0.55 && h) {
      this.lives--; Sfx.play('splash'); V.shake = 6; FX.text(this.x, this.cy - 120, '倒掉了！', '#e8453c', 34);
      this.stack.forEach((s, i) => this.fall.push({ x: this.x + Math.sin(this.sway) * (i + 1) * 30, y: this.cy - 40 - i * 30, vx: Math.sign(this.sway) * rand(100, 250), vy: -rand(100, 300), col: s, drop: 1 }));
      this.stack = []; this.sway = 0; this.sv = 0; this.topple = 1;
      if (this.lives <= 0) { this.over = true; this.overText = `最高疊了 ${this.best} 球！`; return; }
    }
    this.spawnT -= dt; if (this.spawnT <= 0) { const bad = Math.random() < 0.18; this.fall.push({ x: rand(50, V.W - 50), y: -30, vx: 0, vy: 160 + this.t * 3, col: bad ? null : pick(this.COLS), bad }); this.spawnT = rand(0.6, 1.2); }
    const topY = this.cy - 40 - this.stack.length * 30, topX = this.x + Math.sin(this.sway) * this.stack.length * 30;
    for (const f of this.fall) {
      if (f.drop) { f.vy += 1200 * dt; } f.x += f.vx * dt; f.y += f.vy * dt;
      if (!f.drop && !f.got && f.y >= topY - 10 && f.y <= topY + 20 && Math.abs(f.x - topX) < 44 && !this.topple) {
        f.got = 1;
        if (f.bad) { if (this.stack.length) { const s = this.stack.pop(); this.fall.push({ x: topX, y: topY, vx: rand(-150, 150), vy: -200, col: s, drop: 1 }); } Sfx.play('nope'); FX.text(topX, topY - 40, '噁！花椰菜', '#45ad4a', 26); }
        else { this.stack.push(f.col); this.best = Math.max(this.best, this.stack.length); const pts = 5 * this.stack.length; this.score += pts; Sfx.play('pop'); FX.text(topX, topY - 50, '+' + pts, '#ff7a00', 26); this.sv += rand(-0.3, 0.3); }
      }
      if (f.y > V.H + 40) f.got = 1;
    }
    this.fall = this.fall.filter(f => !f.got);
  },
  scoop(c, x, y, col) { Paper.circle(c, x, y, 30, col, { border: 3, blur: 3 }); c.fillStyle = 'rgba(255,255,255,0.5)'; c.beginPath(); c.arc(x - 10, y - 10, 7, 0, Math.PI * 2); c.fill(); },
  draw(c) {
    c.fillStyle = '#fff0f5'; c.fillRect(-20, -20, V.W + 40, V.H + 40); for (let i = 0; i < 12; i++) { c.fillStyle = i % 2 ? '#ffd3e0' : '#fff0f5'; c.fillRect(i * V.W / 12, 0, V.W / 12 + 1, V.H); }
    for (const f of this.fall) { if (f.bad) Kid.emoji(c, '🥦', f.x, f.y, 46); else this.scoop(c, f.x, f.y, f.col); }
    const x = this.x, y = this.cy;
    this.stack.forEach((s, i) => this.scoop(c, x + Math.sin(this.sway) * (i + 1) * 30, y - 40 - i * 30, s));
    Paper.shape(c, cc => { cc.moveTo(x - 34, y - 34); cc.lineTo(x + 34, y - 34); cc.lineTo(x, y + 50); cc.closePath(); }, '#e9a54b', { border: 4 });
    c.strokeStyle = '#c9772f'; c.lineWidth = 2; for (let i = -2; i <= 2; i++) { c.beginPath(); c.moveTo(x + i * 14, y - 34); c.lineTo(x + i * 5, y + 20); c.stroke(); }
    Kid.text(c, `${this.stack.length} 球`, x, y - 60 - this.stack.length * 30, 22, '#e86fae', 5);
    TiltUI.hint(c, this, Kid.portrait() ? 140 : 96);
  },
  hud() { return { L: `<b>${this.score}</b> 分　最高 ${this.best}`, R: TiltUI.lives(this.lives) + `　⏱ ${Math.ceil(this.left)}` }; },
});

// ---- 泡泡飄飄 ----
TiltRun({
  id: 'bubblefloat', name: '泡泡飄飄', icon: '💭', color: '#7fc8f0', dir: 'down', kid: true, lives: 3, speed: 170, gap: 0.75, pr: 40,
  desc: '紙片人坐在大泡泡裡往天上飄，閃開尖尖的東西！（手機限定）',
  howto: '📱 手機限定：紙片人坐在泡泡裡往上飄！左右傾斜手機移動，吃 ⭐ 星星和 🌸 花瓣，閃開 🐝 蜜蜂和 🌵 仙人掌，不然泡泡會被戳破！破 3 次就結束，限時 45 秒。（電腦用 ← → 鍵）',
  end: '飄到好高好高！', lose: '泡泡破掉了！', ouch: '啵！',
  items: [{ e: '⭐', pts: 10, r: 22, w: 4 }, { e: '🌸', pts: 15, r: 22, w: 3, wobble: 1 }, { e: '🍬', pts: 20, r: 22, w: 1 }, { e: '🐝', bad: 1, r: 24, w: 3, wave: 1 }, { e: '🌵', bad: 1, r: 28, w: 2 }],
  bg(c, g) { BG.sky(c, g); },
  player(c, x, y, g) {
    const w = Math.sin(g.t * 3) * 3;
    Kid.head(c, x, y + 4, 26, {}, 34);
    c.save(); c.fillStyle = 'rgba(190,230,255,0.25)'; c.strokeStyle = 'rgba(255,255,255,0.9)'; c.lineWidth = 3; c.beginPath(); c.ellipse(x, y, 46 + w, 46 - w, 0, 0, Math.PI * 2); c.fill(); c.stroke();
    const gr = c.createLinearGradient(x - 40, y - 40, x + 40, y + 40); gr.addColorStop(0, 'rgba(255,160,220,0.35)'); gr.addColorStop(0.5, 'rgba(160,255,220,0.1)'); gr.addColorStop(1, 'rgba(160,200,255,0.35)'); c.strokeStyle = gr; c.lineWidth = 6; c.stroke();
    c.fillStyle = 'rgba(255,255,255,0.85)'; c.beginPath(); c.ellipse(x - 18, y - 22, 9, 5, -0.6, 0, Math.PI * 2); c.fill(); c.restore();
  },
});

// ---- 澆花小幫手 ----
TiltRoam({
  id: 'watering', name: '澆花小幫手', icon: '🌷', color: '#45ad4a', kid: true, n: 0, r: 36, max: 420, TIME: 60,
  desc: '花花口渴了！傾斜手機把澆水壺移過去澆水！（手機限定）',
  howto: '📱 手機限定：花園裡的花會慢慢口渴（藍色的水會變少）。傾斜手機移動澆水壺，停在花上面就會澆水！花喝飽水就會開花得分。口渴太久會垂下來，趕快去救它！不會輸，限時 60 秒。（電腦用方向鍵）',
  end: '花園好漂亮！',
  init(g) {
    g.dtl = 1 / 60; g.pl = []; const P = Kid.portrait(), cols = P ? 3 : 4, rows = 2;
    for (let i = 0; i < cols * rows; i++) g.pl.push({ x: V.W * (i % cols + 0.5) / cols, y: (P ? V.H * 0.32 : V.H * 0.3) + Math.floor(i / cols) * V.H * (P ? 0.3 : 0.36), w: rand(0.4, 1), e: pick(['🌷', '🌻', '🌹', '🌼']), full: 0 });
  },
  tick(g, dt) {
    const p = g.p;
    for (const o of g.pl) {
      const near = Math.hypot(o.x - p.x, o.y - 40 - p.y) < 70;
      if (near) { o.w = Math.min(1, o.w + dt * 0.7); if (Math.random() < dt * 4) Sfx.play('splash'); if (o.w >= 1 && !o.full) { o.full = 1; g.score += 10; g.got++; Sfx.play('star'); FX.burst(o.x, o.y - 30, 12, undefined, 0.6); FX.text(o.x, o.y - 70, '喝飽了！+10', '#2f9be0', 26); } }
      else o.w = Math.max(0, o.w - dt * (0.06 + g.t / 1500));
      if (o.w < 0.6) o.full = 0;
      o.near = near;
    }
    if (Math.floor(g.t) !== Math.floor(g.t - dt)) g.score += g.pl.filter(o => o.w > 0.3).length;
  },
  bg(c, g) {
    RoamBG.grass(c, g, '#a8d68a');
    for (const o of g.pl) {
      const droop = o.w < 0.3 ? (0.3 - o.w) * 3 : 0;
      c.fillStyle = '#8a5a34'; c.beginPath(); c.ellipse(o.x, o.y + 30, 44, 14, 0, 0, Math.PI * 2); c.fill();
      c.strokeStyle = '#3d8b2a'; c.lineWidth = 5; c.beginPath(); c.moveTo(o.x, o.y + 30); c.quadraticCurveTo(o.x, o.y, o.x + droop * 30, o.y - 20 + droop * 20); c.stroke();
      Kid.emoji(c, o.w > 0.3 ? o.e : '🥀', o.x + droop * 30, o.y - 30 + droop * 24, o.full ? 54 + Math.sin(g.t * 6) * 3 : 44, droop);
      c.fillStyle = '#ffffff'; c.fillRect(o.x - 30, o.y + 50, 60, 8); c.fillStyle = o.w < 0.3 ? '#e8453c' : '#4fb3e8'; c.fillRect(o.x - 30, o.y + 50, 60 * o.w, 8);
      if (o.w < 0.3) Kid.emoji(c, '💦', o.x + 30, o.y - 60, 26);
    }
  },
  player(c, p, g) {
    const pour = g.pl.some(o => o.near);
    if (pour) { c.fillStyle = 'rgba(80,170,240,0.7)'; for (let i = 0; i < 6; i++) { c.beginPath(); c.arc(p.x - 40 + Math.sin(i * 3 + g.t * 9) * 8, p.y + 20 + ((g.t * 200 + i * 20) % 60), 3, 0, Math.PI * 2); c.fill(); } }
    c.save(); c.translate(p.x, p.y); c.rotate(pour ? -0.35 : 0);
    Paper.rect(c, -26, -24, 52, 46, '#4fb3e8', 10, { border: 3, blur: 5 });
    Paper.shape(c, cc => { cc.moveTo(-24, 0); cc.lineTo(-58, -26); cc.lineTo(-54, -32); cc.lineTo(-20, -12); cc.closePath(); }, '#4fb3e8', { border: 3 });
    c.strokeStyle = '#2f7fc1'; c.lineWidth = 6; c.beginPath(); c.arc(10, -24, 18, Math.PI, 0); c.stroke();
    c.restore(); Kid.head(c, p.x + 4, p.y - 2, 14, {}, 16);
  },
  thing: () => ({}), touch() { },
  hudL: g => `　🌷 ${g.got}`,
});
