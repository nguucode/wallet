---
id: US-HOM-002
title: Shortcuts row
epic: HOM
priority: P0
status: Draft
size: S
routes: ["/home", "/pay/scan", "/pay/code", "/topup", "/withdraw", "/transfer", "/bills"]
dependsOn: [US-HOM-001, US-SEC-004]
---

## Story

As a wallet user standing at a counter, I want a fixed row of shortcuts led by Scan and Payment Code right under my balance, so that the core jobs are one tap away and never move.

## Acceptance criteria

- Given the app layout, then the row shows, in this order, "Quét mã", "Mã thanh toán", "Nạp", "Rút", "Chuyển", "Hóa đơn", linking to `/pay/scan`, `/pay/code`, `/topup`, `/withdraw`, `/transfer`, `/bills`.
- Given the web layout, then "Quét mã" is dropped and the row starts with "Mã thanh toán" (sitemap `shortcuts`).
- Given no gate is active, when I tap a shortcut, then I go to its route.
- Given a gate is active (rules.md#gates, first match), when I tap any shortcut, then the gate overlay opens with that gate's message and single next step instead of navigating (US-SEC-004); the shortcuts are not visually disabled.
- Given any scenario, then the row never adds, removes, or reorders items based on usage or promotion (PRODUCT.md principle "Core jobs only").

## UI states

- Empty: not applicable; the row is fixed.
- Loading: icons and labels render immediately; they do not wait for data.
- Error: none.
- Blocked: gates #1–#4 via US-SEC-004, opened at tap.
- Overflow: "Mã thanh toán" wraps to two lines under its icon; at 320px the six items fit as a horizontal scroll with the last item peeking.

## Design notes

- App: line icons 24px in 48px light-grey circles, labels 12px on up to two lines; "Quét mã" and "Mã thanh toán" first. Row scrolls horizontally with right-edge peek at narrow widths (paypal-style-study.md, mobile).
- Web: same circles in a single row of five under the balance, left-aligned; no horizontal scroll at ≥ 1024.
- Each item is a link with a 48px target; focus ring on the circle.

## FE notes

- `ShortcutsRow` reads its items from a constant keyed by layout, not from the sitemap nav lists; each item calls `guardMoneyAction(action)` from US-SEC-004 before `navigate`.
- Note for BIL: "Hóa đơn" is gated here at entry because bill payment is a money action; if BIL decides `/bills` browsing is ungated, this item drops its guard.

## Mock data

- Scenarios `unverified`, `no-source`, and `suspended` to see each gate from the row.
