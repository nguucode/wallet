---
id: US-TRF-002
title: Choose a wallet recipient by phone or contact
epic: TRF
priority: P0
status: Draft
size: M
routes: ["/transfer/wallet"]
dependsOn: [US-FND-002, US-FND-003, US-FND-007, US-SEC-004]
---

## Story

As a wallet user, I want to find the person by phone number or in my contacts and see clearly who can receive, so that I never start a transfer to someone who has no wallet.

## Acceptance criteria

- Given I open `/transfer/wallet?step=recipient`, then I see a search field with placeholder "Nhập số điện thoại hoặc tên", a "Gần đây" group (recent wallet recipients, up to 5) and a "Danh bạ" group listing all 40 contacts A–Z by name.
- Given a contact has `hasWallet: false`, then the row shows the tag "Chưa dùng ví", is visibly disabled and `aria-disabled="true"`, and tapping it does nothing except show the helper "Người này chưa dùng ví nên chưa nhận được tiền qua ví." (rules.md#money-rules). It is never selectable in P0.
- Given I type letters, then both groups filter by name ignoring diacritics and case ("thao" matches "Thảo"); given I type digits, then they filter by phone, and the field formats as `0901 234 567`.
- Given I type a full 10-digit phone that is not in my contacts, then after the lookup the list shows one result: the wallet holder's name with "Ví" tag if the number has a wallet, or "Số điện thoại này chưa dùng ví." (not selectable) if it does not.
- Given I type my own phone number, then the result reads "Bạn không thể chuyển tiền cho chính mình." and is not selectable.
- Given I select a recipient with a wallet, then I go to `/transfer/wallet?step=amount` and the recipient (name + phone) is held in the flow draft and shown at the top of the next steps.
- Given a gate is active (rules.md#gates), when I open the route by URL, then the gate overlay shows instead of the list (US-SEC-004).

## UI states

- Empty: no match → "Không tìm thấy người nhận." under the field; the full-phone lookup result replaces it when the input is 10 digits.
- Loading: contacts render from the store with 6 skeleton rows; the phone lookup shows a spinner in the single result row ("Đang tìm…").
- Error: phone lookup fails → "Không kiểm tra được số điện thoại. Thử lại." with "Thử lại"; contacts list still works.
- Blocked: gates #1–#4 (rules.md#gates) via US-SEC-004 at this entry.
- Overflow: 40 contacts scroll with sticky group headers ("Gần đây", "Danh bạ", then A–Z letters on web). "Nguyễn Hoàng Phương Thảo Nguyệt Quỳnh Như" truncates with ellipsis; the "Chưa dùng ví" tag never wraps or overlaps the name (name truncates first).

## Design notes

- Web (≥ 1024): flow page in the content column, max-width 560, step header "Chuyển đến ví" with a step indicator from US-FND-007. Search field full width (48px, 1px border, 12px radius). Contacts in one bordered list card, 56px rows: initials avatar (pill), name 14px, phone 12px muted, tag on the right.
- App (< 1024): full-screen, header "Chuyển đến ví" with back arrow, tab bar hidden. Search field pinned under the header; the phone keypad opens when the field gets focus with digits (`inputmode="tel"`), the text keyboard otherwise. Recent recipients as an avatar row with peek, then the contact list.
- "Chưa dùng ví" tag: neutral grey pill, not the accent and not danger, because it is a fact, not an error.

## FE notes

- Step `recipient` of the `TransferWalletFlow` built on the money flow pattern (US-FND-007); `?step=` per rules.md#spec-conventions. Refresh without a draft restarts here.
- `filterContacts(contacts, query)`: pure, TDD. Diacritic-insensitive (`normalize('NFD')` and strip combining marks; map "đ" → "d"), phone match on digits only.
- `store.wallets.lookupPhone(phone)` → `{ found: true, name } | { found: false }`; latency from US-FND-003.
- Self check compares normalized digits with the Customer phone.
- Enhanced by TRF P1: Send-and-claim to recipients without a wallet (then "Chưa dùng ví" rows become selectable).

## Mock data

- 40 contacts (32 with a wallet, 8 without) including the 40-character name, which has a wallet.
- Phone directory for non-contacts: numbers in a seeded list of ~20 non-contact wallet holders resolve to a name; any other valid number resolves to `found: false`. The sample wallet receive QR in PAY points at one of these.
