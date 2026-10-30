'use strict';
// =====================================================
//  紙上對戰：圈地遊戲、五子棋、黑白棋、猜猜在哪杯
// =====================================================

// ---- 圈地遊戲 ----
registerGame({
  id: 'dotsboxes', name: '圈地遊戲', icon: '🔲', color: '#e9654b',
  desc: '輪流畫線，圍起一個格子就是你的，還能再畫一次！',
  howto: '你和機器人輪流在兩個點之間畫一條線。誰畫下格子的「第四條邊」，那一格就是誰的，而且可以再畫一次！小心不要畫出第三條邊讓對手撿便宜。格子全部圍完，佔比較多格的人贏。',
  N: 4,
  start() { this.t = 0; this.score = 0; this.over = false; this.overText = ''; const n = this.N; this.h = [...Array(n + 1)].map(() => Array(n).fill(0)); this.v = [...Array(n)].map(() => Array(n + 1).fill(0)); this.box = [...Array(n)].map(() => Array(n).fill(0)); this.turn = 1; this.aiT = 0; this.me = 0; this.ai = 0; this.last = null; this.endT = 0; },
  geo() { const P = Kid.portrait(), S = Math.min(V.W - 60, V.H - (P ? 260 : 150), 480), s = S / this.N; return { s, x0: V.W / 2 - S / 2, y0: (P ? 160 : 100) + (V.H - (P ? 260 : 150) - S) / 2 }; },
  sides(r, c) { return !!this.h[r][c] + !!this.h[r + 1][c] + !!this.v[r][c] + !!this.v[r][c + 1]; },
  edges() { const L = [], n = this.N; for (let r = 0; r <= n; r++) for (let c = 0; c < n; c++) if (!this.h[r][c]) L.push(['h', r, c]); for (let r = 0; r < n; r++) for (let c = 0; c <= n; c++) if (!this.v[r][c]) L.push(['v', r, c]); return L; },
  adj(e) { const [k, r, c] = e, L = []; if (k === 'h') { if (r > 0) L.push([r - 1, c]); if (r < this.N) L.push([r, c]); } else { if (c > 0) L.push([r, c - 1]); if (c < this.N) L.push([r, c]); } return L; },
  play(e, who) {
    const [k, r, c] = e; this[k][r][c] = who; this.last = e; let got = 0;
    for (const [a, b] of this.adj(e)) if (this.sides(a, b) === 4 && !this.box[a][b]) { this.box[a][b] = who; got++; }
    if (got) { if (who === 1) { this.me += got; Sfx.play('coin'); } else { this.ai += got; Sfx.play('nope'); } } else Sfx.play('click');
    if (this.me + this.ai === this.N * this.N) { this.endT = 1.2; return; }
    if (!got) this.turn = 3 - this.turn; this.aiT = 0.6;
  },
  tap(x, y) {
    if (this.turn !== 1 || this.endT) return; const G = this.geo(); let best = null, bd = G.s * 0.3;
    for (const e of this.edges()) { const [k, r, c] = e, mx = G.x0 + (k === 'h' ? c + 0.5 : c) * G.s, my = G.y0 + (k === 'h' ? r : r + 0.5) * G.s, d = Math.hypot(mx - x, my - y); if (d < bd) { bd = d; best = e; } }
    if (best) this.play(best, 1);
  },
  aiMove() {
    const E = this.edges(), gain = e => this.adj(e).filter(([a, b]) => this.sides(a, b) === 3).length, risk = e => this.adj(e).filter(([a, b]) => this.sides(a, b) === 2).length;
    const take = E.filter(e => gain(e) > 0); if (take.length) return pick(take);
    const safe = E.filter(e => !risk(e)); if (safe.length) return pick(safe);
    return E.sort((a, b) => risk(a) - risk(b))[0];
  },
  update(dt) {
    this.t += dt;
    if (this.endT) { this.endT -= dt; if (this.endT <= 0) { const win = this.me > this.ai; this.score = this.me * 10 + (win ? 50 : this.me === this.ai ? 20 : 0); this.over = true; this.overText = win ? `你贏了！${this.me} : ${this.ai}` : this.me === this.ai ? `平手 ${this.me} : ${this.ai}` : `機器人贏了 ${this.me} : ${this.ai}`; } return; }
    if (this.turn === 2) { this.aiT -= dt; if (this.aiT <= 0) { const e = this.aiMove(); if (e) this.play(e, 2); } }
  },
  draw(c) {
    c.fillStyle = '#fbf6ea'; c.fillRect(-20, -20, V.W + 40, V.H + 40); c.strokeStyle = 'rgba(100,150,200,0.25)'; c.lineWidth = 1; for (let y = 0; y < V.H; y += 28) { c.beginPath(); c.moveTo(0, y); c.lineTo(V.W, y); c.stroke(); }
    const G = this.geo(), n = this.N, s = G.s;
    for (let r = 0; r < n; r++) for (let k = 0; k < n; k++) if (this.box[r][k]) { const me = this.box[r][k] === 1; c.fillStyle = me ? 'rgba(232,69,60,0.25)' : 'rgba(63,143,224,0.25)'; c.fillRect(G.x0 + k * s, G.y0 + r * s, s, s); if (me) Kid.head(c, G.x0 + (k + 0.5) * s, G.y0 + (r + 0.5) * s, s * 0.25, {}, s * 0.3); else Kid.emoji(c, '🤖', G.x0 + (k + 0.5) * s, G.y0 + (r + 0.5) * s, s * 0.5); }
    const line = (x1, y1, x2, y2, who, last) => { c.lineCap = 'round'; c.strokeStyle = who === 1 ? '#e8453c' : who === 2 ? '#3f8fe0' : 'rgba(0,0,0,0.08)'; c.lineWidth = who ? (last ? 10 : 7) : 4; c.setLineDash(who ? [] : [4, 8]); c.beginPath(); c.moveTo(x1, y1); c.lineTo(x2, y2); c.stroke(); c.setLineDash([]); };
    const L = this.last;
    for (let r = 0; r <= n; r++) for (let k = 0; k < n; k++) line(G.x0 + k * s, G.y0 + r * s, G.x0 + (k + 1) * s, G.y0 + r * s, this.h[r][k], L && L[0] === 'h' && L[1] === r && L[2] === k);
    for (let r = 0; r < n; r++) for (let k = 0; k <= n; k++) line(G.x0 + k * s, G.y0 + r * s, G.x0 + k * s, G.y0 + (r + 1) * s, this.v[r][k], L && L[0] === 'v' && L[1] === r && L[2] === k);
    for (let r = 0; r <= n; r++) for (let k = 0; k <= n; k++) Paper.circle(c, G.x0 + k * s, G.y0 + r * s, 8, '#4a3520', { border: 2, blur: 2 });
    Kid.text(c, this.endT ? '結束！' : this.turn === 1 ? '換你畫線' : '機器人想一想…', V.W / 2, G.y0 - 40, 26, this.turn === 1 ? '#e8453c' : '#3f8fe0', 6);
  },
  hud() { return { L: `我 <b>${this.me}</b> 格`, R: `🤖 ${this.ai} 格` }; },
});

// ---- 五子棋 ----
registerGame({
  id: 'gomoku', name: '紙片五子棋', icon: '⚫', color: '#4a3520',
  desc: '輪流下棋，先把五顆連成一直線的人贏！',
  howto: '你下黑棋、機器人下白棋，輪流把棋子下在格線的交叉點上。橫的、直的、斜的，誰先連成「五顆」就贏！也要記得擋住機器人喔。',
  N: 11,
  start() { this.t = 0; this.score = 0; this.over = false; this.overText = ''; const n = this.N; this.b = [...Array(n)].map(() => Array(n).fill(0)); this.turn = 1; this.aiT = 0; this.last = null; this.win = null; this.endT = 0; this.moves = 0; },
  geo() { const P = Kid.portrait(), S = Math.min(V.W - 30, V.H - (P ? 230 : 110), 600), s = S / this.N; return { s, x0: V.W / 2 - S / 2 + s / 2, y0: (P ? 130 : 80) + (V.H - (P ? 230 : 110) - S) / 2 + s / 2 }; },
  line5(r, c, who) { const n = this.N; for (const [dr, dc] of [[0, 1], [1, 0], [1, 1], [1, -1]]) { const L = [[r, c]]; for (const s of [1, -1]) { let a = r + dr * s, b = c + dc * s; while (a >= 0 && b >= 0 && a < n && b < n && this.b[a][b] === who) { L.push([a, b]); a += dr * s; b += dc * s; } } if (L.length >= 5) return L; } return null; },
  put(r, c, who) { this.b[r][c] = who; this.last = [r, c]; this.moves++; Sfx.play('snap'); const w = this.line5(r, c, who); if (w) { this.win = { who, L: w }; this.endT = 1.6; Sfx.play(who === 1 ? 'win' : 'over'); return; } if (this.moves >= this.N * this.N) { this.endT = 1; return; } this.turn = 3 - who; this.aiT = 0.5; },
  tap(x, y) { if (this.turn !== 1 || this.endT) return; const G = this.geo(), c = Math.round((x - G.x0) / G.s), r = Math.round((y - G.y0) / G.s); if (r < 0 || c < 0 || r >= this.N || c >= this.N || this.b[r][c]) return; this.put(r, c, 1); },
  evalCell(r, c) {
    const n = this.N; let sc = 0;
    const val = (cnt, open) => cnt >= 5 ? 100000 : cnt === 4 ? (open === 2 ? 20000 : open ? 3000 : 0) : cnt === 3 ? (open === 2 ? 1500 : open ? 200 : 0) : cnt === 2 ? (open === 2 ? 120 : open ? 20 : 0) : open * 3;
    for (const who of [2, 1]) for (const [dr, dc] of [[0, 1], [1, 0], [1, 1], [1, -1]]) {
      let cnt = 1, open = 0;
      for (const s of [1, -1]) { let a = r + dr * s, b = c + dc * s; while (a >= 0 && b >= 0 && a < n && b < n && this.b[a][b] === who) { cnt++; a += dr * s; b += dc * s; } if (a >= 0 && b >= 0 && a < n && b < n && !this.b[a][b]) open++; }
      sc += val(cnt, open) * (who === 2 ? 1.1 : 1);
    }
    return sc + (n - Math.abs(r - (n - 1) / 2) - Math.abs(c - (n - 1) / 2)) * 0.5 + Math.random();
  },
  aiMove() { let best = null, bs = -1; for (let r = 0; r < this.N; r++) for (let c = 0; c < this.N; c++) { if (this.b[r][c]) continue; const s = this.evalCell(r, c); if (s > bs) { bs = s; best = [r, c]; } } return best; },
  update(dt) {
    this.t += dt;
    if (this.endT) { this.endT -= dt; if (this.endT <= 0) { const w = this.win && this.win.who === 1; this.score = w ? Math.max(50, 150 - this.moves * 2) : 10; this.over = true; this.overText = w ? '五子連線，你贏了！' : this.win ? '機器人贏了，再挑戰！' : '平手！'; } return; }
    if (this.turn === 2) { this.aiT -= dt; if (this.aiT <= 0) { const m = this.aiMove(); if (m) this.put(m[0], m[1], 2); } }
  },
  draw(c) {
    c.fillStyle = '#e8d4a8'; c.fillRect(-20, -20, V.W + 40, V.H + 40); const G = this.geo(), n = this.N, s = G.s;
    Paper.rect(c, G.x0 - s * 0.7, G.y0 - s * 0.7, s * (n - 1) + s * 1.4, s * (n - 1) + s * 1.4, '#dcb878', 12, { border: 5 });
    c.strokeStyle = '#6a4a22'; c.lineWidth = 1.5; for (let i = 0; i < n; i++) { c.beginPath(); c.moveTo(G.x0, G.y0 + i * s); c.lineTo(G.x0 + (n - 1) * s, G.y0 + i * s); c.moveTo(G.x0 + i * s, G.y0); c.lineTo(G.x0 + i * s, G.y0 + (n - 1) * s); c.stroke(); }
    for (let r = 0; r < n; r++) for (let k = 0; k < n; k++) { const v = this.b[r][k]; if (!v) continue; const x = G.x0 + k * s, y = G.y0 + r * s; Paper.circle(c, x, y, s * 0.43, v === 1 ? '#2a2a33' : '#fafafa', { border: 0, blur: 4 }); if (v === 1) { c.fillStyle = 'rgba(255,255,255,0.25)'; c.beginPath(); c.arc(x - s * 0.13, y - s * 0.13, s * 0.12, 0, Math.PI * 2); c.fill(); } }
    if (this.last) { const [r, k] = this.last; c.fillStyle = '#e8453c'; c.beginPath(); c.arc(G.x0 + k * s, G.y0 + r * s, s * 0.1, 0, Math.PI * 2); c.fill(); }
    if (this.win) { const L = this.win.L; c.strokeStyle = '#ffd23f'; c.lineWidth = 6; for (const [r, k] of L) { c.beginPath(); c.arc(G.x0 + k * s, G.y0 + r * s, s * 0.45, 0, Math.PI * 2); c.stroke(); } }
    Kid.text(c, this.endT ? '' : this.turn === 1 ? '換你下黑棋' : '機器人想一想…', V.W / 2, G.y0 - s * 0.7 - 26, 24, '#4a3520', 6);
  },
  hud() { return { L: '你 ⚫', R: `🤖 ⚪　第 ${this.moves} 手` }; },
});

// ---- 黑白棋 ----
registerGame({
  id: 'reversi', name: '翻轉黑白棋', icon: '⚪', color: '#2f7a4a',
  desc: '把對手的棋子夾在中間就能翻成你的顏色！',
  howto: '你下黑棋。下的棋子要跟你原本的棋子把白棋「夾住」（橫、直、斜都可以），中間被夾住的白棋全部翻成黑色！只能下在可以翻棋的地方（有小點提示）。棋盤下滿或都不能下時，棋子多的人贏。',
  W: [[100, -20, 10, 5, 5, 10, -20, 100], [-20, -50, -2, -2, -2, -2, -50, -20], [10, -2, 1, 1, 1, 1, -2, 10], [5, -2, 1, 0, 0, 1, -2, 5], [5, -2, 1, 0, 0, 1, -2, 5], [10, -2, 1, 1, 1, 1, -2, 10], [-20, -50, -2, -2, -2, -2, -50, -20], [100, -20, 10, 5, 5, 10, -20, 100]],
  start() { this.t = 0; this.score = 0; this.over = false; this.overText = ''; this.b = [...Array(8)].map(() => Array(8).fill(0)); this.b[3][3] = this.b[4][4] = 2; this.b[3][4] = this.b[4][3] = 1; this.turn = 1; this.aiT = 0; this.flip = []; this.last = null; this.endT = 0; this.msg = ''; this.msgT = 0; },
  geo() { const P = Kid.portrait(), S = Math.min(V.W - 30, V.H - (P ? 240 : 120), 560), s = S / 8; return { s, x0: V.W / 2 - S / 2, y0: (P ? 140 : 84) + (V.H - (P ? 240 : 120) - S) / 2 }; },
  flips(r, c, who) { if (this.b[r][c]) return []; const out = []; for (const [dr, dc] of [[0, 1], [1, 0], [0, -1], [-1, 0], [1, 1], [1, -1], [-1, 1], [-1, -1]]) { const L = []; let a = r + dr, b = c + dc; while (a >= 0 && b >= 0 && a < 8 && b < 8 && this.b[a][b] === 3 - who) { L.push([a, b]); a += dr; b += dc; } if (L.length && a >= 0 && b >= 0 && a < 8 && b < 8 && this.b[a][b] === who) out.push(...L); } return out; },
  moves(who) { const L = []; for (let r = 0; r < 8; r++) for (let c = 0; c < 8; c++) { const f = this.flips(r, c, who); if (f.length) L.push({ r, c, f }); } return L; },
  count(w) { return this.b.flat().filter(v => v === w).length; },
  put(m, who) { this.b[m.r][m.c] = who; for (const [a, b] of m.f) { this.b[a][b] = who; this.flip.push({ r: a, c: b, t: 0.35 }); } this.last = [m.r, m.c]; Sfx.play(m.f.length > 3 ? 'star' : 'snap'); this.next(3 - who); },
  next(who) {
    if (this.moves(who).length) { this.turn = who; this.aiT = 0.7; return; }
    if (this.moves(3 - who).length) { this.turn = 3 - who; this.aiT = 0.9; this.msg = who === 1 ? '你沒有地方可以下，換機器人' : '機器人沒地方下，換你！'; this.msgT = 2; return; }
    this.turn = 0; this.endT = 1.4;
  },
  tap(x, y) { if (this.turn !== 1) return; const G = this.geo(), c = Math.floor((x - G.x0) / G.s), r = Math.floor((y - G.y0) / G.s); if (r < 0 || c < 0 || r > 7 || c > 7) return; const f = this.flips(r, c, 1); if (!f.length) { Sfx.play('nope'); return; } this.put({ r, c, f }, 1); },
  update(dt) {
    this.t += dt; this.msgT = Math.max(0, this.msgT - dt); for (const f of this.flip) f.t -= dt; this.flip = this.flip.filter(f => f.t > 0);
    if (this.endT) { this.endT -= dt; if (this.endT <= 0) { const me = this.count(1), ai = this.count(2); this.score = me * 2 + (me > ai ? 50 : 0); this.over = true; this.overText = me > ai ? `你贏了！${me} : ${ai}` : me === ai ? `平手 ${me} : ${ai}` : `機器人贏了 ${me} : ${ai}`; } return; }
    if (this.turn === 2) { this.aiT -= dt; if (this.aiT <= 0) { const M = this.moves(2); let best = null, bs = -1e9; for (const m of M) { const s = this.W[m.r][m.c] + m.f.length * 2 + Math.random() * 3; if (s > bs) { bs = s; best = m; } } if (best) this.put(best, 2); } }
  },
  draw(c) {
    c.fillStyle = '#2a4a3a'; c.fillRect(-20, -20, V.W + 40, V.H + 40); const G = this.geo(), s = G.s;
    Paper.rect(c, G.x0 - 10, G.y0 - 10, s * 8 + 20, s * 8 + 20, '#2f8a4e', 10, { border: 5 });
    c.strokeStyle = 'rgba(0,0,0,0.35)'; c.lineWidth = 2; for (let i = 0; i <= 8; i++) { c.beginPath(); c.moveTo(G.x0, G.y0 + i * s); c.lineTo(G.x0 + 8 * s, G.y0 + i * s); c.moveTo(G.x0 + i * s, G.y0); c.lineTo(G.x0 + i * s, G.y0 + 8 * s); c.stroke(); }
    const hints = this.turn === 1 ? this.moves(1) : [];
    for (const m of hints) { c.fillStyle = 'rgba(255,255,255,0.35)'; c.beginPath(); c.arc(G.x0 + (m.c + 0.5) * s, G.y0 + (m.r + 0.5) * s, s * 0.12, 0, Math.PI * 2); c.fill(); }
    for (let r = 0; r < 8; r++) for (let k = 0; k < 8; k++) { const v = this.b[r][k]; if (!v) continue; const f = this.flip.find(f => f.r === r && f.c === k), sx = f ? Math.abs(Math.cos((0.35 - f.t) / 0.35 * Math.PI)) : 1, col = f && f.t > 0.175 ? (v === 1 ? '#fafafa' : '#2a2a33') : (v === 1 ? '#2a2a33' : '#fafafa');
      c.save(); c.translate(G.x0 + (k + 0.5) * s, G.y0 + (r + 0.5) * s); c.scale(Math.max(0.08, sx), 1); Paper.circle(c, 0, 0, s * 0.4, col, { border: 0, blur: 4 }); c.restore(); }
    if (this.last) { const [r, k] = this.last; c.fillStyle = '#e8453c'; c.beginPath(); c.arc(G.x0 + (k + 0.5) * s, G.y0 + (r + 0.5) * s, s * 0.08, 0, Math.PI * 2); c.fill(); }
    Kid.text(c, this.msgT ? this.msg : this.turn === 1 ? '換你下（有小點的地方）' : this.turn === 2 ? '機器人想一想…' : '', V.W / 2, G.y0 - 34, 22, '#ffffff', 0);
  },
  hud() { return { L: `⚫ 你 <b>${this.count(1)}</b>`, R: `🤖 ⚪ ${this.count(2)}` }; },
});

// ---- 猜猜在哪杯 ----
registerGame({
  id: 'cups', name: '猜猜在哪杯', icon: '🥤', color: '#c9772f',
  desc: '球藏在杯子底下，杯子換來換去，眼睛要跟好！',
  howto: '先看清楚 🔴 球藏在哪個杯子底下，杯子會開始換來換去，眼睛要一直盯著！停下來之後點你覺得有球的那個杯子。一共 8 回合，越後面越快、杯子越多。',
  N: 8,
  start() { this.t = 0; this.score = 0; this.over = false; this.overText = ''; this.k = 0; this.right = 0; this.newRound(); },
  newRound() { const k = this.k; this.n = k < 3 ? 3 : k < 6 ? 4 : 5; this.pos = [...Array(this.n)].map((_, i) => i); this.ball = Math.floor(Math.random() * this.n); this.st = 'show'; this.sT = 1.6; this.swaps = 5 + k * 2; this.dur = Math.max(0.22, 0.6 - k * 0.05); this.sw = null; this.pickI = -1; this.lift = 0; },
  slotX(i) { const w = Math.min(170, (V.W - 40) / this.n); return V.W / 2 + (i - (this.n - 1) / 2) * w; },
  get cy() { return V.H * 0.62; },
  cupXY(cup) { const sw = this.sw; if (sw && (sw.a === cup || sw.b === cup)) { const from = this.slotX(this.pos[cup]), to = this.slotX(this.pos[cup === sw.a ? sw.b : sw.a]), k = (1 - Math.cos(Math.PI * sw.p)) / 2; return { x: from + (to - from) * k, y: this.cy + (cup === sw.a ? -1 : 1) * Math.sin(Math.PI * sw.p) * 50 }; } return { x: this.slotX(this.pos[cup]), y: this.cy }; },
  tap(x, y) {
    if (this.st !== 'pick') return;
    for (let i = 0; i < this.n; i++) { const p = this.cupXY(i); if (Math.abs(x - p.x) < 60 && Math.abs(y - p.y) < 90) { this.pickI = i; this.st = 'reveal'; this.sT = 1.6; const ok = i === this.ball; if (ok) { this.right++; const pts = 10 + this.k * 3; this.score += pts; Sfx.play('win'); FX.text(p.x, p.y - 140, `猜對了！+${pts}`, '#45ad4a', 34); } else { Sfx.play('nope'); FX.text(p.x, p.y - 140, '不是這個…', '#7a62b8', 30); } return; } }
  },
  update(dt) {
    this.t += dt;
    if (this.st === 'show') { this.lift = Math.min(1, this.lift + dt * 4); this.sT -= dt; if (this.sT <= 0) { this.st = 'down'; this.sT = 0.4; } }
    else if (this.st === 'down') { this.lift = Math.max(0, this.lift - dt * 4); this.sT -= dt; if (this.sT <= 0) this.st = 'swap'; }
    else if (this.st === 'swap') {
      if (!this.sw) { if (this.swaps-- <= 0) { this.st = 'pick'; return; } const a = Math.floor(Math.random() * this.n); let b; do b = Math.floor(Math.random() * this.n); while (b === a); this.sw = { a, b, p: 0 }; Sfx.play('swish'); }
      const sw = this.sw; sw.p += dt / this.dur; if (sw.p >= 1) { const t = this.pos[sw.a]; this.pos[sw.a] = this.pos[sw.b]; this.pos[sw.b] = t; this.sw = null; }
    }
    else if (this.st === 'reveal') { this.lift = Math.min(1, this.lift + dt * 4); this.sT -= dt; if (this.sT <= 0) { this.k++; if (this.k >= this.N) { this.over = true; this.overText = `猜對 ${this.right} / ${this.N} 次！`; return; } this.newRound(); } }
  },
  draw(c) {
    c.fillStyle = '#f2e3c8'; c.fillRect(-20, -20, V.W + 40, V.H + 40); Paper.rect(c, -20, V.H * 0.62 + 70, V.W + 40, V.H, '#a0683c', 0, { border: 4 });
    const show = this.st === 'show' || this.st === 'down', rev = this.st === 'reveal';
    for (let i = 0; i < this.n; i++) {
      const p = this.cupXY(i), up = (show || (rev && (i === this.pickI || i === this.ball))) ? this.lift : 0;
      if (i === this.ball && up > 0.05) Paper.circle(c, p.x, p.y + 50, 22, '#e8453c', { border: 3 });
      c.save(); c.translate(p.x, p.y - up * 90);
      Paper.shape(c, cc => { cc.moveTo(-46, 70); cc.lineTo(46, 70); cc.lineTo(32, -60); cc.lineTo(-32, -60); cc.closePath(); }, '#e9654b', { border: 4, blur: 6 });
      c.fillStyle = 'rgba(255,255,255,0.3)'; c.fillRect(-26, -50, 10, 110); c.fillStyle = '#c9472f'; c.fillRect(-40, 40, 80, 10);
      c.restore();
    }
    const msg = this.st === 'show' ? '球在這裡，看清楚！' : this.st === 'swap' || this.st === 'down' ? '眼睛跟好…' : this.st === 'pick' ? '球在哪一杯？' : '';
    Kid.text(c, msg, V.W / 2, V.H * 0.3, 32, '#4a3520', 6);
    Puppet.draw(c, App.pup, Kid.portrait() ? 70 : V.W * 0.1, V.H - 8, Kid.portrait() ? 110 : 180, this.st === 'reveal' && this.pickI === this.ball ? Puppet.Poses.cheer(this.t) : Puppet.Poses.idle(this.t));
  },
  hud() { return { L: `<b>${this.score}</b> 分`, R: `第 ${Math.min(this.k + 1, this.N)} / ${this.N} 回合` }; },
});
