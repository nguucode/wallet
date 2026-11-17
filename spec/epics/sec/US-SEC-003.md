---
id: US-SEC-003
title: Required-auth rule with configurable thresholds
epic: SEC
priority: P0
status: Draft
size: S
routes: ["/me/limits"]
dependsOn: []
---

## Story

As a wallet user, I want the wallet to ask for face match exactly when the rules require it and PIN otherwise, and to tell me which one before I confirm, so that I am never surprised by a stricter check or protected by a weaker one.

## Acceptance criteria

- Given the step-up table in rules.md#step-up, when `requiredAuth(type, amount, dayCounter, config?)` is called, then it returns `'pin'` or `'face_match'` exactly as in the test table below with the default config.
- Given `topup`, `withdraw`, `p2p_out` or `bank_transfer`, then it returns `face_match` when `amount` exceeds the per-transaction threshold **or** `dayCounter + amount` exceeds the daily threshold, and `pin` otherwise; equality returns `pin`.
- Given `qr_merchant` or `bill`, then `dayCounter` is ignored and it returns `face_match` only when `amount` exceeds the payment threshold.
- Given a config with different thresholds, then results follow the config with no code change.
- Given `p2p_in` or `refund`, or an amount that is not a positive integer, then it throws (incoming money is never authorised by the user).
- Given `dayCounter(transactions, now)`, then it sums today's (Asia/Ho_Chi_Minh) `success` and `pending` `topup`, `withdraw`, `p2p_out`, `bank_transfer` approved by `pin` or `device_biometric` created after the latest face-matched transaction of today, excluding `failed`; it is 0 at midnight.
- Given device biometric replaces PIN (rules.md#step-up), then `requiredAuth` still returns `pin`; the sheet (US-SEC-001) decides whether to offer device biometric.

Default config (`src/config/rules.ts`, values from rules.md#step-up): `stepUp.perTransaction = 10.000.000`, `stepUp.perDay = 20.000.000`, `stepUp.payment = 100.000.000`.

`requiredAuth` test table:

| # | type | amount | dayCounter | expected | case |
|---|---|---|---|---|---|
| 1 | topup | 2.000.000 | 0 | pin | own source, under both thresholds |
| 2 | topup | 10.000.000 | 0 | pin | equal to per-transaction threshold |
| 3 | topup | 10.000.001 | 0 | face_match | above per-transaction threshold |
| 4 | withdraw | 5.000.000 | 15.000.000 | pin | day total exactly 20.000.000 |
| 5 | withdraw | 5.000.000 | 15.000.001 | face_match | day total above daily threshold |
| 6 | p2p_out | 3.000.000 | 18.000.000 | face_match | small amount, day total 21.000.000 |
| 7 | p2p_out | 1 | 0 | pin | smallest amount |
| 8 | bank_transfer | 9.999.999 | 10.000.000 | pin | day total 19.999.999 |
| 9 | bank_transfer | 10.000.001 | 0 | face_match | above per-transaction threshold |
| 10 | bank_transfer | 499.999.999 | 0 | face_match | bank transfer cap |
| 11 | qr_merchant | 100.000.000 | 19.000.000 | pin | equal to payment threshold, dayCounter ignored |
| 12 | qr_merchant | 100.000.001 | 0 | face_match | above payment threshold |
| 13 | bill | 45.000.000 | 50.000.000 | pin | dayCounter ignored for bills |
| 14 | bill | 100.000.001 | 0 | face_match | above payment threshold |
| 15 | p2p_in | 1.000.000 | 0 | throws | incoming, no user auth |
| 16 | refund | 1.000.000 | 0 | throws | incoming, no user auth |
| 17 | topup | 0 | 0 | throws | non-positive amount |
| 18 | p2p_out | 6.000.000 | 0 | face_match | config override `perTransaction = 5.000.000` |

`dayCounter` test cases: (a) two PIN `p2p_out` of 4.000.000 today → 8.000.000; (b) add a `failed` `bank_transfer` of 5.000.000 → unchanged; (c) a face-matched `withdraw` at 10:00 then a PIN `topup` of 1.000.000 at 11:00 → 1.000.000; (d) a PIN `p2p_out` at 23:30 yesterday (16:30 UTC) → 0; (e) a `qr_merchant` and a `bill` today → excluded; (f) a `pending` PIN `bank_transfer` → included; (g) a `device_biometric` `p2p_out` → included.

## UI states

- Empty: not applicable (pure functions).
- Loading: not applicable.
- Error: throws as above; callers never pass incoming types.
- Blocked: none here; gates (rules.md#gates, US-SEC-004) run before `requiredAuth` is consulted.
- Overflow: not applicable.

## Design notes

- No screen of its own. Its output is the auth line on the confirm step (US-FND-007) and the explanation on the limits screen (US-SEC-005), identical copy on web and app. `authReason(type, amount, dayCounter)` returns which threshold triggered, so copy can say "trên 10.000.000 ₫" or "tổng giao dịch hôm nay vượt 20.000.000 ₫".

## FE notes

- `src/rules/stepUp.ts`: `requiredAuth`, `authReason`, `dayCounter`. Write the table above as `it.each` first (the first TDD seam of the project), then the implementation.
- Config type `StepUpConfig` exported; the limits screen and seed generator (US-FND-008) import the same config object.

## Mock data

- None in the store; the seed generator uses these functions to assign `authMethod` to every seeded transaction.
