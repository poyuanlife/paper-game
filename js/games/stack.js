'use strict';
// 疊疊紙片人：紙片人躺著被曬衣夾夾著，在上面左右晃。點一下放開，疊在下面那個的上面。歪太多會掉下去。
registerGame({
  id: 'stack', name: '疊疊紙片人', icon: '🗼', color: '#2fb39a',
  desc: '把紙片人一個一個疊上去，疊到天上去！',
  howto: '紙片人會在上面左右晃，點一下畫面（或空白鍵）放下去。要疊在下面那個的上面，歪太多會掉下去。放在正中間是 PERFECT，連續 PERFECT 加分更多！掉 3 個就結束。',

  start() {
    this.t = 0; this.score = 0; this.lives = 3; this.over = false; this.overText = '塔倒了！';
    this.tower = []; this.falling = []; this.cam = 0; this.cur = null; this.wait = 0.5; this.dir = 1; this.perfect = 0; this.endT = 0;
    this.stars = Array.from({ length: 60 }, () => ({ x: Math.random(), y: Math.random(), r: rand(1, 2.6), p: rand(0, 6) }));
  },
  get L() { return Math.min(V.W * 0.44, 250); },                 // 紙片人躺著的長度
  get T() {                                                       // 一層的厚度
    const P = App.pup;
    if (P.kind === 'pet') { const s = Puppet.size(P, 100); return clamp(s.h * this.L / s.w * 0.82, this.L * 0.25, this.L * 0.6); }
    const k = this.L / P.H, sw = Math.abs(P.J.shR.x - P.J.shL.x) * k;
    return clamp(sw * 1.3, this.L * 0.2, this.L * 0.3);
  },
  get ground() { return V.H * 0.9; },
  get baseTop() { return this.ground - 46; },
  get topY() { return this.baseTop - this.tower.length * this.T; }, // 塔頂（世界座標）
  get floors() { return this.tower.length; },

  POSES: [
    { aL: 0.1, aR: 0.1 },
    { aL: 2.9, aR: 2.9, aLf: 0, aRf: 0 },
    { aL: 2.7, aLf: 1.6, aR: 0.15, lL: 0.15, lLf: -0.5 },
    { aL: 0.4, aR: 0.4, aLf: 1.4, aRf: 1.4, lR: 0.35, lRf: -0.9 },
    { aL: 1.4, aR: 2.6, aLf: 0.6, aRf: -0.3, lL: 0.2, lR: 0.1 },
  ],

  spawn() {
    const amp = clamp(V.W / 2 - this.L * 0.55, 40, 330);
    this.cur = { x: V.W / 2, y: 0, ph: rand(0, Math.PI * 2), amp, st: 'hang', vy: 0, dir: this.dir, pose: pick(this.POSES), wig: rand(0, 6) };
    this.dir = -this.dir;
  },
  hookY() { return this.topY - Math.max(200, V.H * 0.3); },

  tap() {
    const c = this.cur; if (!c || c.st !== 'hang' || this.lives <= 0) return;
    c.st = 'drop'; c.vy = 0; Sfx.play('jump');
  },
  key(k) { if (k === 'space' || k === 'arrowdown' || k === 's' || k === 'enter') this.tap(); },

  land(c) {
    const L = this.L, T = this.T, top = this.tower[this.tower.length - 1], sx = top ? top.x : V.W / 2, dx = c.x - sx;
    if (Math.abs(dx) < L * 0.5) {
      const perfect = Math.abs(dx) < L * 0.05;
      if (perfect) { c.x = sx; this.perfect++; } else this.perfect = 0;
      const pts = 10 + (perfect ? 10 * Math.min(this.perfect, 5) : 0);
      this.tower.push({ x: c.x, dir: c.dir, pose: c.pose, sq: 1 });
      this.score += pts;
      const y = this.topY + this.cam;
      if (perfect) { Sfx.play('star'); FX.text(c.x, y - 40, this.perfect > 1 ? `PERFECT ×${this.perfect}` : 'PERFECT!', '#ff4fa3', 34); FX.burst(c.x, y, 18, undefined, 0.8); }
      else { Sfx.play('catch'); FX.text(c.x, y - 40, '+' + pts, '#2f8f6a', 28); FX.burst(c.x, y + T, 8, ['#fffdf5', '#e9d9b6'], 0.5); }
      if (this.floors % 10 === 0) { FX.text(V.W / 2, V.H * 0.3, `${this.floors} 層！`, '#e0573c', 50); Sfx.play('win'); }
      this.cur = null; this.wait = 0.35;
    } else {
      // 掉下去：超出的那一邊比較重，整個翻下去
      const side = Math.sign(dx) || 1, partly = Math.abs(dx) < L;
      this.falling.push({ x: c.x, y: c.y, vx: side * (partly ? 160 : 40), vy: partly ? -120 : c.vy, rot: 0, spin: side * (partly ? 4 : 1.5), dir: c.dir, pose: c.pose });
      this.lives--; this.perfect = 0; Sfx.play('hit'); V.shake = 8;
      FX.text(c.x, this.topY + this.cam - 50, pick(['哇啊啊～', '救命～', '掉了！', '不～～']), '#d9452b', 30);
      this.cur = null; this.wait = 0.7;
      if (this.lives <= 0) this.endT = 1.4;
    }
  },

  update(dt) {
    this.t += dt;
    if (this.endT) { this.endT -= dt; if (this.endT <= 0) { this.over = true; return; } }
    if (!this.cur && this.lives > 0) { this.wait -= dt; if (this.wait <= 0) this.spawn(); }
    const c = this.cur;
    if (c) {
      if (c.st === 'hang') {
        const sp = 1.5 + Math.min(this.floors, 30) * 0.075;
        c.ph += sp * dt; c.x = V.W / 2 + Math.sin(c.ph) * c.amp; c.y = this.hookY();
      } else {
        c.vy += 2600 * dt; c.y += c.vy * dt;
        if (c.y + this.T / 2 >= this.topY) { c.y = this.topY - this.T / 2; this.land(c); }
      }
    }
    for (const f of this.falling) { f.vy += 2200 * dt; f.x += f.vx * dt; f.y += f.vy * dt; f.rot += f.spin * dt; }
    this.falling = this.falling.filter(f => f.y + this.cam < V.H + 400);
    for (const p of this.tower) p.sq += (1 - p.sq) * Math.min(1, dt * 10);
    // 鏡頭跟著塔頂往上
    const want = Math.max(0, V.H * 0.58 - this.topY);
    this.cam += (want - this.cam) * Math.min(1, dt * 3);
  },

  // 躺著的紙片人：(x, y) = 身體中心，dir = 1 頭朝右、-1 頭朝左
  drawPiece(c, x, y, dir, pose, rot = 0, extra = {}) {
    const L = this.L, P = App.pup;
    if (P.kind === 'pet') {
      // 寵物本來就是橫的：不用轉 90 度，用左右翻面代替；吊著、掉下去的時候四隻腳亂划
      const s = Puppet.size(P, 100), hp = 100 * L / s.w, h = s.h * L / s.w;
      const wild = extra.wild, pp = wild ? Puppet.Poses.run(this.t * 1.6) : {};
      c.save(); c.translate(x, y); c.rotate(rot);
      Puppet.draw(c, P, 0, h / 2, hp, Object.assign(pp, { sx: dir, sy: extra.sy == null ? 1 : extra.sy }));
      c.restore(); return;
    }
    c.save(); c.translate(x, y); c.rotate(dir * Math.PI / 2 + rot);
    Puppet.draw(c, App.pup, 0, L / 2, L, Object.assign({}, pose, extra), { shadow: true });
    c.restore();
  },

  draw(c) {
    const cam = this.cam, h = cam / V.H;            // 越高：白天 → 黃昏 → 晚上 → 外太空
    const SKY = [['#9fd8ef', '#e8f6e9'], ['#ffa27a', '#ffe0a8'], ['#2a2766', '#6a4a8f'], ['#06071c', '#1c1745']];
    const u = clamp(h / 2.2, 0, SKY.length - 1), i0 = Math.min(SKY.length - 2, Math.floor(u)), f = u - i0;
    const mixC = (a, b) => { const A = parseInt(a.slice(1), 16), B = parseInt(b.slice(1), 16); return `rgb(${[16, 8, 0].map(s => Math.round(((A >> s) & 255) * (1 - f) + ((B >> s) & 255) * f)).join(',')})`; };
    const g = c.createLinearGradient(0, 0, 0, V.H); g.addColorStop(0, mixC(SKY[i0][0], SKY[i0 + 1][0])); g.addColorStop(1, mixC(SKY[i0][1], SKY[i0 + 1][1]));
    c.fillStyle = g; c.fillRect(-20, -20, V.W + 40, V.H + 40);
    const night = clamp(u - 1.3, 0, 1);
    if (night) {
      for (const s of this.stars) { c.globalAlpha = night * (0.6 + 0.4 * Math.sin(this.t * 2 + s.p)); c.fillStyle = '#fff8d0'; c.beginPath(); c.arc(s.x * V.W, (s.y * V.H + cam * 0.05) % V.H, s.r, 0, Math.PI * 2); c.fill(); }
      c.globalAlpha = 1;
    }
    // 雲（越往上越少）和遠方的山（跟著鏡頭慢慢往下沉）
    if (!this.clouds) this.clouds = Array.from({ length: 24 }, (_, i) => ({ x: Math.random(), y: 260 + i * 330 + rand(-80, 80), s: rand(0.6, 1.1) }));
    for (const cl of this.clouds) {
      const y = this.ground - cl.y + cam * 0.6; if (y < -120 || y > V.H + 40) continue;
      const x = ((cl.x * (V.W + 300) + this.t * 10 * cl.s) % (V.W + 300)) - 150;
      c.globalAlpha = 1 - night * 0.6;
      for (const [dx, dy, r] of [[0, 0, 34], [36, -14, 40], [76, 0, 30]]) Paper.circle(c, x + dx * cl.s, y + dy * cl.s, r * cl.s, '#ffffff', { border: 3, blur: 6, shadowColor: 'rgba(40,70,120,0.15)' });
      c.globalAlpha = 1;
    }
    for (const [k, col, amp, n] of [[0.5, '#9fcf7e', 50, 2], [0.75, '#7dbb5c', 34, 3]]) {
      const base = this.ground - 60 + cam * k; if (base - amp > V.H) continue;
      Paper.shape(c, cc => { cc.moveTo(-20, V.H + 30); for (let x = -20; x <= V.W + 20; x += 12) cc.lineTo(x, base - Math.sin(x / V.W * Math.PI * n + k * 5) * amp - amp); cc.lineTo(V.W + 20, V.H + 30); cc.closePath(); }, col, { border: 4, blur: 6, oy: -2 });
    }
    // 掉下去的（在地面後面，像掉到懸崖下）
    for (const f of this.falling) this.drawPiece(c, f.x, f.y + cam, f.dir, Object.assign({}, f.pose, { aL: 2.6, aR: 2.6, lL: 0.4, lR: 0.4 }), f.rot, { wild: 1 });
    // 地面 + 底座
    const gy = this.ground + cam;
    if (gy < V.H + 40) {
      c.fillStyle = '#c99b62'; c.fillRect(-20, gy, V.W + 40, V.H + 40);
      Paper.rect(c, -20, gy - 8, V.W + 40, 18, '#5fa344', 4, { blur: 4 });
      Paper.rect(c, V.W / 2 - this.L * 0.55, this.baseTop + cam, this.L * 1.1, 52, '#d9a066', 8, { border: 5 });
      c.fillStyle = 'rgba(120,70,20,0.25)'; c.fillRect(V.W / 2 - this.L * 0.55 + 10, this.baseTop + cam + 20, this.L * 1.1 - 20, 6);
    }
    // 塔：越高越會晃
    const n = this.tower.length, T = this.T, sway = Math.min(10, n * 0.4) * Math.sin(this.t * 1.7);
    this.tower.forEach((p, i) => {
      const y = this.baseTop - T * (i + 0.5) + cam; if (y < -200 || y > V.H + 200) return;
      const off = n > 1 ? sway * Math.pow(i / (n - 1), 2) : 0;
      this.drawPiece(c, p.x + off, y, p.dir, p.pose, 0, { sy: p.sq });
    });
    // 吊著的
    const cu = this.cur;
    if (cu) {
      const y = cu.y + cam;
      if (cu.st === 'hang') {
        c.strokeStyle = '#7a5a3a'; c.lineWidth = 3; c.beginPath(); c.moveTo(cu.x, -20); c.lineTo(cu.x, y - T / 2 - 8); c.stroke();
        Paper.rect(c, cu.x - 7, y - T / 2 - 26, 14, 30, '#e8b04a', 3, { border: 3, blur: 3 });   // 曬衣夾
        const w = Math.sin(this.t * 9 + cu.wig);
        this.drawPiece(c, cu.x, y, cu.dir, { aL: 2.4 + 0.4 * w, aR: 2.4 - 0.4 * w, aLf: 0.4, aRf: 0.4, lL: 0.25 * w, lR: -0.25 * w, lLf: -0.5, lRf: -0.5 }, Math.sin(this.t * 3) * 0.04, { wild: 1 });
        // 下面的落點提示
        c.globalAlpha = 0.25; c.fillStyle = '#fff'; c.fillRect(cu.x - 1.5, y + T / 2 + 8, 3, Math.max(0, this.topY + cam - y - T / 2 - 8)); c.globalAlpha = 1;
      } else this.drawPiece(c, cu.x, y, cu.dir, Object.assign({}, cu.pose, { aL: 2.6, aR: 2.6 }), 0, { wild: 1 });
    }
  },
  hud() {
    const hearts = '❤️'.repeat(Math.max(0, this.lives)) + '🤍'.repeat(Math.max(0, 3 - this.lives));
    return { L: `<b>${this.score}</b> 分`, R: `${this.floors} 層　${hearts}` };
  },
});
