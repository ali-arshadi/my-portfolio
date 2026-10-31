"""Flat images (poster print, placeholder screen) drawn with Pillow into blender/tex/.

Fonts are vendored in blender/fonts/ so the output is the same on every machine.
"""
import os
import random

from PIL import Image, ImageDraw, ImageFont

from .materials import TEX_DIR

FONTS = os.path.join(os.path.dirname(TEX_DIR), "fonts")
MONO_BOLD = os.path.join(FONTS, "DejaVuSansMono-Bold.ttf")
SANS_BOLD = os.path.join(FONTS, "NotoSans-Bold.ttf")
SANS = os.path.join(FONTS, "NotoSans-Regular.ttf")

# Print aspect matches the poster's print area (see create_wall_poster.py).
POSTER_SIZE = (720, 1120)
POSTER_LINES = [("Build", "#cdbfaf"), ("Ship", "#cdbfaf"), ("Improve", "#cdbfaf"), ("Repeat.", "#e2964a")]


def _font(path, size):
    return ImageFont.truetype(path, size)


def _rgb(h):
    h = h.lstrip("#")
    return tuple(int(h[i:i + 2], 16) for i in (0, 2, 4))


def poster(path):
    w, h = POSTER_SIZE
    img = Image.new("RGB", (w, h), (24, 20, 17))
    # faint paper grain so the print is not perfectly flat
    rnd = random.Random(7)
    px = img.load()
    for y in range(h):
        for x in range(w):
            n = rnd.randint(-3, 3)
            r, g, b = px[x, y]
            px[x, y] = (r + n, g + n, b + n)
    d = ImageDraw.Draw(img)
    # layout measured from the reference: block starts ~23% down, ~20% in; underline ~87% down
    f = _font(MONO_BOLD, 110)
    y = int(h * 0.21)
    for text, col in POSTER_LINES:
        d.text((int(w * 0.2), y), text, font=f, fill=_rgb(col))
        y += int(h * 0.136)
    uy = int(h * 0.87)
    d.line((int(w * 0.3), uy, int(w * 0.52), uy), fill=_rgb("#c8844e"), width=5)
    img.save(path)


SCREEN_SIZE = (1600, 900)
# (indent, length) per code line, in screen-width fractions; colours cycle through the palette
CODE_LINES = [(0, .11), (.01, .17), (.03, .14), (.04, .24), (0, .15), (.01, .19), (.03, .13), (.04, .18),
              (0, .21), (.01, .13), (.03, .17), (.04, .15), (.01, .12), (0, .19), (.03, .17), (.04, .22)]
CODE_COLORS = ["#7aa2ff", "#be96ff", "#ffb454", "#5a647d", "#8fd3a8"]


def screen(path):
    w, h = SCREEN_SIZE
    img = Image.new("RGB", (w, h))
    px = img.load()
    for y in range(h):
        t = y / h
        for x in range(w):
            s = x / w
            # the reference's screen is lifted by a soft blue glow behind the name
            g = max(0.0, 1 - ((s - 0.7) / 0.4) ** 2 - ((t - 0.45) / 0.55) ** 2) ** 2
            px[x, y] = (int(8 + 6 * t + 6 * g), int(12 + 8 * t + 4 * s + 11 * g), int(30 + 14 * t + 10 * s + 24 * g))
    d = ImageDraw.Draw(img)
    for i, c in enumerate(["#ff5f57", "#febc2e", "#28c840"]):
        cx = int(w * 0.035) + i * 34
        d.ellipse((cx - 9, 46, cx + 9, 64), fill=_rgb(c))
    y = int(h * 0.12)
    for i, (indent, length) in enumerate(CODE_LINES):
        x0 = int(w * (0.04 + indent))
        d.rounded_rectangle((x0, y, x0 + int(w * length * 1.3), y + 16), radius=4, fill=_rgb(CODE_COLORS[i % 5]))
        y += int(h * 0.046)
    # name block starts just right of the screen's middle (measured: 0.556 of the frame width, which the
    # monitor's perspective maps to ~0.57 across the screen itself)
    d.text((int(w * 0.57), int(h * 0.40)), "Ali Arshadi", font=_font(SANS_BOLD, 96), fill=(240, 240, 236))
    d.text((int(w * 0.575), int(h * 0.54)), "Front-end developer", font=_font(SANS, 40), fill=(140, 150, 175))
    img.save(path)


# Lamp shade interior, centre to rim. The dish is half a UV sphere, so v runs from its centre (0) to the
# rim (0.5): a vertical gradient is a radial one. The reference's dish glows cream in the middle and
# orange toward the rim.
SHADE_STOPS = [(0.0, "#fff4d8"), (0.12, "#ffd080"), (0.26, "#f09030"), (0.4, "#a85410"), (0.5, "#783c08"), (1.0, "#783c08")]


def shade(path, height=256):
    img = Image.new("RGB", (4, height))
    px = img.load()
    stops = [(t, _rgb(c)) for t, c in SHADE_STOPS]
    for y in range(height):
        v = 1 - (y + 0.5) / height  # image rows run top-down, UV v bottom-up
        for (t0, c0), (t1, c1) in zip(stops, stops[1:]):
            if t0 <= v <= t1:
                k = (v - t0) / (t1 - t0)
                col = tuple(int(round(a + (b - a) * k)) for a, b in zip(c0, c1))
        for x in range(4):
            px[x, y] = col
    img.save(path)


SPINE_ATLAS = 1024
SPINE_COLUMN = 128  # each book's spine gets one column, 8 across


def spine_column_height(thickness, height):
    """Pixel height of a spine's column, keeping the spine's real aspect ratio."""
    return min(SPINE_ATLAS, round(SPINE_COLUMN * height / thickness))


def spines(path, books):
    """All spines in one image. Column i holds book i, top-aligned; titles read top to bottom."""
    img = Image.new("RGB", (SPINE_ATLAS, SPINE_ATLAS), (20, 20, 22))
    f = _font(MONO_BOLD, 46)
    for i, book in enumerate(books):
        cover = _rgb(book["cover"])
        light = sum(cover) > 380
        ink = (40, 38, 36) if light else (178, 172, 162)
        band = tuple(max(0, min(255, c + (-24 if light else 18))) for c in cover)
        h = spine_column_height(book["thickness"], book["height"])
        col = Image.new("RGB", (SPINE_COLUMN, h), cover)
        d = ImageDraw.Draw(col)
        d.rectangle((0, int(h * 0.06), SPINE_COLUMN, int(h * 0.06) + 8), fill=band)
        d.rectangle((0, int(h * 0.92), SPINE_COLUMN, int(h * 0.92) + 8), fill=band)
        txt = Image.new("RGBA", (h, SPINE_COLUMN), (0, 0, 0, 0))
        td = ImageDraw.Draw(txt)
        box = td.textbbox((0, 0), book["title"], font=f)
        tw, th = box[2] - box[0], box[3] - box[1]
        td.text(((h - tw) // 2 - box[0], (SPINE_COLUMN - th) // 2 - box[1]), book["title"], font=f, fill=ink)
        txt = txt.rotate(-90, expand=True)
        col.paste(txt, (0, 0), txt)
        img.paste(col, (i * SPINE_COLUMN, 0))
    img.save(path)


def build_all(books=()):
    os.makedirs(TEX_DIR, exist_ok=True)
    poster(os.path.join(TEX_DIR, "poster.png"))
    screen(os.path.join(TEX_DIR, "screen.png"))
    shade(os.path.join(TEX_DIR, "shade.png"))
    spines(os.path.join(TEX_DIR, "spines.png"), books)
