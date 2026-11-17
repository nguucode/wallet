---
id: US-FND-010
title: Amount step with balance and limit checks
epic: FND
priority: P0
status: Draft
size: M
routes: ["/topup", "/withdraw", "/transfer/wallet", "/transfer/bank", "/pay/merchant"]
dependsOn: [US-FND-002, US-FND-003, US-SEC-005]
---

## Story

As a wallet user, I want to learn that I lack balance or monthly limit while I type the amount, not after I authenticate, so that a refusal is a hint, never a failed transaction.

## Acceptance criteria

- Given the amount step, then it shows the amount input (US-FND-002), the source line ("Từ Số dư khả dụng: 8.450.000 ₫" for outgoing, "Từ Vietcombank •••• 6789" for top up), and "Tiếp tục", disabled until the amount is valid.
- Given an outgoing debit and an amount above the available balance (`balance − pendingOut`), then the field shows "Số dư khả dụng không đủ. Bạn có 8.450.000 ₫." with a link "Nạp tiền" (not shown inside the top-up flow).
- Given a type counted on a monthly limit and an amount above what remains (rules.md#limits), then the field shows "Vượt hạn mức tháng. Bạn còn dùng được 2.500.000 ₫ trong tháng này." with "Xem hạn mức" → `/me/limits`; essential bills check the essential limit instead.
- Given the flow passes a per-transaction cap (for example the bank transfer cap in rules.md#money-rules), when the amount exceeds it, then the field shows "Tối đa 499.999.999 ₫ mỗi giao dịch." using the configured value.
- Given `topup` or `withdraw`, then no monthly-limit check runs (rules.md#limits).
- Given I press "Tiếp tục" with an empty field, then it shows "Nhập số tiền"; checks run live after the first edit, not on every keystroke before it.
- Given an invalid amount, then no transaction is created and the auth sheet cannot open (object-model.md#transaction-state-machine).

## UI states

- Empty: placeholder "0", "Tiếp tục" disabled.
- Loading: the source line shows a skeleton until balance and counters load; the input is usable.
- Error: one message at a time, precedence: required, per-transaction cap, balance, limit.
- Blocked: gate from rules.md#gates is resolved before this step (US-SEC-004); this step never shows a gate.
- Overflow: with the `near-limit` scenario the remaining limit "2.500.000 ₫" is shown; with `rich` an amount "128.450.000 ₫" fits at 320px.

## Design notes

- Web: amount input centred in the flow card, source line under it, message below in danger text with an icon, primary pill at the bottom.
- App: amount at display size near the top, system numeric keypad, primary pill docked above the keyboard; messages directly under the amount, never in a toast.

## FE notes

- `checkAmount({ type, amount, essential, available, counters, cap? }): AmountError | null` in `src/rules/amount.ts`, pure, TDD-tested per message and precedence; uses `limitCounters` from US-SEC-005.
- `<AmountStep>` used by every money flow inside `MoneyFlow` (US-FND-007); flows supply `type`, `cap`, `essential`, and the source line.

## Mock data

- `near-limit` (97.500.000 ₫ used), `ready` (about 62% used), the pending bank transfer so `available < balance`.
