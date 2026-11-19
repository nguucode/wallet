---
id: US-ONB-004
title: Choose identity method and capture the CCCD
epic: ONB
priority: P0
status: Draft
size: M
routes: ["/onboarding"]
dependsOn: [US-ONB-001]
---

## Story

As a customer opening a wallet, I want to choose how my identity is checked and, for the chip path, photograph the front of my CCCD, so that I can complete the biometric check the law requires before I can transact (TT 40 Đ.22 k.1 a–b).

## Acceptance criteria

- Given step `id-method`, then I see "Xác thực sinh trắc học", the body "Theo quy định của Ngân hàng Nhà nước, bạn cần đối chiếu khuôn mặt với dữ liệu trên CCCD gắn chip trước khi dùng ví.", and two option cards: "CCCD gắn chip" with "Chụp CCCD rồi áp vào lưng điện thoại để đọc chip" and "Tài khoản VNeID" with "Dùng tài khoản định danh điện tử mức 2, không cần đọc chip".
- Given the app layout, when I choose "CCCD gắn chip", then I go to `?step=id-capture`; choosing "Tài khoản VNeID" goes to `?step=vneid` (US-ONB-006).
- Given the web layout, then "CCCD gắn chip" is disabled with the reason "Máy tính không đọc được chip CCCD.", and a panel "Mở ví trên điện thoại" explains that reading the chip needs an NFC phone and tells the reviewer to narrow the window below 1024px or open the demo on a phone; VNeID stays available (rules.md#onboarding).
- Given step `id-capture`, then I see "Chụp mặt trước CCCD", a card-shaped guide frame, the tips "Đặt CCCD nằm gọn trong khung, đủ sáng, không bị lóa.", and the shutter button "Chụp".
- Given I press "Chụp", then a preview shows the captured card with "Kiểm tra ảnh: chữ và ảnh chân dung phải rõ nét." and two actions "Dùng ảnh này" (primary, goes to `?step=nfc`) and "Chụp lại".
- Given camera permission is denied, then the step shows "Wallet cần quyền dùng camera để chụp CCCD." with "Thử lại"; in the demo a "Dùng ảnh mẫu" link lets the reviewer continue with the sample card image.

## UI states

- Empty: id-method with neither option selected; id-capture with the live (simulated) viewfinder.
- Loading: a short "Đang xử lý ảnh…" overlay after "Dùng ảnh này".
- Error: permission denied as above. Blur is not detected here; it surfaces as the verification failure "ảnh CCCD mờ" (US-ONB-008).
- Blocked: none.
- Overflow: option card sub-lines wrap to three lines at 320px without truncation.

## Design notes

- Web: the two options are 1px bordered cards with radio semantics, 12px radius; the disabled chip option is muted with its reason visible (not only in a tooltip). The "Mở ví trên điện thoại" panel sits under the options with a phone line icon in a 48px grey circle.
- App: options stacked full width; id-capture is a dark full-bleed camera view with a white card-ratio frame (85.6 × 54 mm) and a 72px round shutter at the bottom.
- Layout, not device detection, decides NFC availability: the app layout (< 1024px) offers the chip path.

## FE notes

- `IdMethodStep` and `IdCaptureStep`; `canReadChip(layout)` returns `layout === 'app'`.
- Camera is simulated: `useSimulatedCamera()` renders a sample frame and returns the bundled sample CCCD image; real `getUserMedia` is not required.

## Mock data

- Sample CCCD front image (fictional data for Trần Minh Anh, number `0**********123`), bundled in `src/mock/assets/`.
