---
name: Violet Sky
description: Wallet's money world. White cards lifted out of a violet sky over calm lavender ground.
colors:
  primary: "#5b2be0"
  primary-hover: "#4a1fc4"
  primary-soft: "#ece6ff"
  primary-ink: "#3d1a9e"
  primary-soft-hover: "#e0d7ff"
  danger-soft-hover: "#fbdcd9"
  sky-from: "#4a1fc4"
  sky-to: "#7655f2"
  ink: "#1c1840"
  muted: "#625d7d"
  surface: "#ffffff"
  surface-2: "#f1eefc"
  ground: "#f6f4fd"
  line: "#dfdaf0"
  line-soft: "#edeaf7"
  success: "#0b7a47"
  success-soft: "#e3f5ea"
  pending: "#8a5200"
  pending-soft: "#fff0da"
  danger: "#b3261e"
  danger-soft: "#fdeceb"
  chart-up: "#1f9d55"
  chart-warn: "#e8891c"
  chart-over: "#d93a2b"
typography:
  balance:
    fontFamily: "Be Vietnam Pro, ui-sans-serif, system-ui, sans-serif"
    fontSize: "48px"
    fontWeight: 700
    lineHeight: "58px"
    letterSpacing: "-0.02em"
    fontFeature: "tnum"
  balance-app:
    fontFamily: "Be Vietnam Pro, ui-sans-serif, system-ui, sans-serif"
    fontSize: "40px"
    fontWeight: 700
    lineHeight: "50px"
    letterSpacing: "-0.02em"
    fontFeature: "tnum"
  amount-display:
    fontFamily: "Be Vietnam Pro, ui-sans-serif, system-ui, sans-serif"
    fontSize: "32px"
    fontWeight: 700
    lineHeight: "40px"
    letterSpacing: "-0.02em"
    fontFeature: "tnum"
  headline:
    fontFamily: "Be Vietnam Pro, ui-sans-serif, system-ui, sans-serif"
    fontSize: "28px"
    fontWeight: 700
    lineHeight: "36px"
    letterSpacing: "-0.025em"
  title:
    fontFamily: "Be Vietnam Pro, ui-sans-serif, system-ui, sans-serif"
    fontSize: "17px"
    fontWeight: 700
    lineHeight: "24px"
  body:
    fontFamily: "Be Vietnam Pro, ui-sans-serif, system-ui, sans-serif"
    fontSize: "15px"
    fontWeight: 400
    lineHeight: "22px"
  small:
    fontFamily: "Be Vietnam Pro, ui-sans-serif, system-ui, sans-serif"
    fontSize: "13px"
    fontWeight: 400
    lineHeight: "18px"
  label:
    fontFamily: "Be Vietnam Pro, ui-sans-serif, system-ui, sans-serif"
    fontSize: "13px"
    fontWeight: 700
    lineHeight: "18px"
    letterSpacing: "0.06em"
  chip:
    fontFamily: "Be Vietnam Pro, ui-sans-serif, system-ui, sans-serif"
    fontSize: "11px"
    fontWeight: 700
    lineHeight: "16px"
    letterSpacing: "0.04em"
rounded:
  row: "12px"
  key: "14px"
  input: "14px"
  callout: "20px"
  card: "24px"
  sheet: "28px"
  pill: "9999px"
spacing:
  xs: "8px"
  sm: "12px"
  md: "16px"
  card: "20px"
  card-lg: "24px"
  section: "32px"
  section-lg: "48px"
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.surface}"
    rounded: "{rounded.pill}"
    padding: "0 24px"
    height: "48px"
  button-primary-hover:
    backgroundColor: "{colors.primary-hover}"
  button-secondary:
    backgroundColor: "{colors.primary-soft}"
    textColor: "{colors.primary-ink}"
    rounded: "{rounded.pill}"
    padding: "0 24px"
    height: "48px"
  button-ghost:
    textColor: "{colors.primary}"
    rounded: "{rounded.pill}"
    padding: "0 24px"
    height: "48px"
  button-ink:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.surface}"
    rounded: "{rounded.pill}"
    padding: "0 24px"
    height: "48px"
  button-sm:
    rounded: "{rounded.pill}"
    padding: "0 16px"
    height: "36px"
  card:
    backgroundColor: "{colors.surface}"
    rounded: "{rounded.card}"
    padding: "20px"
  text-input:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.input}"
    padding: "0 16px"
    height: "48px"
  status-pill-pending:
    backgroundColor: "{colors.pending-soft}"
    textColor: "{colors.pending}"
    typography: "{typography.chip}"
    rounded: "{rounded.pill}"
    padding: "0 10px"
    height: "24px"
  status-pill-success:
    backgroundColor: "{colors.success-soft}"
    textColor: "{colors.success}"
    typography: "{typography.chip}"
    rounded: "{rounded.pill}"
    padding: "0 10px"
    height: "24px"
  status-pill-failed:
    backgroundColor: "{colors.danger-soft}"
    textColor: "{colors.danger}"
    typography: "{typography.chip}"
    rounded: "{rounded.pill}"
    padding: "0 10px"
    height: "24px"
  segment-selected:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.surface}"
    rounded: "{rounded.pill}"
    padding: "0 16px"
    height: "36px"
  segment:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.muted}"
    rounded: "{rounded.pill}"
    padding: "0 16px"
    height: "36px"
  keypad-key:
    backgroundColor: "{colors.primary-soft}"
    textColor: "{colors.ink}"
    rounded: "{rounded.key}"
    height: "56px"
  sheet:
    backgroundColor: "{colors.surface}"
    rounded: "{rounded.sheet}"
    padding: "24px"
---

# Design System: Violet Sky

## Overview

**Creative North Star: "Money on a card, under a violet sky"**

Every screen is built from two layers. Above, a violet gradient band (the sky) carries the header, the page title and white chrome. Below, calm lavender ground. Between them, white cards with soft violet-tinted lift hold the money: the balance, the confirm rows, the result. The card overlaps the band, so the eye lands on it first. The grammar is the Copilot money app's (dashboard, sheet, keypad), rebuilt in Wallet's own purple; it replaced the black-and-white "Clear Ledger" world.

The mood is calm and soft, never loud. Density is moderate: one card per idea, generous section gaps, 64px list rows, 48px controls. Colour is rationed. Violet means you can act, it is selected, or it is the sky; green, amber and red appear only to state where money is.

The layout has two shapes from one system. On the web (1024px and up) a lavender sidebar sits beside a content column whose top carries the sky band. On the app (below 1024px) a transparent header floats over the sky with a centred title, and a white tab bar sits at the bottom with a raised violet Scan disc.

**Key Characteristics:**
- Lifted white cards over a violet sky band that fades into lavender ground.
- One violet: action, selection, focus, the sky, and the balance line.
- Status colour only for transaction states, rings and bars.
- The đồng sign set small and raised beside the numerals.
- Uppercase muted section labels with a quiet "Xem tất cả ›".
- A violet keypad panel with lavender keys for every amount entry.
- Every transaction outcome reads as one plain truth line.

## Colors

One violet, a navy ink, a lavender neutral family, and three status pairs that never decorate.

### Primary
- **Wallet Violet** (primary): primary buttons, links, active segments, focus outline, PIN dots, the 30-day balance line and its end tag, caret colour. White on it passes AA for all text sizes.
- **Deep Violet** (primary-hover): hover and pressed state of primary; also the sky's top stop and the solid app header once content scrolls under it.
- **Lavender Wash** (primary-soft): secondary buttons, hover on discs and quick-amount chips, selection highlight, keypad key face.
- **Violet Ink** (primary-ink): text and icons on Lavender Wash and on neutral discs (shortcut icons, monograms, initials).
- **Sky Gradient** (sky-from to sky-to): the band at the top of every screen, the keypad panel, the raised Scan disc and the logo tile. Fades through a ground-tinted mix to the ground at 86 to 100%.

### Neutral
- **Night Navy** (ink): all primary text, the balance, the limit line and its flag on bar charts, the ink button, toasts.
- **Dusk Grey** (muted): secondary text, section labels, sublines, inactive segments.
- **White** (surface): cards, sheets, inputs, the tab bar, the active sidebar item.
- **Mist** (surface-2): the web sidebar, icon and monogram discs, row hover, skeletons, confirm-row panels.
- **Lavender Ground** (ground): the page under everything.
- **Heather Line** (line): input borders, the amount underline, disabled button fill, the sheet grabber.
- **Faint Line** (line-soft): row dividers inside cards, ring tracks.

### Status
- **Success** (success / success-soft), **Pending** (pending / pending-soft), **Danger** (danger / danger-soft): text-on-tint pairs for status pills, result marks, callouts, the pending-balance chip, errors.
- **Chart Green / Amber / Red** (chart-up / chart-warn / chart-over): brighter fills used only in limit rings and monthly bars, where a stroke or bar carries the state rather than text.

### Named Rules
**The One Violet Rule.** Violet is action, selection, focus, the sky, or the balance line. It never fills a status, a chart of limits, or a decoration.

**The Status Is Truth Rule.** Green, amber and red appear only to state where money or a limit is: transaction states, rings, bars, errors. Never as brand colour, never as category colour.

## Typography

**Display Font:** Be Vietnam Pro (with ui-sans-serif, system-ui)
**Body Font:** Be Vietnam Pro, weights 400 to 800 bundled locally

**Character:** One humanist sans drawn for Vietnamese, so stacked diacritics never clip. Weight and size carry hierarchy; there is no second family.

### Hierarchy
- **Balance** (700, 48px/58px web, 40px/50px app, -0.02em, tabular): the available balance on the hero card only. Steps down to Amount when the formatted figure exceeds 11 characters on the app.
- **Amount** (700, 32px/40px, -0.02em, tabular): the amount input and the result amount.
- **Headline** (700, 28px/36px, tight): page titles in white on the sky (web); on the app the centred header title (17px, 22px for "Wallet") replaces it.
- **Title** (700, 17px to 18px): card titles and sheet titles.
- **Body** (400 to 500, 15px/22px): everything else; list titles at 500, amounts in rows at 600 tabular.
- **Small** (13px/18px): sublines, hints, field labels (500), errors.
- **Label** (700, 13px/18px, 0.06em, uppercase, muted): section labels and the amount-field label.
- **Chip** (700, 11px/16px, 0.04em, uppercase): status pills, badges, the sample-data badge.

### Named Rules
**The Tabular Money Rule.** Every money figure uses tabular numerals; columns of amounts never jitter.

**The Raised Dong Rule.** The đồng sign sits beside the figure at 55% size, raised 0.42em, weight 600, aria-hidden with "đồng" read to screen readers. In the amount input it is a smaller muted sign top-aligned to the digits.

## Layout

App (below 1024px): a single column, max 560px, 20px side gutter, a sky band 276px tall (240px in flows) behind a 56px transparent header that turns solid Deep Violet on scroll. Tab-root screens end above a 64px tab bar; flow screens hide the tab bar and pin their footer actions to a white sheet-topped bar.

Web (1024px and up): a 240px Mist sidebar with pill nav items, then a content column (max 768px, 48px side padding) under a 300px sky band and a 64px header carrying notifications and the account menu. Flows sit in a 560px column inside it.

Rhythm: sections are 32px apart (48px on web), section label 12px above its card. Cards pad 20px (24px in flows, 32px horizontal on web). List rows are at least 64px tall; tap targets at least 44px.

**The Card Over Sky Rule.** The first card on a screen overlaps the sky band; the band never holds content of its own beyond titles, short white descriptions and header chrome.

## Elevation & Depth

Lifted, soft and violet-tinted. Cards and inactive segments share one shadow; floating things (sheets, menus, toasts, the Scan disc) take a deeper one. The tab bar and flow footers cast upward.

### Shadow Vocabulary
- **Card** (`0 1px 2px rgb(28 24 64 / 0.04), 0 14px 36px -14px rgb(74 31 196 / 0.22)`): every card, neutral callout, inactive segment and active sidebar item.
- **Float** (`0 12px 32px -10px rgb(28 24 64 / 0.28)`): sheets, dialogs, dropdowns, toasts, the raised Scan disc.
- **Bar** (`0 -8px 24px -12px rgb(28 24 64 / 0.18)`): the tab bar and sticky flow footers.
- **Keycap** (`0 1px 0 rgb(28 24 64 / 0.18)`): keypad keys only; the key edge of a phone keyboard.

### Named Rules
**The Tinted Lift Rule.** Shadows are tinted navy or violet, never neutral black, and never a hard offset outside the keycap edge.

## Shapes

Soft and round. Cards 24px; sheets and the keypad panel 28px; callouts and confirm-row panels 20px; inputs and keypad keys 14px; hoverable rows 12px. Every button, chip, segment, badge, disc and nav item is a full pill or circle. Borders are rare: inputs carry a 1px Heather Line; cards carry none.

## Components

### Buttons
- **Shape:** full pill; 48px tall with 24px padding, or 36px with 16px.
- **Primary:** Wallet Violet with white text, 600 weight; hover Deep Violet; disabled Heather Line fill with muted text.
- **Secondary:** Lavender Wash with Violet Ink text. **Ghost:** violet text, Lavender Wash on hover.
- **Ink:** Night Navy with white; the confirm button for destructive actions, so red stays a status.
- **Danger:** danger-soft fill with danger text, for in-place destructive actions.
- **Loading:** a 16px spinner in currentColor, aria-busy.

### Chips and Pills
- **Status pill:** 24px pill, chip type, uppercase, tinted fill with its own text colour. Pending amber, success green, failed red, refunded Mist with Violet Ink.
- **Quick amounts:** 36px Mist pills with Violet Ink tabular figures, Lavender Wash on hover.
- **Segmented tabs:** 36px pills; selected is Wallet Violet with white, others white with card shadow and muted text.

### Cards / Containers
- **Corner Style:** 24px.
- **Background:** White.
- **Shadow Strategy:** Card.
- **Internal Padding:** 20px; rows inside are separated by Faint Line dividers.
- **Callout:** 20px corners, 20px padding, tinted by tone (pending, danger, primary) or a white neutral card.

### Inputs / Fields
- **Style:** 48px, white, 1px Heather Line, 14px corners; label 13px 500 above, hint or error 13px below.
- **Focus:** 2px Wallet Violet outline.
- **Error:** border and message in danger; the message is an alert.

### Navigation
- **Web sidebar:** Mist panel, 44px pill items; active item is a white pill with card shadow and Violet Ink semibold text. Group headings use the Label style.
- **App header:** transparent over the sky, centred white title, 44px icon buttons either side.
- **Tab bar:** white, five slots, with the middle Scan as a 56px raised disc filled with the sky gradient, float shadow and a 4px white ring. Unread counts are navy pills.

### Signature: Balance Card
Centred available-balance label with a hide toggle, the Balance figure with the raised đồng, a pending-amount chip in Pending tint linking to history, then a 30-day line in Wallet Violet (2.5px, 18% fading area, white end dot, violet end tag) with "30 ngày trước" and "Hôm nay" beneath.

### Signature: Keypad
A 28px sky-gradient panel holding a 3 by 4 grid of 56px lavender keys (14px corners, keycap edge, 24px digits, a 000 key and a delete key), placed below the card that holds the Amount field. The PIN pad uses the same lavender keys on a Lavender Wash panel, with violet PIN dots.

### Signature: Truth Line and Result
A result shows a 64px status disc (tinted check, clock or cross), the outcome heading, the Amount, then confirm rows on a Mist panel whose first row is the truth line: one plain sentence of where the money is, such as "Đang xử lý · dự kiến xong trước 14:30" or "Không thành công · Tiền chưa bị trừ".

### Charts
- **Limit rings:** 9-unit stroke on a Faint Line track, rounded cap, toned Chart Green under 75%, Amber from 75%, Red from 95%.
- **Monthly bars:** Chart Green (current month solid, past at 70%), Chart Red over the limit; a 2px Night Navy limit line with a navy flag label.

## Do's and Don'ts

### Do:
- **Do** put money on a white card overlapping the sky band, with the Card shadow and 24px corners.
- **Do** set every amount in tabular numerals with the raised đồng sign.
- **Do** state every transaction outcome as a truth line, and colour it only with its status pair.
- **Do** label sections with the uppercase Label style and a muted "Xem tất cả ›" action.
- **Do** use pills for every button, chip and segment.
- **Do** take amounts through the violet keypad panel on the app.

### Don't:
- **Don't** use violet for status, categories or decoration; it is action, selection, focus, the sky and the balance line only.
- **Don't** use green, amber or red outside transaction states, rings, bars and errors.
- **Don't** confirm a destructive action with a red button; use the ink button.
- **Don't** add hex values outside the tokens; tints come from the soft tokens.
- **Don't** return to black-and-white ledger surfaces or a super-app icon grid.
