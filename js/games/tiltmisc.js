'use strict';
// =====================================================
//  其他傾斜遊戲：端盤子、水平泡泡、倒果汁、蹺蹺板、跳跳雲朵、毛毛蟲
// =====================================================

// ---- 端盤子 ----
registerGame({
  id: 'tray', name: '端盤子小幫手', icon: '🍰', color: '#d9a066', tilt: true,
  desc: '傾斜手機保持平衡，不要讓點心滑下去！（手機限定）',
  howto: '📱 手機限定：紙片人端著盤子走路，地板會晃，盤子上的點心會滑來滑去。往點心滑過去的反方向歪手機，把它們留在盤子上！點心越來越多，掉 3 個就結束。（電腦用 ← → 鍵）',
  FOOD: ['🍰', '☕', '🍩', '🧁', '🍔', '🍮', '🍦'],
  start() { this.t = 0; this.score = 0; this.over = false; this.overText = '點心掉光了！'; this.drops = 0; this.items = [this.mk(0)]; this.nextT = 5; this.a = 0; this.kick = 0; this.kickT = 3; },
  mk(pos) { return { pos, v: 0, e: pick(this.FOOD), fall: 0 }; },
  tap() { Tilt.calibrate(); },
  update(dt) {
    this.t += dt; this.kickT -= dt;
    if (this.kickT <= 0) { this.kick = (Math.random() < 0.5 ? -1 : 1) * rand(0.15, 0.3) * (1 + this.t / 60); this.kickT = rand(1.5, 3.5); Sfx.play('thud'); }
    this.kick *= Math.pow(0.15, dt);
    const sway = Math.sin(this.t * 1.3) * 0.12 + Math.sin(this.t * 2.9) * 0.06;
    this.a += ((Tilt.x * 0.55 + sway + this.kick) - this.a) * Math.min(1, dt * 6);
    for (const it of this.items) {
      if (it.fall) { it.fall += dt; continue; }
      it.v += Math.sin(this.a) * 3.2 * dt; it.v *= 1 - 1.2 * dt; it.pos += it.v * dt;
      if (Math.abs(it.pos) > 1.05) { it.fall = 0.001; this.drops++; Sfx.play('hit'); FX.text(V.W / 2 + it.pos * 120, V.H * 0.5, '啊！掉了！', '#e8453c', 28); if (this.drops >= 3) { this.over = true; return; } }
    }
    this.items = this.items.filter(it => !it.fall || it.fall < 1);
    this.nextT -= dt; if (this.nextT <= 0 && this.items.length < 6) { this.items.push(this.mk(rand(-0.3, 0.3))); this.nextT = 7; Sfx.play('pop'); }
    this.score += dt * 5 * this.items.filter(i => !i.fall).length;
  },
  draw(c) {
    const gy = Kid.ground(c, 'orchard', this.t, 0.93), x = V.W / 2, PH = Kid.portrait() ? 260 : 240;
    const hy = gy - Puppet.size(App.pup, PH).h * (App.pup.kind === 'pet' ? 0.95 : 1.12), tw = Math.min(V.W * 0.38, 150);
    Puppet.draw(c, App.pup, x, gy, PH, App.pup.kind === 'pet' ? Puppet.Poses.run(this.t * 0.5) : Puppet.Poses.carry(this.t * 0.6, this.a, true));
    c.save(); c.translate(x, hy); c.rotate(this.a);
    Paper.rect(c, -tw, -6, tw * 2, 12, '#c9cdd8', 6, { border: 4 });
    for (const it of this.items) { const fx = it.pos * tw, fy = it.fall ? it.fall * it.fall * 500 : 0; Kid.emoji(c, it.e, fx, -26 + fy, 44, it.fall ? it.fall * 6 : 0); }
    c.restore();
    TiltUI.hint(c, this, 140); TiltUI.dial(c);
  },
  hud() { return { L: `<b>${Math.floor(this.score)}</b> 分　🍰 ${this.items.filter(i => !i.fall).length}`, R: `掉了 ${this.drops} / 3` }; },
});

// ---- 水平泡泡 ----
registerGame({
  id: 'bubblelevel', name: '水平泡泡', icon: '🔘', color: '#45ad4a', tilt: true, kid: true,
  desc: '讓泡泡待在圈圈裡，圈圈還會跑！（手機限定）',
  howto: '📱 手機限定：這是一個水平儀！泡泡會往比較高的那一邊跑。慢慢歪手機，讓泡泡一直待在會移動的圈圈裡，待越久分數越高。不會輸，限時 40 秒。（電腦用方向鍵）',
  TIME: 40,
  start() { this.t = 0; this.left = this.TIME; this.score = 0; this.over = false; this.overText = '超級穩定！'; this.bx = 0; this.by = 0; this.inT = 0; this.ding = 0; },
  get R() { return Math.min(V.W, V.H - 200) * 0.42; },
  target() { const k = Math.min(1, this.t / 30); return { x: Math.sin(this.t * (0.4 + k * 0.4)) * 0.55, y: Math.cos(this.t * (0.31 + k * 0.35)) * 0.5, r: 0.3 - k * 0.1 }; },
  tap() { Tilt.calibrate(); },
  update(dt) {
    this.t += dt; this.left -= dt; if (this.left <= 0) { this.left = 0; this.over = true; return; }
    this.bx += (clamp(-Tilt.x, -1, 1) * 0.9 - this.bx) * Math.min(1, dt * 4); this.by += (clamp(-Tilt.y, -1, 1) * 0.9 - this.by) * Math.min(1, dt * 4);
    const T = this.target(), inside = Math.hypot(this.bx - T.x, this.by - T.y) < T.r - 0.06;
    if (inside) { this.inT += dt; this.score += dt * 10; this.ding -= dt; if (this.ding <= 0) { Sfx.note(660 + Math.min(600, this.inT * 60), 0.12, 0.08); this.ding = 0.5; } } else this.inT = 0;
    this.inside = inside;
  },
  draw(c) {
    c.fillStyle = '#d9c49a'; c.fillRect(-20, -20, V.W + 40, V.H + 40);
    const R = this.R, cx = V.W / 2, cy = V.H * 0.55, T = this.target();
    Paper.circle(c, cx, cy, R + 16, '#8a5a34', { border: 5, blur: 14 });
    const g = c.createRadialGradient(cx, cy, 10, cx, cy, R); g.addColorStop(0, '#d8f5a0'); g.addColorStop(1, '#8fcc3a'); c.fillStyle = g; c.beginPath(); c.arc(cx, cy, R, 0, Math.PI * 2); c.fill();
    c.strokeStyle = 'rgba(60,90,20,0.25)'; c.lineWidth = 2; c.beginPath(); c.moveTo(cx - R, cy); c.lineTo(cx + R, cy); c.moveTo(cx, cy - R); c.lineTo(cx, cy + R); c.stroke();
    c.strokeStyle = this.inside ? '#ffffff' : '#e8453c'; c.lineWidth = 5; c.setLineDash([10, 8]); c.beginPath(); c.arc(cx + T.x * R, cy + T.y * R, T.r * R, 0, Math.PI * 2); c.stroke(); c.setLineDash([]);
    const bx = cx + this.bx * R, by = cy + this.by * R;
    c.fillStyle = 'rgba(255,255,255,0.75)'; c.beginPath(); c.arc(bx, by, R * 0.13, 0, Math.PI * 2); c.fill(); c.strokeStyle = '#ffffff'; c.lineWidth = 3; c.stroke();
    Kid.head(c, bx, by, R * 0.08, {}, R * 0.11);
    if (this.inT > 1) Kid.text(c, `穩穩的！${this.inT.toFixed(1)} 秒`, cx, cy - R - 30, 28, '#3d8b2a');
    TiltUI.hint(c, this, V.H - 20);
  },
  hud() { return { L: `<b>${Math.floor(this.score)}</b> 分`, R: `⏱ ${Math.ceil(this.left)}` }; },
});

// ---- 倒果汁 ----
registerGame({
  id: 'pourjuice', name: '倒果汁', icon: '🧃', color: '#ff9a2e', tilt: true,
  desc: '傾斜手機倒果汁，剛好倒到線上！（手機限定）',
  howto: '📱 手機限定：手機往右歪，果汁壺就會倒出果汁，歪越多倒越快。把果汁倒到杯子上「虛線之間」就停（手機擺正），停一下就會送出。太少或滿出來都不行！一共 8 杯。（電腦用 → 鍵）',
  N: 8, COLS: ['#ff9a2e', '#e8453c', '#9b5bd6', '#45ad4a', '#ffcc1f'],
  start() { this.t = 0; this.score = 0; this.over = false; this.overText = '果汁店老闆！'; this.n = 0; this.ang = 0; this.drops = []; this.newCup(); },
  newCup() { const lo = rand(0.35, 0.7); this.cup = { fill: 0, lo, hi: lo + rand(0.12, 0.2) - this.n * 0.008, x: V.W + 100, idle: 0, done: 0 }; this.juice = pick(this.COLS); },
  tap() { Tilt.calibrate(); },
  update(dt) {
    this.t += dt; const C = this.cup, tx = V.W / 2 + 20;
    if (C.done) { C.done += dt; C.x -= dt * 900; if (C.done > 0.8) { this.n++; if (this.n >= this.N) { this.over = true; return; } this.newCup(); } return; }
    C.x += (tx - C.x) * Math.min(1, dt * 6);
    this.ang += (clamp(Tilt.x, 0, 1) - this.ang) * Math.min(1, dt * 8);
    const flow = Math.abs(C.x - tx) < 8 ? Math.max(0, this.ang - 0.22) * 0.55 : 0;
    if (flow > 0) { C.fill += flow * dt; C.idle = 0; if (Math.random() < 0.6) this.drops.push({ x: this.spout().x + rand(-3, 3), y: this.spout().y, vy: 200 }); } else if (C.fill > 0.03) C.idle += dt;
    for (const d of this.drops) { d.vy += 1500 * dt; d.y += d.vy * dt; } this.drops = this.drops.filter(d => d.y < this.cupTop() + 80);
    if (C.fill > 1.05) { C.done = 0.001; Sfx.play('splash'); FX.text(tx, V.H * 0.4, '滿出來了！', '#e8453c', 34); return; }
    if (C.idle > 0.9) {
      C.done = 0.001;
      if (C.fill >= C.lo && C.fill <= C.hi) { const mid = (C.lo + C.hi) / 2, acc = 1 - Math.abs(C.fill - mid) / ((C.hi - C.lo) / 2), pts = 20 + Math.round(acc * 30); this.score += pts; Sfx.play('ding'); FX.text(tx, V.H * 0.4, acc > 0.7 ? `完美！+${pts}` : `剛剛好！+${pts}`, '#3d8b2a', 34); }
      else { Sfx.play('nope'); FX.text(tx, V.H * 0.4, C.fill < C.lo ? '太少了～' : '太多了～', '#7a62b8', 32); }
    }
  },
  cupTop() { return V.H * 0.62; },
  spout() { const jx = V.W / 2 - 90, jy = V.H * 0.32, a = this.ang * 1.6; return { x: jx + Math.cos(a) * 70, y: jy + Math.sin(a) * 70 - 20 }; },
  draw(c) {
    c.fillStyle = '#fff1d6'; c.fillRect(-20, -20, V.W + 40, V.H + 40); c.fillStyle = '#d9a066'; c.fillRect(-20, V.H * 0.8, V.W + 40, V.H);
    const C = this.cup, top = this.cupTop(), h = V.H * 0.8 - top, w = 110;
    // 杯子
    c.save(); c.translate(C.x, 0);
    const fh = Math.min(1.05, C.fill) * h; c.fillStyle = this.juice; c.fillRect(-w / 2 + 6, V.H * 0.8 - fh, w - 12, fh);
    c.strokeStyle = '#ffffff'; c.lineWidth = 6; c.strokeRect(-w / 2, top, w, h); c.strokeStyle = 'rgba(120,150,180,0.5)'; c.lineWidth = 2; c.strokeRect(-w / 2, top, w, h);
    c.setLineDash([8, 6]); c.strokeStyle = '#3d8b2a'; c.lineWidth = 3; for (const v of [C.lo, C.hi]) { const y = V.H * 0.8 - v * h; c.beginPath(); c.moveTo(-w / 2 - 14, y); c.lineTo(w / 2 + 14, y); c.stroke(); } c.setLineDash([]);
    c.fillStyle = 'rgba(69,173,74,0.12)'; c.fillRect(-w / 2, V.H * 0.8 - C.hi * h, w, (C.hi - C.lo) * h);
    c.restore();
    for (const d of this.drops) { c.fillStyle = this.juice; c.beginPath(); c.arc(d.x, d.y, 5, 0, Math.PI * 2); c.fill(); }
    // 果汁壺
    const jx = V.W / 2 - 90, jy = V.H * 0.32; c.save(); c.translate(jx, jy); c.rotate(this.ang * 1.6);
    Paper.rect(c, -50, -60, 100, 110, 'rgba(220,240,255,0.9)', 18, { border: 4 }); c.fillStyle = this.juice; c.fillRect(-42, -10, 84, 52);
    Paper.shape(c, cc => { cc.moveTo(46, -60); cc.lineTo(80, -78); cc.lineTo(50, -40); cc.closePath(); }, 'rgba(220,240,255,0.9)', { border: 3 });
    c.strokeStyle = '#8a5a34'; c.lineWidth = 8; c.beginPath(); c.arc(-56, -6, 26, Math.PI * 0.5, Math.PI * 1.5); c.stroke(); c.restore();
    Puppet.draw(c, App.pup, 70, V.H * 0.8, Math.min(V.H * 0.32, 220), Puppet.Poses.idle(this.t));
    TiltUI.hint(c, this, 140); TiltUI.dial(c);
  },
  hud() { return { L: `<b>${this.score}</b> 分`, R: `🥤 ${Math.min(this.n + 1, this.N)} / ${this.N}` }; },
});

// ---- 蹺蹺板 ----
registerGame({
  id: 'seesaw', name: '動物蹺蹺板', icon: '🐘', color: '#7a8cc9', tilt: true,
  desc: '動物一隻隻跳上蹺蹺板，傾斜手機保持平衡！（手機限定）',
  howto: '📱 手機限定：動物會一隻一隻跳上蹺蹺板，大象最重、老鼠最輕。蹺蹺板往哪邊倒，就把手機往另一邊歪來撐住！歪太多動物會滑下去。3 條命，撐越久分數越高。（電腦用 ← → 鍵）',
  ANIMALS: [['🐭', 0.4], ['🐰', 0.6], ['🐱', 0.8], ['🐶', 1], ['🐷', 1.3], ['🐻', 1.6], ['🐘', 2.2]],
  start() { this.t = 0; this.score = 0; this.over = false; this.overText = '動物都掉下去了！'; this.lives = 3; this.reset(); },
  reset() { this.th = 0; this.w = 0; this.on = []; this.nextT = 1; this.fallT = 0; },
  tap() { Tilt.calibrate(); },
  update(dt) {
    this.t += dt;
    if (this.fallT) { this.fallT -= dt; if (this.fallT <= 0) { if (this.lives <= 0) { this.over = true; return; } this.reset(); } return; }
    this.nextT -= dt;
    if (this.nextT <= 0 && this.on.length < 8) { const A = pick(this.ANIMALS.slice(0, Math.min(7, 3 + Math.floor(this.t / 15)))); this.on.push({ e: A[0], m: A[1], x: rand(-0.9, 0.9), drop: 1 }); this.nextT = rand(3, 5) - Math.min(1.5, this.t / 40); Sfx.play('boing'); }
    let tq = 0; for (const a of this.on) { a.drop = Math.max(0, a.drop - dt * 2.5); tq += a.m * a.x; }
    const acc = tq * 1.1 + Math.sin(this.th) * 1.5 - Tilt.x * 4.5 - this.w * 2.2; this.w += acc * dt; this.th = clamp(this.th + this.w * dt, -0.6, 0.6);
    if (Math.abs(this.th) > 0.3) for (const a of this.on) a.x = clamp(a.x + Math.sign(this.th) * (Math.abs(this.th) - 0.3) * 2 * dt, -1.2, 1.2);
    const off = this.on.filter(a => Math.abs(a.x) > 1.05);
    if (off.length) { this.lives--; this.fallT = 1.2; Sfx.play('hit'); FX.text(V.W / 2, V.H * 0.35, `${off[0].e} 滑下去了！`, '#e8453c', 36); return; }
    this.score += dt * this.on.length * 3;
  },
  draw(c) {
    const gy = Kid.ground(c, 'meadow', this.t, 0.9), cx = V.W / 2, py = gy - 70, L = Math.min(V.W * 0.44, 340);
    Paper.shape(c, cc => { cc.moveTo(cx - 40, gy); cc.lineTo(cx, py); cc.lineTo(cx + 40, gy); cc.closePath(); }, '#8a5a34', { border: 4 });
    c.save(); c.translate(cx, py); c.rotate(this.th); Paper.rect(c, -L, -10, L * 2, 20, '#e9654b', 8, { border: 4 });
    for (const a of this.on) Kid.emoji(c, a.e, a.x * L, -10 - 22 * (0.7 + a.m * 0.3) - a.drop * 160, 44 * (0.7 + a.m * 0.3));
    c.restore();
    Puppet.draw(c, App.pup, cx, gy + 4, Kid.portrait() ? 120 : 110, this.fallT ? Puppet.Poses.hurt(1.2 - this.fallT) : { aL: 2.2 - this.th * 2, aR: 2.2 + this.th * 2, rot: -this.th * 0.4 });
    TiltUI.hint(c, this, 140); TiltUI.dial(c);
  },
  hud() { return { L: `<b>${Math.floor(this.score)}</b> 分　🐾 ${this.on.length}`, R: TiltUI.lives(this.lives) }; },
});

// ---- 跳跳雲朵 ----
registerGame({
  id: 'cloudjump', name: '跳跳雲朵', icon: '☁️', color: '#6ec3f0', tilt: true,
  desc: '在雲朵上一直往上跳，傾斜手機左右移動！（手機限定）',
  howto: '📱 手機限定：紙片人會自己一直跳，左右傾斜手機讓牠跳到雲朵上，越跳越高！灰色的雲踩一下就散掉，🌀 彈簧雲會跳超高。從畫面左邊出去會從右邊回來。掉下去就結束。（電腦用 ← → 鍵）',
  start() {
    this.t = 0; this.score = 0; this.over = false; this.overText = '掉下去了！'; this.p = { x: V.W / 2, y: 0, vx: 0, vy: -900 }; this.cam = 0; this.best = 0; this.coins = 0;
    this.plats = [{ x: V.W / 2, y: 40, w: 120, k: 'n' }]; this.topY = 40; this.fill();
  },
  fill() {
    while (this.topY > this.cam - V.H - 200) {
      const h = -this.topY, gap = clamp(90 + h / 60, 90, 190); this.topY -= rand(gap * 0.7, gap);
      const r = Math.random(), k = h > 1500 && r < 0.15 ? 'b' : h > 800 && r < 0.3 ? 'm' : r < 0.08 ? 's' : 'n';
      this.plats.push({ x: rand(60, V.W - 60), y: this.topY, w: rand(90, 120), k, ph: rand(0, 6), coin: Math.random() < 0.2 });
    }
  },
  tap() { Tilt.calibrate(); },
  update(dt) {
    this.t += dt; const p = this.p;
    p.vx += (Tilt.x * 600 - p.vx) * Math.min(1, dt * 8); p.x += p.vx * dt; if (p.x < -20) p.x += V.W + 40; if (p.x > V.W + 20) p.x -= V.W + 40;
    const py = p.y; p.vy += 1700 * dt; p.y += p.vy * dt;
    for (const q of this.plats) {
      if (q.k === 'm') q.x = clamp(q.x + Math.sin(this.t * 1.5 + q.ph) * 90 * dt, 60, V.W - 60);
      if (q.gone) continue;
      if (q.coin && Math.hypot(p.x - q.x, p.y - 30 - (q.y - 40)) < 40) { q.coin = false; this.coins++; Sfx.play('coin'); }
      if (p.vy > 0 && py <= q.y && p.y >= q.y && Math.abs(p.x - q.x) < q.w / 2 + 10) {
        if (q.k === 'b') { q.gone = 0.001; Sfx.play('crack'); continue; }
        p.y = q.y; p.vy = q.k === 's' ? -1550 : -900; Sfx.play(q.k === 's' ? 'boing' : 'jump');
      }
    }
    for (const q of this.plats) if (q.gone) q.gone += dt;
    this.cam = Math.min(this.cam, p.y - V.H * 0.45); this.best = Math.max(this.best, -p.y);
    this.plats = this.plats.filter(q => q.y < this.cam + V.H + 100); this.fill();
    this.score = Math.floor(this.best / 10) + this.coins * 10;
    if (p.y > this.cam + V.H + 80) { this.over = true; this.overText = `跳了 ${Math.floor(this.best / 10)} 公尺！`; }
  },
  draw(c) {
    const h = -this.cam, k = clamp(h / 8000, 0, 1), g = c.createLinearGradient(0, 0, 0, V.H);
    g.addColorStop(0, `rgb(${Math.round(110 - 80 * k)},${Math.round(195 - 150 * k)},${Math.round(240 - 120 * k)})`); g.addColorStop(1, `rgb(${Math.round(213 - 120 * k)},${Math.round(240 - 150 * k)},255)`);
    c.fillStyle = g; c.fillRect(-20, -20, V.W + 40, V.H + 40);
    c.save(); c.translate(0, -this.cam);
    for (const q of this.plats) {
      const a = q.gone ? Math.max(0, 1 - q.gone * 3) : 1; if (a <= 0) continue; c.globalAlpha = a;
      const col = q.k === 'b' ? '#b8bcc8' : q.k === 's' ? '#ffd6f0' : '#ffffff';
      Paper.circle(c, q.x - q.w * 0.25, q.y + 2, q.w * 0.25, col, { border: 3, blur: 4 }); Paper.circle(c, q.x + q.w * 0.22, q.y + 2, q.w * 0.28, col, { border: 3, blur: 4 }); Paper.circle(c, q.x, q.y - 4, q.w * 0.3, col, { border: 3, blur: 4 });
      if (q.k === 's') Kid.emoji(c, '🌀', q.x, q.y - 12, 26); if (q.k === 'm') { c.fillStyle = '#3f8fe0'; c.fillRect(q.x - 10, q.y + 14, 20, 4); }
      if (q.coin) Paper.circle(c, q.x, q.y - 50, 12, '#ffd23f', { border: 3, blur: 3 });
      c.globalAlpha = 1;
    }
    const p = this.p; Puppet.draw(c, App.pup, p.x, p.y, 110, p.vy < 0 ? Puppet.Poses.jump(-p.vy / 900) : Puppet.Poses.jump(0.5));
    c.restore();
    Kid.text(c, `${Math.floor(this.best / 10)} m`, V.W / 2, Kid.portrait() ? 125 : 90, 28, '#3f6fe0');
    TiltUI.hint(c, this, V.H - 30);
  },
  hud() { return { L: `<b>${this.score}</b> 分`, R: `☁️ ${Math.floor(this.best / 10)} m` }; },
});

// ---- 毛毛蟲 ----
registerGame({
  id: 'caterpillar', name: '毛毛蟲變蝴蝶', icon: '🐛', color: '#62b04f', tilt: true, kid: true,
  desc: '帶毛毛蟲吃葉子，吃飽了會變成蝴蝶！（手機限定）',
  howto: '📱 手機限定：毛毛蟲會往手機歪的方向爬。吃 🍃 葉子會變長，吃滿 12 片就會變成蝴蝶飛走，再來一隻！從畫面邊邊出去會從另一邊出來，不會輸，限時 60 秒。（電腦用方向鍵）',
  TIME: 60,
  start() { this.t = 0; this.left = this.TIME; this.score = 0; this.over = false; this.overText = '好多蝴蝶！'; this.flies = []; this.bugs = 0; this.reset(); this.leaves = []; },
  reset() { this.h = { x: V.W / 2, y: V.H * 0.6, a: -Math.PI / 2 }; this.trail = []; this.len = 4; this.eaten = 0; },
  tap() { Tilt.calibrate(); },
  update(dt) {
    this.t += dt; this.left -= dt; if (this.left <= 0) { this.left = 0; this.over = true; return; }
    const H = this.h, m = Math.hypot(Tilt.x, Tilt.y);
    if (m > 0.12) { const want = Math.atan2(Tilt.y, Tilt.x); let d = want - H.a; while (d > Math.PI) d -= Math.PI * 2; while (d < -Math.PI) d += Math.PI * 2; H.a += clamp(d, -4 * dt, 4 * dt); }
    const sp = 110 + Math.min(1, m) * 90; H.x += Math.cos(H.a) * sp * dt; H.y += Math.sin(H.a) * sp * dt;
    const top = Kid.portrait() ? 100 : 60; if (H.x < -20) H.x = V.W + 20; if (H.x > V.W + 20) H.x = -20; if (H.y < top) H.y = V.H; if (H.y > V.H) H.y = top;
    this.trail.unshift({ x: H.x, y: H.y }); if (this.trail.length > 400) this.trail.pop();
    while (this.leaves.length < 4) this.leaves.push({ x: rand(40, V.W - 40), y: rand(top + 40, V.H - 40), e: Math.random() < 0.15 ? '🍎' : '🍃', r: rand(0, 6) });
    for (const l of this.leaves) if (Math.hypot(l.x - H.x, l.y - H.y) < 34) {
      l.dead = 1; this.len += 1; this.eaten++; this.score += l.e === '🍎' ? 20 : 10; Sfx.play('chomp'); FX.burst(l.x, l.y, 6, ['#62b04f', '#bfe8a0'], 0.4);
      if (this.eaten >= 12) { this.flies.push({ x: H.x, y: H.y, t: 0 }); this.bugs++; this.score += 50; Sfx.play('win'); FX.text(H.x, H.y - 50, '變成蝴蝶了！', '#9b5bd6', 34); Kid.say('變成蝴蝶了！'); this.reset(); break; }
    }
    this.leaves = this.leaves.filter(l => !l.dead);
    for (const f of this.flies) f.t += dt;
  },
  draw(c) {
    RoamBG.grass(c, this, '#b9e0a0');
    for (const l of this.leaves) Kid.emoji(c, l.e, l.x, l.y, 40, l.r);
    const seg = 11; for (let i = this.len; i >= 1; i--) { const p = this.trail[Math.min(this.trail.length - 1, i * seg)]; if (p) Paper.circle(c, p.x, p.y, 17 - i * 0.3, i % 2 ? '#62b04f' : '#8fd16a', { border: 3, blur: 3 }); }
    const H = this.h; Paper.circle(c, H.x, H.y, 22, '#8fd16a', { border: 3 }); Kid.head(c, H.x, H.y, 15, { sx: Math.cos(H.a) < 0 ? -1 : 1 }, 18);
    for (const f of this.flies) Kid.emoji(c, '🦋', f.x + Math.sin(f.t * 3) * 40, f.y - f.t * 60, 44);
    Kid.text(c, `🍃 ${this.eaten} / 12`, V.W / 2, Kid.portrait() ? 125 : 90, 26, '#3d8b2a');
    TiltUI.hint(c, this, V.H - 24);
  },
  hud() { return { L: `<b>${this.score}</b> 分　🦋 ${this.bugs}`, R: `⏱ ${Math.ceil(this.left)}` }; },
});
