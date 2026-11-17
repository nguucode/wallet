---
id: US-PAY-004
title: Merchant payment result
epic: PAY
priority: P0
status: Draft
size: S
routes: ["/pay/merchant"]
dependsOn: [US-PAY-003, US-FND-004, US-FND-007, US-HIS-002]
---

## Story

As a wallet user at a counter, I want a result screen I can show the cashier, saying clearly whether the payment went through, so that neither of us has to guess.

## Acceptance criteria

- Given auth succeeded and the next outcome is success, then a `qr_merchant` is created as `success`, the balance drops, a `balance_change` notification is created, and `?step=result` shows "Thanh toán thành công", the amount in display size, the merchant name, time "14:05 · 17/11/2026" and the transaction ID, with "Xem chi tiết" and "Xong".
- Given the next outcome is "Không thành công" (`merchant_cancelled` or `timeout_reversed`), then the transaction is created as `failed` and the result shows "Thanh toán không thành công", the reason ("Cửa hàng đã hủy giao dịch." or "Hệ thống không phản hồi kịp, giao dịch đã được hủy."), and "Tiền đã hoàn về ví lúc 14:05", with "Thử lại" and "Xem chi tiết".
- Given the next outcome is "Đang xử lý", then it is ignored for this instant type (object-model.md: `qr_merchant` is never pending) and the payment succeeds.
- Given a later demo "Merchant refund" on this payment, then the result is not changed (it already left the screen); the refund appears as a linked `refund` row in history and on the detail (US-HIS-002, object-model.md `refunded`).
- Given the success result on app, then the time shows seconds ("14:05:32") and the screen stays awake while it is open, so the cashier can check it.
- Given I refresh on `?step=result`, then I am redirected to `/history/:txId`.

## UI states

- Empty: not applicable.
- Loading: "Đang thanh toán…" with merchant name and amount until the store resolves; back disabled.
- Error: store throws → "Không gửi được yêu cầu. Bạn chưa bị trừ tiền." with "Thử lại".
- Blocked: none at this step (gates and step-up applied before).
- Overflow: amount `128.450.000 ₫` at display size fits 375px; 25-character merchant name wraps to two lines.

## Design notes

- Web (≥ 1024): result card max-width 560, status icon circle, headline 24px, amount 40px, detail rows, two pill buttons. Same layout for failed with the danger icon.
- App (< 1024): full-screen, no back arrow, amount as the dominant element (display size, negative letter-spacing) so it reads from across a counter; buttons pinned to the bottom.

## FE notes

- Step `result` of `MerchantPayFlow`; `failureReasonCopy` from US-TRF-004.
- Screen Wake Lock API on the app layout while the result is visible; ignore silently when unsupported.

## Mock data

- Demo controls: next outcome Không thành công (`merchant_cancelled`, `timeout_reversed`); "Merchant refund" for the refunded path in history.
