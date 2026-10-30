'use strict';
// =====================================================
//  大朋友動腦第三彈：泡泡射擊、水果三消、找不同、水管接接樂、顏色填滿
// =====================================================

// ---- 泡泡射擊 ----
registerGame({
  id: 'bubbleshoot', name: '泡泡射擊', icon: '🔵', color: '#3f8fe0',
  desc: '瞄準射出泡泡，3 顆同色連在一起就會破掉！',
  howto: '手指按住畫面瞄準，放開就射出泡泡（會碰牆反彈）。3 顆以上同顏色連在一起就會破掉，沒有連到天花板的泡泡也會一起掉下來！每射 7 發天花板會往下壓，泡泡壓到底線就結束。',
  COLS: ['#e8453c', '#3f8fe0', '#ffd23f', '#45ad4a', '#c77dff'],
  start() {
    this.t = 0; this.score = 0; this.over = false; this.overText = ''; this.shift = 0; this.shots = 0; this.ball = null; this.fall = []; this.pop = [];
    this.geo(); this.grid = []; for (let r = 0; r < 6; r++) this.grid.push(this.newRow(r));
    this.next = this.pickCol(); this.cur = this.pickCol(); this.aim = -Math.PI / 2; this.aiming = false;
  },
  geo() { const P = Kid.portrait(), N = P ? 9 : 11, W = Math.min(V.W - 20, P ? 520 : 560), D = W / (N + 0.5), top = P ? 120 : 76; this.G = { N, D, x0: V.W / 2 - W / 2 + D / 2, y0: top + D / 2, W, gy: V.H - (P ? 120 : 90) }; return this.G; },
  cols(r) { return (r + this.shift) % 2 ? this.G.N - 1 : this.G.N; },
  newRow(r) { const a = []; for (let c = 0; c < this.cols(r); c++) a.push(Math.floor(Math.random() * this.ncol())); return a; },
  ncol() { return Math.min(5, 3 + Math.floor(this.score / 300)); },
  pickCol() { const have = new Set(); this.grid.forEach(r => r.forEach(v => { if (v != null) have.add(v); })); const L = [...have]; return L.length ? pick(L) : Math.floor(Math.random() * this.ncol()); },
  pos(r, c) { const G = this.G; return { x: G.x0 + c * G.D + ((r + this.shift) % 2 ? G.D / 2 : 0), y: G.y0 + r * G.D * 0.866 }; },
  nbrs(r, c) { const o = (r + this.shift) % 2, L = [[r, c - 1], [r, c + 1]]; for (const dr of [-1, 1]) { if (o) L.push([r + dr, c], [r + dr, c + 1]); else L.push([r + dr, c - 1], [r + dr, c]); } return L.filter(([a, b]) => a >= 0 && b >= 0 && a < this.grid.length + 1 && b < this.cols(a)); },
  get(r, c) { return this.grid[r] ? this.grid[r][c] : undefined; },
  get gun() { return { x: V.W / 2, y: this.G.gy + 40 }; },
  tap(x, y) { if (!this.ball) this.aiming = true; },
  update(dt) {
    this.t += dt; const G = this.geo(), gun = this.gun;
    if (Input.down) { this.aim = clamp(Math.atan2(Input.y - gun.y, Input.x - gun.x), -Math.PI + 0.15, -0.15); }
    else if (this.aiming) { this.aiming = false; if (!this.ball) { this.ball = { x: gun.x, y: gun.y, vx: Math.cos(this.aim) * 900, vy: Math.sin(this.aim) * 900, col: this.cur }; this.cur = this.next; this.next = this.pickCol(); Sfx.play('swish'); } }
    for (const f of this.fall) { f.vy += 1400 * dt; f.y += f.vy * dt; f.x += f.vx * dt; } this.fall = this.fall.filter(f => f.y < V.H + 40);
    for (const p of this.pop) p.t += dt; this.pop = this.pop.filter(p => p.t < 0.3);
    const b = this.ball; if (!b) return;
    for (let s = 0; s < 3; s++) {
      b.x += b.vx * dt / 3; b.y += b.vy * dt / 3;
      const L = G.x0 - G.D / 2 + G.D / 2, R = G.x0 - G.D / 2 + G.W - G.D / 2;
      if (b.x < L) { b.x = L; b.vx = Math.abs(b.vx); } if (b.x > R) { b.x = R; b.vx = -Math.abs(b.vx); }
      let hit = b.y <= G.y0;
      if (!hit) for (let r = 0; r < this.grid.length && !hit; r++) for (let c = 0; c < this.grid[r].length; c++) { if (this.grid[r][c] == null) continue; const p = this.pos(r, c); if (Math.hypot(p.x - b.x, p.y - b.y) < G.D * 0.85) { hit = true; break; } }
      if (hit) { this.snap(b); this.ball = null; return; }
    }
  },
  snap(b) {
    const G = this.G; let best = null, bd = 1e9;
    for (let r = 0; r <= this.grid.length; r++) for (let c = 0; c < this.cols(r); c++) {
      if (this.get(r, c) != null) continue; const p = this.pos(r, c), d = Math.hypot(p.x - b.x, p.y - b.y); if (d > G.D * 1.5) continue;
      if (r > 0 && !this.nbrs(r, c).some(([a, k]) => this.get(a, k) != null)) continue; if (d < bd) { bd = d; best = [r, c]; } }
    if (!best) return;
    const [r, c] = best; while (this.grid.length <= r) this.grid.push(Array(this.cols(this.grid.length)).fill(null));
    this.grid[r][c] = b.col; Sfx.play('pop');
    // 同色群
    const same = this.flood(r, c, v => v === b.col);
    if (same.length >= 3) {
      same.forEach(([a, k]) => { const p = this.pos(a, k); this.pop.push({ x: p.x, y: p.y, col: this.COLS[this.grid[a][k]], t: 0 }); this.grid[a][k] = null; });
      let pts = same.length * 10; Sfx.play('star');
      const keep = new Set(); this.grid[0].forEach((v, k) => { if (v != null) this.flood(0, k, v => v != null).forEach(([a, kk]) => keep.add(a + ',' + kk)); });
      let n = 0; this.grid.forEach((row, a) => row.forEach((v, k) => { if (v != null && !keep.has(a + ',' + k)) { const p = this.pos(a, k); this.fall.push({ x: p.x, y: p.y, vx: rand(-80, 80), vy: rand(-200, 0), col: this.COLS[v] }); row[k] = null; n++; } }));
      pts += n * 20; this.score += pts; FX.text(b.x, b.y, n ? `+${pts} 掉下 ${n} 顆！` : `+${pts}`, '#ff7a00', 30);
    }
    while (this.grid.length && this.grid[this.grid.length - 1].every(v => v == null)) this.grid.pop();
    if (!this.grid.length || this.grid.every(r => r.every(v => v == null))) { this.score += 200; FX.text(V.W / 2, V.H * 0.4, '全部清光！+200', '#e0573c', 40); Sfx.play('win'); this.grid = []; for (let k = 0; k < 5; k++) this.grid.push(this.newRow(k)); }
    this.shots++;
    if (this.shots % 7 === 0) { this.shift ^= 1; this.grid.unshift(null); this.grid[0] = this.newRow(0); Sfx.play('thud'); V.shake = 4; }
    const lowest = this.grid.findLastIndex(row => row.some(v => v != null));
    if (lowest >= 0 && this.pos(lowest, 0).y + G.D / 2 > G.gy) { this.over = true; this.overText = '泡泡壓下來了！'; }
  },
  flood(r, c, f) { const seen = new Set([r + ',' + c]), q = [[r, c]], out = []; while (q.length) { const [a, k] = q.pop(); out.push([a, k]); for (const [x, y] of this.nbrs(a, k)) { const key = x + ',' + y, v = this.get(x, y); if (!seen.has(key) && v != null && f(v)) { seen.add(key); q.push([x, y]); } } } return out.filter(([a, k]) => f(this.get(a, k))); },
  bub(c, x, y, r, col) { Paper.circle(c, x, y, r, col, { border: 2, blur: 3 }); c.fillStyle = 'rgba(255,255,255,0.55)'; c.beginPath(); c.arc(x - r * 0.35, y - r * 0.35, r * 0.28, 0, Math.PI * 2); c.fill(); },
  draw(c) {
    const G = this.geo(); c.fillStyle = '#2c3e64'; c.fillRect(-20, -20, V.W + 40, V.H + 40);
    Paper.rect(c, V.W / 2 - G.W / 2 - 6, G.y0 - G.D / 2 - 6, G.W + 12, G.gy - G.y0 + G.D / 2 + 70, '#3d5285', 14, { border: 4 });
    c.strokeStyle = 'rgba(232,69,60,0.6)'; c.setLineDash([10, 10]); c.lineWidth = 3; c.beginPath(); c.moveTo(V.W / 2 - G.W / 2, G.gy); c.lineTo(V.W / 2 + G.W / 2, G.gy); c.stroke(); c.setLineDash([]);
    this.grid.forEach((row, r) => row.forEach((v, k) => { if (v == null) return; const p = this.pos(r, k); this.bub(c, p.x, p.y, G.D * 0.47, this.COLS[v]); }));
    for (const p of this.pop) { c.globalAlpha = 1 - p.t / 0.3; this.bub(c, p.x, p.y, G.D * 0.47 * (1 + p.t * 3), p.col); c.globalAlpha = 1; }
    for (const f of this.fall) this.bub(c, f.x, f.y, G.D * 0.45, f.col);
    const gun = this.gun;
    if (!this.ball) { c.fillStyle = 'rgba(255,255,255,0.7)'; let x = gun.x, y = gun.y, vx = Math.cos(this.aim), vy = Math.sin(this.aim); const L = G.x0, R = G.x0 + G.W - G.D; for (let i = 0; i < 26; i++) { x += vx * 22; y += vy * 22; if (x < L) { x = 2 * L - x; vx = -vx; } if (x > R) { x = 2 * R - x; vx = -vx; } if (y < G.y0) break; c.beginPath(); c.arc(x, y, 3, 0, Math.PI * 2); c.fill(); } }
    if (this.ball) this.bub(c, this.ball.x, this.ball.y, G.D * 0.47, this.COLS[this.ball.col]);
    else this.bub(c, gun.x, gun.y, G.D * 0.47, this.COLS[this.cur]);
    this.bub(c, gun.x + 80, gun.y + 10, G.D * 0.32, this.COLS[this.next]); Kid.text(c, '下一個', gun.x + 80, gun.y + 40, 14, '#ffffff', 0);
    Kid.head(c, gun.x - 80, gun.y, 24, {}, 28);
    const left = 7 - this.shots % 7; Kid.text(c, `再 ${left} 發往下壓`, gun.x - 80, gun.y + 44, 14, '#ffd23f', 0);
  },
  hud() { return { L: `<b>${this.score}</b> 分`, R: `🔵 射了 ${this.shots} 發` }; },
});

// ---- 水果三消 ----
registerGame({
  id: 'match3', name: '水果三消', icon: '🍇', color: '#8e4bc6',
  desc: '交換相鄰的水果，3 個一樣連成一排就會消掉！',
  howto: '點一個水果，再點它旁邊（上下左右）的水果交換位置，或直接往旁邊滑。3 個以上一樣的連成一直線或橫線就會消掉，上面的會掉下來，可能連鎖喔！一共 25 步，看你能拿多少分。',
  FR: ['🍎', '🍋', '🍇', '🍐', '🍊', '🍓'], N: 7, MOVES: 25,
  start() { this.t = 0; this.score = 0; this.over = false; this.overText = ''; this.moves = this.MOVES; this.sel = null; this.anim = 0; this.chain = 0; this.sw = Kid.makeSwipe(); this.fill(); },
  fill() { const N = this.N; do { this.g = [...Array(N)].map(() => [...Array(N)].map(() => ({ k: Math.floor(Math.random() * this.FR.length), dy: 0 }))); while (this.matches().length) this.matches().forEach(([r, c]) => this.g[r][c].k = Math.floor(Math.random() * this.FR.length)); } while (!this.hasMove()); },
  geo() { const P = Kid.portrait(), S = Math.min(V.W - 24, V.H - (P ? 260 : 120), 560), s = S / this.N; return { s, x0: V.W / 2 - S / 2, y0: (P ? 150 : 84) + (V.H - (P ? 260 : 120) - S) / 2 }; },
  matches() {
    const N = this.N, g = this.g, set = new Set();
    for (let r = 0; r < N; r++) for (let c = 0; c < N; c++) { const k = g[r][c].k; if (k < 0) continue;
      if (c <= N - 3 && g[r][c + 1].k === k && g[r][c + 2].k === k) { let e = c; while (e < N && g[r][e].k === k) set.add(r + ',' + e++); }
      if (r <= N - 3 && g[r + 1][c].k === k && g[r + 2][c].k === k) { let e = r; while (e < N && g[e][c].k === k) set.add(e++ + ',' + c); } }
    return [...set].map(s => s.split(',').map(Number));
  },
  swap(a, b) { const t = this.g[a[0]][a[1]]; this.g[a[0]][a[1]] = this.g[b[0]][b[1]]; this.g[b[0]][b[1]] = t; },
  hasMove() { const N = this.N; for (let r = 0; r < N; r++) for (let c = 0; c < N; c++) for (const [dr, dc] of [[0, 1], [1, 0]]) { const r2 = r + dr, c2 = c + dc; if (r2 >= N || c2 >= N) continue; this.swap([r, c], [r2, c2]); const ok = this.matches().length > 0; this.swap([r, c], [r2, c2]); if (ok) return true; } return false; },
  cellAt(x, y) { const G = this.geo(), c = Math.floor((x - G.x0) / G.s), r = Math.floor((y - G.y0) / G.s); return r >= 0 && c >= 0 && r < this.N && c < this.N ? [r, c] : null; },
  tap(x, y) { if (this.anim) return; this.sw.begin(x, y); const p = this.cellAt(x, y); if (!p) { this.sel = null; return; } if (this.sel && Math.abs(this.sel[0] - p[0]) + Math.abs(this.sel[1] - p[1]) === 1) { this.try(this.sel, p); this.sel = null; this.sw.on = false; return; } this.sel = p; Sfx.play('click'); },
  try(a, b) {
    this.swap(a, b);
    if (!this.matches().length) { this.swap(a, b); Sfx.play('nope'); this.bad = { a, b, t: 0.3 }; return; }
    this.moves--; this.chain = 0; Sfx.play('swish'); this.anim = 0.12; this.clearStep = true;
  },
  resolve() {
    const M = this.matches(); if (!M.length) { this.clearStep = false; if (!this.hasMove()) { FX.text(V.W / 2, V.H / 2, '沒有步可以走了，重新洗牌！', '#7a62b8', 30); this.fill(); } if (this.moves <= 0) { this.over = true; this.overText = '步數用完了！'; } return; }
    this.chain++; const G = this.geo(), pts = M.length * 10 * this.chain; this.score += pts; Sfx.play(this.chain > 1 ? 'star' : 'coin');
    let cx = 0, cy = 0; M.forEach(([r, c]) => { cx += c; cy += r; this.g[r][c].k = -1; }); cx /= M.length; cy /= M.length;
    FX.burst(G.x0 + (cx + 0.5) * G.s, G.y0 + (cy + 0.5) * G.s, 12, undefined, 0.6); FX.text(G.x0 + (cx + 0.5) * G.s, G.y0 + (cy + 0.5) * G.s, this.chain > 1 ? `連鎖 ${this.chain}！+${pts}` : '+' + pts, '#ff7a00', 30);
    for (let c = 0; c < this.N; c++) { const col = []; for (let r = this.N - 1; r >= 0; r--) if (this.g[r][c].k >= 0) col.push(this.g[r][c]); let r = this.N - 1, miss = 0; for (const cell of col) { const from = this.g.findIndex(row => row[c] === cell); cell.dy = (from - r) * G.s; this.g[r][c] = cell; r--; } while (r >= 0) { miss++; this.g[r][c] = { k: Math.floor(Math.random() * this.FR.length), dy: -miss * G.s - G.s }; r--; } }
    this.anim = 0.35;
  },
  update(dt) {
    this.t += dt; if (this.bad) { this.bad.t -= dt; if (this.bad.t <= 0) this.bad = null; }
    for (const row of this.g) for (const cell of row) cell.dy = cell.dy > 0 ? Math.max(0, cell.dy - dt * 1400) : Math.min(0, cell.dy + dt * 1400);
    if (this.anim) { this.anim -= dt; if (this.anim <= 0) { this.anim = 0; if (this.clearStep) this.resolve(); } return; }
    this.sw.step(e => { const dx = e.x - e.x0, dy = e.y - e.y0; if (Math.hypot(dx, dy) < 25) return; const a = this.cellAt(e.x0, e.y0); if (!a) return; const b = Math.abs(dx) > Math.abs(dy) ? [a[0], a[1] + Math.sign(dx)] : [a[0] + Math.sign(dy), a[1]]; if (b[0] < 0 || b[1] < 0 || b[0] >= this.N || b[1] >= this.N) return; this.sel = null; this.try(a, b); });
  },
  draw(c) {
    c.fillStyle = '#f5e9ff'; c.fillRect(-20, -20, V.W + 40, V.H + 40); const G = this.geo(), N = this.N;
    Paper.rect(c, G.x0 - 10, G.y0 - 10, G.s * N + 20, G.s * N + 20, '#ffffff', 18, { border: 5 });
    c.save(); c.beginPath(); c.rect(G.x0, G.y0, G.s * N, G.s * N); c.clip();
    for (let r = 0; r < N; r++) for (let k = 0; k < N; k++) { const x = G.x0 + (k + 0.5) * G.s, y = G.y0 + (r + 0.5) * G.s; c.fillStyle = (r + k) % 2 ? '#f3eafc' : '#fbf6ff'; c.fillRect(x - G.s / 2, y - G.s / 2, G.s, G.s); }
    for (let r = 0; r < N; r++) for (let k = 0; k < N; k++) { const cell = this.g[r][k]; if (cell.k < 0) continue; const sel = this.sel && this.sel[0] === r && this.sel[1] === k, bad = this.bad && [this.bad.a, this.bad.b].some(p => p[0] === r && p[1] === k);
      const x = G.x0 + (k + 0.5) * G.s + (bad ? Math.sin(this.t * 60) * 5 : 0), y = G.y0 + (r + 0.5) * G.s + cell.dy; if (sel) Paper.circle(c, x, y, G.s * 0.46, '#ffe680', { border: 0, shadow: false }); Kid.emoji(c, this.FR[cell.k], x, y, G.s * (sel ? 0.8 : 0.72), sel ? Math.sin(this.t * 10) * 0.15 : 0); }
    c.restore();
  },
  hud() { return { L: `<b>${this.score}</b> 分`, R: `👆 剩 ${this.moves} 步` }; },
});

// ---- 找不同 ----
registerGame({
  id: 'spotdiff', name: '找不同', icon: '🔍', color: '#2f8fa5',
  desc: '上下兩張圖有 5 個地方不一樣，把它們找出來！',
  howto: '兩張圖看起來一樣，其實有 5 個地方不同（東西換了、不見了、或多了一個）。在任何一張圖上點出不一樣的地方！點錯會扣時間。一共 4 關，越快找完分數越高。',
  POOL: ['🍎', '🍌', '🐶', '🐱', '🚗', '⚽', '🎈', '⭐', '🌙', '☂️', '🎸', '⏰', '🔑', '🧸', '🎩', '🍦', '🐢', '🦋', '🌻', '🍄', '🐝', '🐳', '🌳', '🏠', '☁️', '🚲', '🍩', '🐸', '🎁', '🌈'],
  start() { this.t = 0; this.score = 0; this.over = false; this.overText = '眼力超好！'; this.k = 0; this.newRound(); },
  boxes() { const P = Kid.portrait(), top = P ? 120 : 80; if (P) { const h = (V.H - top - 30) / 2 - 8; return [{ x: 12, y: top, w: V.W - 24, h }, { x: 12, y: top + h + 16, w: V.W - 24, h }]; } const w = (V.W - 36) / 2; return [{ x: 12, y: top, w, h: V.H - top - 20 }, { x: 24 + w, y: top, w, h: V.H - top - 20 }]; },
  newRound() {
    const n = 14 + this.k * 3, s = 0.11; this.A = []; let tries = 0;
    while (this.A.length < n && tries++ < 3000) { const u = rand(0.07, 0.93), v = rand(0.08, 0.92); if (this.A.every(o => Math.hypot((o.u - u) * 1.3, o.v - v) > s * 1.15)) this.A.push({ u, v, e: pick(this.POOL), sz: rand(0.85, 1.15), rot: rand(-0.3, 0.3) }); }
    this.B = this.A.map(o => ({ ...o })); this.diffs = []; const idx = Kid.shuffle(this.A.map((_, i) => i)).slice(0, 5);
    idx.forEach((i, j) => { const kind = j % 3; if (kind === 0) { let e; do e = pick(this.POOL); while (e === this.A[i].e); this.B[i].e = e; } else if (kind === 1) { (Math.random() < 0.5 ? this.A : this.B)[i].gone = 1; } else { this.B[i].e = this.A[i].e; this.B[i].sz *= 1.6; } this.diffs.push({ u: this.A[i].u, v: this.A[i].v, found: 0 }); });
    this.rt = 0; this.doneT = 0; this.miss = [];
  },
  tap(x, y) {
    if (this.doneT) return;
    for (const B of this.boxes()) { if (x < B.x || y < B.y || x > B.x + B.w || y > B.y + B.h) continue; const u = (x - B.x) / B.w, v = (y - B.y) / B.h, s = Math.min(B.w, B.h);
      const d = this.diffs.find(d => !d.found && Math.hypot((d.u - u) * B.w, (d.v - v) * B.h) < s * 0.09);
      if (d) { d.found = 1; this.score += 10; Sfx.play('ding'); if (this.diffs.every(d => d.found)) { const b = Math.max(0, Math.round(50 - this.rt)); this.score += b; this.doneT = 1.8; Sfx.play('win'); FX.text(V.W / 2, V.H / 2, b ? `全部找到！+${b}` : '全部找到！', '#e0573c', 40); } }
      else if (!this.diffs.some(d => d.found && Math.hypot((d.u - u) * B.w, (d.v - v) * B.h) < s * 0.09)) { this.rt += 3; Sfx.play('nope'); this.miss.push({ x, y, t: 0.8 }); }
      return; }
  },
  update(dt) { this.t += dt; for (const m of this.miss) m.t -= dt; this.miss = this.miss.filter(m => m.t > 0); if (this.doneT) { this.doneT -= dt; if (this.doneT <= 0) { this.k++; if (this.k >= 4) { this.over = true; return; } this.newRound(); } } else this.rt += dt; },
  draw(c) {
    c.fillStyle = '#e4f1f4'; c.fillRect(-20, -20, V.W + 40, V.H + 40);
    this.boxes().forEach((B, bi) => {
      Paper.rect(c, B.x, B.y, B.w, B.h, '#fffdf5', 16, { border: 4 }); const L = bi ? this.B : this.A, s = Math.min(B.w, B.h);
      for (const o of L) if (!o.gone) Kid.emoji(c, o.e, B.x + o.u * B.w, B.y + o.v * B.h, s * 0.1 * o.sz, o.rot);
      for (const d of this.diffs) if (d.found) { c.strokeStyle = '#e8453c'; c.lineWidth = 4; c.beginPath(); c.arc(B.x + d.u * B.w, B.y + d.v * B.h, s * 0.08, 0, Math.PI * 2); c.stroke(); }
    });
    for (const m of this.miss) Kid.text(c, '✕', m.x, m.y, 40, `rgba(122,98,184,${m.t})`, 0);
  },
  hud() { return { L: `<b>${this.score}</b> 分　🔍 ${this.diffs.filter(d => d.found).length}/5`, R: `第 ${Math.min(this.k + 1, 4)} / 4 關　⏱ ${Math.floor(this.rt)}` }; },
});

// ---- 水管接接樂 ----
registerGame({
  id: 'pipes', name: '水管接接樂', icon: '🚰', color: '#2f7fc1',
  desc: '點水管轉方向，讓水從水龍頭流到每一格！',
  howto: '點一格水管它就會轉 90 度。把所有水管接好，讓水從左邊的水龍頭流過「每一格」，全部變藍色就過關！一共 4 關，點越少下分數越高。',
  SZ: [4, 5, 6, 7],
  start() { this.t = 0; this.score = 0; this.over = false; this.overText = '水管工人！'; this.lv = 0; this.newLevel(); },
  newLevel() {
    const n = this.SZ[this.lv]; this.n = n; const m = [...Array(n)].map(() => Array(n).fill(0)), D = [[0, -1, 1, 4], [1, 0, 2, 8], [0, 1, 4, 1], [-1, 0, 8, 2]];
    this.src = [0, Math.floor(n / 2)]; const seen = new Set([this.src + '']), st = [this.src];
    while (st.length) { const [x, y] = st[st.length - 1], opts = Kid.shuffle(D.slice()).filter(([dx, dy]) => { const a = x + dx, b = y + dy; return a >= 0 && b >= 0 && a < n && b < n && !seen.has(a + ',' + b); }); if (!opts.length) { st.pop(); continue; } const [dx, dy, bit, back] = opts[0]; m[y][x] |= bit; m[y + dy][x + dx] |= back; seen.add((x + dx) + ',' + (y + dy)); st.push([x + dx, y + dy]); }
    m[this.src[1]][0] |= 8; this.sol = m.map(r => r.slice()); this.m = m.map(r => r.map(v => { let k = Math.floor(Math.random() * 4); while (k--) v = this.rot(v); return v; }));
    this.taps = 0; this.doneT = 0; this.spin = m.map(r => r.map(() => 0)); this.flow();
  },
  rot(v) { return ((v << 1) | (v >> 3)) & 15; },
  flow() {
    const n = this.n, w = this.wet = [...Array(n)].map(() => Array(n).fill(0)); const [sx, sy] = this.src; if (!(this.m[sy][sx] & 8)) return 0;
    const q = [[sx, sy]]; w[sy][sx] = 1; let k = 1;
    while (q.length) { const [x, y] = q.shift(), v = this.m[y][x]; for (const [dx, dy, bit, back] of [[0, -1, 1, 4], [1, 0, 2, 8], [0, 1, 4, 1], [-1, 0, 8, 2]]) { const a = x + dx, b = y + dy; if (!(v & bit) || a < 0 || b < 0 || a >= n || b >= n || w[b][a] || !(this.m[b][a] & back)) continue; w[b][a] = 1; k++; q.push([a, b]); } }
    return k;
  },
  geo() { const P = Kid.portrait(), S = Math.min(V.W - 80, V.H - (P ? 250 : 130), 540), s = S / this.n; return { s, x0: V.W / 2 - S / 2 + 20, y0: (P ? 140 : 84) + (V.H - (P ? 250 : 130) - S) / 2 }; },
  tap(x, y) {
    if (this.doneT) return; const G = this.geo(), c = Math.floor((x - G.x0) / G.s), r = Math.floor((y - G.y0) / G.s); if (c < 0 || r < 0 || c >= this.n || r >= this.n) return;
    this.m[r][c] = this.rot(this.m[r][c]); this.spin[r][c] = 1; this.taps++; Sfx.play('click');
    if (this.flow() === this.n * this.n) { const pts = Math.max(20, 100 - Math.max(0, this.taps - this.n * this.n) * 2); this.score += pts; this.doneT = 1.8; Sfx.play('splash'); Sfx.play('win'); FX.burst(V.W / 2, V.H / 2, 30, ['#4fb3e8', '#bfe8ff', '#ffffff'], 1); FX.text(V.W / 2, G.y0 - 30, `通了！+${pts}`, '#2f7fc1', 40); }
  },
  update(dt) { this.t += dt; for (const r of this.spin) for (let i = 0; i < r.length; i++) r[i] = Math.max(0, r[i] - dt * 6); if (this.doneT) { this.doneT -= dt; if (this.doneT <= 0) { if (this.lv + 1 >= this.SZ.length) { this.over = true; return; } this.lv++; this.newLevel(); } } },
  draw(c) {
    c.fillStyle = '#e3ecf3'; c.fillRect(-20, -20, V.W + 40, V.H + 40); const G = this.geo(), n = this.n, s = G.s;
    Paper.rect(c, G.x0 - 8, G.y0 - 8, s * n + 16, s * n + 16, '#c9b49a', 12, { border: 4 });
    for (let r = 0; r < n; r++) for (let k = 0; k < n; k++) {
      const x = G.x0 + (k + 0.5) * s, y = G.y0 + (r + 0.5) * s, v = this.m[r][k], wet = this.wet[r][k];
      c.fillStyle = (r + k) % 2 ? '#d8c6ae' : '#e2d2bc'; c.fillRect(x - s / 2, y - s / 2, s, s);
      c.save(); c.translate(x, y); c.rotate(-this.spin[r][k] * Math.PI / 2);
      const arm = (bit, a) => { if (!(v & bit)) return; c.save(); c.rotate(a); c.fillStyle = '#6a7380'; c.fillRect(-s * 0.17, -s / 2, s * 0.34, s / 2 + s * 0.17); c.fillStyle = wet ? '#4fb3e8' : '#9aa3b0'; c.fillRect(-s * 0.1, -s / 2, s * 0.2, s / 2 + s * 0.1); c.restore(); };
      arm(1, 0); arm(2, Math.PI / 2); arm(4, Math.PI); arm(8, -Math.PI / 2);
      Paper.circle(c, 0, 0, s * 0.17, wet ? '#4fb3e8' : '#9aa3b0', { border: 0, shadow: false });
      c.restore();
    }
    const sy = G.y0 + (this.src[1] + 0.5) * G.s; Paper.rect(c, G.x0 - 60, sy - 18, 52, 36, '#8a8f99', 8, { border: 3 }); Kid.emoji(c, '🚰', G.x0 - 40, sy - 36, 44);
    Kid.text(c, `第 ${this.lv + 1} 關　點了 ${this.taps} 下`, V.W / 2, V.H - (Kid.portrait() ? 70 : 24), 22, '#2f7fc1', 5);
  },
  hud() { return { L: `<b>${this.score}</b> 分`, R: `💧 ${this.wet.flat().filter(Boolean).length} / ${this.n * this.n}` }; },
});

// ---- 顏色填滿 ----
registerGame({
  id: 'colorflood', name: '顏色填滿', icon: '🟦', color: '#e9654b',
  desc: '從左上角開始換顏色，在步數內把整張圖變成同一個顏色！',
  howto: '左上角那一塊會變成你點的顏色，跟它相連、一樣顏色的格子就會被「吃進來」。在限制的步數內把整張圖都變成同一個顏色就過關！一共 3 關，剩越多步分數越高。',
  COLS: ['#e8453c', '#3f8fe0', '#ffd23f', '#45ad4a', '#c77dff', '#ff9a2e'], LV: [[8, 4, 13], [10, 5, 20], [12, 6, 26]],
  start() { this.t = 0; this.score = 0; this.over = false; this.overText = '全部填滿了！'; this.lv = 0; this.newLevel(); },
  newLevel() { const [n, k, mv] = this.LV[this.lv]; this.n = n; this.nc = k; this.left = mv; this.g = [...Array(n)].map(() => [...Array(n)].map(() => Math.floor(Math.random() * k))); this.doneT = 0; this.grow = 0; this.region(); },
  region() { const n = this.n, c0 = this.g[0][0], seen = new Set(['0,0']), q = [[0, 0]]; while (q.length) { const [x, y] = q.pop(); for (const [a, b] of [[x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]]) { if (a < 0 || b < 0 || a >= n || b >= n || seen.has(a + ',' + b) || this.g[b][a] !== c0) continue; seen.add(a + ',' + b); q.push([a, b]); } } this.mine = seen; return seen; },
  geo() { const P = Kid.portrait(), S = Math.min(V.W - 30, V.H - (P ? 300 : 200), 500), s = S / this.n; return { s, x0: V.W / 2 - S / 2, y0: (P ? 140 : 84) + (V.H - (P ? 300 : 200) - S) / 2 }; },
  btn(i) { const P = Kid.portrait(), w = Math.min(80, (V.W - 40) / this.nc - 10); return { x: V.W / 2 + (i - (this.nc - 1) / 2) * (w + 10), y: V.H - (P ? 90 : 60), w, h: w }; },
  tap(x, y) {
    if (this.doneT) return;
    for (let i = 0; i < this.nc; i++) if (Kid.hit(this.btn(i), x, y)) {
      if (i === this.g[0][0]) return; const before = this.mine.size;
      for (const k of this.mine) { const [a, b] = k.split(',').map(Number); this.g[b][a] = i; } this.region(); this.left--; this.grow = 0.3;
      Sfx.play(this.mine.size - before > 3 ? 'coin' : 'click');
      if (this.mine.size === this.n * this.n) { const pts = 40 + this.left * 15; this.score += pts; this.doneT = 1.8; Sfx.play('win'); FX.burst(V.W / 2, V.H / 2, 30, undefined, 1); FX.text(V.W / 2, V.H * 0.3, `填滿了！+${pts}`, '#e0573c', 40); }
      else if (this.left <= 0) { this.over = true; this.overText = `差一點！還有 ${this.n * this.n - this.mine.size} 格`; Sfx.play('over'); }
      return;
    }
  },
  update(dt) { this.t += dt; this.grow = Math.max(0, this.grow - dt); if (this.doneT) { this.doneT -= dt; if (this.doneT <= 0) { if (this.lv + 1 >= this.LV.length) { this.over = true; return; } this.lv++; this.newLevel(); } } },
  draw(c) {
    c.fillStyle = '#fbf3e6'; c.fillRect(-20, -20, V.W + 40, V.H + 40); const G = this.geo(), n = this.n;
    Paper.rect(c, G.x0 - 8, G.y0 - 8, G.s * n + 16, G.s * n + 16, '#ffffff', 12, { border: 5 });
    for (let r = 0; r < n; r++) for (let k = 0; k < n; k++) { c.fillStyle = this.COLS[this.g[r][k]]; c.fillRect(G.x0 + k * G.s, G.y0 + r * G.s, G.s + 0.5, G.s + 0.5); }
    c.strokeStyle = 'rgba(255,255,255,0.85)'; c.lineWidth = 3; for (const key of this.mine) { const [a, b] = key.split(',').map(Number); const x = G.x0 + a * G.s, y = G.y0 + b * G.s; c.globalAlpha = 0.25 + this.grow; c.fillStyle = '#ffffff'; c.fillRect(x + G.s * 0.4, y + G.s * 0.4, G.s * 0.2, G.s * 0.2); c.globalAlpha = 1; }
    Kid.head(c, G.x0 + G.s / 2, G.y0 + G.s / 2, G.s * 0.35, {}, G.s * 0.45);
    for (let i = 0; i < this.nc; i++) { const b = this.btn(i); Kid.button(c, b, '', this.COLS[i], { alpha: i === this.g[0][0] ? 0.35 : 1 }); }
    Kid.text(c, `剩 ${this.left} 步`, V.W / 2, G.y0 + G.s * n + 34, 28, this.left <= 3 ? '#e8453c' : '#4a3520', 6);
  },
  hud() { return { L: `<b>${this.score}</b> 分`, R: `第 ${this.lv + 1} / ${this.LV.length} 關　${this.mine.size}/${this.n * this.n}` }; },
});
