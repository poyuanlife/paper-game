'use strict';
// 找動物：聽題目（「汪汪！是誰在叫？」或「小貓在哪裡？」），點對的動物。12 題，不限時間。
registerGame({
  id: 'animals', name: '誰在叫？', icon: '🐮', color: '#a8774a', kid: true,
  desc: '汪汪？喵喵？找出是哪一隻動物！',
  howto: '聽題目，點出正確的動物！有時候問「小貓在哪裡？」，有時候問「汪汪！是誰在叫？」。點錯會告訴你那是什麼動物。一共 12 題。',
  ANIMALS: [['🐶', '小狗', '汪汪'], ['🐱', '小貓', '喵喵'], ['🐮', '牛', '哞～'], ['🐷', '小豬', '齁齁'], ['🐑', '綿羊', '咩～'], ['🦆', '鴨子', '呱呱'],
    ['🐔', '公雞', '咕咕咕'], ['🐸', '青蛙', '呱呱呱'], ['🦁', '獅子', '吼～'], ['🐭', '老鼠', '吱吱'], ['🐴', '馬', '嘶～'], ['🐵', '猴子', '吱吱吱'], ['🐝', '蜜蜂', '嗡嗡'], ['🐍', '蛇', '嘶嘶嘶']],
  N: 12,

  start() { this.t = 0; this.score = 0; this.over = false; this.overText = '動物好朋友！'; this.q = 0; this.cheer = 0; this.newQ(); },
  onEnter(prev) { if (prev === 'ready') this.ask(); },
  newQ() {
    const n = this.q < 4 ? 3 : this.q < 8 ? 4 : 6;
    // 叫聲一樣（呱呱、吱吱）的不要放在同一題
    let set; do set = Kid.shuffle(this.ANIMALS.slice()).slice(0, n); while (new Set(set.map(a => a[2].replace(/(.)+/g, '$1'))).size < n);
    this.opts = set.map((a, i) => ({ a, i, shake: 0, pop: 0, off: false })); this.ans = pick(set); this.bySound = this.q % 2 === 1; this.doneT = 0; this.tries = 0;
    if (this.q) this.ask();
  },
  prompt() { return this.bySound ? `${this.ans[2]}！是誰在叫？` : `${this.ans[1]}在哪裡？`; },
  ask() { Kid.say(this.prompt()); },
  pos(o) {
    const n = this.opts.length, P = Kid.portrait(), cols = P ? (n <= 3 ? 1 : 2) : Math.min(n, n === 4 ? 4 : 3), rows = Math.ceil(n / cols);
    const top = P ? V.H * 0.22 : V.H * 0.24, h = V.H * (P ? 0.72 : 0.7), cw = (P ? V.W - 30 : V.W * 0.8) / cols, ch = h / rows;
    const c = o.i % cols, r = Math.floor(o.i / cols);
    return { x: V.W / 2 + (c - (cols - 1) / 2) * cw, y: top + ch * (r + 0.5), s: Math.min(cw, ch) * 0.78 };
  },
  tap(x, y) {
    const P = Kid.portrait(), by = P ? 120 : 92;
    if (Math.abs(y - by) < 40 && Math.abs(x - V.W / 2) < 230) { this.ask(); return; }   // 點題目再聽一次
    if (this.doneT) return;
    for (const o of this.opts) {
      const p = this.pos(o); if (o.off || Math.abs(x - p.x) > p.s / 2 || Math.abs(y - p.y) > p.s / 2) continue;
      if (o.a === this.ans) {
        o.pop = 1; this.score += this.tries ? 5 : 10; this.cheer = 1.4; this.doneT = 1.5; Sfx.play('ding');
        FX.burst(p.x, p.y, 20, undefined, 0.8); FX.text(p.x, p.y - p.s * 0.6, this.ans[2], '#e0573c', 40); Kid.say(`對！是${this.ans[1]}，${this.ans[2]}`);
      } else { o.shake = 0.5; o.off = true; this.tries++; Sfx.play('nope'); Kid.say(`這是${o.a[1]}，${o.a[2]}`); FX.text(p.x, p.y - p.s * 0.5, o.a[2], '#7a62b8', 30); }
      return;
    }
  },
  update(dt) {
    this.t += dt; this.cheer = Math.max(0, this.cheer - dt);
    for (const o of this.opts) { o.shake = Math.max(0, o.shake - dt); o.pop = Math.max(0, o.pop - dt * 1.5); }
    if (this.doneT) { this.doneT -= dt; if (this.doneT <= 0) { if (this.q + 1 >= this.N) { this.over = true; return; } this.q++; this.newQ(); } }
  },
  draw(c) {
    Kid.ground(c, 'meadow', this.t, 0.97);
    const P = Kid.portrait(), by = P ? 120 : 92;
    Paper.rect(c, V.W / 2 - 220, by - 36, 440, 72, '#fffdf5', 36, { border: 4 });
    Kid.text(c, '🔊 ' + this.prompt(), V.W / 2, by + 2, 30, '#a8574a', 0);
    for (const o of this.opts) {
      const p = this.pos(o), s = p.s, sh = Math.sin(o.shake * 40) * o.shake * 16, j = o.pop ? Math.abs(Math.sin(o.pop * 12)) * 20 : 0;
      c.globalAlpha = o.off ? 0.45 : 1;
      Paper.rect(c, p.x - s / 2 + sh, p.y - s / 2, s, s, o.pop ? '#fff1b8' : '#fffdf5', 24, { border: 5 });
      Kid.emoji(c, o.a[0], p.x + sh, p.y - j, s * 0.62, o.pop ? Math.sin(this.t * 20) * 0.15 : 0);
      c.globalAlpha = 1;
    }
  },
  hud() { return { L: `<b>${this.score}</b> 分`, R: `第 ${this.q + 1} / ${this.N} 題` }; },
});
