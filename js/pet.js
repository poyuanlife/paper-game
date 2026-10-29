'use strict';
// =====================================================
//  四腳的紙片寵物（貓、狗）：側面照切成 頭、身體、尾巴、前腳、後腳。
//  關節（J，kind = 'pet'）：head 頭的中心、neck 脖子、tailB 尾巴根、tailT 尾巴尖、footF 前腳、footB 後腳
//  建好的紙片寵物一律「頭朝右」（照片頭朝左會自動左右翻）。
//  遊戲傳進來的是人的姿勢（舉手、跑步…），在 draw() 裡翻譯成四腳的動作，所以每個遊戲都能直接用。
// =====================================================
const PetPuppet = (() => {
  const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const NAMES = ['head', 'neck', 'tailB', 'tailT', 'footF', 'footB'];

  // ---- 從輪廓猜關節（側面照）----
  function guessJoints(img) {
    const { width: W, height: H } = img, box = Cutout.bbox(img, 128);
    if (!box) throw new Error('找不到寵物');
    let d = img.data;
    const A = (x, y) => d[(y * W + x) * 4 + 3] >= 128;
    const x0 = box.x, x1 = box.x + box.w - 1, y0 = box.y, y1 = box.y + box.h - 1, w = box.w, h = box.h;
    // 每一欄：最上面的點、從上面數下來第一段的長度
    const top = [], run = [];
    const scan = () => { for (let x = x0; x <= x1; x++) { let t = -1, r = 0; for (let y = y0; y <= y1; y++) if (A(x, y)) { if (t < 0) t = y; r++; } else if (t >= 0) break; top[x] = t; run[x] = r; } };
    scan();
    // 頭在哪一邊：頭通常比背高；尾巴就算翹起來也很細。比較兩邊「高過背部」的面積
    const tops = []; for (let x = x0 + Math.round(w * 0.35); x <= x1 - Math.round(w * 0.35); x++) if (top[x] >= 0) tops.push(top[x]);
    const back = tops.length ? tops.sort((p, q) => p - q)[tops.length >> 1] : y0 + h * 0.3;
    const above = (a, b) => { let s = 0; for (let x = a; x <= b; x++) if (top[x] >= 0) for (let y = top[x]; y < back - h * 0.02; y++) if (A(x, y)) s++; return s; };
    const headLeft = above(x0, x0 + Math.round(w * 0.4)) > above(x1 - Math.round(w * 0.4), x1);
    if (headLeft) {   // 先左右翻，用「頭朝右」來找，最後再翻回去
      const f = new Uint8ClampedArray(d.length);
      for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) { const a = (y * W + x) * 4, b = (y * W + (W - 1 - x)) * 4; f[a + 3] = d[b + 3]; }
      d = f;
      const nx0 = W - 1 - x1; box.x = nx0;
    }
    const X0 = box.x, X1 = box.x + w - 1;
    for (let x = X0; x <= X1; x++) { let t = -1, r = 0; for (let y = y0; y <= y1; y++) if (A(x, y)) { if (t < 0) t = y; r++; } else if (t >= 0) break; top[x] = t; run[x] = r; }
    const botOf = x => { for (let y = y1; y >= y0; y--) if (A(x, y)) return y; return y1; };
    // 腳：靠近地面的一排，找出一段一段的腳
    let legs = null;
    for (const f of [0.06, 0.1, 0.14, 0.03]) {
      const y = Math.round(y1 - h * f), rs = []; let s = -1;
      for (let x = X0; x <= X1 + 1; x++) { const a = x <= X1 && A(x, y); if (a && s < 0) s = x; if (!a && s >= 0) { if (x - s >= w * 0.012) rs.push([s, x - 1]); s = -1; } }
      if (rs.length >= 2) { legs = [(rs[0][0] + rs[0][1]) / 2, (rs[rs.length - 1][0] + rs[rs.length - 1][1]) / 2]; break; }
      if (rs.length === 1 && !legs) { const [a, b] = rs[0]; legs = b - a > w * 0.3 ? [a + (b - a) * 0.15, b - (b - a) * 0.15] : [(a + b) / 2 - w * 0.2, (a + b) / 2 + w * 0.2]; }
    }
    if (!legs) legs = [X0 + w * 0.25, X0 + w * 0.7];
    const footB = { x: legs[0], y: botOf(Math.round(legs[0])) }, footF = { x: legs[1], y: botOf(Math.round(legs[1])) };
    // 身體：兩隻腳中間那幾欄的第一段 → 中心高度、厚度
    const mids = [], ths = [];
    for (let x = Math.round(footB.x + (footF.x - footB.x) * 0.2); x <= footF.x - (footF.x - footB.x) * 0.2; x++) if (top[x] >= 0) { mids.push(top[x] + run[x] / 2); ths.push(run[x]); }
    const med = a => a.length ? a.slice().sort((p, q) => p - q)[a.length >> 1] : 0;
    const by = mids.length ? med(mids) : y0 + h * 0.4, bt = Math.max(h * 0.12, Math.min(h * 0.6, ths.length ? med(ths) : h * 0.35));
    // 頭：最前面那一塊（寬度大約全身的 16%）
    const hw = clamp(w * 0.16, bt * 0.4, bt * 1.2), hx = Math.round(X1 - hw * 0.5), ht = top[hx] >= 0 ? top[hx] : y0;
    const head = { x: hx, y: ht + Math.min(run[hx] || hw, hw * 1.1) / 2 };
    const neck = { x: head.x - hw * 0.85, y: head.y + (by - head.y) * 0.6 };
    // 尾巴根：屁股的最上面（從後面往前，身體開始變厚、或背部那一排第一個點）
    let rear = X0; for (let x = X0; x <= X1; x++) if (run[x] >= bt * 0.6) { rear = x; break; }
    const backY = Math.round(by - bt * 0.3); let rowRear = X0; for (let x = X0; x <= X1; x++) if (A(x, backY)) { rowRear = x; break; }
    const tailB = { x: Math.min(footB.x, Math.max(rear, rowRear) + bt * 0.12), y: backY };
    let tailT = { x: X0, y: by }, best = -1;
    for (let y = y0; y <= y1; y += 2) for (let x = X0; x < tailB.x; x += 2) {
      if (!A(x, y) || (Math.abs(x - footB.x) < bt * 0.45 && y > by)) continue;
      const dd = Math.hypot(x - tailB.x, y - tailB.y); if (dd > best) { best = dd; tailT = { x, y }; }
    }
    if (best < bt * 0.25) tailT = { x: tailB.x - bt * 0.3, y: tailB.y };
    const J = { kind: 'pet', head, neck, tailB, tailT, footF, footB };
    if (headLeft) for (const n of NAMES) J[n] = { x: W - 1 - J[n].x, y: J[n].y };
    return J;
  }

  // ---- 切成部位 ----
  function build(src, J0, cutParts) {
    // 頭朝左 → 左右翻（紙片寵物一律頭朝右，遊戲裡都往右跑）
    let c = src, J1 = J0;
    if (J0.head.x < J0.tailB.x) {
      c = document.createElement('canvas'); c.width = src.width; c.height = src.height;
      const x = c.getContext('2d'); x.translate(src.width, 0); x.scale(-1, 1); x.drawImage(src, 0, 0);
      J1 = { kind: 'pet' }; for (const n of NAMES) J1[n] = { x: src.width - J0[n].x, y: J0[n].y };
    }
    const spec = (J, W, H, d) => {
      const L = Math.max(1, dist(J.neck, J.tailB)), u = { x: (J.neck.x - J.tailB.x) / L, y: (J.neck.y - J.tailB.y) / L }, v = { x: -u.y, y: u.x };
      const along = (p, o) => (p.x - o.x) * u.x + (p.y - o.y) * u.y, across = (p, o) => (p.x - o.x) * v.x + (p.y - o.y) * v.y;
      const onAxis = f => ({ x: J.tailB.x + u.x * L * f, y: J.tailB.y + u.y * L * f });
      // 身體厚度：從中線往肚子方向量到沒有像素為止
      const A = (x, y) => { x = Math.round(x); y = Math.round(y); return x >= 0 && y >= 0 && x < W && y < H && d[(y * W + x) * 4 + 3] >= 128; };
      const belly = f => { const o = onAxis(f); let t = 0; while (t < H && A(o.x + v.x * t, o.y + v.y * t)) t++; return t; };
      const bt = clamp((belly(0.35) + belly(0.5) + belly(0.65)) / 3, L * 0.15, L * 0.7);
      // 肩膀、髖部：腳往上對到中線，再往下移到身體中間（轉軸太高的話，腿一擺就把一大塊身體甩出去）
      const down = (p, k) => ({ x: p.x + v.x * bt * k, y: p.y + v.y * bt * k });
      J.sh = down(onAxis(clamp(along(J.footF, J.tailB) / L, 0.5, 0.95)), 0.55);
      J.hip = down(onAxis(clamp(along(J.footB, J.tailB) / L, 0.05, 0.5)), 0.5);
      J.bt = { x: bt, y: 0 };
      const sw = Math.max(L * 0.45, H * 0.12);
      const hd = { x: J.head.x + (J.head.x - J.neck.x) * 0.6, y: J.head.y + (J.head.y - J.neck.y) * 0.6 };
      return {
        sw,
        bones: {
          tail: { segs: [[J.tailB, J.tailT]] },
          legB: { segs: [[J.hip, J.footB]] },
          legF: { segs: [[J.sh, J.footF]] },
          body: { segs: [[J.neck, J.tailB]], bias: sw * 0.35 },
          head: { segs: [[J.neck, J.head], [J.head, hd]], bias: sw * 0.2 },
        },
        allow: (n, px, py) => {
          const p = { x: px, y: py };
          if (n === 'head') return along(p, J.neck) > -sw * 0.12;
          if (n === 'tail') return along(p, J.tailB) < sw * 0.12;
          if (n === 'legF' || n === 'legB') return across(p, J.neck) > bt * 0.4;
          if (n === 'body') return along(p, J.neck) < sw * 0.3;
          return true;
        },
        caps: [['body', 'legF', J.sh, bt * 0.7 / sw], ['body', 'legB', J.hip, bt * 0.75 / sw], ['body', 'head', J.neck, 0.35], ['body', 'tail', J.tailB, 0.22]],
      };
    };
    const r = cutParts(c, J1, spec, 700);
    const J = r.J;
    // spec 裡算的肩膀、髖部要換到縮放後的座標（cutParts 會先縮放 J，再呼叫 spec，所以 J.sh / J.hip 已經是縮放後的）
    let top = r.H; for (const n in r.parts) { const q = r.parts[n]; if (q) top = Math.min(top, q.y + r.bw); }
    return Object.assign(r, { kind: 'pet', foot: { x: (J.footF.x + J.footB.x) / 2, y: Math.min(r.H, Math.max(J.footF.y, J.footB.y) + r.bw) }, top });
  }

  // 寵物在遊戲裡的大小：比人矮、寬一點（高度約人的 72%，寬度最多 1.25 倍）
  const scaleOf = (pup, height) => Math.min(height * 0.72 / (pup.foot.y - pup.top), height * 1.25 / pup.W);
  function size(pup, height) { const k = scaleOf(pup, height); return { w: pup.W * k, h: (pup.foot.y - pup.top) * k, k }; }

  // ---- 畫：把人的姿勢翻譯成四腳的動作 ----
  function draw(ctx, pup, x, y, height, pose = {}, opt = {}) {
    const P = pup.parts, J = pup.J, k = scaleOf(pup, height), g = n => pose[n] || 0;
    const sx = pose.sx == null ? 1 : pose.sx, sy = pose.sy == null ? 1 : pose.sy;
    const t = performance.now() / 1000;
    const arms = (g('aL') + g('aR')) / 2, up = clamp((arms - 1.2) / 1.6, 0, 1);  // 雙手舉高 → 興奮，前腳抬起來
    const swing = g('lL') - g('lR');                                             // 跑步時左右腳交替 → 前後腳交替
    const bend = (g('lLf') + g('lRf')) / 2;                                      // 跳起來時膝蓋彎 → 腳收起來
    const paw = clamp(g('aL') - g('aR'), -2, 2);                                 // 只舉一隻手 → 抬前腳 / 大力搖尾巴
    const legF = clamp(-swing * 1.3 - up * 0.45 + bend * 0.3 - Math.max(0, paw - 1) * 0.35, -0.75, 0.6);
    const legB = clamp(swing * 1.3 + up * 0.2 - bend * 0.3, -0.6, 0.75);
    const rear = up * 0.3 + g('lean') * 0.6;                                     // 抬起上半身（繞著髖部）
    const wag = Math.sin(t * (7 + up * 10 + Math.max(0, -paw) * 6)) * (0.22 + up * 0.3 + Math.max(0, -paw) * 0.2);
    const pivot = (p, a, fn) => { ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(a); ctx.translate(-p.x, -p.y); fn(); ctx.restore(); };
    const center = { x: (J.sh.x + J.hip.x) / 2, y: (J.sh.y + J.hip.y) / 2 };
    const scene = layer => {
      const put = n => { const q = P[n]; if (!q) return; ctx.drawImage(layer === 0 ? q.border : q.img, q.x, q.y); if (layer === 1 && opt.decor) opt.decor(n === 'body' ? 'torso' : n, ctx, pup); };
      ctx.save();
      ctx.translate(x, y + g('dy') * height);
      ctx.scale(k * sx, k * sy);
      ctx.translate(-pup.foot.x, -pup.foot.y);
      pivot(center, g('rot'), () => {
        pivot(J.hip, -rear, () => pivot(J.tailB, -wag, () => put('tail')));
        pivot(J.hip, legB, () => put('legB'));
        pivot(J.hip, -rear, () => {
          pivot(J.sh, legF + rear * 0.6, () => put('legF'));
          put('body');
          pivot(J.neck, g('head') * 0.8 - up * 0.2, () => {
            const hx = pose.hsx == null ? 1 : pose.hsx, hy = pose.hsy == null ? 1 : pose.hsy;
            ctx.save(); ctx.translate(J.neck.x, J.neck.y); ctx.scale(hx, hy); ctx.translate(-J.neck.x, -J.neck.y); put('head'); ctx.restore();
          });
        });
      });
      ctx.restore();
    };
    ctx.save();
    if (opt.shadow !== false) { ctx.shadowColor = 'rgba(40,28,10,0.32)'; ctx.shadowBlur = Math.max(2, height * 0.035); ctx.shadowOffsetY = height * 0.02; ctx.shadowOffsetX = height * 0.01; }
    if (opt.alpha != null) ctx.globalAlpha = opt.alpha;
    scene(0);
    ctx.restore();
    ctx.save(); if (opt.alpha != null) ctx.globalAlpha = opt.alpha; scene(1); ctx.restore();
  }

  // 頭、身體的位置（部位圖片座標），給揍揍紙片人判斷打到哪裡、貼 OK 繃用
  function anchors(pup) {
    const J = pup.J, L = dist(J.neck, J.tailB);
    return { head: J.head, headR: Math.max(dist(J.neck, J.head) * 1.1, L * 0.22), body: { x: (J.sh.x + J.hip.x) / 2, y: (J.sh.y + J.hip.y) / 2 }, bodyRx: L * 0.45, bodyRy: L * 0.2 };
  }

  return { guessJoints, build, draw, size, anchors, scaleOf, NAMES };
})();
