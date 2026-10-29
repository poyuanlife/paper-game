'use strict';
// 過馬路：綠燈的時候點「走」，紅燈要停下來等。學交通安全。過 8 次馬路就結束，不會輸。
registerGame({
  id: 'crossing', name: '過馬路', icon: '🚦', color: '#45ad4a', kid: true,
  desc: '看紅綠燈，綠燈才可以過馬路喔！',
  howto: '看路口的紅綠燈：小綠人亮了才按「走！」過馬路，紅燈要停下來等車子過去。紅燈按的話紙片人會停下來提醒你。一共過 8 次馬路。',
  N: 8,
  CARS: ['🚗', '🚕', '🚙', '🚌', '🚚', '🚓', '🚑'],

  start() { this.t = 0; this.score = 0; this.over = false; this.overText = '交通安全小天使！'; this.done = 0; this.light = 'red'; this.lt = 2.5; this.cars = []; this.carT = 0; this.walk = null; this.side = 0; this.cheer = 0; this.warn = 0; this.streak = 0; },
  get road() { const P = Kid.portrait(); return { top: V.H * (P ? 0.36 : 0.34), bot: V.H * (P ? 0.66 : 0.7) }; },
  get btn() { const P = Kid.portrait(); return { x: P ? V.W / 2 : V.W - 150, y: P ? V.H * 0.88 : V.H * 0.88, w: 200, h: 90 }; },
  get px() { return Kid.portrait() ? V.W * 0.3 : V.W * 0.38; },
  footY(side) { const R = this.road; return side === 0 ? R.bot + (V.H - R.bot) * 0.55 : R.top - 18; },
  go() {
    if (this.walk || this.over) return;
    if (this.light === 'green') { this.walk = { t: 0, from: this.side }; Sfx.play('click'); Kid.say('左右看，過馬路'); }
    else { this.warn = 1.2; this.streak = 0; Sfx.play('nope'); Kid.say('紅燈，要停下來等喔'); FX.text(this.px, this.footY(this.side) - 200, '紅燈要停！', '#e8453c', 36); }
  },
  tap(x, y) { if (Kid.hit(this.btn, x, y, 10)) this.go(); },
  key(k) { if (k === 'space' || k === 'enter' || k === 'arrowup') this.go(); },
  update(dt) {
    this.t += dt; this.cheer = Math.max(0, this.cheer - dt); this.warn = Math.max(0, this.warn - dt);
    this.lt -= dt;
    if (this.lt <= 0 && !this.walk) {
      this.light = this.light === 'red' ? 'green' : 'red'; this.lt = this.light === 'red' ? rand(2.5, 4.5) : rand(3, 4);
      if (this.light === 'green') { Sfx.play('ding'); Kid.say('綠燈了'); }
    }
    // 車子：紅燈（行人）時才會開過去，綠燈停在停止線前面
    this.carT -= dt;
    const R = this.road, lanes = [R.top + (R.bot - R.top) * 0.3, R.top + (R.bot - R.top) * 0.72];
    if (this.carT <= 0 && this.light === 'red' && this.lt > 1) { const d = Math.random() < 0.5 ? 1 : -1; this.cars.push({ e: pick(this.CARS), x: d > 0 ? -80 : V.W + 80, y: lanes[d > 0 ? 1 : 0], d, v: rand(220, 320) }); this.carT = rand(0.7, 1.4); if (Math.random() < 0.3) Sfx.play('honk'); }
    const cw = { a: this.px - 70, b: this.px + 70 };
    for (const c of this.cars) {
      const stopX = c.d > 0 ? cw.a - 60 : cw.b + 60, before = c.d > 0 ? c.x < stopX : c.x > stopX;
      const stop = this.light === 'green' && before && Math.abs(c.x - stopX) < 140;
      c.x += (stop ? 0 : c.v * c.d) * dt; if (c.x < -150 || c.x > V.W + 150) c.gone = 1;
    }
    this.cars = this.cars.filter(c => !c.gone);
    if (this.walk) {
      this.walk.t += dt;
      if (this.walk.t >= 2) {
        this.side = 1 - this.walk.from; this.walk = null; this.done++; this.streak++; const pts = 10 + Math.min(10, this.streak * 2); this.score += pts; this.cheer = 1.5;
        Sfx.play('star'); FX.burst(this.px, this.footY(this.side) - 80, 18, undefined, 0.8); FX.text(this.px, this.footY(this.side) - 200, '安全過馬路！', '#3d8b2a', 34);
        if (this.done >= this.N) { this.over = true; return; }
        if (this.light === 'green') this.lt = Math.min(this.lt, 0.6);
      }
    }
  },
  draw(c) {
    const R = this.road, T = Paper.bg(c, 'meadow', 0, this.t);
    c.fillStyle = '#d9d2c3'; c.fillRect(-20, R.top - 50, V.W + 40, 50); c.fillRect(-20, R.bot, V.W + 40, V.H);   // 人行道
    c.fillStyle = '#5a5a66'; c.fillRect(-20, R.top, V.W + 40, R.bot - R.top);
    c.strokeStyle = '#ffd23f'; c.lineWidth = 5; c.setLineDash([30, 24]); c.beginPath(); c.moveTo(0, (R.top + R.bot) / 2); c.lineTo(V.W, (R.top + R.bot) / 2); c.stroke(); c.setLineDash([]);
    c.fillStyle = '#ffffff'; for (let y = R.top + 8; y < R.bot - 10; y += 26) c.fillRect(this.px - 70, y, 140, 14);   // 斑馬線
    // 紅綠燈
    const lx = this.px + 120, ly = R.top - 60;
    c.fillStyle = '#4a4a55'; c.fillRect(lx - 5, ly - 10, 10, 60);
    Paper.rect(c, lx - 32, ly - 150, 64, 140, '#333340', 12, { border: 4 });
    Paper.circle(c, lx, ly - 112, 24, this.light === 'red' ? '#ff3b30' : '#5a2a2a', { border: 0, shadowColor: this.light === 'red' ? 'rgba(255,60,40,0.9)' : 'transparent', blur: 18 });
    Paper.circle(c, lx, ly - 48, 24, this.light === 'green' ? '#33d17a' : '#1f4a30', { border: 0, shadowColor: this.light === 'green' ? 'rgba(50,220,120,0.9)' : 'transparent', blur: 18 });
    Kid.emoji(c, '🚶', lx, ly - 48, 26); Kid.emoji(c, '✋', lx, ly - 112, 24);
    if (this.light === 'green' && this.lt < 1.2 && Math.sin(this.t * 14) > 0) Paper.circle(c, lx, ly - 48, 24, '#1f4a30', { border: 0, shadow: false });
    for (const car of this.cars) { c.save(); c.translate(car.x, car.y); if (car.d > 0) c.scale(-1, 1); Kid.emoji(c, car.e, 0, 0, 84); c.restore(); }
    // 紙片人
    const P = Puppet.Poses, w = this.walk, k = w ? Math.min(1, w.t / 2) : 0, from = w ? w.from : this.side;
    const y = this.footY(from) + (this.footY(1 - from) - this.footY(from)) * k, ph = Kid.portrait() ? 150 : 140;
    let pose = w ? P.run(this.t * 0.7) : this.cheer ? P.cheer(this.t) : this.warn ? { aL: 2.6, aR: 0.2, aLf: 0.2, head: 0.1 } : P.idle(this.t);
    Puppet.draw(c, App.pup, this.px, y, ph, pose);
    const B = this.btn, ok = this.light === 'green' && !w;
    Kid.button(c, B, ok ? '走！🚶' : '等一下 ✋', ok ? '#45ad4a' : '#e8453c', { pop: ok ? Math.abs(Math.sin(this.t * 5)) * 0.4 : 0, size: 36 });
  },
  hud() { return { L: `<b>${this.score}</b> 分`, R: `🚸 ${this.done} / ${this.N}` }; },
});
