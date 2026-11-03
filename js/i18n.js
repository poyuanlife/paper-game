'use strict';
// =====================================================
//  多國語言：遊戲裡寫的都是中文，選英文時在「畫到畫面上 / 放進網頁 / 念出來」之前換成英文
//  - 翻譯表放在 js/lang/en.js（只有選英文才會下載）
//  - 帶數字的句子用 {0} {1} 當作空格，例如「第 {0} / {1} 題」→「Q {0} / {1}」
// =====================================================
const I18N = (() => {
  const KEY = 'paper.lang', HAN = /[㐀-鿿]/;
  let lang = 'zh';
  try { const s = localStorage.getItem(KEY); lang = s || (/^zh/i.test(navigator.language || 'zh') ? 'zh' : 'en'); } catch (e) {}
  if (lang !== 'en') lang = 'zh';
  const dict = {}; let pats = [], cache = new Map();
  const esc = s => s.replace(/[.*+?^${}()|[\]\\]/g, m => '\\' + m);

  function add(d) {
    Object.assign(dict, d);
    pats = Object.keys(dict).filter(k => /\{\d\}/.test(k)).map(k => {
      const order = [], re = new RegExp('^' + esc(k).replace(/\\\{(\d)\\\}/g, (m, d) => { order.push(+d); return '([\\s\\S]*?)'; }) + '$');
      return { re, order, out: dict[k], lit: k.replace(/\{\d\}/g, '').length };
    }).sort((a, b) => b.lit - a.lit);
    cache.clear();
  }

  const SEP = { '\n': '\n', '　': '  ', '，': ', ', '、': ', ', '：': ': ' };
  function core(s, depth) {
    if (!HAN.test(s)) return s;
    const m = s.match(/^(\s*)([\s\S]*?)(\s*)$/), a = m[1], body = m[2], b = m[3];
    if (dict[body] !== undefined) return a + dict[body] + b;
    if (depth > 5) return s;
    const pre = body.match(/^([^㐀-鿿\w]+\s)([\s\S]+)$/);
    if (pre) { const r = core(pre[2], depth + 1); if (!HAN.test(r)) return a + pre[1] + r + b; }
    for (const p of pats) {
      const mm = body.match(p.re); if (!mm) continue;
      return a + p.out.replace(/\{(\d)\}/g, (x, d) => { const i = p.order.indexOf(+d); return i < 0 ? x : core(mm[i + 1], depth + 1); }) + b;
    }
    for (const sep in SEP) if (body.includes(sep)) return a + body.split(sep).map(x => core(x, depth + 1)).join(SEP[sep]) + b;
    return a + body.replace(/[㐀-鿿　-〿！-～]+/g, run => dict[run] !== undefined ? dict[run] : run) + b;
  }
  function tr(s) {
    if (lang === 'zh' || typeof s !== 'string' || !HAN.test(s)) return s;
    let r = cache.get(s); if (r !== undefined) return r;
    r = core(s, 0); if (cache.size > 5000) cache.clear(); cache.set(s, r); return r;
  }

  // 網頁上的字（含之後才加進來的）
  function node(n) {
    if (n.nodeType === 3) { const v = n.data; if (HAN.test(v)) { const t = tr(v); if (t !== v) n.data = t; } return; }
    if (n.nodeType !== 1 || n.tagName === 'SCRIPT' || n.tagName === 'STYLE') return;
    for (const at of ['title', 'placeholder', 'aria-label']) { const v = n.getAttribute(at); if (v && HAN.test(v)) n.setAttribute(at, tr(v)); }
    for (const c of n.childNodes) node(c);
  }
  function startDom() {
    if (lang === 'zh') return;
    document.documentElement.lang = 'en'; document.documentElement.classList.add('en');
    const logo = document.querySelector('.logo'); if (logo) logo.innerHTML = '<span>Paper</span><span>Pals</span><small>Playground</small>';
    document.title = tr(document.title); node(document.body);
    new MutationObserver(ms => { for (const m of ms) { if (m.type === 'characterData') node(m.target); else m.addedNodes.forEach(node); } })
      .observe(document.body, { childList: true, subtree: true, characterData: true });
  }

  // 畫布上的字
  if (lang !== 'zh' && window.CanvasRenderingContext2D) {
    const P = CanvasRenderingContext2D.prototype;
    for (const f of ['fillText', 'strokeText', 'measureText']) { const o = P[f]; P[f] = function (s, ...a) { return o.call(this, tr(String(s)), ...a); }; }
  }

  function set(l) { try { localStorage.setItem(KEY, l); } catch (e) {} location.reload(); }
  return { get lang() { return lang; }, tr, add, startDom, set, speechLang: () => lang === 'en' ? 'en-US' : 'zh-TW' };
})();
const tr = s => I18N.tr(s);
document.addEventListener('DOMContentLoaded', () => {
  I18N.startDom();
  const b = document.getElementById('bLang'); if (!b) return;
  b.textContent = I18N.lang === 'en' ? '🌐 中文' : '🌐 English';
  b.onclick = () => I18N.set(I18N.lang === 'en' ? 'zh' : 'en');
});
