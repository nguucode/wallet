---
id: US-ONB-008
title: Verification result
epic: ONB
priority: P0
status: Draft
size: M
routes: ["/onboarding", "/home"]
dependsOn: [US-ONB-007, US-FND-004, US-SEC-004]
---

## Story

As a customer who has just scanned my face, I want to see plainly whether my identity was verified, is under review, or failed and why, so that I know what to do next instead of retrying blindly.

## Acceptance criteria

- Given step `verifying`, then I see "Đang đối chiếu thông tin…" with the line "Thường mất vài giây." and `kycStatus` is `verifying`.
- Given the Demo control "Verification result" is instant (default), when verification resolves, then `kycStatus` becomes `verified`, a check with "Xác thực thành công" shows for about a second, and I continue to `?step=warning`.
- Given the control is "needs review", then `kycStatus` stays `verifying` and I see "Hồ sơ đang được kiểm tra" with "Thường xong trong 24 giờ. Bạn vẫn có thể hoàn tất mở ví, nhưng chưa giao dịch được cho đến khi có kết quả." and "Tiếp tục" to `?step=warning` (rules.md#onboarding).
- Given the control is a failure reason, then `kycStatus` returns to `unverified`, I see "Chưa xác thực được", the reason in plain words, and one primary action that goes to the step that fixes it:
  - ảnh CCCD mờ → "Ảnh CCCD bị mờ hoặc lóa nên không đọc được thông tin." / "Chụp lại CCCD" → `id-capture`
  - không đọc được chip → "Không đọc được chip CCCD. Hãy tháo ốp lưng và giữ thẻ sát mặt lưng điện thoại." / "Đọc lại chip" → `nfc`
  - khuôn mặt không khớp → "Khuôn mặt không khớp với ảnh trong chip CCCD." / "Xác thực lại khuôn mặt" → `face`
  - mạng yếu → "Mạng yếu nên chưa gửi được hồ sơ." / "Thử lại" → `verifying`
- Given the failure reason points to a step that is not on my path (chip or CCCD photo reasons on the VNeID path), then the action goes to `id-method` instead.
- Given a failure, then the secondary link "Để sau" takes me to `/home`, where gate #1 shows (rules.md#gates); given needs review, Home later shows gate #1 in its "Đang kiểm tra, thường xong trong 24 giờ" form.

## UI states

- Empty: not applicable.
- Loading: the verifying screen itself; it waits at least the store latency so the state is visible.
- Error: the four failure reasons above; a store error is treated as "mạng yếu".
- Blocked: none (this is the step that clears gate #1).
- Overflow: reason text wraps to four lines at 320px; the action label never truncates.

## Design notes

- Web and app share one centred result composition: 64px status icon in a grey circle (success tick in accent, review clock in amber, failure in danger), heading, one paragraph, primary pill, secondary text link.
- Needs review uses amber, not danger: it is a waiting state, not an error (PRODUCT.md principle "No hidden states").
- App: actions pinned to the bottom; web: actions under the text inside the card.

## FE notes

- `store.onboarding.verify()` reads the Demo control "Verification result" (US-FND-004) and resolves to `verified | needs_review | failed(reason)`.
- `retryStepFor(reason, path)` is pure; TDD all four reasons on both paths.
- `kycStatus` transitions follow object-model.md enums (`verifying → unverified` on failure).

## Mock data

- Demo control values: instant, needs review, and the four reasons from ia/mock-data.md#demo-controls and rules.md#onboarding.
