"""Generate the flat 2D textures (poster, book spines, monitor screen) with Pillow.

Run with the system python3 (Pillow lives there, not in the bpy venv):
    python3 make_textures.py <out_dir>
"""
import os
import sys
import random

from PIL import Image, ImageDraw, ImageFont, ImageFilter

OUT = sys.argv[1] if len(sys.argv) > 1 else "tex"
os.makedirs(OUT, exist_ok=True)

MONO_BOLD = "/usr/share/fonts/truetype/dejavu/DejaVuSansMono-Bold.ttf"
MONO = "/usr/share/fonts/truetype/dejavu/DejaVuSansMono.ttf"
SANS_BOLD = "/usr/share/fonts/opentype/inter/Inter-Bold.otf"
SANS = "/usr/share/fonts/opentype/inter/Inter-Regular.otf"


def font(path, size):
    return ImageFont.truetype(path, size)


# --------------------------------------------------------------- poster ----
def poster():
    w, h = 800, 1000
    img = Image.new("RGB", (w, h), (24, 20, 17))
    d = ImageDraw.Draw(img)
    # faint paper grain so the baked texture is not perfectly flat
    rnd = random.Random(7)
    px = img.load()
    for y in range(h):
        for x in range(w):
            n = rnd.randint(-3, 3)
            r, g, b = px[x, y]
            px[x, y] = (r + n, g + n, b + n)
    f = font(MONO_BOLD, 118)
    lines = [("Build", (200, 190, 175)), ("Ship", (200, 190, 175)),
             ("Improve", (200, 190, 175)), ("Repeat.", (226, 150, 72))]
    y = 150
    for text, col in lines:
        d.text((130, y), text, font=f, fill=col)
        y += 150
    d.line((300, 830, 500, 830), fill=(200, 140, 80), width=5)
    img.save(os.path.join(OUT, "poster.png"))


# ---------------------------------------------------------------- spines ---
SPINES = [
    ("Vue.js", (24, 26, 30)),
    ("Nuxt.js", (30, 30, 34)),
    ("Next.js", (18, 18, 20)),
    ("TypeScript", (34, 33, 36)),
    ("React", (22, 24, 28)),
    ("Tailwind CSS", (28, 27, 24)),
    ("Clean Code", (36, 30, 26)),
]


def spines():
    # each spine texture is 128 wide x 1024 tall; text runs top-to-bottom
    for i, (title, col) in enumerate(SPINES):
        w, h = 128, 1024
        img = Image.new("RGB", (w, h), col)
        d = ImageDraw.Draw(img)
        # top and bottom bands
        band = tuple(min(255, c + 16) for c in col)
        d.rectangle((0, 70, w, 82), fill=band)
        d.rectangle((0, h - 82, w, h - 70), fill=band)
        f = font(MONO_BOLD, 54)
        txt = Image.new("RGBA", (h, w), (0, 0, 0, 0))
        td = ImageDraw.Draw(txt)
        bbox = td.textbbox((0, 0), title, font=f)
        tw, th = bbox[2] - bbox[0], bbox[3] - bbox[1]
        td.text(((h - tw) // 2 - bbox[0], (w - th) // 2 - bbox[1]),
                title, font=f, fill=(175, 170, 160, 255))
        txt = txt.rotate(-90, expand=True)
        img.paste(txt, (0, 0), txt)
        img.save(os.path.join(OUT, f"spine_{i}.png"))


# ---------------------------------------------------------------- screen ---
def screen():
    w, h = 1920, 1080
    img = Image.new("RGB", (w, h), (11, 15, 32))
    # subtle vertical gradient
    px = img.load()
    for y in range(h):
        t = y / h
        for x in range(w):
            px[x, y] = (int(10 + 6 * t), int(15 + 8 * t), int(34 + 12 * t))
    d = ImageDraw.Draw(img)
    # window dots
    for i, c in enumerate([(255, 95, 87), (254, 188, 46), (40, 200, 64)]):
        cx = 70 + i * 40
        d.ellipse((cx - 11, 56, cx + 11, 78), fill=c)
    bars = [
        (0, 150, (122, 162, 255)), (0, 200, (190, 150, 255)),
        (1, 250, (255, 180, 84)), (2, 300, (90, 100, 125)),
        (0, 350, (143, 211, 168)), (1, 400, (122, 162, 255)),
        (2, 450, (190, 150, 255)), (3, 500, (255, 180, 84)),
        (0, 550, (90, 100, 125)), (1, 600, (143, 211, 168)),
        (2, 650, (122, 162, 255)), (3, 700, (190, 150, 255)),
        (1, 750, (255, 180, 84)), (0, 800, (90, 100, 125)),
        (2, 850, (143, 211, 168)), (3, 900, (122, 162, 255)),
    ]
    lens = [210, 330, 280, 470, 300, 380, 250, 350, 420, 260, 340, 300, 230, 380, 330, 440]
    for (indent, y, col), ln in zip(bars, lens):
        x0 = 70 + indent * 60
        d.rounded_rectangle((x0, y, x0 + ln, y + 20), radius=4, fill=col)
    d.text((1000, 400), "Ali Arshadi", font=font(SANS_BOLD, 112), fill=(240, 238, 232))
    d.text((1008, 540), "Front-end developer", font=font(SANS, 46), fill=(140, 146, 165))
    img.save(os.path.join(OUT, "screen.png"))


poster()
spines()
screen()
print("textures written to", os.path.abspath(OUT))
