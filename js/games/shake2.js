'use strict';
// =====================================================
//  搖一搖第二彈：搖搖下雨、搖搖煙火、夜市灑胡椒粉、搖爆米花
// =====================================================

// ---- 搖搖下雨 ----
ShakeGame({
  id: 'rainmaker', name: '搖搖下雨', icon: '🌧️', color: '#4f8fd6', kid: true,
  desc: '搖一搖手機，雲朵就會下雨，讓小花長大！（手機限定）',
  howto: '📱 手機限定：用力搖一搖手機，天上的雲就會下雨！雨滴到花盆裡，種子會慢慢發芽、長成花。雲會飄來飄去，看準了再搖！不會輸，限時 40 秒。（電腦：狂點畫面或按空白鍵）',
  TIME: 40, FL: ['🌷', '🌻', '🌹', '🌼', '🌸', '🌺'],
  start() { this.t = 0; this.left = this.TIME; this.score = 0; this.over = false; this.overText = '花園開滿花了！'; this.ls = null; this.drops = []; this.bloom = 0; this.pots = [0, 1, 2, 3, 4].map(i => ({ i, w: 0, e: pick(this.FL), done: 0 })); },
  potX(i) { return V.W * (0.12 + i * 0.19); },
  get potY() { return V.H * 0.84; },
  cloudX() { return V.W / 2 + Math.sin(this.t * 0.7) * V.W * 0.33 + Tilt.x * V.W * 0.12; },
  update(dt) {
    this.t += dt; this.left -= dt; if (this.left <= 0) { this.left = 0; this.over = true; this.overText = `開了 ${this.bloom} 朵花！`; return; }
    const d = Shk.d(this), cx = this.cloudX(), cy = Kid.portrait() ? 190 : 140;
    for (let k = 0; k < d * 5; k++) this.drops.push({ x: cx + rand(-70, 70), y: cy + rand(10, 30), vy: rand(200, 320) });
    if (d) Sfx.play('splash');
    for (const r of this.drops) {
      r.vy += 900 * dt; r.y += r.vy * dt;
      if (r.y > this.potY - 30) {
        r.dead = 1; const p = this.pots.find(p => Math.abs(this.potX(p.i) - r.x) < 50);
        if (p && !p.done) { p.w += 0.03; if (p.w >= 1) { p.done = 2; this.bloom++; this.score += 20; Sfx.play('star'); FX.burst(this.potX(p.i), this.potY - 110, 16, undefined, 0.7); FX.text(this.potX(p.i), this.potY - 170, '開花了！+20', '#e86fae', 28); if (this.bloom % 3 === 0) Kid.say('好漂亮的花！'); } else if (Math.random() < 0.3) this.score += 1; }
      }
    }
    this.drops = this.drops.filter(r => !r.dead);
    for (const p of this.pots) if (p.done) { p.done -= dt; if (p.done <= 0) { p.done = 0; p.w = 0; p.e = pick(this.FL); } }
  },
  draw(c) {
    const gy = Kid.ground(c, 'meadow', this.t, 0.9), cx = this.cloudX(), cy = Kid.portrait() ? 190 : 140;
    for (const p of this.pots) {
      const x = this.potX(p.i), y = this.potY, k = p.done ? 1 : p.w;
      if (k > 0.15) { c.strokeStyle = '#3d8b2a'; c.lineWidth = 5; c.beginPath(); c.moveTo(x, y - 30); c.lineTo(x, y - 30 - k * 70); c.stroke(); }
      if (k > 0.35) { Kid.emoji(c, '🌿', x - 14, y - 50 - k * 20, 28 * k); }
      if (p.done) Kid.emoji(c, p.e, x, y - 110, 56 + Math.sin(this.t * 6) * 4);
      else if (k > 0.15) Kid.emoji(c, '🌱', x, y - 30 - k * 70, 30);
      Paper.shape(c, cc => { cc.moveTo(x - 40, y - 34); cc.lineTo(x + 40, y - 34); cc.lineTo(x + 30, y + 20); cc.lineTo(x - 30, y + 20); cc.closePath(); }, '#d9774a', { border: 4 });
      c.fillStyle = '#e0e6ec'; c.fillRect(x - 28, y + 28, 56, 8); c.fillStyle = '#4fb3e8'; c.fillRect(x - 28, y + 28, 56 * (p.done ? 1 : p.w), 8);
    }
    c.strokeStyle = '#4fb3e8'; c.lineWidth = 3; for (const r of this.drops) { c.beginPath(); c.moveTo(r.x, r.y); c.lineTo(r.x, r.y + 12); c.stroke(); }
    const sh = Math.sin(this.t * 40) * Tilt.shake * 10;
    for (const [dx, dy, r] of [[-60, 10, 44], [0, -10, 58], [62, 8, 46]]) Paper.circle(c, cx + dx + sh, cy + dy, r, '#eef2f8', { border: 4, blur: 6 });
    Kid.head(c, cx + sh, cy + 6, 26, {}, 30);
    TiltUI.hint(c, this, Kid.portrait() ? 300 : 240, '#2a4a6a', true);
  },
  hud() { return { L: `<b>${this.score}</b> 分　🌷 ${this.bloom}`, R: `⏱ ${Math.ceil(this.left)}` }; },
});

// ---- 搖搖煙火 ----
ShakeGame({
  id: 'fireworks', name: '搖搖煙火', icon: '🎆', color: '#2c2f6b', kid: true,
  desc: '搖一下就放一支煙火，把天上的燈籠點亮！（手機限定）',
  howto: '📱 手機限定：每搖一下手機就會放一支煙火！手機往左右歪可以決定煙火從哪裡飛上去。煙火炸開的時候碰到 🏮 燈籠和 ⭐ 星星就能得分。不會輸，限時 40 秒。（電腦：點畫面的位置放煙火，或按空白鍵）',
  TIME: 40, COLS: [['#ff6b6b', '#ffd93d'], ['#4d96ff', '#bfe8ff'], ['#6bcb77', '#ffffff'], ['#c77dff', '#ffc6e8'], ['#ff9f43', '#ffd93d']],
  start() { this.t = 0; this.left = this.TIME; this.score = 0; this.over = false; this.overText = '好漂亮的煙火秀！'; this.ls = null; this.rk = []; this.sp = []; this.tg = []; this.cool = 0; this.n = 0; },
  tap(x) { this.tapX = x; Tilt.pulse(); },
  aimX() { if (this.tapX != null && !Tilt.motion) { const x = this.tapX; this.tapX = null; return x; } return V.W / 2 + Tilt.x * V.W * 0.42; },
  update(dt) {
    this.t += dt; this.left -= dt; this.cool -= dt; if (this.left <= 0) { this.left = 0; this.over = true; this.overText = `放了 ${this.n} 支煙火！`; return; }
    const d = Shk.d(this);
    if (d && this.cool <= 0) { this.cool = 0.12; this.n++; const x = clamp(this.aimX(), 40, V.W - 40); this.rk.push({ x, y: V.H - 40, vy: -rand(700, 900), top: rand(V.H * 0.18, V.H * 0.5), col: pick(this.COLS) }); Sfx.play('swish'); }
    while (this.tg.length < 6) { const top = Kid.portrait() ? 130 : 90; this.tg.push({ x: rand(50, V.W - 50), y: rand(top, V.H * 0.55), e: Math.random() < 0.3 ? '⭐' : '🏮', vx: rand(-30, 30), ph: rand(0, 6), born: 0 }); }
    for (const t of this.tg) { t.born = Math.min(1, t.born + dt * 2); t.x += t.vx * dt; if (t.x < 40 || t.x > V.W - 40) t.vx *= -1; }
    for (const r of this.rk) {
      r.y += r.vy * dt; r.vy += 300 * dt;
      if (r.y <= r.top || r.vy >= 0) {
        r.dead = 1; Sfx.play('boom'); const N = 34;
        for (let i = 0; i < N; i++) { const a = i / N * Math.PI * 2, s = rand(180, 260); this.sp.push({ x: r.x, y: r.y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, t: 0, c: r.col[i % 2] }); }
        for (const t of this.tg) if (!t.dead && Math.hypot(t.x - r.x, t.y - r.y) < 110) { t.dead = 1; const pts = t.e === '⭐' ? 20 : 10; this.score += pts; FX.text(t.x, t.y - 30, '+' + pts, '#ffd23f', 28); Sfx.play('star'); }
      }
    }
    this.rk = this.rk.filter(r => !r.dead); this.tg = this.tg.filter(t => !t.dead);
    for (const p of this.sp) { p.t += dt; p.vx *= 1 - dt * 1.5; p.vy = p.vy * (1 - dt * 1.5) + 120 * dt; p.x += p.vx * dt; p.y += p.vy * dt; }
    this.sp = this.sp.filter(p => p.t < 1.4);
  },
  draw(c) {
    const gr = c.createLinearGradient(0, 0, 0, V.H); gr.addColorStop(0, '#0d1033'); gr.addColorStop(1, '#3a2f6b'); c.fillStyle = gr; c.fillRect(-20, -20, V.W + 40, V.H + 40);
    c.fillStyle = 'rgba(255,255,255,0.6)'; for (let i = 0; i < 40; i++) { c.beginPath(); c.arc((i * 173) % V.W, (i * 91) % (V.H * 0.7), 1 + (i % 2), 0, Math.PI * 2); c.fill(); }
    c.fillStyle = '#1a1a33'; c.beginPath(); c.moveTo(-20, V.H); for (let x = -20; x <= V.W + 20; x += 40) c.lineTo(x, V.H - 70 - ((x * 7) % 50)); c.lineTo(V.W + 20, V.H); c.fill();
    for (const t of this.tg) Kid.emoji(c, t.e, t.x, t.y + Math.sin(this.t * 2 + t.ph) * 6, 40 * t.born);
    for (const r of this.rk) { c.fillStyle = '#ffd23f'; c.beginPath(); c.arc(r.x, r.y, 5, 0, Math.PI * 2); c.fill(); c.strokeStyle = 'rgba(255,210,63,0.5)'; c.lineWidth = 3; c.beginPath(); c.moveTo(r.x, r.y); c.lineTo(r.x, r.y + 30); c.stroke(); }
    c.save(); c.globalCompositeOperation = 'lighter';
    for (const p of this.sp) { c.globalAlpha = Math.max(0, 1 - p.t / 1.4); c.fillStyle = p.c; c.beginPath(); c.arc(p.x, p.y, 3.5, 0, Math.PI * 2); c.fill(); }
    c.restore();
    const ax = clamp(V.W / 2 + Tilt.x * V.W * 0.42, 40, V.W - 40); c.fillStyle = 'rgba(255,210,63,0.5)'; c.beginPath(); c.moveTo(ax, V.H - 60); c.lineTo(ax - 12, V.H - 40); c.lineTo(ax + 12, V.H - 40); c.fill();
    Puppet.draw(c, App.pup, V.W * 0.12 + 20, V.H - 10, 130, this.sp.length ? Puppet.Poses.cheer(this.t) : Puppet.Poses.idle(this.t));
    TiltUI.hint(c, this, V.H * 0.62, undefined, true);
  },
  hud() { return { L: `<b>${this.score}</b> 分　🎆 ${this.n}`, R: `⏱ ${Math.ceil(this.left)}` }; },
});

// ---- 夜市灑胡椒粉 ----
ShakeGame({
  id: 'seasoning', name: '夜市灑胡椒粉', icon: '🧂', color: '#c9772f',
  desc: '歪手機移動罐子、搖一搖灑粉，不多不少剛剛好！（手機限定）',
  howto: '📱 手機限定：食物在檯子上一個一個經過。左右歪手機移動胡椒罐，搖一搖就會灑粉。每份食物灑到「綠色」剛剛好最高分，灑太多會太鹹！限時 45 秒。（電腦：← → 移動、空白鍵或點畫面灑粉）',
  TIME: 45, FOOD: ['🍗', '🍟', '🍤', '🌽', '🍢', '🥟'],
  start() { this.t = 0; this.left = this.TIME; this.score = 0; this.over = false; this.overText = '老闆，生意興隆！'; this.ls = null; this.food = []; this.gr = []; this.sx = V.W / 2; this.spawnT = 0; this.perfect = 0; },
  get beltY() { return V.H * 0.72; },
  get shY() { return Kid.portrait() ? V.H * 0.3 : V.H * 0.24; },
  update(dt) {
    this.t += dt; this.left -= dt; if (this.left <= 0) { this.left = 0; this.over = true; this.overText = `${this.perfect} 份剛剛好！`; return; }
    this.sx = clamp(this.sx + Tilt.x * 700 * dt, 50, V.W - 50);
    const d = Shk.d(this);
    for (let k = 0; k < d * 6; k++) this.gr.push({ x: this.sx + rand(-14, 14), y: this.shY + 40, vy: rand(80, 200), vx: rand(-40, 40) });
    if (d) Sfx.play('rustle');
    this.spawnT -= dt; const sp = 110 + this.t * 2;
    if (this.spawnT <= 0) { this.food.push({ x: -60, e: pick(this.FOOD), n: 0, need: 10 + Math.floor(Math.random() * 6) }); this.spawnT = 2.4 - Math.min(1, this.t / 60); }
    for (const f of this.food) {
      f.x += sp * dt;
      if (f.x > V.W + 60 && !f.dead) {
        f.dead = 1; const r = f.n / f.need;
        if (r >= 0.8 && r <= 1.25) { this.score += 30; this.perfect++; Sfx.play('star'); FX.text(V.W - 90, this.beltY - 80, '剛剛好！+30', '#45ad4a', 30); }
        else if (r > 1.25) { this.score = Math.max(0, this.score - 5); Sfx.play('nope'); FX.text(V.W - 90, this.beltY - 80, '太鹹了！', '#e8453c', 30); }
        else if (r >= 0.4) { this.score += 10; Sfx.play('coin'); FX.text(V.W - 90, this.beltY - 80, '有點淡 +10', '#ff9a2e', 26); }
        else FX.text(V.W - 90, this.beltY - 80, '沒味道…', '#7a62b8', 26);
      }
    }
    for (const g of this.gr) {
      g.vy += 700 * dt; g.y += g.vy * dt; g.x += g.vx * dt;
      if (g.y > this.beltY - 30) { g.dead = 1; const f = this.food.find(f => !f.dead && Math.abs(f.x - g.x) < 44); if (f) f.n++; }
    }
    this.food = this.food.filter(f => !f.dead); this.gr = this.gr.filter(g => !g.dead);
  },
  draw(c) {
    const gr = c.createLinearGradient(0, 0, 0, V.H); gr.addColorStop(0, '#2a1d3a'); gr.addColorStop(1, '#5a3a4a'); c.fillStyle = gr; c.fillRect(-20, -20, V.W + 40, V.H + 40);
    for (let i = 0; i < 9; i++) { const x = (i + 0.5) * V.W / 9; c.strokeStyle = '#3a2a2a'; c.lineWidth = 2; c.beginPath(); c.moveTo(x, 0); c.lineTo(x, 40); c.stroke(); Kid.emoji(c, '🏮', x, 60 + Math.sin(this.t * 2 + i) * 3, 36); }
    const by = this.beltY;
    Paper.rect(c, -20, by, V.W + 40, 40, '#7a7f8a', 6, { border: 3 });
    c.fillStyle = '#5a5f6a'; for (let x = -((this.t * 120) % 40); x < V.W; x += 40) c.fillRect(x, by + 6, 20, 28);
    Paper.rect(c, -20, by + 40, V.W + 40, V.H, '#c98a4b', 0, { border: 0 });
    for (const f of this.food) {
      Paper.circle(c, f.x, by - 18, 40, '#fffdf5', { border: 2, blur: 3 }); Kid.emoji(c, f.e, f.x, by - 22, 52);
      c.fillStyle = 'rgba(80,60,40,0.7)'; for (let i = 0; i < Math.min(f.n, 30); i++) { c.beginPath(); c.arc(f.x + Math.sin(i * 2.3) * 22, by - 28 + Math.cos(i * 1.7) * 14, 2, 0, Math.PI * 2); c.fill(); }
      const r = f.n / f.need, w = 70, x0 = f.x - w / 2, y0 = by + 50;
      c.fillStyle = '#ffffff'; c.fillRect(x0, y0, w, 10); c.fillStyle = 'rgba(69,173,74,0.5)'; c.fillRect(x0 + w * 0.8 / 1.6, y0, w * 0.45 / 1.6, 10);
      c.fillStyle = r > 1.25 ? '#e8453c' : r >= 0.8 ? '#45ad4a' : '#ff9a2e'; c.fillRect(x0, y0 + 2, Math.min(w, w * r / 1.6), 6);
    }
    c.fillStyle = '#5a4a3a'; for (const g of this.gr) c.fillRect(g.x - 1.5, g.y - 1.5, 3, 3);
    const sh = Math.sin(this.t * 50) * Tilt.shake * 0.4;
    c.save(); c.translate(this.sx, this.shY); c.rotate(Math.PI + sh); Kid.emoji(c, '🧂', 0, 0, 70); c.restore();
    Puppet.draw(c, App.pup, Kid.portrait() ? V.W * 0.14 : V.W * 0.08, V.H - 6, Kid.portrait() ? 130 : 150, Puppet.Poses.idle(this.t));
    TiltUI.hint(c, this, by + 100, undefined, true);
  },
  hud() { return { L: `<b>${this.score}</b> 分　✅ ${this.perfect}`, R: `⏱ ${Math.ceil(this.left)}` }; },
});

// ---- 搖爆米花 ----
ShakeGame({
  id: 'popcorn', name: '搖爆米花', icon: '🍿', color: '#e8453c',
  desc: '搖鍋子加熱，溫度剛好爆米花就會一直跳出來！（手機限定）',
  howto: '📱 手機限定：搖一搖手機讓鍋子變熱。溫度在「綠色」範圍時玉米粒會砰砰砰爆開，跳進桶子裡！搖太兇會變「紅色」燒焦冒煙喔。限時 40 秒，看你能爆多少！（電腦：狂點畫面或按空白鍵）',
  TIME: 40,
  start() { this.t = 0; this.left = this.TIME; this.score = 0; this.over = false; this.overText = '好香的爆米花！'; this.ls = null; this.heat = 0; this.pop = []; this.acc = 0; this.n = 0; this.burnT = 0; this.smoke = []; },
  update(dt) {
    this.t += dt; this.left -= dt; if (this.left <= 0) { this.left = 0; this.over = true; this.overText = `爆了 ${this.n} 顆爆米花！`; return; }
    const d = Shk.d(this); this.heat = clamp(this.heat + d * 0.06 - dt * 0.12, 0, 1);
    const P = this.pot();
    if (this.heat >= 0.45 && this.heat <= 0.82) {
      this.acc += dt * (4 + (this.heat - 0.45) * 20);
      while (this.acc >= 1) { this.acc--; this.n++; this.score += 2; this.pop.push({ x: P.x + rand(-50, 50), y: P.y - 30, vx: rand(-60, 220), vy: -rand(500, 750), r: rand(0, 6), t: 0 }); if (Math.random() < 0.5) Sfx.play('pop'); }
    } else if (this.heat > 0.82) {
      this.burnT += dt; if (this.burnT > 0.5) { this.burnT = 0; this.score = Math.max(0, this.score - 3); FX.text(P.x, P.y - 90, '燒焦了！', '#5a5a5a', 26); Sfx.play('nope'); }
      if (Math.random() < dt * 12) this.smoke.push({ x: P.x + rand(-40, 40), y: P.y - 30, t: 0 });
    }
    const B = this.bucket();
    for (const p of this.pop) { p.t += dt; p.vy += 1200 * dt; p.x += p.vx * dt; p.y += p.vy * dt; p.r += dt * 6; if (p.vy > 0 && p.y > B.y - 10 && Math.abs(p.x - B.x) < B.w / 2) p.dead = 1; if (p.y > V.H + 30) p.dead = 1; }
    this.pop = this.pop.filter(p => !p.dead);
    for (const s of this.smoke) { s.t += dt; s.y -= 60 * dt; } this.smoke = this.smoke.filter(s => s.t < 1.5);
  },
  pot() { return { x: V.W * (Kid.portrait() ? 0.32 : 0.38), y: V.H * 0.72 }; },
  bucket() { return { x: V.W * (Kid.portrait() ? 0.78 : 0.7), y: V.H * 0.68, w: 130 }; },
  draw(c) {
    c.fillStyle = '#fff1d8'; c.fillRect(-20, -20, V.W + 40, V.H + 40); c.fillStyle = '#e8cf9f'; c.fillRect(-20, V.H * 0.8, V.W + 40, V.H);
    const P = this.pot(), B = this.bucket(), sh = Math.sin(this.t * 45) * Tilt.shake * 10;
    for (let i = 0; i < 5; i++) { const f = 0.6 + this.heat * 0.8 + Math.sin(this.t * 20 + i) * 0.15; Kid.emoji(c, '🔥', P.x - 60 + i * 30, P.y + 50, 30 * f); }
    Paper.rect(c, P.x - 90 + sh, P.y - 30, 180, 70, '#5a5f6a', 18, { border: 4 }); Paper.rect(c, P.x + 90 + sh, P.y - 18, 80, 14, '#3a3a3a', 6, { border: 3 });
    for (let i = 0; i < 8; i++) { c.fillStyle = '#ffd23f'; c.beginPath(); c.arc(P.x - 60 + i * 17 + sh, P.y - 28 + Math.sin(this.t * 25 + i) * this.heat * 4, 6, 0, Math.PI * 2); c.fill(); }
    for (const s of this.smoke) { c.fillStyle = `rgba(90,90,90,${0.5 * (1 - s.t / 1.5)})`; c.beginPath(); c.arc(s.x, s.y, 14 + s.t * 20, 0, Math.PI * 2); c.fill(); }
    // 桶子
    const fill = Math.min(1, this.n / 150);
    Paper.shape(c, cc => { cc.moveTo(B.x - B.w / 2, B.y); cc.lineTo(B.x + B.w / 2, B.y); cc.lineTo(B.x + B.w * 0.38, B.y + 140); cc.lineTo(B.x - B.w * 0.38, B.y + 140); cc.closePath(); }, '#ffffff', { border: 4 });
    c.fillStyle = '#e8453c'; for (let i = 0; i < 4; i++) c.fillRect(B.x - B.w * 0.4 + i * B.w * 0.22, B.y + 4, B.w * 0.1, 132);
    for (let i = 0; i < fill * 26; i++) { c.fillStyle = '#fff6c8'; c.beginPath(); c.arc(B.x - 50 + (i * 37) % 100, B.y - 6 - Math.floor(i / 6) * 9, 11, 0, Math.PI * 2); c.fill(); }
    for (const p of this.pop) { c.save(); c.translate(p.x, p.y); c.rotate(p.r); Paper.circle(c, 0, 0, 9, '#fff6c8', { border: 2, blur: 2 }); Paper.circle(c, 6, -4, 6, '#fff6c8', { border: 0, shadow: false }); c.restore(); }
    // 溫度計
    const tx = Kid.portrait() ? V.W / 2 - 120 : V.W / 2 - 160, ty = Kid.portrait() ? 150 : 100, tw = Kid.portrait() ? 240 : 320;
    Paper.rect(c, tx, ty, tw, 26, '#ffffff', 13, { border: 3 });
    c.fillStyle = 'rgba(69,173,74,0.45)'; c.fillRect(tx + tw * 0.45, ty + 3, tw * 0.37, 20); c.fillStyle = 'rgba(232,69,60,0.4)'; c.fillRect(tx + tw * 0.82, ty + 3, tw * 0.18 - 4, 20);
    c.fillStyle = '#2a2a33'; c.fillRect(tx + tw * this.heat - 3, ty - 6, 6, 38);
    Kid.text(c, this.heat > 0.82 ? '太燙了！' : this.heat >= 0.45 ? '剛剛好！' : '再搖！', V.W / 2, ty + 54, 24, this.heat > 0.82 ? '#e8453c' : this.heat >= 0.45 ? '#45ad4a' : '#4a3520', 5);
    TiltUI.hint(c, this, V.H - 30, '#4a3520', true);
  },
  hud() { return { L: `<b>${this.score}</b> 分　🍿 ${this.n}`, R: `⏱ ${Math.ceil(this.left)}` }; },
});
