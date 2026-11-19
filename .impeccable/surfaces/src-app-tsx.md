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

THESIS: The library is the design. Every surface is gluestack-ui components in the default theme, composed plainly; nothing custom competes with the balance, the states and the rules.

OWN-WORLD: gluestack default tokens only (background, card, primary, secondary, muted, accent, destructive, border and their foregrounds); Inter; component-default radii and type sizes; Tailwind 4pt spacing. No glass, gradients, glow, custom shadows or brand tint. Transaction states are Badge variants plus text.

FIRST VIEWPORT: App: NavBar, large title "Wallet" with the app icon, balance Card (available balance, pending Badge, 30-day line), shortcut grid, "Hóa đơn sắp đến hạn"; bottom tab bar with Scan as a filled Button. Web: bordered sidebar (collapsible rail; account Menu, notifications, demo controls in its footer), large title, the same sections in a 768px column.

FORM: Pinned whole by sếp, seed: none (pinned).

FINISH: tests, typecheck, build and axe pass; screenshots at web and app widths in light and dark; DESIGN.md describes the gluestack composition.
