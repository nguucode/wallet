---
id: US-HIS-002
title: Transaction detail
epic: HIS
priority: P0
status: Draft
size: M
routes: ["/history/:txId"]
dependsOn: [US-FND-001, US-FND-002, US-FND-003, US-FND-006]
---

## Story

As a wallet user, I want one page per transaction that says where it is, every detail of it, and what I can do next, so that I always know whether my money arrived and how to get help if it didn't.

## Acceptance criteria

- Given I open `/history/:txId`, then the header shows the type icon, counterparty name, type label, signed amount at display size, and the status label "Thành công", "Đang xử lý", "Không thành công", or "Đã hoàn tiền".
- Given the status timeline, then a pending-capable transaction shows "Đã tạo · HH:mm", then "Đang xử lý" in amber with "Dự kiến xong trước HH:mm" and "Nếu không thành công, tiền sẽ tự hoàn về ví", then the final step; a failed one ends with the reason in plain words (e.g. "Quá thời gian xử lý" for `timeout_reversed`) and "Tiền đã hoàn về ví lúc HH:mm"; instant types show one step only (object-model.md state machine).
- Given the details card, then it lists "Mã giao dịch" (`WL` + 12 digits, with "Sao chép"), "Thời gian", "Loại giao dịch", counterparty ("Người nhận", "Người gửi", "Cửa hàng", or "Nhà cung cấp" with masked phone, account, or customer code), "Lời nhắn" when present, "Nguồn tiền" (e.g. "Vietcombank ••••6789" or "Số dư ví"), "Phí" ("Miễn phí" or the amount), "Tổng tiền", and "Xác thực bằng" ("Mã PIN", "Sinh trắc học thiết bị", or "Khuôn mặt").
- Given the action row, then "Biên lai" opens `?view=receipt` (success, pending, refunded; hidden when failed), "Liên hệ hỗ trợ" opens `/support/new?txId=:txId`, and "Chuyển lại" appears only for `p2p_out` and `bank_transfer` and opens the matching transfer flow prefilled with the same recipient, amount, and message.
- Given the transaction is `refunded`, then a linked row "Hoàn tiền · +185.000 ₫ · 12/11/2026" opens the `refund` transaction; given a `refund` transaction, then a linked row "Hoàn tiền cho giao dịch WL…" opens the original.
- Given a successful `p2p_out`, then a panel "Chuyển nhầm người nhận?" explains "Giao dịch chuyển tiền đã thành công không thể hủy hoặc thu hồi. Hãy nhắn người nhận để đề nghị chuyển trả." with "Nhắn người nhận" (placeholder link) first and "Liên hệ hỗ trợ" second (rules.md#history-and-support).
- Given a SupportRequest already exists for this transaction, then "Liên hệ hỗ trợ" is replaced by the line "Đã gửi yêu cầu hỗ trợ ngày 10/11/2026 · Đã tiếp nhận".
- Given the transaction is older than the support window (rules.md#history-and-support), then "Liên hệ hỗ trợ" stays visible and opens the form in its disabled state (US-HIS-004).

## UI states

- Empty: an unknown `txId` shows the not-found page (US-FND-006).
- Loading: header and card skeletons in the final layout.
- Error: "Không tải được giao dịch." with "Thử lại".
- Blocked: none for viewing (rules.md#gates). "Chuyển lại" is a money entry point: tapping it under an active gate shows the gate from US-SEC-004 instead of the flow.
- Overflow: counterparty "Nguyễn Hoàng Phương Thảo Nguyệt Quỳnh Như" wraps to two lines in the header; a 50-character message with diacritics wraps; amount `128.450.000 ₫` fits the display size at 375px without clipping stacked diacritics.

## Design notes

- Web (≥ 1024): content column, max-width 560; back link "Lịch sử" above; amount as the page's display number with status under it; timeline as a vertical stepper (done black, current amber, failed danger) inside a 1px bordered card; details as label/value rows in a second card; actions as pill buttons in one row.
- App (< 1024): full-screen with header back to `/history`, tab bar visible; actions become a row of 48px circular icon buttons with labels under them (the "Truy cập nhanh" grammar); the wrong-recipient panel sits above the details card.
- Pending and failed get the same visual weight as success: icon, plain sentence, time, next step.

## FE notes

- `TransactionPage` with `TxHeader`, `StatusTimeline`, `TxDetails`, `TxActions`, `WrongRecipientPanel`, `LinkedTxRow`.
- Pure functions to TDD: `timelineSteps(tx, config.pendingEta)`, `failureReasonCopy(reason)`, `availableActions(tx, supportRequest, today, config)`, `maskCounterparty(counterparty)`.
- "Chuyển lại" prefill uses query params per rules.md#spec-conventions; the param names are owned by TRF.
- Enhanced by HIS P1: Support cases list and case tracking (the existing-request line becomes a link).

## Mock data

- The pending `bank_transfer`, failed `bank_transfer` (timeout_reversed), refunded `qr_merchant` with its `refund` row, settling `bill`, a successful `p2p_out` to the long-name contact, and the 2 seeded SupportRequests on their transactions.
- One transaction older than 60 days for the disabled support path (the 12-month history covers it).
