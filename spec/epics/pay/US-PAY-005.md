---
id: US-PAY-005
title: Payment Code with countdown and source picker
epic: PAY
priority: P0
status: Draft
size: M
routes: ["/pay/code"]
dependsOn: [US-FND-001, US-SEC-001, US-SEC-003, US-SEC-004, US-MNY-001]
---

## Story

As a wallet user at a counter, I want to open a code the cashier can scan, choose whether it draws from my wallet or a linked bank, and see how long it stays valid, so that I can pay without scanning anything myself.

## Acceptance criteria

- Given no gate is active, when I open `/pay/code` ("Mã thanh toán" shortcut on Home, sidebar "Thanh toán" on web), then the code is hidden behind the auth overlay with PIN (`requiredAuth('qr_merchant', 0)` → PIN, or device biometric where enabled, rules.md#step-up); cancelling returns me to the previous screen.
- Given auth succeeds, then I see "Mã thanh toán" with a QR and a barcode of the same one-time code, the last 4 digits "•••• 4821" with "Hiện số" to reveal all digits for 10 seconds, and the countdown "Mã tự đổi sau 0:59".
- Given the countdown reaches 0, then a new code replaces the old one without another auth, the countdown restarts from the configured TTL, and the old code can no longer complete a payment; "Làm mới" does the same on demand.
- Given the source row "Nguồn tiền", when I tap it, then a picker lists "Ví" (with "Số dư khả dụng: …") and my linked sources (US-MNY-001), e.g. "Vietcombank •••• 1234 (mặc định)", "Techcombank •••• 5678", "MB Bank thẻ ghi nợ •••• 9012"; choosing one regenerates the code bound to that source.
- Given the app layout, then the hint "Tăng độ sáng màn hình để thu ngân quét dễ hơn" shows under the code, and the screen stays awake while the code is visible.
- Given I leave the screen or the tab is hidden for more than the TTL, then on return the code is regenerated (and if I left the route, reopening asks for auth again).
- Given a gate is active (rules.md#gates), then the gate overlay shows before any auth or code (US-SEC-004).

## UI states

- Empty: no linked sources cannot happen past gate #4; if only "Ví" exists, the source row has no chevron.
- Loading: after auth, the code area shows a square skeleton until the first code is issued.
- Error: code issue fails → "Không tạo được mã thanh toán." with "Thử lại"; no code is shown (never show a stale code).
- Blocked: gates #1–#4 (rules.md#gates) at entry; PIN step-up to reveal (rules.md#step-up). PIN lockout (US-SEC-001) shows its message and no code.
- Overflow: the source label "MB Bank thẻ ghi nợ •••• 9012" fits on one line at 320px; available balance `128.450.000 ₫` in the picker aligns right.

## Design notes

- App (< 1024): full-screen, white, header "Mã thanh toán" with close; QR 240px and a barcode below at full width minus 32px; countdown as text plus a thin progress bar (no colour change until the last 10 seconds, then amber); source row as a bordered card at the bottom; "Làm mới" text button. Source picker as bottom sheet.
- Web (≥ 1024): content column, max-width 560, H1 "Thanh toán" with tabs "Mã thanh toán" (active) and "Quét mã" (to `/pay/scan`, upload), per the sidebar note. Same card; no brightness hint.
- The code area is always black on white regardless of theme. The countdown is announced to screen readers only at 10 seconds and on renewal, not every second.

## FE notes

- `PaymentCodePage`. `store.paymentCode.issue({ sourceId })` → `{ code, expiresAt }` (18 digits; demo only, not a CPM-compliant token). TTL from config `paymentCodeTtlSeconds`.
- `useCountdown(expiresAt)`: pure tick logic TDD-tested with fake timers.
- Barcode: Code 128 via a small encoder (e.g. `jsbarcode`); QR via the same encoder as US-TRF-009.
- The open code is registered with the demo store so "Cashier scans Payment Code" can find it (US-PAY-006).

## Mock data

- `ready` persona with Vietcombank account (default), Techcombank account, MB Bank debit card; Clock demo control to skip the TTL.
