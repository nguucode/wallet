---
id: US-ONB-002
title: Phone number and OTP
epic: ONB
priority: P0
status: Draft
size: M
routes: ["/onboarding"]
dependsOn: [US-ONB-001, US-FND-002]
---

## Story

As a new customer, I want to register with my phone number and confirm it with a one-time code, so that the number I own becomes my wallet number.

## Acceptance criteria

- Given step `phone`, then I see the heading "Nhập số điện thoại", a phone input formatted live as `0901 234 567` (rules.md#spec-conventions), the helper "Số điện thoại này sẽ là số ví của bạn.", and "Tiếp tục" disabled until 10 digits starting with 0 are entered.
- Given I enter a number that is not a valid Vietnamese mobile number, when I leave the field or press "Tiếp tục", then the inline error reads "Số điện thoại không hợp lệ".
- Given I press "Tiếp tục" with a valid number, then I go to `?step=otp`, which shows "Nhập mã OTP" and "Mã gồm 6 số đã gửi đến 0901 234 567", six digit boxes, and a "Đổi số điện thoại" link back to `phone`.
- Given the demo, then under the boxes a simulation note reads "Mô phỏng: mã OTP là 123456".
- Given I type the sixth digit, then the code is checked without pressing a button; a correct code goes to `?step=pin`.
- Given a wrong code, then the boxes clear and the error reads "Mã OTP không đúng. Còn 4 lần thử."; when attempts reach 0, the message is "Bạn đã nhập sai quá số lần cho phép. Hãy gửi lại mã." and only "Gửi lại mã" is available.
- Given the code was sent, then "Gửi lại mã sau 00:59" counts down and becomes the link "Gửi lại mã"; after the configured expiry (TT 50 Đ.11 caps it at 5 minutes) a correct but old code shows "Mã OTP đã hết hạn. Hãy gửi lại mã."

## UI states

- Empty: phone input with placeholder `0901 234 567`.
- Loading: "Tiếp tục" shows a spinner while the store "sends" the code; OTP boxes are read-only while checking.
- Error: as above; a store failure shows "Chưa gửi được mã. Thử lại sau ít phút." with "Thử lại".
- Blocked: none.
- Overflow: the masked number in the OTP subtitle never wraps mid-group; 320px fits six 44px boxes with 8px gaps.

## Design notes

- Web: inputs inside the onboarding card, OTP boxes 48px square; keyboard digits and paste of a 6-digit code fill all boxes.
- App: numeric keyboard (`inputmode="numeric"`, `autocomplete="one-time-code"`), primary pill pinned above the keyboard.
- Errors in danger text under the field, never as a toast.

## FE notes

- Reuse `PhoneInput` and `formatPhone` from US-FND-002.
- `store.onboarding.sendOtp(phone)` and `verifyOtp(code)`; attempts, resend cooldown, and expiry come from config (`otp.attempts`, `otp.resendSeconds`, `otp.ttlSeconds`). `otpState` reducer is pure; TDD wrong / expired / exhausted.

## Mock data

- Accepted code `123456`; any other code is wrong. Persona phone `0901 234 567`.
