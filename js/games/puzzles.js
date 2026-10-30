'use strict';
// =====================================================
//  動腦遊戲：數字拼盤、踩地雷、水果數獨、推箱子
// =====================================================

// ---- 數字拼盤 ----
registerGame({
  id: 'slide', name: '數字拼盤', icon: '🧮', color: '#5b6fd6',
  desc: '滑動方塊，把數字照順序排好！',
  howto: '點空格旁邊的方塊，它就會滑到空格裡。把數字從 1 開始照順序排好（空格在最後）就過關！第一關 3×3，第二關 4×4。',
  start() { this.t = 0; this.score = 0; this.over = false; this.overText = '排序大師！'; this.lv = 0; this.newLevel(); },
  newLevel() {
    const n = this.lv ? 4 : 3; this.n = n; this.b = [...Array(n * n).keys()].map(i => (i + 1) % (n * n)); let e = n * n - 1, last = -1;
    for (let k = 0; k < (n === 3 ? 60 : 160); k++) { const nb = this.nbrs(e).filter(i => i !== last); const j = pick(nb); [this.b[e], this.b[j]] = [this.b[j], this.b[e]]; last = e; e = j; }
    this.moves = 0; this.lt = 0; this.done = 0; this.anim = {};
  },
  nbrs(i) { const n = this.n, x = i % n, y = Math.floor(i / n), r = []; if (x > 0) r.push(i - 1); if (x < n - 1) r.push(i + 1); if (y > 0) r.push(i - n); if (y < n - 1) r.push(i + n); return r; },
  geo() { const s = Math.min(V.W - 40, V.H - 260, 520), cs = s / this.n; return { x: V.W / 2 - s / 2, y: (V.H - s) / 2 + 30, s, cs }; },
  tap(x, y) {
    if (this.done) return; const G = this.geo(), cx = Math.floor((x - G.x) / G.cs), cy = Math.floor((y - G.y) / G.cs); if (cx < 0 || cy < 0 || cx >= this.n || cy >= this.n) return;
    const i = cy * this.n + cx, e = this.b.indexOf(0); if (!this.nbrs(e).includes(i)) { Sfx.play('nope'); return; }
    this.anim[this.b[i]] = { from: i, t: 0 }; [this.b[e], this.b[i]] = [this.b[i], this.b[e]]; this.moves++; Sfx.play('flip');
    if (this.b.every((v, k) => v === (k + 1) % (this.n * this.n))) { this.done = 2; const pts = Math.max(50, (this.n === 3 ? 200 : 400) - this.moves * 2 - Math.round(this.lt)); this.score += pts; Sfx.play('win'); FX.burst(V.W / 2, V.H / 2, 40, undefined, 1.2); FX.text(V.W / 2, V.H * 0.2, `完成！+${pts}`, '#e0573c', 44); }
  },
  update(dt) { this.t += dt; if (!this.done) this.lt += dt; for (const k in this.anim) { this.anim[k].t += dt * 8; if (this.anim[k].t >= 1) delete this.anim[k]; } if (this.done) { this.done -= dt; if (this.done <= 0) { if (this.lv >= 1) { this.over = true; return; } this.lv++; this.newLevel(); } } },
  draw(c) {
    c.fillStyle = '#e8ecf5'; c.fillRect(-20, -20, V.W + 40, V.H + 40); const G = this.geo(), n = this.n;
    Paper.rect(c, G.x - 10, G.y - 10, G.s + 20, G.s + 20, '#5b6fd6', 16, { border: 5 });
    const cols = ['#e8453c', '#ff8a1f', '#ffcc1f', '#45ad4a', '#3fa9e0', '#9b5bd6', '#ff7eb6', '#2fa58c'];
    this.b.forEach((v, i) => { if (!v) return; let x = i % n, y = Math.floor(i / n); const a = this.anim[v]; if (a) { const fx = a.from % n, fy = Math.floor(a.from / n), k = 1 - Math.pow(1 - a.t, 3); x = fx + (x - fx) * k; y = fy + (y - fy) * k; }
      const ok = v === i + 1; Paper.rect(c, G.x + x * G.cs + 4, G.y + y * G.cs + 4, G.cs - 8, G.cs - 8, ok ? cols[(v - 1) % 8] : '#fffdf5', 12, { border: 3 }); Kid.text(c, String(v), G.x + (x + 0.5) * G.cs, G.y + (y + 0.5) * G.cs + 2, G.cs * 0.42, ok ? '#ffffff' : '#4a3520', 0); });
    Kid.text(c, `步數 ${this.moves}　時間 ${Math.floor(this.lt)} 秒`, V.W / 2, G.y + G.s + 44, 22, '#4a3520');
  },
  hud() { return { L: `<b>${this.score}</b> 分`, R: `第 ${this.lv + 1} / 2 關（${this.n}×${this.n}）` }; },
});

// ---- 踩地雷 ----
registerGame({
  id: 'mines', name: '踩地雷', icon: '💣', color: '#6a6f86',
  desc: '找出所有安全的格子，不要踩到地雷！',
  howto: '點格子把它翻開。數字代表旁邊 8 格裡有幾顆地雷。覺得是地雷就切到「🚩 插旗」模式再點它做記號。把所有安全的格子都翻開就贏了！第一下一定安全。',
  start() {
    this.t = 0; this.score = 0; this.over = false; this.overText = ''; const P = Kid.portrait(); this.W = P ? 8 : 12; this.H = P ? 11 : 8; this.M = P ? 13 : 15;
    this.cells = Array.from({ length: this.W * this.H }, () => ({ m: 0, n: 0, open: 0, flag: 0 })); this.first = true; this.flagMode = false; this.end = 0; this.lt = 0; this.boom = -1;
  },
  geo() { const P = Kid.portrait(), top = P ? 120 : 76, cs = Math.min((V.W - 30) / this.W, (V.H - top - (P ? 130 : 40)) / this.H); return { cs, x: P ? V.W / 2 - cs * this.W / 2 : V.W * 0.44 - cs * this.W / 2, y: top }; },
  get btn() { const P = Kid.portrait(); return { x: P ? V.W / 2 : V.W - 110, y: P ? V.H - 60 : V.H / 2, w: 190, h: 64 }; },
  around(i, f) { const x = i % this.W, y = Math.floor(i / this.W); for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) { if (!dx && !dy) continue; const xx = x + dx, yy = y + dy; if (xx >= 0 && yy >= 0 && xx < this.W && yy < this.H) f(yy * this.W + xx); } },
  lay(safe) { const no = new Set([safe]); this.around(safe, j => no.add(j)); let k = 0; while (k < this.M) { const i = Math.floor(Math.random() * this.cells.length); if (no.has(i) || this.cells[i].m) continue; this.cells[i].m = 1; k++; } this.cells.forEach((c, i) => { let n = 0; this.around(i, j => n += this.cells[j].m); c.n = n; }); },
  open(i) { const s = [i]; while (s.length) { const k = s.pop(), c = this.cells[k]; if (c.open || c.flag) continue; c.open = 1; this.score += 1; if (!c.n && !c.m) this.around(k, j => { if (!this.cells[j].open) s.push(j); }); } },
  tap(x, y) {
    if (this.end) return; if (Kid.hit(this.btn, x, y)) { this.flagMode = !this.flagMode; Sfx.play('click'); return; }
    const G = this.geo(), cx = Math.floor((x - G.x) / G.cs), cy = Math.floor((y - G.y) / G.cs); if (cx < 0 || cy < 0 || cx >= this.W || cy >= this.H) return;
    const i = cy * this.W + cx, c = this.cells[i]; if (c.open) return;
    if (this.flagMode) { c.flag = !c.flag; Sfx.play('pop'); return; }
    if (c.flag) return; if (this.first) { this.first = false; this.lay(i); }
    if (c.m) { c.open = 1; this.boom = i; this.end = 2.2; Sfx.play('boom'); V.shake = 14; this.overText = '踩到地雷了！'; this.cells.forEach(q => { if (q.m) q.open = 1; }); return; }
    this.open(i); Sfx.play('flip');
    if (this.cells.every(q => q.m || q.open)) { this.end = 2.2; this.score += 150 + Math.max(0, 200 - Math.round(this.lt)); this.overText = `全部清除！${Math.floor(this.lt)} 秒`; Sfx.play('win'); FX.burst(V.W / 2, V.H / 2, 50, undefined, 1.3); }
  },
  update(dt) { this.t += dt; if (!this.first && !this.end) this.lt += dt; if (this.end) { this.end -= dt; if (this.end <= 0) this.over = true; } },
  draw(c) {
    c.fillStyle = '#c9d6c0'; c.fillRect(-20, -20, V.W + 40, V.H + 40); const G = this.geo(), cs = G.cs, NC = ['', '#3f6fe0', '#45ad4a', '#e8453c', '#5b2f7a', '#8a3a1a', '#2fa58c', '#222', '#888'];
    this.cells.forEach((q, i) => { const x = G.x + (i % this.W) * cs, y = G.y + Math.floor(i / this.W) * cs;
      if (q.open) { c.fillStyle = i === this.boom ? '#ff6b6b' : '#f2ead8'; c.fillRect(x + 1, y + 1, cs - 2, cs - 2); if (q.m) Kid.emoji(c, '💣', x + cs / 2, y + cs / 2, cs * 0.65); else if (q.n) Kid.text(c, String(q.n), x + cs / 2, y + cs / 2 + 1, cs * 0.55, NC[q.n], 0); }
      else { Paper.rect(c, x + 2, y + 2, cs - 4, cs - 4, '#7dbb5c', 5, { border: 0, blur: 2, oy: 2 }); if (q.flag) Kid.emoji(c, '🚩', x + cs / 2, y + cs / 2, cs * 0.6); } });
    const left = this.M - this.cells.filter(q => q.flag).length;
    Kid.button(c, this.btn, this.flagMode ? '🚩 插旗中' : '👆 翻開中', this.flagMode ? '#e8453c' : '#3f8fe0', { size: 24 });
    if (!Kid.portrait()) Kid.text(c, `💣 剩 ${left}`, this.btn.x, this.btn.y - 70, 24, '#4a3520');
  },
  hud() { return { L: `<b>${this.score}</b> 分　💣 ${this.M}`, R: `⏱ ${Math.floor(this.lt)}` }; },
});

// ---- 水果數獨 ----
registerGame({
  id: 'fruitsudoku', name: '水果數獨', icon: '🍓', color: '#e8453c', kid: true,
  desc: '每一排、每一直行都要有不一樣的水果！',
  howto: '每一橫排、每一直行、每一個粗框框裡，🍎🍌🍇🍓 都要剛好各一個。點空格，再點下面的水果放進去。放錯會變紅色，再換一個就好！一共 4 題。',
  F: ['🍎', '🍌', '🍇', '🍓'], N: 4,
  start() { this.t = 0; this.score = 0; this.over = false; this.overText = '數獨小天才！'; this.q = 0; this.newQ(); },
  newQ() {
    const base = [[0, 1, 2, 3], [2, 3, 0, 1], [1, 0, 3, 2], [3, 2, 1, 0]], perm = Kid.shuffle([0, 1, 2, 3]);
    let g = base.map(r => r.map(v => perm[v])); if (Math.random() < 0.5) g = g[0].map((_, i) => g.map(r => r[i]));   // 有時候轉置
    if (Math.random() < 0.5) [g[0], g[1]] = [g[1], g[0]]; if (Math.random() < 0.5) g = g.map(r => [r[1], r[0], r[2], r[3]]);
    this.sol = g; const holes = 5 + this.q * 2; this.cur = g.map(r => r.slice()); this.given = g.map(r => r.map(() => true));
    Kid.shuffle([...Array(16).keys()]).slice(0, holes).forEach(i => { this.cur[i >> 2][i & 3] = -1; this.given[i >> 2][i & 3] = false; });
    this.sel = this.cur.flat().indexOf(-1); this.doneT = 0; this.wrong = -1;
  },
  geo() { const s = Math.min(V.W - 50, V.H - 330, 420), cs = s / 4; return { x: V.W / 2 - s / 2, y: (Kid.portrait() ? 130 : 80), s, cs }; },
  fbtn(i) { const G = this.geo(), w = Math.min(90, (V.W - 60) / 4); return { x: V.W / 2 + (i - 1.5) * (w + 12), y: G.y + G.s + 70, w, h: w }; },
  tap(x, y) {
    if (this.doneT) return; const G = this.geo(), cx = Math.floor((x - G.x) / G.cs), cy = Math.floor((y - G.y) / G.cs);
    if (cx >= 0 && cy >= 0 && cx < 4 && cy < 4) { if (!this.given[cy][cx]) { this.sel = cy * 4 + cx; Sfx.play('click'); } return; }
    for (let i = 0; i < 4; i++) if (Kid.hit(this.fbtn(i), x, y) && this.sel >= 0) {
      const r = this.sel >> 2, k = this.sel & 3; this.cur[r][k] = i;
      if (this.sol[r][k] === i) { Sfx.play('ding'); this.score += 5; this.wrong = -1; const nx = this.cur.flat().indexOf(-1); this.sel = nx; if (nx < 0) { this.doneT = 1.8; this.score += 30; Sfx.play('win'); Kid.say('答對了！'); FX.burst(V.W / 2, G.y + G.s / 2, 40, undefined, 1.2); } }
      else { Sfx.play('nope'); this.wrong = this.sel; }
    }
  },
  update(dt) { this.t += dt; if (this.doneT) { this.doneT -= dt; if (this.doneT <= 0) { if (this.q + 1 >= this.N) { this.over = true; return; } this.q++; this.newQ(); } } },
  draw(c) {
    c.fillStyle = '#fff1d6'; c.fillRect(-20, -20, V.W + 40, V.H + 40); const G = this.geo();
    Paper.rect(c, G.x - 8, G.y - 8, G.s + 16, G.s + 16, '#fffdf5', 14, { border: 5 });
    for (let i = 0; i < 16; i++) { const r = i >> 2, k = i & 3, x = G.x + k * G.cs, y = G.y + r * G.cs, v = this.cur[r][k];
      c.fillStyle = i === this.wrong ? '#ffd0d0' : i === this.sel ? '#fff1b8' : this.given[r][k] ? '#f2ead8' : '#ffffff'; c.fillRect(x + 2, y + 2, G.cs - 4, G.cs - 4);
      if (v >= 0) Kid.emoji(c, this.F[v], x + G.cs / 2, y + G.cs / 2, G.cs * 0.6); }
    c.strokeStyle = '#c98a4b'; c.lineWidth = 2; for (let i = 1; i < 4; i++) { c.lineWidth = i === 2 ? 6 : 2; c.beginPath(); c.moveTo(G.x + i * G.cs, G.y); c.lineTo(G.x + i * G.cs, G.y + G.s); c.moveTo(G.x, G.y + i * G.cs); c.lineTo(G.x + G.s, G.y + i * G.cs); c.stroke(); }
    for (let i = 0; i < 4; i++) { const b = this.fbtn(i); Paper.rect(c, b.x - b.w / 2, b.y - b.h / 2, b.w, b.h, '#fffdf5', 16, { border: 4 }); Kid.emoji(c, this.F[i], b.x, b.y, b.w * 0.6); }
  },
  hud() { return { L: `<b>${this.score}</b> 分`, R: `第 ${this.q + 1} / ${this.N} 題` }; },
});

// ---- 推箱子 ----
registerGame({
  id: 'pushbox', name: '推箱子', icon: '📦', color: '#c98a4b',
  desc: '把所有箱子推到 ⭐ 星星上！',
  howto: '滑動畫面（或用方向鍵、點下面的箭頭）讓紙片人走路。走向箱子就會推它，但是只能推、不能拉！把箱子都推到 ⭐ 上就過關。卡住了可以按「↺ 重來」。一共 5 關。',
  // # 牆  . 目標  $ 箱子  @ 人  * 箱子在目標上
  LEVELS: [
    ['#####', '#@$.#', '#####'],
    ['######', '#@   #', '# $$ #', '#  ..#', '######'],
    ['  ####', '###  #', '#@$  #', '# $..#', '#    #', '######'],
    ['#######', '#.  # #', '#.$   #', '# $@$ #', '#   #.#', '#######'],
    ['#######', '#.  . #', '# $ $ #', '#  @  #', '# $ . #', '#######'],
  ],
  start() { this.t = 0; this.score = 0; this.over = false; this.overText = '推箱子高手！'; this.lv = 0; this.load(); this.sw = null; },
  load() {
    const L = this.LEVELS[this.lv]; this.rows = L.length; this.cols = Math.max(...L.map(r => r.length)); this.wall = new Set(); this.goal = new Set(); this.box = new Set();
    L.forEach((r, y) => [...r].forEach((ch, x) => { const k = y * 100 + x; if (ch === '#') this.wall.add(k); if (ch === '.' || ch === '*') this.goal.add(k); if (ch === '$' || ch === '*') this.box.add(k); if (ch === '@') this.me = { x, y }; }));
    this.moves = 0; this.done = 0; this.face = 1;
  },
  geo() { const P = Kid.portrait(), cs = Math.min((V.W - 30) / this.cols, (V.H - (P ? 330 : 160)) / this.rows, 80); return { cs, x: V.W / 2 - cs * this.cols / 2, y: (P ? 140 : 80) }; },
  arrows() { const P = Kid.portrait(), s = 64, cx = P ? V.W / 2 : V.W - 130, cy = P ? V.H - 120 : V.H - 140; return [[0, -1, cx, cy - s], [0, 1, cx, cy + s * 0.15], [-1, 0, cx - s * 1.1, cy - s * 0.42], [1, 0, cx + s * 1.1, cy - s * 0.42]].map(([dx, dy, x, y]) => ({ dx, dy, x, y, w: s, h: s * 0.85 })); },
  get reset() { const P = Kid.portrait(); return { x: P ? 70 : 90, y: P ? V.H - 120 : V.H - 60, w: 110, h: 52 }; },
  step(dx, dy) {
    if (this.done) return; const n = { x: this.me.x + dx, y: this.me.y + dy }, k = n.y * 100 + n.x; if (dx) this.face = dx;
    if (this.wall.has(k)) return;
    if (this.box.has(k)) { const b = k + dy * 100 + dx; if (this.wall.has(b) || this.box.has(b)) { Sfx.play('block'); return; } this.box.delete(k); this.box.add(b); Sfx.play(this.goal.has(b) ? 'ding' : 'thud'); }
    this.me = n; this.moves++;
    if ([...this.box].every(b => this.goal.has(b))) { this.done = 1.6; const pts = Math.max(30, 120 - this.moves); this.score += pts; Sfx.play('win'); FX.text(V.W / 2, V.H * 0.3, `過關！+${pts}`, '#e0573c', 44); }
  },
  tap(x, y) {
    for (const a of this.arrows()) if (Kid.hit(a, x, y, 4)) return this.step(a.dx, a.dy);
    if (Kid.hit(this.reset, x, y)) { this.load(); Sfx.play('click'); return; }
    this.sw = { x, y };
  },
  key(k) { const m = { arrowup: [0, -1], w: [0, -1], arrowdown: [0, 1], s: [0, 1], arrowleft: [-1, 0], a: [-1, 0], arrowright: [1, 0], d: [1, 0] }[k]; if (m) this.step(m[0], m[1]); if (k === 'r') this.load(); },
  update(dt) {
    this.t += dt;
    if (this.sw && Input.down) { const dx = Input.x - this.sw.x, dy = Input.y - this.sw.y; if (Math.hypot(dx, dy) > 40) { if (Math.abs(dx) > Math.abs(dy)) this.step(Math.sign(dx), 0); else this.step(0, Math.sign(dy)); this.sw = { x: Input.x, y: Input.y }; } }
    if (!Input.down) this.sw = null;
    if (this.done) { this.done -= dt; if (this.done <= 0) { if (this.lv + 1 >= this.LEVELS.length) { this.over = true; return; } this.lv++; this.load(); } }
  },
  draw(c) {
    c.fillStyle = '#e9d9b6'; c.fillRect(-20, -20, V.W + 40, V.H + 40); const G = this.geo(), cs = G.cs, P = (x, y) => ({ x: G.x + x * cs, y: G.y + y * cs });
    for (let y = 0; y < this.rows; y++) for (let x = 0; x < this.cols; x++) { const k = y * 100 + x, p = P(x, y);
      if (this.wall.has(k)) Paper.rect(c, p.x + 1, p.y + 1, cs - 2, cs - 2, '#8a5a34', 6, { border: 2, blur: 3 });
      else if (this.inside(x, y)) { c.fillStyle = '#f6ecd4'; c.fillRect(p.x, p.y, cs, cs); if (this.goal.has(k)) Kid.emoji(c, '⭐', p.x + cs / 2, p.y + cs / 2, cs * 0.5); } }
    for (const b of this.box) { const p = P(b % 100, Math.floor(b / 100)), on = this.goal.has(b); Paper.rect(c, p.x + 4, p.y + 4, cs - 8, cs - 8, on ? '#45ad4a' : '#d9a066', 6, { border: 3 }); c.strokeStyle = 'rgba(80,40,10,0.35)'; c.lineWidth = 3; c.beginPath(); c.moveTo(p.x + 10, p.y + 10); c.lineTo(p.x + cs - 10, p.y + cs - 10); c.moveTo(p.x + cs - 10, p.y + 10); c.lineTo(p.x + 10, p.y + cs - 10); c.stroke(); }
    const m = P(this.me.x, this.me.y); Puppet.draw(c, App.pup, m.x + cs / 2, m.y + cs - 2, cs * 0.95, { sx: this.face, aL: 0.4, aR: 0.4 }, { shadow: false });
    for (const a of this.arrows()) { Kid.button(c, a, '', '#5b6fd6'); Kid.text(c, a.dx ? (a.dx < 0 ? '◀' : '▶') : (a.dy < 0 ? '▲' : '▼'), a.x, a.y + 2, 28, '#fff', 0); }
    Kid.button(c, this.reset, '↺ 重來', '#9aa0b5', { size: 22 });
  },
  inside(x, y) { // 牆裡面的地板（簡單判斷：左右都有牆）
    let l = false, r = false; for (let i = x; i >= 0; i--) if (this.wall.has(y * 100 + i)) { l = true; break; } for (let i = x; i < this.cols; i++) if (this.wall.has(y * 100 + i)) { r = true; break; } return l && r;
  },
  hud() { return { L: `<b>${this.score}</b> 分　第 ${this.lv + 1} / ${this.LEVELS.length} 關`, R: `步數 ${this.moves}` }; },
});
