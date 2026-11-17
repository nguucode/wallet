# Builds black symbol masters (256) and Apple-style app-icon previews (1024) for three concepts.
import math
GLYPH = {
 # D: an Apple-style toggle switched on, its knob a coin: the state is always clear
 "d": '<path fill-rule="evenodd" fill="{c}" d="M80 80 H176 A48 48 0 0 1 176 176 H80 A48 48 0 0 1 80 80 Z M176 90 a38 38 0 1 0 0.01 0 Z"/><circle cx="176" cy="128" r="27" fill="{c}"/>',
 # E: a W folded from one ribbon, alternate panels shaded like folded paper
 "e": '<path d="M34 76 H70 L108 180 H72 Z" fill="{c}"/><path d="M72 180 H108 L146 96 H110 Z" fill="{c2}"/><path d="M110 96 H146 L184 180 H148 Z" fill="{c}"/><path d="M148 180 H184 L222 76 H186 Z" fill="{c2}"/>',
 # F: a coin whose face carries the sun star of the Dong Son bronze drum
 "f": '<path fill-rule="evenodd" fill="{c}" d="M40 128 a88 88 0 1 0 176 0 a88 88 0 1 0 -176 0 Z M128.00 66.00 L134.68 98.75 L154.90 72.14 L146.70 104.55 L176.47 89.34 L155.03 114.98 L188.45 114.20 L158.00 128.00 L188.45 141.80 L155.03 141.02 L176.47 166.66 L146.70 151.45 L154.90 183.86 L134.68 157.25 L128.00 190.00 L121.32 157.25 L101.10 183.86 L109.30 151.45 L79.53 166.66 L100.97 141.02 L67.55 141.80 L98.00 128.00 L67.55 114.20 L100.97 114.98 L79.53 89.34 L109.30 104.55 L101.10 72.14 L121.32 98.75 Z"/>',
 # A: two checkmarks forming a W — every state confirmed
 "a": '<path d="M38 124 L80 166 L124 116 L164 166 L220 88" fill="none" stroke="{c}" stroke-width="26" stroke-linecap="round" stroke-linejoin="round"/>',
 # B: one white card lifted out of the violet sky, carrying the "truth line" and a status dot
 "b": '<g transform="rotate(-15 128 128)"><path fill-rule="evenodd" fill="{c}" d="M70 76 H186 A22 22 0 0 1 208 98 V158 A22 22 0 0 1 186 180 H70 A22 22 0 0 1 48 158 V98 A22 22 0 0 1 70 76 Z M80 138 H140 A8 8 0 0 1 140 154 H80 A8 8 0 0 1 80 138 Z M176 146 m-12 0 a12 12 0 1 0 24 0 a12 12 0 1 0 -24 0 Z"/></g>',
 # C: lowercase đ whose crossbar is the app's "truth line"
 "c": '<path fill-rule="evenodd" fill="{c}" d="M68 152 a48 48 0 1 0 96 0 a48 48 0 1 0 -96 0 Z M90 152 a26 26 0 1 0 52 0 a26 26 0 1 0 -52 0 Z"/><path fill="{c}" d="M142 67 a11 11 0 0 1 22 0 V200 H142 Z"/><rect x="116" y="82" width="60" height="17" rx="8.5" fill="{c}"/>',
}
def squircle(s=1024, n=5.0, steps=256):
    r = s/2; pts=[]
    for i in range(steps):
        t = 2*math.pi*i/steps; c, si = math.cos(t), math.sin(t)
        pts.append((r + r*math.copysign(abs(c)**(2/n), c), r + r*math.copysign(abs(si)**(2/n), si)))
    return "M" + " L".join(f"{x:.1f} {y:.1f}" for x, y in pts) + " Z"
SQ = squircle()
if __name__ == "__main__":
  for k, g in GLYPH.items():
      if k in "abc": continue  # round 1 files already built
      open(f"concept-{k}-symbol.svg","w").write(f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256">{g.format(c="#000",c2="#000")}</svg>\n')
      glyph = g.format(c="url(#ink)",c2="url(#ink2)")
      open(f"concept-{k}-appicon.svg","w").write(f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 1024">
  <defs>
   <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#8a6bff"/><stop offset=".55" stop-color="#5b2be0"/><stop offset="1" stop-color="#3d1a9e"/></linearGradient>
   <radialGradient id="glow" cx=".5" cy="0" r=".9"><stop offset="0" stop-color="#fff" stop-opacity=".28"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></radialGradient>
   <linearGradient id="ink" gradientUnits="userSpaceOnUse" x1="0" y1="56" x2="0" y2="204"><stop offset="0" stop-color="#ffffff"/><stop offset="1" stop-color="#e6ddff"/></linearGradient>
   <linearGradient id="ink2" gradientUnits="userSpaceOnUse" x1="0" y1="56" x2="0" y2="204"><stop offset="0" stop-color="#d9ccff"/><stop offset="1" stop-color="#b9a4ff"/></linearGradient>
   <filter id="lift" x="-20%" y="-20%" width="140%" height="150%"><feDropShadow dx="0" dy="6" stdDeviation="7" flood-color="#1c0a5c" flood-opacity=".35"/></filter>
   <clipPath id="tile"><path d="{SQ}"/></clipPath>
  </defs>
  <g clip-path="url(#tile)"><rect width="1024" height="1024" fill="url(#sky)"/><rect width="1024" height="1024" fill="url(#glow)"/></g>
  <g transform="translate(112 112) scale(3.125)" filter="url(#lift)">{glyph}</g>
  </svg>
  ''')
