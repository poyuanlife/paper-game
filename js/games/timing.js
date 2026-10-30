'use strict';
// =====================================================
//  抓時機的遊戲：跳繩、疊漢堡、切水果
// =====================================================

// ---- 跳繩 ----
registerGame({
  id: 'jumprope', name: '跳繩比賽', icon: '🤸', color: '#e9654b',
  desc: '繩子轉到腳下的時候跳起來！',
  howto: '兩個小朋友在甩繩子，繩子轉到紙片人腳下的時候點畫面（或空白鍵）跳起來！越跳繩子轉越快。被絆到 3 次就結束，看你能連跳幾下！',
  start() { this.t = 0; this.score = 0; this.over = false; this.overText = ''; this.lives = 3; this.ang = Math.PI * 0.9; this.speed = 2.6; this.jy = 0; this.jv = 0; this.count = 0; this.best = 0; this.trip = 0; this.passed = false; },
  get floor() { return V.H * 0.82; },
  tap() { if (this.jy === 0 && !this.trip) { this.jv = 620; Sfx.play('jump'); } },
  key(k) { if (k === 'space' || k === 'arrowup') this.tap(); },
  update(dt) {
    this.t += dt; if (this.trip) { this.trip -= dt; if (this.trip <= 0) { if (this.lives <= 0) { this.over = true; this.overText = `最多連跳 ${this.best} 下！`; return; } this.ang = Math.PI * 0.9; } return; }
    if (this.jy > 0 || this.jv > 0) { this.jv -= 2000 * dt; this.jy = Math.max(0, this.jy + this.jv * dt); if (this.jy === 0) this.jv = 0; }
    const prev = this.ang; this.ang += this.speed * dt;
    // 繩子在最下面 = 角度 2π 的倍數（往下）
    const bottom = Math.floor(prev / (Math.PI * 2)) !== Math.floor(this.ang / (Math.PI * 2));
    if (bottom) {
      if (this.jy > 22) { this.count++; this.score += 1 + Math.floor(this.count / 10); this.best = Math.max(this.best, this.count); this.speed = Math.min(7, 2.6 + this.count * 0.08); Sfx.play('coin'); if (this.count % 10 === 0) FX.text(V.W / 2, V.H * 0.3, `${this.count} 下！`, '#e0573c', 44); }
      else { this.lives--; this.trip = 1.2; this.count = 0; this.speed = Math.max(2.6, this.speed * 0.8); Sfx.play('hit'); V.shake = 6; FX.text(V.W / 2, V.H * 0.35, '絆到了！', '#7a62b8', 36); }
    }
  },
  draw(c) {
    const gy = Kid.ground(c, 'meadow', this.t, 0.82), cx = V.W / 2, L = Math.min(V.W * 0.38, 260), ay = gy - 110, R = 110;
    const a = this.ang, ry = ay + Math.cos(a) * R, front = Math.sin(a) > 0;
    const rope = () => { c.strokeStyle = '#e8453c'; c.lineWidth = 6; c.beginPath(); c.moveTo(cx - L, ay); c.quadraticCurveTo(cx, ry * 2 - ay, cx + L, ay); c.stroke(); };
    if (!front) rope();
    for (const s of [-1, 1]) { Kid.emoji(c, s < 0 ? '👧' : '👦', cx + s * (L + 30), gy - 50, 90); }
    Puppet.draw(c, App.pup, cx, gy - this.jy, Kid.portrait() ? 160 : 150, this.trip ? Puppet.Poses.hurt(1.2 - this.trip) : this.jy > 0 ? Puppet.Poses.jump(this.jv / 600) : Puppet.Poses.idle(this.t));
    if (front) rope();
    Kid.text(c, `${this.count}`, cx, Kid.portrait() ? 150 : 100, 60, '#e0573c');
  },
  hud() { return { L: `<b>${this.score}</b> 分　最多 ${this.best} 下`, R: TiltUI.lives(this.lives) }; },
});

// ---- 疊漢堡 ----
registerGame({
  id: 'burger', name: '疊漢堡', icon: '🍔', color: '#d9a066',
  desc: '食材左右晃，對準了再放下去！',
  howto: '上面的食材會左右晃來晃去，點畫面（或空白鍵）把它丟下去，疊在漢堡上。對得越準分數越高，歪太多會掉下去！掉 3 次就結束，看你能疊多高。',
  ING: [['生菜', '#7dcc5c', 12], ['番茄', '#e8453c', 12], ['起司', '#ffcc1f', 8], ['肉排', '#8a4a24', 18], ['洋蔥', '#f2e6f2', 8], ['蛋', '#fff6c8', 12]],
  start() { this.t = 0; this.score = 0; this.over = false; this.overText = ''; this.stack = [{ x: V.W / 2, w: 180, col: '#e9a54b', h: 30, bun: 1 }]; this.miss = 0; this.fall = null; this.next(); this.cam = 0; },
  next() { const I = pick(this.ING); this.cur = { col: I[1], h: I[2], w: 170, name: I[0], ph: rand(0, 6), drop: false, y: 0, vy: 0 }; },
  get base() { return V.H * 0.88; },
  top() { return this.stack.reduce((s, l) => s + l.h, 0); },
  sx() { const amp = Math.min(V.W * 0.32, 220); return V.W / 2 + Math.sin(this.t * (1.6 + this.stack.length * 0.08) + this.cur.ph) * amp; },
  get hy() { return Kid.portrait() ? 150 : 110; },
  tap() { if (!this.cur.drop && !this.fall) { this.cur.drop = true; this.cur.x = this.sx(); this.cur.sy = this.hy; this.cur.vy = 0; } },
  key(k) { if (k === 'space' || k === 'arrowdown') this.tap(); },
  update(dt) {
    this.t += dt; const C = this.cur;
    const want = Math.max(0, this.top() - V.H * 0.45); this.cam += (want - this.cam) * Math.min(1, dt * 3);
    if (this.fall) { this.fall.t += dt; this.fall.vy += 1500 * dt; this.fall.y -= this.fall.vy * dt; this.fall.rot += dt * 4 * this.fall.dir; if (this.fall.t > 1) { this.fall = null; if (this.miss >= 3) { this.over = true; this.overText = `疊了 ${this.stack.length - 1} 層！`; return; } this.next(); } return; }
    if (C.drop) {
      C.vy += 1600 * dt; C.sy += C.vy * dt;   // 螢幕座標往下掉
      const topY = this.top(), screenTop = this.base + this.cam - topY;
      if (C.sy >= screenTop) {
        const T = this.stack[this.stack.length - 1], off = C.x - T.x;
        if (Math.abs(off) > T.w * 0.55) { this.miss++; this.fall = { ...C, y: topY + 10, vy: -200, rot: 0, dir: Math.sign(off), t: 0 }; Sfx.play('whiff'); FX.text(V.W / 2, V.H * 0.3, '掉下去了！', '#7a62b8', 34); return; }
        const acc = 1 - Math.abs(off) / (T.w * 0.55); this.stack.push({ x: C.x, w: C.w, col: C.col, h: C.h }); this.score += 5 + Math.round(acc * 10);
        Sfx.play(acc > 0.85 ? 'star' : 'thud'); if (acc > 0.85) FX.text(C.x, screenTop - 40, '完美！', '#ff7a00', 30);
        if (this.stack.length % 8 === 0) { this.stack.push({ x: C.x, w: 180, col: '#e9a54b', h: 26, bun: 1 }); this.score += 30; Sfx.play('win'); FX.text(V.W / 2, V.H * 0.25, '一個漢堡完成！', '#e0573c', 36); }
        this.next();
      }
    }
  },
  layer(c, x, y, l) { if (l.bun) Paper.shape(c, cc => { cc.ellipse(x, y - l.h / 2, l.w / 2, l.h / 2 + 4, 0, 0, Math.PI * 2); }, l.col, { border: 3, blur: 3 }); else Paper.rect(c, x - l.w / 2, y - l.h, l.w, l.h, l.col, l.h / 2, { border: 3, blur: 3 }); },
  draw(c) {
    c.fillStyle = '#fff1d6'; c.fillRect(-20, -20, V.W + 40, V.H + 40); c.fillStyle = '#e8453c'; for (let x = 0; x < V.W; x += 60) c.fillRect(x, 0, 30, 50);
    let y = this.base + this.cam; Paper.rect(c, V.W / 2 - 150, y, 300, 16, '#ffffff', 8, { border: 3 });
    for (const l of this.stack) { this.layer(c, l.x, y, l); y -= l.h; }
    const C = this.cur;
    if (this.fall) { const F = this.fall; c.save(); c.translate(F.x, this.base + this.cam - F.y); c.rotate(F.rot); this.layer(c, 0, 0, F); c.restore(); }
    else if (C.drop) this.layer(c, C.x, C.sy, C);
    else { const x = this.sx(), yy = this.hy; c.strokeStyle = 'rgba(0,0,0,0.15)'; c.setLineDash([6, 6]); c.beginPath(); c.moveTo(x, yy); c.lineTo(x, V.H); c.stroke(); c.setLineDash([]); this.layer(c, x, yy, C); Kid.text(c, C.name, x, yy - 30, 20, '#4a3520'); }
  },
  hud() { return { L: `<b>${this.score}</b> 分　🍔 ${this.stack.length - 1} 層`, R: `掉了 ${this.miss} / 3` }; },
});

// ---- 切水果 ----
registerGame({
  id: 'slice', name: '水果切切切', icon: '🍉', color: '#45ad4a',
  desc: '手指劃過飛起來的水果，把它切開！',
  howto: '水果會從下面飛上來，用手指在畫面上「劃過」水果就能切開它！一次切到好幾個有加分。小心不要切到 💣 炸彈，也不要讓水果掉下去。失誤 3 次就結束。',
  FRUIT: [['🍉', '#e8453c'], ['🍊', '#ff9a2e'], ['🍎', '#e8453c'], ['🍍', '#ffcc1f'], ['🍋', '#ffe04a'], ['🥝', '#7dcc5c'], ['🍑', '#ff9a7a'], ['🍌', '#ffe04a']],
  start() { this.t = 0; this.score = 0; this.over = false; this.overText = ''; this.lives = 3; this.items = []; this.halves = []; this.trail = []; this.wave = 1; this.spawnT = 0.5; this.combo = 0; },
  spawn() {
    const n = 1 + Math.floor(Math.random() * Math.min(4, 1 + this.t / 15));
    for (let i = 0; i < n; i++) { const bomb = this.t > 8 && Math.random() < 0.12, F = pick(this.FRUIT); this.items.push({ x: rand(V.W * 0.15, V.W * 0.85), y: V.H + 40, vx: rand(-120, 120), vy: -rand(V.H * 1.05, V.H * 1.35), e: bomb ? '💣' : F[0], col: F[1], bomb, rot: 0, vr: rand(-4, 4), r: 36 }); }
    this.spawnT = Math.max(0.7, 1.6 - this.t / 40) * rand(0.8, 1.2);
  },
  update(dt) {
    this.t += dt; this.spawnT -= dt; if (this.spawnT <= 0) this.spawn();
    const g = V.H * 1.2;
    if (Input.down) { this.trail.push({ x: Input.x, y: Input.y, t: 0 }); } for (const p of this.trail) p.t += dt; this.trail = this.trail.filter(p => p.t < 0.15);
    let cut = 0;
    for (const it of this.items) {
      it.vy += g * dt; it.x += it.vx * dt; it.y += it.vy * dt; it.rot += it.vr * dt;
      if (it.dead) continue;
      if (Input.down && this.trail.length > 1) { const a = this.trail[this.trail.length - 2], b = this.trail[this.trail.length - 1], dx = b.x - a.x, dy = b.y - a.y, L2 = dx * dx + dy * dy;
        if (L2 > 16) { const t = clamp(((it.x - a.x) * dx + (it.y - a.y) * dy) / L2, 0, 1), d = Math.hypot(it.x - a.x - dx * t, it.y - a.y - dy * t);
          if (d < it.r) { it.dead = 1;
            if (it.bomb) { this.lives--; Sfx.play('boom'); V.shake = 14; FX.burst(it.x, it.y, 30, ['#333', '#ff6b00', '#ffd23f'], 1.2); FX.text(it.x, it.y - 40, '碰！', '#e8453c', 40); if (this.lives <= 0) { this.over = true; this.overText = '切到炸彈了！'; return; } }
            else { cut++; Sfx.play('chomp'); const ang = Math.atan2(dy, dx); for (const s of [-1, 1]) this.halves.push({ x: it.x, y: it.y, vx: it.vx + Math.cos(ang + s * Math.PI / 2) * 160, vy: it.vy * 0.4 + Math.sin(ang + s * Math.PI / 2) * 160, e: it.e, rot: it.rot, s, t: 0 }); FX.burst(it.x, it.y, 10, [it.col, '#ffffff'], 0.6); } } } }
      if (it.vy > 0 && it.y > V.H + 50) { it.dead = 1; if (!it.bomb) { this.lives--; Sfx.play('nope'); FX.text(it.x, V.H - 60, '掉了！', '#7a62b8', 28); if (this.lives <= 0) { this.over = true; this.overText = '水果掉太多了！'; return; } } }
    }
    if (cut) { const pts = cut * 10 + (cut >= 3 ? cut * 10 : 0); this.score += pts; if (cut >= 2) FX.text(V.W / 2, V.H * 0.3, `${cut} 連切！+${pts}`, '#e0573c', 40); }
    for (const h of this.halves) { h.t += dt; h.vy += g * dt; h.x += h.vx * dt; h.y += h.vy * dt; h.rot += h.s * 3 * dt; }
    this.items = this.items.filter(it => !it.dead); this.halves = this.halves.filter(h => h.y < V.H + 80);
  },
  draw(c) {
    c.fillStyle = '#8a5a34'; c.fillRect(-20, -20, V.W + 40, V.H + 40); c.fillStyle = 'rgba(0,0,0,0.1)'; for (let x = 0; x < V.W; x += 80) c.fillRect(x, 0, 6, V.H);
    for (const h of this.halves) { c.save(); c.translate(h.x, h.y); c.rotate(h.rot); c.beginPath(); c.rect(h.s < 0 ? -60 : 0, -60, 60, 120); c.clip(); Kid.emoji(c, h.e, 0, 0, 72); c.restore(); }
    for (const it of this.items) Kid.emoji(c, it.e, it.x, it.y, 72, it.rot);
    if (this.trail.length > 1) { c.strokeStyle = 'rgba(255,255,255,0.9)'; c.lineCap = 'round'; for (let i = 1; i < this.trail.length; i++) { const a = this.trail[i - 1], b = this.trail[i]; c.lineWidth = 2 + i * 1.2; c.beginPath(); c.moveTo(a.x, a.y); c.lineTo(b.x, b.y); c.stroke(); } }
    if (this.t < 3) Kid.text(c, '👆 用手指劃過水果！', V.W / 2, V.H * 0.45, 30, '#ffffff', 6);
  },
  hud() { return { L: `<b>${this.score}</b> 分`, R: TiltUI.lives(this.lives) }; },
});
