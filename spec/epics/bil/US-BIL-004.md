---
id: US-BIL-004
title: Bill-due reminders and period roll-over
epic: BIL
priority: P0
status: Draft
size: S
routes: ["/bills", "/home", "/notifications"]
dependsOn: [US-FND-003, US-BIL-001]
---

## Story

As a wallet user, I want the wallet to remind me a few days before a saved bill is due and to bring in next month's bill on its own, so that I never pay late because I forgot to check.

## Acceptance criteria

- Given a saved bill is `due` and its due date is within the reminder window (rules.md#notifications), when the app loads or the clock advances, then exactly one `bill_due` Notification is created for that bill period with title "Hóa đơn điện sắp đến hạn", body "Điện lực Hồng Hà · 845.000 ₫ · hạn 20/11/2026", and link `/bills/:billId`.
- Given that reminder already exists for this period, when the clock advances again, then no duplicate is created.
- Given today passes a `due` bill's due date, then its status becomes `overdue` and it is listed first on `/bills` (US-BIL-001).
- Given a bill is `paid` and the Clock demo control moves to the next month, then the saved bill gets a new period with status `due`, a new amount and a due date, and the previous period stays in history.
- Given Home asks for bills due soon, then `billsDueWithin(days)` returns due and overdue bills inside the window Home configures (sitemap.yaml home `bills-due`), sorted by due date.

## UI states

- Empty: no saved bills or none in the window creates nothing and returns an empty list.
- Loading: none; runs inside the store after seed load and after each clock change.
- Error: none surfaced; a failed derivation logs and leaves bills unchanged.
- Blocked: none; reminders are data, not a money action.
- Overflow: 10 saved bills all due the same day create 10 reminders, each linking to its own bill; long biller names fit the notification body without truncating the amount.

## Design notes

- No screen of its own. Web and app render these reminders through Notifications (NTF) and the Home `bills-due` section (HOM); the bill row on `/bills` reflects the `overdue` transition in both layouts.

## FE notes

- Pure functions to TDD: `billStatusOn(bill, today)` (due → overdue), `dueReminders(bills, notifications, today, config.billDueReminderDays)`, `nextPeriod(bill, monthStart)`.
- `store.bills.reconcile(today)` runs after seed load and on every Clock demo control change; it updates statuses, appends reminders via `store.notifications.add`, and rolls paid bills into the new month.
- Reminder lead time lives in config, default from rules.md#notifications; dates resolve in Asia/Ho_Chi_Minh.

## Mock data

- The seeded bill due in 3 days triggers one reminder on first load in `ready`.
- Clock "+1 day" ×4 turns it `overdue`; Clock "to next month" rolls the paid bill into a new due period.
