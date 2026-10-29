'use strict';
// 釣魚：紙片人坐在船上，點水裡的魚，魚鉤就會下去把魚釣上來。45 秒，不會輸。
registerGame({
  id: 'fishing', name: '釣魚', icon: '🎣', color: '#2f7fc1', kid: true,
  desc: '點水裡的魚，紙片人幫你釣上來！',
  howto: '點水裡游來游去的魚，魚鉤就會下去把牠釣起來！大魚分數比較多，偶爾還會釣到奇怪的東西喔。限時 45 秒。',
  TIME: 45,
  KINDS: [
    { e: '🐟', pts: 10, s: 1, w: 30 }, { e: '🐠', pts: 15, s: 1, w: 22 }, { e: '🐡', pts: 15, s: 1.05, w: 14 }, { e: '🦀', pts: 20, s: 0.95, w: 10, crab: 1 },
    { e: '🐙', pts: 20, s: 1.1, w: 8 }, { e: '🦑', pts: 20, s: 1.1, w: 6 }, { e: '🐳', pts: 50, s: 1.8, w: 3 }, { e: '👢', pts: 1, s: 0.9, w: 4, junk: '哈哈，是一隻鞋子！' },
  ],

  start() { this.t = 0; this.left = this.TIME; this.score = 0; this.over = false; this.overText = '釣魚大豐收！'; this.fish = []; this.spawnT = 0; this.hook = null; this.caught = 0; this.cheer = 0; this.bucket = []; },
  get sea() { return V.H * (Kid.portrait() ? 0.42 : 0.4); },
  get boatX() { return V.W / 2 + Math.sin(this.t * 0.4) * Math.min(60, V.W * 0.08); },
  get rodTip() { return { x: this.boatX + 120, y: this.sea - 150 + Math.sin(this.t * 1.6) * 3 }; },
  spawn() {
    const tot = this.KINDS.reduce((a, k) => a + k.w, 0); let r = Math.random() * tot, K = this.KINDS[0];
    for (const k of this.KINDS) { r -= k.w; if (r <= 0) { K = k; break; } }
    const dir = Math.random() < 0.5 ? 1 : -1, size = 62 * K.s * (Kid.portrait() ? 0.95 : 1), top = this.sea + 70, bot = V.H - 40;
    const y = K.crab ? bot - 10 : rand(top, bot - 30);
    this.fish.push({ K, x: dir > 0 ? -60 : V.W + 60, y, dir, sp: rand(45, 95) * (K.crab ? 0.7 : 1), size, ph: rand(0, 6), st: 'swim' });
    this.spawnT = rand(0.6, 1.2);
  },
  tap(x, y) {
    if (this.hook || y < this.sea) return;
    let best = null, bd = 1e9;
    for (const f of this.fish) { if (f.st !== 'swim') continue; const d = Math.hypot(x - f.x, y - f.y); if (d < f.size * 0.7 + 20 && d < bd) { bd = d; best = f; } }
    if (best) { best.st = 'hooked'; this.hook = { f: best, st: 'down', t: 0, x: best.x, y: best.y }; Sfx.play('splash'); }
    else { FX.burst(x, y, 6, ['#bfe8ff', '#ffffff'], 0.4); Sfx.play('rustle'); }
  },
  update(dt) {
    this.t += dt; this.left -= dt; this.cheer = Math.max(0, this.cheer - dt);
    if (this.left <= 0 && !this.hook) { this.left = 0; this.over = true; return; }
    this.left = Math.max(0, this.left);
    this.spawnT -= dt; if (this.spawnT <= 0 && this.fish.length < 8) this.spawn();
    for (const f of this.fish) if (f.st === 'swim') { f.x += f.dir * f.sp * dt; if (f.x < -100 || f.x > V.W + 100) f.st = 'gone'; }
    const h = this.hook;
    if (h) {
      h.t += dt;
      if (h.st === 'down' && h.t > 0.35) { h.st = 'up'; h.t = 0; }
      if (h.st === 'up') {
        const tip = this.rodTip, k = Math.min(1, h.t / 0.7);
        h.f.x = h.x + (tip.x - h.x) * k; h.f.y = h.y + (tip.y + 40 - h.y) * k * k;
        if (k >= 1) {
          const K = h.f.K; h.f.st = 'gone'; this.hook = null; this.score += K.pts; this.caught++; this.cheer = 1.2;
          this.bucket.push(K.e); if (this.bucket.length > 6) this.bucket.shift();
          Sfx.play(K.junk ? 'boing' : K.pts >= 50 ? 'star' : 'catch');
          FX.burst(tip.x, tip.y + 40, 16, undefined, 0.7);
          FX.text(tip.x, tip.y - 10, K.junk || (K.pts >= 50 ? '哇！大鯨魚！' : `+${K.pts}`), K.junk ? '#7a62b8' : '#ff7a00', K.junk ? 28 : 34);
          if (K.junk) Kid.say('哈哈，是鞋子'); else if (K.pts >= 50) Kid.say('哇！大鯨魚！');
        }
      }
    }
    this.fish = this.fish.filter(f => f.st !== 'gone');
  },
  draw(c) {
    const sea = this.sea;
    Paper.bg(c, 'sky', 0, this.t);
    // 海：幾層波浪
    const g = c.createLinearGradient(0, sea, 0, V.H); g.addColorStop(0, '#5cc2ee'); g.addColorStop(1, '#1d6fa8');
    c.fillStyle = g; c.fillRect(-20, sea, V.W + 40, V.H);
    c.fillStyle = '#e6c88a'; c.beginPath(); c.moveTo(-20, V.H + 20); for (let x = -20; x <= V.W + 20; x += 20) c.lineTo(x, V.H - 25 + Math.sin(x / 70) * 8); c.lineTo(V.W + 20, V.H + 20); c.fill();
    for (let i = 0; i < 4; i++) Kid.emoji(c, i % 2 ? '🐚' : '🌿', (i * 0.27 + 0.1) * V.W, V.H - 40, 44);
    // 魚
    for (const f of this.fish) {
      const wig = f.st === 'hooked' ? Math.sin(this.t * 30) * 0.3 : Math.sin(this.t * 4 + f.ph) * 0.12;
      c.save(); c.translate(f.x, f.y + (f.st === 'swim' ? Math.sin(this.t * 2 + f.ph) * 6 : 0));
      if (f.dir > 0 && !f.K.crab && f.K.e !== '👢') c.scale(-1, 1);   // emoji 的魚頭朝左，往右游要翻面
      Kid.emoji(c, f.K.e, 0, 0, f.size, wig); c.restore();
    }
    // 船 + 紙片人
    const bx = this.boatX, by = sea + 6 + Math.sin(this.t * 1.6) * 3, tip = this.rodTip;
    const P = Puppet.Poses, pose = this.cheer ? P.cheer(this.t) : this.hook ? { aL: 1.6, aR: 2.2, aLf: 0.6, aRf: 0.4 } : P.idle(this.t);
    Puppet.draw(c, App.pup, bx - 10, by - 20, Kid.portrait() ? 150 : 170, pose);
    c.strokeStyle = '#7a4a22'; c.lineWidth = 6; c.lineCap = 'round'; c.beginPath(); c.moveTo(bx + 20, by - 70); c.lineTo(tip.x, tip.y); c.stroke();
    Paper.shape(c, c => { c.moveTo(bx - 120, by - 30); c.lineTo(bx + 120, by - 30); c.lineTo(bx + 85, by + 22); c.lineTo(bx - 85, by + 22); c.closePath(); }, '#d9643a', { border: 5 });
    Paper.rect(c, bx - 112, by - 34, 224, 12, '#fff3d6', 5, { border: 0 });
    this.bucket.forEach((e, i) => Kid.emoji(c, e, bx - 95 + i * 22, by - 2, 26));
    // 釣線
    const h = this.hook, end = h ? (h.st === 'down' ? { x: tip.x + (h.x - tip.x) * Math.min(1, h.t / 0.35), y: tip.y + (h.y - tip.y) * Math.min(1, h.t / 0.35) } : { x: h.f.x, y: h.f.y - h.f.size * 0.3 }) : { x: tip.x, y: sea + 30 + Math.sin(this.t * 2) * 6 };
    c.strokeStyle = 'rgba(255,255,255,0.9)'; c.lineWidth = 2; c.beginPath(); c.moveTo(tip.x, tip.y); c.lineTo(end.x, end.y); c.stroke();
    Paper.circle(c, end.x, end.y, 6, '#e8453c', { border: 2, blur: 2 });
    // 水面的波浪蓋在船底
    c.fillStyle = 'rgba(255,255,255,0.45)';
    c.beginPath(); c.moveTo(-20, sea + 14); for (let x = -20; x <= V.W + 20; x += 16) c.lineTo(x, sea + 6 + Math.sin(x / 40 + this.t * 2) * 5); c.lineTo(V.W + 20, sea + 18); c.closePath(); c.fill();
  },
  hud() { return { L: `<b>${this.score}</b> 分　🎣 ${this.caught}`, R: `⏱ ${Math.ceil(this.left)}` }; },
});
