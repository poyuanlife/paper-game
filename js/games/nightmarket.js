'use strict';
// =====================================================
//  夜市遊戲：撈金魚、套圈圈、夾娃娃
// =====================================================
const NightBG = (c, t, top = '#2b1f52', bot = '#5b2f7a') => {
  const g = c.createLinearGradient(0, 0, 0, V.H); g.addColorStop(0, top); g.addColorStop(1, bot); c.fillStyle = g; c.fillRect(-20, -20, V.W + 40, V.H + 40);
  for (let i = 0; i < Math.ceil(V.W / 70) + 1; i++) { const x = i * 70 + 20, y = 40 + Math.sin(i * 1.3) * 10; c.strokeStyle = 'rgba(255,255,255,0.3)'; c.lineWidth = 1; if (i) { c.beginPath(); c.moveTo(x - 70, 40 + Math.sin((i - 1) * 1.3) * 10); c.lineTo(x, y); c.stroke(); } Paper.circle(c, x, y + 12, 12, ['#e8453c', '#ffcc1f', '#ff7eb6'][i % 3], { border: 0, shadowColor: 'rgba(255,200,80,0.8)', blur: 12 + Math.sin(t * 3 + i) * 4 }); }
};

// ---- 撈金魚 ----
registerGame({
  id: 'goldfish', name: '夜市撈金魚', icon: '🐠', color: '#e9654b',
  desc: '用紙網撈金魚，小心紙網會破掉！',
  howto: '手指按住畫面，紙網就會放進水裡；移到金魚下面再「放開」就能把魚撈起來！紙網泡在水裡、動太快都會變爛，破掉就換下一支。一共 3 支紙網，金色的魚分數最多。',
  start() { this.t = 0; this.score = 0; this.over = false; this.overText = '撈到好多魚！'; this.poi = 3; this.hp = 1; this.fish = []; this.bowl = []; this.wasDown = false; this.px = V.W / 2; this.py = V.H / 2; this.brk = 0; for (let i = 0; i < 9; i++) this.addFish(); },
  pool() { const P = Kid.portrait(); return { x: 20, y: P ? 130 : 80, w: V.W - 40, h: V.H - (P ? 330 : 200) }; },
  addFish() { const A = this.pool(), gold = Math.random() < 0.15, black = !gold && Math.random() < 0.2; this.fish.push({ x: rand(A.x + 40, A.x + A.w - 40), y: rand(A.y + 40, A.y + A.h - 40), a: rand(0, 6), sp: rand(40, 90) * (gold ? 1.5 : 1), gold, black, s: gold ? 26 : rand(20, 30), turn: 0 }); },
  update(dt) {
    this.t += dt; this.brk = Math.max(0, this.brk - dt); const A = this.pool();
    for (const f of this.fish) { f.turn -= dt; if (f.turn <= 0) { f.a += rand(-1.2, 1.2); f.turn = rand(0.5, 2); } f.x += Math.cos(f.a) * f.sp * dt; f.y += Math.sin(f.a) * f.sp * dt; if (f.x < A.x + 25 || f.x > A.x + A.w - 25) { f.a = Math.PI - f.a; f.x = clamp(f.x, A.x + 25, A.x + A.w - 25); } if (f.y < A.y + 25 || f.y > A.y + A.h - 25) { f.a = -f.a; f.y = clamp(f.y, A.y + 25, A.y + A.h - 25); } }
    if (this.brk) return;
    const inPool = Input.down && Input.y > A.y && Input.y < A.y + A.h;
    if (inPool) { const mv = Math.hypot(Input.x - this.px, Input.y - this.py); this.hp -= dt * 0.12 + mv * 0.0009; if (!this.wasDown) Sfx.play('splash'); }
    this.px = Input.x; this.py = Input.y;
    if (this.wasDown && !inPool) {   // 拿起來：網子裡的魚撈起來
      const R = 46, got = this.fish.filter(f => Math.hypot(f.x - this.px, f.y - this.py) < R).slice(0, 2);
      for (const f of got) { this.fish.splice(this.fish.indexOf(f), 1); const pts = f.gold ? 50 : f.black ? 20 : 10; this.score += pts; this.bowl.push(f); this.hp -= 0.12; Sfx.play(f.gold ? 'star' : 'catch'); FX.text(this.px, this.py - 50, `+${pts}`, f.gold ? '#ffd23f' : '#ff7a00', 30); this.addFish(); }
      if (!got.length && this.hp < 1) Sfx.play('whiff');
    }
    if (this.hp <= 0) { this.poi--; this.brk = 1.2; this.hp = 1; Sfx.play('crack'); FX.text(V.W / 2, A.y + A.h / 2, '紙網破掉了！', '#e8453c', 36); if (this.poi <= 0) { this.over = true; this.overText = `撈到 ${this.bowl.length} 條魚！`; } }
    this.wasDown = inPool;
  },
  draw(c) {
    NightBG(c, this.t); const A = this.pool();
    Paper.rect(c, A.x - 10, A.y - 10, A.w + 20, A.h + 20, '#3f8fe0', 22, { border: 6 }); c.fillStyle = '#7fd0f5'; c.fillRect(A.x, A.y, A.w, A.h);
    c.strokeStyle = 'rgba(255,255,255,0.25)'; c.lineWidth = 2; for (let i = 0; i < 10; i++) { const x = A.x + (i * 97) % A.w, y = A.y + (i * 61 + this.t * 15) % A.h; c.beginPath(); c.moveTo(x - 15, y); c.quadraticCurveTo(x, y - 5, x + 15, y); c.stroke(); }
    for (const f of this.fish) { c.save(); c.translate(f.x, f.y); c.rotate(f.a); const col = f.gold ? '#ffd23f' : f.black ? '#2a2a33' : '#ff7a3a'; Paper.shape(c, cc => { cc.ellipse(0, 0, f.s, f.s * 0.5, 0, 0, Math.PI * 2); }, col, { border: 0, blur: 3 }); Paper.shape(c, cc => { cc.moveTo(-f.s * 0.8, 0); cc.lineTo(-f.s * 1.5, -f.s * 0.5 + Math.sin(this.t * 12 + f.x) * 4); cc.lineTo(-f.s * 1.5, f.s * 0.5 + Math.sin(this.t * 12 + f.x) * 4); cc.closePath(); }, col, { border: 0, blur: 2 }); c.fillStyle = '#fff'; c.beginPath(); c.arc(f.s * 0.5, -f.s * 0.15, 3, 0, Math.PI * 2); c.fill(); c.restore(); }
    // 紙網
    if (!this.brk && (Input.down || this.t < 2)) {
      const x = Input.down ? this.px : V.W / 2, y = Input.down ? this.py : A.y + A.h / 2; c.strokeStyle = '#e8453c'; c.lineWidth = 6; c.beginPath(); c.arc(x, y, 46, 0, Math.PI * 2); c.stroke();
      c.fillStyle = `rgba(255,255,255,${0.15 + this.hp * 0.35})`; c.beginPath(); c.arc(x, y, 43, 0, Math.PI * 2); c.fill(); c.strokeStyle = '#e8453c'; c.lineWidth = 8; c.beginPath(); c.moveTo(x + 32, y + 32); c.lineTo(x + 80, y + 80); c.stroke();
    }
    // 碗 + 紙片人
    const bx = V.W * 0.7, by = V.H - (Kid.portrait() ? 110 : 60); Paper.shape(c, cc => { cc.ellipse(bx, by, 80, 40, 0, 0, Math.PI); cc.closePath(); }, 'rgba(200,235,255,0.9)', { border: 4 });
    this.bowl.slice(-6).forEach((f, i) => Kid.emoji(c, f.gold ? '🐠' : '🐟', bx - 50 + i * 20, by + 14, 22));
    Puppet.draw(c, App.pup, V.W * 0.2, V.H - 10, Kid.portrait() ? 170 : 150, Puppet.Poses.idle(this.t));
    const w = 160; Paper.rect(c, V.W / 2 - w / 2, A.y - 34, w, 18, '#fffdf5', 9, { border: 3 }); c.fillStyle = this.hp > 0.4 ? '#45ad4a' : '#e8453c'; c.fillRect(V.W / 2 - w / 2 + 3, A.y - 31, (w - 6) * Math.max(0, this.hp), 12);
  },
  hud() { return { L: `<b>${this.score}</b> 分　🐟 ${this.bowl.length}`, R: '🥢'.repeat(Math.max(0, this.poi)) }; },
});

// ---- 套圈圈 ----
registerGame({
  id: 'ringtoss', name: '夜市套圈圈', icon: '🍾', color: '#ff9a2e',
  desc: '往上滑丟出圈圈，套中獎品就帶回家！',
  howto: '手指在下面按住往上「滑」把圈圈丟出去，滑的方向和力道決定圈圈飛到哪裡。圈圈套住瓶子上的獎品就能得到它！越後面的獎品越大越難套。一共 10 個圈圈。',
  PRIZES: ['🧸', '🎁', '🍭', '🐶', '🎈', '⚽', '🦄', '🚗', '🍬', '👑', '🎀', '🐱'],
  start() { this.t = 0; this.score = 0; this.over = false; this.overText = ''; this.rings = 10; this.fly = null; this.sw = Kid.makeSwipe(); this.won = []; this.setup(); },
  setup() { const P = Kid.portrait(), cols = P ? 4 : 6, rows = 3, top = P ? V.H * 0.22 : V.H * 0.16, w = V.W * (P ? 0.84 : 0.62); this.bottles = []; for (let r = 0; r < rows; r++) for (let k = 0; k < cols; k++) this.bottles.push({ x: V.W / 2 + (k - (cols - 1) / 2) * w / cols + (r % 2 ? w / cols / 4 : 0), y: top + r * (P ? 85 : 80), r, e: pick(this.PRIZES), got: 0, pts: [30, 20, 10][r] }); },
  get hand() { return { x: V.W / 2, y: V.H - (Kid.portrait() ? 120 : 80) }; },
  tap(x, y) { if (!this.fly && this.rings > 0 && y > V.H * 0.55) this.sw.begin(x, y); },
  update(dt) {
    this.t += dt;
    this.sw.step(e => { if (e.vy > -300 || this.fly) return; const H = this.hand, k = clamp(-e.vy / 2400, 0.25, 1); const tx = clamp(H.x + e.vx * 0.22, 20, V.W - 20), ty = H.y - k * (H.y - V.H * 0.1) * 1.05; this.fly = { x0: H.x, y0: H.y, tx: tx + rand(-12, 12), ty: ty + rand(-10, 10), t: 0 }; this.rings--; Sfx.play('swish'); });
    const f = this.fly;
    if (f) { f.t += dt / 0.7; if (f.t >= 1) {
      const hit = this.bottles.filter(b => !b.got && Math.hypot(b.x - f.tx, (b.y - 30 - f.ty) * 1.4) < 30).sort((a, b) => Math.hypot(a.x - f.tx, a.y - f.ty) - Math.hypot(b.x - f.tx, b.y - f.ty))[0];
      if (hit) { hit.got = 1; this.score += hit.pts; this.won.push(hit.e); Sfx.play('win'); FX.burst(hit.x, hit.y - 30, 24, undefined, 0.8); FX.text(hit.x, hit.y - 80, `套中了！+${hit.pts}`, '#ffd23f', 30); }
      else { Sfx.play('thud'); FX.text(f.tx, f.ty - 30, '差一點！', '#ffffff', 24); }
      this.fly = null; if (this.rings <= 0) { this.endT = 1.4; }
    } }
    if (this.endT) { this.endT -= dt; if (this.endT <= 0) { this.over = true; this.overText = this.won.length ? `贏到 ${this.won.length} 個獎品！` : '下次一定套得到！'; } }
  },
  draw(c) {
    NightBG(c, this.t, '#3a1f42', '#7a3a5a'); const P = Kid.portrait();
    Paper.rect(c, 10, V.H * (P ? 0.17 : 0.11), V.W - 20, P ? 300 : 280, '#c98a4b', 16, { border: 5 });
    for (const b of this.bottles.slice().sort((a, b) => a.y - b.y)) { const s = 1 + b.r * 0.15; Paper.rect(c, b.x - 10 * s, b.y - 26 * s, 20 * s, 34 * s, b.got ? 'rgba(160,220,160,0.7)' : 'rgba(150,210,255,0.75)', 8, { border: 2, blur: 3 }); if (!b.got) Kid.emoji(c, b.e, b.x, b.y - 42 * s, 34 * s); }
    const f = this.fly; if (f) { const k = f.t, x = f.x0 + (f.tx - f.x0) * k, y = f.y0 + (f.ty - f.y0) * k - Math.sin(k * Math.PI) * 120, s = 1.4 - k * 0.6; c.strokeStyle = '#e8453c'; c.lineWidth = 7 * s; c.beginPath(); c.ellipse(x, y, 34 * s, 14 * s, 0, 0, Math.PI * 2); c.stroke(); }
    const H = this.hand; if (!f && this.rings) { c.strokeStyle = '#e8453c'; c.lineWidth = 9; c.beginPath(); c.ellipse(H.x, H.y, 46, 20, 0, 0, Math.PI * 2); c.stroke(); Kid.text(c, '👆 往上滑丟出去', H.x, H.y + 52, 20, '#ffffff', 5); }
    for (let i = 0; i < this.rings; i++) { c.strokeStyle = '#ffcc1f'; c.lineWidth = 4; c.beginPath(); c.arc(30 + i * 22, V.H - 30, 9, 0, Math.PI * 2); c.stroke(); }
    this.won.slice(-8).forEach((e, i) => Kid.emoji(c, e, V.W - 30 - i * 32, V.H - 32, 28));
    if (!P) Puppet.draw(c, App.pup, 90, V.H - 4, 160, this.won.length && this.fly == null && this.endT ? Puppet.Poses.cheer(this.t) : Puppet.Poses.idle(this.t));
  },
  hud() { return { L: `<b>${this.score}</b> 分　🎁 ${this.won.length}`, R: `⭕ 剩 ${this.rings}` }; },
});

// ---- 夾娃娃 ----
registerGame({
  id: 'claw', name: '夾娃娃機', icon: '🧸', color: '#ff7eb6',
  desc: '移動爪子對準娃娃，夾起來掉進出口！',
  howto: '按住「▶ 移動」爪子就會往右走，放開就停。再按「⬇ 夾！」爪子會下去夾娃娃。對得越準越容易夾起來，夾到後會自己送到左邊的出口。一共 8 次機會！',
  TOYS: ['🧸', '🐶', '🐱', '🐰', '🦄', '🐼', '🐸', '🐵', '🐷', '🦊'],
  start() { this.t = 0; this.score = 0; this.over = false; this.overText = ''; this.tries = 8; this.got = []; this.st = 'move'; this.cx = 0.15; this.cy = 0; this.held = null; this.fill(); },
  box() { const P = Kid.portrait(), w = Math.min(V.W - 40, 560), h = Math.min(V.H * (P ? 0.55 : 0.68), 480); return { x: V.W / 2 - w / 2, y: P ? 120 : 76, w, h }; },
  fill() { const B = this.box(); this.toys = []; for (let i = 0; i < 9; i++) this.toys.push({ u: 0.28 + (i % 5) * 0.15 + rand(-0.04, 0.04), e: pick(this.TOYS), s: rand(52, 64), row: Math.floor(i / 5) }); },
  btns() { const B = this.box(), y = B.y + B.h + 70, w = Math.min(170, V.W * 0.4); return { move: { x: V.W / 2 - w / 2 - 10, y, w, h: 74 }, grab: { x: V.W / 2 + w / 2 + 10, y, w, h: 74 } }; },
  tap(x, y) { const b = this.btns(); if (this.st === 'move' && Kid.hit(b.grab, x, y)) { this.st = 'down'; Sfx.play('click'); } },
  key(k) { if (k === 'space' || k === 'enter' || k === 'arrowdown') { if (this.st === 'move') { this.st = 'down'; Sfx.play('click'); } } },
  update(dt) {
    this.t += dt; const B = this.box(), b = this.btns(), floorV = 0.78;
    if (this.st === 'move') { if ((Input.down && Kid.hit(b.move, Input.x, Input.y)) || Input.keys.arrowright) { this.cx = Math.min(0.95, this.cx + dt * 0.35); if (Math.random() < dt * 8) Sfx.play('tick'); } }
    else if (this.st === 'down') { this.cy += dt * 0.9; if (this.cy >= floorV - 0.1) { this.st = 'grab'; this.stT = 0; const near = this.toys.filter(t => !t.gone).sort((a, b) => Math.abs(a.u - this.cx) - Math.abs(b.u - this.cx))[0]; const d = near ? Math.abs(near.u - this.cx) : 1; if (near && d < 0.07 && Math.random() < 1 - d * 9) { this.held = near; near.gone = 1; Sfx.play('snap'); } else Sfx.play('whiff'); } }
    else if (this.st === 'grab') { this.stT += dt; if (this.stT > 0.5) this.st = 'up'; }
    else if (this.st === 'up') { this.cy -= dt * 0.8; if (this.held && this.cy < 0.4 && Math.random() < dt * 0.25) { const t = this.held; this.held = null; t.gone = 0; t.u = this.cx; Sfx.play('boing'); FX.text(B.x + this.cx * B.w, B.y + B.h * 0.4, '掉下去了！', '#7a62b8', 26); } if (this.cy <= 0) { this.cy = 0; this.st = 'back'; } }
    else if (this.st === 'back') { this.cx = Math.max(0.08, this.cx - dt * 0.5); if (this.cx <= 0.08) {
      if (this.held) { this.got.push(this.held.e); this.score += 50; Sfx.play('win'); FX.burst(B.x + 30, B.y + B.h - 30, 30, undefined, 1); FX.text(V.W / 2, B.y + B.h * 0.3, `夾到 ${this.held.e} 了！`, '#ff4fa3', 36); this.toys = this.toys.filter(t => t !== this.held); this.held = null; if (this.toys.length < 4) this.fill(); }
      this.tries--; if (this.tries <= 0) { this.over = true; this.overText = this.got.length ? `夾到 ${this.got.length} 隻娃娃！` : '娃娃好難夾～下次再來！'; return; } this.st = 'move'; this.cx = 0.15; } }
  },
  draw(c) {
    NightBG(c, this.t, '#3a2a6a', '#ff7eb6'); const B = this.box();
    Paper.rect(c, B.x - 14, B.y - 14, B.w + 28, B.h + 28, '#ff7eb6', 22, { border: 6 }); c.fillStyle = 'rgba(220,240,255,0.55)'; c.fillRect(B.x, B.y, B.w, B.h);
    c.fillStyle = '#ffd6e8'; c.fillRect(B.x, B.y + B.h * 0.78, B.w, B.h * 0.22); c.fillStyle = '#2a2a33'; c.fillRect(B.x + 6, B.y + B.h * 0.7, B.w * 0.14, B.h * 0.3); Kid.text(c, '出口', B.x + 6 + B.w * 0.07, B.y + B.h * 0.66, 18, '#ffffff', 4);
    for (const t of this.toys) if (!t.gone) Kid.emoji(c, t.e, B.x + t.u * B.w, B.y + B.h * (0.86 - t.row * 0.09), t.s);
    const x = B.x + this.cx * B.w, y = B.y + 20 + this.cy * B.h; c.fillStyle = '#9aa0b5'; c.fillRect(B.x, B.y + 8, B.w, 8); c.strokeStyle = '#555'; c.lineWidth = 3; c.beginPath(); c.moveTo(x, B.y + 16); c.lineTo(x, y); c.stroke();
    const open = this.st === 'down' ? 0.6 : 0.2; Paper.rect(c, x - 18, y - 8, 36, 16, '#c9cdd8', 5, { border: 2, blur: 2 });
    for (const s of [-1, 1]) { c.save(); c.translate(x + s * 14, y + 6); c.rotate(s * open); c.strokeStyle = '#9aa0b5'; c.lineWidth = 6; c.lineCap = 'round'; c.beginPath(); c.moveTo(0, 0); c.lineTo(s * 8, 26); c.lineTo(0, 40); c.stroke(); c.restore(); }
    if (this.held) Kid.emoji(c, this.held.e, x, y + 42, this.held.s);
    const b = this.btns(); Kid.button(c, b.move, '▶ 移動', this.st === 'move' ? '#3f8fe0' : '#b8a890', { size: 26 }); Kid.button(c, b.grab, '⬇ 夾！', this.st === 'move' ? '#e8453c' : '#b8a890', { size: 26 });
    this.got.slice(-8).forEach((e, i) => Kid.emoji(c, e, 30 + i * 36, V.H - 30, 32));
  },
  hud() { return { L: `<b>${this.score}</b> 分　🧸 ${this.got.length}`, R: `剩 ${this.tries} 次` }; },
});
