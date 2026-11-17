---
id: US-HIS-003
title: Receipt view
epic: HIS
priority: P0
status: Draft
size: S
routes: ["/history/:txId"]
dependsOn: [US-FND-002, US-HIS-002]
---

## Story

As a wallet user, I want a clean receipt for a transaction that I can print or share, so that I can prove a payment to a landlord, a shop, or a family member.

## Acceptance criteria

- Given I open `/history/:txId?view=receipt` for a success, pending, or refunded transaction, then I see the title "Biên lai giao dịch", the product name "Wallet", the status, the amount, "Mã giao dịch", "Thời gian", counterparty (masked phone or account), "Lời nhắn", "Phí", "Tổng tiền", and the "Dữ liệu mẫu" badge.
- Given the transaction is pending, then the receipt shows "Đang xử lý" prominently and the note "Biên lai này chưa phải xác nhận cuối cùng".
- Given the transaction is refunded, then the receipt shows "Đã hoàn tiền" and the refund amount and time.
- Given the transaction is failed, when I open `?view=receipt`, then I am redirected to `/history/:txId` (no receipt for money that did not move).
- Given the web layout, when I click "In biên lai", then the browser print dialog opens with only the receipt on the page.
- Given the app layout, when I tap "Chia sẻ", then the system share sheet opens with a text summary and the link; where Web Share is not available, the button reads "Sao chép" and copies the same text with the toast "Đã sao chép".
- Given the receipt, then it never shows my balance, PIN, or the full funding source number.

## UI states

- Empty: an unknown `txId` shows the not-found page (US-FND-006).
- Loading: receipt skeleton in the final layout.
- Error: "Không tải được biên lai." with "Thử lại".
- Blocked: none; viewing is never blocked (rules.md#gates).
- Overflow: counterparty "Nguyễn Hoàng Phương Thảo Nguyệt Quỳnh Như" and a 50-character message wrap; amount `128.450.000 ₫` fits the receipt width at 375px and on an A4 print.

## Design notes

- Web (≥ 1024): receipt as a single 1px bordered card, max-width 420, centered in the content column, with "In biên lai" and "Đóng" pills under it; a print stylesheet hides the shell and keeps black on white.
- App (< 1024): full-screen sheet over the detail with a close button; the card fills the width with a 16px gutter; "Chia sẻ" as a full-width black pill at the bottom.
- Amount is the display number; status is dot + label; no colour-only meaning, so a black-and-white print stays readable.

## FE notes

- `ReceiptView` rendered by `TransactionPage` when `view=receipt`; shares `TxDetails` field formatting with US-HIS-002.
- `receiptShareText(tx)` is a pure function to TDD (Vietnamese, formatted money and time, masked counterparty).
- `navigator.share` with a `navigator.clipboard` fallback; `window.print()` with `@media print`. No new dependency.
- Enhanced by HIS P1: Receipt as an image file.

## Mock data

- The seeded success, pending `bank_transfer`, refunded `qr_merchant`, and failed `bank_transfer` (for the redirect).
