'use strict';
// 保齡球：從球往上滑出去，滑的方向和速度決定球路。5 局、每局 2 球。全倒（Strike）和補中（Spare）有加分。
registerGame({
  id: 'bowling', name: '紙片保齡球', icon: '🎳', color: '#6b4fa8',
  desc: '滑一下把球丟出去，一次撞倒全部的瓶子！',
  howto: '按住球往上滑出去：滑的方向就是球走的方向，滑越快球越快。左右移動手指可以先調整球的位置。每局 2 球，一共 5 局。全倒 +20、補中 +10！',
  FRAMES: 5,

  start() { this.t = 0; this.score = 0; this.over = false; this.overText = '比賽結束！'; this.frame = 0; this.roll = 0; this.sw = Kid.makeSwipe(); this.msg = null; this.cheer = 0; this.standing = 10; this.setPins(); this.resetBall(); },
  get lane() { const w = Math.min(V.W * 0.62, 340); return { x: V.W / 2 - w / 2, w, top: Kid.portrait() ? 140 : 70, bot: V.H - 20 }; },
  setPins() {
    const L = this.lane, cx = L.x + L.w / 2, sp = L.w * 0.16, y0 = L.top + 50; this.pins = [];
    for (let r = 0; r < 4; r++) for (let i = 0; i <= r; i++) this.pins.push({ x: cx + (i - r / 2) * sp, y: y0 + (3 - r) * sp * 0.9, vx: 0, vy: 0, down: false, fall: 0, r: L.w * 0.035 });
  },
  resetBall() { const L = this.lane; this.ball = { x: L.x + L.w / 2, y: L.bot - 70, vx: 0, vy: 0, r: L.w * 0.07, live: false, t: 0 }; },
  tap(x, y) { const b = this.ball; if (!b.live && !this.msg && Math.abs(x - b.x) < 120 && y > b.y - 140) this.sw.begin(x, y); },
  update(dt) {
    this.t += dt; this.cheer = Math.max(0, this.cheer - dt);
    const L = this.lane, b = this.ball;
    // 還沒丟之前，手指左右移可以調整位置
    if (this.sw.on && !b.live) b.x = clamp(Input.x, L.x + b.r + 4, L.x + L.w - b.r - 4);
    this.sw.step(e => {
      if (e.vy > -250) return;
      const sp = clamp(-e.vy, 500, 1500), ang = clamp(Math.atan2(e.vx, -e.vy), -0.25, 0.25);
      b.vx = Math.sin(ang) * sp; b.vy = -Math.cos(ang) * sp; b.live = true; b.t = 0; Sfx.play('swish');
    });
    if (this.msg) { this.msg.t -= dt; if (this.msg.t <= 0) { this.msg = null; this.next(); } return; }
    if (!b.live) return;
    b.t += dt;
    const sub = 4;
    for (let s = 0; s < sub; s++) {
      const h = dt / sub; b.x += b.vx * h; b.y += b.vy * h;
      if (b.x < L.x + b.r) { b.x = L.x + b.r; b.vx = Math.abs(b.vx) * 0.5; } if (b.x > L.x + L.w - b.r) { b.x = L.x + L.w - b.r; b.vx = -Math.abs(b.vx) * 0.5; }
      const all = [b, ...this.pins];
      for (let i = 0; i < all.length; i++) for (let j = i + 1; j < all.length; j++) {
        const p = all[i], q = all[j], dx = q.x - p.x, dy = q.y - p.y, d = Math.hypot(dx, dy), m = p.r + q.r;
        if (d >= m || d === 0) continue;
        const nx = dx / d, ny = dy / d, mp = p === b ? 6 : 1, mq = 1, rv = (q.vx - p.vx) * nx + (q.vy - p.vy) * ny;
        if (rv < 0) { const imp = -1.8 * rv / (1 / mp + 1 / mq); p.vx -= imp * nx / mp; p.vy -= imp * ny / mp; q.vx += imp * nx / mq; q.vy += imp * ny / mq; }
        const push = (m - d) / 2; p.x -= nx * push; p.y -= ny * push; q.x += nx * push; q.y += ny * push;
        for (const o of [p, q]) if (o !== b && !o.down) { o.down = true; if (!this.hitSnd) { Sfx.play('pins'); this.hitSnd = 1; } }
      }
      for (const p of this.pins) { p.x += p.vx * h; p.y += p.vy * h; p.vx *= 0.995; p.vy *= 0.995; if (p.x < L.x - 30 || p.x > L.x + L.w + 30) { p.vx = 0; p.vy = 0; } }
    }
    for (const p of this.pins) if (p.down) p.fall = Math.min(1, p.fall + dt * 3);
    if (b.y < L.top - 40 || b.t > 4) {
      b.live = false; this.hitSnd = 0;
      const now = this.pins.filter(p => p.down && !p.counted).length; this.pins.forEach(p => { if (p.down) p.counted = true; });
      const left = this.standing - now; this.score += now;
      let text = now ? `倒了 ${now} 支` : '洗溝！';
      if (left === 0 && this.roll === 0) { this.score += 20; text = '全倒！STRIKE！'; this.cheer = 2; Sfx.play('win'); FX.burst(V.W / 2, L.top + 100, 40, undefined, 1.2); }
      else if (left === 0) { this.score += 10; text = '補中！SPARE！'; this.cheer = 1.5; Sfx.play('star'); }
      this.standing = left; this.msg = { s: text, t: 1.3 };
    }
  },
  next() {
    if (this.roll === 0 && this.standing > 0) { this.roll = 1; this.pins = this.pins.filter(p => !p.down); this.resetBall(); return; }
    if (this.frame + 1 >= this.FRAMES) { this.over = true; return; }
    this.frame++; this.roll = 0; this.standing = 10; this.setPins(); this.resetBall();
  },
  draw(c) {
    const L = this.lane;
    c.fillStyle = '#3a2f55'; c.fillRect(-20, -20, V.W + 40, V.H + 40);
    c.fillStyle = '#2a223f'; c.fillRect(L.x - 26, L.top - 40, L.w + 52, L.bot - L.top + 60);
    const g = c.createLinearGradient(L.x, 0, L.x + L.w, 0); g.addColorStop(0, '#d9a066'); g.addColorStop(0.5, '#f0c890'); g.addColorStop(1, '#d9a066');
    c.fillStyle = g; c.fillRect(L.x, L.top - 40, L.w, L.bot - L.top + 60);
    c.strokeStyle = 'rgba(120,70,30,0.2)'; c.lineWidth = 2; for (let i = 1; i < 10; i++) { c.beginPath(); c.moveTo(L.x + L.w * i / 10, L.top - 40); c.lineTo(L.x + L.w * i / 10, L.bot + 20); c.stroke(); }
    for (let i = 0; i < 5; i++) Paper.shape(c, cc => { const x = L.x + L.w * (0.2 + i * 0.15), y = L.bot - 180; cc.moveTo(x, y - 14); cc.lineTo(x + 8, y); cc.lineTo(x - 8, y); cc.closePath(); }, '#e8453c', { border: 0, shadow: false });
    for (const p of this.pins) {
      c.save(); c.translate(p.x, p.y); c.globalAlpha = 1 - p.fall * 0.6; c.rotate(p.fall * 1.4 * (p.vx >= 0 ? 1 : -1)); c.scale(1, 1 - p.fall * 0.4);
      Paper.shape(c, cc => cc.ellipse(0, 0, p.r, p.r * 1.25, 0, 0, Math.PI * 2), '#ffffff', { border: 3, blur: 4 });
      c.fillStyle = '#e8453c'; c.fillRect(-p.r * 0.8, -p.r * 0.3, p.r * 1.6, p.r * 0.25); c.restore();
    }
    const b = this.ball;
    Paper.circle(c, b.x, b.y, b.r, '#3f5bd6', { border: 3, blur: 6 });
    c.fillStyle = '#1f2f7a'; for (const [dx, dy] of [[-0.25, -0.3], [0.15, -0.35], [-0.05, 0]]) { c.beginPath(); c.arc(b.x + dx * b.r, b.y + dy * b.r, b.r * 0.13, 0, Math.PI * 2); c.fill(); }
    if (this.sw.on) { c.strokeStyle = 'rgba(255,255,255,0.6)'; c.setLineDash([8, 8]); c.lineWidth = 3; c.beginPath(); c.moveTo(b.x, b.y); c.lineTo(b.x, L.top); c.stroke(); c.setLineDash([]); }
    const P = Puppet.Poses, PH = Kid.portrait() ? 170 : 200;
    Puppet.draw(c, App.pup, Math.max(70, L.x - 90), V.H - 10, PH, this.cheer ? P.cheer(this.t) : P.idle(this.t));
    // 計分板
    Kid.text(c, `第 ${this.frame + 1} / ${this.FRAMES} 局　第 ${this.roll + 1} 球`, V.W / 2, L.top - 60 < 30 ? 30 : L.top - 60 + 20, 24, '#fff6c8', 6);
    if (this.msg) Kid.text(c, this.msg.s, V.W / 2, V.H * 0.45, this.msg.s.length > 6 ? 44 : 40, '#ffd23f');
    if (!b.live && !this.msg && this.t < 6 && this.frame === 0 && this.roll === 0) Kid.text(c, '👆 按住球往上滑', V.W / 2, V.H * 0.6, 28, '#fff6c8');
  },
  hud() { return { L: `<b>${this.score}</b> 分`, R: `🎳 ${this.frame + 1} / ${this.FRAMES}` }; },
});
