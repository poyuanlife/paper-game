'use strict';
// 澆花：手指按著畫面，澆水壺就會跟著手指灑水。澆到的花苗會慢慢長大開花。45 秒。
registerGame({
  id: 'garden', name: '澆花', icon: '🌻', color: '#4caf50', kid: true,
  desc: '按住畫面拿澆水壺，讓花苗長大開花！',
  howto: '手指按住畫面不放，澆水壺會跟著手指灑水。把水灑在花盆上，花苗就會長大、開出漂亮的花！限時 45 秒。',
  TIME: 45,
  FLOWERS: ['🌻', '🌷', '🌹', '🌼', '🌺', '🌸'],

  start() {
    this.t = 0; this.left = this.TIME; this.score = 0; this.over = false; this.overText = '花園好漂亮！';
    this.drops = []; this.can = { x: V.W / 2, y: V.H * 0.35, tilt: 0 }; this.bloomed = 0; this.cheer = 0; this.bees = [];
    this.pots = null; this.potN = 0;
  },
  layout() {
    const n = Kid.portrait() ? 3 : 5;
    if (this.potN === n) return;
    this.potN = n; this.pots = Array.from({ length: n }, (_, i) => ({ i, g: rand(0, 0.15), f: pick(this.FLOWERS), bloomT: 0, wet: 0 }));
  },
  potX(i) { const n = this.potN, m = Kid.portrait() ? 70 : V.W * 0.12; return m + (V.W - 2 * m) * (n === 1 ? 0.5 : i / (n - 1)); },
  get gy() { return V.H * 0.9; },
  update(dt) {
    this.layout();
    this.t += dt; this.left -= dt; this.cheer = Math.max(0, this.cheer - dt);
    if (this.left <= 0) { this.left = 0; this.over = true; return; }
    const cn = this.can, on = Input.down;
    if (on) { cn.x += (Input.x - cn.x) * Math.min(1, dt * 14); cn.y += (Math.min(Input.y, this.gy - 200) - cn.y) * Math.min(1, dt * 14); }
    else { cn.x += (V.W / 2 + Math.sin(this.t) * 80 - cn.x) * dt * 1.5; cn.y += (V.H * 0.3 - cn.y) * dt * 1.5; }
    cn.tilt += ((on ? 0.6 : 0) - cn.tilt) * Math.min(1, dt * 10);
    if (on && cn.tilt > 0.3) for (let k = 0; k < 3; k++) this.drops.push({ x: cn.x + 62 + rand(-6, 6), y: cn.y + 14, vx: rand(40, 110), vy: rand(-20, 60) });
    if (on && Math.random() < dt * 4) Sfx.play('rustle');
    const potW = Math.min(110, V.W / this.potN * 0.7);
    for (const d of this.drops) {
      d.vy += 900 * dt; d.x += d.vx * dt; d.y += d.vy * dt;
      const potTop = this.gy - 70;
      if (d.y > potTop) {
        d.dead = 1;
        for (const p of this.pots) if (Math.abs(d.x - this.potX(p.i)) < potW * 0.6 && !p.bloomT) { p.g = Math.min(1, p.g + 0.0025); p.wet = 0.4; }
      }
    }
    this.drops = this.drops.filter(d => !d.dead);
    for (const p of this.pots) {
      p.wet = Math.max(0, p.wet - dt);
      if (p.g >= 1 && !p.bloomT) {
        p.bloomT = 2.2; this.bloomed++; this.score += 20; this.cheer = 1.2; Sfx.play('star');
        const x = this.potX(p.i); FX.burst(x, this.gy - 200, 22, undefined, 0.8); FX.text(x, this.gy - 260, pick(['開花了！', '好漂亮！', '哇～']), '#e0573c', 34);
        this.bees.push({ x: x - 60, y: this.gy - 260, t: 0, tx: x });
      }
      if (p.bloomT) { p.bloomT -= dt; if (p.bloomT <= 0) { p.bloomT = 0; p.g = 0; p.f = pick(this.FLOWERS); } }
    }
    for (const b of this.bees) b.t += dt; this.bees = this.bees.filter(b => b.t < 3);
  },
  drawPlant(c, p) {
    const x = this.potX(p.i), base = this.gy - 70, g = p.g, h = 30 + g * 140, sway = Math.sin(this.t * 2 + p.i) * 0.05;
    c.save(); c.translate(x, base); c.rotate(sway);
    if (g > 0.02) {
      c.strokeStyle = '#4f9a45'; c.lineWidth = 6 + g * 4; c.lineCap = 'round'; c.beginPath(); c.moveTo(0, 0); c.lineTo(0, -h); c.stroke();
      const leaf = Math.min(1, g * 2.5);
      Paper.shape(c, c => c.ellipse(-16 * leaf, -h * 0.4, 18 * leaf, 8 * leaf, -0.5, 0, Math.PI * 2), '#62b04f', { border: 2, blur: 2 });
      if (g > 0.4) Paper.shape(c, c => c.ellipse(16 * leaf, -h * 0.65, 18 * leaf, 8 * leaf, 0.5, 0, Math.PI * 2), '#62b04f', { border: 2, blur: 2 });
      if (p.bloomT) Kid.emoji(c, p.f, 0, -h - 20, 80 * (1 + Math.max(0, p.bloomT - 1.9) * 2), Math.sin(this.t * 3) * 0.1);
      else if (g > 0.7) Paper.circle(c, 0, -h - 6, 8 + (g - 0.7) * 30, '#8fd16a', { border: 3, blur: 3 });
    } else Paper.circle(c, 0, -2, 6, '#8a5a34', { border: 2, blur: 2 });
    c.restore();
    // 花盆 + 長大的進度
    const w = Math.min(110, V.W / this.potN * 0.7);
    Paper.shape(c, c => { c.moveTo(x - w / 2, base - 8); c.lineTo(x + w / 2, base - 8); c.lineTo(x + w * 0.38, this.gy); c.lineTo(x - w * 0.38, this.gy); c.closePath(); }, p.wet ? '#b85a34' : '#d9763f', { border: 4 });
    Paper.rect(c, x - w / 2 - 6, base - 18, w + 12, 16, '#e58a52', 5, { border: 3, blur: 3 });
    if (!p.bloomT) { c.fillStyle = 'rgba(255,255,255,0.7)'; c.fillRect(x - w * 0.3, base + 30, w * 0.6, 8); c.fillStyle = '#3fa9e0'; c.fillRect(x - w * 0.3, base + 30, w * 0.6 * p.g, 8); }
  },
  draw(c) {
    this.layout();
    Kid.ground(c, 'meadow', this.t, 0.9);
    const P = Puppet.Poses;
    const mid = Math.floor((this.potN - 1) / 2);
    Puppet.draw(c, App.pup, (this.potX(mid) + this.potX(mid + 1)) / 2, this.gy - 4, Kid.portrait() ? 120 : 150, this.cheer ? P.cheer(this.t) : P.idle(this.t), { alpha: 0.98 });
    for (const p of this.pots) this.drawPlant(c, p);
    for (const b of this.bees) { const k = b.t / 3; Kid.emoji(c, '🐝', b.x + k * 160 + Math.sin(b.t * 8) * 20, b.y - k * 80 + Math.cos(b.t * 10) * 14, 34); }
    c.fillStyle = '#5cb8ee'; for (const d of this.drops) { c.beginPath(); c.ellipse(d.x, d.y, 3.5, 6, Math.atan2(d.vx, d.vy) * -1, 0, Math.PI * 2); c.fill(); }
    // 澆水壺
    const cn = this.can; c.save(); c.translate(cn.x, cn.y); c.rotate(cn.tilt * 0.6);
    Paper.shape(c, c => { c.moveTo(30, -6); c.lineTo(70, -26); c.lineTo(76, -18); c.lineTo(34, 10); c.closePath(); }, '#2f9ad6', { border: 3 });
    Paper.rect(c, -40, -30, 76, 56, '#3fa9e0', 12, { border: 5 });
    c.strokeStyle = '#2f7fc1'; c.lineWidth = 8; c.beginPath(); c.arc(-4, -34, 22, Math.PI, 0); c.stroke();
    Paper.circle(c, -2, -2, 9, '#ffd23f', { border: 2, blur: 2 });
    c.restore();
    if (this.t < 4 && !Input.down) Kid.text(c, '👆 按住畫面澆水', V.W / 2, V.H * 0.45, 30, '#2f7fc1');
  },
  hud() { this.layout(); return { L: `<b>${this.score}</b> 分　🌼 ${this.bloomed}`, R: `⏱ ${Math.ceil(this.left)}` }; },
});
