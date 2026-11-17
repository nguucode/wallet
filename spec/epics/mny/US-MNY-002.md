---
id: US-MNY-002
title: Link a bank account
epic: MNY
priority: P0
status: Draft
size: M
routes: ["/me/sources/link", "/me/sources", "/topup", "/home"]
dependsOn: [US-MNY-001, US-FND-003]
---

## Story

As a verified wallet user, I want to link a bank account or debit card in my own name through my bank's app, so that I can top up, withdraw, and start using the wallet (TT 40 Đ.17, Đ.24).

## Acceptance criteria

- Given `?step=bank`, then I see "Chọn ngân hàng", a search field "Tìm ngân hàng", and the six banks as text with neutral monograms; a bank where I already have a source shows "Đã liên kết ••6789" under its name but stays selectable.
- Given `?step=account`, then a segmented control switches "Tài khoản" / "Thẻ ghi nợ", the field is "Số tài khoản" or "Số thẻ" (digits only), and the read-only line "Chủ tài khoản: TRẦN MINH ANH" comes from my verified identity.
- Given I press "Tiếp tục" and the bank returns a holder name that differs from mine, then the inline error reads "Tài khoản này không đứng tên TRẦN MINH ANH. Bạn chỉ liên kết được tài khoản chính chủ." and I stay on the step; an already-linked number shows "Tài khoản này đã được liên kết."
- Given `?step=consent`, then I see "Cho phép Wallet" with "Nạp tiền vào ví từ tài khoản này" and "Rút tiền từ ví về tài khoản này", and the primary "Đồng ý liên kết".
- Given `?step=bank-app`, then a panel labelled "Mô phỏng ứng dụng Vietcombank" (bank name of my choice) shows the request and offers "Xác nhận liên kết" and "Từ chối"; on web the line "Mở ứng dụng ngân hàng trên điện thoại để xác nhận" sits above the same simulation.
- Given I confirm in the bank app, then `?step=result` shows "Đã liên kết Vietcombank ••6789"; if it is my first source it becomes default and the result says "Ví đã sẵn sàng để nạp tiền." with the primary "Nạp tiền" (to `/topup`) and "Về trang chủ"; otherwise the primary is "Xem nguồn tiền".
- Given I decline in the bank app, then result shows "Ngân hàng chưa xác nhận liên kết" with "Thử lại" (back to `bank-app`) and "Chọn ngân hàng khác".
- Given a successful link, then gate #4 clears everywhere at once (Home, shortcuts).

## UI states

- Empty: search with no match: "Không tìm thấy ngân hàng." 
- Loading: "Tiếp tục" spinner during the holder-name lookup; "Đang chờ xác nhận từ ngân hàng…" while the bank-app panel is open.
- Error: holder mismatch, already linked, and declined as above; a lookup failure reads "Chưa kiểm tra được tài khoản. Thử lại."
- Blocked: none; linking is not a money action in rules.md#gates and is itself the next step of gate #4.
- Overflow: account numbers up to 19 digits (cards) group in fours; a 40-character holder name wraps on the account and result steps.

## Design notes

- Web: flow page in the content column, max-width 560 (sitemap layouts); one step per card with "Quay lại" above; the bank-app simulation opens as a dialog with a neutral header so it never reads as Wallet UI.
- App: full-screen flow, tab bar hidden; bank list rows 56px with monogram; the bank-app simulation is a full-height sheet.
- No bank logos; monogram = first letters of the bank name in a 40px grey circle.

## FE notes

- `LinkSourceFlow` on the money-flow step frame (US-FND-007 pattern without auth); `store.sources.lookupHolder(bank, number)` and `store.sources.link(draft)`.
- `isOwnAccount(holderName, customerName)` pure: compare uppercase, diacritics removed, single spaces; TDD it.
- Optional `?return=home` from onboarding (US-ONB-010) sends the result's secondary action to `/home`.

## Mock data

- Banks: Vietcombank, VietinBank, BIDV, Techcombank, MB Bank, ACB (ia/mock-data.md). Lookup rule for the demo: numbers ending in `0000` return holder "NGUYỄN VĂN BÌNH" (mismatch); any other number returns the persona's name.
