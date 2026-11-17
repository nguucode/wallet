---
id: US-BIL-003
title: Pay a bill
epic: BIL
priority: P0
status: Draft
size: M
routes: ["/bills/:billId"]
dependsOn: [US-FND-002, US-FND-007, US-SEC-001, US-SEC-002, US-SEC-003, US-SEC-004, US-SEC-005, US-BIL-001, US-HIS-002]
---

## Story

As a wallet user, I want to open a saved bill, see exactly what I'm paying, and pay it from my balance, so that the electricity is paid and I can tell whether the biller has confirmed it.

## Acceptance criteria

- Given I open `/bills/:billId` (`?step=view`), then I see biller, holder name, customer code, period, amount, due date, and status; a `due` or `overdue` bill shows the primary button "Thanh toán", a `settling` bill shows "Đang xử lý · Nhà cung cấp đang xác nhận" and a `paid` bill shows "Đã thanh toán", both with the link "Xem giao dịch" to `/history/:txId` and no pay button.
- Given the bill amount is more than my available balance, then "Thanh toán" is disabled and the view shows "Số dư không đủ, cần thêm 245.000 ₫" with the link "Nạp tiền" to `/topup`; no transaction is created.
- Given paying would exceed the essential monthly limit (rules.md#limits), then "Thanh toán" is disabled and the view shows "Vượt hạn mức thanh toán thiết yếu tháng này, còn lại 1.200.000 ₫" with the link "Xem hạn mức" to `/me/limits`. The bill never counts against the general limit.
- Given I tap "Thanh toán", then `?step=confirm` shows amount, fee "Miễn phí" (rules.md#fees), total debited, source "Số dư ví", counterparty (biller + customer code), and the auth line from `requiredAuth('bill', amount)` (rules.md#step-up), e.g. "Xác thực bằng mã PIN".
- Given I tap "Xác nhận" and pass step-up (US-SEC-001 or US-SEC-002), then the Transaction is created with `type: bill`, `essential: true`, and the result step shows the outcome from the Next outcome demo control.
- Given the outcome is success, then the result reads "Thanh toán thành công" and the bill becomes `paid`; given pending, it reads "Đang xử lý" with "Dự kiến xong trước HH:mm" and "Nếu không thành công, tiền sẽ tự hoàn về ví", the transaction has `pendingReason: biller_settling`, and the bill becomes `settling`.
- Given the outcome is failed (`biller_unavailable`), then the result reads "Không thành công" with "Nhà cung cấp tạm thời không phản hồi" and "Tiền đã hoàn về ví lúc HH:mm"; the bill stays `due` or `overdue` and "Thử lại" returns to `?step=view`.
- Given a `settling` bill resolves (Resolve pending demo control), then it becomes `paid` on success or returns to `due`/`overdue` on failure, and a refresh of `?step=result` redirects to `/history/:txId` (rules.md#spec-conventions).

## UI states

- Empty: none; an unknown `billId` shows the not-found page (US-FND-006).
- Loading: view skeleton in the final layout; "Xác nhận" shows a spinner until the auth sheet opens.
- Error: "Không tải được hóa đơn." with "Thử lại"; auth failures and lockout are handled by US-SEC-001 and US-SEC-002 and create no transaction.
- Blocked: gates #1–#4 from rules.md#gates via US-SEC-004 at entry to `/bills/:billId`; balance and essential limit are input errors on the view step, never failed transactions (object-model.md state machine).
- Overflow: holder name "Nguyễn Hoàng Phương Thảo Nguyệt Quỳnh Như" wraps on the confirm step and is never truncated there; amount `128.450.000 ₫` at display size fits 375px; an amount above the `bill` face-match threshold (rules.md#step-up) shows the face-match auth line.

## Design notes

- Web (≥ 1024): flow page in the content column, max-width 560; the amount is the display number on the view and confirm steps; details in a 1px bordered card with label/value rows; auth opens as a dialog. Result uses the shared result layout from US-FND-007.
- App (< 1024): full-screen flow, tab bar hidden; "Thanh toán" and "Xác nhận" are a full-width black pill pinned to the bottom safe area; auth opens as a bottom sheet.
- Pending result gets the same care as success: amber status icon, the expected time, what happens on failure, and "Xem giao dịch" as the primary action instead of "Xong".

## FE notes

- Route `/bills/:billId?step=view|confirm|auth|result` on the money-flow pattern (US-FND-007).
- Pre-checks are pure functions to TDD: `canPayBill(bill, available, limitCounters, config)` returns `ok | insufficient_balance | essential_limit | not_payable`; `essential` comes from the Biller.
- `store.bills.pay(billId, authResult)` creates the Transaction and updates `Bill.status`; settling ETA comes from `config.pendingEta.biller_settling`.
- Enhanced by BIL P1: Pay a bill directly from a linked source.

## Mock data

- The seeded due bill (pays with PIN), the seeded `settling` bill with its pending transaction, the paid bill.
- The `near-limit` scenario touches the general limit only, so it does not block bills. The essential-limit block has no seeded path yet: it needs a scenario or injection that puts essential spend near its limit (open gap, reported against ia/mock-data.md).
- Insufficient balance: reachable by spending down the balance or with a demo injection; the persona's default balance covers every seeded bill.
