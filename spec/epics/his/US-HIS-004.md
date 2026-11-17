---
id: US-HIS-004
title: Contact support form
epic: HIS
priority: P0
status: Draft
size: M
routes: ["/support/new"]
dependsOn: [US-FND-001, US-FND-003, US-HIS-002]
---

## Story

As a wallet user, I want to report a problem with a transaction in a form that already knows which transaction I mean, so that I explain the issue once and know how long an answer will take.

## Acceptance criteria

- Given I open `/support/new?txId=:txId` from a transaction, then a summary card at the top shows "Mã giao dịch", amount, and time, read-only (rules.md#history-and-support), and `?step=reason` lists only the reasons that fit the transaction: "Chuyển nhầm người nhận" (`p2p_out`, `bank_transfer`), "Người nhận chưa nhận được tiền" (`p2p_out`, `bank_transfer`), "Bị trừ tiền hai lần", "Giao dịch không thành công nhưng tiền chưa hoàn về" (failed only), and "Vấn đề khác".
- Given I open `/support/new` without a transaction, then all reasons are listed; choosing one of the transaction reasons shows "Hãy mở giao dịch trong Lịch sử và chọn Liên hệ hỗ trợ để gửi yêu cầu về giao dịch đó" with the link "Mở Lịch sử", and only "Vấn đề khác" continues.
- Given I choose "Chuyển nhầm người nhận" for a successful `p2p_out`, then the details step first repeats "Ví không thể tự hủy giao dịch đã thành công" and the link "Nhắn người nhận" before the form fields.
- Given `?step=details`, then I see the field "Mô tả vấn đề" (required, 20–500 characters, with a live counter) and "Số điện thoại liên hệ" prefilled with my phone; "Gửi yêu cầu" stays disabled until the description is valid.
- Given I tap "Gửi yêu cầu", then a SupportRequest is created with status `received` and linked to the transaction, and `?step=sent` shows "Đã gửi yêu cầu hỗ trợ", the request ID, and "Thời gian xử lý tối đa 30 ngày làm việc", with "Về giao dịch" (or "Về Trợ giúp" when there is no transaction).
- Given the transaction is older than the support window (rules.md#history-and-support), then the form shows the summary card and "Giao dịch đã quá {supportWindowDays} ngày nên không thể gửi yêu cầu hỗ trợ trực tuyến" (the number filled from config), with all fields and "Gửi yêu cầu" disabled.
- Given the transaction already has a SupportRequest, then the form is not shown and the page reads "Giao dịch này đã có yêu cầu hỗ trợ" with its ID and status.
- Given I reload `?step=details` or `?step=sent` without the in-memory draft, then I land on `?step=reason` with the transaction still prefilled from `txId`.

## UI states

- Empty: none; an unknown `txId` shows "Không tìm thấy giao dịch" with "Mở Lịch sử".
- Loading: summary card skeleton; "Gửi yêu cầu" shows a spinner while sending.
- Error: send failure keeps the typed description and shows "Không gửi được yêu cầu. Thử lại".
- Blocked: none; contacting support is never gated (rules.md#gates covers money actions only).
- Overflow: a 500-character description with stacked diacritics wraps without clipping; the summary card fits `128.450.000 ₫` and "Nguyễn Hoàng Phương Thảo Nguyệt Quỳnh Như" at 375px.

## Design notes

- Web (≥ 1024): flow page in the content column, max-width 560, H1 "Liên hệ hỗ trợ"; reasons as 48px radio rows in one 1px bordered card; the summary card sits above every step; the sent step uses the result layout of US-FND-007 without an amount.
- App (< 1024): full-screen flow, tab bar hidden, header with back; "Tiếp tục" and "Gửi yêu cầu" as a full-width black pill pinned to the bottom; the textarea grows with content.
- The disabled state explains itself in one sentence above the disabled fields, not in a tooltip.

## FE notes

- Route `/support/new?step=reason|details|sent&txId=`; draft in a flow store.
- Pure functions to TDD: `reasonsFor(tx)`, `isWithinSupportWindow(tx, today, config.supportWindowDays)`, `validateDescription(text)`.
- `store.support.create({ transactionId, reason, details, phone })` returns the new request; ID format to be fixed in object-model.md (proposed `HT` + 8 digits).
- Enhanced by HIS P1: Support cases list and case tracking.

## Mock data

- A recent failed `bank_transfer`, a successful `p2p_out` to the long-name contact, a transaction older than 60 days, and the 2 seeded SupportRequests (one `received`, one `resolved`) on their transactions.
