---
id: US-ONB-010
title: Terms and wallet ready
epic: ONB
priority: P0
status: Draft
size: M
routes: ["/onboarding", "/me/sources/link", "/home"]
dependsOn: [US-ONB-009, US-FND-002, US-MNY-002]
---

## Story

As a customer who has finished verification, I want to accept the terms and then see my wallet number and limits with one clear next step, so that I know my wallet exists and that I must link my own bank before I can use it (TT 40 Đ.22 k.1 đ).

## Acceptance criteria

- Given step `terms`, then I see "Điều khoản sử dụng ví", a short summary (wallet use, fees, limits, privacy), the link "Xem toàn bộ điều khoản" opening the full text, and the primary "Đồng ý và mở ví"; pressing it stores `termsAcceptedAt`, sets Wallet `status` to `active`, and goes to `?step=ready`.
- Given step `ready`, then I see "Ví của bạn đã sẵn sàng", the wallet name "Trần Minh Anh", Số ví "0901 234 567", and the block "Hạn mức giao dịch" with "Chuyển tiền và thanh toán" and "Thanh toán thiết yếu (điện, nước…)" each showing its monthly amount from config (rules.md#limits) followed by "/tháng".
- Given step `ready`, then the line "Bạn cần liên kết tài khoản hoặc thẻ ghi nợ đứng tên mình trước khi dùng ví." sits above a single primary "Liên kết ngân hàng" (to `/me/sources/link`, US-MNY-002) and a secondary "Để sau".
- Given I press "Để sau", then I land on `/home`, which shows gate #4 (rules.md#gates).
- Given `kycStatus` is still `verifying` (needs review), then ready also shows the amber line "Hồ sơ đang được kiểm tra, thường xong trong 24 giờ." and both actions remain.
- Given I finish linking from here, then the link flow's result returns me to `/home`, not back into onboarding.

## UI states

- Empty: not applicable.
- Loading: "Đồng ý và mở ví" shows a spinner while the wallet is created.
- Error: wallet creation failure shows "Chưa mở được ví. Thử lại." with "Thử lại" and keeps me on terms.
- Blocked: none.
- Overflow: limit amounts are 13 characters ("300.000.000 ₫") and stay on one line with their label wrapping above at 320px; the full terms view scrolls.

## Design notes

- Web: ready is a single card: success tick, heading, a definition list (Số ví, then the limits as two rows), the requirement line, black pill "Liên kết ngân hàng", text link "Để sau".
- App: same order, pill pinned to bottom with "Để sau" as a text button under it.
- Full terms open as a sheet on app and a dialog on web, with "Đóng".

## FE notes

- `TermsStep`, `ReadyStep`; limit values read from `config.limits.generalMonthly` and `config.limits.essentialMonthly`, formatted with `formatVnd` (US-FND-002), never hard-coded.
- Completing ready sets `customer.onboardingCompletedAt` so the guard in US-ONB-001 stops redirecting.
- The link flow is entered with a return hint so its result goes to `/home` (param name owned by US-MNY-002).

## Mock data

- Persona after onboarding: verified, 0 sources, balance 0 ₫ (same as scenario `no-source` with an empty history).
