'use strict';
// 揍揍紙片人：點哪裡就揍哪裡（頭或肚子）。紙片人會被打扁、甩來甩去、貼 OK 繃，血打光就 K.O. 飛出場外。
registerGame({
  id: 'boxing', name: '揍揍紙片人', icon: '🥊', color: '#d94b4b',
  desc: '拳擊手套伺候！把紙片人打飛出場外！',
  howto: '點紙片人的頭或肚子出拳（鍵盤：空白鍵打頭、↓ 打肚子）。他舉手擋臉時就打肚子！連打有加成，K.O. 一次多 100 分，限時 45 秒。',
  TIME: 45,
  LINES: {
    hit: ['好痛！', '不要打臉！', '我錯了～', '媽媽～', '嗚哇！', '手下留情啊！', '你來真的？', '我的臉！', '認輸認輸！', '再打我要哭了', '我的髮型！', '有話好說！'],
    body: ['嗚噗！', '肚子！', '早餐要吐出來了', '咳咳！'],
    dodge: ['打不到～', '嘿嘿！', '太慢了！', '閃！'],
    guard: ['擋住了！', '沒用的～', '鐵壁防禦！'],
    enter: ['我不服！再來！', '剛剛是意外！', '這次不會輸！', '我還沒認真！'],
    taunt: ['來啊～', '就這樣？', '打我啊～', '你是不是在發呆？'],
    ko: ['我會回來的～～', '飛～～～', '下次再說～'],
  },

  start() {
    this.t = 0; this.left = this.TIME; this.score = 0; this.round = 1; this.kos = 0; this.over = false; this.overText = '時間到！';
    this.newRound(true);
    this.punches = []; this.nextHand = 'L'; this.combo = 0; this.lastDodge = -9; this.lastHit = -9; this.lastAct = 0; this.bubble = null; this.hintGuard = false;
    this.crowd = Array.from({ length: 40 }, (_, i) => ({ x: Math.random(), row: i % 3, c: pick(['#6a5a8c', '#7a6aa0', '#5a4a7a', '#8a7ab0', '#4f6a9a']), j: 0, ph: rand(0, 6) }));
  },
  newRound(first) {
    this.maxHp = 100 + (this.round - 1) * 35; this.hp = this.maxHp;
    this.st = first ? 'fight' : 'enter'; this.stT = 0;
    this.sp = { rot: 0, rotV: 0, head: 0, headV: 0, hsx: 1, hsxV: 0, sq: 1, sqV: 0, dodge: 0, dodgeV: 0 };
    this.flip = 0; this.flail = 0; this.guard = 0; this.nextGuard = rand(3, 5); this.ko = null; this.stickers = [];
    this.swaySp = 1.2 + this.round * 0.25; this.swayR = Math.min(V.W * 0.18, 40 + this.round * 25);
  },

  get floor() { return V.H * 0.9; },
  get PH() { return Math.min(V.H * 0.6, V.W * 0.95); },
  get px() { return V.W / 2 + Math.sin(this.t * this.swaySp) * this.swayR + this.sp.dodge; },
  say(kind, force) { if (!force && this.bubble && this.bubble.t < 0.9) return; this.bubble = { s: pick(this.LINES[kind]), t: 0 }; },

  // 紙片人身上各部位在畫面上的位置（只看高度，不管旋轉）
  zones() {
    const P = App.pup, k = this.PH / P.H, J = P.J, fy = this.floor, f = P.foot.y;
    const Y = v => fy - (f - v) * k;
    return { top: Y(J.top.y), neck: Y(J.neck.y), pelvis: Y(J.pelvis.y), headR: (J.neck.y - J.top.y) * k * 0.55, bodyR: Math.max(Math.abs(J.shR.x - J.shL.x) * k * 0.65, this.PH * 0.1) };
  },

  tap(x, y) {
    if (this.st !== 'fight' && this.st !== 'enter') return;
    const z = this.zones(), dx = x - this.px;
    let part = null;
    if (y > z.top - 20 && y < z.neck && Math.abs(dx) < z.headR * 1.25) part = 'head';
    else if (y >= z.neck && y < z.pelvis + this.PH * 0.08 && Math.abs(dx) < z.bodyR) part = 'body';
    this.punch(x, y, part);
  },
  key(k) {
    if (this.st !== 'fight') return;
    const z = this.zones();
    if (k === 'space' || k === 'arrowup' || k === 'w' || k === 'z' || k === 'x') this.punch(this.px + rand(-10, 10), (z.top + z.neck) / 2, 'head');
    if (k === 'arrowdown' || k === 's' || k === 'c') this.punch(this.px + rand(-10, 10), (z.neck * 0.4 + z.pelvis * 0.6), 'body');
  },

  punch(x, y, part) {
    const hand = this.nextHand; this.nextHand = hand === 'L' ? 'R' : 'L';
    // 閃躲：回合越後面越常閃
    let dodged = false;
    if (part && this.st === 'fight' && Math.random() < Math.min(0.3, 0.05 + this.round * 0.04) && this.t - this.lastDodge > 1.2) {
      dodged = true; this.lastDodge = this.t; this.sp.dodgeV += (hand === 'L' ? 1 : -1) * 1400;
    }
    this.punches.push({ hand, x, y, t: 0, part: dodged ? null : part, dodged, done: false });
    this.lastAct = this.t;
  },

  impact(p) {
    const dir = p.hand === 'L' ? 1 : -1, sp = this.sp;
    if (p.dodged) { Sfx.play('whiff'); FX.text(p.x, p.y - 40, 'MISS', '#888', 34); this.say('dodge', true); this.combo = 0; return; }
    if (!p.part) { Sfx.play('whiff'); this.combo = 0; return; }
    if (p.part === 'head' && this.guard > 0) {
      Sfx.play('block'); sp.rotV += dir * 1.5; FX.text(p.x, p.y - 40, '擋住！', '#4d6bd9', 34); this.say('guard');
      if (!this.hintGuard) { this.hintGuard = true; FX.text(this.px, this.zones().pelvis, '打肚子！', '#e0573c', 40); }
      this.combo = 0; return;
    }
    this.combo = this.t - this.lastHit < 0.8 ? this.combo + 1 : 1; this.lastHit = this.t;
    const crit = Math.random() < 0.12, head = p.part === 'head';
    let dmg = (head ? rand(8, 11) : rand(5, 7)) * (1 + Math.min(10, this.combo - 1) * 0.06) * (crit ? 2.2 : 1);
    dmg = Math.round(dmg);
    this.hp -= dmg; this.score += dmg;
    // 反應：頭被打扁、整個人甩、手亂揮；會心一擊會被打到紙片翻面
    if (head) { sp.headV += dir * 16; sp.hsx = 0.62; sp.rotV += dir * 3.5; }
    else { sp.sq = 0.8; sp.rotV += dir * 2.2; sp.headV -= dir * 6; }
    if (crit) { sp.rotV += dir * 7; this.flip = 1; }
    this.flail = 0.45;
    Sfx.play(crit ? 'crit' : 'punch'); V.shake = crit ? 16 : 7;
    this.pow(p.x, p.y, crit ? '會心一擊！' : pick(head ? ['砰！', '啪！', 'POW!', '咚！'] : ['噗！', '碰！', 'BAM!']), crit);
    if (this.combo >= 3) FX.text(p.x, p.y + 50, `${this.combo} 連打！`, '#ff8a00', 26);
    FX.burst(p.x, p.y, crit ? 16 : 7, ['#ffd23f', '#fff6c8', '#ff6b6b'], crit ? 1 : 0.6);
    // OK 繃
    const P = App.pup, J = P.J;
    if (this.stickers.length < 10 && Math.random() < 0.75) {
      if (head) { const c = { x: J.neck.x + (J.top.x - J.neck.x) * 0.5, y: J.top.y + (J.neck.y - J.top.y) * rand(0.3, 0.7) }; this.stickers.push({ part: 'head', x: c.x + rand(-1, 1) * (J.neck.y - J.top.y) * 0.22, y: c.y, r: rand(-0.8, 0.8) }); }
      else this.stickers.push({ part: 'torso', x: J.pelvis.x + rand(-1, 1) * Math.abs(J.shR.x - J.shL.x) * 0.3, y: J.neck.y + (J.pelvis.y - J.neck.y) * rand(0.3, 0.8), r: rand(-0.8, 0.8) });
    }
    for (const c of this.crowd) c.j = 0.4;
    if (this.hp <= 0) this.knockout(dir); else this.say(head ? 'hit' : 'body');
  },
  pow(x, y, s, big) { this.pows = this.pows || []; this.pows.push({ x, y, s, t: 0, big, r: rand(-0.3, 0.3) }); },

  knockout(dir) {
    this.hp = 0; this.kos++; this.score += 100; this.st = 'ko'; this.stT = 0;
    this.ko = { x: 0, y: 0, vx: dir * rand(350, 550), vy: -1500, spin: dir * 14 };
    Sfx.play('bell'); FX.burst(V.W / 2, V.H * 0.4, 40, undefined, 1.3); this.say('ko', true);
    this.punches = [];
  },

  spring(dt) {
    const s = this.sp, k = 160, c = 9;
    const step = (x, v, rest = 0, kk = k, cc = c) => { const a = -kk * (s[x] - rest) - cc * s[v]; s[v] += a * dt; s[x] += s[v] * dt; };
    step('rot', 'rotV'); step('head', 'headV', 0, 200, 8); step('hsx', 'hsxV', 1, 260, 10); step('sq', 'sqV', 1, 300, 12); step('dodge', 'dodgeV', 0, 30, 8);
    s.rot = clamp(s.rot, -1.1, 1.1); s.head = clamp(s.head, -0.9, 0.9);
  },

  update(dt) {
    this.t += dt; this.stT += dt; this.left -= dt;
    if (this.left <= 0) { this.left = 0; this.over = true; this.overText = this.kos ? `時間到！K.O. ${this.kos} 次` : '時間到！'; return; }
    if (this.bubble) { this.bubble.t += dt; if (this.bubble.t > 1.6) this.bubble = null; }
    for (const c of this.crowd) c.j = Math.max(0, c.j - dt);
    if (this.pows) { for (const p of this.pows) p.t += dt; this.pows = this.pows.filter(p => p.t < 0.45); }
    // 拳頭：出拳 0.07 秒打到，再收回
    for (const p of this.punches) { p.t += dt; if (!p.done && p.t >= 0.07) { p.done = true; this.impact(p); } }
    this.punches = this.punches.filter(p => p.t < 0.3);
    this.flail = Math.max(0, this.flail - dt);
    this.flip = Math.max(0, this.flip - dt * 1.8);
    this.spring(dt);

    if (this.st === 'fight') {
      // 擋臉：每隔幾秒舉手擋一下
      this.guard = Math.max(0, this.guard - dt); this.nextGuard -= dt;
      if (this.nextGuard <= 0 && this.round >= 1) { this.guard = rand(1.0, 1.6); this.nextGuard = rand(3.5, 6) / Math.min(2, 0.8 + this.round * 0.2) + this.guard; }
      if (this.t - this.lastAct > 4.5 && !this.bubble) { this.say('taunt'); this.lastAct = this.t; }
    } else if (this.st === 'ko') {
      const k = this.ko; k.vy += 1500 * dt; k.x += k.vx * dt; k.y += k.vy * dt;
      if (this.stT > 1.7) { this.round++; this.newRound(false); }
    } else if (this.st === 'enter') {
      if (this.stT > 0.9 && !this.landed) { this.landed = true; this.sp.sq = 0.7; Sfx.play('boing'); this.say('enter', true); FX.burst(this.px, this.floor, 10, ['#e9d9b6'], 0.5); FX.text(V.W / 2, V.H * 0.3, `第 ${this.round} 回合`, '#e0573c', 50); }
      if (this.stT > 1.3) { this.st = 'fight'; this.landed = false; }
    }
  },

  // ---- 畫面 ----
  drawRing(c) {
    const W = V.W, H = V.H, fy = this.floor;
    const g = c.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#2a2140'); g.addColorStop(1, '#4b3a6b');
    c.fillStyle = g; c.fillRect(-20, -20, W + 40, H + 40);
    // 聚光燈
    c.save(); c.globalCompositeOperation = 'lighter';
    for (const [x0, sw] of [[W * 0.2, 0.25], [W * 0.8, -0.25]]) {
      const lg = c.createLinearGradient(0, 0, 0, fy); lg.addColorStop(0, 'rgba(255,240,190,0.28)'); lg.addColorStop(1, 'rgba(255,240,190,0.02)');
      c.fillStyle = lg; c.beginPath(); c.moveTo(x0 - 20, -10); c.lineTo(x0 + 20, -10); c.lineTo(W / 2 + W * sw * 0.2 + 200, fy); c.lineTo(W / 2 + W * sw * 0.2 - 200, fy); c.closePath(); c.fill();
    }
    c.restore();
    // 觀眾（紙剪的人頭）
    const cy0 = fy - this.PH * 0.75;
    for (const p of this.crowd) {
      const y = cy0 + p.row * 34 - (p.j > 0 ? Math.abs(Math.sin(p.j * 20)) * 16 : Math.abs(Math.sin(this.t * 2 + p.ph)) * 3), x = p.x * (W + 60) - 30;
      Paper.circle(c, x, y, 22, p.c, { border: 2, blur: 0, shadow: false, edge: '#8a7ab0' });
      Paper.rect(c, x - 26, y + 18, 52, 60, p.c, 14, { border: 2, shadow: false, edge: '#8a7ab0' });
    }
    // 擂台地板
    Paper.shape(c, cc => { cc.moveTo(-40, fy - 30); cc.lineTo(W + 40, fy - 30); cc.lineTo(W + 40, H + 30); cc.lineTo(-40, H + 30); cc.closePath(); }, '#3b6fd1', { border: 6 });
    c.fillStyle = 'rgba(255,255,255,0.12)'; c.fillRect(-40, fy + 20, W + 80, 8);
    // 後面的繩子和柱子
    const postX = [W * 0.04, W * 0.96];
    for (const [i, col] of ['#e94b4b', '#fffdf5', '#3b6fd1'].entries()) {
      const y = fy - this.PH * (0.28 + i * 0.17);
      Paper.shape(c, cc => { cc.rect(postX[0], y - 5, postX[1] - postX[0], 10); }, col, { border: 3, blur: 4 });
    }
    for (const x of postX) Paper.rect(c, x - 12, fy - this.PH * 0.8, 24, this.PH * 0.8, '#c9c2b0', 6, { border: 4 });
  },

  drawGlove(c, x, y, s, ang) {
    c.save(); c.translate(x, y); c.rotate(ang); c.scale(s, s);
    Paper.rect(c, -34, 30, 68, 50, '#fffdf5', 12, { border: 4 });                        // 袖口
    Paper.shape(c, cc => { cc.ellipse(0, -10, 58, 62, 0, 0, Math.PI * 2); }, '#e23b3b', { border: 6 });
    Paper.shape(c, cc => { cc.ellipse(-48, 10, 20, 30, -0.5, 0, Math.PI * 2); }, '#d13030', { border: 4, blur: 3 });  // 大拇指
    c.fillStyle = 'rgba(255,255,255,0.35)'; c.beginPath(); c.ellipse(-18, -38, 18, 10, -0.5, 0, Math.PI * 2); c.fill();
    c.restore();
  },

  drawBubble(c, x, y) {
    const b = this.bubble; if (!b) return;
    const pop = Math.min(1, b.t * 8), a = Math.min(1, (1.6 - b.t) * 4);
    c.save(); c.globalAlpha = a; c.font = '900 28px "Noto Sans TC", system-ui, sans-serif';
    const w = c.measureText(b.s).width + 34, h = 54, bx = clamp(x, 10, V.W - w - 10), by = y - h;
    c.translate(bx + w / 2, by + h / 2); c.scale(pop, pop); c.translate(-(bx + w / 2), -(by + h / 2));
    Paper.shape(c, cc => { Paper.rrect(cc, bx, by, w, h, 18); cc.moveTo(bx + 24, by + h - 2); cc.lineTo(bx + 4, by + h + 24); cc.lineTo(bx + 48, by + h - 2); }, '#fffdf5', { border: 0 });
    c.strokeStyle = '#4a3520'; c.lineWidth = 3; c.lineJoin = 'round'; c.beginPath(); Paper.rrect(c, bx, by, w, h, 18); c.stroke();
    c.fillStyle = '#4a3520'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(b.s, bx + w / 2, by + h / 2 + 1);
    c.restore();
  },

  draw(c) {
    this.drawRing(c);
    const fy = this.floor, sp = this.sp, P = Puppet.Poses, t = this.t;
    let x = this.px, y = fy;
    // 姿勢：拳擊架勢（拳頭舉在胸前，上下彈）、擋臉、被打時手亂揮
    const bob = Math.abs(Math.sin(t * 5));
    let pose = { aL: 0.45, aLf: 2.3, aR: 0.45, aRf: 2.3, lL: 0.12, lR: 0.12, dy: -bob * 0.02, head: sp.head, rot: sp.rot, hsx: sp.hsx, hsy: 2 - sp.hsx, sy: sp.sq, sx: 2 - sp.sq };
    if (this.guard > 0 && this.st === 'fight') Object.assign(pose, { aL: 0.95, aLf: 2.95, aR: 0.95, aRf: 2.95 });
    if (this.flail > 0) { const f = this.flail * 4; Object.assign(pose, { aL: 1.4 + Math.sin(t * 40) * f, aLf: 0.8 + Math.sin(t * 33) * f, aR: 1.4 + Math.sin(t * 37 + 1) * f, aRf: 0.8 + Math.sin(t * 29) * f, lL: 0.3, lR: 0.3 }); }
    if (this.flip > 0) pose.sx *= Math.cos((1 - this.flip) * Math.PI * 2);   // 被打到紙片翻一圈
    let alpha = 1;
    if (this.st === 'ko') {
      const k = this.ko; x += k.x; y += k.y; pose = Object.assign(P.hurt(0), { rot: k.spin * this.stT, sx: Math.cos(this.stT * 9), aL: 2.5, aR: 2.5, lL: 0.5, lR: 0.5, head: 0.4 });
      const s = Math.max(0.15, 1 - this.stT * 0.45); pose.sx *= s; pose.sy = s;
    } else if (this.st === 'enter') {
      const d = Math.min(1, this.stT / 0.9); y = fy - (1 - d * d) * V.H; pose.rot = Math.sin(this.stT * 9) * 0.3 * (1 - d); pose.aL = pose.aR = 2.4 - d * 2;
    }
    if (this.st !== 'ko') { c.fillStyle = 'rgba(10,10,40,0.35)'; c.beginPath(); c.ellipse(this.px, fy + 4, this.PH * 0.2, this.PH * 0.035, 0, 0, Math.PI * 2); c.fill(); }
    const stickers = this.stickers, sz = App.pup.H * 0.05;
    Puppet.draw(c, App.pup, x, y, this.PH, pose, {
      alpha, decor: (n, cc) => {
        for (const s of stickers) if (s.part === n) {
          cc.save(); cc.translate(s.x, s.y); cc.rotate(s.r);
          for (const r of [0, Math.PI / 2]) { cc.save(); cc.rotate(r); Paper.rect(cc, -sz, -sz * 0.32, sz * 2, sz * 0.64, '#f0c08a', sz * 0.3, { border: sz * 0.12, blur: 2, oy: 1 }); cc.fillStyle = '#e8ad70'; cc.fillRect(-sz * 0.35, -sz * 0.3, sz * 0.7, sz * 0.6); cc.restore(); }
          cc.restore();
        }
      },
    });
    // 對話框
    if (this.st !== 'ko' || this.stT < 0.8) { const z = this.zones(); this.drawBubble(c, (this.st === 'ko' ? x : this.px) + z.headR * 0.9, (this.st === 'ko' ? y - this.PH : z.top) + 10); }
    // 打擊字
    for (const p of this.pows || []) {
      const s = (p.big ? 1.5 : 1) * (0.6 + Math.min(1, p.t * 12) * 0.6);
      c.save(); c.translate(p.x, p.y); c.rotate(p.r); c.scale(s, s); c.globalAlpha = Math.min(1, (0.45 - p.t) * 6);
      Paper.star(c, 0, 0, 62, p.big ? '#ff4d4d' : '#ffd23f', 0, { border: 5 });
      c.font = '900 30px "Noto Sans TC", system-ui, sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle';
      c.lineWidth = 6; c.strokeStyle = '#fffdf5'; c.strokeText(p.s, 0, 2); c.fillStyle = p.big ? '#fff' : '#d9452b'; if (p.big) { c.strokeStyle = '#a01818'; c.strokeText(p.s, 0, 2); } c.fillText(p.s, 0, 2);
      c.restore();
    }
    // K.O. 大字
    if (this.st === 'ko') {
      const s = Math.min(1, this.stT * 5) * (1 + Math.sin(this.stT * 10) * 0.04);
      c.save(); c.translate(V.W / 2, V.H * 0.38); c.rotate(-0.12); c.scale(s, s);
      c.font = '900 120px "Noto Sans TC", system-ui, sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle';
      c.lineJoin = 'round'; c.lineWidth = 22; c.strokeStyle = '#fffdf5'; c.strokeText('K.O.!', 0, 0); c.fillStyle = '#e23b3b'; c.fillText('K.O.!', 0, 0);
      c.restore();
    }
    // 拳擊手套：沒出拳時在下面兩邊待命；出拳時飛向點的位置、越遠越小
    const base = { L: { x: V.W * 0.18, y: V.H * 1.02 }, R: { x: V.W * 0.82, y: V.H * 1.02 } };
    for (const h of ['L', 'R']) {
      const p = this.punches.filter(q => q.hand === h).pop();
      let gx = base[h].x + Math.sin(t * 4 + (h === 'L' ? 0 : 2)) * 6, gy = base[h].y + Math.cos(t * 4) * 6, gs = 1, ga = h === 'L' ? 0.5 : -0.5;
      if (p) {
        const k = p.t < 0.07 ? p.t / 0.07 : p.t < 0.11 ? 1 : Math.max(0, 1 - (p.t - 0.11) / 0.19);
        const e = 1 - (1 - k) * (1 - k);
        gx += (p.x - gx) * e; gy += (p.y + 40 - gy) * e; gs = 1 - 0.4 * e; ga = Math.atan2(p.x - base[h].x, -(p.y - base[h].y)) * e + ga * (1 - e);
      }
      const sc = Math.min(1, V.W / 700) * 1.05;
      this.drawGlove(c, gx, gy, gs * sc, ga);
    }
    // 血條
    const bw = Math.min(440, V.W * 0.62), bx = (V.W - bw) / 2, by = 76;
    Paper.rect(c, bx, by, bw, 26, '#5a2a2a', 13, { border: 4 });
    const f = clamp(this.hp / this.maxHp, 0, 1);
    if (f > 0) { c.fillStyle = f > 0.5 ? '#5bd36b' : f > 0.25 ? '#ffc23d' : '#ff4d4d'; c.beginPath(); Paper.rrect(c, bx + 3, by + 3, (bw - 6) * f, 20, 10); c.fill(); }
    c.font = '900 18px "Noto Sans TC", system-ui, sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle';
    c.lineWidth = 5; c.strokeStyle = '#5a2a2a'; c.strokeText(`第 ${this.round} 回合`, V.W / 2, by + 13); c.fillStyle = '#fff'; c.fillText(`第 ${this.round} 回合`, V.W / 2, by + 13);
  },
  hud() { return { L: `<b>${this.score}</b> 分${this.combo >= 3 ? `　<span class="combo">${this.combo} 連打</span>` : ''}`, R: `K.O. ${this.kos}　⏱ ${Math.ceil(this.left)}` }; },
});
