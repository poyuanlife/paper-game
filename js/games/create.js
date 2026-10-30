'use strict';
// =====================================================
//  自由創作：做蛋糕、紙片人換裝
// =====================================================

// ---- 做蛋糕 ----
registerGame({
  id: 'cake', name: '做生日蛋糕', icon: '🎂', color: '#ff7eb6', kid: true,
  desc: '選奶油顏色、放水果和蠟燭，做一個生日蛋糕！',
  howto: '先點上面的顏色換奶油，再點下面的配料，然後點蛋糕上想放的地方。放好蠟燭按「🎉 完成」，紙片人會幫你唱生日快樂歌！不會輸，想怎麼做都可以。',
  CREAM: ['#ffffff', '#ffd6e8', '#fff1b8', '#d8f5c8', '#d6e8ff', '#8a5a34'],
  TOP: ['🍓', '🍒', '🍫', '🍬', '🍭', '🌸', '⭐', '🕯️'],
  start() { this.t = 0; this.score = 0; this.over = false; this.overText = '生日快樂！'; this.cream = 1; this.tool = 0; this.items = []; this.sing = 0; this.note = 0; },
  geo() { const P = Kid.portrait(), w = Math.min(V.W * 0.8, 420), cx = V.W / 2, top = P ? V.H * 0.36 : V.H * 0.3; return { cx, top, w, h: w * 0.5 }; },
  cbtn(i) { const n = this.CREAM.length, s = Math.min(54, (V.W - 40) / n - 8); return { x: V.W / 2 + (i - (n - 1) / 2) * (s + 8), y: Kid.portrait() ? 135 : 92, w: s, h: s }; },
  tbtn(i) { const n = this.TOP.length, P = Kid.portrait(), per = P ? 4 : 8, s = Math.min(70, (V.W - 40) / per - 10), r = Math.floor(i / per), k = i % per; return { x: V.W / 2 + (k - (per - 1) / 2) * (s + 10), y: V.H - (P ? 230 : 120) + r * (s + 10), w: s, h: s }; },
  get done() { const P = Kid.portrait(); return { x: V.W / 2, y: V.H - (P ? 60 : 40), w: 200, h: 60 }; },
  tap(x, y) {
    if (this.sing) return;
    for (let i = 0; i < this.CREAM.length; i++) if (Kid.hit(this.cbtn(i), x, y)) { this.cream = i; Sfx.play('pop'); return; }
    for (let i = 0; i < this.TOP.length; i++) if (Kid.hit(this.tbtn(i), x, y)) { this.tool = i; Sfx.play('click'); return; }
    if (Kid.hit(this.done, x, y)) { this.sing = 0.001; this.note = 0; this.score = 20 + this.items.length * 5; Kid.say('生日快樂！'); return; }
    const G = this.geo(); if (x > G.cx - G.w / 2 && x < G.cx + G.w / 2 && y > G.top - 60 && y < G.top + G.h) { this.items.push({ e: this.TOP[this.tool], x: x - G.cx, y: Math.min(y, G.top + 10) - G.top, s: rand(0.9, 1.1) }); Sfx.play('pop'); FX.burst(x, y, 5, undefined, 0.3); }
  },
  // 生日快樂歌（傳統歌謠）
  SONG: [[392, 0.5], [392, 0.5], [440, 1], [392, 1], [523, 1], [494, 2], [392, 0.5], [392, 0.5], [440, 1], [392, 1], [587, 1], [523, 2], [392, 0.5], [392, 0.5], [784, 1], [659, 1], [523, 1], [494, 1], [440, 2], [698, 0.5], [698, 0.5], [659, 1], [523, 1], [587, 1], [523, 2]],
  update(dt) {
    this.t += dt;
    if (this.sing) { this.sing += dt; let acc = 0.5; for (let i = 0; i < this.SONG.length; i++) { if (i === this.note && this.sing >= acc) { Sfx.note(this.SONG[i][0], this.SONG[i][1] * 0.32, 0.18); this.note++; if (Math.random() < 0.5) FX.burst(rand(0, V.W), rand(0, V.H * 0.5), 8, undefined, 0.6); } acc += this.SONG[i][1] * 0.35; } if (this.sing > acc + 1) this.over = true; }
  },
  draw(c) {
    c.fillStyle = '#fff1f6'; c.fillRect(-20, -20, V.W + 40, V.H + 40); const G = this.geo(), col = this.CREAM[this.cream];
    Paper.shape(c, cc => cc.ellipse(G.cx, G.top + G.h + 10, G.w * 0.62, 26, 0, 0, Math.PI * 2), '#e8ecf5', { border: 4 });
    Paper.rect(c, G.cx - G.w / 2, G.top, G.w, G.h, col, 18, { border: 5 }); Paper.shape(c, cc => cc.ellipse(G.cx, G.top, G.w / 2, 30, 0, 0, Math.PI * 2), col, { border: 5 });
    c.fillStyle = 'rgba(255,255,255,0.45)'; for (let i = 0; i < 8; i++) { c.beginPath(); c.arc(G.cx - G.w / 2 + (i + 0.5) * G.w / 8, G.top + 12, G.w / 18, 0, Math.PI); c.fill(); }
    c.strokeStyle = 'rgba(255,120,170,0.6)'; c.lineWidth = 5; c.beginPath(); c.moveTo(G.cx - G.w / 2, G.top + G.h * 0.55); for (let i = 0; i <= 16; i++) c.lineTo(G.cx - G.w / 2 + i * G.w / 16, G.top + G.h * 0.55 + (i % 2 ? 8 : -4)); c.stroke();
    for (const it of this.items.slice().sort((a, b) => a.y - b.y)) { const x = G.cx + it.x, y = G.top + it.y; Kid.emoji(c, it.e, x, y - 14, 40 * it.s); if (it.e === '🕯️' && this.sing) { const f = Math.sin(this.t * 20 + it.x) * 3; Paper.shape(c, cc => { cc.ellipse(x + f * 0.3, y - 44, 6, 11, 0, 0, Math.PI * 2); }, '#ffcc1f', { border: 0, shadowColor: 'rgba(255,200,40,0.9)', blur: 14 }); } }
    for (let i = 0; i < this.CREAM.length; i++) { const b = this.cbtn(i); Paper.circle(c, b.x, b.y, b.w / 2, this.CREAM[i], { border: i === this.cream ? 6 : 3, edge: i === this.cream ? '#ff4fa3' : undefined }); }
    if (!this.sing) { for (let i = 0; i < this.TOP.length; i++) { const b = this.tbtn(i); Paper.rect(c, b.x - b.w / 2, b.y - b.h / 2, b.w, b.h, i === this.tool ? '#fff1b8' : '#ffffff', 14, { border: i === this.tool ? 5 : 3, edge: i === this.tool ? '#ff4fa3' : undefined }); Kid.emoji(c, this.TOP[i], b.x, b.y, b.w * 0.6); } Kid.button(c, this.done, '🎉 完成', '#ff4fa3', { size: 26 }); }
    else { Kid.text(c, '🎵 祝你生日快樂～', V.W / 2, V.H - 120, 32, '#ff4fa3'); Puppet.draw(c, App.pup, V.W * 0.15 + 20, V.H - 10, 170, Puppet.Poses.dance(this.t)); }
  },
  hud() { return { L: '🎂 做蛋糕', R: `配料 ${this.items.length}` }; },
});

// ---- 紙片人換裝 ----
registerGame({
  id: 'dressup', name: '紙片人換裝秀', icon: '👒', color: '#9b5bd6', kid: true,
  desc: '幫紙片人戴帽子、眼鏡，拍一張時裝照！',
  howto: '點下面的帽子、眼鏡、配件幫紙片人打扮，再點一次就會拿掉。換一個背景，最後按「📸 拍照」！可以一直拍，拍 5 張就結束。',
  CAT: [['帽子', ['🎩', '👑', '🧢', '👒', '🎓', '⛑️']], ['眼鏡', ['👓', '🕶️', '🥽']], ['頭飾', ['🎀', '🌸', '🌻', '⭐']], ['手拿', ['🎈', '🌹', '🍦', '🌂', '⚽']]],
  BGS: [['#ffd6e8', '#fff1f6'], ['#cfe9ff', '#f0f8ff'], ['#d8f5c8', '#f4fff0'], ['#2b1f52', '#5b2f7a'], ['#ffc8a2', '#fff1d6']],
  start() { this.t = 0; this.score = 0; this.over = false; this.overText = '時尚大師！'; this.wear = [-1, -1, -1, -1]; this.cat = 0; this.bg = 0; this.shots = 0; this.flash = 0; this.pose = 0; },
  tabs(i) { const w = Math.min(100, (V.W - 40) / 5 - 6); return { x: V.W / 2 + (i - 2) * (w + 6), y: V.H - (Kid.portrait() ? 250 : 170), w, h: 46 }; },
  item(i) { const n = this.CAT[this.cat][1].length, s = Math.min(70, (V.W - 40) / 6 - 8); return { x: V.W / 2 + (i - (n - 1) / 2) * (s + 8), y: V.H - (Kid.portrait() ? 175 : 105), w: s, h: s }; },
  get snap() { return { x: V.W / 2, y: V.H - (Kid.portrait() ? 70 : 38), w: 200, h: 58 }; },
  tap(x, y) {
    for (let i = 0; i < 5; i++) if (Kid.hit(this.tabs(i), x, y)) { if (i === 4) { this.bg = (this.bg + 1) % this.BGS.length; Sfx.play('pop'); } else { this.cat = i; Sfx.play('click'); } return; }
    for (let i = 0; i < this.CAT[this.cat][1].length; i++) if (Kid.hit(this.item(i), x, y)) { this.wear[this.cat] = this.wear[this.cat] === i ? -1 : i; Sfx.play('pop'); return; }
    if (Kid.hit(this.snap, x, y)) { this.flash = 1; this.shots++; this.pose = (this.pose + 1) % 3; this.score += 10 + this.wear.filter(w => w >= 0).length * 10; Sfx.play('shutter'); Kid.say(pick(['好帥！', '好可愛！', '好漂亮！', '超有型！'])); if (this.shots >= 5) this.endT = 1.2; }
  },
  update(dt) { this.t += dt; this.flash = Math.max(0, this.flash - dt * 2); if (this.endT) { this.endT -= dt; if (this.endT <= 0) this.over = true; } },
  draw(c) {
    const B = this.BGS[this.bg], g = c.createLinearGradient(0, 0, 0, V.H); g.addColorStop(0, B[0]); g.addColorStop(1, B[1]); c.fillStyle = g; c.fillRect(-20, -20, V.W + 40, V.H + 40);
    for (let i = 0; i < 12; i++) Kid.emoji(c, '✨', (i * 157) % V.W, 100 + (i * 97) % (V.H * 0.5), 20 + (i % 3) * 8);
    const P = App.pup, PH = Math.min(V.H * (Kid.portrait() ? 0.45 : 0.5), 360), fx = V.W / 2, fy = this.tabs(0).y - 40;
    const poses = [Puppet.Poses.idle(this.t), { aL: 2.6, aR: 0.4, aLf: 0.2, rot: 0.05 }, { aL: 1.2, aR: 1.2, aLf: 1.6, aRf: 1.6, lL: 0.2, rot: -0.06 }];
    Paper.shape(c, cc => cc.ellipse(fx, fy + 4, PH * 0.4, PH * 0.06, 0, 0, Math.PI * 2), '#ffffff', { border: 3 });
    Puppet.draw(c, P, fx, fy, PH, poses[this.pose]);
    const A = Puppet.anchors(P), h = Puppet.toScreen(P, PH, A.head), hx = fx + h.x, hy = fy + h.y, hr = A.headR * h.k;
    const W = this.wear, it = k => this.CAT[k][1][W[k]];
    if (W[2] >= 0) Kid.emoji(c, it(2), hx + hr * 0.7, hy - hr * 0.6, hr * 0.9);
    if (W[1] >= 0) Kid.emoji(c, it(1), hx, hy - hr * 0.05, hr * 1.25);
    if (W[0] >= 0) Kid.emoji(c, it(0), hx, hy - hr * 1.25, hr * 1.6);
    if (W[3] >= 0) Kid.emoji(c, it(3), fx + Puppet.size(P, PH).w * 0.42, fy - PH * 0.45, PH * 0.22);
    for (let i = 0; i < 5; i++) { const b = this.tabs(i); Kid.button(c, b, i === 4 ? '🖼️ 背景' : this.CAT[i][0], i === this.cat ? '#9b5bd6' : '#b8a8d0', { size: 18 }); }
    this.CAT[this.cat][1].forEach((e, i) => { const b = this.item(i), on = W[this.cat] === i; Paper.rect(c, b.x - b.w / 2, b.y - b.h / 2, b.w, b.h, on ? '#fff1b8' : '#ffffff', 14, { border: on ? 5 : 3, edge: on ? '#9b5bd6' : undefined }); Kid.emoji(c, e, b.x, b.y, b.w * 0.62); });
    Kid.button(c, this.snap, `📸 拍照（${this.shots}/5）`, '#e8453c', { size: 22 });
    if (this.flash) { c.fillStyle = `rgba(255,255,255,${this.flash})`; c.fillRect(0, 0, V.W, V.H); }
  },
  hud() { return { L: `<b>${this.score}</b> 分`, R: `📸 ${this.shots} / 5` }; },
});
