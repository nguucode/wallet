---
id: US-PAY-003
title: Merchant payment amount and confirm
epic: PAY
priority: P0
status: Draft
size: M
routes: ["/pay/merchant"]
dependsOn: [US-PAY-002, US-TRF-003, US-FND-002, US-FND-007, US-SEC-001, US-SEC-002, US-SEC-003, US-SEC-004]
---

## Story

As a wallet user at a counter, I want to see the shop's name, type the amount (or see the amount the shop set) and approve, so that I pay the right shop the right amount in a few seconds.

## Acceptance criteria

- Given I arrive at `/pay/merchant?qr=…` with a merchant QR without an amount, then `?step=amount` shows the merchant name, category and city at the top, the "Số tiền" field, and "Số dư khả dụng: …".
- Given the QR carries a fixed amount, then the amount step is skipped and I land on `?step=confirm` with the muted note "Số tiền do cửa hàng đặt" and no way to edit the amount (sitemap.yaml `pay-merchant`).
- Given the amount exceeds available balance, then "Số dư khả dụng không đủ." with "Nạp tiền"; given it would exceed the general monthly limit (rules.md#limits, `qr_merchant` counts), then "Vượt hạn mức tháng. Bạn còn thanh toán được 2.500.000 ₫ trong tháng này." with "Xem hạn mức"; "Tiếp tục" disabled. For a fixed-amount QR the same checks run on confirm and the message replaces "Xác nhận" with "Quét mã khác".
- Given the confirm step, then rows show "Cửa hàng", "Số tiền", "Phí" reading "Miễn phí" (rules.md#fees), "Tổng tiền", "Nguồn tiền" ("Ví"), and the auth line from `requiredAuth('qr_merchant', amount)`: "Cần nhập mã PIN", or "Cần xác thực khuôn mặt vì giao dịch trên {merchantThreshold}" (rules.md#step-up).
- Given I tap "Xác nhận", then balance and limit are re-checked, then the auth overlay opens; given auth fails or is cancelled, I stay on confirm and no transaction exists.
- Given the `qr` param is missing or invalid, then I see "Mã QR không hợp lệ. Hãy quét lại." with "Quét lại" (to `/pay/scan`).
- Given a gate is active, when I open the route by URL, then the gate overlay shows (US-SEC-004).

## UI states

- Empty: amount field empty, "Tiếp tục" disabled.
- Loading: merchant header from the parsed QR is immediate; balance and limit counters show skeletons; "Xác nhận" spinner during pre-checks.
- Error: counters fail to load → "Không kiểm tra được hạn mức. Thử lại." with "Thử lại"; invalid QR as above.
- Blocked: gates #1–#4 (rules.md#gates) at entry; step-up at confirm (rules.md#step-up).
- Overflow: merchant name at the EMV max of 25 characters with diacritics ("Cà Phê Phố Cổ Hàng Buồm 2") wraps on the confirm row; amount `128.450.000 ₫` fits at 375px.

## Design notes

- Web (≥ 1024): content column, max-width 560, step header "Thanh toán". Merchant header as a bordered row: 48px monogram circle (category initial, no logo), name 16px bold, "Cà phê · Hà Nội" muted. Confirm card as in US-TRF-004. Auth as dialog.
- App (< 1024): full-screen; amount above the numeric keypad, "Tiếp tục" pinned above it; confirm with "Xác nhận" pinned to the bottom; auth as bottom sheet. Designed for one-handed use standing at a counter: all actions in the bottom half.

## FE notes

- `MerchantPayFlow` on US-FND-007; reads `?qr=` once, stores the parsed merchant in the draft, `replace`s the URL without `qr`.
- `validateTransferAmount` from US-TRF-003 (general limit, no per-tx cap).
- Pay-by-source is not offered here in P0 (Payment Code has the source picker, US-PAY-005).

## Mock data

- 25 merchants; the 3 sample-library merchant QR map to seeded merchants (one with `fixedAmount`, e.g. "Bánh Mì Hội An Quán" 45.000 ₫).
- `near-limit` for the limit message.
