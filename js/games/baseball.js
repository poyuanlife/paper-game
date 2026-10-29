'use strict';
// 打棒球：投手丟球過來，抓準時機點畫面揮棒。打得越準飛越遠：全壘打、安打、界外、揮空。12 球。
registerGame({
  id: 'baseball', name: '紙片棒球', icon: '⚾', color: '#2f7a5a',
  desc: '抓準時機揮棒，打出全壘打！',
  howto: '投手投球過來，球飛到紙片人前面的時候點畫面（或空白鍵）揮棒！時機越準打越遠：全壘打 100、安打 30～60、界外 5 分。有快速球也有慢速球，一共 12 球。',
  N: 12,

  start() { this.t = 0; this.score = 0; this.over = false; this.overText = '比賽結束！'; this.n = 0; this.swing = 0; this.ball = null; this.hit = null; this.wait = 1.4; this.cheer = 0; this.msg = null; this.hr = 0; },
  get floor() { return V.H * 0.86; },
  get bx() { return Kid.portrait() ? V.W * 0.78 : V.W * 0.72; },   // 打擊點
  get pitcherX() { return Kid.portrait() ? V.W * 0.14 : V.W * 0.16; },
  pitch() {
    const fast = Math.random() < 0.35, slow = !fast && Math.random() < 0.3, dur = fast ? 0.55 : slow ? 1.15 : 0.8;
    this.ball = { t: 0, dur, kind: fast ? '快速球' : slow ? '慢速球' : '' };
    if (this.ball.kind) FX.text(this.pitcherX + 40, this.floor - 200, this.ball.kind, fast ? '#e8453c' : '#3f8fe0', 26);
    Sfx.play('swish');
  },
  doSwing() {
    if (this.swing > 0 || this.over) return; this.swing = 0.35;
    const b = this.ball; if (!b || b.done) { Sfx.play('whiff'); return; }
    const off = b.t / b.dur - 1;   // 0 = 剛好到打擊點
    const a = Math.abs(off) * b.dur;   // 換成秒
    let res;
    if (a < 0.035) res = { s: '全壘打！', pts: 100, d: 1.6, vy: -900 };
    else if (a < 0.07) res = { s: '長打！', pts: 60, d: 1.1, vy: -700 };
    else if (a < 0.11) res = { s: '安打！', pts: 30, d: 0.8, vy: -450 };
    else if (a < 0.16) res = { s: '界外', pts: 5, d: 0.5, vy: -600, foul: off < 0 ? -1 : 1 };
    if (!res) { Sfx.play('whiff'); return; }
    b.done = true; this.score += res.pts; Sfx.play('bat'); V.shake = res.pts >= 60 ? 10 : 4;
    const bp = this.ballPos(b);
    this.hit = { x: bp.x, y: bp.y, vx: res.foul ? (res.foul < 0 ? -200 : 500) : -(500 + res.d * 500), vy: res.vy, t: 0 };
    this.msg = { s: res.s, t: 1.6, c: res.pts >= 100 ? '#e0573c' : res.pts >= 30 ? '#ff7a00' : '#888' };
    if (res.pts >= 60) { this.cheer = 2; FX.burst(bp.x, bp.y, 30, undefined, 1.2); }
    if (res.pts >= 100) { this.hr++; Sfx.play('win'); }
    this.ball = null; this.wait = 2;
  },
  tap() { this.doSwing(); },
  key(k) { if (k === 'space' || k === 'enter') this.doSwing(); },
  ballPos(b) { const k = b.t / b.dur, x0 = this.pitcherX + 30, y0 = this.floor - 150, x1 = this.bx - 30, y1 = this.floor - 95; return { x: x0 + (x1 - x0) * k, y: y0 + (y1 - y0) * k - Math.sin(Math.min(1, k) * Math.PI) * 40, s: 0.7 + k * 0.5 }; },
  update(dt) {
    this.t += dt; this.swing = Math.max(0, this.swing - dt); this.cheer = Math.max(0, this.cheer - dt);
    if (this.msg) { this.msg.t -= dt; if (this.msg.t <= 0) this.msg = null; }
    const b = this.ball;
    if (b) {
      b.t += dt;
      if (b.t > b.dur + 0.25) { this.ball = null; this.wait = 1.4; this.msg = { s: '好球！沒打到', t: 1.2, c: '#7a62b8' }; Sfx.play('thud'); }
    } else if (this.wait > 0) {
      this.wait -= dt;
      if (this.wait <= 0) { if (this.n >= this.N) { this.over = true; return; } this.n++; this.pitch(); }
    }
    const h = this.hit; if (h) { h.t += dt; h.vy += 700 * dt; h.x += h.vx * dt; h.y += h.vy * dt; if (h.t > 2.2) this.hit = null; }
  },
  draw(c) {
    const fl = this.floor, T = Paper.bg(c, 'sky', 0, this.t);
    c.fillStyle = '#5fae55'; c.fillRect(-20, fl - 30, V.W + 40, V.H);
    c.fillStyle = '#c99b62'; c.beginPath(); c.ellipse(V.W / 2, fl + 10, V.W * 0.48, 40, 0, 0, Math.PI * 2); c.fill();
    c.fillStyle = '#fffdf5'; c.beginPath(); c.moveTo(this.bx - 40, fl); c.lineTo(this.bx - 20, fl - 8); c.lineTo(this.bx, fl); c.lineTo(this.bx - 20, fl + 8); c.closePath(); c.fill();
    // 投手（簡單的紙片小人）
    const px = this.pitcherX, throwing = this.ball && this.ball.t < 0.15;
    Paper.circle(c, px, fl - 120, 22, '#ffd9b0', { border: 3 }); Paper.rect(c, px - 22, fl - 98, 44, 62, '#3f5bd6', 10, { border: 3 });
    Paper.rect(c, px - 20, fl - 38, 14, 38, '#2a2a33', 4, { border: 2 }); Paper.rect(c, px + 6, fl - 38, 14, 38, '#2a2a33', 4, { border: 2 });
    Paper.rect(c, px - 26, fl - 144, 52, 14, '#e8453c', 6, { border: 2 });
    c.save(); c.translate(px + 18, fl - 90); c.rotate(throwing ? -2.4 : 0.6); Paper.rect(c, -6, 0, 12, 40, '#ffd9b0', 6, { border: 2 }); c.restore();
    // 打者：紙片人 + 球棒
    const P = Puppet.Poses, sw = this.swing, k = sw ? 1 - sw / 0.35 : 0, PH = Kid.portrait() ? 200 : 210;
    const pose = this.cheer ? P.cheer(this.t) : { aL: 2.2 - k * 1.6, aR: 2.4 - k * 1.6, aLf: 0.6, aRf: 0.5, rot: -0.05 + k * 0.1, lL: 0.2, lR: 0.1 };
    pose.sx = -1;
    Puppet.draw(c, App.pup, this.bx + 30, fl, PH, pose);
    if (!this.cheer) { c.save(); c.translate(this.bx + 10, fl - PH * 0.5); c.rotate(-1.9 + k * 2.6); Paper.rect(c, -6, -110, 12, 110, '#c98a4b', 6, { border: 3 }); c.restore(); }
    const b = this.ball;
    if (b) { const p = this.ballPos(b); Paper.circle(c, p.x, p.y, 10 * p.s, '#ffffff', { border: 2, blur: 4 }); c.strokeStyle = '#e8453c'; c.lineWidth = 1.5; c.beginPath(); c.arc(p.x - 4 * p.s, p.y, 6 * p.s, -1, 1); c.stroke(); }
    const h = this.hit; if (h) { Paper.circle(c, h.x, h.y, 10, '#ffffff', { border: 2, blur: 4 }); }
    if (this.msg) Kid.text(c, this.msg.s, V.W / 2, V.H * 0.3, 48, this.msg.c);
    if (this.n <= 1 && b) Kid.text(c, '球飛到紙片人前面時點畫面！', V.W / 2, V.H * 0.18, 26, '#2f7a5a');
  },
  hud() { return { L: `<b>${this.score}</b> 分${this.hr ? `　🏟️ 全壘打 ${this.hr}` : ''}`, R: `⚾ ${this.n} / ${this.N}` }; },
});
