'use strict';
// =====================================================
//  去背 + 找身體關節
//  用 Google MediaPipe 姿勢偵測（Pose Landmarker），第一次使用時下載約 13 MB，之後瀏覽器會記住。
//  照片全部在這台裝置上處理，不會上傳。
// =====================================================
const Cutout = (() => {
  const MP_BASE = 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@1.1.1';
  const MODEL = 'https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_full/float16/latest/pose_landmarker_full.task';
  let poseP = null, last = null;

  function getPose(onMsg) {
    if (poseP) return poseP;
    poseP = (async () => {
      onMsg && onMsg('下載去背工具中（只有第一次，約 13 MB）…');
      const mp = await import(`${MP_BASE}/vision_bundle.mjs`);
      const files = await mp.FilesetResolver.forVisionTasks(`${MP_BASE}/wasm`);
      let err = null;
      for (const delegate of ['GPU', 'CPU']) {
        try {
          return await mp.PoseLandmarker.createFromOptions(files, {
            baseOptions: { modelAssetPath: MODEL, delegate }, runningMode: 'IMAGE', numPoses: 1, outputSegmentationMasks: true,
          });
        } catch (e) { err = e; }
      }
      throw err || new Error('無法啟動去背工具');
    })();
    poseP.catch(() => { poseP = null; });
    return poseP;
  }

  const canvasOf = (w, h) => { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; };

  async function toImageData(src, max) {
    const bmp = src instanceof Blob ? await createImageBitmap(src, { imageOrientation: 'from-image' }) : src;
    const sw = bmp.width || bmp.videoWidth, sh = bmp.height || bmp.videoHeight;
    const k = Math.min(1, max / Math.max(sw, sh)), w = Math.round(sw * k), h = Math.round(sh * k);
    const c = canvasOf(w, h), x = c.getContext('2d'); x.imageSmoothingQuality = 'high'; x.drawImage(bmp, 0, 0, w, h);
    if (src instanceof Blob && bmp.close) bmp.close();
    return x.getImageData(0, 0, w, h);
  }

  function bbox(img, thr) {
    const { width: W, height: H, data: d } = img; let x0 = W, y0 = H, x1 = -1, y1 = -1;
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (d[(y * W + x) * 4 + 3] >= thr) {
      if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y;
    }
    return x1 < 0 ? null : { x: x0, y: y0, w: x1 - x0 + 1, h: y1 - y0 + 1 };
  }

  // 清掉跟身體沒連在一起的小碎塊（背景殘留、腳邊的東西）
  function removeSpecks(img) {
    const W = img.width, H = img.height, d = img.data, seen = new Int32Array(W * H).fill(-1), sizes = [];
    for (let p0 = 0; p0 < W * H; p0++) {
      if (seen[p0] >= 0 || d[p0 * 4 + 3] < 128) continue;
      const id = sizes.length, st = [p0]; seen[p0] = id; let n = 0;
      while (st.length) {
        const p = st.pop(), x = p % W; n++;
        for (const q of [x > 0 ? p - 1 : -1, x < W - 1 ? p + 1 : -1, p - W, p + W])
          if (q >= 0 && q < W * H && seen[q] < 0 && d[q * 4 + 3] >= 128) { seen[q] = id; st.push(q); }
      }
      sizes.push(n);
    }
    if (!sizes.length) return;
    const big = Math.max(...sizes), keep = sizes.map(n => n >= big * 0.03);
    const nearKept = p => {
      const x = p % W, y = (p - x) / W;
      for (let dy = -2; dy <= 2; dy++) for (let dx = -2; dx <= 2; dx++) {
        const xx = x + dx, yy = y + dy; if (xx < 0 || yy < 0 || xx >= W || yy >= H) continue;
        const q = yy * W + xx; if (d[q * 4 + 3] >= 128 && seen[q] >= 0 && keep[seen[q]]) return true;
      }
      return false;
    };
    for (let p = 0; p < W * H; p++) {
      if (d[p * 4 + 3] < 128) { if (d[p * 4 + 3] && !nearKept(p)) d[p * 4 + 3] = 0; continue; }
      if (!keep[seen[p]]) d[p * 4 + 3] = 0;
    }
  }

  // 去背強度：0（寬鬆，保留多）～100（嚴格，切得乾淨）
  function applyCut(st, strength) {
    const { W, H, mw, mh, m } = st, img = new ImageData(new Uint8ClampedArray(st.rgba), W, H), d = img.data;
    const lo = 0.1 + Math.max(0, Math.min(100, strength)) / 100 * 0.72, hi = Math.min(0.98, lo + 0.3), width = hi - lo;
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      const v = m[Math.min(mh - 1, Math.floor(y * mh / H)) * mw + Math.min(mw - 1, Math.floor(x * mw / W))];
      d[(y * W + x) * 4 + 3] = Math.round(Math.max(0, Math.min(1, (v - lo) / width)) * 255);
    }
    removeSpecks(img);
    return img;
  }

  // ---- 插圖模式：姿勢偵測認不出來（例如 Q 版角色）但背景是單色時，用背景顏色去背 ----
  function plainBg(img) {
    const { width: W, height: H, data: d } = img, px = [];
    for (let x = 0; x < W; x += 4) px.push(x, (H - 1) * W + x);
    for (let y = 0; y < H; y += 4) px.push(y * W, y * W + W - 1);
    const med = [0, 1, 2].map(c => px.map(p => d[p * 4 + c]).sort((a, b) => a - b)[px.length >> 1]);
    const near = px.filter(p => Math.max(...[0, 1, 2].map(c => Math.abs(d[p * 4 + c] - med[c]))) < 30).length;
    return near / px.length > 0.7 ? med : null;
  }
  function drawCut(st, strength) {
    const { W, H, bg } = st, img = new ImageData(new Uint8ClampedArray(st.rgba), W, H), d = img.data;
    const tol = 14 + clampS(strength) * 0.7;   // 嚴格 = 跟背景有點像的顏色也去掉
    const diff = p => Math.max(Math.abs(d[p * 4] - bg[0]), Math.abs(d[p * 4 + 1] - bg[1]), Math.abs(d[p * 4 + 2] - bg[2]));
    const isBg = new Uint8Array(W * H), st2 = [];
    const seed = p => { if (!isBg[p] && diff(p) < tol) { isBg[p] = 1; st2.push(p); } };
    for (let x = 0; x < W; x++) { seed(x); seed((H - 1) * W + x); }
    for (let y = 0; y < H; y++) { seed(y * W); seed(y * W + W - 1); }
    while (st2.length) { const p = st2.pop(), x = p % W; if (x > 0) seed(p - 1); if (x < W - 1) seed(p + 1); if (p >= W) seed(p - W); if (p < W * (H - 1)) seed(p + W); }
    // 被圍起來的背景（手臂和身體中間的空隙）：顏色幾乎一樣、面積夠大才去掉
    const seen = new Uint8Array(W * H);
    for (let p0 = 0; p0 < W * H; p0++) {
      if (isBg[p0] || seen[p0] || diff(p0) >= 10) continue;
      const reg = [p0], s = [p0]; seen[p0] = 1;
      while (s.length) { const p = s.pop(), x = p % W; for (const q of [x > 0 ? p - 1 : -1, x < W - 1 ? p + 1 : -1, p - W, p + W]) if (q >= 0 && q < W * H && !seen[q] && !isBg[q] && diff(q) < 10) { seen[q] = 1; s.push(q); reg.push(q); } }
      if (reg.length > W * H * 0.0015) for (const p of reg) isBg[p] = 1;
    }
    // 邊緣柔和：背景旁邊的像素依顏色差距半透明
    for (let p = 0; p < W * H; p++) {
      if (isBg[p]) { d[p * 4 + 3] = 0; continue; }
      const x = p % W;
      if ((x > 0 && isBg[p - 1]) || (x < W - 1 && isBg[p + 1]) || (p >= W && isBg[p - W]) || (p < W * (H - 1) && isBg[p + W])) d[p * 4 + 3] = Math.round(Math.min(1, diff(p) / (tol * 2)) * 255);
    }
    removeSpecks(img);
    return img;
  }
  const clampS = s => Math.max(0, Math.min(100, s));

  // 插圖模式：從輪廓估計關節（用身體各部位的寬度變化）
  function guessJoints(img) {
    const { width: W, height: H, data: d } = img, box = bbox(img, 128), A = (x, y) => d[(y * W + x) * 4 + 3] >= 128;
    const top = box.y, bot = box.y + box.h - 1, h = box.h;
    const rowW = y => { let n = 0; for (let x = box.x; x < box.x + box.w; x++) if (A(x, y)) n++; return n; };
    // 脖子：上面 18%～55% 之間最窄的那一行（找不到明顯的就用 33%）
    let neckY = Math.round(top + h * 0.33), mn = 1e9;
    const ws = []; for (let y = top; y <= bot; y++) ws.push(rowW(y));
    const sm = i => (ws[i - 2] + ws[i - 1] + ws[i] + ws[i + 1] + ws[i + 2]) / 5;
    for (let i = Math.round(h * 0.18); i < Math.round(h * 0.55); i++) { const v = sm(i); if (v < mn) { mn = v; neckY = top + i; } }
    // 腳：靠近腳底的一行，找左右兩段
    const runs = y => { const r = []; let s = -1; for (let x = box.x; x <= box.x + box.w; x++) { const a = x < box.x + box.w && A(x, y); if (a && s < 0) s = x; if (!a && s >= 0) { r.push([s, x - 1]); s = -1; } } return r; };
    let legs = null;
    for (const f of [0.1, 0.14, 0.18, 0.06]) { const r = runs(Math.round(bot - h * f)).sort((a, b) => (b[1] - b[0]) - (a[1] - a[0])).slice(0, 2).sort((a, b) => a[0] - b[0]); if (r.length === 2) { legs = r.map(q => (q[0] + q[1]) / 2); break; } }
    const cx = legs ? (legs[0] + legs[1]) / 2 : box.x + box.w / 2;
    if (!legs) legs = [cx - box.w * 0.12, cx + box.w * 0.12];
    const legHalf = Math.max(h * 0.04, (legs[1] - legs[0]) / 2);
    const hipY = Math.round(neckY + (bot - neckY) * 0.45), shY = neckY + (hipY - neckY) * 0.3;
    // 手：脖子到髖部下面一點之間，最左邊和最右邊的點
    let hl = null, hr = null;
    for (let y = Math.round(neckY); y <= Math.min(bot, hipY + h * 0.12); y++) for (let x = box.x; x < box.x + box.w; x++) if (A(x, y)) {
      if (!hl || x < hl.x) hl = { x, y }; break;
    }
    for (let y = Math.round(neckY); y <= Math.min(bot, hipY + h * 0.12); y++) for (let x = box.x + box.w - 1; x >= box.x; x--) if (A(x, y)) {
      if (!hr || x > hr.x) hr = { x, y }; break;
    }
    const shHalf = Math.max(h * 0.06, legHalf * 0.9);   // 肩膀大約在兩腳正上方、稍微內側
    const shL = { x: cx - shHalf, y: shY }, shR = { x: cx + shHalf, y: shY };
    const L = (a, b, t) => ({ x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t });
    const hipL = { x: cx - legHalf * 0.9, y: hipY }, hipR = { x: cx + legHalf * 0.9, y: hipY };
    const anL = { x: legs[0], y: bot - h * 0.05 }, anR = { x: legs[1], y: bot - h * 0.05 };
    return {
      top: { x: cx, y: top }, neck: { x: cx, y: neckY }, pelvis: { x: cx, y: hipY },
      shL, shR, elL: L(shL, hl, 0.5), elR: L(shR, hr, 0.5), wrL: L(shL, hl, 0.85), wrR: L(shR, hr, 0.85), hnL: hl, hnR: hr,
      hipL, hipR, knL: L(hipL, anL, 0.5), knR: L(hipR, anR, 0.5), anL, anR, ftL: { x: legs[0], y: bot }, ftR: { x: legs[1], y: bot },
    };
  }

  // 回傳 { canvas（透明背景，裁到人物範圍）, lm（33 個身體點，裁切後的像素座標）或 J（插圖模式估計的關節）, warn（提醒文字陣列） }
  function build(strength) {
    const st = last, img = st.bg ? drawCut(st, strength) : applyCut(st, strength), box = bbox(img, 128);
    if (!box || box.w * box.h < st.W * st.H * 0.02) throw new Error(strength > 70 ? '去背太嚴格，人也被切掉了，請往「寬鬆」調。' : '照片裡找不到人。請拍全身、人站在畫面中間、光線充足。');
    const pad = Math.round(Math.max(box.w, box.h) * 0.03);
    const x0 = Math.max(0, box.x - pad), y0 = Math.max(0, box.y - pad), x1 = Math.min(st.W, box.x + box.w + pad), y1 = Math.min(st.H, box.y + box.h + pad);
    const out = canvasOf(x1 - x0, y1 - y0), octx = out.getContext('2d'); octx.putImageData(img, -x0, -y0);
    const warn = [];
    if (box.y + box.h >= st.H - 2) warn.push('腳好像被切到了，拍的時候腳下多留一點空間。');
    if (box.y <= 1) warn.push('頭頂好像被切到了。');
    if (!st.lm0) {
      warn.push('這張看起來是插圖，關節位置是用輪廓估計的。');
      return { canvas: out, J: guessJoints(octx.getImageData(0, 0, out.width, out.height)), warn, strength };
    }
    const lm = st.lm0.map(p => ({ x: p.x - x0, y: p.y - y0, v: p.v }));
    if (Math.min(lm[15].v, lm[16].v) < 0.4) warn.push('手不太清楚，手臂請稍微張開、離身體遠一點。');
    if (Math.min(lm[27].v, lm[28].v) < 0.4) warn.push('腳不太清楚，請拍全身。');
    return { canvas: out, lm, warn, strength };
  }

  // src：照片 Blob 或已經畫好的 canvas
  async function cut(src, onMsg, strength = 45) {
    const pose = await getPose(onMsg);
    onMsg && onMsg('去背中…');
    await new Promise(r => setTimeout(r, 20));
    const img = await toImageData(src, 1280), W = img.width, H = img.height;
    const c = canvasOf(W, H); c.getContext('2d').putImageData(img, 0, 0);
    const r = pose.detect(c);
    if (!r.segmentationMasks || !r.segmentationMasks.length || !r.landmarks.length) {
      (r.segmentationMasks || []).forEach(k => k.close && k.close());
      // 認不出人：背景是單色的話（插圖、設定圖），改用插圖模式
      const bg = plainBg(img);
      if (!bg) throw new Error('照片裡找不到人。請拍全身、人站在畫面中間、光線充足。');
      onMsg && onMsg('插圖模式去背中…');
      last = { W, H, rgba: new Uint8ClampedArray(img.data), bg };
      return build(strength);
    }
    const mask = r.segmentationMasks[0];
    last = { W, H, rgba: new Uint8ClampedArray(img.data), mw: mask.width, mh: mask.height, m: new Float32Array(mask.getAsFloat32Array()),
      lm0: r.landmarks[0].map(p => ({ x: p.x * W, y: p.y * H, v: p.visibility == null ? 1 : p.visibility })) };
    r.segmentationMasks.forEach(k => k.close && k.close());
    return build(strength);
  }

  // 調整去背強度（不重新辨識，很快）
  function recut(strength) { if (!last) throw new Error('請重新選照片'); return build(strength); }

  return { cut, recut, getPose, bbox };
})();
