---
id: US-HOM-006
title: Recent activity
epic: HOM
priority: P0
status: Draft
size: S
routes: ["/home", "/history", "/history/:txId"]
dependsOn: [US-HOM-001, US-HIS-002]
---

## Story

As a wallet user, I want the last few transactions on Home with their real status, so that I can see at once whether my latest payment went through.

## Acceptance criteria

- Given transactions exist, then "Hoạt động gần đây" lists the 5 most recent, newest first, including pending and failed ones (rules.md#history-and-support).
- Given a row, then it shows the counterparty or type label, date and time ("17/11/2026 · 14:05"), and the signed amount ("+2.000.000 ₫" for `in`, "−65.000 ₫" for `out`).
- Given a row's status is not `success`, then a status label shows under the amount: "Đang xử lý" (amber), "Không thành công" (danger, amount struck through), or "Đã hoàn tiền" (neutral).
- Given I press a row, then I go to `/history/:txId` (US-HIS-002); "Xem tất cả" goes to `/history`.
- Given no transactions, then the section shows "Chưa có giao dịch nào." with the link "Nạp tiền" to `/topup`.

## UI states

- Empty: as above.
- Loading: 5 skeleton rows.
- Error: "Chưa tải được giao dịch." with "Thử lại".
- Blocked: none; history is never blocked. The empty-state "Nạp tiền" link is gated at tap by US-SEC-004.
- Overflow: long counterparty names truncate to one line with the full name as accessible name; 12-character amounts like `128.450.000 ₫` stay right-aligned in tabular figures.

## Design notes

- Web: rows in a bordered card, avatar or type icon in a 40px circle left, amount right; status never by colour alone (label always present).
- App: same list, full width, rows 64px; the whole row is the target.
- Incoming amounts in default text with a "+" sign, not green, to keep one accent.

## FE notes

- Reuse `TransactionRow` from HIS (US-HIS-002 area); `selectRecent(transactions, 5)` pure.

## Mock data

- Scenario `ready`: the pending `bank_transfer` and the refunded `qr_merchant` fall in the top 5 on first load if seeded recently; otherwise top 5 by date.
