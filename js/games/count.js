'use strict';
// 數數看：畫面上有幾個東西？點東西會幫你數（念出來），再點下面的數字。10 題，不限時間。
registerGame({
  id: 'count', name: '數數看', icon: '🔢', color: '#2fa58c', kid: true,
  desc: '數一數有幾個，再點正確的數字！',
  howto: '數一數上面有幾個東西，再點下面正確的數字。不會數的話，點一下東西，會幫你一個一個數出來喔！一共 10 題，不限時間。',
  ITEMS: ['🍎', '🍌', '🐟', '🐥', '⭐', '🚗', '🍓', '🐞', '🌸', '🍪', '🎈', '🐶'],
  ZH: ['零', '一', '二', '三', '四', '五', '六', '七', '八', '九', '十'],
  N: 10,

  start() { this.t = 0; this.score = 0; this.over = false; this.overText = '數數好厲害！'; this.q = 0; this.cheer = 0; this.newQ(); },
  onEnter(prev) { if (prev === 'ready') Kid.say(`有幾個${this.unit()}？`); },
  unit() { return { '🍎': '蘋果', '🍌': '香蕉', '🐟': '魚', '🐥': '小雞', '⭐': '星星', '🚗': '車子', '🍓': '草莓', '🐞': '瓢蟲', '🌸': '花', '🍪': '餅乾', '🎈': '氣球', '🐶': '小狗' }[this.item]; },
  newQ() {
    const max = this.q < 4 ? 5 : this.q < 7 ? 8 : 10, n = 1 + Math.floor(Math.random() * max);
    this.n = n; this.item = pick(this.ITEMS); this.counted = 0; this.tries = 0; this.doneT = 0;
    // 東西放在格子裡，稍微歪一點
    const cols = n <= 4 ? n : n <= 6 ? 3 : n <= 8 ? 4 : 5, slots = Kid.shuffle([...Array(cols * Math.ceil(n / cols)).keys()]).slice(0, n).sort((a, b) => a - b);
    this.things = slots.map(s => ({ col: s % cols, row: Math.floor(s / cols), jx: rand(-0.12, 0.12), jy: rand(-0.12, 0.12), rot: rand(-0.25, 0.25), num: 0, pop: 0 }));
    this.cols = cols; this.rows = Math.ceil(n / cols);
    const opts = new Set([n]); while (opts.size < 3) { const o = clamp(n + pick([-2, -1, 1, 2, 3]), 1, 10); opts.add(o); }
    this.opts = Kid.shuffle([...opts]).map(v => ({ v, shake: 0, pop: 0, off: false }));
    if (this.q > 0) Kid.say(`有幾個${this.unit()}？`);
  },
  // 版面：上面是東西，下面三個數字按鈕
  area() {
    const P = Kid.portrait(), x = P ? 20 : V.W * 0.28, w = P ? V.W - 40 : V.W * 0.62, y = V.H * 0.13, h = P ? V.H * 0.5 : V.H * 0.52;
    const cell = Math.min(w / this.cols, h / this.rows, 150), gx = x + (w - cell * this.cols) / 2, gy = y + (h - cell * this.rows) / 2;
    const bw = Math.min(150, w / 3 - 20), bh = Math.min(110, bw * 0.8), by = y + h + (P ? 30 : 20) + bh / 2;
    return { box: { x: x + w / 2, y: y + h / 2, w: w + 20, h: h + 20 }, cell, pos: t => ({ x: gx + cell * (t.col + 0.5 + t.jx), y: gy + cell * (t.row + 0.5 + t.jy) }),
      btn: i => ({ x: x + w / 2 + (i - 1) * (bw + 26), y: by, w: bw, h: bh }) };
  },
  tap(x, y) {
    if (this.doneT) return;
    const A = this.area();
    for (let i = 0; i < 3; i++) {
      const o = this.opts[i]; if (!Kid.hit(A.btn(i), x, y) || o.off) continue;
      if (o.v === this.n) {
        o.pop = 1; const pts = this.tries === 0 ? 15 : 10; this.score += pts; this.cheer = 1.5; this.doneT = 1.6;
        Sfx.play('ding'); FX.burst(A.btn(i).x, A.btn(i).y, 22, undefined, 0.9); FX.text(A.btn(i).x, A.btn(i).y - 80, '答對了！', '#ff7a00', 40);
        Kid.say(`答對了！${this.ZH[this.n]}個${this.unit()}！`);
        this.things.forEach((t, k) => { t.num = k + 1; t.pop = 1; });
      } else { o.shake = 0.5; o.off = true; this.tries++; Sfx.play('nope'); Kid.say('再數一次看看'); }
      return;
    }
    // 點東西：一個一個數
    for (const t of this.things) {
      const p = A.pos(t); if (Math.hypot(x - p.x, y - p.y) > A.cell * 0.5) continue;
      if (!t.num) { t.num = ++this.counted; Sfx.note(392 * Math.pow(2, (t.num - 1) / 12 * 2), 0.25); Kid.say(this.ZH[t.num]); }
      t.pop = 1; return;
    }
  },
  update(dt) {
    this.t += dt; this.cheer = Math.max(0, this.cheer - dt);
    for (const t of this.things) t.pop = Math.max(0, t.pop - dt * 3);
    for (const o of this.opts) { o.shake = Math.max(0, o.shake - dt); o.pop = Math.max(0, o.pop - dt * 2); }
    if (this.doneT) { this.doneT -= dt; if (this.doneT <= 0) { this.doneT = 0; this.q++; if (this.q >= this.N) { this.over = true; return; } this.newQ(); } }
  },
  draw(c) {
    const gy = Kid.ground(c, 'meadow', this.t, 0.95), A = this.area(), b = A.box;
    Paper.rect(c, b.x - b.w / 2, b.y - b.h / 2, b.w, b.h, '#fffdf5', 24, { border: 6 });
    for (const t of this.things) {
      const p = A.pos(t), s = A.cell * 0.62 * (1 + t.pop * 0.25);
      Kid.emoji(c, this.item, p.x, p.y, s, t.rot);
      if (t.num) { Paper.circle(c, p.x + A.cell * 0.3, p.y - A.cell * 0.3, Math.max(13, A.cell * 0.15), '#ff7a00', { border: 3, blur: 3 }); Kid.text(c, t.num, p.x + A.cell * 0.3, p.y - A.cell * 0.3 + 1, Math.max(16, A.cell * 0.18), '#fff', 0); }
    }
    const cols = ['#e8453c', '#3f8fe0', '#9b5bd6'];
    this.opts.forEach((o, i) => Kid.button(c, A.btn(i), String(o.v), cols[i], { pop: o.pop, shake: o.shake, alpha: o.off ? 0.35 : 1, size: A.btn(i).h * 0.62 }));
    const P = Puppet.Poses;
    if (!Kid.portrait()) Puppet.draw(c, App.pup, V.W * 0.13, gy, Math.min(V.H * 0.5, 320), this.cheer ? P.cheer(this.t) : P.idle(this.t));
    else if (V.H > 900) Puppet.draw(c, App.pup, V.W / 2, gy, Math.min(V.H * 0.2, 200), this.cheer ? P.cheer(this.t) : P.idle(this.t));
  },
  hud() { return { L: `<b>${this.score}</b> 分`, R: `第 ${Math.min(this.q + 1, this.N)} / ${this.N} 題` }; },
});
