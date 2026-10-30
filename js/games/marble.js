'use strict';
// 彈珠滾滾：傾斜手機讓彈珠（裡面是紙片人的頭）沿著沒有邊框的空中軌道滾到終點。掉下去就回到上一個旗子。5 關。
registerGame({
  id: 'marble', name: '彈珠滾滾', icon: '🔮', color: '#5b6fd6', tilt: true,
  desc: '傾斜手機讓彈珠滾過空中軌道！（手機限定）',
  howto: '📱 手機限定：傾斜手機，彈珠就會往那邊滾。軌道沒有邊框，滾出去會掉下去，回到上一個 🚩 旗子重來。吃 ⭐ 加分，越快到 🏁 終點分數越多。藍色的冰面很滑！一共 5 關。（電腦可以用方向鍵試玩）',
  LEVELS: 5, R: 20,

  start() { this.t = 0; this.score = 0; this.over = false; this.overText = '全部過關！'; this.level = 0; this.falls = 0; this.newLevel(); },
  newLevel() {
    const lv = this.level, n = 8 + lv * 3, nodes = [{ x: 0, y: 0, w: 180, cp: true }]; let a = -Math.PI / 2;
    for (let i = 1; i <= n; i++) {
      a = clamp(a + rand(-0.9, 0.9) * (0.7 + lv * 0.1), -Math.PI / 2 - 1.25, -Math.PI / 2 + 1.25);
      const p = nodes[i - 1], len = rand(170, 250), last = i === n;
      nodes.push({ x: p.x + Math.cos(a) * len, y: p.y + Math.sin(a) * len, w: last ? 190 : clamp(150 - lv * 15 + rand(-25, 15), 58, 170), cp: !last && i % 3 === 0, ice: lv >= 1 && !last && Math.random() < 0.12 + lv * 0.05 });
    }
    this.nodes = nodes; this.goal = nodes[n];
    this.stars = [];
    for (let i = 1; i < nodes.length; i++) if (Math.random() < 0.75) {
      const A = nodes[i - 1], B = nodes[i], t = rand(0.3, 0.7), dx = B.x - A.x, dy = B.y - A.y, L = Math.hypot(dx, dy), off = rand(-0.28, 0.28) * Math.min(A.w, B.w);
      this.stars.push({ x: A.x + dx * t - dy / L * off, y: A.y + dy * t + dx / L * off, got: false });
    }
    this.cp = nodes[0]; nodes[0].hit = true; this.lt = 0; this.lfalls = 0; this.doneT = 0;
    this.ball = { x: 0, y: 0, vx: 0, vy: 0, fall: 0, roll: 0 }; this.cam = { x: 0, y: -120 };
  },
  // 彈珠在不在軌道上：離某一段的中線夠近就算
  onTrack(x, y) {
    const N = this.nodes; let ice = false, on = false;
    for (let i = 1; i < N.length; i++) {
      const A = N[i - 1], B = N[i], dx = B.x - A.x, dy = B.y - A.y, L2 = dx * dx + dy * dy, t = clamp(((x - A.x) * dx + (y - A.y) * dy) / L2, 0, 1);
      const d = Math.hypot(x - (A.x + dx * t), y - (A.y + dy * t)), w = A.w + (B.w - A.w) * t;
      if (d <= w / 2) { on = true; if (B.ice) ice = true; }
    }
    return on ? (ice ? 'ice' : 'on') : false;
  },
  tap() { Tilt.calibrate(); },
  update(dt) {
    this.t += dt; const b = this.ball;
    if (this.doneT) {
      this.doneT -= dt; b.vx *= 0.9; b.vy *= 0.9;
      if (this.doneT <= 0) { if (this.level + 1 >= this.LEVELS) { this.over = true; return; } this.level++; this.newLevel(); FX.text(V.W / 2, V.H * 0.3, `第 ${this.level + 1} 關`, '#3f5bd6', 48); }
      return;
    }
    this.lt += dt;
    if (b.fall) {
      b.fall += dt;
      if (b.fall > 0.9) { Object.assign(b, { x: this.cp.x, y: this.cp.y, vx: 0, vy: 0, fall: 0 }); }
      return;
    }
    const surf = this.onTrack(b.x, b.y), acc = 950, fr = surf === 'ice' ? 0.15 : 1.1;
    b.vx += Tilt.x * acc * dt; b.vy += Tilt.y * acc * dt;
    b.vx *= Math.max(0, 1 - fr * dt); b.vy *= Math.max(0, 1 - fr * dt);
    const sp = Math.hypot(b.vx, b.vy), max = 560; if (sp > max) { b.vx *= max / sp; b.vy *= max / sp; }
    b.x += b.vx * dt; b.y += b.vy * dt; b.roll += sp * dt / this.R;
    if (!this.onTrack(b.x, b.y)) { b.fall = 0.001; this.falls++; this.lfalls++; Sfx.play('whiff'); setTimeout(() => Sfx.play('thud'), 400); return; }
    for (const n of this.nodes) if (n.cp && !n.hit && Math.hypot(b.x - n.x, b.y - n.y) < n.w / 2) { n.hit = true; this.cp = n; Sfx.play('coin'); const s = this.toScreen(n.x, n.y); FX.text(s.x, s.y - 50, '存檔！', '#45ad4a', 28); }
    for (const s of this.stars) if (!s.got && Math.hypot(b.x - s.x, b.y - s.y) < this.R + 16) { s.got = true; this.score += 10; Sfx.play('star'); const p = this.toScreen(s.x, s.y); FX.burst(p.x, p.y, 10, ['#ffd23f', '#fff6c8'], 0.5); }
    const g = this.goal;
    if (Math.hypot(b.x - g.x, b.y - g.y) < g.w * 0.3) {
      const bonus = Math.max(20, Math.round(150 - this.lt * 3 - this.lfalls * 10)); this.score += bonus; this.doneT = 2; Sfx.play('win');
      FX.burst(V.W / 2, V.H / 2, 40, undefined, 1.2); FX.text(V.W / 2, V.H * 0.38, '到終點了！', '#ffd23f', 48); FX.text(V.W / 2, V.H * 0.46, `+${bonus}`, '#e0573c', 34);
    }
  },
  get zoom() { return Math.min(V.W, V.H) / 600; },
  toScreen(x, y) { const z = this.zoom; return { x: V.W / 2 + (x - this.cam.x) * z, y: V.H * 0.58 + (y - this.cam.y) * z }; },
  draw(c, dt) {
    const b = this.ball, z = this.zoom, cam = this.cam;
    if (dt) { cam.x += (b.x + b.vx * 0.25 - cam.x) * Math.min(1, dt * 4); cam.y += (b.y + b.vy * 0.25 - 60 - cam.y) * Math.min(1, dt * 4); }
    // 天空：往下看到很遠的雲
    const g = c.createLinearGradient(0, 0, 0, V.H); g.addColorStop(0, '#5e8fe0'); g.addColorStop(1, '#a9d6f5'); c.fillStyle = g; c.fillRect(-20, -20, V.W + 40, V.H + 40);
    for (let i = 0; i < 9; i++) { const px = (((i * 263 - cam.x * 0.25) % (V.W + 300)) + V.W + 300) % (V.W + 300) - 150, py = (((i * 181 - cam.y * 0.25) % (V.H + 300)) + V.H + 300) % (V.H + 300) - 150; c.fillStyle = 'rgba(255,255,255,0.35)'; c.beginPath(); c.ellipse(px, py, 90, 34, 0, 0, Math.PI * 2); c.fill(); }
    c.save(); c.translate(V.W / 2, V.H * 0.58); c.scale(z, z); c.translate(-cam.x, -cam.y);
    const N = this.nodes, seg = (i, w, col) => { const A = N[i - 1], B = N[i]; c.strokeStyle = col; c.lineWidth = w; c.beginPath(); c.moveTo(A.x, A.y); c.lineTo(B.x, B.y); c.stroke(); };
    c.lineCap = 'round'; c.lineJoin = 'round';
    c.save(); c.translate(10, 22); for (let i = 1; i < N.length; i++) seg(i, (N[i - 1].w + N[i].w) / 2, 'rgba(30,50,110,0.25)'); c.restore();   // 影子
    for (let i = 1; i < N.length; i++) seg(i, (N[i - 1].w + N[i].w) / 2 + 12, '#fffdf5');
    for (let i = 1; i < N.length; i++) seg(i, (N[i - 1].w + N[i].w) / 2, N[i].ice ? '#bfe8ff' : '#f2c78a');
    c.setLineDash([18, 22]); for (let i = 1; i < N.length; i++) seg(i, 4, N[i].ice ? 'rgba(255,255,255,0.8)' : 'rgba(160,100,40,0.35)'); c.setLineDash([]);
    for (const n of N) if (n.cp && n !== N[0]) { Kid.emoji(c, n.hit ? '✅' : '🚩', n.x + n.w * 0.32, n.y - 18, 34); }
    // 終點：棋盤格圓盤
    const G = this.goal; c.save(); c.beginPath(); c.arc(G.x, G.y, G.w * 0.32, 0, Math.PI * 2); c.clip();
    for (let yy = -4; yy < 4; yy++) for (let xx = -4; xx < 4; xx++) { c.fillStyle = (xx + yy) & 1 ? '#222' : '#fff'; c.fillRect(G.x + xx * 16, G.y + yy * 16, 16, 16); }
    c.restore(); Kid.emoji(c, '🏁', G.x + 30, G.y - 50, 48);
    for (const s of this.stars) if (!s.got) Kid.emoji(c, '⭐', s.x, s.y, 30, Math.sin(this.t * 3 + s.x) * 0.3);
    // 彈珠
    const fall = b.fall, sc = fall ? Math.max(0.05, 1 - fall * 1.1) : 1, R = this.R;
    c.save(); c.translate(b.x, b.y + (fall ? fall * 60 : 0)); c.scale(sc, sc); c.globalAlpha = fall ? Math.max(0, 1 - fall) : 1;
    c.fillStyle = 'rgba(30,50,110,0.25)'; c.beginPath(); c.ellipse(4, R * 0.8, R * 0.9, R * 0.35, 0, 0, Math.PI * 2); c.fill();
    Paper.circle(c, 0, 0, R, '#dff3ff', { border: 3, blur: 6 });
    Kid.head(c, Math.sin(b.roll) * R * 0.25, Math.cos(b.roll * 0.7) * R * 0.15, R * 0.62, {}, R - 2);
    const hg = c.createRadialGradient(-R * 0.35, -R * 0.4, 1, 0, 0, R); hg.addColorStop(0, 'rgba(255,255,255,0.75)'); hg.addColorStop(0.4, 'rgba(255,255,255,0.08)'); hg.addColorStop(1, 'rgba(120,170,255,0.35)');
    c.fillStyle = hg; c.beginPath(); c.arc(0, 0, R, 0, Math.PI * 2); c.fill();
    c.restore();
    c.restore();
    // 傾斜指示器
    const ix = V.W - 60, iy = V.H - 70; Paper.circle(c, ix, iy, 34, 'rgba(255,253,245,0.85)', { border: 3, blur: 4 }); Paper.circle(c, ix + Tilt.x * 24, iy + Tilt.y * 24, 10, '#5b6fd6', { border: 2, blur: 2 });
    if (this.t < 5 || (!Tilt.active && this.t < 12)) Kid.text(c, Tilt.hint(), V.W / 2, V.H - 26, 18, '#2a2a33', 6);
    if (b.fall && b.fall < 0.8) Kid.text(c, '掉下去了！', V.W / 2, V.H * 0.3, 40, '#3f5bd6');
  },
  hud() { return { L: `<b>${this.score}</b> 分　第 ${this.level + 1} / ${this.LEVELS} 關`, R: `⏱ ${Math.floor(this.lt)}　💧 ${this.falls}` }; },
});
