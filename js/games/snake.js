'use strict';
// 貪吃紙片蛇：蛇頭是紙片人的頭！吃水果會變長、變快。撞到牆壁或自己就結束。
registerGame({
  id: 'snake', name: '貪吃紙片蛇', icon: '🐍', color: '#4f9a45',
  desc: '蛇頭是你的臉！吃水果變長，不要撞到自己！',
  howto: '在畫面上往上下左右滑（或用方向鍵）改變方向。吃到水果會變長、變快，⭐ 星星 50 分。撞到牆壁或自己的身體就結束了！',
  FRUITS: ['🍎', '🍌', '🍇', '🍓', '🍉', '🍒'],

  start() {
    this.t = 0; this.score = 0; this.over = false; this.overText = '撞到了！'; this.cheer = 0;
    this.layout(true); const cx = Math.floor(this.cols / 2), cy = Math.floor(this.rows / 2);
    this.body = [{ x: cx, y: cy }, { x: cx - 1, y: cy }, { x: cx - 2, y: cy }]; this.dir = { x: 1, y: 0 }; this.queue = []; this.acc = 0; this.ate = 0; this.dead = 0;
    this.food = null; this.place(); this.sw = null; this.headImg = null;
  },
  layout(force) {
    const key = V.W + 'x' + V.H; if (!force && this.lkey === key) return; this.lkey = key;
    const P = Kid.portrait(), top = P ? 150 : 80, cell = P ? Math.floor((V.W - 20) / 15) : Math.floor((V.H - top - 20) / 15);
    this.cell = cell; this.cols = P ? 15 : Math.min(28, Math.floor((V.W - 40) / cell)); this.rows = P ? Math.min(24, Math.floor((V.H - top - 20) / cell)) : 15;
    this.ox = Math.floor(V.W / 2 - this.cols * cell / 2); this.oy = top;
  },
  place() {
    let p; do p = { x: Math.floor(Math.random() * this.cols), y: Math.floor(Math.random() * this.rows) }; while (this.body.some(b => b.x === p.x && b.y === p.y));
    this.food = { ...p, e: Math.random() < 0.12 ? '⭐' : pick(this.FRUITS), pop: 1 };
  },
  turn(dx, dy) { const last = this.queue.length ? this.queue[this.queue.length - 1] : this.dir; if (last.x === -dx && last.y === -dy || (last.x === dx && last.y === dy)) return; if (this.queue.length < 3) this.queue.push({ x: dx, y: dy }); },
  key(k) { const m = { arrowup: [0, -1], w: [0, -1], arrowdown: [0, 1], s: [0, 1], arrowleft: [-1, 0], a: [-1, 0], arrowright: [1, 0], d: [1, 0] }[k]; if (m) this.turn(m[0], m[1]); },
  tap(x, y) { this.sw = { x, y }; },
  get speed() { return Math.min(14, 6 + this.ate * 0.3); },
  update(dt) {
    this.layout(); this.t += dt; this.cheer = Math.max(0, this.cheer - dt);
    // 滑動：手指移動超過 30 就轉彎（可以一路滑下去連續轉）
    if (this.sw && Input.down) { const dx = Input.x - this.sw.x, dy = Input.y - this.sw.y; if (Math.hypot(dx, dy) > 30) { if (Math.abs(dx) > Math.abs(dy)) this.turn(Math.sign(dx), 0); else this.turn(0, Math.sign(dy)); this.sw = { x: Input.x, y: Input.y }; } }
    if (!Input.down) this.sw = null;
    if (this.food) this.food.pop = Math.max(0, this.food.pop - dt * 3);
    if (this.dead) { this.dead -= dt; if (this.dead <= 0) this.over = true; return; }
    this.acc += dt * this.speed;
    while (this.acc >= 1) {
      this.acc -= 1;
      if (this.queue.length) this.dir = this.queue.shift();
      const h = this.body[0], n = { x: h.x + this.dir.x, y: h.y + this.dir.y };
      const hitSelf = this.body.slice(0, -1).some(b => b.x === n.x && b.y === n.y);
      if (n.x < 0 || n.y < 0 || n.x >= this.cols || n.y >= this.rows || hitSelf) { this.dead = 1; Sfx.play('hit'); V.shake = 10; return; }
      this.body.unshift(n);
      if (n.x === this.food.x && n.y === this.food.y) {
        const star = this.food.e === '⭐', pts = star ? 50 : 10; this.score += pts; this.ate++; this.cheer = 0.5;
        Sfx.play(star ? 'star' : 'chomp'); const px = this.ox + (n.x + 0.5) * this.cell, py = this.oy + (n.y + 0.5) * this.cell;
        FX.burst(px, py, 10, undefined, 0.5); FX.text(px, py - 30, `+${pts}`, '#ff7a00', 28);
        if (star) { this.body.push({ ...this.body[this.body.length - 1] }); }
        this.place();
      } else this.body.pop();
    }
  },
  draw(c) {
    this.layout();
    c.fillStyle = '#cfe9b0'; c.fillRect(-20, -20, V.W + 40, V.H + 40);
    const cs = this.cell, W = this.cols * cs, H = this.rows * cs;
    Paper.rect(c, this.ox - 6, this.oy - 6, W + 12, H + 12, '#9fcf7e', 10, { border: 6 });
    c.fillStyle = 'rgba(255,255,255,0.18)'; for (let y = 0; y < this.rows; y++) for (let x = (y % 2); x < this.cols; x += 2) c.fillRect(this.ox + x * cs, this.oy + y * cs, cs, cs);
    const f = this.food; if (f) Kid.emoji(c, f.e, this.ox + (f.x + 0.5) * cs, this.oy + (f.y + 0.5) * cs, cs * (0.95 + f.pop * 0.4 + Math.sin(this.t * 6) * 0.05));
    // 身體：一節一節的紙片，從尾巴畫到頭
    for (let i = this.body.length - 1; i >= 1; i--) {
      const b = this.body[i], k = 1 - i / (this.body.length + 4) * 0.4;
      Paper.circle(c, this.ox + (b.x + 0.5) * cs, this.oy + (b.y + 0.5) * cs, cs * 0.48 * k, i % 2 ? '#45ad4a' : '#62c05a', { border: 3, blur: 3 });
    }
    // 頭：紙片人的頭
    const h = this.body[0], hx = this.ox + (h.x + 0.5) * cs, hy = this.oy + (h.y + 0.5) * cs;
    Paper.circle(c, hx, hy, cs * 0.62, '#45ad4a', { border: 3 });
    Kid.head(c, hx, hy, cs * 0.58, { sx: this.dir.x < 0 ? -1 : 1 }, cs * 0.6);
    if (this.dead) { c.fillStyle = `rgba(255,255,255,${0.3 * this.dead})`; c.fillRect(0, 0, V.W, V.H); }
    if (this.t < 3) Kid.text(c, Kid.portrait() ? '👆 上下左右滑動轉彎' : '方向鍵 / 滑動轉彎', V.W / 2, this.oy - 30 + (Kid.portrait() ? 0 : 0), 26, '#3d6b2a');
  },
  hud() { return { L: `<b>${this.score}</b> 分`, R: `🐍 長度 ${this.body.length}` }; },
});
