---
id: US-SEC-004
title: Gates on money actions
epic: SEC
priority: P0
status: Draft
size: M
routes: ["/home", "/topup", "/withdraw", "/transfer", "/transfer/wallet", "/transfer/bank", "/pay/scan", "/pay/merchant", "/pay/code", "/bills/:billId"]
dependsOn: [US-FND-001, US-FND-003]
---

## Story

As a wallet user whose wallet cannot transact yet, I want to be told why the moment I tap a money action, with the one thing I need to do next, so that I never type an amount only to be refused.

## Acceptance criteria

- Given wallet state, when `activeGate(state)` is called, then it returns the first matching gate in the order of rules.md#gates (1 unverified/verifying, 2 suspended, 3 locked, 4 no linked source) or `null`; `id_expiring` returns `null`.
- Given a gate is active, when I tap or click any money entry point (shortcuts "Nạp", "Rút", "Chuyển", "Hóa đơn" pay action, "Quét mã", "Mã thanh toán", sidebar "Chuyển tiền", "Thanh toán", tab "Quét mã"), then the gate overlay "Chặn giao dịch" opens instead of the flow, before any amount is typed.
- Given gate 1 with `unverified`, then it shows "Ví chưa được xác thực sinh trắc học" and "Xác thực ngay" → `/onboarding?step=id-method`; with `verifying`, it shows "Đang kiểm tra, thường xong trong 24 giờ" and only "Đóng".
- Given gate 2, then it shows "Giấy tờ tùy thân đã hết hạn, ví tạm ngừng giao dịch" and "Đóng" (the CCCD update flow is P1).
- Given gate 3, then it shows "Ví đang tạm khóa" and "Đóng" (unlock is P1).
- Given gate 4, then it shows "Cần liên kết ngân hàng chính chủ trước khi dùng ví" and "Liên kết ngân hàng" → `/me/sources/link`.
- Given a gate is active and I open a money route by URL (for example `/transfer/bank?step=amount`), then the route renders the gate panel in place of the step, with "Về trang chủ".
- Given a gate is active, then viewing Home balance, history, transaction detail, limits, profile and notifications is never blocked, and `<GateCard>` is available for Home's gate section (rules.md#gates).

## UI states

- Empty: no gate → entry points act normally.
- Loading: until wallet state has loaded, entry points wait (button spinner) rather than opening a flow that might be gated.
- Error: if state fails to load, entry points show "Không kiểm tra được trạng thái ví. Thử lại." and do not open the flow.
- Blocked: this story defines the blocked state for every money action (rules.md#gates).
- Overflow: gate messages wrap to at most three lines at 320px; the CTA label never truncates.

## Design notes

- App: bottom sheet with a line icon in a 48px neutral circle, title as the gate message, one sentence of reason, one black pill CTA, "Đóng" as text.
- Web: centred dialog 440px, same content. In-route panel uses the same content inside the flow card.
- `<GateCard>` for Home: 1px bordered card, message + CTA, no red fill; gate 2 uses danger text for the title only.

## FE notes

- `src/rules/gates.ts`: `activeGate(state): Gate | null` pure, TDD-tested with one case per row plus precedence (unverified + no source → 1; suspended + no source → 2) and `id_expiring` → null; each scenario in mock-data.md maps to its expected gate.
- `useGuardedAction(go)` returns a handler that opens `<GateOverlay>` or calls `go()`; `<GatedRoute>` wraps money routes.
- `/receive` is not gated in P0 (rules.md lists only top up, withdraw, transfer, pay, bills; reported gap).

## Mock data

- Scenarios `unverified` (gate 1), `suspended` (gate 2), `no-source` (gate 4), `ready` (none), `id-expiring` (none). Gate 3 has no scenario; covered by unit test only.
