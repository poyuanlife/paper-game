'use strict';
// =====================================================
//  大朋友第四彈：1A2B、算 24、孤獨跳棋、播棋、海戰、打靶、舒爾特方格、閃現記憶、顏色字、賓果、拿石頭、湊十、閃現數量
// =====================================================

// 數字鍵盤（給 1A2B 用）
const NumPad = { btn(i) { const P = Kid.portrait(), w = Math.min((V.W - 40) / (P ? 5 : 10), 70); const r = P ? Math.floor(i / 5) : 0, k = P ? i % 5 : i; return { x: V.W / 2 + (k - (P ? 2 : 4.5)) * (w + 6), y: V.H - (P ? 150 : 80) + r * (w + 6), w, h: w }; } };

// ---- 1A2B ----
registerGame({
  id: 'codebreak', name: '猜數字 1A2B', icon: '🔢', color: '#5b6fd6',
  desc: '猜出 4 個不重複的數字密碼！A 是位置對，B 是數字對位置錯。',
  howto: '電腦藏了 4 個不重複的數字。輸入你的猜測，會告訴你幾 A 幾 B：A = 數字和位置都對，B = 數字對但位置錯。用最少次數猜到 4A！最多 10 次。',
  start() { this.t = 0; this.score = 0; this.over = false; this.overText = ''; const d = Kid.shuffle([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]); this.code = d.slice(0, 4); this.cur = []; this.hist = []; this.endT = 0; },
  tap(x, y) {
    if (this.endT) return;
    for (let i = 0; i < 10; i++) if (Kid.hit(NumPad.btn(i), x, y)) { if (this.cur.length < 4 && !this.cur.includes(i)) { this.cur.push(i); Sfx.play('click'); } else Sfx.play('nope'); return; }
    if (Kid.hit(this.bDel, x, y)) { this.cur.pop(); Sfx.play('click'); return; }
    if (Kid.hit(this.bOk, x, y)) this.guess();
  },
  key(k) { if (/^\d$/.test(k)) { const B = NumPad.btn(+k); this.tap(B.x, B.y); } else if (k === 'enter') this.guess(); else if (k === 'backspace') this.cur.pop(); },
  get bDel() { const P = Kid.portrait(); return { x: V.W / 2 - 80, y: V.H - (P ? 220 : 160), w: 120, h: 50 }; },
  get bOk() { const P = Kid.portrait(); return { x: V.W / 2 + 80, y: V.H - (P ? 220 : 160), w: 120, h: 50 }; },
  guess() {
    if (this.cur.length < 4 || this.endT) { Sfx.play('nope'); return; }
    let a = 0, b = 0; this.cur.forEach((d, i) => { if (this.code[i] === d) a++; else if (this.code.includes(d)) b++; });
    this.hist.push({ g: this.cur.join(''), a, b }); this.cur = []; Sfx.play(a === 4 ? 'win' : 'tick');
    if (a === 4) { this.score = Math.max(10, 110 - this.hist.length * 10); this.endT = 1.5; this.overText = `${this.hist.length} 次就猜到了！`; }
    else if (this.hist.length >= 10) { this.endT = 1.5; this.score = 0; this.overText = `答案是 ${this.code.join('')}`; }
  },
  update(dt) { this.t += dt; if (this.endT) { this.endT -= dt; if (this.endT <= 0) this.over = true; } },
  draw(c) {
    c.fillStyle = '#eef0fb'; c.fillRect(-20, -20, V.W + 40, V.H + 40); const P = Kid.portrait(), top = P ? 130 : 84;
    for (let i = 0; i < 4; i++) { const x = V.W / 2 + (i - 1.5) * 64; Paper.rect(c, x - 26, top, 52, 60, '#ffffff', 10, { border: 3 }); Kid.text(c, this.cur[i] != null ? String(this.cur[i]) : '', x, top + 32, 36, '#5b6fd6', 0); }
    const rows = this.hist.slice(-(P ? 6 : 5)); rows.forEach((h, i) => { const y = top + 90 + i * 34; Kid.text(c, h.g, V.W / 2 - 60, y, 26, '#4a3520', 0); Kid.text(c, `${h.a}A ${h.b}B`, V.W / 2 + 60, y, 26, h.a === 4 ? '#45ad4a' : '#e0573c', 0); });
    for (let i = 0; i < 10; i++) { const b = NumPad.btn(i); Kid.button(c, b, String(i), this.cur.includes(i) ? '#c8c8d8' : '#5b6fd6', { size: b.h * 0.5 }); }
    Kid.button(c, this.bDel, '⌫', '#e8453c', { size: 26 }); Kid.button(c, this.bOk, 'OK', '#45ad4a', { size: 26 });
  },
  hud() { return { L: `<b>${this.score}</b> 分`, R: `第 ${Math.min(this.hist.length + 1, 10)} / 10 次` }; },
});

// ---- 算 24 ----
registerGame({
  id: 'make24', name: '算 24', icon: '🃏', color: '#e9654b',
  desc: '用四個數字加減乘除，算出 24！',
  howto: '點一個數字，再點運算符號（＋ − × ÷），再點另一個數字，兩個就會合成一個。四個數字合成最後一個 24 就成功！算錯了可以按「重來」。一共 5 題。',
  N: 5,
  start() { this.t = 0; this.score = 0; this.over = false; this.overText = '算數大師！'; this.k = 0; this.newQ(); },
  solvable(a) { if (a.length === 1) return Math.abs(a[0] - 24) < 1e-6; for (let i = 0; i < a.length; i++) for (let j = 0; j < a.length; j++) { if (i === j) continue; const r = a.filter((_, k) => k !== i && k !== j); for (const v of [a[i] + a[j], a[i] - a[j], a[i] * a[j], a[j] ? a[i] / a[j] : null]) if (v != null && this.solvable([...r, v])) return true; } return false; },
  newQ() { let a; do a = [0, 0, 0, 0].map(() => 1 + Math.floor(Math.random() * 9)); while (!this.solvable(a)); this.orig = a; this.reset(); this.qt = 0; this.doneT = 0; },
  reset() { this.nums = this.orig.map((v, i) => ({ v, id: i })); this.sel = null; this.op = null; },
  frac(v) { return Number.isInteger(v) ? String(v) : (Math.round(v * 100) / 100).toString(); },
  card(i, n) { const P = Kid.portrait(), w = Math.min((V.W - 40) / n - 12, 110); return { x: V.W / 2 + (i - (n - 1) / 2) * (w + 12), y: V.H * (P ? 0.38 : 0.36), w, h: w * 1.3 }; },
  opb(i) { const w = 70; return { x: V.W / 2 + (i - 1.5) * (w + 12), y: V.H * 0.62, w, h: w }; },
  get bReset() { return { x: V.W / 2, y: V.H * 0.8, w: 160, h: 56 }; },
  tap(x, y) {
    if (this.doneT) return;
    if (Kid.hit(this.bReset, x, y)) { this.reset(); Sfx.play('swish'); return; }
    for (let i = 0; i < 4; i++) if (Kid.hit(this.opb(i), x, y)) { if (this.sel != null) { this.op = i; Sfx.play('click'); } return; }
    const n = this.nums.length;
    for (let i = 0; i < n; i++) if (Kid.hit(this.card(i, n), x, y)) {
      if (this.sel == null || this.op == null || this.sel === i) { this.sel = this.sel === i ? null : i; this.op = null; Sfx.play('click'); return; }
      const a = this.nums[this.sel].v, b = this.nums[i].v, v = [a + b, a - b, a * b, b ? a / b : NaN][this.op];
      if (!isFinite(v)) { Sfx.play('nope'); return; }
      const keep = this.nums.filter((_, k) => k !== i && k !== this.sel); keep.push({ v }); this.nums = keep; this.sel = this.nums.length - 1; this.op = null; Sfx.play('snap');
      if (this.nums.length === 1) { if (Math.abs(v - 24) < 1e-6) { const pts = Math.max(10, Math.round(50 - this.qt)); this.score += pts; this.doneT = 1.6; Sfx.play('win'); FX.text(V.W / 2, V.H * 0.2, `24！+${pts}`, '#e0573c', 44); } else { Sfx.play('nope'); FX.text(V.W / 2, V.H * 0.2, `是 ${this.frac(v)}，不是 24`, '#7a62b8', 30); setTimeout(() => this.reset(), 900); } }
      return;
    }
  },
  update(dt) { this.t += dt; if (this.doneT) { this.doneT -= dt; if (this.doneT <= 0) { this.k++; if (this.k >= this.N) { this.over = true; return; } this.newQ(); } } else this.qt += dt; },
  draw(c) {
    c.fillStyle = '#2f5a3a'; c.fillRect(-20, -20, V.W + 40, V.H + 40); const n = this.nums.length;
    Kid.text(c, '= 24', V.W / 2, Kid.portrait() ? 150 : 100, 44, '#ffd23f', 0);
    for (let i = 0; i < n; i++) { const b = this.card(i, n); Paper.rect(c, b.x - b.w / 2, b.y - b.h / 2 - (this.sel === i ? 10 : 0), b.w, b.h, this.sel === i ? '#fff1b8' : '#ffffff', 12, { border: 4 }); Kid.text(c, this.frac(this.nums[i].v), b.x, b.y - (this.sel === i ? 10 : 0), Math.min(48, b.w * 0.45), '#e0573c', 0); }
    ['＋', '−', '×', '÷'].forEach((o, i) => Kid.button(c, this.opb(i), o, this.op === i ? '#e0573c' : '#5b6fd6', { size: 34, alpha: this.sel == null ? 0.5 : 1 }));
    Kid.button(c, this.bReset, '↺ 重來', '#8a8f99', { size: 24 });
  },
  hud() { return { L: `<b>${this.score}</b> 分`, R: `第 ${Math.min(this.k + 1, this.N)} / ${this.N} 題` }; },
});

// ---- 孤獨跳棋 ----
registerGame({
  id: 'pegsolo', name: '孤獨跳棋', icon: '⚪', color: '#8a5a34',
  desc: '棋子跳過旁邊的棋子把它吃掉，剩越少越好！',
  howto: '點一顆棋子，再點隔一格的空洞，它就會跳過中間的棋子並把它吃掉（只能上下左右）。一直跳到不能再跳，最後只剩一顆就是大師！剩越少分數越高。',
  start() { this.t = 0; this.score = 0; this.over = false; this.overText = ''; this.b = []; for (let r = 0; r < 7; r++) for (let c = 0; c < 7; c++) { const ok = (r >= 2 && r <= 4) || (c >= 2 && c <= 4); this.b.push(ok ? (r === 3 && c === 3 ? 0 : 1) : -1); } this.sel = -1; this.endT = 0; this.last = null; },
  geo() { const P = Kid.portrait(), S = Math.min(V.W - 50, V.H - (P ? 240 : 120), 520), s = S / 7; return { s, x0: V.W / 2 - S / 2, y0: (P ? 130 : 84) + (V.H - (P ? 240 : 120) - S) / 2 }; },
  moves() { const L = []; for (let i = 0; i < 49; i++) { if (this.b[i] !== 1) continue; const r = Math.floor(i / 7), c = i % 7; for (const [dr, dc] of [[0, 1], [1, 0], [0, -1], [-1, 0]]) { const r2 = r + dr * 2, c2 = c + dc * 2; if (r2 < 0 || c2 < 0 || r2 > 6 || c2 > 6) continue; if (this.b[(r + dr) * 7 + c + dc] === 1 && this.b[r2 * 7 + c2] === 0) L.push([i, r2 * 7 + c2]); } } return L; },
  tap(x, y) {
    if (this.endT) return; const G = this.geo(), c = Math.floor((x - G.x0) / G.s), r = Math.floor((y - G.y0) / G.s); if (c < 0 || r < 0 || c > 6 || r > 6) return; const i = r * 7 + c;
    if (this.b[i] === 1) { this.sel = i; Sfx.play('click'); return; }
    if (this.b[i] === 0 && this.sel >= 0) { const m = this.moves().find(m => m[0] === this.sel && m[1] === i); if (!m) { Sfx.play('nope'); return; } const mid = (this.sel + i) / 2; this.b[this.sel] = 0; this.b[mid] = 0; this.b[i] = 1; this.sel = i; this.last = mid; Sfx.play('snap');
      if (!this.moves().length) { const left = this.b.filter(v => v === 1).length; this.score = Math.max(5, (33 - left) * 4 + (left === 1 ? 100 : 0)); this.endT = 1.5; this.overText = left === 1 ? '只剩一顆，大師！' : `剩下 ${left} 顆`; Sfx.play(left <= 3 ? 'win' : 'over'); } }
  },
  update(dt) { this.t += dt; if (this.endT) { this.endT -= dt; if (this.endT <= 0) this.over = true; } },
  draw(c) {
    c.fillStyle = '#e8d4a8'; c.fillRect(-20, -20, V.W + 40, V.H + 40); const G = this.geo();
    Paper.circle(c, V.W / 2, G.y0 + G.s * 3.5, Math.min(G.s * 3.9, V.W / 2 - 6), '#c98a4b', { border: 5 });
    for (let i = 0; i < 49; i++) { if (this.b[i] < 0) continue; const x = G.x0 + (i % 7 + 0.5) * G.s, y = G.y0 + (Math.floor(i / 7) + 0.5) * G.s; c.fillStyle = '#7a4a22'; c.beginPath(); c.arc(x, y, G.s * 0.2, 0, Math.PI * 2); c.fill(); if (this.b[i] === 1) Paper.circle(c, x, y, G.s * 0.36, i === this.sel ? '#ffd23f' : '#f2f2f6', { border: 2, blur: 4 }); }
    Kid.text(c, `剩下 ${this.b.filter(v => v === 1).length} 顆`, V.W / 2, G.y0 + G.s * 7 + 30, 24, '#4a3520', 6);
  },
  hud() { return { L: `<b>${this.score}</b> 分`, R: `⚪ ${this.b.filter(v => v === 1).length}` }; },
});

// ---- 播棋 ----
registerGame({
  id: 'mancala', name: '播棋', icon: '🥜', color: '#a0683c',
  desc: '撒豆子的古老遊戲，跟機器人比誰收進大洞的豆子多！',
  howto: '點下面一排你的一個洞，裡面的豆子會一顆一顆往右（逆時針）撒進後面的洞。最後一顆落在自己的大洞可以再下一次；落在自己的空洞會把對面的豆子一起收走！豆子撒完時，大洞裡豆子多的人贏。',
  start() { this.t = 0; this.score = 0; this.over = false; this.overText = ''; this.p = [4, 4, 4, 4, 4, 4, 0, 4, 4, 4, 4, 4, 4, 0]; this.turn = 0; this.aiT = 0; this.endT = 0; this.msg = ''; },
  sow(i) {
    let n = this.p[i]; this.p[i] = 0; let k = i; const me = this.turn === 0, skip = me ? 13 : 6;
    while (n) { k = (k + 1) % 14; if (k === skip) continue; this.p[k]++; n--; }
    const own = me ? k >= 0 && k <= 5 : k >= 7 && k <= 12, store = me ? 6 : 13;
    if (own && this.p[k] === 1 && this.p[12 - k] > 0) { this.p[store] += this.p[12 - k] + 1; this.p[12 - k] = 0; this.p[k] = 0; Sfx.play('coin'); this.msg = me ? '收走對面的豆子！' : '機器人收走了豆子'; }
    const sideA = this.p.slice(0, 6).reduce((a, b) => a + b, 0), sideB = this.p.slice(7, 13).reduce((a, b) => a + b, 0);
    if (!sideA || !sideB) { this.p[6] += sideA; this.p[13] += sideB; for (const j of [0, 1, 2, 3, 4, 5, 7, 8, 9, 10, 11, 12]) this.p[j] = 0; this.endT = 1.6; const w = this.p[6] > this.p[13]; this.score = this.p[6] * 2 + (w ? 50 : 0); this.overText = w ? `你贏了！${this.p[6]} : ${this.p[13]}` : this.p[6] === this.p[13] ? `平手 ${this.p[6]} : ${this.p[13]}` : `機器人贏了 ${this.p[6]} : ${this.p[13]}`; Sfx.play(w ? 'win' : 'over'); return; }
    if (k !== store) this.turn = 1 - this.turn; else this.msg = me ? '再下一次！' : '機器人再下一次';
    this.aiT = 0.8;
  },
  pit(i) { const P = Kid.portrait(), w = Math.min((V.W - 40) / 8 - 8, 90), cx = V.W / 2, y0 = V.H * 0.5; if (i === 6) return { x: cx + 3.5 * (w + 6), y: y0, r: w * 0.45, big: 1 }; if (i === 13) return { x: cx - 3.5 * (w + 6), y: y0, r: w * 0.45, big: 1 }; if (i < 6) return { x: cx + (i - 2.5) * (w + 6), y: y0 + w * 0.7, r: w * 0.42 }; return { x: cx + (12 - i - 2.5) * (w + 6), y: y0 - w * 0.7, r: w * 0.42 }; },
  tap(x, y) { if (this.turn || this.endT) return; for (let i = 0; i < 6; i++) { const P = this.pit(i); if (Math.hypot(P.x - x, P.y - y) < P.r * 1.2) { if (!this.p[i]) { Sfx.play('nope'); return; } this.msg = ''; Sfx.play('rustle'); this.sow(i); return; } } },
  update(dt) {
    this.t += dt; if (this.endT) { this.endT -= dt; if (this.endT <= 0) this.over = true; return; }
    if (this.turn === 1) { this.aiT -= dt; if (this.aiT <= 0) { let best = -1, bs = -1e9; for (let i = 7; i < 13; i++) { if (!this.p[i]) continue; const land = (i + this.p[i]) % 13; const s = (land === 13 - 0 ? 0 : 0) + (i + this.p[i] === 13 ? 10 : 0) + this.p[i] * 0.1 + Math.random(); if (s > bs) { bs = s; best = i; } } if (best >= 0) { Sfx.play('rustle'); this.sow(best); } } }
  },
  draw(c) {
    c.fillStyle = '#e8d4a8'; c.fillRect(-20, -20, V.W + 40, V.H + 40); const w = Math.min((V.W - 40) / 8 - 8, 90);
    Paper.rect(c, V.W / 2 - 4 * (w + 6) - 10, V.H * 0.5 - w * 1.3, 8 * (w + 6) + 20, w * 2.6, '#a0683c', 30, { border: 5 });
    for (let i = 0; i < 14; i++) { const P = this.pit(i); c.fillStyle = '#7a4a22'; c.beginPath(); if (P.big) c.ellipse(P.x, P.y, P.r, w * 1.1, 0, 0, Math.PI * 2); else c.arc(P.x, P.y, P.r, 0, Math.PI * 2); c.fill();
      for (let k = 0; k < Math.min(this.p[i], 14); k++) { c.fillStyle = ['#ffd23f', '#e8453c', '#45ad4a', '#3f8fe0'][k % 4]; c.beginPath(); c.arc(P.x + Math.sin(k * 2.4) * P.r * 0.5, P.y + Math.cos(k * 1.7) * (P.big ? w * 0.7 : P.r * 0.5), 5, 0, Math.PI * 2); c.fill(); }
      Kid.text(c, String(this.p[i]), P.x, P.y + (i < 6 ? P.r + 18 : i > 6 && i < 13 ? -P.r - 18 : w * 1.1 + 18), 20, '#4a3520', 4); }
    Kid.text(c, this.endT ? '' : this.turn ? '機器人想一想…' : '換你下（點下面一排）', V.W / 2, V.H * 0.5 + w * 1.7, 22, '#4a3520', 6);
    if (this.msg) Kid.text(c, this.msg, V.W / 2, V.H * 0.5 - w * 1.7, 24, '#e0573c', 6);
  },
  hud() { return { L: `我 <b>${this.p[6]}</b>`, R: `🤖 ${this.p[13]}` }; },
});

// ---- 海戰 ----
registerGame({
  id: 'seabattle', name: '紙片海戰', icon: '🚢', color: '#2f7fc1',
  desc: '輪流猜位置開砲，先擊沉對方所有船的人贏！',
  howto: '上面是機器人的海，點一格開砲：💥 打中、💧 沒打中。機器人也會打你的海（下面）。雙方各有 3 艘船，先把對方的船全部擊沉就贏了！',
  N: 6,
  start() { this.t = 0; this.score = 0; this.over = false; this.overText = ''; this.ai = this.place(); this.me = this.place(); this.shotA = new Set(); this.shotM = new Set(); this.turn = 0; this.aiT = 0; this.endT = 0; this.shots = 0; },
  place() { const N = this.N, cells = new Set(), ships = []; for (const len of [3, 2, 2]) { for (let k = 0; k < 200; k++) { const h = Math.random() < 0.5, r = Math.floor(Math.random() * (h ? N : N - len + 1)), c = Math.floor(Math.random() * (h ? N - len + 1 : N)), L = []; for (let i = 0; i < len; i++) L.push((r + (h ? 0 : i)) * N + c + (h ? i : 0)); if (L.every(x => !cells.has(x))) { L.forEach(x => cells.add(x)); ships.push(L); break; } } } return { cells, ships }; },
  sunk(S, shot) { return S.ships.filter(L => L.every(x => shot.has(x))).length; },
  grid(top) { const P = Kid.portrait(), s = Math.min((V.W - 40) / this.N, (V.H - (P ? 220 : 130)) / (this.N * 2 + 1)), x0 = V.W / 2 - s * this.N / 2, y0 = (P ? 130 : 84) + (top ? 0 : s * (this.N + 1)); return { s, x0, y0 }; },
  tap(x, y) {
    if (this.turn || this.endT) return; const G = this.grid(true), c = Math.floor((x - G.x0) / G.s), r = Math.floor((y - G.y0) / G.s); if (c < 0 || r < 0 || c >= this.N || r >= this.N) return; const i = r * this.N + c; if (this.shotA.has(i)) return;
    this.shotA.add(i); this.shots++; const hit = this.ai.cells.has(i); Sfx.play(hit ? 'boom' : 'splash'); if (hit) V.shake = 4;
    if (this.sunk(this.ai, this.shotA) === 3) { this.endT = 1.5; this.score = Math.max(20, 120 - this.shots * 2); this.overText = '敵艦全滅，你贏了！'; Sfx.play('win'); return; }
    this.turn = 1; this.aiT = 0.8;
  },
  update(dt) {
    this.t += dt; if (this.endT) { this.endT -= dt; if (this.endT <= 0) this.over = true; return; }
    if (this.turn) { this.aiT -= dt; if (this.aiT <= 0) {
      const N = this.N, hits = [...this.shotM].filter(x => this.me.cells.has(x) && !this.me.ships.some(L => L.includes(x) && L.every(y => this.shotM.has(y)))); let cand = [];
      for (const h of hits) { const r = Math.floor(h / N), c = h % N; for (const [dr, dc] of [[0, 1], [1, 0], [0, -1], [-1, 0]]) { const r2 = r + dr, c2 = c + dc; if (r2 >= 0 && c2 >= 0 && r2 < N && c2 < N && !this.shotM.has(r2 * N + c2)) cand.push(r2 * N + c2); } }
      if (!cand.length) for (let i = 0; i < N * N; i++) if (!this.shotM.has(i)) cand.push(i);
      const i = pick(cand); this.shotM.add(i); Sfx.play(this.me.cells.has(i) ? 'boom' : 'splash');
      if (this.sunk(this.me, this.shotM) === 3) { this.endT = 1.5; this.score = 10; this.overText = '你的船被擊沉了…'; Sfx.play('over'); return; }
      this.turn = 0; } }
  },
  draw(c) {
    c.fillStyle = '#1d4f7a'; c.fillRect(-20, -20, V.W + 40, V.H + 40);
    for (const top of [true, false]) { const G = this.grid(top), shot = top ? this.shotA : this.shotM, S = top ? this.ai : this.me;
      for (let i = 0; i < this.N * this.N; i++) { const x = G.x0 + (i % this.N) * G.s, y = G.y0 + Math.floor(i / this.N) * G.s; c.fillStyle = top ? '#3f8fe0' : '#2f7fc1'; c.fillRect(x + 1, y + 1, G.s - 2, G.s - 2);
        if (!top && S.cells.has(i)) Paper.rect(c, x + 4, y + 4, G.s - 8, G.s - 8, '#9aa3b0', 6, { border: 0, shadow: false });
        if (shot.has(i)) Kid.emoji(c, S.cells.has(i) ? '💥' : '💧', x + G.s / 2, y + G.s / 2, G.s * 0.6); }
      Kid.text(c, top ? `🤖 敵方的海（沉 ${this.sunk(this.ai, this.shotA)}/3）` : `我的海（沉 ${this.sunk(this.me, this.shotM)}/3）`, V.W / 2, top ? G.y0 + G.s * this.N + 14 : G.y0 + G.s * this.N + 18, 18, '#ffffff', 0); }
    if (!this.endT) Kid.text(c, this.turn ? '機器人想一想…' : '點上面開砲！', V.W / 2, Kid.portrait() ? 112 : 70, 20, '#ffd23f', 0);
  },
  hud() { return { L: `<b>${this.score}</b> 分`, R: `💣 ${this.shots}` }; },
});

// ---- 打靶練習 ----
registerGame({
  id: 'aimtap', name: '快手打靶', icon: '🎯', color: '#e8453c',
  desc: '靶子一個一個冒出來，越快點到分數越高！',
  howto: '靶子會在畫面各處冒出來，趁它縮小消失前點它！點到中心分數更多，連續點中有加成。漏掉 5 個就結束。',
  start() { this.t = 0; this.score = 0; this.over = false; this.overText = ''; this.tg = []; this.spawnT = 0.5; this.miss = 0; this.hits = 0; this.combo = 0; },
  tap(x, y) {
    for (const T of this.tg) { const d = Math.hypot(T.x - x, T.y - y), r = T.R * T.k; if (d < r) { T.dead = 1; this.hits++; this.combo++; const pts = (d < r * 0.35 ? 20 : 10) + Math.min(10, this.combo); this.score += pts; Sfx.play(d < r * 0.35 ? 'star' : 'pins'); FX.text(T.x, T.y - 30, '+' + pts, '#ff7a00', 26); return; } }
    this.combo = 0; Sfx.play('whiff');
  },
  update(dt) {
    this.t += dt; this.spawnT -= dt; const P = Kid.portrait(), top = P ? 140 : 90;
    if (this.spawnT <= 0) { this.tg.push({ x: rand(50, V.W - 50), y: rand(top + 40, V.H - 50), R: 46, k: 0, life: Math.max(1.1, 2.2 - this.t / 40), age: 0 }); this.spawnT = Math.max(0.35, 0.9 - this.t / 60); }
    for (const T of this.tg) { T.age += dt; const u = T.age / T.life; T.k = u < 0.2 ? u / 0.2 : 1 - (u - 0.2) / 0.8; if (u >= 1 && !T.dead) { T.dead = 1; this.miss++; this.combo = 0; Sfx.play('nope'); if (this.miss >= 5) { this.over = true; this.overText = `打中 ${this.hits} 個靶！`; } } }
    this.tg = this.tg.filter(T => !T.dead);
  },
  draw(c) {
    c.fillStyle = '#f2ead8'; c.fillRect(-20, -20, V.W + 40, V.H + 40);
    for (const T of this.tg) { const r = T.R * Math.max(0, T.k); for (let i = 0; i < 4; i++) { c.fillStyle = i % 2 ? '#ffffff' : '#e8453c'; c.beginPath(); c.arc(T.x, T.y, r * (1 - i * 0.25), 0, Math.PI * 2); c.fill(); } }
  },
  hud() { return { L: `<b>${this.score}</b> 分`, R: TiltUI.lives(5 - this.miss, 5) }; },
});

// ---- 舒爾特方格 ----
registerGame({
  id: 'schulte', name: '數字快找', icon: '🔟', color: '#3c9a8a',
  desc: '1 到 25 的數字亂排，照順序最快點完！',
  howto: '格子裡有亂排的數字，從 1 開始照順序點，越快點完分數越高！點錯會扣 1 秒。一共 3 關（3×3、4×4、5×5）。',
  SZ: [3, 4, 5],
  start() { this.t = 0; this.score = 0; this.over = false; this.overText = '眼明手快！'; this.lv = 0; this.newLevel(); },
  newLevel() { const n = this.SZ[this.lv]; this.n = n; this.nums = Kid.shuffle([...Array(n * n)].map((_, i) => i + 1)); this.next = 1; this.rt = 0; this.doneT = 0; this.flash = -1; },
  geo() { const P = Kid.portrait(), S = Math.min(V.W - 30, V.H - (P ? 220 : 120), 520), s = S / this.n; return { s, x0: V.W / 2 - S / 2, y0: (P ? 140 : 90) + (V.H - (P ? 220 : 120) - S) / 2 }; },
  tap(x, y) {
    if (this.doneT) return; const G = this.geo(), c = Math.floor((x - G.x0) / G.s), r = Math.floor((y - G.y0) / G.s); if (c < 0 || r < 0 || c >= this.n || r >= this.n) return; const i = r * this.n + c;
    if (this.nums[i] === this.next) { this.next++; this.flash = i; Sfx.play('tick'); if (this.next > this.n * this.n) { const pts = Math.max(10, Math.round(this.n * this.n * 4 - this.rt * 2)); this.score += pts; this.doneT = 1.6; Sfx.play('win'); FX.text(V.W / 2, V.H * 0.2, `${this.rt.toFixed(1)} 秒！+${pts}`, '#e0573c', 36); } }
    else { this.rt += 1; Sfx.play('nope'); }
  },
  update(dt) { this.t += dt; if (this.doneT) { this.doneT -= dt; if (this.doneT <= 0) { if (this.lv + 1 >= this.SZ.length) { this.over = true; return; } this.lv++; this.newLevel(); } } else this.rt += dt; },
  draw(c) {
    c.fillStyle = '#e4f1ee'; c.fillRect(-20, -20, V.W + 40, V.H + 40); const G = this.geo();
    for (let i = 0; i < this.n * this.n; i++) { const x = G.x0 + (i % this.n) * G.s, y = G.y0 + Math.floor(i / this.n) * G.s, done = this.nums[i] < this.next; Paper.rect(c, x + 3, y + 3, G.s - 6, G.s - 6, done ? '#c8e6c0' : '#ffffff', 10, { border: 2, blur: 2 }); Kid.text(c, String(this.nums[i]), x + G.s / 2, y + G.s / 2, G.s * 0.42, done ? '#9ab8a0' : '#3c9a8a', 0); }
    Kid.text(c, `找 ${Math.min(this.next, this.n * this.n)}　⏱ ${this.rt.toFixed(1)}`, V.W / 2, G.y0 + G.s * this.n + 30, 24, '#4a3520', 6);
  },
  hud() { return { L: `<b>${this.score}</b> 分`, R: `第 ${this.lv + 1} / 3 關` }; },
});

// ---- 閃現記憶 ----
registerGame({
  id: 'flashgrid', name: '閃現記憶', icon: '🟨', color: '#ffb31f',
  desc: '格子亮一下就消失，記住位置再點出來！',
  howto: '有幾個格子會亮一下，記住它們的位置！消失後把它們全部點出來。全對就會多一格，點錯 3 次就結束。',
  start() { this.t = 0; this.score = 0; this.over = false; this.overText = ''; this.lives = 3; this.cnt = 3; this.best = 0; this.round(); },
  round() { this.n = this.cnt <= 4 ? 4 : this.cnt <= 7 ? 5 : 6; this.lit = new Set(Kid.shuffle([...Array(this.n * this.n)].map((_, i) => i)).slice(0, this.cnt)); this.got = new Set(); this.bad = -1; this.st = 'show'; this.sT = 1.2 + this.cnt * 0.15; },
  geo() { const P = Kid.portrait(), S = Math.min(V.W - 30, V.H - (P ? 220 : 120), 500), s = S / this.n; return { s, x0: V.W / 2 - S / 2, y0: (P ? 140 : 90) + (V.H - (P ? 220 : 120) - S) / 2 }; },
  tap(x, y) {
    if (this.st !== 'input') return; const G = this.geo(), c = Math.floor((x - G.x0) / G.s), r = Math.floor((y - G.y0) / G.s); if (c < 0 || r < 0 || c >= this.n || r >= this.n) return; const i = r * this.n + c; if (this.got.has(i)) return;
    if (this.lit.has(i)) { this.got.add(i); Sfx.play('pop'); if (this.got.size === this.lit.size) { this.best = Math.max(this.best, this.cnt); this.score += this.cnt * 10; this.cnt++; this.st = 'wait'; this.sT = 0.8; Sfx.play('ding'); } }
    else { this.bad = i; this.lives--; Sfx.play('nope'); this.st = 'wait'; this.sT = 1; if (this.lives <= 0) { this.over = true; this.overText = `最多記住 ${this.best} 格！`; } }
  },
  update(dt) { this.t += dt; if (this.st === 'show') { this.sT -= dt; if (this.sT <= 0) this.st = 'input'; } else if (this.st === 'wait') { this.sT -= dt; if (this.sT <= 0) this.round(); } },
  draw(c) {
    c.fillStyle = '#2a2a40'; c.fillRect(-20, -20, V.W + 40, V.H + 40); const G = this.geo();
    for (let i = 0; i < this.n * this.n; i++) { const x = G.x0 + (i % this.n) * G.s, y = G.y0 + Math.floor(i / this.n) * G.s, on = (this.st === 'show' && this.lit.has(i)) || this.got.has(i) || (this.st === 'wait' && this.lit.has(i)); c.fillStyle = i === this.bad ? '#e8453c' : on ? '#ffd23f' : '#4a4a6a'; c.fillRect(x + 4, y + 4, G.s - 8, G.s - 8); }
    Kid.text(c, this.st === 'show' ? '記住亮的格子！' : this.st === 'input' ? `點出 ${this.cnt} 格` : '', V.W / 2, G.y0 + G.s * this.n + 30, 24, '#ffffff', 0);
  },
  hud() { return { L: `<b>${this.score}</b> 分`, R: TiltUI.lives(this.lives) }; },
});

// ---- 顏色字 ----
registerGame({
  id: 'stroop', name: '顏色字大考驗', icon: '🌈', color: '#8e4bc6',
  desc: '字寫「紅」卻是藍色的！點出字的「顏色」，不是字！',
  howto: '畫面上會出現一個顏色的字，但字本身的顏色不一定一樣。要點的是「字的顏色」！例如藍色的「紅」，要點藍色。限時 40 秒，答錯扣 3 秒。',
  TIME: 40, C: [['紅色', '#e8453c'], ['藍色', '#3f8fe0'], ['綠色', '#45ad4a'], ['黃色', '#ffc21f']],
  start() { this.t = 0; this.left = this.TIME; this.score = 0; this.over = false; this.overText = ''; this.n = 0; this.combo = 0; this.next(); },
  next() { this.word = Math.floor(Math.random() * 4); do this.ink = Math.floor(Math.random() * 4); while (this.ink === this.word && Math.random() < 0.8); this.pop = 1; },
  btn(i) { const P = Kid.portrait(), w = Math.min((V.W - 50) / (P ? 2 : 4), 200), cols = P ? 2 : 4; return { x: V.W / 2 + ((i % cols) - (cols - 1) / 2) * (w + 10), y: V.H * (P ? 0.66 : 0.72) + Math.floor(i / cols) * (w * 0.5 + 10), w, h: w * 0.5 }; },
  tap(x, y) { for (let i = 0; i < 4; i++) if (Kid.hit(this.btn(i), x, y)) { if (i === this.ink) { this.n++; this.combo++; this.score += 10 + Math.min(10, this.combo); Sfx.play('ding'); } else { this.combo = 0; this.left -= 3; Sfx.play('nope'); V.shake = 4; } this.next(); return; } },
  key(k) { const i = ['1', '2', '3', '4'].indexOf(k); if (i >= 0) { const b = this.btn(i); this.tap(b.x, b.y); } },
  update(dt) { this.t += dt; this.left -= dt; this.pop = Math.max(0, this.pop - dt * 4); if (this.left <= 0) { this.left = 0; this.over = true; this.overText = `答對 ${this.n} 題！`; } },
  draw(c) {
    c.fillStyle = '#f5f0fa'; c.fillRect(-20, -20, V.W + 40, V.H + 40);
    Paper.rect(c, V.W / 2 - 160, V.H * 0.24, 320, 170, '#ffffff', 24, { border: 5 });
    Kid.text(c, this.C[this.word][0], V.W / 2, V.H * 0.24 + 85, 80 * (1 + this.pop * 0.15), this.C[this.ink][1], 0);
    Kid.text(c, '點出字的「顏色」', V.W / 2, V.H * 0.24 + 200, 22, '#4a3520', 6);
    for (let i = 0; i < 4; i++) Kid.button(c, this.btn(i), '', this.C[i][1]);
  },
  hud() { return { L: `<b>${this.score}</b> 分`, R: `⏱ ${Math.ceil(this.left)}` }; },
});

// ---- 賓果 ----
registerGame({
  id: 'bingo', name: '賓果連線', icon: '🎱', color: '#e9654b',
  desc: '叫到的數字就圈起來，比機器人先連成 3 條線！',
  howto: '每一回合會叫一個數字（1～25），在你的卡上點那個數字圈起來。橫的、直的、斜的連成一條線就算一條，比機器人先連成 3 條就贏了！',
  start() { this.t = 0; this.score = 0; this.over = false; this.overText = ''; this.me = Kid.shuffle([...Array(25)].map((_, i) => i + 1)); this.ai = Kid.shuffle([...Array(25)].map((_, i) => i + 1)); this.called = []; this.pool = Kid.shuffle([...Array(25)].map((_, i) => i + 1)); this.mark = new Set(); this.endT = 0; this.callT = 0.5; this.cur = 0; },
  lines(card, has) { let n = 0; const L = []; for (let i = 0; i < 5; i++) { L.push([0, 1, 2, 3, 4].map(k => i * 5 + k)); L.push([0, 1, 2, 3, 4].map(k => k * 5 + i)); } L.push([0, 6, 12, 18, 24], [4, 8, 12, 16, 20]); for (const l of L) if (l.every(i => has(card[i]))) n++; return n; },
  geo() { const P = Kid.portrait(), S = Math.min(V.W - 30, V.H - (P ? 300 : 200), 460), s = S / 5; return { s, x0: V.W / 2 - S / 2, y0: (P ? 230 : 170) + (V.H - (P ? 300 : 200) - S) / 2 }; },
  tap(x, y) { if (this.endT || !this.cur) return; const G = this.geo(), c = Math.floor((x - G.x0) / G.s), r = Math.floor((y - G.y0) / G.s); if (c < 0 || r < 0 || c > 4 || r > 4) return; const v = this.me[r * 5 + c]; if (this.called.includes(v) && !this.mark.has(v)) { this.mark.add(v); Sfx.play('snap'); this.check(); } else if (!this.mark.has(v)) Sfx.play('nope'); },
  check() { const m = this.lines(this.me, v => this.mark.has(v)), a = this.lines(this.ai, v => this.called.includes(v)); if (m >= 3 || a >= 3) { this.endT = 1.5; const w = m >= 3; this.score = m * 20 + (w ? 50 : 0); this.overText = w ? '賓果！你贏了！' : '機器人先賓果了！'; Sfx.play(w ? 'win' : 'over'); } },
  update(dt) {
    this.t += dt; if (this.endT) { this.endT -= dt; if (this.endT <= 0) this.over = true; return; }
    this.callT -= dt; if (this.callT <= 0 && this.pool.length) { this.cur = this.pool.pop(); this.called.push(this.cur); this.callT = 3.2; Sfx.play('bell'); Kid.say(String(this.cur)); this.check(); }
  },
  draw(c) {
    c.fillStyle = '#fff3e6'; c.fillRect(-20, -20, V.W + 40, V.H + 40); const G = this.geo(), P = Kid.portrait();
    Paper.circle(c, V.W / 2, P ? 170 : 120, 44, '#e9654b', { border: 4 }); Kid.text(c, String(this.cur || ''), V.W / 2, P ? 172 : 122, 40, '#ffffff', 0);
    for (let i = 0; i < 25; i++) { const x = G.x0 + (i % 5) * G.s, y = G.y0 + Math.floor(i / 5) * G.s, v = this.me[i], m = this.mark.has(v); Paper.rect(c, x + 3, y + 3, G.s - 6, G.s - 6, m ? '#ffd23f' : '#ffffff', 10, { border: 2, blur: 2 }); Kid.text(c, String(v), x + G.s / 2, y + G.s / 2, G.s * 0.4, m ? '#e0573c' : '#4a3520', 0); }
    Kid.text(c, `我 ${this.lines(this.me, v => this.mark.has(v))} 條　🤖 ${this.lines(this.ai, v => this.called.includes(v))} 條`, V.W / 2, G.y0 + G.s * 5 + 28, 24, '#4a3520', 6);
  },
  hud() { return { L: `<b>${this.score}</b> 分`, R: `🎱 ${this.called.length} / 25` }; },
});

// ---- 拿石頭 ----
registerGame({
  id: 'nim', name: '拿石頭', icon: '🥔', color: '#8a8f99',
  desc: '輪流拿 1～3 顆石頭，拿到最後一顆的人輸！',
  howto: '桌上有一堆石頭，你和機器人輪流拿，每次可以拿 1、2 或 3 顆。拿到「最後一顆」的人就輸了！想想看怎麼讓機器人拿最後一顆。一共 3 局。',
  start() { this.t = 0; this.score = 0; this.over = false; this.overText = ''; this.g = 0; this.win = 0; this.newGame(); },
  newGame() { this.n = 13 + Math.floor(Math.random() * 8); this.turn = 0; this.aiT = 0; this.endT = 0; this.msg = ''; },
  btn(i) { return { x: V.W / 2 + (i - 1) * 130, y: V.H - 90, w: 110, h: 70 }; },
  take(k, who) { this.n -= k; this.msg = (who ? '機器人拿了 ' : '你拿了 ') + k + ' 顆'; Sfx.play('thud'); if (this.n <= 0) { const iWin = who === 1; if (iWin) this.win++; this.endT = 1.8; Sfx.play(iWin ? 'win' : 'over'); this.msg = iWin ? '機器人拿到最後一顆，你贏了！' : '你拿到最後一顆了…'; return; } this.turn = 1 - who; this.aiT = 1; },
  tap(x, y) { if (this.turn || this.endT) return; for (let i = 0; i < 3; i++) if (Kid.hit(this.btn(i), x, y)) { if (i + 1 > this.n) return; this.take(i + 1, 0); return; } },
  key(k) { const i = ['1', '2', '3'].indexOf(k); if (i >= 0) { const b = this.btn(i); this.tap(b.x, b.y); } },
  update(dt) {
    this.t += dt;
    if (this.endT) { this.endT -= dt; if (this.endT <= 0) { this.g++; if (this.g >= 3) { this.score = this.win * 40; this.over = true; this.overText = `贏了 ${this.win} / 3 局`; return; } this.newGame(); } return; }
    if (this.turn) { this.aiT -= dt; if (this.aiT <= 0) { let k = (this.n - 1) % 4; if (k === 0 || Math.random() < 0.25) k = 1 + Math.floor(Math.random() * Math.min(3, this.n)); this.take(Math.min(k, this.n), 1); } }
  },
  draw(c) {
    c.fillStyle = '#ece4d4'; c.fillRect(-20, -20, V.W + 40, V.H + 40);
    for (let i = 0; i < Math.max(0, this.n); i++) TiltUI.rock(c, V.W / 2 + ((i % 7) - 3) * 52, V.H * 0.32 + Math.floor(i / 7) * 52, 22, '#9aa3b0');
    Kid.text(c, `剩 ${Math.max(0, this.n)} 顆`, V.W / 2, V.H * 0.62, 30, '#4a3520', 6);
    if (this.msg) Kid.text(c, this.msg, V.W / 2, V.H * 0.7, 24, '#e0573c', 6);
    for (let i = 0; i < 3; i++) Kid.button(c, this.btn(i), `拿 ${i + 1}`, '#8a8f99', { size: 26, alpha: this.turn || this.endT || i + 1 > this.n ? 0.4 : 1 });
    Kid.text(c, this.endT ? '' : this.turn ? '機器人想一想…' : '換你拿', V.W / 2, Kid.portrait() ? 140 : 96, 24, '#4a3520', 6);
  },
  hud() { return { L: `<b>${this.win}</b> 勝`, R: `第 ${Math.min(this.g + 1, 3)} / 3 局` }; },
});

// ---- 湊十 ----
registerGame({
  id: 'make10', name: '湊十消消樂', icon: '🔟', color: '#45ad4a',
  desc: '點兩個加起來是 10 的數字，把它們消掉！',
  howto: '點一個數字，再點另一個數字，兩個加起來剛好是 10 就會消掉！消掉的格子會補上新數字。限時 60 秒，連續消除有加成。',
  TIME: 60,
  start() { this.t = 0; this.left = this.TIME; this.score = 0; this.over = false; this.overText = ''; this.g = [...Array(20)].map(() => 1 + Math.floor(Math.random() * 9)); this.sel = -1; this.n = 0; this.combo = 0; this.lastT = 0; this.fx = Array(20).fill(0); },
  geo() { const P = Kid.portrait(), cols = P ? 4 : 5, rows = 20 / cols, s = Math.min((V.W - 30) / cols, (V.H - (P ? 200 : 120)) / rows, 110); return { cols, s, x0: V.W / 2 - s * cols / 2, y0: (P ? 140 : 90) }; },
  tap(x, y) {
    const G = this.geo(), c = Math.floor((x - G.x0) / G.s), r = Math.floor((y - G.y0) / G.s); if (c < 0 || r < 0 || c >= G.cols || r >= 20 / G.cols) return; const i = r * G.cols + c;
    if (this.sel < 0 || this.sel === i) { this.sel = this.sel === i ? -1 : i; Sfx.play('click'); return; }
    if (this.g[this.sel] + this.g[i] === 10) { this.combo = this.t - this.lastT < 2.5 ? this.combo + 1 : 1; this.lastT = this.t; this.n++; const pts = 10 + (this.combo - 1) * 5; this.score += pts; for (const k of [this.sel, i]) { this.g[k] = 1 + Math.floor(Math.random() * 9); this.fx[k] = 1; } Sfx.play('coin'); FX.text(x, y - 40, '+' + pts, '#ff7a00', 26); this.sel = -1; }
    else { Sfx.play('nope'); this.sel = i; }
  },
  update(dt) { this.t += dt; this.left -= dt; for (let i = 0; i < 20; i++) this.fx[i] = Math.max(0, this.fx[i] - dt * 3); if (this.left <= 0) { this.left = 0; this.over = true; this.overText = `湊了 ${this.n} 次十！`; } },
  draw(c) {
    c.fillStyle = '#eaf6e6'; c.fillRect(-20, -20, V.W + 40, V.H + 40); const G = this.geo();
    for (let i = 0; i < 20; i++) { const x = G.x0 + (i % G.cols) * G.s, y = G.y0 + Math.floor(i / G.cols) * G.s, k = 1 - this.fx[i] * 0.3; Paper.rect(c, x + 5 + (1 - k) * G.s / 2, y + 5 + (1 - k) * G.s / 2, (G.s - 10) * k, (G.s - 10) * k, i === this.sel ? '#ffd23f' : '#ffffff', 14, { border: 3, blur: 3 }); Kid.text(c, String(this.g[i]), x + G.s / 2, y + G.s / 2, G.s * 0.45, '#45ad4a', 0); }
    Kid.text(c, '兩個加起來 = 10', V.W / 2, G.y0 + G.s * (20 / G.cols) + 30, 24, '#4a3520', 6);
  },
  hud() { return { L: `<b>${this.score}</b> 分`, R: `⏱ ${Math.ceil(this.left)}` }; },
});

// ---- 閃現數量 ----
registerGame({
  id: 'flashcount', name: '一眼看幾個', icon: '👀', color: '#3f8fe0',
  desc: '點點只出現一下下，一眼看出有幾個！',
  howto: '畫面上會閃出一些點點，很快就消失。猜猜看剛剛有幾個，點下面的數字！越後面越多、越快。一共 10 題。',
  N: 10,
  start() { this.t = 0; this.score = 0; this.over = false; this.overText = '眼力超群！'; this.k = 0; this.newQ(); },
  newQ() { const n = 3 + Math.floor(Math.random() * (3 + this.k)); this.cnt = n; this.dots = []; for (let i = 0; i < n; i++) { let x, y, k = 0; do { x = rand(-1, 1); y = rand(-1, 1); } while (k++ < 50 && this.dots.some(d => Math.hypot(d.x - x, d.y - y) < 0.35)); this.dots.push({ x, y }); } const s = new Set([n]); while (s.size < 4) { const v = n + Math.floor(Math.random() * 5) - 2; if (v > 0) s.add(v); } this.opts = Kid.shuffle([...s]); this.st = 'show'; this.sT = Math.max(0.4, 1.1 - this.k * 0.07); this.res = 0; },
  btn(i) { const w = Math.min((V.W - 50) / 4, 120); return { x: V.W / 2 + (i - 1.5) * (w + 10), y: V.H - 100, w, h: w * 0.8 }; },
  tap(x, y) { if (this.st !== 'ask') return; for (let i = 0; i < 4; i++) if (Kid.hit(this.btn(i), x, y)) { const ok = this.opts[i] === this.cnt; if (ok) { this.score += 10; Sfx.play('ding'); } else Sfx.play('nope'); this.res = ok ? 1 : -1; this.st = 'res'; this.sT = 1.2; return; } },
  update(dt) { this.t += dt; if (this.st === 'show') { this.sT -= dt; if (this.sT <= 0) this.st = 'ask'; } else if (this.st === 'res') { this.sT -= dt; if (this.sT <= 0) { this.k++; if (this.k >= this.N) { this.over = true; return; } this.newQ(); } } },
  draw(c) {
    c.fillStyle = '#e8f1fb'; c.fillRect(-20, -20, V.W + 40, V.H + 40); const R = Math.min(V.W * 0.38, V.H * 0.26), cx = V.W / 2, cy = V.H * 0.42;
    Paper.circle(c, cx, cy, R + 30, '#ffffff', { border: 4 });
    if (this.st === 'show' || this.st === 'res') for (const d of this.dots) Paper.circle(c, cx + d.x * R * 0.85, cy + d.y * R * 0.85, 14, '#3f8fe0', { border: 2 });
    else Kid.text(c, '?', cx, cy, 90, '#c8d4e0', 0);
    if (this.st === 'res') Kid.text(c, this.res > 0 ? '答對了！' : `是 ${this.cnt} 個`, cx, cy + R + 60, 30, this.res > 0 ? '#45ad4a' : '#e8453c', 6);
    for (let i = 0; i < 4; i++) Kid.button(c, this.btn(i), String(this.opts[i]), '#3f8fe0', { size: 34, alpha: this.st === 'ask' ? 1 : 0.5 });
  },
  hud() { return { L: `<b>${this.score}</b> 分`, R: `第 ${Math.min(this.k + 1, this.N)} / ${this.N} 題` }; },
});
