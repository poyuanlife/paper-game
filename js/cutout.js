'use strict';
// =====================================================
//  去背 + 找身體關節
//  人：Google MediaPipe 姿勢偵測（Pose Landmarker），第一次約 23 MB
//  貓狗：MediaPipe 影像分割（DeepLab v3，認得貓、狗），第一次約 16 MB（兩種共用的核心 13.5 MB 只下載一次）
//  之後瀏覽器會記住（離線也能用）。
//  照片全部在這台裝置上處理，不會上傳。
// =====================================================
const Cutout = (() => {
  const MP_BASE = 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@1.1.1';
  const MODEL = 'https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_full/float16/latest/pose_landmarker_full.task';
  const SEG_MODEL = 'https://storage.googleapis.com/mediapipe-models/image_segmenter/deeplab_v3/float32/latest/deeplab_v3.tflite';
  const ANIMALS = ['cat', 'dog', 'horse', 'sheep', 'cow'];   // 狗有時會被認成羊、馬，一起算
  let poseP = null, segP = null, visionP = null, last = null;

  function getVision() {
    if (!visionP) { visionP = (async () => { const mp = await import(`${MP_BASE}/vision_bundle.mjs`); return { mp, files: await mp.FilesetResolver.forVisionTasks(`${MP_BASE}/wasm`) }; })(); visionP.catch(() => { visionP = null; }); }
    return visionP;
  }
  function getSeg(onMsg) {
    if (segP) return segP;
    segP = (async () => {
      onMsg && onMsg('下載貓狗去背工具中（只有第一次，約 16 MB）…');
      const { mp, files } = await getVision();
      let err = null;
      for (const delegate of ['GPU', 'CPU']) {
        try { return await mp.ImageSegmenter.createFromOptions(files, { baseOptions: { modelAssetPath: SEG_MODEL, delegate }, runningMode: 'IMAGE', outputCategoryMask: false, outputConfidenceMasks: true }); }
        catch (e) { err = e; }
      }
      throw err || new Error('無法啟動去背工具');
    })();
    segP.catch(() => { segP = null; });
    return segP;
  }

  function getPose(onMsg) {
    if (poseP) return poseP;
    poseP = (async () => {
      onMsg && onMsg('下載去背工具中（只有第一次，約 23 MB）…');
      const { mp, files } = await getVision();
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
    // 貓狗模型的信心值整體比較低，同樣的滑桿位置要用比較低的門檻
    const sv = Math.max(0, Math.min(100, strength)) / 100, lo = st.pet ? 0.02 + sv * 0.3 : 0.1 + sv * 0.72, hi = Math.min(0.98, lo + (st.pet ? 0.2 : 0.3)), width = hi - lo;
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
  // central：手只找跟身體連在同一行的那段（小朋友畫的長頭髮常常垂到手的旁邊，不要把髮尾當成手）
  function guessJoints(img, central) {
    const { width: W, height: H, data: d } = img, box = bbox(img, 128), A = (x, y) => d[(y * W + x) * 4 + 3] >= 128;
    const top = box.y, bot = box.y + box.h - 1, h = box.h;
    const rowW = y => { let n = 0; for (let x = box.x; x < box.x + box.w; x++) if (A(x, y)) n++; return n; };
    // 腳：靠近腳底的一行，找左右兩段
    const runs = y => { const r = []; let s = -1; for (let x = box.x; x <= box.x + box.w; x++) { const a = x < box.x + box.w && A(x, y); if (a && s < 0) s = x; if (!a && s >= 0) { r.push([s, x - 1]); s = -1; } } return r; };
    let legs = null;
    for (const f of [0.1, 0.14, 0.18, 0.06]) { const r = runs(Math.round(bot - h * f)).sort((a, b) => (b[1] - b[0]) - (a[1] - a[0])).slice(0, 2).sort((a, b) => a[0] - b[0]); if (r.length === 2) { legs = r.map(q => (q[0] + q[1]) / 2); break; } }
    const cx = legs ? (legs[0] + legs[1]) / 2 : box.x + box.w / 2;
    if (!legs) legs = [cx - box.w * 0.12, cx + box.w * 0.12];
    // 脖子：上面 18%～55% 之間最窄的那一行（找不到明顯的就用 33%）
    // central：只量中間那一段的寬度（兩旁垂下來的頭髮不算）
    const centralRun = y => { let best = null, bd = 1e9; for (const r of runs(y)) { const dd = cx < r[0] ? r[0] - cx : cx > r[1] ? cx - r[1] : 0; if (dd < bd) { bd = dd; best = r; } } return best && bd <= h * 0.05 ? best : null; };
    let neckY = Math.round(top + h * 0.33), mn = 1e9;
    const ws = []; for (let y = top; y <= bot; y++) { if (central) { const r = centralRun(y); ws.push(r ? r[1] - r[0] + 1 : 0); } else ws.push(rowW(y)); }
    const sm = i => (ws[i - 2] + ws[i - 1] + ws[i] + ws[i + 1] + ws[i + 2]) / 5;
    // 畫：先找頭最寬的那一行，脖子在它下面（貓耳朵、兔耳朵中間的凹口不算）
    let i0 = Math.round(h * 0.18), i1 = Math.round(h * 0.55);
    if (central) { let wi = i0, wv = -1; for (let i = Math.round(h * 0.1); i < Math.round(h * 0.45); i++) { const v = sm(i); if (v > wv) { wv = v; wi = i; } } i0 = wi; i1 = Math.round(h * 0.6); }
    for (let i = i0; i < i1; i++) { const v = sm(i); if (v < mn) { mn = v; neckY = top + i; } }
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
    if (central) {
      let cl = null, cr = null;
      for (let y = Math.round(neckY + (hipY - neckY) * 0.1); y <= Math.min(bot, hipY + h * 0.05); y++) {
        const best = centralRun(y); if (!best) continue;
        if (!cl || best[0] < cl.x) cl = { x: best[0], y }; if (!cr || best[1] > cr.x) cr = { x: best[1], y };
      }
      if (cl && cx - cl.x > h * 0.09) hl = cl;
      if (cr && cr.x - cx > h * 0.09) hr = cr;
    }
    return humanFromKeys({ top: { x: cx, y: top }, neck: { x: cx, y: neckY }, pelvis: { x: cx, y: hipY }, hnL: hl, hnR: hr, ftL: { x: legs[0], y: bot }, ftR: { x: legs[1], y: bot } });
  }
  // 從 7 個主要的點（頭頂、脖子、屁股、兩手、兩腳）推出全部關節；手動拖拉關節之後也用這個重算
  function humanFromKeys(K) {
    const { top, neck, pelvis, hnL, hnR, ftL, ftR } = K, h = Math.max(10, Math.max(ftL.y, ftR.y) - top.y);
    const L = (a, b, t) => ({ x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t });
    const legHalf = Math.max(h * 0.04, Math.abs(ftR.x - ftL.x) / 2);
    const sh = L(neck, pelvis, 0.3), shHalf = Math.max(h * 0.06, legHalf * 0.9);   // 肩膀大約在兩腳正上方、稍微內側
    const shL = { x: sh.x - shHalf, y: sh.y }, shR = { x: sh.x + shHalf, y: sh.y };
    const hipL = { x: pelvis.x - legHalf * 0.9, y: pelvis.y }, hipR = { x: pelvis.x + legHalf * 0.9, y: pelvis.y };
    const anL = { x: ftL.x, y: ftL.y - h * 0.05 }, anR = { x: ftR.x, y: ftR.y - h * 0.05 };
    return {
      auto: 1, top, neck, pelvis,
      shL, shR, elL: L(shL, hnL, 0.5), elR: L(shR, hnR, 0.5), wrL: L(shL, hnL, 0.85), wrR: L(shR, hnR, 0.85), hnL, hnR,
      hipL, hipR, knL: L(hipL, anL, 0.5), knR: L(hipR, anR, 0.5), anL, anR, ftL, ftR,
    };
  }

  // ---- 拍畫畫：小朋友畫在紙上的人 ----
  // 紙的顏色：每 24 像素一小塊取偏亮的顏色，再把深色的大塊（塗滿的衣服）用「先放大再縮小」填掉 → 影子、光線不均都能拉平
  function paperOf(img) {
    const { width: W, height: H, data: d } = img, B = 24, gw = Math.ceil(W / B), gh = Math.ceil(H / B), R = 5, tmp = [];
    const morph = (a, fn) => {
      const o = new Float32Array(a.length), o2 = new Float32Array(a.length);
      for (let y = 0; y < gh; y++) for (let x = 0; x < gw; x++) { let v = a[y * gw + x]; for (let k = -R; k <= R; k++) { const xx = x + k; if (xx >= 0 && xx < gw) v = fn(v, a[y * gw + xx]); } o[y * gw + x] = v; }
      for (let y = 0; y < gh; y++) for (let x = 0; x < gw; x++) { let v = o[y * gw + x]; for (let k = -R; k <= R; k++) { const yy = y + k; if (yy >= 0 && yy < gh) v = fn(v, o[yy * gw + x]); } o2[y * gw + x] = v; }
      return o2;
    };
    const bg = [0, 1, 2].map(c => {
      const g = new Float32Array(gw * gh);
      for (let by = 0; by < gh; by++) for (let bx = 0; bx < gw; bx++) {
        tmp.length = 0;
        for (let y = by * B; y < Math.min(H, by * B + B); y += 2) for (let x = bx * B; x < Math.min(W, bx * B + B); x += 2) tmp.push(d[(y * W + x) * 4 + c]);
        tmp.sort((a, b) => a - b); g[by * gw + bx] = tmp[Math.floor(tmp.length * 0.85)];
      }
      return morph(morph(g, Math.max), Math.min);
    });
    // 每個像素：用周圍 4 塊的中心點內插
    return (c, x, y) => {
      const fx = Math.max(0, Math.min(gw - 1.001, x / B - 0.5)), fy = Math.max(0, Math.min(gh - 1.001, y / B - 0.5)), x0 = Math.floor(fx), y0 = Math.floor(fy), tx = fx - x0, ty = fy - y0;
      const a = bg[c], x1 = Math.min(gw - 1, x0 + 1), y1 = Math.min(gh - 1, y0 + 1);
      return Math.max(30, (a[y0 * gw + x0] * (1 - tx) + a[y0 * gw + x1] * tx) * (1 - ty) + (a[y1 * gw + x0] * (1 - tx) + a[y1 * gw + x1] * tx) * ty);
    };
  }
  // 遮罩往外長 r 像素（方形；橫、直各做一次，用滑動計數比較快）
  function dilate(m, W, H, r) {
    const t = new Uint8Array(W * H), o = new Uint8Array(W * H);
    for (let y = 0; y < H; y++) { let n = 0; const row = y * W;
      for (let x = -r; x < W; x++) { const a = x + r, b = x - r - 1; if (a < W && m[row + a]) n++; if (b >= 0 && m[row + b]) n--; if (x >= 0) t[row + x] = n > 0 ? 1 : 0; } }
    for (let x = 0; x < W; x++) { let n = 0;
      for (let y = -r; y < H; y++) { const a = y + r, b = y - r - 1; if (a < H && t[a * W + x]) n++; if (b >= 0 && t[b * W + x]) n--; if (y >= 0) o[y * W + x] = n > 0 ? 1 : 0; } }
    return o;
  }
  // 連在一起的區塊：回傳每個像素的編號和每塊的大小
  function components(m, W, H) {
    const id = new Int32Array(W * H).fill(-1), sizes = [];
    for (let p0 = 0; p0 < W * H; p0++) {
      if (!m[p0] || id[p0] >= 0) continue;
      const k = sizes.length, st = [p0]; id[p0] = k; let n = 0;
      while (st.length) { const p = st.pop(), x = p % W; n++; for (const q of [x > 0 ? p - 1 : -1, x < W - 1 ? p + 1 : -1, p >= W ? p - W : -1, p < W * (H - 1) ? p + W : -1]) if (q >= 0 && m[q] && id[q] < 0) { id[q] = k; st.push(q); } }
      sizes.push(n);
    }
    return { id, sizes };
  }

  // 載入照片（拍畫畫要先讓使用者圈選，所以分開）
  const loadImage = src => toImageData(src, 1280);

  // img：整張照片；poly：使用者圈的範圍（照片座標，至少 3 點；null = 整張）
  function cutDrawing(img, poly, strength = 45) {
    const W = img.width, H = img.height, d = img.data;
    if (!poly || poly.length < 3) poly = [{ x: 0, y: 0 }, { x: W, y: 0 }, { x: W, y: H }, { x: 0, y: H }];
    let x0 = W, y0 = H, x1 = 0, y1 = 0;
    for (const p of poly) { x0 = Math.min(x0, p.x); y0 = Math.min(y0, p.y); x1 = Math.max(x1, p.x); y1 = Math.max(y1, p.y); }
    const pad = 6; x0 = Math.max(0, Math.floor(x0) - pad); y0 = Math.max(0, Math.floor(y0) - pad); x1 = Math.min(W, Math.ceil(x1) + pad); y1 = Math.min(H, Math.ceil(y1) + pad);
    const cw = x1 - x0, ch = y1 - y0;
    if (cw < 20 || ch < 20) throw new Error('圈的範圍太小了，請把整個人圈起來。');
    // 圈起來的範圍 → 遮罩
    const pc = canvasOf(cw, ch), px = pc.getContext('2d');
    px.beginPath(); poly.forEach((p, i) => i ? px.lineTo(p.x - x0, p.y - y0) : px.moveTo(p.x - x0, p.y - y0)); px.closePath(); px.fillStyle = '#000'; px.fill();
    const pd = px.getImageData(0, 0, cw, ch).data, inPoly = new Uint8Array(cw * ch);
    for (let p = 0; p < cw * ch; p++) inPoly[p] = pd[p * 4 + 3] > 127 ? 1 : 0;
    // 把紙拉成白色：每個顏色除以紙的顏色
    const bgAt = paperOf(img), nrm = new Uint8ClampedArray(cw * ch * 3), ink = new Float32Array(cw * ch);
    for (let y = 0; y < ch; y++) for (let x = 0; x < cw; x++) {
      const p = y * cw + x, q = ((y + y0) * W + x + x0) * 4, n = [0, 1, 2].map(c => Math.min(1, d[q + c] / bgAt(c, x + x0, y + y0)));
      nrm[p * 3] = n[0] * 255; nrm[p * 3 + 1] = n[1] * 255; nrm[p * 3 + 2] = n[2] * 255;
      const dark = 1 - (0.299 * n[0] + 0.587 * n[1] + 0.114 * n[2]), chroma = Math.max(...n) - Math.min(...n);
      ink[p] = Math.max(dark, chroma * 0.8);   // 深色的筆，或是顏色很鮮豔的蠟筆
    }
    last = { draw: true, cw, ch, inPoly, nrm, ink };
    return buildDraw(strength);
  }

  function buildDraw(strength) {
    const { cw: W, ch: H, inPoly, nrm, ink } = last, N = W * H;
    const thr = 0.04 + clampS(strength) / 100 * 0.26;   // 嚴格 = 只要很明顯的線條
    let m = new Uint8Array(N);
    // 兩段門檻：明顯的線條當起點，沿著它把比較淡的部分也接起來（原子筆的細線拍起來常常斷斷續續）
    const st0 = [];
    for (let p = 0; p < N; p++) if (inPoly[p] && ink[p] > thr) { m[p] = 1; st0.push(p); }
    const lo = thr * 0.5;
    while (st0.length) { const p = st0.pop(), x = p % W;
      for (const q of [x > 0 ? p - 1 : -1, x < W - 1 ? p + 1 : -1, p >= W ? p - W : -1, p < N - W ? p + W : -1, x > 0 && p >= W ? p - W - 1 : -1, x < W - 1 && p >= W ? p - W + 1 : -1, x > 0 && p < N - W ? p + W - 1 : -1, x < W - 1 && p < N - W ? p + W + 1 : -1])
        if (q >= 0 && !m[q] && inPoly[q] && ink[q] > lo) { m[q] = 1; st0.push(q); } }
    // 清掉紙上的小髒點
    let cc = components(m, W, H);
    const speck = Math.max(8, N * 0.00002);
    for (let p = 0; p < N; p++) if (m[p] && cc.sizes[cc.id[p]] < speck) m[p] = 0;
    let inkBox = { x0: W, y0: H, x1: -1, y1: -1 };
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (m[y * W + x]) { inkBox.x0 = Math.min(inkBox.x0, x); inkBox.x1 = Math.max(inkBox.x1, x); inkBox.y0 = Math.min(inkBox.y0, y); inkBox.y1 = Math.max(inkBox.y1, y); }
    if (inkBox.x1 < 0) throw new Error(strength > 60 ? '沒有找到線條，請往「寬鬆」調。' : '圈起來的地方沒有找到畫的線條。');
    const size = Math.max(inkBox.x1 - inkBox.x0, inkBox.y1 - inkBox.y0);
    const rT = Math.max(1, Math.round(size * 0.009)), rD = Math.max(3, Math.round(size * 0.022));
    // 線條加粗（給上色用）、身體範圍 = 線條再放大一圈 + 把圍起來的地方填滿（臉、身體）
    const thick = dilate(m, W, H, rT);
    // 外面 = 從邊緣走得到、沒碰到線的地方；其他都算身體
    const outside = wall => {
      const out = new Uint8Array(N), st = [];
      const seed = p => { if (!wall[p] && !out[p]) { out[p] = 1; st.push(p); } };
      for (let x = 0; x < W; x++) { seed(x); seed((H - 1) * W + x); }
      for (let y = 0; y < H; y++) { seed(y * W); seed(y * W + W - 1); }
      while (st.length) { const p = st.pop(), x = p % W; if (x > 0) seed(p - 1); if (x < W - 1) seed(p + 1); if (p >= W) seed(p - W); if (p < N - W) seed(p + W); }
      return out;
    };
    // 頭的圓圈常常沒有畫接起來：用更粗的線找「被圍起來的地方」，缺口小的也能填滿
    // 只填「圓圓的、不太大」的（頭、身體），長條形的（頭髮和身體中間的空隙）不填
    const body = dilate(m, W, H, rD), out1 = outside(body), out2 = outside(dilate(m, W, H, rD * 2)), extra = new Uint8Array(N);
    for (let p = 0; p < N; p++) { body[p] = out1[p] ? 0 : 1; extra[p] = out1[p] && !out2[p] ? 1 : 0; }
    const ex = components(extra, W, H), exBox = ex.sizes.map(() => [W, H, -1, -1]);
    for (let p = 0; p < N; p++) if (extra[p]) { const b = exBox[ex.id[p]], x = p % W, y = (p - x) / W; b[0] = Math.min(b[0], x); b[1] = Math.min(b[1], y); b[2] = Math.max(b[2], x); b[3] = Math.max(b[3], y); }
    const okEx = ex.sizes.map((n, i) => { const [a, b, c, d] = exBox[i], w = c - a + 1, h = d - b + 1; return n < size * size * 0.12 && w / h < 2.2 && h / w < 2.2 && n / (w * h) > 0.45; });
    for (let p = 0; p < N; p++) if (extra[p] && okEx[ex.id[p]]) body[p] = 1;
    // 只留比較大的區塊（圈到一點點名字、旁邊的線不要）；但被身體包圍的小塊（眼睛、嘴巴）要留著
    cc = components(body, W, H);
    const big = cc.sizes.indexOf(Math.max(...cc.sizes)), keep = cc.sizes.map((n, i) => i === big || n >= cc.sizes[big] * 0.08);
    const cen = cc.sizes.map(() => [0, 0]);
    for (let p = 0; p < N; p++) if (body[p]) { const c = cen[cc.id[p]]; c[0] += p % W; c[1] += (p - p % W) / W; }
    const ray = (x, y, dx, dy) => { for (let k = 1; k < size * 0.6; k++) { const xx = Math.round(x + dx * k), yy = Math.round(y + dy * k); if (xx < 0 || yy < 0 || xx >= W || yy >= H) return false; if (cc.id[yy * W + xx] === big) return true; } return false; };
    keep.forEach((k, i) => {
      if (k) return; const x = cen[i][0] / cc.sizes[i], y = cen[i][1] / cc.sizes[i];
      // 上下左右四個方向有三個碰得到身體 → 在身體裡面
      keep[i] = [[1, 0], [-1, 0], [0, 1], [0, -1]].filter(([dx, dy]) => ray(x, y, dx, dy)).length >= 3;
    });
    for (let p = 0; p < N; p++) if (body[p] && !keep[cc.id[p]]) body[p] = 0;
    // 上色：線條用原本的顏色（取周圍最深的，等於把線畫粗），其他地方是白紙
    const img = new ImageData(W, H), o = img.data;
    const minC = (x, y, c) => { let v = 255; for (let dy = -rT; dy <= rT; dy++) { const yy = y + dy; if (yy < 0 || yy >= H) continue; for (let dx = -rT; dx <= rT; dx++) { const xx = x + dx; if (xx < 0 || xx >= W || !m[yy * W + xx]) continue; v = Math.min(v, nrm[(yy * W + xx) * 3 + c]); } } return v; };
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      const p = y * W + x; if (!body[p]) continue;
      if (thick[p]) for (let c = 0; c < 3; c++) o[p * 4 + c] = Math.max(0, 255 - (255 - minC(x, y, c)) * 1.7);
      else { o[p * 4] = 255; o[p * 4 + 1] = 253; o[p * 4 + 2] = 245; }
      o[p * 4 + 3] = 255;
    }
    const box = bbox(img, 128), pad = Math.round(Math.max(box.w, box.h) * 0.03);
    const bx0 = Math.max(0, box.x - pad), by0 = Math.max(0, box.y - pad), bx1 = Math.min(W, box.x + box.w + pad), by1 = Math.min(H, box.y + box.h + pad);
    const cv = canvasOf(bx1 - bx0, by1 - by0), cx = cv.getContext('2d'); cx.putImageData(img, -bx0, -by0);
    const warn = ['手腳的位置是自動猜的，不準的話按「🦴 調整關節」拖一下。'];
    return { canvas: cv, J: Object.assign(guessJoints(cx.getImageData(0, 0, cv.width, cv.height), true), { draw: 1 }), warn, strength };
  }

  // 回傳 { canvas（透明背景，裁到人物範圍）, lm（33 個身體點，裁切後的像素座標）或 J（插圖模式估計的關節）, warn（提醒文字陣列） }
  function build(strength) {
    const st = last, img = st.bg ? drawCut(st, strength) : applyCut(st, strength), box = bbox(img, 128);
    const who = st.pet ? '寵物' : '人';
    if (!box || box.w * box.h < st.W * st.H * 0.02) throw new Error(strength > 70 ? `去背太嚴格，${who}也被切掉了，請往「寬鬆」調。` : st.pet ? '照片裡找不到貓或狗。請拍側面全身、光線充足。' : '照片裡找不到人。請拍全身、人站在畫面中間、光線充足。');
    const pad = Math.round(Math.max(box.w, box.h) * 0.03);
    const x0 = Math.max(0, box.x - pad), y0 = Math.max(0, box.y - pad), x1 = Math.min(st.W, box.x + box.w + pad), y1 = Math.min(st.H, box.y + box.h + pad);
    const out = canvasOf(x1 - x0, y1 - y0), octx = out.getContext('2d'); octx.putImageData(img, -x0, -y0);
    const warn = [];
    if (box.y + box.h >= st.H - 2) warn.push('腳好像被切到了，拍的時候腳下多留一點空間。');
    if (box.y <= 1) warn.push('頭頂好像被切到了。');
    if (st.pet) {
      const J = PetPuppet.guessJoints(octx.getImageData(0, 0, out.width, out.height));
      if (st.bg) warn.push('這張看起來是插圖，用背景顏色去背。');
      warn.push('頭、尾巴、腳的位置是自動猜的，不準的話按「🦴 調整關節」拖一下。');
      return { canvas: out, J, warn, strength };
    }
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
  async function cut(src, onMsg, strength = 45, mode = 'human') {
    if (mode === 'pet') return cutPet(src, onMsg, strength);
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

  // 貓狗：影像分割的「貓 / 狗」信心值當成遮罩，之後跟人一樣用強度滑桿調
  async function cutPet(src, onMsg, strength) {
    const seg = await getSeg(onMsg);
    onMsg && onMsg('去背中…');
    await new Promise(r => setTimeout(r, 20));
    const img = await toImageData(src, 1280), W = img.width, H = img.height;
    const c = canvasOf(W, H); c.getContext('2d').putImageData(img, 0, 0);
    const r = seg.segment(c), labels = seg.getLabels().map(s => s.toLowerCase());
    const idx = ANIMALS.map(a => labels.indexOf(a)).filter(i => i >= 0 && r.confidenceMasks && r.confidenceMasks[i]);
    let m = null, mw = 0, mh = 0, n = 0;
    if (idx.length) {
      const first = r.confidenceMasks[idx[0]]; mw = first.width; mh = first.height; m = new Float32Array(mw * mh);
      for (const i of idx) { const a = r.confidenceMasks[i].getAsFloat32Array(); for (let p = 0; p < a.length; p++) if (a[p] > m[p]) m[p] = a[p]; }
      for (let p = 0; p < m.length; p++) if (m[p] > 0.5) n++;
    }
    if (r.close) r.close(); else (r.confidenceMasks || []).forEach(k => k.close && k.close());
    if (!m || n < mw * mh * 0.01) {
      const bg = plainBg(img);
      if (!bg) throw new Error('照片裡找不到貓或狗。請拍側面全身、背景單純一點、光線充足。');
      onMsg && onMsg('插圖模式去背中…');
      last = { W, H, rgba: new Uint8ClampedArray(img.data), bg, pet: true };
      return build(strength);
    }
    last = { W, H, rgba: new Uint8ClampedArray(img.data), mw, mh, m, pet: true };
    return build(strength);
  }

  // 調整去背強度（不重新辨識，很快）
  function recut(strength) { if (!last) throw new Error('請重新選照片'); return last.draw ? buildDraw(strength) : build(strength); }

  return { cut, recut, getPose, bbox, loadImage, cutDrawing, humanFromKeys };
})();
