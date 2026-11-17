---
id: US-ONB-006
title: Verify identity with VNeID
epic: ONB
priority: P0
status: Draft
size: S
routes: ["/onboarding"]
dependsOn: [US-ONB-004]
---

## Story

As a customer without NFC (or on the web), I want to share my identity from my VNeID level-2 account, so that I can open the wallet without reading the chip.

## Acceptance criteria

- Given step `vneid` on the app layout, then I see "Xác thực qua VNeID", the body "Bạn sẽ được chuyển sang ứng dụng VNeID để đồng ý chia sẻ thông tin định danh với Wallet. Cần tài khoản định danh điện tử mức 2.", and the primary "Mở VNeID".
- Given step `vneid` on the web layout, then the primary is replaced by a QR with "Quét mã bằng ứng dụng VNeID trên điện thoại" and a 3-minute countdown "Mã hết hạn sau 02:59"; an expired QR shows "Mã đã hết hạn" with "Tạo mã mới".
- Given I press "Mở VNeID" (app) or the QR is shown (web), then a panel labelled "Mô phỏng ứng dụng VNeID" offers "Đồng ý chia sẻ" and "Từ chối".
- Given I choose "Đồng ý chia sẻ", then I see "Thông tin từ VNeID" with the same rows as the chip read (name, masked CCCD, ngày sinh, ngày hết hạn) and "Xác nhận" goes to `?step=face`.
- Given I choose "Từ chối", then I see "Bạn chưa đồng ý chia sẻ thông tin trên VNeID." with "Thử lại" and "Chọn cách khác" (back to `id-method`).

## UI states

- Empty: intro with "Mở VNeID".
- Loading: "Đang chờ xác nhận từ VNeID…" with a spinner while the simulated hand-off is open.
- Error: declined as above; QR expired as above.
- Blocked: none.
- Overflow: long names wrap in the data list as in US-ONB-005.

## Design notes

- Web: QR 200px in the onboarding card, countdown below in tabular figures; the simulation panel opens as a dialog clearly marked as simulated.
- App: hand-off screen full height; the simulation panel is a bottom sheet with its own neutral header so it never looks like Wallet UI.
- No VNeID logo; the name is text only.

## FE notes

- `VneidStep`; `useSimulatedHandoff('vneid')` returns `approved | declined`. The data confirmation list is the shared `IdentitySummary` component from US-ONB-005.
- Sets `customer.kycMethod = 'vneid'`.

## Mock data

- Same persona identity record as US-ONB-005.
