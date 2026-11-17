---
id: US-HOM-001
title: Home page with the balance
epic: HOM
priority: P0
status: Draft
size: M
routes: ["/home"]
dependsOn: [US-FND-001, US-FND-002, US-FND-003]
---

## Story

As a wallet user, I want Home to open on my available balance, with any money still being processed shown under it, so that I know at a glance what I can spend right now.

## Acceptance criteria

- Given I open `/home`, then sections render in the sitemap order: balance, shortcuts, gate, bills due, recent recipients, recent activity; a section with nothing to show is omitted, never shown as an empty card (except recent activity, US-HOM-006).
- Given the balance section, then it shows the label "Số dư khả dụng" and `available = balance − pendingOut` formatted as `1.250.000 ₫` (object-model.md#derived-values).
- Given `pendingOut > 0`, then a second line reads "Đang xử lý: 1.200.000 ₫" and links to `/history` with the saved view "Đang xử lý"; when `pendingOut` is 0 the line is absent.
- Given I press the eye toggle ("Ẩn số dư"), then the amount and the pending line show "••••••• ₫", the toggle becomes "Hiện số dư", and the choice persists across reloads on this browser.
- Given the balance is hidden, then screen readers announce "Số dư đang ẩn"; when shown, the amount is read as đồng (e.g. "một triệu hai trăm năm mươi nghìn đồng"), never as decimals.
- Given a pending transaction resolves (Demo control "Resolve pending") or an incoming transfer arrives while Home is open, then the balance and pending line update without a reload.

## UI states

- Empty: balance `0 ₫` (after onboarding, scenario `no-source`) is shown as is, with no pending line.
- Loading: the balance shows a skeleton the width of `1.250.000 ₫`; other sections have their own skeletons.
- Error: "Chưa tải được số dư." with "Thử lại" in place of the amount; the rest of Home still renders.
- Blocked: none; viewing the balance is never blocked (rules.md#gates).
- Overflow: scenario `rich` balance `128.450.000 ₫` fits on one line at 375px by stepping the display size down one token; the line-height leaves room for diacritics in the label above.

## Design notes

- Web (≥ 1024): content column left-aligned, max-width about 610px, right side empty. Balance in the display size with negative letter-spacing (−0.04em), "₫" the same size; the pending line 14px in amber text with a small clock icon; eye toggle 48px target next to the label.
- App (< 1024): header with avatar initials and "Trần Minh Anh", bell is in the tab bar; balance directly under the header, same hierarchy at the mobile display size.
- 48–64px vertical rhythm between sections; cards are 1px bordered, no shadow (paypal-style-study.md).

## FE notes

- `HomePage` composes `BalanceSection`, `ShortcutsRow`, `GateSection`, `BillsDueSection`, `RecentRecipients`, `RecentActivity`.
- `selectAvailable(state)` and `selectPendingOut(state)` are pure selectors over transactions; TDD with the seeded pending `bank_transfer`.
- Hide preference in `localStorage` key `wallet.balanceHidden` behind a `usePersistentToggle` hook; `MoneyText` from US-FND-002 handles the screen-reader text.

## Mock data

- Scenario `ready`: the pending `bank_transfer` from 20 minutes ago so the pending line shows on first load (ia/mock-data.md#generation). Scenario `rich` for the 12-character balance.
