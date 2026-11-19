# 產生 App 內建字型（只留遊戲用到的字，檔案才不會太大）
#   python tools/build-fonts.py          重新產生 fonts/*.woff2
#   python tools/build-fonts.py --check  只檢查：程式裡用到的字是不是都在字型裡（新增文字後要跑）
# 需要：pip install fonttools brotli（只在開發時用，不會放進 App）
# 字型：Noto Sans TC / JP（SIL OFL 1.1，可商用，授權檔 fonts/OFL.txt 要一起附上）
import sys, os, re, glob, urllib.request
from fontTools import subset
from fontTools.ttLib import TTFont
from fontTools.varLib import instancer

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, 'tools', 'font-src')          # 原始字型（不上傳，沒有就自動下載）
OUT = os.path.join(ROOT, 'fonts')
FONTS = {
    'NotoSansTC': 'https://github.com/google/fonts/raw/main/ofl/notosanstc/NotoSansTC%5Bwght%5D.ttf',
    'NotoSansJP': 'https://github.com/google/fonts/raw/main/ofl/notosansjp/NotoSansJP%5Bwght%5D.ttf',
}
OFL = 'https://github.com/google/fonts/raw/main/ofl/notosanstc/OFL.txt'


def used_chars():
    files = [os.path.join(ROOT, 'index.html'), os.path.join(ROOT, 'privacy.html')]
    files += glob.glob(os.path.join(ROOT, 'js', '**', '*.js'), recursive=True)
    files += glob.glob(os.path.join(ROOT, 'css', '*.css'))
    s = set(chr(c) for c in range(0x20, 0x7f))        # 英數字一定要有
    s |= set('，。、！？：；「」『』（）～…—・ー％＋－×÷＝／０１２３４５６７８９')
    for f in files:
        if os.path.exists(f):
            s |= set(open(f, encoding='utf-8').read())
    return {c for c in s if ord(c) >= 0x20 and not (0xFE00 <= ord(c) <= 0xFE0F) and ord(c) != 0x200D}


def fetch(url, path):
    if not os.path.exists(path):
        os.makedirs(os.path.dirname(path), exist_ok=True)
        print('下載', url)
        urllib.request.urlretrieve(url, path)


def build():
    chars = used_chars()
    os.makedirs(OUT, exist_ok=True)
    fetch(OFL, os.path.join(OUT, 'OFL.txt'))
    for name, url in FONTS.items():
        src = os.path.join(SRC, name + '.ttf')
        fetch(url, src)
        f = TTFont(src)
        cmap = f.getBestCmap()
        keep = [ord(c) for c in chars if ord(c) in cmap]
        opt = subset.Options(); opt.layout_features = ['*']; opt.name_IDs = ['*']; opt.notdef_outline = True
        sub = subset.Subsetter(opt); sub.populate(unicodes=keep); sub.subset(f)
        f = instancer.instantiateVariableFont(f, {'wght': (500, 900)})   # 只用到 500～900 的粗細
        out = os.path.join(OUT, name + '.woff2')
        f.flavor = 'woff2'; f.save(out)
        print(f'{name}: {len(keep)} 個字，{os.path.getsize(out) / 1024:.0f} KB')


def check():
    chars = used_chars()
    src_tc = os.path.join(SRC, 'NotoSansTC.ttf')
    have = set(TTFont(os.path.join(OUT, 'NotoSansTC.woff2')).getBestCmap())
    # 只檢查原始字型有的字（emoji 本來就交給系統的 emoji 字型）
    full = set(TTFont(src_tc).getBestCmap()) if os.path.exists(src_tc) else None
    miss = sorted(c for c in chars if ord(c) not in have and (full is None and re.match(r'[　-鿿＀-￯]', c) or full is not None and ord(c) in full))
    if miss:
        print('字型裡缺這些字，請跑 python tools/build-fonts.py：', ''.join(miss)); sys.exit(1)
    print('內建字型包含所有用到的字 ✔')


if __name__ == '__main__':
    check() if '--check' in sys.argv else build()
