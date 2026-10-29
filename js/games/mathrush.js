'use strict';
// 心算快手：60 秒內答越多題越好。越答越難（加減 → 九九乘法 → 混合）。答錯扣 3 秒，連續答對有加成。
registerGame({
  id: 'mathrush', name: '心算快手', icon: '🧮', color: '#5a6fd6',
  desc: '60 秒挑戰心算，看你能答對幾題！',
  howto: '看算式，點正確的答案（也可以按鍵盤 1～4）。越答越難：加減法 → 九九乘法 → 混合。答錯扣 3 秒，連續答對分數越來越多。限時 60 秒！',
  TIME: 60,

  start() { this.t = 0; this.left = this.TIME; this.score = 0; this.over = false; this.overText = '時間到！'; this.right = 0; this.combo = 0; this.cheer = 0; this.flash = 0; this.newQ(); },
  newQ() {
    const lv = this.right < 5 ? 0 : this.right < 12 ? 1 : this.right < 20 ? 2 : 3, R = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
    let a, b, op, ans;
    const kind = lv === 0 ? pick(['+', '-']) : lv === 1 ? pick(['+', '-', '×']) : lv === 2 ? pick(['×', '×', '+', '-']) : pick(['×', '÷', '+', '-']);
    if (kind === '+') { a = R(lv ? 10 : 1, lv ? 60 : 10); b = R(lv ? 5 : 1, lv ? 40 : 10); ans = a + b; }
    else if (kind === '-') { a = R(lv ? 20 : 5, lv ? 90 : 18); b = R(1, a - 1); ans = a - b; }
    else if (kind === '×') { a = R(2, 9); b = R(2, 9); ans = a * b; }
    else { b = R(2, 9); ans = R(2, 9); a = b * ans; }
    this.q = { s: `${a} ${kind} ${b}`, ans };
    const opts = new Set([ans]);
    while (opts.size < 4) { const d = pick([-10, -2, -1, 1, 2, 10, kind === '×' ? a : 3, kind === '×' ? -b : -3]); if (ans + d >= 0) opts.add(ans + d); }
    this.opts = Kid.shuffle([...opts]).map(v => ({ v, shake: 0, ok: 0 })); this.qT = 0;
  },
  btn(i) {
    const P = Kid.portrait(), w = P ? (V.W - 50) / 2 : Math.min(240, (V.W - 100) / 4), h = P ? 110 : 110;
    if (P) return { x: V.W / 2 + (i % 2 ? 1 : -1) * (w / 2 + 8), y: V.H * 0.62 + Math.floor(i / 2) * (h + 16), w, h };
    return { x: V.W / 2 + (i - 1.5) * (w + 16), y: V.H * 0.7, w, h };
  },
  answer(i) {
    const o = this.opts[i]; if (!o || this.over) return;
    if (o.v === this.q.ans) {
      this.combo++; this.right++; const fast = this.qT < 2 ? 5 : 0, pts = 10 + Math.min(20, this.combo * 2) + fast; this.score += pts; this.cheer = 0.6;
      Sfx.play(this.combo % 5 === 0 ? 'star' : 'ding'); const b = this.btn(i); FX.text(b.x, b.y - 80, `+${pts}${fast ? ' 快！' : ''}`, '#3d8b2a', 30);
      if (this.combo % 5 === 0) FX.text(V.W / 2, V.H * 0.2, `${this.combo} 連對！`, '#e0573c', 40);
      this.newQ();
    } else { o.shake = 0.5; this.combo = 0; this.left -= 3; this.flash = 0.4; Sfx.play('nope'); const b = this.btn(i); FX.text(b.x, b.y - 80, '-3 秒', '#e8453c', 30); }
  },
  tap(x, y) { for (let i = 0; i < 4; i++) if (Kid.hit(this.btn(i), x, y)) return this.answer(i); },
  key(k) { const i = ['1', '2', '3', '4'].indexOf(k); if (i >= 0) this.answer(i); },
  update(dt) {
    this.t += dt; this.qT += dt; this.left -= dt; this.cheer = Math.max(0, this.cheer - dt); this.flash = Math.max(0, this.flash - dt);
    for (const o of this.opts) o.shake = Math.max(0, o.shake - dt);
    if (this.left <= 0) { this.left = 0; this.over = true; this.overText = `答對 ${this.right} 題！`; }
  },
  draw(c) {
    c.fillStyle = '#2f4a3a'; c.fillRect(-20, -20, V.W + 40, V.H + 40);   // 黑板
    Paper.rect(c, 20, 70, V.W - 40, V.H - 100, '#3a5f4a', 18, { border: 10, edge: '#c98a4b' });
    c.fillStyle = 'rgba(255,255,255,0.05)'; for (let i = 0; i < 8; i++) c.fillRect(40 + i * 140, 90, 80, V.H - 150);
    const P = Kid.portrait(), qy = P ? V.H * 0.36 : V.H * 0.38;
    Kid.text(c, `${this.q.s} = ?`, V.W / 2, qy, P ? 72 : 86, '#ffffff', 0);
    // 時間條
    const w = V.W - 120, k = this.left / this.TIME; c.fillStyle = 'rgba(255,255,255,0.15)'; c.fillRect(60, P ? 120 : 100, w, 14);
    c.fillStyle = k < 0.25 ? '#ff6b6b' : '#ffd23f'; c.fillRect(60, P ? 120 : 100, w * clamp(k, 0, 1), 14);
    const cols = ['#e8453c', '#3f8fe0', '#45ad4a', '#ff8a1f'];
    this.opts.forEach((o, i) => Kid.button(c, this.btn(i), String(o.v), cols[i], { shake: o.shake, size: 52 }));
    if (this.flash) { c.fillStyle = `rgba(255,80,80,${this.flash * 0.4})`; c.fillRect(0, 0, V.W, V.H); }
    if (!P) Puppet.draw(c, App.pup, V.W - 95, V.H - 40, 180, this.cheer ? Puppet.Poses.cheer(this.t) : Puppet.Poses.idle(this.t));
  },
  hud() { return { L: `<b>${this.score}</b> 分${this.combo >= 3 ? `　<span class="combo">${this.combo} 連對</span>` : ''}`, R: `⏱ ${Math.ceil(this.left)}　✔ ${this.right}` }; },
});
