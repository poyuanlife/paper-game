'use strict';
// 頂足球：點球就把球踢上去，不要讓球掉到地上。點球的左邊會往右飛、點右邊往左飛。3 顆球。
registerGame({
  id: 'keepup', name: '頂足球', icon: '⚽', color: '#3d8b4a',
  desc: '一直點球，不要讓它掉到地上！',
  howto: '點足球就會把球往上踢！點球的左邊，球會往右飛；點右邊，球會往左飛。球掉到地上就少一顆，一共 3 顆球。越踢越快，看你能踢幾下！',
  R: 34,

  start() { this.t = 0; this.score = 0; this.over = false; this.overText = '球掉了！'; this.lives = 3; this.combo = 0; this.best = 0; this.kick = 0; this.px = V.W / 2; this.serve(); },
  serve() { this.ball = { x: V.W / 2, y: V.H * 0.3, vx: rand(-60, 60), vy: -100, rot: 0, wait: 1.2 }; this.combo = 0; },
  get floor() { return V.H * 0.92; },
  get grav() { return 900 + Math.min(700, this.score * 8); },
  tap(x, y) {
    const b = this.ball; if (b.wait > 0) { b.wait = 0; }
    const d = Math.hypot(x - b.x, y - b.y);
    if (d > this.R + 46) return;
    const off = clamp((b.x - x) / (this.R + 20), -1, 1);
    b.vy = -rand(820, 900) - Math.min(300, this.score * 3); b.vx = off * 420 + rand(-40, 40); b.rot += off;
    this.combo++; this.score++; this.kick = 0.25; Sfx.play('punch');
    FX.burst(b.x, b.y + this.R, 6, ['#ffffff', '#cfe9b0'], 0.4);
    if (this.combo % 10 === 0) { FX.text(b.x, b.y - 60, `${this.combo} 下！`, '#e0573c', 40); Sfx.play('coin'); }
  },
  key(k) { if (k === 'space' || k === 'arrowup') { const b = this.ball; this.tap(b.x + (this.px - b.x) * 0.3, b.y + 10); } },
  update(dt) {
    this.t += dt; this.kick = Math.max(0, this.kick - dt);
    const b = this.ball;
    if (b.wait > 0) { b.wait -= dt; b.y = V.H * 0.3 + Math.sin(this.t * 4) * 8; return; }
    b.vy += this.grav * dt; b.x += b.vx * dt; b.y += b.vy * dt; b.rot += b.vx * dt * 0.02;
    if (b.x < this.R) { b.x = this.R; b.vx = Math.abs(b.vx) * 0.8; Sfx.play('thud'); }
    if (b.x > V.W - this.R) { b.x = V.W - this.R; b.vx = -Math.abs(b.vx) * 0.8; Sfx.play('thud'); }
    if (b.y < this.R + 60) { b.y = this.R + 60; b.vy = Math.abs(b.vy) * 0.3; }
    // 紙片人跑到球下面
    this.px += clamp((b.x - this.px) * 5, -600, 600) * dt;
    if (b.y > this.floor - this.R) {
      this.lives--; Sfx.play('hit'); V.shake = 6; FX.text(b.x, this.floor - 80, '掉了！', '#e8453c', 36);
      if (this.lives <= 0) { this.over = true; this.overText = `最多連續 ${Math.max(this.best, this.combo)} 下`; return; }
      this.best = Math.max(this.best, this.combo); this.serve();
    }
    this.best = Math.max(this.best, this.combo);
  },
  draw(c) {
    const gy = Kid.ground(c, 'meadow', this.t, 0.92), b = this.ball, P = Puppet.Poses;
    c.fillStyle = 'rgba(255,255,255,0.5)'; c.fillRect(-20, gy + 20, V.W + 40, 4);
    // 影子提示球會掉在哪
    const sh = clamp(1 - (gy - b.y) / V.H, 0.2, 1); c.fillStyle = `rgba(40,30,10,${0.25 * sh})`; c.beginPath(); c.ellipse(b.x, gy + 3, this.R * 1.4 * sh, 8 * sh, 0, 0, Math.PI * 2); c.fill();
    const moving = Math.abs(b.x - this.px) > 20;
    const pose = this.kick ? { lL: 1.1, lLf: -0.2, aL: 1.2, aR: 1.4, rot: -0.1 } : moving ? P.run(this.t) : P.idle(this.t);
    pose.sx = (b.x >= this.px ? 1 : -1) * (pose.sx || 1);
    Puppet.draw(c, App.pup, this.px, gy, Kid.portrait() ? 220 : 210, pose);
    c.save(); c.translate(b.x, b.y); c.rotate(b.rot);
    Paper.circle(c, 0, 0, this.R, '#ffffff', { border: 3, blur: 6 });
    c.fillStyle = '#2a2a33';
    const pent = (x, y, r) => { c.beginPath(); for (let i = 0; i < 5; i++) { const a = -Math.PI / 2 + i * Math.PI * 2 / 5; c.lineTo(x + Math.cos(a) * r, y + Math.sin(a) * r); } c.closePath(); c.fill(); };
    pent(0, 0, this.R * 0.35); for (let i = 0; i < 5; i++) { const a = -Math.PI / 2 + i * Math.PI * 2 / 5; pent(Math.cos(a) * this.R * 0.85, Math.sin(a) * this.R * 0.85, this.R * 0.22); }
    c.restore();
    if (b.wait > 0) Kid.text(c, '👆 點球開始！', V.W / 2, V.H * 0.3 - 70, 32, '#3d8b4a');
  },
  hud() { const h = '⚽'.repeat(Math.max(0, this.lives)) + '⚪'.repeat(Math.max(0, 3 - this.lives)); return { L: `<b>${this.score}</b> 下${this.combo >= 5 ? `　<span class="combo">連續 ${this.combo}</span>` : ''}`, R: h }; },
});
