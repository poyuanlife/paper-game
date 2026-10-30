'use strict';
// =====================================================
//  體感遊戲共用的小工具 + 「傾斜閃避 / 收集」遊戲產生器（東西一直飛過來，傾斜手機左右或上下移動）
// =====================================================
const TiltUI = {
  // 提示文字：前幾秒（或沒有陀螺儀時）顯示
  hint(c, g, y, color = '#2a2a33', shake) {
    if (g.t < 5 || (!(shake ? Tilt.motion : Tilt.active) && g.t < 12)) Kid.text(c, shake ? Tilt.shakeHint() : Tilt.hint(), V.W / 2, y == null ? V.H - 30 : y, 18, color, 6);
  },
  // 右下角的傾斜指示器
  dial(c, x = V.W - 56, y = V.H - 70) { Paper.circle(c, x, y, 30, 'rgba(255,253,245,0.85)', { border: 3, blur: 4 }); Paper.circle(c, x + Tilt.x * 21, y + Tilt.y * 21, 9, '#3f8fe0', { border: 2, blur: 2 }); },
  lives(n, max = 3) { return '❤️'.repeat(Math.max(0, n)) + '🤍'.repeat(Math.max(0, max - n)); },
  // 常用的畫法
  rock(c, x, y, r, col = '#8a8a96') { Paper.shape(c, cc => { for (let i = 0; i < 8; i++) { const a = i / 8 * Math.PI * 2, rr = r * (0.82 + 0.22 * Math.sin(i * 2.7 + r)); cc.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr * 0.8); } cc.closePath(); }, col, { border: 3, blur: 5 }); },
  ring(c, x, y, r, col = '#ffd23f') { c.save(); c.strokeStyle = '#fffdf5'; c.lineWidth = 12; c.beginPath(); c.ellipse(x, y, r, r * 0.82, 0, 0, Math.PI * 2); c.stroke(); c.strokeStyle = col; c.lineWidth = 7; c.stroke(); c.restore(); },
  log(c, x, y, r) { Paper.rect(c, x - r * 1.3, y - r * 0.38, r * 2.6, r * 0.76, '#8a5a34', r * 0.38, { border: 3 }); c.fillStyle = '#c99b62'; c.beginPath(); c.ellipse(x + r * 1.2, y, r * 0.2, r * 0.32, 0, 0, Math.PI * 2); c.fill(); },
  storm(c, x, y, r) { Paper.circle(c, x - r * 0.4, y, r * 0.55, '#6a6f86', { border: 3 }); Paper.circle(c, x + r * 0.35, y - r * 0.1, r * 0.65, '#6a6f86', { border: 3 }); Kid.emoji(c, '⚡', x, y + r * 0.55, r * 0.8); },
  tree(c, x, y, r) { Paper.shape(c, cc => { cc.moveTo(x, y - r * 1.2); cc.lineTo(x + r * 0.6, y + r * 0.3); cc.lineTo(x - r * 0.6, y + r * 0.3); cc.closePath(); }, '#3d8b4a', { border: 3, blur: 4 }); c.fillStyle = '#6a4a2a'; c.fillRect(x - 5, y + r * 0.3, 10, r * 0.35); },
};

// ---- 產生器 ----
// dir：'down' 東西從上往下（你在下面左右移）、'up' 從下往上（你在上面）、'left' 從右往左（你在左邊上下移）
function TiltRun(cfg) {
  const side = cfg.dir === 'left';
  registerGame(Object.assign({
    tilt: true, TIME: 45,
    start() {
      this.t = 0; this.left = this.TIME; this.score = 0; this.over = false; this.overText = cfg.end || '時間到！';
      this.lives = cfg.lives || 0; this.hurt = 0; this.items = []; this.spawnT = 0.6; this.scroll = 0; this.pos = 0.5; this.vel = 0; this.got = 0; this.cheer = 0;
    },
    pp() { return side ? { x: V.W * 0.2, y: V.H * (0.16 + 0.74 * this.pos) } : { x: V.W * (0.08 + 0.84 * this.pos), y: cfg.dir === 'up' ? V.H * 0.3 : V.H * 0.8 }; },
    spawn() {
      const L = cfg.items, tot = L.reduce((a, b) => a + (b.w || 1), 0); let r = Math.random() * tot, K = L[0];
      for (const k of L) { r -= k.w || 1; if (r <= 0) { K = k; break; } }
      const s = rand(0.06, 0.94), it = { K, r: K.r || 30, rot: rand(-0.3, 0.3), ph: rand(0, 6) };
      if (side) { it.x = V.W + 70; it.y = V.H * (0.12 + 0.8 * s); } else { it.x = V.W * s; it.y = cfg.dir === 'up' ? V.H + 70 : -70; }
      this.items.push(it);
      this.spawnT = (cfg.gap || 0.7) * rand(0.6, 1.3) / (1 + this.t / 60);
    },
    tap() { Tilt.calibrate(); },
    update(dt) {
      this.t += dt; this.left -= dt; this.hurt = Math.max(0, this.hurt - dt); this.cheer = Math.max(0, this.cheer - dt);
      if (this.left <= 0) { this.left = 0; this.over = true; return; }
      const s = side ? Tilt.y : Tilt.x;
      this.vel += (s * 1.15 - this.vel) * Math.min(1, dt * 7); this.pos = clamp(this.pos + this.vel * dt, 0, 1);
      const sp = (cfg.speed || 260) * (1 + this.t / 70) * (this.hurt > 0.6 && !this.lives ? 0.5 : 1);
      this.scroll += sp * dt;
      this.spawnT -= dt; if (this.spawnT <= 0) this.spawn();
      const P = this.pp(), pr = cfg.pr || 38;
      for (const it of this.items) {
        const d = sp * dt * (it.K.sp || 1) * (side ? V.W / 1280 + 0.4 : V.H / 720);
        if (side) it.x -= d; else it.y += cfg.dir === 'up' ? -d : d;
        if (it.K.wave) { if (side) it.y += Math.sin(this.t * 3 + it.ph) * 40 * dt; else it.x += Math.sin(this.t * 3 + it.ph) * 40 * dt; }
        if (it.x < -100 || it.y < -120 || it.y > V.H + 120) it.dead = 1;
        if (it.dead || it.hit) continue;
        const dist = Math.hypot(it.x - P.x, it.y - P.y);
        if (it.K.ring ? dist < it.r * 0.75 : dist < it.r * 0.8 + pr) {
          it.hit = 1;
          if (it.K.bad) {
            if (this.hurt) { it.hit = 0; continue; }
            this.hurt = 1.3; V.shake = 8; Sfx.play(this.lives ? 'hit' : 'boing');
            FX.text(P.x, P.y - 60, cfg.ouch || '哎呀！', '#e8453c', 30);
            if (this.lives) { this.lives--; if (this.lives <= 0) { this.over = true; this.overText = cfg.lose || '撞到了！'; return; } }
          } else {
            const pts = it.K.pts || 10; this.score += pts; this.got++; this.cheer = 0.6; it.dead = 1;
            Sfx.play(it.K.ring || pts >= 25 ? 'star' : 'coin'); FX.burst(it.x, it.y, it.K.ring ? 16 : 8, undefined, 0.6); FX.text(it.x, it.y - 40, '+' + pts, '#ff7a00', 28);
          }
        }
      }
      this.items = this.items.filter(it => !it.dead);
    },
    drawItem(c, it) {
      const K = it.K, x = it.x, y = it.y, r = it.r;
      if (K.ring) return TiltUI.ring(c, x, y, r, it.hit ? '#45ad4a' : K.col || '#ffd23f');
      if (K.draw) return TiltUI[K.draw](c, x, y, r);
      c.save(); c.translate(x, y); if (K.flip) c.scale(-1, 1); Kid.emoji(c, K.e, 0, 0, r * 1.7, it.rot + (K.wobble ? Math.sin(this.t * 6 + it.ph) * 0.2 : 0)); c.restore();
    },
    draw(c) {
      cfg.bg(c, this);
      for (const it of this.items) this.drawItem(c, it);
      const P = this.pp();
      c.save(); if (this.hurt && Math.sin(this.t * 30) > 0) c.globalAlpha = 0.5;
      cfg.player(c, P.x, P.y, this); c.restore();
      TiltUI.hint(c, this, cfg.hintY ? V.H * cfg.hintY : null, cfg.hintCol);
    },
    hud() { return { L: `<b>${this.score}</b> 分`, R: (this.lives ? TiltUI.lives(this.lives, cfg.lives) + '　' : '') + `⏱ ${Math.ceil(this.left)}` }; },
  }, cfg));
}

// ---- 背景 ----
const BG = {
  sky(c, g, up) { const gr = c.createLinearGradient(0, 0, 0, V.H); gr.addColorStop(0, '#6ec3f0'); gr.addColorStop(1, '#d5f0ff'); c.fillStyle = gr; c.fillRect(-20, -20, V.W + 40, V.H + 40);
    for (let i = 0; i < 7; i++) { const sp = 0.4 + (i % 3) * 0.2, y = (((i * 157 + (up ? -1 : 1) * g.scroll * sp * 0.5) % (V.H + 200)) + V.H + 200) % (V.H + 200) - 100; c.globalAlpha = 0.85; Paper.circle(c, (i * 233) % V.W, y, 40 + (i % 3) * 14, '#ffffff', { border: 0, blur: 8 }); Paper.circle(c, (i * 233) % V.W + 40, y + 8, 30 + (i % 2) * 10, '#ffffff', { border: 0, blur: 8 }); c.globalAlpha = 1; } },
  side(c, g, top, bot) { const gr = c.createLinearGradient(0, 0, 0, V.H); gr.addColorStop(0, top); gr.addColorStop(1, bot); c.fillStyle = gr; c.fillRect(-20, -20, V.W + 40, V.H + 40); },
};

// ---- 7 款 ----
TiltRun({
  id: 'skydive', name: '跳傘大冒險', icon: '🪂', color: '#3f8fe0', dir: 'up', lives: 3, speed: 240,
  desc: '從高空往下跳，傾斜手機穿過圈圈！（手機限定）',
  howto: '📱 手機限定：紙片人從飛機上跳下來了！左右傾斜手機移動，穿過 ⭕ 金色圈圈得 25 分、吃 ⭐ 得 10 分，閃開小鳥。撞到 3 次就結束，限時 45 秒。（電腦用 ← → 鍵）',
  end: '安全降落！', lose: '被小鳥撞暈了！', ouch: '啾啾！',
  items: [{ ring: 1, pts: 25, r: 62, w: 3 }, { e: '⭐', pts: 10, r: 24, w: 3 }, { e: '🐦', bad: 1, r: 30, w: 3, wave: 1, sp: 1.2 }, { e: '🎈', pts: 15, r: 28, w: 1, wave: 1 }],
  bg(c, g) { BG.sky(c, g, true); },
  player(c, x, y, g) { const P = Puppet.Poses; Puppet.draw(c, App.pup, x, y + 70, 140, g.cheer ? P.cheer(g.t) : { aL: 2.4 + Math.sin(g.t * 8) * 0.15, aR: 2.4 - Math.sin(g.t * 8) * 0.15, aLf: 0.3, aRf: 0.3, lL: 0.35, lR: 0.35, lLf: -0.4, lRf: -0.4, rot: g.vel * 0.3 }); },
});

TiltRun({
  id: 'river', name: '河流漂漂', icon: '🛶', color: '#2fa5c9', dir: 'down', lives: 3, speed: 230,
  desc: '坐紙船順著河流漂，閃開石頭和木頭！（手機限定）',
  howto: '📱 手機限定：左右傾斜手機划紙船，閃開石頭和木頭，收集 🦆 小鴨、🐸 青蛙和 💰 錢袋。撞到 3 次船就沉了，限時 45 秒。（電腦用 ← → 鍵）',
  end: '漂到終點了！', lose: '紙船泡水了！', ouch: '咚！',
  items: [{ draw: 'rock', bad: 1, r: 34, w: 4 }, { draw: 'log', bad: 1, r: 32, w: 2 }, { e: '🦆', pts: 10, r: 26, w: 3, wobble: 1 }, { e: '🐸', pts: 15, r: 24, w: 2 }, { e: '💰', pts: 25, r: 24, w: 1 }],
  bg(c, g) {
    c.fillStyle = '#7dbb5c'; c.fillRect(-20, -20, V.W + 40, V.H + 40);
    const m = V.W * 0.04; c.fillStyle = '#4fb3e8'; c.fillRect(m, -20, V.W - m * 2, V.H + 40);
    c.strokeStyle = 'rgba(255,255,255,0.5)'; c.lineWidth = 3;
    for (let i = 0; i < 14; i++) { const y = ((i * 83 + g.scroll * 0.9) % (V.H + 60)) - 30, x = m + ((i * 191) % (V.W - m * 2)); c.beginPath(); c.moveTo(x - 20, y); c.quadraticCurveTo(x, y - 8, x + 20, y); c.stroke(); }
  },
  player(c, x, y, g) {
    c.save(); c.translate(x, y); c.rotate(g.vel * 0.25);
    Paper.shape(c, cc => { cc.moveTo(-48, -8); cc.lineTo(48, -8); cc.lineTo(30, 22); cc.lineTo(-30, 22); cc.closePath(); }, '#fffdf5', { border: 3 });
    Paper.shape(c, cc => { cc.moveTo(0, -8); cc.lineTo(0, -60); cc.lineTo(32, -14); cc.closePath(); }, '#ffd23f', { border: 3 });
    Kid.head(c, -18, -28, 20); c.restore();
  },
});

TiltRun({
  id: 'hotair', name: '熱氣球旅行', icon: '🎈', color: '#e9654b', dir: 'down', lives: 3, speed: 200, pr: 50,
  desc: '坐熱氣球在天空飛，閃開閃電和小鳥！（手機限定）',
  howto: '📱 手機限定：左右傾斜手機讓熱氣球移動，收集 ⭐ 和 🎈，小心 ⚡ 雷雨雲和小鳥！撞到 3 次就要降落了，限時 45 秒。（電腦用 ← → 鍵）',
  end: '環遊天空成功！', lose: '熱氣球降落了！',
  items: [{ draw: 'storm', bad: 1, r: 44, w: 2 }, { e: '🐦', bad: 1, r: 28, w: 2, wave: 1, flip: 1 }, { e: '⭐', pts: 10, r: 24, w: 4 }, { e: '🎈', pts: 15, r: 28, w: 2, wobble: 1 }],
  bg(c, g) { BG.sky(c, g); },
  player(c, x, y, g) {
    c.save(); c.translate(x, y); c.rotate(g.vel * 0.12);
    c.strokeStyle = '#7a4a22'; c.lineWidth = 2; c.beginPath(); c.moveTo(-26, -20); c.lineTo(-16, 14); c.moveTo(26, -20); c.lineTo(16, 14); c.stroke();
    Paper.shape(c, cc => { cc.arc(0, -70, 52, Math.PI * 0.8, Math.PI * 2.2); cc.lineTo(0, -16); cc.closePath(); }, '#e8453c', { border: 4 });
    c.fillStyle = '#ffd23f'; c.beginPath(); c.ellipse(0, -72, 18, 50, 0, 0, Math.PI * 2); c.fill();
    Paper.rect(c, -22, 12, 44, 30, '#c98a4b', 6, { border: 3 });
    Kid.head(c, 0, 4, 18); c.restore();
  },
});

TiltRun({
  id: 'sled', name: '企鵝雪橇', icon: '🐧', color: '#5aa9e6', dir: 'down', speed: 240, kid: true,
  desc: '坐雪橇滑下雪坡，吃小魚！撞到不會輸～（手機限定）',
  howto: '📱 手機限定：把手機往左右歪，雪橇就會轉彎！收集 🐟 小魚和 ⭐ 星星，撞到樹或雪人會慢下來，但是不會輸喔。限時 45 秒。（電腦用 ← → 鍵）',
  end: '滑得好開心！', ouch: '哎唷～',
  items: [{ draw: 'tree', bad: 1, r: 34, w: 3 }, { e: '⛄', bad: 1, r: 30, w: 1 }, { e: '🐟', pts: 10, r: 24, w: 4 }, { e: '⭐', pts: 20, r: 24, w: 1 }],
  bg(c, g) { c.fillStyle = '#f2f8ff'; c.fillRect(-20, -20, V.W + 40, V.H + 40); c.fillStyle = 'rgba(160,190,230,0.25)'; for (let i = 0; i < 12; i++) { const y = ((i * 97 + g.scroll) % (V.H + 60)) - 30; c.beginPath(); c.ellipse((i * 211) % V.W, y, 60, 10, 0, 0, Math.PI * 2); c.fill(); } },
  player(c, x, y, g) {
    c.save(); c.translate(x, y); c.rotate(g.vel * 0.3);
    Paper.rect(c, -34, 8, 68, 14, '#e8453c', 7, { border: 3 });
    Puppet.draw(c, App.pup, 0, 12, 90, g.cheer ? Puppet.Poses.cheer(g.t) : { aL: 1.2, aR: 1.2, lL: 0.9, lR: 0.9, lLf: -1.2, lRf: -1.2 }); Kid.emoji(c, '🐧', 36, -10, 30); c.restore();
  },
});

TiltRun({
  id: 'meteor', name: '流星雨大作戰', icon: '☄️', color: '#3b3f8c', dir: 'down', lives: 3, speed: 300,
  desc: '傾斜手機開太空船，閃過滿天隕石！（手機限定）',
  howto: '📱 手機限定：左右傾斜手機開太空船，閃開掉下來的隕石和 🛸 飛碟，收集 ⭐ 星星和 💎 寶石。撞到 3 次就結束，限時 45 秒，越後面越快！（電腦用 ← → 鍵）',
  end: '平安回到地球！', lose: '太空船撞壞了！',
  items: [{ draw: 'rock', bad: 1, r: 36, w: 5, sp: 1.2 }, { e: '🛸', bad: 1, r: 30, w: 1, wave: 1 }, { e: '⭐', pts: 10, r: 24, w: 3 }, { e: '💎', pts: 30, r: 24, w: 1 }],
  gap: 0.55, hintCol: '#ffffff',
  bg(c, g) { c.fillStyle = '#0f1433'; c.fillRect(-20, -20, V.W + 40, V.H + 40); for (let i = 0; i < 50; i++) { const y = ((i * 97 + g.scroll * (0.3 + (i % 3) * 0.3)) % V.H); c.fillStyle = 'rgba(255,255,255,0.6)'; c.fillRect((i * 173) % V.W, y, 2, 2 + (i % 3)); } },
  player(c, x, y, g) {
    c.save(); c.translate(x, y); c.rotate(g.vel * 0.3);
    Paper.shape(c, cc => { cc.moveTo(-12, 34); cc.lineTo(0, 34 + 18 + Math.sin(g.t * 40) * 6); cc.lineTo(12, 34); cc.closePath(); }, '#ff9a2e', { border: 0, shadowColor: 'rgba(255,160,40,0.9)', blur: 14 });
    Paper.shape(c, cc => { cc.moveTo(0, -50); cc.quadraticCurveTo(30, -20, 28, 36); cc.lineTo(-28, 36); cc.quadraticCurveTo(-30, -20, 0, -50); cc.closePath(); }, '#e8ecf5', { border: 4 });
    Paper.circle(c, 0, -4, 18, '#7fd8ff', { border: 3, blur: 0 }); Kid.head(c, 0, -2, 14, {}, 16); c.restore();
  },
});

TiltRun({
  id: 'submarine', name: '小小潛水艇', icon: '🐠', color: '#1d6fa8', dir: 'left', lives: 3, speed: 240, pr: 34,
  desc: '開潛水艇探索海底，閃開鯊魚！（手機限定）',
  howto: '📱 手機限定：手機往前傾，潛水艇往上；往後傾，潛水艇往下。收集 🐚 貝殼、🐠 小魚、💎 寶石，閃開 🦈 鯊魚和 🐡 河豚。撞到 3 次就結束，限時 45 秒。（電腦用 ↑ ↓ 鍵）',
  end: '海底探險完成！', lose: '潛水艇被撞壞了！', hintCol: '#ffffff',
  items: [{ e: '🦈', bad: 1, r: 36, w: 3, sp: 1.3 }, { e: '🐡', bad: 1, r: 28, w: 2, wave: 1 }, { e: '🐚', pts: 10, r: 22, w: 3 }, { e: '🐠', pts: 15, r: 24, w: 3, wave: 1 }, { e: '💎', pts: 30, r: 22, w: 1 }],
  bg(c, g) {
    BG.side(c, g, '#4fb3e8', '#0d3b66');
    c.fillStyle = 'rgba(255,255,255,0.35)'; for (let i = 0; i < 20; i++) { const x = ((i * 137 - g.scroll * 0.6) % (V.W + 40) + V.W + 40) % (V.W + 40) - 20, y = ((i * 89 - g.t * 40) % V.H + V.H) % V.H; c.beginPath(); c.arc(x, y, 3 + (i % 3) * 2, 0, Math.PI * 2); c.fill(); }
    c.fillStyle = '#e6c88a'; c.fillRect(-20, V.H - 18, V.W + 40, 30);
  },
  player(c, x, y, g) {
    c.save(); c.translate(x, y); c.rotate(g.vel * 0.25);
    Paper.rect(c, -50, -24, 100, 48, '#ffd23f', 24, { border: 4 }); Paper.rect(c, -10, -44, 28, 24, '#ffd23f', 6, { border: 3 });
    Paper.circle(c, 10, 0, 16, '#7fd8ff', { border: 3, blur: 0 }); Kid.head(c, 10, 2, 12, {}, 14);
    c.fillStyle = '#e8453c'; c.save(); c.translate(-54, 0); c.rotate(g.t * 12); c.fillRect(-3, -14, 6, 28); c.restore(); c.restore();
  },
});

TiltRun({
  id: 'paperplane', name: '紙飛機飛呀飛', icon: '✈️', color: '#7a8cc9', dir: 'left', lives: 3, speed: 260, pr: 30,
  desc: '紙片人坐紙飛機，傾斜手機穿過圈圈！（手機限定）',
  howto: '📱 手機限定：手機往前傾，紙飛機往上；往後傾，往下。穿過 ⭕ 圈圈 25 分、吃 ⭐ 10 分，閃開雷雨雲和小鳥。撞到 3 次就結束，限時 45 秒。（電腦用 ↑ ↓ 鍵）',
  end: '飛得好遠！', lose: '紙飛機掉下去了！',
  items: [{ ring: 1, pts: 25, r: 58, w: 3, col: '#ff7eb6' }, { draw: 'storm', bad: 1, r: 44, w: 2 }, { e: '🐦', bad: 1, r: 28, w: 2, wave: 1, sp: 1.3 }, { e: '⭐', pts: 10, r: 24, w: 3 }],
  bg(c, g) { const gr = c.createLinearGradient(0, 0, 0, V.H); gr.addColorStop(0, '#ffc8a2'); gr.addColorStop(1, '#fff1d6'); c.fillStyle = gr; c.fillRect(-20, -20, V.W + 40, V.H + 40);
    for (let i = 0; i < 6; i++) { const x = ((i * 260 - g.scroll * 0.3) % (V.W + 200) + V.W + 200) % (V.W + 200) - 100; Paper.circle(c, x, 80 + (i * 97) % (V.H - 160), 36, 'rgba(255,255,255,0.8)', { border: 0, blur: 6 }); } },
  player(c, x, y, g) {
    c.save(); c.translate(x, y); c.rotate(-g.vel * 0.35);
    Paper.shape(c, cc => { cc.moveTo(54, 0); cc.lineTo(-40, -26); cc.lineTo(-24, 0); cc.lineTo(-40, 18); cc.closePath(); }, '#fffdf5', { border: 3 });
    c.strokeStyle = 'rgba(120,120,140,0.5)'; c.lineWidth = 2; c.beginPath(); c.moveTo(54, 0); c.lineTo(-24, 0); c.stroke();
    Kid.head(c, -6, -22, 18); c.restore();
  },
});
