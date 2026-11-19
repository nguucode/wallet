# Wallet spec

Single source of truth for Wallet's information architecture and, from step 2, its user-story backlog. Product context is in [`../PRODUCT.md`](../PRODUCT.md); project status and decisions are in the vault (`10-projects/wallet/_context.md`).

Wallet is a front-end-only e-wallet demo for the Vietnamese market, on mock data, with one persona and two layouts (web ≥ 1024px, app shell < 1024px) on one route tree.

## Layout

```
spec/
  README.md               conventions (this file)
  ia/sitemap.yaml         routes, nav for both layouts, flow steps, overlays; drives the real nav
  ia/object-model.md      glossary (code term ↔ UI label), objects, enums, transaction state machine
  ia/rules.md             law-as-UI rules, gates, limits, step-up, fees, conventions (wins over stories)
  ia/mock-data.md         persona, scale, edge cases, scenarios, demo controls
  epics/<code>/epic.md            one per Epic; lists its P1 backlog as a table (no files)
  epics/<code>/US-<CODE>-NNN.md   one per P0 user story
```

## Epics

| Code | Epic |
|---|---|
| FND | Shell for both layouts, nav from sitemap.yaml, money formatting, mock store + latency, demo controls, scenarios, 404 |
| ONB | Onboarding and eKYC, link first bank |
| HOM | Home |
| MNY | Funding sources, top up, withdraw |
| TRF | Transfer to wallet, transfer to bank / VietQR, receive QR |
| PAY | Scan (payload detection), merchant payment, Payment Code |
| BIL | Bills (electricity) |
| HIS | History, transaction detail, receipt, contact support |
| SEC | Step-up auth sheet, PIN, limits, security settings, gates |
| NTF | Notifications |
| PRD | Product menu (P1, case-study layer) |

Roles: one (the wallet customer). Demo controls are a reviewer tool, not a role.

## Reserved IDs

Other Epics may depend on these before they are written. The owning Epic must use exactly these IDs and titles.

| ID | Title |
|---|---|
| US-FND-001 | App shell for both layouts with nav from sitemap.yaml |
| US-FND-002 | Money, date, and phone formatting with the amount input |
| US-FND-003 | Mock store, scenarios, and latency |
| US-FND-004 | Demo controls panel |
| US-FND-006 | Not-found page and error boundary |
| US-FND-007 | Money flow pattern: steps, confirm, and result |
| US-SEC-001 | Step-up auth sheet with PIN |
| US-SEC-002 | Face match step-up |
| US-SEC-003 | Required-auth rule with configurable thresholds |
| US-SEC-004 | Gates on money actions |
| US-SEC-005 | Limits screen |
| US-MNY-001 | Funding sources list |
| US-MNY-002 | Link a bank account |
| US-HIS-002 | Transaction detail |

## Story file

The file name is the ID: `US-<CODE>-NNN.md`, NNN from 001 within each Epic, no gaps. Only P0 stories get a file; P1 items live in the Epic's backlog table.

```markdown
---
id: US-TRF-002
title: Transfer to a bank account
epic: TRF
priority: P0
status: Draft           # Draft | Ready | In design | In build | Done
size: M                 # S (about half an FE session) | M (about one session). Split anything larger.
routes: [/transfer/bank] # base routes, must exist in ia/sitemap.yaml
dependsOn: [US-FND-007, US-SEC-001]   # P0 IDs only
---

## Story

As a wallet user, I want …, so that ….

## Acceptance criteria

- Given …, when …, then ….
- (3 to 8 criteria; quote Vietnamese UI copy exactly, in quotes)

## UI states

- Empty: …
- Loading: …
- Error: …
- Blocked: … (which gate from rules.md#gates applies, or "none")
- Overflow: … (long Vietnamese names with diacritics, 12-character amounts, many rows)

## Design notes

- Web layout (≥ 1024) and app layout (< 1024) for this screen. Follow the PayPal-derived grammar in the vault note `10-projects/wallet/paypal-style-study.md` until DESIGN.md exists: balance-first, black and white with one accent, 1px bordered cards without shadow, pill buttons, 48px targets.

## FE notes

- Route and step params, components, store actions, pure functions to TDD.

## Mock data

- Entities, scenarios from ia/mock-data.md, and edge cases this story needs.
```

## Rules

- **One story is one screen-level behavior.** A list, a detail, and a flow are separate stories. UI states live inside each story.
- **P0** is the demo loop in PRODUCT.md (onboarding → link bank → top up → transfer / pay / bill → history → support), plus the shell and demo controls. (A /device phone-frame preview was built, then removed 2026-11-19: the app layout is reached by narrowing the window or on a phone.) **P1** is the rest of PRODUCT.md's P1 list plus the Product menu.
- A P0 story's `dependsOn` lists only P0 IDs. When it would use a P1 capability, its FE notes say "Enhanced by <Epic> P1: <title>".
- [ia/rules.md](ia/rules.md) wins over any story. Stories cite the rule they apply instead of restating thresholds as hard-coded numbers.
- Every story covers both layouts. Story text in English; UI copy in Vietnamese using the labels in [ia/object-model.md](ia/object-model.md).
