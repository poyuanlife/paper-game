'use strict';
// =====================================================
//  背景音樂：用 WebAudio 即時合成（不用音樂檔，只有幾 KB）
//  - 5 首會循環的小曲，可以指定一首，或「輪播」（每首約半分鐘換下一首）
//  - 首頁 / 選單 / 沒有自己音樂的遊戲會播；有自己音樂或要聽聲音的遊戲不播
//  - 念題目時自動變小聲；首頁 🎵 選單可以選歌、輪播或關掉
// =====================================================
const Bgm = (() => {
  let enabled = Store.get('music', true), pickSong = Store.get('musicSong', 'auto');
  let gain = null, hat = null, timer = null, nextT = 0, step = 0, mode = null, duckUntil = 0, cur = 0, played = 0;
  const NOMUSIC = new Set(['dance', 'shakerhythm', 'maracas', 'drum', 'piano', 'memlight', 'cake', 'animals']);
  const VOL = { menu: 0.32, game: 0.2, pause: 0.1 };
  const mf = m => 440 * Math.pow(2, (m - 69) / 12);
  // 和弦：[根音, 三音, 五音]
  const CH = { C: [48, 64, 67], F: [53, 69, 72], G: [55, 71, 74], Am: [57, 72, 76], G7: [55, 71, 77], Dm: [50, 65, 69], Em: [52, 67, 71] };

  // 曲子：bpm、每小節幾個八分音符（meter）、旋律 [MIDI, 長度]、每小節和弦、伴奏型態、主旋律音色
  // bass：[第幾個八分音符, 比根音高幾個半音]；stab：和弦短音的位置；hat：鈴鼓 / 小鼓的位置
  const SONGS = [
    { name: '🎠 歡樂樂園', bpm: 132, meter: 8, lead: 'calliope',
      mel: [[72, 2], [76, 2], [79, 2], [76, 2], [77, 2], [81, 2], [79, 2], [77, 2], [76, 2], [74, 2], [71, 2], [74, 2], [72, 4], [0, 2], [67, 2],
        [69, 2], [72, 2], [76, 3], [74, 1], [72, 2], [69, 2], [65, 2], [69, 2], [71, 2], [74, 2], [79, 2], [77, 2], [76, 4], [72, 4],
        [77, 1], [77, 1], [81, 2], [84, 2], [81, 2], [79, 2], [76, 2], [72, 2], [76, 2], [74, 1], [74, 1], [79, 2], [83, 2], [79, 2], [81, 3], [79, 1], [76, 4],
        [77, 2], [76, 2], [74, 2], [72, 2], [76, 2], [79, 2], [84, 4], [83, 2], [81, 2], [79, 2], [77, 2], [76, 2], [74, 2], [72, 4]],
      bars: ['C', 'F', 'G', 'C', 'Am', 'F', 'G', 'C', 'F', 'C', 'G', 'Am', 'F', 'C', 'G7', 'C'],
      bass: [[0, 0], [4, 7]], stab: [2, 6], hat: [1, 3, 5, 7] },
    { name: '🏖️ 海邊假期', bpm: 116, meter: 8, lead: 'mallet',
      mel: [[76, 1], [76, 2], [72, 1], [74, 2], [76, 2], [77, 2], [76, 1], [74, 1], [72, 4], [74, 1], [74, 2], [71, 1], [72, 2], [74, 2], [76, 4], [0, 2], [79, 2],
        [81, 1], [79, 2], [76, 1], [77, 2], [76, 2], [77, 2], [76, 1], [74, 1], [72, 4], [74, 2], [76, 2], [79, 2], [74, 2], [72, 6], [0, 2]],
      bars: ['C', 'F', 'G', 'C', 'Am', 'F', 'G', 'C'],
      bass: [[0, 0], [3, 7], [4, 12], [6, 7]], stab: [2, 5], hat: [1, 3, 5, 7] },
    { name: '🌙 星空華爾滋', bpm: 100, meter: 6, lead: 'musicbox',
      mel: [[72, 4], [76, 2], [79, 4], [76, 2], [77, 4], [81, 2], [79, 6], [77, 2], [76, 2], [74, 2], [76, 2], [72, 2], [69, 2], [71, 4], [74, 2], [72, 6]],
      bars: ['C', 'C', 'F', 'C', 'F', 'C', 'G', 'C'],
      bass: [[0, 0]], stab: [2, 4], hat: [] },
    { name: '⚔️ 勇敢冒險', bpm: 120, meter: 8, lead: 'brass',
      mel: [[67, 1], [72, 1], [72, 2], [72, 1], [74, 1], [76, 2], [74, 2], [71, 2], [67, 4], [69, 1], [72, 1], [77, 2], [77, 1], [76, 1], [74, 2], [76, 4], [72, 4],
        [76, 1], [76, 1], [81, 2], [79, 2], [76, 2], [77, 2], [74, 2], [72, 2], [69, 2], [71, 2], [74, 2], [79, 3], [77, 1], [76, 2], [74, 2], [72, 4]],
      bars: ['C', 'G', 'F', 'C', 'Am', 'F', 'G', 'C'],
      bass: [[0, 0], [2, 7], [4, 0], [6, 7]], stab: [], hat: [2, 6], snare: true },
    { name: '🍬 糖果跳跳', bpm: 144, meter: 8, lead: 'pluck',
      mel: [[79, 1], [0, 1], [79, 1], [76, 1], [72, 2], [76, 2], [81, 1], [0, 1], [81, 1], [79, 1], [76, 2], [72, 2], [77, 1], [0, 1], [77, 1], [81, 1], [84, 2], [81, 2], [79, 4], [0, 2], [74, 2],
        [76, 1], [77, 1], [79, 2], [84, 2], [79, 2], [81, 2], [79, 2], [76, 2], [72, 2], [77, 2], [76, 2], [74, 2], [71, 2], [72, 4], [0, 4]],
      bars: ['C', 'Am', 'F', 'G', 'C', 'Am', 'F', 'C'],
      bass: [[0, 0], [2, 12], [4, 0], [6, 12]], stab: [3, 7], hat: [1, 3, 5, 7] },
  ];
  // 把每首曲子展開成「每個八分音符要彈什麼」
  for (const S of SONGS) {
    const len = S.bars.length * S.meter; S.len = len; S.e8 = 60 / S.bpm / 2; S.ev = [...Array(len)].map(() => []);
    let t = 0; for (const [m, d] of S.mel) { if (m) S.ev[t % len].push({ k: 'mel', m, d }); t += d; }
    if (t !== len) console.warn('bgm melody length mismatch', S.name, t, len);
    S.bars.forEach((b, i) => { const [r, a, c] = CH[b], t0 = i * S.meter; for (const [o, iv] of S.bass) S.ev[t0 + o].push({ k: 'bass', m: r + iv }); for (const o of S.stab) S.ev[t0 + o].push({ k: 'chord', ms: [a, c] }); for (const o of S.hat) S.ev[t0 + o].push({ k: S.snare ? 'snare' : 'hat' }); });
  }

  function ensure() {
    const a = Sfx.unlock(); if (!a) return null;
    if (!gain) { gain = a.createGain(); gain.gain.value = 0; gain.connect(a.destination); const b = a.createBuffer(1, Math.round(a.sampleRate * 0.12), a.sampleRate), d = b.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / d.length); hat = b; }
    return a;
  }
  function osc(a, t, f, dur, type, vol) {
    const o = a.createOscillator(), g = a.createGain(); o.type = type; o.frequency.value = f;
    g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(vol, t + 0.012); g.gain.exponentialRampToValueAtTime(vol * 0.5, t + dur * 0.6); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g); g.connect(gain); o.start(t); o.stop(t + dur + 0.02);
  }
  function noise(a, t, dur, vol, hp) { const s = a.createBufferSource(), g = a.createGain(), f = a.createBiquadFilter(); f.type = 'highpass'; f.frequency.value = hp; g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0001, t + dur); s.buffer = hat; s.connect(f); f.connect(g); g.connect(gain); s.start(t); s.stop(t + dur + 0.02); }
  // 主旋律的不同音色
  const LEAD = {
    calliope: (a, t, f, d) => { osc(a, t, f, d, 'triangle', 0.22); osc(a, t, f * 2, d * 0.5, 'square', 0.025); },
    mallet: (a, t, f, d) => { osc(a, t, f, Math.min(d, 0.35), 'sine', 0.26); osc(a, t, f * 4, 0.08, 'sine', 0.05); },
    musicbox: (a, t, f, d) => { osc(a, t, f * 2, Math.min(d, 0.9), 'sine', 0.2); osc(a, t, f * 4, 0.25, 'sine', 0.04); },
    brass: (a, t, f, d) => { osc(a, t, f, d, 'sawtooth', 0.05); osc(a, t, f, d, 'triangle', 0.16); },
    pluck: (a, t, f, d) => { osc(a, t, f, Math.min(d, 0.22), 'square', 0.06); osc(a, t, f, Math.min(d, 0.25), 'triangle', 0.18); },
  };
  function playStep(a, t, S, ev) {
    for (const e of ev) {
      if (e.k === 'mel') LEAD[S.lead](a, t, mf(e.m), e.d * S.e8 * 0.92);
      else if (e.k === 'bass') osc(a, t, mf(e.m - 12), S.e8 * 1.6, 'triangle', 0.3);
      else if (e.k === 'chord') for (const m of e.ms) osc(a, t, mf(m - 12), S.e8 * 0.6, S.lead === 'musicbox' ? 'sine' : 'square', S.lead === 'musicbox' ? 0.06 : 0.022);
      else if (e.k === 'hat') noise(a, t, 0.05, 0.05, 6000);
      else if (e.k === 'snare') noise(a, t, 0.12, 0.12, 1500);
    }
  }
  const song = () => SONGS[cur];
  function chooseFirst() { cur = pickSong === 'auto' ? Math.floor(Math.random() * SONGS.length) : clamp(+pickSong || 0, 0, SONGS.length - 1); played = 0; step = 0; }
  function tick() {
    const a = ensure(); if (!a || a.state !== 'running') return;
    if (nextT < a.currentTime) nextT = a.currentTime + 0.05;
    while (nextT < a.currentTime + 0.35) {
      let S = song();
      if (step === 0 && pickSong === 'auto' && played >= 28) { cur = (cur + 1) % SONGS.length; played = 0; S = song(); nextT += 0.4; }   // 輪播：播了快半分鐘、剛好一輪結束就換下一首
      playStep(a, nextT, S, S.ev[step]); nextT += S.e8; played += S.e8; step = (step + 1) % S.len;
    }
    const want = (mode ? VOL[mode] : 0) * (performance.now() < duckUntil ? 0.35 : 1);
    gain.gain.setTargetAtTime(want, a.currentTime, 0.25);
  }
  function stop() { const a = ensure(); if (a && gain) gain.gain.setTargetAtTime(0, a.currentTime, 0.1); clearInterval(timer); timer = null; }
  function setMode(m) {
    if (!enabled || !Sfx.on || document.hidden) m = null;
    mode = m;
    if (m && !timer) { const a = ensure(); if (!a) return; chooseFirst(); nextT = a.currentTime + 0.1; timer = setInterval(tick, 90); tick(); }
    if (!m && timer) stop();
  }
  // 依照現在的畫面決定要不要放音樂
  function update() {
    const has = typeof App !== 'undefined', st = has && App.state, g = has && App.game; let m = null;
    if (['home', 'select', 'maker', 'result'].includes(st)) m = 'menu';
    else if (['ready', 'play', 'pause'].includes(st) && g && !NOMUSIC.has(g.id)) m = st === 'pause' ? 'pause' : 'game';
    setMode(m);
  }
  // 選歌：'auto' = 輪播，數字 = 指定那一首，'off' = 關掉
  function choose(v) {
    if (v === 'off') { enabled = false; Store.set('music', false); update(); return; }
    enabled = true; Store.set('music', true); pickSong = v; Store.set('musicSong', v);
    if (!Sfx.on) Sfx.toggle();
    if (timer) stop(); update();
  }
  // 🎵 按鈕的小選單
  function menu(after) {
    const old = document.getElementById('musicMenu'); if (old) { old.remove(); return; }
    const m = document.createElement('div'); m.id = 'musicMenu'; m.className = 'langMenu musicMenu';
    const now = !(enabled && Sfx.on) ? 'off' : String(pickSong);
    const items = [['auto', '🔁 輪播全部'], ...SONGS.map((S, i) => [String(i), S.name]), ['off', '🔇 關閉音樂']];
    for (const [v, label] of items) { const b = document.createElement('button'); b.textContent = label; if (v === now) b.className = 'on'; b.onclick = e => { e.stopPropagation(); Sfx.play('click'); choose(v === 'auto' || v === 'off' ? v : +v); m.remove(); if (after) after(); }; m.appendChild(b); }
    document.body.appendChild(m);
    setTimeout(() => addEventListener('pointerdown', function off(e) { if (!m.contains(e.target)) { m.remove(); removeEventListener('pointerdown', off, true); } }, true), 0);
  }
  document.addEventListener('pointerdown', () => setTimeout(update, 0), true);   // 手機要先點一下才能出聲
  document.addEventListener('visibilitychange', update);
  return {
    get mode() { return mode; }, get song() { return timer ? SONGS[cur].name : null; }, SONGS, update, menu, choose,
    duck(sec = 2.5) { duckUntil = performance.now() + sec * 1000; },
    get on() { return enabled; }, toggle() { enabled = !enabled; Store.set('music', enabled); update(); return enabled; },
  };
})();
