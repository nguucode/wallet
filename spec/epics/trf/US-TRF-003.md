---
id: US-TRF-003
title: Wallet transfer amount and message
epic: TRF
priority: P0
status: Draft
size: S
routes: ["/transfer/wallet"]
dependsOn: [US-TRF-002, US-FND-002, US-FND-007, US-SEC-005]
---

## Story

As a wallet user, I want to enter the amount and a short message and learn right there if my balance or monthly limit is not enough, so that I never reach confirm with a transfer that cannot go through.

## Acceptance criteria

- Given I selected a recipient, when I open `?step=amount`, then I see the recipient (name + phone), an amount field labelled "Số tiền" with the live-formatted value (`1.250.000 ₫`), the line "Số dư khả dụng: 3.480.000 ₫", and a "Lời nhắn" field prefilled with "Trần Minh Anh chuyển tiền" (rules.md#money-rules default).
- Given the amount exceeds my available balance, then the field shows "Số dư khả dụng không đủ." with the link "Nạp tiền" (to `/topup`), and "Tiếp tục" is disabled.
- Given the amount would push my general monthly counter past the limit (rules.md#limits), then the field shows "Vượt hạn mức tháng. Bạn còn chuyển được 2.500.000 ₫ trong tháng này." with the link "Xem hạn mức" (to `/me/limits`), and "Tiếp tục" is disabled. The remaining figure comes from LimitCounters, never a hard-coded number.
- Given the message, then it accepts Vietnamese diacritics, shows a counter "26/50", and stops accepting input at 50 characters (rules.md#money-rules); clearing it is allowed and the transfer then carries the default message.
- Given the amount is empty or 0, then "Tiếp tục" is disabled; given it is valid, when I tap "Tiếp tục", then I go to `?step=confirm` with amount and message in the draft.
- Given the scenario `near-limit`, when I enter `5.000.000`, then the limit message appears with "2.500.000 ₫" remaining.

## UI states

- Empty: amount field empty with placeholder "0 ₫"; "Tiếp tục" disabled.
- Loading: available balance and limit counters load with the step; the balance line shows a short skeleton and validation waits for both before enabling "Tiếp tục".
- Error: counters fail to load → "Không kiểm tra được hạn mức. Thử lại." with "Thử lại"; "Tiếp tục" stays disabled (never let an unchecked amount through).
- Blocked: gates were checked at entry (US-TRF-002); if a gate becomes active mid-flow (demo scenario switch), the gate overlay replaces the step (rules.md#gates).
- Overflow: amount `128.450.000 ₫` fits the field at 375px without shrinking below the display minimum; a 50-character message with stacked diacritics ("Gửi Nguyệt Quỳnh tiền mừng tân gia, chúc mọi điều…") wraps to two lines, counter stays visible.

## Design notes

- Web (≥ 1024): content column, max-width 560. Recipient chip at top (avatar + name + phone, "Đổi" link back to recipient). Amount as a large display input (40px, tabular figures, negative letter-spacing per the style study), centred, with the balance line under it. Message field below. Pill "Tiếp tục" right-aligned at the bottom of the card.
- App (< 1024): full-screen; recipient row under the header; the amount display sits above the on-screen numeric keypad from US-FND-002 (no system keyboard). The message field opens the text keyboard and pushes the keypad away. "Tiếp tục" is a full-width pill pinned above the keypad, 48px.
- Validation messages sit directly under the amount, danger text for the limit and balance cases, each with its one link.

## FE notes

- Step `amount` of `TransferWalletFlow`. Uses `AmountInput` from US-FND-002.
- `validateTransferAmount({ amount, available, limitRemaining, perTxMax? })` → `ok | empty | insufficient | over_limit | over_cap`: pure, TDD; reused by US-TRF-006 (with `perTxMax`) and PAY. If FND or SEC already exports an equivalent, use theirs.
- `limitRemaining` from the LimitCounters selector behind US-SEC-005 (general limit, counts `p2p_out`, pending included, failed excluded: rules.md#limits).
- Message trimmed; empty → default "<Customer name> chuyển tiền" applied at submit, not stored in the field.

## Mock data

- Persona balance in `ready` covers a 2.000.000–5.000.000 family transfer.
- `near-limit` scenario (97.5tr of 100tr general) for the limit message; `rich` for the 12-character amount.
