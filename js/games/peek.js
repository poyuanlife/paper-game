'use strict';
// 躲貓貓：紙片人躲在草叢後面，探出頭來就點牠。偶爾會冒出小動物朋友。點錯不扣分，給小小孩玩。40 秒。
registerGame({
  id: 'peek', name: '躲貓貓', icon: '🙈', color: '#6cb33f', kid: true,
  desc: '紙片人躲在草叢裡，看到就快點牠！',
  howto: '紙片人會從草叢裡探出頭來，看到就點牠！有時候會跑出小動物朋友，點牠們也有分數。點錯沒關係，不會扣分，限時 40 秒。',
  TIME: 40,
  FRIENDS: ['🐰', '🐻', '🐱', '🐶', '🐸', '🐥', '🐼', '🦊'],
  FOUND: ['找到你了！', '被發現了！', '抓到了！', '在這裡！', '嘻嘻！'],
  EMOJI: '"Segoe UI Emoji","Apple Color Emoji","Noto Color Emoji",sans-serif',

  start() {
    this.t = 0; this.left = this.TIME; this.score = 0; this.over = false; this.overText = '躲貓貓好好玩！';
    this.found = 0; this.streak = 0; this.spawnT = 0.8; this.holes = null; this.layoutKey = '';
  },
  // 草叢的位置：直向 2×3，橫向 3×2
  layout() {
    const key = V.W + 'x' + V.H; if (this.layoutKey === key) return; this.layoutKey = key;
    const portrait = V.W < 700, cols = portrait ? 2 : 3, rows = portrait ? 3 : 2;
    const top = V.H * 0.16, bot = V.H * 0.97, left = portrait ? 10 : V.W * 0.1, right = portrait ? V.W - 10 : V.W * 0.9;
    const cw = (right - left) / cols, ch = (bot - top) / rows, old = this.holes || [];
    this.holes = [];
    for (let r = 0; r < rows; r++) for (let q = 0; q < cols; q++) {
      const i = r * cols + q;
      this.holes.push(Object.assign({ who: null, st: 'idle', rise: 0, t: 0, dur: 0, wig: 0, emoji: '🐰' }, old[i] || {}, { cx: left + cw * (q + 0.5), base: top + ch * (r + 0.78), cw, ch }));
    }
  },
  // 角色在草叢裡的高度（寵物比較寬，要縮小一點）
  sizeIn(h) {
    let PH = Math.min(h.ch * 0.78, 260), s = Puppet.size(App.pup, PH);
    if (s.w > h.cw * 0.8) { PH *= h.cw * 0.8 / s.w; s = Puppet.size(App.pup, PH); }
    return { PH, h: s.h, w: s.w };
  },

  spawn() {
    const free = this.holes.filter(h => h.st === 'idle'), busy = this.holes.length - free.length;
    const maxOut = this.t < 12 ? 1 : this.t < 28 ? 2 : 3;
    if (free.length && busy < maxOut) {
      const h = pick(free), friend = Math.random() < 0.28;
      Object.assign(h, { who: friend ? 'friend' : 'me', emoji: pick(this.FRIENDS), st: 'up', t: 0, dur: Math.max(1.1, 2.1 - this.t / this.TIME * 0.9) * rand(0.9, 1.2) });
      Sfx.play('rustle'); h.wig = 0.35;
    }
    this.spawnT = Math.max(0.45, 1.1 - this.t / 50) * rand(0.7, 1.3);
  },

  tap(x, y) {
    this.layout();
    for (const h of this.holes) {
      if (Math.abs(x - h.cx) > h.cw * 0.48 || y > h.base + h.ch * 0.2 || y < h.base - h.ch * 0.95) continue;
      if ((h.st === 'up' || h.st === 'stay') && h.rise > 0.25) {
        h.st = 'found'; h.t = 0; this.found++; this.streak++;
        const pts = (h.who === 'friend' ? 15 : 10) + Math.min(10, Math.floor(this.streak / 3) * 2);
        this.score += pts; Sfx.play(h.who === 'friend' ? 'star' : 'giggle');
        FX.burst(h.cx, h.base - h.ch * 0.4, 14, undefined, 0.7);
        FX.text(h.cx, h.base - h.ch * 0.75, pick(this.FOUND), '#ff7a00', 34);
        FX.text(h.cx, h.base - h.ch * 0.5, '+' + pts, '#3d8b2a', 28);
        if (this.found % 10 === 0) FX.text(V.W / 2, V.H * 0.45, '好眼力！', '#e0573c', 50);
      } else if (h.st === 'idle') { h.wig = 0.4; Sfx.play('rustle'); }   // 點到空的草叢：搖一搖，沒有懲罰
      return;
    }
  },

  update(dt) {
    this.layout();
    this.t += dt; this.left -= dt;
    if (this.left <= 0) { this.left = 0; this.over = true; return; }
    this.spawnT -= dt; if (this.spawnT <= 0) this.spawn();
    for (const h of this.holes) {
      h.t += dt; h.wig = Math.max(0, h.wig - dt);
      if (h.st === 'up') { h.rise = Math.min(1, h.rise + dt * 4); if (h.rise >= 1) { h.st = 'stay'; h.t = 0; } }
      else if (h.st === 'stay') { if (h.t > h.dur) { h.st = 'down'; this.streak = 0; } }
      else if (h.st === 'found') { if (h.t > 0.75) h.st = 'down'; }
      else if (h.st === 'down') { h.rise = Math.max(0, h.rise - dt * 3.5); if (h.rise <= 0) { h.st = 'idle'; h.who = null; } }
    }
  },

  drawBush(c, h) {
    const w = h.cw * 0.9, bh = Math.min(h.ch * 0.3, h.cw * 0.26), x = h.cx + Math.sin(h.wig * 40) * h.wig * 10, y = h.base;
    // 一排圓圓的葉子（全部在寬度 w 裡面），下面是平的
    const n = 4, r = w / (n * 2 - 0.6);
    Paper.shape(c, c => {
      c.moveTo(x - w / 2, y + bh * 0.5);
      for (let i = 0; i < n; i++) { const bx = x - w / 2 + r + i * (w - 2 * r) / (n - 1); c.arc(bx, y - (i % 2 ? bh * 0.12 : 0), r, Math.PI, Math.PI * 2, false); }
      c.lineTo(x + w / 2, y + bh * 0.5); c.closePath();
    }, '#4f9a45', { border: 5 });
    for (let i = 0; i < 3; i++) Paper.circle(c, x - w * 0.3 + i * w * 0.3, y + bh * 0.05 - (i % 2) * 8, 6, ['#ff8fb1', '#ffd23f', '#ffffff'][i], { border: 2, blur: 2, oy: 1 });
  },

  draw(c) {
    this.layout();
    const T = Paper.bg(c, 'meadow', 0, this.t);
    // 草地從第一排草叢後面開始
    const gTop = Math.min(V.H * 0.55, this.holes[0].base - this.holes[0].ch * 0.35);
    Paper.shape(c, c => { c.moveTo(-20, V.H + 20); c.lineTo(-20, gTop + 20); c.quadraticCurveTo(V.W * 0.5, gTop - 25, V.W + 20, gTop + 10); c.lineTo(V.W + 20, V.H + 20); c.closePath(); }, '#8fc96a', { border: 4, blur: 6, oy: -2 });
    const P = Puppet.Poses;
    for (const h of this.holes) {
      if (h.rise > 0) {
        const lift = h.st === 'found' ? Math.sin(Math.min(1, h.t / 0.4) * Math.PI) * 0.2 : 0;
        const s = h.who === 'me' ? this.sizeIn(h) : { h: Math.min(h.cw * 0.6, h.ch * 0.55) * 1.15 };
        const foot = h.base + s.h * (1 - h.rise * (0.85 + lift));
        c.save(); c.beginPath(); c.rect(h.cx - h.cw / 2, h.base - h.ch * 1.2, h.cw, h.ch * 1.2 + h.ch * 0.05); c.clip();
        if (h.who === 'me') {
          const pose = h.st === 'found' ? P.cheer(this.t)
            : { aL: 2.5, aR: 2.5, aLf: 0.5, aRf: 0.5, head: 0.18 * Math.sin(this.t * 6 + h.cx), rot: 0.06 * Math.sin(this.t * 3 + h.cx) };
          Puppet.draw(c, App.pup, h.cx, foot, s.PH, pose);
        } else {
          const sz = Math.min(h.cw * 0.6, h.ch * 0.55), y = foot - s.h * 0.55, k = h.st === 'found' ? 1 + 0.15 * Math.sin(h.t * 20) : 1;
          c.save(); c.translate(h.cx, y); c.rotate(0.1 * Math.sin(this.t * 4 + h.cx)); c.scale(k, k);
          Paper.circle(c, 0, 0, sz * 0.52, '#fffdf5', { border: 0, blur: 8 });
          c.font = `${Math.round(sz * 0.85)}px ${this.EMOJI}`; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(h.emoji, 0, sz * 0.04);
          c.restore();
        }
        c.restore();
      }
      this.drawBush(c, h);
    }
  },
  hud() { return { L: `<b>${this.score}</b> 分　👀 ${this.found}`, R: `⏱ ${Math.ceil(this.left)}` }; },
});
