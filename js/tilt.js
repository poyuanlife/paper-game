'use strict';
// =====================================================
//  手機體感：傾斜 + 搖一搖
//  - Tilt.x、Tilt.y 介於 -1～1（往右傾 / 往下傾是正的）
//  - 開始遊戲時會以當下拿手機的角度當作「平的」（校正）
//  - Tilt.shakes：搖了幾下（一直加上去）；Tilt.shake：現在搖得多用力（0～1）
//  - iPhone 要使用者同意才能讀陀螺儀 / 加速度，所以在點遊戲卡片時就先問
//  - 沒有感應器（電腦、沒同意）時：傾斜用方向鍵或手指按住；搖一搖用狂點畫面或空白鍵（遊戲呼叫 Tilt.pulse()）
// =====================================================
const Tilt = (() => {
  const T = { x: 0, y: 0, active: false, denied: false, MAX: 22, shake: 0, shakes: 0, motion: false };   // 傾斜 22 度 = 1
  let raw = null, base = null, last = 0, asked = false, jerk = 0, lastAcc = null, motionLast = 0, cd = 0;
  const isTouch = matchMedia('(pointer: coarse)').matches || 'ontouchstart' in window;

  if ('DeviceOrientationEvent' in window) addEventListener('deviceorientation', e => { if (e.beta == null || e.gamma == null) return; raw = { b: e.beta, g: e.gamma }; last = performance.now(); });
  if ('DeviceMotionEvent' in window) addEventListener('devicemotion', e => {
    const a = e.accelerationIncludingGravity || e.acceleration; if (!a || a.x == null) return;
    motionLast = performance.now();
    if (lastAcc) jerk = Math.max(jerk, Math.abs(a.x - lastAcc.x) + Math.abs(a.y - lastAcc.y) + Math.abs((a.z || 0) - (lastAcc.z || 0)));
    lastAcc = { x: a.x, y: a.y, z: a.z || 0 };
  });

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
    if (asked) return; asked = true;
    for (const D of [window.DeviceOrientationEvent, window.DeviceMotionEvent]) {
      if (D && typeof D.requestPermission === 'function') D.requestPermission().then(r => { if (r !== 'granted') T.denied = true; }).catch(() => { asked = false; });
    }
  };
  // 沒有感應器時，點一下 / 按空白鍵 = 搖一下
  T.pulse = () => { if (T.motion) return; T.shakes++; T.shake = Math.min(1, T.shake + 0.45); };
  T.update = dt => {
    const now = performance.now(), live = raw && now - last < 1500;
    T.active = !!live; T.motion = now - motionLast < 1500;
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
    // 搖一搖：加速度突然變很大就算一下
    cd -= dt;
    if (T.motion) {
      const e = jerk; jerk = 0;
      if (e > 16 && cd <= 0) { T.shakes++; cd = 0.11; }
      T.shake += (clamp(e / 40, 0, 1) - T.shake) * Math.min(1, dt * 10);
    } else T.shake = Math.max(0, T.shake - dt * 2.2);
  };
  T.reset = () => { T.x = 0; T.y = 0; base = null; T.shakes = 0; T.shake = 0; };
  // 遊戲畫面上的小提示
  T.hint = () => T.active ? '📱 傾斜手機控制　點畫面＝重新校正' : isTouch ? (T.denied ? '沒有開陀螺儀權限：用手指按住往想去的方向' : '用手指按住畫面往想去的方向（或開啟陀螺儀）') : '電腦試玩：用方向鍵 ← → ↑ ↓';
  T.shakeHint = () => T.motion ? '📱 用力搖一搖手機！' : isTouch ? '📱 搖一搖手機（或狂點畫面）' : '電腦試玩：狂點畫面或按空白鍵';
  T.isTouch = isTouch;
  return T;
})();
// 保險：在觸控結束時再要一次權限（iOS 需要使用者的手勢）
addEventListener('touchend', () => { if (App.game && App.game.tilt) Tilt.request(); }, true);
