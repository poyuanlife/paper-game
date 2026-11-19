"""從 icons/ 的 App 圖示產生 Android 圖示和啟動畫面（在 android/ 建好後跑一次；換圖示時再跑）。
用法：python tools/make-android-icons.py
需要 Pillow（pip install pillow）。
"""
from pathlib import Path
from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parent.parent
RES = ROOT / 'android/app/src/main/res'
BG = '#9fd8ef'  # 和 manifest.webmanifest 的 background_color 一樣
ICON = Image.open(ROOT / 'icons/icon-512.png').convert('RGBA')
MASK = Image.open(ROOT / 'icons/maskable-512.png').convert('RGBA')
DENS = {'mdpi': 1, 'hdpi': 1.5, 'xhdpi': 2, 'xxhdpi': 3, 'xxxhdpi': 4}


def fit(img, size):
    return img.resize((size, size), Image.LANCZOS)


def circle(img):
    m = Image.new('L', img.size, 0)
    ImageDraw.Draw(m).ellipse((0, 0, img.size[0] - 1, img.size[1] - 1), fill=255)
    out = Image.new('RGBA', img.size, (0, 0, 0, 0))
    out.paste(img, (0, 0), m)
    return out


for d, s in DENS.items():
    folder = RES / f'mipmap-{d}'
    fit(ICON, round(48 * s)).save(folder / 'ic_launcher.png')
    fit(circle(MASK), round(48 * s)).save(folder / 'ic_launcher_round.png')
    # 自適應圖示的前景是 108dp，maskable 圖示本身就留好了安全邊界，直接鋪滿
    fit(MASK, round(108 * s)).save(folder / 'ic_launcher_foreground.png')

# 自適應圖示背景色
(RES / 'values/ic_launcher_background.xml').write_text(
    f'<?xml version="1.0" encoding="utf-8"?>\n<resources>\n    <color name="ic_launcher_background">{BG}</color>\n</resources>\n',
    encoding='utf-8')

# 啟動畫面：背景色中間放圖示
for p in RES.glob('drawable*/splash.png'):
    w, h = Image.open(p).size
    im = Image.new('RGBA', (w, h), BG)
    n = int(min(w, h) * 0.4)
    ic = fit(ICON, n)
    im.alpha_composite(ic, ((w - n) // 2, (h - n) // 2))
    im.convert('RGB').save(p)
print('Android 圖示和啟動畫面已更新')
