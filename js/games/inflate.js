'use strict';
// 吹氣球：按住畫面吹氣球，放開就綁起來飛走。吹越大分數越多，可是吹太大會「碰！」破掉。8 顆氣球。
registerGame({
  id: 'inflate', name: '吹氣球', icon: '💨', color: '#ff5d8f', kid: true,
  desc: '按住吹氣球，吹大一點，可是不要破掉！',
  howto: '按住畫面，紙片人就會吹氣球；放開就把氣球綁好飛上天。吹越大分數越多，可是氣球開始抖的時候就要小心，吹太大會破掉喔！一共 8 顆。',
  N: 8, COLS: ['#e8453c', '#ff8a1f', '#ffcc1f', '#45ad4a', '#3fa9e0', '#9b5bd6', '#ff7eb6'],

  start() { this.t = 0; this.score = 0; this.over = false; this.overText = '吹氣球高手！'; this.n = 0; this.flying = []; this.cheer = 0; this.laugh = 0; this.blowing = false; this.newBalloon(); },
  newBalloon() { this.b = { s: 0, limit: rand(0.72, 1), col: pick(this.COLS) }; this.wait = 0; },
  get px() { return Kid.portrait() ? V.W * 0.32 : V.W * 0.35; },
  get floor() { return V.H * 0.92; },
  get PH() { return Kid.portrait() ? Math.min(V.H * 0.3, 280) : Math.min(V.H * 0.45, 320); },
  mouth() { const A = Puppet.anchors(App.pup), h = Puppet.toScreen(App.pup, this.PH, A.head); return { x: this.px + h.x + A.headR * h.k * 0.9, y: this.floor + h.y + A.headR * h.k * 0.25 }; },
  tap() {},
  key(k) { if (k === 'space') Input.down = true; },
  update(dt) {
    this.t += dt; this.cheer = Math.max(0, this.cheer - dt); this.laugh = Math.max(0, this.laugh - dt);
    if (Input.keys.space === false && this._space) Input.down = false; this._space = Input.keys.space;
    const b = this.b;
    if (this.wait > 0) { this.wait -= dt; if (this.wait <= 0) { if (this.n >= this.N) { this.over = true; return; } this.newBalloon(); } }
    else if (Input.down) {
      this.blowing = true; b.s += dt * 0.32; if (Math.random() < dt * 5) Sfx.play('blow');
      if (b.s > b.limit) {   // 破掉了
        const m = this.mouth(), r = this.rad(b.s); this.n++; this.wait = 1.2; this.blowing = false; this.laugh = 1.2;
        Sfx.play('boom'); V.shake = 8; FX.burst(m.x + r, m.y - r * 0.3, 30, [b.col, '#ffffff'], 1.1); FX.text(m.x + r, m.y - r - 20, '碰！', '#e8453c', 50); Kid.say('哈哈，破掉了');
        b.s = 0;
      }
    } else if (this.blowing) {
      this.blowing = false;
      if (b.s > 0.12) {
        const m = this.mouth(), pts = Math.round(b.s * 60); this.score += pts; this.n++; this.cheer = 1.2;
        this.flying.push({ x: m.x + this.rad(b.s), y: m.y - this.rad(b.s) * 0.2, s: b.s, col: b.col, t: 0 }); Sfx.play('catch');
        FX.text(m.x + 40, m.y - this.rad(b.s) - 30, `+${pts}`, '#3d8b2a', 34);
        if (b.s > b.limit - 0.08) { this.score += 20; FX.text(V.W / 2, V.H * 0.3, '超大的！好險！', '#e0573c', 40); Kid.say('哇！超大的！'); }
        this.wait = 0.6; b.s = 0;
      }
    }
    for (const f of this.flying) { f.t += dt; f.y -= (80 + f.t * 40) * dt; f.x += Math.sin(f.t * 2) * 30 * dt; }
    this.flying = this.flying.filter(f => f.y > -200);
  },
  rad(s) { return 20 + s * (Kid.portrait() ? 130 : 150); },
  balloon(c, x, y, s, col, jit) {
    const r = this.rad(s), j = jit ? (Math.random() - 0.5) * jit : 0;
    Paper.shape(c, cc => cc.ellipse(x + r + j, y - r * 0.15, r, r * 1.1, 0, 0, Math.PI * 2), col, { border: 4 });
    c.fillStyle = 'rgba(255,255,255,0.45)'; c.beginPath(); c.ellipse(x + r * 0.65 + j, y - r * 0.6, r * 0.15, r * 0.28, 0.4, 0, Math.PI * 2); c.fill();
  },
  draw(c) {
    Kid.ground(c, 'sky', this.t, 0.92);
    for (const f of this.flying) { c.strokeStyle = 'rgba(80,60,40,0.6)'; c.lineWidth = 2; c.beginPath(); c.moveTo(f.x, f.y + this.rad(f.s) * 0.9); c.lineTo(f.x + Math.sin(f.t * 3) * 10, f.y + this.rad(f.s) * 0.9 + 60); c.stroke(); this.balloon(c, f.x - this.rad(f.s), f.y, f.s, f.col); }
    const P = Puppet.Poses, b = this.b, blowing = Input.down && this.wait <= 0;
    let pose = this.laugh ? Object.assign(P.hurt(1.2 - this.laugh), { aL: 2.4, aR: 2.4 }) : this.cheer ? P.cheer(this.t) : blowing ? { aL: 1.9, aR: 2.1, aLf: 1.6, aRf: 1.5, head: -0.05, hsx: 1 + 0.06 * Math.sin(this.t * 20), sy: 1 - b.s * 0.03 } : P.idle(this.t);
    Puppet.draw(c, App.pup, this.px, this.floor, this.PH, pose);
    if (this.wait <= 0 && b.s > 0) { const m = this.mouth(), warn = b.s > b.limit - 0.12; this.balloon(c, m.x, m.y, b.s, b.col, warn ? 10 : 0); if (warn && Math.random() < 0.1) Sfx.play('tick'); }
    // 進度：還剩幾顆
    for (let i = 0; i < this.N; i++) Kid.emoji(c, '🎈', V.W / 2 + (i - (this.N - 1) / 2) * 34, Kid.portrait() ? 130 : 95, 26, 0), c.globalAlpha = 1;
    for (let i = 0; i < this.n; i++) { Paper.circle(c, V.W / 2 + (i - (this.N - 1) / 2) * 34, (Kid.portrait() ? 130 : 95), 15, 'rgba(255,253,245,0.85)', { border: 0, shadow: false }); }
    if (this.t < 4 && !Input.down) Kid.text(c, '👆 按住畫面吹氣球', V.W / 2, V.H * 0.32, 32, '#e0573c');
  },
  hud() { return { L: `<b>${this.score}</b> 分`, R: `🎈 ${Math.min(this.n + 1, this.N)} / ${this.N}` }; },
});
