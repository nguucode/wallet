# Wallet logo: Folded W

**Idea.** A W folded from a single ribbon. One continuous path, every fold shown, nothing hidden: the app's promise that every state is clear.

## Construction
- 256 grid. Four identical panels, each 36 units wide (horizontal), on a 52/90/128/166/204 x-rhythm; outer valleys at y 180, inner peak at y 96, tops at y 76.
- Two tones: front panels (1, 3) light, back panels (2, 4) dark, so the ribbon reads as folded paper.
- One-colour: each panel stops 6 units short of the panel folded over it, so the fold survives as a cut.
- Masters are generated: `python final.py <be-vietnam-pro-latin-700-normal.woff>` (needs `fonttools`). Edit `final.py`, not the SVGs.

## Files
| Use | File |
|---|---|
| Symbol, colour | `wallet-symbol.svg` |
| Symbol, one colour (black / white) | `wallet-symbol-black.svg`, `wallet-symbol-white.svg` |
| Symbol, solid (below 24 px, embroidery) | `wallet-symbol-small.svg` |
| iOS / app icon (squircle, depth) | `wallet-appicon.svg`, `wallet-appicon-1024.png` |
| App icon, flat (favicon, tab) | `wallet-appicon-flat.svg` |
| App icon, full bleed (iOS and maskable apply their own mask) | `wallet-appicon-square.svg` |
| Horizontal lockup (colour, black, white) | `wallet-horizontal*.svg` |
| Stacked lockup (colour, black) | `wallet-stacked*.svg` |
| Wordmark | `wallet-wordmark.svg` |
| Web / PWA icons | `web/` (favicon.ico 16/32/48, icon.svg, apple-touch-icon 180, icon-192/512, maskable-512) |
| Presentation | `board.html`, `slides/` |

## Colour (Violet Sky tokens)
| Role | HEX | RGB |
|---|---|---|
| Front panel, primary | `#5B2BE0` | 91 43 224 |
| Back panel, primary-ink | `#3D1A9E` | 61 26 158 |
| Wordmark, ink | `#1C1840` | 28 24 64 |
| Tile highlight, sky top | `#8A6BFF` | 138 107 255 |
| Back panel on tile | `#D9CCFF` → `#B9A4FF` | |

CMYK and Pantone are not specified (digital-only product). Match on a press proof if it is ever printed.

## Clear space and minimum size
- Clear space: one panel width (36 units at 256, about 19 % of the symbol width) on every side.
- Symbol: 24 px minimum in two tones; below that use `wallet-symbol-small.svg` or the flat app icon.
- Horizontal lockup: 96 px wide minimum.

## Typography
Wordmark is Be Vietnam Pro Bold (SIL OFL, logo use allowed), outlined, tracking −2 %, cap height 72 at 256 symbol height. UI type stays Be Vietnam Pro, so the wordmark matches the product.

## Don't
- Recolour the panels outside the two-tone pair, or swap which panels are light.
- Add gradients, shadows or bevels to the flat mark (the app-icon depth belongs to the tile only).
- Use the two-tone mark below 24 px, or the one-colour mark without its fold cuts.
- Stretch, rotate, outline or place the colour mark on a busy or mid-violet background (use white there).
- Reset the wordmark in another font.

## Open items
- Trademark and reverse-image search not done; do one before any public use beyond the demo.
- Reversed (white) mark is not optically thinned yet.
