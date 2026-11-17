---
id: US-TRF-001
title: Transfer chooser with recent recipients
epic: TRF
priority: P0
status: Draft
size: S
routes: ["/transfer"]
dependsOn: [US-FND-001, US-FND-002, US-SEC-004]
---

## Story

As a wallet user, I want one place that asks only "to a wallet, to a bank, or by QR" and lists who I sent money to recently, so that a repeat transfer starts in one tap.

## Acceptance criteria

- Given no gate is active, when I open `/transfer`, then I see the title "Chuyển tiền" and three options in this order: "Đến ví" with "Số điện thoại hoặc danh bạ", "Đến ngân hàng" with "Số tài khoản hoặc người nhận đã lưu", and "Quét mã VietQR" with "Quét hoặc tải ảnh mã của người nhận".
- Given the chooser, when I pick "Đến ví", "Đến ngân hàng" or "Quét mã VietQR", then I go to `/transfer/wallet?step=recipient`, `/transfer/bank?step=recipient` or `/pay/scan` respectively.
- Given I have sent money before, then a "Gần đây" section lists up to 8 distinct recipients from my `p2p_out` and `bank_transfer` transactions with status `success` or `pending`, newest first, each with initials avatar, name, and a second line: the phone (`0901 234 567`) for a wallet recipient, or bank name + "•••• 6789" for a bank recipient.
- Given I tap a recent wallet recipient, then I land on `/transfer/wallet?step=amount` with that recipient selected; given I tap a recent bank recipient, then I land on `/transfer/bank?step=recipient` with bank and account number filled and the name lookup running (rules.md#money-rules: every bank transfer needs a fresh lookup).
- Given a gate is active (rules.md#gates), when I open `/transfer` from the nav, a Home shortcut or a typed URL, then the gate overlay from US-SEC-004 shows its message and single next step, and the three options are not actionable.
- Given the app layout, then the screen has a back arrow to the previous screen and no tab bar; given the web layout, then "Chuyển tiền" is the active sidebar item.

## UI states

- Empty: no past transfers → the "Gần đây" section is replaced by the muted line "Chưa có người nhận gần đây." The three options are unchanged.
- Loading: options render immediately (static); "Gần đây" shows 4 skeleton rows while the store resolves.
- Error: "Gần đây" fails to load → inline "Không tải được người nhận gần đây." with "Thử lại"; options stay usable.
- Blocked: gates #1–#4 from rules.md#gates apply at this entry point (US-SEC-004). Viewing recent recipients is not a money action, but the list is hidden behind the gate overlay to keep one message on screen.
- Overflow: "Nguyễn Hoàng Phương Thảo Nguyệt Quỳnh Như" truncates to one line with ellipsis and full name in `title`/accessible name; diacritics are not clipped (line-height leaves room for stacked marks). Bank names like "Techcombank" stay on the second line with the masked account never truncated.

## Design notes

- Web (≥ 1024): page in the content column, max-width 560. H1 "Chuyển tiền", then the three options as a 1px bordered card with three rows (48px icon circle on light grey, label 16px, description 14px muted, chevron). "Gần đây" below as a list card, 56px rows. No primary button: the options are the actions.
- App (< 1024): full-screen with header "Chuyển tiền" and back arrow, tab bar hidden. "Gần đây" first as a horizontal row of avatar circles (48px, 2-line names) with peek, then the three option rows. Every row ≥ 48px tall.
- One accent only for focus and the pressed state; no shadows.

## FE notes

- `TransferChooserPage` at `/transfer`. Gate check through the shared `useGate()` from US-SEC-004 before rendering options.
- `selectRecentRecipients(transactions, limit)`: pure, TDD. Dedupes by counterparty key (`phone` for wallet, `bankBin + accountNumber` for bank), ignores `failed`, keeps newest. Home's recent-recipients section (HOM) should reuse it rather than re-derive.
- Recent bank recipient passes `bank` and `account` as query params to `/transfer/bank?step=recipient` (rules.md#spec-conventions: prefill via query).

## Mock data

- Seed: ~260 transactions with rent and family `p2p_out` and `bank_transfer` rows; the pending `bank_transfer` from 20 minutes ago appears in "Gần đây"; the failed `timeout_reversed` one does not (unless the same recipient also has a success).
- The 40-character contact is among recent recipients in the seed so overflow is visible on first load.
- Scenario `no-source` or `unverified` shows the gate.
