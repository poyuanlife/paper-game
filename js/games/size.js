'use strict';
// 比大小：照「從小到大」（或「從大到小」）的順序點。8 題，不限時間。
registerGame({
  id: 'size', name: '比大小', icon: '🐘', color: '#7a8cc9', kid: true,
  desc: '從小點到大，誰是最大的呢？',
  howto: '照題目說的順序點：「從小到大」就先點最小的，「從大到小」就先點最大的。點錯會告訴你喔。一共 8 題，不限時間。',
  ITEMS: ['🐘', '🍎', '🐟', '⭐', '🎈', '🐻', '🌸', '🚗', '🐢', '🍉'],
  N: 8,

  start() { this.t = 0; this.score = 0; this.over = false; this.overText = '大小分得好清楚！'; this.q = 0; this.cheer = 0; this.newQ(); },
  onEnter(prev) { if (prev === 'ready') Kid.say(this.up ? '從小點到大' : '從大點到小'); },
  newQ() {
    const n = this.q < 3 ? 3 : this.q < 6 ? 4 : 5; this.up = this.q % 2 === 0; this.item = pick(this.ITEMS); this.next = 0; this.doneT = 0; this.miss = 0;
    const sizes = Kid.shuffle([0.42, 0.58, 0.74, 0.9, 1.06].slice(0, n).map((s, i) => ({ s, rank: i })));
    this.things = sizes.map((o, i) => ({ ...o, slot: i, got: 0, shake: 0, pop: 0, rot: rand(-0.15, 0.15) }));
    this.order = this.things.slice().sort((a, b) => this.up ? a.s - b.s : b.s - a.s);
    if (this.q) Kid.say(this.up ? '從小點到大' : '從大點到小');
  },
  pos(t) {
    const P = Kid.portrait(), n = this.things.length, cell = P ? Math.min(150, V.H * 0.68 / n) : Math.min(210, (V.W * 0.8) / n);
    if (P) { const col = t.slot % 2, row = Math.floor(t.slot / 2), rows = Math.ceil(n / 2), cw = Math.min(V.W / 2 - 20, 230), ch = V.H * 0.66 / rows; return { x: V.W / 2 + (col - 0.5) * cw + (n % 2 && t.slot === n - 1 ? cw / 2 : 0), y: V.H * 0.2 + ch * (row + 0.5), cell: Math.min(cw, ch) }; }
    return { x: V.W / 2 + (t.slot - (n - 1) / 2) * cell, y: V.H * 0.55, cell };
  },
  tap(x, y) {
    if (this.doneT) return;
    for (const t of this.things) {
      const p = this.pos(t), r = p.cell * t.s * 0.45 + 20; if (t.got || Math.hypot(x - p.x, y - p.y) > r) continue;
      if (t === this.order[this.next]) {
        t.got = ++this.next; t.pop = 1; this.score += 5; Sfx.note(330 * Math.pow(2, this.next * 3 / 12), 0.3);
        if (this.next >= this.things.length) {
          this.doneT = 1.6; this.score += this.miss ? 10 : 20; this.cheer = 1.5; Sfx.play('ding'); FX.burst(V.W / 2, V.H * 0.5, 26, undefined, 0.9);
          FX.text(V.W / 2, V.H * 0.18, '排好了！', '#e0573c', 44); Kid.say('答對了！');
        }
      } else {
        t.shake = 0.5; this.miss++; Sfx.play('nope');
        const want = this.order[this.next]; Kid.say(this.up ? (t.s > want.s ? '這個比較大喔' : '還有更小的喔') : (t.s < want.s ? '這個比較小喔' : '還有更大的喔'));
      }
      return;
    }
  },
  update(dt) {
    this.t += dt; this.cheer = Math.max(0, this.cheer - dt);
    for (const t of this.things) { t.shake = Math.max(0, t.shake - dt); t.pop = Math.max(0, t.pop - dt * 3); }
    if (this.doneT) { this.doneT -= dt; if (this.doneT <= 0) { if (this.q + 1 >= this.N) { this.over = true; return; } this.q++; this.newQ(); } }
  },
  draw(c) {
    const gy = Kid.ground(c, 'meadow', this.t, 0.96), P = Kid.portrait();
    Paper.rect(c, V.W / 2 - 170, (P ? 110 : 80) - 34, 340, 68, '#fffdf5', 34, { border: 4 });
    Kid.text(c, this.up ? '從小 ➜ 到大' : '從大 ➜ 到小', V.W / 2, P ? 112 : 82, 34, this.up ? '#3f6fe0' : '#e0573c', 0);
    for (const t of this.things) {
      const p = this.pos(t), s = p.cell * t.s * 0.82 * (1 + t.pop * 0.2), sh = Math.sin(t.shake * 40) * t.shake * 16;
      Kid.emoji(c, this.item, p.x + sh, p.y, s, t.rot);
      if (t.got) { Paper.circle(c, p.x + s * 0.4, p.y - s * 0.4, 18, '#ff7a00', { border: 3, blur: 3 }); Kid.text(c, String(t.got), p.x + s * 0.4, p.y - s * 0.4 + 1, 20, '#fff', 0); }
    }
    if (!P) Puppet.draw(c, App.pup, 110, gy, Math.min(V.H * 0.35, 230), this.cheer ? Puppet.Poses.cheer(this.t) : Puppet.Poses.idle(this.t));
  },
  hud() { return { L: `<b>${this.score}</b> 分`, R: `第 ${this.q + 1} / ${this.N} 題` }; },
});
