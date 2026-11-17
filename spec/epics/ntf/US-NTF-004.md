---
id: US-NTF-004
title: Reminders for bills due and CCCD expiry
epic: NTF
priority: P0
status: Draft
size: S
routes: ["/notifications"]
dependsOn: [US-FND-003, US-FND-004]
---

## Story

As a wallet user, I want a reminder before a bill is due and before my ID expires, so that I pay on time and my wallet is not suspended by surprise.

## Acceptance criteria

- Given a saved bill with status `due` whose due date is within the configured lead time (rules.md#notifications), when the app loads or the clock advances, then one `bill_due` notification is created: "Hóa đơn điện sắp đến hạn", body "Điện lực Hồng Hà · 845.000 ₫ · hạn 20/11/2026", link `/bills/:billId`.
- Given the CCCD expiry is within the configured lead time (rules.md#notifications), then one `id_expiring` notification is created: "CCCD sắp hết hạn", body "CCCD của bạn hết hạn vào 08/12/2026. Cập nhật để ví không bị tạm ngừng giao dịch.", link `/me/profile`.
- Given the reminder for that bill period or that expiry date already exists, then no duplicate is created on later loads or clock advances.
- Given the bill is paid before the reminder time, then no `bill_due` is created.
- Given Demo controls "+1 ngày" moves "now" into the reminder window, then the reminder appears and the unread badge updates (US-NTF-002).

## UI states

- Empty: not applicable (event-driven).
- Loading: not applicable.
- Error: a failure to build a reminder is logged and skipped; it never blocks app load.
- Blocked: none.
- Overflow: biller names up to 24 characters and amounts up to "12.450.000 ₫" fit the body on two lines.

## Design notes

- No screen. Rendered by US-NTF-001: `bill_due` in "Hóa đơn", `id_expiring` in "Bảo mật", on both layouts.

## FE notes

- `dueReminders(state, now, config): Notification[]` pure in `src/notifications/reminders.ts`, keyed by `bill_due:<billId>:<period>` and `id_expiring:<idExpiry>` for idempotency; TDD the window boundaries in Asia/Ho_Chi_Minh.
- Run on store hydrate and after each clock change.

## Mock data

- Seed: one saved bill due in 3 days (reminder present on first load), one paid. Scenario `id-expiring` (CCCD in 21 days → reminder present).
