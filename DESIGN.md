---
name: Inset Grouped
description: Wallet as a first-party Apple app. Neutral grouped ground, content in inset sections, violet only where you can act.
colors:
  primary: "#5b2be0"
  primary-hover: "#4a1fc4"
  tint: "#5b2be0"
  primary-soft: "#eee9fd"
  primary-soft-hover: "#e3dbfc"
  primary-ink: "#3d1a9e"
  ink: "#000000"
  on-ink: "#ffffff"
  muted: "#6c6c70"
  surface: "#ffffff"
  surface-2: "rgb(118 118 128 / 0.12)"
  ground: "#f2f2f7"
  line: "#c6c6c8"
  line-soft: "#e5e5ea"
  success: "#1a7a35"
  success-soft: "#e4f5e8"
  pending: "#a05a00"
  pending-soft: "#fff1dc"
  danger: "#c00012"
  danger-soft: "#fde8ea"
  danger-soft-hover: "#fbd7db"
  badge: "#c00012"
  chart-up: "#34c759"
  chart-warn: "#ff9500"
  chart-over: "#ff3b30"
typography:
  large-title:
    fontFamily: "-apple-system, BlinkMacSystemFont, Be Vietnam Pro, system-ui, sans-serif"
    fontSize: "34px"
    fontWeight: 700
    lineHeight: "41px"
    letterSpacing: "0.01em"
  balance:
    fontFamily: "-apple-system, BlinkMacSystemFont, Be Vietnam Pro, system-ui, sans-serif"
    fontSize: "48px"
    fontWeight: 700
    lineHeight: "58px"
    letterSpacing: "-0.01em"
    fontFeature: "tnum"
  balance-app:
    fontFamily: "-apple-system, BlinkMacSystemFont, Be Vietnam Pro, system-ui, sans-serif"
    fontSize: "40px"
    fontWeight: 700
    lineHeight: "50px"
    letterSpacing: "-0.01em"
    fontFeature: "tnum"
  amount-display:
    fontFamily: "-apple-system, BlinkMacSystemFont, Be Vietnam Pro, system-ui, sans-serif"
    fontSize: "32px"
    fontWeight: 700
    lineHeight: "40px"
    letterSpacing: "-0.01em"
    fontFeature: "tnum"
  title-3:
    fontFamily: "-apple-system, BlinkMacSystemFont, Be Vietnam Pro, system-ui, sans-serif"
    fontSize: "20px"
    fontWeight: 600
    lineHeight: "25px"
    letterSpacing: "-0.01em"
  body:
    fontFamily: "-apple-system, BlinkMacSystemFont, Be Vietnam Pro, system-ui, sans-serif"
    fontSize: "17px"
    fontWeight: 400
    lineHeight: "22px"
  body-web:
    fontFamily: "-apple-system, BlinkMacSystemFont, Be Vietnam Pro, system-ui, sans-serif"
    fontSize: "15px"
    fontWeight: 400
    lineHeight: "20px"
  title-1:
    fontFamily: "-apple-system, BlinkMacSystemFont, Be Vietnam Pro, system-ui, sans-serif"
    fontSize: "28px"
    fontWeight: 700
    lineHeight: "34px"
  title-2:
    fontFamily: "-apple-system, BlinkMacSystemFont, Be Vietnam Pro, system-ui, sans-serif"
    fontSize: "22px"
    fontWeight: 700
    lineHeight: "28px"
  headline:
    fontFamily: "-apple-system, BlinkMacSystemFont, Be Vietnam Pro, system-ui, sans-serif"
    fontSize: "17px"
    fontWeight: 600
    lineHeight: "22px"
  callout:
    fontFamily: "-apple-system, BlinkMacSystemFont, Be Vietnam Pro, system-ui, sans-serif"
    fontSize: "16px"
    fontWeight: 400
    lineHeight: "21px"
  subheadline:
    fontFamily: "-apple-system, BlinkMacSystemFont, Be Vietnam Pro, system-ui, sans-serif"
    fontSize: "15px"
    fontWeight: 400
    lineHeight: "20px"
  caption-1:
    fontFamily: "-apple-system, BlinkMacSystemFont, Be Vietnam Pro, system-ui, sans-serif"
    fontSize: "12px"
    fontWeight: 400
    lineHeight: "16px"
  caption-2:
    fontFamily: "-apple-system, BlinkMacSystemFont, Be Vietnam Pro, system-ui, sans-serif"
    fontSize: "11px"
    fontWeight: 400
    lineHeight: "13px"
  keypad-digit:
    fontFamily: "-apple-system, BlinkMacSystemFont, Be Vietnam Pro, system-ui, sans-serif"
    fontSize: "28px"
    fontWeight: 400
    lineHeight: "32px"
  footnote:
    fontFamily: "-apple-system, BlinkMacSystemFont, Be Vietnam Pro, system-ui, sans-serif"
    fontSize: "13px"
    fontWeight: 400
    lineHeight: "18px"
  label-caps:
    fontFamily: "-apple-system, BlinkMacSystemFont, Be Vietnam Pro, system-ui, sans-serif"
    fontSize: "13px"
    fontWeight: 400
    lineHeight: "18px"
    letterSpacing: "0"
  tab-label:
    fontFamily: "-apple-system, BlinkMacSystemFont, Be Vietnam Pro, system-ui, sans-serif"
    fontSize: "10px"
    fontWeight: 500
    lineHeight: "12px"
rounded:
  focus-ring: "4px"
  input: "12px"
  nav-item: "10px"
  key: "14px"
  card: "24px"
  sidebar: "24px"
  sheet-app: "34px"
  full: "9999px"
spacing:
  gutter-app: "16px"
  gutter-web: "48px"
  sidebar-inset: "12px"
  card-pad-app: "20px"
  card-pad-web: "24px"
  section-gap-app: "32px"
  section-gap-web: "40px"
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "#ffffff"
    rounded: "{rounded.full}"
    height: "50px"
    padding: "0 24px"
    typography: "{typography.body}"
  button-primary-hover:
    backgroundColor: "{colors.primary-hover}"
  button-secondary:
    backgroundColor: "{colors.surface-2}"
    textColor: "{colors.tint}"
    rounded: "{rounded.full}"
    height: "50px"
  button-secondary-hover:
    backgroundColor: "{colors.primary-soft}"
  button-ghost:
    textColor: "{colors.tint}"
    rounded: "{rounded.full}"
    height: "50px"
  button-danger:
    backgroundColor: "{colors.danger-soft}"
    textColor: "{colors.danger}"
    rounded: "{rounded.full}"
    height: "50px"
  button-ink:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.on-ink}"
    rounded: "{rounded.full}"
    height: "50px"
  section:
    backgroundColor: "{colors.surface}"
    rounded: "{rounded.card}"
    padding: "20px"
  input:
    backgroundColor: "{colors.surface-2}"
    textColor: "{colors.ink}"
    rounded: "{rounded.input}"
    height: "48px"
    padding: "0 16px"
  status-success:
    backgroundColor: "{colors.success-soft}"
    textColor: "{colors.success}"
    rounded: "{rounded.full}"
    height: "24px"
  status-pending:
    backgroundColor: "{colors.pending-soft}"
    textColor: "{colors.pending}"
    rounded: "{rounded.full}"
    height: "24px"
  status-failed:
    backgroundColor: "{colors.danger-soft}"
    textColor: "{colors.danger}"
    rounded: "{rounded.full}"
    height: "24px"
  segment-selected:
    backgroundColor: "{colors.primary}"
    textColor: "#ffffff"
    rounded: "{rounded.full}"
    height: "36px"
  segment:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.full}"
    height: "36px"
  nav-item-active:
    backgroundColor: "{colors.surface-2}"
    textColor: "{colors.tint}"
    rounded: "{rounded.nav-item}"
    height: "40px"
  tab-bar:
    rounded: "{rounded.full}"
    height: "64px"
  keypad-key:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.key}"
    height: "56px"
---

# Design System: Inset Grouped

History: replaces "Violet Sky" (2026-11-17). Direction pinned by the owner 2026-11-19: follow Apple's design system, keep violet #5B2BE0 as the app tint, system font stack, light and dark following `prefers-color-scheme`. Values above are the light appearance; the dark appearance is listed in each colour entry below and lives in the `prefers-color-scheme: dark` block of `src/index.css`.

## Overview

**Creative North Star: "The First-Party App"**

Wallet should read as if Apple shipped it. The reviewer recognises the platform in the first second, stops looking at the styling, and spends their attention on the balance, the states and the rules. Everything sits on a neutral grouped ground; content lives in white (dark: near-black) inset sections with generous 24px corners and no shadow. Colour is rationed: the violet tint marks only what you can act on, and green, orange and red appear only where a money state needs naming.

Depth comes from material, not from shadow. Navigation chrome (the web sidebar, the app tab bar, the nav bar once content scrolls under it) is translucent glass; content is opaque and flat. Type is the system face at Apple's sizes, so large titles, section headers and list rows carry the hierarchy without decoration.

The signature is the money itself: big tabular numerals with the ₫ set small and raised beside them. The world rejects the old violet sky band, lifted shadow cards, uppercase chips, and any brand chrome around the balance.

**Key Characteristics:**
- Neutral grouped background, content in inset grouped sections (radius 24, no shadow).
- One accent: violet tint for buttons, links, selection, focus, and the balance line.
- Status as sentence-case tinted capsules, never uppercase chips.
- Glass only on navigation chrome; content surfaces stay opaque.
- System font at Apple's type ramp: 34 large title, 20 title 3, 17 body (15 on web).
- Light and dark are both first-class and follow the OS.

## Colors

A neutral Apple grouped palette with a single violet voice and three accessible state colours.

### Primary
- **App Tint Violet** (`primary`, light #5b2be0 / dark #6e48f5): the tint as a fill. Primary buttons, the selected segment, the Scan button in the tab bar, the chart's change badge. White text on it (7.3:1 light, 5.4:1 dark).
- **Tint as Ink** (`tint`, light #5b2be0 / dark #b19dff): the tint as text, icon, border and focus ring: links, "Xem tất cả", back chevrons, sidebar icons, secondary-button labels, the 30-day line chart. It splits from `primary` because no single dark value can carry white text on a fill and also read as text on #1c1c1e; the dark tint is 7.4:1 on the section surface.
- **Pressed Violet** (`primary-hover`, light #4a1fc4 / dark #7d5bf7): hover on primary fills.
- **Violet Wash** (`primary-soft`, light #eee9fd / dark violet at 26%): primary-toned badges, discs and callouts; hover for secondary buttons. `primary-soft-hover` steps it once.
- **Deep Violet Text** (`primary-ink`, light #3d1a9e / dark #cbbcff): text on the violet wash and on quick-amount chips.

### Tertiary (states)
- **Settled Green** (`success`, light #1a7a35 / dark #30d158) on `success-soft` (light #e4f5e8 / dark green at 18%): "Thành công", incoming amounts.
- **Pending Amber** (`pending`, light #a05a00 / dark #ffb340) on `pending-soft` (light #fff1dc / dark orange at 18%): "Đang xử lý", the pending balance capsule.
- **Failure Red** (`danger`, light #c00012 / dark #ff6961) on `danger-soft` (light #fde8ea / dark red at 20%): failures, destructive actions, field errors.
- **Badge Red** (`badge`, #c00012 in both modes): the unread count badge only, white text 6:1. It stays one red in dark mode because white on Failure Red's dark value fails contrast.
- **Chart greens, oranges, reds** (`chart-up` #34c759 / #30d158, `chart-warn` #ff9500 / #ff9f0a, `chart-over` #ff3b30 / #ff453a): Apple's system colours, used only as large chart marks (limit rings, spending bars), never as text.

### Neutral
- **Label** (`ink`, #000000 / #ffffff): primary text; also the fill of the ink button, toast and the device-preview pill, with **On Label** (`on-ink`, #ffffff / #000000) on top.
- **Secondary Label** (`muted`, #6c6c70 / #aeaeb2): subtitles, captions, group headers, placeholders. The accessible variant, at least 4.5:1 on ground and on sections.
- **Section** (`surface`, #ffffff / #1c1c1e): inset grouped sections, sheets, keypad keys, unselected segments.
- **Tertiary Fill** (`surface-2`, grey 118/118/128 at 12% / 24%): discs, avatars, bank marks, inputs, secondary buttons, hover and active rows, selected nav items, skeletons.
- **Grouped Ground** (`ground`, #f2f2f7 / #000000): the page background behind everything.
- **Separator** (`line`, #c6c6c8 / #38383a) and **Soft Separator** (`line-soft`, #e5e5ea / #2c2c2e): hairlines, the amount underline, ring tracks, list dividers.

### Named Rules
**The Tint Means Tap Rule.** Violet appears only on things you can act on (and the one balance line chart). A violet heading, border or decorative wash is a bug.

**The Fill Versus Tint Rule.** Use `primary` when violet is a background with white text on it; use `tint` when violet is the text, icon, outline or focus ring. Never swap them; dark mode breaks the moment you do.

**The Fixed Plate Rule.** QR codes and barcodes always sit black on a white plate (#ffffff, radius 12), and camera and scan surfaces are always black, in both appearances. They are physical-world surfaces, not themed ones.

## Typography

**Display Font:** System UI: SF Pro on Apple devices (`-apple-system, BlinkMacSystemFont`), Be Vietnam Pro elsewhere for full Vietnamese diacritics, then `system-ui`.
**Body Font:** the same stack.

**Character:** one family at Apple's sizes and weights. Hierarchy comes from size steps and weight, not from a second face, colour or case.

### Hierarchy
- **Balance** (700, 48/58 web; 40/50 app as `balance-app`; tabular): the available balance on Home.
- **Amount Display** (700, 32/40, tabular): amounts in flows and on result screens.
- **Large Title** (700, 34/41): the title of every tab root and web page. On the app, Home pairs it with the app icon and "Wallet".
- **Title 3** (600, 20/25): section headers above inset sections, sheet titles.
- **Body** (400, 17/22 on app below 1024px; 15/20 on web): everything else. Row titles take 500, amounts in rows take 600 tabular.
- **Footnote** (400, 13/18): row subtitles, field hints and errors, field labels (500).
- **Status Capsule** (600, 13/16): pills and badges, sentence case.
- **Group Header** (`label-caps`, 400, 13/18, uppercase, secondary label): the group header above an inset section, outside it, left-aligned with the section's content inset (16px), Apple's footnote caps. The web sidebar's group names use 12px semibold sentence case instead.
- **Tab Label** (500, 10/12; 600 when active): the app tab bar.

### Named Rules
**The Raised Dong Rule.** Beside display numerals the ₫ sits at 0.55em, raised 0.42em, semibold, with a 0.12em gap; screen readers hear "đồng". Inline in running text the plain "₫" stays.

**The One Uppercase Rule.** The group header is the only uppercase text in the system. Capsules, buttons, segments and section titles are sentence case.

## Layout

The app layout (below 1024px) is a single 560px-max column with 16px gutters. Tab roots show a large title in the content; pushed screens show an inline title in a sticky nav bar that is transparent at rest and gains the bar material once content scrolls. A floating glass tab bar (64px tall, 12px from the sides and bottom, 536px max) carries five items; a gradient of the ground fades content out beneath it, and pages reserve 128px of bottom padding.

The web layout (1024px and up) puts a floating glass sidebar inset 12px from the window, 224px wide, collapsible to a 56px icon rail that is remembered per viewer. In the rail the app icon is the expand control: hovering it peeks the full sidebar over the content (the content column does not move), leaving the sidebar returns it to the rail, clicking the icon pins it open. Rows are compact, macOS-sidebar density: 36px items (10px radius, 18px icons, 15px label), 1px apart, group names 12px semibold on a 24px line, 10px panel padding, so the whole menu fits a 800px-tall window without scrolling. Its footer, with no divider above it, holds the account (the persona's photo avatar and short name, menu opening upward), notifications with a red count badge, and demo controls. There is no toolbar above web content. Content sits in a 768px main column with 48px gutters and 56px top padding; pages inside it cap at 560px.

Sections stack with 32px (app) or 40px (web) between them, each preceded by a Title 3 header with an optional tint link on the right. Section padding is 20px on app, 24px on web. List rows are at least 64px tall with a 12px gap between leading disc and text.

Flows use the same rhythm. On web: a tint "‹ Quay lại" link, a large title with a CloseButton beside it, then the step. On app: a nav bar with BackButton and CloseButton. A step's content is wrapped in one inset section only when it has no sections of its own. The footer is sticky on a blurred ground with a hairline above. The number keypad stands outside the section on the grouped background, as the system number pad does.

## Elevation & Depth

Flat by default, with material for chrome. Content surfaces carry no shadow; they separate from the ground by tone alone (white on #f2f2f7, #1c1c1e on black). Depth is reserved for things that float over content.

### Shadow Vocabulary
- **Float** (light `0 10px 30px -8px rgb(0 0 0 / 0.18), 0 1px 3px rgb(0 0 0 / 0.06)`; dark `0 10px 30px -8px rgb(0 0 0 / 0.6), 0 0 0 1px rgb(255 255 255 / 0.08)`): sheets, dialogs, menus, toasts, the device-preview pill.
- **Glass** (translucent white at 86% / dark #252528 at 82%, `blur(24px) saturate(180%)`, inner highlight plus a soft drop): the web sidebar and app tab bar only. Falls back to the solid section colour without backdrop-filter support or under reduced transparency.
- **Bar** (ground at 80%, `blur(20px) saturate(180%)`, 0.5px separator below): the nav bar once content scrolls under it.
- **Key** (`0 1px 0 rgb(0 0 0 / 0.12)`): keypad keys only, the system key edge.

### Named Rules
**The Glass Is Chrome Rule.** Translucent material belongs to navigation (sidebar, tab bar, scrolled nav bar, flow footer). Content, sections, cards and sheets are opaque.

**The No Lift Rule.** Grouped sections never take a shadow. If a section needs more separation, it is in the wrong place.

## Shapes

Continuous, generous rounding. Inset sections and callouts are 24px; the web sidebar 24px; app sheets 34px at the top (web dialogs 24px); inputs, QR plates and the Home app icon 9 to 12px; sidebar items 10px; keypad keys 14px. Every button, capsule, segment, disc, avatar, tab-bar item and the tab bar itself is a full capsule or circle. Borders are rare: hairline separators inside lists, a 2px underline under the amount entry, a 1px danger border on an invalid input.

## Components

### Buttons
Calm, platform capsules.
- **Shape:** full capsule; 50px tall on app at 17px semibold, 44px on web at 15px; a small size is 32px. Labels never wrap.
- **Primary:** violet fill, white label; hover steps to the pressed violet; pressing drops to 70% opacity.
- **Secondary:** tertiary fill with a tint label; hover to the violet wash.
- **Ghost:** no fill, tint label; hover shows the tertiary fill.
- **Danger:** red wash with red label. **Ink:** label-coloured fill with on-label text, used for the destructive confirm in sheets.
- **Disabled:** tertiary fill with secondary-label text.

### Status capsules
- **Style:** 24px capsule, 10px side padding, 13px semibold, sentence case, state colour on its soft wash. Refunded and neutral badges use the tertiary fill with label text.
- **Pending balance:** the same capsule larger on Home, with a clock glyph and the amount.

### Inset sections
- **Corner Style:** 24px.
- **Background:** Section colour, opaque.
- **Shadow Strategy:** none (see Elevation).
- **Internal Padding:** 20px app, 24px web; list rows inside are separated by soft separators.
- **Header:** Title 3 outside and above the section, with an optional tint link ("Xem tất cả").

### Inputs / Fields
- **Style:** filled, borderless, 12px radius, 48px tall (44px web), 17px text (15px web), tertiary fill, secondary-label placeholder.
- **Focus:** 2px tint outline. Caret is tint.
- **Error:** 1px danger border, footnote error in danger below, announced as an alert.
- **Label:** footnote 500 above the field; hint in secondary label below.

### Navigation
- **App tab bar:** floating glass capsule, five items; the active item is a tertiary-fill pill with tint icon and label; Scan is a 52px filled violet circle in the middle; the unread count is a red capsule over the Notifications icon.
- **App nav bar:** sticky, transparent at rest, bar material on scroll; inline title fades in; BackButton is a 28px tint chevron in a 44px target; CloseButton is a 30px tertiary-fill circle with an xmark in a 44px target.
- **Web sidebar:** floating glass panel; items 40px with 12px radius; tint icons at rest; the selected item takes the tertiary fill with tint text and icon in semibold; collapse toggle top right.

### Segmented filters
A horizontally scrolling row of 36px capsules with a fade on the trailing edge. Selected: violet fill, white label. Unselected: Section fill, label text, hover to tertiary fill. Counts follow the label in a lighter tone.

### Sheets
Bottom sheet on app (34px top radius, grabber 36 by 5 in separator colour, slides up in 240ms on `cubic-bezier(0.16,1,0.3,1)`); centred 440px dialog on web (24px radius, fades in 150ms). Title 3 title, CloseButton top right, Float shadow, 40% black scrim.

### Amount entry and keypad (signature)
The amount sits centred at Amount Display size over a 2px separator underline, with the ₫ in secondary label beside it and a footnote hint or error below. Quick amounts are 36px tertiary-fill capsules with deep-violet tabular numerals. On app the keypad is a 3 by 4 grid of 56px Section-colour keys with 14px corners and the Key edge, standing on the grouped ground.

### Toast
One message at a time: a label-coloured capsule with on-label 14px semibold text and the Float shadow, above the tab bar on app and 32px from the bottom on web, in a polite live region.

## Do's and Don'ts

### Do:
- **Do** put content in inset sections (radius 24, no shadow) on the grouped ground, and give each group a Title 3 header outside the section.
- **Do** use `primary` for violet fills with white text and `tint` for violet text, icons, outlines and focus.
- **Do** name states with sentence-case tinted capsules in the accessible state colours on their soft washes.
- **Do** set the ₫ small and raised beside display numerals, with "đồng" for screen readers.
- **Do** keep QR codes and barcodes black on a white plate, and camera and scan surfaces black, in both appearances.
- **Do** check every new pairing in both appearances; the dark values are the separate half of the token, not an afterthought.
- **Do** give translucent material a solid fallback for reduced transparency.

### Don't:
- **Don't** reintroduce the violet sky band, gradient headers or any brand chrome around the balance.
- **Don't** lift sections or cards with shadows; shadows belong to floating sheets, menus and toasts.
- **Don't** put glass on content; it is for the sidebar, tab bar and scrolled nav bar.
- **Don't** set chips, capsules, buttons or section titles in uppercase; the group header is the only uppercase text.
- **Don't** use violet for decoration, headings or borders that are not interactive.
- **Don't** add a toolbar above the web content; account, notifications and demo controls live in the sidebar footer.
- **Don't** use the chart system colours as text; they fail contrast as type.
