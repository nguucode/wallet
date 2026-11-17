---
id: US-MNY-007
title: "Withdraw result: success, pending, failed"
epic: MNY
priority: P0
status: Draft
size: S
routes: ["/withdraw", "/history/:txId", "/home"]
dependsOn: [US-MNY-006, US-FND-004, US-HIS-002]
---

## Story

As a wallet user who has just withdrawn, I want to see whether the money reached my bank, is still on its way, or came back, and when, so that I never wonder where my money is.

## Acceptance criteria

- Given Demo "Next outcome" is "Thành công", then the result reads "Rút tiền thành công", the amount, and "Tiền đã về Vietcombank ••6789.", with "Xem chi tiết" and "Về trang chủ".
- Given "Đang xử lý", then the transaction is `pending` (`bank_processing`) and the result reads "Đang xử lý", "Ngân hàng đang xử lý, dự kiến xong trước 15:05." and "Nếu không thành công, tiền và phí sẽ hoàn về ví."; Home's "Đang xử lý: …" line includes the amount plus fee.
- Given "Không thành công" with a reason, then the result reads "Rút tiền không thành công", the reason in plain words (e.g. "Vietcombank đã từ chối giao dịch."), "Tiền đã hoàn về ví lúc 14:07", and "Phí được hoàn và không tính vào lượt miễn phí." (rules.md#fees).
- Given a pending result is still open when Demo "Resolve pending" settles it, then the screen updates in place to the success or failed copy above.
- Given I refresh on `?step=result`, then I am redirected to `/history/:txId` (rules.md#spec-conventions).

## UI states

- Empty: not applicable.
- Loading: the result waits for the store latency with "Đang gửi yêu cầu…".
- Error: the failed result above is the error state; store errors before creation stay on confirm with "Chưa gửi được yêu cầu. Thử lại."
- Blocked: gates were checked at entry by US-MNY-006; none here.
- Overflow: `128.450.000 ₫` in the result headline at 375px steps down one display size; the reason wraps to three lines.

## Design notes

- Web and app share the result pattern from US-FND-007: 64px status icon (accent tick, amber clock, danger cross), heading, amount, explanation, two actions.
- Pending shows a three-step mini timeline "Đã gửi yêu cầu" → "Ngân hàng đang xử lý" → "Tiền về tài khoản", current step amber.
- App: actions pinned at the bottom; web: under the card.

## FE notes

- `WithdrawResult` subscribes to the transaction by id so "Resolve pending" updates it. ETA "dự kiến xong trước HH:mm" = `createdAt + config.pendingEta.bank_processing`.
- Failed copy maps `failureReason` (`bank_declined`, `timeout_reversed`) through the shared `failureCopy()` used by HIS.

## Mock data

- Demo controls "Next outcome", "Resolve pending", and "Clock" (ia/mock-data.md#demo-controls).
