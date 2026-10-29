'use strict';
// 形狀配對：把下面的彩色形狀拖到上面一樣形狀的影子裡。3 關（3 → 4 → 6 個形狀），不限時間。
registerGame({
  id: 'shapes', name: '形狀配對', icon: '🔷', color: '#3f5bd6', kid: true,
  desc: '把形狀放進一樣的影子裡，認識圓形、三角形…',
  howto: '用手指把下面的彩色形狀，拖到上面一樣形狀的影子裡。放對了會念出形狀的名字！一共 3 關，不限時間。',
  SHAPES: [['circle', '圓形', '#e8453c'], ['square', '正方形', '#3fa9e0'], ['triangle', '三角形', '#45ad4a'], ['star', '星星', '#ffcc1f'], ['heart', '愛心', '#ff7eb6'], ['diamond', '菱形', '#9b5bd6'], ['moon', '月亮', '#ff8a1f']],
  LEVELS: [3, 4, 6],

  start() { this.t = 0; this.score = 0; this.over = false; this.overText = '形狀全都認識了！'; this.level = 0; this.cheer = 0; this.drag = Kid.makeDrag(); this.newLevel(); },
  onEnter(prev) { if (prev === 'ready') Kid.say('把形狀放進一樣的影子裡'); },
  newLevel() {
    const n = this.LEVELS[this.level], set = Kid.shuffle(this.SHAPES.slice()).slice(0, n);
    this.holes = Kid.shuffle(set.slice()).map((s, i) => ({ s, i, filled: false, pop: 0 }));
    this.pieces = Kid.shuffle(set.slice()).map((s, i) => ({ s, i, x: 0, y: 0, home: true, done: false, shake: 0 }));
    this.doneT = 0;
  },
  size() { const n = this.LEVELS[this.level], per = Kid.portrait() ? Math.min(n, 3) : n; return Math.min(110, (V.W - 40) / per * 0.62); },
  holePos(i) {
    const n = this.holes.length, P = Kid.portrait(), per = P ? Math.min(n, 3) : n, rows = Math.ceil(n / per), r = Math.floor(i / per), inRow = Math.min(per, n - r * per), c = i % per;
    const gap = (V.W - 40) / per, y = (P ? V.H * 0.2 : V.H * 0.24) + r * this.size() * 1.6;
    return { x: V.W / 2 + (c - (inRow - 1) / 2) * gap, y };
  },
  homePos(i) {
    const n = this.pieces.length, P = Kid.portrait(), per = P ? Math.min(n, 3) : n, r = Math.floor(i / per), inRow = Math.min(per, n - r * per), c = i % per;
    const gap = (V.W - 40) / per, rowsH = this.size() * 1.5, y = (P ? V.H * 0.9 : V.H * 0.82) - (Math.ceil(n / per) - 1 - r) * rowsH;
    return { x: V.W / 2 + (c - (inRow - 1) / 2) * gap, y };
  },
  path(c, kind, r) {
    c.beginPath();
    if (kind === 'circle') c.arc(0, 0, r, 0, Math.PI * 2);
    else if (kind === 'square') Paper.rrect(c, -r * 0.88, -r * 0.88, r * 1.76, r * 1.76, r * 0.12);
    else if (kind === 'triangle') { c.moveTo(0, -r); c.lineTo(r * 1.05, r * 0.8); c.lineTo(-r * 1.05, r * 0.8); c.closePath(); }
    else if (kind === 'diamond') { c.moveTo(0, -r * 1.1); c.lineTo(r * 0.8, 0); c.lineTo(0, r * 1.1); c.lineTo(-r * 0.8, 0); c.closePath(); }
    else if (kind === 'star') { for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, rr = i % 2 ? r * 0.48 : r * 1.08; c.lineTo(Math.cos(a) * rr, Math.sin(a) * rr + r * 0.08); } c.closePath(); }
    else if (kind === 'heart') { c.moveTo(0, r * 0.95); c.bezierCurveTo(-r * 1.4, -r * 0.1, -r * 0.6, -r * 1.2, 0, -r * 0.45); c.bezierCurveTo(r * 0.6, -r * 1.2, r * 1.4, -r * 0.1, 0, r * 0.95); c.closePath(); }
    else if (kind === 'moon') { c.arc(0, 0, r, Math.PI * 0.3, Math.PI * 1.7); c.arc(r * 0.45, 0, r * 0.78, Math.PI * 1.62, Math.PI * 0.38, true); c.closePath(); }
  },
  drawShape(c, kind, x, y, r, col, opt = {}) {
    c.save(); c.translate(x, y); if (opt.rot) c.rotate(opt.rot); if (opt.scale) c.scale(opt.scale, opt.scale);
    if (opt.hole) { c.fillStyle = 'rgba(60,40,20,0.22)'; this.path(c, kind, r); c.fill(); c.setLineDash([8, 7]); c.lineWidth = 4; c.strokeStyle = 'rgba(60,40,20,0.45)'; c.stroke(); c.setLineDash([]); }
    else Paper.shape(c, cc => this.path(cc, kind, r), col, { border: 5, blur: opt.lift ? 16 : 6, oy: opt.lift ? 10 : 4 });
    c.restore();
  },
  tap(x, y) {
    if (this.doneT) return;
    const r = this.size() / 2;
    for (const p of this.pieces) { if (p.done || Math.hypot(x - p.x, y - p.y) > r * 1.3) continue; p.home = false; this.drag.grab(p, x, y); Sfx.play('click'); return; }
  },
  update(dt) {
    this.t += dt; this.cheer = Math.max(0, this.cheer - dt);
    for (const h of this.holes) h.pop = Math.max(0, h.pop - dt * 2.5);
    for (const p of this.pieces) {
      p.shake = Math.max(0, p.shake - dt);
      if (p.home) { const q = this.homePos(p.i); if (!p.x && !p.y) { p.x = q.x; p.y = q.y; } p.x += (q.x - p.x) * Math.min(1, dt * 12); p.y += (q.y - p.y) * Math.min(1, dt * 12); }
      if (p.done) { const q = this.holePos(p.hole.i); p.x = q.x; p.y = q.y; }
    }
    this.drag.step(p => {
      const r = this.size() / 2;
      const h = this.holes.find(h => !h.filled && Math.hypot(this.holePos(h.i).x - p.x, this.holePos(h.i).y - p.y) < r * 1.2);
      if (h && h.s[0] === p.s[0]) {
        h.filled = true; h.pop = 1; p.done = true; p.hole = h; this.score += 15; this.cheer = 1; Sfx.play('snap'); Sfx.play('ding');
        const q = this.holePos(h.i); FX.burst(q.x, q.y, 14, [p.s[2], '#fff'], 0.6); FX.text(q.x, q.y - r - 26, p.s[1], p.s[2], 32); Kid.say(p.s[1]);
        if (this.holes.every(h => h.filled)) { this.doneT = 2; this.score += 30; this.cheer = 2; Sfx.play('win'); FX.burst(V.W / 2, V.H * 0.45, 36, undefined, 1.2); FX.text(V.W / 2, V.H * 0.45, '全部放好了！', '#e0573c', 46); }
      } else {
        p.home = true; p.shake = 0.4; Sfx.play('nope');
        if (h) Kid.say(`這是${p.s[1]}，那是${h.s[1]}`);
      }
    });
    if (this.doneT) { this.doneT -= dt; if (this.doneT <= 0) { if (this.level + 1 >= this.LEVELS.length) { this.over = true; return; } this.level++; this.newLevel(); } }
  },
  draw(c) {
    const gy = Kid.ground(c, 'sky', this.t, 0.97), r = this.size() / 2;
    // 影子板
    const top = this.holePos(0).y - r * 1.6, bot = this.holePos(this.holes.length - 1).y + r * 1.6;
    Paper.rect(c, 16, top, V.W - 32, bot - top, '#fffdf5', 24, { border: 6 });
    for (const h of this.holes) { const q = this.holePos(h.i); if (!h.filled) this.drawShape(c, h.s[0], q.x, q.y, r, null, { hole: true }); }
    for (const p of this.pieces) if (p !== this.drag.obj) {
      const pop = p.done ? 1 + p.hole.pop * 0.25 : 1;
      this.drawShape(c, p.s[0], p.x + Math.sin(p.shake * 50) * p.shake * 16, p.y, r, p.s[2], { scale: pop });
    }
    if (this.drag.obj) { const p = this.drag.obj; this.drawShape(c, p.s[0], p.x, p.y, r, p.s[2], { lift: 1, scale: 1.08 }); }
    const Pp = Puppet.Poses, free = this.homePos(0).y - r * 1.5 - bot;
    if (free > 160 && Kid.portrait()) Puppet.draw(c, App.pup, V.W / 2, bot + free * 0.95, Math.min(free * 0.85, 260), this.cheer ? Pp.cheer(this.t) : Pp.idle(this.t));
  },
  hud() { return { L: `<b>${this.score}</b> 分`, R: `第 ${Math.min(this.level + 1, 3)} / 3 關` }; },
});
