'use strict';
// 彈鋼琴：跟著發亮的琴鍵按，就會彈出兒歌（小星星、兩隻老虎）。按別的鍵也會有聲音，不會錯。
registerGame({
  id: 'piano', name: '彈鋼琴', icon: '🎹', color: '#ff8a1f', kid: true,
  desc: '跟著發亮的琴鍵按，彈出好聽的兒歌！',
  howto: '按會發亮的琴鍵，就會一個音一個音彈出兒歌。按其他鍵也有聲音，可以自己亂彈！彈完兩首歌就結束。',
  KEYS: [['Do', '#e8453c', 262], ['Re', '#ff8a1f', 294], ['Mi', '#ffcc1f', 330], ['Fa', '#45ad4a', 349], ['Sol', '#2fa5c9', 392], ['La', '#3f6fe0', 440], ['Si', '#9b5bd6', 494], ['Do', '#ff7eb6', 523]],
  // 傳統兒歌（數字 = 第幾個鍵）
  SONGS: [
    { name: '小星星', notes: [0, 0, 4, 4, 5, 5, 4, 3, 3, 2, 2, 1, 1, 0, 4, 4, 3, 3, 2, 2, 1, 4, 4, 3, 3, 2, 2, 1, 0, 0, 4, 4, 5, 5, 4, 3, 3, 2, 2, 1, 1, 0] },
    { name: '兩隻老虎', notes: [0, 1, 2, 0, 0, 1, 2, 0, 2, 3, 4, 2, 3, 4, 4, 5, 4, 3, 2, 0, 4, 5, 4, 3, 2, 0, 0, 4, 0, 0, 4, 0] },
  ],
  KEYMAP: ['a', 's', 'd', 'f', 'g', 'h', 'j', 'k'],

  start() { this.t = 0; this.score = 0; this.over = false; this.overText = '小小音樂家！'; this.song = 0; this.pos = 0; this.notes = []; this.press = new Array(8).fill(0); this.danceT = 0; this.doneT = 0; },
  onEnter(prev) { if (prev === 'ready') Kid.say(`我們來彈${this.SONGS[this.song].name}`); },
  keyRect(i) {
    const P = Kid.portrait(), top = P ? V.H * 0.6 : V.H * 0.55, w = Math.min(110, (V.W - 30) / 8), x0 = V.W / 2 - w * 4;
    return { x: x0 + w * (i + 0.5), y: top + (V.H * 0.95 - top) / 2, w: w - 8, h: V.H * 0.95 - top };
  },
  play(i) {
    const k = this.KEYS[i]; Sfx.note(k[2], 0.6, 0.2); this.press[i] = 1;
    const r = this.keyRect(i); this.notes.push({ x: r.x, y: r.y - r.h / 2, c: k[1], t: 0, s: pick(['♪', '♫', '♩']) });
    if (this.doneT) return;
    const S = this.SONGS[this.song];
    if (i === S.notes[this.pos]) {
      this.pos++; this.score += 5; this.danceT = 0.5;
      if (this.pos >= S.notes.length) {
        this.score += 50; this.doneT = 2.2; Sfx.play('win'); FX.burst(V.W / 2, V.H * 0.3, 40, undefined, 1.2);
        FX.text(V.W / 2, V.H * 0.3, `${S.name} 彈完了！`, '#e0573c', 44);
      }
    }
  },
  tap(x, y) { for (let i = 0; i < 8; i++) if (Kid.hit(this.keyRect(i), x, y, 3)) return this.play(i); },
  key(k) { const i = this.KEYMAP.indexOf(k); if (i >= 0) this.play(i); else if (k === 'space' || k === 'enter') this.play(this.SONGS[this.song].notes[this.pos] || 0); },
  update(dt) {
    this.t += dt; this.danceT = Math.max(0, this.danceT - dt);
    for (let i = 0; i < 8; i++) this.press[i] = Math.max(0, this.press[i] - dt * 5);
    for (const n of this.notes) n.t += dt; this.notes = this.notes.filter(n => n.t < 1.4);
    if (this.doneT) {
      this.doneT -= dt;
      if (this.doneT <= 0) { this.doneT = 0; this.song++; this.pos = 0; if (this.song >= this.SONGS.length) { this.over = true; return; } Kid.say(`下一首，${this.SONGS[this.song].name}`); }
    }
  },
  draw(c) {
    Kid.ground(c, 'orchard', this.t, 0.97);
    const S = this.SONGS[Math.min(this.song, this.SONGS.length - 1)], next = this.doneT ? -1 : S.notes[this.pos], P = Kid.portrait();
    // 舞台上的紙片人：彈對就跳一下
    const top = this.keyRect(0).y - this.keyRect(0).h / 2, ph = Math.min(top - (P ? 190 : 150), 300);
    const pose = this.doneT ? Puppet.Poses.cheer(this.t) : this.danceT ? Puppet.Poses.dance(this.t * 0.9) : Puppet.Poses.idle(this.t);
    Puppet.draw(c, App.pup, V.W / 2, top - 14, ph, pose);
    // 歌名 + 進度（小圓點）
    const bx = V.W / 2, by = P ? 125 : 90;
    Kid.text(c, `🎵 ${S.name}`, bx, by - 22, 30, '#e0573c');
    const n = S.notes.length, w = Math.min(V.W - 60, n * 14), dx = w / (n - 1);
    for (let i = 0; i < n; i++) { c.fillStyle = i < this.pos ? this.KEYS[S.notes[i]][1] : 'rgba(255,255,255,0.8)'; c.beginPath(); c.arc(bx - w / 2 + i * dx, by + 14, i === this.pos ? 6 : 4.5, 0, Math.PI * 2); c.fill(); }
    // 琴鍵
    for (let i = 0; i < 8; i++) {
      const r = this.keyRect(i), k = this.KEYS[i], glow = i === next, d = this.press[i] * 8 + (glow ? Math.abs(Math.sin(this.t * 6)) * 6 : 0);
      Paper.rect(c, r.x - r.w / 2, r.y - r.h / 2 + d, r.w, r.h - d, glow ? k[1] : '#fffdf5', 12, { border: 4, edge: glow ? '#fff6a8' : undefined });
      Paper.circle(c, r.x, r.y + r.h / 2 - r.w * 0.45, r.w * 0.3, k[1], { border: 3, blur: 2 });
      Kid.text(c, k[0], r.x, r.y + r.h / 2 - r.w * 0.45 + 1, Math.min(22, r.w * 0.3), '#fff', 0);
      if (glow) Kid.emoji(c, '👇', r.x, r.y - r.h / 2 - 30 - Math.abs(Math.sin(this.t * 6)) * 12, 40);
    }
    for (const nt of this.notes) { c.globalAlpha = 1 - nt.t / 1.4; Kid.text(c, nt.s, nt.x + Math.sin(nt.t * 6) * 14, nt.y - nt.t * 160, 40, nt.c, 6); c.globalAlpha = 1; }
  },
  hud() { return { L: `<b>${this.score}</b> 分`, R: `第 ${Math.min(this.song + 1, this.SONGS.length)} / ${this.SONGS.length} 首` }; },
});
