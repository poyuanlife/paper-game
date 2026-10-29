'use strict';
// 餵紙片人：把下面的食物拖到紙片人的頭（嘴巴）上，牠就會吃掉。餵到想吃的東西會特別開心。餵飽 3 次就結束。
registerGame({
  id: 'feed', name: '餵紙片人', icon: '🍽️', color: '#e9654b', kid: true,
  desc: '紙片人肚子餓了！把食物拖過去餵牠！',
  howto: '用手指把下面的食物拖到紙片人的頭上，牠就會吃掉。泡泡裡是牠最想吃的，餵牠會特別開心！吃 6 個就飽了，一共要餵飽 3 次。',
  FOODS: [['🍎', '蘋果'], ['🍌', '香蕉'], ['🍙', '飯糰'], ['🥕', '紅蘿蔔'], ['🍉', '西瓜'], ['🍪', '餅乾'], ['🍓', '草莓'], ['🥦', '花椰菜'], ['🍞', '麵包'], ['🧀', '起司'], ['🍇', '葡萄'], ['🍗', '雞腿']],
  FULL: 6, ROUNDS: 3,

  start() {
    this.t = 0; this.score = 0; this.over = false; this.overText = '吃得飽飽的！'; this.round = 0; this.ate = 0; this.fat = 0; this.chew = 0; this.happy = 0; this.fullT = 0;
    this.drag = Kid.makeDrag(); this.slots = []; for (let i = 0; i < 4; i++) this.slots.push(this.newFood(i)); this.newWish();
  },
  onEnter(prev) { if (prev === 'ready') Kid.say(`我想吃${this.wish[1]}`); },
  newFood(i) { const used = this.slots.map(s => s && s.f[0]); let f; do f = pick(this.FOODS); while (used.includes(f[0])); return { i, f, x: 0, y: 0, home: true, back: 0, pop: 1 }; },
  newWish() { this.wish = pick(this.slots).f; this.wishPop = 1; },
  get PH() { return Kid.portrait() ? Math.min(V.H * 0.42, 380) : Math.min(V.H * 0.62, 430); },
  get px() { return Kid.portrait() ? V.W / 2 : V.W * 0.38; },
  get floor() { return Kid.portrait() ? V.H * 0.7 : V.H * 0.92; },
  slotPos(i) {
    if (Kid.portrait()) { const w = Math.min(120, (V.W - 30) / 4); return { x: V.W / 2 + (i - 1.5) * w, y: V.H * 0.83 }; }
    return { x: V.W * 0.78 + (i % 2 - 0.5) * 140, y: V.H * 0.38 + Math.floor(i / 2) * 170 };
  },
  head() {
    const P = App.pup, A = Puppet.anchors(P), h = Puppet.toScreen(P, this.PH, A.head);
    return { x: this.px + h.x * (1 + this.fat * 0.3), y: this.floor + h.y, r: Math.max(40, A.headR * h.k) };
  },
  tap(x, y) {
    if (this.fullT) return;
    for (const s of this.slots) {
      if (Math.hypot(x - s.x, y - s.y) > 52) continue;
      s.home = false; this.drag.grab(s, x, y); Sfx.play('click'); return;
    }
  },
  eat(s) {
    const H = this.head(), wanted = s.f[0] === this.wish[0], pts = wanted ? 20 : 10;
    this.score += pts; this.ate++; this.chew = 0.9; this.happy = wanted ? 1.4 : 0.6; Sfx.play('chomp'); setTimeout(() => Sfx.play('chomp'), 220);
    FX.burst(H.x, H.y, 10, undefined, 0.5);
    FX.text(H.x, H.y - H.r - 40, wanted ? '就是這個！' : pick(['好吃！', '嗯～', '好好吃！']), wanted ? '#e0573c' : '#ff7a00', wanted ? 38 : 32);
    FX.text(H.x + 60, H.y - H.r, '+' + pts, '#3d8b2a', 26);
    if (wanted) Kid.say(`${s.f[1]}！好好吃！`);
    this.slots[s.i] = this.newFood(s.i);
    if (this.ate >= this.FULL) {
      this.fullT = 2.2; this.score += 30; Sfx.play('boing'); FX.text(V.W / 2, V.H * 0.18, '吃飽了！', '#e0573c', 52); Kid.say('吃飽了！');
    } else if (wanted || Math.random() < 0.3) this.newWish();
  },
  update(dt) {
    this.t += dt; this.chew = Math.max(0, this.chew - dt); this.happy = Math.max(0, this.happy - dt); this.wishPop = Math.max(0, this.wishPop - dt * 2);
    const want = this.fullT ? (this.fullT > 1 ? 1 : 0) : this.ate / this.FULL;
    this.fat += (want - this.fat) * Math.min(1, dt * 5);
    for (const s of this.slots) {
      s.pop = Math.max(0, s.pop - dt * 3);
      const home = this.slotPos(s.i);
      if (s.home) { s.x += (home.x - s.x) * Math.min(1, dt * 12); s.y += (home.y - s.y) * Math.min(1, dt * 12); }
      if (s.x === 0 && s.y === 0) { s.x = home.x; s.y = home.y; }
    }
    this.drag.step(s => {
      const H = this.head();
      if (Math.hypot(s.x - H.x, s.y - H.y) < H.r * 1.8 + 30) this.eat(s);
      else { s.home = true; Sfx.play('nope'); }
    });
    if (this.fullT) {
      this.fullT -= dt;
      if (this.fullT <= 0) { this.fullT = 0; this.round++; this.ate = 0; if (this.round >= this.ROUNDS) { this.over = true; return; } this.newWish(); Kid.say(`又餓了！我想吃${this.wish[1]}`); }
    }
  },
  draw(c) {
    const T = Paper.bg(c, 'orchard', 0, this.t), fy = this.floor;
    c.fillStyle = '#f2d7a6'; c.fillRect(-20, fy, V.W + 40, V.H);   // 桌布
    for (let x = -20; x < V.W + 40; x += 40) { c.fillStyle = (x / 40) % 2 ? 'rgba(233,101,75,0.35)' : 'rgba(255,255,255,0.3)'; c.fillRect(x, fy, 20, V.H); }
    Paper.rect(c, -20, fy - 6, V.W + 40, 12, '#e9654b', 4, { blur: 4 });
    // 紙片人：吃東西時頭一扁一扁、越吃越胖
    const P = Puppet.Poses, ch = this.chew ? Math.sin(this.chew * 28) : 0;
    let pose = this.fullT ? P.cheer(this.t) : this.happy > 0.8 ? P.cheer(this.t) : this.drag.obj ? { aL: 1.3, aR: 1.3, aLf: 0.8, aRf: 0.8, head: 0.1 * Math.sin(this.t * 8) } : P.idle(this.t);
    pose = Object.assign({}, pose, { sx: (pose.sx || 1) * (1 + this.fat * 0.3), hsy: 1 - Math.max(0, ch) * 0.12, hsx: 1 + Math.max(0, ch) * 0.06 });
    c.fillStyle = 'rgba(60,40,10,0.2)'; c.beginPath(); c.ellipse(this.px, fy + 2, 60 + this.fat * 20, 12, 0, 0, Math.PI * 2); c.fill();
    Puppet.draw(c, App.pup, this.px, fy, this.PH, pose);
    // 想吃的東西（泡泡）
    if (!this.fullT) {
      const H = this.head(), bx = Math.min(V.W - 56, H.x + H.r + 70), by = Math.max(150, H.y - H.r - 30), s = 1 + this.wishPop * 0.3 + Math.sin(this.t * 3) * 0.03;
      Paper.circle(c, H.x + H.r * 0.9, H.y - H.r * 0.6, 7, '#fffdf5', { border: 0 }); Paper.circle(c, H.x + H.r + 25, H.y - H.r * 0.9, 12, '#fffdf5', { border: 0 });
      c.save(); c.translate(bx, by); c.scale(s, s); Paper.circle(c, 0, 0, 46, '#fffdf5', { border: 0, blur: 10 }); Kid.emoji(c, this.wish[0], 0, 0, 52); c.restore();
    }
    // 盤子 + 食物
    for (let i = 0; i < 4; i++) { const p = this.slotPos(i); c.fillStyle = 'rgba(60,40,10,0.15)'; c.beginPath(); c.ellipse(p.x, p.y + 30, 52, 14, 0, 0, Math.PI * 2); c.fill(); Paper.shape(c, c => c.ellipse(p.x, p.y + 22, 50, 16, 0, 0, Math.PI * 2), '#ffffff', { border: 3 }); }
    for (const s of this.slots) if (s !== this.drag.obj) Kid.emoji(c, s.f[0], s.x, s.y, 66 * (1 + s.pop * 0.3));
    if (this.drag.obj) { const s = this.drag.obj; Kid.emoji(c, s.f[0], s.x, s.y, 78, Math.sin(this.t * 10) * 0.1); }
    // 飽了的進度
    const w = 220, x0 = V.W / 2 - w / 2, y0 = Kid.portrait() ? 112 : 80;
    Paper.rect(c, x0, y0, w, 22, '#fffdf5', 11, { border: 3 });
    Paper.rect(c, x0 + 3, y0 + 3, Math.max(16, (w - 6) * Math.min(1, this.fullT ? 1 : this.ate / this.FULL)), 16, '#ff9a4a', 8, { border: 0, shadow: false });
    Kid.emoji(c, '😋', x0 - 22, y0 + 11, 30);
  },
  hud() { return { L: `<b>${this.score}</b> 分`, R: `第 ${Math.min(this.round + 1, this.ROUNDS)} / ${this.ROUNDS} 餐` }; },
});
