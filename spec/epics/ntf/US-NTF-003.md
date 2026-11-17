---
id: US-NTF-003
title: Balance-change notifications from money commits
epic: NTF
priority: P0
status: Draft
size: M
routes: ["/notifications"]
dependsOn: [US-FND-002, US-FND-003]
---

## Story

As a wallet user, I want a notice every time my balance changes, saying how much, why and what is left, so that I can spot any movement I did not make.

## Acceptance criteria

- Given any store commit that changes the balance (rules.md#notifications), then exactly one `balance_change` notification is created in the same update, unread, linking to `/history/:txId`.
- Given a debit, then the title reads "Số dư ví −2.000.000 ₫"; given a credit, "Số dư ví +2.000.000 ₫"; the body reads "<description>. Số dư khả dụng: 8.450.000 ₫." using the available balance after the change.
- Given the transaction type, then the description is: `topup` "Nạp tiền từ Vietcombank", `withdraw` "Rút tiền về Techcombank", `p2p_out` "Chuyển đến ví Lê Thu Hà", `p2p_in` "Nhận tiền từ Lê Thu Hà", `bank_transfer` "Chuyển đến Phạm Quốc Bảo, BIDV", `qr_merchant` "Thanh toán tại Cà phê Gốc Đa", `bill` "Thanh toán hóa đơn Điện lực Hồng Hà", `refund` "Hoàn tiền từ Cà phê Gốc Đa".
- Given a pending debit (bank transfer, withdraw, bill), then the notification is created at debit time with " (đang xử lý)" after the description.
- Given a pending transaction later fails and is reversed, then a second notification "Số dư ví +2.000.000 ₫" with "Hoàn tiền giao dịch không thành công WL000000001234" is created; given it later succeeds, no notification is created (no balance change).
- Given a transaction created as `failed` with no debit (instant types), then no notification is created.
- Given the fee is non-zero, then the signed amount in the title is the total debited (amount + fee).

## UI states

- Empty: not applicable (event-driven).
- Loading: not applicable; created synchronously inside the commit.
- Error: if building the notification throws, the commit is rolled back as a whole (no balance change without its notice).
- Blocked: none here; the commits it observes are gated upstream (rules.md#gates, US-SEC-004).
- Overflow: description with "Nguyễn Hoàng Phương Thảo Nguyệt Quỳnh Như" and balance "128.450.000 ₫" stays a single string; truncation is the list's job (US-NTF-001).

## Design notes

- No screen. Rendered by US-NTF-001 in both layouts with the transaction icon; titles start with the signed amount so the change is the first thing read.

## FE notes

- `balanceChangeNotification(tx, event: 'debit' | 'credit' | 'reversal', availableAfter)` in `src/notifications/build.ts`, pure, TDD-tested for each type, pending suffix, reversal, fee-inclusive total, and `failed`-without-debit returning null.
- Called from `commitMoney` and `resolvePending` in the store (US-FND-003) and by the seed generator (US-FND-008), so seed and runtime notifications match.

## Mock data

- Seeded edge cases: the pending bank transfer (debit notice with "(đang xử lý)"), the failed `timeout_reversed` (debit + reversal notices), the refunded `qr_merchant` (payment + refund notices). Banks are real names as text (mock-data.md).
