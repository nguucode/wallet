---
id: US-MNY-004
title: Unlink a funding source
epic: MNY
priority: P0
status: Draft
size: S
routes: ["/me/sources"]
dependsOn: [US-MNY-001, US-SEC-001]
---

## Story

As a wallet user, I want to unlink a bank account or card I no longer use, while the wallet keeps at least one, so that money can only move to sources I still trust and the wallet stays usable (TT 40 Đ.24).

## Acceptance criteria

- Given more than one linked source, when I choose "Hủy liên kết", then a dialog asks "Hủy liên kết Techcombank ••4321?" with "Bạn sẽ không nạp tiền từ hoặc rút tiền về nguồn này nữa. Giao dịch đang xử lý với nguồn này vẫn tiếp tục." and the actions "Hủy liên kết" (danger) and "Giữ lại".
- Given I confirm, then the PIN sheet opens (US-SEC-001); on success the source status becomes `unlinked`, it leaves the list, and a toast reads "Đã hủy liên kết Techcombank ••4321."
- Given I unlink the default source, then the next source by link date becomes default and the toast adds "Vietcombank ••6789 giờ là nguồn mặc định."
- Given only one linked source, then "Hủy liên kết" is disabled and the inline reason reads "Không thể hủy liên kết nguồn tiền cuối cùng. Ví cần ít nhất một nguồn tiền chính chủ." (rules.md#gates).
- Given a pending `withdraw` to this source, then unlinking is allowed and that transaction still resolves to the source.

## UI states

- Empty: not applicable.
- Loading: dialog button spinner after PIN success.
- Error: "Chưa hủy được liên kết. Thử lại." keeps the source linked.
- Blocked: last-source rule as above; no gate from rules.md#gates applies (not a money action).
- Overflow: long holder names wrap in the dialog body.

## Design notes

- Web: confirm as a centred dialog (max-width 440), danger pill plus text "Giữ lại"; disabled menu item shows its reason inline under the label, not only in a tooltip.
- App: confirm as a bottom sheet; the disabled reason shows inside the row's action sheet.

## FE notes

- `canUnlink(sources)` pure (false when linked count is 1); TDD it. `store.sources.unlink(id)` reassigns default with `nextDefault(sources)`.
- PIN only, never face match (not a transaction, so `requiredAuth` is not called).

## Mock data

- Scenario `ready` (three sources); a fixture with one source for the disabled state; the seeded pending transaction for the pending case.
