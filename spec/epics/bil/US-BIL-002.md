---
id: US-BIL-002
title: Add a bill by customer code
epic: BIL
priority: P0
status: Draft
size: M
routes: ["/bills/new"]
dependsOn: [US-FND-001, US-FND-003, US-SEC-004, US-BIL-001]
---

## Story

As a wallet user, I want to add my electricity bill by picking the biller and typing the customer code from my paper bill, so that the wallet finds this month's amount for me and remembers it for next time.

## Acceptance criteria

- Given I open `/bills/new?step=biller`, then I see the electricity billers as a list (name and a neutral monogram); choosing one goes to `?step=customer-code`.
- Given the customer-code step, then the field "Mã khách hàng" shows the chosen biller above it, the helper "Mã in ở góc trên hóa đơn tiền điện, ví dụ HH01234567890", and accepts letters and digits only, uppercased as I type.
- Given the code does not match the biller's format, when I tap "Tra cứu", then the field shows "Mã khách hàng không đúng định dạng" inline and no lookup runs.
- Given a valid code, when I tap "Tra cứu", then the button shows "Đang tra cứu…" and on success `?step=lookup` shows a card with holder name, address line, period, amount, and due date, plus "Lưu và thanh toán" (primary) and "Chỉ lưu" (secondary).
- Given the lookup step, when I tap "Lưu và thanh toán", then the bill is saved and I go to `/bills/:billId`; "Chỉ lưu" saves and returns to `/bills` with the toast "Đã lưu hóa đơn".
- Given the lookup finds the customer but no unpaid period, then the card shows "Không có hóa đơn cần thanh toán kỳ này" and only "Lưu hóa đơn" is offered.
- Given the lookup fails, then the customer-code step shows inline, without leaving the step: not found "Không tìm thấy mã khách hàng tại Điện lực Hồng Hà", biller down "Nhà cung cấp đang tạm gián đoạn, vui lòng thử lại sau", or already saved "Hóa đơn này đã có trong danh sách" with the link "Xem hóa đơn".
- Given I reload any step without the in-memory draft, then I land on `?step=biller` (rules.md#spec-conventions).

## UI states

- Empty: none; the biller list is static config.
- Loading: the lookup button is disabled with a spinner and "Đang tra cứu…"; the field stays readable.
- Error: the three lookup errors above; a network error shows "Không tra cứu được. Thử lại" with retry.
- Blocked: gates #1–#4 from rules.md#gates via US-SEC-004 at entry, before the biller step. Adding a bill moves no money, but it is reached only through the Bills entry point.
- Overflow: holder name "Nguyễn Hoàng Phương Thảo Nguyệt Quỳnh Như" and a 60-character Vietnamese address wrap in the lookup card; amount `128.450.000 ₫` fits on one line at 375px.

## Design notes

- Web (≥ 1024): flow page in the content column, max-width 560 (sitemap.yaml layouts), step title as H1 ("Chọn nhà cung cấp", "Nhập mã khách hàng", "Thông tin hóa đơn"), back link above; lookup result as one 1px bordered card, amount as the largest text on the card.
- App (< 1024): full-screen flow, tab bar hidden, header with back and step title; the "Tra cứu" pill is pinned above the keyboard; the code field uses `inputmode="text"` with `autocapitalize="characters"`.
- Billers as 48px rows with a neutral circular monogram; no logos (PRODUCT.md brand commitments).

## FE notes

- Route `/bills/new?step=biller|customer-code|lookup`; draft in a flow store, cleared on save or leave.
- `isValidCustomerCode(billerId, code)` is a pure function to TDD against each biller's `customerCodeFormat`.
- `store.bills.lookup(billerId, code)` resolves to `{ ok, bill } | { error: 'not_found' | 'no_unpaid' | 'biller_unavailable' | 'already_saved' }` after store latency (US-FND-003); `store.bills.save(lookupResult)` returns the new SavedBill id.

## Mock data

- Each biller has a format: 2-letter prefix + 11 digits (Hồng Hà `HH`, Đông Phố `DP`, Tây Hồ Xanh `TX`).
- Reserved codes so a reviewer can reach every outcome, listed under the field as "Mã mẫu" with the Dữ liệu mẫu badge: `HH00000000404` not found, `HH00000000000` no unpaid period, `DP00000000503` biller unavailable; any other valid code returns a generated bill for the persona's address. The two seeded codes return already saved.
