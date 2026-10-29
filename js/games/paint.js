'use strict';
// 手指畫畫：用手指在畫紙上畫畫，可以選顏色、彩虹筆、粗細、蓋印章。畫好按「完成」。
registerGame({
  id: 'paint', name: '手指畫畫', icon: '🎨', color: '#ff7e5f', kid: true,
  desc: '用手指自由畫畫，還有彩虹筆和印章！',
  howto: '用手指在白色畫紙上畫畫！下面可以選顏色、🌈 彩虹筆、筆的粗細，還有印章可以蓋。畫好了按「完成」，想重來就按「清除」。',
  COLS: ['#e8453c', '#ff8a1f', '#ffcc1f', '#45ad4a', '#3fa9e0', '#3f5bd6', '#9b5bd6', '#ff7eb6', '#4a3520', 'rainbow'],
  STAMPS: ['⭐', '❤️', '🌸', '🐾', '🦋', '🌈'],
  SIZES: [6, 14, 26],
  S: 600,

  start() {
    this.t = 0; this.score = 0; this.over = false; this.overText = '大畫家！'; this.col = 0; this.size = 1; this.stamp = -1; this.hue = 0; this.last = null; this.strokes = 0; this.stamps = 0; this.cheer = 0;
    this.pad = Paper.offscreen(this.S, this.S); this.clear();
  },
  onEnter(prev) { if (prev === 'ready') Kid.say('用手指畫畫吧'); },
  clear() { const x = this.pad.x; x.fillStyle = '#ffffff'; x.fillRect(0, 0, this.S, this.S); },
  layout() {
    const P = Kid.portrait(), barH = P ? 190 : 0, side = P ? 0 : 260;
    const s = Math.min(P ? V.W - 24 : V.W - side - 60, V.H - (P ? 100 + barH : 120)), x = P ? V.W / 2 - s / 2 : 30 + (V.W - side - 60 - s) / 2, y = P ? 90 : 90;
    const btns = [];
    const B = (i, j, w) => P ? { x: 20 + w / 2 + i * (w + 6), y: y + s + 24 + j * 58 + 26, w, h: 50 } : { x: V.W - side + 10 + w / 2 + i * (w + 6), y: 100 + j * 58, w, h: 50 };
    const w = P ? (V.W - 40 - 9 * 6) / 10 : (side - 30 - 4 * 6) / 5;
    this.COLS.forEach((c, i) => btns.push({ k: 'col', i, ...(P ? B(i, 0, w) : B(i % 5, Math.floor(i / 5), w)) }));
    const w2 = P ? (V.W - 40 - 8 * 6) / 9 : w;
    this.SIZES.forEach((z, i) => btns.push({ k: 'size', i, ...(P ? B(i, 1, w2) : B(i, 2, w)) }));
    this.STAMPS.forEach((e, i) => btns.push({ k: 'stamp', i, ...(P ? { ...B(i + 3, 1, w2) } : B(i % 5, 3 + Math.floor(i / 5), w)) }));
    const bw = P ? (V.W - 52) / 2 : side - 30;
    btns.push({ k: 'clear', x: P ? 20 + bw / 2 : V.W - side + 10 + bw / 2, y: P ? y + s + 24 + 2 * 58 + 26 : 100 + 5 * 58 + 10, w: bw, h: 50 });
    btns.push({ k: 'done', x: P ? V.W - 20 - bw / 2 : V.W - side + 10 + bw / 2, y: P ? y + s + 24 + 2 * 58 + 26 : 100 + 6 * 58 + 20, w: bw, h: 56 });
    return { x, y, s, btns };
  },
  tap(x, y) {
    const L = this.layout();
    for (const b of L.btns) {
      if (!Kid.hit(b, x, y, 2)) continue;
      Sfx.play('click');
      if (b.k === 'col') { this.col = b.i; this.stamp = -1; }
      else if (b.k === 'size') { this.size = b.i; this.stamp = -1; }
      else if (b.k === 'stamp') this.stamp = b.i;
      else if (b.k === 'clear') { this.clear(); Sfx.play('swish'); }
      else if (b.k === 'done') { this.score = Math.min(500, this.strokes * 5 + this.stamps * 5); this.over = true; }
      return;
    }
    if (x > L.x && x < L.x + L.s && y > L.y && y < L.y + L.s) {
      const k = this.S / L.s, px = (x - L.x) * k, py = (y - L.y) * k;
      if (this.stamp >= 0) { Kid.emoji(this.pad.x, this.STAMPS[this.stamp], px, py, 70, rand(-0.3, 0.3)); this.stamps++; Sfx.play('pop'); FX.burst(x, y, 6, undefined, 0.3); }
      else { this.last = { x: px, y: py }; this.strokes++; this.dot(px, py); }
    }
  },
  color() { if (this.COLS[this.col] !== 'rainbow') return this.COLS[this.col]; return `hsl(${this.hue % 360},90%,55%)`; },
  dot(px, py) { const x = this.pad.x; x.fillStyle = this.color(); x.beginPath(); x.arc(px, py, this.SIZES[this.size] / 2, 0, Math.PI * 2); x.fill(); },
  update(dt) {
    this.t += dt;
    if (Input.down && this.last && this.stamp < 0) {
      const L = this.layout(), k = this.S / L.s, px = (Input.x - L.x) * k, py = (Input.y - L.y) * k, x = this.pad.x;
      const d = Math.hypot(px - this.last.x, py - this.last.y);
      if (d > 1) { this.hue += d * 0.6; x.strokeStyle = this.color(); x.lineWidth = this.SIZES[this.size]; x.lineCap = 'round'; x.lineJoin = 'round'; x.beginPath(); x.moveTo(this.last.x, this.last.y); x.lineTo(px, py); x.stroke(); this.last = { x: px, y: py }; }
    }
    if (!Input.down) this.last = null;
  },
  draw(c) {
    c.fillStyle = '#f6e7c8'; c.fillRect(-20, -20, V.W + 40, V.H + 40);
    c.fillStyle = 'rgba(200,150,90,0.12)'; for (let y = 0; y < V.H; y += 40) c.fillRect(0, y, V.W, 18);
    const L = this.layout();
    Paper.rect(c, L.x - 8, L.y - 8, L.s + 16, L.s + 16, '#ffffff', 10, { border: 6 });
    c.drawImage(this.pad.c, L.x, L.y, L.s, L.s);
    for (const b of L.btns) {
      const on = (b.k === 'col' && b.i === this.col && this.stamp < 0) || (b.k === 'size' && b.i === this.size && this.stamp < 0) || (b.k === 'stamp' && b.i === this.stamp);
      if (b.k === 'col') {
        const cc = this.COLS[b.i]; let fill = cc;
        if (cc === 'rainbow') { fill = c.createLinearGradient(b.x - b.w / 2, 0, b.x + b.w / 2, 0); ['#e8453c', '#ffcc1f', '#45ad4a', '#3fa9e0', '#9b5bd6'].forEach((q, i) => fill.addColorStop(i / 4, q)); }
        Paper.circle(c, b.x, b.y - (on ? 5 : 0), Math.min(b.w, b.h) / 2 - 2, fill, { border: on ? 5 : 3, edge: on ? '#4a3520' : undefined, blur: 3 });
      } else if (b.k === 'size') { Paper.rect(c, b.x - b.w / 2, b.y - b.h / 2, b.w, b.h, on ? '#fff1b8' : '#fffdf5', 12, { border: 3, edge: on ? '#4a3520' : undefined }); c.fillStyle = '#4a3520'; c.beginPath(); c.arc(b.x, b.y, this.SIZES[b.i] / 2 + 1, 0, Math.PI * 2); c.fill(); }
      else if (b.k === 'stamp') { Paper.rect(c, b.x - b.w / 2, b.y - b.h / 2, b.w, b.h, on ? '#fff1b8' : '#fffdf5', 12, { border: 3, edge: on ? '#4a3520' : undefined }); Kid.emoji(c, this.STAMPS[b.i], b.x, b.y, Math.min(b.w, b.h) * 0.65); }
      else Kid.button(c, b, b.k === 'clear' ? '🧽 清除' : '✅ 完成', b.k === 'clear' ? '#9aa0b5' : '#45ad4a', { size: 24 });
    }
  },
  hud() { return { L: '🎨 手指畫畫', R: '' }; },
});
