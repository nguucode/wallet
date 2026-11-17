---
id: US-SEC-001
title: Step-up auth sheet with PIN
epic: SEC
priority: P0
status: Draft
size: M
routes: ["/topup", "/transfer/wallet", "/pay/merchant"]
dependsOn: [US-FND-001, US-FND-003]
---

## Story

As a wallet user, I want to approve each money action with my 6-digit PIN (or my phone's biometric when I turned it on) in a sheet that tells me what I am approving, so that no one else can move my money and I never approve the wrong thing.

## Acceptance criteria

- Given a flow calls `requestAuth({ required: 'pin', summary })`, then a sheet (app) or dialog (web) titled "Xác thực giao dịch" opens with the summary line (for example "Chuyển 2.000.000 ₫ đến Lê Thu Hà"), "Nhập mã PIN" and six empty dots.
- Given the app layout, then a custom numeric keypad (1–9, 0, delete) is shown and the system keyboard is not; given the web layout, then the six digits are typed on the physical keyboard into a single masked field, and the same keypad is also clickable.
- Given I enter the 6th digit, then the PIN is checked without a submit button; a correct PIN resolves `{ method: 'pin' }` and closes the sheet.
- Given a wrong PIN, then the dots clear and "Mã PIN không đúng. Còn 4 lần thử." is shown, counting down from the configured maximum (rules.md#step-up); attempts persist across sheets until a correct PIN.
- Given the last attempt fails, then the sheet shows "Bạn đã nhập sai mã PIN quá nhiều lần. Thử lại sau 14:35." (lock time = now + configured lock duration), the keypad is disabled, and `requestAuth` rejects with `locked`; any sheet opened before that time shows the same locked state.
- Given device biometric is enabled (US-SEC-006), the app layout, and `required` is `pin`, then the sheet first shows "Dùng sinh trắc học thiết bị" (simulated prompt) with "Nhập mã PIN" as fallback; success resolves `{ method: 'device_biometric' }`. On web it is never offered.
- Given `required` is `face_match`, then the same sheet hosts the face step instead (US-SEC-002); PIN is not asked.
- Given the sheet is open, then there is no "Ghi nhớ mã PIN" option anywhere, and "Hủy" or Escape or swipe-down rejects with `cancelled` and creates nothing.

## UI states

- Empty: six empty dots.
- Loading: after the 6th digit, dots pulse for the store latency while the PIN is verified; keypad disabled.
- Error: wrong PIN and locked states above; a store failure shows "Không xác thực được. Thử lại." and keeps the attempt count unchanged.
- Blocked: PIN lock (rules.md#step-up) blocks every PIN-approved action until the lock time; gates (rules.md#gates) are checked before the sheet opens, never inside it.
- Overflow: summary with "Nguyễn Hoàng Phương Thảo Nguyệt Quỳnh Như" and "128.450.000 ₫" wraps to two lines above the dots; the keypad never shrinks below 48px keys.

## Design notes

- App: bottom sheet with grab handle, summary at top, dots 14px with 16px gaps, keypad 3×4 of 64px-high keys with no borders, delete as an icon key; safe-area padding.
- Web: centred dialog 400px wide, 1px border, no shadow beyond the overlay scrim; keypad below the field at 48px keys.
- Error text in danger colour under the dots, announced via `aria-live="assertive"`. Dots are `aria-hidden`; an sr-only counter reads "Đã nhập 3 trên 6 số".

## FE notes

- `src/auth/AuthSheet.tsx` mounted once in the shell; `requestAuth()` from `src/auth/requestAuth.ts` returns a Promise and sets `?step=auth` on the current flow while open.
- `store.auth.verifyPin(pin)` compares against the persona's PIN in the store (seed PIN `123456`, shown in Demo controls only); `store.auth.challenge` holds `attemptsLeft` and `lockedUntil` (object-model.md AuthChallenge).
- Config from `src/config/rules.ts`: `pin.length`, `pin.maxAttempts`, `pin.lockMinutes`.
- TDD: `pinReducer(state, event)` for digits, delete, wrong, correct, lock, unlock-by-time.

## Mock data

- Seed PIN `123456`; Demo controls "Đặt lại dữ liệu" clears a lock. Clock "+1 giờ" passes the lock time.
