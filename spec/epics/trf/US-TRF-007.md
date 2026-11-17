---
id: US-TRF-007
title: Bank transfer result with pending and failed outcomes
epic: TRF
priority: P0
status: Draft
size: M
routes: ["/transfer/bank"]
dependsOn: [US-TRF-006, US-FND-003, US-FND-004, US-FND-007, US-HIS-002]
---

## Story

As a wallet user, I want the result of a bank transfer to say plainly whether it arrived, is still with the bank, or came back to my wallet, so that I never wonder where my money is.

## Acceptance criteria

- Given auth succeeded and the next outcome is success, then a `bank_transfer` is created as `success` and `?step=result` shows "Chuyển tiền thành công", the amount, holder name, bank and "•••• 6789", fee, time, transaction ID, and "Xem chi tiết" / "Xong".
- Given the next outcome is "Đang xử lý", then the transaction is created as `pending` with `bank_processing`, the amount and fee are debited and counted in `pendingOut` (object-model.md), and the result shows "Đang xử lý", "Ngân hàng nhận đang xử lý, dự kiến xong trước 14:35." and "Nếu không thành công, tiền và phí sẽ hoàn về ví."
- Given I stay on a pending result and the transaction resolves (demo "Resolve pending" or Clock), then the result updates in place to success or failed without a reload, and a screen reader announces the new status.
- Given the next outcome is "Không thành công" with a reason, then the transaction is created as `failed` and the result shows "Chuyển tiền không thành công", the reason in plain words ("Ngân hàng nhận từ chối giao dịch." for `recipient_bank_rejected`, "Ngân hàng nhận không phản hồi kịp." for `timeout_reversed`, "Ngân hàng từ chối giao dịch." for `bank_declined`), "Tiền đã hoàn về ví lúc 14:05" and "Phí đã được hoàn cùng số tiền." (rules.md#fees), with "Thử lại" and "Liên hệ hỗ trợ" (to `/support/new` prefilled via the detail, US-HIS-002).
- Given any outcome, then a `balance_change` notification is created for each balance movement (debit, and reversal on failure) (rules.md#notifications).
- Given a failed transfer, then it does not count toward the general limit or consume a free slot; given a pending one, it counts toward both until it fails (rules.md#limits, rules.md#fees).
- Given I refresh on `?step=result`, then I am redirected to `/history/:txId`.

## UI states

- Empty: not applicable (result needs a transaction).
- Loading: "Đang chuyển tiền…" with amount and holder name until the store resolves; back disabled.
- Error: store throws before creating the transaction → "Không gửi được yêu cầu. Bạn chưa bị trừ tiền." with "Thử lại".
- Blocked: none at this step; gates and step-up were applied before (rules.md#gates, rules.md#step-up).
- Overflow: pending copy with a 40-character holder name wraps to three lines at 375px without pushing the buttons off-screen; amount `128.450.000 ₫` headline fits.

## Design notes

- Web (≥ 1024): result card, max-width 560. Status icon circle (success: black check; pending: amber clock; failed: danger cross), headline 24px, amount 40px, then a mini status timeline (Đã trừ tiền → Ngân hàng nhận xử lý → Hoàn tất / Hoàn tiền) with the current step highlighted, then detail rows and two pill buttons.
- App (< 1024): full-screen, no back arrow; buttons pinned to the bottom. The timeline is vertical with 3 steps.
- Pending and failed use the same headline size and layout as success; amber and danger are used only for the icon and the active timeline step, the rest stays black on white.

## FE notes

- Step `result` of `TransferBankFlow`; subscribes to `store.transactions.watch(txId)` so resolution updates live.
- Status timeline component should be the same one HIS uses on `/history/:txId` (US-HIS-002); build it there or here, whichever lands first, and share.
- ETA "dự kiến xong trước HH:mm" = `createdAt + config.bankProcessingEta`; the copy uses `failureReasonCopy` from US-TRF-004.

## Mock data

- Demo controls: next outcome Đang xử lý / Không thành công (reason picker: `recipient_bank_rejected`, `timeout_reversed`, `bank_declined`), Resolve pending, Clock +1 hour.
- Seed already has one pending and one failed `bank_transfer` for comparison in history.
