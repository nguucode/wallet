---
id: US-FND-004
title: Demo controls panel
epic: FND
priority: P0
status: Draft
size: M
routes: ["/home"]
dependsOn: [US-FND-001, US-FND-003]
---

## Story

As a reviewer, I want one panel that puts the wallet into any state and forces the next outcome, so that I can see pending, failed, refunded, gated and locked paths in minutes instead of setting them up by hand.

## Acceptance criteria

- Given the web layout, when I click "Demo controls" in the top bar, then a non-modal panel opens on the right without covering the content column; given the app layout, when I long-press the screen header for 600 ms, then the same panel opens as a full-height sheet.
- Given the panel, then it shows, in this order: "Kịch bản" (the eight scenarios from mock-data.md, current one selected) with "Đặt lại dữ liệu"; "Kết quả giao dịch tiếp theo" ("Thành công", "Đang xử lý", "Không thành công" with a reason picker); "Xử lý giao dịch đang chờ" ("Tất cả thành công", "Tất cả không thành công"); "Nhận tiền từ liên hệ"; "Thu ngân quét Mã thanh toán"; "Kết quả xác thực danh tính"; "Kết quả xác thực khuôn mặt" ("Khớp", "Không khớp"); "Cửa hàng hoàn tiền"; "Đồng hồ" ("+1 giờ", "+1 ngày", "Sang tháng sau"); "Độ trễ" ("Mặc định", "0 giây", "3 giây").
- Given the panel header, then it reads "Demo controls" with the line "Mô phỏng cho người xem bản demo, không phải tính năng của ví."
- Given I pick "Không thành công" with reason `bank_declined`, when the next money commit runs, then that transaction fails with that reason and the control returns to "Thành công", showing "Áp dụng cho giao dịch tiếp theo" while armed.
- Given a control has nothing to act on (no pending transaction, no open Payment Code, no `qr_merchant` to refund), then it is disabled with the reason inline, for example "Không có giao dịch đang xử lý".
- Given I click "Nhận tiền từ liên hệ", then a `p2p_in` of a random seeded amount from a contact with a wallet is committed and its notification appears (US-NTF-003).
- Given I switch scenario or reset, then the store resets (US-FND-003), any open flow returns to `/home`, and a toast confirms "Đã chuyển sang kịch bản near-limit".

## UI states

- Empty: not applicable.
- Loading: a control shows a spinner in its button while its store action resolves; other controls stay usable.
- Error: if an action throws, the control shows "Không thực hiện được" inline and the store is unchanged.
- Blocked: none. Demo controls bypass gates by design; scenario switching is how a reviewer leaves a gate.
- Overflow: the panel scrolls internally; on a 700px-tall window every section stays reachable; scenario names are code ids in monospace so they never wrap.

## Design notes

- Web: 360px panel docked right under the top bar, 1px left border, light neutral surface so it reads as outside the product; sections separated by 1px dividers; segmented controls as pills.
- App: bottom sheet at 90% height with a grab handle; same sections; 48px targets.
- Visually distinct from the wallet (neutral surface, monospace scenario ids, "Demo" tag) so screenshots never confuse it with product UI.

## FE notes

- `src/demo/DemoControls.tsx`; each control calls a `store.demo.*` action. Actions whose behaviour belongs to another Epic are implemented there and only wired here: cashier scan (PAY), verification result (ONB), face match result (US-SEC-002), merchant refund (HIS or PAY, whichever owns refunds).
- "Kết quả xác thực danh tính" options: "Ngay lập tức", "Cần xem xét", and the four failure reasons from rules.md#onboarding.
- Panel open state per layout in `localStorage` (`wallet.demo.open`), try/catch.

## Mock data

- All scenarios; the seeded pending `bank_transfer` and settling `bill` for "Xử lý giao dịch đang chờ"; the refunded `qr_merchant` edge case for "Cửa hàng hoàn tiền".
