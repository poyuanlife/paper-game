// 把 icon-steps.js 的輸出存成 icons/*.png：node tools/save-icons.js icons.txt
const fs = require('fs'), path = require('path');
const line = fs.readFileSync(process.argv[2], 'utf8').split('\n').find(l => l.startsWith('[step 0]'));
const obj = JSON.parse(JSON.parse(line.slice(9)));
for (const [name, url] of Object.entries(obj)) {
  fs.writeFileSync(path.join(__dirname, '..', 'icons', name), Buffer.from(url.split(',')[1], 'base64'));
  console.log('寫入', name);
}
