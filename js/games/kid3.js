'use strict';
// =====================================================
//  寶寶專區第三彈：五官用途、哪邊比較多、顏色混一混、資源回收、照顧小貓、找找看、小車開回家、襪子配對、果汁機
// =====================================================

// ---- 五官用途 ----
const SENSE = [['👃', '鼻子', '聞', [['🌸', '花香香'], ['🍞', '麵包香香'], ['🧄', '大蒜臭臭']]], ['👂', '耳朵', '聽', [['🎵', '音樂'], ['🔔', '鈴鐺'], ['🐶', '狗狗叫']]], ['👀', '眼睛', '看', [['🌈', '彩虹'], ['📖', '故事書'], ['🎆', '煙火']]], ['👅', '舌頭', '嚐', [['🍭', '糖果甜甜'], ['🍋', '檸檬酸酸'], ['🍦', '冰淇淋']]], ['✋', '手', '摸', [['🧸', '軟軟的熊熊'], ['🐱', '小貓的毛'], ['🧊', '冰冰的冰塊']]]];
KidQuiz({
  id: 'senses', name: '五官小偵探', icon: '👃', color: '#e9a54b',
  desc: '聞花香用鼻子、聽音樂用耳朵，用什麼呢？',
  howto: '上面有一個東西，例如 🎵 音樂。我們要用哪個身體部位去感覺它？從下面點出來（👃 鼻子、👂 耳朵、👀 眼睛、👅 舌頭、✋ 手）。一共 10 題。',
  make(g) {
    const S = pick(SENSE), it = pick(S[3]), others = Kid.shuffle(SENSE.filter(s => s !== S)).slice(0, 2), opts = Kid.shuffle([S, ...others]);
    return { it, opts, ans: opts.indexOf(S), text: `${it[1]}，要用什麼${S[2]}？`, say: `${it[1]}，要用什麼${S[2]}？`, right: `答對了！用${S[1]}${S[2]}！`, wrong: o => `這是${o[1]}喔` };
  },
  drawQ(c, g, x, y) { Kid.emoji(c, g.Q.it[0], x, y - 16, 120); Kid.text(c, g.Q.it[1], x, y + 82, 32, '#c9772f', 6); },
  drawOpt(c, g, o, x, y, w) { Kid.emoji(c, o[0], x, y - w * 0.06, w * 0.5); Kid.text(c, o[1], x, y + w * 0.33, w * 0.15, '#4a3520', 4); },
});

// ---- 哪邊比較多 ----
KidQuiz({
  id: 'moreless', name: '哪邊比較多', icon: '⚖️', color: '#3c9a8a',
  desc: '看看兩邊，哪一邊的東西比較多？哪一邊比較少？',
  howto: '下面有兩堆東西，聽題目：「哪一邊比較多？」或「哪一邊比較少？」點對的那一邊！一共 10 題，後面會越來越難分喔。',
  make(g, q) {
    const e = pick(['🍎', '🐟', '⭐', '🍪', '🐤', '🎈', '🍓', '🚗']), a = 1 + Math.floor(Math.random() * (q < 5 ? 5 : 8)); let b = a + (Math.random() < 0.5 ? -1 : 1) * (q < 5 ? 2 + Math.floor(Math.random() * 2) : 1); if (b < 1) b = a + 2;
    const more = q % 2 === 0 || Math.random() < 0.5, opts = [{ e, n: a }, { e, n: b }], ans = (more ? a > b : a < b) ? 0 : 1, t = more ? '哪一邊比較多？' : '哪一邊比較少？';
    return { more, opts, ans, text: t, say: t, right: `答對了！${opts[ans].n} 個比較${more ? '多' : '少'}`, wrong: o => `這邊有 ${o.n} 個喔` };
  },
  btn(i) { const P = Kid.portrait(), w = Math.min(P ? (V.W - 50) / 2 : 300, 300), h = P ? w * 1.15 : 230; return { x: V.W / 2 + (i ? 1 : -1) * (w / 2 + 10), y: V.H * (P ? 0.66 : 0.68), w, h }; },
  drawQ(c, g, x, y) { Kid.text(c, g.Q.more ? '比較「多」' : '比較「少」', x, y, 56, g.Q.more ? '#e0573c' : '#3f8fe0', 8); Kid.emoji(c, g.Q.more ? '⬆️' : '⬇️', x, y + 80, 50); },
  drawOpt(c, g, o, x, y, w) { const cols = 3, s = w / 3.8, rows = Math.ceil(o.n / cols); for (let i = 0; i < o.n; i++) { const r = Math.floor(i / cols), inRow = Math.min(cols, o.n - r * cols); Kid.emoji(c, o.e, x + ((i % cols) - (inRow - 1) / 2) * s * 1.05, y - (rows - 1) / 2 * s + r * s - (g.doneT ? 14 : 0), s * 0.9); } if (g.doneT) Kid.text(c, String(o.n), x, y + w * 0.42, 30, '#e0573c', 5); },
});

// ---- 顏色混一混 ----
const MIX = [['#e8453c', '紅', '#ffd23f', '黃', '#ff9a2e', '橘色'], ['#3f8fe0', '藍', '#ffd23f', '黃', '#45ad4a', '綠色'], ['#e8453c', '紅', '#3f8fe0', '藍', '#8e4bc6', '紫色'], ['#e8453c', '紅', '#ffffff', '白', '#ff9ec2', '粉紅色'], ['#2a2a33', '黑', '#ffffff', '白', '#9a9aa6', '灰色'], ['#3f8fe0', '藍', '#ffffff', '白', '#9fd3ff', '淺藍色']];
KidQuiz({
  id: 'colormix', name: '顏色混一混', icon: '🎨', color: '#8e4bc6',
  desc: '紅色加黃色會變成什麼顏色呢？',
  howto: '上面有兩種顏料，把它們混在一起會變成什麼顏色？點下面正確的顏色！（紅＋黃＝橘、藍＋黃＝綠、紅＋藍＝紫…）一共 10 題。',
  make(g) {
    const M = pick(MIX), others = Kid.shuffle(MIX.filter(m => m[5] !== M[5])).slice(0, 2), opts = Kid.shuffle([M, ...others]);
    return { M, opts, ans: opts.indexOf(M), text: `${M[1]}色加${M[3]}色，會變成？`, say: `${M[1]}色加${M[3]}色，會變成什麼顏色？`, right: `答對了！變成${M[5]}！`, wrong: o => `這是${o[5]}喔` };
  },
  blob(c, x, y, r, col) { Paper.shape(c, cc => { for (let i = 0; i < 12; i++) { const a = i / 12 * Math.PI * 2, rr = r * (0.88 + 0.12 * Math.sin(i * 2.3)); cc.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr); } cc.closePath(); }, col, { border: 4, blur: 4 }); },
  drawQ(c, g, x, y) {
    const M = g.Q.M, d = g.doneT ? Math.min(1, (1.5 - g.doneT) * 2) : 0;
    this.blob(c, x - 110 + d * 110, y - 10, 46, M[0]); this.blob(c, x + 110 - d * 110, y - 10, 46, M[2]);
    if (d >= 1) this.blob(c, x, y - 10, 60, M[4]); else Kid.text(c, '+', x, y - 10, 60, '#4a3520', 6);
    Kid.text(c, `${M[1]} ＋ ${M[3]}`, x, y + 80, 30, '#4a3520', 6);
  },
  drawOpt(c, g, o, x, y, w) { this.blob(c, x, y - w * 0.06, w * 0.28, o[4]); if (g.doneT) Kid.text(c, o[5], x, y + w * 0.34, w * 0.14, '#4a3520', 4); },
});

// ---- 資源回收 ----
registerGame({
  id: 'recycle', name: '資源回收', icon: '♻️', color: '#2f9a5a', kid: true,
  desc: '垃圾要分類！把東西拖到正確的回收桶裡。',
  howto: '中間會出現一個東西，用手指把它拖到正確的桶子裡：📄 紙類、🧴 塑膠、🥫 鐵鋁罐、🍌 廚餘。放對了得分，一共 12 個！',
  BINS: [['紙類', '#3f8fe0', ['📄', '報紙'], ['📦', '紙箱'], ['📰', '舊報紙'], ['🧻', '衛生紙捲']], ['塑膠', '#ffb31f', ['🧴', '塑膠瓶'], ['🥤', '飲料杯'], ['🛍️', '塑膠袋']], ['鐵鋁罐', '#8a8f99', ['🥫', '罐頭'], ['🍺', '鋁罐']], ['廚餘', '#45ad4a', ['🍌', '香蕉皮'], ['🍎', '蘋果核'], ['🥚', '蛋殼'], ['🍉', '西瓜皮']]],
  N: 12,
  start() { this.t = 0; this.score = 0; this.over = false; this.overText = '地球謝謝你！'; this.k = 0; this.drag = Kid.makeDrag(); this.shake = [0, 0, 0, 0]; this.newItem(); },
  newItem() { const b = Math.floor(Math.random() * 4), it = pick(this.BINS[b].slice(2)); this.it = { e: it[0], name: it[1], bin: b, x: V.W / 2, y: this.home.y, pop: 1 }; this.tries = 0; if (this.k) Kid.say(it[1]); },
  onEnter(p) { if (p === 'ready') Kid.say(this.it.name + '，要丟哪裡？'); },
  get home() { return { x: V.W / 2, y: V.H * (Kid.portrait() ? 0.36 : 0.34) }; },
  bin(i) { const P = Kid.portrait(), cols = P ? 2 : 4, w = P ? (V.W - 50) / 2 : Math.min(250, (V.W - 60) / 4), h = P ? V.H * 0.17 : V.H * 0.3; return { x: V.W / 2 + ((i % cols) - (cols - 1) / 2) * (w + 12), y: (P ? V.H * 0.63 : V.H * 0.76) + Math.floor(i / cols) * (h + 12), w, h }; },
  tap(x, y) { const I = this.it; if (I && Math.hypot(I.x - x, I.y - y) < 70) { this.drag.grab(I, x, y); Sfx.play('pop'); } },
  update(dt) {
    this.t += dt; for (let i = 0; i < 4; i++) this.shake[i] = Math.max(0, this.shake[i] - dt);
    const I = this.it; if (!I) return; I.pop = Math.max(0, I.pop - dt * 3);
    this.drag.step(o => {
      for (let i = 0; i < 4; i++) { const B = this.bin(i); if (!Kid.hit(B, o.x, o.y, 10)) continue;
        if (i === o.bin) { this.score += this.tries ? 5 : 10; this.k++; Sfx.play('ding'); FX.burst(B.x, B.y - B.h / 2, 14, undefined, 0.6); FX.text(B.x, B.y - B.h / 2 - 40, '分對了！', '#45ad4a', 30); Kid.say('答對了！'); if (this.k >= this.N) { this.it = null; this.over = true; return; } this.newItem(); }
        else { this.tries++; this.shake[i] = 0.5; Sfx.play('nope'); Kid.say(`${o.name}不是${this.BINS[i][0]}喔`); o.x = this.home.x; o.y = this.home.y; }
        return; }
      o.x = this.home.x; o.y = this.home.y;
    });
  },
  draw(c) {
    Kid.ground(c, 'meadow', this.t, 0.97);
    for (let i = 0; i < 4; i++) { const B = this.bin(i), sh = Math.sin(this.shake[i] * 40) * this.shake[i] * 14, BN = this.BINS[i];
      Paper.rect(c, B.x - B.w / 2 + sh, B.y - B.h / 2, B.w, B.h, BN[1], 18, { border: 5 }); Paper.rect(c, B.x - B.w / 2 - 6 + sh, B.y - B.h / 2 - 12, B.w + 12, 20, BN[1], 8, { border: 4 });
      Kid.emoji(c, BN[2][0], B.x + sh, B.y - B.h * 0.08, Math.min(B.h * 0.4, 60)); Kid.text(c, BN[0], B.x + sh, B.y + B.h * 0.3, Math.min(26, B.w * 0.14), '#ffffff', 0); }
    const I = this.it; if (I) { if (!this.drag.obj) Paper.circle(c, this.home.x, this.home.y, 64, 'rgba(255,253,245,0.8)', { border: 3 }); Kid.emoji(c, I.e, I.x, I.y, 80 * (1 + I.pop * 0.3)); Kid.text(c, I.name, this.home.x, this.home.y + 84, 28, '#2f9a5a', 6); }
    Kid.text(c, '拖到正確的桶子 ↓', V.W / 2, Kid.portrait() ? 150 : 100, 24, '#4a3520', 6);
  },
  hud() { return { L: `<b>${this.score}</b> 分`, R: `♻️ ${this.k} / ${this.N}` }; },
});

// ---- 照顧小貓 ----
registerGame({
  id: 'petcare', name: '照顧小貓', icon: '🐱', color: '#f2a65a', kid: true,
  desc: '小貓肚子餓、想玩、想睡覺…看牠想要什麼，點對的東西！',
  howto: '小貓頭上會冒出泡泡告訴你牠想要什麼：🍗 肚子餓、💩 髒髒、🎾 想玩、💤 想睡覺。點下面對的東西照顧牠（🐟 小魚、🧽 洗澡、🧶 毛線球、🛏️ 小床）！照顧 12 次，越快分數越高。',
  NEED: [['餓', '🍗', '🐟', '小貓肚子餓了'], ['髒', '💩', '🧽', '小貓髒髒的'], ['玩', '🎾', '🧶', '小貓想玩'], ['睏', '💤', '🛏️', '小貓想睡覺']],
  N: 12,
  start() { this.t = 0; this.score = 0; this.over = false; this.overText = '小貓好開心！'; this.k = 0; this.act = null; this.actT = 0; this.wait = 0.8; this.need = null; this.heart = 0; },
  btn(i) { const P = Kid.portrait(), w = P ? (V.W - 60) / 4 : 120; return { x: V.W / 2 + (i - 1.5) * (w + 12), y: V.H - (P ? 90 : 80), w, h: w * 0.9 }; },
  tap(x, y) {
    for (let i = 0; i < 4; i++) if (Kid.hit(this.btn(i), x, y)) {
      if (!this.need || this.act) return;
      if (this.need === i) { this.act = i; this.actT = 1.6; const pts = Math.max(5, Math.round(15 - this.nt * 2)); this.score += pts; this.k++; Sfx.play(['chomp', 'splash', 'boing', 'ding'][i]); FX.text(V.W / 2, V.H * 0.25, `+${pts}`, '#ff7a00', 34); Kid.say(['好好吃！', '洗得好乾淨！', '好好玩！', '晚安～'][i]); this.need = null; this.heart = 1.5; }
      else { Sfx.play('nope'); Kid.say(`不是這個喔，${this.NEED[this.need][3]}`); }
      return;
    }
    if (Math.hypot(x - V.W / 2, y - this.cy) < 100) { Sfx.play('giggle'); this.heart = 1; }
  },
  get cy() { return V.H * (Kid.portrait() ? 0.5 : 0.52); },
  update(dt) {
    this.t += dt; this.heart = Math.max(0, this.heart - dt);
    if (this.act != null) { this.actT -= dt; if (this.actT <= 0) { this.act = null; this.wait = rand(0.5, 1.2); if (this.k >= this.N) { this.over = true; } } return; }
    if (this.need == null) { this.wait -= dt; if (this.wait <= 0) { let n; do n = Math.floor(Math.random() * 4); while (n === this.last); this.need = this.last = n; this.nt = 0; Sfx.play('pop'); Kid.say(this.NEED[n][3]); } }
    else this.nt += dt;
  },
  draw(c) {
    const night = this.act === 3;
    c.fillStyle = night ? '#3a3560' : '#ffeedd'; c.fillRect(-20, -20, V.W + 40, V.H + 40);
    c.fillStyle = night ? '#2a2550' : '#f2d8c0'; c.fillRect(-20, V.H * 0.68, V.W + 40, V.H);
    Paper.rect(c, V.W * 0.08, V.H * 0.18, 140, 110, night ? '#1a1a40' : '#bfe8ff', 10, { border: 6 }); Kid.emoji(c, night ? '🌙' : '☀️', V.W * 0.08 + 70, V.H * 0.18 + 55, 50);
    const x = V.W / 2, y = this.cy, A = this.act, s = Math.min(V.W * 0.45, 220), t = this.t;
    if (A === 3) { Paper.rect(c, x - s * 0.7, y + s * 0.15, s * 1.4, s * 0.4, '#e86fae', 20, { border: 5 }); }
    if (A === 1) for (let i = 0; i < 8; i++) Paper.circle(c, x + Math.cos(i + t * 3) * s * 0.5, y + Math.sin(i * 2 + t * 2) * s * 0.4, 16 + (i % 3) * 6, 'rgba(255,255,255,0.85)', { border: 0, blur: 2 });
    Kid.emoji(c, A === 3 ? '😴' : A != null ? '😻' : '🐱', x, y + (A === 2 ? -Math.abs(Math.sin(t * 8)) * 40 : 0), s, A === 2 ? Math.sin(t * 8) * 0.2 : 0);
    if (A === 0) Kid.emoji(c, '🐟', x + s * 0.3, y + s * 0.35, 60 * Math.max(0.2, this.actT / 1.6));
    if (A === 2) Kid.emoji(c, '🧶', x + Math.sin(t * 6) * s * 0.7, y + s * 0.4 - Math.abs(Math.sin(t * 6)) * 60, 54);
    if (A === 3) for (let i = 0; i < 3; i++) Kid.text(c, 'z', x + s * 0.4 + i * 20, y - s * 0.4 - i * 24 - (t * 20 % 20), 30 + i * 6, '#ffffff', 0);
    if (this.need != null) { const bx = x + s * 0.55, by = y - s * 0.55, k = 1 + Math.sin(t * 6) * 0.05; Paper.circle(c, bx, by, 52 * k, '#ffffff', { border: 4 }); Paper.circle(c, bx - 40, by + 44, 12, '#ffffff', { border: 3 }); Kid.emoji(c, this.NEED[this.need][1], bx, by, 56 * k); }
    if (this.heart) for (let i = 0; i < 3; i++) Kid.emoji(c, '💗', x - 60 + i * 60, y - s * 0.6 - (1.5 - this.heart) * 50, 34);
    for (let i = 0; i < 4; i++) { const b = this.btn(i); Kid.button(c, b, '', this.need === i && this.t % 1 < 0.5 && this.nt > 4 ? '#ffe680' : '#fffdf5'); Kid.emoji(c, this.NEED[i][2], b.x, b.y, b.h * 0.6); }
  },
  hud() { return { L: `<b>${this.score}</b> 分`, R: `💗 ${this.k} / ${this.N}` }; },
});

// ---- 找找看 ----
registerGame({
  id: 'ispy', name: '找找看', icon: '🔎', color: '#5b6fd6', kid: true,
  desc: '畫面裡藏了好多東西，找出下面要你找的那幾個！',
  howto: '畫面裡有好多好多東西，下面會告訴你要找哪 3 個，找到了就點它！找太久它會偷偷動一下給你提示。一共 5 關。',
  POOL: ['🍎', '🍌', '🍇', '🍓', '🐶', '🐱', '🐰', '🐻', '🐸', '🐵', '🚗', '🚌', '✈️', '🚲', '⚽', '🏀', '🎈', '🎁', '⭐', '🌙', '☂️', '🎸', '⏰', '🔑', '🧸', '👟', '🎩', '🍦', '🍩', '🐢', '🐙', '🦋', '🌻', '🍄', '🐝', '🐳', '🦒', '🦀', '🍉', '🥕'],
  N: 5,
  start() { this.t = 0; this.score = 0; this.over = false; this.overText = '眼睛好厲害！'; this.k = 0; this.newRound(); },
  area() { const P = Kid.portrait(), top = P ? 120 : 80, bot = P ? 150 : 110; return { x: 14, y: top, w: V.W - 28, h: V.H - top - bot }; },
  newRound() {
    const A = this.area(), n = 22 + this.k * 6, pool = Kid.shuffle(this.POOL.slice()), find = pool.slice(0, 3), rest = pool.slice(3), s = clamp(Math.sqrt(A.w * A.h / n) * 0.62, 34, 64);
    this.items = []; const tryPlace = e => { for (let k = 0; k < 60; k++) { const x = rand(A.x + s / 2, A.x + A.w - s / 2), y = rand(A.y + s / 2, A.y + A.h - s / 2); if (this.items.every(o => Math.hypot(o.x - x, o.y - y) > s * 0.82)) { this.items.push({ e, x, y, s: s * rand(0.85, 1.1), rot: rand(-0.5, 0.5), found: 0 }); return; } } };
    find.forEach(tryPlace); for (let i = 0; i < n - 3; i++) tryPlace(pick(rest));
    this.find = find; this.rt = 0; this.doneT = 0; if (this.k) Kid.say('找找看！');
  },
  tap(x, y) {
    if (this.doneT) return; let best = null, bd = 1e9;
    for (const o of this.items) { const d = Math.hypot(o.x - x, o.y - y); if (d < o.s * 0.6 && d < bd) { bd = d; best = o; } }
    if (!best) return;
    const i = this.find.indexOf(best.e);
    if (i >= 0 && !best.found && !this.items.some(o => o.found && o.e === best.e)) { best.found = 1; this.score += 10; Sfx.play('ding'); FX.burst(best.x, best.y, 12, undefined, 0.6); FX.text(best.x, best.y - 40, '找到了！', '#ff7a00', 28);
      if (this.find.every(e => this.items.some(o => o.found && o.e === e))) { const b = Math.max(0, Math.round(20 - this.rt)); this.score += b; this.doneT = 1.6; Sfx.play('win'); Kid.say('全部找到了！'); } }
    else { Sfx.play('nope'); best.wob = 0.4; }
  },
  update(dt) { this.t += dt; for (const o of this.items) o.wob = Math.max(0, (o.wob || 0) - dt); if (this.doneT) { this.doneT -= dt; if (this.doneT <= 0) { this.k++; if (this.k >= this.N) { this.over = true; return; } this.newRound(); } } else this.rt += dt; },
  draw(c) {
    c.fillStyle = '#fdf3dc'; c.fillRect(-20, -20, V.W + 40, V.H + 40); const A = this.area();
    Paper.rect(c, A.x, A.y, A.w, A.h, '#fffdf5', 18, { border: 4 });
    const hint = this.rt > 10;
    for (const o of this.items) { const isT = this.find.includes(o.e) && !this.items.some(q => q.found && q.e === o.e), w = (o.wob ? Math.sin(o.wob * 40) * 0.3 : 0) + (hint && isT && o === this.items.find(q => q.e === o.e) ? Math.sin(this.t * 10) * 0.25 : 0);
      if (o.found) Paper.circle(c, o.x, o.y, o.s * 0.62, 'rgba(255,215,60,0.6)', { border: 3 }); Kid.emoji(c, o.e, o.x, o.y, o.s, o.rot + w); }
    const P = Kid.portrait(), by = V.H - (P ? 80 : 58);
    Kid.text(c, '找出：', V.W / 2 - 170, by, 26, '#4a3520', 5);
    this.find.forEach((e, i) => { const x = V.W / 2 - 60 + i * 90, got = this.items.some(o => o.found && o.e === e); Paper.rect(c, x - 36, by - 36, 72, 72, got ? '#c8f0c0' : '#ffffff', 14, { border: 4 }); Kid.emoji(c, e, x, by, 50); if (got) Kid.text(c, '✓', x + 26, by - 26, 30, '#45ad4a', 4); });
  },
  hud() { return { L: `<b>${this.score}</b> 分`, R: `第 ${Math.min(this.k + 1, this.N)} / ${this.N} 關` }; },
});

// ---- 小車開回家 ----
registerGame({
  id: 'tracing', name: '小車開回家', icon: '🚗', color: '#e8453c', kid: true,
  desc: '用手指按住小車，沿著彎彎的馬路開回家！',
  howto: '用手指按住小車，沿著馬路慢慢拖，一路開到 🏠 家！手指要在馬路上，離開馬路小車就會停下來。一共 4 條路，越來越彎喔！',
  N: 4,
  start() { this.t = 0; this.score = 0; this.over = false; this.overText = '平安到家！'; this.k = 0; this.newRoad(); },
  newRoad() {
    const P = Kid.portrait(), top = P ? 170 : 120, pts = [], amp = 0.12 + this.k * 0.05, fr = 1 + this.k * 0.6, ph = rand(0, 6);
    for (let i = 0; i <= 200; i++) { const u = i / 200; if (P) pts.push({ x: V.W * (0.5 + Math.sin(u * Math.PI * 2 * fr + ph) * (0.18 + amp)), y: V.H - 70 - u * (V.H - 70 - top) }); else pts.push({ x: 90 + u * (V.W - 180), y: (top + V.H - 40) / 2 + Math.sin(u * Math.PI * 2 * fr + ph) * (V.H - top - 60) * (amp + 0.1) }); }
    this.pts = pts; this.idx = 0; this.held = false; this.rt = 0; this.doneT = 0; this.off = 0; this.roadW = P ? 44 : 50;
  },
  tap(x, y) { const p = this.pts[this.idx]; if (Math.hypot(p.x - x, p.y - y) < 70) { this.held = true; Sfx.play('honk'); } },
  update(dt) {
    this.t += dt; this.off = Math.max(0, this.off - dt);
    if (this.doneT) { this.doneT -= dt; if (this.doneT <= 0) { this.k++; if (this.k >= this.N) { this.over = true; return; } this.newRoad(); } return; }
    if (this.idx) this.rt += dt;
    if (!Input.down) { this.held = false; return; } if (!this.held) return;
    let moved = false;
    for (let j = Math.min(this.pts.length - 1, this.idx + 12); j > this.idx; j--) { const p = this.pts[j]; if (Math.hypot(p.x - Input.x, p.y - Input.y) < this.roadW) { this.idx = j; moved = true; break; } }
    if (!moved) { const p = this.pts[this.idx]; if (Math.hypot(p.x - Input.x, p.y - Input.y) > this.roadW * 1.6 && !this.off) { this.off = 1; Sfx.play('boing'); Kid.say('要在馬路上喔'); } }
    if (this.idx >= this.pts.length - 1) { const pts = Math.max(10, Math.round(40 - this.rt * 2)); this.score += pts; this.doneT = 1.8; this.held = false; Sfx.play('win'); Kid.say('到家了！'); const e = this.pts[this.pts.length - 1]; FX.burst(e.x, e.y, 24, undefined, 0.9); FX.text(V.W / 2, V.H * 0.3, `到家了！+${pts}`, '#ff7a00', 38); }
  },
  draw(c) {
    c.fillStyle = '#9fcf7e'; c.fillRect(-20, -20, V.W + 40, V.H + 40);
    for (let i = 0; i < 14; i++) Kid.emoji(c, i % 3 ? '🌳' : '🌼', (i * 233) % V.W, 140 + (i * 157) % (V.H - 140), i % 3 ? 40 : 26);
    const P = this.pts, road = (w, col, dash) => { c.save(); c.lineCap = 'round'; c.lineJoin = 'round'; c.strokeStyle = col; c.lineWidth = w; if (dash) c.setLineDash(dash); c.beginPath(); P.forEach((p, i) => i ? c.lineTo(p.x, p.y) : c.moveTo(p.x, p.y)); c.stroke(); c.restore(); };
    road(this.roadW * 2 + 12, Paper.PAPER); road(this.roadW * 2, '#6a6f7a'); road(4, '#ffffff', [18, 18]);
    c.save(); c.lineCap = 'round'; c.strokeStyle = 'rgba(255,215,60,0.6)'; c.lineWidth = 10; c.beginPath(); for (let i = 0; i <= this.idx; i++) i ? c.lineTo(P[i].x, P[i].y) : c.moveTo(P[i].x, P[i].y); c.stroke(); c.restore();
    const e = P[P.length - 1]; Kid.emoji(c, '🏠', e.x, e.y - 20, 80);
    const p = P[this.idx], q = P[Math.min(P.length - 1, this.idx + 3)], a = Math.atan2(q.y - p.y, q.x - p.x);
    c.save(); c.translate(p.x, p.y); c.rotate(a); c.scale(-1, 1); Kid.emoji(c, '🚗', 0, 0, 64, 0); c.restore();
    Kid.head(c, p.x, p.y - 38, 16, {}, 18);
    if (!this.held && !this.doneT) { const k = 1 + Math.sin(this.t * 6) * 0.15; c.strokeStyle = '#ffd23f'; c.lineWidth = 5; c.beginPath(); c.arc(p.x, p.y, 48 * k, 0, Math.PI * 2); c.stroke(); if (this.idx === 0) Kid.text(c, '按住小車往前拖！', V.W / 2, Kid.portrait() ? 140 : 96, 26, '#4a3520', 6); }
  },
  hud() { return { L: `<b>${this.score}</b> 分`, R: `第 ${Math.min(this.k + 1, this.N)} / ${this.N} 條路` }; },
});

// ---- 襪子配對 ----
registerGame({
  id: 'socks', name: '襪子配對', icon: '🧦', color: '#e86fae', kid: true,
  desc: '襪子都混在一起了！找出一模一樣的兩隻襪子。',
  howto: '洗好的襪子都亂掉了！點一隻襪子，再點跟它一模一樣（顏色和花紋都一樣）的另一隻，就配成一雙，夾到曬衣繩上！一共 3 籃。',
  COLS: ['#e8453c', '#3f8fe0', '#ffd23f', '#45ad4a', '#c77dff', '#ff9a2e', '#2a2a33', '#ff9ec2'], PAT: ['plain', 'stripe', 'dot', 'star'],
  start() { this.t = 0; this.score = 0; this.over = false; this.overText = '襪子都配好了！'; this.k = 0; this.newBasket(); },
  newBasket() {
    const n = [3, 5, 7][this.k], kinds = []; while (kinds.length < n) { const s = { col: pick(this.COLS), pat: pick(this.PAT) }; if (!kinds.some(q => q.col === s.col && q.pat === s.pat)) kinds.push(s); }
    const L = Kid.shuffle([...kinds, ...kinds].map((s, i) => ({ ...s, id: kinds.indexOf(s), done: 0, shake: 0 }))); this.socks = L; this.sel = null; this.line = []; this.doneT = 0;
    const P = Kid.portrait(), cols = P ? 3 : Math.min(7, Math.ceil(L.length / 2)), rows = Math.ceil(L.length / cols), top = P ? V.H * 0.36 : V.H * 0.38, w = Math.min((V.W - 40) / cols, (V.H - top - 30) / rows, 130);
    L.forEach((s, i) => { s.x = V.W / 2 + ((i % cols) - (cols - 1) / 2) * w; s.y = top + (Math.floor(i / cols) + 0.5) * w; s.s = w * 0.85; s.rot = rand(-0.4, 0.4); });
  },
  tap(x, y) {
    if (this.doneT) return;
    for (const s of this.socks) { if (s.done || Math.hypot(s.x - x, s.y - y) > s.s * 0.5) continue;
      if (!this.sel) { this.sel = s; Sfx.play('pop'); return; }
      if (this.sel === s) { this.sel = null; return; }
      if (this.sel.id === s.id) { s.done = this.sel.done = 1; this.line.push(s); this.score += 10; Sfx.play('ding'); FX.text(s.x, s.y - 50, '一雙！', '#ff7a00', 30); this.sel = null;
        if (this.socks.every(q => q.done)) { this.doneT = 1.6; Sfx.play('win'); Kid.say('全部配好了！'); } }
      else { s.shake = this.sel.shake = 0.5; Sfx.play('nope'); this.sel = null; }
      return; }
  },
  update(dt) { this.t += dt; for (const s of this.socks) s.shake = Math.max(0, s.shake - dt); if (this.doneT) { this.doneT -= dt; if (this.doneT <= 0) { this.k++; if (this.k >= 3) { this.over = true; return; } this.newBasket(); } } },
  sock(c, s, x, y, sz, rot) {
    c.save(); c.translate(x, y); c.rotate(rot); const k = sz / 100;
    c.scale(k, k);
    const path = cc => { cc.moveTo(-18, -46); cc.lineTo(18, -46); cc.lineTo(18, 14); cc.quadraticCurveTo(18, 38, 40, 38); cc.quadraticCurveTo(52, 44, 40, 52); cc.lineTo(-6, 52); cc.quadraticCurveTo(-18, 52, -18, 34); cc.closePath(); };
    Paper.shape(c, path, s.col, { border: 4, blur: 4 });
    c.save(); c.beginPath(); path(c); c.clip(); c.fillStyle = s.col === '#ffffff' || s.col === '#ffd23f' ? 'rgba(0,0,0,0.25)' : 'rgba(255,255,255,0.75)';
    if (s.pat === 'stripe') for (let yy = -40; yy < 54; yy += 16) c.fillRect(-30, yy, 90, 6);
    if (s.pat === 'dot') for (let yy = -36; yy < 54; yy += 16) for (let xx = -12; xx < 50; xx += 16) { c.beginPath(); c.arc(xx + (yy % 32 ? 8 : 0), yy, 4, 0, Math.PI * 2); c.fill(); }
    if (s.pat === 'star') { Paper.star(c, 0, -14, 12, c.fillStyle, 0, { border: 0, shadow: false }); Paper.star(c, 24, 42, 9, c.fillStyle, 0, { border: 0, shadow: false }); }
    c.restore(); c.fillStyle = 'rgba(255,255,255,0.85)'; c.fillRect(-18, -46, 36, 10); c.restore();
  },
  draw(c) {
    c.fillStyle = '#e8f4fb'; c.fillRect(-20, -20, V.W + 40, V.H + 40);
    const P = Kid.portrait(), ly = P ? 150 : 100; c.strokeStyle = '#8a5a34'; c.lineWidth = 3; c.beginPath(); c.moveTo(0, ly); c.quadraticCurveTo(V.W / 2, ly + 30, V.W, ly); c.stroke();
    this.line.forEach((s, i) => { const x = 40 + i * Math.min(70, (V.W - 80) / 7), y = ly + 34 + Math.sin(i) * 3; this.sock(c, s, x - 10, y + 30, 50, 0); this.sock(c, s, x + 10, y + 30, 50, 0); Paper.rect(c, x - 4, y - 8, 8, 20, '#c98a4b', 2, { border: 1 }); });
    Paper.shape(c, cc => cc.ellipse(V.W / 2, V.H * 0.94, V.W * 0.46, 30, 0, 0, Math.PI * 2), '#d9a066', { border: 4 });
    for (const s of this.socks) { if (s.done) continue; const sel = s === this.sel, sh = Math.sin(s.shake * 40) * s.shake * 12; if (sel) Paper.circle(c, s.x, s.y, s.s * 0.55, 'rgba(255,215,60,0.6)', { border: 0, shadow: false }); this.sock(c, s, s.x + sh, s.y - (sel ? 8 : 0), s.s, s.rot); }
  },
  hud() { return { L: `<b>${this.score}</b> 分`, R: `🧺 第 ${Math.min(this.k + 1, 3)} / 3 籃` }; },
});

// ---- 果汁機 ----
registerGame({
  id: 'smoothie', name: '果汁機', icon: '🍹', color: '#ff7a9a', kid: true,
  desc: '照著客人點的果汁，把對的水果放進果汁機！',
  howto: '客人會說想喝什麼果汁（上面的單子），點下面的水果把它們放進果汁機，放齊了就會打成果汁！放錯水果客人會說不要喔。一共 8 杯。',
  FR: [['🍓', '草莓', '#ff4d6d'], ['🍌', '香蕉', '#ffe066'], ['🍊', '橘子', '#ff9a2e'], ['🍇', '葡萄', '#8e4bc6'], ['🍉', '西瓜', '#ff6b6b'], ['🥝', '奇異果', '#7dcc5c'], ['🍍', '鳳梨', '#ffd23f'], ['🥕', '紅蘿蔔', '#ff8c42']],
  N: 8,
  start() { this.t = 0; this.score = 0; this.over = false; this.overText = '果汁店大成功！'; this.k = 0; this.newOrder(); },
  newOrder() { const n = this.k < 3 ? 2 : 3; this.order = Kid.shuffle(this.FR.slice()).slice(0, n); this.inJar = []; this.blendT = 0; this.doneT = 0; this.cust = pick(['👧', '👦', '👵', '👴', '👩', '👨']); this.tries = 0; this.sayOrder(); },
  sayOrder() { Kid.say(`我要${this.order.map(f => f[1]).join('加')}果汁`); },
  btn(i) { const P = Kid.portrait(), cols = P ? 4 : 8, w = P ? (V.W - 50) / 4 : Math.min(110, (V.W - 60) / 8); return { x: V.W / 2 + ((i % cols) - (cols - 1) / 2) * (w + 8), y: V.H - (P ? 70 + (1 - Math.floor(i / cols)) * (w + 8) : 70), w, h: w }; },
  tap(x, y) {
    if (this.blendT || this.doneT) return;
    for (let i = 0; i < this.FR.length; i++) if (Kid.hit(this.btn(i), x, y)) {
      const f = this.FR[i];
      if (this.order.includes(f) && !this.inJar.includes(f)) { this.inJar.push(f); Sfx.play('splash'); if (this.inJar.length === this.order.length) { this.blendT = 1.6; Sfx.play('blow'); } }
      else if (this.inJar.includes(f)) { Sfx.play('nope'); Kid.say(`${f[1]}已經放了喔`); }
      else { this.tries++; Sfx.play('nope'); Kid.say(`我沒有要${f[1]}喔`); }
      return;
    }
    if (y < V.H * 0.4) this.sayOrder();
  },
  update(dt) {
    this.t += dt;
    if (this.blendT) { this.blendT -= dt; if (this.blendT <= 0) { this.blendT = 0; this.doneT = 1.8; const pts = this.tries ? 5 : 15; this.score += pts; Sfx.play('ding'); Kid.say('好好喝！謝謝！'); FX.text(V.W / 2, V.H * 0.3, `好好喝！+${pts}`, '#ff7a9a', 36); } }
    else if (this.doneT) { this.doneT -= dt; if (this.doneT <= 0) { this.k++; if (this.k >= this.N) { this.over = true; return; } this.newOrder(); } }
  },
  mixCol() { const L = this.inJar; if (!L.length) return null; let r = 0, g = 0, b = 0; for (const f of L) { const h = parseInt(f[2].slice(1), 16); r += h >> 16; g += (h >> 8) & 255; b += h & 255; } return `rgb(${r / L.length | 0},${g / L.length | 0},${b / L.length | 0})`; },
  draw(c) {
    c.fillStyle = '#fff3e6'; c.fillRect(-20, -20, V.W + 40, V.H + 40); for (let i = 0; i < 10; i++) { c.fillStyle = i % 2 ? '#7dcc5c' : '#ffffff'; c.fillRect(i * V.W / 10, 0, V.W / 10 + 1, Kid.portrait() ? 110 : 64); }
    const P = Kid.portrait(), oy = P ? 180 : 120;
    Kid.emoji(c, this.cust, P ? 70 : V.W * 0.2, oy + 30, 90);
    Paper.rect(c, V.W / 2 - 150 + (P ? 40 : 0), oy - 40, 300, 100, '#ffffff', 18, { border: 4 });
    this.order.forEach((f, i) => { const x = V.W / 2 + (P ? 40 : 0) + (i - (this.order.length - 1) / 2) * 80, got = this.inJar.includes(f); Kid.emoji(c, f[0], x, oy + 2, 56); if (got) Kid.text(c, '✓', x + 24, oy - 22, 30, '#45ad4a', 4); });
    const jx = V.W / 2, jy = V.H * (P ? 0.52 : 0.55), jw = 130, jh = 170, sh = this.blendT ? Math.sin(this.t * 60) * 4 : 0;
    Paper.rect(c, jx - jw / 2 - 10 + sh, jy + jh / 2, jw + 20, 50, '#5a5f6a', 12, { border: 4 });
    const col = this.mixCol();
    c.save(); c.beginPath(); c.rect(jx - jw / 2 + sh, jy - jh / 2, jw, jh); c.clip();
    if (this.blendT || this.doneT) { c.fillStyle = col; c.fillRect(jx - jw / 2 + sh, jy - jh / 2 + jh * 0.2, jw, jh); }
    else this.inJar.forEach((f, i) => Kid.emoji(c, f[0], jx + (i - 1) * 34 + sh, jy + jh / 2 - 34 - (i % 2) * 30, 52));
    c.restore();
    c.strokeStyle = '#ffffff'; c.lineWidth = 6; c.strokeRect(jx - jw / 2 + sh, jy - jh / 2, jw, jh); c.strokeStyle = 'rgba(80,120,160,0.5)'; c.lineWidth = 3; c.strokeRect(jx - jw / 2 + sh, jy - jh / 2, jw, jh);
    if (this.doneT) { Kid.emoji(c, '🥤', jx + 140, jy, 80); }
    for (let i = 0; i < this.FR.length; i++) { const b = this.btn(i); Kid.button(c, b, '', '#fffdf5'); Kid.emoji(c, this.FR[i][0], b.x, b.y, b.w * 0.6); }
  },
  hud() { return { L: `<b>${this.score}</b> 分`, R: `🍹 第 ${Math.min(this.k + 1, this.N)} / ${this.N} 杯` }; },
});
