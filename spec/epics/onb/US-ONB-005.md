---
id: US-ONB-005
title: Read the CCCD chip with NFC
epic: ONB
priority: P0
status: Draft
size: S
routes: ["/onboarding"]
dependsOn: [US-ONB-004]
---

## Story

As a customer on the chip path, I want to hold my CCCD to the phone and see what the chip says about me, so that I can confirm the wallet will be opened in my name.

## Acceptance criteria

- Given step `nfc`, then I see "Đọc chip CCCD", the instruction "Áp CCCD vào mặt lưng điện thoại, gần camera, giữ yên khoảng 30 giây.", an illustration of card on phone back, and the button "Bắt đầu đọc".
- Given I press "Bắt đầu đọc", then a progress ring shows "Đang đọc chip… 45%" and the line "Giữ yên thẻ, đừng nhấc ra." until 100%.
- Given the read completes, then "Thông tin trên chip" lists Họ và tên "TRẦN MINH ANH", Số CCCD "0**********123", Ngày sinh, Ngày hết hạn, with the primary "Xác nhận" (goes to `?step=face`) and the link "Thông tin không đúng?" that returns to `id-method`.
- Given the read stalls (demo: latency set to 3 s or the reviewer cancels), then I see "Chưa đọc được chip. Tháo ốp lưng và giữ thẻ sát mặt lưng điện thoại." with "Đọc lại".
- Given the chip shows an expiry date already in the past, then "Xác nhận" is disabled and the message reads "CCCD đã hết hạn. Bạn cần dùng CCCD còn hạn để mở ví."

## UI states

- Empty: instruction screen before "Bắt đầu đọc".
- Loading: progress ring, 0–100% over a simulated read.
- Error: stalled read as above; the "không đọc được chip" verification failure is shown later by US-ONB-008 and sends me back here.
- Blocked: none.
- Overflow: a 40-character name with stacked diacritics ("NGUYỄN HOÀNG PHƯƠNG THẢO NGUYỆT QUỲNH NHƯ") wraps to two lines in the data list; uppercase diacritics keep enough line-height not to clip.

## Design notes

- App only in practice (web never reaches this step, US-ONB-004); still renders in the web card if opened by URL, with the same content.
- Data list as label/value rows separated by 1px rules; values in medium weight; the CCCD number masked as in object-model.md.
- Progress ring uses the single accent; success tick in the accent, not green.

## FE notes

- `NfcStep` with `useSimulatedNfcRead()` that advances progress on a timer scaled by store latency (US-FND-003) and returns the chip record from the persona.
- `maskIdNumber()` lives with the formatters (US-FND-002 owns the module).

## Mock data

- Persona chip record: name, idNumber, dob, idExpiry (4 years out; past expiry only via a test fixture).
