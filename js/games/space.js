'use strict';
// 太空閃避：紙片人坐著火箭，手指拖著移動，躲開隕石、吃星星。盾牌可以擋一次。3 條命，撐越久分數越高。
registerGame({
  id: 'space', name: '太空大冒險', icon: '🚀', color: '#3b3f8c',
  desc: '開著火箭躲隕石、收集星星！',
  howto: '手指按住畫面拖動火箭（或用方向鍵），躲開掉下來的隕石，吃 ⭐ 星星加分，🛡️ 盾牌可以擋一次撞擊。3 條命，越後面隕石越多！',

  start() { this.t = 0; this.score = 0; this.over = false; this.overText = '火箭撞壞了！'; this.lives = 3; this.x = V.W / 2; this.y = V.H * 0.78; this.things = []; this.spawnT = 0.5; this.hurt = 0; this.shield = 0; this.stars = Array.from({ length: 60 }, () => ({ x: Math.random(), y: Math.random(), s: rand(1, 3) })); this.dist = 0; },
  tap() {},
  spawn() {
    const r = Math.random(), lv = this.t / 20;
    const k = r < 0.12 ? 'star' : r < 0.15 && !this.shield ? 'shield' : 'rock';
    const s = k === 'rock' ? rand(28, 58) : 26;
    this.things.push({ k, x: rand(s, V.W - s), y: -s * 2, vy: (k === 'rock' ? rand(220, 320) : 200) * (1 + lv * 0.25) * V.H / 720, vx: k === 'rock' ? rand(-40, 40) : 0, s, rot: 0, vr: rand(-2, 2) });
    this.spawnT = Math.max(0.18, 0.6 - lv * 0.08) * rand(0.6, 1.2);
  },
  update(dt) {
    this.t += dt; this.hurt = Math.max(0, this.hurt - dt); this.dist += dt; this.score += dt * 5;
    const kd = keyDir(), ud = (Input.keys.arrowdown || Input.keys.s ? 1 : 0) - (Input.keys.arrowup || Input.keys.w ? 1 : 0);
    if (Input.down) { this.x += (Input.x - this.x) * Math.min(1, dt * 12); this.y += (Input.y - 60 - this.y) * Math.min(1, dt * 12); }
    else { this.x += kd * 520 * dt; this.y += ud * 520 * dt; }
    this.x = clamp(this.x, 40, V.W - 40); this.y = clamp(this.y, V.H * 0.25, V.H - 70);
    this.spawnT -= dt; if (this.spawnT <= 0) this.spawn();
    for (const o of this.things) {
      o.y += o.vy * dt; o.x += o.vx * dt; o.rot += o.vr * dt;
      if (o.y > V.H + 80) o.dead = 1;
      if (!o.dead && Math.hypot(o.x - this.x, o.y - (this.y - 10)) < o.s * 0.8 + 32) {
        o.dead = 1;
        if (o.k === 'star') { this.score += 30; Sfx.play('star'); FX.burst(o.x, o.y, 14, ['#ffd23f', '#fff6c8'], 0.6); FX.text(o.x, o.y - 40, '+30', '#ffd23f', 30); }
        else if (o.k === 'shield') { this.shield = 1; Sfx.play('coin'); FX.text(o.x, o.y - 40, '防護罩！', '#7fd8ff', 30); }
        else if (!this.hurt) {
          if (this.shield) { this.shield = 0; this.hurt = 0.8; Sfx.play('block'); FX.burst(o.x, o.y, 16, ['#7fd8ff', '#fff'], 0.8); }
          else { this.lives--; this.hurt = 1.4; Sfx.play('boom'); V.shake = 12; FX.burst(o.x, o.y, 24, ['#8a6a4a', '#ff9a2e', '#ffd23f'], 1); if (this.lives <= 0) { this.over = true; return; } }
        }
      }
    }
    this.things = this.things.filter(o => !o.dead);
  },
  draw(c) {
    c.fillStyle = '#0f1433'; c.fillRect(-20, -20, V.W + 40, V.H + 40);
    for (const s of this.stars) { const y = ((s.y * V.H + this.t * 40 * s.s) % V.H); c.fillStyle = `rgba(255,255,255,${0.3 + s.s * 0.2})`; c.fillRect(s.x * V.W, y, s.s, s.s); }
    Paper.circle(c, V.W * 0.85, ((this.t * 8) % (V.H + 300)) - 150, 60, '#c77dff', { border: 4, blur: 10 });
    for (const o of this.things) {
      c.save(); c.translate(o.x, o.y); c.rotate(o.rot);
      if (o.k === 'rock') { Paper.shape(c, cc => { for (let i = 0; i < 8; i++) { const a = i / 8 * Math.PI * 2, r = o.s * (0.8 + 0.25 * Math.sin(i * 2.7 + o.s)); cc.lineTo(Math.cos(a) * r, Math.sin(a) * r); } cc.closePath(); }, '#8a6a4a', { border: 3, blur: 6 }); c.fillStyle = 'rgba(0,0,0,0.2)'; c.beginPath(); c.arc(o.s * 0.2, -o.s * 0.2, o.s * 0.2, 0, Math.PI * 2); c.arc(-o.s * 0.3, o.s * 0.25, o.s * 0.14, 0, Math.PI * 2); c.fill(); }
      else Kid.emoji(c, o.k === 'star' ? '⭐' : '🛡️', 0, 0, o.s * 1.7);
      c.restore();
    }
    // 火箭 + 紙片人
    const x = this.x, y = this.y, tilt = clamp((Input.down ? Input.x - x : keyDir() * 60) / 300, -0.35, 0.35);
    c.save(); c.translate(x, y); c.rotate(tilt); if (this.hurt && Math.sin(this.t * 40) > 0) c.globalAlpha = 0.45;
    const fl = 18 + Math.sin(this.t * 40) * 6;
    Paper.shape(c, cc => { cc.moveTo(-14, 40); cc.lineTo(0, 40 + fl * 2); cc.lineTo(14, 40); cc.closePath(); }, '#ff9a2e', { border: 0, shadowColor: 'rgba(255,160,40,0.9)', blur: 14 });
    Paper.shape(c, cc => { cc.moveTo(-30, 30); cc.lineTo(-44, 52); cc.lineTo(-20, 42); cc.closePath(); cc.moveTo(30, 30); cc.lineTo(44, 52); cc.lineTo(20, 42); cc.closePath(); }, '#e8453c', { border: 3 });
    Paper.shape(c, cc => { cc.moveTo(0, -70); cc.quadraticCurveTo(34, -40, 30, 44); cc.lineTo(-30, 44); cc.quadraticCurveTo(-34, -40, 0, -70); cc.closePath(); }, '#e8ecf5', { border: 4 });
    Paper.circle(c, 0, -10, 24, '#7fd8ff', { border: 4, blur: 0 });
    Kid.head(c, 0, -8, 19, {}, 22);
    c.restore();
    if (this.shield) { c.strokeStyle = `rgba(127,216,255,${0.6 + Math.sin(this.t * 8) * 0.3})`; c.lineWidth = 4; c.beginPath(); c.arc(x, y - 10, 70, 0, Math.PI * 2); c.stroke(); }
    if (this.t < 3 && !Input.down) Kid.text(c, '👆 按住拖動火箭', V.W / 2, V.H * 0.5, 30, '#fff6c8');
  },
  hud() { return { L: `<b>${Math.floor(this.score)}</b> 分`, R: '❤️'.repeat(Math.max(0, this.lives)) + '🤍'.repeat(Math.max(0, 3 - this.lives)) }; },
});
