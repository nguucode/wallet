---
id: US-NTF-001
title: Notifications list with saved views
epic: NTF
priority: P0
status: Draft
size: M
routes: ["/notifications"]
dependsOn: [US-FND-001, US-FND-002, US-FND-003]
---

## Story

As a wallet user, I want one list of everything the wallet told me, filterable by transactions, security and bills, so that I can check every movement of my money and every change to my account in one place.

## Acceptance criteria

- Given I open `/notifications`, then I see H1 "Thông báo", saved views "Tất cả" (default), "Giao dịch", "Bảo mật", "Hóa đơn" from sitemap.yaml, each with its unread count when above 0, and the list newest first grouped by "Hôm nay", "Hôm qua", then "15/11/2026".
- Given the views, then "Giao dịch" shows `balance_change`, "Bảo mật" shows `security`, `new_device_login` and `id_expiring`, "Hóa đơn" shows `bill_due`, and "Tất cả" shows every kind including `support_update`.
- Given a row, then it shows a kind icon, title, body clamped to two lines, time "14:05", and an unread dot with sr-only "Chưa đọc" when unread.
- Given I click or tap a row, then it is marked read and I go to its `link` (for example `/history/WL000000001234`, `/bills/:billId`, `/me/security`, `/me/profile`); a row without a link only marks read.
- Given unread rows in the current view, when I press "Đánh dấu tất cả đã đọc", then every notification in that view is marked read and the badge (US-NTF-002) updates.
- Given the view, then it is kept in the query string (`?view=giao-dich`) so Back and refresh keep it.

## UI states

- Empty: per view, a line icon and "Chưa có thông báo nào" ("Chưa có thông báo giao dịch" in "Giao dịch", similarly for the others); "Đánh dấu tất cả đã đọc" hidden.
- Loading: 8 row skeletons; view counts shimmer.
- Error: "Không tải được thông báo." with "Thử lại".
- Blocked: none. Viewing notifications is never gated (rules.md#gates).
- Overflow: about 60 notifications render in one scroll with day headers sticky on app; a body like "Nhận tiền từ Nguyễn Hoàng Phương Thảo Nguyệt Quỳnh Như. Số dư khả dụng: 128.450.000 ₫" clamps at two lines with full text in the row's accessible name.

## Design notes

- Web: content column, views as pill tabs under the H1 with "Đánh dấu tất cả đã đọc" as a text action on the right; rows separated by 1px dividers, icon in a 48px neutral circle, unread rows with a bold title and an accent dot, no background tint.
- App: header "Thông báo" with "Đánh dấu tất cả đã đọc" as a trailing icon action (with label in its accessible name), views as a horizontally scrolling chip row with peek, rows 72px min.
- Signed amounts in titles use `<Money signed>` so screen readers read them correctly.

## FE notes

- `src/notifications/NotificationsPage.tsx`; `viewFilter(kind)` and `groupByDay(items, now)` pure and TDD-tested.
- `store.notifications.markRead(id)`, `markAllRead(kinds)`; view ids in the URL are ASCII slugs (`tat-ca`, `giao-dich`, `bao-mat`, `hoa-don`).
- The kind-to-view mapping is a decision of this story (the sitemap gives only view names; reported gap).

## Mock data

- About 60 notifications, latest 8 unread, across all kinds; the 40-character contact and `rich` balance for overflow.
