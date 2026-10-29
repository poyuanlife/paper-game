'use strict';
// 手電筒找找看：晚上黑黑的，手指拿著手電筒照來照去，找出題目說的動物。找 8 個就結束，不限時間。
registerGame({
  id: 'flashlight', name: '手電筒探險', icon: '🔦', color: '#2b3a6b', kid: true,
  desc: '晚上黑漆漆，用手電筒找出躲起來的動物！',
  howto: '手指按著畫面移動，手電筒就會照到那裡。找到上面說的動物就點牠！一共要找 8 隻，不限時間。',
  HIDE: [['🦉', '貓頭鷹'], ['🐱', '小貓'], ['🐰', '兔子'], ['🦊', '狐狸'], ['🐿️', '松鼠'], ['🦔', '刺蝟'], ['🐸', '青蛙'], ['🦇', '蝙蝠'], ['🐌', '蝸牛'], ['🐞', '瓢蟲'], ['🦝', '浣熊'], ['🐭', '老鼠']],
  N: 8,

  start() { this.t = 0; this.score = 0; this.over = false; this.overText = '探險成功！'; this.found = 0; this.light = { x: V.W / 2, y: V.H / 2 }; this.cheer = 0; this.scatter(); this.pickTarget(); },
  onEnter(prev) { if (prev === 'ready') Kid.say(`${this.target.a[1]}躲在哪裡？`); },
  scatter() {
    const P = Kid.portrait(), pts = [], n = 8, set = Kid.shuffle(this.HIDE.slice()).slice(0, n);
    for (const a of set) {
      let p, tries = 0;
      do p = { x: rand(60, V.W - 60), y: rand(V.H * (P ? 0.22 : 0.24), V.H * 0.9) }; while (tries++ < 60 && pts.some(q => Math.hypot(q.x - p.x, q.y - p.y) < 130));
      pts.push({ ...p, a, found: false, s: rand(56, 72), rot: rand(-0.3, 0.3), pop: 0 });
    }
    this.hid = pts; this.lkey = V.W + 'x' + V.H;
  },
  pickTarget() { const left = this.hid.filter(h => !h.found); this.target = pick(left); },
  R() { return Kid.portrait() ? 110 : 120; },
  tap(x, y) {
    this.light.x = x; this.light.y = y;
    for (const h of this.hid) {
      if (h.found || Math.hypot(x - h.x, y - h.y) > h.s * 0.7 + 10) continue;
      if (h === this.target) {
        h.found = true; h.pop = 1; this.found++; this.score += 15; this.cheer = 1.5; Sfx.play('star');
        FX.burst(h.x, h.y, 18, ['#ffe07a', '#ffffff'], 0.8); FX.text(h.x, h.y - 60, '找到了！', '#ffd23f', 36);
        if (this.found >= this.N) { this.overT = 1.2; Kid.say('全部找到了！'); return; }
        if (this.hid.every(q => q.found || q === this.target)) this.scatter();
        this.pickTarget(); setTimeout(() => !this.over && Kid.say(`下一個，${this.target.a[1]}在哪裡？`), 900);
      } else { Sfx.play('nope'); Kid.say(`這是${h.a[1]}`); FX.text(h.x, h.y - 50, h.a[1], '#bfe8ff', 26); }
      return;
    }
  },
  update(dt) {
    this.t += dt; this.cheer = Math.max(0, this.cheer - dt);
    if (this.lkey !== V.W + 'x' + V.H) { this.scatter(); if (!this.hid.includes(this.target)) this.pickTarget(); }
    if (Input.down) { this.light.x += (Input.x - this.light.x) * Math.min(1, dt * 20); this.light.y += (Input.y - this.light.y) * Math.min(1, dt * 20); }
    for (const h of this.hid) h.pop = Math.max(0, h.pop - dt);
    if (this.overT) { this.overT -= dt; if (this.overT <= 0) this.over = true; }
  },
  draw(c) {
    // 晚上的公園
    const g = c.createLinearGradient(0, 0, 0, V.H); g.addColorStop(0, '#1b2350'); g.addColorStop(1, '#2d4a3a'); c.fillStyle = g; c.fillRect(-20, -20, V.W + 40, V.H + 40);
    Paper.circle(c, V.W - 90, 150, 38, '#fff6c8', { border: 4, shadowColor: 'rgba(255,240,180,0.6)', blur: 20 });
    for (let i = 0; i < 6; i++) { const x = (i + 0.5) / 6 * V.W; Paper.circle(c, x, V.H * 0.55 - (i % 2) * 40, 70, '#2f6b3d', { border: 4 }); c.fillStyle = '#5a3d22'; c.fillRect(x - 10, V.H * 0.55 + 50 - (i % 2) * 40, 20, 80); }
    c.fillStyle = '#3d7a45'; c.fillRect(-20, V.H * 0.72, V.W + 40, V.H);
    for (let i = 0; i < 8; i++) Paper.circle(c, (i + 0.3) / 8 * V.W, V.H * 0.74, 44, '#4f9a45', { border: 3 });
    for (const h of this.hid) Kid.emoji(c, h.a[0], h.x, h.y - h.pop * 20, h.s * (1 + h.pop * 0.3), h.rot);
    // 黑暗 + 手電筒的光圈
    const L = this.light, R = this.R();
    c.save(); c.fillStyle = 'rgba(6,10,28,0.94)'; c.beginPath(); c.rect(-20, -20, V.W + 40, V.H + 40); c.arc(L.x, L.y, R, 0, Math.PI * 2, true); c.fill('evenodd');
    const rg = c.createRadialGradient(L.x, L.y, R * 0.55, L.x, L.y, R); rg.addColorStop(0, 'rgba(6,10,28,0)'); rg.addColorStop(1, 'rgba(6,10,28,0.94)');
    c.fillStyle = rg; c.beginPath(); c.arc(L.x, L.y, R + 1, 0, Math.PI * 2); c.fill(); c.restore();
    c.fillStyle = 'rgba(255,240,170,0.08)'; c.beginPath(); c.arc(L.x, L.y, R * 0.8, 0, Math.PI * 2); c.fill();
    // 找到的動物會發光
    for (const h of this.hid) if (h.found) { Paper.circle(c, h.x, h.y, h.s * 0.55, 'rgba(255,230,120,0.25)', { border: 0, shadow: false }); Kid.emoji(c, h.a[0], h.x, h.y, h.s * 0.8, h.rot); }
    // 題目
    const P = Kid.portrait(), by = P ? 125 : 92;
    Paper.rect(c, V.W / 2 - 170, by - 40, 340, 80, '#fffdf5', 40, { border: 4 });
    if (this.target) { Kid.emoji(c, this.target.a[0], V.W / 2 - 110, by, 52); Kid.text(c, `找${this.target.a[1]}`, V.W / 2 + 30, by + 2, 34, '#2b3a6b', 0); }
    // 手電筒
    c.save(); c.translate(L.x + R * 0.75, L.y + R * 0.75); c.rotate(-Math.PI * 0.75);
    Paper.rect(c, -14, 0, 28, 70, '#e8453c', 8, { border: 3 }); Paper.rect(c, -20, -10, 40, 18, '#ffd23f', 6, { border: 3 }); c.restore();
    if (this.t < 4 && !Input.down) Kid.text(c, '👆 按著移動手電筒', V.W / 2, V.H * 0.5, 30, '#fff6c8');
  },
  hud() { return { L: `<b>${this.score}</b> 分`, R: `🔦 ${this.found} / ${this.N}` }; },
});
