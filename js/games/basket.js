'use strict';
// 投籃：從球往後拉再放開（像拉弓），球就會飛出去。進球 2 分，空心球 3 分，連進有加成。籃框會越來越難。60 秒。
registerGame({
  id: 'basket', name: '紙片人投籃', icon: '🏀', color: '#e07a2f',
  desc: '拉、放、投！看你能投進幾球！',
  howto: '按住球往後拉（拉的方向跟要投的方向相反），放開就投出去，會顯示預測路線。進球 2 分，沒碰到籃框的空心球 3 分，連續進球有加成。後面籃框會移動喔！限時 60 秒。',
  TIME: 60, G: 1400, BR: 22,

  start() { this.t = 0; this.left = this.TIME; this.score = 0; this.over = false; this.overText = '時間到！'; this.made = 0; this.streak = 0; this.cheer = 0; this.sw = Kid.makeSwipe(); this.reset(); this.hoopT = 0; },
  get floor() { return V.H * 0.92; },
  get spot() { const P = Kid.portrait(); return { x: P ? V.W * 0.24 : V.W * 0.2, y: this.floor - (P ? 190 : 200) }; },
  get hoop() {
    const P = Kid.portrait(), lv = Math.floor(this.made / 4), moving = lv >= 1, amp = Math.min(V.H * 0.12, 30 + lv * 12);
    const bx = P ? V.W * 0.78 : V.W * 0.78, by = (P ? V.H * 0.42 : V.H * 0.38) + (moving ? Math.sin(this.hoopT * (0.8 + lv * 0.2)) * amp : 0);
    return { x: bx - (lv >= 2 ? Math.abs(Math.sin(this.hoopT * 0.5)) * Math.min(120, V.W * 0.12) : 0), y: by, w: 92 };
  },
  reset() { const s = this.spot; this.ball = { x: s.x, y: s.y, vx: 0, vy: 0, live: false, t: 0, rimHit: false, scored: false, rot: 0 }; },
  tap(x, y) { const b = this.ball; if (!b.live && Math.hypot(x - b.x, y - b.y) < 120) this.sw.begin(x, y); },
  vel(x, y) { const s = this.spot, dx = s.x - x, dy = s.y - y, k = 5.2, m = 1250; let vx = dx * k, vy = dy * k; const sp = Math.hypot(vx, vy); if (sp > m) { vx *= m / sp; vy *= m / sp; } return { vx, vy }; },
  update(dt) {
    this.t += dt; this.left -= dt; this.hoopT += dt; this.cheer = Math.max(0, this.cheer - dt);
    if (this.left <= 0 && !this.ball.live) { this.left = 0; this.over = true; return; }
    this.left = Math.max(0, this.left);
    this.sw.step(e => { const v = this.vel(e.x, e.y); if (Math.hypot(v.vx, v.vy) < 200) return; Object.assign(this.ball, v, { live: true, t: 0 }); Sfx.play('swish'); });
    const b = this.ball, H = this.hoop;
    if (!b.live) return;
    const steps = 3;
    for (let s = 0; s < steps; s++) {
      const h = dt / steps, py = b.y;
      b.vy += this.G * h; b.x += b.vx * h; b.y += b.vy * h; b.rot += b.vx * h * 0.02;
      // 籃框兩端是小圓點，球會彈開
      for (const rx of [H.x - H.w / 2, H.x + H.w / 2]) {
        const dx = b.x - rx, dy = b.y - H.y, d = Math.hypot(dx, dy), m = this.BR + 5;
        if (d < m && d > 0) { const nx = dx / d, ny = dy / d, vn = b.vx * nx + b.vy * ny; if (vn < 0) { b.vx -= 1.6 * vn * nx; b.vy -= 1.6 * vn * ny; b.vx *= 0.85; b.vy *= 0.85; } b.x = rx + nx * m; b.y = H.y + ny * m; if (!b.rimHit) Sfx.play('thud'); b.rimHit = true; }
      }
      // 籃板
      const bbx = H.x + H.w / 2 + 12;
      if (b.x + this.BR > bbx && b.x < bbx + 14 && b.y > H.y - 130 && b.y < H.y + 20 && b.vx > 0) { b.x = bbx - this.BR; b.vx *= -0.6; Sfx.play('thud'); }
      // 進球：從上往下穿過籃框
      if (!b.scored && py < H.y && b.y >= H.y && b.x > H.x - H.w / 2 + 6 && b.x < H.x + H.w / 2 - 6 && b.vy > 0) {
        b.scored = true; this.made++; this.streak++; const base = b.rimHit ? 2 : 3, bonus = Math.min(5, this.streak - 1), pts = base + bonus; this.score += pts; this.cheer = 1.4;
        Sfx.play(b.rimHit ? 'coin' : 'star'); FX.burst(H.x, H.y + 30, 20, undefined, 0.8);
        FX.text(H.x, H.y - 70, b.rimHit ? `+${pts}` : `空心！+${pts}`, b.rimHit ? '#ff7a00' : '#e0573c', b.rimHit ? 36 : 40);
        if (this.streak >= 3) FX.text(H.x, H.y - 110, `${this.streak} 連進！`, '#3d8b2a', 28);
      }
      if (b.y > this.floor - this.BR) { b.y = this.floor - this.BR; b.vy *= -0.55; b.vx *= 0.8; if (Math.abs(b.vy) > 120) Sfx.play('thud'); }
    }
    b.t += dt;
    if (b.t > 3 || b.x < -60 || b.x > V.W + 60 || (b.t > 1 && Math.abs(b.vy) < 40 && b.y > this.floor - this.BR - 2)) { if (!b.scored) this.streak = 0; this.reset(); }
  },
  draw(c) {
    // 球場
    const fl = this.floor; c.fillStyle = '#ffd9a8'; c.fillRect(-20, -20, V.W + 40, V.H + 40);
    c.fillStyle = 'rgba(255,255,255,0.4)'; for (let i = 0; i < 6; i++) c.fillRect(0, i * 70 + 20, V.W, 30);
    c.fillStyle = '#d99a5b'; c.fillRect(-20, fl, V.W + 40, V.H); c.strokeStyle = 'rgba(120,70,30,0.3)'; c.lineWidth = 2; for (let x = 0; x < V.W; x += 80) { c.beginPath(); c.moveTo(x, fl); c.lineTo(x - 40, V.H); c.stroke(); }
    const H = this.hoop, bbx = H.x + H.w / 2 + 12;
    Paper.rect(c, bbx, H.y - 140, 14, 160, '#ffffff', 4, { border: 3 });
    c.fillStyle = '#9aa0b5'; c.fillRect(bbx + 14, H.y - 60, 30, 10); c.fillRect(bbx + 40, H.y - 60, 10, fl - H.y + 60);
    // 網子
    c.strokeStyle = 'rgba(255,255,255,0.9)'; c.lineWidth = 2;
    for (let i = 0; i <= 6; i++) { const x0 = H.x - H.w / 2 + i * H.w / 6, x1 = H.x - H.w / 3 + i * H.w / 9; c.beginPath(); c.moveTo(x0, H.y); c.lineTo(x1, H.y + 60); c.stroke(); }
    for (let j = 1; j <= 3; j++) { c.beginPath(); c.moveTo(H.x - H.w / 2 + j * 5, H.y + j * 18); c.lineTo(H.x + H.w / 2 - j * 5, H.y + j * 18); c.stroke(); }
    // 紙片人
    const s = this.spot, P = Puppet.Poses, b = this.ball, aiming = this.sw.on;
    const pose = this.cheer ? P.cheer(this.t) : aiming ? { aL: 2.6, aR: 2.6, aLf: -0.4, aRf: -0.4, lL: 0.1, lR: 0.1, lLf: -0.3, lRf: -0.3, sy: 0.95 } : b.live ? P.jump(-0.5) : { aL: 2.3, aR: 2.3, aLf: 0.2, aRf: 0.2 };
    Puppet.draw(c, App.pup, s.x - 10, fl, Kid.portrait() ? 220 : 230, pose);
    // 預測路線
    if (aiming) {
      const v = this.vel(Input.x, Input.y); let x = s.x, y = s.y, vx = v.vx, vy = v.vy;
      c.fillStyle = 'rgba(224,87,60,0.7)';
      for (let i = 0; i < 22; i++) { for (let k = 0; k < 3; k++) { vy += this.G * 0.012; x += vx * 0.012; y += vy * 0.012; } c.globalAlpha = 1 - i / 22; c.beginPath(); c.arc(x, y, 5, 0, Math.PI * 2); c.fill(); }
      c.globalAlpha = 1; c.strokeStyle = 'rgba(74,53,32,0.4)'; c.setLineDash([6, 6]); c.beginPath(); c.moveTo(s.x, s.y); c.lineTo(Input.x, Input.y); c.stroke(); c.setLineDash([]);
    }
    // 球
    c.save(); c.translate(b.x, b.y); c.rotate(b.rot);
    Paper.circle(c, 0, 0, this.BR, '#e9772f', { border: 3, blur: 5 });
    c.strokeStyle = '#7a3a12'; c.lineWidth = 2; c.beginPath(); c.moveTo(-this.BR, 0); c.lineTo(this.BR, 0); c.moveTo(0, -this.BR); c.lineTo(0, this.BR); c.stroke();
    c.beginPath(); c.arc(-this.BR * 1.1, 0, this.BR * 0.8, -0.9, 0.9); c.stroke(); c.beginPath(); c.arc(this.BR * 1.1, 0, this.BR * 0.8, Math.PI - 0.9, Math.PI + 0.9); c.stroke();
    c.restore();
    // 籃框（畫在球前面）
    c.strokeStyle = '#e8453c'; c.lineWidth = 7; c.lineCap = 'round'; c.beginPath(); c.moveTo(H.x - H.w / 2, H.y); c.lineTo(H.x + H.w / 2, H.y); c.stroke();
    if (this.t < 4 && !b.live && !aiming) Kid.text(c, '👆 按住球往後拉，放開投籃', V.W / 2, V.H * 0.2, 28, '#a8574a');
  },
  hud() { return { L: `<b>${this.score}</b> 分　🏀 ${this.made}${this.streak >= 2 ? `　<span class="combo">${this.streak} 連進</span>` : ''}`, R: `⏱ ${Math.ceil(this.left)}` }; },
});
