---
version: 1
slug: "src-app-tsx"
primary_target: "src/App.tsx"
related_targets: []
---

# Surface: Wallet app (all routes, web ≥1024 and app <1024)

Mode: Operate. Audience: Vietnamese young professional on a phone at a counter; portfolio reviewers on desktop. Task: core wallet jobs with every state visible. Constraints: PRODUCT.md, spec/ia/rules.md, WCAG 2.2 AA in light and dark, Vietnamese diacritics never clip.

History: "Clear Ledger" (PayPal grammar) → "Violet Sky" (Copilot grammar, 2026-11-17) → Apple HIG (2026-11-19, this contract). Sếp chốt 2026-11-19: DESIGN.md + code; keep violet #5B2BE0 as app tint; system font stack (SF on Apple devices, Be Vietnam Pro fallback); light + dark following the system.

## Direction contract

THESIS: Wallet as a first-party Apple app: neutral grouped backgrounds, content in inset grouped sections, colour only where you can act (violet tint) or where a state needs naming. Refuses the violet sky band, lifted shadow cards, uppercase chips, and any brand chrome around the money.

OWN-WORLD: systemGroupedBackground #F2F2F7 / #000; inset grouped sections #FFF / #1C1C1E, radius 24, no shadow, hairline separators inset past the leading icon; label #000 / #FFF, accessible secondary #6C6C70 / #AEAEB2; violet tint for buttons, links, selection; status as tinted capsules in sentence case (green, orange, red, accessible variants); SF Pro large titles 34 bold; Liquid Glass only on navigation chrome (web sidebar, app tab bar, scrolled nav bar); ₫ small and raised beside numerals.

STORY: The reviewer recognises the platform immediately, so attention goes to the balance, the states and the rules, not to the styling.

FIRST VIEWPORT: App: large title "Wallet" left with the app icon (owner commit 9b24e70), sample chip + demo controls on the right (notifications stay a tab, as spec/ia/sitemap.yaml defines the tab bar); balance section (available balance large, pending capsule, 30-day line); shortcut row; "Hóa đơn sắp đến hạn" section. Floating glass tab bar with the Scan button filled in tint. Web: floating glass sidebar (collapsible to a 76px rail) whose footer holds account, notifications and demo controls (sếp 2026-11-19: no toolbar above the content); large title, same sections in a 768 column.

FORM: Pinned whole by sếp — seed: none (pinned). Quote: "tôi muốn cập nhật lại spec của toàn bộ sản phẩm, theo design system của Apple." + answers "DESIGN.md + code", "Giữ tím làm tint", "System stack", "Có, theo hệ thống".

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance
