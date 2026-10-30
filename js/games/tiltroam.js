'use strict';
// =====================================================
//  「傾斜到處走」遊戲產生器：傾斜手機，角色在整個畫面裡移動（有慣性），收集東西、閃開壞蛋
//  特殊玩法：grow（越吃越大）、herd（把羊趕進羊圈）、light（只看得到身邊）、hidden（看不到的寶藏，靠聲音找）
// =====================================================
function TiltRoam(cfg) {
  registerGame(Object.assign({
    tilt: true, TIME: 45,
    start() {
      this.t = 0; this.left = this.TIME; this.score = 0; this.over = false; this.overText = cfg.end || '時間到！';
      this.lives = cfg.lives || 0; this.hurt = 0; this.cheer = 0; this.got = 0; this.round = 1;
      this.p = { x: V.W / 2, y: V.H * 0.55, vx: 0, vy: 0, r: cfg.r || 34, face: 1 };
      this.things = []; this.foes = []; this.spawnT = 0; this.beepT = 0;
      if (cfg.init) cfg.init(this);
    },
    get top() { return Kid.portrait() ? 110 : 70; },
    rpos(m = 50) { let x, y, k = 0; do { x = rand(m, V.W - m); y = rand(this.top + m, V.H - m); } while (k++ < 30 && Math.hypot(x - this.p.x, y - this.p.y) < 160); return { x, y }; },
    addThing() { const T = cfg.thing(this), q = this.rpos(); this.things.push(Object.assign({ x: q.x, y: q.y, vx: 0, vy: 0, ph: rand(0, 6), born: 0 }, T)); },
    addFoe() { const F = cfg.foe(this), q = this.rpos(80); this.foes.push(Object.assign({ x: q.x, y: q.y, vx: rand(-1, 1) * 60, vy: rand(-1, 1) * 60, ph: rand(0, 6) }, F)); },
    tap() { Tilt.calibrate(); },
    update(dt) {
      this.t += dt; this.left -= dt; this.hurt = Math.max(0, this.hurt - dt); this.cheer = Math.max(0, this.cheer - dt);
      if (this.left <= 0) { this.left = 0; this.over = true; if (cfg.endText) this.overText = cfg.endText(this); return; }
      const p = this.p, acc = cfg.acc || 1500, mx = cfg.max || 520;
      p.vx += Tilt.x * acc * dt; p.vy += Tilt.y * acc * dt; p.vx *= 1 - Math.min(1, dt * 2.4); p.vy *= 1 - Math.min(1, dt * 2.4);
      const sp = Math.hypot(p.vx, p.vy); if (sp > mx) { p.vx *= mx / sp; p.vy *= mx / sp; }
      p.x = clamp(p.x + p.vx * dt, p.r, V.W - p.r); p.y = clamp(p.y + p.vy * dt, this.top + p.r * 0.5, V.H - p.r);
      if (Math.abs(p.vx) > 20) p.face = Math.sign(p.vx);
      // 東西
      while (this.things.length < (cfg.n ?? 5)) this.addThing();
      while (this.foes.length < (cfg.foes ? cfg.foes(this) : 0)) this.addFoe();
      for (const o of this.things) {
        o.born = Math.min(1, o.born + dt * 3);
        if (o.move === 'wander' || o.move === 'flee' || o.move === 'herd') {
          o.vx += rand(-1, 1) * 200 * dt; o.vy += rand(-1, 1) * 200 * dt;
          const d = Math.hypot(o.x - p.x, o.y - p.y);
          if ((o.move === 'flee' || o.move === 'herd') && d < (o.fear || 150)) { o.vx += (o.x - p.x) / d * 900 * dt; o.vy += (o.y - p.y) / d * 900 * dt; }
          const s = Math.hypot(o.vx, o.vy), m = o.speed || 90; if (s > m) { o.vx *= m / s; o.vy *= m / s; }
          o.x += o.vx * dt; o.y += o.vy * dt;
          if (o.x < 30 || o.x > V.W - 30) o.vx *= -1; if (o.y < this.top + 20 || o.y > V.H - 30) o.vy *= -1;
          o.x = clamp(o.x, 30, V.W - 30); o.y = clamp(o.y, this.top + 20, V.H - 30);
        }
        if (cfg.herd) { if (cfg.herd(this, o)) continue; }
        else if (!o.dead && Math.hypot(o.x - p.x, o.y - p.y) < p.r + (o.r || 22)) cfg.touch(this, o);
      }
      for (const f of this.foes) {
        const d = Math.hypot(f.x - p.x, f.y - p.y) || 1;
        if (f.chase) { f.vx += (p.x - f.x) / d * f.chase * dt * 3; f.vy += (p.y - f.y) / d * f.chase * dt * 3; }
        else { f.vx += rand(-1, 1) * 150 * dt; f.vy += rand(-1, 1) * 150 * dt; }
        const s = Math.hypot(f.vx, f.vy), m = f.speed || 100; if (s > m) { f.vx *= m / s; f.vy *= m / s; }
        f.x += f.vx * dt; f.y += f.vy * dt;
        if (f.x < 30 || f.x > V.W - 30) f.vx *= -1; if (f.y < this.top + 20 || f.y > V.H - 30) f.vy *= -1;
        f.x = clamp(f.x, 30, V.W - 30); f.y = clamp(f.y, this.top + 20, V.H - 30);
        if (!this.hurt && d < p.r + (f.r || 26) * 0.8) cfg.hit(this, f);
      }
      this.things = this.things.filter(o => !o.dead); this.foes = this.foes.filter(f => !f.dead);
      if (cfg.tick) cfg.tick(this, dt);
    },
    // 共用：吃到東西
    collect(o, pts, snd = 'coin') { o.dead = 1; this.score += pts; this.got++; this.cheer = 0.6; Sfx.play(snd); FX.burst(o.x, o.y, 8, undefined, 0.5); FX.text(o.x, o.y - 36, '+' + pts, '#ff7a00', 26); },
    // 共用：被撞
    ouch(f, text = '哎呀！') {
      this.hurt = 1.4; V.shake = 6; Sfx.play(this.lives ? 'hit' : 'boing'); FX.text(this.p.x, this.p.y - 50, text, '#e8453c', 28);
      const d = Math.hypot(this.p.x - f.x, this.p.y - f.y) || 1; this.p.vx += (this.p.x - f.x) / d * 500; this.p.vy += (this.p.y - f.y) / d * 500;
      if (this.lives) { this.lives--; if (this.lives <= 0) { this.over = true; this.overText = cfg.lose || '被抓到了！'; } }
    },
    draw(c) {
      cfg.bg(c, this);
      for (const o of this.things) { c.save(); c.translate(o.x, o.y); c.scale(o.born, o.born); cfg.drawThing ? cfg.drawThing(c, o, this) : Kid.emoji(c, o.e, 0, 0, (o.r || 22) * 1.8, Math.sin(this.t * 3 + o.ph) * 0.15); c.restore(); }
      for (const f of this.foes) { c.save(); c.translate(f.x, f.y + Math.sin(this.t * 4 + f.ph) * 4); if (f.vx > 0 && f.flip) c.scale(-1, 1); Kid.emoji(c, f.e, 0, 0, (f.r || 26) * 1.9); c.restore(); }
      c.save(); if (this.hurt && Math.sin(this.t * 30) > 0) c.globalAlpha = 0.5; cfg.player(c, this.p, this); c.restore();
      if (cfg.over) cfg.over(c, this);
      TiltUI.hint(c, this, null, cfg.hintCol);
    },
    hud() { return { L: `<b>${Math.floor(this.score)}</b> 分` + (cfg.hudL ? cfg.hudL(this) : ''), R: (this.lives ? TiltUI.lives(this.lives, cfg.lives) + '　' : '') + `⏱ ${Math.ceil(this.left)}` }; },
  }, cfg));
}

const RoamBG = {
  grass(c, g, col = '#9fcf7e') { c.fillStyle = col; c.fillRect(-20, -20, V.W + 40, V.H + 40); c.fillStyle = 'rgba(255,255,255,0.12)'; for (let i = 0; i < 40; i++) { c.beginPath(); c.arc((i * 173) % V.W, (i * 97) % V.H, 14 + (i % 4) * 6, 0, Math.PI * 2); c.fill(); } },
  water(c, g, a = '#4fb3e8', b = '#1d6fa8') { const gr = c.createLinearGradient(0, 0, 0, V.H); gr.addColorStop(0, a); gr.addColorStop(1, b); c.fillStyle = gr; c.fillRect(-20, -20, V.W + 40, V.H + 40); c.strokeStyle = 'rgba(255,255,255,0.18)'; c.lineWidth = 3; for (let i = 0; i < 16; i++) { const x = (i * 197) % V.W, y = (i * 113 + g.t * 10) % V.H; c.beginPath(); c.moveTo(x - 20, y); c.quadraticCurveTo(x, y - 6, x + 20, y); c.stroke(); } },
};
// 主角：紙片人的頭在一個圓裡
const RoamMe = (c, p, col = '#fffdf5') => { Paper.circle(c, p.x, p.y, p.r, col, { border: 3, blur: 6 }); Kid.head(c, p.x, p.y + 2, p.r * 0.72, { sx: p.face }, p.r - 3); };

TiltRoam({
  id: 'bee', name: '小蜜蜂採花蜜', icon: '🐝', color: '#f2b33d', kid: true, n: 5,
  desc: '當一隻小蜜蜂，飛到花朵上採花蜜！（手機限定）',
  howto: '📱 手機限定：把手機往想去的方向歪一歪，小蜜蜂就會飛過去。碰到花朵就能採到花蜜！不會輸，限時 45 秒。（電腦用方向鍵）',
  end: '採了好多花蜜！',
  thing: () => ({ e: pick(['🌸', '🌼', '🌻', '🌷', '🌺']), r: 26 }),
  touch(g, o) { g.collect(o, 10, 'catch'); if (g.got % 10 === 0) { Kid.say('好棒！'); FX.text(V.W / 2, V.H * 0.3, '好多花蜜！', '#e0a000', 40); } },
  bg(c, g) { RoamBG.grass(c, g); },
  player(c, p, g) { c.save(); c.translate(p.x, p.y); const w = Math.sin(g.t * 40) * 0.4; c.fillStyle = 'rgba(255,255,255,0.75)'; for (const s of [-1, 1]) { c.save(); c.rotate(s * (0.5 + w)); c.beginPath(); c.ellipse(s * 22, -26, 14, 22, 0, 0, Math.PI * 2); c.fill(); c.restore(); } c.restore(); RoamMe(c, p, '#ffd23f'); c.fillStyle = '#2a2a33'; c.fillRect(p.x - p.r * 0.9, p.y + p.r * 0.5, p.r * 1.8, 5); },
  hudL: g => `　🍯 ${g.got}`,
});

TiltRoam({
  id: 'butterfly', name: '捕蝴蝶', icon: '🦋', color: '#9b5bd6', kid: true, n: 4,
  desc: '拿著網子追蝴蝶，蝴蝶會飛走喔！（手機限定）',
  howto: '📱 手機限定：歪歪手機拿網子追蝴蝶！蝴蝶看到你靠近會飛走，要偷偷繞過去抓。金色蝴蝶分數最多，不會輸，限時 45 秒。（電腦用方向鍵）',
  end: '抓到好多蝴蝶！', max: 560,
  thing: () => { const gold = Math.random() < 0.15; return { e: '🦋', gold, r: 22, move: 'flee', speed: gold ? 150 : 110, fear: 120 }; },
  touch(g, o) { g.collect(o, o.gold ? 30 : 10, o.gold ? 'star' : 'catch'); },
  drawThing(c, o, g) { const f = Math.abs(Math.sin(g.t * 12 + o.ph)); c.scale(0.4 + f * 0.6, 1); if (o.gold) { Paper.circle(c, 0, 0, 26, 'rgba(255,215,60,0.45)', { border: 0, shadow: false }); } Kid.emoji(c, '🦋', 0, 0, 40); },
  bg(c, g) { RoamBG.grass(c, g, '#b9e0a0'); },
  player(c, p, g) { c.strokeStyle = '#8a5a34'; c.lineWidth = 6; c.beginPath(); c.moveTo(p.x + 30, p.y + 30); c.lineTo(p.x + 70, p.y + 80); c.stroke(); c.fillStyle = 'rgba(255,255,255,0.4)'; c.strokeStyle = '#ffffff'; c.lineWidth = 4; c.beginPath(); c.arc(p.x, p.y, p.r + 6, 0, Math.PI * 2); c.fill(); c.stroke(); Kid.head(c, p.x, p.y, p.r * 0.6, { sx: p.face }, p.r - 4); },
  hudL: g => `　🦋 ${g.got}`,
});

TiltRoam({
  id: 'bigfish', name: '大魚吃小魚', icon: '🐟', color: '#2f7fc1', lives: 3, n: 8, r: 26,
  desc: '吃比你小的魚會長大，小心比你大的魚！（手機限定）',
  howto: '📱 手機限定：傾斜手機游泳。吃掉比你小的魚就會長大，碰到比你大的魚會被咬一口！越吃越大，看你能長多大。3 條命，限時 60 秒。（電腦用方向鍵）',
  TIME: 60, end: '長成大魚了！', lose: '被大魚吃掉了！', hintCol: '#ffffff',
  thing(g) { const pr = g.p.r, r = clamp(pr * rand(0.45, 1.6), 12, 110); return { e: r < 22 ? '🐟' : r < 40 ? '🐠' : r < 70 ? '🐡' : '🦈', r, move: 'wander', speed: 70 + rand(0, 40), flip: 1 }; },
  herd(g, o) {
    const p = g.p; if (Math.hypot(o.x - p.x, o.y - p.y) > p.r + o.r * 0.7) return false;
    if (o.r < p.r * 0.92) { g.collect(o, Math.round(o.r), 'chomp'); p.r = Math.min(120, p.r + o.r * 0.08); }
    else if (!g.hurt) g.ouch(o, '被咬了！');
    return true;
  },
  drawThing(c, o, g) { if (o.vx > 0) c.scale(-1, 1); Kid.emoji(c, o.e, 0, 0, o.r * 2); },
  bg(c, g) { RoamBG.water(c, g); },
  player(c, p, g) { c.save(); c.translate(p.x, p.y); c.scale(p.face, 1); Paper.shape(c, cc => { cc.moveTo(-p.r * 0.8, 0); cc.lineTo(-p.r * 1.6, -p.r * 0.6); cc.lineTo(-p.r * 1.6, p.r * 0.6); cc.closePath(); }, '#ff8a1f', { border: 3 }); c.restore(); RoamMe(c, p, '#ff9a4a'); },
  hudL: g => `　🐟 ${Math.round(g.p.r)} 公分`,
  endText: g => `長到 ${Math.round(g.p.r)} 公分！`,
});

TiltRoam({
  id: 'firefly', name: '夜晚抓螢火蟲', icon: '✨', color: '#2b3a6b', kid: true, n: 6,
  desc: '黑漆漆的晚上，跟著光點抓螢火蟲！（手機限定）',
  howto: '📱 手機限定：晚上好暗，只看得到紙片人身邊。歪歪手機走過去，碰到一閃一閃的螢火蟲就抓到了！不會輸，限時 45 秒。（電腦用方向鍵）',
  end: '抓到滿滿一瓶！', hintCol: '#fff6c8',
  thing: () => ({ r: 18, move: 'wander', speed: 50 }),
  touch(g, o) { g.collect(o, 10, 'star'); },
  drawThing(c, o, g) { const b = 0.5 + 0.5 * Math.sin(g.t * 5 + o.ph); c.fillStyle = `rgba(255,240,120,${0.25 + b * 0.35})`; c.beginPath(); c.arc(0, 0, 22, 0, Math.PI * 2); c.fill(); c.fillStyle = '#fff6a0'; c.beginPath(); c.arc(0, 0, 6, 0, Math.PI * 2); c.fill(); },
  bg(c, g) { c.fillStyle = '#1b2a3a'; c.fillRect(-20, -20, V.W + 40, V.H + 40); for (let i = 0; i < 10; i++) Paper.circle(c, (i * 157) % V.W, V.H - 40 - (i % 3) * 30, 60, '#22402c', { border: 0, shadow: false }); },
  over(c, g) {   // 黑暗，只有身邊亮
    const p = g.p, R = 150; c.save(); c.fillStyle = 'rgba(5,8,20,0.82)'; c.beginPath(); c.rect(-20, -20, V.W + 40, V.H + 40); c.arc(p.x, p.y, R, 0, Math.PI * 2, true); c.fill('evenodd');
    const rg = c.createRadialGradient(p.x, p.y, R * 0.5, p.x, p.y, R); rg.addColorStop(0, 'rgba(5,8,20,0)'); rg.addColorStop(1, 'rgba(5,8,20,0.82)'); c.fillStyle = rg; c.beginPath(); c.arc(p.x, p.y, R + 1, 0, Math.PI * 2); c.fill(); c.restore();
    for (const o of g.things) { const b = 0.5 + 0.5 * Math.sin(g.t * 5 + o.ph); c.fillStyle = `rgba(255,240,120,${b * 0.9})`; c.beginPath(); c.arc(o.x, o.y, 4, 0, Math.PI * 2); c.fill(); }
  },
  player(c, p, g) { RoamMe(c, p); Kid.emoji(c, '🏮', p.x + p.r, p.y - p.r, 26); },
  hudL: g => `　✨ ${g.got}`,
});

TiltRoam({
  id: 'candyghost', name: '鬼屋找糖果', icon: '👻', color: '#6b4fa8', lives: 3, n: 10,
  desc: '在鬼屋收集糖果，被小鬼追到會嚇一跳！（手機限定）',
  howto: '📱 手機限定：傾斜手機在鬼屋裡走，收集 🍬 糖果和 🍭 棒棒糖。👻 小鬼會慢慢追過來，被碰到 3 次就逃出鬼屋了！越後面小鬼越多，限時 60 秒。（電腦用方向鍵）',
  TIME: 60, end: '糖果收集完畢！', lose: '嚇得逃出鬼屋了！', hintCol: '#fff6c8',
  thing: () => Math.random() < 0.15 ? { e: '🍭', pts: 30, r: 22 } : { e: '🍬', pts: 10, r: 18 },
  foes: g => Math.min(5, 1 + Math.floor(g.t / 12)),
  foe: g => ({ e: '👻', r: 26, chase: 70 + g.t, speed: 70 + g.t * 1.5 }),
  touch(g, o) { g.collect(o, o.pts, o.pts > 10 ? 'star' : 'coin'); },
  hit(g, f) { g.ouch(f, '哇！嚇一跳！'); },
  bg(c, g) { c.fillStyle = '#3a2f55'; c.fillRect(-20, -20, V.W + 40, V.H + 40); c.fillStyle = 'rgba(0,0,0,0.15)'; for (let y = 0; y < V.H; y += 50) for (let x = (y / 50) % 2 * 50; x < V.W; x += 100) c.fillRect(x, y, 50, 50); Kid.emoji(c, '🕸️', 30, 140, 50); Kid.emoji(c, '🕸️', V.W - 30, 140, 50); },
  player: RoamMe,
  hudL: g => `　🍬 ${g.got}`,
});

TiltRoam({
  id: 'sheep', name: '趕羊回家', icon: '🐑', color: '#7dbb5c', kid: true, n: 0, TIME: 60,
  desc: '羊會躲開你，把牠們趕進羊圈！（手機限定）',
  howto: '📱 手機限定：羊會躲開紙片人，所以要從羊的後面靠近，把牠們「推」進上面的羊圈！全部趕進去就換下一群，限時 60 秒。（電腦用方向鍵）',
  end: '牧羊高手！', max: 420,
  init(g) { g.sheep = 4; for (let i = 0; i < g.sheep; i++) g.things.push(this.mk(g)); },
  mk(g) { return { e: '🐑', r: 26, move: 'herd', speed: 120, fear: 140, x: rand(60, V.W - 60), y: rand(V.H * 0.55, V.H - 60), vx: 0, vy: 0, ph: rand(0, 6), born: 1 }; },
  thing() { return this.mk(); },
  pen() { return { x: V.W / 2 - Math.min(170, V.W * 0.3), y: (Kid.portrait() ? 110 : 70) + 10, w: Math.min(340, V.W * 0.6), h: 130 }; },
  herd(g, o) {
    const P = this.pen(); if (o.in) { o.x = clamp(o.x, P.x + 25, P.x + P.w - 25); o.y = clamp(o.y, P.y + 25, P.y + P.h - 20); o.vx *= 0.8; o.vy *= 0.8; return true; }
    if (o.x > P.x && o.x < P.x + P.w && o.y < P.y + P.h && o.y > P.y) {
      o.in = true; g.score += 20; g.got++; Sfx.play('ding'); FX.text(o.x, o.y - 30, '咩～ +20', '#3d8b2a', 26);
      if (g.things.every(s => s.in)) { g.round++; g.score += 50; Sfx.play('win'); FX.text(V.W / 2, V.H * 0.45, '全部回家了！', '#e0573c', 44); Kid.say('全部回家了！'); g.things = []; for (let i = 0; i < 3 + g.round; i++) g.things.push(this.mk(g)); }
    }
    return true;
  },
  bg(c, g) {
    RoamBG.grass(c, g, '#a8d68a'); const P = this.pen();
    c.fillStyle = 'rgba(200,160,100,0.35)'; c.fillRect(P.x, P.y, P.w, P.h);
    c.strokeStyle = '#8a5a34'; c.lineWidth = 6; c.beginPath(); c.moveTo(P.x, P.y + P.h); c.lineTo(P.x, P.y); c.lineTo(P.x + P.w, P.y); c.lineTo(P.x + P.w, P.y + P.h); c.stroke();
    for (let x = P.x; x <= P.x + P.w; x += P.w / 6) { c.fillStyle = '#8a5a34'; c.fillRect(x - 4, P.y - 10, 8, 20); }
    Kid.text(c, '羊圈', P.x + P.w / 2, P.y + P.h / 2, 26, 'rgba(120,80,40,0.6)', 0);
  },
  drawThing(c, o, g) { if (o.vx > 0) c.scale(-1, 1); Kid.emoji(c, '🐑', 0, 0, 46); },
  player: RoamMe,
  hudL: g => `　🐑 ${g.got}`,
});

TiltRoam({
  id: 'snowman', name: '滾雪球堆雪人', icon: '⛄', color: '#7fb3e0', kid: true, n: 7, r: 18,
  desc: '滾雪球吃雪花，滾夠大就堆成雪人！（手機限定）',
  howto: '📱 手機限定：歪歪手機滾雪球，碰到 ❄️ 雪花雪球就會變大。滾到夠大就會自動變成一個雪人！撞到樹會掉一點雪，不會輸，限時 45 秒。（電腦用方向鍵）',
  end: '堆了好多雪人！',
  init(g) { g.men = 0; },
  thing: () => Math.random() < 0.25 ? { e: '🌲', tree: 1, r: 26 } : { e: '❄️', r: 18 },
  touch(g, o) {
    const p = g.p;
    if (o.tree) { if (!g.hurt) { g.hurt = 0.8; p.r = Math.max(18, p.r - 6); Sfx.play('thud'); p.vx *= -1; p.vy *= -1; FX.text(p.x, p.y - 40, '咚！', '#3d8b4a', 26); } return; }
    g.collect(o, 5, 'pop'); p.r += 3;
    if (p.r >= 52) { g.men++; g.score += 50; p.r = 18; Sfx.play('win'); FX.burst(p.x, p.y, 30, ['#ffffff', '#cfe9ff'], 1); FX.text(p.x, p.y - 60, '⛄ 雪人完成！', '#3f8fe0', 34); Kid.say('雪人完成了！'); g.done = (g.done || []).concat([{ x: p.x, y: p.y }]).slice(-6); }
  },
  bg(c, g) { c.fillStyle = '#eef6ff'; c.fillRect(-20, -20, V.W + 40, V.H + 40); for (const d of g.done || []) Kid.emoji(c, '⛄', d.x, d.y, 70); },
  player(c, p, g) { Paper.circle(c, p.x, p.y, p.r, '#ffffff', { border: 3, blur: 6 }); Kid.head(c, p.x, p.y - p.r - 14, 16); },
  hudL: g => `　⛄ ${g.men}`,
});

TiltRoam({
  id: 'oceanclean', name: '海洋清潔隊', icon: '🐢', color: '#2fa58c', kid: true, n: 7,
  desc: '撿起海裡的垃圾，保護海龜！（手機限定）',
  howto: '📱 手機限定：歪歪手機潛水，撿起海裡的垃圾（瓶子、袋子、鞋子）。小心不要撞到海龜和魚，牠們會被嚇到喔！不會輸，限時 45 秒。（電腦用方向鍵）',
  end: '海洋變乾淨了！', hintCol: '#ffffff',
  thing: () => ({ e: pick(['🥤', '🛍️', '👟', '🥫', '🧃']), r: 22, move: 'wander', speed: 20 }),
  foes: () => 3, foe: () => ({ e: pick(['🐢', '🐠', '🐙']), r: 28, speed: 70, flip: 1 }),
  touch(g, o) { g.collect(o, 10, 'pop'); if (g.got % 10 === 0) { Kid.say('海洋變乾淨了！'); FX.text(V.W / 2, V.H * 0.3, '謝謝你！', '#2fa58c', 40); } },
  hit(g, f) { g.hurt = 1; g.score = Math.max(0, g.score - 5); Sfx.play('boing'); FX.text(f.x, f.y - 40, '小心海龜！', '#7a62b8', 26); const d = Math.hypot(g.p.x - f.x, g.p.y - f.y) || 1; g.p.vx += (g.p.x - f.x) / d * 400; g.p.vy += (g.p.y - f.y) / d * 400; },
  bg(c, g) { RoamBG.water(c, g, '#5cc2ee', '#2b7fb8'); c.fillStyle = '#e6c88a'; c.fillRect(-20, V.H - 20, V.W + 40, 30); },
  player(c, p, g) { RoamMe(c, p, '#bfe8ff'); Kid.emoji(c, '🧺', p.x + p.r * 0.9, p.y + p.r * 0.7, 24); },
  hudL: g => `　🗑️ ${g.got}`,
});

TiltRoam({
  id: 'treasure', name: '金屬探測尋寶', icon: '💰', color: '#c9822f', kid: true, n: 0, TIME: 60,
  desc: '寶藏藏在沙子裡，聽「嗶嗶」聲找出來！（手機限定）',
  howto: '📱 手機限定：寶藏埋在沙灘下面看不到！歪歪手機拿著探測器走來走去，越靠近寶藏「嗶嗶」聲越快、圈圈越紅。走到寶藏上面就會挖出來！限時 60 秒。（電腦用方向鍵）',
  end: '挖到好多寶藏！',
  init(g) { g.hide = g.rpos(80); g.dig = 0; },
  tick(g, dt) {
    const d = Math.hypot(g.hide.x - g.p.x, g.hide.y - g.p.y), k = clamp(1 - d / 600, 0, 1); g.heat = k;
    g.beepT -= dt; if (g.beepT <= 0) { Sfx.note(500 + k * 700, 0.06, 0.08); g.beepT = 1.1 - k * 1.0; }
    if (d < 34) {
      const e = pick(['💰', '💎', '👑', '🏆', '🗝️', '⭐']); g.score += e === '👑' ? 50 : 25; g.got++; Sfx.play('win');
      FX.burst(g.hide.x, g.hide.y, 30, ['#ffd23f', '#fff6c8', '#e6c88a'], 1); FX.text(g.hide.x, g.hide.y - 50, e + ' 挖到了！', '#c9822f', 34);
      (g.found = g.found || []).push({ x: g.hide.x, y: g.hide.y, e }); g.hide = g.rpos(100);
    }
  },
  bg(c, g) { c.fillStyle = '#f2d7a6'; c.fillRect(-20, -20, V.W + 40, V.H + 40); c.fillStyle = 'rgba(200,150,80,0.2)'; for (let i = 0; i < 60; i++) c.fillRect((i * 173) % V.W, (i * 97) % V.H, 4, 4); for (const f of g.found || []) Kid.emoji(c, f.e, f.x, f.y, 34); },
  player(c, p, g) {
    const k = g.heat || 0; c.strokeStyle = `rgba(${Math.round(80 + k * 175)},${Math.round(160 - k * 120)},80,0.8)`; c.lineWidth = 5; c.beginPath(); c.arc(p.x, p.y, p.r + 12 + Math.sin(g.t * (4 + k * 14)) * 4, 0, Math.PI * 2); c.stroke();
    RoamMe(c, p); c.strokeStyle = '#555'; c.lineWidth = 4; c.beginPath(); c.moveTo(p.x + 10, p.y + 20); c.lineTo(p.x + 30, p.y + 52); c.stroke(); Paper.circle(c, p.x + 34, p.y + 58, 12, '#9aa0b5', { border: 2, blur: 2 });
  },
  hudL: g => `　💰 ${g.got}`,
});
