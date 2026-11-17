---
id: US-MNY-001
title: Funding sources list
epic: MNY
priority: P0
status: Draft
size: S
routes: ["/me/sources"]
dependsOn: [US-FND-001, US-FND-003]
---

## Story

As a wallet user, I want to see every bank account and debit card linked to my wallet and which one is the default, so that I know where top-ups come from and where withdrawals go.

## Acceptance criteria

- Given I open `/me/sources`, then the heading is "Nguồn tiền" and each linked source shows the bank name, the kind ("Tài khoản" or "Thẻ ghi nợ"), the masked number ("••6789"), and the holder name in uppercase; the default source has the badge "Mặc định" and is listed first.
- Given the page, then the note reads "Bạn chỉ nạp tiền từ và rút tiền về tài khoản hoặc thẻ đứng tên mình." and the primary button is "Liên kết ngân hàng" (to `/me/sources/link`, US-MNY-002).
- Given a source row, then its menu offers "Đặt làm mặc định" (US-MNY-003, hidden on the default) and "Hủy liên kết" (US-MNY-004).
- Given sources with status `unlinked`, then they are not listed.
- Given no linked source (scenario `no-source`), then the empty state shows instead of the list.

## UI states

- Empty: "Chưa có nguồn tiền nào" with "Ví cần ít nhất một tài khoản hoặc thẻ ghi nợ đứng tên bạn để nạp, rút và thanh toán." and the pill "Liên kết ngân hàng".
- Loading: 3 skeleton rows.
- Error: "Chưa tải được nguồn tiền." with "Thử lại".
- Blocked: none; managing sources is not a money action (rules.md#gates).
- Overflow: a 40-character holder name wraps under the bank name; more than 5 sources simply extend the list (no pagination).

## Design notes

- Web: page in the content column; H1 "Nguồn tiền" with the black pill "Liên kết ngân hàng" right; sources as 1px bordered cards, bank as a neutral monogram in a 48px grey circle (bank name as text, no logos, ia/mock-data.md).
- App: header "Nguồn tiền" with back to `/me`; rows 72px; row menu opens a bottom sheet; "Liên kết ngân hàng" pinned at the bottom.
- "Mặc định" is a small neutral pill badge, not the accent.

## FE notes

- `SourcesPage`, `SourceRow`, `SourceActionsMenu`; `selectLinkedSources(state)` puts the default first, then by `linkedAt`.

## Mock data

- Scenario `ready`: Vietcombank account ••6789 (default), Techcombank account ••4321, MB Bank debit card ••1122, all held by TRẦN MINH ANH. Scenario `no-source` for the empty state.
