---
code: NTF
name: Notifications
route: /notifications
summary: Notifications list with saved views, the unread badge on tab bar and top bar, balance-change notifications created by every money commit, and reminders for bills due and CCCD expiry.
---

# NTF · Notifications

The wallet's running record of what happened to the user's money and account. The law requires a notice for every balance change, so notifications are created by the same store commit that moves the money, never by a screen. The list groups them by day with saved views for transactions, security and bills; the unread badge on the tab bar and top bar is the only red in the chrome. Reminders for bills due and an expiring CCCD come from the clock, so Demo controls can produce them on demand.

## P0 stories

- US-NTF-001 — Notifications list with saved views
- US-NTF-002 — Unread badge on tab bar and top bar
- US-NTF-003 — Balance-change notifications from money commits
- US-NTF-004 — Reminders for bills due and CCCD expiry

## P1 backlog

| Title | Why P1 |
|---|---|
| In-app banner (toast) when a notification arrives | The badge already signals arrival; a banner matters once real push exists. |
| Status-update notification when a pending transaction resolves | Pending → success changes no balance, so rules.md requires no notice and `Notification.kind` has no value for it; useful but needs a new kind. |
| New-device login notification surface | `new_device_login` is P0 data but its surface is P1 with device management (rules.md#notifications). |
| Support request updates (`support_update`) | Case tracking is P1 in HIS; P0 creates no updates. |
