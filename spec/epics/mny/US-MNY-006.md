---
id: US-MNY-006
title: "Withdraw: amount, fee, and confirm"
epic: MNY
priority: P0
status: Draft
size: M
routes: ["/withdraw"]
dependsOn: [US-FND-002, US-FND-007, US-SEC-003, US-SEC-004, US-MNY-001]
---

## Story

As a wallet user, I want to move money from the wallet back to my own bank and see the fee and my remaining free withdrawals before I confirm, so that nothing about the cost surprises me.

## Acceptance criteria

- Given I open `/withdraw` and a gate is active, then the gate overlay shows at entry (US-SEC-004).
- Given `?step=amount`, then I see "Rút tiền", the source picker "Về" preselected with my default, the amount input, and "Số dư khả dụng: 3.250.000 ₫".
- Given an amount, then a live fee line under it reads "Miễn phí (còn 3 lượt trong tháng)" while free slots remain, or "Phí 25.000 ₫" once they are used (rules.md#fees).
- Given amount + fee exceeds the available balance, then the inline error reads "Số dư khả dụng không đủ. Bạn rút được tối đa 3.234.000 ₫." and "Tiếp tục" is disabled; this is an input error, never a transaction (object-model.md#transaction-state-machine).
- Given `?step=confirm`, then the rows are "Số tiền", "Phí" (with the free-slot text), "Tổng tiền trừ từ ví" (amount + fee), "Về" (bank, kind, masked number), the holder name, and the auth line from `requiredAuth` (US-SEC-003); primary "Xác nhận".
- Given step-up succeeds, then a `withdraw` transaction is created and I go to the result (US-MNY-007).
- Given the free-slot counter, then it is shared with `bank_transfer` (TRF): success and pending outbound transfers this calendar month use a slot; failed ones do not.

## UI states

- Empty: amount 0 ₫, fee line hidden.
- Loading: fee line updates synchronously (pure function); confirm button spinner during auth.
- Error: insufficient balance as above.
- Blocked: gates #1–#4 at entry (rules.md#gates via US-SEC-004).
- Overflow: a 12-character amount `128.450.000 ₫` with a fee of `642.000 ₫` keeps all confirm rows on one line each at 375px; label wraps first.

## Design notes

- Web: same flow frame as top up; the fee line is 14px muted under the amount input, amber only when a fee applies for the first time this month.
- App: numeric keypad, source picker as bottom sheet, fee line directly above "Tiếp tục".
- Confirm uses the shared confirm card from US-FND-007; total row bold and separated by a 1px rule.

## FE notes

- `outboundFee({ amount, freeSlotsUsed }, config)` in `src/domain/fees.ts` returns `{ fee, freeSlotsLeft }`; shared with TRF bank transfer. TDD: slots left → 0; 1.250.000 → 6.000 (0,5% = 6.250 rounded to nearest 1.000); 100.000 → 1.000 (minimum); 5.000.000 → 25.000.
- `freeSlotsUsed(transactions, month)` counts `withdraw` + `bank_transfer` with status `success | pending`; TDD that `failed` is excluded.
- `maxWithdrawable(available, config)` for the error copy.

## Mock data

- Scenario `ready` seeded with 2 outbound bank transfers this month (3 free slots left); a fixture with 5 used for the fee case.
