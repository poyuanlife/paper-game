'use strict';
// 斜斜賽車：手機往左右傾斜開車、往前傾加速、往後傾煞車。閃過前面的車子，吃金幣。撞 3 次就結束。
registerGame({
  id: 'tiltcar', name: '斜斜賽車', icon: '🏎️', color: '#e8453c', tilt: true,
  desc: '把手機當方向盤，閃過車子衝衝衝！（手機限定）',
  howto: '📱 手機限定：手機往左右傾斜轉方向盤，往前傾加速、往後傾減速。閃過前面的車子，吃 💰 金幣加分，開到草地上會變慢。撞車 3 次就結束，開越遠分數越高！（電腦用方向鍵）',
  CARS: ['🚗', '🚕', '🚙', '🚌', '🚚', '🚐'],

  start() { this.t = 0; this.score = 0; this.over = false; this.overText = '車子撞壞了！'; this.lives = 3; this.x = 0; this.speed = 300; this.dist = 0; this.things = []; this.spawnT = 1; this.hurt = 0; this.coins = 0; this.lines = 0; },
  get road() { const w = Math.min(V.W * 0.78, 460); return { l: V.W / 2 - w / 2, r: V.W / 2 + w / 2, w, lanes: 3 }; },
  get carY() { return V.H * 0.78; },
  tap() { Tilt.calibrate(); },
  update(dt) {
    this.t += dt; this.hurt = Math.max(0, this.hurt - dt);
    const R = this.road, cx = R.l + R.w / 2 + this.x;
    const target = clamp(320 + this.t * 4 - Tilt.y * 220, 160, 760);
    this.speed += (target - this.speed) * Math.min(1, dt * 2);
    const off = cx < R.l + 20 || cx > R.r - 20; if (off) this.speed = Math.min(this.speed, 200);
    this.x = clamp(this.x + Tilt.x * 520 * dt, -R.w / 2 - 20, R.w / 2 + 20);
    const dy = this.speed * dt * V.H / 720; this.dist += dy; this.lines = (this.lines + dy) % 80;
    this.score = Math.floor(this.dist / 20) + this.coins * 20;
    this.spawnT -= dt;
    if (this.spawnT <= 0) {
      const lane = Math.floor(Math.random() * 3), lx = R.w * (lane + 0.5) / 3 - R.w / 2;
      if (Math.random() < 0.3) for (let i = 0; i < 4; i++) this.things.push({ k: 'coin', x: lx, y: -40 - i * 60, v: 0 });
      else this.things.push({ k: 'car', x: lx, y: -80, v: rand(110, 200), e: pick(this.CARS) });
      this.spawnT = Math.max(0.35, 1.1 - this.t / 60) * rand(0.7, 1.2);
    }
    for (const o of this.things) {
      o.y += (this.speed - o.v) * dt * V.H / 720;
      if (o.y > V.H + 100) o.dead = 1;
      if (o.dead) continue;
      const dx = Math.abs(o.x - this.x), dyy = Math.abs(o.y - this.carY);
      if (o.k === 'coin' && dx < 40 && dyy < 40) { o.dead = 1; this.coins++; Sfx.play('coin'); }
      if (o.k === 'car' && !this.hurt && dx < 50 && dyy < 70) {
        this.lives--; this.hurt = 1.5; this.speed = 120; Sfx.play('boom'); V.shake = 12; FX.burst(R.l + R.w / 2 + this.x, this.carY - 40, 22, ['#888', '#ff9a2e', '#ffd23f'], 1);
        o.v = this.speed + 200;
        if (this.lives <= 0) { this.over = true; return; }
      }
    }
    this.things = this.things.filter(o => !o.dead);
  },
  draw(c) {
    const R = this.road, mid = R.l + R.w / 2;
    c.fillStyle = '#7dbb5c'; c.fillRect(-20, -20, V.W + 40, V.H + 40);
    for (let i = 0; i < 12; i++) { const y = ((i * 97 + this.dist * 0.98) % (V.H + 80)) - 40; Kid.emoji(c, i % 3 ? '🌳' : '🌼', (i % 2 ? R.r + 24 + (i * 37) % 60 : R.l - 24 - (i * 41) % 60), y, i % 3 ? 44 : 26); }
    c.fillStyle = '#5a5a66'; c.fillRect(R.l, -20, R.w, V.H + 40);
    c.fillStyle = '#fffdf5'; c.fillRect(R.l - 8, -20, 8, V.H + 40); c.fillRect(R.r, -20, 8, V.H + 40);
    c.fillStyle = 'rgba(255,255,255,0.8)'; for (let k = 1; k < 3; k++) for (let y = -80 + this.lines; y < V.H; y += 80) c.fillRect(R.l + R.w * k / 3 - 3, y, 6, 40);
    for (const o of this.things) {
      const x = mid + o.x;
      if (o.k === 'coin') { Paper.circle(c, x, o.y, 16, '#ffd23f', { border: 3, blur: 3 }); Kid.text(c, '$', x, o.y + 1, 18, '#b8860b', 0); }
      else { c.save(); c.translate(x, o.y); c.rotate(-Math.PI / 2); Kid.emoji(c, o.e, 0, 0, 92); c.restore(); }
    }
    // 自己的車：紙片車 + 紙片人的頭
    const x = mid + this.x, y = this.carY, tilt = Tilt.x * 0.25;
    c.save(); c.translate(x, y); c.rotate(tilt); if (this.hurt && Math.sin(this.t * 30) > 0) c.globalAlpha = 0.45;
    for (const [wx, wy] of [[-30, -38], [30, -38], [-30, 34], [30, 34]]) Paper.rect(c, wx - 9, wy - 14, 18, 28, '#2a2a33', 5, { border: 2, blur: 2 });
    Paper.rect(c, -28, -60, 56, 120, '#e8453c', 20, { border: 5 });
    Paper.rect(c, -20, -38, 40, 22, '#bfe8ff', 6, { border: 0, shadow: false });
    Kid.head(c, 0, 4, 19, {}, 22);
    c.fillStyle = '#ffd23f'; c.fillRect(-22, -60, 10, 6); c.fillRect(12, -60, 10, 6);
    c.restore();
    if (this.speed > 500) { c.strokeStyle = 'rgba(255,255,255,0.5)'; c.lineWidth = 2; for (let i = 0; i < 6; i++) { const sx = rand(0, V.W), sy = rand(0, V.H); c.beginPath(); c.moveTo(sx, sy); c.lineTo(sx, sy + 40); c.stroke(); } }
    Kid.text(c, `${Math.round(this.speed / 4)} km/h`, V.W - 80, V.H - 30, 22, '#2a2a33', 6);
    if (this.t < 5 || (!Tilt.active && this.t < 12)) Kid.text(c, Tilt.hint(), V.W / 2, V.H * 0.45, 18, '#2a2a33', 6);
  },
  hud() { return { L: `<b>${this.score}</b> 分　💰 ${this.coins}`, R: '❤️'.repeat(Math.max(0, this.lives)) + '🤍'.repeat(Math.max(0, 3 - this.lives)) }; },
});
