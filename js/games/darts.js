'use strict';
// 射飛鏢：準星會晃來晃去，看準了點畫面射出去。正中紅心 50 分。5 回合，每回合 3 支飛鏢，越後面晃越大。
registerGame({
  id: 'darts', name: '射飛鏢', icon: '🎯', color: '#b8433a',
  desc: '準星晃來晃去，抓準時機射中紅心！',
  howto: '準星會一直晃，看準時機點畫面（或按空白鍵）射出飛鏢。越靠近中間分數越高：紅心 50、外圈紅心 25，其他環 10～2 分。5 回合，每回合 3 支，後面會晃得更厲害！',
  ROUNDS: 5, PER: 3,

  start() { this.t = 0; this.score = 0; this.over = false; this.overText = '比賽結束！'; this.round = 0; this.thrown = 0; this.darts = []; this.fly = null; this.wob = 0; this.cheer = 0; this.ph = rand(0, 10); },
  get board() { const P = Kid.portrait(); return { x: V.W / 2, y: P ? V.H * 0.38 : V.H * 0.44, r: P ? Math.min(V.W * 0.42, 230) : Math.min(V.H * 0.36, 250) }; },
  aim() {
    const B = this.board, a = B.r * (0.32 + this.round * 0.12), t = this.wob;
    return { x: B.x + (Math.sin(t * 1.3 + this.ph) * 0.7 + Math.sin(t * 3.1) * 0.3) * a, y: B.y + (Math.sin(t * 1.7 + 1) * 0.7 + Math.cos(t * 2.6) * 0.3) * a };
  },
  scoreAt(x, y) {
    const B = this.board, d = Math.hypot(x - B.x, y - B.y) / B.r;
    if (d < 0.06) return 50; if (d < 0.14) return 25; if (d > 1) return 0;
    return [10, 8, 6, 4, 2][Math.min(4, Math.floor((d - 0.14) / 0.172))];
  },
  throw() {
    if (this.fly || this.over || this.thrown >= this.PER) return;
    const a = this.aim(); this.fly = { x: a.x, y: a.y, t: 0 }; Sfx.play('swish');
  },
  tap() { this.throw(); },
  key(k) { if (k === 'space' || k === 'enter') this.throw(); },
  update(dt) {
    this.t += dt; this.wob += dt * (1 + this.round * 0.18); this.cheer = Math.max(0, this.cheer - dt);
    const f = this.fly;
    if (f) {
      f.t += dt;
      if (f.t >= 0.25) {
        const pts = this.scoreAt(f.x, f.y); this.score += pts; this.darts.push({ x: f.x, y: f.y, rot: rand(-0.2, 0.2) }); this.fly = null; this.thrown++;
        Sfx.play(pts >= 25 ? 'star' : pts ? 'thud' : 'whiff');
        FX.text(f.x, f.y - 50, pts >= 50 ? '紅心！50' : pts ? `+${pts}` : '沒中！', pts >= 25 ? '#e0573c' : pts ? '#ff7a00' : '#888', pts >= 25 ? 40 : 32);
        if (pts >= 25) { FX.burst(f.x, f.y, 24, undefined, 0.9); this.cheer = 1.2; }
        if (this.thrown >= this.PER) this.nextT = 1.2;
      }
    }
    if (this.nextT) { this.nextT -= dt; if (this.nextT <= 0) { this.nextT = 0; if (this.round + 1 >= this.ROUNDS) { this.over = true; return; } this.round++; this.thrown = 0; this.darts = []; FX.text(V.W / 2, V.H * 0.2, `第 ${this.round + 1} 回合`, '#4a3520', 40); } }
  },
  draw(c) {
    c.fillStyle = '#7a5a3c'; c.fillRect(-20, -20, V.W + 40, V.H + 40);
    c.fillStyle = 'rgba(0,0,0,0.12)'; for (let x = 0; x < V.W; x += 70) c.fillRect(x, 0, 4, V.H);
    const B = this.board, cols = ['#2a2a33', '#f2e6cc'];
    Paper.circle(c, B.x, B.y, B.r * 1.12, '#2a2a33', { border: 6, blur: 14 });
    for (let i = 4; i >= 0; i--) { const r = (0.14 + (i + 1) * 0.172) * B.r; c.fillStyle = i % 2 ? '#e8453c' : '#3d8b4a'; c.beginPath(); c.arc(B.x, B.y, r, 0, Math.PI * 2); c.fill(); c.fillStyle = cols[i % 2]; c.beginPath(); c.arc(B.x, B.y, r - B.r * 0.03, 0, Math.PI * 2); c.fill(); }
    c.fillStyle = '#3d8b4a'; c.beginPath(); c.arc(B.x, B.y, B.r * 0.14, 0, Math.PI * 2); c.fill();
    c.fillStyle = '#e8453c'; c.beginPath(); c.arc(B.x, B.y, B.r * 0.06, 0, Math.PI * 2); c.fill();
    for (let i = 0; i < 5; i++) { const r = (0.14 + (i + 0.5) * 0.172) * B.r; Kid.text(c, String([10, 8, 6, 4, 2][i]), B.x, B.y - r, Math.max(12, B.r * 0.07), '#ffffff', 0); }
    const dart = (x, y, rot, s = 1) => { c.save(); c.translate(x, y); c.rotate(rot - 0.5); c.scale(s, s); c.fillStyle = '#9aa0b5'; c.fillRect(-2, -4, 4, 8); Paper.rect(c, -4, 4, 8, 34, '#ffd23f', 3, { border: 2, blur: 3 }); Paper.shape(c, cc => { cc.moveTo(0, 34); cc.lineTo(-12, 52); cc.lineTo(0, 46); cc.lineTo(12, 52); cc.closePath(); }, '#e8453c', { border: 2, blur: 2 }); c.restore(); };
    for (const d of this.darts) dart(d.x, d.y, d.rot);
    const f = this.fly;
    if (f) { const k = f.t / 0.25, sx = V.W / 2, sy = V.H * 0.95; dart(sx + (f.x - sx) * k, sy + (f.y - sy) * k, 0, 2.2 - k * 1.2); }
    // 準星
    if (!f && this.thrown < this.PER) {
      const a = this.aim(); c.strokeStyle = '#ffffff'; c.lineWidth = 3; c.beginPath(); c.arc(a.x, a.y, 18, 0, Math.PI * 2); c.moveTo(a.x - 30, a.y); c.lineTo(a.x - 8, a.y); c.moveTo(a.x + 8, a.y); c.lineTo(a.x + 30, a.y); c.moveTo(a.x, a.y - 30); c.lineTo(a.x, a.y - 8); c.moveTo(a.x, a.y + 8); c.lineTo(a.x, a.y + 30); c.stroke();
      c.fillStyle = '#e8453c'; c.beginPath(); c.arc(a.x, a.y, 3, 0, Math.PI * 2); c.fill();
    }
    // 剩下的飛鏢
    for (let i = 0; i < this.PER; i++) { c.globalAlpha = i < this.PER - this.thrown ? 1 : 0.25; dart(V.W / 2 - 50 + i * 50, V.H - 70, 0.5, 1); }
    c.globalAlpha = 1;
    const P = Puppet.Poses, PH = Kid.portrait() ? 200 : 220;
    Puppet.draw(c, App.pup, Kid.portrait() ? 80 : 120, V.H + PH * 0.3, PH, this.cheer ? P.cheer(this.t) : f ? { aR: 2.6, aRf: -0.3, aL: 0.4 } : P.idle(this.t));
  },
  hud() { return { L: `<b>${this.score}</b> 分`, R: `第 ${this.round + 1} / ${this.ROUNDS} 回合` }; },
});
