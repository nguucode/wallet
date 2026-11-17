---
code: MNY
name: Funding sources, top up, withdraw
route: /me/sources
summary: Linked banks and debit cards (list, link, default, unlink with the last one protected), top up from and withdraw to own sources only, with fees and the shared free-slot counter.
---

# MNY · Funding sources, top up, withdraw

Money enters and leaves the wallet only through the customer's own linked bank accounts or domestic debit cards; there is no cash in or out anywhere (rules.md#money-rules). This Epic owns the sources themselves at `/me/sources` (list, link through a simulated bank-app hand-off, set default, unlink with the last source protected by law) and the two flows that use them: `/topup`, which is free and instant, and `/withdraw`, which can be pending and charges a fee once the month's shared free slots with bank transfers are used (rules.md#fees).

## P0 stories

- US-MNY-001 — Funding sources list
- US-MNY-002 — Link a bank account
- US-MNY-003 — Set the default funding source
- US-MNY-004 — Unlink a funding source
- US-MNY-005 — Top up from a linked source
- US-MNY-006 — Withdraw: amount, fee, and confirm
- US-MNY-007 — Withdraw result: success, pending, failed

## P1 backlog

| Title | Why P1 |
|---|---|
| None in PRODUCT.md | PRODUCT.md's P1 list has no funding-source or top-up/withdraw item; international cards are out of scope (domestic debit card only, object-model.md). |
