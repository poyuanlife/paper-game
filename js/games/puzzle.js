'use strict';
// 拼圖：把紙片人的照片切成幾塊，拖到正確的位置拼回來。4 塊 → 6 塊 → 9 塊，不限時間。
registerGame({
  id: 'puzzle', name: '拼圖', icon: '🧩', color: '#c9822f', kid: true,
  desc: '把紙片人的照片拼回來！',
  howto: '用手指把拼圖塊拖到上面的框框裡，放到差不多的位置就會自己黏上去。一共 3 關（4 塊 → 6 塊 → 9 塊），不限時間。',
  LEVELS: [[2, 2], [3, 2], [3, 3]],
  SCENES: [
    { sky: ['#9fd8ef', '#e8f6e9'], hill: '#7dbb5c', pose: 'cheer' },
    { sky: ['#ffc8a2', '#fff1d6'], hill: '#e7c27a', pose: 'dance' },
    { sky: ['#c7b8f5', '#f3eaff'], hill: '#9fcf7e', pose: 'jump' },
  ],

  start() { this.t = 0; this.score = 0; this.over = false; this.overText = '拼圖高手！'; this.level = 0; this.cheer = 0; this.drag = Kid.makeDrag(); this.newLevel(); },
  onEnter(prev) { if (prev === 'ready') Kid.say('把拼圖拖到框框裡'); },
  // 拼圖的圖：背景 + 紙片人
  makePic() {
    const S = this.SCENES[this.level], o = Paper.offscreen(400, 400), x = o.x;
    const g = x.createLinearGradient(0, 0, 0, 400); g.addColorStop(0, S.sky[0]); g.addColorStop(1, S.sky[1]); x.fillStyle = g; x.fillRect(0, 0, 400, 400);
    Paper.circle(x, 330, 70, 36, '#ffe07a', { border: 5 });
    Paper.shape(x, c => { c.moveTo(-10, 410); c.lineTo(-10, 300); c.quadraticCurveTo(120, 250, 220, 300); c.quadraticCurveTo(320, 340, 410, 290); c.lineTo(410, 410); c.closePath(); }, S.hill, { border: 5 });
    for (const [cx, cy] of [[60, 80], [200, 40]]) Paper.circle(x, cx, cy, 24, '#ffffff', { border: 3, blur: 4 });
    const P = Puppet.Poses, pose = S.pose === 'cheer' ? P.cheer(0.13) : S.pose === 'dance' ? P.dance(0.3) : P.jump(0.2);
    const u = Puppet.size(App.pup, 100), ph = Math.min(320, 360 / (u.w / 100));
    Puppet.draw(x, App.pup, 200, 385, ph, pose);
    return o;
  },
  newLevel() {
    const [cols, rows] = this.LEVELS[this.level];
    this.cols = cols; this.rows = rows; this.pic = this.makePic(); this.doneT = 0;
    this.pieces = Kid.shuffle([...Array(cols * rows).keys()]).map((i, k) => ({ i, col: i % cols, row: Math.floor(i / cols), placed: false, x: 0, y: 0, k, pop: 0 }));
    this.scatter();
  },
  layout() {
    const P = Kid.portrait();
    if (P) { const s = Math.min(V.W - 40, V.H * 0.42); return { bx: V.W / 2 - s / 2, by: V.H * 0.11, s, tray: { x: 20, y: V.H * 0.11 + s + 30, w: V.W - 40, h: V.H * 0.95 - (V.H * 0.11 + s + 30) } }; }
    const s = Math.min(V.H * 0.74, V.W * 0.42); return { bx: V.W * 0.06, by: V.H * 0.13, s, tray: { x: V.W * 0.06 + s + 40, y: V.H * 0.13, w: V.W * 0.94 - (V.W * 0.06 + s + 40), h: V.H * 0.8 } };
  },
  // 還沒拼好的塊，亂放在旁邊的盤子裡（排成格子再歪一點，才不會疊在一起）
  scatter() {
    const L = this.layout(), T = L.tray, free = this.pieces.filter(p => !p.placed), n = free.length;
    const pw = L.s / this.cols, ph = L.s / this.rows, cols = clamp(Math.round(Math.sqrt(n * T.w / T.h * ph / pw)), 1, n), rows = Math.ceil(n / cols);
    free.forEach((p, k) => {
      const c = k % cols, r = Math.floor(k / cols), cw = T.w / cols, ch = T.h / Math.max(rows, 1);
      p.x = clamp(T.x + cw * (c + 0.5) + rand(-10, 10), T.x + pw / 2, T.x + T.w - pw / 2);
      p.y = clamp(T.y + ch * (r + 0.5) + rand(-10, 10), T.y + ph / 2, T.y + T.h - ph / 2);
    });
    this.layoutKey = V.W + 'x' + V.H;
  },
  slot(p) { const L = this.layout(), w = L.s / this.cols, h = L.s / this.rows; return { x: L.bx + w * (p.col + 0.5), y: L.by + h * (p.row + 0.5), w, h }; },
  tap(x, y) {
    if (this.doneT) return;
    const L = this.layout(), w = L.s / this.cols, h = L.s / this.rows;
    for (let k = this.pieces.length - 1; k >= 0; k--) {
      const p = this.pieces[k];
      if (p.placed || Math.abs(x - p.x) > w / 2 + 6 || Math.abs(y - p.y) > h / 2 + 6) continue;
      this.pieces.splice(k, 1); this.pieces.push(p); this.drag.grab(p, x, y); Sfx.play('flip'); return;
    }
  },
  update(dt) {
    this.t += dt; this.cheer = Math.max(0, this.cheer - dt);
    if (this.layoutKey !== V.W + 'x' + V.H) { for (const p of this.pieces) if (p.placed) { const s = this.slot(p); p.x = s.x; p.y = s.y; } this.scatter(); }
    for (const p of this.pieces) p.pop = Math.max(0, p.pop - dt * 3);
    this.drag.step(p => {
      const s = this.slot(p);
      if (Math.hypot(p.x - s.x, p.y - s.y) < Math.min(s.w, s.h) * 0.45) {
        p.placed = true; p.x = s.x; p.y = s.y; p.pop = 1; this.score += 10; Sfx.play('snap');
        FX.burst(s.x, s.y, 10, undefined, 0.5);
        if (this.pieces.every(q => q.placed)) {
          const L = this.layout(); this.doneT = 2.4; this.score += 40; this.cheer = 2; Sfx.play('win');
          FX.burst(L.bx + L.s / 2, L.by + L.s / 2, 40, undefined, 1.3); FX.text(L.bx + L.s / 2, L.by + L.s / 2, '拼好了！', '#e0573c', 52); Kid.say('拼好了！好棒！');
        }
      } else Sfx.play('click');
    });
    if (this.doneT) { this.doneT -= dt; if (this.doneT <= 0) { if (this.level + 1 >= this.LEVELS.length) { this.over = true; return; } this.level++; this.newLevel(); } }
  },
  drawPiece(c, p, w, h) {
    const img = this.pic.c, q = img.width / 400, sw = 400 / this.cols, sh = 400 / this.rows, s = (this.drag.obj === p ? 1.06 : 1) * (1 + p.pop * 0.08);
    c.save(); c.translate(p.x, p.y); c.scale(s, s);
    if (!p.placed) Paper.rect(c, -w / 2, -h / 2, w, h, '#fffdf5', 6, { border: 4, blur: this.drag.obj === p ? 16 : 8, oy: this.drag.obj === p ? 10 : 4 });
    c.drawImage(img, p.col * sw * q, p.row * sh * q, sw * q, sh * q, -w / 2, -h / 2, w, h);
    c.restore();
  },
  draw(c) {
    Kid.ground(c, 'meadow', this.t, 0.97);
    const L = this.layout(), w = L.s / this.cols, h = L.s / this.rows;
    Paper.rect(c, L.bx - 10, L.by - 10, L.s + 20, L.s + 20, '#8a5a34', 14, { border: 6 });
    c.fillStyle = '#fff8e6'; c.fillRect(L.bx, L.by, L.s, L.s);
    c.globalAlpha = 0.22; c.drawImage(this.pic.c, L.bx, L.by, L.s, L.s); c.globalAlpha = 1;   // 淡淡的提示
    c.strokeStyle = 'rgba(138,90,52,0.35)'; c.lineWidth = 2; c.setLineDash([6, 6]);
    for (let i = 1; i < this.cols; i++) { c.beginPath(); c.moveTo(L.bx + w * i, L.by); c.lineTo(L.bx + w * i, L.by + L.s); c.stroke(); }
    for (let i = 1; i < this.rows; i++) { c.beginPath(); c.moveTo(L.bx, L.by + h * i); c.lineTo(L.bx + L.s, L.by + h * i); c.stroke(); }
    c.setLineDash([]);
    for (const p of this.pieces) if (p.placed) this.drawPiece(c, p, w, h);
    for (const p of this.pieces) if (!p.placed) this.drawPiece(c, p, w, h);
    if (this.doneT) { c.globalAlpha = Math.min(1, (2.4 - this.doneT) * 2); c.drawImage(this.pic.c, L.bx, L.by, L.s, L.s); c.globalAlpha = 1; }
  },
  hud() { const n = this.pieces.filter(p => p.placed).length; return { L: `<b>${this.score}</b> 分`, R: `第 ${Math.min(this.level + 1, 3)} / 3 關　🧩 ${n} / ${this.pieces.length}` }; },
});
