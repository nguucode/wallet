---
version: 1
slug: "src-app-tsx"
primary_target: "src/App.tsx"
related_targets: []
---

# Surface: Wallet app (all routes, web ≥1024 and app <1024)

Mode: Operate. Audience: Vietnamese young professional on a phone at a counter; portfolio reviewers on desktop. Task: core wallet jobs with every state visible. Constraints: PRODUCT.md, spec/ia/rules.md, WCAG 2.2 AA in light and dark, Vietnamese diacritics never clip.

History: "Clear Ledger" (PayPal grammar) → "Violet Sky" (Copilot grammar, 2026-11-17) → Apple HIG "Inset Grouped" (2026-11-19) → gluestack-ui default (2026-11-19, this contract). Sếp chốt 2026-11-19: "Revert UI hoàn toàn sản phẩm này. Sử dụng CHÍNH XÁC 100% từ thư viện Glustack để build"; answers: Next.js + gluestack v4, gluestack default theme (violet dropped), missing pieces composed from gluestack primitives.

## Direction contract

THESIS (revised 2026-11-19, iOS / iPadOS 27 revamp): gluestack components dressed as a first-party iOS 27 app: semantic colours, Dynamic Type, inset grouped cells, capsule controls, Liquid Glass bars, a dark money card. Earlier thesis: The library is the design. Every surface is gluestack-ui components in the default theme, composed plainly; nothing custom competes with the balance, the states and the rules.

OWN-WORLD: gluestack token names carrying Apple's semantic colours (grouped style) light and dark; SF Pro via the system stack, Inter fallback; iOS Dynamic Type ramp (Body 17, Large Title 34); inset grouped cards (24px), capsule buttons and badges in sentence case; Liquid Glass only on the nav bar, tab bar, demo box and sheets; viewer tint from the seven rainbow colours; green/red keep money meaning; dark money card with a tint glow.

FIRST VIEWPORT: App: clear NavBar (glass on scroll), large title "Wallet" with the app icon, dark balance card (available balance, pending Badge, 30-day line), shortcut grid, "Hóa đơn sắp đến hạn"; floating glass tab bar with Scan as the filled tint button. Web: edge-to-edge sidebar on the viewer's backdrop (Demo controls glass box, account, notifications in its footer), the 672px grouped panel with large title and inset cards.

FORM: Pinned whole by sếp, seed: none (pinned).

FINISH: tests, typecheck, build and axe pass; screenshots at web and app widths in light and dark; DESIGN.md describes the gluestack composition.
