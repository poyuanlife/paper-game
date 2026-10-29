'use strict';
// 打磚塊：紙片人頂著木板左右移動，把球彈回去打掉上面的紙磚塊。星星磚塊會讓木板變長。3 條命，打完一關換下一關。
registerGame({
  id: 'bricks', name: '紙片打磚塊', icon: '🧱', color: '#c45b3c',
  desc: '頂著木板把球彈回去，打光所有磚塊！',
  howto: '手指按住畫面左右拖（或 ← → 鍵）移動紙片人和頭上的木板，把球彈回去打磚塊。球打到木板左邊會往左飛、右邊往右飛。⭐ 磚塊會讓木板變長一陣子。3 條命。',
  COLS: ['#e8453c', '#ff8a1f', '#ffcc1f', '#45ad4a', '#3fa9e0', '#9b5bd6'],

  start() { this.t = 0; this.score = 0; this.over = false; this.overText = '球沒接到！'; this.lives = 3; this.level = 0; this.x = V.W / 2; this.vx = 0; this.wide = 0; this.newLevel(); },
  get floor() { return V.H * 0.97; },
  get PH() { return Kid.portrait() ? 150 : 130; },
  get padY() { return this.floor - Puppet.size(App.pup, this.PH).h - 18; },
  get padW() { return (Kid.portrait() ? 130 : 150) * (this.wide > 0 ? 1.6 : 1); },
  newLevel() {
    const P = Kid.portrait(), cols = P ? 7 : 11, rows = Math.min(8, 4 + this.level), w = Math.min(100, (V.W - 30) / cols), h = 32, x0 = V.W / 2 - w * cols / 2, y0 = P ? 150 : 90;
    this.bricks = [];
    for (let r = 0; r < rows; r++) for (let q = 0; q < cols; q++) {
      if (this.level % 2 && (q + r) % 4 === 0) continue;
      this.bricks.push({ x: x0 + q * w + 3, y: y0 + r * (h + 6), w: w - 6, h, col: this.COLS[r % 6], hp: this.level >= 2 && r < 2 ? 2 : 1, star: Math.random() < 0.06 });
    }
    this.serve();
  },
  serve() { this.ball = { x: this.x, y: this.padY - 16, vx: 0, vy: 0, r: 11, stuck: true }; },
  launch() { const b = this.ball; if (!b.stuck) return; b.stuck = false; const sp = 430 + this.level * 40; b.vx = rand(-0.5, 0.5) * sp; b.vy = -sp; Sfx.play('jump'); },
  tap() { this.launch(); },
  key(k) { if (k === 'space' || k === 'arrowup') this.launch(); },
  update(dt) {
    this.t += dt; this.wide = Math.max(0, this.wide - dt);
    let target = null; const kd = keyDir();
    if (kd) target = this.x + kd * 500; else if (Input.down) target = Input.x;
    const want = target == null ? 0 : clamp((target - this.x) * 14, -1300, 1300);
    this.vx += (want - this.vx) * Math.min(1, dt * 18); this.x = clamp(this.x + this.vx * dt, this.padW / 2, V.W - this.padW / 2);
    const b = this.ball, py = this.padY;
    if (b.stuck) { b.x = this.x; b.y = py - 16; return; }
    const steps = 4;
    for (let s = 0; s < steps; s++) {
      const h = dt / steps; b.x += b.vx * h; b.y += b.vy * h;
      if (b.x < b.r) { b.x = b.r; b.vx = Math.abs(b.vx); } if (b.x > V.W - b.r) { b.x = V.W - b.r; b.vx = -Math.abs(b.vx); }
      if (b.y < b.r + 60) { b.y = b.r + 60; b.vy = Math.abs(b.vy); }
      // 木板
      if (b.vy > 0 && b.y + b.r > py - 8 && b.y < py + 12 && Math.abs(b.x - this.x) < this.padW / 2 + b.r) {
        const off = (b.x - this.x) / (this.padW / 2), sp = Math.hypot(b.vx, b.vy) * 1.01, a = off * 1.05;
        b.vx = Math.sin(a) * sp; b.vy = -Math.cos(a) * sp; b.y = py - 8 - b.r; Sfx.play('flap');
      }
      // 磚塊
      for (const k of this.bricks) {
        if (k.dead || b.x + b.r < k.x || b.x - b.r > k.x + k.w || b.y + b.r < k.y || b.y - b.r > k.y + k.h) continue;
        const ox = Math.min(b.x + b.r - k.x, k.x + k.w - (b.x - b.r)), oy = Math.min(b.y + b.r - k.y, k.y + k.h - (b.y - b.r));
        if (ox < oy) b.vx = -b.vx; else b.vy = -b.vy;
        k.hp--; k.hit = 0.15;
        if (k.hp <= 0) {
          k.dead = true; this.score += 10 + this.level * 2; Sfx.play('catch'); FX.burst(k.x + k.w / 2, k.y + k.h / 2, 8, [k.col, '#fffdf5'], 0.5);
          if (k.star) { this.wide = 10; this.score += 20; Sfx.play('star'); FX.text(k.x + k.w / 2, k.y, '木板變長！', '#ff7a00', 30); }
        } else Sfx.play('block');
        break;
      }
    }
    for (const k of this.bricks) if (k.hit) k.hit = Math.max(0, k.hit - dt);
    if (b.y > this.floor + 30) {
      this.lives--; Sfx.play('hit'); V.shake = 8;
      if (this.lives <= 0) { this.over = true; return; }
      this.serve();
    }
    if (this.bricks.every(k => k.dead)) { this.level++; this.score += 100; Sfx.play('win'); FX.text(V.W / 2, V.H * 0.4, `第 ${this.level + 1} 關！`, '#e0573c', 50); FX.burst(V.W / 2, V.H * 0.4, 40, undefined, 1.2); this.newLevel(); }
  },
  draw(c) {
    const g = c.createLinearGradient(0, 0, 0, V.H); g.addColorStop(0, '#2d3a6b'); g.addColorStop(1, '#5a4a8c'); c.fillStyle = g; c.fillRect(-20, -20, V.W + 40, V.H + 40);
    for (let i = 0; i < 30; i++) { c.fillStyle = 'rgba(255,255,255,0.4)'; c.fillRect((i * 173) % V.W, (i * 97) % V.H, 2, 2); }
    for (const k of this.bricks) {
      if (k.dead) continue;
      Paper.rect(c, k.x, k.y + (k.hit ? 3 : 0), k.w, k.h, k.hp > 1 ? '#8a8fa8' : k.col, 6, { border: 3, blur: 4 });
      if (k.star) Kid.emoji(c, '⭐', k.x + k.w / 2, k.y + k.h / 2, 22);
    }
    const py = this.padY, P = Puppet.Poses, moving = Math.abs(this.vx) > 60;
    let pose = App.pup.kind === 'pet' ? (moving ? P.run(this.t) : P.idle(this.t)) : P.carry(this.t, clamp(this.vx / 900, -1, 1), moving);
    Puppet.draw(c, App.pup, this.x, this.floor, this.PH, pose);
    Paper.rect(c, this.x - this.padW / 2, py - 8, this.padW, 18, this.wide ? '#ffd23f' : '#c98a4b', 8, { border: 4 });
    const b = this.ball; Paper.circle(c, b.x, b.y, b.r, '#ffffff', { border: 3, blur: 8, shadowColor: 'rgba(255,255,255,0.6)' });
    if (b.stuck) Kid.text(c, '👆 點一下發球', V.W / 2, V.H * 0.62, 30, '#fff6c8');
  },
  hud() { return { L: `<b>${this.score}</b> 分　第 ${this.level + 1} 關`, R: '❤️'.repeat(Math.max(0, this.lives)) + '🤍'.repeat(Math.max(0, 3 - this.lives)) }; },
});
