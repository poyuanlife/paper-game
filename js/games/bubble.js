'use strict';
// 戳泡泡：紙片人一直吹泡泡，點破泡泡得分。不會輸，給小小孩玩。40 秒。
registerGame({
  id: 'bubble', name: '戳泡泡', icon: '🧼', color: '#3fa9e0', kid: true,
  desc: '紙片人在吹泡泡，把泡泡通通戳破！',
  howto: '點泡泡就會「啵」一聲破掉！裡面有東西的泡泡分數比較多，彩虹泡泡會把畫面上的泡泡一次全部戳破！不會輸，限時 40 秒。',
  TIME: 40,
  INSIDE: ['🐟', '🐥', '🍓', '🦋', '🍭', '🐞', '🌸', '🍪', '⭐', '🐠'],

  start() {
    this.t = 0; this.left = this.TIME; this.score = 0; this.over = false; this.overText = '好多泡泡！';
    this.bubs = []; this.rings = []; this.spawnT = 0.2; this.pops = 0; this.cheer = 0; this.chain = [];
  },
  get ground() { return V.H * 0.93; },
  get PH() { return Math.min(V.H * 0.3, 230); },
  get px() { return V.W / 2 + Math.sin(this.t * 0.45) * Math.min(V.W * 0.28, 300); },

  spawn() {
    const r = Math.random(), k = r < 0.05 ? 'rainbow' : r < 0.4 ? 'item' : 'plain', s = Puppet.size(App.pup, this.PH);
    this.bubs.push({ k, x: this.px + rand(-20, 20), y: this.ground - s.h * 0.8, vx: rand(-110, 110), vy: rand(-60, -110),
      r: rand(40, 62) * (k === 'rainbow' ? 1.15 : 1), ph: rand(0, 6), age: 0, hue: rand(0, 360), item: pick(this.INSIDE) });
    this.spawnT = rand(0.35, 0.7) * (1 - this.t / this.TIME * 0.35);
  },

  pop(b, chained) {
    if (b.dead) return; b.dead = 1;
    const pts = b.k === 'rainbow' ? 30 : b.k === 'item' ? 20 : 10;
    this.score += pts; this.pops++;
    this.rings.push({ x: b.x, y: b.y, r: b.r, t: 0, hue: b.hue });
    FX.burst(b.x, b.y, 8, [`hsl(${b.hue},80%,70%)`, '#ffffff', '#bfe8ff'], 0.5);
    FX.text(b.x, b.y - b.r * 0.4, '+' + pts, `hsl(${b.hue},70%,45%)`, 28);
    Sfx.play(chained ? 'pop' : b.k === 'rainbow' ? 'star' : 'pop');
    if (b.k === 'rainbow') {   // 彩虹泡泡：其他泡泡一顆一顆接著破
      this.bubs.filter(o => !o.dead).sort((p, q) => Math.hypot(p.x - b.x, p.y - b.y) - Math.hypot(q.x - b.x, q.y - b.y))
        .forEach((o, i) => this.chain.push({ b: o, t: 0.08 * (i + 1) }));
      FX.text(V.W / 2, V.H * 0.4, '彩虹魔法！', '#e05ab0', 48);
    }
    if (this.pops % 15 === 0) { this.cheer = 1.4; FX.text(this.px, this.ground - this.PH * 1.2, pick(['好棒！', '好厲害！', '哇～', '太強了！']), '#ff8a00', 40); }
  },

  tap(x, y) {
    let best = null, bd = Infinity;
    for (const b of this.bubs) { if (b.dead) continue; const d = Math.hypot(b.x - x, b.y - y); if (d < b.r + 24 && d - b.r < bd) { bd = d - b.r; best = b; } }
    if (best) this.pop(best);
  },

  update(dt) {
    this.t += dt; this.left -= dt; this.cheer = Math.max(0, this.cheer - dt);
    if (this.left <= 0) { this.left = 0; this.over = true; return; }
    this.spawnT -= dt; if (this.spawnT <= 0) this.spawn();
    for (const b of this.bubs) {
      b.age += dt;
      b.vx *= Math.pow(0.5, dt); b.vy += (-75 - b.vy) * dt * 0.8;
      b.x += (b.vx + Math.sin(b.age * 2 + b.ph) * 30) * dt; b.y += b.vy * dt;
      if (b.x < b.r) { b.x = b.r; b.vx = Math.abs(b.vx); } if (b.x > V.W - b.r) { b.x = V.W - b.r; b.vx = -Math.abs(b.vx); }
      if (b.y < -b.r * 2) b.dead = 1;   // 飛走了，沒關係
    }
    for (const c of this.chain) { c.t -= dt; if (c.t <= 0) this.pop(c.b, true); }
    this.chain = this.chain.filter(c => c.t > 0);
    this.bubs = this.bubs.filter(b => !b.dead);
    for (const r of this.rings) r.t += dt; this.rings = this.rings.filter(r => r.t < 0.35);
  },

  drawBubble(c, b) {
    const grow = Math.min(1, b.age / 0.35), r = b.r * (0.3 + 0.7 * grow), wob = 1 + Math.sin(b.age * 5 + b.ph) * 0.04;
    c.save(); c.translate(b.x, b.y); c.scale(wob, 2 - wob);
    const g = c.createRadialGradient(-r * 0.3, -r * 0.3, r * 0.1, 0, 0, r);
    g.addColorStop(0, 'rgba(255,255,255,0.15)'); g.addColorStop(0.75, `hsla(${b.hue},90%,80%,0.22)`); g.addColorStop(1, `hsla(${b.hue},90%,70%,0.55)`);
    c.fillStyle = g; c.beginPath(); c.arc(0, 0, r, 0, Math.PI * 2); c.fill();
    if (b.k === 'rainbow') {
      c.lineWidth = 6;
      for (let i = 0; i < 6; i++) { c.strokeStyle = `hsl(${i * 60 + b.age * 120},85%,60%)`; c.beginPath(); c.arc(0, 0, r - 3, i * Math.PI / 3, (i + 1) * Math.PI / 3); c.stroke(); }
    } else { c.lineWidth = 3; c.strokeStyle = 'rgba(255,255,255,0.9)'; c.beginPath(); c.arc(0, 0, r - 1.5, 0, Math.PI * 2); c.stroke(); }
    if (b.k === 'item') { c.font = `${Math.round(r * 0.95)}px "Segoe UI Emoji","Apple Color Emoji","Noto Color Emoji",sans-serif`; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(b.item, 0, r * 0.05); }
    if (b.k === 'rainbow') { c.font = `${Math.round(r * 0.8)}px "Segoe UI Emoji","Apple Color Emoji","Noto Color Emoji",sans-serif`; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('🌈', 0, r * 0.05); }
    // 反光
    c.fillStyle = 'rgba(255,255,255,0.85)'; c.beginPath(); c.ellipse(-r * 0.4, -r * 0.45, r * 0.2, r * 0.11, -0.7, 0, Math.PI * 2); c.fill();
    c.beginPath(); c.arc(-r * 0.12, -r * 0.62, r * 0.05, 0, Math.PI * 2); c.fill();
    c.restore();
  },

  draw(c) {
    const T = Paper.bg(c, 'meadow', this.t * 15, this.t), gy = this.ground;
    c.fillStyle = T.ground; c.fillRect(-20, gy, V.W + 40, V.H);
    Paper.rect(c, -20, gy - 8, V.W + 40, 18, T.grass, 4, { blur: 4 });
    // 紙片人一邊走一邊吹泡泡
    const P = Puppet.Poses, x = this.px, moving = Math.cos(this.t * 0.45);
    let pose = this.cheer ? P.cheer(this.t) : P.dance(this.t * 0.55);
    pose.sx = (moving >= 0 ? 1 : -1) * (pose.sx || 1);
    c.fillStyle = 'rgba(60,40,10,0.22)'; c.beginPath(); c.ellipse(x, gy + 2, 44, 9, 0, 0, Math.PI * 2); c.fill();
    Puppet.draw(c, App.pup, x, gy, this.PH, pose);
    for (const b of this.bubs) this.drawBubble(c, b);
    for (const r of this.rings) {
      const k = r.t / 0.35; c.globalAlpha = 1 - k; c.strokeStyle = `hsl(${r.hue},80%,75%)`; c.lineWidth = 5 * (1 - k) + 1;
      c.beginPath(); c.arc(r.x, r.y, r.r * (1 + k * 0.6), 0, Math.PI * 2); c.stroke(); c.globalAlpha = 1;
    }
  },
  hud() { return { L: `<b>${this.score}</b> 分　戳破 ${this.pops} 顆`, R: `⏱ ${Math.ceil(this.left)}` }; },
});
