'use strict';
// =====================================================
//  反應和技巧：搶餅乾、射箭場、剛好幾秒、紙片桌球、翻鬆餅
// =====================================================

// ---- 搶餅乾 ----
registerGame({
  id: 'quickdraw', name: '搶餅乾', icon: '🍪', color: '#c9772f',
  desc: '燈變綠色的瞬間點下去，比對手先搶到餅乾！',
  howto: '桌上有一塊餅乾，紅燈的時候不能動！燈一變「綠色」就馬上點畫面（或空白鍵），比對手快就搶到餅乾。太早點是犯規喔！一共 7 回合，對手會越來越快。',
  N: 7,
  start() { this.t = 0; this.score = 0; this.over = false; this.overText = ''; this.r = 0; this.win = 0; this.best = 0; this.newRound(); },
  newRound() { this.st = 'wait'; this.wT = rand(1.4, 3.6); this.go = 0; this.ai = Math.max(0.27, rand(0.42, 0.6) - this.r * 0.03); this.res = null; this.rT = 0; },
  tap() {
    if (this.st === 'wait') { this.st = 'res'; this.res = 'foul'; this.rT = 1.6; Sfx.play('nope'); return; }
    if (this.st === 'go') { const ms = this.go; this.st = 'res'; this.rT = 1.8; if (ms < this.ai) { this.res = 'win'; this.win++; const pts = Math.max(10, Math.round(60 - ms * 100)); this.score += pts; this.best = this.best ? Math.min(this.best, ms) : ms; Sfx.play('chomp'); FX.text(V.W / 2, V.H * 0.3, `${Math.round(ms * 1000)} 毫秒！+${pts}`, '#45ad4a', 36); } else { this.res = 'lose'; Sfx.play('over'); } this.my = ms; }
  },
  key(k) { if (k === 'space' || k === 'enter') this.tap(); },
  update(dt) {
    this.t += dt;
    if (this.st === 'wait') { this.wT -= dt; if (this.wT <= 0) { this.st = 'go'; this.go = 0; Sfx.play('ding'); } }
    else if (this.st === 'go') { this.go += dt; if (this.go >= this.ai) { this.st = 'res'; this.res = 'lose'; this.my = null; this.rT = 1.8; Sfx.play('over'); } }
    else { this.rT -= dt; if (this.rT <= 0) { this.r++; if (this.r >= this.N) { this.over = true; this.overText = `搶到 ${this.win} / ${this.N} 塊` + (this.best ? `，最快 ${Math.round(this.best * 1000)} 毫秒` : ''); return; } this.newRound(); } }
  },
  draw(c) {
    c.fillStyle = '#f6e3c4'; c.fillRect(-20, -20, V.W + 40, V.H + 40);
    const P = Kid.portrait(), ty = V.H * 0.66, cx = V.W / 2;
    Paper.rect(c, cx - Math.min(V.W * 0.45, 400), ty, Math.min(V.W * 0.9, 800), 30, '#a0683c', 10, { border: 4 });
    const grab = this.st === 'res' && (this.res === 'win' || this.res === 'lose') ? this.res : null;
    const ckx = grab === 'win' ? cx - V.W * 0.2 : grab === 'lose' ? cx + V.W * 0.2 : cx;
    Kid.emoji(c, '🍪', ckx, ty - 30, 70);
    Puppet.draw(c, App.pup, cx - Math.min(V.W * 0.32, 300), V.H * 0.92, P ? 200 : 240, grab === 'win' ? Puppet.Poses.cheer(this.t) : this.res === 'foul' ? Puppet.Poses.hurt(this.t % 1) : this.st === 'go' ? { aR: 1.5, aRf: 0.2, rot: 0.1 } : Puppet.Poses.idle(this.t));
    Kid.emoji(c, grab === 'lose' ? '😋' : this.st === 'go' ? '😮' : '🙂', cx + Math.min(V.W * 0.32, 300), ty - 80, 110);
    // 燈
    const ly = P ? 210 : 150; Paper.rect(c, cx - 60, ly - 50, 120, 100, '#3a3a48', 20, { border: 4 });
    Paper.circle(c, cx, ly, 36, this.st === 'go' ? '#45d16a' : this.st === 'wait' ? '#e8453c' : '#6a6a78', { border: 0, blur: this.st === 'go' ? 24 : 6, shadowColor: this.st === 'go' ? '#45d16a' : '#e8453c' });
    const msg = this.st === 'wait' ? '等一下…還不行！' : this.st === 'go' ? '快點！' : this.res === 'foul' ? '太早了，犯規！' : this.res === 'win' ? '搶到了！' : this.my ? `慢了一點（${Math.round(this.my * 1000)} 毫秒）` : '被搶走了！';
    Kid.text(c, msg, cx, ly + 90, 34, this.st === 'go' ? '#45ad4a' : '#4a3520', 6);
  },
  hud() { return { L: `<b>${this.score}</b> 分　🍪 ${this.win}`, R: `第 ${Math.min(this.r + 1, this.N)} / ${this.N} 回合` }; },
});

// ---- 射箭場 ----
registerGame({
  id: 'archery', name: '射箭場', icon: '🏹', color: '#3c7a4a',
  desc: '往後拉弓、放開射箭，注意風向！',
  howto: '按住畫面往「後面」拉（像拉弓一樣），會看到瞄準線，放開就射出去！拉越遠射越用力。箭會往下掉，旗子會告訴你風往哪裡吹。射中靶心 10 分，一共 8 支箭。',
  N: 8,
  start() { this.t = 0; this.score = 0; this.over = false; this.overText = ''; this.k = 0; this.sw = Kid.makeSwipe(); this.arrow = null; this.stuck = []; this.newShot(); },
  newShot() { this.dist = rand(0.55, 0.85); this.th = rand(0.35, 0.65); this.wind = rand(-1, 1) * Math.min(1, this.k / 3); this.arrow = null; this.res = 0; this.stuck = []; },
  get bow() { return { x: Kid.portrait() ? 60 : 120, y: V.H * 0.62 }; },
  target() { const B = this.bow, x = B.x + (V.W - B.x - 50) * this.dist, top = Kid.portrait() ? 150 : 100; return { x, y: top + (V.H * 0.8 - top) * this.th, R: Kid.portrait() ? 60 : 72 }; },
  tap(x, y) { if (!this.arrow && !this.res) this.sw.begin(x, y); },
  update(dt) {
    this.t += dt;
    this.sw.step(e => {
      const dx = e.x0 - e.x, dy = e.y0 - e.y, L = Math.hypot(dx, dy); if (L < 20) return;
      const k = Math.min(L, 220) / 220, sp = 450 + k * 900, B = this.bow; this.arrow = { x: B.x, y: B.y, vx: dx / L * sp, vy: dy / L * sp }; Sfx.play('swish');
    });
    if (this.res) { this.res -= dt; if (this.res <= 0) { this.res = 0; this.k++; if (this.k >= this.N) { this.over = true; this.overText = `${this.N} 支箭共 ${this.score} 分！`; return; } this.newShot(); } return; }
    const A = this.arrow; if (!A) return;
    const px = A.x; A.vy += 520 * dt; A.vx += this.wind * 120 * dt; A.x += A.vx * dt; A.y += A.vy * dt;
    const T = this.target();
    if (px < T.x && A.x >= T.x) {
      const yy = A.y, off = Math.abs(yy - T.y);
      if (off < T.R) { const ring = Math.min(4, Math.floor(off / T.R * 5)), pts = [10, 8, 6, 4, 2][ring]; this.score += pts; A.stuck = 1; this.stuck.push(yy - T.y); this.arrow = null; this.res = 1.4; Sfx.play(pts === 10 ? 'win' : 'thud'); FX.text(T.x, T.y - T.R - 30, pts === 10 ? '正中靶心！10' : `${pts} 分`, pts === 10 ? '#e0573c' : '#ff7a00', 34); if (pts === 10) FX.burst(T.x, T.y, 20, undefined, 0.8); return; }
    }
    if (A.y > V.H + 40 || A.x > V.W + 40 || A.x < -40) { this.arrow = null; this.res = 1; Sfx.play('whiff'); FX.text(V.W / 2, V.H * 0.4, '沒射中…', '#7a62b8', 30); }
  },
  drawArrow(c, x, y, a) { c.save(); c.translate(x, y); c.rotate(a); c.strokeStyle = '#7a4a22'; c.lineWidth = 4; c.beginPath(); c.moveTo(-40, 0); c.lineTo(10, 0); c.stroke(); c.fillStyle = '#5a5f6a'; c.beginPath(); c.moveTo(16, 0); c.lineTo(4, -6); c.lineTo(4, 6); c.fill(); c.fillStyle = '#e8453c'; c.fillRect(-42, -6, 10, 4); c.fillRect(-42, 2, 10, 4); c.restore(); },
  draw(c) {
    const gy = Kid.ground(c, 'meadow', this.t, 0.88), T = this.target(), B = this.bow;
    // 風旗
    const fx = V.W / 2, fy = Kid.portrait() ? 140 : 96; c.strokeStyle = '#7a4a22'; c.lineWidth = 4; c.beginPath(); c.moveTo(fx, fy - 10); c.lineTo(fx, fy + 50); c.stroke();
    Paper.shape(c, cc => { cc.moveTo(fx, fy - 10); cc.lineTo(fx + this.wind * 60 + Math.sin(this.t * 8) * 4, fy + 4); cc.lineTo(fx, fy + 18); cc.closePath(); }, '#e8453c', { border: 2 });
    Kid.text(c, Math.abs(this.wind) < 0.1 ? '沒有風' : `風 ${this.wind > 0 ? '→' : '←'} ${Math.round(Math.abs(this.wind) * 5)}`, fx, fy + 74, 20, '#4a3520', 5);
    c.fillStyle = '#8a5a34'; c.fillRect(T.x - 5, T.y, 10, gy - T.y);
    for (let i = 0; i < 5; i++) { c.fillStyle = ['#ffffff', '#2a2a33', '#3f8fe0', '#e8453c', '#ffd23f'][i]; c.beginPath(); c.ellipse(T.x, T.y, T.R * 0.3 * (1 - i / 5), T.R * (1 - i / 5), 0, 0, Math.PI * 2); c.fill(); }
    c.strokeStyle = Paper.PAPER; c.lineWidth = 3; c.beginPath(); c.ellipse(T.x, T.y, T.R * 0.3, T.R, 0, 0, Math.PI * 2); c.stroke();
    for (const o of this.stuck) this.drawArrow(c, T.x - 6, T.y + o, 0);
    Puppet.draw(c, App.pup, B.x - 20, gy, Kid.portrait() ? 150 : 180, { aR: 1.6, aL: 1.5, aLf: -0.3, aRf: 0.6 });
    let ang = -0.4; const cur = this.sw.cur;
    if (cur && this.sw.pts.length) { const p0 = this.sw.pts[0], dx = p0.x - cur.x, dy = p0.y - cur.y, L = Math.hypot(dx, dy); if (L > 10) { ang = Math.atan2(dy, dx); const k = Math.min(L, 220) / 220, sp = 450 + k * 900; let x = B.x, y = B.y, vx = dx / L * sp, vy = dy / L * sp; c.fillStyle = 'rgba(255,255,255,0.85)'; for (let i = 0; i < 14; i++) { for (let s = 0; s < 4; s++) { vy += 520 * 0.012; x += vx * 0.012; y += vy * 0.012; } c.beginPath(); c.arc(x, y, 4 - i * 0.2, 0, Math.PI * 2); c.fill(); } } }
    c.save(); c.translate(B.x, B.y); c.rotate(ang); c.strokeStyle = '#8a4a24'; c.lineWidth = 6; c.beginPath(); c.arc(0, 0, 50, -1.2, 1.2); c.stroke(); c.strokeStyle = '#ffffff'; c.lineWidth = 2; const pull = cur ? Math.min(30, Math.hypot(this.sw.pts[0].x - cur.x, this.sw.pts[0].y - cur.y) / 6) : 0; c.beginPath(); c.moveTo(Math.cos(-1.2) * 50, Math.sin(-1.2) * 50); c.lineTo(-pull, 0); c.lineTo(Math.cos(1.2) * 50, Math.sin(1.2) * 50); c.stroke(); c.restore();
    if (this.arrow) this.drawArrow(c, this.arrow.x, this.arrow.y, Math.atan2(this.arrow.vy, this.arrow.vx));
    else if (!this.res) this.drawArrow(c, B.x + Math.cos(ang) * 10, B.y + Math.sin(ang) * 10, ang);
    if (this.k === 0 && !this.arrow && !cur && !this.res) Kid.text(c, '按住往後拉 ← 放開射箭', V.W / 2, V.H * 0.5, 26, '#4a3520', 6);
  },
  hud() { return { L: `<b>${this.score}</b> 分`, R: `🏹 ${this.N - this.k} 支` }; },
});

// ---- 剛好幾秒 ----
registerGame({
  id: 'stopwatch', name: '剛好幾秒', icon: '⏱️', color: '#5b6fd6',
  desc: '在心裡數秒，停在剛剛好的時間！',
  howto: '題目會說要停在幾秒（例如 5 秒）。點一下開始計時，數字過 2 秒就會藏起來，要在心裡數！覺得到了就再點一下停止。越接近分數越高（剛好 = 100 分）。一共 5 次。',
  TG: [5, 3, 7, 10, 6],
  start() { this.t = 0; this.score = 0; this.over = false; this.overText = ''; this.k = 0; this.st = 'ready'; this.e = 0; this.hist = []; this.rT = 0; },
  tap() {
    if (this.st === 'ready') { this.st = 'run'; this.e = 0; Sfx.play('tick'); }
    else if (this.st === 'run') { this.st = 'res'; this.rT = 2; const d = Math.abs(this.e - this.TG[this.k]), pts = Math.max(0, Math.round(100 - d * 100)); this.score += pts; this.hist.push(this.e); Sfx.play(pts >= 90 ? 'win' : pts >= 50 ? 'ding' : 'over'); this.pts = pts; }
  },
  key(k) { if (k === 'space' || k === 'enter') this.tap(); },
  update(dt) {
    this.t += dt; if (this.st === 'run') { this.e += dt; if (this.e > this.TG[this.k] + 5) this.tap(); }
    else if (this.st === 'res') { this.rT -= dt; if (this.rT <= 0) { this.k++; if (this.k >= this.TG.length) { this.over = true; this.overText = '時間感超準！'; return; } this.st = 'ready'; } }
  },
  draw(c) {
    c.fillStyle = '#e8ecff'; c.fillRect(-20, -20, V.W + 40, V.H + 40);
    const P = Kid.portrait(), cx = V.W / 2, cy = V.H * 0.48, R = Math.min(V.W * 0.36, V.H * 0.26, 190), tg = this.TG[this.k] || 0;
    Kid.text(c, `目標：剛好 ${tg} 秒`, cx, P ? 150 : 100, 34, '#5b6fd6', 6);
    Paper.circle(c, cx, cy, R, '#ffffff', { border: 6, blur: 10 }); Paper.rect(c, cx - 16, cy - R - 30, 32, 26, '#5b6fd6', 6, { border: 3 });
    for (let i = 0; i < 12; i++) { const a = i / 12 * Math.PI * 2; c.fillStyle = '#c8c8d8'; c.beginPath(); c.arc(cx + Math.sin(a) * R * 0.85, cy - Math.cos(a) * R * 0.85, i % 3 ? 3 : 6, 0, Math.PI * 2); c.fill(); }
    const show = this.st === 'res' || (this.st === 'run' && this.e < 2), v = this.st === 'ready' ? 0 : this.e;
    if (show || this.st === 'ready') { const a = v / 60 * Math.PI * 2 * 6; c.strokeStyle = '#e8453c'; c.lineWidth = 5; c.beginPath(); c.moveTo(cx, cy); c.lineTo(cx + Math.sin(a) * R * 0.75, cy - Math.cos(a) * R * 0.75); c.stroke(); }
    Kid.text(c, show || this.st === 'ready' ? v.toFixed(2) : '? ? ?', cx, cy + R * 0.38, R * 0.32, '#2a2a33', 0);
    if (this.st === 'run' && !show) Kid.head(c, cx, cy - R * 0.2, R * 0.28, {}, R * 0.32);
    const msg = this.st === 'ready' ? '點一下開始！' : this.st === 'run' ? '在心裡數…到了就點！' : `${this.e.toFixed(2)} 秒（差 ${Math.abs(this.e - tg).toFixed(2)}）+${this.pts}`;
    Kid.text(c, msg, cx, cy + R + 50, 28, this.st === 'res' ? (this.pts >= 90 ? '#45ad4a' : '#e0573c') : '#4a3520', 6);
    this.hist.forEach((h, i) => Kid.text(c, `${this.TG[i]}秒→${h.toFixed(2)}`, cx + (i - (this.TG.length - 1) / 2) * Math.min(130, V.W / 5.2), V.H - 40, 18, '#5b6fd6', 4));
  },
  hud() { return { L: `<b>${this.score}</b> 分`, R: `第 ${Math.min(this.k + 1, this.TG.length)} / ${this.TG.length} 次` }; },
});

// ---- 紙片桌球 ----
registerGame({
  id: 'pingpong', name: '紙片桌球', icon: '🏓', color: '#e8453c',
  desc: '用手指左右移動球拍，把球打回去！先得 7 分贏！',
  howto: '手指按住畫面左右移動下面的球拍（電腦用 ← → 或滑鼠按住），把球打回對面。用球拍的邊邊打，球會斜斜飛出去，比較容易得分！先得 7 分的人贏。',
  WIN: 7,
  start() { this.t = 0; this.score = 0; this.over = false; this.overText = ''; this.me = 0; this.ai = 0; this.px = V.W / 2; this.ax = V.W / 2; this.serveT = 1; this.serveDir = 1; this.ball = null; this.hits = 0; },
  tab() { const P = Kid.portrait(), w = Math.min(V.W - 40, P ? 480 : 520), top = P ? 130 : 84; return { x: V.W / 2 - w / 2, w, y: top, h: V.H - top - 20 }; },
  serve() { const T = this.tab(); this.ball = { x: V.W / 2, y: T.y + T.h / 2, vx: rand(-120, 120), vy: 340 * this.serveDir, sp: 340 }; Sfx.play('click'); },
  update(dt) {
    this.t += dt; const T = this.tab(), pw = T.w * 0.24, py = T.y + T.h - 30, ay = T.y + 30;
    const kd = keyDir(); if (kd) this.px += kd * 700 * dt; else if (Input.down) this.px += (Input.x - this.px) * Math.min(1, dt * 18);
    this.px = clamp(this.px, T.x + pw / 2, T.x + T.w - pw / 2);
    if (!this.ball) { this.serveT -= dt; if (this.serveT <= 0) this.serve(); return; }
    const b = this.ball, aiSp = 260 + this.ai * 10 + this.me * 22, want = b.vy < 0 ? b.x : V.W / 2; this.ax += clamp(want - this.ax, -aiSp * dt, aiSp * dt); this.ax = clamp(this.ax, T.x + pw / 2, T.x + T.w - pw / 2);
    b.x += b.vx * dt; b.y += b.vy * dt;
    if (b.x < T.x + 8) { b.x = T.x + 8; b.vx = Math.abs(b.vx); Sfx.play('tick'); } if (b.x > T.x + T.w - 8) { b.x = T.x + T.w - 8; b.vx = -Math.abs(b.vx); Sfx.play('tick'); }
    const hitPad = (x, y, dir) => { if (Math.abs(b.y - y) < 16 && Math.abs(b.x - x) < pw / 2 + 10 && Math.sign(b.vy) === -dir) { const off = (b.x - x) / (pw / 2); b.sp = Math.min(900, b.sp + 22); b.vy = dir * b.sp; b.vx = off * b.sp * 0.75; b.y = y + dir * 16; Sfx.play('bat'); return true; } return false; };
    if (hitPad(this.px, py, -1)) this.hits++;
    hitPad(this.ax, ay, 1);
    const pt = who => { if (who) { this.me++; this.score += 10; Sfx.play('star'); FX.text(V.W / 2, T.y + T.h * 0.3, '得分！', '#45ad4a', 40); } else { this.ai++; Sfx.play('over'); FX.text(V.W / 2, T.y + T.h * 0.7, '對手得分', '#e8453c', 34); } this.ball = null; this.serveT = 1.1; this.serveDir = who ? -1 : 1; if (this.me >= this.WIN || this.ai >= this.WIN) { const won = this.me >= this.WIN; if (won) this.score += 50; this.over = true; this.overText = won ? `贏了！${this.me} : ${this.ai}` : `輸了 ${this.me} : ${this.ai}，再挑戰！`; } };
    if (b.y > T.y + T.h + 20) pt(false); else if (b.y < T.y - 20) pt(true);
  },
  draw(c) {
    c.fillStyle = '#3a4a6a'; c.fillRect(-20, -20, V.W + 40, V.H + 40); const T = this.tab(), pw = T.w * 0.24;
    Paper.rect(c, T.x, T.y, T.w, T.h, '#2f7fc1', 12, { border: 5, blur: 8 });
    c.strokeStyle = '#ffffff'; c.lineWidth = 3; c.strokeRect(T.x + 10, T.y + 10, T.w - 20, T.h - 20); c.beginPath(); c.moveTo(T.x + T.w / 2, T.y + 10); c.lineTo(T.x + T.w / 2, T.y + T.h - 10); c.stroke();
    c.fillStyle = 'rgba(255,255,255,0.8)'; c.fillRect(T.x - 6, T.y + T.h / 2 - 3, T.w + 12, 6);
    Kid.text(c, `${this.ai}`, T.x + T.w / 2, T.y + T.h * 0.3, 70, 'rgba(255,255,255,0.35)', 0); Kid.text(c, `${this.me}`, T.x + T.w / 2, T.y + T.h * 0.7, 70, 'rgba(255,255,255,0.35)', 0);
    Paper.rect(c, this.ax - pw / 2, T.y + 22, pw, 16, '#2a2a33', 8, { border: 3 }); Kid.emoji(c, '🤖', this.ax, T.y + 10, 34);
    Paper.rect(c, this.px - pw / 2, T.y + T.h - 38, pw, 16, '#e8453c', 8, { border: 3 }); Kid.head(c, this.px, T.y + T.h - 6, 18, {}, 22);
    if (this.ball) { const b = this.ball; c.fillStyle = 'rgba(0,0,0,0.25)'; c.beginPath(); c.ellipse(b.x + 4, b.y + 6, 9, 5, 0, 0, Math.PI * 2); c.fill(); Paper.circle(c, b.x, b.y, 10, '#ffffff', { border: 2, blur: 3 }); }
    else Kid.text(c, '準備發球…', V.W / 2, T.y + T.h / 2 - 40, 26, '#ffffff', 0);
  },
  hud() { return { L: `<b>${this.score}</b> 分`, R: `我 ${this.me} : ${this.ai} 🤖` }; },
});

// ---- 翻鬆餅 ----
registerGame({
  id: 'pancake', name: '翻鬆餅', icon: '🥞', color: '#d9a066',
  desc: '鬆餅煎到金黃色就翻面，再用平底鍋接住！',
  howto: '鬆餅會慢慢變色：白白的 → 金黃色 → 燒焦。變成金黃色的時候往上滑（或按空白鍵）把它翻起來，再左右移動平底鍋接住！兩面都煎好就上桌。一共 6 片，掉到地上就沒了。',
  N: 6,
  start() { this.t = 0; this.score = 0; this.over = false; this.overText = '鬆餅店開張！'; this.k = 0; this.px = V.W / 2; this.sw = Kid.makeSwipe(); this.made = 0; this.newCake(); },
  newCake() { this.cake = { side: 0, cook: [0, 0], x: this.px, y: 0, vy: 0, vx: 0, rot: 0, air: false, fall: 0 }; this.doneT = 0; this.rate = rand(0.18, 0.26) + this.k * 0.015; },
  get panY() { return V.H * 0.76; },
  tap(x, y) { this.sw.begin(x, y); },
  key(k) { if (k === 'space' || k === 'arrowup') this.flip(); },
  flip() { const C = this.cake; if (C.air || this.doneT || C.fall) return; if (C.side === 1) { this.serve(); return; } C.air = true; C.vy = -980; C.vx = rand(-120, 120); Sfx.play('swish'); },
  serve() { const C = this.cake, q = v => v < 0.35 ? 0 : v < 0.75 ? 10 : v <= 1.05 ? 25 : v <= 1.3 ? 8 : 0, a = q(C.cook[0]), b = q(C.cook[1]), pts = a + b; this.score += pts; this.made++; this.doneT = 1.4; Sfx.play(pts >= 45 ? 'win' : 'coin'); FX.text(V.W / 2, V.H * 0.35, pts >= 45 ? `完美鬆餅！+${pts}` : pts ? `上桌！+${pts}` : '不太好吃…', pts >= 45 ? '#e0573c' : '#c9772f', 36); },
  update(dt) {
    this.t += dt; const C = this.cake;
    this.sw.step(e => { if (e.y0 - e.y > 40) this.flip(); });
    const kd = keyDir(); if (kd) this.px += kd * 650 * dt; else if (Input.down) this.px += (Input.x - this.px) * Math.min(1, dt * 14);
    this.px = clamp(this.px, 90, V.W - 90);
    if (this.doneT) { this.doneT -= dt; if (this.doneT <= 0) { this.k++; if (this.k >= this.N) { this.over = true; this.overText = `做了 ${this.made} 片鬆餅！`; return; } this.newCake(); } return; }
    if (C.fall) { C.fall -= dt; C.y += 600 * dt; if (C.fall <= 0) { this.doneT = 0.01; } return; }
    if (C.air) {
      C.vy += 1500 * dt; C.y += C.vy * dt; C.x += C.vx * dt; C.rot += dt * 9;
      if (C.y >= 0 && C.vy > 0) {
        if (Math.abs(C.x - this.px) < 85) { C.air = false; C.y = 0; C.rot = 0; C.side = 1; C.x = this.px; Sfx.play('thud'); FX.text(this.px, this.panY - 80, '接住了！', '#45ad4a', 28); }
        else { C.fall = 0.8; C.air = false; Sfx.play('boing'); FX.text(C.x, this.panY - 60, '掉了！', '#e8453c', 30); }
      }
    } else { C.x = this.px; C.cook[C.side] += this.rate * dt; if (C.cook[C.side] > 1.3 && Math.random() < dt * 3) FX.text(C.x, this.panY - 70, '燒焦了！', '#5a5a5a', 24); }
  },
  col(v) { const k = clamp(v, 0, 1.5); if (k < 1) { const r = Math.round(250 - k * 30), g = Math.round(238 - k * 80), b = Math.round(200 - k * 140); return `rgb(${r},${g},${b})`; } const d = (k - 1) / 0.5; return `rgb(${Math.round(220 - d * 150)},${Math.round(158 - d * 110)},${Math.round(60 - d * 40)})`; },
  draw(c) {
    c.fillStyle = '#fbe9d0'; c.fillRect(-20, -20, V.W + 40, V.H + 40); c.fillStyle = '#e0c9a6'; c.fillRect(-20, V.H * 0.84, V.W + 40, V.H);
    const C = this.cake, py = this.panY;
    for (let i = 0; i < 5; i++) Kid.emoji(c, '🔥', this.px - 60 + i * 30, py + 46, 26 + Math.sin(this.t * 18 + i) * 3);
    Paper.rect(c, this.px + 80, py - 4, 120, 16, '#3a3a3a', 8, { border: 3 });
    Paper.shape(c, cc => cc.ellipse(this.px, py + 10, 95, 26, 0, 0, Math.PI * 2), '#4a4f5a', { border: 4 });
    const cy = py + C.y - 4;
    c.save(); c.translate(C.x, cy); c.scale(1, C.air ? Math.max(0.15, Math.abs(Math.cos(C.rot))) : 1);
    Paper.shape(c, cc => cc.ellipse(0, 0, 72, 20, 0, 0, Math.PI * 2), this.col(C.cook[C.side]), { border: 3 });
    c.fillStyle = this.col(C.cook[C.air ? (Math.cos(C.rot) > 0 ? 1 - C.side : C.side) : 1 - C.side]); c.beginPath(); c.ellipse(0, -3, 62, 14, 0, 0, Math.PI * 2); c.fill();
    c.restore();
    // 熟度表（正在煎的那一面）
    const bx = V.W / 2 - 140, by = Kid.portrait() ? 150 : 100, v = C.cook[C.side];
    Paper.rect(c, bx, by, 280, 26, '#ffffff', 13, { border: 3 });
    c.fillStyle = 'rgba(255,200,60,0.55)'; c.fillRect(bx + 280 * 0.75 / 1.5, by + 3, 280 * 0.3 / 1.5, 20);
    c.fillStyle = '#2a2a33'; c.fillRect(bx + 280 * Math.min(1.5, v) / 1.5 - 3, by - 6, 6, 38);
    Kid.text(c, C.side ? '第二面：好了就再滑一下上桌！' : v >= 0.75 && v <= 1.05 ? '金黃色！快翻面！' : v > 1.05 ? '快燒焦了！' : '煎煎煎…', V.W / 2, by + 56, 24, v >= 0.75 && v <= 1.05 ? '#e0a000' : '#4a3520', 5);
    Puppet.draw(c, App.pup, Kid.portrait() ? V.W * 0.14 : V.W * 0.12, V.H - 6, Kid.portrait() ? 130 : 170, C.air ? Puppet.Poses.cheer(this.t) : Puppet.Poses.idle(this.t));
  },
  hud() { return { L: `<b>${this.score}</b> 分`, R: `🥞 第 ${Math.min(this.k + 1, this.N)} / ${this.N} 片` }; },
});
