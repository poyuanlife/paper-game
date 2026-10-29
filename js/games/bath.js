'use strict';
// 幫紙片人洗澡：紙片人玩得髒兮兮的，手指按著拿海綿刷一刷，把泥巴都洗掉。3 回合，不限時間。
registerGame({
  id: 'bath', name: '洗澎澎', icon: '🛁', color: '#3fb3c9', kid: true,
  desc: '紙片人髒兮兮的！拿海綿幫牠洗乾淨！',
  howto: '手指按住畫面拿海綿，在髒髒的泥巴上刷一刷，就會洗乾淨冒泡泡。全部洗乾淨就過關，一共 3 回合，不限時間。',
  ROUNDS: [5, 8, 11],

  start() { this.t = 0; this.score = 0; this.over = false; this.overText = '香噴噴！'; this.round = 0; this.cheer = 0; this.sp = { x: V.W * 0.8, y: V.H * 0.5 }; this.bubbles = []; this.newRound(); },
  onEnter(prev) { if (prev === 'ready') Kid.say('好髒喔！幫我洗澡'); },
  newRound() {
    const n = this.ROUNDS[this.round]; this.spots = []; this.doneT = 0; this.scrub = 0;
    for (let i = 0; i < n; i++) { const head = i % 3 === 0; this.spots.push({ head, ox: rand(-0.65, 0.65), oy: rand(-0.6, 0.6), r: rand(0.8, 1.2), dirt: 1, rot: rand(0, 6), k: Math.floor(rand(0, 3)) }); }
  },
  get PH() { return Kid.portrait() ? Math.min(V.H * 0.5, 460) : Math.min(V.H * 0.72, 480); },
  get px() { return Kid.portrait() ? V.W / 2 : V.W * 0.45; },
  get floor() { return V.H * 0.9; },
  spotPos(s) {
    const P = App.pup, A = Puppet.anchors(P);
    const c = Puppet.toScreen(P, this.PH, s.head ? A.head : A.body), k = c.k;
    const rx = s.head ? A.headR * k * 0.8 : A.bodyRx * k * 0.75, ry = s.head ? A.headR * k * 0.8 : A.bodyRy * k * 0.75;
    return { x: this.px + c.x + s.ox * rx, y: this.floor + c.y + s.oy * ry, r: Math.max(22, Math.min(rx, ry) * 0.32) * s.r };
  },
  tap(x, y) { this.sp.x = x; this.sp.y = y; },
  update(dt) {
    this.t += dt; this.cheer = Math.max(0, this.cheer - dt); this.scrub = Math.max(0, this.scrub - dt);
    if (Input.down && !this.doneT) {
      const nx = Input.x, ny = Input.y, moved = Math.hypot(nx - this.sp.x, ny - this.sp.y);
      this.sp.x = nx; this.sp.y = ny;
      for (const s of this.spots) {
        if (s.dirt <= 0) continue; const p = this.spotPos(s);
        if (Math.hypot(nx - p.x, ny - p.y) < p.r + 40) {
          s.dirt = Math.max(0, s.dirt - dt * 1.2 - moved * 0.004); this.scrub = 0.2;
          if (Math.random() < 0.5) this.bubbles.push({ x: nx + rand(-30, 30), y: ny + rand(-20, 20), r: rand(6, 16), t: 0, vx: rand(-30, 30) });
          if (s.dirt <= 0) { this.score += 10; Sfx.play('pop'); FX.burst(p.x, p.y, 8, ['#ffffff', '#bfe8ff', '#ffd6f0'], 0.5); }
        }
      }
      if (this.scrub && Math.random() < dt * 6) Sfx.play('blow');
      if (this.spots.every(s => s.dirt <= 0)) {
        this.doneT = 2.2; this.score += 30; this.cheer = 2; Sfx.play('win');
        FX.burst(this.px, this.floor - this.PH * 0.6, 36, ['#ffffff', '#bfe8ff', '#ffd23f'], 1.1); FX.text(this.px, this.floor - this.PH - 20, '好乾淨！', '#2f9ab0', 48); Kid.say('好乾淨！謝謝你！');
      }
    }
    for (const b of this.bubbles) { b.t += dt; b.y -= 40 * dt; b.x += b.vx * dt; }
    this.bubbles = this.bubbles.filter(b => b.t < 1.6);
    if (this.doneT) { this.doneT -= dt; if (this.doneT <= 0) { if (this.round + 1 >= this.ROUNDS.length) { this.over = true; return; } this.round++; this.newRound(); Kid.say('又玩髒了！'); } }
  },
  draw(c) {
    // 浴室：磁磚牆 + 浴缸
    c.fillStyle = '#dff3f7'; c.fillRect(-20, -20, V.W + 40, V.H + 40);
    c.strokeStyle = 'rgba(120,180,200,0.35)'; c.lineWidth = 2;
    for (let x = 0; x < V.W; x += 60) { c.beginPath(); c.moveTo(x, 0); c.lineTo(x, this.floor); c.stroke(); }
    for (let y = 0; y < this.floor; y += 60) { c.beginPath(); c.moveTo(0, y); c.lineTo(V.W, y); c.stroke(); }
    c.fillStyle = '#c9e6ee'; c.fillRect(-20, this.floor, V.W + 40, V.H);
    const P = Puppet.Poses, wig = this.scrub ? Math.sin(this.t * 20) * 0.08 : 0;
    const pose = this.cheer ? P.cheer(this.t) : Object.assign(P.idle(this.t), { head: wig, rot: wig * 0.4, aL: this.scrub ? 0.5 : 0.15, aR: this.scrub ? 0.5 : 0.15 });
    Puppet.draw(c, App.pup, this.px, this.floor, this.PH, pose);
    // 泥巴
    for (const s of this.spots) {
      if (s.dirt <= 0) continue; const p = this.spotPos(s);
      c.save(); c.globalAlpha = s.dirt * 0.92; c.translate(p.x, p.y); c.rotate(s.rot); c.fillStyle = ['#7a5230', '#8a5f3a', '#6b4526'][s.k];
      c.beginPath(); for (let i = 0; i < 9; i++) { const a = i / 9 * Math.PI * 2, rr = p.r * (0.75 + 0.3 * Math.sin(i * 2.3 + s.rot)); c.lineTo(Math.cos(a) * rr, Math.sin(a) * rr); } c.closePath(); c.fill();
      c.fillStyle = 'rgba(255,255,255,0.15)'; c.beginPath(); c.arc(-p.r * 0.3, -p.r * 0.3, p.r * 0.2, 0, Math.PI * 2); c.fill();
      c.restore();
    }
    // 浴缸邊
    const tw = Math.min(V.W - 20, this.PH * 1.2), tx = this.px - tw / 2, ty = this.floor - this.PH * 0.14;
    for (let i = 0; i < 9; i++) Paper.circle(c, tx + 20 + i * (tw - 40) / 8, ty + 4 + (i % 2) * 6, 16 + (i % 3) * 5, '#ffffff', { border: 0, blur: 4 });
    Paper.rect(c, tx, ty, tw, this.PH * 0.24, '#ffffff', 34, { border: 5 });
    Paper.rect(c, tx + 10, ty + 8, tw - 20, 12, '#8fd3e8', 6, { border: 0, shadow: false });
    for (const fx of [tx + 40, tx + tw - 40]) Paper.rect(c, fx - 10, ty + this.PH * 0.22, 20, 18, '#c9a24b', 6, { border: 3, blur: 3 });
    for (const b of this.bubbles) { c.globalAlpha = 1 - b.t / 1.6; c.strokeStyle = '#ffffff'; c.fillStyle = 'rgba(255,255,255,0.45)'; c.lineWidth = 2; c.beginPath(); c.arc(b.x, b.y, b.r, 0, Math.PI * 2); c.fill(); c.stroke(); c.globalAlpha = 1; }
    // 海綿
    const sx = this.sp.x, sy = this.sp.y, w = this.scrub ? Math.sin(this.t * 30) * 0.15 : 0;
    c.save(); c.translate(sx, sy); c.rotate(w - 0.2);
    Paper.rect(c, -42, -28, 84, 56, '#ffd23f', 14, { border: 4 });
    Paper.rect(c, -42, 12, 84, 16, '#45ad4a', 6, { border: 0, shadow: false });
    c.fillStyle = 'rgba(200,150,0,0.35)'; for (let i = 0; i < 6; i++) { c.beginPath(); c.arc(-28 + i * 11, -10 + (i % 2) * 10, 3.5, 0, Math.PI * 2); c.fill(); }
    c.restore();
    if (this.t < 3.5 && !Input.down) Kid.text(c, '👆 按住刷一刷泥巴', V.W / 2, Kid.portrait() ? 130 : 90, 30, '#2f9ab0');
  },
  hud() { const left = this.spots.filter(s => s.dirt > 0).length; return { L: `<b>${this.score}</b> 分`, R: `第 ${this.round + 1} / ${this.ROUNDS.length} 回　🟤 ${left}` }; },
});
