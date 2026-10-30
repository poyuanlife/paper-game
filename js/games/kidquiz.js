'use strict';
// =====================================================
//  小小孩的動腦題：影子配對、哪個不一樣、規律接龍、認時鐘
//  共用：題目 + 選項按鈕，答對念出來，答錯告訴你
// =====================================================
function KidQuiz(cfg) {
  registerGame(Object.assign({
    kid: true, N: 10,
    start() { this.t = 0; this.score = 0; this.over = false; this.overText = cfg.end || '全部答完了！'; this.q = 0; this.cheer = 0; this.newQ(); },
    onEnter(prev) { if (prev === 'ready' && this.Q.say) Kid.say(this.Q.say); },
    newQ() { this.Q = cfg.make(this, this.q); this.opts = this.Q.opts.map((o, i) => ({ o, i, shake: 0, off: false, pop: 0 })); this.tries = 0; this.doneT = 0; if (this.q && this.Q.say) Kid.say(this.Q.say); },
    btn(i) {
      const n = this.opts.length, P = Kid.portrait(), w = Math.min(P ? (V.W - 40) / Math.min(n, 3) - 14 : 170, 170), cols = P ? Math.min(n, 3) : n, r = Math.floor(i / cols), k = i % cols, inRow = Math.min(cols, n - r * cols);
      return { x: V.W / 2 + (k - (inRow - 1) / 2) * (w + 14), y: V.H * (P ? 0.66 : 0.72) + r * (w + 14), w, h: w };
    },
    tap(x, y) {
      if (this.doneT) return;
      for (const b of this.opts) { const r = this.btn(b.i); if (b.off || !Kid.hit(r, x, y)) continue;
        if (b.i === this.Q.ans) { b.pop = 1; this.score += this.tries ? 5 : 10; this.cheer = 1.2; this.doneT = 1.5; Sfx.play('ding'); FX.burst(r.x, r.y, 18, undefined, 0.8); Kid.say(this.Q.right || '答對了！'); FX.text(r.x, r.y - r.h * 0.7, '答對了！', '#ff7a00', 34); }
        else { b.shake = 0.5; b.off = true; this.tries++; Sfx.play('nope'); Kid.say(this.Q.wrong ? this.Q.wrong(b.o) : '再想想看'); }
        return; }
    },
    key(k) { const i = ['1', '2', '3', '4'].indexOf(k); if (i >= 0 && this.opts[i]) { const r = this.btn(i); this.tap(r.x, r.y); } },
    update(dt) { this.t += dt; this.cheer = Math.max(0, this.cheer - dt); for (const b of this.opts) { b.shake = Math.max(0, b.shake - dt); b.pop = Math.max(0, b.pop - dt * 2); } if (this.doneT) { this.doneT -= dt; if (this.doneT <= 0) { if (this.q + 1 >= this.N) { this.over = true; return; } this.q++; this.newQ(); } } },
    draw(c) {
      const gy = Kid.ground(c, cfg.theme || 'meadow', this.t, 0.97), P = Kid.portrait();
      const qy = P ? V.H * 0.34 : V.H * 0.36; Paper.rect(c, V.W / 2 - Math.min(V.W - 30, 560) / 2, qy - (P ? 150 : 140), Math.min(V.W - 30, 560), P ? 260 : 230, '#fffdf5', 24, { border: 5 });
      cfg.drawQ(c, this, V.W / 2, qy - 10);
      if (this.Q.text) Kid.text(c, this.Q.text, V.W / 2, P ? 125 : 72, 28, '#4a3520');
      for (const b of this.opts) { const r = this.btn(b.i), sh = Math.sin(b.shake * 40) * b.shake * 14; c.save(); c.globalAlpha = b.off ? 0.4 : 1; c.translate(sh, 0); Paper.rect(c, r.x - r.w / 2, r.y - r.h / 2 - b.pop * 10, r.w, r.h, b.pop ? '#fff1b8' : '#ffffff', 20, { border: 5 }); cfg.drawOpt(c, this, b.o, r.x, r.y - b.pop * 10, r.w); c.restore(); }
      if (!P) Puppet.draw(c, App.pup, 100, gy, Math.min(V.H * 0.4, 260), this.cheer ? Puppet.Poses.cheer(this.t) : Puppet.Poses.idle(this.t));
    },
    hud() { return { L: `<b>${this.score}</b> 分`, R: `第 ${this.q + 1} / ${this.N} 題` }; },
  }, cfg));
}

// 把 emoji 畫成黑色影子
const Silhouette = (() => {
  const cache = {};
  return (c, e, x, y, s) => {
    const k = e + s; if (!cache[k]) { const o = document.createElement('canvas'); o.width = o.height = Math.ceil(s * 1.3); const x2 = o.getContext('2d'); Kid.emoji(x2, e, o.width / 2, o.height / 2, s); x2.globalCompositeOperation = 'source-in'; x2.fillStyle = '#2a2a3a'; x2.fillRect(0, 0, o.width, o.height); cache[k] = o; }
    const o = cache[k]; c.drawImage(o, x - o.width / 2, y - o.height / 2);
  };
})();

const QZ = {
  animals: [['🐶', '小狗'], ['🐱', '小貓'], ['🐰', '兔子'], ['🐘', '大象'], ['🦒', '長頸鹿'], ['🐢', '烏龜'], ['🐟', '魚'], ['🦋', '蝴蝶'], ['🐔', '雞'], ['🐴', '馬'], ['🐧', '企鵝'], ['🦀', '螃蟹']],
  things: [['🍎', '蘋果'], ['🍌', '香蕉'], ['✈️', '飛機'], ['🚗', '車子'], ['☂️', '雨傘'], ['🎸', '吉他'], ['⏰', '鬧鐘'], ['🔑', '鑰匙'], ['✂️', '剪刀'], ['🏠', '房子'], ['⭐', '星星'], ['🌙', '月亮']],
  groups: [['水果', ['🍎', '🍌', '🍇', '🍓', '🍉', '🍊', '🍒']], ['動物', ['🐶', '🐱', '🐰', '🐻', '🐼', '🐸', '🐵']], ['交通工具', ['🚗', '🚌', '✈️', '🚲', '🚂', '🚀', '🚢']], ['衣服', ['👕', '👖', '👗', '🧦', '🧢', '👟', '🧣']], ['花草', ['🌸', '🌻', '🌷', '🌹', '🌼', '🍀', '🌵']]],
};

KidQuiz({
  id: 'shadow', name: '影子配對', icon: '👤', color: '#5b6fd6',
  desc: '看黑黑的影子，猜猜是誰的影子？',
  howto: '上面有一個黑黑的影子，猜猜看是誰的影子？點下面正確的那一個！一共 10 題。',
  make(g, q) { const pool = q % 2 ? QZ.things : QZ.animals, set = Kid.shuffle(pool.slice()).slice(0, q < 5 ? 3 : 4), ans = Math.floor(Math.random() * set.length); return { opts: set, ans, text: '這是誰的影子？', say: '這是誰的影子？', right: `答對了！是${set[ans][1]}！`, wrong: o => `這是${o[1]}喔` }; },
  drawQ(c, g, x, y) { Silhouette(c, g.Q.opts[g.Q.ans][0], x, y, Kid.portrait() ? 150 : 140); if (g.doneT) { c.globalAlpha = Math.min(1, (1.5 - g.doneT) * 3); Kid.emoji(c, g.Q.opts[g.Q.ans][0], x, y, Kid.portrait() ? 150 : 140); c.globalAlpha = 1; } },
  drawOpt(c, g, o, x, y, w) { Kid.emoji(c, o[0], x, y, w * 0.6); },
});

KidQuiz({
  id: 'oddone', name: '哪個不一樣', icon: '🔍', color: '#2fa58c',
  desc: '四個東西裡面，哪一個跟別人不一樣？',
  howto: '下面有四個東西，有三個是同一類的（例如都是水果），找出那個「不一樣」的！一共 10 題。',
  make(g) { const [A, B] = Kid.shuffle(QZ.groups.slice()).slice(0, 2), same = Kid.shuffle(A[1].slice()).slice(0, 3), odd = pick(B[1]), opts = Kid.shuffle(same.concat([odd])); return { opts, ans: opts.indexOf(odd), text: '哪一個不一樣？', say: '哪一個不一樣？', right: `答對了！其他都是${A[0]}`, wrong: () => `這個也是${A[0]}喔` }; },
  drawQ(c, g, x, y) { Kid.emoji(c, '🔍', x, y - 10, 110); Kid.text(c, '找出不同類的！', x, y + 80, 26, '#2fa58c', 0); },
  drawOpt(c, g, o, x, y, w) { Kid.emoji(c, o, x, y, w * 0.6); },
});

KidQuiz({
  id: 'pattern', name: '規律接龍', icon: '🔁', color: '#ff9a2e',
  desc: '看看排列的規律，下一個是什麼？',
  howto: '上面的東西照著規律排隊，例如 🍎🍌🍎🍌… 猜猜看「？」應該放哪一個？點下面正確的答案！一共 10 題。',
  make(g, q) {
    const P = [[0, 1], [0, 0, 1], [0, 1, 1], [0, 1, 2], [0, 1, 2, 1]][Math.min(4, Math.floor(q / 2))], items = Kid.shuffle(pick(QZ.groups)[1].slice()).slice(0, 3);
    const len = Math.max(5, P.length * 2 + 1), seq = [...Array(len)].map((_, i) => items[P[i % P.length]]), ans = items[P[len % P.length]];
    const opts = Kid.shuffle(items.slice(0, Math.max(2, Math.max(...P) + 1)).concat(Math.max(...P) < 2 ? [items[2]] : [])).slice(0, 3); return { seq, opts, ans: opts.indexOf(ans), text: '下一個是什麼？', say: '下一個是什麼？', right: '答對了！' };
  },
  drawQ(c, g, x, y) { const s = g.Q.seq, n = s.length + 1, w = Math.min(64, (Math.min(V.W - 60, 520)) / n); s.forEach((e, i) => Kid.emoji(c, e, x + (i - (n - 1) / 2) * w, y, w * 0.85)); const qx = x + (n - 1 - (n - 1) / 2) * w; if (g.doneT) Kid.emoji(c, g.Q.opts[g.Q.ans], qx, y, w * 0.85); else { Paper.rect(c, qx - w * 0.45, y - w * 0.45, w * 0.9, w * 0.9, '#fff1b8', 10, { border: 3 }); Kid.text(c, '?', qx, y + 2, w * 0.6, '#ff7a00', 0); } },
  drawOpt(c, g, o, x, y, w) { Kid.emoji(c, o, x, y, w * 0.6); },
});

KidQuiz({
  id: 'clock', name: '認時鐘', icon: '🕒', color: '#3f8fe0',
  desc: '看時鐘的長針短針，現在是幾點？',
  howto: '看看時鐘：短短的針指著「幾點」，長長的針指到最上面就是「整點」，指到最下面就是「半」。點下面正確的時間！一共 10 題。',
  ZH: ['十二', '一', '兩', '三', '四', '五', '六', '七', '八', '九', '十', '十一', '十二'],
  make(g, q) {
    const half = q >= 4 && Math.random() < 0.5, h = 1 + Math.floor(Math.random() * 12), fmt = (H, M) => `${H}:${M ? '30' : '00'}`;
    const set = new Set([fmt(h, half)]), opts = [{ h, m: half }]; while (opts.length < 3) { const hh = 1 + Math.floor(Math.random() * 12), mm = q >= 4 ? Math.random() < 0.5 : false; if (set.has(fmt(hh, mm))) continue; set.add(fmt(hh, mm)); opts.push({ h: hh, m: mm }); }
    const o = Kid.shuffle(opts); return { h, m: half, opts: o, ans: o.findIndex(x => x.h === h && x.m === half), text: '現在是幾點？', say: '現在是幾點？', right: `答對了！${this.ZH[h]}點${half ? '半' : ''}` };
  },
  drawQ(c, g, x, y) {
    const R = Kid.portrait() ? 100 : 95; Paper.circle(c, x, y, R, '#ffffff', { border: 6 }); c.strokeStyle = '#3f8fe0'; c.lineWidth = 6; c.beginPath(); c.arc(x, y, R, 0, Math.PI * 2); c.stroke();
    for (let i = 1; i <= 12; i++) { const a = i / 12 * Math.PI * 2 - Math.PI / 2; Kid.text(c, String(i), x + Math.cos(a) * R * 0.78, y + Math.sin(a) * R * 0.78 + 1, R * 0.2, '#4a3520', 0); }
    const ha = ((g.Q.h % 12) + (g.Q.m ? 0.5 : 0)) / 12 * Math.PI * 2 - Math.PI / 2, ma = (g.Q.m ? 0.5 : 0) * Math.PI * 2 - Math.PI / 2;
    c.lineCap = 'round'; c.strokeStyle = '#e8453c'; c.lineWidth = 10; c.beginPath(); c.moveTo(x, y); c.lineTo(x + Math.cos(ha) * R * 0.48, y + Math.sin(ha) * R * 0.48); c.stroke();
    c.strokeStyle = '#3f6fe0'; c.lineWidth = 6; c.beginPath(); c.moveTo(x, y); c.lineTo(x + Math.cos(ma) * R * 0.75, y + Math.sin(ma) * R * 0.75); c.stroke(); Paper.circle(c, x, y, 8, '#4a3520', { border: 0 });
  },
  drawOpt(c, g, o, x, y, w) { Kid.text(c, `${o.h}:${o.m ? '30' : '00'}`, x, y + 2, w * 0.28, '#3f6fe0', 0); },
});
