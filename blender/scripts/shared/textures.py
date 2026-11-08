"""Flat images (poster print, the monitor screen's hero) drawn with Pillow into blender/tex/.

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

# The screen shows the portfolio's hero and header: the same layout as the site's first view of the
# monitor (src/components/screen/ScreenHero.tsx, HERO), which replaces this texture with live HTML once
# the camera arrives, so the swap can't be seen. Keep the two in step. Positions are CSS pixels on the
# 1280 x 720 screen, painted here at 1.25x; text is placed the way the browser does it: a line box of
# `line-height`, the font's ascent and descent centred in it, letter-spacing after every character.
BRICOLAGE = os.path.join(FONTS, "BricolageGrotesque-Variable.ttf")  # axes: opsz, wght, wdth
JETBRAINS = os.path.join(FONTS, "JetBrainsMono-Variable.ttf")  # axes: wght; advance 0.6 em
FONT_METRICS = {BRICOLAGE: (0.93, 0.27), JETBRAINS: (1.02, 0.30)}  # ascent, descent in em

SCREEN_HERO = dict(
    width=1280, pad_x=64, columns=12,
    location=dict(top=96, text="Tehran, Iran"),
    name=dict(top=156, size=210, line_height=0.86, tracking=-0.045, lines=("Ali", "Arshadi")),
    rule=dict(top=584),
    line=dict(top=612, size=25, line_height=1.25, tracking=-0.01,
              lines=("Senior Front-end Developer for large", "Vue and Nuxt applications.")),
    scroll=dict(center=652.5, rule=64, gap=16),
    nav=dict(top=16, height=44, pad_y=8, gap=24, link_gap=25.6,
             links=("Profile", "Impact", "Work", "Featured", "Experience", "Stack")),
)
SCREEN_COLORS = dict(ink="#0d0d0b", paper="#eceae3", dim="#a19f96", rule="#2b2b27", grid="#1b1b18",
                     lime="#c8f03c")
LABEL = dict(size=13, line_height=1.5, tracking=0.04)  # the design's mono labels


def _variable(path, size, **axes):
    f = ImageFont.truetype(path, size)
    if path == BRICOLAGE:
        f.set_variation_by_axes([min(axes.get("opsz", 96), 96), axes.get("wght", 400), 100])
    else:
        f.set_variation_by_axes([axes.get("wght", 400)])
    return f


def _mix(a, b, t):
    return tuple(round(x * t + y * (1 - t)) for x, y in zip(_rgb(a), _rgb(b)))


class _Painter:
    """Draws CSS-pixel layout into the texture at its scale."""

    def __init__(self, img, scale):
        self.d = ImageDraw.Draw(img)
        self.s = scale

    def width(self, text, path, size, tracking, **axes):
        f = _variable(path, size * self.s, **axes)
        return sum(f.getlength(c) / self.s + tracking * size for c in text)

    def text(self, x, top, line_height, text, path, size, tracking, fill, **axes):
        s = self.s
        f = _variable(path, size * s, **axes)
        ascent, descent = FONT_METRICS[path]
        baseline = top + (line_height - (ascent + descent) * size) / 2 + ascent * size
        for c in text:
            self.d.text((x * s, baseline * s), c, font=f, fill=_rgb(fill) if isinstance(fill, str) else fill,
                        anchor="ls")
            x += f.getlength(c) / s + tracking * size
        return x

    def rect(self, x0, y0, x1, y1, fill, radius=0):
        box = (round(x0 * self.s), round(y0 * self.s), round(x1 * self.s) - 1, round(y1 * self.s) - 1)
        fill = _rgb(fill) if isinstance(fill, str) else fill
        if radius:
            self.d.rounded_rectangle(box, radius=radius * self.s, fill=fill)
        else:
            self.d.rectangle(box, fill=fill)


def screen(path):
    w, h = SCREEN_SIZE
    hero, c = SCREEN_HERO, SCREEN_COLORS
    img = Image.new("RGB", (w, h), _rgb(c["ink"]))
    p = _Painter(img, w / hero["width"])
    css_h = h / p.s
    pad = hero["pad_x"]
    right = hero["width"] - pad

    # the design's column grid: a 1 px line at the left of each twelfth
    for i in range(hero["columns"]):
        x = i * hero["width"] / hero["columns"]
        p.rect(x, 0, x + 1, css_h, c["grid"])

    def label(x, top, text, fill, weight=400):
        return p.text(x, top, LABEL["size"] * LABEL["line_height"], text.upper(), JETBRAINS, LABEL["size"],
                      LABEL["tracking"], fill, wght=weight)

    def label_width(text):
        return p.width(text.upper(), JETBRAINS, LABEL["size"], LABEL["tracking"])

    # header: clear at the top of the page (a transparent 1 px border round it), 44 px tall items
    nav = hero["nav"]
    top = nav["top"] + 1 + nav["pad_y"]
    mid = top + nav["height"] / 2
    left, end = pad + 1, right - 1
    label_top = mid - LABEL["size"] * LABEL["line_height"] / 2
    p.rect(left, top, left + nav["height"], top + nav["height"], c["lime"], radius=nav["height"] / 2)
    initials = "AA"
    iw = p.width(initials, JETBRAINS, 14, -0.02)
    p.text(left + nav["height"] / 2 - iw / 2, mid - 21 / 2, 21, initials, JETBRAINS, 14, -0.02, c["ink"], wght=500)
    pill = label_width("Contact") + 48
    p.rect(end - pill, top, end, top + nav["height"], c["lime"], radius=nav["height"] / 2)
    label(end - pill + 24, label_top, "Contact", c["ink"], 500)
    links = sum(label_width(t) for t in nav["links"]) + nav["link_gap"] * (len(nav["links"]) - 1)
    inner = (left + nav["height"] + nav["gap"], end - pill - nav["gap"])
    x = (inner[0] + inner[1]) / 2 - links / 2
    for t in nav["links"]:
        label(x, label_top, t, _mix(c["paper"], c["ink"], 0.7))
        x += label_width(t) + nav["link_gap"]

    label(pad, hero["location"]["top"], hero["location"]["text"], c["dim"])

    name = hero["name"]
    line_box = name["size"] * name["line_height"]
    for i, t in enumerate(name["lines"]):
        p.text(pad, name["top"] + i * line_box, line_box, t.upper(), BRICOLAGE, name["size"], name["tracking"],
               c["paper"], wght=800, opsz=name["size"])

    p.rect(pad, hero["rule"]["top"], right, hero["rule"]["top"] + 1, c["rule"])

    line = hero["line"]
    line_box = line["size"] * line["line_height"]
    for i, t in enumerate(line["lines"]):
        p.text(pad, line["top"] + i * line_box, line_box, t, BRICOLAGE, line["size"], line["tracking"], c["paper"],
               wght=400, opsz=line["size"])

    sc = hero["scroll"]
    x = right - (label_width("Scroll") + sc["gap"] + sc["rule"])
    x = label(x, sc["center"] - LABEL["size"] * LABEL["line_height"] / 2, "Scroll", c["paper"])
    p.rect(right - sc["rule"], sc["center"] - 0.5, right, sc["center"] + 0.5, c["paper"])
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

def _filtered(size, seed, sigma, stretch=1.0, angle=0.0):
    """White noise blurred by a Gaussian of `sigma` pixels in the frequency domain, so it tiles exactly
    and has no grid. `stretch` > 1 elongates the kernel along `angle` (radians) for brush-like strokes."""
    rng = np.random.default_rng(seed)
    f = np.fft.fft2(rng.standard_normal((size, size)))
    fy, fx = np.meshgrid(np.fft.fftfreq(size), np.fft.fftfreq(size), indexing="ij")
    c, s_ = math.cos(angle), math.sin(angle)
    along, across = fx * c + fy * s_, -fx * s_ + fy * c
    k = np.exp(-2 * (math.pi * sigma) ** 2 * ((along * stretch) ** 2 + across ** 2))
    out = np.real(np.fft.ifft2(f * k))
    return (out - out.min()) / (out.max() - out.min())


def noise(size, cells, seed, octaves=4):
    """Tileable fractal noise in 0-1: octaves of filtered white noise, `cells` blobs across at the
    coarsest, each octave twice as fine at half the weight. Spectral, so it has none of the
    axis-aligned grid lines that upscaled value noise leaves."""
    out = np.zeros((size, size))
    weight, total = 1.0, 0.0
    for o in range(octaves):
        out += weight * _filtered(size, seed * 31 + o, size / (cells * 2 ** o) / 2.5)
        total += weight
        weight *= 0.5
    out /= total
    return (out - out.min()) / (out.max() - out.min())


def _tinted(base, field, amount):
    """`base` colour modulated by `field` (0-1) by +-`amount`, as an RGB image."""
    c = np.array(_rgb(base), dtype=np.float64)
    a = c[None, None, :] * (1 + amount * (field[..., None] * 2 - 1))
    return Image.fromarray(np.clip(a, 0, 255).astype(np.uint8), "RGB")


def plaster(path, base, size=1024):
    """Limewash: cloudy, overlapping brush passes (broad, soft and fairly strong, as the finish is
    meant to look), a few directional sweeps, and a fine mineral grain."""
    clouds = noise(size, 3, 1, octaves=5)
    # crossing brush passes: elongated blobs at two angles
    sweeps = (_filtered(size, 9, size / 40, stretch=0.25, angle=0.6)
              + _filtered(size, 10, size / 40, stretch=0.25, angle=-0.9)) / 2
    grain = _filtered(size, 2, 0.8)
    field = clouds * 0.6 + sweeps * 0.25 + grain * 0.15
    _tinted(base, field, 0.22).save(path)


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
    plaster(os.path.join(TEX_DIR, "plaster.png"), "#272b32")
    concrete(os.path.join(TEX_DIR, "concrete.png"), "#665e57")
    pothos(os.path.join(TEX_DIR, "pothos.png"))
    snake_leaf(os.path.join(TEX_DIR, "snake.png"))
