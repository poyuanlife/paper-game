'use strict';
// 收玩具：把東西拖到對的箱子裡（水果放籃子、玩具放玩具箱、衣服放衣櫃）。學分類。2 關，不限時間。
registerGame({
  id: 'sort', name: '收拾整理', icon: '🧺', color: '#c98a4b', kid: true,
  desc: '水果、玩具、衣服，各放到對的地方！',
  howto: '把中間的東西拖到對的箱子裡：水果放水果籃、玩具放玩具箱、衣服放衣櫃。放錯會跳回來，再試一次就好。一共 2 關，不限時間。',
  CATS: [
    { name: '水果', box: '水果籃', col: '#e9654b', icon: '🧺', items: ['🍎', '🍌', '🍇', '🍓', '🍉', '🍊', '🍒', '🍐', '🍑', '🍍'] },
    { name: '玩具', box: '玩具箱', col: '#3f8fe0', icon: '🧸', items: ['🧸', '⚽', '🎈', '🎲', '🚂', '🏀', '🤖', '🎨'] },
    { name: '衣服', box: '衣櫃', col: '#9b5bd6', icon: '👕', items: ['👕', '👖', '👗', '🧦', '🧢', '👟', '🧣', '👒', '🧤'] },
  ],
  LEVELS: [[2, 6], [3, 9]],

  start() { this.t = 0; this.score = 0; this.over = false; this.overText = '收得好整齊！'; this.level = 0; this.cheer = 0; this.drag = Kid.makeDrag(); this.newLevel(); },
  onEnter(prev) { if (prev === 'ready') Kid.say('幫忙把東西收好'); },
  newLevel() {
    const [nc, ni] = this.LEVELS[this.level]; this.cats = this.CATS.slice(0, nc).map((c, i) => ({ ...c, i, pop: 0, got: 0 }));
    const mix = this.cats.map(c => Kid.shuffle(c.items.slice())), pool = [];
    for (let k = 0; k < ni; k++) { const c = this.cats[k % nc]; pool.push({ cat: c.i, e: mix[c.i][Math.floor(k / nc)] }); }
    this.queue = Kid.shuffle(pool); this.cur = null; this.doneT = 0; this.nextItem();
  },
  nextItem() { const it = this.queue.shift(); this.cur = it ? { ...it, x: this.home.x, y: this.home.y, home: true, pop: 1, shake: 0 } : null; },
  get home() { return { x: V.W / 2, y: Kid.portrait() ? V.H * 0.38 : V.H * 0.36 }; },
  boxPos(i) {
    const n = this.cats.length, P = Kid.portrait(), w = Math.min(P ? (V.W - 30) / n - 10 : 230, 230);
    return { x: V.W / 2 + (i - (n - 1) / 2) * (w + 14), y: P ? V.H * 0.76 : V.H * 0.76, w, h: w * 0.8 };
  },
  tap(x, y) { const c = this.cur; if (c && !this.doneT && Math.hypot(x - c.x, y - c.y) < 70) { c.home = false; this.drag.grab(c, x, y); Sfx.play('click'); } },
  update(dt) {
    this.t += dt; this.cheer = Math.max(0, this.cheer - dt);
    for (const b of this.cats) b.pop = Math.max(0, b.pop - dt * 2.5);
    const c = this.cur;
    if (c) { c.pop = Math.max(0, c.pop - dt * 3); c.shake = Math.max(0, c.shake - dt); if (c.home) { const h = this.home; c.x += (h.x - c.x) * Math.min(1, dt * 10); c.y += (h.y - c.y) * Math.min(1, dt * 10); } }
    this.drag.step(it => {
      const b = this.cats.find(b => { const p = this.boxPos(b.i); return Math.abs(it.x - p.x) < p.w / 2 + 20 && Math.abs(it.y - p.y) < p.h / 2 + 50; });
      if (b && b.i === it.cat) {
        b.pop = 1; b.got++; this.score += 10; this.cheer = 0.8; Sfx.play('snap'); Sfx.play('ding');
        const p = this.boxPos(b.i); FX.burst(p.x, p.y - p.h * 0.3, 12, [b.col, '#fff'], 0.6); FX.text(p.x, p.y - p.h * 0.9, `是${b.name}！`, b.col, 30);
        this.nextItem();
        if (!this.cur) { this.doneT = 2; this.score += 30; this.cheer = 2; Sfx.play('win'); FX.text(V.W / 2, V.H * 0.35, '全部收好了！', '#e0573c', 46); Kid.say('全部收好了！好棒！'); }
      } else {
        it.home = true; it.shake = 0.5; Sfx.play('nope');
        if (b) { const right = this.cats[it.cat]; Kid.say(`這是${right.name}，要放${right.box}`); }
      }
    });
    if (this.doneT) { this.doneT -= dt; if (this.doneT <= 0) { if (this.level + 1 >= this.LEVELS.length) { this.over = true; return; } this.level++; this.newLevel(); } }
  },
  draw(c) {
    const gy = Kid.ground(c, 'orchard', this.t, 0.97);
    c.fillStyle = '#f0dcb4'; c.fillRect(-20, V.H * 0.6, V.W + 40, V.H * 0.4);   // 地板
    for (const b of this.cats) {
      const p = this.boxPos(b.i), s = 1 + b.pop * 0.1;
      c.save(); c.translate(p.x, p.y); c.scale(s, s);
      Paper.rect(c, -p.w / 2, -p.h / 2, p.w, p.h, b.col, 16, { border: 5 });
      c.fillStyle = 'rgba(255,255,255,0.18)'; c.fillRect(-p.w / 2 + 10, -p.h / 2 + 10, p.w - 20, p.h * 0.25);
      Kid.emoji(c, b.icon, 0, -p.h * 0.05, p.h * 0.42);
      Kid.text(c, b.box, 0, p.h * 0.32, Math.min(26, p.w * 0.16), '#fff', 0);
      c.restore();
    }
    const P = Puppet.Poses;
    if (!Kid.portrait()) Puppet.draw(c, App.pup, 110, gy, Math.min(V.H * 0.42, 280), this.cheer ? P.cheer(this.t) : P.idle(this.t));
    const it = this.cur;
    if (it) {
      if (it.home && !this.drag.obj) { c.fillStyle = 'rgba(60,40,10,0.15)'; c.beginPath(); c.ellipse(it.x, it.y + 60, 50, 12, 0, 0, Math.PI * 2); c.fill(); }
      Kid.emoji(c, it.e, it.x + Math.sin(it.shake * 40) * it.shake * 20, it.y + (it.home ? Math.sin(this.t * 3) * 6 : 0), (this.drag.obj ? 100 : 92) * (1 + it.pop * 0.3));
      if (this.t < 4 && it.home) Kid.text(c, '👆 拖到對的箱子裡', V.W / 2, it.y - 90, 28, '#a8574a');
    }
  },
  hud() { return { L: `<b>${this.score}</b> 分`, R: `第 ${this.level + 1} / 2 關　剩 ${this.queue.length + (this.cur ? 1 : 0)} 個` }; },
});
