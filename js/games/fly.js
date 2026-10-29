'use strict';
// 飛飛紙人：點一下往上飛，穿過兩支鉛筆之間的縫。
registerGame({
  id: 'fly', name: '飛飛紙人', icon: '🕊️', color: '#4d96ff',
  desc: '揮手往上飛，穿過鉛筆之間的縫！',
  howto: '點一下畫面（或按空白鍵）往上飛，不按就會往下掉。穿過一組鉛筆得 1 分，碰到鉛筆或地面就結束。',
  tapOnStart: true,

  start() {
    this.t = 0; this.y = V.H * 0.45; this.vy = 0; this.pipes = []; this.next = 1.0; this.score = 0; this.scroll = 0;
    this.dead = 0; this.over = false; this.flapT = 1; this.overText = '撞到了！';
  },
  get px() { return Math.min(V.W * 0.3, 360); },
  PH: 118,
  get floor() { return V.H * 0.9; },

  tap() { if (this.dead) return; this.vy = -560; this.flapT = 0; Sfx.play('flap'); },
  key(k) { if (k === 'space' || k === 'arrowup' || k === 'w') this.tap(); },

  update(dt) {
    this.t += dt; this.flapT += dt;
    this.vy = Math.min(900, this.vy + 1750 * dt); this.y += this.vy * dt;
    if (this.dead) { this.dead += dt; if (this.y > this.floor) { this.y = this.floor; this.vy = 0; } if (this.dead > 1.1) this.over = true; return; }
    const speed = Math.min(390, 250 + this.score * 5), dx = speed * dt; this.scroll += dx;
    this.next -= dt;
    if (this.next <= 0) {
      const gap = Math.max(178, 255 - this.score * 3), m = 90 + gap / 2;
      this.pipes.push({ x: V.W + 70, gy: rand(m, this.floor - m), gap, w: 74, passed: false, c: pick(['#ff6b6b', '#ffd93d', '#6bcB77', '#4d96ff', '#c77dff']) });
      this.next = 1.55;
    }
    for (const p of this.pipes) {
      p.x -= dx;
      if (!p.passed && p.x + p.w / 2 < this.px) { p.passed = true; this.score++; Sfx.play('coin'); FX.text(this.px, this.y - this.PH - 20, '+1', '#2f7de1', 30); }
    }
    this.pipes = this.pipes.filter(p => p.x > -100);
    if (this.y - this.PH < 0) { this.y = this.PH; this.vy = Math.max(0, this.vy); }

    // 碰撞：身體當成一個圓
    const ph = Puppet.size(App.pup, this.PH).h, cx = this.px, cy = this.y - ph * 0.5, r = Math.max(ph, this.PH * 0.75) * 0.3;
    let hit = this.y >= this.floor;
    for (const p of this.pipes) {
      const nx = clamp(cx, p.x - p.w / 2, p.x + p.w / 2);
      for (const [y0, y1] of [[-100, p.gy - p.gap / 2], [p.gy + p.gap / 2, V.H + 100]]) {
        const ny = clamp(cy, y0, y1); if (Math.hypot(cx - nx, cy - ny) < r) hit = true;
      }
    }
    if (hit) { this.dead = 0.001; this.vy = -300; Sfx.play('hit'); V.shake = 10; FX.burst(cx, cy, 22); }
  },

  // 鉛筆：筆身 + 削尖的筆尖朝向縫，另一頭是橡皮擦
  pencil(c, x, y, w, len, dir, col) {
    const tip = 46, bodyEnd = y + dir * (len - tip);
    const y0 = Math.min(y, bodyEnd), h = Math.abs(len - tip);
    Paper.shape(c, cc => {
      cc.rect(x - w / 2, y0, w, h);
      cc.moveTo(x - w / 2, bodyEnd); cc.lineTo(x + w / 2, bodyEnd); cc.lineTo(x, bodyEnd + dir * tip); cc.closePath();
    }, col, { border: 5 });
    c.fillStyle = 'rgba(255,255,255,0.25)'; c.fillRect(x - w / 2 + 8, y0, 12, h);
    c.fillStyle = 'rgba(0,0,0,0.1)'; c.fillRect(x + w / 2 - 16, y0, 16, h);
    // 削開的木頭 + 筆芯
    c.fillStyle = '#f2d3a0'; c.beginPath(); c.moveTo(x - w / 2, bodyEnd); c.lineTo(x + w / 2, bodyEnd); c.lineTo(x, bodyEnd + dir * tip); c.closePath(); c.fill();
    c.fillStyle = '#3b3b3b'; c.beginPath(); c.moveTo(x - 9, bodyEnd + dir * (tip - 16)); c.lineTo(x + 9, bodyEnd + dir * (tip - 16)); c.lineTo(x, bodyEnd + dir * tip); c.closePath(); c.fill();
  },

  draw(c) {
    Paper.bg(c, 'sky', this.scroll, this.t);
    for (const p of this.pipes) {
      this.pencil(c, p.x, -10, p.w, p.gy - p.gap / 2 + 10, 1, p.c);
      this.pencil(c, p.x, V.H + 10, p.w, V.H + 10 - (p.gy + p.gap / 2), -1, p.c);
    }
    // 地面
    const fy = this.floor;
    c.fillStyle = '#d7b27a'; c.fillRect(-20, fy, V.W + 40, V.H);
    Paper.rect(c, -20, fy - 8, V.W + 40, 18, '#6aae4c', 4, { blur: 4 });
    c.fillStyle = 'rgba(255,255,255,0.2)'; for (let x = -(this.scroll % 80); x < V.W; x += 80) c.fillRect(x, fy + 30, 36, 6);

    const P = Puppet.Poses;
    let pose = this.flapT < 0.35 ? P.flap(this.flapT * 1.4) : P.flap(0.25 + this.t * 0.15);
    pose.rot = clamp(this.vy / 1400, -0.35, 0.6) + (this.dead ? this.dead * 5 : 0);
    if (this.dead) Object.assign(pose, P.hurt(this.dead), { rot: pose.rot });
    Puppet.draw(c, App.pup, this.px, this.y, this.PH, pose);
  },
  hud() { return { L: `<b>${this.score}</b> 分`, R: '' }; },
});
