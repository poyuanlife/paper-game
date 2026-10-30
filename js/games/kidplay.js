'use strict';
// =====================================================
//  寶寶動手玩：刷牙牙、貼紙樂園、敲敲地鼠、小小超市、骨牌接力
// =====================================================

// ---- 刷牙牙 ----
registerGame({
  id: 'brushteeth', name: '刷牙牙', icon: '🦷', color: '#4fb3e8', kid: true,
  desc: '用牙刷把牙齒上的蛀牙蟲刷掉！',
  howto: '大嘴巴裡面有好多 🦠 蛀牙蟲！用手指按住畫面，拿牙刷在蛀牙蟲上面來回刷一刷，就能把牠刷掉。一共 3 次，刷得越快分數越多！',
  start() { this.t = 0; this.score = 0; this.over = false; this.overText = '牙齒亮晶晶！'; this.round = 0; this.foam = []; this.lx = null; this.newRound(); },
  mouth() { const P = Kid.portrait(), w = Math.min(V.W * 0.9, 640), h = Math.min(V.H * (P ? 0.42 : 0.6), 360); return { x: V.W / 2, y: V.H * (P ? 0.5 : 0.56), w, h }; },
  teeth() { const M = this.mouth(), T = [], n = 6, tw = M.w * 0.7 / n; for (const row of [-1, 1]) for (let i = 0; i < n; i++) T.push({ x: M.x + (i - (n - 1) / 2) * tw, y: M.y + row * M.h * 0.24, w: tw * 0.88, h: M.h * 0.3 }); return T; },
  newRound() { const T = this.teeth(), n = 4 + this.round * 2; this.bugs = Kid.shuffle(T.map((t, i) => i)).slice(0, n).map(i => ({ ti: i, hp: 1, u: rand(-0.25, 0.25), v: rand(-0.2, 0.2), ph: rand(0, 6) })); this.rt = 0; this.doneT = 0; if (this.round) Kid.say('還有蛀牙蟲！'); },
  onEnter(p) { if (p === 'ready') Kid.say('刷刷刷，把蛀牙蟲刷掉！'); },
  update(dt) {
    this.t += dt; this.rt += dt;
    if (this.doneT) { this.doneT -= dt; if (this.doneT <= 0) { this.round++; if (this.round >= 3) { this.over = true; return; } this.newRound(); } }
    const T = this.teeth();
    if (Input.down) {
      if (this.lx != null) {
        const mv = Math.hypot(Input.x - this.lx, Input.y - this.ly);
        if (mv > 2) {
          if (Math.random() < 0.5) this.foam.push({ x: Input.x + rand(-20, 20), y: Input.y + rand(-14, 14), r: rand(6, 14), t: 0 });
          if (Math.random() < 0.08) Sfx.play('rustle');
          for (const b of this.bugs) { if (b.hp <= 0) continue; const t = T[b.ti], bx = t.x + b.u * t.w, by = t.y + b.v * t.h; if (Math.hypot(Input.x - bx, Input.y - by) < 60) { b.hp -= mv / 420; if (b.hp <= 0) { this.score += 10; Sfx.play('pop'); FX.burst(bx, by, 10, ['#ffffff', '#bfe8ff', '#7dd87d'], 0.5); FX.text(bx, by - 40, '刷掉了！', '#2f9be0', 26); } } }
        }
      }
      this.lx = Input.x; this.ly = Input.y;
    } else this.lx = null;
    for (const f of this.foam) f.t += dt; this.foam = this.foam.filter(f => f.t < 1.6);
    if (!this.doneT && this.bugs.every(b => b.hp <= 0)) { const bonus = Math.max(0, Math.round(30 - this.rt * 2)); this.score += bonus; this.doneT = 1.8; Sfx.play('win'); Kid.say('好乾淨！'); FX.text(V.W / 2, V.H * 0.22, bonus ? `亮晶晶！+${bonus}` : '亮晶晶！', '#ff7a00', 40); }
  },
  draw(c) {
    c.fillStyle = '#ffe3d6'; c.fillRect(-20, -20, V.W + 40, V.H + 40);
    const M = this.mouth();
    Paper.shape(c, cc => cc.ellipse(M.x, M.y, M.w / 2, M.h / 2, 0, 0, Math.PI * 2), '#e8577a', { border: 6, blur: 8 });
    c.fillStyle = '#9e2a4a'; c.beginPath(); c.ellipse(M.x, M.y, M.w * 0.42, M.h * 0.16, 0, 0, Math.PI * 2); c.fill();
    c.fillStyle = '#ff8fa8'; c.beginPath(); c.ellipse(M.x, M.y + M.h * 0.08, M.w * 0.2, M.h * 0.08, 0, 0, Math.PI * 2); c.fill();
    const T = this.teeth();
    for (const t of T) Paper.rect(c, t.x - t.w / 2, t.y - t.h / 2, t.w, t.h, this.doneT ? '#ffffff' : '#fbf6e8', t.w * 0.3, { border: 2, blur: 2 });
    for (const b of this.bugs) { if (b.hp <= 0) continue; const t = T[b.ti]; c.save(); c.globalAlpha = 0.4 + b.hp * 0.6; Kid.emoji(c, '🦠', t.x + b.u * t.w + Math.sin(this.t * 5 + b.ph) * 3, t.y + b.v * t.h, Math.min(46, t.w * 0.75) * (0.6 + b.hp * 0.4)); c.restore(); }
    for (const f of this.foam) { c.globalAlpha = Math.max(0, 1 - f.t / 1.6); Paper.circle(c, f.x, f.y, f.r, '#ffffff', { border: 0, blur: 2 }); c.globalAlpha = 1; }
    if (this.doneT) for (let i = 0; i < 5; i++) Kid.emoji(c, '✨', M.x + Math.cos(i * 1.3 + this.t * 2) * M.w * 0.35, M.y + Math.sin(i * 2.1) * M.h * 0.3, 34);
    const bx = Input.down ? Input.x : V.W * 0.82, by = Input.down ? Input.y : V.H * (Kid.portrait() ? 0.82 : 0.88);
    c.save(); c.translate(bx, by); c.rotate(-0.5); Paper.rect(c, -10, 10, 20, 150, '#3f8fe0', 10, { border: 3 }); Paper.rect(c, -18, -30, 36, 46, '#ffffff', 8, { border: 3 }); c.fillStyle = '#bfe8ff'; for (let i = 0; i < 4; i++) c.fillRect(-14 + i * 8, -26, 5, 38); c.restore();
    if (!Kid.portrait()) Puppet.draw(c, App.pup, 90, V.H - 10, 200, this.doneT ? Puppet.Poses.cheer(this.t) : Puppet.Poses.idle(this.t));
  },
  hud() { return { L: `<b>${this.score}</b> 分`, R: `🦠 ${this.bugs.filter(b => b.hp > 0).length}　第 ${this.round + 1}/3 次` }; },
});

// ---- 貼紙樂園 ----
registerGame({
  id: 'stickers', name: '貼紙樂園', icon: '🌟', color: '#e86fae', kid: true,
  desc: '把喜歡的貼紙拖到圖畫上，做一張自己的圖！',
  howto: '從下面拖一張貼紙到圖畫上就貼上去了，貼好的貼紙也可以再拖著移動，拖回下面就拿掉。點「換場景」可以換農場、海底、太空。做好了按「完成！」。',
  SC: [
    { name: '農場', bg: 'meadow', st: ['🐄', '🐖', '🐑', '🐔', '🐤', '🌻', '🌳', '🏠', '🚜', '🐴', '🐶', '🌈'] },
    { name: '海底', bg: 'sea', st: ['🐟', '🐠', '🐡', '🐙', '🦀', '🐳', '🐬', '🦈', '🐚', '🌿', '⭐', '🐢'] },
    { name: '太空', bg: 'space', st: ['🚀', '🛸', '🌙', '⭐', '🪐', '👽', '☄️', '🌍', '🛰️', '👾', '🌟', '🔭'] },
  ],
  start() { this.t = 0; this.score = 0; this.over = false; this.overText = '好漂亮的圖！'; this.sc = 0; this.placed = []; this.drag = Kid.makeDrag(); },
  get tray() { const P = Kid.portrait(), h = P ? 170 : 110; return { y: V.H - h, h }; },
  slots() { const S = this.SC[this.sc].st, P = Kid.portrait(), cols = P ? 6 : 12, rows = Math.ceil(S.length / cols), T = this.tray, w = Math.min(84, (V.W - 30) / cols); return S.map((e, i) => ({ e, x: V.W / 2 + ((i % cols) - (cols - 1) / 2) * w, y: T.y + T.h / (rows + 1) * (Math.floor(i / cols) + 1), s: w * 0.7 })); },
  get bBtn() { const P = Kid.portrait(); return { x: V.W - 90, y: P ? 150 : 110, w: 150, h: 54 }; },
  get bScene() { const P = Kid.portrait(); return { x: 100, y: P ? 150 : 110, w: 160, h: 54 }; },
  tap(x, y) {
    if (Kid.hit(this.bBtn, x, y)) { if (this.placed.length) { this.score = this.placed.length * 10; this.over = true; } else Kid.say('先貼一張貼紙吧！'); return; }
    if (Kid.hit(this.bScene, x, y)) { this.sc = (this.sc + 1) % this.SC.length; this.placed = []; Sfx.play('flip'); Kid.say(this.SC[this.sc].name); return; }
    for (let i = this.placed.length - 1; i >= 0; i--) { const p = this.placed[i]; if (Math.hypot(p.x - x, p.y - y) < p.s * 0.55) { this.placed.splice(i, 1); this.placed.push(p); this.drag.grab(p, x, y); Sfx.play('pop'); return; } }
    for (const s of this.slots()) if (Math.hypot(s.x - x, s.y - y) < s.s * 0.6) { const p = { e: s.e, x: s.x, y: s.y, s: Kid.portrait() ? 76 : 84, rot: rand(-0.2, 0.2), pop: 1 }; this.placed.push(p); this.drag.grab(p, x, y); Sfx.play('pop'); return; }
  },
  update(dt) {
    this.t += dt; for (const p of this.placed) p.pop = Math.max(0, p.pop - dt * 3);
    this.drag.step(o => { if (o.y > this.tray.y - 10) { this.placed = this.placed.filter(p => p !== o); Sfx.play('swish'); } else { o.pop = 1; Sfx.play('snap'); if (this.placed.length % 5 === 0) Kid.say('好漂亮！'); } });
    this.score = this.placed.length * 10;
  },
  draw(c) {
    const S = this.SC[this.sc];
    if (S.bg === 'meadow') Kid.ground(c, 'meadow', this.t, 0.78);
    else if (S.bg === 'sea') RoamBG.water(c, this, '#5fc4ef', '#1d5f98');
    else { const g = c.createLinearGradient(0, 0, 0, V.H); g.addColorStop(0, '#0d1033'); g.addColorStop(1, '#2c2f6b'); c.fillStyle = g; c.fillRect(-20, -20, V.W + 40, V.H + 40); c.fillStyle = '#fff'; for (let i = 0; i < 50; i++) { c.globalAlpha = 0.4 + (i % 3) * 0.2; c.beginPath(); c.arc((i * 173) % V.W, (i * 97) % V.H, 1 + (i % 2), 0, Math.PI * 2); c.fill(); } c.globalAlpha = 1; }
    for (const p of this.placed) Kid.emoji(c, p.e, p.x, p.y, p.s * (1 + p.pop * 0.25), p.rot);
    const T = this.tray; Paper.rect(c, 6, T.y, V.W - 12, T.h - 6, 'rgba(255,253,245,0.92)', 20, { border: 4 });
    for (const s of this.slots()) Kid.emoji(c, s.e, s.x, s.y, s.s);
    Kid.button(c, this.bBtn, '完成！', '#45ad4a', { size: 26 }); Kid.button(c, this.bScene, '🔄 換場景', '#7a62b8', { size: 22 });
  },
  hud() { return { L: `貼了 <b>${this.placed.length}</b> 張`, R: this.SC[this.sc].name }; },
});

// ---- 敲敲地鼠 ----
registerGame({
  id: 'mole', name: '敲敲地鼠', icon: '🔨', color: '#8a5a34', kid: true,
  desc: '地鼠從洞裡探出頭來，快點輕輕敲一下！',
  howto: '地鼠會從洞裡跑出來，趁牠還沒躲回去點一下牠！金色地鼠分數多。小心 🐰 小兔子也會跑出來，不要敲到牠喔！限時 40 秒。',
  TIME: 40,
  start() { this.t = 0; this.left = this.TIME; this.score = 0; this.over = false; this.overText = '敲了好多地鼠！'; this.holes = [...Array(9)].map(() => ({ st: 0, k: 0, t: 0, up: 0, bonk: 0 })); this.spawnT = 0.5; this.n = 0; this.ham = 0; this.hx = 0; this.hy = 0; },
  hole(i) { const P = Kid.portrait(), w = Math.min(V.W * 0.3, 210), h = P ? Math.min(V.H * 0.18, 170) : Math.min(V.H * 0.24, 160); return { x: V.W / 2 + (i % 3 - 1) * w, y: V.H * (P ? 0.4 : 0.36) + Math.floor(i / 3) * h, r: Math.min(w, h) * 0.38 }; },
  tap(x, y) {
    this.ham = 0.2; this.hx = x; this.hy = y;
    for (let i = 0; i < 9; i++) { const H = this.holes[i], p = this.hole(i); if (H.up < 0.4 || H.bonk) continue; if (Math.abs(x - p.x) < p.r * 1.2 && y > p.y - p.r * 2.2 && y < p.y + p.r * 0.5) {
      H.bonk = 0.5; H.t = Math.min(H.t, 0.2);
      if (H.k === 'bun') { this.score = Math.max(0, this.score - 10); Sfx.play('nope'); FX.text(p.x, p.y - p.r * 2, '是小兔子！', '#e86fae', 28); Kid.say('不可以敲小兔子'); }
      else { const pts = H.k === 'gold' ? 30 : 10; this.score += pts; this.n++; Sfx.play(H.k === 'gold' ? 'star' : 'bat'); FX.burst(p.x, p.y - p.r, 10, undefined, 0.5); FX.text(p.x, p.y - p.r * 2, '+' + pts, '#ff7a00', 30); }
      return; } }
    Sfx.play('thud');
  },
  update(dt) {
    this.t += dt; this.left -= dt; this.ham = Math.max(0, this.ham - dt); if (this.left <= 0) { this.left = 0; this.over = true; this.overText = `敲到 ${this.n} 隻地鼠！`; return; }
    this.spawnT -= dt;
    if (this.spawnT <= 0) { const free = this.holes.filter(h => !h.st); if (free.length) { const H = pick(free), r = Math.random(); H.st = 1; H.k = r < 0.12 ? 'bun' : r < 0.22 ? 'gold' : 'mole'; H.t = Math.max(0.7, 1.5 - this.t / 40); H.up = 0; H.bonk = 0; } this.spawnT = rand(0.35, 0.8) * Math.max(0.55, 1 - this.t / 60); }
    for (const H of this.holes) { if (!H.st) continue; H.t -= dt; H.bonk = Math.max(0, H.bonk - dt); if (H.t > 0 && !H.bonk) H.up = Math.min(1, H.up + dt * 6); else { H.up -= dt * 5; if (H.up <= 0) { H.up = 0; H.st = 0; } } }
  },
  draw(c) {
    Kid.ground(c, 'meadow', this.t, 0.97);
    for (let i = 0; i < 9; i++) {
      const H = this.holes[i], p = this.hole(i);
      c.fillStyle = '#4a2f1a'; c.beginPath(); c.ellipse(p.x, p.y, p.r * 1.2, p.r * 0.45, 0, 0, Math.PI * 2); c.fill();
      if (H.up > 0) {
        c.save(); c.beginPath(); c.rect(p.x - p.r * 2, p.y - p.r * 3, p.r * 4, p.r * 3); c.clip();
        const y = p.y + p.r * 0.2 - H.up * p.r * 1.5, sq = H.bonk ? 0.7 : 1;
        if (H.k === 'bun') Kid.emoji(c, '🐰', p.x, y - p.r * 0.2, p.r * 1.7);
        else {
          c.save(); c.translate(p.x, y); c.scale(1, sq);
          Paper.shape(c, cc => { cc.ellipse(0, 0, p.r * 0.75, p.r * 0.95, 0, 0, Math.PI * 2); }, H.k === 'gold' ? '#ffcc33' : '#a0683c', { border: 3 });
          c.fillStyle = '#ffd7b0'; c.beginPath(); c.ellipse(0, p.r * 0.25, p.r * 0.45, p.r * 0.35, 0, 0, Math.PI * 2); c.fill();
          c.fillStyle = '#2a2a33'; if (H.bonk) { c.font = `900 ${p.r * 0.4}px sans-serif`; c.textAlign = 'center'; c.fillText('× ×', 0, -p.r * 0.15); } else for (const s of [-1, 1]) { c.beginPath(); c.arc(s * p.r * 0.28, -p.r * 0.2, p.r * 0.09, 0, Math.PI * 2); c.fill(); }
          c.fillStyle = '#e86f8a'; c.beginPath(); c.arc(0, p.r * 0.08, p.r * 0.1, 0, Math.PI * 2); c.fill();
          c.restore();
        }
        c.restore();
      }
      c.fillStyle = '#7a5030'; c.beginPath(); c.ellipse(p.x, p.y + p.r * 0.1, p.r * 1.2, p.r * 0.3, 0, 0, Math.PI); c.fill();
      if (H.bonk && H.k !== 'bun') Kid.emoji(c, '💫', p.x, p.y - p.r * 1.9, 30);
    }
    if (this.ham) { c.save(); c.translate(this.hx + 30, this.hy - 20); c.rotate(-0.4 + this.ham * 3); Paper.rect(c, -6, -10, 12, 80, '#c98a4b', 5, { border: 2 }); Paper.rect(c, -34, -36, 68, 36, '#e8453c', 12, { border: 3 }); c.restore(); }
  },
  hud() { return { L: `<b>${this.score}</b> 分`, R: `⏱ ${Math.ceil(this.left)}` }; },
});

// ---- 小小超市 ----
registerGame({
  id: 'shopping', name: '小小超市', icon: '🛒', color: '#45ad4a', kid: true,
  desc: '看看東西要幾元，點錢幣付剛好的錢！',
  howto: '上面的東西有寫價錢，點下面的錢幣把錢放到盤子上，加起來「剛好」就買到了！放太多可以點盤子把錢拿回來。前面只有 1 元，後面會有 5 元和 10 元。一共 8 題。',
  ITEMS: [['🍎', '蘋果'], ['🍌', '香蕉'], ['🍞', '麵包'], ['🥛', '牛奶'], ['🍪', '餅乾'], ['🧃', '果汁'], ['🍦', '冰淇淋'], ['🥚', '雞蛋'], ['🍓', '草莓'], ['🧸', '小熊']],
  N: 8,
  start() { this.t = 0; this.score = 0; this.over = false; this.overText = '買好東西囉！'; this.q = 0; this.newQ(); },
  onEnter(p) { if (p === 'ready') this.sayQ(); },
  coinsFor(q) { return q < 3 ? [1] : q < 6 ? [1, 5] : [1, 5, 10]; },
  newQ() { const q = this.q, max = q < 3 ? 5 : q < 6 ? 12 : 25; this.it = pick(this.ITEMS); this.price = Math.floor(rand(q < 3 ? 2 : 4, max + 1)); this.tray = []; this.doneT = 0; this.tries = 0; if (q) this.sayQ(); },
  sayQ() { Kid.say(`${this.it[1]}，${this.price}元`); },
  sum() { return this.tray.reduce((a, b) => a + b, 0); },
  coinBtns() { const C = this.coinsFor(this.q), P = Kid.portrait(), r = P ? 52 : 50; return C.map((v, i) => ({ v, x: V.W / 2 + (i - (C.length - 1) / 2) * r * 2.6, y: V.H - (P ? 110 : 80), r })); },
  get plate() { return { x: V.W / 2, y: V.H * (Kid.portrait() ? 0.6 : 0.6), w: Math.min(V.W * 0.8, 460), h: 110 }; },
  tap(x, y) {
    if (this.doneT) return;
    for (const b of this.coinBtns()) if (Math.hypot(x - b.x, y - b.y) < b.r + 8) {
      this.tray.push(b.v); Sfx.play('coin'); const s = this.sum();
      if (s === this.price) { this.score += this.tries ? 5 : 10; this.doneT = 1.8; Sfx.play('ding'); Kid.say('剛剛好！謝謝光臨！'); FX.burst(V.W / 2, this.plate.y, 20, undefined, 0.8); FX.text(V.W / 2, this.plate.y - 90, '剛剛好！', '#ff7a00', 40); }
      else if (s > this.price) { this.tries++; Sfx.play('nope'); Kid.say('太多了，拿回來一些'); FX.text(V.W / 2, this.plate.y - 90, '太多了！', '#e8453c', 32); }
      return;
    }
    const P = this.plate; if (this.tray.length && Kid.hit(P, x, y)) { this.tray.pop(); Sfx.play('swish'); }
  },
  update(dt) { this.t += dt; if (this.doneT) { this.doneT -= dt; if (this.doneT <= 0) { this.q++; if (this.q >= this.N) { this.over = true; return; } this.newQ(); } } },
  coin(c, v, x, y, r) { Paper.circle(c, x, y, r, v === 10 ? '#d9d9e0' : v === 5 ? '#ffcc33' : '#e0a86a', { border: 3, blur: 4 }); c.strokeStyle = 'rgba(0,0,0,0.15)'; c.lineWidth = 3; c.beginPath(); c.arc(x, y, r * 0.78, 0, Math.PI * 2); c.stroke(); Kid.text(c, String(v), x, y + 2, r * 0.9, '#5a3a1a', 0); },
  draw(c) {
    c.fillStyle = '#fff6e0'; c.fillRect(-20, -20, V.W + 40, V.H + 40);
    for (let i = 0; i < 8; i++) { c.fillStyle = i % 2 ? '#e8453c' : '#ffffff'; c.fillRect(i * V.W / 8, 0, V.W / 8 + 1, Kid.portrait() ? 110 : 64); }
    const P = Kid.portrait(), y0 = V.H * (P ? 0.32 : 0.3);
    Paper.rect(c, V.W / 2 - 150, y0 - 110, 300, 200, '#ffffff', 24, { border: 5 });
    Kid.emoji(c, this.it[0], V.W / 2 - 50, y0 - 10, 110);
    Paper.rect(c, V.W / 2 + 20, y0 - 40, 110, 70, '#ffd23f', 14, { border: 4 }); Kid.text(c, `${this.price} 元`, V.W / 2 + 75, y0 - 4, 32, '#e0573c', 0);
    const PL = this.plate; Paper.shape(c, cc => cc.ellipse(PL.x, PL.y, PL.w / 2, PL.h / 2, 0, 0, Math.PI * 2), '#d8e6f0', { border: 4 });
    const n = this.tray.length, cw = Math.min(46, (PL.w - 40) / Math.max(1, n));
    this.tray.forEach((v, i) => this.coin(c, v, PL.x + (i - (n - 1) / 2) * cw, PL.y + (i % 2) * 6 - 3, v === 1 ? 24 : 28));
    Kid.text(c, `${this.sum()} / ${this.price} 元`, V.W / 2, PL.y + PL.h / 2 + 30, 28, this.sum() > this.price ? '#e8453c' : '#4a3520', 6);
    for (const b of this.coinBtns()) this.coin(c, b.v, b.x, b.y, b.r);
    if (!P) Puppet.draw(c, App.pup, 110, V.H - 10, 220, this.doneT ? Puppet.Poses.cheer(this.t) : Puppet.Poses.idle(this.t));
  },
  hud() { return { L: `<b>${this.score}</b> 分`, R: `第 ${this.q + 1} / ${this.N} 題` }; },
});

// ---- 骨牌接力 ----
registerGame({
  id: 'domino', name: '骨牌接力', icon: '🧱', color: '#7a62b8', kid: true,
  desc: '在地上排骨牌，推倒第一張，一路倒到鈴鐺！',
  howto: '點地板就會放一張骨牌。骨牌之間不能隔太遠（比骨牌高度還近），排好之後按「推！」，看骨牌能不能一路倒下去敲到最右邊的 🔔 鈴鐺！一共 3 關，倒下越多張分數越高。',
  start() { this.t = 0; this.score = 0; this.over = false; this.overText = '骨牌大師！'; this.lv = 0; this.newLevel(); },
  get floor() { return V.H * 0.74; },
  get H() { return Kid.portrait() ? 64 : 80; },
  newLevel() { this.ds = []; this.st = 'build'; this.endT = 0; this.rang = 0; this.gaps = this.lv === 0 ? [] : this.lv === 1 ? [0.5] : [0.35, 0.66]; },
  get bell() { return { x: V.W - 50, y: this.floor - 40 }; },
  get start0() { return 60; },
  get bPush() { return { x: V.W / 2, y: V.H - 70, w: 200, h: 70 }; },
  inGap(x) { return this.gaps.some(g => Math.abs(x - V.W * g) < this.H * 0.35); },
  tap(x, y) {
    if (this.st === 'build' && Kid.hit(this.bPush, x, y)) { if (!this.ds.length) { Kid.say('先放骨牌喔'); return; } this.st = 'fall'; this.ds.sort((a, b) => a.x - b.x); this.ds[0].fall = 1; this.ds[0].v = 2; Sfx.play('swish'); return; }
    if (this.st !== 'build') return;
    if (y < this.floor - this.H * 2.5 || y > this.floor + 60 || x < this.start0 - 20 || x > V.W - 90) return;
    if (this.inGap(x)) { Sfx.play('nope'); FX.text(x, this.floor - 80, '這裡是洞！', '#e8453c', 24); return; }
    if (this.ds.some(d => Math.abs(d.x - x) < 14)) return;
    if (this.ds.length >= 30) return;
    this.ds.push({ x, a: 0, v: 0, fall: 0, col: pick(['#e8453c', '#3f8fe0', '#ffd23f', '#45ad4a', '#ff9a2e', '#c77dff']) }); Sfx.play('snap');
  },
  update(dt) {
    this.t += dt;
    if (this.st === 'fall') {
      const H = this.H, D = this.ds;
      D.forEach((d, i) => {
        if (!d.fall || d.a >= 1.35) return;
        d.v += 9 * dt; d.a = Math.min(1.35, d.a + d.v * dt);
        const tipX = d.x + Math.sin(d.a) * H, nx = D[i + 1];
        if (nx && !nx.fall && tipX >= nx.x - 5) { nx.fall = 1; nx.v = d.v * 0.8; d.a = Math.min(d.a, Math.asin(clamp((nx.x - d.x) / H, 0, 1))); d.v = 0; Sfx.play('tick'); }
        if (!nx && tipX >= this.bell.x - 30 && !this.rang) { this.rang = 1; Sfx.play('bell'); FX.burst(this.bell.x, this.bell.y, 24, undefined, 1); FX.text(this.bell.x - 60, this.bell.y - 70, '噹！', '#ff7a00', 44); }
      });
      // 倒在下一張上面的停住
      for (let i = 0; i < D.length - 1; i++) if (D[i].fall && D[i + 1].fall) { const lim = Math.asin(clamp((D[i + 1].x - D[i].x) / H, 0, 1)); D[i].a = Math.min(D[i].a, Math.max(lim, D[i + 1].a * 0.5)); }
      const last = D.filter(d => d.fall).pop();
      if (!last || last.a >= 1.35) {
        this.endT += dt;
        if (this.endT > 0.8) {
          const n = D.filter(d => d.fall).length, pts = n * 5 + (this.rang ? 50 : 0); this.score += pts; this.st = 'done'; this.endT = 2.2;
          Sfx.play(this.rang ? 'win' : 'over'); Kid.say(this.rang ? '成功了！' : '差一點點！'); FX.text(V.W / 2, V.H * 0.35, this.rang ? `成功！倒了 ${n} 張 +${pts}` : `倒了 ${n} 張 +${pts}`, '#7a62b8', 34);
        }
      }
    } else if (this.st === 'done') { this.endT -= dt; if (this.endT <= 0) { this.lv++; if (this.lv >= 3) { this.over = true; return; } this.newLevel(); } }
  },
  draw(c) {
    c.fillStyle = '#f6ecd9'; c.fillRect(-20, -20, V.W + 40, V.H + 40);
    const F = this.floor, H = this.H, w = H * 0.22;
    Paper.rect(c, -20, F, V.W + 40, V.H - F + 20, '#c98a4b', 0, { border: 3 });
    for (const g of this.gaps) { c.fillStyle = '#3a2a1a'; c.fillRect(V.W * g - H * 0.35, F, H * 0.7, V.H - F); }
    if (this.st === 'build') { c.fillStyle = 'rgba(122,98,184,0.25)'; const s = this.ds.slice().sort((a, b) => a.x - b.x); for (let i = 0; i < s.length - 1; i++) if (s[i + 1].x - s[i].x > H * 0.95) { Kid.text(c, '太遠！', (s[i].x + s[i + 1].x) / 2, F - H - 20, 20, '#e8453c', 4); } }
    Paper.rect(c, this.start0 - 50, F - 70, 30, 70, '#8a5a34', 6, { border: 3 });
    Puppet.draw(c, App.pup, this.start0 - 36, F, 120, this.st === 'fall' && this.t % 1 < 0.5 ? Puppet.Poses.cheer(this.t) : Puppet.Poses.idle(this.t));
    for (const d of this.ds) { c.save(); c.translate(d.x, F); c.rotate(d.a); Paper.rect(c, -w / 2, -H, w, H, d.col, 4, { border: 2, blur: 3 }); c.fillStyle = '#ffffff'; c.beginPath(); c.arc(0, -H * 0.72, 3, 0, Math.PI * 2); c.arc(0, -H * 0.3, 3, 0, Math.PI * 2); c.fill(); c.restore(); }
    const B = this.bell; Paper.rect(c, B.x - 6, B.y + 10, 12, F - B.y - 10, '#7a7f8a', 3, { border: 2 }); Kid.emoji(c, '🔔', B.x, B.y, 54, this.rang ? Math.sin(this.t * 30) * 0.3 : 0);
    if (this.st === 'build') { Kid.button(c, this.bPush, '推！👉', '#7a62b8', { size: 30 }); Kid.text(c, `點地板放骨牌（${this.ds.length} 張）`, V.W / 2, Kid.portrait() ? 150 : 100, 24, '#4a3520', 6); }
  },
  hud() { return { L: `<b>${this.score}</b> 分`, R: `第 ${this.lv + 1} / 3 關` }; },
});
