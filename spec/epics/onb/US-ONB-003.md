---
id: US-ONB-003
title: Create wallet PIN
epic: ONB
priority: P0
status: Draft
size: S
routes: ["/onboarding"]
dependsOn: [US-ONB-002, US-SEC-001]
---

## Story

As a new customer, I want to create a 6-digit PIN and confirm it, so that I can approve my transactions later.

## Acceptance criteria

- Given step `pin`, then I see "Tạo mã PIN", the helper "Mã PIN gồm 6 số, dùng để xác thực giao dịch.", and six empty dots; PIN length is exactly 6 (rules.md#step-up).
- Given I enter 6 digits, then the step advances to "Nhập lại mã PIN" without a button press.
- Given the second entry differs, then the dots shake and clear, the error reads "Mã PIN không khớp. Hãy tạo lại.", and I start again from "Tạo mã PIN".
- Given both entries match, then the PIN is saved and I go to `?step=id-method`.
- Given the step, then a note reads "Không chia sẻ mã PIN với bất kỳ ai, kể cả nhân viên Wallet."; there is no "remember PIN" or "show PIN" option (rules.md#step-up, TT 50 Đ.8 k.5).

## UI states

- Empty: six hollow dots.
- Loading: brief spinner after the confirm entry while saving.
- Error: mismatch as above; a store failure shows "Chưa lưu được mã PIN. Thử lại." and keeps me on the step.
- Blocked: none.
- Overflow: not applicable (fixed-length input).

## Design notes

- Web: dots above a hidden numeric input that takes keyboard digits; Backspace removes the last digit.
- App: the same numeric keypad as the step-up sheet (US-SEC-001), keys 64px, delete key bottom-right.
- Dots announce progress to screen readers: "Đã nhập 3 trên 6 số".

## FE notes

- Reuse `PinKeypad` and `PinDots` from US-SEC-001; store the PIN hash only in mock state (`customer.pinHash`), never the plain value.

## Mock data

- Any 6 digits are accepted; the seeded `ready` scenario uses PIN `123456` for step-up (shown in Demo controls) (US-SEC-001).
