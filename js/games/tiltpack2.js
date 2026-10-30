'use strict';
// =====================================================
//  體感第二彈：衝浪、彩虹獨角獸（閃避收集）、掃地機器人、母雞帶小雞、幽浮抓乳牛（到處跑）
// =====================================================

// ---- 衝浪高手 ----
TiltRun({
  id: 'surf', name: '衝浪高手', icon: '🏄', color: '#1f9bd1', dir: 'left', lives: 3, speed: 250, gap: 0.65,
  desc: '站在衝浪板上前後傾斜，閃開鯊魚撿貝殼！（手機限定）',
  howto: '📱 手機限定：紙片人在海上衝浪！把手機往前、往後傾斜讓衝浪板上下移動，收集 🐚 貝殼、⭐ 星星和 🐬 海豚，閃開 🦈 鯊魚和礁石。撞到 3 次就結束，限時 45 秒。（電腦用 ↑ ↓ 鍵）',
  end: '衝浪大成功！', lose: '跌進海裡了！', ouch: '噗通！',
  items: [{ e: '🦈', bad: 1, r: 34, w: 3, wave: 1, sp: 1.25 }, { draw: 'rock', bad: 1, r: 32, w: 2 }, { e: '🐚', pts: 10, r: 24, w: 4 }, { e: '⭐', pts: 15, r: 24, w: 2 }, { e: '🐬', pts: 25, r: 30, w: 1, wave: 1 }],
  bg(c, g) {
    const gr = c.createLinearGradient(0, 0, 0, V.H); gr.addColorStop(0, '#7fd3f7'); gr.addColorStop(0.12, '#bdeaff'); gr.addColorStop(0.13, '#2fa5d9'); gr.addColorStop(1, '#13679e');
    c.fillStyle = gr; c.fillRect(-20, -20, V.W + 40, V.H + 40);
    c.strokeStyle = 'rgba(255,255,255,0.45)'; c.lineWidth = 4;
    for (let i = 0; i < 16; i++) { const y = V.H * 0.16 + (i * 61) % (V.H * 0.84), x = (((i * 211 - g.scroll * (0.8 + (i % 3) * 0.2)) % (V.W + 80)) + V.W + 80) % (V.W + 80) - 40; c.beginPath(); c.moveTo(x - 30, y); c.quadraticCurveTo(x - 10, y - 12, x + 10, y - 2); c.quadraticCurveTo(x + 20, y + 4, x + 30, y); c.stroke(); }
  },
  player(c, x, y, g) {
    c.save(); c.translate(x, y); c.rotate(g.vel * 0.35);
    c.fillStyle = 'rgba(255,255,255,0.7)'; for (let i = 0; i < 4; i++) { c.beginPath(); c.arc(-70 - i * 18, 26 + Math.sin(g.t * 10 + i) * 3, 9 - i * 1.5, 0, Math.PI * 2); c.fill(); }
    Paper.shape(c, cc => cc.ellipse(0, 26, 66, 12, 0, 0, Math.PI * 2), '#ff7a3d', { border: 3 });
    c.fillStyle = '#ffffff'; c.fillRect(-50, 24, 100, 4);
    Puppet.draw(c, App.pup, 0, 20, 110, g.cheer ? Puppet.Poses.cheer(g.t) : { aL: 1.4, aR: 1.3, aLf: 0.2, aRf: -0.2, lL: 0.35, lR: 0.35, lLf: -0.3, lRf: -0.3, rot: -0.1 });
    c.restore();
  },
});

// ---- 彩虹獨角獸 ----
TiltRun({
  id: 'unicorn', name: '彩虹獨角獸', icon: '🦄', color: '#c77dff', dir: 'down', kid: true, speed: 190, gap: 0.6, pr: 44,
  desc: '騎獨角獸在天空飛，接住彩虹和糖果！（手機限定）',
  howto: '📱 手機限定：紙片人騎著獨角獸！左右傾斜手機移動，接住 🌈 彩虹、🍭 棒棒糖和 ⭐ 星星。碰到 ⚡ 雷雨雲會暈一下下，不會輸，限時 45 秒。（電腦用 ← → 鍵）',
  end: '收集好多彩虹！', ouch: '暈暈～',
  items: [{ e: '🌈', pts: 25, r: 30, w: 2 }, { e: '🍭', pts: 10, r: 24, w: 3, wobble: 1 }, { e: '⭐', pts: 10, r: 22, w: 3 }, { e: '🧁', pts: 15, r: 24, w: 2 }, { draw: 'storm', bad: 1, r: 40, w: 2 }],
  bg(c, g) {
    const gr = c.createLinearGradient(0, 0, 0, V.H); gr.addColorStop(0, '#ffc6e8'); gr.addColorStop(1, '#d8ecff'); c.fillStyle = gr; c.fillRect(-20, -20, V.W + 40, V.H + 40);
    for (let i = 0; i < 6; i++) { const y = ((i * 173 + g.scroll * (0.3 + (i % 3) * 0.15)) % (V.H + 160)) - 80, x = (i * 241) % V.W; c.globalAlpha = 0.8; Paper.circle(c, x, y, 34, '#ffffff', { border: 0, blur: 6 }); Paper.circle(c, x + 34, y + 6, 26, '#ffffff', { border: 0, blur: 6 }); c.globalAlpha = 1; }
    c.fillStyle = 'rgba(255,255,255,0.8)'; for (let i = 0; i < 20; i++) { const y = ((i * 97 + g.scroll * 0.9) % V.H), x = (i * 137) % V.W; c.beginPath(); c.arc(x, y, 2 + (i % 3), 0, Math.PI * 2); c.fill(); }
  },
  player(c, x, y, g) {
    const bob = Math.sin(g.t * 5) * 5;
    for (let i = 0; i < 6; i++) { c.fillStyle = ['#ff6b6b', '#ff9f43', '#ffd93d', '#6bcb77', '#4d96ff', '#c77dff'][i]; c.fillRect(x - 30 + i * 10, y + 40, 10, 50); }
    c.save(); c.translate(x, y + bob); c.rotate(g.vel * 0.15);
    Kid.emoji(c, '🦄', 0, 10, 92);
    Kid.head(c, 6, -46, 22, {}, 24);
    c.restore();
  },
});

// ---- 掃地機器人 ----
TiltRoam({
  id: 'vacuum', name: '掃地機器人', icon: '🧹', color: '#6b8fb3', kid: true, n: 7, r: 32, foes: () => 1,
  desc: '當一台掃地機器人，把地上的灰塵吸乾淨！（手機限定）',
  howto: '📱 手機限定：歪歪手機開著掃地機器人到處跑，把灰塵、餅乾屑和襪子吸起來！小貓咪在旁邊玩，撞到它會被彈開（不會輸）。限時 45 秒。（電腦用方向鍵）',
  end: '家裡亮晶晶！',
  thing() { const k = pick(['dust', 'dust', 'dust', 'crumb', 'crumb', 'sock', 'lego']); return { k, r: k === 'dust' ? 22 : 18, e: { crumb: '🍪', sock: '🧦', lego: '🧸' }[k] }; },
  touch(g, o) { g.collect(o, o.k === 'dust' ? 10 : o.k === 'crumb' ? 15 : 20, 'pop'); if (g.got % 12 === 0) Kid.say('好乾淨！'); },
  drawThing(c, o, g) { if (o.k === 'dust') { c.fillStyle = 'rgba(120,96,70,0.6)'; for (let i = 0; i < 6; i++) { c.beginPath(); c.arc(Math.cos(i * 2.1 + o.ph) * 12, Math.sin(i * 1.7 + o.ph) * 10, 7 + (i % 3) * 3, 0, Math.PI * 2); c.fill(); } } else Kid.emoji(c, o.e, 0, 0, 34, Math.sin(o.ph) * 0.4); },
  foe: () => ({ e: '🐈', r: 28, speed: 80, flip: 1 }),
  hit(g, f) { g.ouch(f, '喵～'); },
  bg(c, g) {
    c.fillStyle = '#e7c48f'; c.fillRect(-20, -20, V.W + 40, V.H + 40);
    c.strokeStyle = 'rgba(140,96,50,0.35)'; c.lineWidth = 2; for (let y = 0; y < V.H; y += 46) { c.beginPath(); c.moveTo(0, y); c.lineTo(V.W, y); c.stroke(); for (let x = (y / 46 % 2) * 90; x < V.W; x += 180) { c.beginPath(); c.moveTo(x, y); c.lineTo(x, y + 46); c.stroke(); } }
    Paper.rect(c, V.W * 0.08, V.H * 0.55, V.W * 0.3, V.H * 0.3, 'rgba(220,90,90,0.35)', 20, { border: 0, shadow: false });
  },
  player(c, p, g) {
    c.save(); c.translate(p.x, p.y);
    c.strokeStyle = '#8a8f99'; c.lineWidth = 2; for (const s of [-1, 1]) { c.save(); c.translate(s * p.r * 0.7, p.r * 0.6); c.rotate(g.t * 12 * s); for (let i = 0; i < 3; i++) { c.rotate(Math.PI * 2 / 3); c.beginPath(); c.moveTo(0, 0); c.lineTo(14, 0); c.stroke(); } c.restore(); }
    Paper.circle(c, 0, 0, p.r, '#d8dde6', { border: 3, blur: 6 }); Paper.circle(c, 0, 0, p.r * 0.72, '#ffffff', { border: 0, shadow: false });
    c.fillStyle = Math.sin(g.t * 6) > 0 ? '#45ad4a' : '#8fd18f'; c.beginPath(); c.arc(0, -p.r * 0.84, 4, 0, Math.PI * 2); c.fill();
    c.restore(); Kid.head(c, p.x, p.y + 2, p.r * 0.5, { sx: p.face }, p.r * 0.7);
  },
  hudL: g => `　🧹 ${g.got}`,
});

// ---- 母雞帶小雞 ----
TiltRoam({
  id: 'hen', name: '母雞帶小雞', icon: '🐔', color: '#e9a23b', kid: true, n: 4, r: 30, max: 380,
  desc: '找到走丟的小雞，帶牠們排隊回家！（手機限定）',
  howto: '📱 手機限定：歪歪手機當雞媽媽到處走，碰到 🐤 小雞，牠就會排隊跟在後面。把小雞帶回左上角的雞窩，一次帶越多隻分數越多！不會輸，限時 60 秒。（電腦用方向鍵）',
  TIME: 60, end: '小雞都回家了！',
  init(g) { g.train = []; g.trail = []; g.home = 0; g.p.x = V.W * 0.6; },
  nest(g) { return { x: 70, y: g.top + 70 }; },
  thing: () => ({ e: '🐤', r: 20, move: 'wander', speed: 45 }),
  touch(g, o) { o.dead = 1; g.train.push({ x: o.x, y: o.y }); Sfx.play('catch'); FX.text(o.x, o.y - 30, '嗶嗶！', '#e0a000', 24); },
  tick(g, dt) {
    const p = g.p; g.trail.unshift({ x: p.x, y: p.y }); if (g.trail.length > 400) g.trail.pop();
    g.train.forEach((ch, i) => { const q = g.trail[Math.min(g.trail.length - 1, (i + 1) * 9)]; ch.x += (q.x - ch.x) * Math.min(1, dt * 10); ch.y += (q.y - ch.y) * Math.min(1, dt * 10); });
    const N = this.nest(g);
    if (g.train.length && Math.hypot(p.x - N.x, p.y - N.y) < 80) {
      const n = g.train.length, pts = n * 10 + (n - 1) * 10; g.score += pts; g.home += n; g.cheer = 1; g.train = [];
      Sfx.play(n >= 3 ? 'win' : 'star'); FX.burst(N.x, N.y, 20, undefined, 0.8); FX.text(N.x + 60, N.y + 40, `${n} 隻回家 +${pts}`, '#ff7a00', 30); Kid.say(n >= 3 ? '好多小雞回家了！' : '回家囉！');
    }
  },
  bg(c, g) {
    RoamBG.grass(c, g, '#b5d98a'); const N = this.nest(g);
    Paper.shape(c, cc => cc.ellipse(N.x, N.y, 70, 44, 0, 0, Math.PI * 2), '#c99b62', { border: 4 });
    c.fillStyle = '#e8cf8f'; c.beginPath(); c.ellipse(N.x, N.y - 4, 52, 28, 0, 0, Math.PI * 2); c.fill();
    Kid.text(c, '雞窩', N.x, N.y + 62, 20, '#7a4a22', 5);
  },
  over(c, g) { },
  player(c, p, g) {
    g.train.forEach((ch, i) => Kid.emoji(c, '🐤', ch.x, ch.y + Math.abs(Math.sin(g.t * 9 + i)) * -5, 34));
    c.save(); c.translate(p.x, p.y); c.scale(-p.face, 1); Kid.emoji(c, '🐔', 0, 0, 66, Math.sin(g.t * 10) * Math.min(0.15, Math.hypot(p.vx, p.vy) / 2000)); c.restore();
  },
  hudL: g => `　🐤 跟著 ${g.train.length}　🏠 ${g.home}`,
});

// ---- 幽浮抓乳牛 ----
TiltRoam({
  id: 'ufo', name: '幽浮抓乳牛', icon: '🛸', color: '#5b6fd6', lives: 3, n: 5, r: 40, max: 420,
  desc: '開著幽浮飛到動物上面停一下，把牠吸上來！（手機限定）',
  howto: '📱 手機限定：傾斜手機開幽浮，飛到 🐄 乳牛、🐖 小豬、🐑 綿羊上面「停一下」，光束就會把牠吸上來（綠色圈圈滿了就成功）。小心 🚁 直升機在巡邏！撞到 3 次就結束，限時 60 秒。（電腦用方向鍵）',
  TIME: 60, end: '動物都去太空旅行了！', lose: '被直升機發現了！',
  init(g) { g.dtl = 1 / 60; },
  thing: () => { const k = pick([['🐄', 20], ['🐖', 15], ['🐑', 15], ['🐔', 10]]); return { e: k[0], pts: k[1], r: 26, move: 'wander', speed: 35, lift: 0 }; },
  foes: g => 1 + Math.floor(g.t / 20),
  foe: () => ({ e: '🚁', r: 30, speed: 110, flip: 1, chase: 40 }),
  hit(g, f) { g.ouch(f, '被發現了！'); },
  herd(g, o) {
    const inBeam = Math.hypot(o.x - g.p.x, o.y - g.p.y) < g.p.r * 0.9;
    o.lift = clamp(o.lift + (inBeam ? g.dtl * 1.1 : -g.dtl * 1.5), 0, 1);
    if (inBeam) o.vx = o.vy = 0;
    if (o.lift >= 1 && !o.dead) { g.collect(o, o.pts, 'star'); }
    return true;
  },
  tick(g, dt) { g.dtl = dt; },
  drawThing(c, o, g) {
    if (o.lift > 0) { c.strokeStyle = '#ffffff'; c.lineWidth = 5; c.beginPath(); c.arc(0, 0, 30, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * o.lift); c.stroke(); c.strokeStyle = '#45d16a'; c.lineWidth = 3; c.stroke(); }
    const s = 1 - o.lift * 0.4; c.translate(0, -o.lift * 18); c.scale(s, s); Kid.emoji(c, o.e, 0, 0, 44, o.lift ? Math.sin(g.t * 8) * 0.3 : 0);
  },
  bg(c, g) {
    c.fillStyle = '#2e5a3a'; c.fillRect(-20, -20, V.W + 40, V.H + 40);
    c.fillStyle = 'rgba(160,220,140,0.18)'; for (let i = 0; i < 30; i++) { c.beginPath(); c.arc((i * 173) % V.W, (i * 97) % V.H, 20 + (i % 4) * 8, 0, Math.PI * 2); c.fill(); }
    c.fillStyle = 'rgba(255,255,255,0.7)'; for (let i = 0; i < 24; i++) { c.beginPath(); c.arc((i * 211) % V.W, (i * 59) % (V.H * 0.9), 1.5 + (i % 2), 0, Math.PI * 2); c.fill(); }
  },
  player(c, p, g) {
    const grd = c.createRadialGradient(p.x, p.y, 4, p.x, p.y, p.r); grd.addColorStop(0, 'rgba(160,255,170,0.55)'); grd.addColorStop(1, 'rgba(160,255,170,0.08)');
    c.fillStyle = grd; c.beginPath(); c.arc(p.x, p.y, p.r, 0, Math.PI * 2); c.fill();
    c.save(); c.translate(p.x, p.y - 34 + Math.sin(g.t * 4) * 4); c.rotate(p.vx / 2500);
    Paper.circle(c, 0, -10, 24, '#bfe8ff', { border: 3 }); Kid.head(c, 0, -8, 16, {}, 22);
    Paper.shape(c, cc => cc.ellipse(0, 6, 54, 16, 0, 0, Math.PI * 2), '#9aa3b5', { border: 3, blur: 6 });
    for (let i = 0; i < 5; i++) { c.fillStyle = Math.sin(g.t * 8 + i) > 0 ? '#ffd23f' : '#ff7a3d'; c.beginPath(); c.arc(-36 + i * 18, 8, 4, 0, Math.PI * 2); c.fill(); }
    c.restore();
  },
  hudL: g => `　🐄 ${g.got}`,
});
