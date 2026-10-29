'use strict';
// 翻牌配對：翻兩張一樣的就配對成功。共 3 關（3 對 → 6 對 → 8 對），其中一對是紙片人自己！
// 沒有時間限制、不會輸，給小小孩玩。
registerGame({
  id: 'memory', name: '翻牌配對', icon: '🃏', color: '#9b6bd6', kid: true,
  desc: '翻兩張一樣的牌，找出所有配對！',
  howto: '點一張牌把它翻開，再翻一張。兩張一樣就配對成功！有一對牌是你的紙片人喔。一共 3 關，不限時間，翻錯越少分數越高。',
  FACES: ['🐶', '🐱', '🐰', '🐻', '🐼', '🦊', '🐸', '🐵', '🐷', '🐤', '🍎', '🍌', '🍓', '🍉', '🚗', '🌈'],
  LEVELS: [3, 6, 8],
  BACKS: ['#9b6bd6', '#3fa9e0', '#e9654b'],
  EMOJI: '"Segoe UI Emoji","Apple Color Emoji","Noto Color Emoji",sans-serif',

  start() {
    this.t = 0; this.score = 0; this.over = false; this.overText = '全部配對成功！';
    this.level = 0; this.cheer = 0; this.newLevel();
  },
  newLevel() {
    const n = this.LEVELS[this.level], faces = this.FACES.slice().sort(() => Math.random() - 0.5).slice(0, n - 1).concat(['ME']);
    const deck = faces.concat(faces).sort(() => Math.random() - 0.5);
    this.cards = deck.map((f, i) => ({ f, i, open: 0, show: 0, matched: false, pop: 0, deal: i * 0.05 }));
    this.picked = []; this.waitT = 0; this.miss = 0; this.doneT = 0; this.levelT = 0;
  },
  // 牌的位置：直向時排在上面，紙片人站下面；橫向時紙片人站左邊
  grid() {
    const n = this.cards.length, portrait = V.W < 700;
    const [cols, rows] = portrait ? (n === 6 ? [2, 3] : n === 12 ? [3, 4] : [4, 4]) : (n === 6 ? [3, 2] : n === 12 ? [4, 3] : [4, 4]);
    const ax = portrait ? 12 : V.W * 0.3, aw = portrait ? V.W - 24 : V.W * 0.67, ay = V.H * 0.12, ah = portrait ? V.H * 0.62 : V.H * 0.84;
    const cell = Math.min(aw / cols, ah / rows / 1.25), w = cell * 0.9, h = cell * 1.12;
    const gx = ax + (aw - cell * cols) / 2, gy = ay + (ah - cell * 1.25 * rows) / 2;
    return this.cards.map((c, i) => ({ x: gx + cell * (i % cols + 0.5), y: gy + cell * 1.25 * (Math.floor(i / cols) + 0.5), w, h }));
  },
  get pupX() { return V.W < 700 ? V.W / 2 : V.W * 0.15; },
  get pupH() { return V.W < 700 ? Math.min(V.H * 0.24, 220) : Math.min(V.H * 0.5, 340); },

  tap(x, y) {
    if (this.waitT > 0 || this.doneT > 0) return;
    const G = this.grid();
    for (const card of this.cards) {
      const g = G[card.i];
      if (Math.abs(x - g.x) > g.w / 2 + 4 || Math.abs(y - g.y) > g.h / 2 + 4) continue;
      if (card.open || card.matched) return;
      card.open = 1; this.picked.push(card); Sfx.play('flip');
      if (this.picked.length === 2) {
        const [a, b] = this.picked;
        if (a.f === b.f) {
          a.matched = b.matched = true; a.pop = b.pop = 1; this.picked = [];
          const pts = a.f === 'ME' ? 30 : 20; this.score += pts; this.cheer = 1.2;
          Sfx.play('star'); for (const q of [a, b]) FX.burst(G[q.i].x, G[q.i].y, 12, undefined, 0.6);
          FX.text((G[a.i].x + G[b.i].x) / 2, (G[a.i].y + G[b.i].y) / 2, a.f === 'ME' ? '是我耶！' : pick(['一樣！', '答對了！', '好棒！']), '#ff7a00', 38);
          FX.text(G[b.i].x, G[b.i].y - g.h * 0.3, '+' + pts, '#3d8b2a', 28);
          if (this.cards.every(c => c.matched)) { this.doneT = 1.6; this.justDone = true; }
        } else { this.miss++; this.waitT = 0.9; FX.text((G[a.i].x + G[b.i].x) / 2, (G[a.i].y + G[b.i].y) / 2, pick(['再試試看～', '不一樣耶', '差一點！']), '#7a62b8', 30); }
      }
      return;
    }
  },

  update(dt) {
    this.t += dt; this.levelT += dt; this.cheer = Math.max(0, this.cheer - dt);
    for (const c of this.cards) { c.show += ((c.open || c.matched ? 1 : 0) - c.show) * Math.min(1, dt * 12); c.pop = Math.max(0, c.pop - dt * 2); }
    if (this.waitT > 0) { this.waitT -= dt; if (this.waitT <= 0) { for (const c of this.picked) c.open = 0; this.picked = []; Sfx.play('flip'); } }
    if (this.doneT > 0) {
      this.doneT -= dt;
      if (this.justDone) {   // 這一關剛完成：翻錯越少獎勵越多
        this.justDone = false;
        const n = this.LEVELS[this.level], bonus = Math.max(10, n * 10 - this.miss * 5);
        this.score += bonus; Sfx.play('win'); FX.burst(V.W / 2, V.H * 0.4, 36, undefined, 1.2);
        FX.text(V.W / 2, V.H * 0.38, this.level + 1 < this.LEVELS.length ? `第 ${this.level + 1} 關過關！` : '全部完成！', '#e0573c', 48);
        FX.text(V.W / 2, V.H * 0.46, `獎勵 +${bonus}`, '#3d8b2a', 32);
      }
      if (this.doneT <= 0) { this.level++; if (this.level >= this.LEVELS.length) { this.over = true; return; } this.newLevel(); }
    }
  },

  drawCard(c, card, g) {
    const deal = clamp((this.levelT - card.deal) / 0.25, 0, 1); if (!deal) return;
    const flip = Math.cos(card.show * Math.PI), front = card.show > 0.5, s = (0.6 + 0.4 * deal) * (1 + card.pop * 0.12);
    c.save(); c.translate(g.x, g.y); c.scale(Math.max(0.02, Math.abs(flip)) * s, s); c.globalAlpha = deal;
    const w = g.w, h = g.h, r = Math.min(w, h) * 0.12;
    if (!front) {
      Paper.rect(c, -w / 2, -h / 2, w, h, this.BACKS[this.level % 3], r, { border: 5 });
      c.strokeStyle = 'rgba(255,255,255,0.45)'; c.lineWidth = 3; c.beginPath(); Paper.rrect(c, -w / 2 + 9, -h / 2 + 9, w - 18, h - 18, r * 0.6); c.stroke();
      Paper.star(c, 0, 0, Math.min(w, h) * 0.2, '#ffe07a', 0, { border: 3, blur: 3 });
    } else {
      Paper.rect(c, -w / 2, -h / 2, w, h, card.matched ? '#fff6d6' : '#fffdf5', r, { border: 5, edge: card.matched ? '#ffd23f' : undefined });
      if (card.f === 'ME') {
        c.save(); c.beginPath(); Paper.rrect(c, -w / 2 + 4, -h / 2 + 4, w - 8, h - 8, r); c.clip();
        const u = Puppet.size(App.pup, 100), PH = Math.min(h * 0.8, w * 0.85 / (u.w / 100)), sh = Puppet.size(App.pup, PH).h;
        Puppet.draw(c, App.pup, 0, sh / 2, PH, card.matched ? Puppet.Poses.cheer(this.t) : Puppet.Poses.idle(this.t), { shadow: false });
        c.restore();
      } else {
        c.font = `${Math.round(Math.min(w, h) * 0.58)}px ${this.EMOJI}`; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(card.f, 0, h * 0.03);
      }
    }
    c.restore();
  },

  draw(c) {
    const T = Paper.bg(c, 'orchard', 0, this.t), portrait = V.W < 700, gy = V.H * 0.95;
    c.fillStyle = T.ground; c.fillRect(-20, gy, V.W + 40, V.H);
    Paper.rect(c, -20, gy - 8, V.W + 40, 18, T.grass, 4, { blur: 4 });
    const P = Puppet.Poses, pose = this.cheer || this.doneT > 0 ? P.cheer(this.t) : P.idle(this.t);
    if (!portrait || V.H > 640) Puppet.draw(c, App.pup, this.pupX, gy, this.pupH, pose);
    const G = this.grid();
    for (const card of this.cards) this.drawCard(c, card, G[card.i]);
  },
  hud() {
    const n = this.LEVELS[this.level] || 0, got = this.cards.filter(c => c.matched).length / 2;
    return { L: `<b>${this.score}</b> 分`, R: `第 ${Math.min(this.level + 1, 3)} / 3 關　🃏 ${got} / ${n}` };
  },
});
