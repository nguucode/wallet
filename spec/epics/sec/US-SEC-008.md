---
id: US-SEC-008
title: Profile and verification status
epic: SEC
priority: P0
status: Draft
size: M
routes: ["/me/profile"]
dependsOn: [US-FND-001, US-FND-002, US-FND-003, US-SEC-004]
---

## Story

As a wallet user, I want to see the identity my wallet is registered to and whether it is verified and active, so that I understand why I can or cannot transact and when my ID needs renewing.

## Acceptance criteria

- Given I open `/me/profile`, then I see H1 "Hồ sơ và xác thực" with rows "Họ và tên" ("Trần Minh Anh"), "Số điện thoại" ("0901 234 567"), "Số ví" ("0901 234 567"), "Số CCCD" (masked, first digit and last 3 visible), "Ngày hết hạn CCCD" ("08/12/2026"), "Phương thức xác thực" ("Chip CCCD (NFC)" or "VNeID"), "Trạng thái xác thực" and "Trạng thái ví".
- Given `kycStatus`, then "Trạng thái xác thực" shows "Chưa xác thực", "Đang kiểm tra", "Đã xác thực", "CCCD sắp hết hạn" or "CCCD đã hết hạn" as a dot + label.
- Given `Wallet.status`, then "Trạng thái ví" shows "Đang hoạt động", "Tạm ngừng giao dịch" or "Tạm khóa".
- Given `id_expiring`, then a banner reads "CCCD của bạn hết hạn vào 08/12/2026. Sau ngày này ví sẽ tạm ngừng giao dịch." with no action in P0 (Cập nhật CCCD is P1).
- Given an active gate (US-SEC-004), then the matching gate message and its CTA appear as a card above the rows (for example gate 1 "Xác thực ngay").
- Given the profile fields, then none are editable in P0 (name and ID come from eKYC).

## UI states

- Empty: scenario `unverified` shows "Chưa có" for CCCD rows and "Chưa xác thực".
- Loading: row skeletons.
- Error: "Không tải được hồ sơ." with "Thử lại".
- Blocked: none. Viewing is never gated; the gate card is informational with its CTA.
- Overflow: a 40-character name wraps in the value column; masked CCCD in tabular figures never wraps.

## Design notes

- Web: content column, avatar initials in a 64px neutral circle with name and KYC badge at top, then one 1px bordered card of label/value rows. Web `/me` redirects here (sitemap.yaml).
- App: header "Hồ sơ và xác thực", same card full-width; reached from the Me hub card.
- Status colours: verified neutral-dark check, verifying amber, unverified and expired red text; colour never the only signal.

## FE notes

- `kycStatusLabel`, `walletStatusLabel`, `kycMethodLabel` in `src/lib/labels.ts`, pure and tested; these Vietnamese labels are not yet in the object-model glossary (reported gap).
- `maskId` from US-FND-002.

## Mock data

- Scenarios `ready`, `id-expiring` (expiry in 21 days), `suspended`, `unverified`.
