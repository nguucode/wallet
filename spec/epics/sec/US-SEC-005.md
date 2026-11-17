---
id: US-SEC-005
title: Limits screen
epic: SEC
priority: P0
status: Draft
size: M
routes: ["/me/limits"]
dependsOn: [US-FND-001, US-FND-002, US-FND-003, US-SEC-003]
---

## Story

As a wallet user, I want to see how much of each monthly limit I have used and when face match will be asked, explained in plain words, so that the law shows up as information before it shows up as a refusal.

## Acceptance criteria

- Given I open `/me/limits`, then I see H1 "Hạn mức" and three sections: "Hạn mức chung trong tháng", "Hạn mức thiết yếu trong tháng", and "Xác thực giao dịch".
- Given "Hạn mức chung trong tháng", then it shows a meter with "Đã dùng 62.000.000 ₫ / 100.000.000 ₫", "Còn lại 38.000.000 ₫", the line "Tính trên chuyển tiền, thanh toán QR và hóa đơn không thiết yếu. Không tính nạp tiền, rút tiền và tiền nhận vào.", and when pending transactions are included, "Gồm 1.200.000 ₫ đang xử lý" (rules.md#limits).
- Given "Hạn mức thiết yếu trong tháng", then it shows the same meter for essential bills with "Dành cho hóa đơn điện. Không trừ vào hạn mức chung."
- Given both meters, then each shows "Làm mới lúc 00:00 01/12/2026" (first day of next calendar month, Asia/Ho_Chi_Minh).
- Given "Xác thực giao dịch", then it shows today's counter "Hôm nay đã giao dịch 4.500.000 ₫ bằng mã PIN" and the rules from rules.md#step-up rendered from config: "Nạp, rút, chuyển tiền đến 10.000.000 ₫ mỗi giao dịch và tổng 20.000.000 ₫ mỗi ngày: mã PIN", "Vượt một trong hai mức trên: xác thực khuôn mặt", "Thanh toán QR và hóa đơn đến 100.000.000 ₫: mã PIN; trên mức này: xác thực khuôn mặt", "Sau mỗi lần xác thực khuôn mặt, tổng trong ngày bắt đầu lại từ 0".
- Given `limitCounters(transactions, now)`, then it returns used, limit, remaining and pending-included for each limit, counting `pending`, `success` and `refunded` and never `failed`, per the counted types in rules.md#limits.
- Given the `near-limit` scenario, then the general meter shows "Còn lại 2.500.000 ₫" in warning tone.

## UI states

- Empty: a month with no counted transactions shows "Đã dùng 0 ₫ / 100.000.000 ₫" and a full "Còn lại".
- Loading: three card skeletons with meter bars.
- Error: "Không tải được hạn mức." with "Thử lại".
- Blocked: none. Viewing limits is never gated (rules.md#gates).
- Overflow: used above the limit cannot happen (rejected at the amount step), but the meter clamps at 100% if seed or clock produces it; "Đã dùng 99.999.999 ₫ / 100.000.000 ₫" fits one line at 320px or wraps after "/".

## Design notes

- Web: content column, one 1px bordered card per section, meter 8px tall pill track with the accent fill; numbers in tabular figures; warning tone (amber) only when remaining ≤ 10% of the limit.
- App: same cards stacked full-width with 16px gutters under header "Hạn mức"; reachable from Me hub and from the "Xem hạn mức" link on amount errors.
- Meters have `role="meter"` with `aria-valuenow`, `aria-valuemax` and `aria-valuetext` "Đã dùng 62 phần trăm".

## FE notes

- `src/rules/limits.ts`: `limitCounters(transactions, now, config)` and `nextReset(now)`, pure, TDD-tested: topup/withdraw/incoming excluded, essential bill only in essential, failed excluded, pending and refunded included, month boundary at 17:00 UTC on the last day.
- Shares `stepUp` config and `dayCounter` with US-SEC-003; the amount step (US-FND-010) uses `limitCounters`.
- The 10% warning tone is a design choice, not a rule; keep it in the component, not config.

## Mock data

- `ready` (about 62% general, about 1% essential, the pending bank transfer included), `near-limit` (97.500.000 ₫), Clock "Sang tháng sau" resets both meters.
