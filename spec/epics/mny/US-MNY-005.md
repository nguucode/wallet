---
id: US-MNY-005
title: Top up from a linked source
epic: MNY
priority: P0
status: Draft
size: M
routes: ["/topup", "/history/:txId"]
dependsOn: [US-FND-002, US-FND-007, US-SEC-003, US-SEC-004, US-MNY-001]
---

## Story

As a wallet user, I want to move money from my own linked bank into the wallet, so that I have balance to transfer and pay.

## Acceptance criteria

- Given I open `/topup` and a gate is active, then the gate overlay shows at entry and no amount step renders (US-SEC-004).
- Given `?step=amount`, then I see "Nạp tiền", the source picker "Từ" preselected with my default ("Vietcombank ••6789"), the amount input, quick amounts "100.000", "500.000", "1.000.000", "2.000.000", and the current "Số dư khả dụng"; "Tiếp tục" is disabled at 0 ₫.
- Given `?step=confirm`, then the rows are "Số tiền", "Phí" "Miễn phí", "Tổng tiền", "Từ" (bank and masked number), "Đến" "Ví của bạn · 0901 234 567", and the auth line from `requiredAuth` (US-SEC-003): "Xác thực bằng mã PIN" or "Cần xác thực khuôn mặt vì giao dịch trên 10.000.000 ₫" with the amount taken from config; primary "Xác nhận".
- Given I pass step-up, then a `topup` transaction is created as `success` or `failed` only (instant type, object-model.md), per Demo control "Next outcome".
- Given success, then the result reads "Nạp tiền thành công", the amount, and "Số dư khả dụng: 3.250.000 ₫", with "Xem chi tiết" (to `/history/:txId`) and "Về trang chủ"; a `balance_change` notification is created.
- Given failure (`bank_declined`), then the result reads "Nạp tiền không thành công" with "Vietcombank đã từ chối giao dịch. Ví không bị trừ tiền." and the actions "Thử lại" (back to confirm with the same draft) and "Xem chi tiết".
- Given the amount, then no monthly limit check runs (top-ups are not counted, rules.md#limits) and no fee is charged (rules.md#fees).

## UI states

- Empty: amount 0 ₫ with the quick amounts.
- Loading: confirm button spinner while auth and the store resolve; result waits for the store latency.
- Error: failed result as above; Demo "Next outcome = Đang xử lý" does not apply to an instant type and resolves as success.
- Blocked: gates #1–#4 at entry (rules.md#gates via US-SEC-004).
- Overflow: amounts up to `128.450.000 ₫` in the input and result; the source picker shows "MB Bank · Thẻ ghi nợ ••1122" on one line at 375px.

## Design notes

- Web: flow page in the content column (max-width 560), steps as cards, amount in a large display input; source picker as a bordered select-card.
- App: full-screen flow, tab bar hidden, numeric keypad for the amount, source picker opens a bottom sheet; "Tiếp tục" pinned above the keypad.
- Result follows the shared result pattern from US-FND-007 (status icon, heading, amount, two actions).

## FE notes

- `TopupFlow` on `MoneyFlow` (US-FND-007) with steps `[amount, confirm, auth, result]`; `?step=result` on refresh redirects to `/history/:txId` (rules.md#spec-conventions).
- `store.transactions.topup({ sourceId, amount })` creates the tx after auth and updates `dayCounter` per rules.md#step-up.

## Mock data

- Scenario `ready` (three sources), `no-source` (gate #4), `unverified` (gate #1). A top-up of 12.000.000 ₫ to show the face-match line.
