'use strict';
// 斜斜接星星：手機往左右傾斜，紙片人就跑過去接住掉下來的星星和水果。沒有炸彈、不會輸，給小小孩玩。40 秒。
registerGame({
  id: 'tiltcatch', name: '斜斜接星星', icon: '🌟', color: '#f2b33d', tilt: true, kid: true,
  desc: '歪歪手機，紙片人就會跑去接星星！（手機限定）',
  howto: '📱 手機限定：把手機往左邊或右邊歪，紙片人就會跑過去，接住掉下來的星星和水果！彩虹星星分數最多。不會輸，限時 40 秒。（也可以用手指按住畫面左邊 / 右邊）',
  TIME: 40,
  ITEMS: [['⭐', 10], ['⭐', 10], ['🍎', 10], ['🍓', 10], ['🍌', 10], ['🌈', 30]],

  start() { this.t = 0; this.left = this.TIME; this.score = 0; this.over = false; this.overText = '接到好多星星！'; this.x = V.W / 2; this.vx = 0; this.items = []; this.spawnT = 0.5; this.cheer = 0; this.n = 0; },
  get floor() { return V.H * 0.93; },
  get PH() { return Kid.portrait() ? 190 : 200; },
  tap() { Tilt.calibrate(); },
  update(dt) {
    this.t += dt; this.left -= dt; this.cheer = Math.max(0, this.cheer - dt);
    if (this.left <= 0) { this.left = 0; this.over = true; return; }
    const want = Tilt.x * 700; this.vx += (want - this.vx) * Math.min(1, dt * 8); this.x = clamp(this.x + this.vx * dt, 50, V.W - 50);
    this.spawnT -= dt;
    if (this.spawnT <= 0) { const it = pick(this.ITEMS); this.items.push({ e: it[0], pts: it[1], x: rand(50, V.W - 50), y: -40, vy: rand(120, 170) * V.H / 720, rot: rand(0, 6) }); this.spawnT = rand(0.5, 0.9); }
    const hy = this.floor - Puppet.size(App.pup, this.PH).h * 0.6;
    for (const it of this.items) {
      it.y += it.vy * dt; it.rot += dt * 2;
      if (!it.done && Math.abs(it.y - hy) < 70 && Math.abs(it.x - this.x) < 70) {
        it.done = 1; this.score += it.pts; this.n++; this.cheer = 0.6; Sfx.play(it.pts > 10 ? 'star' : 'catch');
        FX.burst(it.x, it.y, it.pts > 10 ? 24 : 10, undefined, 0.6); FX.text(it.x, it.y - 40, `+${it.pts}`, '#ff7a00', 30);
        if (this.n % 10 === 0) { FX.text(V.W / 2, V.H * 0.3, pick(['好棒！', '好厲害！', '接得好！']), '#e0573c', 44); Kid.say('好棒！'); }
      }
      if (it.y > V.H + 40) it.done = 1;
    }
    this.items = this.items.filter(it => !it.done);
  },
  draw(c) {
    const gy = Kid.ground(c, 'sky', this.t, 0.93), P = Puppet.Poses, moving = Math.abs(this.vx) > 60;
    for (const it of this.items) Kid.emoji(c, it.e, it.x, it.y, 52, Math.sin(it.rot) * 0.3);
    let pose = this.cheer ? P.cheer(this.t) : moving ? P.run(this.t) : P.idle(this.t);
    pose.sx = (this.vx >= 0 ? 1 : -1) * (pose.sx || 1);
    c.fillStyle = 'rgba(60,40,10,0.22)'; c.beginPath(); c.ellipse(this.x, gy + 2, 40, 9, 0, 0, Math.PI * 2); c.fill();
    Puppet.draw(c, App.pup, this.x, gy, this.PH, pose);
    if (this.t < 5 || (!Tilt.active && this.t < 12)) Kid.text(c, Tilt.active ? '📱 把手機往左右歪歪看！' : Tilt.hint(), V.W / 2, V.H * 0.35, 24, '#e0573c');
  },
  hud() { return { L: `<b>${this.score}</b> 分　🌟 ${this.n}`, R: `⏱ ${Math.ceil(this.left)}` }; },
});
