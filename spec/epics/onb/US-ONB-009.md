---
id: US-ONB-009
title: Mandatory warning
epic: ONB
priority: P0
status: Draft
size: S
routes: ["/onboarding"]
dependsOn: [US-ONB-008]
---

## Story

As a customer about to start using my wallet, I want to read the prohibited uses and confirm I understood them, so that I know what can get my wallet locked, and the provider can prove I read it (TT 40 Đ.22 k.1 c).

## Acceptance criteria

- Given step `warning`, then I see "Cảnh báo quan trọng" and a scrollable list of prohibited uses:
  - "Không cho thuê, cho mượn, mua bán ví hoặc thông tin mở ví."
  - "Không mở ví hộ người khác hoặc dùng giấy tờ tùy thân của người khác."
  - "Không dùng ví cho cờ bạc, lừa đảo, rửa tiền hoặc giao dịch bất hợp pháp khác."
  - "Không chia sẻ mã PIN, mã OTP với bất kỳ ai."
  - and the consequence "Vi phạm có thể khiến ví bị tạm khóa và bị xử lý theo quy định của pháp luật."
- Given I have not scrolled to the end, then the checkbox "Tôi đã đọc và hiểu" is disabled and the helper reads "Cuộn hết nội dung để xác nhận".
- Given I scroll to the end, then the checkbox enables; "Tiếp tục" enables only when the end was reached **and** the box is ticked (rules.md#onboarding).
- Given the whole text fits without scrolling (large web viewport), then the end counts as reached on render.
- Given I press "Tiếp tục", then `customer.warningAcknowledgedAt` is stored and I go to `?step=terms`; there is no back control and no way to skip this step.

## UI states

- Empty: not applicable.
- Loading: none.
- Error: none; "Tiếp tục" simply stays disabled.
- Blocked: none.
- Overflow: at 320px with large text the list scrolls inside the step and the checkbox and button stay pinned below it.

## Design notes

- Web: the list sits in a 1px bordered box with its own scroll, max-height about 360px, inside the onboarding card; checkbox and pill under it.
- App: the list fills the screen; checkbox and pill pinned at the bottom with a 1px top rule; a subtle fade at the bottom of the list hints there is more.
- Not a modal and not a toast: it is a full step (research §1.1).

## FE notes

- `WarningStep`; `useScrolledToEnd(ref)` via an `IntersectionObserver` sentinel at the end of the list. TDD the enable rule as a pure `canContinue({ reachedEnd, ticked })`.
- Copy lives in `src/content/legal.vi.ts` so terms and warning are not inlined in components.

## Mock data

- None beyond the persona.
