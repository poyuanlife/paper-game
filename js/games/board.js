'use strict';
// =====================================================
//  跟紙片人下棋：井字遊戲、四子棋、蛇梯棋、剪刀石頭布
// =====================================================
const BoardUI = {
  // 對手（紙片人）在畫面上方 / 左邊說話
  foe(c, g, say) {
    const P = Kid.portrait(), x = P ? V.W - 70 : V.W - 120, y = P ? 210 : V.H * 0.5, h = P ? 120 : 200;
    Puppet.draw(c, App.pup, x, y + h * 0.5, h, g.cheer ? Puppet.Poses.cheer(g.t) : g.sad ? Puppet.Poses.hurt(0.3) : Puppet.Poses.idle(g.t));
    if (say) { const bx = x - (P ? 110 : 0), by = y - h * 0.6 - (P ? 0 : 30); Paper.rect(c, bx - 90, by - 24, 180, 44, '#fffdf5', 16, { border: 3 }); Kid.text(c, say, bx, by - 1, 18, '#4a3520', 0); }
  },
};

// ---- 井字遊戲 ----
registerGame({
  id: 'tictactoe', name: '井字遊戲', icon: '⭕', color: '#e9654b',
  desc: '跟紙片人下井字棋，連成一線就贏！',
  howto: '你是 ⭕，紙片人是 ✖️。輪流在格子裡畫記號，先把三個連成一直線（橫、直、斜都可以）就贏了！一共 5 局，紙片人會越來越聰明。',
  LINES: [[0, 1, 2], [3, 4, 5], [6, 7, 8], [0, 3, 6], [1, 4, 7], [2, 5, 8], [0, 4, 8], [2, 4, 6]],
  start() { this.t = 0; this.score = 0; this.over = false; this.overText = ''; this.round = 0; this.w = [0, 0, 0]; this.newRound(); },
  newRound() { this.b = Array(9).fill(0); this.turn = this.round % 2 ? 2 : 1; this.end = 0; this.aiT = 0.8; this.win = null; this.say = this.turn === 1 ? '你先下！' : '我先喔～'; this.cheer = 0; this.sad = 0; },
  winner(b) { for (const L of this.LINES) if (b[L[0]] && b[L[0]] === b[L[1]] && b[L[1]] === b[L[2]]) return { p: b[L[0]], L }; return b.every(v => v) ? { p: 0 } : null; },
  mm(b, p) { const w = this.winner(b); if (w) return w.p === 2 ? 10 : w.p === 1 ? -10 : 0; let best = p === 2 ? -99 : 99; for (let i = 0; i < 9; i++) if (!b[i]) { b[i] = p; const v = this.mm(b, 3 - p); b[i] = 0; best = p === 2 ? Math.max(best, v) : Math.min(best, v); } return best; },
  aiMove() {
    const free = [...Array(9).keys()].filter(i => !this.b[i]), smart = [0.25, 0.5, 0.7, 0.85, 1][this.round];
    if (Math.random() > smart) return pick(free);
    let best = -99, mv = free[0]; for (const i of Kid.shuffle(free.slice())) { this.b[i] = 2; const v = this.mm(this.b, 1); this.b[i] = 0; if (v > best) { best = v; mv = i; } } return mv;
  },
  grid() { const P = Kid.portrait(), s = Math.min(V.W - 60, V.H * 0.55, 420), x = P ? V.W / 2 - s / 2 : V.W * 0.42 - s / 2, y = P ? V.H * 0.32 : V.H / 2 - s / 2 + 20; return { x, y, s, c: s / 3 }; },
  place(i, p) {
    this.b[i] = p; Sfx.play(p === 1 ? 'pop' : 'click'); const w = this.winner(this.b);
    if (w) { this.win = w; this.end = 2.2; this.w[w.p]++; if (w.p === 1) { this.score += 30; this.say = '你好厲害！'; this.sad = 1; Sfx.play('win'); } else if (w.p === 2) { this.score += 5; this.say = '我贏了～'; this.cheer = 1; Sfx.play('over'); } else { this.score += 10; this.say = '平手！'; Sfx.play('ding'); } }
    else { this.turn = 3 - p; this.aiT = 0.7; this.say = this.turn === 1 ? '換你～' : '讓我想想…'; }
  },
  tap(x, y) {
    if (this.end || this.turn !== 1) return; const G = this.grid(), cx = Math.floor((x - G.x) / G.c), cy = Math.floor((y - G.y) / G.c);
    if (cx < 0 || cy < 0 || cx > 2 || cy > 2) return; const i = cy * 3 + cx; if (!this.b[i]) this.place(i, 1);
  },
  update(dt) {
    this.t += dt;
    if (this.end) { this.end -= dt; if (this.end <= 0) { this.round++; if (this.round >= 5) { this.over = true; this.overText = `贏 ${this.w[1]} 局、輸 ${this.w[2]} 局、平 ${this.w[0]} 局`; return; } this.newRound(); } return; }
    if (this.turn === 2) { this.aiT -= dt; if (this.aiT <= 0) this.place(this.aiMove(), 2); }
  },
  draw(c) {
    c.fillStyle = '#fff1d6'; c.fillRect(-20, -20, V.W + 40, V.H + 40);
    const G = this.grid(); Paper.rect(c, G.x - 14, G.y - 14, G.s + 28, G.s + 28, '#fffdf5', 20, { border: 5 });
    c.strokeStyle = '#c98a4b'; c.lineWidth = 8; c.lineCap = 'round'; for (let i = 1; i < 3; i++) { c.beginPath(); c.moveTo(G.x + G.c * i, G.y + 10); c.lineTo(G.x + G.c * i, G.y + G.s - 10); c.moveTo(G.x + 10, G.y + G.c * i); c.lineTo(G.x + G.s - 10, G.y + G.c * i); c.stroke(); }
    for (let i = 0; i < 9; i++) {
      const x = G.x + (i % 3 + 0.5) * G.c, y = G.y + (Math.floor(i / 3) + 0.5) * G.c, r = G.c * 0.3;
      if (this.b[i] === 1) { c.strokeStyle = '#e8453c'; c.lineWidth = 12; c.beginPath(); c.arc(x, y, r, 0, Math.PI * 2); c.stroke(); }
      if (this.b[i] === 2) { c.strokeStyle = '#3f6fe0'; c.lineWidth = 12; c.beginPath(); c.moveTo(x - r, y - r); c.lineTo(x + r, y + r); c.moveTo(x + r, y - r); c.lineTo(x - r, y + r); c.stroke(); }
    }
    if (this.win && this.win.L) { const a = this.win.L[0], b = this.win.L[2], P = i => ({ x: G.x + (i % 3 + 0.5) * G.c, y: G.y + (Math.floor(i / 3) + 0.5) * G.c }); c.strokeStyle = 'rgba(255,200,40,0.85)'; c.lineWidth = 14; c.beginPath(); c.moveTo(P(a).x, P(a).y); c.lineTo(P(b).x, P(b).y); c.stroke(); }
    BoardUI.foe(c, this, this.say);
    Kid.text(c, `⭕ 你 ${this.w[1]}　：　${this.w[2]} 紙片人 ✖️`, Kid.portrait() ? V.W / 2 - 40 : V.W * 0.42, G.y + G.s + 50, 24, '#4a3520');
  },
  hud() { return { L: `<b>${this.score}</b> 分`, R: `第 ${Math.min(this.round + 1, 5)} / 5 局` }; },
});

// ---- 四子棋 ----
registerGame({
  id: 'connect4', name: '四子連線', icon: '🔴', color: '#3f6fe0',
  desc: '把棋子丟進直欄，先連成四顆就贏！',
  howto: '點一個直欄把紅色棋子丟進去，棋子會掉到最下面。先把 4 顆連成一線（橫、直、斜）就贏！紙片人是黃色棋子。一共 3 局。',
  C: 7, R: 6,
  start() { this.t = 0; this.score = 0; this.over = false; this.overText = ''; this.round = 0; this.w = [0, 0, 0]; this.newRound(); },
  newRound() { this.b = Array.from({ length: this.R }, () => Array(this.C).fill(0)); this.turn = this.round % 2 ? 2 : 1; this.drop = null; this.end = 0; this.aiT = 0.8; this.say = this.turn === 1 ? '你先！' : '我先～'; this.cheer = 0; this.sad = 0; this.winLine = null; },
  rowFor(b, c) { for (let r = this.R - 1; r >= 0; r--) if (!b[r][c]) return r; return -1; },
  check(b, p) {
    const D = [[0, 1], [1, 0], [1, 1], [1, -1]];
    for (let r = 0; r < this.R; r++) for (let c = 0; c < this.C; c++) for (const [dr, dc] of D) { const L = []; for (let k = 0; k < 4; k++) { const rr = r + dr * k, cc = c + dc * k; if (rr < 0 || rr >= this.R || cc < 0 || cc >= this.C || b[rr][cc] !== p) break; L.push([rr, cc]); } if (L.length === 4) return L; }
    return null;
  },
  aiCol() {
    const cols = [...Array(this.C).keys()].filter(c => this.rowFor(this.b, c) >= 0), tryP = (c, p) => { const r = this.rowFor(this.b, c); this.b[r][c] = p; const w = this.check(this.b, p); this.b[r][c] = 0; return w; };
    for (const c of cols) if (tryP(c, 2)) return c; for (const c of cols) if (tryP(c, 1)) return c;
    const safe = cols.filter(c => { const r = this.rowFor(this.b, c); this.b[r][c] = 2; const bad = r > 0 && (() => { this.b[r - 1][c] = 1; const w = this.check(this.b, 1); this.b[r - 1][c] = 0; return w; })(); this.b[r][c] = 0; return !bad; });
    const pool = safe.length ? safe : cols; return pool.sort((a, b) => Math.abs(a - 3) - Math.abs(b - 3) + rand(-1.2, 1.2))[0];
  },
  geo() { const P = Kid.portrait(), cs = Math.min((V.W - 30) / this.C, (V.H * (P ? 0.55 : 0.78)) / (this.R + 1)), w = cs * this.C, x = P ? V.W / 2 - w / 2 : V.W * 0.42 - w / 2, y = P ? V.H * 0.3 : V.H * 0.12; return { cs, x, y: y + cs }; },
  play(c, p) { const r = this.rowFor(this.b, c); if (r < 0) return false; this.drop = { c, r, p, y: -1 }; Sfx.play('click'); return true; },
  tap(x) { if (this.end || this.drop || this.turn !== 1) return; const G = this.geo(), c = Math.floor((x - G.x) / G.cs); if (c >= 0 && c < this.C) this.play(c, 1); },
  update(dt) {
    this.t += dt;
    if (this.end) { this.end -= dt; if (this.end <= 0) { this.round++; if (this.round >= 3) { this.over = true; this.overText = `贏 ${this.w[1]} 局、輸 ${this.w[2]} 局`; return; } this.newRound(); } return; }
    const d = this.drop;
    if (d) { d.y += dt * 14; if (d.y >= d.r) { this.b[d.r][d.c] = d.p; this.drop = null; Sfx.play('thud'); const L = this.check(this.b, d.p);
      if (L) { this.winLine = L; this.end = 2.4; this.w[d.p]++; if (d.p === 1) { this.score += 50; this.say = '被你贏了！'; this.sad = 1; Sfx.play('win'); } else { this.score += 5; this.say = '四顆連線！'; this.cheer = 1; Sfx.play('over'); } }
      else if (this.b[0].every(v => v)) { this.end = 2; this.w[0]++; this.score += 15; this.say = '平手！'; }
      else { this.turn = 3 - d.p; this.aiT = 0.6; this.say = this.turn === 1 ? '換你～' : '嗯…'; } } return; }
    if (this.turn === 2) { this.aiT -= dt; if (this.aiT <= 0) this.play(this.aiCol(), 2); }
  },
  draw(c) {
    c.fillStyle = '#dff0ff'; c.fillRect(-20, -20, V.W + 40, V.H + 40);
    const G = this.geo(), cs = G.cs, cols = ['', '#e8453c', '#ffcc1f'];
    if (this.drop) { const d = this.drop; Paper.circle(c, G.x + (d.c + 0.5) * cs, G.y + (d.y + 0.5) * cs, cs * 0.4, cols[d.p], { border: 3 }); }
    Paper.rect(c, G.x - 8, G.y - 8, cs * this.C + 16, cs * this.R + 16, '#3f6fe0', 16, { border: 5 });
    for (let r = 0; r < this.R; r++) for (let k = 0; k < this.C; k++) { const v = this.b[r][k], x = G.x + (k + 0.5) * cs, y = G.y + (r + 0.5) * cs; c.fillStyle = v ? cols[v] : '#dff0ff'; c.beginPath(); c.arc(x, y, cs * 0.38, 0, Math.PI * 2); c.fill(); if (v) { c.fillStyle = 'rgba(255,255,255,0.3)'; c.beginPath(); c.arc(x - cs * 0.1, y - cs * 0.1, cs * 0.12, 0, Math.PI * 2); c.fill(); } }
    if (this.winLine) for (const [r, k] of this.winLine) { c.strokeStyle = '#ffffff'; c.lineWidth = 5; c.beginPath(); c.arc(G.x + (k + 0.5) * cs, G.y + (r + 0.5) * cs, cs * 0.38, 0, Math.PI * 2); c.stroke(); }
    if (this.turn === 1 && !this.end && !this.drop) Kid.text(c, '👇 點一個直欄', G.x + cs * this.C / 2, G.y - cs * 0.6, 22, '#3f6fe0');
    BoardUI.foe(c, this, this.say);
  },
  hud() { return { L: `<b>${this.score}</b> 分　🔴 ${this.w[1]} : ${this.w[2]} 🟡`, R: `第 ${Math.min(this.round + 1, 3)} / 3 局` }; },
});

// ---- 蛇梯棋 ----
registerGame({
  id: 'ladders', name: '溜滑梯棋', icon: '🎲', color: '#45ad4a', kid: true,
  desc: '擲骰子前進，爬梯子往上、溜滑梯往下！',
  howto: '點「擲骰子」，紙片人就會往前走幾格。走到 🪜 梯子底下可以爬上去，走到滑梯頂端會溜下來！先走到第 30 格的人贏。跟小狗比賽！',
  N: 30, COLS: 5,
  JUMP: { 3: 11, 8: 16, 14: 23, 19: 27, 13: 4, 21: 10, 26: 17, 29: 20 },
  ZH: ['零', '一', '二', '三', '四', '五', '六'],
  start() { this.t = 0; this.score = 0; this.over = false; this.overText = ''; this.pos = [1, 1]; this.turn = 0; this.dice = 1; this.st = 'wait'; this.stT = 0; this.anim = null; this.moves = 0; },
  cell(n) { const i = n - 1, row = Math.floor(i / this.COLS), col = row % 2 ? this.COLS - 1 - i % this.COLS : i % this.COLS, P = Kid.portrait(), cs = Math.min((V.W - 40) / this.COLS, (V.H - (P ? 300 : 140)) / 6), x0 = P ? V.W / 2 - cs * this.COLS / 2 : V.W * 0.42 - cs * this.COLS / 2, y0 = (P ? 110 : 70) + cs * 6; return { x: x0 + (col + 0.5) * cs, y: y0 - (row + 0.5) * cs, cs, x0, y0 }; },
  get btn() { const P = Kid.portrait(); return { x: P ? V.W / 2 : V.W * 0.82, y: P ? V.H - 90 : V.H * 0.7, w: 220, h: 80 }; },
  roll() { if (this.st !== 'wait' || this.turn !== 0) return; this.st = 'roll'; this.stT = 0; Sfx.play('rustle'); },
  tap(x, y) { if (Kid.hit(this.btn, x, y)) this.roll(); },
  key(k) { if (k === 'space' || k === 'enter') this.roll(); },
  update(dt) {
    this.t += dt; this.stT += dt;
    if (this.st === 'roll') { if (this.stT < 0.8) { if (Math.random() < 0.5) this.dice = 1 + Math.floor(Math.random() * 6); } else { this.st = 'move'; this.stT = 0; this.left = this.dice; if (this.turn === 0) { this.moves++; Kid.say(this.ZH[this.dice]); } } }
    else if (this.st === 'move' && this.stT > 0.28) {
      this.stT = 0; const p = this.turn;
      if (this.left > 0) { this.pos[p] = Math.min(this.N, this.pos[p] + 1); this.left--; Sfx.note(400 + this.pos[p] * 12, 0.1, 0.1); if (this.pos[p] === this.N) this.left = 0; }
      else { const j = this.JUMP[this.pos[p]]; if (j) { const up = j > this.pos[p]; Sfx.play(up ? 'star' : 'boing'); if (p === 0) Kid.say(up ? '爬梯子！' : '溜下去囉！'); const c = this.cell(this.pos[p]); FX.text(c.x, c.y - 40, up ? '爬上去！' : '咻～', up ? '#3d8b2a' : '#e0573c', 26); this.pos[p] = j; }
        if (this.pos[p] >= this.N) { this.over = true; const me = p === 0; this.score = me ? 100 + Math.max(0, 60 - this.moves * 4) : 30 + this.pos[0]; this.overText = me ? '你先到終點！' : '小狗先到了～'; if (me) Kid.say('你贏了！'); return; }
        this.turn = 1 - this.turn; this.st = this.turn === 1 ? 'ai' : 'wait'; this.stT = 0; }
    } else if (this.st === 'ai' && this.stT > 0.7) { this.st = 'roll'; this.stT = 0; Sfx.play('rustle'); }
  },
  draw(c) {
    c.fillStyle = '#e8f6e9'; c.fillRect(-20, -20, V.W + 40, V.H + 40);
    const cols = ['#ffd6e0', '#cfe9ff', '#d8f5c8', '#fff1b8', '#e6d8ff'];
    for (let n = 1; n <= this.N; n++) { const q = this.cell(n); Paper.rect(c, q.x - q.cs / 2 + 2, q.y - q.cs / 2 + 2, q.cs - 4, q.cs - 4, n === this.N ? '#ffd23f' : cols[n % 5], 8, { border: 2, blur: 2, oy: 1 }); Kid.text(c, String(n), q.x - q.cs * 0.3, q.y - q.cs * 0.3, q.cs * 0.22, '#8a7560', 0); }
    for (const [a, b] of Object.entries(this.JUMP)) { const A = this.cell(+a), B = this.cell(b), up = b > +a;
      if (up) { c.strokeStyle = '#8a5a34'; c.lineWidth = 5; const dx = B.x - A.x, dy = B.y - A.y, L = Math.hypot(dx, dy), nx = -dy / L * 10, ny = dx / L * 10; c.beginPath(); c.moveTo(A.x + nx, A.y + ny); c.lineTo(B.x + nx, B.y + ny); c.moveTo(A.x - nx, A.y - ny); c.lineTo(B.x - nx, B.y - ny); c.stroke(); for (let k = 1; k < 6; k++) { const t = k / 6; c.beginPath(); c.moveTo(A.x + dx * t + nx, A.y + dy * t + ny); c.lineTo(A.x + dx * t - nx, A.y + dy * t - ny); c.stroke(); } }
      else { c.strokeStyle = 'rgba(232,69,60,0.75)'; c.lineWidth = 12; c.lineCap = 'round'; c.beginPath(); c.moveTo(A.x, A.y); c.quadraticCurveTo((A.x + B.x) / 2 + 40, (A.y + B.y) / 2, B.x, B.y); c.stroke(); c.strokeStyle = 'rgba(255,255,255,0.6)'; c.lineWidth = 3; c.stroke(); } }
    const me = this.cell(this.pos[0]), ai = this.cell(this.pos[1]);
    Kid.emoji(c, '🐶', ai.x + me.cs * 0.18, ai.y + me.cs * 0.1, me.cs * 0.5); Paper.circle(c, me.x - me.cs * 0.15, me.y, me.cs * 0.28, '#fffdf5', { border: 3 }); Kid.head(c, me.x - me.cs * 0.15, me.y, me.cs * 0.2, {}, me.cs * 0.26);
    const B = this.btn; Kid.button(c, B, this.turn === 0 && this.st === 'wait' ? '🎲 擲骰子' : this.turn === 1 ? '小狗擲…' : '…', this.turn === 0 && this.st === 'wait' ? '#e8453c' : '#b8a890', { size: 28 });
    c.save(); c.translate(B.x, B.y - 100); Paper.rect(c, -34, -34, 68, 68, '#ffffff', 12, { border: 4 }); Kid.text(c, String(this.dice), 0, 2, 40, '#2a2a33', 0); c.restore();
  },
  hud() { return { L: `你在第 <b>${this.pos[0]}</b> 格`, R: `🐶 第 ${this.pos[1]} 格` }; },
});

// ---- 剪刀石頭布 ----
registerGame({
  id: 'rps', name: '剪刀石頭布', icon: '✌️', color: '#ff9a2e', kid: true,
  desc: '跟紙片人猜拳，先贏 3 次的人勝利！',
  howto: '點下面的 ✊ 石頭、✌️ 剪刀或 🖐️ 布跟紙片人猜拳。石頭贏剪刀、剪刀贏布、布贏石頭！先贏 3 次的人勝利。',
  H: [['✊', '石頭'], ['✌️', '剪刀'], ['🖐️', '布']],
  start() { this.t = 0; this.score = 0; this.over = false; this.overText = ''; this.me = 0; this.ai = 0; this.st = 'pick'; this.stT = 0; this.mine = -1; this.his = -1; this.res = ''; this.cheer = 0; this.sad = 0; },
  btn(i) { const w = Math.min(130, (V.W - 60) / 3); return { x: V.W / 2 + (i - 1) * (w + 14), y: V.H - 110, w, h: w }; },
  tap(x, y) { if (this.st !== 'pick') return; for (let i = 0; i < 3; i++) if (Kid.hit(this.btn(i), x, y)) { this.mine = i; this.his = Math.floor(Math.random() * 3); this.st = 'shake'; this.stT = 0; Kid.say('剪刀、石頭、布！'); Sfx.play('click'); } },
  key(k) { const i = ['1', '2', '3'].indexOf(k); if (i >= 0) { const b = this.btn(i); this.tap(b.x, b.y); } },
  update(dt) {
    this.t += dt; this.stT += dt; this.cheer = Math.max(0, this.cheer - dt); this.sad = Math.max(0, this.sad - dt);
    if (this.st === 'shake' && this.stT > 1.2) {
      this.st = 'show'; this.stT = 0; const d = (this.his - this.mine + 3) % 3;
      if (d === 0) { this.res = '平手！再一次'; Sfx.play('ding'); } else if (d === 1) { this.me++; this.score += 20; this.res = '你贏了！'; this.sad = 1.5; Sfx.play('win'); } else { this.ai++; this.res = '紙片人贏了～'; this.cheer = 1.5; Sfx.play('nope'); }
      Kid.say(`${this.H[this.mine][1]}對${this.H[this.his][1]}，${this.res}`);
    } else if (this.st === 'show' && this.stT > 1.8) { if (this.me >= 3 || this.ai >= 3) { this.over = true; this.overText = this.me >= 3 ? `你贏了！${this.me} : ${this.ai}` : `紙片人贏了 ${this.ai} : ${this.me}，再挑戰一次！`; this.score += this.me >= 3 ? 40 : 0; return; } this.st = 'pick'; }
  },
  draw(c) {
    const gy = Kid.ground(c, 'meadow', this.t, 0.72), P = Kid.portrait();
    Puppet.draw(c, App.pup, V.W / 2, gy, Math.min(V.H * 0.38, 300), this.cheer ? Puppet.Poses.cheer(this.t) : this.sad ? Puppet.Poses.hurt(0.4) : Puppet.Poses.idle(this.t));
    const hy = gy - Math.min(V.H * 0.38, 300) * 0.55;
    if (this.st === 'shake') { const s = Math.abs(Math.sin(this.stT * 9)) * 30; Kid.emoji(c, '✊', V.W / 2 + 120, hy - s, 80); Kid.emoji(c, '✊', V.W / 2 - 120, V.H * 0.6 - s, 80); Kid.text(c, ['剪刀', '石頭', '布！'][Math.min(2, Math.floor(this.stT / 0.4))], V.W / 2, P ? 150 : 100, 44, '#e0573c'); }
    if (this.st === 'show') { Kid.emoji(c, this.H[this.his][0], V.W / 2 + 120, hy, 90); Kid.emoji(c, this.H[this.mine][0], V.W / 2 - 120, V.H * 0.6, 90); Kid.text(c, this.res, V.W / 2, P ? 150 : 100, 44, '#e0573c'); }
    for (let i = 0; i < 3; i++) Kid.button(c, this.btn(i), '', this.st === 'pick' ? ['#e8453c', '#3f8fe0', '#45ad4a'][i] : '#b8a890'), Kid.emoji(c, this.H[i][0], this.btn(i).x, this.btn(i).y - 6, this.btn(i).h * 0.5), Kid.text(c, this.H[i][1], this.btn(i).x, this.btn(i).y + this.btn(i).h * 0.33, 18, '#fff', 0);
    Kid.text(c, `你 ${this.me}　：　${this.ai} 紙片人`, V.W / 2, V.H - 200, 28, '#4a3520');
  },
  hud() { return { L: `<b>${this.score}</b> 分`, R: `先贏 3 次` }; },
});
