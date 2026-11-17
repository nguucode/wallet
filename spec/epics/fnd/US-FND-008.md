---
id: US-FND-008
title: Seed data generator with hand-made edge cases
epic: FND
priority: P0
status: Draft
size: M
routes: ["/home"]
dependsOn: [US-SEC-003, US-FND-009]
---

## Story

As a reviewer, I want twelve months of believable Vietnamese wallet activity that is the same every time I open the demo, so that screens look lived-in and every edge case is always there to inspect.

## Acceptance criteria

- Given the generator runs twice with the same seed, then it writes byte-identical JSON to `src/mock/data/`.
- Given the output, then it matches the scale table in mock-data.md: 1 customer and wallet (Trần Minh Anh, "0901 234 567"), 3 funding sources (Vietcombank account default, Techcombank account, MB Bank debit card, all with holderName "TRẦN MINH ANH"), 40 contacts (32 with a wallet), 6 saved bank recipients across Vietcombank, VietinBank, BIDV, Techcombank, MB Bank and ACB, 25 merchants (5 fixed-amount), 3 electricity billers, 2 saved bills, about 260 transactions over 12 months, about 60 notifications with the latest 8 unread, 2 support requests.
- Given every seeded transaction, then its id is `WL` + 12 digits, its amount is a positive whole number, its fee equals `feeFor` at that point in the month (US-FND-009), and its `authMethod` equals `requiredAuth` for its type, amount and that day's counter (US-SEC-003).
- Given the current month, then general-limit usage is 62% ± 2% of the configured general limit and essential usage about 1% (rules.md#limits).
- Given the output, then the hand-made edge cases from mock-data.md are present: the pending `bank_transfer` 20 minutes old, the failed `timeout_reversed` `bank_transfer` last week, the refunded `qr_merchant` with its linked `refund`, the settling `bill`, and the contact "Nguyễn Hoàng Phương Thảo Nguyệt Quỳnh Như".
- Given every balance-changing seeded transaction, then a matching `balance_change` notification exists (rules.md#notifications), built by the same function the store uses (US-NTF-003).
- Given all dates, then they are stored as offsets from "today", not absolute timestamps.

## UI states

- Empty: not applicable (build-time script).
- Loading: not applicable.
- Error: the script exits non-zero with the failing invariant named when any check above fails; CI runs it in check mode.
- Blocked: none.
- Overflow: includes the 40-character name, a 12-character balance in the `rich` overlay, and merchant names up to 32 characters ("Nhà thuốc Phúc Khang Chi nhánh Cầu Giấy").

## Design notes

- No UI. Data must read correctly in both layouts: names have real diacritics, amounts follow the ranges in mock-data.md#generation.

## FE notes

- `scripts/generate-seed.ts` with `@faker-js/faker` `vi` locale and a fixed seed, as in Fortify; `npm run seed` writes, `npm run seed:check` regenerates in memory and diffs.
- Invariants live in `src/mock/seed.test.ts` so they run in Vitest too.
- Sample QR payloads are out of scope here (owned by PAY's scan parser).

## Mock data

- This story produces the mock data. Banks are real names as text only; people, merchants and billers are fictional (mock-data.md).
