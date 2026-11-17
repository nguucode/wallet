---
id: US-PAY-006
title: Cashier scans the Payment Code
epic: PAY
priority: P0
status: Draft
size: S
routes: ["/pay/code"]
dependsOn: [US-PAY-005, US-PAY-004, US-FND-004, US-SEC-002, US-SEC-003, US-HIS-002]
---

## Story

As a reviewer, I want a demo control that plays the cashier scanning my open Payment Code with a merchant and amount, so that I can see the whole counter payment, including when it cannot go through.

## Acceptance criteria

- Given `/pay/code` shows a valid code, when I use the demo control "Cashier scans Payment Code" with a merchant and amount, then the pre-checks run for that amount and source: available balance (only when the source is "Ví") and the general monthly limit (rules.md#limits).
- Given the checks pass and `requiredAuth('qr_merchant', amount)` is PIN, then no further auth is asked (the reveal auth approves it), a `qr_merchant` with the chosen `sourceId` is created per the next outcome, and the screen switches to the result from US-PAY-004 ("Thanh toán thành công" with merchant and amount).
- Given the amount needs face match (rules.md#step-up), then the face match overlay opens first with "Cần xác thực khuôn mặt vì giao dịch trên {merchantThreshold}"; given it fails, then no transaction is created and the code screen shows "Chưa thanh toán. Thu ngân có thể quét lại."
- Given the balance or limit check fails, then no transaction is created (object-model.md#transaction-state-machine) and the code screen shows "Chưa thanh toán: số dư khả dụng không đủ cho 128.450.000 ₫. Chọn nguồn tiền khác hoặc nạp tiền." (or "…vượt hạn mức tháng.") with "Đổi nguồn tiền" and "Nạp tiền".
- Given the source is a linked bank and the next outcome is "Không thành công" with `bank_declined`, then the transaction is created as `failed` and the result shows "Thanh toán không thành công" with "Ngân hàng từ chối giao dịch." (no reversal line: the wallet was not debited).
- Given a payment completes or fails, then the used code is invalidated, and "Xong" on the result returns to `/home`; reopening `/pay/code` asks for auth again.
- Given no Payment Code is open (or it has expired), then the demo control is disabled with "Mở Mã thanh toán trước".

## UI states

- Empty: not applicable.
- Loading: "Đang thanh toán…" overlay on the code for the store latency.
- Error: store throws → code stays valid, toast "Không gửi được yêu cầu. Bạn chưa bị trừ tiền."
- Blocked: gates were applied at entry (US-PAY-005); step-up per rules.md#step-up for amounts above the merchant threshold.
- Overflow: merchant names of 25 characters and amounts `128.450.000 ₫` in the control and the result.

## Design notes

- App (< 1024) and web (≥ 1024): the result reuses US-PAY-004 layouts. The "Chưa thanh toán" message sits above the code as a bordered banner with the two actions, so the code stays visible for a rescan.
- The demo control lives in the Demo controls panel (US-FND-004): merchant picker (25 seeded merchants), amount input, "Quét" button, labelled as a simulation.

## FE notes

- Demo control dispatches `store.paymentCode.capture({ code, merchantId, amount })`; capture runs `validateTransferAmount` (US-TRF-003), `requiredAuth`, then creates the transaction with the next outcome.
- The wallet balance check is skipped for linked-source payments; failure then comes only from the bank (`bank_declined`).

## Mock data

- 25 seeded merchants; scenario `near-limit` and a low wallet balance to show the "Chưa thanh toán" path; next outcome `bank_declined` for a linked source.
