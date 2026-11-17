# Design: "Clear Ledger"

Wallet's visual world. PayPal's interface grammar (measured in the vault note `10-projects/wallet/paypal-style-study.md`), none of its brand. Mode: **Operate**. Light only: the scene is a phone in daylight at a shop counter.

## Principle

The balance is the only loud thing. Everything else is quiet type on white, separated by 1px lines and space. Colour means something: violet is the one action/selection colour; green, amber and red are transaction states and nothing else.

## Colour

| Token | Value | Use |
|---|---|---|
| `--ink` | `#0E0B16` | Text, icons, balance |
| `--muted` | `#5D5869` | Secondary text (6.5:1 on white) |
| `--surface` | `#FFFFFF` | Page, cards |
| `--surface-2` | `#F5F4F8` | Second neutral: sidebar, input fills, icon discs, skeletons |
| `--line` | `#DCD9E3` | Card and input borders |
| `--line-soft` | `#EDEBF1` | Row dividers |
| `--primary` | `#5B2BE0` | **Primary** (sếp chốt tím): primary buttons, links, active nav, focus ring, selection. White on it 7.2:1 |
| `--primary-hover` | `#4A1FC4` | Hover/pressed |
| `--primary-soft` | `#EFEAFF` | Selected row, active nav fill, soft badges |
| `--primary-ink` | `#3D1A9E` | Text on `--primary-soft` |
| `--success` / `-soft` | `#0B7A47` / `#E5F4EC` | Thành công, money in |
| `--pending` / `-soft` | `#8A5200` / `#FFF2DB` | Đang xử lý |
| `--danger` / `-soft` | `#B3261E` / `#FCEBEA` | Không thành công, errors, destructive |

One Violet Rule: violet never decorates. If it is violet, it is clickable, selected, or focused.

## Type

One family: **Be Vietnam Pro** (self-hosted via Fontsource; designed for Vietnamese stacked diacritics). Fixed rem scale, ratio ≈ 1.2.

| Step | Size / line / weight | Use |
|---|---|---|
| Balance | 52px / 60px / 800, tracking −0.03em (app 40/48) | The balance and result amounts only |
| Display amount | 32px / 40px / 700 | Amount on confirm/result, amount input |
| H1 | 24px / 32px / 700 | Page title |
| H2 | 18px / 26px / 700 | Section title |
| Body | 15px / 22px / 400 | Default |
| Small | 13px / 18px / 400–500 | Meta, captions, shortcut labels |
| Micro | 12px / 16px / 500 | Badges |

Numbers use `font-variant-numeric: tabular-nums` everywhere money appears. Line-heights never go below 1.15 so diacritics never clip.

## Shape and depth

- Radius: pill (999px) for buttons, chips, segmented controls, avatars, icon discs; 16px for cards and sheets; 12px for inputs.
- Cards: 1px `--line`, no shadow. Only floating layers (sheet, popover, FAB, toast) get a shadow: `0 8px 24px -8px rgb(14 11 22 / 0.18)`.
- Targets: 48px tall buttons and rows; 44px minimum anywhere.
- Icons: lucide, 1.75 stroke, 20–24px, in 48px `--surface-2` discs for shortcuts.

## Layout

- **Web (≥ 1024):** 232px sidebar on `--surface-2`, content column max 720px left-aligned with 48px gutter, flows in a 560px column. Top bar 64px with notifications, phone-preview link, demo controls, avatar.
- **App (< 1024):** per-screen header 56px, content 20px side gutter, tab bar 64px + safe area with a raised violet Scan button in the centre. Flows are full screen with a sticky bottom action bar.
- Sections separated by 32px (app) / 48px (web). Space above a heading > space below.

## Signature

**The truth line.** Every money movement carries a one-line status statement in plain Vietnamese under its amount ("Đang xử lý · dự kiến xong trước 14:35", "Không thành công · Tiền đã hoàn về ví lúc 09:12"). It appears on Home (pending-out line under the balance), in every history row, and as the headline of the result step. State is never only a colour.

## Motion

150–200ms ease-out for state changes; sheets slide 240ms. The one authored moment: the result step's status mark draws in (success tick / pending clock hand / failed cross) once. `prefers-reduced-motion` removes it.

## Browser surfaces

Selection `--primary-soft` with `--primary-ink`; caret violet; focus ring 2px violet with 2px offset; thin scrollbars in `--line`; link underline offset 3px.
