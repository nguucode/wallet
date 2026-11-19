---
id: US-NTF-002
title: Unread badge on tab bar and top bar
epic: NTF
priority: P0
status: Draft
size: S
routes: ["/home", "/notifications"]
dependsOn: [US-FND-001, US-FND-003]
---

## Story

As a wallet user, I want to see at a glance that something new happened to my wallet, from any screen, so that I never miss an incoming payment or a security change.

## Acceptance criteria

- Given unread notifications, then the "Thông báo" item in the web top bar and the app tab bar (items with `badge: unread` in sitemap.yaml) shows a badge with the count 1–9, or "9+" above 9.
- Given no unread notifications, then no badge is rendered.
- Given a new notification is created anywhere (a money commit, Demo controls "Nhận tiền từ liên hệ"), then the badge updates within the same render, without a reload.
- Given a screen reader, then the item's accessible name reads "Thông báo, 8 chưa đọc", or "Thông báo" with none.
- Given I mark notifications read (US-NTF-001), then the badge decreases accordingly.

## UI states

- Empty: no badge.
- Loading: no badge until the count loads (never a flashing "0").
- Error: no badge; the nav item still works.
- Blocked: none.
- Overflow: "9+" fits the badge; badge never covers the tab label.

## Design notes

- Red badge (the only alert colour in the chrome, as in paypal-style-study.md), 18px tall pill, 11px bold white digits, offset to the top-right of the bell icon on both layouts; respects 44px+ target of the item.

## FE notes

- `<UnreadBadge>` rendered by the nav for any item with `badge: unread`; selector `unreadCount(state)`; `badgeLabel(n)` pure ("" / "1".."9" / "9+") with tests.

## Mock data

- Seed: 8 unread. Demo controls "Nhận tiền từ liên hệ" raises it to 9, then "9+" after one more.
