'use strict';
// 孵蛋：一直點蛋，蛋會裂開，跑出可愛的動物。金色的蛋會跑出特別的動物！40 秒。
registerGame({
  id: 'eggs', name: '孵蛋蛋', icon: '🐣', color: '#f2b33d', kid: true,
  desc: '點點蛋蛋，看看會孵出什麼動物！',
  howto: '一直點蛋，蛋就會裂開，孵出可愛的動物！每顆蛋要點的次數不一樣。金色的蛋會孵出特別的動物喔。限時 40 秒。',
  TIME: 40,
  BABIES: [['🐥', '小雞'], ['🐢', '小烏龜'], ['🦖', '小恐龍'], ['🐍', '小蛇'], ['🐊', '小鱷魚'], ['🦕', '長脖子恐龍'], ['🐧', '企鵝'], ['🦆', '小鴨'], ['🦜', '鸚鵡'], ['🦉', '貓頭鷹']],
  SPECIAL: [['🦄', '獨角獸'], ['🐉', '小龍']],
  PAT: ['#ffd6e0', '#cfe9ff', '#d8f5c8', '#fff1b8', '#e6d8ff'],

  start() { this.t = 0; this.left = this.TIME; this.score = 0; this.over = false; this.overText = '孵出好多寶寶！'; this.cheer = 0; this.hatched = 0; this.eggs = null; this.n = 0; },
  layout() {
    const n = Kid.portrait() ? 3 : 5; if (this.n === n) return;
    this.n = n; this.eggs = Array.from({ length: n }, (_, i) => this.newEgg(i));
  },
  newEgg(i) {
    const gold = Math.random() < 0.12, b = gold ? pick(this.SPECIAL) : pick(this.BABIES);
    return { i, need: gold ? 8 : 3 + Math.floor(Math.random() * 4), taps: 0, gold, baby: b, col: pick(this.PAT), shake: 0, out: 0, born: 0, cracks: [] };
  },
  pos(i) { const P = Kid.portrait(), a = P ? 90 : V.W * 0.28, b = P ? V.W - 90 : V.W * 0.9; return { x: a + (b - a) * (this.n === 1 ? 0.5 : i / (this.n - 1)), y: P ? V.H * 0.62 : V.H * 0.66 }; },
  get R() { return Kid.portrait() ? Math.min(70, V.W * 0.13) : 72; },
  tap(x, y) {
    this.layout();
    for (const e of this.eggs) {
      const p = this.pos(e.i); if (Math.hypot(x - p.x, (y - p.y) * 0.8) > this.R * 1.3 || e.born) continue;
      e.taps++; e.shake = 0.35;
      e.cracks.push({ a: rand(-1, 1), y: rand(-0.4, 0.2), len: rand(0.3, 0.6) });
      if (e.taps >= e.need) {
        e.born = 1; this.hatched++; const pts = e.gold ? 30 : 10; this.score += pts; this.cheer = 1.3; Sfx.play('hatch');
        FX.burst(p.x, p.y - 20, e.gold ? 30 : 16, e.gold ? ['#ffd23f', '#fff6c8', '#ff9a4a'] : undefined, 0.8);
        FX.text(p.x, p.y - this.R * 2.2, `+${pts}`, '#3d8b2a', 30); Kid.say(`是${e.baby[1]}！`);
      } else Sfx.play('crack');
      return;
    }
  },
  update(dt) {
    this.layout();
    this.t += dt; this.left -= dt; this.cheer = Math.max(0, this.cheer - dt);
    if (this.left <= 0) { this.left = 0; this.over = true; return; }
    for (const e of this.eggs) {
      e.shake = Math.max(0, e.shake - dt);
      if (e.born) { e.out += dt; if (e.out > 1.8) this.eggs[e.i] = this.newEgg(e.i); }
    }
  },
  drawEgg(c, e) {
    const p = this.pos(e.i), R = this.R, wob = Math.sin(e.shake * 40) * e.shake * 0.5;
    // 草窩
    Paper.shape(c, cc => cc.ellipse(p.x, p.y + R * 1.05, R * 1.25, R * 0.38, 0, 0, Math.PI * 2), '#c99b62', { border: 4 });
    if (e.born) {
      const k = Math.min(1, e.out / 0.35), jump = Math.abs(Math.sin(e.out * 6)) * 18 * (1 - Math.min(1, e.out / 1.8));
      Kid.emoji(c, e.baby[0], p.x, p.y + R * 0.2 - R * 0.6 * k - jump, R * 1.25 * (0.5 + 0.5 * k));
      // 破掉的蛋殼
      Paper.shape(c, cc => { cc.moveTo(p.x - R * 0.8, p.y + R * 0.4); for (let i = 0; i <= 6; i++) cc.lineTo(p.x - R * 0.8 + i * R * 0.27, p.y + R * 0.4 + (i % 2 ? -R * 0.22 : 0)); cc.ellipse(p.x, p.y + R * 0.4, R * 0.8, R * 0.6, 0, 0, Math.PI); cc.closePath(); }, e.gold ? '#ffd23f' : e.col, { border: 4 });
      return;
    }
    c.save(); c.translate(p.x, p.y + R); c.rotate(wob); c.translate(0, -R);
    const gl = e.gold ? 0.5 + 0.5 * Math.sin(this.t * 6) : 0;
    Paper.shape(c, cc => cc.ellipse(0, 0, R * 0.8, R, 0, 0, Math.PI * 2), e.gold ? '#ffd23f' : e.col, { border: 5, shadowColor: e.gold ? `rgba(255,190,40,${0.4 + gl * 0.4})` : undefined, blur: e.gold ? 20 : 8 });
    // 花紋
    c.fillStyle = 'rgba(255,255,255,0.55)';
    for (let i = 0; i < 4; i++) { c.beginPath(); c.arc(Math.cos(i * 1.7) * R * 0.4, -R * 0.4 + i * R * 0.28, R * 0.09, 0, Math.PI * 2); c.fill(); }
    c.strokeStyle = '#6a4a2a'; c.lineWidth = 3; c.lineJoin = 'round';
    for (const k of e.cracks) { c.beginPath(); let x = k.a * R * 0.5, y = k.y * R; c.moveTo(x, y); for (let j = 0; j < 4; j++) { x += R * 0.12 * (j % 2 ? 1 : -1); y += R * k.len * 0.25; c.lineTo(x, y); } c.stroke(); }
    c.restore();
    // 剩幾下：小點點
    for (let i = 0; i < e.need; i++) { c.fillStyle = i < e.taps ? '#ff7a00' : 'rgba(255,255,255,0.8)'; c.beginPath(); c.arc(p.x + (i - (e.need - 1) / 2) * 14, p.y + R * 1.6, 5, 0, Math.PI * 2); c.fill(); }
  },
  draw(c) {
    this.layout();
    const gy = Kid.ground(c, 'meadow', this.t, 0.95);
    for (const e of this.eggs) this.drawEgg(c, e);
    const P = Puppet.Poses;
    if (Kid.portrait()) Puppet.draw(c, App.pup, V.W / 2, gy, Math.min(V.H * 0.2, 210), this.cheer ? P.cheer(this.t) : P.idle(this.t));
    else Puppet.draw(c, App.pup, V.W * 0.11, gy, Math.min(V.H * 0.45, 300), this.cheer ? P.cheer(this.t) : P.idle(this.t));
    if (this.t < 3) Kid.text(c, '👆 一直點蛋蛋！', V.W / 2, Kid.portrait() ? V.H * 0.4 : V.H * 0.2, 32, '#e0573c');
  },
  hud() { return { L: `<b>${this.score}</b> 分　🐣 ${this.hatched}`, R: `⏱ ${Math.ceil(this.left)}` }; },
});
