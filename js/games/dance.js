'use strict';
// 紙片人跳舞（節奏遊戲）：音樂用 WebAudio 現場合成。音符掉到下面的圓圈時點那一條，紙片人就跳出對應的舞步。
// 音符的左 / 中 / 右跟著旋律走：音往下 = 左、一樣高 = 中、往上 = 右。
registerGame({
  id: 'dance', name: '紙片人跳舞', icon: '💃', color: '#c77dff',
  desc: '跟著音樂的節拍點，讓紙片人跳舞！',
  howto: '音符掉到下面的圓圈時，點那一條（或用 ← ↑ → 鍵）。點得越準分數越高，連擊越多加成越大。兩個音符一起來就兩邊一起點！記得開聲音。',
  BPM: 112,
  TRAVEL: 1.4,   // 音符從上面掉到圓圈要幾秒
  LANES: [{ c: '#ff6b6b', key: '←' }, { c: '#ffc23d', key: '★' }, { c: '#4d96ff', key: '→' }],
  GRADES: [{ w: 0.05, s: 'PERFECT', c: '#ff4fa3', pts: 100, acc: 1 }, { w: 0.1, s: 'GREAT', c: '#ff9f1c', pts: 70, acc: 0.75 }, { w: 0.17, s: 'GOOD', c: '#2fa7e0', pts: 40, acc: 0.45 }],

  // ---- 歌曲：前奏 2 小節 → 四段越來越難 → 結尾。每次玩都一樣（固定亂數種子），練習會進步 ----
  build() {
    if (this.song) return this.song;
    let seed = 20261028;
    const rnd = () => { seed = (seed + 0x6D2B79F5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
    const B = 60 / this.BPM, E = B / 2;
    const PROG = [[48, 52, 55], [45, 48, 52], [41, 45, 48], [43, 47, 50]];   // C  Am  F  G
    const SCALE = [60, 62, 64, 67, 69, 72, 74, 76, 79, 81];                  // C 大調五聲音階
    // pats：每小節的節奏（第幾個八分音符有音符），dbl：小節第一拍變成左右一起按的機率
    const SECT = [
      { bars: 2 },
      { bars: 8, pats: [[0, 4], [0, 4], [0, 2, 4], [0, 4, 6]], dbl: 0 },
      { bars: 8, pats: [[0, 2, 4, 6], [0, 2, 4], [0, 3, 4, 6], [0, 2, 4, 6]], dbl: 0.12 },
      { bars: 8, pats: [[0, 2, 3, 4, 6], [0, 2, 4, 5, 6], [0, 1, 2, 4, 6], [0, 2, 4, 6, 7]], dbl: 0.2 },
      { bars: 8, pats: [[0, 1, 2, 4, 5, 6], [0, 2, 3, 4, 6, 7], [0, 1, 2, 3, 4, 6], [0, 2, 4, 5, 6, 7]], dbl: 0.25 },
      { bars: 2, end: true },
    ];
    const ev = [], notes = []; let bar = 0, mi = 5;
    SECT.forEach((S, si) => {
      for (let b = 0; b < S.bars; b++, bar++) {
        const t0 = bar * 4 * B, ch = PROG[bar % 4];
        if (S.end) {
          if (b === 0) {
            ev.push({ t: t0, k: 'kick' }, { t: t0, k: 'crash' }, { t: t0, k: 'bass', n: ch[0] - 12, d: B * 3 });
            ch.forEach(n => ev.push({ t: t0, k: 'pad', n: n + 12, d: B * 4 }));
            ev.push({ t: t0, k: 'lead', n: 72, d: B * 2 });
            notes.push({ t: t0, lane: 0 }, { t: t0, lane: 2 });
          }
          continue;
        }
        // 鼓、貝斯、和弦
        for (let p = 0; p < 8; p++) {
          const t = t0 + p * E;
          if (p === 0 || p === 4 || (si >= 3 && p === 7)) ev.push({ t, k: 'kick' });
          if (si >= 1 && (p === 2 || p === 6)) ev.push({ t, k: 'snare' });
          ev.push({ t, k: 'hat', v: p % 2 ? 1 : 0.6 });
          if (si >= 1) ev.push({ t, k: 'bass', n: ch[0] - 12 + (p % 2 ? 12 : 0), d: E * 0.8 });
          if (si >= 2 && p % 2) ch.forEach(n => ev.push({ t, k: 'pad', n: n + 12, d: E * 0.6 }));
        }
        if (si === 1) ch.forEach(n => ev.push({ t: t0, k: 'pad', n: n + 12, d: B * 3.8, soft: 1 }));
        if (b === 0 && si >= 2) ev.push({ t: t0, k: 'crash' });
        // 旋律 = 音符
        if (!S.pats) continue;
        const pat = S.pats[Math.floor(rnd() * S.pats.length)], pcs = ch.map(n => n % 12);
        for (const p of pat) {
          const t = t0 + p * E, prev = mi;
          if (p === 0 || p === 4) {   // 強拍：找最近的和弦音
            let best = mi, bd = 99;
            SCALE.forEach((n, i) => { if (pcs.includes(n % 12)) { const d = Math.abs(i - mi) + rnd() * 1.5; if (d < bd && i !== mi) { bd = d; best = i; } } });
            mi = best;
          } else mi = clamp(mi + pick([-2, -1, -1, 0, 1, 1, 2]), 0, SCALE.length - 1);
          const d = p === pat[pat.length - 1] ? E * 1.6 : E * 0.9;
          if (p === 0 && rnd() < S.dbl) {
            notes.push({ t, lane: 0 }, { t, lane: 2 });
            ev.push({ t, k: 'lead', n: SCALE[mi], d }, { t, k: 'lead', n: SCALE[Math.max(0, mi - 2)], d });
          } else {
            notes.push({ t, lane: mi < prev ? 0 : mi > prev ? 2 : 1 });
            ev.push({ t, k: 'lead', n: SCALE[mi], d });
          }
        }
      }
    });
    ev.sort((a, b) => a.t - b.t);
    notes.sort((a, b) => a.t - b.t || a.lane - b.lane);
    return (this.song = { ev, notes, B, end: bar * 4 * B });
  },

  // ---- 音效合成 ----
  audio() {
    const ac = Sfx.unlock(); if (!ac) return null;
    if (!this.noiseBuf || this.noiseBuf.sampleRate !== ac.sampleRate) {
      const b = ac.createBuffer(1, ac.sampleRate, ac.sampleRate), d = b.getChannelData(0);
      for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
      this.noiseBuf = b;
    }
    return ac;
  },
  newMaster() {
    this.stopMusic(); const ac = this.ac; if (!ac) return;
    const m = ac.createGain(); m.gain.value = Sfx.on ? 0.75 : 0;
    const comp = ac.createDynamicsCompressor(); m.connect(comp); comp.connect(ac.destination);
    this.master = m; this.masterOut = comp;
  },
  stopMusic() {
    if (this.master) { try { this.master.gain.cancelScheduledValues(0); this.master.gain.value = 0; this.master.disconnect(); this.masterOut.disconnect(); } catch (e) {} }
    this.master = null;
  },
  playEv(e, at) {
    const ac = this.ac, out = this.master; if (!ac || !out) return;
    const mtof = n => 440 * Math.pow(2, (n - 69) / 12);
    const env = (g, v, d, a = 0.003) => { g.gain.setValueAtTime(0.0001, at); g.gain.linearRampToValueAtTime(v, at + a); g.gain.exponentialRampToValueAtTime(0.0001, at + d); };
    const osc = (type, f, g) => { const o = ac.createOscillator(); o.type = type; o.frequency.setValueAtTime(f, at); o.connect(g); return o; };
    const noise = (fType, freq, v, d) => {
      const s = ac.createBufferSource(), f = ac.createBiquadFilter(), g = ac.createGain();
      s.buffer = this.noiseBuf; f.type = fType; f.frequency.value = freq; s.connect(f); f.connect(g); g.connect(out); env(g, v, d, 0.001);
      s.start(at, Math.random() * 0.5); s.stop(at + d + 0.02);
    };
    const g = ac.createGain();
    switch (e.k) {
      case 'kick': { g.connect(out); env(g, 0.95, 0.3, 0.002); const o = osc('sine', 150, g); o.frequency.exponentialRampToValueAtTime(42, at + 0.13); o.start(at); o.stop(at + 0.32); break; }
      case 'snare': { noise('highpass', 1300, 0.32, 0.17); g.connect(out); env(g, 0.22, 0.09); const o = osc('triangle', 190, g); o.start(at); o.stop(at + 0.1); break; }
      case 'hat': noise('highpass', 7500, 0.07 * e.v, 0.045); break;
      case 'crash': noise('highpass', 4200, 0.16, 1.3); break;
      case 'bass': { const f = ac.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = 520; f.Q.value = 6; g.connect(f); f.connect(out); env(g, 0.26, e.d, 0.005); const o = osc('sawtooth', mtof(e.n), g); o.start(at); o.stop(at + e.d + 0.02); break; }
      case 'pad': { g.connect(out); env(g, e.soft ? 0.035 : 0.05, e.d, e.soft ? 0.08 : 0.004); const o = osc('triangle', mtof(e.n), g); o.start(at); o.stop(at + e.d + 0.02); break; }
      case 'lead': {
        const f = ac.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = 2600; g.connect(f); f.connect(out); env(g, 0.075, e.d, 0.004);
        const o1 = osc('square', mtof(e.n), g), o2 = osc('triangle', mtof(e.n + 12), g); o1.start(at); o2.start(at); o1.stop(at + e.d + 0.02); o2.stop(at + e.d + 0.02); break;
      }
    }
  },
  // 時鐘：有音效就用音效的時間（跟音樂一定對得上），沒有就用一般的時間
  clock() { return this.ac ? this.ac.currentTime : performance.now() / 1000; },

  start() {
    this.stopMusic();
    const S = this.build();
    this.notes = S.notes.map(n => ({ t: n.t, lane: n.lane, done: 0 }));
    this.t = 0; this.cur = -1; this.started = false; this.evI = 0; this.nI = 0;
    this.score = 0; this.combo = 0; this.maxCombo = 0; this.acc = 0; this.judged = 0; this.counts = { PERFECT: 0, GREAT: 0, GOOD: 0, MISS: 0 };
    this.press = [0, 0, 0]; this.moves = [0, 0, 0]; this.missT = 0; this.over = false; this.overText = '';
    this.flash = 0; this.lastBeat = -1; this.fever = 0;
  },
  onEnter(prev) {
    this.ac = this.audio();
    this.lat = this.ac ? Math.min(0.25, (this.ac.outputLatency || 0) + (this.ac.baseLatency || 0)) : 0;
    this.newMaster();
    const S = this.song;
    if (!this.started) { this.started = true; this.t0 = this.clock() + 0.6; this.evI = 0; }
    else {
      // 暫停後繼續：退回一點點，讓玩家有時間準備，音樂從暫停的地方接著放
      const at = this.pausedAt; this.t0 = this.clock() - at + 0.9;
      this.evI = S.ev.findIndex(e => e.t >= at); if (this.evI < 0) this.evI = S.ev.length;
    }
  },
  onLeave() { this.pausedAt = this.songT(); this.stopMusic(); },
  songT() { return this.clock() - this.t0; },

  layout() {
    const wide = V.W > V.H * 1.15;
    if (wide) {
      const lw = Math.min(480, V.W * 0.42);
      return { wide, cx: V.W * 0.64, lw, top: 112, hit: V.H - 96, px: V.W * 0.25, py: V.H * 0.9, ph: Math.min(V.H * 0.64, 460) };
    }
    const lw = Math.min(V.W - 28, 500);
    return { wide, cx: V.W / 2, lw, top: V.H * 0.56, hit: V.H * 0.88, px: V.W / 2, py: V.H * 0.47, ph: Math.min(V.H * 0.31, 360) };
  },
  laneX(L, i) { return L.cx + (i - 1) * L.lw / 3; },

  tap(x) {
    const L = this.layout();
    this.hit(clamp(Math.floor((x - (L.cx - L.lw / 2)) / (L.lw / 3)), 0, 2));
  },
  key(k) {
    const m = { arrowleft: 0, a: 0, j: 0, arrowup: 1, arrowdown: 1, space: 1, w: 1, s: 1, k: 1, arrowright: 2, d: 2, l: 2 };
    if (k in m) this.hit(m[k]);
  },

  hit(lane) {
    if (!this.started) return;
    const now = this.cur; this.press[lane] = 1;
    let best = null, bd = 9;
    for (let i = this.nI; i < this.notes.length; i++) {
      const n = this.notes[i]; if (n.t - now > 0.3) break;
      if (n.done || n.lane !== lane) continue;
      const d = Math.abs(now - n.t); if (d < bd) { bd = d; best = n; }
    }
    const G = this.GRADES.find(g => bd <= g.w);
    if (!best || !G) { this.moves[lane] = 0.6; return; }   // 沒有音符也會跳，只是不算分
    best.done = 1; this.judged++; this.counts[G.s]++; this.acc += G.acc;
    this.combo++; this.maxCombo = Math.max(this.maxCombo, this.combo);
    this.score += Math.round(G.pts * (1 + Math.min(this.combo, 100) / 100));
    this.moves[lane] = 1;
    const L = this.layout(), x = this.laneX(L, lane);
    FX.text(L.cx, L.hit - 120, G.s, G.c, G.s === 'PERFECT' ? 36 : 30);
    FX.burst(x, L.hit, G.s === 'PERFECT' ? 10 : 5, [this.LANES[lane].c, '#fff6c8'], 0.45);
    if (this.combo > 0 && this.combo % 50 === 0) { FX.text(L.cx, L.hit - 170, `${this.combo} 連擊！`, '#ff4fa3', 42); Sfx.play('star'); }
  },
  miss(n) {
    n.done = 2; this.judged++; this.counts.MISS++;
    if (this.combo >= 10) Sfx.play('whiff');
    this.combo = 0; this.missT = 0.4;
    const L = this.layout(); FX.text(L.cx, L.hit - 120, 'MISS', '#9a8f86', 28);
  },

  update(dt) {
    this.t += dt;
    for (let i = 0; i < 3; i++) { this.press[i] = Math.max(0, this.press[i] - dt * 7); this.moves[i] = Math.max(0, this.moves[i] - dt * 2.6); }
    this.missT = Math.max(0, this.missT - dt); this.flash = Math.max(0, this.flash - dt * 4);
    const S = this.song, st = this.songT();
    this.cur = st - this.lat;
    // 預先排好接下來 0.3 秒的聲音
    while (this.evI < S.ev.length && S.ev[this.evI].t < st + 0.3) {
      const e = S.ev[this.evI++];
      if (e.t >= st - 0.03) this.playEv(e, this.t0 + e.t);
    }
    // 超過時間沒點到 = MISS
    while (this.nI < this.notes.length && this.notes[this.nI].done) this.nI++;
    for (let i = this.nI; i < this.notes.length; i++) {
      const n = this.notes[i]; if (n.t > this.cur - 0.17) break;
      if (!n.done) this.miss(n);
    }
    // 拍子：背景燈光跟著閃，連擊 30 以上進入 FEVER
    const beat = Math.floor(this.cur / S.B);
    if (beat !== this.lastBeat && this.cur >= 0) { this.lastBeat = beat; this.flash = 1; if (this.combo >= 30 && beat % 2 === 0) { const L = this.layout(); FX.burst(L.px + rand(-80, 80), L.py - L.ph * 0.9, 8, undefined, 0.6); } }
    this.fever += ((this.combo >= 30 ? 1 : 0) - this.fever) * Math.min(1, dt * 3);
    if (this.cur > S.end + 1.2) {
      const acc = this.notes.length ? this.acc / this.notes.length : 0;
      const rank = acc >= 0.95 ? 'S' : acc >= 0.85 ? 'A' : acc >= 0.7 ? 'B' : acc >= 0.5 ? 'C' : 'D';
      this.overText = `評價 ${rank}！最多連擊 ${this.maxCombo}`;
      this.over = true; this.stopMusic();
    }
  },

  // ---- 紙片人的舞步 ----
  pose() {
    const S = this.song, ph = Math.max(0, this.cur) / S.B * Math.PI, s = Math.sin(ph), bob = Math.abs(s);
    let p = { dy: -bob * 0.03, rot: 0.05 * s, head: -0.08 * s, aL: 0.55 + 0.25 * s, aLf: 1.3, aR: 0.55 - 0.25 * s, aRf: 1.3,
      lL: 0.12 + 0.12 * Math.max(0, s), lLf: -0.3 * Math.max(0, s), lR: 0.12 + 0.12 * Math.max(0, -s), lRf: -0.3 * Math.max(0, -s), sy: 1 - bob * 0.02 };
    const ease = v => 1 - Math.pow(1 - v, 3);
    const blend = (b, w) => { for (const k in b) { const d = /^s[xy]$/.test(k) ? 1 : 0; p[k] = (p[k] == null ? d : p[k]) * (1 - w) + b[k] * w; } };
    const [mL, mM, mR] = this.moves.map(ease);
    if (mL) blend({ aL: 2.9, aLf: 0.1, rot: -0.14, head: -0.25, lR: 0.4, lRf: -0.5 }, mL);
    if (mR) blend({ aR: 2.9, aRf: 0.1, rot: 0.14, head: 0.25, lL: 0.4, lLf: -0.5 }, mR);
    if (mL && mR) blend({ rot: 0, head: 0, dy: -0.06 }, Math.min(mL, mR));
    if (mM) blend({ dy: -0.13, aL: 2.4, aR: 2.4, aLf: 0.5, aRf: 0.5, lL: 0.3, lLf: -0.9, lR: 0.3, lRf: -0.9, sy: 1.04 }, mM);
    if (this.missT) blend({ rot: Math.sin(this.t * 30) * 0.12, head: 0.3, aL: 1.1, aR: 1.1, aLf: 1, aRf: 1 }, this.missT / 0.4);
    return p;
  },

  // ---- 畫面 ----
  drawStage(c, L) {
    const W = V.W, H = V.H, f = this.flash * 0.5 + 0.5, fv = this.fever;
    const g = c.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#2b1f52'); g.addColorStop(1, fv > 0.5 ? '#8d3a8f' : '#5b2f7a');
    c.fillStyle = g; c.fillRect(-20, -20, W + 40, H + 40);
    // 旋轉的彩色燈光
    c.save(); c.globalCompositeOperation = 'lighter';
    const cols = ['255,107,107', '255,210,63', '77,150,255', '199,125,255'];
    for (let i = 0; i < 4; i++) {
      const x0 = W * (0.1 + i * 0.27), a = Math.sin(this.t * 0.9 + i * 1.7) * 0.5, len = H * 1.1;
      c.fillStyle = `rgba(${cols[i]},${0.07 + 0.09 * f + fv * 0.06})`;
      c.beginPath(); c.moveTo(x0, -10); c.lineTo(x0 + Math.sin(a - 0.13) * len, Math.cos(a - 0.13) * len); c.lineTo(x0 + Math.sin(a + 0.13) * len, Math.cos(a + 0.13) * len); c.closePath(); c.fill();
    }
    c.restore();
    // 紙做的三角旗
    const n = Math.ceil(W / 46) + 1, fc = ['#ff6b6b', '#ffd93d', '#6bcb77', '#4d96ff', '#c77dff'];
    c.strokeStyle = 'rgba(255,253,245,0.8)'; c.lineWidth = 2; c.beginPath();
    for (let i = 0; i <= n; i++) { const x = i * 46 - 10, y = 26 + Math.sin(i / n * Math.PI) * 26; i ? c.lineTo(x, y) : c.moveTo(x, y); } c.stroke();
    for (let i = 0; i < n; i++) {
      const x = i * 46 + 13, y = 26 + Math.sin((i + 0.5) / n * Math.PI) * 26, sw = Math.sin(this.t * 3 + i) * 3;
      Paper.shape(c, cc => { cc.moveTo(x - 15, y); cc.lineTo(x + 15, y); cc.lineTo(x + sw, y + 34); cc.closePath(); }, fc[i % 5], { border: 2, blur: 3, oy: 2 });
    }
    // 舞台
    Paper.shape(c, cc => cc.ellipse(L.px, L.py, L.ph * 0.55, L.ph * 0.09, 0, 0, Math.PI * 2), '#e0573c', { border: 5 });
    c.fillStyle = `rgba(255,240,190,${0.15 + 0.25 * this.flash})`; c.beginPath(); c.ellipse(L.px, L.py - 2, L.ph * 0.4, L.ph * 0.055, 0, 0, Math.PI * 2); c.fill();
  },

  glyph(c, lane, x, y, r) {
    c.fillStyle = '#fff'; c.beginPath();
    if (lane === 1) { for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, rr = i % 2 ? r * 0.22 : r * 0.5; c.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr); } }
    else { const d = lane === 0 ? -1 : 1; c.moveTo(x + d * r * 0.52, y); c.lineTo(x - d * r * 0.05, y - r * 0.45); c.lineTo(x - d * r * 0.05, y - r * 0.18); c.lineTo(x - d * r * 0.5, y - r * 0.18); c.lineTo(x - d * r * 0.5, y + r * 0.18); c.lineTo(x - d * r * 0.05, y + r * 0.18); c.lineTo(x - d * r * 0.05, y + r * 0.45); }
    c.closePath(); c.fill();
  },

  draw(c) {
    const L = this.layout(), S = this.song;
    this.drawStage(c, L);
    // 紙片人
    c.fillStyle = 'rgba(20,10,40,0.35)'; c.beginPath(); c.ellipse(L.px, L.py + 2, L.ph * 0.2, L.ph * 0.03, 0, 0, Math.PI * 2); c.fill();
    Puppet.draw(c, App.pup, L.px, L.py, L.ph, this.pose());

    // 軌道
    const x0 = L.cx - L.lw / 2, top = L.top - 24;
    c.save(); c.globalAlpha = 0.9;
    Paper.rect(c, x0, top, L.lw, V.H - top + 30, 'rgba(30,18,60,0.72)', 18, { border: 4, edge: 'rgba(255,253,245,0.85)' });
    c.restore();
    for (let i = 1; i < 3; i++) { c.fillStyle = 'rgba(255,255,255,0.12)'; c.fillRect(x0 + L.lw / 3 * i - 1, top + 10, 2, V.H - top); }
    for (let i = 0; i < 3; i++) if (this.press[i] > 0) {
      const g = c.createLinearGradient(0, L.hit, 0, top); g.addColorStop(0, `rgba(255,255,255,${0.25 * this.press[i]})`); g.addColorStop(1, 'rgba(255,255,255,0)');
      c.fillStyle = g; c.fillRect(x0 + L.lw / 3 * i + 4, top, L.lw / 3 - 8, L.hit - top);
    }
    // 連擊數（大大的，在軌道後面）
    if (this.combo >= 5) {
      c.save(); c.font = '900 64px "Noto Sans TC", system-ui, sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillStyle = 'rgba(255,255,255,0.18)';
      c.fillText(this.combo, L.cx, top + (L.hit - top) * 0.42); c.font = '900 20px "Noto Sans TC", system-ui, sans-serif'; c.fillText('連擊', L.cx, top + (L.hit - top) * 0.42 + 44); c.restore();
    }
    // 判定圈
    const r = Math.min(34, L.lw / 3 * 0.36);
    for (let i = 0; i < 3; i++) {
      const x = this.laneX(L, i), s = 1 + this.press[i] * 0.18;
      c.save(); c.translate(x, L.hit); c.scale(s, s);
      c.lineWidth = 5; c.strokeStyle = this.LANES[i].c; c.fillStyle = 'rgba(255,253,245,0.12)';
      c.beginPath(); c.arc(0, 0, r + 4, 0, Math.PI * 2); c.fill(); c.stroke();
      c.globalAlpha = 0.55; this.glyph(c, i, 0, 0, r); c.restore();
    }
    // 音符
    const span = L.hit - L.top;
    let prev = null;
    for (let i = this.nI; i < this.notes.length; i++) {
      const n = this.notes[i], dtn = n.t - this.cur; if (dtn > this.TRAVEL + 0.2) break;
      if (n.done === 1) continue;
      const y = L.hit - dtn / this.TRAVEL * span, x = this.laneX(L, n.lane);
      const a = clamp((y - L.top + 20) / 50, 0, 1) * (n.done === 2 ? 0.35 : 1);
      if (a <= 0) continue;
      c.save(); c.globalAlpha = a;
      if (prev && prev.t === n.t && prev.lane !== n.lane) { Paper.rect(c, this.laneX(L, prev.lane), y - 5, x - this.laneX(L, prev.lane), 10, '#fffdf5', 5, { border: 0, blur: 4 }); }
      Paper.circle(c, x, y, r, this.LANES[n.lane].c, { border: 4, blur: 5 });
      this.glyph(c, n.lane, x, y, r);
      c.restore();
      prev = n;
    }
    // 開頭倒數
    if (this.cur < 4 * S.B * 2 - 0.2) {
      const firstT = this.notes[0].t, left = firstT - this.cur;
      if (left > 0 && left < 4 * S.B) {
        const k = Math.ceil(left / S.B), fr = 1 - (left / S.B - Math.floor(left / S.B));
        c.save(); c.translate(L.cx, (L.top + L.hit) / 2); c.scale(1 + fr * 0.4, 1 + fr * 0.4); c.globalAlpha = 1 - fr * 0.6;
        c.font = '900 90px "Noto Sans TC", system-ui, sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.lineJoin = 'round';
        c.lineWidth = 14; c.strokeStyle = '#fffdf5'; c.strokeText(k, 0, 0); c.fillStyle = '#ff4fa3'; c.fillText(k, 0, 0); c.restore();
      } else if (!this.started || this.cur < firstT - 4 * S.B) {
        c.save(); c.font = '900 30px "Noto Sans TC", system-ui, sans-serif'; c.textAlign = 'center'; c.fillStyle = '#fffdf5'; c.fillText('準備…', L.cx, (L.top + L.hit) / 2); c.restore();
      }
    }
    // 歌曲進度
    const pw = Math.min(360, V.W * 0.5), px = (V.W - pw) / 2, py = L.wide ? 76 : 70, pr = clamp(this.cur / S.end, 0, 1);
    Paper.rect(c, px, py, pw, 12, '#3a2a5a', 6, { border: 3, blur: 3 });
    c.fillStyle = '#ff9fd0'; c.beginPath(); Paper.rrect(c, px + 2, py + 2, Math.max(0.01, (pw - 4) * pr), 8, 4); c.fill();
  },

  hud() { return { L: `<b>${this.score}</b> 分`, R: this.combo >= 2 ? `<span class="combo">${this.combo} 連擊</span>` : this.fever > 0.5 ? 'FEVER!' : '' }; },
});
