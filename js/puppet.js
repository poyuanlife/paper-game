'use strict';
// =====================================================
//  紙片人：把去背後的全身照切成頭、身體、上臂、前臂、大腿、小腿，
//  像用雙腳釘釘起來的紙偶一樣，每個部位繞著關節轉動。
//  整個人外面有一圈白色紙邊和影子。
//
//  姿勢（pose）的角度都是弧度，0 = 照片原本的樣子：
//    rot 全身旋轉、lean 上半身前後傾（繞骨盆）、head 頭
//    aL / aR 上臂（正 = 往外舉）、aLf / aRf 前臂（正 = 往外彎）
//    lL / lR 大腿（正 = 往外張）、lLf / lRf 小腿（正 = 往外彎）
//    dy 上下位移（人物高度的比例，負 = 往上）、sx / sy 縮放（sx 負的 = 左右翻面）、hsx / hsy 頭的縮放
//  opt.decor(部位名稱, ctx, pup)：畫完每個部位後呼叫，座標是部位圖片的原始座標（用來貼 OK 繃等）
//  「左 L」是畫面的左邊。
// =====================================================
const Puppet = (() => {
  const SIZE = 440;   // 部位圖片的高度（像素），越大越清楚、越耗記憶體

  const canvasOf = (w, h) => { const c = document.createElement('canvas'); c.width = Math.max(1, w); c.height = Math.max(1, h); return c; };
  const mid = (a, b) => ({ x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 });
  const lerp = (a, b, t) => ({ x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t });
  const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
  function segDist(px, py, a, b) {
    const dx = b.x - a.x, dy = b.y - a.y, L = dx * dx + dy * dy;
    const t = L ? Math.max(0, Math.min(1, ((px - a.x) * dx + (py - a.y) * dy) / L)) : 0;
    return Math.hypot(px - a.x - dx * t, py - a.y - dy * t);
  }

  // MediaPipe 的 33 個身體點 → 紙偶關節
  // 編號：0 鼻子、11/12 肩、13/14 肘、15/16 手腕、19/20 食指、23/24 髖、25/26 膝、27/28 腳踝、29/30 腳跟、31/32 腳尖
  function jointsFromLandmarks(lm, canvas) {
    const box = Cutout.bbox(canvas.getContext('2d').getImageData(0, 0, canvas.width, canvas.height), 128);
    const pair = (a, b) => lm[a].x <= lm[b].x ? [lm[a], lm[b]] : [lm[b], lm[a]];
    const [shL, shR] = pair(11, 12), [hipL, hipR] = pair(23, 24);
    // 手、腳依「離哪邊的肩膀／髖比較近」配對，交叉的手才不會配錯
    const side = (i, j, l, r) => (dist(lm[i], l) + dist(lm[j], r) <= dist(lm[i], r) + dist(lm[j], l)) ? [i, j] : [j, i];
    const [eL, eR] = side(13, 14, shL, shR), [kL, kR] = side(25, 26, hipL, hipR);
    const wL = dist(lm[15], lm[eL]) < dist(lm[16], lm[eL]) ? 15 : 16, wR = wL === 15 ? 16 : 15;
    const aL = dist(lm[27], lm[kL]) < dist(lm[28], lm[kL]) ? 27 : 28, aR = aL === 27 ? 28 : 27;
    const hand = (w, e) => { const f = lm[w + 4]; return f && f.v > 0.5 && dist(f, lm[w]) < dist(lm[w], lm[e]) * 0.6 ? lerp(lm[w], f, 1.15) : lerp(lm[e], lm[w], 1.3); };
    const foot = a => { const h = lm[a + 2], t = lm[a + 4]; return { x: (h.x + t.x) / 2, y: Math.max(h.y, t.y, lm[a].y) }; };
    const sh = mid(shL, shR), nose = lm[0];
    return {
      top: { x: nose.x, y: box ? box.y : 0 }, neck: lerp(sh, nose, 0.3), pelvis: mid(hipL, hipR),
      shL, shR, elL: lm[eL], elR: lm[eR], wrL: lm[wL], wrR: lm[wR], hnL: hand(wL, eL), hnR: hand(wR, eR),
      hipL, hipR, knL: lm[kL], knR: lm[kR], anL: lm[aL], anR: lm[aR], ftL: foot(aL), ftR: foot(aR),
    };
  }

  // 把 canvas + 關節 切成部位
  const ORDER = ['thighL', 'shinL', 'thighR', 'shinR', 'torso', 'head', 'upperL', 'foreL', 'upperR', 'foreR'];
  function build(src, J0) {
    // 先縮放到固定高度
    const k = SIZE / src.height, W = Math.round(src.width * k), H = SIZE;
    const c = canvasOf(W, H), x = c.getContext('2d'); x.imageSmoothingQuality = 'high'; x.drawImage(src, 0, 0, W, H);
    const J = {}; for (const n in J0) J[n] = { x: J0[n].x * k, y: J0[n].y * k };
    const img = x.getImageData(0, 0, W, H), d = img.data;
    const sw = Math.max(dist(J.shL, J.shR), H * 0.12);

    // 每個部位的骨頭（線段）和偏好（bias 越大，越容易把旁邊的像素分給它）
    const bones = {
      head: { segs: [[J.neck, J.top]], bias: sw * 0.22 },
      torso: { segs: [[J.neck, J.pelvis]], bias: sw * 0.26 },
      upperL: { segs: [[J.shL, J.elL]] }, foreL: { segs: [[J.elL, J.wrL], [J.wrL, J.hnL]] },
      upperR: { segs: [[J.shR, J.elR]] }, foreR: { segs: [[J.elR, J.wrR], [J.wrR, J.hnR]] },
      thighL: { segs: [[J.hipL, J.knL]] }, shinL: { segs: [[J.knL, J.anL], [J.anL, J.ftL]] },
      thighR: { segs: [[J.hipR, J.knR]] }, shinR: { segs: [[J.knR, J.anR], [J.anR, J.ftR]] },
    };
    const names = Object.keys(bones), lab = new Int8Array(W * H).fill(-1), TORSO = names.indexOf('torso');
    // 肩膀到髖部圍起來的四邊形一定算身體（不然腋下的衣服會被分給手臂，舉手時跟著飛走）
    const quad = [J.shL, J.shR, J.hipR, J.hipL];
    const inQuad = (px, py) => { let s = 0; for (let i = 0; i < 4; i++) { const a = quad[i], b = quad[(i + 1) % 4], c = (b.x - a.x) * (py - a.y) - (b.y - a.y) * (px - a.x); if (c !== 0) { if (s && Math.sign(c) !== s) return false; s = Math.sign(c); } } return true; };
    for (let py = 0; py < H; py++) for (let px = 0; px < W; px++) {
      const p = py * W + px; if (d[p * 4 + 3] < 8) continue;
      if (inQuad(px, py)) { lab[p] = TORSO; continue; }
      let best = -1, bs = 1e9;
      names.forEach((n, i) => {
        if (n === 'head' && py > J.neck.y + sw * 0.08) return;   // 頭只在脖子以上
        if (n === 'torso' && py < J.neck.y - sw * 0.15) return;
        let s = 1e9; for (const [a, b] of bones[n].segs) s = Math.min(s, segDist(px, py, a, b));
        s -= bones[n].bias || 0;
        if (s < bs) { bs = s; best = i; }
      });
      lab[p] = best;
    }

    // 關節處：上一層的部位多留一塊下一層的圓（例如身體留著肩膀），轉動時才不會出現缺口
    const caps = [
      ['torso', 'upperL', J.shL, 0.17], ['torso', 'upperR', J.shR, 0.17], ['torso', 'head', J.neck, 0.1],
      ['torso', 'thighL', J.hipL, 0.2], ['torso', 'thighR', J.hipR, 0.2],
      ['upperL', 'foreL', J.elL, 0.11], ['upperR', 'foreR', J.elR, 0.11], ['thighL', 'shinL', J.knL, 0.13], ['thighR', 'shinR', J.knR, 0.13],
    ];
    const bw = Math.max(3, Math.round(H * 0.017));   // 白色紙邊的寬度
    const parts = {};
    for (const n of names) {
      const id = names.indexOf(n), mine = caps.filter(c => c[0] === n).map(c => ({ child: names.indexOf(c[1]), p: c[2], r: c[3] * sw }));
      let x0 = W, y0 = H, x1 = -1, y1 = -1;
      const take = new Uint8Array(W * H);
      for (let py = 0; py < H; py++) for (let px = 0; px < W; px++) {
        const p = py * W + px, l = lab[p]; if (l < 0) continue;
        if (l === id || mine.some(m => m.child === l && Math.hypot(px - m.p.x, py - m.p.y) < m.r)) {
          take[p] = 1; if (px < x0) x0 = px; if (px > x1) x1 = px; if (py < y0) y0 = py; if (py > y1) y1 = py;
        }
      }
      if (x1 < 0) { parts[n] = null; continue; }
      x0 -= bw + 1; y0 -= bw + 1; x1 += bw + 1; y1 += bw + 1;
      const pw = x1 - x0 + 1, ph = y1 - y0 + 1, pc = canvasOf(pw, ph), pctx = pc.getContext('2d'), pd = pctx.createImageData(pw, ph);
      for (let py = Math.max(0, y0); py <= Math.min(H - 1, y1); py++) for (let px = Math.max(0, x0); px <= Math.min(W - 1, x1); px++) {
        const p = py * W + px; if (!take[p]) continue;
        const q = ((py - y0) * pw + (px - x0)) * 4; pd.data[q] = d[p * 4]; pd.data[q + 1] = d[p * 4 + 1]; pd.data[q + 2] = d[p * 4 + 2]; pd.data[q + 3] = d[p * 4 + 3];
      }
      pctx.putImageData(pd, 0, 0);
      // 紙邊：把部位往四周擴大 bw 像素、塗成紙的顏色
      const border = canvasOf(pw, ph), bctx = border.getContext('2d');
      for (let i = 0; i < 16; i++) { const a = i / 16 * Math.PI * 2; bctx.drawImage(pc, Math.cos(a) * bw, Math.sin(a) * bw); }
      bctx.drawImage(pc, 0, 0);
      bctx.globalCompositeOperation = 'source-in'; bctx.fillStyle = '#fffdf5'; bctx.fillRect(0, 0, pw, ph);
      parts[n] = { img: pc, border, x: x0, y: y0 };
    }
    const foot = Math.max(J.ftL.y, J.ftR.y, J.anL.y, J.anR.y);
    return { parts, J, W, H, foot: { x: J.pelvis.x, y: Math.min(H, foot + bw) }, bw };
  }

  // 畫紙片人：(x, y) = 腳底中間的畫面座標，height = 人物在畫面上的高度
  function draw(ctx, pup, x, y, height, pose = {}, opt = {}) {
    if (!pup) return;
    const P = pup.parts, J = pup.J, k = height / pup.H;
    const g = n => pose[n] || 0;
    const sx = pose.sx == null ? 1 : pose.sx, sy = pose.sy == null ? 1 : pose.sy;
    const pivot = (p, a, fn) => { ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(a); ctx.translate(-p.x, -p.y); fn(); ctx.restore(); };
    const scene = layer => {
      const put = n => { const q = P[n]; if (!q) return; ctx.drawImage(layer === 0 ? q.border : q.img, q.x, q.y); if (layer === 1 && opt.decor) opt.decor(n, ctx, pup); };
      ctx.save();
      ctx.translate(x, y + g('dy') * height);
      ctx.scale(k * sx, k * sy);
      ctx.translate(-pup.foot.x, -pup.foot.y);
      pivot(J.pelvis, g('rot'), () => {
        pivot(J.hipL, g('lL'), () => { put('thighL'); pivot(J.knL, g('lLf'), () => put('shinL')); });
        pivot(J.hipR, -g('lR'), () => { put('thighR'); pivot(J.knR, -g('lRf'), () => put('shinR')); });
        pivot(J.pelvis, g('lean'), () => {
          put('torso');
          pivot(J.neck, g('head'), () => {
            // 頭被打扁：hsx / hsy 以脖子為中心縮放
            const hx = pose.hsx == null ? 1 : pose.hsx, hy = pose.hsy == null ? 1 : pose.hsy;
            ctx.save(); ctx.translate(J.neck.x, J.neck.y); ctx.scale(hx, hy); ctx.translate(-J.neck.x, -J.neck.y); put('head'); ctx.restore();
          });
          pivot(J.shL, g('aL'), () => { put('upperL'); pivot(J.elL, g('aLf'), () => put('foreL')); });
          pivot(J.shR, -g('aR'), () => { put('upperR'); pivot(J.elR, -g('aRf'), () => put('foreR')); });
        });
      });
      ctx.restore();
    };
    // 第一層：整個人的白色紙邊 + 影子（接縫不會露白）；第二層：照片本身
    ctx.save();
    if (opt.shadow !== false) { ctx.shadowColor = 'rgba(40,28,10,0.32)'; ctx.shadowBlur = Math.max(2, height * 0.035); ctx.shadowOffsetY = height * 0.02; ctx.shadowOffsetX = height * 0.01; }
    if (opt.alpha != null) ctx.globalAlpha = opt.alpha;
    scene(0);
    ctx.restore();
    ctx.save(); if (opt.alpha != null) ctx.globalAlpha = opt.alpha; scene(1);
    ctx.restore();
  }

  // ---- 預設角色（還沒拍照的時候用）：畫一個簡單的紙娃娃，再用同一套切法 ----
  function makeDefault() {
    const W = 260, H = 440, c = canvasOf(W, H), x = c.getContext('2d'), cx = W / 2;
    const J = {
      top: { x: cx, y: 8 }, neck: { x: cx, y: 128 }, pelvis: { x: cx, y: 262 },
      shL: { x: cx - 42, y: 146 }, shR: { x: cx + 42, y: 146 }, elL: { x: cx - 62, y: 206 }, elR: { x: cx + 62, y: 206 },
      wrL: { x: cx - 76, y: 262 }, wrR: { x: cx + 76, y: 262 }, hnL: { x: cx - 81, y: 284 }, hnR: { x: cx + 81, y: 284 },
      hipL: { x: cx - 22, y: 262 }, hipR: { x: cx + 22, y: 262 }, knL: { x: cx - 26, y: 340 }, knR: { x: cx + 26, y: 340 },
      anL: { x: cx - 28, y: 410 }, anR: { x: cx + 28, y: 410 }, ftL: { x: cx - 33, y: 428 }, ftR: { x: cx + 33, y: 428 },
    };
    const limb = (a, b, w, col) => { x.strokeStyle = col; x.lineWidth = w; x.lineCap = 'round'; x.beginPath(); x.moveTo(a.x, a.y); x.lineTo(b.x, b.y); x.stroke(); };
    // 腿、鞋
    for (const s of ['L', 'R']) {
      limb(J['hip' + s], J['kn' + s], 30, '#34508f'); limb(J['kn' + s], J['an' + s], 26, '#34508f');
      x.fillStyle = '#5a3420'; x.beginPath(); x.ellipse(J['ft' + s].x + (s === 'L' ? -4 : 4), J['ft' + s].y - 8, 20, 11, 0, 0, Math.PI * 2); x.fill();
    }
    // 手臂（袖子 + 手）
    for (const s of ['L', 'R']) {
      limb(J['sh' + s], J['el' + s], 24, '#e0573c'); limb(J['el' + s], J['wr' + s], 18, '#f4c9a4');
      x.fillStyle = '#f4c9a4'; x.beginPath(); x.arc(J['hn' + s].x, J['hn' + s].y - 6, 12, 0, Math.PI * 2); x.fill();
    }
    // 身體（上衣）
    x.fillStyle = '#e0573c'; x.beginPath();
    x.moveTo(cx - 50, 138); x.quadraticCurveTo(cx, 126, cx + 50, 138); x.lineTo(cx + 40, 272); x.lineTo(cx - 40, 272); x.closePath(); x.fill();
    x.fillStyle = '#34508f'; x.fillRect(cx - 41, 250, 82, 28);
    x.fillStyle = '#ffd54a'; x.beginPath(); x.moveTo(cx, 160); for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, r = i % 2 ? 9 : 20; x.lineTo(cx + Math.cos(a) * r, 190 + Math.sin(a) * r); } x.fill();
    // 頭
    x.fillStyle = '#f4c9a4'; x.fillRect(cx - 12, 110, 24, 30);
    x.beginPath(); x.ellipse(cx, 70, 52, 58, 0, 0, Math.PI * 2); x.fill();
    x.fillStyle = '#2b1d14'; x.beginPath(); x.ellipse(cx, 40, 56, 36, 0, Math.PI, 0); x.fill();
    x.beginPath(); x.ellipse(cx - 30, 40, 26, 22, 0.4, 0, Math.PI * 2); x.fill(); x.beginPath(); x.ellipse(cx + 26, 36, 30, 20, -0.3, 0, Math.PI * 2); x.fill();
    x.fillStyle = '#2b1d14'; x.beginPath(); x.ellipse(cx - 18, 76, 6, 8, 0, 0, Math.PI * 2); x.ellipse(cx + 18, 76, 6, 8, 0, 0, Math.PI * 2); x.fill();
    x.fillStyle = '#fff'; x.beginPath(); x.arc(cx - 16, 73, 2.2, 0, Math.PI * 2); x.arc(cx + 20, 73, 2.2, 0, Math.PI * 2); x.fill();
    x.fillStyle = 'rgba(240,120,120,0.45)'; x.beginPath(); x.ellipse(cx - 32, 94, 9, 6, 0, 0, Math.PI * 2); x.ellipse(cx + 32, 94, 9, 6, 0, 0, Math.PI * 2); x.fill();
    x.strokeStyle = '#8a3a2a'; x.lineWidth = 3.5; x.lineCap = 'round'; x.beginPath(); x.arc(cx, 92, 12, 0.2 * Math.PI, 0.8 * Math.PI); x.stroke();
    return { canvas: c, J };
  }

  // ---- 常用動作 ----
  const S = Math.sin, C = Math.cos;
  const Poses = {
    idle: t => ({ aL: 0.12 + 0.04 * S(t * 2), aR: 0.12 + 0.04 * S(t * 2 + 1), head: 0.05 * S(t * 1.3), sy: 1 + 0.012 * S(t * 3.2), sx: 1 - 0.006 * S(t * 3.2) }),
    // 正面跑：左右腳輪流往外踢、手前後擺、身體一跳一跳
    run: t => { const p = t * 11; return { dy: -Math.abs(S(p)) * 0.045, rot: 0.06 * S(p), lL: 0.28 * Math.max(0, S(p)), lLf: -0.5 * Math.max(0, S(p)), lR: 0.28 * Math.max(0, -S(p)), lRf: -0.5 * Math.max(0, -S(p)),
      aL: 0.5 + 0.5 * S(p), aLf: 0.9, aR: 0.5 - 0.5 * S(p), aRf: 0.9, head: -0.05 * S(p) }; },
    jump: vy => { const u = Math.max(-1, Math.min(1, vy)); return { aL: 2.3 - u * 0.6, aR: 2.3 - u * 0.6, aLf: 0.4, aRf: 0.4, lL: 0.25, lLf: -0.7 - u * 0.2, lR: 0.25, lRf: -0.7 - u * 0.2, sy: 1 + u * -0.05, sx: 1 + u * 0.03 }; },
    land: k => ({ sy: 1 - 0.18 * k, sx: 1 + 0.12 * k, aL: 0.6 * k, aR: 0.6 * k, lL: 0.15 * k, lR: 0.15 * k }),
    cheer: t => ({ aL: 2.6 + 0.25 * S(t * 12), aR: 2.6 + 0.25 * S(t * 12 + Math.PI), aLf: 0.3 * S(t * 12), aRf: 0.3 * S(t * 12 + 1), dy: -Math.abs(S(t * 6)) * 0.08, lL: 0.15, lR: 0.15 }),
    hurt: t => ({ rot: S(t * 30) * 0.15 * Math.max(0, 1 - t * 2), aL: 1.2, aR: 1.2, aLf: 1, aRf: 1, head: 0.2 }),
    flap: t => { const f = S(t * 18); return { aL: 1.5 + f * 0.9, aR: 1.5 + f * 0.9, aLf: -0.3 * f, aRf: -0.3 * f, lL: 0.12, lR: 0.12, lLf: -0.3, lRf: -0.3 }; },
    // 雙手舉高拿籃子；lean -1～1 = 往左～往右移動時的傾斜
    carry: (t, lean, moving) => { const p = t * 12, m = moving ? 1 : 0; return { aL: 2.7, aR: 2.7, aLf: -0.6, aRf: -0.6, rot: lean * 0.12, dy: -Math.abs(S(p)) * 0.025 * m,
      lL: 0.2 * Math.max(0, S(p)) * m, lLf: -0.4 * Math.max(0, S(p)) * m, lR: 0.2 * Math.max(0, -S(p)) * m, lRf: -0.4 * Math.max(0, -S(p)) * m }; },
    dance: t => { const b = t * 2 * Math.PI * 2, s = S(b); return { dy: -Math.abs(S(b)) * 0.05, rot: 0.1 * s, head: -0.12 * s, aL: 1.3 + 1.1 * s, aLf: 0.8 + 0.6 * C(b), aR: 1.3 - 1.1 * s, aRf: 0.8 - 0.6 * C(b),
      lL: 0.25 * Math.max(0, s), lLf: -0.5 * Math.max(0, s), lR: 0.25 * Math.max(0, -s), lRf: -0.5 * Math.max(0, -s) }; },
  };
  const mix = (a, b, t) => { const o = {}; for (const n of new Set([...Object.keys(a), ...Object.keys(b)])) { const d = /^h?s[xy]$/.test(n) ? 1 : 0; o[n] = (a[n] == null ? d : a[n]) * (1 - t) + (b[n] == null ? d : b[n]) * t; } return o; };

  return { build, draw, jointsFromLandmarks, makeDefault, Poses, mix };
})();
