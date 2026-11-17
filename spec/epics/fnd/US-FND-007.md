---
id: US-FND-007
title: "Money flow pattern: steps, confirm, and result"
epic: FND
priority: P0
status: Draft
size: M
routes: ["/topup", "/withdraw", "/transfer/wallet", "/transfer/bank", "/pay/merchant", "/bills/:billId"]
dependsOn: [US-FND-001, US-FND-002, US-FND-003, US-FND-009, US-FND-010, US-SEC-001, US-SEC-003, US-SEC-004, US-HIS-002]
---

## Story

As a wallet user, I want every money action to walk the same steps and show me exactly what will happen before I authenticate, so that I always know the amount, fee, recipient and outcome, including when it is still processing or did not go through.

## Acceptance criteria

- Given a flow declared in sitemap.yaml with `steps`, when I move between steps, then the URL updates with `?step=<id>` (push), browser Back returns to the previous step, and a step loaded from a URL without its in-memory draft restarts at the first step (replace) (rules.md#spec-conventions).
- Given the confirm step, then it shows rows "Số tiền", "Phí", "Tổng tiền", "Nguồn tiền", the counterparty row supplied by the flow (name plus masked phone or account), "Lời nhắn" when present, and one auth line from `requiredAuth` (US-SEC-003): "Xác thực bằng mã PIN", or "Cần xác thực khuôn mặt vì giao dịch trên 10.000.000 ₫", or "Cần xác thực khuôn mặt vì tổng giao dịch hôm nay vượt 20.000.000 ₫", with the amounts formatted from config (rules.md#step-up, rules.md#money-rules).
- Given the "Phí" row, then it shows the result of `feeFor` (US-FND-009): "Miễn phí", "Miễn phí (còn 3 lượt trong tháng)", or a formatted fee.
- Given I press "Xác nhận", then gates (US-SEC-004) and amount checks (US-FND-010) are re-run against current state; if one now fails, the flow shows it instead of opening auth; otherwise the auth sheet opens (US-SEC-001) and, only on success, the flow's commit action runs and the flow moves to `result`.
- Given the auth sheet is dismissed or locked, then no transaction is created and I stay on confirm.
- Given the result is `success`, then it shows "Thành công", the signed amount, counterparty, time and "Mã giao dịch WL…", with "Về trang chủ" and "Xem chi tiết" (→ `/history/:txId`).
- Given the result is `pending`, then it shows "Đang xử lý", "Dự kiến xong trước 15:05", and "Nếu không thành công, tiền sẽ hoàn về ví."; given `failed`, then it shows "Không thành công", the reason in plain words, "Tiền đã hoàn về ví lúc 14:05" when the amount had been debited, and "Thử lại" and "Liên hệ hỗ trợ".
- Given I refresh on `?step=result`, then I am redirected to `/history/:txId` of that transaction (rules.md#spec-conventions); given I press the close button with an amount entered, then "Hủy giao dịch?" asks "Thông tin bạn đã nhập sẽ không được lưu." with "Tiếp tục nhập" and "Hủy".

## UI states

- Empty: not applicable; each flow supplies its own first step.
- Loading: "Xác nhận" shows a spinner and is disabled while the commit resolves; the result screen never renders before the transaction exists.
- Error: if the commit action throws (not a failed transaction, a defect), the confirm step shows "Không thực hiện được giao dịch. Bạn chưa bị trừ tiền." with "Thử lại".
- Blocked: gate from rules.md#gates, checked at the flow entry (US-SEC-004) and again on "Xác nhận"; the gate overlay replaces the step content.
- Overflow: counterparty "Nguyễn Hoàng Phương Thảo Nguyệt Quỳnh Như" wraps to two lines on confirm and result, never truncates there (it is what the user is approving); amount "128.450.000 ₫" fits the result headline at 320px.

## Design notes

- Web: flow page in the content column, max-width 560px, one 1px bordered card per step, primary action as a black pill at the card bottom, secondary as a text link; step title as H1.
- App: full-screen, tab bar hidden, header with back chevron and close "×"; primary pill pinned above the keyboard/safe area, 48px tall.
- Confirm rows: label left muted 14px, value right 14px; "Tổng tiền" row bold with a 1px divider above. Auth line uses a lock or face icon in a neutral circle.
- Result: status as icon + label (success neutral-dark check, pending amber clock, failed red cross), amount at display size, then a short timeline sentence. Pending and failed get the same layout weight as success.

## FE notes

- `src/flows/MoneyFlow.tsx` takes `{ screenId, steps: StepDef[], buildConfirm(draft), commit(draft): Promise<Transaction> }`; step ids come from sitemap.yaml via `screenFor()`.
- Draft lives in a flow-scoped React context (not the store), so refresh drops it by design.
- `failureReasonLabel(reason)` and `pendingCopy(tx, now)` are pure and TDD-tested; `expectedAt` = `createdAt` + a per-`pendingReason` SLA from config (object model has no field for it; reported gap).
- Flows supply their own recipient/view steps; `amount` is US-FND-010; `auth` is the overlay, so the `auth` step id only marks the URL while the sheet is open.

## Mock data

- Next-outcome overrides from demo controls for all three result states; the 40-character contact; `rich` balance; failure reasons from object-model.md.
