'use strict';
// =====================================================
//  多國語言：遊戲裡寫的都是中文，選其他語言時在「畫到畫面上 / 放進網頁 / 念出來」之前換掉
//  - 翻譯表放在 js/lang/<語言>.js（只會下載選到的那一種）
//  - 帶數字的句子用 {0} {1} 當作空格，例如「第 {0} / {1} 題」→「Q {0} / {1}」
//  - 新增遊戲後跑 node tools/i18n-missing.js 看哪些句子還沒翻
// =====================================================
const I18N = (() => {
  const KEY = 'paper.lang', HAN = /[㐀-鿿]/;
  const LANGS = { zh: '中文', en: 'English', ja: '日本語', vi: 'Tiếng Việt', id: 'Bahasa Indonesia', ms: 'Bahasa Melayu' };
  const SPEECH = { zh: 'zh-TW', en: 'en-US', ja: 'ja-JP', vi: 'vi-VN', id: 'id-ID', ms: 'ms-MY' };
  const guess = () => { const n = (navigator.language || 'zh').toLowerCase(); return n.startsWith('zh') ? 'zh' : n.startsWith('ja') ? 'ja' : n.startsWith('vi') ? 'vi' : (n.startsWith('id') || n.startsWith('in')) ? 'id' : n.startsWith('ms') ? 'ms' : 'en'; };
  let lang = 'zh';
  try { lang = localStorage.getItem(KEY) || guess(); } catch (e) {}
  try { const q = new URLSearchParams(location.search).get('lang'); if (q && LANGS[q]) { lang = q; localStorage.setItem(KEY, q); } } catch (e) {}   // 網址加 ?lang=ja 可以直接指定語言
  if (!LANGS[lang]) lang = 'zh';
  const dict = {}, done = new Set(); let pats = [], cache = new Map();
  const esc = s => s.replace(/[.*+?^${}()|[\]\\]/g, m => '\\' + m);

  function add(d) {
    Object.assign(dict, d);
    pats = Object.keys(dict).filter(k => /\{\d\}/.test(k)).map(k => {
      const order = [], re = new RegExp('^' + esc(k).replace(/\\\{(\d)\\\}/g, (m, d) => { order.push(+d); return '([\\s\\S]*?)'; }) + '$');
      return { re, order, out: dict[k], lit: k.replace(/\{\d\}/g, '').length };
    }).sort((a, b) => b.lit - a.lit);
    cache.clear(); done.clear();
  }

  const SEP = { '\n': '\n', '　': '  ', '，': ', ', '、': ', ', '：': ': ' };
  function core(s, depth) {
    if (!HAN.test(s)) return s;
    const m = s.match(/^(\s*)([\s\S]*?)(\s*)$/), a = m[1], body = m[2], b = m[3];
    if (dict[body] !== undefined) return a + dict[body] + b;
    if (depth > 5) return s;
    const pre = body.match(/^([^㐀-鿿\w]+\s)([\s\S]+)$/);
    if (pre && (dict[pre[2]] !== undefined || pats.some(p => p.re.test(pre[2])))) return a + pre[1] + core(pre[2], depth + 1) + b;
    for (const p of pats) {
      const mm = body.match(p.re); if (!mm) continue;
      return a + p.out.replace(/\{(\d)\}/g, (x, d) => { const i = p.order.indexOf(+d); return i < 0 ? x : core(mm[i + 1], depth + 1); }) + b;
    }
    for (const sep in SEP) if (body.includes(sep)) return a + body.split(sep).map(x => core(x, depth + 1)).join(lang === 'ja' ? sep : SEP[sep]) + b;
    return a + body.replace(/[㐀-鿿　-〿！-～]+/g, run => dict[run] !== undefined ? dict[run] : run) + b;
  }
  function tr(s) {
    if (lang === 'zh' || typeof s !== 'string' || !HAN.test(s) || done.has(s)) return s;
    let r = cache.get(s); if (r !== undefined) return r;
    r = core(s, 0); if (cache.size > 5000) { cache.clear(); done.clear(); } cache.set(s, r); done.add(r); return r;
  }

  // 網頁上的字（含之後才加進來的）
  function node(n) {
    if (n.nodeType === 3) { const v = n.data; if (HAN.test(v)) { const t = tr(v); if (t !== v) n.data = t; } return; }
    if (n.nodeType !== 1 || n.tagName === 'SCRIPT' || n.tagName === 'STYLE' || n.classList.contains('noTr')) return;
    for (const at of ['title', 'placeholder', 'aria-label']) { const v = n.getAttribute(at); if (v && HAN.test(v)) n.setAttribute(at, tr(v)); }
    for (const c of n.childNodes) node(c);
  }
  function startDom() {
    if (lang === 'zh') return;
    document.documentElement.lang = lang; document.documentElement.classList.add('tr', lang);
    const logo = document.querySelector('.logo'); if (logo && dict['@logo']) logo.innerHTML = dict['@logo'];
    document.title = tr(document.title); node(document.body);
    new MutationObserver(ms => { for (const m of ms) { if (m.type === 'characterData') node(m.target); else m.addedNodes.forEach(node); } })
      .observe(document.body, { childList: true, subtree: true, characterData: true });
  }

  // 畫布上的字（日文改用日文字型，漢字的寫法才會是日本的樣子）
  if (lang !== 'zh' && window.CanvasRenderingContext2D) {
    const P = CanvasRenderingContext2D.prototype;
    for (const f of ['fillText', 'strokeText', 'measureText']) { const o = P[f]; P[f] = function (s, ...a) { return o.call(this, tr(String(s)), ...a); }; }
    if (lang === 'ja') { const d = Object.getOwnPropertyDescriptor(P, 'font'); Object.defineProperty(P, 'font', { get() { return d.get.call(this); }, set(v) { d.set.call(this, String(v).replace(/"Noto Sans TC"/g, '"Noto Sans JP"')); }, configurable: true }); }
  }

  function set(l) { try { localStorage.setItem(KEY, l); } catch (e) {} location.reload(); }
  // 選語言的小選單
  function menu() {
    const old = document.getElementById('langMenu'); if (old) { old.remove(); return; }
    const m = document.createElement('div'); m.id = 'langMenu'; m.className = 'langMenu noTr';
    for (const k in LANGS) { const b = document.createElement('button'); b.textContent = LANGS[k]; if (k === lang) b.className = 'on'; b.onclick = e => { e.stopPropagation(); if (k !== lang) set(k); else m.remove(); }; m.appendChild(b); }
    document.body.appendChild(m);
    setTimeout(() => addEventListener('pointerdown', function off(e) { if (!m.contains(e.target)) { m.remove(); removeEventListener('pointerdown', off, true); } }, true), 0);
  }
  return { get lang() { return lang; }, LANGS, tr, add, startDom, set, menu, speechLang: () => SPEECH[lang] };
})();
const tr = s => I18N.tr(s);
if (I18N.lang === 'ja') document.write('<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@500;700;900&display=swap">');
document.addEventListener('DOMContentLoaded', () => {
  I18N.startDom();
  const b = document.getElementById('bLang'); if (!b) return;
  b.classList.add('noTr'); b.textContent = '🌐 ' + I18N.LANGS[I18N.lang];
  b.onclick = () => I18N.menu();
});
