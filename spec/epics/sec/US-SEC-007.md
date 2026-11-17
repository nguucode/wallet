---
id: US-SEC-007
title: Change PIN
epic: SEC
priority: P0
status: Draft
size: M
routes: ["/me/security"]
dependsOn: [US-SEC-006, US-SEC-001, US-FND-003]
---

## Story

As a wallet user, I want to change my PIN after confirming the current one, so that I can replace a PIN I think someone has seen.

## Acceptance criteria

- Given I press "Đổi mã PIN" on `/me/security`, then a sheet (app) or dialog (web) "Đổi mã PIN" opens at "Nhập mã PIN hiện tại", using the same dots and keypad as US-SEC-001.
- Given a wrong current PIN, then "Mã PIN không đúng. Còn 4 lần thử." is shown and the attempt counts against the same counter and lock as transactions (rules.md#step-up).
- Given a correct current PIN, then it moves to "Nhập mã PIN mới", then "Nhập lại mã PIN mới".
- Given the new PIN equals the current one, then it shows "Mã PIN mới phải khác mã PIN hiện tại." and returns to "Nhập mã PIN mới".
- Given the confirmation does not match, then it shows "Mã PIN nhập lại không khớp." and returns to "Nhập mã PIN mới".
- Given the confirmation matches, then the PIN is saved, the sheet closes, a toast reads "Đã đổi mã PIN", and a `security` notification "Mã PIN đã được thay đổi" is created.
- Given I cancel at any step, then the PIN is unchanged.

## UI states

- Empty: six empty dots at each step.
- Loading: dots pulse while the store verifies or saves.
- Error: messages above; a save failure shows "Không đổi được mã PIN. Mã PIN cũ vẫn dùng được." and closes.
- Blocked: PIN lock (US-SEC-001) shows the locked state at the first step. Gates do not apply.
- Overflow: not applicable; copy fits at 320px.

## Design notes

- Same sheet/dialog grammar as US-SEC-001 on both layouts; a three-dot step indicator under the title; no summary line.

## FE notes

- Reuse `pinReducer` and the keypad from US-SEC-001; `changePinReducer` (current → new → confirm → done) TDD-tested for the mismatch and same-PIN cases.
- `store.auth.changePin(current, next)` re-verifies the current PIN server-side style; stored PIN never leaves the store module.

## Mock data

- Seed PIN `123456`; "Đặt lại dữ liệu" restores it.
