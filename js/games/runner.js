'use strict';
// 跳跳跑跑：點一下跳（可以二段跳），跳過紙箱和仙人掌，吃金幣。越跑越快。
// 手機直拿時畫面又高又窄：鏡頭拉近（z 倍），世界座標的速度也除以 z，所以障礙物出現的時間跟橫向一樣，只是看起來比較大。
registerGame({
  id: 'runner', name: '跳跳跑跑', icon: '🏃', color: '#f2a541',
  desc: '跳過障礙物、吃金幣，越跑越快！',
  howto: '點一下畫面（或按空白鍵）跳躍，空中再點一次可以二段跳。小心飛過來的鳥，牠飛得比較高！',

  start() {
    this.t = 0; this.speed = 380; this.dist = 0; this.scroll = 0; this.coins = 0; this.score = 0;
    this.p = { y: 0, vy: 0, jumps: 0, land: 0, air: 0 };
    this.obs = []; this.items = []; this.next = 700; this.dead = 0; this.over = false; this.overText = '撞到了！';
  },
  // 鏡頭縮放：直向時讓「地面以上大約 580 的高度」（二段跳的最高點）剛好填滿畫面
  get z() { return V.H > V.W * 1.25 ? clamp((V.H * 0.9 - 90) / 580, 1, 1.7) : 1; },
  get WW() { return V.W / this.z; },   // 世界座標看得到的寬度
  get ground() { return this.z > 1 ? V.H * 0.9 / this.z : V.H * 0.84; },
  get px() { return Math.min(this.WW * 0.24, 300); },
  PH: 165,   // 紙片人高度

  tap() {
    const p = this.p; if (this.dead || p.jumps >= 2) return;
    p.vy = p.jumps ? 980 : 1120; p.jumps++; p.air = 0; Sfx.play('jump');
    FX.burst(this.px * this.z, (this.ground - p.y) * this.z, 6, ['#e9d9b6', '#d9c49a'], 0.4);
  },
  key(k) { if (k === 'space' || k === 'arrowup' || k === 'w') this.tap(); },

  spawn() {
    const x = this.WW + 80, r = Math.random(), late = this.t > 12;
    if (late && r < 0.18) this.obs.push({ k: 'bird', x, w: 64, h: 40, y: 175 + rand(0, 30), f: rand(0, 6) });
    else if (r < 0.5) this.obs.push({ k: 'box', x, w: rand(62, 80), h: rand(58, 76) });
    else if (r < 0.75) this.obs.push({ k: 'cactus', x, w: 46, h: rand(96, 124) });
    else this.obs.push({ k: 'stack', x, w: 74, h: 128 });
    // 金幣：一排或一個弧形
    if (Math.random() < 0.55) {
      const n = 4 + Math.floor(Math.random() * 3), arc = Math.random() < 0.6, x0 = x + rand(260, 360);
      for (let i = 0; i < n; i++) this.items.push({ x: x0 + i * 52, y: arc ? 70 + Math.sin(i / (n - 1) * Math.PI) * 150 : 60, got: 0 });
    }
    this.next = rand(380, 720) * Math.sqrt(this.speed / 380) / this.z;
  },

  update(dt) {
    const p = this.p; this.t += dt;
    if (this.dead) {
      this.dead += dt; p.vy -= 2600 * dt; p.y = Math.max(-200, p.y + p.vy * dt);
      if (this.dead > 1.2) this.over = true;
      return;
    }
    this.speed = Math.min(920, 380 + this.t * 13);
    // dist 用來算分數（跟方向無關）；dx 是世界座標的移動量
    const dx = this.speed * dt / this.z; this.dist += this.speed * dt; this.scroll += dx;
    // 跳躍：按住久一點落下比較慢（比較好控制）
    const g = p.vy > 0 && (Input.down || Input.keys.space) ? 2500 : 3400;
    p.vy -= g * dt; p.y += p.vy * dt; p.air += dt;
    if (p.y <= 0) { if (p.jumps) { p.land = 1; FX.burst(this.px * this.z, this.ground * this.z, 5, ['#e9d9b6'], 0.3); } p.y = 0; p.vy = 0; p.jumps = 0; }
    p.land = Math.max(0, p.land - dt * 6);

    this.next -= dx; if (this.next <= 0) this.spawn();
    for (const o of this.obs) { o.x -= dx * (o.k === 'bird' ? 1.25 : 1); if (o.f != null) o.f += dt * 10; }
    for (const c of this.items) c.x -= dx;
    this.obs = this.obs.filter(o => o.x > -150); this.items = this.items.filter(c => c.x > -50 && !c.got);

    // 碰撞（判定比畫面小一點，比較公平）
    const hb = { x0: this.px - 26, x1: this.px + 26, y0: p.y + 8, y1: p.y + Puppet.size(App.pup, this.PH).h * 0.86 };
    for (const o of this.obs) {
      const y0 = o.k === 'bird' ? o.y : 0, y1 = y0 + o.h, pad = 8;
      if (hb.x1 > o.x - o.w / 2 + pad && hb.x0 < o.x + o.w / 2 - pad && hb.y1 > y0 + pad && hb.y0 < y1 - pad) {
        this.dead = 0.001; p.vy = 900; Sfx.play('hit'); V.shake = 10;
        FX.burst(this.px * this.z, (this.ground - p.y - 80) * this.z, 24);
        return;
      }
    }
    for (const c of this.items) {
      if (Math.abs(c.x - this.px) < 44 && c.y + 20 > hb.y0 && c.y - 20 < hb.y1) {
        c.got = 1; this.coins++; Sfx.play('coin'); FX.text(c.x * this.z, (this.ground - c.y - 30) * this.z, '+5', '#e8a100', 28);
      }
    }
    this.score = Math.floor(this.dist / 60) + this.coins * 5;
  },

  drawObs(c, o) {
    const gy = this.ground;
    if (o.k === 'box' || o.k === 'stack') {
      const n = o.k === 'stack' ? 2 : 1, h = o.h / n;
      for (let i = 0; i < n; i++) {
        const y = gy - h * (i + 1), x = o.x - o.w / 2 + (i ? 4 : 0);
        Paper.rect(c, x, y, o.w, h, '#c8935a', 4);
        c.fillStyle = '#e6c58f'; c.fillRect(x + o.w / 2 - 7, y, 14, h);
        c.strokeStyle = 'rgba(90,50,20,0.35)'; c.lineWidth = 2; c.strokeRect(x + 6, y + 6, o.w - 12, h - 12);
      }
    } else if (o.k === 'cactus') {
      const x = o.x, y = gy - o.h;
      Paper.shape(c, c => {
        Paper.rrect(c, x - 16, y, 32, o.h + 4, 16);
        Paper.rrect(c, x - 40, y + o.h * 0.3, 18, o.h * 0.35, 9); Paper.rrect(c, x - 40, y + o.h * 0.55, 30, 16, 8);
        Paper.rrect(c, x + 22, y + o.h * 0.18, 18, o.h * 0.32, 9); Paper.rrect(c, x + 10, y + o.h * 0.42, 30, 16, 8);
      }, '#4e9d5b', { border: 5 });
      c.fillStyle = 'rgba(255,255,255,0.35)'; for (let i = 0; i < 4; i++) c.fillRect(x - 2, y + 14 + i * o.h * 0.2, 4, 8);
    } else if (o.k === 'bird') {
      const x = o.x, y = gy - o.y - o.h / 2, wing = Math.sin(o.f) * 16;
      Paper.shape(c, c => { c.ellipse(x, y, 34, 20, 0, 0, Math.PI * 2); }, '#5a8fd8', { border: 4 });
      Paper.shape(c, c => { c.moveTo(x - 6, y - 4); c.lineTo(x + 18, y - 4); c.lineTo(x + 4, y - 26 - wing); c.closePath(); }, '#3f6fb8', { border: 3, blur: 3 });
      Paper.shape(c, c => { c.moveTo(x - 32, y - 4); c.lineTo(x - 48, y + 2); c.lineTo(x - 32, y + 8); c.closePath(); }, '#ffb340', { border: 3, blur: 2 });
      c.fillStyle = '#222'; c.beginPath(); c.arc(x - 18, y - 6, 4, 0, Math.PI * 2); c.fill();
    }
  },

  draw(c, dt) {
    const T = Paper.bg(c, 'meadow', this.scroll, this.t), gy = this.ground, z = this.z, WW = this.WW;
    // 背景照原本的大小畫；地面、障礙物、紙片人放大 z 倍
    c.save(); c.scale(z, z);
    // 地面
    c.fillStyle = T.ground; c.fillRect(-20, gy, WW + 40, V.H / z - gy + 20);
    Paper.rect(c, -20, gy - 10, WW + 40, 22, T.grass, 4, { blur: 4, oy: 3 });
    c.fillStyle = 'rgba(255,255,255,0.18)';
    for (let x = -((this.scroll * 1) % 90); x < WW; x += 90) c.fillRect(x, gy + 40, 40, 6);
    for (const coin of this.items) {
      const s = Math.abs(Math.cos(this.t * 4 + coin.x * 0.02));
      Paper.shape(c, cc => cc.ellipse(coin.x, gy - coin.y, 17 * Math.max(0.25, s), 17, 0, 0, Math.PI * 2), '#ffcf3a', { border: 3, blur: 4 });
    }
    for (const o of this.obs) this.drawObs(c, o);

    const p = this.p, P = Puppet.Poses;
    let pose;
    if (this.dead) pose = Object.assign(P.hurt(this.dead), { rot: -this.dead * 7 });
    else if (p.y > 0 || p.jumps) pose = P.jump(p.vy / 1000);
    else pose = p.land ? Puppet.mix(P.run(this.t), P.land(1), p.land) : P.run(this.t);
    if (!this.dead) { // 地上的影子
      const s = Math.max(0.3, 1 - p.y / 400);
      c.fillStyle = 'rgba(60,40,10,0.22)'; c.beginPath(); c.ellipse(this.px, gy + 2, 38 * s, 9 * s, 0, 0, Math.PI * 2); c.fill();
    }
    Puppet.draw(c, App.pup, this.px, gy - p.y, this.PH, pose);
    c.restore();
  },
  hud() { return { L: `<b>${this.score}</b> 分`, R: `金幣 ${this.coins}　${Math.floor(this.dist / 60)} m` }; },
});
