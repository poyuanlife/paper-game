'use strict';
// =====================================================
//  寶寶專區第四彈：數蘋果加法、找形狀、動物住哪裡、交通工具、東西的顏色、心情、健康食物、
//  泡泡紙、餵小魚、數字氣球、沙灘挖寶、擦玻璃猜猜看、夾豆豆
// =====================================================

// ---- 蘋果加法 ----
KidQuiz({
  id: 'addapples', name: '蘋果加法', icon: '➕', color: '#e8453c',
  desc: '這邊幾個、那邊幾個，合起來是幾個？',
  howto: '數一數兩邊的蘋果，合起來一共有幾個？點下面正確的數字！一共 10 題。',
  make(g, q) {
    const mx = q < 5 ? 3 : 5, a = 1 + Math.floor(Math.random() * mx), b = 1 + Math.floor(Math.random() * mx), s = a + b, set = new Set([s]); while (set.size < 3) { const v = s + Math.floor(Math.random() * 5) - 2; if (v > 0) set.add(v); }
    const opts = Kid.shuffle([...set]); return { a, b, opts, ans: opts.indexOf(s), text: `${a} 加 ${b} 是多少？`, say: `${a} 加 ${b} 是多少？`, right: `答對了！${a} 加 ${b} 等於 ${s}！`, wrong: () => '再數一次看看' };
  },
  drawQ(c, g, x, y) { const { a, b } = g.Q, s = 34; for (let i = 0; i < a; i++) Kid.emoji(c, '🍎', x - 70 - (i % 3) * s, y - 20 + Math.floor(i / 3) * s, s); Kid.text(c, '+', x, y, 50, '#e8453c', 0); for (let i = 0; i < b; i++) Kid.emoji(c, '🍎', x + 70 + (i % 3) * s, y - 20 + Math.floor(i / 3) * s, s); Kid.text(c, `${a} + ${b} = ?`, x, y + 80, 34, '#4a3520', 6); },
  drawOpt(c, g, o, x, y, w) { Kid.text(c, String(o), x, y, w * 0.5, '#e0573c', 0); },
});

// ---- 找形狀 ----
const SHAPES = [['圓形', ['⚽', '🍩', '🍪', '🌕', '🏀']], ['三角形', ['🍕', '⛺', '🔺', '📐']], ['正方形', ['🎁', '📦', '🟥', '🧇']], ['星形', ['⭐', '🌟']]];
KidQuiz({
  id: 'shapehunt', name: '找形狀', icon: '🔺', color: '#3f8fe0',
  desc: '哪一個是圓圓的？哪一個是三角形？',
  howto: '聽題目，例如「哪一個是圓形？」，從下面找出那個形狀的東西！一共 10 題。',
  make(g) { const S = pick(SHAPES), right = pick(S[1]), others = Kid.shuffle(SHAPES.filter(s => s !== S)).slice(0, 2).map(s => pick(s[1])), opts = Kid.shuffle([right, ...others]); return { S, opts, ans: opts.indexOf(right), text: `哪一個是${S[0]}？`, say: `哪一個是${S[0]}？`, right: '答對了！', wrong: () => '再想想看' }; },
  drawQ(c, g, x, y) { const n = g.Q.S[0], col = '#3f8fe0'; c.save(); c.translate(x, y - 10); if (n === '圓形') Paper.circle(c, 0, 0, 56, col, { border: 4 }); else if (n === '三角形') Paper.shape(c, cc => { cc.moveTo(0, -60); cc.lineTo(60, 48); cc.lineTo(-60, 48); cc.closePath(); }, col, { border: 4 }); else if (n === '正方形') Paper.rect(c, -52, -52, 104, 104, col, 6, { border: 4 }); else Paper.star(c, 0, 0, 60, col, 0, { border: 4 }); c.restore(); Kid.text(c, n, x, y + 82, 32, col, 6); },
  drawOpt(c, g, o, x, y, w) { Kid.emoji(c, o, x, y, w * 0.58); },
});

// ---- 動物住哪裡 ----
const HOMES = [['🐟', '魚', '🌊', '海裡'], ['🐦', '小鳥', '🌳', '樹上'], ['🐪', '駱駝', '🌵', '沙漠'], ['🐧', '企鵝', '🧊', '冰上'], ['🐶', '小狗', '🏠', '家裡'], ['🐝', '蜜蜂', '🌸', '花叢'], ['🐿️', '松鼠', '🌲', '森林']];
KidQuiz({
  id: 'animalhome', name: '動物住哪裡', icon: '🏠', color: '#45ad4a',
  desc: '小魚住在海裡，駱駝住在哪裡呢？',
  howto: '上面的小動物要回家了！從下面找出牠住的地方。一共 10 題。',
  make(g) { const A = pick(HOMES), others = Kid.shuffle(HOMES.filter(h => h !== A)).slice(0, 2), opts = Kid.shuffle([A, ...others]); return { A, opts, ans: opts.indexOf(A), text: `${A[1]}住在哪裡？`, say: `${A[1]}住在哪裡？`, right: `答對了！${A[1]}住在${A[3]}！`, wrong: o => `這是${o[3]}喔` }; },
  drawQ(c, g, x, y) { Kid.emoji(c, g.Q.A[0], x, y - 16, 120); Kid.text(c, g.Q.A[1], x, y + 80, 32, '#45ad4a', 6); },
  drawOpt(c, g, o, x, y, w) { Kid.emoji(c, o[2], x, y - w * 0.06, w * 0.5); Kid.text(c, o[3], x, y + w * 0.33, w * 0.15, '#4a3520', 4); },
});

// ---- 交通工具在哪裡 ----
const RIDES = [['🚢', '船', '🌊', '海上'], ['✈️', '飛機', '☁️', '天空'], ['🚗', '車子', '🛣️', '馬路'], ['🚂', '火車', '🛤️', '鐵軌'], ['🚀', '火箭', '🌙', '太空']];
KidQuiz({
  id: 'whereride', name: '交通工具去哪裡', icon: '🚂', color: '#ff9a2e',
  desc: '船在海上，飛機在哪裡呢？',
  howto: '上面是一種交通工具，從下面找出它會在哪裡跑或飛！一共 10 題。',
  make(g) { const R = pick(RIDES), others = Kid.shuffle(RIDES.filter(r => r !== R)).slice(0, 2), opts = Kid.shuffle([R, ...others]); return { R, opts, ans: opts.indexOf(R), text: `${R[1]}會在哪裡？`, say: `${R[1]}會在哪裡？`, right: `答對了！${R[1]}在${R[3]}！`, wrong: o => `這是${o[3]}喔` }; },
  drawQ(c, g, x, y) { Kid.emoji(c, g.Q.R[0], x, y - 16, 120); Kid.text(c, g.Q.R[1], x, y + 80, 32, '#ff9a2e', 6); },
  drawOpt(c, g, o, x, y, w) { Kid.emoji(c, o[2], x, y - w * 0.06, w * 0.5); Kid.text(c, o[3], x, y + w * 0.33, w * 0.15, '#4a3520', 4); },
});

// ---- 東西的顏色 ----
const COLOF = [['🍌', '香蕉', '黃色', '#ffd23f'], ['🍎', '蘋果', '紅色', '#e8453c'], ['🥦', '花椰菜', '綠色', '#45ad4a'], ['🍇', '葡萄', '紫色', '#8e4bc6'], ['🥕', '紅蘿蔔', '橘色', '#ff9a2e'], ['🐷', '小豬', '粉紅色', '#ff9ec2'], ['🐳', '鯨魚', '藍色', '#3f8fe0']];
KidQuiz({
  id: 'colorof', name: '這是什麼顏色', icon: '🍌', color: '#ffb31f',
  desc: '香蕉是什麼顏色？蘋果呢？',
  howto: '看看上面的東西，它是什麼顏色？點下面正確的顏色！一共 10 題。',
  make(g) { const A = pick(COLOF), others = Kid.shuffle(COLOF.filter(h => h[2] !== A[2])).slice(0, 2), opts = Kid.shuffle([A, ...others]); return { A, opts, ans: opts.indexOf(A), text: `${A[1]}是什麼顏色？`, say: `${A[1]}是什麼顏色？`, right: `答對了！是${A[2]}！`, wrong: o => `這是${o[2]}喔` }; },
  drawQ(c, g, x, y) { Kid.emoji(c, g.Q.A[0], x, y - 16, 120); Kid.text(c, g.Q.A[1], x, y + 80, 32, '#4a3520', 6); },
  drawOpt(c, g, o, x, y, w) { Paper.circle(c, x, y - w * 0.06, w * 0.28, o[3], { border: 4 }); if (g.doneT) Kid.text(c, o[2], x, y + w * 0.33, w * 0.15, '#4a3520', 4); },
});

// ---- 心情 ----
const FEEL = [['🎂', '過生日', '😄', '開心'], ['🍦', '冰淇淋掉了', '😢', '難過'], ['⛈️', '打雷了', '😨', '害怕'], ['🧸', '玩具被搶走', '😠', '生氣'], ['🌙', '好晚了', '😪', '想睡'], ['🎁', '收到禮物', '😄', '開心']];
const FACES = [['😄', '開心'], ['😢', '難過'], ['😨', '害怕'], ['😠', '生氣'], ['😪', '想睡']];
KidQuiz({
  id: 'feelings', name: '心情小天氣', icon: '😊', color: '#e86fae',
  desc: '遇到這件事，心情會怎麼樣呢？',
  howto: '上面發生了一件事，例如「過生日」，心情會是哪一張臉？點下面的表情！一共 10 題。',
  make(g) { const S = pick(FEEL), right = FACES.find(f => f[0] === S[2]), others = Kid.shuffle(FACES.filter(f => f !== right)).slice(0, 2), opts = Kid.shuffle([right, ...others]); return { S, opts, ans: opts.indexOf(right), text: `${S[1]}，心情會怎麼樣？`, say: `${S[1]}，心情會怎麼樣？`, right: `對！會覺得${S[3]}`, wrong: o => `這是${o[1]}的臉喔` }; },
  drawQ(c, g, x, y) { Kid.emoji(c, g.Q.S[0], x, y - 16, 110); Kid.text(c, g.Q.S[1], x, y + 80, 30, '#e86fae', 6); },
  drawOpt(c, g, o, x, y, w) { Kid.emoji(c, o[0], x, y - w * 0.06, w * 0.5); Kid.text(c, o[1], x, y + w * 0.33, w * 0.15, '#4a3520', 4); },
});

// ---- 健康食物 ----
KidQuiz({
  id: 'healthy', name: '健康小寶貝', icon: '🥦', color: '#45ad4a',
  desc: '哪一個對身體比較好？',
  howto: '下面有三種食物，哪一個對身體比較好、會讓你長得又高又壯？點它！一共 10 題。',
  make(g) { const good = pick(['🥦', '🍎', '🥕', '🥛', '🍌', '🐟', '🥚', '🍇']), bad = Kid.shuffle(['🍭', '🍩', '🍟', '🥤', '🍬', '🍰']).slice(0, 2), opts = Kid.shuffle([good, ...bad]); return { opts, ans: opts.indexOf(good), text: '哪一個對身體比較好？', say: '哪一個對身體比較好？', right: '答對了！多吃這個身體棒棒！', wrong: () => '這個好吃，可是不要吃太多喔' }; },
  drawQ(c, g, x, y) { Kid.emoji(c, '💪', x, y - 16, 110); Kid.text(c, '健康', x, y + 80, 34, '#45ad4a', 6); },
  drawOpt(c, g, o, x, y, w) { Kid.emoji(c, o, x, y, w * 0.58); },
});

// ---- 泡泡紙 ----
registerGame({
  id: 'bubblewrap', name: '捏泡泡紙', icon: '🟦', color: '#4fb3e8', kid: true,
  desc: '啵！啵！啵！把泡泡紙上的泡泡全部捏破！',
  howto: '點泡泡紙上的每一顆泡泡，它就會「啵」一聲破掉！全部捏破就換一張新的。不會輸，限時 30 秒。',
  TIME: 30,
  start() { this.t = 0; this.left = this.TIME; this.score = 0; this.over = false; this.overText = ''; this.n = 0; this.sheet(); },
  sheet() { const P = Kid.portrait(), cols = P ? 5 : 8, rows = P ? 7 : 5; this.cols = cols; this.rows = rows; this.b = Array(cols * rows).fill(0); this.pop = Array(cols * rows).fill(0); },
  geo() { const P = Kid.portrait(), top = P ? 140 : 90, s = Math.min((V.W - 40) / this.cols, (V.H - top - 40) / this.rows); return { s, x0: V.W / 2 - s * this.cols / 2, y0: top + (V.H - top - 40 - s * this.rows) / 2 }; },
  tap(x, y) { const G = this.geo(), c = Math.floor((x - G.x0) / G.s), r = Math.floor((y - G.y0) / G.s); if (c < 0 || r < 0 || c >= this.cols || r >= this.rows) return; const i = r * this.cols + c; if (this.b[i]) return; this.b[i] = 1; this.pop[i] = 1; this.n++; this.score += 1; Sfx.play('pop'); if (this.b.every(v => v)) { this.score += 10; Sfx.play('win'); FX.text(V.W / 2, V.H * 0.3, '新的一張！+10', '#2f7fc1', 34); this.sheet(); } },
  update(dt) { this.t += dt; this.left -= dt; for (let i = 0; i < this.pop.length; i++) this.pop[i] = Math.max(0, this.pop[i] - dt * 4); if (this.left <= 0) { this.left = 0; this.over = true; this.overText = `捏破 ${this.n} 顆泡泡！`; } },
  draw(c) {
    c.fillStyle = '#e3f3fb'; c.fillRect(-20, -20, V.W + 40, V.H + 40); const G = this.geo();
    Paper.rect(c, G.x0 - 10, G.y0 - 10, G.s * this.cols + 20, G.s * this.rows + 20, 'rgba(255,255,255,0.7)', 14, { border: 4 });
    for (let i = 0; i < this.b.length; i++) { const x = G.x0 + (i % this.cols + 0.5) * G.s, y = G.y0 + (Math.floor(i / this.cols) + 0.5) * G.s, r = G.s * 0.4;
      if (this.b[i]) { c.strokeStyle = 'rgba(120,170,200,0.5)'; c.lineWidth = 2; c.beginPath(); c.ellipse(x, y, r, r * 0.4 * (1 - this.pop[i] * 0.5), 0, 0, Math.PI * 2); c.stroke(); }
      else { const gr = c.createRadialGradient(x - r * 0.3, y - r * 0.3, 2, x, y, r); gr.addColorStop(0, 'rgba(255,255,255,0.95)'); gr.addColorStop(1, 'rgba(150,210,240,0.6)'); c.fillStyle = gr; c.beginPath(); c.arc(x, y, r, 0, Math.PI * 2); c.fill(); c.strokeStyle = 'rgba(100,160,200,0.6)'; c.lineWidth = 2; c.stroke(); } }
  },
  hud() { return { L: `<b>${this.score}</b> 分`, R: `⏱ ${Math.ceil(this.left)}` }; },
});

// ---- 餵小魚 ----
registerGame({
  id: 'feedfish', name: '餵小魚', icon: '🐠', color: '#2fa5c9', kid: true,
  desc: '點水面丟飼料，小魚會游過來吃，吃飽會長大喔！',
  howto: '點水面就會丟下一顆飼料，小魚會游過去吃。每條魚吃 5 顆就會長大！不會輸，限時 40 秒。',
  TIME: 40,
  start() { this.t = 0; this.left = this.TIME; this.score = 0; this.over = false; this.overText = '小魚都長大了！'; this.food = []; this.fish = ['🐟', '🐠', '🐡', '🐟', '🐠'].map(e => ({ e, x: rand(60, V.W - 60), y: rand(V.H * 0.4, V.H * 0.85), vx: rand(-40, 40), vy: 0, eat: 0, sz: 1, face: 1 })); },
  tap(x, y) { if (this.food.length < 12) { this.food.push({ x, y: Math.max(y, V.H * 0.28), vy: 30 }); Sfx.play('pop'); } },
  update(dt) {
    this.t += dt; this.left -= dt; if (this.left <= 0) { this.left = 0; this.over = true; return; }
    for (const f of this.food) { f.y = Math.min(V.H - 40, f.y + f.vy * dt); }
    for (const F of this.fish) {
      let best = null, bd = 1e9; for (const f of this.food) { const d = Math.hypot(f.x - F.x, f.y - F.y); if (d < bd) { bd = d; best = f; } }
      if (best) { F.vx += (best.x - F.x) / bd * 300 * dt; F.vy += (best.y - F.y) / bd * 300 * dt; if (bd < 22 * F.sz) { best.dead = 1; F.eat++; this.score += 5; Sfx.play('chomp'); if (F.eat % 5 === 0) { F.sz = Math.min(2, F.sz + 0.25); this.score += 20; Sfx.play('star'); FX.text(F.x, F.y - 40, '長大了！+20', '#ff7a00', 28); } } }
      else { F.vx += rand(-1, 1) * 80 * dt; F.vy += (V.H * 0.6 - F.y) * 0.2 * dt; }
      const s = Math.hypot(F.vx, F.vy), m = 160; if (s > m) { F.vx *= m / s; F.vy *= m / s; } F.vx *= 1 - dt * 0.5; F.vy *= 1 - dt * 0.8;
      F.x = clamp(F.x + F.vx * dt, 40, V.W - 40); F.y = clamp(F.y + F.vy * dt, V.H * 0.3, V.H - 40); if (Math.abs(F.vx) > 10) F.face = Math.sign(F.vx);
      this.food = this.food.filter(f => !f.dead);
    }
  },
  draw(c) {
    c.fillStyle = '#f2e3c8'; c.fillRect(-20, -20, V.W + 40, V.H + 40);
    const gr = c.createLinearGradient(0, V.H * 0.25, 0, V.H); gr.addColorStop(0, '#8fd3f5'); gr.addColorStop(1, '#2f7fc1'); c.fillStyle = gr; c.fillRect(10, V.H * 0.25, V.W - 20, V.H * 0.75 - 10);
    for (let i = 0; i < 6; i++) Kid.emoji(c, '🌿', 40 + i * (V.W - 80) / 5, V.H - 40, 40);
    for (const f of this.food) { c.fillStyle = '#c9772f'; c.beginPath(); c.arc(f.x, f.y, 5, 0, Math.PI * 2); c.fill(); }
    for (const F of this.fish) { c.save(); c.translate(F.x, F.y); c.scale(-F.face, 1); Kid.emoji(c, F.e, 0, 0, 40 * F.sz); c.restore(); }
    if (this.t < 4) Kid.text(c, '👆 點水面丟飼料', V.W / 2, V.H * 0.2, 26, '#4a3520', 6);
  },
  hud() { return { L: `<b>${this.score}</b> 分`, R: `⏱ ${Math.ceil(this.left)}` }; },
});

// ---- 數字氣球 ----
registerGame({
  id: 'numballoon', name: '數字氣球', icon: '🎈', color: '#ff7a9a', kid: true,
  desc: '照著 1、2、3… 的順序戳破數字氣球！',
  howto: '每顆氣球上有一個數字，從 1 開始照順序點破它們！點錯會告訴你。一共 3 關（到 5、到 8、到 10）。',
  LV: [5, 8, 10],
  start() { this.t = 0; this.score = 0; this.over = false; this.overText = '數字小達人！'; this.lv = 0; this.newLevel(); },
  newLevel() { const n = this.LV[this.lv], P = Kid.portrait(), top = P ? 170 : 120; this.next = 1; this.doneT = 0; this.bs = []; for (let i = 1; i <= n; i++) { let x, y, k = 0; do { x = rand(60, V.W - 60); y = rand(top, V.H - 90); } while (k++ < 50 && this.bs.some(b => Math.hypot(b.x - x, b.y - y) < 100)); this.bs.push({ n: i, x, y, ph: rand(0, 6), col: pick(['#ff6b6b', '#ffd93d', '#4d96ff', '#6bcb77', '#c77dff', '#ff9f43']), shake: 0 }); } Kid.say('從一開始'); },
  tap(x, y) {
    if (this.doneT) return;
    for (const b of this.bs) { if (b.dead || Math.hypot(b.x - x, b.y - y + Math.sin(this.t * 2 + b.ph) * 6) > 40) continue;
      if (b.n === this.next) { b.dead = 1; this.next++; this.score += 5; Sfx.play('pop'); FX.burst(b.x, b.y, 10, [b.col], 0.6); Kid.say(String(b.n)); if (this.next > this.LV[this.lv]) { this.doneT = 1.5; this.score += 20; Sfx.play('win'); } }
      else { b.shake = 0.5; Sfx.play('nope'); Kid.say(`找${this.next}`); }
      return; }
  },
  update(dt) { this.t += dt; for (const b of this.bs) b.shake = Math.max(0, b.shake - dt); if (this.doneT) { this.doneT -= dt; if (this.doneT <= 0) { if (this.lv + 1 >= this.LV.length) { this.over = true; return; } this.lv++; this.newLevel(); } } },
  draw(c) {
    BG.sky(c, { scroll: this.t * 20 });
    for (const b of this.bs) { if (b.dead) continue; const x = b.x + Math.sin(b.shake * 40) * b.shake * 12, y = b.y + Math.sin(this.t * 2 + b.ph) * 6; c.strokeStyle = '#8a8f99'; c.lineWidth = 2; c.beginPath(); c.moveTo(x, y + 36); c.lineTo(x, y + 70); c.stroke(); Paper.shape(c, cc => cc.ellipse(x, y, 32, 38, 0, 0, Math.PI * 2), b.col, { border: 3 }); Kid.text(c, String(b.n), x, y + 2, 34, '#ffffff', 0); }
    Kid.text(c, `找 ${this.next}`, V.W / 2, Kid.portrait() ? 140 : 96, 30, '#e0573c', 6);
  },
  hud() { return { L: `<b>${this.score}</b> 分`, R: `第 ${this.lv + 1} / 3 關` }; },
});

// ---- 沙灘挖寶 ----
registerGame({
  id: 'sanddig', name: '沙灘挖寶', icon: '🏖️', color: '#e9c27a', kid: true,
  desc: '用小鏟子在沙灘上挖一挖，找出藏起來的寶物！',
  howto: '點沙灘就會挖一個洞，沙子底下藏了 5 個寶物（貝殼、海星、螃蟹…）。全部找到就過關，挖越少下分數越高！一共 3 關。',
  ITEMS: ['🐚', '⭐', '🦀', '💎', '🐠', '💰'],
  start() { this.t = 0; this.score = 0; this.over = false; this.overText = '尋寶高手！'; this.lv = 0; this.newLevel(); },
  newLevel() { const P = Kid.portrait(), top = P ? 170 : 120; this.holes = []; this.items = []; this.digs = 0; this.doneT = 0; for (let i = 0; i < 5; i++) { let x, y, k = 0; do { x = rand(60, V.W - 60); y = rand(top + 30, V.H - 60); } while (k++ < 50 && this.items.some(o => Math.hypot(o.x - x, o.y - y) < 120)); this.items.push({ x, y, e: pick(this.ITEMS), found: 0 }); } },
  tap(x, y) {
    if (this.doneT || y < (Kid.portrait() ? 150 : 100)) return; this.digs++; this.holes.push({ x, y, t: 0 }); Sfx.play('rustle');
    for (const o of this.items) if (!o.found && Math.hypot(o.x - x, o.y - y) < 55) { o.found = 1; this.score += 10; Sfx.play('ding'); FX.text(o.x, o.y - 40, '找到了！', '#ff7a00', 26); }
    if (this.items.every(o => o.found)) { const b = Math.max(0, 30 - this.digs * 2); this.score += b; this.doneT = 1.6; Sfx.play('win'); FX.text(V.W / 2, V.H * 0.35, b ? `全部找到！+${b}` : '全部找到！', '#e0573c', 36); }
  },
  update(dt) { this.t += dt; for (const h of this.holes) h.t = Math.min(1, h.t + dt * 5); if (this.doneT) { this.doneT -= dt; if (this.doneT <= 0) { if (this.lv + 1 >= 3) { this.over = true; return; } this.lv++; this.newLevel(); } } },
  draw(c) {
    c.fillStyle = '#4fb3e8'; c.fillRect(-20, -20, V.W + 40, V.H * 0.18); c.fillStyle = '#f2d59a'; c.fillRect(-20, V.H * 0.16, V.W + 40, V.H);
    c.fillStyle = 'rgba(200,160,100,0.3)'; for (let i = 0; i < 40; i++) { c.beginPath(); c.arc((i * 173) % V.W, V.H * 0.2 + (i * 97) % (V.H * 0.8), 3, 0, Math.PI * 2); c.fill(); }
    for (const h of this.holes) { c.fillStyle = '#c99b62'; c.beginPath(); c.ellipse(h.x, h.y, 38 * h.t, 24 * h.t, 0, 0, Math.PI * 2); c.fill(); }
    for (const o of this.items) if (o.found) Kid.emoji(c, o.e, o.x, o.y, 44);
    Kid.text(c, `找到 ${this.items.filter(o => o.found).length} / 5`, V.W / 2, Kid.portrait() ? 140 : 96, 26, '#4a3520', 6);
  },
  hud() { return { L: `<b>${this.score}</b> 分`, R: `第 ${this.lv + 1} / 3 關` }; },
});

// ---- 擦玻璃猜猜看 ----
registerGame({
  id: 'foggy', name: '擦玻璃猜猜看', icon: '🌫️', color: '#7a9ab8', kid: true,
  desc: '窗戶霧霧的，擦一擦看看後面是什麼！',
  howto: '用手指在霧霧的窗戶上擦一擦，後面會慢慢露出來。猜到是什麼就點下面的答案，越早猜對分數越高！一共 8 題。',
  POOL: [['🐶', '小狗'], ['🐱', '小貓'], ['🐘', '大象'], ['🚗', '車子'], ['🍎', '蘋果'], ['🦒', '長頸鹿'], ['✈️', '飛機'], ['🐢', '烏龜'], ['🍌', '香蕉'], ['🐸', '青蛙']],
  N: 8,
  start() { this.t = 0; this.score = 0; this.over = false; this.overText = '猜謎高手！'; this.k = 0; this.newQ(); },
  newQ() { const set = Kid.shuffle(this.POOL.slice()).slice(0, 3); this.opts = set; this.ans = set[Math.floor(Math.random() * 3)]; this.cells = Array(144).fill(1); this.doneT = 0; this.wrong = null; },
  win() { const P = Kid.portrait(), s = Math.min(V.W - 60, P ? V.H * 0.42 : V.H * 0.5, 360); return { x: V.W / 2 - s / 2, y: P ? 150 : 100, s }; },
  btn(i) { const P = Kid.portrait(), w = Math.min((V.W - 60) / 3, 150); return { x: V.W / 2 + (i - 1) * (w + 12), y: V.H - (P ? 110 : 80), w, h: w * 0.8 }; },
  tap(x, y) {
    if (this.doneT) return;
    for (let i = 0; i < 3; i++) if (Kid.hit(this.btn(i), x, y)) {
      if (this.opts[i] === this.ans) { const clear = this.cells.filter(v => !v).length / 144, pts = Math.max(5, Math.round(30 - clear * 25)); this.score += pts; this.doneT = 1.6; this.cells.fill(0); Sfx.play('ding'); Kid.say(`答對了！是${this.ans[1]}！`); FX.text(V.W / 2, V.H * 0.5, `答對了！+${pts}`, '#ff7a00', 34); }
      else { this.wrong = i; Sfx.play('nope'); Kid.say('再擦擦看'); }
      return;
    }
  },
  update(dt) {
    this.t += dt;
    if (this.doneT) { this.doneT -= dt; if (this.doneT <= 0) { this.k++; if (this.k >= this.N) { this.over = true; return; } this.newQ(); } return; }
    if (Input.down) { const W = this.win(), cs = W.s / 12; for (let r = 0; r < 12; r++) for (let c = 0; c < 12; c++) { const cx = W.x + (c + 0.5) * cs, cy = W.y + (r + 0.5) * cs; if (Math.hypot(cx - Input.x, cy - Input.y) < cs * 1.3 && this.cells[r * 12 + c]) { this.cells[r * 12 + c] = 0; if (Math.random() < 0.1) Sfx.play('swish'); } } }
  },
  draw(c) {
    c.fillStyle = '#d9e6ef'; c.fillRect(-20, -20, V.W + 40, V.H + 40); const W = this.win(), cs = W.s / 12;
    Paper.rect(c, W.x - 14, W.y - 14, W.s + 28, W.s + 28, '#a0683c', 10, { border: 4 });
    c.fillStyle = '#bfe8ff'; c.fillRect(W.x, W.y, W.s, W.s); Kid.emoji(c, this.ans[0], W.x + W.s / 2, W.y + W.s / 2, W.s * 0.7);
    c.fillStyle = 'rgba(235,242,248,0.97)'; for (let i = 0; i < 144; i++) if (this.cells[i]) c.fillRect(W.x + (i % 12) * cs - 0.5, W.y + Math.floor(i / 12) * cs - 0.5, cs + 1, cs + 1);
    c.strokeStyle = '#a0683c'; c.lineWidth = 6; c.beginPath(); c.moveTo(W.x + W.s / 2, W.y); c.lineTo(W.x + W.s / 2, W.y + W.s); c.moveTo(W.x, W.y + W.s / 2); c.lineTo(W.x + W.s, W.y + W.s / 2); c.stroke();
    for (let i = 0; i < 3; i++) { const b = this.btn(i); Kid.button(c, b, '', this.wrong === i ? '#f2c2c2' : '#fffdf5'); Kid.text(c, this.opts[i][1], b.x, b.y, Math.min(28, b.w * 0.2), '#4a3520', 0); }
  },
  hud() { return { L: `<b>${this.score}</b> 分`, R: `第 ${Math.min(this.k + 1, this.N)} / ${this.N} 題` }; },
});

// ---- 夾豆豆 ----
registerGame({
  id: 'beans', name: '夾豆豆', icon: '🥢', color: '#a0683c', kid: true,
  desc: '用手指把豆豆一顆一顆移到另一個碗，太快會掉喔！',
  howto: '按住左邊碗裡的一顆豆豆，慢慢拖到右邊的碗裡放開。拖太快豆豆會掉下去！限時 40 秒，看你能夾幾顆。',
  TIME: 40,
  start() { this.t = 0; this.left = this.TIME; this.score = 0; this.over = false; this.overText = ''; this.n = 0; this.hold = null; this.fall = []; this.fill(); },
  fill() { this.beans = []; for (let i = 0; i < 12; i++) { const a = rand(0, Math.PI * 2), r = Math.sqrt(Math.random()) * 50; this.beans.push({ u: Math.cos(a) * r, v: Math.sin(a) * r * 0.5, col: pick(['#8a4a24', '#e8453c', '#45ad4a', '#ffd23f']) }); } },
  bowl(i) { const P = Kid.portrait(); return { x: V.W * (i ? (P ? 0.72 : 0.7) : (P ? 0.28 : 0.3)), y: V.H * 0.6 }; },
  tap(x, y) { const B = this.bowl(0); for (let i = this.beans.length - 1; i >= 0; i--) { const b = this.beans[i]; if (Math.hypot(B.x + b.u - x, B.y + b.v - y) < 26) { this.hold = { col: b.col, x, y, lx: x, ly: y }; this.beans.splice(i, 1); Sfx.play('click'); return; } } },
  update(dt) {
    this.t += dt; this.left -= dt; if (this.left <= 0) { this.left = 0; this.over = true; this.overText = `夾了 ${this.n} 顆豆豆！`; return; }
    for (const f of this.fall) { f.vy += 1200 * dt; f.y += f.vy * dt; } this.fall = this.fall.filter(f => f.y < V.H + 20);
    const H = this.hold; if (!H) return;
    if (Input.down) {
      const sp = Math.hypot(Input.x - H.lx, Input.y - H.ly) / Math.max(dt, 0.001); H.lx = H.x = Input.x; H.ly = H.y = Input.y;
      if (sp > 1500) { this.fall.push({ x: H.x, y: H.y, vy: 0, col: H.col }); this.hold = null; Sfx.play('boing'); FX.text(H.x, H.y - 30, '掉了！', '#e8453c', 26); }
    } else {
      const B = this.bowl(1); if (Math.hypot(H.x - B.x, H.y - B.y) < 90) { this.n++; this.score += 10; Sfx.play('ding'); FX.text(B.x, B.y - 80, '+10', '#ff7a00', 28); } else { this.beans.push({ u: rand(-40, 40), v: rand(-15, 15), col: H.col }); }
      this.hold = null; if (!this.beans.length) this.fill();
    }
  },
  draw(c) {
    c.fillStyle = '#f6ecd9'; c.fillRect(-20, -20, V.W + 40, V.H + 40); c.fillStyle = '#c98a4b'; c.fillRect(-20, V.H * 0.68, V.W + 40, V.H);
    for (let i = 0; i < 2; i++) { const B = this.bowl(i); Paper.shape(c, cc => { cc.ellipse(B.x, B.y, 90, 34, 0, 0, Math.PI); cc.lineTo(B.x - 90, B.y); }, i ? '#3f8fe0' : '#e8453c', { border: 4 }); c.fillStyle = '#fff6e0'; c.beginPath(); c.ellipse(B.x, B.y, 84, 26, 0, 0, Math.PI * 2); c.fill(); }
    const B0 = this.bowl(0); for (const b of this.beans) { c.fillStyle = b.col; c.beginPath(); c.ellipse(B0.x + b.u, B0.y + b.v, 10, 7, 0.5, 0, Math.PI * 2); c.fill(); }
    const B1 = this.bowl(1); for (let i = 0; i < Math.min(this.n, 30); i++) { c.fillStyle = ['#8a4a24', '#e8453c', '#45ad4a', '#ffd23f'][i % 4]; c.beginPath(); c.ellipse(B1.x + Math.sin(i * 2.3) * 50, B1.y + Math.cos(i * 1.7) * 14, 10, 7, i, 0, Math.PI * 2); c.fill(); }
    for (const f of this.fall) { c.fillStyle = f.col; c.beginPath(); c.ellipse(f.x, f.y, 10, 7, 0, 0, Math.PI * 2); c.fill(); }
    const H = this.hold; if (H) { c.fillStyle = H.col; c.beginPath(); c.ellipse(H.x, H.y, 11, 8, 0, 0, Math.PI * 2); c.fill(); c.strokeStyle = '#a0683c'; c.lineWidth = 6; c.beginPath(); c.moveTo(H.x - 8, H.y - 6); c.lineTo(H.x + 40, H.y - 120); c.moveTo(H.x + 8, H.y - 6); c.lineTo(H.x + 60, H.y - 110); c.stroke(); }
    if (this.t < 5) Kid.text(c, '慢慢拖到右邊的碗 →', V.W / 2, Kid.portrait() ? 150 : 100, 24, '#4a3520', 6);
  },
  hud() { return { L: `<b>${this.score}</b> 分`, R: `⏱ ${Math.ceil(this.left)}` }; },
});
