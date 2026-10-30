'use strict';
// =====================================================
//  體感第三彈（畫圓、搖一搖）：呼拉圈、魔法攪拌、划龍舟、搖搖節奏、小狗甩甩水
// =====================================================

// 手機「畫圓圈」：傾斜的方向轉了多少（順時針為正）
const Circ = g => {
  const m = Math.hypot(Tilt.x, Tilt.y); if (m < 0.28) { g.ca = null; return 0; }
  const a = Math.atan2(Tilt.y, Tilt.x); if (g.ca == null) { g.ca = a; return 0; }
  let d = a - g.ca; while (d > Math.PI) d -= Math.PI * 2; while (d < -Math.PI) d += Math.PI * 2; g.ca = a; return d;
};
const circHint = () => Tilt.active ? '📱 拿著手機一直「畫圓圈」（像搖呼拉圈一樣轉著歪）' : Tilt.isTouch ? '手指按住畫面，繞著中間畫圓圈' : '電腦試玩：滑鼠按住繞著畫面中間畫圈，或依序按 → ↓ ← ↑';

// ---- 呼拉圈 ----
registerGame({
  id: 'hulahoop', name: '呼拉圈', icon: '⭕', color: '#e86fae', tilt: true,
  desc: '拿著手機畫圓圈，讓紙片人的呼拉圈一直轉不要掉！（手機限定）',
  howto: '📱 手機限定：拿著手機一直「畫圓圈」（像搖呼拉圈那樣轉著歪），紙片人的呼拉圈就會轉！轉越快越穩，太慢呼拉圈會往下掉。掉 3 次就結束，轉越多圈分數越高，限時 45 秒。（電腦：滑鼠按住繞著中間畫圈）',
  TIME: 45,
  start() { this.t = 0; this.left = this.TIME; this.score = 0; this.over = false; this.overText = ''; this.E = 0.7; this.ph = 0; this.lives = 3; this.drop = 0; this.revs = 0; this.ca = null; this.acc = 0; },
  tap() { Tilt.calibrate(); },
  update(dt) {
    this.t += dt; this.left -= dt; if (this.left <= 0) { this.left = 0; this.over = true; this.overText = `轉了 ${Math.floor(this.revs)} 圈！`; return; }
    const d = Circ(this);
    if (this.drop) { this.drop -= dt; if (this.drop <= 0) { this.drop = 0; this.E = 0.7; } return; }
    this.E = clamp(this.E + Math.abs(d) * 0.075 - dt * (0.22 + this.t / 250), 0, 1);
    this.ph += dt * (4 + this.E * 10); this.acc += Math.abs(d) / (Math.PI * 2);
    while (this.acc >= 1) { this.acc--; this.revs++; const pts = this.E > 0.75 ? 15 : 10; this.score += pts; Sfx.play(this.revs % 10 ? 'tick' : 'star'); if (this.revs % 10 === 0) FX.text(V.W / 2, V.H * 0.3, `${this.revs} 圈！`, '#e86fae', 40); }
    if (this.E <= 0) { this.lives--; this.drop = 1.2; Sfx.play('boing'); V.shake = 5; FX.text(V.W / 2, V.H * 0.4, '掉下來了！', '#e8453c', 36); if (this.lives <= 0) { this.over = true; this.overText = `轉了 ${Math.floor(this.revs)} 圈！`; } }
  },
  draw(c) {
    const gy = Kid.ground(c, 'meadow', this.t, 0.9), h = Math.min(V.H * 0.55, 380), x = V.W / 2;
    const fallen = this.drop > 0, hy = fallen ? gy - 6 : gy - h * (0.3 + this.E * 0.22), R = h * 0.36, wob = Math.sin(this.ph) * 0.06;
    const ring = (from, to) => { c.save(); c.lineCap = 'round'; c.strokeStyle = Paper.PAPER; c.lineWidth = 16; c.beginPath(); c.ellipse(x + Math.cos(this.ph) * 10, hy, R, R * 0.28, wob, from, to); c.stroke(); c.strokeStyle = '#e86fae'; c.lineWidth = 10; c.stroke(); c.setLineDash([12, 14]); c.lineDashOffset = -this.ph * 30; c.strokeStyle = '#ffd23f'; c.stroke(); c.restore(); };
    ring(Math.PI, Math.PI * 2);
    Puppet.draw(c, App.pup, x, gy, h, fallen ? Puppet.Poses.hurt(1.2 - this.drop) : { aL: 2.2, aR: 2.2, aLf: 0.5, aRf: 0.5, rot: Math.sin(this.ph) * 0.08, dy: -Math.abs(Math.sin(this.ph)) * 0.01 });
    ring(0, Math.PI);
    const bx = V.W / 2 - 120, by = Kid.portrait() ? 150 : 100; Paper.rect(c, bx, by, 240, 22, '#ffffff', 11, { border: 3 }); c.fillStyle = this.E < 0.3 ? '#e8453c' : this.E > 0.75 ? '#45ad4a' : '#ffb31f'; c.fillRect(bx + 3, by + 3, 234 * this.E, 16);
    Kid.text(c, this.E < 0.3 ? '快轉快一點！' : `${this.revs} 圈`, V.W / 2, by + 48, 26, '#e86fae', 6);
    if (this.t < 6 || this.revs < 2) Kid.text(c, circHint(), V.W / 2, V.H - 24, 18, '#2a2a33', 6);
  },
  hud() { return { L: `<b>${this.score}</b> 分`, R: TiltUI.lives(this.lives) + `　⏱ ${Math.ceil(this.left)}` }; },
});

// ---- 魔法攪拌 ----
registerGame({
  id: 'potion', name: '魔法攪拌', icon: '🧙', color: '#7a62b8', tilt: true,
  desc: '照著魔法書，拿手機畫圓圈攪拌鍋子、加材料做魔藥！（手機限定）',
  howto: '📱 手機限定：照著上面的魔法書做魔藥！看到「順時針攪 2 圈」就拿著手機往那個方向畫圓圈攪拌；看到「加入 🍄」就點下面對的材料。方向轉反了魔藥會變黑喔！一共 5 瓶，越快做完分數越高。（電腦：滑鼠按住繞著畫面中間畫圈）',
  ING: ['🍄', '🌿', '🐸', '⭐', '🍎', '🦴'], N: 5,
  start() { this.t = 0; this.score = 0; this.over = false; this.overText = '魔藥大師！'; this.k = 0; this.ca = null; this.newRecipe(); },
  newRecipe() { this.steps = []; const n = 3 + Math.min(2, this.k); for (let i = 0; i < n; i++) this.steps.push(i % 2 === 0 ? { stir: Math.random() < 0.5 ? 1 : -1, n: 1 + Math.floor(Math.random() * 2) } : { add: pick(this.ING) }); this.si = 0; this.turn = 0; this.bad = 0; this.rt = 0; this.doneT = 0; this.col = '#5fbf6a'; this.bub = []; },
  get btns() { const P = Kid.portrait(), n = this.ING.length, cols = P ? 3 : 6, w = P ? 86 : 90; return this.ING.map((e, i) => ({ e, x: V.W / 2 + ((i % cols) - (cols - 1) / 2) * (w + 10), y: V.H - (P ? 70 + (1 - Math.floor(i / cols)) * (w + 8) : 70), w, h: w * 0.9 })); },
  tap(x, y) {
    if (this.doneT) return; const S = this.steps[this.si];
    for (const b of this.btns) if (Kid.hit(b, x, y)) {
      if (S && S.add === b.e) { Sfx.play('splash'); FX.burst(V.W / 2, this.pot.y - 30, 14, ['#c77dff', '#6bcb77', '#ffd93d'], 0.7); this.col = pick(['#5fbf6a', '#c77dff', '#4d96ff', '#ff9f43']); this.next(); }
      else { Sfx.play('nope'); FX.text(b.x, b.y - 60, S && S.add ? '不是這個！' : '要先攪拌！', '#e8453c', 24); this.score = Math.max(0, this.score - 3); }
      return;
    }
    Tilt.calibrate();
  },
  get pot() { return { x: V.W / 2, y: V.H * (Kid.portrait() ? 0.55 : 0.58) }; },
  next() { this.si++; this.turn = 0; this.bad = 0; if (this.si >= this.steps.length) { const pts = Math.max(20, Math.round(80 - this.rt * 2)); this.score += pts; this.doneT = 2; Sfx.play('win'); Kid.say('魔藥做好了！'); FX.burst(this.pot.x, this.pot.y - 60, 30, undefined, 1.1); FX.text(this.pot.x, this.pot.y - 160, `魔藥完成！+${pts}`, '#7a62b8', 38); } },
  update(dt) {
    this.t += dt; const d = Circ(this);
    for (const b of this.bub) b.t += dt; this.bub = this.bub.filter(b => b.t < 1);
    if (Math.random() < dt * 8) this.bub.push({ x: rand(-80, 80), t: 0 });
    if (this.doneT) { this.doneT -= dt; if (this.doneT <= 0) { this.k++; if (this.k >= this.N) { this.over = true; return; } this.newRecipe(); } return; }
    this.rt += dt; const S = this.steps[this.si]; if (!S || !S.stir) return;
    if (Math.sign(d) === S.stir) { this.turn += Math.abs(d) / (Math.PI * 2); if (Math.random() < dt * 5) Sfx.play('rustle'); if (this.turn >= S.n) { Sfx.play('ding'); this.next(); } }
    else if (d) { this.bad += Math.abs(d) / (Math.PI * 2); if (this.bad > 0.6) { this.bad = 0; this.turn = Math.max(0, this.turn - 0.5); this.score = Math.max(0, this.score - 3); this.col = '#3a3a48'; Sfx.play('nope'); FX.text(this.pot.x, this.pot.y - 120, '方向反了！', '#e8453c', 30); } }
  },
  draw(c) {
    const g = c.createLinearGradient(0, 0, 0, V.H); g.addColorStop(0, '#2a1d4a'); g.addColorStop(1, '#4a3a6a'); c.fillStyle = g; c.fillRect(-20, -20, V.W + 40, V.H + 40);
    const P = this.pot, S = this.steps[this.si], rx = Math.min(V.W * 0.3, 170);
    for (let i = 0; i < 5; i++) Kid.emoji(c, '🔥', P.x - 80 + i * 40, P.y + rx * 0.75, 34 + Math.sin(this.t * 14 + i) * 4);
    Paper.shape(c, cc => { cc.ellipse(P.x, P.y, rx, rx * 0.72, 0, 0, Math.PI); cc.lineTo(P.x - rx, P.y); }, '#3a3a48', { border: 5 });
    c.fillStyle = this.col; c.beginPath(); c.ellipse(P.x, P.y, rx * 0.92, rx * 0.22, 0, 0, Math.PI * 2); c.fill();
    for (const b of this.bub) { c.fillStyle = 'rgba(255,255,255,0.5)'; c.beginPath(); c.arc(P.x + b.x, P.y - b.t * 50, 6 + b.t * 6, 0, Math.PI * 2); c.fill(); }
    const sa = this.ca == null ? this.t : this.ca; c.save(); c.translate(P.x + Math.cos(sa) * rx * 0.5, P.y + Math.sin(sa) * rx * 0.12); c.rotate(0.3); Paper.rect(c, -6, -110, 12, 120, '#c98a4b', 6, { border: 3 }); c.restore();
    // 魔法書
    const P2 = Kid.portrait(), bw = Math.min(V.W - 30, 520), by = P2 ? 120 : 80; Paper.rect(c, V.W / 2 - bw / 2, by, bw, 92, '#f6ecd0', 14, { border: 4 });
    const n = this.steps.length, sw = bw / n;
    this.steps.forEach((s, i) => { const x = V.W / 2 - bw / 2 + sw * (i + 0.5), done = i < this.si, cur = i === this.si; c.globalAlpha = done ? 0.35 : 1; if (cur && !this.doneT) Paper.rect(c, x - sw / 2 + 6, by + 6, sw - 12, 80, '#ffe680', 10, { border: 0, shadow: false });
      if (s.add) { Kid.emoji(c, s.add, x, by + 36, 36); Kid.text(c, '加入', x, by + 72, 16, '#4a3520', 0); } else { Kid.text(c, s.stir > 0 ? '↻' : '↺', x, by + 34, 40, s.stir > 0 ? '#e0573c' : '#3f8fe0', 0); Kid.text(c, `${s.stir > 0 ? '順' : '逆'}時針 ${s.n} 圈`, x, by + 72, 15, '#4a3520', 0); } c.globalAlpha = 1; });
    if (S && S.stir && !this.doneT) { Kid.text(c, `${Math.min(S.n, this.turn).toFixed(1)} / ${S.n} 圈`, P.x, P.y - rx * 0.6, 30, '#ffffff', 0); }
    for (const b of this.btns) Kid.button(c, b, '', '#fffdf5'), Kid.emoji(c, b.e, b.x, b.y, b.w * 0.55);
    if (this.t < 6) Kid.text(c, circHint(), V.W / 2, by + 120, 17, '#2a2a33', 6);
  },
  hud() { return { L: `<b>${this.score}</b> 分`, R: `🧪 第 ${Math.min(this.k + 1, this.N)} / ${this.N} 瓶` }; },
});

// ---- 划龍舟 ----
ShakeGame({
  id: 'dragonboat', name: '划龍舟比賽', icon: '🐉', color: '#d9463c',
  desc: '用力搖手機划槳，跟其他龍舟比賽誰先到終點！（手機限定）',
  howto: '📱 手機限定：比賽開始後一直用力搖手機，每搖一下就划一槳！搖越快船越快，跟另外 3 艘龍舟比賽，最先划到 200 公尺終點的贏！（電腦：狂點畫面或按空白鍵）',
  LEN: 200,
  start() { this.t = 0; this.score = 0; this.over = false; this.overText = ''; this.ls = null; this.cd = 3; this.me = { d: 0, v: 0, fin: 0 }; this.ai = [0, 1, 2].map(i => ({ d: 0, v: 0, base: rand(4.6, 6.1) + i * 0.1, fin: 0, ph: rand(0, 6) })); this.place = 0; this.rank = 1; this.stroke = 0; },
  update(dt) {
    this.t += dt; const n = Shk.d(this);
    if (this.cd > 0) { const p = Math.ceil(this.cd); this.cd -= dt; if (Math.ceil(this.cd) !== p) Sfx.play(this.cd <= 0 ? 'bell' : 'tick'); return; }
    const M = this.me; if (!M.fin) { M.v += n * 1.7; M.v *= 1 - Math.min(1, dt * 1.15); M.d += M.v * dt; this.stroke = Math.max(0, this.stroke - dt * 4); if (n) { this.stroke = 1; Sfx.drum(120, 0.25); } }
    for (const a of this.ai) if (!a.fin) { a.v += ((a.base + Math.sin(this.t * 1.3 + a.ph) * 0.6) - a.v) * dt * 2; a.d += a.v * dt; }
    for (const b of [M, ...this.ai]) if (!b.fin && b.d >= this.LEN) { b.fin = ++this.place; b.d = this.LEN; if (b === M) { this.rank = b.fin; const pts = [0, 100, 60, 40, 20][b.fin] + Math.max(0, Math.round(60 - this.t)); this.score = pts; Sfx.play(b.fin === 1 ? 'win' : 'over'); FX.text(V.W / 2, V.H * 0.35, b.fin === 1 ? '第一名！' : `第 ${b.fin} 名`, '#e0573c', 50); this.endT = 2; } }
    if (M.fin) { this.endT -= dt; if (this.endT <= 0) { this.over = true; this.overText = this.rank === 1 ? '龍舟冠軍！' : `第 ${this.rank} 名，再加油！`; } }
    if (this.t > 120) { this.over = true; this.overText = '天黑了…'; }
  },
  draw(c) {
    const P = Kid.portrait(), M = this.me, sc = P ? 22 : 18, camD = M.d, cy = V.H * 0.7;
    c.fillStyle = '#7dbb5c'; c.fillRect(-20, -20, V.W + 40, V.H + 40);
    const m = V.W * 0.06; c.fillStyle = '#3f9fd6'; c.fillRect(m, -20, V.W - m * 2, V.H + 40);
    c.strokeStyle = 'rgba(255,255,255,0.35)'; c.lineWidth = 3; for (let i = 0; i < 18; i++) { const y = ((i * 71 + camD * sc) % (V.H + 60)) - 30, x = m + (i * 197) % (V.W - m * 2); c.beginPath(); c.moveTo(x - 16, y); c.lineTo(x + 16, y); c.stroke(); }
    const lane = i => m + (V.W - m * 2) * (i + 0.5) / 4, yOf = d => cy - (d - camD) * sc;
    for (let i = 1; i < 4; i++) { c.setLineDash([10, 12]); c.strokeStyle = 'rgba(255,255,255,0.5)'; c.beginPath(); c.moveTo(m + (V.W - m * 2) * i / 4, 0); c.lineTo(m + (V.W - m * 2) * i / 4, V.H); c.stroke(); c.setLineDash([]); }
    const fy = yOf(this.LEN); if (fy > -40) { for (let i = 0; i < 16; i++) { c.fillStyle = i % 2 ? '#ffffff' : '#2a2a33'; c.fillRect(m + i * (V.W - m * 2) / 16, fy - 10, (V.W - m * 2) / 16 + 1, 20); } Kid.text(c, '終點', V.W / 2, fy - 34, 28, '#e0573c', 6); }
    for (let d = 0; d <= this.LEN; d += 50) { const y = yOf(d); if (y > -20 && y < V.H + 20) Kid.text(c, `${d}m`, m / 2 + 4, y, 16, '#2a4a1a', 4); }
    const boat = (x, y, col, me, st) => {
      const w = Math.min(46, (V.W - m * 2) / 4 * 0.42), L = w * 3.4;
      Paper.shape(c, cc => { cc.moveTo(x, y - L / 2 - 14); cc.quadraticCurveTo(x + w / 2, y - L / 3, x + w / 2, y + L / 2); cc.lineTo(x - w / 2, y + L / 2); cc.quadraticCurveTo(x - w / 2, y - L / 3, x, y - L / 2 - 14); }, col, { border: 3 });
      Kid.emoji(c, '🐲', x, y - L / 2 - 6, w * 0.9);
      for (let k = 0; k < 3; k++) { const yy = y - L / 4 + k * L / 4, a = Math.sin(this.t * 10 + k + (me ? st * 3 : 0)) * 0.5; c.strokeStyle = '#7a4a22'; c.lineWidth = 3; for (const s of [-1, 1]) { c.beginPath(); c.moveTo(x + s * w * 0.3, yy); c.lineTo(x + s * w * 1.1, yy + a * 14 * s); c.stroke(); } if (me && k === 1) Kid.head(c, x, yy, w * 0.32, {}, w * 0.36); else { c.fillStyle = '#ffd7b0'; c.beginPath(); c.arc(x, yy, w * 0.18, 0, Math.PI * 2); c.fill(); } }
    };
    this.ai.forEach((a, i) => boat(lane(i < 1 ? 0 : i + 1), yOf(a.d), ['#45ad4a', '#3f8fe0', '#ff9a2e'][i], false, 0));
    boat(lane(1), yOf(M.d), '#e8453c', true, this.stroke);
    if (this.cd > 0) Kid.text(c, this.cd > 0.05 ? String(Math.ceil(this.cd)) : '划！', V.W / 2, V.H * 0.35, 120, '#e0573c', 12);
    const all = [M, ...this.ai].map(b => b.d).sort((a, b) => b - a), pos = all.indexOf(M.d) + 1;
    Kid.text(c, `${Math.floor(M.d)} m　第 ${M.fin || pos} 名`, V.W / 2, P ? 140 : 96, 28, '#ffffff', 0);
    TiltUI.hint(c, this, V.H - 24, undefined, true);
  },
  hud() { return { L: `<b>${Math.floor(this.me.d)}</b> / ${this.LEN} m`, R: `⏱ ${this.t > 3 ? Math.floor(this.t - 3) : 0} 秒` }; },
});

// ---- 搖搖節奏 ----
ShakeGame({
  id: 'shakerhythm', name: '搖搖節奏', icon: '🥁', color: '#ff7a3d',
  desc: '音符掉到圈圈的時候搖一下手機，跟著音樂打節拍！（手機限定）',
  howto: '📱 手機限定：音符會從上面掉下來，掉到下面的圈圈時「搖一下」手機！剛好對到拍子是 PERFECT，太早太晚就 MISS。一共 40 個音符，連續對到有加分！（電腦：點畫面或按空白鍵）',
  start() {
    this.t = 0; this.score = 0; this.over = false; this.overText = ''; this.ls = null; this.combo = 0; this.maxC = 0; this.hitN = 0; this.judge = null; this.jt = 0; this.beat = -1;
    const B = 0.6; this.B = B; this.notes = []; let t = 3, i = 0; while (this.notes.length < 40) { const p = [1, 1, 1, 0.5, 0.5, 1, 1, 2][i % 8]; this.notes.push({ t, hit: 0 }); t += B * (i > 16 ? p : Math.max(1, p)); i++; }
    this.end = t + 1.5;
  },
  get ty() { return V.H * 0.78; },
  update(dt) {
    this.t += dt; this.jt = Math.max(0, this.jt - dt);
    const b = Math.floor(this.t / this.B); if (b !== this.beat) { this.beat = b; if (this.t < this.end) Sfx.drum(b % 2 ? 220 : 150, 0.18); }
    const n = Shk.d(this);
    for (let k = 0; k < n; k++) {
      const nt = this.notes.find(o => !o.hit && Math.abs(o.t - this.t) < 0.32);
      if (!nt) continue; const e = Math.abs(nt.t - this.t); nt.hit = 1;
      const per = e < 0.13; this.combo++; this.hitN++; this.maxC = Math.max(this.maxC, this.combo); this.score += (per ? 20 : 10) + Math.min(20, this.combo); this.judge = per ? 'PERFECT!' : 'GOOD'; this.jt = 0.5; Sfx.note(per ? 880 : 660, 0.2);
    }
    for (const o of this.notes) if (!o.hit && this.t - o.t > 0.32) { o.hit = -1; this.combo = 0; this.judge = 'MISS'; this.jt = 0.5; }
    if (this.t > this.end) { this.over = true; this.overText = `對到 ${this.hitN} / 40 拍，最多連續 ${this.maxC}！`; }
  },
  draw(c) {
    const g = c.createLinearGradient(0, 0, 0, V.H); g.addColorStop(0, '#3a1d4a'); g.addColorStop(1, '#ff9a6a'); c.fillStyle = g; c.fillRect(-20, -20, V.W + 40, V.H + 40);
    const x = V.W / 2, ty = this.ty, sp = 320, pulse = 1 + Math.max(0, 1 - (this.t % this.B) / this.B * 4) * 0.08;
    c.strokeStyle = 'rgba(255,255,255,0.25)'; c.lineWidth = 60; c.beginPath(); c.moveTo(x, 0); c.lineTo(x, ty); c.stroke();
    c.save(); c.strokeStyle = '#ffffff'; c.lineWidth = 8; c.beginPath(); c.arc(x, ty, 44 * pulse, 0, Math.PI * 2); c.stroke(); c.restore();
    for (const o of this.notes) { if (o.hit) continue; const y = ty - (o.t - this.t) * sp; if (y < -40 || y > V.H + 40) continue; Paper.circle(c, x, y, 32, '#ffd23f', { border: 4, blur: 6 }); Kid.text(c, '♪', x, y + 2, 36, '#e0573c', 0); }
    if (this.jt) Kid.text(c, this.judge, x, ty - 110, 44 * (1 + this.jt * 0.4), this.judge === 'MISS' ? '#7a62b8' : this.judge === 'GOOD' ? '#3f8fe0' : '#e0573c', 8);
    if (this.combo > 2) Kid.text(c, `${this.combo} 連擊`, x, Kid.portrait() ? 150 : 100, 34, '#ffffff', 0);
    Puppet.draw(c, App.pup, Kid.portrait() ? V.W * 0.16 : V.W * 0.25, V.H - 8, Kid.portrait() ? 150 : 220, Puppet.Poses.dance(this.t / this.B / 4));
    TiltUI.hint(c, this, V.H - 24, undefined, true);
  },
  hud() { return { L: `<b>${this.score}</b> 分`, R: `🎵 ${this.notes.filter(o => o.hit).length} / 40` }; },
});

// ---- 小狗甩甩水 ----
ShakeGame({
  id: 'puppydry', name: '小狗甩甩水', icon: '🐶', color: '#4fb3e8', kid: true,
  desc: '小動物洗完澡濕答答，搖一搖手機幫牠甩乾！（手機限定）',
  howto: '📱 手機限定：小動物剛洗完澡，身上都是水滴！用力搖一搖手機，牠就會跟著甩甩甩，把水滴甩掉。全部甩乾就換下一隻，一共 5 隻，越快分數越高！（電腦：狂點畫面或按空白鍵）',
  PETS: [['🐶', '小狗'], ['🐱', '小貓'], ['🐰', '兔子'], ['🐻', '小熊'], ['🐼', '熊貓'], ['🐷', '小豬']],
  start() { this.t = 0; this.score = 0; this.over = false; this.overText = '大家都乾乾淨淨！'; this.ls = null; this.k = 0; this.fly = []; this.order = Kid.shuffle(this.PETS.slice()).slice(0, 5); this.newPet(); },
  newPet() { this.pet = this.order[this.k]; this.drops = [...Array(24)].map(() => { const a = rand(0, Math.PI * 2), r = Math.sqrt(Math.random()); return { u: Math.cos(a) * r, v: Math.sin(a) * r }; }); this.wig = 0; this.rt = 0; this.doneT = 0; if (this.k) Kid.say(`${this.pet[1]}濕答答`); },
  onEnter(p) { if (p === 'ready') Kid.say(`${this.pet[1]}濕答答，幫牠甩乾！`); },
  update(dt) {
    this.t += dt; const n = Shk.d(this);
    for (const f of this.fly) { f.vy += 900 * dt; f.x += f.vx * dt; f.y += f.vy * dt; f.t += dt; } this.fly = this.fly.filter(f => f.t < 1.2);
    if (this.doneT) { this.doneT -= dt; if (this.doneT <= 0) { this.k++; if (this.k >= this.order.length) { this.over = true; return; } this.newPet(); } return; }
    this.rt += dt; this.wig = Math.max(0, this.wig - dt * 2.5);
    if (n) { this.wig = 1; Sfx.play('splash'); const C = this.ctr(), R = this.R;
      for (let i = 0; i < n * 2 && this.drops.length; i++) { const d = this.drops.splice(Math.floor(Math.random() * this.drops.length), 1)[0], x = C.x + d.u * R, y = C.y + d.v * R, a = Math.atan2(d.v, d.u); this.fly.push({ x, y, vx: Math.cos(a) * rand(300, 600), vy: Math.sin(a) * rand(300, 500) - 200, t: 0 }); }
      if (!this.drops.length) { const pts = Math.max(10, Math.round(40 - this.rt * 3)); this.score += pts; this.doneT = 1.8; Sfx.play('win'); Kid.say(`${this.pet[1]}乾了！謝謝你！`); FX.burst(C.x, C.y - R, 24, undefined, 0.9); FX.text(C.x, C.y - R - 60, `乾乾淨淨！+${pts}`, '#ff7a00', 34); }
    }
  },
  ctr() { return { x: V.W / 2, y: V.H * 0.52 }; },
  get R() { return Math.min(V.W * 0.32, V.H * 0.24, 170); },
  draw(c) {
    c.fillStyle = '#d8f0fb'; c.fillRect(-20, -20, V.W + 40, V.H + 40); for (let i = 0; i < 10; i++) { c.fillStyle = i % 2 ? '#c5e6f5' : '#d8f0fb'; c.fillRect(0, i * V.H / 10, V.W, V.H / 10); }
    const C = this.ctr(), R = this.R, w = Math.sin(this.t * 40) * this.wig * 0.25;
    c.fillStyle = '#e0c9a6'; c.beginPath(); c.ellipse(C.x, C.y + R * 1.05, R * 1.2, R * 0.22, 0, 0, Math.PI * 2); c.fill();
    c.save(); c.translate(C.x, C.y); c.rotate(w); Kid.emoji(c, this.pet[0], 0, 0, R * 1.8);
    if (!this.doneT) for (const d of this.drops) { const x = d.u * R * 0.85, y = d.v * R * 0.85; c.fillStyle = '#4fb3e8'; c.beginPath(); c.moveTo(x, y - 12); c.quadraticCurveTo(x + 9, y + 2, x, y + 7); c.quadraticCurveTo(x - 9, y + 2, x, y - 12); c.fill(); c.fillStyle = 'rgba(255,255,255,0.8)'; c.beginPath(); c.arc(x - 2, y, 2, 0, Math.PI * 2); c.fill(); }
    c.restore();
    for (const f of this.fly) { c.fillStyle = '#4fb3e8'; c.beginPath(); c.arc(f.x, f.y, 6, 0, Math.PI * 2); c.fill(); }
    if (this.doneT) Kid.emoji(c, '✨', C.x + R, C.y - R, 50);
    c.fillStyle = '#ffffff'; c.fillRect(V.W / 2 - 100, V.H * 0.86, 200, 14); c.fillStyle = '#4fb3e8'; c.fillRect(V.W / 2 - 100, V.H * 0.86, 200 * this.drops.length / 24, 14);
    Kid.text(c, this.doneT ? '乾了！' : `還有 ${this.drops.length} 滴水`, V.W / 2, V.H * 0.86 + 40, 24, '#2f7fc1', 6);
    TiltUI.hint(c, this, Kid.portrait() ? 140 : 96, undefined, true);
  },
  hud() { return { L: `<b>${this.score}</b> 分`, R: `第 ${Math.min(this.k + 1, 5)} / 5 隻` }; },
});
