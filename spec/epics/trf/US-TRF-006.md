---
id: US-TRF-006
title: Bank transfer amount and confirm with fee
epic: TRF
priority: P0
status: Draft
size: M
routes: ["/transfer/bank"]
dependsOn: [US-TRF-005, US-TRF-003, US-FND-007, US-SEC-001, US-SEC-002, US-SEC-003]
---

## Story

As a wallet user, I want to enter the amount, see the fee and the per-transaction cap up front, and confirm with the holder's name in view, so that I know the full cost and the destination before I approve.

## Acceptance criteria

- Given a looked-up recipient, when I open `?step=amount`, then I see the holder name, bank and "•••• 6789" at the top, the "Số tiền" field, "Số dư khả dụng: …", and an optional "Lời nhắn" field (counter "0/50", rules.md#money-rules).
- Given the amount exceeds the per-transaction bank cap (rules.md#money-rules, from config), then the field shows "Tối đa 499.999.999 ₫ mỗi giao dịch đến ngân hàng." and "Tiếp tục" is disabled.
- Given the amount plus fee exceeds available balance, then the field shows "Số dư khả dụng không đủ (đã gồm phí 5.000 ₫)." with "Nạp tiền"; given it would exceed the general monthly limit (rules.md#limits), then it shows "Vượt hạn mức tháng. Bạn còn chuyển được 2.500.000 ₫ trong tháng này." with "Xem hạn mức". "Tiếp tục" is disabled in both cases.
- Given I continue, then `?step=confirm` shows "Người nhận" (holder name as looked up), "Ngân hàng", "Số tài khoản" ("•••• 6789"), "Số tiền", "Phí", "Tổng tiền", "Nguồn tiền" ("Ví"), "Lời nhắn", and the auth line from `requiredAuth('bank_transfer', …)` as in US-TRF-004.
- Given free slots remain this month (rules.md#fees, shared with withdraw), then "Phí" reads "Miễn phí (còn 3 lượt trong tháng)"; given none remain, then it shows the computed fee (e.g. "5.000 ₫") with the muted note "Đã dùng hết 5 lượt miễn phí trong tháng".
- Given I tap "Xác nhận", then cap, balance (amount + fee) and limit are re-checked before the auth overlay opens; a failure returns me to `?step=amount` with the matching message and no transaction.
- Given auth succeeds, then I go to `?step=result` (US-TRF-007); given auth fails or is cancelled, I stay on confirm with no transaction.

## UI states

- Empty: amount empty, "Tiếp tục" disabled; message empty is fine (no default for bank transfers; the receipt shows "Chuyển tiền").
- Loading: balance, limit counters and the free-slot count load with the step (skeletons on the balance and fee lines); "Xác nhận" spinner during pre-checks.
- Error: counters or fee fail to load → "Không tính được phí. Thử lại." with "Thử lại"; "Tiếp tục" disabled.
- Blocked: gates #1–#4 checked at entry (rules.md#gates); step-up at confirm (rules.md#step-up); cap and limit are input errors at the amount step, never a failed transaction (object-model.md#transaction-state-machine).
- Overflow: `499.999.999 ₫` plus fee `2.500.000 ₫` and total `502.499.999 ₫` align right in tabular figures at 375px; the 40-character holder name wraps in the confirm row and is never truncated.

## Design notes

- Web (≥ 1024): same layout as US-TRF-004 (max-width 560, bordered card, label/value rows). The fee row is the only place with a secondary note; total row bold with a 1px divider above. Auth as dialog.
- App (< 1024): amount above the numeric keypad (US-FND-002), "Tiếp tục" pinned above it; confirm full-screen with "Xác nhận" pinned to the bottom; auth as bottom sheet.
- Show the cap as helper text under the field before any error ("Tối đa 499.999.999 ₫ mỗi giao dịch"), so the law appears before the user hits it (PRODUCT principle 1).

## FE notes

- Steps `amount`, `confirm`, `auth` of `TransferBankFlow`. `validateTransferAmount` from US-TRF-003 with `perTxMax` from config and `amount + fee` against available.
- `transferFee({ amount, freeSlotsUsed })` → `{ fee, freeLeft }`: pure, TDD (0,5% rounded to nearest 1.000 ₫, min 1.000 ₫, after 5 free; rules.md#fees). Shared with MNY withdraw; if MNY lands first, reuse theirs.
- `freeSlotsUsed` counts this month's `success` and `pending` `withdraw` + `bank_transfer` (failed ones do not consume a slot, rules.md#fees).

## Mock data

- Seed month with 2 slots used so "còn 3 lượt" shows; demo Clock "to next month" resets to 5.
- `near-limit` scenario for the limit message; `rich` for the cap message with a large balance.
