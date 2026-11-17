---
id: US-SEC-006
title: Security settings with device biometric toggle
epic: SEC
priority: P0
status: Draft
size: S
routes: ["/me/security"]
dependsOn: [US-FND-001, US-SEC-001]
---

## Story

As a wallet user on my phone, I want to turn on Face ID or fingerprint for everyday payments and find where to change my PIN, so that small payments are quick without weakening the checks for large ones.

## Acceptance criteria

- Given I open `/me/security`, then I see H1 "Bảo mật" with two rows: "Mã PIN" with action "Đổi mã PIN" (US-SEC-007), and "Sinh trắc học thiết bị" with a switch and the line "Dùng Face ID hoặc vân tay thay mã PIN cho giao dịch không cần xác thực khuôn mặt."
- Given the app layout and the switch off, when I turn it on, then the PIN sheet opens with summary "Bật sinh trắc học thiết bị"; on success the switch is on, a toast reads "Đã bật sinh trắc học thiết bị", and a `security` notification is created.
- Given the switch on, when I turn it off, then it turns off immediately without auth, with toast "Đã tắt sinh trắc học thiết bị" and a `security` notification.
- Given the PIN sheet is cancelled or locked, then the switch stays off.
- Given the web layout, then the biometric row shows "Chỉ có trên ứng dụng điện thoại" with a link "Xem trên điện thoại" → `/device?path=/me/security`, and no switch (rules.md#step-up).
- Given P1 items (devices, lock wallet), then no rows or disabled tiles are shown for them.

## UI states

- Empty: not applicable.
- Loading: rows render with the switch in a skeleton state until settings load.
- Error: if saving fails, the switch reverts and shows "Không lưu được. Thử lại."
- Blocked: PIN lock (US-SEC-001) blocks turning the switch on; the row shows "Mã PIN đang tạm khóa đến 14:35". Gates do not apply (not a money action).
- Overflow: row descriptions wrap to two lines at 320px; the switch stays vertically centred.

## Design notes

- Web: content column, one 1px bordered card with rows separated by 1px dividers, each row 64px min with icon in a 48px neutral circle, label 14px bold, description 12px muted.
- App: grouped list under header "Bảo mật", same rows, 48px switch target.

## FE notes

- `store.settings.deviceBiometric: boolean` (per current device; object model has no Device fields yet, reported gap). `AuthSheet` reads it.
- Switch is a Radix `Switch` with `aria-describedby` on the description.

## Mock data

- Seed: biometric off. Test in `/device` (on) and web (unavailable row).
