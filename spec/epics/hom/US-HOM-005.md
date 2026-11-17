---
id: US-HOM-005
title: Recent recipients
epic: HOM
priority: P0
status: Draft
size: S
routes: ["/home", "/transfer/wallet", "/transfer/bank"]
dependsOn: [US-HOM-001]
---

## Story

As a wallet user who sends money to the same people, I want my recent recipients on Home, so that I can start a transfer to them in one tap.

## Acceptance criteria

- Given past `p2p_out` and `bank_transfer` transactions, then "Người nhận gần đây" shows up to 8 distinct recipients, most recent first.
- Given a wallet contact, then the item shows initials avatar and the short name (last word of the name, e.g. "Như"), and tapping it opens `/transfer/wallet` with that contact prefilled at the amount step.
- Given a bank recipient, then the item shows initials, the short name, and the bank name under it (e.g. "Vietcombank"), and tapping it opens `/transfer/bank` prefilled with bank and account number.
- Given a gate is active, when I tap a recipient, then the gate overlay opens instead (US-SEC-004).
- Given there are no past outgoing transfers, then the section is omitted.

## UI states

- Empty: section omitted.
- Loading: 4 circle skeletons.
- Error: section omitted.
- Blocked: gates #1–#4 at tap, via US-SEC-004.
- Overflow: "Nguyễn Hoàng Phương Thảo Nguyệt Quỳnh Như" shows as "Như" with the full name as the accessible name; at 8 items the row scrolls horizontally with peek on app.

## Design notes

- App: horizontal row of 56px avatar circles with the short name under, 12px, one line.
- Web: same row inside the content column, max 8 visible, no scroll at ≥ 1024; hover shows the full name and masked phone or account.
- Header "Người nhận gần đây" with "Chuyển tiền" link to `/transfer`.

## FE notes

- `selectRecentRecipients(transactions, 8)` pure; dedupe by contact id or bank + account number; TDD ordering and dedupe.
- Prefill uses query params per rules.md#spec-conventions; TRF owns the param names (proposed `?contact=<id>` and `?recipient=<savedRefId>`).

## Mock data

- Contacts and the 6 saved bank recipients from ia/mock-data.md, including the 40-character name contact.
