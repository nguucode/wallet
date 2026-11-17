---
version: 1
slug: "src-app-tsx"
primary_target: "src/App.tsx"
related_targets: []
---

# Surface: Wallet app (all routes, web ≥1024 and app <1024)

Mode: Operate. Audience: Vietnamese young professional on a phone at a counter; portfolio reviewers on desktop. Task: core wallet jobs with every state visible. Constraints: PRODUCT.md, spec/ia/rules.md, WCAG 2.2 AA, Vietnamese diacritics never clip.

Redesign 2026-11-17: sếp replaced "Clear Ledger" (PayPal-grammar black/white) with the grammar of four Copilot screenshots (Mobbin), in Wallet's own purple. Charts only where they explain state. Every screen, both layouts.

## Direction contract

THESIS: The money lives on a lifted white card floating out of a violet sky; everything else is calm lavender ground. Refuses the black-and-white ledger and the super-app icon grid.

OWN-WORLD: Violet gradient band (#4A1FC4→#6D4AF0) fading into lavender ground #F5F3FF; white cards radius 24 with soft violet-tinted shadow; navy ink #1C1840; uppercase grey section labels with muted "Xem tất cả ›"; tinted pill chips with uppercase coloured text; rings and bars in success/pending/danger only; lavender keypad keys on a violet panel; ₫ set small and raised beside numerals.

STORY: The reviewer sees the balance and its 30-day line first, then what needs attention (pending, bills due), then acts from one-tap shortcuts; every outcome reads plainly.

FIRST VIEWPORT: App: gradient band with centred white "Wallet", notifications right; hero card overlapping band: available balance centred 44px, pending line, 30-day balance line chart with end dot; shortcut discs row below. Web: same band across content column, sidebar on lavender.

FORM: Pinned reference (Copilot dashboard/sheet/keypad grammar) — seed: none (pinned). Quote: "tôi muốn redesign lại UI, style như ref này" + answers "Purple, Copilot style", "Yes, where they explain state", "Every screen, both layouts".

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance
