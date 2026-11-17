---
code: BIL
name: Bills
route: /bills
summary: Saved electricity bills by status, adding a bill by customer code with lookup, paying a bill with the essential limit and the settling state, and bill-due reminder data.
---

# BIL · Bills

Bills is where the persona pays electricity at home, the one bill category in P0. The list puts what is due or overdue first, adding a bill is a three-step lookup by customer code, and paying runs the shared money flow (view → confirm → auth → result) with two things the other flows don't have: the essential monthly limit, which is separate from the general one, and the `biller_settling` pending state, where the wallet has paid but the biller has not yet confirmed. Bill-due reminders are derived data that Home and Notifications read.

## P0 stories

- US-BIL-001 — Bills list with saved bills and biller categories
- US-BIL-002 — Add a bill by customer code
- US-BIL-003 — Pay a bill
- US-BIL-004 — Bill-due reminders and period roll-over

## P1 backlog

| Title | Why P1 |
|---|---|
| Water and internet billers | PRODUCT.md scopes P0 to electricity; the categories are visible but disabled in P0 to show the IA. |
| Pay a bill directly from a linked source | P0 pays from the wallet balance only; paying by source adds a source picker and bank-side failure paths. |
| Auto-pay a saved bill | A standing instruction needs consent, edit and cancel flows, and auto-debit failure handling. |
| Rename or delete a saved bill | Housekeeping; the seed has two saved bills and no reviewer needs it to walk the loop. |
| Per-bill payment history and usage chart | Nice for review but duplicates /history filtered by bill. |
| Pay several bills at once | Multiplies the confirm and result states; one bill per flow is enough to show the rules. |
