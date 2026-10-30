'use strict';
// 洞洞迷宮：傾斜手機讓小球在木頭迷宮裡滾，避開黑色的洞，滾進綠色的終點洞。3 關，越來越大。
registerGame({
  id: 'maze', name: '洞洞迷宮', icon: '🕳️', color: '#a8774a', tilt: true,
  desc: '傾斜手機走迷宮，小心不要掉進洞裡！（手機限定）',
  howto: '📱 手機限定：傾斜手機讓小球在迷宮裡滾動，避開黑色的洞（掉進去會回到起點），滾進綠色的洞就過關。吃 ⭐ 加分，越快過關分數越多。一共 3 關。（電腦可以用方向鍵試玩）',
  LEVELS: [[5, 7], [6, 9], [7, 11]],

  start() { this.t = 0; this.score = 0; this.over = false; this.overText = '迷宮大師！'; this.level = 0; this.falls = 0; this.newLevel(); },
  newLevel() {
    let [cols, rows] = this.LEVELS[this.level]; if (!Kid.portrait()) [cols, rows] = [rows, cols];
    this.cols = cols; this.rows = rows;
    // 迷宮：深度優先挖路
    const W = []; for (let i = 0; i < cols * rows; i++) W.push({ n: 1, e: 1, s: 1, w: 1, seen: 0 });
    const st = [0]; W[0].seen = 1;
    while (st.length) {
      const i = st[st.length - 1], x = i % cols, y = Math.floor(i / cols), nb = [];
      if (y > 0 && !W[i - cols].seen) nb.push(['n', i - cols, 's']); if (x < cols - 1 && !W[i + 1].seen) nb.push(['e', i + 1, 'w']);
      if (y < rows - 1 && !W[i + cols].seen) nb.push(['s', i + cols, 'n']); if (x > 0 && !W[i - 1].seen) nb.push(['w', i - 1, 'e']);
      if (!nb.length) { st.pop(); continue; }
      const [d, j, o] = pick(nb); W[i][d] = 0; W[j][o] = 0; W[j].seen = 1; st.push(j);
    }
    this.cells = W;
    // 找出起點到終點的路，洞只放在不是正確路線的格子
    const goal = cols * rows - 1, prev = new Array(cols * rows).fill(-1), q = [0]; prev[0] = 0;
    while (q.length) { const i = q.shift(), x = i % cols; for (const [d, j] of [['n', i - cols], ['e', i + 1], ['s', i + cols], ['w', i - 1]]) if (!W[i][d] && prev[j] < 0 && !(d === 'e' && x === cols - 1) && !(d === 'w' && x === 0)) { prev[j] = i; q.push(j); } }
    const path = new Set(); for (let i = goal; i !== 0; i = prev[i]) path.add(i); path.add(0);
    const off = [...Array(cols * rows).keys()].filter(i => !path.has(i) && i !== 0);
    this.holes = Kid.shuffle(off).slice(0, Math.min(off.length, 3 + this.level * 3)).map(i => ({ i, ox: rand(-0.15, 0.15), oy: rand(-0.15, 0.15) }));
    this.stars = Kid.shuffle([...path].filter(i => i && i !== goal)).slice(0, 3 + this.level).map(i => ({ i, got: false }));
    this.goalI = goal; this.ball = { x: 0.5, y: 0.5, vx: 0, vy: 0, fall: 0 }; this.lt = 0; this.doneT = 0;
  },
  layout() {
    const P = Kid.portrait(), top = P ? 120 : 70, cs = Math.min((V.W - 30) / this.cols, (V.H - top - (P ? 70 : 30)) / this.rows);
    return { cs, ox: V.W / 2 - cs * this.cols / 2, oy: top };
  },
  tap() { Tilt.calibrate(); },
  update(dt) {
    this.t += dt; const b = this.ball;
    if (this.doneT) { this.doneT -= dt; if (this.doneT <= 0) { if (this.level + 1 >= this.LEVELS.length) { this.over = true; return; } this.level++; this.newLevel(); } return; }
    this.lt += dt;
    if (b.fall) { b.fall += dt; if (b.fall > 0.8) Object.assign(b, { x: 0.5, y: 0.5, vx: 0, vy: 0, fall: 0 }); return; }
    // 單位：一格 = 1
    const R = 0.28, acc = 14, wt = 0.08;
    b.vx += Tilt.x * acc * dt; b.vy += Tilt.y * acc * dt; b.vx *= 1 - 0.9 * dt; b.vy *= 1 - 0.9 * dt;
    const sp = Math.hypot(b.vx, b.vy); if (sp > 9) { b.vx *= 9 / sp; b.vy *= 9 / sp; }
    const steps = 4;
    for (let s = 0; s < steps; s++) {
      b.x += b.vx * dt / steps; b.y += b.vy * dt / steps;
      b.x = clamp(b.x, R + wt, this.cols - R - wt); b.y = clamp(b.y, R + wt, this.rows - R - wt);
      if (b.x <= R + wt || b.x >= this.cols - R - wt) b.vx *= -0.3; if (b.y <= R + wt || b.y >= this.rows - R - wt) b.vy *= -0.3;
      // 牆壁：檢查附近的格子
      const cx = Math.floor(b.x), cy = Math.floor(b.y);
      for (let yy = cy - 1; yy <= cy + 1; yy++) for (let xx = cx - 1; xx <= cx + 1; xx++) {
        if (xx < 0 || yy < 0 || xx >= this.cols || yy >= this.rows) continue;
        const C = this.cells[yy * this.cols + xx], rects = [];
        if (C.n) rects.push([xx - wt, yy - wt, xx + 1 + wt, yy + wt]); if (C.s) rects.push([xx - wt, yy + 1 - wt, xx + 1 + wt, yy + 1 + wt]);
        if (C.w) rects.push([xx - wt, yy - wt, xx + wt, yy + 1 + wt]); if (C.e) rects.push([xx + 1 - wt, yy - wt, xx + 1 + wt, yy + 1 + wt]);
        for (const [x0, y0, x1, y1] of rects) {
          const px = clamp(b.x, x0, x1), py = clamp(b.y, y0, y1), dx = b.x - px, dy = b.y - py, d = Math.hypot(dx, dy);
          if (d < R && d > 1e-6) { const nx = dx / d, ny = dy / d, pen = R - d; b.x += nx * pen; b.y += ny * pen; const vn = b.vx * nx + b.vy * ny; if (vn < 0) { b.vx -= 1.3 * vn * nx; b.vy -= 1.3 * vn * ny; if (vn < -3) Sfx.play('thud'); } }
        }
      }
    }
    const L = this.layout(), scr = (x, y) => ({ x: L.ox + x * L.cs, y: L.oy + y * L.cs });
    for (const h of this.holes) { const hx = h.i % this.cols + 0.5 + h.ox, hy = Math.floor(h.i / this.cols) + 0.5 + h.oy; if (Math.hypot(b.x - hx, b.y - hy) < 0.22) { b.fall = 0.001; b.x = hx; b.y = hy; this.falls++; Sfx.play('whiff'); const p = scr(hx, hy); FX.text(p.x, p.y - 30, '掉進洞裡了！', '#e8453c', 26); return; } }
    for (const s of this.stars) { const sx = s.i % this.cols + 0.5, sy = Math.floor(s.i / this.cols) + 0.5; if (!s.got && Math.hypot(b.x - sx, b.y - sy) < 0.45) { s.got = true; this.score += 10; Sfx.play('star'); const p = scr(sx, sy); FX.burst(p.x, p.y, 10, ['#ffd23f', '#fff'], 0.5); } }
    const gx = this.goalI % this.cols + 0.5, gy = Math.floor(this.goalI / this.cols) + 0.5;
    if (Math.hypot(b.x - gx, b.y - gy) < 0.3) {
      const bonus = Math.max(20, Math.round(120 + this.level * 40 - this.lt * 2)); this.score += bonus; this.doneT = 2; b.fall = 0.001; b.x = gx; b.y = gy; Sfx.play('win');
      const p = scr(gx, gy); FX.burst(p.x, p.y, 36, undefined, 1); FX.text(V.W / 2, V.H * 0.4, `過關！+${bonus}`, '#45ad4a', 46);
    }
  },
  draw(c) {
    c.fillStyle = '#5a3d22'; c.fillRect(-20, -20, V.W + 40, V.H + 40);
    const L = this.layout(), cs = L.cs, W = this.cols * cs, H = this.rows * cs;
    Paper.rect(c, L.ox - 12, L.oy - 12, W + 24, H + 24, '#8a5a34', 14, { border: 5, blur: 14 });
    c.fillStyle = '#e9c48a'; c.fillRect(L.ox, L.oy, W, H);
    c.strokeStyle = 'rgba(160,110,50,0.18)'; c.lineWidth = 2; for (let y = 6; y < H; y += 14) { c.beginPath(); c.moveTo(L.ox, L.oy + y); c.bezierCurveTo(L.ox + W * 0.3, L.oy + y + 6, L.ox + W * 0.7, L.oy + y - 6, L.ox + W, L.oy + y); c.stroke(); }
    const P = (x, y) => ({ x: L.ox + x * cs, y: L.oy + y * cs });
    // 洞、終點、星星
    for (const h of this.holes) { const p = P(h.i % this.cols + 0.5 + h.ox, Math.floor(h.i / this.cols) + 0.5 + h.oy); const g = c.createRadialGradient(p.x, p.y, 1, p.x, p.y, cs * 0.3); g.addColorStop(0, '#000'); g.addColorStop(1, '#3a2614'); c.fillStyle = g; c.beginPath(); c.arc(p.x, p.y, cs * 0.3, 0, Math.PI * 2); c.fill(); }
    const gp = P(this.goalI % this.cols + 0.5, Math.floor(this.goalI / this.cols) + 0.5);
    c.fillStyle = '#2f8a3a'; c.beginPath(); c.arc(gp.x, gp.y, cs * 0.34, 0, Math.PI * 2); c.fill(); c.strokeStyle = '#ffd23f'; c.lineWidth = 4; c.stroke(); Kid.emoji(c, '🏁', gp.x + cs * 0.25, gp.y - cs * 0.3, cs * 0.45);
    for (const s of this.stars) if (!s.got) { const p = P(s.i % this.cols + 0.5, Math.floor(s.i / this.cols) + 0.5); Kid.emoji(c, '⭐', p.x, p.y, cs * 0.42); }
    // 牆
    const wt = 0.08 * cs; c.fillStyle = '#7a4a22';
    for (let i = 0; i < this.cells.length; i++) {
      const C = this.cells[i], x = i % this.cols, y = Math.floor(i / this.cols), p = P(x, y);
      if (C.n) c.fillRect(p.x - wt, p.y - wt, cs + wt * 2, wt * 2); if (C.w) c.fillRect(p.x - wt, p.y - wt, wt * 2, cs + wt * 2);
      if (C.s) c.fillRect(p.x - wt, p.y + cs - wt, cs + wt * 2, wt * 2); if (C.e) c.fillRect(p.x + cs - wt, p.y - wt, wt * 2, cs + wt * 2);
    }
    c.fillStyle = 'rgba(255,230,180,0.35)';
    for (let i = 0; i < this.cells.length; i++) { const C = this.cells[i], p = P(i % this.cols, Math.floor(i / this.cols)); if (C.n) c.fillRect(p.x - wt, p.y - wt, cs + wt * 2, wt * 0.6); if (C.w) c.fillRect(p.x - wt, p.y - wt, wt * 0.6, cs + wt * 2); }
    // 球
    const b = this.ball, bp = P(b.x, b.y), R = cs * 0.28, sc = b.fall ? Math.max(0.1, 1 - b.fall * 1.2) : 1;
    c.save(); c.translate(bp.x, bp.y); c.scale(sc, sc);
    c.fillStyle = 'rgba(60,30,10,0.35)'; c.beginPath(); c.arc(R * 0.2, R * 0.3, R, 0, Math.PI * 2); c.fill();
    const g = c.createRadialGradient(-R * 0.35, -R * 0.4, 1, 0, 0, R); g.addColorStop(0, '#ffffff'); g.addColorStop(0.5, '#c8cdd8'); g.addColorStop(1, '#7a8090');
    c.fillStyle = g; c.beginPath(); c.arc(0, 0, R, 0, Math.PI * 2); c.fill();
    Kid.head(c, 0, 0, R * 0.62, {}, R * 0.8);
    c.restore();
    if (this.t < 5 || (!Tilt.active && this.t < 12)) Kid.text(c, Tilt.hint(), V.W / 2, V.H - 22, 18, '#2a2a33', 6);
  },
  hud() { return { L: `<b>${this.score}</b> 分　第 ${this.level + 1} / 3 關`, R: `⏱ ${Math.floor(this.lt)}　🕳️ ${this.falls}` }; },
});
