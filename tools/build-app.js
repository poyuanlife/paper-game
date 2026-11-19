// 把網頁檔案複製到 www/（Capacitor 要包進 Android App 的資料夾），需要時再建置 APK／AAB。
// 用法：node tools/build-app.js          只複製到 www/
//       node tools/build-app.js --apk    複製＋cap sync＋建置除錯版 APK
//       node tools/build-app.js --aab    複製＋cap sync＋建置上架用 AAB（需要簽章設定，見 android/keystore.properties）
// 環境變數 JAVA_HOME、ANDROID_HOME 沒設時，預設用 D:\Android\jdk21、D:\Android\sdk
const fs = require('fs'), path = require('path'), { execSync } = require('child_process');
const ROOT = path.resolve(__dirname, '..'), OUT = path.join(ROOT, 'www');
// 要放進 App 的檔案（其他像 _test、tools、node_modules 都不放）
const INCLUDE = ['index.html', 'privacy.html', 'manifest.webmanifest', 'sw.js', 'css', 'js', 'fonts', 'icons', 'vendor'];
const SKIP = /(^|[\\/])(README\.md|\.DS_Store|Thumbs\.db)$/i;

function copy(src, dst) {
  const st = fs.statSync(src);
  if (st.isDirectory()) { fs.mkdirSync(dst, { recursive: true }); for (const f of fs.readdirSync(src)) copy(path.join(src, f), path.join(dst, f)); }
  else if (!SKIP.test(src)) { fs.copyFileSync(src, dst); count++; bytes += st.size; }
}
let count = 0, bytes = 0;
fs.rmSync(OUT, { recursive: true, force: true }); fs.mkdirSync(OUT);
for (const f of INCLUDE) {
  const p = path.join(ROOT, f);
  if (!fs.existsSync(p)) { console.error('找不到要放進 App 的檔案：' + f); process.exit(1); }
  copy(p, path.join(OUT, f));
}
console.log(`www/：${count} 個檔案，${(bytes / 1048576).toFixed(1)} MB`);

const mode = process.argv.includes('--aab') ? 'aab' : process.argv.includes('--apk') ? 'apk' : '';
if (!mode) process.exit(0);
const env = { ...process.env };
env.JAVA_HOME = env.JAVA_HOME_21 || (fs.existsSync('D:\\Android\\jdk21') ? 'D:\\Android\\jdk21' : env.JAVA_HOME);
env.ANDROID_HOME = env.ANDROID_HOME || 'D:\\Android\\sdk'; env.ANDROID_SDK_ROOT = env.ANDROID_HOME;
const PK = Object.keys(env).find(k => k.toUpperCase() === 'PATH') || 'PATH'; // Windows 是 Path
env[PK] = path.join(env.JAVA_HOME, 'bin') + path.delimiter + env[PK];
const run = (cmd, cwd = ROOT) => { console.log('> ' + cmd); execSync(cmd, { cwd, env, stdio: 'inherit' }); };
run('npx cap sync android');
const gw = '"' + path.join(ROOT, 'android', process.platform === 'win32' ? 'gradlew.bat' : 'gradlew') + '"';
run(`${gw} ${mode === 'apk' ? 'assembleDebug' : 'bundleRelease'} --console=plain`, path.join(ROOT, 'android'));
const out = mode === 'apk' ? 'android/app/build/outputs/apk/debug/app-debug.apk' : 'android/app/build/outputs/bundle/release/app-release.aab';
console.log('完成：' + path.join(ROOT, out));
