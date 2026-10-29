'use strict';
// 彈射紙片人：用超大彈弓把紙片人射出去。路上有氣球、彈簧床（飛更遠）和泥巴（會黏住）。一共 3 發，距離加起來算分。
registerGame({
  id: 'launch', name: '彈射紙片人', icon: '🎯', color: '#ff7a45',
  desc: '用超大彈弓把紙片人射出去，看能飛多遠！',
  howto: '按住畫面往後拉（往左下拉 = 往右上飛），放開就發射，虛線是會飛的方向。飛的時候可以點一下「揮手」再往上飛一次。碰到氣球、彈簧床會飛更遠，小心泥巴！一共 3 發，距離加起來算分。（鍵盤：↑↓ 調角度、←→ 調力量、空白鍵發射）',
  SHOTS: 3, PPM: 40, G: 1350, PH: 120, MAXV: 1750, PULL: 170,

  start() {
    this.t = 0; this.shot = 0; this.total = 0; this.score = 0; this.dists = []; this.over = false; this.overText = '發射完畢！';
    this.camX = 0; this.camY = 0; this.kAng = 0.75; this.kPow = 0.7;
    this.newShot();
  },
  newShot() {
    this.shot++; this.st = 'aim'; this.stT = 0; this.drag = null; this.flaps = 1; this.trail = [];
    this.p = { x: this.slingX, y: this.slingH, vx: 0, vy: 0, rot: 0, spin: 0 };
    this.genItems();
  },
  get gy() { return V.H * 0.86; },                       // 地面在畫面上的高度（鏡頭在最下面時）
  get slingX() { return clamp(V.W * 0.3, 165, 280); },
  get slingH() { return 150; },
  get R() { return this.PH * 0.3; },

  genItems() {
    this.items = []; let x = this.slingX + rand(450, 700);
    while (x < this.slingX + 60000) {
      const r = Math.random(), far = x > this.slingX + 1500;
      if (r < 0.42) this.items.push({ k: 'balloon', x, y: rand(170, 620), c: pick(['#ff6b6b', '#ffd93d', '#4d96ff', '#c77dff', '#6bcb77']), ph: rand(0, 6) });
      else if (r < 0.78 || !far) this.items.push({ k: 'tramp', x, w: 130 });
      else this.items.push({ k: 'mud', x, w: 170 });
      x += rand(380, 820) + x * 0.04;
    }
  },

  // 拉的向量 → 速度
  launchV(dx, dy) {
    const len = Math.min(this.PULL, Math.hypot(dx, dy)), a = Math.atan2(dy, dx), k = len / this.PULL;
    return { vx: -Math.cos(a) * k * this.MAXV, vy: Math.sin(a) * k * this.MAXV, len, a };
  },
  pullOf() {
    if (this.drag) { const dx = Input.x - this.drag.x, dy = Input.y - this.drag.y, len = Math.min(this.PULL, Math.hypot(dx, dy)), a = Math.atan2(dy, dx); return { dx: Math.cos(a) * len, dy: Math.sin(a) * len, len }; }
    if (this.kb) { const len = this.kPow * this.PULL; return { dx: -Math.cos(this.kAng) * len, dy: Math.sin(this.kAng) * len, len }; }
    return { dx: 0, dy: 0, len: 0 };
  },

  tap(x, y) {
    if (this.st === 'aim') { this.drag = { x, y }; this.kb = false; return; }
    if (this.st === 'fly' && this.flaps > 0) {
      this.flaps--; const p = this.p; p.vy = Math.max(p.vy, 0) + 720; p.vx += 120; p.spin *= 0.3;
      Sfx.play('flap'); FX.burst(this.sx(p.x), this.sy(p.y), 10, ['#fffdf5', '#bfe6ff'], 0.5); FX.text(this.sx(p.x), this.sy(p.y) - 70, '揮手！', '#2f7de1', 30);
    }
  },
  key(k) {
    if (this.st === 'aim') {
      if (k === 'arrowup' || k === 'w') { this.kb = true; this.kAng = clamp(this.kAng + 0.08, 0.05, 1.45); }
      if (k === 'arrowdown' || k === 's') { this.kb = true; this.kAng = clamp(this.kAng - 0.08, 0.05, 1.45); }
      if (k === 'arrowright' || k === 'd') { this.kb = true; this.kPow = clamp(this.kPow + 0.08, 0.2, 1); }
      if (k === 'arrowleft' || k === 'a') { this.kb = true; this.kPow = clamp(this.kPow - 0.08, 0.2, 1); }
      if (k === 'space' || k === 'enter') { this.kb = true; const q = this.pullOf(); this.fire(q.dx, q.dy); }
    } else if (k === 'space' || k === 'arrowup' || k === 'w') this.tap(0, 0);
  },
  fire(dx, dy) {
    const v = this.launchV(dx, dy); if (v.len < 25) { this.drag = null; return; }
    const p = this.p; p.vx = Math.max(0, v.vx); p.vy = v.vy; p.spin = 3 + v.len / this.PULL * 6;
    this.st = 'fly'; this.stT = 0; this.drag = null; this.kb = false;
    Sfx.play('boing'); FX.burst(this.sx(p.x), this.sy(p.y), 12, ['#fffdf5', '#e9d9b6'], 0.6);
  },

  sx(x) { return x - this.camX; },
  sy(y) { return this.gy - y + this.camY; },
  dist() { return Math.max(0, (this.p.x - this.slingX) / this.PPM); },

  update(dt) {
    this.t += dt; this.stT += dt; const p = this.p;
    for (const it of this.items) if (it.k === 'balloon') it.ph += dt;
    if (this.st === 'aim') {
      const q = this.pullOf(); p.x = this.slingX + q.dx * 0.6; p.y = this.slingH - q.dy * 0.6;
      if (this.drag && !Input.down) this.fire(q.dx, q.dy);
      this.camX += (0 - this.camX) * Math.min(1, dt * 4); this.camY += (0 - this.camY) * Math.min(1, dt * 4);
      return;
    }
    if (this.st === 'fly') {
      const steps = 3, h = dt / steps;
      for (let s = 0; s < steps; s++) this.physics(h);
      if (this.st === 'fly' && Math.abs(p.vx) < 18 && p.y <= this.R + 1 && Math.abs(p.vy) < 1) this.stop();
      if (this.stT > 25) this.stop();
      if (Math.floor(this.t * 30) % 2 === 0) { this.trail.push({ x: p.x, y: p.y }); if (this.trail.length > 40) this.trail.shift(); }
    } else if (this.st === 'done') {
      if (this.stT > 1.8) { if (this.shot >= this.SHOTS) this.over = true; else this.newShot(); }
    }
    // 鏡頭：紙片人在畫面左邊 35% 的地方；飛很高時鏡頭跟著往上
    const wantX = Math.max(0, p.x - V.W * 0.35), wantY = Math.max(0, p.y - this.gy + 160);
    this.camX += (wantX - this.camX) * Math.min(1, dt * 6); this.camY += (wantY - this.camY) * Math.min(1, dt * 5);
  },
  physics(dt) {
    const p = this.p, R = this.R;
    p.vy -= this.G * dt; p.vx *= 1 - 0.03 * dt;
    p.x += p.vx * dt; p.y += p.vy * dt; p.rot += p.spin * dt;
    // 氣球：撞到就破掉、往上彈
    for (const it of this.items) {
      if (it.k !== 'balloon' || it.pop || Math.abs(it.x - p.x) > 80) continue;
      if (Math.hypot(it.x - p.x, it.y + Math.sin(it.ph * 2) * 10 - p.y) < 46 + R) {
        it.pop = 1; p.vy = Math.max(p.vy, 0) + 650; p.vx += 140; p.spin += 4;
        Sfx.play('coin'); FX.burst(this.sx(it.x), this.sy(it.y), 16, [it.c, '#fff'], 0.8); FX.text(this.sx(it.x), this.sy(it.y) - 50, '啵！', it.c, 34);
      }
    }
    if (p.y > R) return;
    // 落地：彈簧床、泥巴、草地
    const on = this.items.find(it => (it.k === 'tramp' || it.k === 'mud') && Math.abs(it.x - p.x) < it.w / 2);
    p.y = R;
    if (on && on.k === 'tramp' && p.vy < 0) {
      p.vy = Math.max(1050, -p.vy * 0.95); p.vx = Math.max(p.vx * 1.05, 380); p.spin = 6; on.boing = 1;
      Sfx.play('boing'); FX.text(this.sx(p.x), this.sy(0) - 60, pick(['彈！', 'BOING!', '咻～']), '#2fa36a', 32);
    } else if (on && on.k === 'mud') {
      if (Math.abs(p.vx) > 40) { Sfx.play('hit'); FX.burst(this.sx(p.x), this.sy(0), 14, ['#6b4a2b', '#8a6440'], 0.6); FX.text(this.sx(p.x), this.sy(0) - 60, '黏住了！', '#6b4a2b', 30); }
      p.vx = 0; p.vy = 0; p.spin = 0;
    } else if (p.vy < -220) {
      p.vy = -p.vy * 0.42; p.vx *= 0.72; p.spin = p.vx / 90;
      Sfx.play('block'); FX.burst(this.sx(p.x), this.sy(0), 6, ['#e9d9b6', '#5fa344'], 0.4);
    } else {
      p.vy = 0; p.vx -= Math.sign(p.vx) * Math.min(Math.abs(p.vx), 900 * dt); p.spin *= 1 - 6 * dt;
    }
  },
  stop() {
    const d = Math.round(this.dist() * 10) / 10;
    this.st = 'done'; this.stT = 0; this.dists.push({ x: this.p.x, d, shot: this.shot });
    this.total += d; this.score = Math.floor(this.total);
    Sfx.play(d >= 50 ? 'star' : 'catch');
    FX.text(this.sx(this.p.x), this.sy(this.p.y) - 90, `${d.toFixed(1)} m`, '#e0573c', 44);
    if (d >= 50) FX.burst(this.sx(this.p.x), this.sy(this.p.y) - 60, 30);
  },

  // ---- 畫面 ----
  draw(c) {
    const camX = this.camX, camY = this.camY, gy = this.sy(0), p = this.p;
    c.fillStyle = '#9fd8ef'; c.fillRect(-20, -20, V.W + 40, V.H + 40);
    c.save(); c.translate(0, camY * 0.3); const T = Paper.bg(c, 'meadow', camX, this.t); c.restore();
    // 地面 + 每 10 公尺一個牌子
    if (gy < V.H + 40) {
      c.fillStyle = T.ground; c.fillRect(-20, gy, V.W + 40, V.H + 40);
      Paper.rect(c, -20, gy - 8, V.W + 40, 18, T.grass, 4, { blur: 4 });
      const step = 10 * this.PPM, first = Math.ceil((camX - this.slingX) / step);
      c.font = '900 16px "Noto Sans TC", system-ui, sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle';
      for (let i = Math.max(1, first); ; i++) {
        const x = this.sx(this.slingX + i * step); if (x > V.W + 40) break;
        Paper.rect(c, x - 3, gy - 46, 6, 46, '#8a5a34', 2, { border: 2, blur: 2 });
        Paper.rect(c, x - 26, gy - 70, 52, 28, '#fffdf5', 6, { border: 2, blur: 3 });
        c.fillStyle = '#4a3520'; c.fillText(`${i * 10}m`, x, gy - 55);
      }
    }
    // 之前幾發的落點旗子
    for (const d of this.dists) {
      const x = this.sx(d.x); if (x < -60 || x > V.W + 60) continue;
      c.strokeStyle = '#5a3d22'; c.lineWidth = 3; c.beginPath(); c.moveTo(x, gy); c.lineTo(x, gy - 80); c.stroke();
      Paper.shape(c, cc => { cc.moveTo(x, gy - 80); cc.lineTo(x + 44, gy - 68); cc.lineTo(x, gy - 56); cc.closePath(); }, ['#ff6b6b', '#ffd93d', '#4d96ff'][d.shot - 1], { border: 2, blur: 3 });
    }
    // 道具
    for (const it of this.items) {
      const x = this.sx(it.x); if (x < -150 || x > V.W + 150) continue;
      if (it.k === 'balloon' && !it.pop) {
        const y = this.sy(it.y) + Math.sin(it.ph * 2) * 10;
        c.strokeStyle = 'rgba(80,60,40,0.6)'; c.lineWidth = 2; c.beginPath(); c.moveTo(x, y + 44); c.quadraticCurveTo(x + 10, y + 80, x - 4, y + 110); c.stroke();
        Paper.shape(c, cc => cc.ellipse(x, y, 34, 42, 0, 0, Math.PI * 2), it.c, { border: 4 });
        c.fillStyle = 'rgba(255,255,255,0.4)'; c.beginPath(); c.ellipse(x - 12, y - 14, 8, 12, -0.4, 0, Math.PI * 2); c.fill();
      } else if (it.k === 'tramp') {
        it.boing = Math.max(0, (it.boing || 0) - 0.05);
        const w = it.w, dip = it.boing * 14;
        for (const lx of [-w / 2 + 12, w / 2 - 12]) Paper.rect(c, x + lx - 5, gy - 30, 10, 30, '#555a66', 3, { border: 2, blur: 2 });
        Paper.shape(c, cc => { cc.moveTo(x - w / 2, gy - 34); cc.quadraticCurveTo(x, gy - 34 + dip * 2, x + w / 2, gy - 34); cc.lineTo(x + w / 2, gy - 24); cc.quadraticCurveTo(x, gy - 24 + dip * 2, x - w / 2, gy - 24); cc.closePath(); }, '#2fbf71', { border: 3 });
      } else if (it.k === 'mud') {
        Paper.shape(c, cc => cc.ellipse(x, gy + 4, it.w / 2, 14, 0, 0, Math.PI * 2), '#6b4a2b', { border: 3, blur: 3 });
        c.fillStyle = 'rgba(255,255,255,0.18)'; c.beginPath(); c.ellipse(x - 20, gy + 1, 22, 4, 0, 0, Math.PI * 2); c.fill();
      }
    }
    // 彈弓（後面那條橡皮筋、叉子）
    const bx = this.sx(this.slingX), by = this.sy(this.slingH), aim = this.st === 'aim';
    const pp = { x: this.sx(p.x), y: this.sy(p.y) };
    const band = (fx) => { c.strokeStyle = '#7a2d1d'; c.lineWidth = 7; c.lineCap = 'round'; c.beginPath(); c.moveTo(bx + fx, by - 10); c.lineTo(aim ? pp.x : bx, aim ? pp.y : by + 10); c.stroke(); };
    if (bx > -120) {
      Paper.shape(c, cc => { cc.moveTo(bx - 7, gy); cc.lineTo(bx - 7, by + 40); cc.lineTo(bx - 40, by - 10); cc.lineTo(bx - 28, by - 16); cc.lineTo(bx, by + 24); cc.lineTo(bx + 28, by - 16); cc.lineTo(bx + 40, by - 10); cc.lineTo(bx + 7, by + 40); cc.lineTo(bx + 7, gy); cc.closePath(); }, '#9a6338', { border: 4 });
      band(32);
    }
    // 瞄準虛線
    if (aim) {
      const q = this.pullOf();
      if (q.len > 25) {
        const v = this.launchV(q.dx, q.dy); let x = p.x, y = p.y, vx = Math.max(0, v.vx), vy = v.vy;
        c.fillStyle = 'rgba(255,253,245,0.9)';
        for (let i = 0; i < 22; i++) { for (let k = 0; k < 4; k++) { vy -= this.G * 0.012; x += vx * 0.012; y += vy * 0.012; } if (y < 0) break; c.beginPath(); c.arc(this.sx(x), this.sy(y), 6 - i * 0.2, 0, Math.PI * 2); c.fill(); }
      } else if (this.stT > 0.6 && !this.kb) {
        // 提示：手指往左下拉
        const k = (this.t % 1.6) / 1.6, hx = bx + 20 - k * 90, hy = by + 10 + k * 70;
        c.globalAlpha = Math.sin(k * Math.PI); c.font = '44px system-ui'; c.textAlign = 'center'; c.fillText('👆', hx, hy + 40); c.globalAlpha = 1;
      }
    }
    // 飛行的軌跡
    c.fillStyle = 'rgba(255,253,245,0.55)';
    for (const [i, q] of this.trail.entries()) { c.beginPath(); c.arc(this.sx(q.x), this.sy(q.y), 2 + i * 0.08, 0, Math.PI * 2); c.fill(); }
    // 紙片人（以身體中心旋轉）
    let pose;
    const P = Puppet.Poses;
    if (aim) pose = { aL: 2.5 + Math.sin(this.t * 14) * 0.2, aR: 2.5 - Math.sin(this.t * 14) * 0.2, aLf: 0.5, aRf: 0.5, lL: 0.5, lR: 0.5, lLf: -1.2, lRf: -1.2, head: Math.sin(this.t * 5) * 0.1 };
    else if (this.st === 'done' || (p.y <= this.R + 1 && Math.abs(p.vx) < 120)) pose = this.st === 'done' && this.stT > 0.4 ? P.cheer(this.t) : P.hurt(this.stT);
    else { const f = Math.sin(this.t * 22); pose = { aL: 2 + f * 0.8, aR: 2 - f * 0.8, aLf: f, aRf: -f, lL: 0.4 + f * 0.3, lR: 0.4 - f * 0.3, lLf: -0.6, lRf: -0.6 }; }
    let rot = aim ? 0 : p.rot;
    if (this.st === 'done') { rot = 0; }
    else if (p.y <= this.R + 1 && Math.abs(p.vx) < 200 && !aim) rot = rot % (Math.PI * 2);
    if (!aim && gy < V.H + 40) { c.fillStyle = 'rgba(60,40,10,0.2)'; const s = Math.max(0.2, 1 - p.y / 500); c.beginPath(); c.ellipse(pp.x, gy + 2, 36 * s, 8 * s, 0, 0, Math.PI * 2); c.fill(); }
    const half = Puppet.size(App.pup, this.PH).h / 2;   // 以身體中心旋轉（寵物比人矮）
    c.save(); c.translate(pp.x, this.st === 'done' ? gy - half : pp.y); c.rotate(rot);
    Puppet.draw(c, App.pup, 0, half, this.PH, pose);
    c.restore();
    if (aim && bx > -120) band(-32);
    // 揮手還能用的提示
    if (this.st === 'fly' && this.flaps > 0 && this.stT > 0.3) {
      c.save(); c.globalAlpha = 0.6 + 0.4 * Math.sin(this.t * 8); c.font = '900 22px "Noto Sans TC", system-ui, sans-serif'; c.textAlign = 'center';
      c.lineWidth = 6; c.strokeStyle = '#fffdf5'; c.lineJoin = 'round'; c.strokeText('點一下：揮手再飛！', V.W / 2, V.H - 30); c.fillStyle = '#2f7de1'; c.fillText('點一下：揮手再飛！', V.W / 2, V.H - 30); c.restore();
    }
  },
  hud() {
    const cur = this.st === 'aim' ? '' : `　這發 ${this.dist().toFixed(1)} m`;
    return { L: `<b>${this.score}</b> m${cur}`, R: `第 ${Math.min(this.shot, this.SHOTS)} / ${this.SHOTS} 發` };
  },
});
