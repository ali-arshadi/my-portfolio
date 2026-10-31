"""Flat images (poster print, placeholder screen) drawn with Pillow into blender/tex/.

Fonts are vendored in blender/fonts/ so the output is the same on every machine.
"""
import math
import os
import random

import numpy as np
from PIL import Image, ImageDraw, ImageFilter, ImageFont

from .materials import TEX_DIR

FONTS = os.path.join(os.path.dirname(TEX_DIR), "fonts")
MONO_BOLD = os.path.join(FONTS, "DejaVuSansMono-Bold.ttf")
SANS_BOLD = os.path.join(FONTS, "NotoSans-Bold.ttf")
SANS = os.path.join(FONTS, "NotoSans-Regular.ttf")

# Print aspect matches the poster's print area (see create_wall_poster.py).
POSTER_SIZE = (720, 1120)
POSTER_LINES = [("Build", "#e6d8c8"), ("Ship", "#e6d8c8"), ("Improve", "#e6d8c8"), ("Repeat.", "#f4a352")]


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
    # a soft vignette: the print is darker toward its edges, as a matte print under one light reads
    yy, xx = np.mgrid[0:h, 0:w]
    vig = 1 - 0.35 * (((xx / w - 0.5) / 0.6) ** 2 + ((yy / h - 0.45) / 0.65) ** 2)
    img = Image.fromarray(np.clip(np.asarray(img, dtype=np.float64) * np.clip(vig, 0.55, 1)[..., None], 0, 255)
                          .astype(np.uint8), "RGB")
    # layout measured from the reference: block starts ~23% down, ~20% in; underline ~87% down. The
    # reference's lettering is a regular-weight monospace; the vendored mono is bold, so each line's
    # glyph mask is eroded to thin the strokes
    f = _font(MONO_BOLD, 110)
    y = int(h * 0.21)
    for text, col in POSTER_LINES:
        mask = Image.new("L", (w, h), 0)
        ImageDraw.Draw(mask).text((int(w * 0.2), y), text, font=f, fill=255)
        mask = mask.filter(ImageFilter.MinFilter(5)).filter(ImageFilter.GaussianBlur(0.6))
        img.paste(Image.new("RGB", (w, h), _rgb(col)), (0, 0), mask)
        y += int(h * 0.136)
    d = ImageDraw.Draw(img)
    uy = int(h * 0.87)
    d.line((int(w * 0.3), uy, int(w * 0.52), uy), fill=_rgb("#c8844e"), width=4)
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
            px[x, y] = (int(6 + 5 * t + 5 * g), int(9 + 6 * t + 3 * s + 10 * g), int(24 + 11 * t + 8 * s + 24 * g))
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


KEYCAP_ATLAS = 1024
KEYCAP_GRID = 10  # cells per side; the last cell is left blank for the caps' sides
KEYCAP_COLOR = "#141217"
LEGEND_COLOR = "#e4e2ea"


def keycap_cell(i):
    """(u0, v0, size) of atlas cell i in UV space (v up), filled row by row from the image's top."""
    s = 1 / KEYCAP_GRID
    return (i % KEYCAP_GRID) * s, 1 - (i // KEYCAP_GRID + 1) * s, s


def keycaps(path, keys):
    """Legend atlas: one cell per key, in `keys` order ([(label, width in key units)]). A wide key's
    legend is drawn at its real aspect and squeezed into the square cell, so the cap's UVs stretch it
    back. Legends are small and centred, as on the reference board."""
    cell = KEYCAP_ATLAS // KEYCAP_GRID
    img = Image.new("RGB", (KEYCAP_ATLAS, KEYCAP_ATLAS), _rgb(KEYCAP_COLOR))
    ink = _rgb(LEGEND_COLOR)
    for i, (label, width) in enumerate(keys):
        if not label:
            continue
        w = round(cell * width)
        face = Image.new("RGB", (w, cell), _rgb(KEYCAP_COLOR))
        d = ImageDraw.Draw(face)
        single = len(label) == 1
        # arrows are not in Noto Sans; DejaVu Sans Mono has them
        font = _font(MONO_BOLD if label in "←↑→↓" else SANS, int(cell * (0.4 if single else 0.22)))
        d.text((w / 2, cell / 2), label, font=font, fill=ink, anchor="mm")
        x, y = (i % KEYCAP_GRID) * cell, (i // KEYCAP_GRID) * cell
        img.paste(face.resize((cell, cell), Image.LANCZOS), (x, y))
    img.save(path)


SPINE_ATLAS = 1024
SPINE_COLUMN = 128  # each book's spine gets one column, 8 across


def spine_column_height(thickness, height):
    """Pixel height of a spine's column, keeping the spine's real aspect ratio."""
    return min(SPINE_ATLAS, round(SPINE_COLUMN * height / thickness))


def spines(path, books):
    """All spines in one image. Column i holds book i, top-aligned; titles read top to bottom."""
    img = Image.new("RGB", (SPINE_ATLAS, SPINE_ATLAS), (20, 20, 22))
    f = _font(MONO_BOLD, 58)
    for i, book in enumerate(books):
        cover = _rgb(book["cover"])
        light = sum(cover) > 380
        ink = (40, 38, 36) if light else (206, 198, 186)
        band = tuple(max(0, min(255, c + (-24 if light else 18))) for c in cover)
        h = spine_column_height(book["thickness"], book["height"])
        # bookcloth: a fine woven grain and a little unevenness, darker toward the hinges, and rubbed
        # lighter at the head and tail where hands pull the book out
        grain = noise(SPINE_COLUMN, 32, 20 + i, octaves=2)
        grain = np.asarray(Image.fromarray(grain.astype(np.float32), "F").resize((SPINE_COLUMN, h)))
        xs = np.linspace(-1, 1, SPINE_COLUMN)[None, :]
        ys = np.linspace(0, 1, h)[:, None]
        shade = (1 + 0.16 * (grain - 0.5)) * (1 - 0.25 * xs ** 6)
        wear = 1 + 0.35 * (np.exp(-(ys / 0.02)) + np.exp(-((1 - ys) / 0.02)))
        col = Image.fromarray(np.clip(np.array(cover, dtype=np.float64)[None, None, :] * (shade * wear)[..., None],
                                      0, 255).astype(np.uint8), "RGB")
        d = ImageDraw.Draw(col)
        d.rectangle((0, int(h * 0.06), SPINE_COLUMN, int(h * 0.06) + 6), fill=band)
        d.rectangle((0, int(h * 0.92), SPINE_COLUMN, int(h * 0.92) + 6), fill=band)
        # a small publisher's mark at the foot
        cx, cy = SPINE_COLUMN // 2, int(h * 0.86)
        mark = tuple(int(c * 0.6 + k * 0.4) for c, k in zip(ink, cover))
        d.ellipse((cx - 6, cy - 6, cx + 6, cy + 6), outline=mark, width=2)
        txt = Image.new("L", (h, SPINE_COLUMN), 0)
        td = ImageDraw.Draw(txt)
        box = td.textbbox((0, 0), book["title"], font=f)
        tw, th = box[2] - box[0], box[3] - box[1]
        td.text(((h - tw) // 2 - box[0], (SPINE_COLUMN - th) // 2 - box[1]), book["title"], font=f, fill=255)
        # a lighter weight than the bold font, like a stamped title (see poster())
        txt = txt.filter(ImageFilter.MinFilter(3)).rotate(-90, expand=True)
        col.paste(Image.new("RGB", col.size, ink), (0, 0), txt.crop((0, 0) + col.size))
        img.paste(col, (i * SPINE_COLUMN, 0))
    img.save(path)


# ------------------------------------------------------------------ surfaces --

def noise(size, cells, seed, octaves=4):
    """Tileable fractal value noise in 0-1: random grids, smoothly upscaled from a 3 x 3 tiling so the
    edges wrap, summed over octaves with halving weight."""
    rng = np.random.default_rng(seed)
    out = np.zeros((size, size))
    weight, total = 1.0, 0.0
    for o in range(octaves):
        n = cells * 2 ** o
        grid = rng.random((n, n))
        big = Image.fromarray(np.tile(grid, (3, 3)).astype(np.float32), "F").resize((size * 3, size * 3),
                                                                                    Image.BICUBIC)
        out += weight * np.asarray(big)[size:2 * size, size:2 * size]
        total += weight
        weight *= 0.5
    out /= total
    return (out - out.min()) / (out.max() - out.min())


def _tinted(base, field, amount):
    """`base` colour modulated by `field` (0-1) by +-`amount`, as an RGB image."""
    c = np.array(_rgb(base), dtype=np.float64)
    a = c[None, None, :] * (1 + amount * (field[..., None] * 2 - 1))
    return Image.fromarray(np.clip(a, 0, 255).astype(np.uint8), "RGB")


def plaster(path, base, size=512):
    """Painted plaster: broad soft unevenness plus a fine trowel grain, both faint."""
    broad = noise(size, 3, 1)
    grain = noise(size, 48, 2, octaves=2)
    _tinted(base, broad * 0.7 + grain * 0.3, 0.12).save(path)


def concrete(path, base, size=512):
    """Cast concrete: mottled, with a scatter of small dark pores."""
    field = noise(size, 6, 3) * 0.75 + noise(size, 40, 4, octaves=2) * 0.25
    img = _tinted(base, field, 0.18)
    rnd = random.Random(5)
    d = ImageDraw.Draw(img)
    for _ in range(260):
        x, y, r = rnd.randrange(size), rnd.randrange(size), rnd.choice((1, 1, 1, 2))
        d.ellipse((x - r, y - r, x + r, y + r), fill=tuple(int(v * 0.55) for v in _rgb(base)))
    img.save(path)


def pothos(path, size=256):
    """A pothos leaf, u across (0 left edge, 1 right edge), v from stem (0) to tip (1): mid green with a
    paler midrib, curved side veins, and the cultivar's yellow streaks fanning out from the midrib."""
    v, u = np.meshgrid(np.linspace(1, 0, size), np.linspace(0, 1, size), indexing="ij")
    x = u * 2 - 1
    green = np.array(_rgb("#3f6b2a"), dtype=np.float64)
    yellow = np.array(_rgb("#c9c26a"), dtype=np.float64)
    streaks = noise(size, 5, 6, octaves=3)
    # streaks follow lines that curve out from the midrib toward the tip
    angle = np.arctan2(np.abs(x), (v + 0.15)) * 6
    flow = (np.sin(angle * 3 + streaks * 6) * 0.5 + 0.5) * streaks
    mix = np.clip((flow - 0.45) * 2.2, 0, 0.75)[..., None]
    col = green * (1 - mix) + yellow * mix
    rib = np.exp(-(x / 0.03) ** 2)[..., None]
    veins = (np.abs(np.sin((v - np.abs(x) * 0.6) * 28)) < 0.08)[..., None] * (np.abs(x) < 0.9)[..., None]
    col = col * (1 - 0.35 * rib) + np.array(_rgb("#a8b86a")) * 0.35 * rib
    col = col * (1 - 0.12 * veins) + np.array(_rgb("#8aa65a")) * 0.12 * veins
    Image.fromarray(np.clip(col, 0, 255).astype(np.uint8), "RGB").save(path)


def snake_leaf(path, size=256):
    """A snake-plant leaf, u across, v along: deep green with wavy pale grey-green cross bands and thin
    yellow margins."""
    v, u = np.meshgrid(np.linspace(1, 0, size * 2), np.linspace(0, 1, size), indexing="ij")
    x = np.abs(u * 2 - 1)
    wobble = noise(size, 4, 7, octaves=2)
    wobble = np.asarray(Image.fromarray(wobble.astype(np.float32), "F").resize((size, size * 2), Image.BICUBIC))
    # zigzag cross bands, broken up so some fade out and some merge, as on a real leaf
    zig = np.abs((u * 5) % 2 - 1)
    bands = np.sin((v * 30 + zig * 0.45 + wobble * 3.0) * math.pi) * 0.5 + 0.5
    breakup = np.asarray(Image.fromarray(noise(size, 8, 8, octaves=2).astype(np.float32), "F")
                         .resize((size, size * 2), Image.BICUBIC))
    pale = (np.clip((bands - 0.58) * 3, 0, 1) * np.clip((breakup - 0.3) * 2.5, 0, 1))[..., None]
    dark = np.array(_rgb("#1f3a22"), dtype=np.float64)
    light = np.array(_rgb("#6e8a6a"), dtype=np.float64)
    col = dark * (1 - 0.7 * pale) + light * 0.7 * pale
    margin = np.clip((x - 0.9) / 0.04, 0, 1)[..., None]
    col = col * (1 - margin) + np.array(_rgb("#b8b45a")) * margin
    Image.fromarray(np.clip(col, 0, 255).astype(np.uint8), "RGB").save(path)


def build_all(books=()):
    os.makedirs(TEX_DIR, exist_ok=True)
    poster(os.path.join(TEX_DIR, "poster.png"))
    screen(os.path.join(TEX_DIR, "screen.png"))
    shade(os.path.join(TEX_DIR, "shade.png"))
    spines(os.path.join(TEX_DIR, "spines.png"), books)
    plaster(os.path.join(TEX_DIR, "plaster.png"), "#16171b")
    concrete(os.path.join(TEX_DIR, "concrete.png"), "#665e57")
    pothos(os.path.join(TEX_DIR, "pothos.png"))
    snake_leaf(os.path.join(TEX_DIR, "snake.png"))
