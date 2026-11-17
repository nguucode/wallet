"""Folded W: final masters. Run with a Python that has fontTools (wordmark outlines from Be Vietnam Pro 700, OFL)."""
import math, sys
from build import squircle

PRIMARY, INK, SOFT, SKY_HI = "#5b2be0", "#3d1a9e", "#d9ccff", "#8a6bff"
# Ribbon centreline: top-left, valley, peak, valley, top-right. Bars are 36 wide (horizontal).
P = [(52, 76), (90, 180), (128, 96), (166, 180), (204, 76)]
H, GAP = 18, 6

def bar(a, b):
    (ax, ay), (bx, by) = a, b
    return [(ax - H, ay), (ax + H, ay), (bx + H, by), (bx - H, by)]

def clip(poly, p, q, keep_left=True, off=0.0):
    """Sutherland-Hodgman clip of poly to one side of line p->q, shifted by off units."""
    dx, dy = q[0] - p[0], q[1] - p[1]; n = math.hypot(dx, dy)
    side = lambda pt: ((pt[0] - p[0]) * dy - (pt[1] - p[1]) * dx) / n * (1 if keep_left else -1) - off
    out = []
    for i, cur in enumerate(poly):
        prv = poly[i - 1]; sc, sp = side(cur), side(prv)
        if sc >= 0:
            if sp < 0: out.append(_x(prv, cur, sp, sc))
            out.append(cur)
        elif sp >= 0:
            out.append(_x(prv, cur, sp, sc))
    return out

def _x(a, b, sa, sb):
    t = sa / (sa - sb); return (a[0] + t * (b[0] - a[0]), a[1] + t * (b[1] - a[1]))

def d(poly): return "M" + " L".join(f"{x:.2f} {y:.2f}" for x, y in poly) + " Z"

BARS = [bar(P[i], P[i + 1]) for i in range(4)]
# Mono: each panel stops GAP short of the left edge of the panel folded over it, so the fold survives in one colour.
MONO = []
for i, b in enumerate(BARS):
    if i < 3:
        nb = BARS[i + 1]; e0, e1 = nb[3], nb[0]          # left edge of the panel folded over this one
        cx = sum(p[0] for p in nb) / 4; cy = sum(p[1] for p in nb) / 4
        under_is_left = ((cx - e0[0]) * (e1[1] - e0[1]) - (cy - e0[1]) * (e1[0] - e0[0])) > 0
        MONO.append(clip(b, e0, e1, keep_left=not under_is_left, off=GAP))
    else:
        MONO.append(b)

def svg(w, h, body, vb=None):
    return f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="{vb or f"0 0 {w} {h}"}">{body}</svg>\n'

def two_tone(front, back): return "".join(f'<path d="{d(b)}" fill="{front if i % 2 == 0 else back}"/>' for i, b in enumerate(BARS))
def mono(c): return f'<path fill="{c}" d="{" ".join(d(p) for p in MONO)}"/>'
def solid(c): return "".join(f'<path d="{d(b)}" fill="{c}"/>' for b in BARS)

def tile(glyph_front, glyph_back, size=1024, shadow=True, bleed=False):
    sq = squircle(size)
    s = size / 1024
    defs = f'''<defs><linearGradient id="sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="{SKY_HI}"/><stop offset=".55" stop-color="{PRIMARY}"/><stop offset="1" stop-color="{INK}"/></linearGradient>
<radialGradient id="glow" cx=".5" cy="0" r=".9"><stop offset="0" stop-color="#fff" stop-opacity=".28"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></radialGradient>
<linearGradient id="f" gradientUnits="userSpaceOnUse" x1="0" y1="76" x2="0" y2="180"><stop offset="0" stop-color="#fff"/><stop offset="1" stop-color="#efe9ff"/></linearGradient>
<linearGradient id="b" gradientUnits="userSpaceOnUse" x1="0" y1="76" x2="0" y2="180"><stop offset="0" stop-color="#d9ccff"/><stop offset="1" stop-color="#b9a4ff"/></linearGradient>
{'<filter id="lift" x="-20%" y="-20%" width="140%" height="150%"><feDropShadow dx="0" dy="6" stdDeviation="7" flood-color="#1c0a5c" flood-opacity=".35"/></filter>' if shadow else ''}
<clipPath id="t">{f'<rect width="{size}" height="{size}"/>' if bleed else f'<path d="{sq}"/>'}</clipPath></defs>'''
    g = two_tone(glyph_front, glyph_back)
    return svg(size, size, defs + f'<g clip-path="url(#t)"><rect width="{size}" height="{size}" fill="url(#sky)"/><rect width="{size}" height="{size}" fill="url(#glow)"/></g>'
               f'<g transform="translate({112*s} {104*s}) scale({3.125*s})"{" filter=\"url(#lift)\"" if shadow else ""}>{g}</g>')

def wordmark(fill, cap=72):
    from fontTools.ttLib import TTFont
    from fontTools.pens.svgPathPen import SVGPathPen
    from fontTools.pens.transformPen import TransformPen
    f = TTFont(sys.argv[1]); gs = f.getGlyphSet(); cmap = f.getBestCmap()
    capH = f["OS/2"].sCapHeight; k = cap / capH; track = -0.02 * f["head"].unitsPerEm
    x, paths = 0.0, []
    for ch in "Wallet":
        gn = cmap[ord(ch)]; pen = SVGPathPen(gs)
        gs[gn].draw(TransformPen(pen, (k, 0, 0, -k, x * k, 0)))
        paths.append(pen.getCommands()); x += gs[gn].width + track
    return " ".join(paths), (x - track) * k  # path in baseline coords (y up -> flipped), width

def write(name, body): open(f"final/{name}", "w").write(body)

# --- symbol masters (crop 256 grid) ---
write("wallet-symbol.svg", svg(256, 256, two_tone(PRIMARY, INK)))
write("wallet-symbol-black.svg", svg(256, 256, mono("#000")))
write("wallet-symbol-white.svg", svg(256, 256, mono("#fff")))
write("wallet-symbol-small.svg", svg(256, 256, solid("#000")))
write("wallet-appicon.svg", tile("url(#f)", "url(#b)"))
write("wallet-appicon-flat.svg", tile("#fff", SOFT, shadow=False))
write("wallet-appicon-square.svg", tile("url(#f)", "url(#b)", bleed=True))  # full bleed: iOS / maskable apply their own mask

# --- lockups: symbol cropped to its ink (x 34-222, y 76-180) + wordmark ---
if len(sys.argv) > 1:
    wm, ww = wordmark("x")
    sym_x0, sym_w, sym_top, sym_h = 34, 188, 76, 104
    cap = 72; gap = 40
    # horizontal: height 256, symbol scaled so its ink is 104 tall; wordmark caps 72 tall, both centred on y=128
    def horiz(front, back, word):
        sx = -sym_x0; base = 128 + cap / 2
        body = f'<g transform="translate({sx} 0)">{two_tone(front, back) if back else mono(front)}</g>'
        body += f'<path transform="translate({sym_w + gap} {base})" fill="{word}" d="{wm}"/>'
        return svg(0, 0, body, vb=f"-24 {sym_top - 24} {sym_w + gap + ww + 48:.0f} {sym_h + 48}")
    write("wallet-horizontal.svg", horiz(PRIMARY, INK, "#1c1840"))
    write("wallet-horizontal-black.svg", horiz("#000", None, "#000"))
    write("wallet-horizontal-white.svg", horiz("#fff", None, "#fff"))
    # stacked: symbol above, wordmark centred below
    swm, sww = wordmark("x", cap=44); scap = 44
    def stacked(front, back, word):
        wm, ww, cap = swm, sww, scap
        W = max(sym_w, ww); cx = W / 2
        body = f'<g transform="translate({cx - sym_w/2 - sym_x0} {-sym_top})">{two_tone(front, back) if back else mono(front)}</g>'
        body += f'<path transform="translate({cx - ww/2:.2f} {sym_h + 36 + cap})" fill="{word}" d="{wm}"/>'
        return svg(0, 0, body, vb=f"-16 -16 {W + 32:.0f} {sym_h + 36 + cap + 40:.0f}")
    write("wallet-stacked.svg", stacked(PRIMARY, INK, "#1c1840"))
    write("wallet-stacked-black.svg", stacked("#000", None, "#000"))
    write("wallet-wordmark.svg", svg(0, 0, f'<path transform="translate(0 {cap})" fill="#1c1840" d="{wm}"/>', vb=f"-4 -4 {ww + 8:.0f} {cap + 8 + 18}"))
print("ok")
