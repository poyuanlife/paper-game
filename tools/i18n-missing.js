// 列出遊戲裡還沒有英文翻譯的中文句子：node tools/i18n-missing.js
// （新增遊戲後跑一次，把列出來的句子翻好加進 js/lang/en.js）
const ROOT = process.argv[2] || require('path').join(__dirname, '..');
const fs = require('fs'), path = require('path');
const HAN = /[㐀-鿿]/;
const BS = String.fromCharCode(92);
const found = new Map();
const add = (s, where) => { s = s.trim(); if (!HAN.test(s)) return; if (!found.has(s)) found.set(s, where); };
function lex(src, file) {
  let i = 0; const n = src.length;
  function readStr(q) { let out = ''; i++; while (i < n && src[i] !== q) { if (src[i] === BS) { const c = src[i + 1]; out += c === 'n' ? '\n' : c; i += 2; continue; } out += src[i++]; } i++; return out; }
  function readTpl() {
    let out = '', k = 0; i++;
    while (i < n && src[i] !== '`') {
      if (src[i] === BS) { out += src[i + 1]; i += 2; continue; }
      if (src[i] === '$' && src[i + 1] === '{') {
        i += 2; let d = 1;
        while (i < n && d) { const c = src[i]; if (c === "'" || c === '"') { const s = readStr(c); add(s, file); continue; } if (c === '`') { add(readTpl(), file); continue; } if (c === '{') d++; else if (c === '}') d--; i++; }
        out += '{' + k++ + '}'; continue;
      }
      out += src[i++];
    }
    i++; return out;
  }
  while (i < n) {
    const c = src[i];
    if (c === '/' && src[i + 1] === '/') { while (i < n && src[i] !== '\n') i++; continue; }
    if (c === '/' && src[i + 1] === '*') { i = src.indexOf('*/', i + 2) + 2; continue; }
    if (c === "'" || c === '"') { add(readStr(c), file); continue; }
    if (c === '`') { add(readTpl(), file); continue; }
    if (c === '/') {
      let j = i - 1; while (j >= 0 && /\s/.test(src[j])) j--;
      if (j < 0 || /[(,=:[!&|?{};]/.test(src[j])) { i++; while (i < n && src[i] !== '/' && src[i] !== '\n') { if (src[i] === BS) i++; else if (src[i] === '[') { while (i < n && src[i] !== ']') { if (src[i] === BS) i++; i++; } } i++; } i++; continue; }
    }
    i++;
  }
}
function html(src, file) {
  src = src.replace(/<script[\s\S]*?<\/script>/g, m => { lex(m.replace(/^<script[^>]*>/, '').replace(/<\/script>$/, ''), file); return ''; }).replace(/<style[\s\S]*?<\/style>/g, '').replace(/<!--[\s\S]*?-->/g, '');
  for (const m of src.matchAll(/>([^<]+)</g)) add(m[1].replace(/\s+/g, ' '), file);
  for (const m of src.matchAll(/(?:title|placeholder|aria-label|alt|content)="([^"]+)"/g)) add(m[1], file);
}
const files = ['index.html', 'manifest.webmanifest', ...fs.readdirSync(path.join(ROOT, 'js')).filter(f => f.endsWith('.js')).map(f => 'js/' + f), ...fs.readdirSync(path.join(ROOT, 'js/games')).map(f => 'js/games/' + f)];
for (const f of files) {
  const p = path.join(ROOT, f); if (!fs.existsSync(p)) continue; const s = fs.readFileSync(p, 'utf8');
  if (f.endsWith('.html')) html(s, f); else if (f.endsWith('.webmanifest')) { for (const m of s.matchAll(/"([^"]*[㐀-鿿][^"]*)"/g)) add(m[1], f); } else lex(s, f);
}
const arr = [...found].map(([s, f]) => ({ s, f }));
global.I18N = { add(d) { global.DICT = d; } };
require(path.join(ROOT, 'js/lang/en.js'));
const miss = arr.filter(x => !(x.s in DICT) && !['紙', '片', '人', '🌐 中文'].includes(x.s));
console.log(miss.length ? miss.map(x => x.f + '\t' + x.s).join('\n') : '全部都有英文翻譯 ✔');
