'use strict';
// =====================================================
//  手機陀螺儀（傾斜）：Tilt.x、Tilt.y 介於 -1～1（往右傾 / 往下傾是正的）
//  - 開始遊戲時會以當下拿手機的角度當作「平的」（校正）
//  - iPhone 要使用者同意才能讀陀螺儀，所以在點遊戲卡片時就先問
//  - 沒有陀螺儀（電腦、沒同意）時：方向鍵，或手指按住畫面往想去的方向
// =====================================================
const Tilt = (() => {
  const T = { x: 0, y: 0, active: false, denied: false, MAX: 22 };   // 傾斜 22 度 = 1
  let raw = null, base = null, last = 0, asked = false;
  const isTouch = matchMedia('(pointer: coarse)').matches || 'ontouchstart' in window;
  const supported = 'DeviceOrientationEvent' in window;

  if (supported) addEventListener('deviceorientation', e => { if (e.beta == null || e.gamma == null) return; raw = { b: e.beta, g: e.gamma }; last = performance.now(); });

  // 手機橫著拿的時候，左右 / 前後要換過來
  const angle = () => ((((screen.orientation && screen.orientation.angle) ?? window.orientation ?? 0) % 360) + 360) % 360;
  function vec() {
    const a = angle(), b = raw.b, g = raw.g;
    if (a === 90) return { x: b, y: -g };
    if (a === 270) return { x: -b, y: g };
    if (a === 180) return { x: -g, y: -b };
    return { x: g, y: b };
  }
  T.calibrate = () => { base = raw ? vec() : null; };
  // 要在使用者點擊的時候呼叫（iOS 規定）
  T.request = () => {
    if (asked) return; const D = window.DeviceOrientationEvent;
    if (D && typeof D.requestPermission === 'function') { asked = true; D.requestPermission().then(r => { T.denied = r !== 'granted'; }).catch(() => { asked = false; }); }
    else asked = true;
  };
  T.update = dt => {
    const live = raw && performance.now() - last < 1500;
    T.active = !!live;
    let tx = 0, ty = 0;
    if (live) {
      if (!base) T.calibrate();
      const v = vec(); tx = (v.x - base.x) / T.MAX; ty = (v.y - base.y) / T.MAX;
    } else {
      tx = keyDir(); ty = (Input.keys.arrowdown || Input.keys.s ? 1 : 0) - (Input.keys.arrowup || Input.keys.w ? 1 : 0);
      if (Input.down && !tx && !ty) { tx = (Input.x - V.W / 2) / (V.W * 0.32); ty = (Input.y - V.H / 2) / (V.H * 0.32); }
    }
    const k = Math.min(1, dt * 14);
    T.x += (clamp(tx, -1, 1) - T.x) * k; T.y += (clamp(ty, -1, 1) - T.y) * k;
  };
  T.reset = () => { T.x = 0; T.y = 0; base = null; };
  // 遊戲畫面上的小提示
  T.hint = () => T.active ? '📱 傾斜手機控制　點畫面＝重新校正' : isTouch ? (T.denied ? '沒有開陀螺儀權限：用手指按住往想去的方向' : '用手指按住畫面往想去的方向（或開啟陀螺儀）') : '電腦試玩：用方向鍵 ← → ↑ ↓';
  T.isTouch = isTouch;
  return T;
})();
// 保險：在觸控結束時再要一次權限（iOS 需要使用者的手勢）
addEventListener('touchend', () => { if (App.game && App.game.tilt) Tilt.request(); }, true);
