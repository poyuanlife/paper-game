'use strict';
// 接水果：左右移動，用頭上的籃子接住水果；接到炸彈扣一顆心。45 秒。
registerGame({
  id: 'catch', name: '接水果', icon: '🍎', color: '#e9654b',
  desc: '用籃子接住掉下來的水果，小心炸彈！',
  howto: '手指按住畫面左右拖（或用 ← → / A D 鍵）移動。連續接到會有加分，星星 50 分。接到炸彈扣一顆心，限時 45 秒。',
  TIME: 45,
  KINDS: {
    apple: { c: '#e9483f', pts: 10 }, orange: { c: '#ff9a2e', pts: 10 }, grape: { c: '#8e5bd6', pts: 15 },
    star: { c: '#ffd23f', pts: 50 }, bomb: { c: '#3a3a48', pts: 0 },
  },

  start() {
    this.t = 0; this.left = this.TIME; this.lives = 3; this.score = 0; this.combo = 0;
    this.x = V.W / 2; this.vx = 0; this.sx = 1; this.items = []; this.spawnT = 0.6; this.hurt = 0; this.over = false; this.overText = '時間到！';
    this.splats = [];
  },
  get ground() { return V.H * 0.93; },
  PH: 160,
  get basket() { return { x: this.x + this.vx * 0.012, y: this.ground - this.PH * 1.17, w: 120 }; },

  spawn() {
    const r = Math.random(), bombP = Math.min(0.3, 0.12 + this.t / 200);
    const k = r < bombP ? 'bomb' : r < bombP + 0.04 ? 'star' : pick(['apple', 'apple', 'orange', 'grape']);
    this.items.push({ k, x: rand(50, V.W - 50), y: -40, vy: rand(160, 220) + this.t * 5, r: 0, vr: rand(-3, 3) });
    this.spawnT = Math.max(0.32, 0.85 - this.t / 70) * rand(0.7, 1.3);
  },

  update(dt) {
    this.t += dt; this.left -= dt; this.hurt = Math.max(0, this.hurt - dt);
    if (this.left <= 0) { this.left = 0; this.over = true; return; }
    // 移動：手指按著就往手指的位置走，鍵盤用方向鍵
    let target = null; const kd = keyDir();
    if (kd) target = this.x + kd * 400; else if (Input.down) target = Input.x;
    const want = target == null ? 0 : clamp((target - this.x) * 9, -950, 950);
    this.vx += (want - this.vx) * Math.min(1, dt * 14);
    this.x = clamp(this.x + this.vx * dt, 50, V.W - 50);
    if (Math.abs(this.vx) > 60) this.sx += (Math.sign(this.vx) - this.sx) * Math.min(1, dt * 10);   // 轉身：紙片翻面

    this.spawnT -= dt; if (this.spawnT <= 0) this.spawn();
    const b = this.basket;
    for (const it of this.items) {
      it.vy += 260 * dt; it.y += it.vy * dt; it.r += it.vr * dt;
      if (!it.done && it.y > b.y - 24 && it.y < b.y + 20 && Math.abs(it.x - b.x) < b.w / 2) {
        it.done = 1;
        if (it.k === 'bomb') {
          this.lives--; this.combo = 0; this.hurt = 0.8; V.shake = 12; Sfx.play('boom');
          FX.burst(it.x, it.y, 26, ['#333', '#ff6b00', '#ffd23f'], 1.2); FX.text(it.x, it.y - 40, '碰！', '#d93a1f', 40);
          if (this.lives <= 0) { this.over = true; this.overText = '被炸到了！'; }
        } else {
          this.combo++; const mul = 1 + Math.floor(this.combo / 5), pts = this.KINDS[it.k].pts * mul;
          this.score += pts; Sfx.play(it.k === 'star' ? 'star' : 'catch');
          FX.burst(it.x, it.y, it.k === 'star' ? 20 : 8, [this.KINDS[it.k].c, '#fff6c8'], 0.6);
          FX.text(it.x, it.y - 40, '+' + pts + (mul > 1 ? ` ×${mul}` : ''), this.KINDS[it.k].c, 30);
        }
      }
      if (!it.done && it.y > this.ground - 10) {
        it.done = 1;
        if (it.k !== 'bomb') { this.combo = 0; this.splats.push({ x: it.x, c: this.KINDS[it.k].c, t: 0 }); }
      }
    }
    this.items = this.items.filter(it => !it.done);
    for (const s of this.splats) s.t += dt; this.splats = this.splats.filter(s => s.t < 1.5);
  },

  drawItem(c, it) {
    c.save(); c.translate(it.x, it.y); c.rotate(it.r);
    const K = this.KINDS[it.k];
    if (it.k === 'star') Paper.star(c, 0, 0, 26, K.c, 0, { border: 4 });
    else if (it.k === 'grape') { for (const [x, y] of [[-10, -8], [10, -8], [0, -10], [-6, 6], [6, 6], [0, 18]]) Paper.circle(c, x, y, 10, K.c, { border: 3, blur: 3 }); }
    else if (it.k === 'bomb') {
      Paper.circle(c, 0, 4, 22, K.c, { border: 4 });
      Paper.rect(c, -7, -24, 14, 10, '#5b5b6b', 2, { border: 2, blur: 2 });
      c.fillStyle = Math.sin(this.t * 30) > 0 ? '#ffd23f' : '#ff6b00'; c.beginPath(); c.arc(4, -30, 5, 0, Math.PI * 2); c.fill();
      c.fillStyle = 'rgba(255,255,255,0.4)'; c.beginPath(); c.arc(-8, -4, 6, 0, Math.PI * 2); c.fill();
    } else {
      Paper.circle(c, 0, 0, 22, K.c, { border: 4 });
      c.fillStyle = 'rgba(255,255,255,0.35)'; c.beginPath(); c.arc(-8, -8, 6, 0, Math.PI * 2); c.fill();
      Paper.shape(c, c => { c.ellipse(8, -24, 9, 5, -0.5, 0, Math.PI * 2); }, '#4f9a45', { border: 2, blur: 2 });
    }
    c.restore();
  },

  draw(c) {
    const T = Paper.bg(c, 'orchard', 0, this.t), gy = this.ground;
    c.fillStyle = T.ground; c.fillRect(-20, gy, V.W + 40, V.H);
    Paper.rect(c, -20, gy - 8, V.W + 40, 18, T.grass, 4, { blur: 4 });
    for (const s of this.splats) { c.globalAlpha = 1 - s.t / 1.5; c.fillStyle = s.c; c.beginPath(); c.ellipse(s.x, gy, 26, 7, 0, 0, Math.PI * 2); c.fill(); c.globalAlpha = 1; }

    const P = Puppet.Poses, moving = Math.abs(this.vx) > 60;
    let pose = P.carry(this.t, clamp(this.vx / 900, -1, 1), moving);
    if (this.hurt) pose = Puppet.mix(pose, P.hurt(0.8 - this.hurt), Math.min(1, this.hurt * 2));
    pose.sx = this.sx * (pose.sx || 1);
    c.fillStyle = 'rgba(60,40,10,0.22)'; c.beginPath(); c.ellipse(this.x, gy + 2, 40, 9, 0, 0, Math.PI * 2); c.fill();
    Puppet.draw(c, App.pup, this.x, gy, this.PH, pose, { alpha: this.hurt && Math.sin(this.t * 40) > 0 ? 0.5 : 1 });
    // 籃子
    const b = this.basket;
    c.save(); c.translate(b.x, b.y); c.rotate(clamp(this.vx / 900, -1, 1) * 0.12);
    Paper.shape(c, c => { c.moveTo(-b.w / 2, -10); c.lineTo(b.w / 2, -10); c.lineTo(b.w / 2 - 14, 26); c.lineTo(-b.w / 2 + 14, 26); c.closePath(); }, '#c98a4b', { border: 4 });
    c.strokeStyle = 'rgba(100,55,20,0.5)'; c.lineWidth = 3;
    for (let i = -2; i <= 2; i++) { c.beginPath(); c.moveTo(i * 22, -8); c.lineTo(i * 18, 24); c.stroke(); }
    c.beginPath(); c.moveTo(-b.w / 2 + 6, 8); c.lineTo(b.w / 2 - 6, 8); c.stroke();
    c.restore();
    for (const it of this.items) this.drawItem(c, it);
  },
  hud() {
    const hearts = '❤️'.repeat(Math.max(0, this.lives)) + '🤍'.repeat(Math.max(0, 3 - this.lives));
    return { L: `<b>${this.score}</b> 分${this.combo >= 5 ? `　<span class="combo">連續 ${this.combo}</span>` : ''}`, R: `${hearts}　⏱ ${Math.ceil(this.left)}` };
  },
});
