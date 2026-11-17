---
id: US-TRF-004
title: Wallet transfer confirm and result
epic: TRF
priority: P0
status: Draft
size: M
routes: ["/transfer/wallet"]
dependsOn: [US-TRF-003, US-FND-004, US-FND-007, US-SEC-001, US-SEC-002, US-SEC-003, US-HIS-002]
---

## Story

As a wallet user, I want to see exactly what will happen and which check I will be asked for before I approve, and a plain result after, so that I trust the money went to the right person or know that it did not.

## Acceptance criteria

- Given a valid draft, when I open `?step=confirm`, then I see heading "Xác nhận", and rows "Người nhận" (name + phone masked as "0912 *** 890"), "Số tiền", "Phí" reading "Miễn phí" (rules.md#fees), "Tổng tiền", "Nguồn tiền" reading "Ví", and "Lời nhắn".
- Given the confirm step, then one line states the auth that `requiredAuth` (US-SEC-003) returns for `p2p_out`: "Cần nhập mã PIN" when PIN applies, or "Cần xác thực khuôn mặt vì giao dịch trên {perTxThreshold}" / "Cần xác thực khuôn mặt vì tổng giao dịch hôm nay trên {dayThreshold}" when face match applies (rules.md#step-up). Thresholds are formatted from config.
- Given I tap "Xác nhận", then balance and limit are re-checked first (rules.md#limits); if either now fails, I return to `?step=amount` with the same messages as US-TRF-003 and no auth sheet opens.
- Given the checks pass, then the auth overlay opens (US-SEC-001 PIN, or US-SEC-002 face match); given auth fails or is cancelled, then I stay on confirm and no transaction exists (object-model.md#transaction-state-machine).
- Given auth succeeds and the next outcome is success, then a `p2p_out` is created as `success`, the balance drops by the amount, a `balance_change` notification is created, and `?step=result` shows "Chuyển tiền thành công", the amount, recipient name, time "14:05 · 17/11/2026", the transaction ID (`WL` + 12 digits), and buttons "Xem chi tiết" (to `/history/:txId`) and "Xong" (to `/home`).
- Given the demo next outcome is "Không thành công", then the `p2p_out` is created as `failed` with `timeout_reversed`, the result shows "Chuyển tiền không thành công", the reason "Hệ thống không phản hồi kịp, giao dịch đã được hủy." and "Tiền đã hoàn về ví lúc 14:05", with "Thử lại" (back to confirm with the same draft) and "Xem chi tiết".
- Given the demo next outcome is "Đang xử lý", then it is ignored for this instant type (object-model.md: `p2p_out` is never pending) and the transfer succeeds.
- Given I refresh on `?step=result`, then I am redirected to `/history/:txId` (rules.md#spec-conventions).

## UI states

- Empty: not applicable; confirm without a draft restarts the flow at `?step=recipient`.
- Loading: "Xác nhận" shows a spinner while pre-checks run; after auth, a full-step "Đang chuyển tiền…" state with the amount stays until the store resolves (300–900 ms, US-FND-003). Back is disabled during it.
- Error: store throws (not a business failure) → "Không gửi được yêu cầu. Bạn chưa bị trừ tiền." with "Thử lại"; no transaction is created.
- Blocked: gates #1–#4 (rules.md#gates) were checked at entry; step-up is the gate at this step (rules.md#step-up). PIN lockout from US-SEC-001 shows its own message and keeps me on confirm.
- Overflow: recipient "Nguyễn Hoàng Phương Thảo Nguyệt Quỳnh Như" wraps to two lines in the confirm row (never truncated here: the user must read the full name before paying); amount `128.450.000 ₫` in the result headline fits at 375px; a 50-character message wraps.

## Design notes

- Web (≥ 1024): content column, max-width 560. Confirm is one bordered card: amount large at top, then label/value rows (label muted left, value right, 1px dividers), the auth line as a muted info row with a lock or face icon, then pill "Xác nhận" (black) and text button "Quay lại". Auth opens as a centred dialog. Result replaces the card: status icon in a 64px circle (success neutral-black check, failed danger), headline, amount, detail rows, two pill buttons.
- App (< 1024): full-screen confirm with the same rows; "Xác nhận" full-width pill pinned to the bottom safe area; auth opens as a bottom sheet. Result is full-screen with no back arrow (only "Xong"), so a back gesture cannot resubmit.
- Failed gets the same layout weight as success: same headline size, reason in plain words, and the reversal time.

## FE notes

- Steps `confirm`, `auth`, `result` on the US-FND-007 pattern. `store.transfers.sendToWallet(draft, authProof)` returns the transaction; outcome taken from the next-outcome demo control (US-FND-004), defaulting to success.
- Pre-check reuses `validateTransferAmount` from US-TRF-003; auth line from `requiredAuth('p2p_out', amount, dayCounter)`.
- `failureReasonCopy(reason)`: shared map from `failureReason` to Vietnamese copy, pure; also used by US-TRF-007 and PAY. Place it in the domain layer, not in a page.
- Idempotency: the draft gets a client id at confirm; a double tap on "Xác nhận" creates one transaction.

## Mock data

- `ready` scenario; dayCounter seeded low so PIN applies; amount above the per-transaction threshold shows the face match line.
- Demo controls: next outcome "Không thành công", face match "no match" for retries (US-SEC-002).
