'use strict';
// =====================================================
//  動腦遊戲：燈泡全亮、記憶燈號、紙片河內塔、圖畫數織
// =====================================================

// ---- 燈泡全亮 ----
registerGame({
  id: 'lightsout', name: '燈泡全亮', icon: '💡', color: '#e0a000',
  desc: '點一顆燈泡，它和上下左右都會變，讓全部亮起來！',
  howto: '點一顆燈泡，它自己和上、下、左、右的燈泡都會「亮變暗、暗變亮」。想辦法讓全部燈泡都亮起來！一共 5 關，越少步完成分數越高。',
  LV: [[3, 2], [3, 3], [4, 4], [5, 5], [5, 7]],
  start() { this.t = 0; this.score = 0; this.over = false; this.overText = '全部點亮了！'; this.lv = 0; this.newLevel(); },
  newLevel() {
    const [n, k] = this.LV[this.lv]; this.n = n; this.on = Array(n * n).fill(true); this.moves = 0; this.doneT = 0; this.flash = Array(n * n).fill(0);
    const used = new Set(); while (used.size < k) used.add(Math.floor(Math.random() * n * n));
    for (const i of used) this.press(i, true); this.par = k;
    if (this.on.every(v => v)) this.press(0, true);
  },
  press(i, silent) { const n = this.n, r = Math.floor(i / n), c = i % n; for (const [dr, dc] of [[0, 0], [1, 0], [-1, 0], [0, 1], [0, -1]]) { const rr = r + dr, cc = c + dc; if (rr < 0 || cc < 0 || rr >= n || cc >= n) continue; const j = rr * n + cc; this.on[j] = !this.on[j]; if (!silent) this.flash[j] = 1; } },
  cell() { const P = Kid.portrait(), S = Math.min(V.W - 40, V.H * (P ? 0.62 : 0.72), 520), s = S / this.n; return { x0: V.W / 2 - S / 2, y0: (P ? V.H * 0.53 : V.H * 0.55) - S / 2, s }; },
  tap(x, y) {
    if (this.doneT) return; const C = this.cell(), c = Math.floor((x - C.x0) / C.s), r = Math.floor((y - C.y0) / C.s);
    if (c < 0 || r < 0 || c >= this.n || r >= this.n) return;
    this.press(r * this.n + c); this.moves++; Sfx.play('click');
    if (this.on.every(v => v)) { const pts = Math.max(10, 60 - Math.max(0, this.moves - this.par) * 5); this.score += pts; this.doneT = 1.6; Sfx.play('win'); FX.burst(V.W / 2, V.H / 2, 30, undefined, 1); FX.text(V.W / 2, C.y0 - 30, `全亮！+${pts}`, '#e0a000', 40); }
  },
  update(dt) { this.t += dt; for (let i = 0; i < this.flash.length; i++) this.flash[i] = Math.max(0, this.flash[i] - dt * 4); if (this.doneT) { this.doneT -= dt; if (this.doneT <= 0) { this.lv++; if (this.lv >= this.LV.length) { this.over = true; return; } this.newLevel(); } } },
  draw(c) {
    c.fillStyle = '#2a2440'; c.fillRect(-20, -20, V.W + 40, V.H + 40);
    const C = this.cell(), n = this.n;
    Paper.rect(c, C.x0 - 14, C.y0 - 14, C.s * n + 28, C.s * n + 28, '#4a3f6a', 20, { border: 4 });
    for (let i = 0; i < n * n; i++) {
      const x = C.x0 + (i % n + 0.5) * C.s, y = C.y0 + (Math.floor(i / n) + 0.5) * C.s, on = this.on[i], k = 1 + this.flash[i] * 0.12;
      if (on) { const g = c.createRadialGradient(x, y, 2, x, y, C.s * 0.6); g.addColorStop(0, 'rgba(255,230,120,0.6)'); g.addColorStop(1, 'rgba(255,230,120,0)'); c.fillStyle = g; c.fillRect(x - C.s * 0.6, y - C.s * 0.6, C.s * 1.2, C.s * 1.2); }
      Paper.circle(c, x, y - C.s * 0.04, C.s * 0.32 * k, on ? '#ffe680' : '#5a5470', { border: 3, blur: on ? 10 : 2, shadowColor: on ? 'rgba(255,220,80,0.8)' : undefined });
      Paper.rect(c, x - C.s * 0.13, y + C.s * 0.22, C.s * 0.26, C.s * 0.14, '#9aa3b5', 4, { border: 2 });
    }
    Kid.text(c, `步數 ${this.moves}（最少 ${this.par} 步）`, V.W / 2, C.y0 + C.s * n + 42, 24, '#ffffff', 0);
  },
  hud() { return { L: `<b>${this.score}</b> 分`, R: `第 ${this.lv + 1} / ${this.LV.length} 關` }; },
});

// ---- 記憶燈號 ----
registerGame({
  id: 'memlight', name: '記憶燈號', icon: '🚥', color: '#45ad4a',
  desc: '記住燈亮的順序，再照一樣的順序按出來！',
  howto: '四個顏色的按鈕會一個一個亮起來（還會唱歌）。看完之後照「一樣的順序」按出來！每次都會多一個。按錯 2 次就結束，看你能記住多長！',
  PADS: [['#e8453c', 523], ['#3f8fe0', 659], ['#ffd23f', 784], ['#45ad4a', 1047]],
  start() { this.t = 0; this.score = 0; this.over = false; this.overText = ''; this.seq = []; this.lives = 2; this.lit = [0, 0, 0, 0]; this.best = 0; this.add(); },
  add() { this.seq.push(Math.floor(Math.random() * 4)); this.st = 'show'; this.si = -1; this.sT = 0.9; this.inp = 0; },
  pad(i) { const P = Kid.portrait(), s = Math.min(V.W * 0.42, V.H * (P ? 0.3 : 0.36), 230), cx = V.W / 2, cy = V.H * (P ? 0.55 : 0.56); return { x: cx + (i % 2 ? 1 : -1) * (s / 2 + 8), y: cy + (i < 2 ? -1 : 1) * (s / 2 + 8), w: s, h: s }; },
  light(i) { this.lit[i] = 1; Sfx.note(this.PADS[i][1], 0.35); },
  tap(x, y) {
    if (this.st !== 'input') return;
    for (let i = 0; i < 4; i++) if (Kid.hit(this.pad(i), x, y, 0)) {
      this.light(i);
      if (i === this.seq[this.inp]) { this.inp++; if (this.inp >= this.seq.length) { this.best = this.seq.length; this.score = this.best * 10; this.st = 'wait'; this.sT = 0.9; FX.text(V.W / 2, this.pad(0).y - this.pad(0).h * 0.7, `${this.seq.length} 個！`, '#45ad4a', 34); } }
      else {
        this.lives--; Sfx.play('nope'); V.shake = 6;
        if (this.lives <= 0) { this.over = true; this.overText = `記住了 ${this.best} 個！`; return; }
        FX.text(V.W / 2, V.H * 0.2, '按錯了！再看一次', '#e8453c', 32); this.st = 'show'; this.si = -1; this.sT = 1.2; this.inp = 0;
      }
      return;
    }
  },
  update(dt) {
    this.t += dt; for (let i = 0; i < 4; i++) this.lit[i] = Math.max(0, this.lit[i] - dt * 3);
    if (this.st === 'wait') { this.sT -= dt; if (this.sT <= 0) this.add(); }
    else if (this.st === 'show') {
      this.sT -= dt;
      if (this.sT <= 0) { this.si++; if (this.si >= this.seq.length) { this.st = 'input'; return; } this.light(this.seq[this.si]); this.sT = Math.max(0.3, 0.65 - this.seq.length * 0.02); }
    }
  },
  draw(c) {
    c.fillStyle = '#f2ead8'; c.fillRect(-20, -20, V.W + 40, V.H + 40);
    for (let i = 0; i < 4; i++) { const p = this.pad(i), L = this.lit[i]; c.save(); c.globalAlpha = 0.45 + L * 0.55; Paper.rect(c, p.x - p.w / 2, p.y - p.h / 2, p.w, p.h, this.PADS[i][0], 28, { border: 5, blur: 4 + L * 16, shadowColor: L ? this.PADS[i][0] : undefined }); c.restore(); }
    const P = this.pad(0); Kid.head(c, V.W / 2, P.y + P.h / 2 + 8, 34, {}, 40);
    const msg = this.st === 'input' ? `換你了！（${this.inp} / ${this.seq.length}）` : this.st === 'show' ? '仔細看…' : '答對了！';
    Kid.text(c, msg, V.W / 2, P.y - P.h / 2 - 40, 30, this.st === 'input' ? '#e0573c' : '#4a3520', 6);
  },
  hud() { return { L: `<b>${this.score}</b> 分　最長 ${this.best}`, R: TiltUI.lives(this.lives, 2) }; },
});

// ---- 紙片河內塔 ----
registerGame({
  id: 'hanoi', name: '紙片河內塔', icon: '🗼', color: '#c9772f',
  desc: '把整疊圓盤搬到最右邊，大的不能放在小的上面！',
  howto: '點一根柱子拿起最上面的圓盤，再點另一根柱子放下去。一次只能搬一個，而且大的圓盤不能放在小的上面！把整疊搬到最右邊就過關。一共 3 關（3、4、5 個圓盤），步數越少分數越高。',
  COLS: ['#e8453c', '#ff9a2e', '#ffd23f', '#45ad4a', '#3f8fe0', '#7a62b8'],
  start() { this.t = 0; this.score = 0; this.over = false; this.overText = '搬家完成！'; this.lv = 0; this.newLevel(); },
  newLevel() { const n = 3 + this.lv; this.n = n; this.pegs = [[...Array(n)].map((_, i) => n - i), [], []]; this.hold = -1; this.moves = 0; this.doneT = 0; this.min = 2 ** n - 1; },
  geo() { const P = Kid.portrait(), w = Math.min(V.W / 3, 300), base = V.H * (P ? 0.72 : 0.8), dh = Math.min(34, (P ? V.H * 0.3 : V.H * 0.45) / 6); return { w, base, dh, x: i => V.W / 2 + (i - 1) * w, dw: k => w * (0.25 + 0.65 * k / this.n) }; },
  tap(x, y) {
    if (this.doneT) return; const G = this.geo(), i = clamp(Math.floor((x - (V.W / 2 - G.w * 1.5)) / G.w), 0, 2);
    if (this.hold < 0) { if (!this.pegs[i].length) { Sfx.play('nope'); return; } this.hold = i; Sfx.play('pop'); return; }
    if (i === this.hold) { this.hold = -1; Sfx.play('click'); return; }
    const from = this.pegs[this.hold], to = this.pegs[i], d = from[from.length - 1];
    if (to.length && to[to.length - 1] < d) { Sfx.play('nope'); FX.text(G.x(i), G.base - G.dh * (to.length + 2), '大的不能放上面！', '#e8453c', 24); this.hold = -1; return; }
    to.push(from.pop()); this.hold = -1; this.moves++; Sfx.play('snap');
    if (this.pegs[2].length === this.n) { const pts = Math.max(20, 100 - (this.moves - this.min) * 4); this.score += pts; this.doneT = 1.8; Sfx.play('win'); FX.burst(G.x(2), G.base - 100, 30, undefined, 1); FX.text(V.W / 2, V.H * 0.3, this.moves === this.min ? `完美！最少步數 +${pts}` : `完成！+${pts}`, '#e0573c', 36); }
  },
  key(k) { const i = ['1', '2', '3'].indexOf(k); if (i >= 0) { const G = this.geo(); this.tap(G.x(i), G.base); } },
  update(dt) { this.t += dt; if (this.doneT) { this.doneT -= dt; if (this.doneT <= 0) { this.lv++; if (this.lv >= 3) { this.over = true; return; } this.newLevel(); } } },
  draw(c) {
    Kid.ground(c, 'orchard', this.t, 0.97); const G = this.geo();
    Paper.rect(c, V.W / 2 - G.w * 1.45, G.base, G.w * 2.9, 22, '#8a5a34', 8, { border: 4 });
    for (let i = 0; i < 3; i++) {
      const x = G.x(i), top = G.base - G.dh * (this.n + 2);
      Paper.rect(c, x - 7, top, 14, G.base - top, '#c98a4b', 6, { border: 3 });
      this.pegs[i].forEach((d, k) => { const lift = this.hold === i && k === this.pegs[i].length - 1, y = lift ? top - G.dh * 1.4 + Math.sin(this.t * 6) * 4 : G.base - G.dh * (k + 1), w = G.dw(d); Paper.rect(c, x - w / 2, y, w, G.dh - 3, this.COLS[(d - 1) % 6], G.dh * 0.4, { border: 3, blur: 4 }); });
      if (i === 2) Kid.text(c, '🏁 終點', x, G.base + 50, 22, '#4a3520', 5);
    }
    Kid.text(c, `步數 ${this.moves}（最少 ${this.min} 步）`, V.W / 2, Kid.portrait() ? 150 : 100, 24, '#4a3520', 6);
  },
  hud() { return { L: `<b>${this.score}</b> 分`, R: `第 ${this.lv + 1} / 3 關` }; },
});

// ---- 圖畫數織 ----
registerGame({
  id: 'nonogram', name: '圖畫數織', icon: '🧩', color: '#3c9a8a',
  desc: '照著旁邊的數字把格子塗黑，會變出一張圖！',
  howto: '每一列左邊、每一行上面的數字，代表那一排有幾格「連在一起」要塗色（例如「2 1」= 先 2 格，空一下，再 1 格）。點格子塗色，再點一次變成 ✕ （確定不塗），再點一次清掉。全部對了就會出現圖畫！一共 5 張。',
  PICS: [
    ['愛心', '#e8453c', ['.#.#.', '#####', '#####', '.###.', '..#..']],
    ['房子', '#c9772f', ['..#..', '.###.', '#####', '#.#.#', '#.###']],
    ['笑臉', '#ffb31f', ['.###.', '#.#.#', '#####', '#...#', '.###.']],
    ['小樹', '#45ad4a', ['..#..', '.###.', '#####', '..#..', '.###.']],
    ['星星', '#ffb31f', ['..#..', '#####', '.###.', '.#.#.', '#...#']],
  ],
  start() { this.t = 0; this.score = 0; this.over = false; this.overText = '五張圖都完成了！'; this.pi = 0; this.newPic(); },
  newPic() { const S = this.PICS[this.pi][2]; this.sol = S.map(r => [...r].map(ch => ch === '#')); this.n = 5; this.g = this.sol.map(r => r.map(() => 0)); this.pt = 0; this.doneT = 0; this.rowC = this.sol.map(r => this.runs(r)); this.colC = this.sol[0].map((_, j) => this.runs(this.sol.map(r => r[j]))); },
  runs(a) { const o = []; let k = 0; for (const v of a) { if (v) k++; else if (k) { o.push(k); k = 0; } } if (k) o.push(k); return o.length ? o : [0]; },
  geo() { const P = Kid.portrait(), S = Math.min(V.W - 120, V.H * (P ? 0.5 : 0.62), 420), s = S / this.n; return { s, x0: V.W / 2 - S / 2 + 40, y0: V.H * (P ? 0.52 : 0.56) - S / 2 + 30 }; },
  tap(x, y) {
    if (this.doneT) return; const G = this.geo(), c = Math.floor((x - G.x0) / G.s), r = Math.floor((y - G.y0) / G.s);
    if (c < 0 || r < 0 || c >= this.n || r >= this.n) return;
    this.g[r][c] = (this.g[r][c] + 1) % 3; Sfx.play(this.g[r][c] === 1 ? 'pop' : 'click');
    if (this.g.every((row, i) => row.every((v, j) => (v === 1) === this.sol[i][j]))) { const pts = Math.max(20, Math.round(80 - this.pt)); this.score += pts; this.doneT = 2.2; Sfx.play('win'); FX.burst(V.W / 2, V.H / 2, 30, undefined, 1); FX.text(V.W / 2, G.y0 - 70, `是${this.PICS[this.pi][0]}！+${pts}`, '#e0573c', 38); }
  },
  update(dt) { this.t += dt; if (!this.doneT) this.pt += dt; else { this.doneT -= dt; if (this.doneT <= 0) { if (this.pi + 1 >= this.PICS.length) { this.over = true; return; } this.pi++; this.newPic(); } } },
  draw(c) {
    c.fillStyle = '#eef3ea'; c.fillRect(-20, -20, V.W + 40, V.H + 40); const G = this.geo(), n = this.n, col = this.PICS[this.pi][1];
    Paper.rect(c, G.x0 - 8, G.y0 - 8, G.s * n + 16, G.s * n + 16, '#ffffff', 10, { border: 4 });
    const fs = Math.min(22, G.s * 0.36);
    for (let i = 0; i < n; i++) {
      const ok = this.g[i].every((v, j) => (v === 1) === this.sol[i][j]);
      Kid.text(c, this.rowC[i].join(' '), G.x0 - 14 - this.rowC[i].length * fs * 0.35, G.y0 + (i + 0.5) * G.s, fs, ok ? '#45ad4a' : '#4a3520', 0);
      const okc = this.g.every((row, r) => (row[i] === 1) === this.sol[r][i]);
      this.colC[i].forEach((v, k) => Kid.text(c, String(v), G.x0 + (i + 0.5) * G.s, G.y0 - 16 - (this.colC[i].length - 1 - k) * fs * 1.05, fs, okc ? '#45ad4a' : '#4a3520', 0));
    }
    for (let r = 0; r < n; r++) for (let j = 0; j < n; j++) {
      const x = G.x0 + j * G.s, y = G.y0 + r * G.s, v = this.g[r][j];
      c.fillStyle = v === 1 ? (this.doneT ? col : '#3a3a48') : '#ffffff'; c.fillRect(x + 2, y + 2, G.s - 4, G.s - 4);
      if (v === 2) Kid.text(c, '✕', x + G.s / 2, y + G.s / 2, G.s * 0.5, '#b0a8a0', 0);
      c.strokeStyle = '#c8c0b0'; c.lineWidth = 1; c.strokeRect(x, y, G.s, G.s);
    }
    Kid.text(c, `第 ${this.pi + 1} 張：猜猜是什麼？`, V.W / 2, Kid.portrait() ? 150 : 96, 24, '#3c9a8a', 6);
  },
  hud() { return { L: `<b>${this.score}</b> 分`, R: `⏱ ${Math.floor(this.pt)} 秒` }; },
});
