'use strict';
// 塗顏色：下面選一個顏色，再點圖上的地方就塗上去。每一塊都塗完就換下一張。4 張圖，不限時間。
registerGame({
  id: 'coloring', name: '塗顏色', icon: '🖍️', color: '#e05ab0', kid: true,
  desc: '選顏色、點一點，幫圖畫塗上漂亮的顏色！',
  howto: '先點下面的顏色，再點圖畫裡想塗的地方。每一塊都塗上顏色就完成了！一共 4 張圖，不限時間，愛怎麼塗就怎麼塗。',
  PALETTE: ['#e8453c', '#ff8a1f', '#ffcc1f', '#45ad4a', '#3fa9e0', '#3f5bd6', '#9b5bd6', '#ff7eb6', '#8a5a34', '#ffffff'],
  // 圖都畫在 400×400 的格子裡；後面的會蓋在前面的上面
  PICS: [
    { name: '房子', make: P => [
      P.rect(20, 355, 360, 35), P.circle(335, 70, 38), P.rect(90, 185, 220, 175), P.poly([[66, 195], [200, 70], [334, 195]]),
      P.rect(175, 270, 52, 90), P.rect(108, 215, 50, 48), P.rect(242, 215, 50, 48)] },
    { name: '小魚', make: P => [
      P.poly([[150, 128], [205, 82], [240, 132]]), P.poly([[285, 200], [372, 125], [372, 275]]), P.ellipse(180, 200, 125, 82, 0),
      P.poly([[170, 240], [215, 300], [235, 245]]), P.circle(115, 182, 16), P.circle(55, 95, 15), P.circle(85, 50, 10), P.circle(330, 340, 22), P.rect(20, 365, 360, 25)] },
    { name: '花', make: P => {
      const L = [P.rect(192, 220, 16, 150), P.ellipse(150, 300, 42, 16, -0.5), P.ellipse(250, 318, 42, 16, 0.5)];
      for (let i = 0; i < 6; i++) { const a = i * Math.PI / 3; L.push(P.circle(200 + Math.cos(a) * 62, 155 + Math.sin(a) * 62, 42)); }
      L.push(P.circle(200, 155, 40), P.poly([[135, 352], [265, 352], [248, 395], [152, 395]]));
      return L; } },
    { name: '車子', make: P => [
      P.poly([[115, 205], [150, 135], [262, 135], [305, 205]]), P.rrect(55, 195, 290, 95, 24),
      P.poly([[140, 195], [162, 148], [200, 148], [200, 195]]), P.poly([[212, 195], [212, 148], [252, 148], [282, 195]]),
      P.circle(122, 292, 38), P.circle(280, 292, 38), P.circle(122, 292, 13), P.circle(280, 292, 13), P.circle(330, 230, 11), P.rect(20, 340, 360, 30)] },
  ],
  SHAPES: {
    rect: (x, y, w, h) => { const p = new Path2D(); p.rect(x, y, w, h); return p; },
    rrect: (x, y, w, h, r) => { const p = new Path2D(); Paper.rrect(p, x, y, w, h, r); return p; },
    circle: (x, y, r) => { const p = new Path2D(); p.arc(x, y, r, 0, Math.PI * 2); return p; },
    ellipse: (x, y, rx, ry, a) => { const p = new Path2D(); p.ellipse(x, y, rx, ry, a, 0, Math.PI * 2); return p; },
    poly: pts => { const p = new Path2D(); pts.forEach(([x, y]) => p.lineTo(x, y)); p.closePath(); return p; },
  },

  start() {
    this.t = 0; this.score = 0; this.over = false; this.overText = '小畫家！'; this.pic = 0; this.cur = 0; this.cheer = 0;
    this.hitC = document.createElement('canvas').getContext('2d'); this.newPic();
  },
  onEnter(prev) { if (prev === 'ready') Kid.say('選一個顏色，幫圖畫塗顏色'); },
  newPic() { this.regions = this.PICS[this.pic].make(this.SHAPES).map(p => ({ p, col: null, pop: 0 })); this.doneT = 0; },
  layout() {
    const P = Kid.portrait(), n = this.PALETTE.length, sw = Math.min(64, (V.W - 30) / (P ? 5 : n)), rows = P ? 2 : 1;
    const palY = V.H * 0.95 - rows * sw;
    const s = Math.min(P ? V.W - 30 : V.W * 0.62, palY - V.H * 0.12 - 20), x = P ? V.W / 2 : V.W * 0.58, y = V.H * 0.12 + s / 2;
    const per = P ? 5 : n, x0 = V.W / 2 - per * sw / 2;
    return { k: s / 400, ox: x - s / 2, oy: y - s / 2, s, sw: (i => ({ x: x0 + sw * (i % per + 0.5), y: palY + sw * (Math.floor(i / per) + 0.5), w: sw - 8, h: sw - 8 })) };
  },
  tap(x, y) {
    const L = this.layout();
    for (let i = 0; i < this.PALETTE.length; i++) if (Kid.hit(L.sw(i), x, y, 4)) { this.cur = i; Sfx.play('click'); return; }
    if (this.doneT) return;
    const px = (x - L.ox) / L.k, py = (y - L.oy) / L.k;
    for (let i = this.regions.length - 1; i >= 0; i--) {
      const r = this.regions[i];
      if (!this.hitC.isPointInPath(r.p, px, py)) continue;
      if (!r.col) this.score += 5;
      r.col = this.PALETTE[this.cur]; r.pop = 1; Sfx.play('pop');
      if (this.regions.every(q => q.col)) {
        this.doneT = 2.4; this.score += 30; this.cheer = 2; Sfx.play('win');
        FX.burst(L.ox + L.s / 2, L.oy + L.s / 2, 40, undefined, 1.2); FX.text(L.ox + L.s / 2, L.oy + 30, '完成了！好漂亮！', '#e05ab0', 42); Kid.say('好漂亮！');
      }
      return;
    }
  },
  update(dt) {
    this.t += dt; this.cheer = Math.max(0, this.cheer - dt);
    for (const r of this.regions) r.pop = Math.max(0, r.pop - dt * 3);
    if (this.doneT) { this.doneT -= dt; if (this.doneT <= 0) { if (this.pic + 1 >= this.PICS.length) { this.over = true; return; } this.pic++; this.newPic(); } }
  },
  draw(c) {
    const gy = Kid.ground(c, 'orchard', this.t, 0.97), L = this.layout();
    Paper.rect(c, L.ox - 10, L.oy - 10, L.s + 20, L.s + 20, '#fffdf5', 20, { border: 6 });
    c.save(); c.translate(L.ox, L.oy); c.scale(L.k, L.k);
    for (const r of this.regions) {
      c.fillStyle = r.col || '#ffffff'; c.fill(r.p);
      if (r.pop) { c.fillStyle = `rgba(255,255,255,${r.pop * 0.6})`; c.fill(r.p); }
      c.lineWidth = 5; c.lineJoin = 'round'; c.strokeStyle = '#4a3520'; c.stroke(r.p);
    }
    c.restore();
    // 顏料
    this.PALETTE.forEach((col, i) => {
      const b = L.sw(i), on = i === this.cur;
      Paper.circle(c, b.x, b.y - (on ? 6 : 0), b.w / 2 * (on ? 1.1 : 0.92), col, { border: on ? 6 : 4, edge: on ? '#4a3520' : undefined });
    });
    const Pp = Puppet.Poses;
    if (!Kid.portrait()) Puppet.draw(c, App.pup, V.W * 0.13, gy, Math.min(V.H * 0.45, 300), this.cheer ? Pp.cheer(this.t) : Pp.idle(this.t));
  },
  hud() { const n = this.regions.filter(r => r.col).length; return { L: `<b>${this.score}</b> 分`, R: `${this.PICS[Math.min(this.pic, this.PICS.length - 1)].name}　${n} / ${this.regions.length}` }; },
});
