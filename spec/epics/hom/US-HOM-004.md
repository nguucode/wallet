---
id: US-HOM-004
title: Bills due section
epic: HOM
priority: P0
status: Draft
size: S
routes: ["/home", "/bills", "/bills/:billId"]
dependsOn: [US-HOM-001, US-FND-002]
---

## Story

As a wallet user, I want Home to show the bills I need to pay soon, so that I pay electricity on time without opening the bills page.

## Acceptance criteria

- Given saved bills with status `due` and a due date within the next 7 days, or status `overdue`, then the section "Hóa đơn sắp đến hạn" lists them, overdue first, then by due date.
- Given a row, then it shows the biller name, the customer code, the amount, and "Hạn 20/11/2026"; an overdue bill shows "Quá hạn 2 ngày" in danger text.
- Given I press a row's "Thanh toán", then I go to `/bills/:billId` (the bill detail and its pay flow).
- Given bills that are `paid` or `settling`, then they do not appear here.
- Given no bill qualifies, then the section is omitted; the header link "Xem tất cả" to `/bills` appears only when the section shows.

## UI states

- Empty: section omitted.
- Loading: one skeleton row.
- Error: the section is omitted and a quiet "Chưa tải được hóa đơn." with "Thử lại" shows in its place.
- Blocked: none to view; paying is gated at entry by US-SEC-004 when the user presses "Thanh toán" (gates #1–#4).
- Overflow: biller name "Điện lực Tây Hồ Xanh" plus a long holder name wrap to two lines; amounts up to `1.400.000 ₫` right-aligned in tabular figures; more than 3 bills shows 3 and "Xem tất cả".

## Design notes

- Web: a bordered card with rows separated by 1px rules; amount right, small pill "Thanh toán" right of it.
- App: same card full width; the row itself is the tap target to `/bills/:billId`, with the amount and due line under the biller name.
- Biller avatar is a neutral monogram in a 40px circle; no biller logos.

## FE notes

- `selectBillsDue(state, today)` pure; TDD the 7-day window, overdue ordering, and exclusion of `paid` and `settling`.
- Clock comes from the mock store so Demo control "Clock" moves bills into the window.

## Mock data

- Two saved electricity bills: one due in 3 days (shows), one paid (hidden); the `settling` bill (hidden).
