'use strict';
// =====================================================
//  背景音樂：用 WebAudio 即時合成（不用音樂檔，只有幾 KB）
//  - 一首 16 小節、會一直循環的樂園風小曲（旋律 + 碰恰恰低音 + 輕輕的鈴鼓）
//  - 首頁 / 選單 / 沒有自己音樂的遊戲會播；有自己音樂或要聽聲音的遊戲不播
//  - 念題目時自動變小聲；🎵 按鈕可以單獨關掉（🔊 關掉時也會一起關）
// =====================================================
const Bgm = (() => {
  let enabled = Store.get('music', true), gain = null, hat = null, timer = null, nextT = 0, step = 0, mode = null, duckUntil = 0;
  const BPM = 132, E8 = 60 / BPM / 2;           // 一個八分音符的秒數
  const NOMUSIC = new Set(['dance', 'shakerhythm', 'maracas', 'drum', 'piano', 'memlight', 'cake', 'animals']);
  const VOL = { menu: 0.32, game: 0.2, pause: 0.1 };
  const mf = m => 440 * Math.pow(2, (m - 69) / 12);

  // 旋律：[音高（MIDI）, 長度（八分音符）]，0 = 休止；每小節 8 個八分音符
  const MEL = [
    [72, 2], [76, 2], [79, 2], [76, 2], [77, 2], [81, 2], [79, 2], [77, 2], [76, 2], [74, 2], [71, 2], [74, 2], [72, 4], [0, 2], [67, 2],
    [69, 2], [72, 2], [76, 3], [74, 1], [72, 2], [69, 2], [65, 2], [69, 2], [71, 2], [74, 2], [79, 2], [77, 2], [76, 4], [72, 4],
    [77, 1], [77, 1], [81, 2], [84, 2], [81, 2], [79, 2], [76, 2], [72, 2], [76, 2], [74, 1], [74, 1], [79, 2], [83, 2], [79, 2], [81, 3], [79, 1], [76, 4],
    [77, 2], [76, 2], [74, 2], [72, 2], [76, 2], [79, 2], [84, 4], [83, 2], [81, 2], [79, 2], [77, 2], [76, 2], [74, 2], [72, 4],
  ];
  // 和弦（每小節一個）：[根音, 三音, 五音]
  const CH = { C: [48, 64, 67], F: [53, 69, 72], G: [55, 71, 74], Am: [57, 72, 76], G7: [55, 71, 77] };
  const BARS = ['C', 'F', 'G', 'C', 'Am', 'F', 'G', 'C', 'F', 'C', 'G', 'Am', 'F', 'C', 'G7', 'C'];
  const LEN = BARS.length * 8;
  const EV = [...Array(LEN)].map(() => []);
  { let t = 0; for (const [m, d] of MEL) { if (m) EV[t].push({ k: 'mel', m, d }); t += d; } }
  BARS.forEach((b, i) => { const [r, a, c] = CH[b], t = i * 8; EV[t].push({ k: 'bass', m: r }); EV[t + 4].push({ k: 'bass', m: r + 7 }); for (const s of [2, 6]) EV[t + s].push({ k: 'chord', ms: [a, c] }); for (const s of [1, 3, 5, 7]) EV[t + s].push({ k: 'hat' }); });

  function ensure() {
    const a = Sfx.unlock(); if (!a) return null;
    if (!gain) { gain = a.createGain(); gain.gain.value = 0; gain.connect(a.destination); const b = a.createBuffer(1, Math.round(a.sampleRate * 0.05), a.sampleRate), d = b.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / d.length); hat = b; }
    return a;
  }
  function osc(a, t, f, dur, type, vol) {
    const o = a.createOscillator(), g = a.createGain(); o.type = type; o.frequency.value = f;
    g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(vol, t + 0.012); g.gain.exponentialRampToValueAtTime(vol * 0.5, t + dur * 0.6); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g); g.connect(gain); o.start(t); o.stop(t + dur + 0.02);
  }
  function playStep(a, t, ev) {
    for (const e of ev) {
      if (e.k === 'mel') { const d = e.d * E8 * 0.92; osc(a, t, mf(e.m), d, 'triangle', 0.22); osc(a, t, mf(e.m) * 2, d * 0.5, 'square', 0.025); }
      else if (e.k === 'bass') osc(a, t, mf(e.m - 12), E8 * 1.6, 'triangle', 0.3);
      else if (e.k === 'chord') for (const m of e.ms) osc(a, t, mf(m - 12), E8 * 0.6, 'square', 0.022);
      else if (e.k === 'hat') { const s = a.createBufferSource(), g = a.createGain(), f = a.createBiquadFilter(); f.type = 'highpass'; f.frequency.value = 6000; g.gain.value = 0.05; s.buffer = hat; s.connect(f); f.connect(g); g.connect(gain); s.start(t); }
    }
  }
  function tick() {
    const a = ensure(); if (!a || a.state !== 'running') return;
    if (nextT < a.currentTime) nextT = a.currentTime + 0.05;
    while (nextT < a.currentTime + 0.35) { playStep(a, nextT, EV[step]); nextT += E8; step = (step + 1) % LEN; }
    const want = (mode ? VOL[mode] : 0) * (performance.now() < duckUntil ? 0.35 : 1);
    gain.gain.setTargetAtTime(want, a.currentTime, 0.25);
  }
  function setMode(m) {
    if (!enabled || !Sfx.on || document.hidden) m = null;
    mode = m;
    if (m && !timer) { const a = ensure(); if (!a) return; nextT = a.currentTime + 0.1; timer = setInterval(tick, 90); tick(); }
    if (!m && timer) { const a = ensure(); if (a && gain) gain.gain.setTargetAtTime(0, a.currentTime, 0.15); clearInterval(timer); timer = null; step = 0; }
  }
  // 依照現在的畫面決定要不要放音樂
  function update() {
    const has = typeof App !== 'undefined', st = has && App.state, g = has && App.game; let m = null;
    if (['home', 'select', 'maker', 'result'].includes(st)) m = 'menu';
    else if (['ready', 'play', 'pause'].includes(st) && g && !NOMUSIC.has(g.id)) m = st === 'pause' ? 'pause' : 'game';
    setMode(m);
  }
  document.addEventListener('pointerdown', () => setTimeout(update, 0), true);   // 手機要先點一下才能出聲
  document.addEventListener('visibilitychange', update);
  return {
    get mode() { return mode; }, update, duck(sec = 2.5) { duckUntil = performance.now() + sec * 1000; },
    get on() { return enabled; }, toggle() { enabled = !enabled; Store.set('music', enabled); update(); return enabled; },
  };
})();
