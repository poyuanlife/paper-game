'use strict';
// 連連看：照數字 1、2、3… 點過去（或用手指畫過去），連完會變出一個圖案。5 張圖，不限時間。
registerGame({
  id: 'dots', name: '連連看', icon: '✏️', color: '#3f6fe0', kid: true,
  desc: '照著數字連起來，會變出什麼呢？',
  howto: '從 1 開始，照著數字的順序點下去（也可以用手指一路畫過去）。全部連起來就會變出一個圖案！一共 5 張圖，不限時間。',
  ZH: ['零', '一', '二', '三', '四', '五', '六', '七', '八', '九', '十', '十一', '十二'],
  PICS: (() => {
    const heart = [], star = [];
    for (let i = 0; i < 12; i++) { const t = i / 12 * Math.PI * 2; heart.push([0.5 + 16 * Math.pow(Math.sin(t), 3) / 36, 0.47 - (13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t)) / 36]); }
    for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, r = i % 2 ? 0.2 : 0.46; star.push([0.5 + Math.cos(a) * r, 0.54 + Math.sin(a) * r]); }
    return [
      { name: '風箏', col: '#ff7eb6', pts: [[0.5, 0.08], [0.8, 0.4], [0.5, 0.88], [0.2, 0.4]], extra: 'kite' },
      { name: '房子', col: '#ff9a4a', pts: [[0.2, 0.88], [0.2, 0.46], [0.5, 0.14], [0.8, 0.46], [0.8, 0.88]], extra: 'house' },
      { name: '小魚', col: '#3fa9e0', pts: [[0.1, 0.5], [0.3, 0.28], [0.55, 0.26], [0.72, 0.42], [0.92, 0.24], [0.92, 0.76], [0.72, 0.58], [0.55, 0.74], [0.3, 0.72]], extra: 'fish' },
      { name: '星星', col: '#ffcc1f', pts: star },
      { name: '愛心', col: '#e8453c', pts: heart },
    ];
  })(),

  start() { this.t = 0; this.score = 0; this.over = false; this.overText = '連連看高手！'; this.pic = 0; this.cheer = 0; this.newPic(); },
  onEnter(prev) { if (prev === 'ready') Kid.say('從一開始連'); },
  newPic() { this.next = 0; this.doneT = 0; this.fill = 0; this.wrong = 0; },
  box() {
    const P = Kid.portrait(), s = Math.min(P ? V.W - 40 : V.H * 0.78, P ? V.H * 0.6 : V.W * 0.6), x = P ? V.W / 2 : V.W * 0.58, y = P ? V.H * 0.12 + s / 2 + 10 : V.H * 0.12 + s / 2;
    return { x: x - s / 2, y: y - s / 2, s, cx: x, cy: y };
  },
  pt(i) { const b = this.box(), p = this.PICS[this.pic].pts[i]; return { x: b.x + p[0] * b.s, y: b.y + p[1] * b.s }; },
  hitDot(x, y, r) {
    const pts = this.PICS[this.pic].pts;
    if (this.doneT || this.next >= pts.length) return false;
    const p = this.pt(this.next);
    if (Math.hypot(x - p.x, y - p.y) > r) return false;
    this.next++; this.score += 5; Sfx.note(262 * Math.pow(2, [0, 2, 4, 5, 7, 9, 11, 12, 14, 16, 17, 19][this.next - 1] / 12), 0.35);
    FX.burst(p.x, p.y, 6, undefined, 0.4);
    if (this.next >= pts.length) {   // 最後一點連回 1，圖案變出來
      const P = this.PICS[this.pic]; this.doneT = 2.6; this.score += 30; this.cheer = 2; Sfx.play('win');
      FX.burst(this.box().cx, this.box().cy, 40, undefined, 1.2); FX.text(this.box().cx, this.box().y + 20, `是${P.name}！`, P.col, 50); Kid.say(`是${P.name}！`);
    }
    return true;
  },
  tap(x, y) {
    if (this.hitDot(x, y, 46)) return;
    // 點錯：提示下一個在哪裡
    if (!this.doneT) { this.wrong = 0.8; Sfx.play('nope'); Kid.say(`找${this.ZH[this.next + 1]}`); }
  },
  update(dt) {
    this.t += dt; this.cheer = Math.max(0, this.cheer - dt); this.wrong = Math.max(0, this.wrong - dt);
    if (Input.down) this.hitDot(Input.x, Input.y, 32);   // 手指畫過去也算
    if (this.doneT) {
      this.fill = Math.min(1, this.fill + dt * 2); this.doneT -= dt;
      if (this.doneT <= 0) { if (this.pic + 1 >= this.PICS.length) { this.over = true; return; } this.pic++; this.newPic(); }
    }
  },
  draw(c) {
    const gy = Kid.ground(c, 'meadow', this.t, 0.96), b = this.box(), P = this.PICS[this.pic], pts = P.pts, n = pts.length;
    Paper.rect(c, b.x - 14, b.y - 14, b.s + 28, b.s + 28, '#fffdf5', 22, { border: 6 });
    // 圖案填色
    if (this.fill) {
      c.save(); c.globalAlpha = this.fill; c.fillStyle = P.col; c.beginPath(); pts.forEach((_, i) => { const p = this.pt(i); c.lineTo(p.x, p.y); }); c.closePath(); c.fill();
      const q = (u, v) => ({ x: b.x + u * b.s, y: b.y + v * b.s });
      if (P.extra === 'fish') { const e = q(0.3, 0.45); Paper.circle(c, e.x, e.y, b.s * 0.04, '#222', { border: 4, blur: 2 }); }
      if (P.extra === 'house') { const d = q(0.43, 0.62); Paper.rect(c, d.x, d.y, b.s * 0.14, b.s * 0.26, '#8a5a34', 6, { border: 3 }); const w = q(0.62, 0.55); Paper.rect(c, w.x, w.y, b.s * 0.12, b.s * 0.12, '#bfe8ff', 4, { border: 3 }); }
      if (P.extra === 'kite') { c.strokeStyle = '#7a4a22'; c.lineWidth = 3; c.beginPath(); const s = q(0.5, 0.88); c.moveTo(s.x, s.y); for (let i = 1; i <= 8; i++) c.lineTo(s.x + Math.sin(i + this.t * 3) * 14, s.y + i * b.s * 0.012); c.stroke(); }
      c.restore();
    }
    // 已經連好的線
    c.strokeStyle = '#4a3520'; c.lineWidth = 6; c.lineCap = 'round'; c.lineJoin = 'round'; c.beginPath();
    for (let i = 0; i < this.next; i++) { const p = this.pt(i); c.lineTo(p.x, p.y); }
    if (this.next >= n) c.closePath();
    c.stroke();
    // 手指正在畫的線
    if (this.next > 0 && this.next < n && Input.down) { const p = this.pt(this.next - 1); c.strokeStyle = 'rgba(74,53,32,0.3)'; c.setLineDash([8, 8]); c.beginPath(); c.moveTo(p.x, p.y); c.lineTo(Input.x, Input.y); c.stroke(); c.setLineDash([]); }
    // 點點 + 數字
    if (this.fill < 1) for (let i = 0; i < n; i++) {
      const p = this.pt(i), isNext = i === this.next, done = i < this.next, r = isNext ? 20 + Math.abs(Math.sin(this.t * 5)) * 5 + this.wrong * 8 : 16;
      c.globalAlpha = 1 - this.fill;
      Paper.circle(c, p.x, p.y, r, done ? '#4a3520' : isNext ? '#ff7a00' : '#3f6fe0', { border: 4, blur: 3 });
      Kid.text(c, String(i + 1), p.x, p.y + 1, isNext ? 22 : 18, '#fff', 0);
      c.globalAlpha = 1;
    }
    const Pp = Puppet.Poses;
    if (!Kid.portrait()) Puppet.draw(c, App.pup, V.W * 0.13, gy, Math.min(V.H * 0.5, 320), this.cheer ? Pp.cheer(this.t) : Pp.idle(this.t));
    else if (V.H - (b.y + b.s) > 220) Puppet.draw(c, App.pup, V.W / 2, gy, Math.min(V.H - (b.y + b.s) - 50, 240), this.cheer ? Pp.cheer(this.t) : Pp.idle(this.t));
  },
  hud() { return { L: `<b>${this.score}</b> 分`, R: `第 ${Math.min(this.pic + 1, this.PICS.length)} / ${this.PICS.length} 張` }; },
});
