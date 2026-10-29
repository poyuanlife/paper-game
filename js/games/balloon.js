'use strict';
// 找顏色：題目說「找紅色的氣球」，點對顏色的氣球。點錯會告訴你那是什麼顏色。45 秒。
registerGame({
  id: 'balloon', name: '找顏色', icon: '🎈', color: '#e8453c', kid: true,
  desc: '找出指定顏色的氣球，一邊玩一邊認顏色！',
  howto: '上面會說要找什麼顏色，點那個顏色的氣球！找到 5 個就換一個顏色。點錯也沒關係，會告訴你那是什麼顏色。限時 45 秒。',
  TIME: 45,
  COLORS: [['紅色', '#e8453c'], ['黃色', '#ffcc1f'], ['藍色', '#3f8fe0'], ['綠色', '#45ad4a'], ['紫色', '#9b5bd6'], ['橘色', '#ff8a1f'], ['粉紅色', '#ff7eb6']],

  start() {
    this.t = 0; this.left = this.TIME; this.score = 0; this.over = false; this.overText = '顏色小達人！';
    this.balls = []; this.spawnT = 0; this.nextT = 0; this.got = 0; this.cheer = 0; this.target = -1; this.newTarget();
  },
  newTarget() {
    let i; do i = Math.floor(Math.random() * this.COLORS.length); while (i === this.target);
    this.target = i; this.got = 0; this.banner = 1;
    Kid.say(`找${this.COLORS[i][0]}的氣球！`);
  },
  onEnter(prev) { if (prev === 'ready') Kid.say(`找${this.COLORS[this.target][0]}的氣球！`); },
  spawn() {
    const tgtOn = this.balls.filter(b => b.ci === this.target && !b.dead).length;
    let ci = Math.random() < (tgtOn < 2 ? 0.6 : 0.3) ? this.target : Math.floor(Math.random() * this.COLORS.length);
    const r = Kid.portrait() ? rand(38, 48) : rand(42, 54);
    this.balls.push({ ci, x: rand(r + 10, V.W - r - 10), y: V.H + r * 2, vy: -(rand(70, 110) + this.t * 0.8) * V.H / 720, r, ph: rand(0, 6), shake: 0, dead: 0 });
    this.spawnT = rand(0.45, 0.75);
  },
  tap(x, y) {
    let best = null, bd = 1e9;
    for (const b of this.balls) { if (b.dead) continue; const d = Math.hypot(x - b.x, (y - b.y) * 0.85); if (d < b.r + 22 && d < bd) { bd = d; best = b; } }
    if (!best) return;
    const [name, col] = this.COLORS[best.ci];
    if (best.ci === this.target) {
      best.dead = 1; this.got++; this.score += 10; this.cheer = 0.8; Sfx.play('pop');
      FX.burst(best.x, best.y, 14, [col, '#fff'], 0.7); FX.text(best.x, best.y - 30, '+10', col, 30);
      if (this.got >= 5) { this.score += 20; Sfx.play('win'); FX.text(V.W / 2, V.H * 0.4, `${name}全部找到了！`, col, 42); this.nextT = 0.9; this.got = -99; }
    } else {
      best.shake = 0.5; Sfx.play('nope'); FX.text(best.x, best.y - best.r - 20, `這是${name}`, col, 28); Kid.say(`這是${name}喔`);
    }
  },
  update(dt) {
    this.t += dt; this.left -= dt; this.cheer = Math.max(0, this.cheer - dt); this.banner = Math.max(0, this.banner - dt);
    if (this.left <= 0) { this.left = 0; this.over = true; return; }
    if (this.nextT > 0) { this.nextT -= dt; if (this.nextT <= 0) this.newTarget(); }
    this.spawnT -= dt; if (this.spawnT <= 0) this.spawn();
    for (const b of this.balls) { b.y += b.vy * dt; b.shake = Math.max(0, b.shake - dt); if (b.y < -b.r * 3) b.dead = 1; }
    this.balls = this.balls.filter(b => !b.dead);
  },
  drawBalloon(c, b) {
    const col = this.COLORS[b.ci][1], x = b.x + Math.sin(this.t * 1.5 + b.ph) * 10 + Math.sin(b.shake * 40) * b.shake * 16, y = b.y, r = b.r;
    c.strokeStyle = 'rgba(80,60,40,0.6)'; c.lineWidth = 2; c.beginPath(); c.moveTo(x, y + r * 1.15);
    c.quadraticCurveTo(x + Math.sin(this.t * 3 + b.ph) * 12, y + r * 1.8, x, y + r * 2.5); c.stroke();
    Paper.shape(c, c => { c.ellipse(x, y, r * 0.88, r, 0, 0, Math.PI * 2); }, col, { border: 4 });
    Paper.shape(c, c => { c.moveTo(x - 7, y + r * 1.15); c.lineTo(x + 7, y + r * 1.15); c.lineTo(x, y + r * 0.95); c.closePath(); }, col, { border: 2, blur: 2 });
    c.fillStyle = 'rgba(255,255,255,0.5)'; c.beginPath(); c.ellipse(x - r * 0.35, y - r * 0.4, r * 0.16, r * 0.28, 0.5, 0, Math.PI * 2); c.fill();
  },
  draw(c) {
    const gy = Kid.ground(c, 'sky', this.t, 0.95);
    for (const b of this.balls) this.drawBalloon(c, b);
    // 題目：大大的氣球 + 字
    const [name, col] = this.COLORS[this.target], bx = V.W / 2, by = Kid.portrait() ? 125 : 95, s = 1 + this.banner * 0.25;
    c.save(); c.translate(bx, by); c.scale(s, s);
    Paper.rect(c, -150, -38, 300, 76, '#fffdf5', 38, { border: 4 });
    Paper.shape(c, c => c.ellipse(-100, 0, 22, 26, 0, 0, Math.PI * 2), col, { border: 3, blur: 3 });
    Kid.text(c, `找${name}！`, 25, 2, name.length > 2 ? 34 : 38, col, 0);
    c.restore();
    const P = Puppet.Poses, h = Kid.portrait() ? 150 : 190;
    Puppet.draw(c, App.pup, Kid.portrait() ? 80 : 120, gy, h, this.cheer ? P.cheer(this.t) : P.idle(this.t));
  },
  hud() { return { L: `<b>${this.score}</b> 分`, R: `⏱ ${Math.ceil(this.left)}` }; },
});
