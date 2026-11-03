'use strict';
// =====================================================
//  體感第四彈：松鼠、戳氣球、瓢蟲、放風箏、滑板、水母、點燈籠、搖籤筒、釘釘子、鮮奶油、釣大魚、棉花糖、傾斜保齡球、彈珠賽跑
// =====================================================

// ---- 松鼠撿松果 ----
TiltRoam({
  id: 'squirrel', name: '松鼠撿松果', icon: '🐿️', color: '#b5733a', kid: true, n: 6, r: 30,
  desc: '當一隻小松鼠，到處撿松果和蘋果！（手機限定）',
  howto: '📱 手機限定：歪歪手機讓松鼠跑過去，碰到 🌰 松果和 🍎 蘋果就撿起來！不會輸，限時 45 秒。（電腦用方向鍵）',
  end: '松鼠吃飽了！',
  thing: () => Math.random() < 0.25 ? { e: '🍎', r: 22, pts: 15 } : { e: '🌰', r: 20, pts: 10 },
  touch(g, o) { g.collect(o, o.pts, 'catch'); },
  bg(c, g) { RoamBG.grass(c, g, '#cfe3a0'); for (let i = 0; i < 6; i++) TiltUI.tree(c, (i * 251 + 60) % V.W, 160 + (i * 173) % (V.H - 220), 36); },
  player(c, p, g) { c.save(); c.translate(p.x, p.y); c.scale(-p.face, 1); Kid.emoji(c, '🐿️', 0, 0, 64, Math.sin(g.t * 12) * Math.min(0.15, Math.hypot(p.vx, p.vy) / 2000)); c.restore(); Kid.head(c, p.x, p.y - 40, 14, {}, 16); },
  hudL: g => `　🌰 ${g.got}`,
});

// ---- 針針戳氣球 ----
TiltRoam({
  id: 'pinpop', name: '針針戳氣球', icon: '📍', color: '#e8453c', lives: 3, n: 6, r: 22,
  desc: '你是一根小針，戳破往上飄的氣球！（手機限定）',
  howto: '📱 手機限定：傾斜手機移動小針，碰到 🎈 氣球就戳破得分，⭐ 星星分數更多。小心 🐝 蜜蜂，被叮 3 次就結束，限時 45 秒。（電腦用方向鍵）',
  end: '氣球全戳破了！', lose: '被蜜蜂叮了！',
  thing: () => Math.random() < 0.15 ? { e: '⭐', r: 22, pts: 20, up: 70 } : { e: '🎈', r: 24, pts: 10, up: rand(40, 90) },
  touch(g, o) { g.collect(o, o.pts, 'pop'); FX.burst(o.x, o.y, 10, ['#ff6b6b', '#ffd93d', '#4d96ff'], 0.6); },
  foes: g => 1 + Math.floor(g.t / 20), foe: () => ({ e: '🐝', r: 22, speed: 90, chase: 50, flip: 1 }),
  hit(g, f) { g.ouch(f, '好痛！'); },
  tick(g, dt) { for (const o of g.things) { o.y -= o.up * dt; o.x += Math.sin(g.t * 2 + o.ph) * 20 * dt; if (o.y < g.top - 20) { o.y = V.H + 20; o.x = rand(40, V.W - 40); } } },
  bg(c, g) { BG.sky(c, g); },
  player(c, p, g) { c.strokeStyle = '#8a8f99'; c.lineWidth = 4; c.beginPath(); c.moveTo(p.x, p.y + 10); c.lineTo(p.x, p.y + 40); c.stroke(); Paper.circle(c, p.x, p.y, p.r * 0.8, '#e8453c', { border: 3 }); Kid.head(c, p.x, p.y, p.r * 0.5, {}, p.r * 0.7); },
  hudL: g => `　🎈 ${g.got}`,
});

// ---- 瓢蟲吃蚜蟲 ----
TiltRoam({
  id: 'ladybug', name: '瓢蟲吃蚜蟲', icon: '🐞', color: '#d9463c', lives: 3, n: 8, r: 26,
  desc: '當一隻瓢蟲，吃掉葉子上的蚜蟲，小心小鳥！（手機限定）',
  howto: '📱 手機限定：傾斜手機讓瓢蟲爬過去，吃掉綠色的小蚜蟲保護葉子！🐦 小鳥會追你，被抓 3 次就結束，限時 45 秒。（電腦用方向鍵）',
  end: '葉子都保護好了！', lose: '被小鳥抓到了！',
  thing: () => ({ r: 14, move: 'wander', speed: 30 }),
  touch(g, o) { g.collect(o, 10, 'chomp'); },
  drawThing(c, o, g) { Paper.circle(c, 0, 0, 9, '#7dcc5c', { border: 2, blur: 2 }); c.fillStyle = '#2a2a33'; c.beginPath(); c.arc(4, -3, 2, 0, Math.PI * 2); c.fill(); },
  foes: g => 1 + Math.floor(g.t / 15), foe: () => ({ e: '🐦', r: 26, speed: 95, chase: 45, flip: 1 }),
  hit(g, f) { g.ouch(f, '哎呀！'); },
  bg(c, g) { c.fillStyle = '#5fae55'; c.fillRect(-20, -20, V.W + 40, V.H + 40); c.strokeStyle = 'rgba(255,255,255,0.25)'; c.lineWidth = 6; for (let i = 0; i < 6; i++) { c.beginPath(); c.moveTo(0, i * V.H / 5); c.quadraticCurveTo(V.W / 2, i * V.H / 5 + 60, V.W, i * V.H / 5 - 20); c.stroke(); } },
  player(c, p, g) { c.save(); c.translate(p.x, p.y); c.rotate(Math.atan2(p.vy, p.vx) + Math.PI / 2); Kid.emoji(c, '🐞', 0, 0, 56); c.restore(); },
  hudL: g => `　🐞 ${g.got}`,
});

// ---- 放風箏 ----
TiltRun({
  id: 'kite', name: '放風箏', icon: '🎏', color: '#3f8fe0', dir: 'left', lives: 3, speed: 230,
  desc: '前後傾斜手機讓風箏飛高飛低，閃開小鳥！（手機限定）',
  howto: '📱 手機限定：手機往前、往後歪讓風箏上下飛，收集 ⭐ 星星、🎀 緞帶和 🌈 彩虹，閃開 🐦 小鳥和 ✈️ 飛機。撞到 3 次就結束，限時 45 秒。（電腦用 ↑ ↓ 鍵）',
  end: '風箏飛得好高！', lose: '風箏線斷了！',
  items: [{ e: '⭐', pts: 10, r: 22, w: 4 }, { e: '🎀', pts: 15, r: 24, w: 2, wave: 1 }, { e: '🌈', pts: 25, r: 28, w: 1 }, { e: '🐦', bad: 1, r: 26, w: 3, wave: 1, sp: 1.2 }, { e: '✈️', bad: 1, r: 30, w: 1, sp: 1.6 }],
  bg(c, g) { BG.sky(c, g, true); c.fillStyle = '#8ac46e'; c.fillRect(-20, V.H - 40, V.W + 40, 60); },
  player(c, x, y, g) {
    c.strokeStyle = '#ffffff'; c.lineWidth = 2; c.beginPath(); c.moveTo(x - 20, y + 30); c.quadraticCurveTo(x - 60, V.H * 0.8, 20, V.H - 30); c.stroke();
    c.save(); c.translate(x, y); c.rotate(g.vel * 0.3 - 0.2);
    Paper.shape(c, cc => { cc.moveTo(0, -40); cc.lineTo(30, 0); cc.lineTo(0, 46); cc.lineTo(-30, 0); cc.closePath(); }, '#e8453c', { border: 3 });
    c.strokeStyle = '#ffd23f'; c.lineWidth = 3; c.beginPath(); c.moveTo(0, -40); c.lineTo(0, 46); c.moveTo(-30, 0); c.lineTo(30, 0); c.stroke();
    for (let i = 0; i < 4; i++) Kid.emoji(c, '🎀', -6 - i * 4, 56 + i * 16, 16, Math.sin(g.t * 8 + i) * 0.5);
    c.restore(); Kid.head(c, x, y, 14, {}, 15);
  },
});

// ---- 滑板高手 ----
TiltRun({
  id: 'skateboard', name: '滑板高手', icon: '🛹', color: '#ff9a2e', dir: 'down', lives: 3, speed: 250,
  desc: '左右傾斜手機溜滑板，閃開路障撿星星！（手機限定）',
  howto: '📱 手機限定：左右傾斜手機讓滑板轉彎，收集 ⭐ 星星和 🍩 甜甜圈，閃開 🚧 路障和石頭。撞到 3 次就結束，限時 45 秒。（電腦用 ← → 鍵）',
  end: '滑得好帥！', lose: '跌倒了！',
  items: [{ e: '⭐', pts: 10, r: 22, w: 4 }, { e: '🍩', pts: 15, r: 22, w: 2 }, { e: '🚧', bad: 1, r: 30, w: 3 }, { draw: 'rock', bad: 1, r: 28, w: 2 }],
  bg(c, g) {
    c.fillStyle = '#9fcf7e'; c.fillRect(-20, -20, V.W + 40, V.H + 40); const m = V.W * 0.05; c.fillStyle = '#8a8f99'; c.fillRect(m, -20, V.W - m * 2, V.H + 40);
    c.fillStyle = '#ffffff'; for (let i = 0; i < 10; i++) { const y = ((i * 110 + g.scroll) % (V.H + 110)) - 60; c.fillRect(V.W / 2 - 4, y, 8, 50); }
  },
  player(c, x, y, g) { c.save(); c.translate(x, y); c.rotate(g.vel * 0.3); Paper.rect(c, -40, 18, 80, 12, '#ff9a2e', 6, { border: 3 }); for (const s of [-1, 1]) Paper.circle(c, s * 26, 34, 7, '#2a2a33', { border: 2 }); Puppet.draw(c, App.pup, 0, 18, 110, g.cheer ? Puppet.Poses.cheer(g.t) : { aL: 1.2, aR: 1.4, aLf: 0.3, aRf: -0.3, lL: 0.25, lR: 0.25, lLf: -0.4, lRf: -0.4, rot: g.vel * 0.2 }); c.restore(); },
});

// ---- 水母漂漂 ----
TiltRun({
  id: 'jellyfish', name: '水母漂漂', icon: '🐙', color: '#7a62b8', dir: 'up', lives: 3, speed: 200, pr: 34,
  desc: '當一隻水母在海裡漂，閃開鯊魚和魚鉤！（手機限定）',
  howto: '📱 手機限定：左右傾斜手機讓水母漂動，收集 ⭐ 星星和 🐚 貝殼，閃開 🦈 鯊魚和 🎣 魚鉤。撞到 3 次就結束，限時 45 秒。（電腦用 ← → 鍵）',
  end: '漂到好深的海底！', lose: '被抓住了！',
  items: [{ e: '⭐', pts: 10, r: 22, w: 4 }, { e: '🐚', pts: 15, r: 22, w: 2 }, { e: '🦈', bad: 1, r: 34, w: 2, wave: 1 }, { e: '🎣', bad: 1, r: 26, w: 2 }],
  bg(c, g) { RoamBG.water(c, { t: g.t }, '#3fa4ea', '#123f7a'); },
  player(c, x, y, g) {
    const w = Math.sin(g.t * 5);
    c.strokeStyle = 'rgba(255,190,240,0.9)'; c.lineWidth = 4; for (let i = -2; i <= 2; i++) { c.beginPath(); c.moveTo(x + i * 10, y + 10); c.quadraticCurveTo(x + i * 12 + w * 10, y + 40, x + i * 10 - w * 6, y + 70); c.stroke(); }
    Paper.shape(c, cc => { cc.ellipse(x, y, 36 + w * 3, 30 - w * 3, 0, Math.PI, Math.PI * 2); cc.closePath(); }, '#ff9ee0', { border: 3 });
    Kid.head(c, x, y - 12, 14, {}, 16);
  },
});

// ---- 點燈籠 ----
TiltRoam({
  id: 'lanterns', name: '點燈籠', icon: '🏮', color: '#d9463c', kid: true, n: 0, r: 28, TIME: 60,
  desc: '風會吹熄燈籠，跑過去把燈籠點亮！（手機限定）',
  howto: '📱 手機限定：晚上的花園有好多燈籠，風會把它們吹熄。歪歪手機跑到熄掉的燈籠旁邊就能點亮！亮著的燈籠越多分數越高，不會輸，限時 60 秒。（電腦用方向鍵）',
  end: '花園好亮！',
  init(g) { g.lan = []; const P = Kid.portrait(), cols = P ? 3 : 4; for (let i = 0; i < cols * 2; i++) g.lan.push({ x: V.W * (i % cols + 0.5) / cols, y: (P ? V.H * 0.32 : V.H * 0.3) + Math.floor(i / cols) * V.H * (P ? 0.32 : 0.38), lit: Math.random() < 0.5, ph: rand(0, 6) }); },
  tick(g, dt) {
    for (const L of g.lan) {
      if (L.lit && Math.random() < dt * (0.08 + g.t / 900)) { L.lit = false; Sfx.play('blow'); }
      if (!L.lit && Math.hypot(L.x - g.p.x, L.y - g.p.y) < 60) { L.lit = true; g.score += 10; g.got++; Sfx.play('ding'); FX.burst(L.x, L.y, 10, ['#ffd23f', '#ff9a2e'], 0.5); FX.text(L.x, L.y - 50, '+10', '#ffd23f', 26); }
    }
    if (Math.floor(g.t) !== Math.floor(g.t - dt)) g.score += g.lan.filter(L => L.lit).length;
  },
  bg(c, g) {
    c.fillStyle = '#1d2342'; c.fillRect(-20, -20, V.W + 40, V.H + 40); c.fillStyle = 'rgba(255,255,255,0.5)'; for (let i = 0; i < 30; i++) { c.beginPath(); c.arc((i * 173) % V.W, (i * 97) % V.H, 1.5, 0, Math.PI * 2); c.fill(); }
    for (const L of g.lan) {
      if (L.lit) { const gr = c.createRadialGradient(L.x, L.y, 4, L.x, L.y, 90); gr.addColorStop(0, 'rgba(255,200,80,0.5)'); gr.addColorStop(1, 'rgba(255,200,80,0)'); c.fillStyle = gr; c.fillRect(L.x - 90, L.y - 90, 180, 180); }
      c.strokeStyle = '#8a5a34'; c.lineWidth = 3; c.beginPath(); c.moveTo(L.x, L.y - 30); c.lineTo(L.x, L.y - 60); c.stroke();
      c.globalAlpha = L.lit ? 1 : 0.35; Kid.emoji(c, '🏮', L.x, L.y + Math.sin(g.t * 2 + L.ph) * 3, 52); c.globalAlpha = 1;
    }
  },
  player(c, p, g) { RoamMe(c, p, '#ffe680'); },
  thing: () => ({}), touch() { },
  hudL: g => `　🏮 ${g.lan.filter(L => L.lit).length}/${g.lan.length}`,
});

// ---- 搖籤筒 ----
const FORTUNES = [['大吉', 30, '今天會吃到好吃的東西！'], ['大吉', 30, '今天會交到新朋友！'], ['中吉', 20, '今天玩遊戲會贏！'], ['中吉', 20, '今天會被誇獎喔！'], ['小吉', 10, '今天會看到彩虹！'], ['小吉', 10, '記得多喝水喔！'], ['吉', 5, '今天早點睡覺吧！'], ['大吉', 30, '今天會有好事發生！']];
ShakeGame({
  id: 'fortune', name: '搖籤筒', icon: '🎋', color: '#c9472f', kid: true,
  desc: '搖一搖籤筒，看看今天的運氣！（手機限定）',
  howto: '📱 手機限定：用力搖手機，籤筒裡會跳出一支籤，告訴你今天的好運！大吉分數最多，一共抽 5 支籤。（電腦：狂點畫面或按空白鍵）',
  start() { this.t = 0; this.score = 0; this.over = false; this.overText = '好運連連！'; this.ls = null; this.k = 0; this.p = 0; this.st = 'shake'; this.res = null; this.rt = 0; },
  update(dt) {
    this.t += dt; const d = Shk.d(this);
    if (this.st === 'shake') { this.p += d * 0.12; if (d) Sfx.play('rustle'); if (this.p >= 1) { this.st = 'show'; this.rt = 2.6; this.res = pick(FORTUNES); this.score += this.res[1]; this.k++; Sfx.play(this.res[1] >= 30 ? 'win' : 'ding'); Kid.say(this.res[0] + '，' + this.res[2]); FX.burst(V.W / 2, V.H * 0.4, 24, undefined, 0.8); } }
    else { this.rt -= dt; if (this.rt <= 0) { if (this.k >= 5) { this.over = true; return; } this.st = 'shake'; this.p = 0; } }
  },
  draw(c) {
    c.fillStyle = '#f6e3c4'; c.fillRect(-20, -20, V.W + 40, V.H + 40); for (let i = 0; i < 8; i++) Kid.emoji(c, '🏮', (i + 0.5) * V.W / 8, 60, 34);
    const x = V.W / 2, y = V.H * 0.62, sh = Math.sin(this.t * 40) * Tilt.shake * 0.25;
    c.save(); c.translate(x, y); c.rotate(sh);
    for (let i = 0; i < 7; i++) Paper.rect(c, -40 + i * 12, -150 + (i % 3) * 8 - (this.st === 'shake' ? this.p * 20 : 0), 8, 110, '#e9c27a', 3, { border: 1 });
    Paper.rect(c, -60, -70, 120, 170, '#c9472f', 16, { border: 5 }); Kid.text(c, '籤', 0, 10, 50, '#ffd23f', 0);
    c.restore();
    if (this.st === 'show') { const R = this.res, k = Math.min(1, (2.6 - this.rt) * 3); c.save(); c.translate(x, V.H * 0.3); c.scale(k, k); Paper.rect(c, -150, -70, 300, 140, '#fffdf5', 16, { border: 5 }); Kid.text(c, R[0], 0, -28, 48, '#c9472f', 0); Kid.text(c, R[2], 0, 34, 22, '#4a3520', 0); c.restore(); }
    else { c.fillStyle = '#ffffff'; c.fillRect(V.W / 2 - 100, V.H * 0.9, 200, 14); c.fillStyle = '#c9472f'; c.fillRect(V.W / 2 - 100, V.H * 0.9, 200 * this.p, 14); }
    TiltUI.hint(c, this, Kid.portrait() ? 140 : 96, undefined, true);
  },
  hud() { return { L: `<b>${this.score}</b> 分`, R: `🎋 ${this.k} / 5` }; },
});

// ---- 釘釘子 ----
ShakeGame({
  id: 'hammer', name: '釘釘子', icon: '🔨', color: '#8a5a34',
  desc: '每搖一下就敲一下槌子，把釘子都釘進木板！（手機限定）',
  howto: '📱 手機限定：手機就是槌子！每搖一下就敲一下，把釘子敲進木板裡。釘完一根換下一根，越後面越硬。限時 30 秒，看你能釘幾根！（電腦：狂點畫面或按空白鍵）',
  TIME: 30,
  start() { this.t = 0; this.left = this.TIME; this.score = 0; this.over = false; this.overText = ''; this.ls = null; this.n = 0; this.newNail(); this.swing = 0; },
  newNail() { this.need = 4 + Math.floor(this.n / 2); this.hit = 0; },
  update(dt) {
    this.t += dt; this.left -= dt; this.swing = Math.max(0, this.swing - dt * 5); if (this.left <= 0) { this.left = 0; this.over = true; this.overText = `釘了 ${this.n} 根釘子！`; return; }
    const d = Shk.d(this);
    for (let k = 0; k < d; k++) { this.hit++; this.swing = 1; Sfx.play('thud'); V.shake = 3; if (this.hit >= this.need) { this.n++; this.score += 10 + this.n; Sfx.play('ding'); FX.text(V.W / 2, V.H * 0.4, '+' + (10 + this.n), '#ff7a00', 34); this.newNail(); break; } }
  },
  draw(c) {
    c.fillStyle = '#e8dcc6'; c.fillRect(-20, -20, V.W + 40, V.H + 40);
    const bx = V.W / 2, by = V.H * 0.68; Paper.rect(c, bx - 200, by, 400, 90, '#c98a4b', 10, { border: 4 });
    for (let i = 0; i < Math.min(this.n, 12); i++) Paper.circle(c, bx - 170 + (i % 6) * 68, by + 25 + Math.floor(i / 6) * 40, 7, '#8a8f99', { border: 2 });
    const k = this.hit / this.need, nh = 120 * (1 - k);
    Paper.rect(c, bx - 5, by - nh, 10, nh + 6, '#9aa3b0', 3, { border: 2 }); Paper.rect(c, bx - 18, by - nh - 8, 36, 10, '#7a7f8a', 4, { border: 2 });
    c.save(); c.translate(bx + 90, by - nh - 40); c.rotate(-0.9 + this.swing * 0.9); Paper.rect(c, -8, -10, 16, 130, '#a0683c', 6, { border: 3 }); Paper.rect(c, -50, -36, 70, 34, '#5a5f6a', 8, { border: 3 }); c.restore();
    Puppet.draw(c, App.pup, Kid.portrait() ? V.W * 0.15 : V.W * 0.2, V.H - 6, Kid.portrait() ? 140 : 190, this.swing ? Puppet.Poses.cheer(this.t) : Puppet.Poses.idle(this.t));
    TiltUI.hint(c, this, Kid.portrait() ? 140 : 96, undefined, true);
  },
  hud() { return { L: `<b>${this.score}</b> 分　🔨 ${this.n}`, R: `⏱ ${Math.ceil(this.left)}` }; },
});

// ---- 搖鮮奶油 ----
ShakeGame({
  id: 'cream', name: '搖鮮奶油', icon: '🍰', color: '#f2a6c2',
  desc: '搖瓶子打發鮮奶油，剛好的時候按完成，搖太久會變奶油！（手機限定）',
  howto: '📱 手機限定：用力搖手機打發鮮奶油。指針到「綠色」時按「完成」，鮮奶油就會擠在蛋糕上！搖太久會變成一塊奶油喔。一共 5 瓶。（電腦：狂點畫面搖、按 Enter 或點按鈕完成）',
  start() { this.t = 0; this.score = 0; this.over = false; this.overText = '蛋糕店大師！'; this.ls = null; this.k = 0; this.p = 0; this.st = 'shake'; this.rt = 0; this.res = 0; },
  get btn() { return { x: V.W / 2, y: V.H - 80, w: 200, h: 74 }; },
  tap(x, y) { if (this.st === 'shake' && Kid.hit(this.btn, x, y)) return this.done(); Tilt.pulse(); },
  key(k) { if (k === 'enter') this.done(); else if (k === 'space') Tilt.pulse(); },
  done() { if (this.st !== 'shake' || this.p < 0.1) return; const p = this.p, pts = p >= 0.55 && p <= 0.75 ? 30 : p < 0.55 ? Math.round(p * 30) : 5; this.res = pts; this.score += pts; this.st = 'show'; this.rt = 1.8; this.k++; Sfx.play(pts >= 30 ? 'win' : 'coin'); FX.text(V.W / 2, V.H * 0.3, pts >= 30 ? '完美！+30' : p > 0.75 ? '變成奶油了…' : '太稀了 +' + pts, pts >= 30 ? '#45ad4a' : '#c9772f', 34); },
  update(dt) {
    this.t += dt; const d = Shk.d(this);
    if (this.st === 'shake') { this.p = Math.min(1, this.p + d * 0.035); if (d) Sfx.play('splash'); if (this.p >= 1) this.done(); }
    else { this.rt -= dt; if (this.rt <= 0) { if (this.k >= 5) { this.over = true; return; } this.st = 'shake'; this.p = 0; } }
  },
  draw(c) {
    c.fillStyle = '#fff0f5'; c.fillRect(-20, -20, V.W + 40, V.H + 40);
    const x = V.W / 2, y = V.H * 0.45, sh = Math.sin(this.t * 40) * Tilt.shake * 8, p = this.p;
    Paper.rect(c, x - 70 + sh, y - 120, 140, 220, 'rgba(255,255,255,0.7)', 30, { border: 5 });
    const col = p > 0.75 ? '#ffe680' : p > 0.55 ? '#fffdf5' : '#f4f8ff', lvl = 160 + p * 30;
    c.fillStyle = col; c.fillRect(x - 60 + sh, y + 90 - lvl, 120, lvl);
    if (this.st === 'show') { Paper.rect(c, x - 110, y + 150, 220, 70, '#e9a54b', 14, { border: 4 }); Kid.emoji(c, this.res >= 30 ? '🍰' : '🧈', x, y + 120, 80); }
    const tx = V.W / 2 - 140, ty = Kid.portrait() ? 150 : 100; Paper.rect(c, tx, ty, 280, 24, '#ffffff', 12, { border: 3 });
    c.fillStyle = 'rgba(69,173,74,0.5)'; c.fillRect(tx + 280 * 0.55, ty + 3, 280 * 0.2, 18); c.fillStyle = 'rgba(255,210,63,0.6)'; c.fillRect(tx + 280 * 0.75, ty + 3, 280 * 0.25 - 3, 18);
    c.fillStyle = '#2a2a33'; c.fillRect(tx + 280 * p - 3, ty - 6, 6, 36);
    if (this.st === 'shake') Kid.button(c, this.btn, '完成', '#45ad4a', { size: 30 });
    TiltUI.hint(c, this, V.H * 0.82, undefined, true);
  },
  hud() { return { L: `<b>${this.score}</b> 分`, R: `🍰 ${Math.min(this.k + 1, 5)} / 5` }; },
});

// ---- 釣大魚 ----
registerGame({
  id: 'reel', name: '釣大魚', icon: '🎣', color: '#2f7fc1', tilt: true,
  desc: '大魚上鉤了！拿手機畫圓圈捲線，小心線會斷！（手機限定）',
  howto: '📱 手機限定：拿著手機一直「畫圓圈」就能捲線，把魚拉上來！捲太快線會太緊（紅色）就斷掉了，要快慢剛好。一共 3 條魚，越快釣上來分數越高。（電腦：滑鼠按住繞著中間畫圈）',
  FISH: [['🐟', 60, 3], ['🐠', 80, 4], ['🦈', 110, 6]],
  start() { this.t = 0; this.score = 0; this.over = false; this.overText = '釣魚高手！'; this.k = 0; this.ca = null; this.newFish(); },
  newFish() { const F = this.FISH[this.k]; this.F = F; this.dist = F[1]; this.ten = 0; this.ft = 0; this.doneT = 0; this.snap = 0; },
  tap() { Tilt.calibrate(); },
  update(dt) {
    this.t += dt; const d = Circ(this);
    if (this.doneT) { this.doneT -= dt; if (this.doneT <= 0) { this.k++; if (this.k >= this.FISH.length) { this.over = true; return; } this.newFish(); } return; }
    if (this.snap) { this.snap -= dt; if (this.snap <= 0) { this.snap = 0; this.dist = this.F[1]; this.ten = 0; } return; }
    this.ft += dt; const pull = this.F[2] * (0.6 + 0.4 * Math.sin(this.t * 1.3));
    const reel = Math.abs(d) / (Math.PI * 2) * 7; this.dist = Math.max(0, this.dist - reel + pull * dt);
    this.ten = clamp(this.ten + reel * 0.09 - dt * 0.35 + (Math.sin(this.t * 2.1) > 0.8 ? dt * 0.2 : 0), 0, 1.2);
    if (reel && Math.random() < 0.3) Sfx.play('tick');
    if (this.ten > 1) { this.snap = 1.2; Sfx.play('boing'); V.shake = 6; FX.text(V.W / 2, V.H * 0.4, '線斷了！', '#e8453c', 36); return; }
    if (this.dist <= 0) { const pts = Math.max(20, Math.round(80 - this.ft * 2)); this.score += pts; this.doneT = 2; Sfx.play('win'); FX.burst(V.W / 2, V.H * 0.4, 30, undefined, 1); FX.text(V.W / 2, V.H * 0.3, `釣到了！+${pts}`, '#2f7fc1', 38); }
  },
  draw(c) {
    const P = Kid.portrait(), sea = V.H * 0.45;
    c.fillStyle = '#bfe8ff'; c.fillRect(-20, -20, V.W + 40, sea + 20);
    const gr = c.createLinearGradient(0, sea, 0, V.H); gr.addColorStop(0, '#3fa4ea'); gr.addColorStop(1, '#123f7a'); c.fillStyle = gr; c.fillRect(-20, sea, V.W + 40, V.H);
    Paper.rect(c, -20, sea - 30, V.W * 0.35, 40, '#a0683c', 6, { border: 4 });
    Puppet.draw(c, App.pup, V.W * 0.12, sea - 30, P ? 120 : 160, { aL: 1.6, aR: 1.8, aLf: -0.4, aRf: 0.4 });
    const fx = V.W * 0.3 + (1 - this.dist / this.F[1]) * 0 + (this.dist / this.F[1]) * V.W * 0.5, fy = sea + 40 + (this.dist / this.F[1]) * (V.H - sea - 120);
    const rx = V.W * 0.22, ry = sea - 160;
    c.strokeStyle = '#8a5a34'; c.lineWidth = 5; c.beginPath(); c.moveTo(V.W * 0.14, sea - 90); c.lineTo(rx, ry); c.stroke();
    c.strokeStyle = this.snap ? 'rgba(255,255,255,0.3)' : this.ten > 0.8 ? '#e8453c' : '#ffffff'; c.lineWidth = 2; c.beginPath(); c.moveTo(rx, ry); c.lineTo(this.snap ? rx + 40 : fx, this.snap ? sea : fy); c.stroke();
    if (!this.snap || this.doneT) Kid.emoji(c, this.F[0], fx, fy + Math.sin(this.t * 8) * 6, 40 + this.F[1] * 0.4, Math.sin(this.t * 6) * 0.3);
    const bx = V.W / 2 - 120, by = P ? 150 : 100; Paper.rect(c, bx, by, 240, 22, '#ffffff', 11, { border: 3 }); c.fillStyle = this.ten > 0.8 ? '#e8453c' : this.ten > 0.5 ? '#ffb31f' : '#45ad4a'; c.fillRect(bx + 3, by + 3, 234 * Math.min(1, this.ten), 16);
    Kid.text(c, `${Math.ceil(this.dist)} m`, V.W / 2, by + 48, 26, '#2f7fc1', 6);
    if (this.t < 6) Kid.text(c, circHint(), V.W / 2, V.H - 24, 17, '#ffffff', 0);
  },
  hud() { return { L: `<b>${this.score}</b> 分`, R: `🎣 ${Math.min(this.k + 1, 3)} / 3` }; },
});

// ---- 棉花糖 ----
registerGame({
  id: 'cottoncandy', name: '棉花糖', icon: '🍭', color: '#ff9ec2', tilt: true, kid: true,
  desc: '拿著手機畫圓圈，捲出好大好大的棉花糖！（手機限定）',
  howto: '📱 手機限定：拿著手機一直「畫圓圈」，棉花糖就會越捲越大！捲到夠大就完成一支，換下一個顏色。不會輸，限時 45 秒。（電腦：滑鼠按住繞著中間畫圈）',
  TIME: 45, COLS: ['#ffb3d9', '#b3e0ff', '#fff0a8', '#c8f0c0', '#e0c8ff'],
  start() { this.t = 0; this.left = this.TIME; this.score = 0; this.over = false; this.overText = ''; this.ca = null; this.sz = 0; this.n = 0; this.ci = 0; this.spin = 0; this.done = []; },
  tap() { Tilt.calibrate(); },
  update(dt) {
    this.t += dt; this.left -= dt; if (this.left <= 0) { this.left = 0; this.over = true; this.overText = `做了 ${this.n} 支棉花糖！`; return; }
    const d = Circ(this); this.spin += d; this.sz = Math.min(1, this.sz + Math.abs(d) * 0.02);
    if (d && Math.random() < 0.2) Sfx.play('swish');
    if (this.sz >= 1) { this.n++; this.score += 20; this.done.push(this.COLS[this.ci]); this.ci = (this.ci + 1) % this.COLS.length; this.sz = 0; Sfx.play('star'); FX.burst(V.W / 2, V.H * 0.4, 20, undefined, 0.8); FX.text(V.W / 2, V.H * 0.25, '好大一支！+20', '#e86fae', 34); if (this.n % 3 === 0) Kid.say('好好吃！'); }
  },
  draw(c) {
    c.fillStyle = '#fff5fa'; c.fillRect(-20, -20, V.W + 40, V.H + 40);
    const x = V.W / 2, y = V.H * 0.45, R = 30 + this.sz * Math.min(V.W * 0.32, 150);
    Paper.rect(c, x - 4, y, 8, V.H * 0.38, '#f6e3c4', 4, { border: 3 });
    for (let i = 0; i < 14; i++) { const a = this.spin + i * 0.9, r = R * (0.5 + 0.5 * ((i * 37) % 10) / 10); Paper.circle(c, x + Math.cos(a) * r * 0.5, y - R * 0.3 + Math.sin(a) * r * 0.4, R * 0.45, this.COLS[this.ci], { border: 0, blur: 2 }); }
    this.done.slice(-6).forEach((col, i) => { const bx = 40 + i * 50, by = V.H - 60; Paper.circle(c, bx, by - 20, 22, col, { border: 2 }); c.fillStyle = '#f6e3c4'; c.fillRect(bx - 2, by, 4, 40); });
    if (this.t < 6) Kid.text(c, circHint(), V.W / 2, V.H * 0.88, 17, '#2a2a33', 6);
  },
  hud() { return { L: `<b>${this.score}</b> 分　🍭 ${this.n}`, R: `⏱ ${Math.ceil(this.left)}` }; },
});

// ---- 傾斜保齡球 ----
registerGame({
  id: 'tiltbowl', name: '傾斜保齡球', icon: '🎳', color: '#5b6fd6', tilt: true,
  desc: '傾斜手機讓球往前滾，撞倒所有球瓶！（手機限定）',
  howto: '📱 手機限定：手機往前歪，球就會往前滾；左右歪可以調方向。撞倒越多球瓶分數越高，全倒 +20！一共 5 球。（電腦用方向鍵）',
  N: 5,
  start() { this.t = 0; this.score = 0; this.over = false; this.overText = ''; this.k = 0; this.newRoll(); },
  lane() { const A = BallPhys.arena(), w = Math.min(A.w, 360); return { x: V.W / 2 - w / 2, y: A.y, w, h: A.h }; },
  newRoll() { const L = this.lane(); this.ball = { x: L.x + L.w / 2, y: L.y + L.h - 40, vx: 0, vy: 0, r: 22, m: 3 }; this.pins = []; const cx = L.x + L.w / 2, cy = L.y + 90; let k = 0; for (let r = 0; r < 4; r++) for (let i = 0; i <= r; i++) { this.pins.push({ x: cx + (i - r / 2) * 38, y: cy + (3 - r) * 34, x0: 0, y0: 0, vx: 0, vy: 0, r: 12, m: 0.5, down: 0 }); k++; } this.pins.forEach(p => { p.x0 = p.x; p.y0 = p.y; }); this.rt = 0; this.endT = 0; },
  tap() { Tilt.calibrate(); },
  update(dt) {
    this.t += dt; const L = this.lane(), b = this.ball;
    if (this.endT) { this.endT -= dt; if (this.endT <= 0) { this.k++; if (this.k >= this.N) { this.over = true; this.overText = `${this.N} 球共 ${this.score} 分！`; return; } this.newRoll(); } return; }
    this.rt += dt; BallPhys.move(b, dt, 900, 0.4, 520);
    for (const p of this.pins) { p.x += p.vx * dt; p.y += p.vy * dt; p.vx *= 1 - dt * 1.5; p.vy *= 1 - dt * 1.5; const v = BallPhys.hit(b, p, 0.6); if (v > 60) Sfx.play('pins'); }
    for (let i = 0; i < this.pins.length; i++) for (let j = i + 1; j < this.pins.length; j++) BallPhys.hit(this.pins[i], this.pins[j], 0.6);
    for (const p of this.pins) if (!p.down && Math.hypot(p.x - p.x0, p.y - p.y0) > 14) p.down = 1;
    BallPhys.bounds(b, L, 0.3);
    if (b.y < L.y + b.r + 4 || this.rt > 8) {
      const n = this.pins.filter(p => p.down).length, pts = n * 2 + (n === 10 ? 20 : 0); this.score += pts; this.endT = 1.8;
      Sfx.play(n === 10 ? 'win' : 'thud'); FX.text(V.W / 2, V.H * 0.4, n === 10 ? '全倒！STRIKE！' : `倒了 ${n} 支`, n === 10 ? '#e0573c' : '#5b6fd6', 38);
    }
  },
  draw(c) {
    c.fillStyle = '#3a2a4a'; c.fillRect(-20, -20, V.W + 40, V.H + 40); const L = this.lane();
    Paper.rect(c, L.x, L.y, L.w, L.h, '#e9c27a', 8, { border: 4 }); c.fillStyle = 'rgba(120,80,40,0.15)'; for (let i = 1; i < 8; i++) c.fillRect(L.x + i * L.w / 8, L.y, 2, L.h);
    for (const p of this.pins) { c.save(); c.translate(p.x, p.y); if (p.down) c.rotate(0.9); Paper.circle(c, 0, 0, p.r, '#ffffff', { border: 2, blur: 3 }); c.fillStyle = '#e8453c'; c.fillRect(-p.r, -2, p.r * 2, 4); c.restore(); }
    BallPhys.draw(c, this.ball);
    TiltUI.hint(c, this, V.H - 22, '#ffffff');
  },
  hud() { return { L: `<b>${this.score}</b> 分`, R: `🎳 ${Math.min(this.k + 1, this.N)} / ${this.N}` }; },
});

// ---- 彈珠賽跑 ----
registerGame({
  id: 'marblerace', name: '彈珠賽跑', icon: '🔮', color: '#3c9a8a', tilt: true,
  desc: '跟三顆彈珠比賽，傾斜手機踩加速板、閃開石頭！（手機限定）',
  howto: '📱 手機限定：左右傾斜手機控制彈珠，踩到 ⚡ 加速板會變快，撞到石頭會變慢。跟另外 3 顆彈珠比賽，最先滾到 500 公尺終點的贏！（電腦用 ← → 鍵）',
  LEN: 500,
  start() { this.t = 0; this.score = 0; this.over = false; this.overText = ''; this.d = 0; this.v = 0; this.x = 0.5; this.boost = 0; this.slow = 0; this.ai = [0, 1, 2].map(i => ({ d: 0, v: rand(15.5, 17.5), ph: rand(0, 6), fin: 0 })); this.items = []; for (let y = 30; y < this.LEN; y += rand(10, 18)) this.items.push({ d: y, x: rand(0.1, 0.9), k: Math.random() < 0.45 ? 'boost' : 'rock' }); this.place = 0; this.fin = 0; this.endT = 0; },
  tap() { Tilt.calibrate(); },
  update(dt) {
    this.t += dt; this.boost = Math.max(0, this.boost - dt); this.slow = Math.max(0, this.slow - dt);
    if (!this.fin) {
      this.x = clamp(this.x + Tilt.x * 0.9 * dt, 0.05, 0.95);
      const target = 17 * (this.boost ? 1.6 : 1) * (this.slow ? 0.5 : 1); this.v += (target - this.v) * Math.min(1, dt * 2); this.d += this.v * dt;
      for (const it of this.items) { if (it.used || Math.abs(it.d - this.d) > 1.2 || Math.abs(it.x - this.x) > 0.08) continue; it.used = 1; if (it.k === 'boost') { this.boost = 1.5; Sfx.play('swish'); } else { this.slow = 1; Sfx.play('thud'); V.shake = 4; } }
    }
    for (const a of this.ai) if (!a.fin) { a.d += (a.v + Math.sin(this.t + a.ph) * 2) * dt; }
    for (const b of [this, ...this.ai]) if (!b.fin && b.d >= this.LEN) { b.fin = ++this.place; if (b === this) { const pts = [0, 100, 60, 40, 20][b.fin]; this.score = pts; Sfx.play(b.fin === 1 ? 'win' : 'over'); FX.text(V.W / 2, V.H * 0.35, b.fin === 1 ? '第一名！' : `第 ${b.fin} 名`, '#e0573c', 46); this.endT = 2; } }
    if (this.fin) { this.endT -= dt; if (this.endT <= 0) { this.over = true; this.overText = this.fin === 1 ? '彈珠冠軍！' : `第 ${this.fin} 名，再加油！`; } }
  },
  draw(c) {
    c.fillStyle = '#7dbb5c'; c.fillRect(-20, -20, V.W + 40, V.H + 40); const m = V.W * 0.08, w = V.W - m * 2, sc = 22, py = V.H * 0.72, yOf = d => py - (d - this.d) * sc, xOf = u => m + u * w;
    Paper.rect(c, m, -20, w, V.H + 40, '#e6d3b0', 0, { border: 4 });
    for (const it of this.items) { const y = yOf(it.d); if (y < -40 || y > V.H + 40 || it.used) continue; if (it.k === 'boost') { Paper.rect(c, xOf(it.x) - 26, y - 14, 52, 28, '#ffd23f', 8, { border: 2 }); Kid.text(c, '⚡', xOf(it.x), y, 22, '#e0573c', 0); } else TiltUI.rock(c, xOf(it.x), y, 22); }
    const fy = yOf(this.LEN); if (fy > -30) { for (let i = 0; i < 12; i++) { c.fillStyle = i % 2 ? '#fff' : '#2a2a33'; c.fillRect(m + i * w / 12, fy - 8, w / 12 + 1, 16); } }
    this.ai.forEach((a, i) => { const y = yOf(a.d); if (y > -30 && y < V.H + 30) BallPhys.draw(c, { x: xOf(0.2 + i * 0.3), y, r: 18, col: ['#ffb3b3', '#b3d9ff', '#c8f0c0'][i], noHead: true }); });
    BallPhys.draw(c, { x: xOf(this.x), y: py, r: 22 });
    if (this.boost) Kid.emoji(c, '💨', xOf(this.x), py + 40, 30);
    const all = [this.d, ...this.ai.map(a => a.d)].sort((a, b) => b - a), pos = all.indexOf(this.d) + 1;
    Kid.text(c, `${Math.floor(Math.min(this.d, this.LEN))} m　第 ${this.fin || pos} 名`, V.W / 2, Kid.portrait() ? 140 : 96, 26, '#4a3520', 6);
    TiltUI.hint(c, this, V.H - 22);
  },
  hud() { return { L: `<b>${Math.floor(Math.min(this.d, this.LEN))}</b> / ${this.LEN} m`, R: `⏱ ${Math.floor(this.t)}` }; },
});
