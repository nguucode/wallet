---
id: US-FND-002
title: Money, date, and phone formatting with the amount input
epic: FND
priority: P0
status: Draft
size: M
routes: ["/topup"]
dependsOn: []
---

## Story

As a wallet user, I want every amount, date and phone number to look the way Vietnamese banking apps write them, and to type amounts without fighting the field, so that I never misread a number or send the wrong amount.

## Acceptance criteria

- Given an amount of 1250000, when it is displayed, then it reads "1.250.000 ₫" (dot thousands, no decimals, a non-breaking space before ₫); signed amounts read "+2.000.000 ₫" and "−2.000.000 ₫" (U+2212); 0 reads "0 ₫".
- Given a timestamp, then dates read "17/11/2026" and times "14:05" in Asia/Ho_Chi_Minh regardless of the device time zone; day group labels read "Hôm nay", "Hôm qua", then the date.
- Given "0901234567", then it displays "0901 234 567"; a masked phone displays "0901 *** 567"; a masked bank account "0123456789" displays "•••• 6789"; a masked ID keeps its length with the first digit and last 3 visible.
- Given the amount input is empty, when I type "1250000", then it shows "1.250.000" live with "₫" as a fixed suffix, and the caret stays at the end.
- Given I paste "1,250,000đ" or "1.250.000 VND", then the value becomes 1250000; letters, signs, commas and decimals are dropped; leading zeros are stripped ("000" becomes empty).
- Given the input already holds 9 digits, when I type another digit, then it is ignored (max 999.999.999 ₫; flow-specific caps are applied by the flow).
- Given a screen reader, when it reaches any displayed amount, then it announces the plain integer followed by "đồng" (for example "1250000 đồng"), never a decimal reading of "1.250".

## UI states

- Empty: amount input shows placeholder "0" in muted text and label "Số tiền".
- Loading: not applicable (pure formatting).
- Error: the input exposes an error slot under the field (`aria-describedby`) that callers fill; it never invents its own messages except "Nhập số tiền" when required and empty on submit.
- Blocked: none.
- Overflow: "128.450.000 ₫" (12 characters plus suffix) fits the amount input at 320px by stepping the font size down from display to 32px; it never wraps or clips.

## Design notes

- Web: amount input is a large inline field (40px, tabular figures) on the flow card, 1px border on focus only.
- App: amount input is the headline of the amount step (display size, negative letter-spacing as in the balance), with `inputmode="numeric"` so the system numeric keypad opens; quick-amount chips belong to each flow, not here.
- Tabular figures for every amount in lists and tables so columns align. Line-height leaves room for stacked diacritics in labels.

## FE notes

- `src/lib/format.ts`: `formatVnd(n, { signed? })`, `parseVndInput(s)`, `formatDate`, `formatTime`, `dayLabel(date, now)`, `formatPhone`, `maskPhone`, `maskAccount`, `maskId`. All pure; TDD with a table per function, including negative zero, 999.999.999, a UTC 17:00 boundary (becomes next day in Asia/Ho_Chi_Minh), and non-digit paste.
- `<Money value signed?>` renders the visual string `aria-hidden` plus an sr-only "<n> đồng".
- `<AmountInput value onChange max? error?>` controlled with an integer value (`number | null`), formats on every change, `inputMode="numeric"`, `autoComplete="off"`.
- Use `Intl.NumberFormat('vi-VN')` only if its output matches the spec exactly in all test environments; otherwise format by hand (Node ICU differences).

## Mock data

- The 12-character balance `128.450.000 ₫` from the `rich` scenario and the 40-character contact name for label overflow.
