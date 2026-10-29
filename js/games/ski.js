'use strict';
// 滑雪過旗門：紙片人往下滑，按住左邊 / 右邊轉向，穿過紅藍旗門得分，撞到樹會跌倒。60 秒。
registerGame({
  id: 'ski', name: '滑雪大挑戰', icon: '⛷️', color: '#3f8fe0',
  desc: '左右轉彎穿過旗門，小心不要撞到樹！',
  howto: '按住畫面左半邊往左轉，右半邊往右轉（或 ← →）。從兩支旗子中間穿過去 +10 分，連續穿過有加成；漏掉旗門會斷連。撞到樹會跌倒慢下來。限時 60 秒，越滑越快！',
  TIME: 60,

  start() { this.t = 0; this.left = this.TIME; this.score = 0; this.over = false; this.overText = '時間到！'; this.x = V.W / 2; this.vx = 0; this.dist = 0; this.speed = 260; this.objs = []; this.nextGate = 300; this.nextTree = 120; this.fall = 0; this.combo = 0; this.trail = []; },
  get py() { return V.H * (Kid.portrait() ? 0.3 : 0.28); },
  tap() {},
  steer() { const kd = keyDir(); if (kd) return kd; if (Input.down) return Input.x < V.W / 2 ? -1 : 1; return 0; },
  update(dt) {
    this.t += dt; this.left -= dt; if (this.left <= 0) { this.left = 0; this.over = true; return; }
    this.fall = Math.max(0, this.fall - dt);
    const s = this.fall ? 0 : this.steer();
    this.vx += (s * 460 - this.vx) * Math.min(1, dt * 5); this.x = clamp(this.x + this.vx * dt, 30, V.W - 30);
    const target = this.fall ? 60 : 260 + this.t * 6; this.speed += (target - this.speed) * Math.min(1, dt * 2);
    const dy = this.speed * dt * V.H / 720; this.dist += dy;
    for (const o of this.objs) o.y -= dy;
    this.trail.push({ x: this.x, y: this.py + 10 }); for (const p of this.trail) p.y -= dy; this.trail = this.trail.filter(p => p.y > -20);
    // 生成旗門和樹
    this.nextGate -= dy; this.nextTree -= dy;
    if (this.nextGate <= 0) { const w = Math.max(130, 220 - this.t * 1.5), cx = rand(w / 2 + 30, V.W - w / 2 - 30); this.objs.push({ k: 'gate', x: cx, y: V.H + 40, w, red: Math.random() < 0.5 }); this.nextGate = rand(260, 360) * V.H / 720; }
    if (this.nextTree <= 0) { const gate = this.objs.filter(o => o.k === 'gate' && Math.abs(o.y - (V.H + 40)) < 80); let x, k = 0; do x = rand(20, V.W - 20); while (k++ < 20 && gate.some(g => Math.abs(x - g.x) < g.w / 2 + 40)); this.objs.push({ k: 'tree', x, y: V.H + 40, s: rand(48, 66) }); this.nextTree = rand(90, 180) * V.H / 720 / (1 + this.t / 60); }
    for (const o of this.objs) {
      if (o.k === 'gate' && !o.done && o.y < this.py) {
        o.done = true;
        if (Math.abs(this.x - o.x) < o.w / 2) { this.combo++; const pts = 10 + Math.min(20, this.combo * 2); this.score += pts; o.ok = true; Sfx.play('coin'); FX.text(o.x, this.py - 40, `+${pts}`, '#e0573c', 28); }
        else { this.combo = 0; o.miss = true; Sfx.play('whiff'); }
      }
      if (o.k === 'tree' && !o.hit && !this.fall && Math.abs(o.x - this.x) < o.s * 0.35 && Math.abs(o.y - this.py) < 22) { o.hit = true; this.fall = 1.1; this.combo = 0; Sfx.play('hit'); V.shake = 8; FX.burst(this.x, this.py, 16, ['#ffffff', '#cfe9ff'], 0.8); }
    }
    this.objs = this.objs.filter(o => o.y > -80);
  },
  draw(c) {
    c.fillStyle = '#f4f9ff'; c.fillRect(-20, -20, V.W + 40, V.H + 40);
    c.fillStyle = 'rgba(160,190,230,0.25)'; for (let i = 0; i < 14; i++) { const y = ((i * 97 - this.dist * 0.9) % (V.H + 60) + V.H + 60) % (V.H + 60) - 30; c.beginPath(); c.ellipse((i * 211) % V.W, y, 60, 10, 0, 0, Math.PI * 2); c.fill(); }
    c.strokeStyle = 'rgba(150,180,220,0.6)'; c.lineWidth = 3; c.beginPath(); this.trail.forEach((p, i) => i ? c.lineTo(p.x - 6, p.y) : c.moveTo(p.x - 6, p.y)); c.stroke();
    c.beginPath(); this.trail.forEach((p, i) => i ? c.lineTo(p.x + 6, p.y) : c.moveTo(p.x + 6, p.y)); c.stroke();
    const draws = this.objs.slice().sort((a, b) => a.y - b.y);
    let me = false;
    const drawMe = () => {
      const P = Puppet.Poses, lean = clamp(this.vx / 460, -1, 1);
      const pose = this.fall ? Object.assign(P.hurt(1.1 - this.fall), { rot: Math.sin(this.fall * 10) * 0.5 }) : { rot: lean * 0.3, aL: 0.9 + lean * 0.4, aR: 0.9 - lean * 0.4, aLf: 0.6, aRf: 0.6, lL: 0.12, lR: 0.12, lLf: -0.5, lRf: -0.5, sy: 0.94 };
      c.save(); c.translate(this.x, this.py + 30); c.rotate(lean * 0.4); Paper.rect(c, -40, -3, 32, 6, '#e8453c', 3, { border: 2, blur: 2 }); Paper.rect(c, 8, -3, 32, 6, '#e8453c', 3, { border: 2, blur: 2 }); c.restore();
      Puppet.draw(c, App.pup, this.x, this.py + 28, Kid.portrait() ? 120 : 110, pose);
    };
    for (const o of draws) {
      if (!me && o.y > this.py + 20) { drawMe(); me = true; }
      if (o.k === 'tree') { Paper.shape(c, cc => { cc.moveTo(o.x, o.y - o.s * 1.1); cc.lineTo(o.x + o.s * 0.45, o.y); cc.lineTo(o.x - o.s * 0.45, o.y); cc.closePath(); }, '#3d8b4a', { border: 3, blur: 4 }); c.fillStyle = '#6a4a2a'; c.fillRect(o.x - 5, o.y, 10, 12); c.fillStyle = '#ffffff'; c.beginPath(); c.moveTo(o.x, o.y - o.s * 1.1); c.lineTo(o.x + 9, o.y - o.s * 0.85); c.lineTo(o.x - 9, o.y - o.s * 0.85); c.fill(); }
      else {
        const col = o.ok ? '#45ad4a' : o.red ? '#e8453c' : '#3f5bd6';
        for (const fx of [o.x - o.w / 2, o.x + o.w / 2]) { c.fillStyle = '#4a4a55'; c.fillRect(fx - 2, o.y - 50, 4, 52); Paper.shape(c, cc => { cc.moveTo(fx, o.y - 50); cc.lineTo(fx + (fx < o.x ? -22 : 22), o.y - 40); cc.lineTo(fx, o.y - 30); cc.closePath(); }, col, { border: 2, blur: 2 }); }
        if (!o.done) { c.strokeStyle = 'rgba(232,69,60,0.25)'; c.setLineDash([6, 8]); c.beginPath(); c.moveTo(o.x - o.w / 2, o.y); c.lineTo(o.x + o.w / 2, o.y); c.stroke(); c.setLineDash([]); }
      }
    }
    if (!me) drawMe();
    if (this.t < 3) Kid.text(c, '👈 按左邊　　按右邊 👉', V.W / 2, V.H * 0.6, 28, '#3f6fe0');
  },
  hud() { return { L: `<b>${this.score}</b> 分${this.combo >= 3 ? `　<span class="combo">連過 ${this.combo}</span>` : ''}`, R: `⏱ ${Math.ceil(this.left)}` }; },
});
