---
id: US-HIS-001
title: History list with filters and saved views
epic: HIS
priority: P0
status: Draft
size: M
routes: ["/history"]
dependsOn: [US-FND-001, US-FND-002, US-FND-003]
---

## Story

As a wallet user, I want every transaction in one list, newest first, with quick views for money in, money out, pending and failed, so that I can find any payment and never miss one that is stuck or did not go through.

## Acceptance criteria

- Given I open `/history`, then I see saved view tabs "Tất cả" (default), "Tiền vào", "Tiền ra", "Đang xử lý", "Không thành công", and filters "Tháng", "Loại giao dịch", "Trạng thái"; the active view and filters are kept in the URL so a reload or shared link restores them.
- Given "Tất cả", then pending and failed transactions are listed in their place by time, never hidden or collapsed (rules.md#history-and-support); "Tiền vào" lists `direction: in` and "Tiền ra" lists `direction: out`, both including pending and failed rows.
- Given each row, then it shows a type icon, counterparty name, type label, time, signed amount ("+2.000.000 ₫" for in, "−845.000 ₫" for out), and a status chip only when not success: "Đang xử lý", "Không thành công", or "Đã hoàn tiền"; a failed row's amount is struck through in muted text because no money moved.
- Given the web layout, then rows are a table grouped by month with a header row "Tháng 11/2026 · Vào +12.500.000 ₫ · Ra −8.340.000 ₫" (success and pending only); given the app layout, then rows are a list grouped by day with headers "Hôm nay", "Hôm qua", then "15/11/2026".
- Given about 260 transactions, then 50 rows load first and "Xem thêm" loads the next 50 until the end, where the list shows "Đã hiển thị tất cả giao dịch".
- Given I tap or click a row, then I go to `/history/:txId`, and Back returns me to the same scroll position with filters intact.
- Given filters match nothing, then the list shows "Không có giao dịch phù hợp" with the button "Xóa bộ lọc".

## UI states

- Empty: a wallet with no transactions (`new` scenario after onboarding) shows "Chưa có giao dịch nào" and the link "Nạp tiền vào ví".
- Loading: 8 skeleton rows in the final layout; tab labels render immediately.
- Error: list-area error "Không tải được lịch sử giao dịch." with "Thử lại".
- Blocked: none; viewing history is never blocked (rules.md#gates).
- Overflow: about 260 rows over 12 months; counterparty "Nguyễn Hoàng Phương Thảo Nguyệt Quỳnh Như" truncates to one line with the full name in the accessible name; amounts like `−128.450.000 ₫` stay on one line, right-aligned in tabular figures; a month with 60 rows keeps its header sticky while scrolling.
- Filtered: chips for each active filter with a remove "×", and "Xóa bộ lọc".

## Design notes

- Web (≥ 1024): H1 "Lịch sử", tabs as pill chips under it, filter dropdowns on the right of the same row; table columns Ngày, Giao dịch (counterparty over type label), Trạng thái, Số tiền; month header as a full-width muted row. 1px dividers, no zebra, no shadow.
- App (< 1024): header "Lịch sử" with tabs as a horizontal scrolling chip row with peek; filters open in a bottom sheet behind a "Bộ lọc" button with a count badge; rows 64px with a 40px circular type icon; the tab bar stays visible.
- Amount sign and colour: in uses the success text colour with "+", out uses default text with "−"; status chips are dot + label (pending amber, failed danger, refunded neutral).

## FE notes

- `HistoryPage` with `SavedViewTabs`, `HistoryFilters`, `HistoryTable` (web) and `HistoryDayList` (app) chosen by the layout hook from US-FND-001.
- Query params: `tab`, `month` (`2026-11`), `type`, `status`. `view` is not used because rules.md reserves `?view=` for sub-views like `statement`.
- Pure functions to TDD: `filterTransactions(txs, { tab, month, type, status })`, `groupByMonth`, `groupByDay(txs, today)` (Asia/Ho_Chi_Minh), `monthTotals` (excludes failed).
- Type labels (to be added to object-model.md): Nạp tiền, Rút tiền, Chuyển đến ví, Nhận tiền, Chuyển đến ngân hàng, Thanh toán, Hóa đơn, Hoàn tiền.
- Enhanced by HIS P1: Free-text search in history; Monthly statement.

## Mock data

- About 260 transactions over 12 months from the seed, plus the hand-made edge cases: pending `bank_transfer` (20 minutes ago), failed `bank_transfer` (timeout_reversed), refunded `qr_merchant` with its `refund` row, settling `bill`.
- `new` scenario for the empty state.
