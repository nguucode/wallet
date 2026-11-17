---
id: US-FND-009
title: Fee rule with free monthly slots
epic: FND
priority: P0
status: Draft
size: S
routes: ["/withdraw", "/transfer/bank"]
dependsOn: []
---

## Story

As a wallet user, I want to know before I confirm whether a withdrawal or bank transfer costs anything and how many free ones I have left, so that a fee is never a surprise.

## Acceptance criteria

- Given the fee schedule in rules.md#fees lives in config, when `feeFor(type, amount, usedFreeSlots)` is called, then it returns `{ fee, freeSlotsLeftAfter }` per the cases below with the default config.
- Given `topup`, `p2p_out`, `qr_merchant` or `bill`, then the fee is 0 and the confirm row reads "Miễn phí".
- Given `withdraw` or `bank_transfer` with free slots left, then the fee is 0 and the confirm row reads "Miễn phí (còn 3 lượt trong tháng)", where the number is the slots left after this transaction.
- Given no free slots left, then the fee is 0,5% of the amount rounded to the nearest 1.000 ₫ (half up), minimum 1.000 ₫, shown as "5.000 ₫".
- Given `usedFreeSlots(transactions, now)`, then it counts this calendar month's (Asia/Ho_Chi_Minh) `withdraw` and `bank_transfer` that are not `failed`; failed ones never consume a slot.

| type | amount | usedFreeSlots | fee | freeSlotsLeftAfter |
|---|---|---|---|---|
| topup | 5.000.000 | 5 | 0 | — |
| p2p_out | 2.000.000 | 5 | 0 | — |
| withdraw | 2.000.000 | 0 | 0 | 4 |
| bank_transfer | 2.000.000 | 4 | 0 | 0 |
| bank_transfer | 2.000.000 | 5 | 10.000 | 0 |
| withdraw | 150.000 | 5 | 1.000 | 0 |
| withdraw | 300.000 | 5 | 2.000 | 0 |
| withdraw | 1.234.567 | 5 | 6.000 | 0 |
| bank_transfer | 499.999.999 | 7 | 2.500.000 | 0 |

## UI states

- Empty: not applicable (pure function).
- Loading: not applicable.
- Error: throws on a non-positive or non-integer amount; callers validate first (US-FND-010).
- Blocked: none (pure function; gates run at the flow entry, US-SEC-004).
- Overflow: the largest fee "2.500.000 ₫" fits the confirm row value column.

## Design notes

- Rendered only as the "Phí" row in the confirm step (US-FND-007) on both layouts; a failed transaction's detail shows "Phí đã được hoàn" (rules.md#fees).

## FE notes

- `src/rules/fees.ts`: `feeFor`, `usedFreeSlots`, config in `src/config/rules.ts` (`fees.freeSlotsPerMonth`, `fees.rate`, `fees.roundTo`, `fees.min`). TDD from the table above.

## Mock data

- Current month seeded with 2 non-failed withdraw/bank transfers and the failed `timeout_reversed` one, so the first confirm shows "còn 2 lượt" (3 left before, 2 after).
