'use strict';
// 存檔：角色（去背圖 + 關節）放 IndexedDB，最高分放 localStorage
const Store = (() => {
  let dbP = null;
  function db() {
    if (dbP) return dbP;
    dbP = new Promise((ok, no) => {
      const r = indexedDB.open('paper-game', 1);
      r.onupgradeneeded = () => r.result.createObjectStore('chars');
      r.onsuccess = () => ok(r.result); r.onerror = () => no(r.error);
    });
    dbP.catch(() => { dbP = null; });
    return dbP;
  }
  async function op(mode, fn) {
    const d = await db();
    return new Promise((ok, no) => { const t = d.transaction('chars', mode), q = fn(t.objectStore('chars')); t.oncomplete = () => ok(q && q.result); t.onerror = () => no(t.error); });
  }
  // 角色存檔位置：'me' = 人、'pet' = 寵物
  const saveChar = (canvas, J, slot = 'me') => new Promise(ok => canvas.toBlob(ok, 'image/png')).then(blob => op('readwrite', s => s.put({ blob, J, t: Date.now() }, slot)));
  async function loadChar(slot = 'me') {
    try {
      const v = await op('readonly', s => s.get(slot));
      if (!v || !v.blob) return null;
      const bmp = await createImageBitmap(v.blob), c = document.createElement('canvas');
      c.width = bmp.width; c.height = bmp.height; c.getContext('2d').drawImage(bmp, 0, 0);
      return { canvas: c, J: v.J };
    } catch (e) { return null; }
  }
  const clearChar = (slot = 'me') => op('readwrite', s => s.delete(slot)).catch(() => {});

  const get = (k, d) => { try { const v = localStorage.getItem('paper.' + k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } };
  const set = (k, v) => { try { localStorage.setItem('paper.' + k, JSON.stringify(v)); } catch (e) {} };
  const best = id => (get('best', {})[id] || 0);
  function setBest(id, score) { const b = get('best', {}); if (score <= (b[id] || 0)) return false; b[id] = score; set('best', b); return true; }

  return { saveChar, loadChar, clearChar, get, set, best, setBest };
})();

// 音效：用 WebAudio 合成，不用音檔
const Sfx = (() => {
  let ac = null, on = Store.get('sound', true);
  const ctx = () => { if (!ac) { try { ac = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) {} } if (ac && ac.state === 'suspended') ac.resume(); return ac; };
  function tone(f0, f1, dur, type = 'square', vol = 0.12, delay = 0) {
    if (!on) return; const a = ctx(); if (!a) return;
    const t = a.currentTime + delay, o = a.createOscillator(), g = a.createGain();
    o.type = type; o.frequency.setValueAtTime(f0, t); o.frequency.exponentialRampToValueAtTime(Math.max(30, f1), t + dur);
    g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    o.connect(g); g.connect(a.destination); o.start(t); o.stop(t + dur + 0.02);
  }
  function noise(dur, vol = 0.2) {
    if (!on) return; const a = ctx(); if (!a) return;
    const b = a.createBuffer(1, Math.round(a.sampleRate * dur), a.sampleRate), d = b.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / d.length);
    const s = a.createBufferSource(), g = a.createGain(); g.gain.value = vol; s.buffer = b; s.connect(g); g.connect(a.destination); s.start();
  }
  const play = {
    jump: () => tone(300, 700, 0.15, 'square', 0.08),
    flap: () => tone(500, 800, 0.08, 'triangle', 0.12),
    coin: () => { tone(988, 988, 0.07, 'square', 0.07); tone(1319, 1319, 0.18, 'square', 0.07, 0.07); },
    catch: () => tone(660, 990, 0.1, 'triangle', 0.15),
    star: () => { [784, 988, 1175, 1568].forEach((f, i) => tone(f, f, 0.1, 'square', 0.06, i * 0.06)); },
    hit: () => { noise(0.25, 0.25); tone(220, 60, 0.3, 'sawtooth', 0.12); },
    boom: () => { noise(0.45, 0.35); tone(140, 40, 0.4, 'sawtooth', 0.15); },
    click: () => tone(700, 500, 0.05, 'triangle', 0.1),
    over: () => { [523, 392, 330, 262].forEach((f, i) => tone(f, f * 0.98, 0.18, 'triangle', 0.14, i * 0.16)); },
    win: () => { [523, 659, 784, 1047].forEach((f, i) => tone(f, f, 0.16, 'square', 0.07, i * 0.1)); },
    shutter: () => { noise(0.08, 0.3); tone(1800, 900, 0.05, 'square', 0.05); },
    tick: () => tone(1200, 1200, 0.04, 'square', 0.05),
    punch: () => { noise(0.12, 0.45); tone(160, 50, 0.16, 'sine', 0.5); },
    crit: () => { noise(0.2, 0.5); tone(120, 40, 0.3, 'sine', 0.6); tone(900, 1800, 0.12, 'square', 0.05, 0.05); },
    whiff: () => { noise(0.1, 0.08); tone(400, 200, 0.12, 'sine', 0.04); },
    block: () => { tone(300, 280, 0.08, 'square', 0.1); noise(0.05, 0.15); },
    bell: () => { [0, 0.28, 0.56].forEach(d => { tone(1320, 1300, 0.5, 'triangle', 0.18, d); tone(2640, 2600, 0.3, 'sine', 0.05, d); }); },
    boing: () => tone(180, 520, 0.35, 'sine', 0.2),
    pop: () => { tone(500, 1500, 0.06, 'sine', 0.25); noise(0.04, 0.1); },
    flip: () => tone(1200, 800, 0.05, 'triangle', 0.08),
    giggle: () => { [0, 0.09, 0.18].forEach((d, i) => tone(900 + i * 140, 700 + i * 140, 0.07, 'triangle', 0.12, d)); },
    rustle: () => noise(0.14, 0.07),
    ding: () => { tone(880, 880, 0.1, 'triangle', 0.14); tone(1320, 1320, 0.22, 'triangle', 0.12, 0.09); },
    nope: () => { tone(330, 300, 0.12, 'sine', 0.16); tone(262, 250, 0.18, 'sine', 0.14, 0.12); },
    snap: () => { tone(1500, 900, 0.04, 'square', 0.06); tone(700, 700, 0.08, 'triangle', 0.12, 0.03); },
    chomp: () => { noise(0.06, 0.2); tone(220, 160, 0.08, 'square', 0.06, 0.02); },
    splash: () => { noise(0.3, 0.18); tone(400, 120, 0.25, 'sine', 0.08); },
  };
  // 手機震動（Android 才有；跟著音效開關）
  const VIB = { hit: 60, boom: 120, punch: 25, crit: 70, block: 15, over: 40 };
  const buzz = n => { if (on && VIB[n] && navigator.vibrate) try { navigator.vibrate(VIB[n]); } catch (e) {} };
  function note(f, dur = 0.5, vol = 0.16) { tone(f, f, dur, 'triangle', vol); tone(f * 2, f * 2, dur * 0.6, 'sine', vol * 0.25); }
  return { note, play: n => { try { play[n] && play[n](); buzz(n); } catch (e) {} }, unlock: ctx, get on() { return on; }, toggle() { on = !on; Store.set('sound', on); return on; } };
})();
