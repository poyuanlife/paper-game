'use strict';
// 打鼓學節奏：紙片人先打一段，換你照著打一樣的。打對了下一段會更長。10 回合，打錯可以再聽一次。
registerGame({
  id: 'drum', name: '打鼓學節奏', icon: '🥁', color: '#d9643a', kid: true,
  desc: '紙片人先打鼓，你照著打一樣的！',
  howto: '先看紙片人打哪幾個鼓，等「換你了！」再照順序打一樣的。打對了下一段會變長。打錯沒關係，會再示範一次。一共 10 回合。',
  DRUMS: [['🐶', '#e8453c', 200], ['🐱', '#3fa9e0', 300], ['🐸', '#45ad4a', 400], ['🐥', '#ffcc1f', 520]],
  N: 10,

  start() { this.t = 0; this.score = 0; this.over = false; this.overText = '節奏小高手！'; this.round = 0; this.seq = []; this.hit = [0, 0, 0, 0]; this.cheer = 0; this.newRound(true); },
  onEnter(prev) { if (prev === 'ready') { this.st = 'wait'; this.stT = 0.6; } },
  newRound(first) {
    const len = Math.min(6, 2 + Math.floor(this.round / 2));
    if (first || this.seq.length !== len) { this.seq = []; for (let i = 0; i < len; i++) this.seq.push(Math.floor(Math.random() * 4)); }
    this.st = 'wait'; this.stT = first ? 99 : 0.9; this.pos = 0; this.demoI = 0;
  },
  drumPos(i) {
    const P = Kid.portrait(), r = P ? Math.min(V.W * 0.21, 120) : Math.min(V.H * 0.14, 95, V.W * 0.07);
    const cx = V.W / 2 + (i % 2 ? 1 : -1) * r * 1.25 * (P ? 1 : 1.6), cy = (P ? V.H * 0.6 : V.H * 0.58) + (i < 2 ? -1 : 1) * r * 1.15;
    return P ? { x: cx, y: cy, r } : { x: V.W / 2 + (i - 1.5) * r * 2.5, y: V.H * 0.68, r };
  },
  bang(i) { this.hit[i] = 1; Sfx.drum(this.DRUMS[i][2]); const p = this.drumPos(i); FX.burst(p.x, p.y - p.r * 0.3, 5, [this.DRUMS[i][1], '#fff'], 0.4); },
  tap(x, y) {
    for (let i = 0; i < 4; i++) {
      const p = this.drumPos(i); if (Math.hypot(x - p.x, (y - p.y) * 1.3) > p.r * 1.05) continue;
      this.bang(i);
      if (this.st !== 'you') return;
      if (i === this.seq[this.pos]) {
        this.pos++;
        if (this.pos >= this.seq.length) {
          const pts = this.seq.length * 10; this.score += pts; this.cheer = 1.5; this.st = 'good'; this.stT = 1.4; Sfx.play('ding');
          FX.text(V.W / 2, V.H * 0.3, pick(['打對了！', '好棒！', '一模一樣！']), '#e0573c', 44); Kid.say('打對了！');
        }
      } else { this.st = 'oops'; this.stT = 1.2; Sfx.play('nope'); Kid.say('再聽一次喔'); FX.text(V.W / 2, V.H * 0.3, '再聽一次～', '#7a62b8', 36); }
      return;
    }
  },
  key(k) { const i = ['1', '2', '3', '4'].indexOf(k); if (i >= 0) { const p = this.drumPos(i); this.tap(p.x, p.y); } },
  update(dt) {
    this.t += dt; this.cheer = Math.max(0, this.cheer - dt);
    for (let i = 0; i < 4; i++) this.hit[i] = Math.max(0, this.hit[i] - dt * 4);
    this.stT -= dt;
    if (this.st === 'wait' && this.stT <= 0) { this.st = 'demo'; this.demoI = 0; this.stT = 0.3; Kid.say('仔細聽'); }
    else if (this.st === 'demo' && this.stT <= 0) {
      if (this.demoI < this.seq.length) { this.bang(this.seq[this.demoI]); this.demoI++; this.stT = 0.6; }
      else { this.st = 'you'; this.pos = 0; Kid.say('換你了！'); }
    } else if (this.st === 'good' && this.stT <= 0) { this.round++; if (this.round >= this.N) { this.over = true; return; } this.newRound(); }
    else if (this.st === 'oops' && this.stT <= 0) { this.st = 'wait'; this.stT = 0.2; this.pos = 0; }
  },
  draw(c) {
    const gy = Kid.ground(c, 'orchard', this.t, 0.97), P = Kid.portrait();
    // 紙片人：示範的時候跟著打鼓
    const demo = this.st === 'demo', pose = this.cheer ? Puppet.Poses.cheer(this.t) : demo ? { aL: 1.4 + Math.sin(this.t * 14) * 0.6, aR: 1.4 - Math.sin(this.t * 14) * 0.6, aLf: 1, aRf: 1 } : Puppet.Poses.idle(this.t);
    const ph = P ? Math.min(V.H * 0.24, 230) : Math.min(V.H * 0.32, 230), top = this.drumPos(0).y - this.drumPos(0).r * 1.2;
    if (P) Puppet.draw(c, App.pup, V.W / 2, top - 10, ph, pose); else Puppet.draw(c, App.pup, V.W * 0.1, gy, Math.min(V.H * 0.45, 300), pose);
    const msg = this.st === 'demo' || this.st === 'wait' ? '👂 仔細聽…' : this.st === 'you' ? '👆 換你了！' : '';
    if (msg) Kid.text(c, msg, V.W / 2, P ? 125 : 90, 36, this.st === 'you' ? '#e0573c' : '#4a3520');
    // 進度點
    if (this.st === 'you') for (let i = 0; i < this.seq.length; i++) Paper.circle(c, V.W / 2 + (i - (this.seq.length - 1) / 2) * 30, P ? 170 : 130, 9, i < this.pos ? '#ff7a00' : '#fffdf5', { border: 3, blur: 2 });
    for (let i = 0; i < 4; i++) {
      const p = this.drumPos(i), d = this.DRUMS[i], h = this.hit[i], sq = 1 - h * 0.08;
      Paper.shape(c, cc => { cc.ellipse(p.x, p.y + p.r * 0.35, p.r, p.r * 0.45, 0, 0, Math.PI); cc.lineTo(p.x - p.r, p.y); cc.closePath(); }, d[1], { border: 5 });
      Paper.rect(c, p.x - p.r, p.y - 2, p.r * 2, p.r * 0.38, d[1], 4, { border: 0, shadow: false });
      Paper.shape(c, cc => cc.ellipse(p.x, p.y, p.r * sq, p.r * 0.42 * sq, 0, 0, Math.PI * 2), h ? '#fff6c8' : '#fffdf5', { border: 5 });
      Kid.emoji(c, d[0], p.x, p.y - h * 14, p.r * 0.55);
    }
  },
  hud() { return { L: `<b>${this.score}</b> 分`, R: `第 ${Math.min(this.round + 1, this.N)} / ${this.N} 回合` }; },
});
