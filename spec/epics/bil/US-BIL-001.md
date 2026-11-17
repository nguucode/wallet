---
id: US-BIL-001
title: Bills list with saved bills and biller categories
epic: BIL
priority: P0
status: Draft
size: M
routes: ["/bills"]
dependsOn: [US-FND-001, US-FND-002, US-FND-003, US-SEC-004]
---

## Story

As a wallet user, I want one page that shows my saved bills with what is due first, and the biller categories I can add from, so that I pay electricity on time without hunting for the customer code each month.

## Acceptance criteria

- Given I open `/bills` with saved bills, then I see a "Hóa đơn của tôi" section ordered overdue first, then due (nearest due date first), then settling, then paid; each row shows biller name, holder name, masked customer code (last 4 visible), period ("Kỳ 11/2026"), amount, and a status chip: "Quá hạn", "Sắp đến hạn", "Đang xử lý", or "Đã thanh toán".
- Given a bill is `due` or `overdue`, then the row shows "Hạn 20/11/2026" and a pill button "Thanh toán" that opens `/bills/:billId`; tapping elsewhere on the row also opens `/bills/:billId`.
- Given a bill is `overdue`, then the due line reads "Quá hạn 2 ngày" in danger text and the chip is "Quá hạn".
- Given a bill is `settling`, then the row shows "Đang xử lý" in amber with the line "Nhà cung cấp đang xác nhận thanh toán" and no pay button; a `paid` bill shows "Đã thanh toán 05/11/2026" and no pay button.
- Given the "Thêm hóa đơn" section, then I see biller categories as icon tiles: "Điện" enabled, "Nước" and "Internet" visible but disabled with the caption "Sắp có"; tapping "Điện" or the "Thêm hóa đơn" button opens `/bills/new` with the electricity category preselected.
- Given the header, then a summary line reads "2 hóa đơn cần thanh toán · 1.845.000 ₫" summing due and overdue bills; it is hidden when nothing is due.
- Given a wallet gate is active (rules.md#gates, first match wins), when I open `/bills`, then the gate from US-SEC-004 replaces the page content with its single next step, because Bills is a money entry point.

## UI states

- Empty: no saved bills shows an icon, "Chưa có hóa đơn nào được lưu", and the link "Thêm hóa đơn điện"; the category tiles still show below.
- Loading: 2 skeleton rows in the final row layout; category tiles render immediately (static config).
- Error: section error "Không tải được hóa đơn." with "Thử lại"; category tiles stay usable.
- Blocked: gates #1–#4 from rules.md#gates via US-SEC-004, shown in place of the list.
- Overflow: holder name "Nguyễn Hoàng Phương Thảo Nguyệt Quỳnh Như" wraps to two lines then truncates with the full name in the row's accessible name; biller "Điện lực Tây Hồ Xanh" never truncates; amount `128.450.000 ₫` stays on one line, right-aligned in tabular figures; 10 saved bills render without pagination.

## Design notes

- Web (≥ 1024): content column, H1 "Hóa đơn", summary line under it, then "Hóa đơn của tôi" as one 1px bordered card with divider rows (biller, holder, code, period left; amount and chip right; "Thanh toán" pill at the far right). "Thêm hóa đơn" below as a row of 48px circular icon tiles with labels, following the "Truy cập nhanh" strip grammar in the PayPal style study.
- App (< 1024): header "Hóa đơn" with back to Home; rows stack biller and holder on two lines, amount and chip on the right, the pay button moves to a full-width row action only for due/overdue; category tiles become a horizontal row. Touch targets 48px.
- Status uses dot + label, never colour alone: overdue danger, due accent, settling amber, paid neutral muted. One accent for the pay button outline; black pill only on the page's primary "Thêm hóa đơn".

## FE notes

- `BillsPage` with `SavedBillRow`, `BillerCategoryTiles`; reuses `formatMoney` and `formatDate` (US-FND-002) and `GateGuard` (US-SEC-004).
- `store.bills.listSaved()` returns SavedBills with their current Bill; `sortBills(bills, today)` and `billStatusLabel(bill, today)` are pure functions to TDD (overdue days count in Asia/Ho_Chi_Minh calendar days).
- Categories come from `config.billerCategories` with a `priority` flag; P1 ones render disabled. Enhanced by BIL P1: Water and internet billers.

## Mock data

- Seed: the two saved electricity bills (one due in 3 days, one paid) plus the `settling` bill edge case from ia/mock-data.md.
- Overdue is reached with the Clock demo control (+1 day until past the due date), not seeded.
- Billers: Điện lực Hồng Hà, Điện lực Đông Phố, Điện lực Tây Hồ Xanh; amounts 450.000–1.400.000 ₫.
