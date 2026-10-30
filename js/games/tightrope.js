'use strict';
// 走鋼索：紙片人拿著平衡桿自己往前走，身體會左右晃，還會颳風。傾斜手機幫牠保持平衡，倒太多就掉下去。3 條命，走越遠分數越高。
registerGame({
  id: 'tightrope', name: '走鋼索', icon: '🎪', color: '#d9463c', tilt: true,
  desc: '傾斜手機幫紙片人保持平衡！（手機限定）',
  howto: '📱 手機限定：紙片人會自己往前走，可是身體會一直晃。往右倒就把手機往左傾，往左倒就往右傾，把牠扶正！看到 💨 風來了要特別小心。掉下去 3 次就結束，走越遠分數越高。（電腦用 ← → 鍵）',

  start() { this.t = 0; this.score = 0; this.over = false; this.overText = '掉下去了！'; this.lives = 3; this.th = 0.05; this.w = 0; this.dist = 0; this.wind = 0; this.windT = 3; this.windShow = 0; this.fall = 0; this.cheerT = 0; this.mark = 50; },
  get ropeY() { return V.H * 0.62; },
  get PH() { return Kid.portrait() ? Math.min(V.H * 0.3, 280) : Math.min(V.H * 0.42, 290); },
  tap() { Tilt.calibrate(); },
  update(dt) {
    this.t += dt; this.cheerT = Math.max(0, this.cheerT - dt);
    if (this.fall) {
      this.fall += dt;
      if (this.fall > 1.6) { if (this.lives <= 0) { this.over = true; return; } this.fall = 0; this.th = 0; this.w = 0; this.wind = 0; this.windT = 3; }
      return;
    }
    const lv = Math.min(1.5, this.dist / 400);
    this.windT -= dt;
    if (this.windT <= 0) { this.wind = (Math.random() < 0.5 ? -1 : 1) * rand(0.6, 1.2) * (0.6 + lv * 0.5); this.windShow = 1.6; this.windT = rand(3.5, 6) - lv; Sfx.play('blow'); }
    if (this.windShow > 0) this.windShow -= dt; else this.wind *= Math.pow(0.2, dt);
    // 倒立擺：越歪倒越快；手機往哪邊傾，就往哪邊推
    const ease = Math.min(1, this.t / 3), a = ease * Math.sin(this.th) * (2.2 + lv * 1.2) + this.wind * (this.windShow > 0 ? 1.4 : 0.3) + Tilt.x * 6.5 - this.w * 0.9 + Math.sin(this.t * 1.7) * 0.25;
    this.w += a * dt; this.th += this.w * dt;
    if (Math.abs(this.th) > 0.95) { this.lives--; this.fall = 0.001; this.fallDir = Math.sign(this.th); Sfx.play('hit'); V.shake = 8; this.overText = `走了 ${Math.floor(this.dist)} 公尺`; return; }
    const sp = 45 * (1 - Math.min(0.7, Math.abs(this.th)));   // 歪的時候走慢一點
    this.dist += sp * dt / 10; this.score = Math.floor(this.dist) + 0;
    if (this.dist >= this.mark) { Sfx.play('coin'); FX.text(V.W / 2, V.H * 0.25, `${this.mark} 公尺！`, '#ffd23f', 40); this.mark += 50; this.cheerT = 1; }
  },
  draw(c) {
    // 馬戲團帳篷
    const g = c.createLinearGradient(0, 0, 0, V.H); g.addColorStop(0, '#3a2a5a'); g.addColorStop(1, '#6a3a5a'); c.fillStyle = g; c.fillRect(-20, -20, V.W + 40, V.H + 40);
    const off = (this.dist * 30) % 120;
    for (let x = -120; x < V.W + 120; x += 120) { c.fillStyle = 'rgba(232,69,60,0.35)'; c.beginPath(); c.moveTo(x - off, 0); c.lineTo(x - off + 60, 0); c.lineTo(x - off + 30 + (V.W / 2 - x) * 0.1, V.H * 0.45); c.closePath(); c.fill(); }
    c.fillStyle = 'rgba(255,240,180,0.08)'; c.beginPath(); c.moveTo(V.W / 2 - 40, 0); c.lineTo(V.W / 2 + 40, 0); c.lineTo(V.W / 2 + 220, this.ropeY + 40); c.lineTo(V.W / 2 - 220, this.ropeY + 40); c.fill();
    // 觀眾
    for (let i = 0; i < 26; i++) { const x = ((i * 53 - this.dist * 20) % (V.W + 60) + V.W + 60) % (V.W + 60) - 30; Paper.circle(c, x, V.H - 30 - (i % 3) * 22 + (this.cheerT ? -Math.abs(Math.sin(this.t * 12 + i)) * 10 : 0), 16, ['#7a6aa0', '#5a4a7a', '#8a7ab0'][i % 3], { border: 0, blur: 2 }); }
    // 安全網
    c.strokeStyle = 'rgba(255,255,255,0.25)'; c.lineWidth = 1.5; const ny = V.H * 0.86;
    for (let x = -20; x < V.W + 20; x += 24) { c.beginPath(); c.moveTo(x, ny); c.lineTo(x + 12, ny + 18); c.lineTo(x + 24, ny); c.stroke(); }
    // 鋼索
    const ry = this.ropeY, px = V.W / 2; c.strokeStyle = '#d9d2c3'; c.lineWidth = 4; c.beginPath(); c.moveTo(-20, ry - 20); c.quadraticCurveTo(px, ry + 14, V.W + 20, ry - 20); c.stroke();
    // 紙片人（以腳為中心旋轉）+ 平衡桿
    const P = Puppet.Poses, fy = ry + 6;
    let th = this.th, y = fy;
    if (this.fall) { th = this.fallDir * (0.95 + this.fall * 2); y = fy + this.fall * this.fall * 300; }
    c.save(); c.translate(px, y); c.rotate(th);
    const step = this.fall ? 0 : Math.sin(this.t * 6);
    const pose = this.fall ? P.hurt(this.fall) : { aL: 1.55 - th * 0.6, aR: 1.55 + th * 0.6, aLf: 0.1, aRf: 0.1, lL: Math.max(0, step) * 0.25, lR: Math.max(0, -step) * 0.25, lLf: -Math.max(0, step) * 0.4, lRf: -Math.max(0, -step) * 0.4, head: -th * 0.5 };
    Puppet.draw(c, App.pup, 0, 0, this.PH, pose);
    const hy = -this.PH * 0.55, pl = Math.min(V.W * 0.42, 260);
    c.strokeStyle = '#8a5a34'; c.lineWidth = 7; c.lineCap = 'round'; c.beginPath(); c.moveTo(-pl, hy + 14); c.quadraticCurveTo(0, hy - 6, pl, hy + 14); c.stroke();
    Paper.circle(c, -pl, hy + 14, 10, '#e8453c', { border: 2, blur: 2 }); Paper.circle(c, pl, hy + 14, 10, '#e8453c', { border: 2, blur: 2 });
    c.restore();
    // 風
    if (this.windShow > 0) {
      const d = Math.sign(this.wind), a = Math.min(1, this.windShow * 2);
      c.globalAlpha = a;
      for (let i = 0; i < 4; i++) { const x = ((this.t * 400 * d + i * 170) % (V.W + 200) + V.W + 200) % (V.W + 200) - 100; Kid.emoji(c, '💨', x, ry - this.PH * (0.3 + i * 0.15), 44, 0); }
      Kid.text(c, d > 0 ? '風往右吹 →' : '← 風往左吹', V.W / 2, V.H * 0.18, 34, '#7fd8ff');
      c.globalAlpha = 1;
    }
    // 平衡計
    const mx = V.W / 2, my = V.H - 90, mw = Math.min(V.W * 0.7, 360);
    Paper.rect(c, mx - mw / 2, my - 10, mw, 20, '#fffdf5', 10, { border: 3 });
    c.fillStyle = 'rgba(232,69,60,0.35)'; c.fillRect(mx - mw / 2 + 4, my - 6, mw * 0.15, 12); c.fillRect(mx + mw / 2 - 4 - mw * 0.15, my - 6, mw * 0.15, 12);
    Paper.circle(c, mx + clamp(this.th / 0.95, -1, 1) * (mw / 2 - 12), my, 12, Math.abs(this.th) > 0.6 ? '#e8453c' : '#45ad4a', { border: 3, blur: 3 });
    if (this.t < 5 || (!Tilt.active && this.t < 12)) Kid.text(c, Tilt.hint(), V.W / 2, V.H - 40, 18, '#2a2a33', 6);
    if (this.fall) Kid.text(c, '哇啊啊～', V.W / 2, V.H * 0.32, 44, '#ffd23f');
  },
  hud() { return { L: `<b>${this.score}</b> 公尺`, R: '❤️'.repeat(Math.max(0, this.lives)) + '🤍'.repeat(Math.max(0, 3 - this.lives)) }; },
});
