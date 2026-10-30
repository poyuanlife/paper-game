'use strict';
// =====================================================
//  寶寶問答第二彈：在哪裡、相反配對、天氣穿什麼、動物愛吃什麼
// =====================================================

// ---- 在哪裡 ----
const WHERE = [['上面', 0, -1], ['下面', 0, 1], ['左邊', -1, 0], ['右邊', 1, 0], ['裡面', 0, 0]];
const WHO = [['🐱', '小貓'], ['🐶', '小狗'], ['🐰', '兔子'], ['🐻', '小熊'], ['🐸', '青蛙'], ['🐥', '小雞']];
function drawWhere(c, who, pos, x, y, s) {
  const [, dx, dy] = pos, inside = !dx && !dy;
  if (!inside) Kid.emoji(c, '📦', x, y, s);
  const ax = x + dx * s * 0.78, ay = y + dy * s * 0.78;
  Kid.emoji(c, who, inside ? x : ax, inside ? y - s * 0.22 : ay, s * (inside ? 0.62 : 0.6));
  if (inside) { c.save(); c.beginPath(); c.rect(x - s, y - s * 0.12, s * 2, s); c.clip(); Kid.emoji(c, '📦', x, y, s); c.restore(); }
}
KidQuiz({
  id: 'whereis', name: '小動物在哪裡', icon: '📦', color: '#c98a4b',
  desc: '聽聽看小動物在箱子的上面、下面還是裡面？',
  howto: '聽題目：「小貓在箱子的上面」，從下面三張圖裡找出對的那一張！學會上面、下面、左邊、右邊、裡面。一共 10 題。',
  make(g) {
    const w = pick(WHO), set = Kid.shuffle(WHERE.slice()).slice(0, 3), ans = Math.floor(Math.random() * 3), t = `${w[1]}在箱子的${set[ans][0]}`;
    return { who: w, opts: set, ans, text: t + '，是哪一張？', say: t + '，是哪一張？', right: `答對了！${t}！`, wrong: o => `這張是在${o[0]}喔` };
  },
  drawQ(c, g, x, y) {
    Kid.emoji(c, g.Q.who[0], x - 70, y - 20, 90); Kid.emoji(c, '📦', x + 70, y - 10, 90);
    Kid.text(c, `在箱子的「${g.Q.opts[g.Q.ans][0]}」`, x, y + 80, 30, '#c9772f', 6);
  },
  drawOpt(c, g, o, x, y, w) { drawWhere(c, g.Q.who[0], o, x, y + 4, w * 0.36); },
});

// ---- 相反配對 ----
const OPP = [
  [['🐘', '大'], ['🐭', '小']], [['🔥', '熱'], ['🧊', '冷']], [['☀️', '白天'], ['🌙', '晚上']], [['🐢', '慢'], ['🚀', '快']],
  [['😄', '開心'], ['😢', '難過']], [['🦒', '高'], ['🐛', '矮']], [['🍬', '甜'], ['🍋', '酸']], [['💡', '亮'], ['🌑', '暗']],
];
KidQuiz({
  id: 'opposites', name: '相反配對', icon: '🔄', color: '#e9654b',
  desc: '大對小、熱對冷，找出相反的那一個！',
  howto: '上面有一個東西，例如 🔥 很「熱」。從下面找出跟它「相反」的那一個（很「冷」的 🧊）！一共 10 題。',
  make(g) {
    const P = pick(OPP), s = Math.random() < 0.5 ? 0 : 1, given = P[s], ans0 = P[1 - s];
    const others = Kid.shuffle(OPP.filter(p => p !== P).map(p => p[Math.floor(Math.random() * 2)])).slice(0, 2), opts = Kid.shuffle([ans0, ...others]);
    return { given, opts, ans: opts.indexOf(ans0), text: `跟「${given[1]}」相反的是哪一個？`, say: `${given[1]}，相反的是哪一個？`, right: `答對了！${given[1]}和${ans0[1]}是相反的！`, wrong: o => `這是${o[1]}喔` };
  },
  drawQ(c, g, x, y) { Kid.emoji(c, g.Q.given[0], x, y - 20, 110); Kid.text(c, g.Q.given[1], x, y + 80, 40, '#e9654b', 6); },
  drawOpt(c, g, o, x, y, w) { Kid.emoji(c, o[0], x, y - w * 0.08, w * 0.5); if (g.doneT) Kid.text(c, o[1], x, y + w * 0.32, w * 0.16, '#4a3520', 4); },
});

// ---- 天氣穿什麼 ----
const WEA = [
  ['☀️', '大太陽好熱', ['🕶️', '👒', '🍦']], ['❄️', '下雪好冷', ['🧣', '🧤', '🧥']], ['🌧️', '下雨了', ['☂️', '☔', '🌂']],
  ['🌙', '晚上要睡覺了', ['🧸', '🛏️', '💤']], ['🏖️', '去海邊玩', ['🏊', '🐚', '⛱️']],
];
KidQuiz({
  id: 'weather', name: '天氣要用什麼', icon: '⛅', color: '#3f8fe0',
  desc: '下雨天要帶什麼？下雪要穿什麼？',
  howto: '上面是今天的天氣，從下面找出最適合的東西！例如下雨要帶 ☂️ 雨傘、下雪要圍 🧣 圍巾。一共 10 題。',
  make(g) {
    const W = pick(WEA), right = pick(W[2]), others = Kid.shuffle(WEA.filter(w => w !== W)).slice(0, 2).map(w => pick(w[2])), opts = Kid.shuffle([right, ...others]);
    return { W, opts, ans: opts.indexOf(right), text: `${W[1]}，要用哪一個？`, say: `${W[1]}，要用哪一個？`, right: '答對了！', wrong: () => '再想想看喔' };
  },
  drawQ(c, g, x, y) { Kid.emoji(c, g.Q.W[0], x, y - 20, 120); Kid.text(c, g.Q.W[1], x, y + 82, 34, '#3f8fe0', 6); },
  drawOpt(c, g, o, x, y, w) { Kid.emoji(c, o, x, y, w * 0.58); },
});

// ---- 動物愛吃什麼 ----
const EAT = [['🐰', '兔子', '🥕'], ['🐵', '猴子', '🍌'], ['🐶', '小狗', '🦴'], ['🐱', '小貓', '🐟'], ['🐼', '熊貓', '🎋'], ['🐭', '老鼠', '🧀'], ['🐻', '小熊', '🍯'], ['🐔', '母雞', '🌽'], ['🐄', '乳牛', '🌾']];
KidQuiz({
  id: 'yummy', name: '動物愛吃什麼', icon: '🥕', color: '#ff9a2e',
  desc: '兔子愛吃什麼？猴子愛吃什麼？餵牠吃吧！',
  howto: '上面的小動物肚子餓了！從下面找出牠最愛吃的東西餵牠。例如 🐰 兔子愛吃 🥕 紅蘿蔔。一共 10 題。',
  make(g, q) {
    const A = EAT[(Math.floor(Math.random() * EAT.length) + q) % EAT.length], others = Kid.shuffle(EAT.filter(e => e !== A)).slice(0, q < 4 ? 1 : 2).map(e => e[2]), opts = Kid.shuffle([A[2], ...others]);
    return { A, opts, ans: opts.indexOf(A[2]), text: `${A[1]}愛吃什麼？`, say: `${A[1]}肚子餓了，牠愛吃什麼？`, right: `好吃！${A[1]}吃飽了！`, wrong: () => '牠不吃這個喔' };
  },
  drawQ(c, g, x, y) {
    const eat = g.doneT > 0, k = eat ? 1 + Math.abs(Math.sin(g.t * 10)) * 0.08 : 1;
    Kid.emoji(c, g.Q.A[0], x, y - 10, 130 * k);
    if (eat) Kid.emoji(c, g.Q.opts[g.Q.ans], x + 60, y + 30, 60 * Math.max(0, g.doneT / 1.5));
    else Kid.emoji(c, '💭', x + 90, y - 80, 60);
  },
  drawOpt(c, g, o, x, y, w) { Kid.emoji(c, o, x, y, w * 0.58); },
});
