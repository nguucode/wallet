---
id: US-HOM-003
title: Gate section on Home
epic: HOM
priority: P0
status: Draft
size: S
routes: ["/home", "/onboarding", "/me/sources/link"]
dependsOn: [US-HOM-001, US-SEC-004]
---

## Story

As a wallet user whose wallet cannot transact yet, I want Home to tell me why and the one thing to do next, before I try to pay, so that the law shows up as guidance rather than an error (PRODUCT.md principle "Law is UI, not an error").

## Acceptance criteria

- Given no gate is active, then the section is absent.
- Given gate #1 with `kycStatus = unverified`, then the card reads "Ví chưa được xác thực sinh trắc học" with the CTA "Xác thực ngay" to `/onboarding?step=id-method`.
- Given gate #1 with `kycStatus = verifying`, then the card reads "Ví chưa được xác thực sinh trắc học" with "Đang kiểm tra, thường xong trong 24 giờ" and no CTA.
- Given gate #2 (wallet `suspended`), then the card reads "Giấy tờ tùy thân đã hết hạn, ví tạm ngừng giao dịch" with no CTA in P0 (the update flow is P1).
- Given gate #4 (no linked source), then the card reads "Cần liên kết ngân hàng chính chủ trước khi dùng ví" with the CTA "Liên kết ngân hàng" to `/me/sources/link`.
- Given more than one condition holds, then only the first match by rules.md#gates precedence is shown; the card and the overlay from US-HOM-002 always show the same gate.

## UI states

- Empty: no gate, no section.
- Loading: none; the gate derives from already-loaded customer and wallet state.
- Error: none.
- Blocked: this section is the display of gates #1, #2, #4 (gate #3 has no P0 scenario; it renders through the same component if reached).
- Overflow: messages wrap to three lines at 320px; the CTA pill never truncates.

## Design notes

- Web and app: one 1px bordered card, 12px radius, light amber tint for waiting or blocked states (not danger red): icon in a 48px circle, message 16px bold, sub-line 14px, pill CTA right on web and full-width under the text on app.
- Placed after the shortcuts per sitemap order, so the balance remains the headline.

## FE notes

- `GateSection` renders `activeGate(state)` from US-SEC-004 through the shared `GateCard`; copy comes from US-SEC-004's gate table, not duplicated here.

## Mock data

- Scenarios `unverified`, `no-source`, `suspended`; onboarding "needs review" outcome for the verifying variant.
