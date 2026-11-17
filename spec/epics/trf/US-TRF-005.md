---
id: US-TRF-005
title: Bank recipient with account name lookup
epic: TRF
priority: P0
status: Draft
size: M
routes: ["/transfer/bank"]
dependsOn: [US-FND-002, US-FND-003, US-FND-007, US-SEC-004]
---

## Story

As a wallet user, I want to pick a bank, type the account number and see the holder's name before I go further, so that I catch a wrong account before any money moves.

## Acceptance criteria

- Given I open `/transfer/bank?step=recipient`, then I see "Người nhận đã lưu" (6 saved recipients: holder name, bank, "•••• 6789") above a form with "Ngân hàng" (picker) and "Số tài khoản" (digits only).
- Given I open the "Ngân hàng" picker, then I can search by name ("Tìm ngân hàng") among Vietcombank, VietinBank, BIDV, Techcombank, MB Bank, ACB, each with a neutral monogram and no logo.
- Given a bank is chosen and the account number has 6 to 19 digits, when the field loses focus or I tap "Kiểm tra", then the name lookup runs and shows "Tên chủ tài khoản" with the returned name in capitals without diacritics (e.g. "NGUYEN THI THU HA"), as banks return it.
- Given the lookup returns not found, then the field shows "Không tìm thấy tài khoản. Kiểm tra lại ngân hàng và số tài khoản." and "Tiếp tục" stays disabled; no transaction is ever created from this step (rules.md#money-rules).
- Given the lookup times out, then it shows "Không kiểm tra được tên chủ tài khoản." with "Thử lại", and "Tiếp tục" stays disabled.
- Given I change the bank or the account number after a lookup, then the shown name clears and the lookup must run again.
- Given I tap a saved recipient, then bank and account fill in and the lookup runs immediately; given it succeeds, "Tiếp tục" takes me to `?step=amount` with bank, account and holder name in the draft.
- Given a gate is active (rules.md#gates), when I open the route by URL, then the gate overlay shows (US-SEC-004).

## UI states

- Empty: no saved recipients → section hidden; form shows with "Ngân hàng" placeholder "Chọn ngân hàng".
- Loading: lookup shows "Đang kiểm tra tên chủ tài khoản…" with a spinner under the field; the bank list is static.
- Error: not-found and timeout as above, inline under "Số tài khoản", danger text, focus moves to the message for screen readers (`aria-live="polite"`).
- Blocked: gates #1–#4 (rules.md#gates) at entry, via US-SEC-004.
- Overflow: holder name up to 50 capital characters ("NGUYEN HOANG PHUONG THAO NGUYET QUYNH NHU") wraps to two lines; a 19-digit account number displays grouped in 4s without wrapping at 375px.

## Design notes

- Web (≥ 1024): content column, max-width 560, step header "Chuyển đến ngân hàng". Saved recipients as a bordered list card (56px rows); form card below: bank picker as a select-like 48px field opening a popover list with search; account field; the looked-up name appears as a success row inside the card (check icon, name bold). Pill "Tiếp tục".
- App (< 1024): full-screen. Bank picker opens a full-height sheet with search at top and the six banks; the account field uses `inputmode="numeric"`. Saved recipients as an avatar row with peek above the form. "Tiếp tục" full-width pill pinned to the bottom.
- The looked-up name is the most important line on this screen: give it 16px bold, never truncate.

## FE notes

- Step `recipient` of `TransferBankFlow` (US-FND-007). Accepts `?bank=<bin>&account=` prefill from US-TRF-001 and `?qr=` from US-TRF-008.
- `store.banks.lookupAccount(bin, accountNumber)` → `{ status: 'found', holderName } | { status: 'not_found' } | { status: 'timeout' }`.
- `isValidAccountNumber(s)`: digits, length 6–19; pure, TDD.
- Bank list keyed by NAPAS BIN (Vietcombank 970436, VietinBank 970415, BIDV 970418, Techcombank 970407, MB Bank 970422, ACB 970416) so VietQR parsing (US-PAY-001) maps BIN → bank.

## Mock data

- 6 saved `BankAccountRef` recipients spread across the six banks, one with a 40-character holder name.
- Lookup directory: seeded accounts resolve to their holder; account numbers starting with `000` return `not_found`; numbers starting with `999` return `timeout`; any other valid number resolves to a seeded generated name. Documented in the demo controls help text.
