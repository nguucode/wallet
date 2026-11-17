---
id: US-ONB-007
title: Face scan
epic: ONB
priority: P0
status: Draft
size: S
routes: ["/onboarding"]
dependsOn: [US-ONB-005, US-ONB-006, US-SEC-002]
---

## Story

As a customer opening a wallet, I want a short guided face scan, so that my face can be matched against my CCCD data.

## Acceptance criteria

- Given step `face`, then I see "Xác thực khuôn mặt", the tips "Nhìn thẳng vào camera, đủ sáng, không đeo kính râm hay khẩu trang.", and "Bắt đầu".
- Given I press "Bắt đầu", then an oval frame shows liveness prompts in order: "Đưa khuôn mặt vào khung", "Quay nhẹ sang trái", "Quay nhẹ sang phải", then "Giữ yên", each announced to screen readers.
- Given the scan completes, then I go to `?step=verifying` automatically; there is no back control from here (US-ONB-001).
- Given camera permission is denied, then I see "Wallet cần quyền dùng camera để xác thực khuôn mặt." with "Thử lại"; the demo "Dùng ảnh mẫu" link continues with the sample face.
- Given the web layout, then the same step uses the computer camera (simulated) and the copy reads "Nhìn thẳng vào camera của máy tính".

## UI states

- Empty: intro with tips.
- Loading: prompts advance on a timer; a thin accent progress ring around the oval.
- Error: permission denied as above. Mismatch is not decided here; it is a verification outcome (US-ONB-008).
- Blocked: none.
- Overflow: prompts are single short lines; at 320px they wrap without overlapping the oval.

## Design notes

- App: full-bleed dark camera view, oval cut-out, prompt text white above the oval, 48px "Bắt đầu" pill below.
- Web: the camera view sits inside the onboarding card at 4:3, prompt under it.
- Same visual and component as the face-match step-up (US-SEC-002) so the user recognises it later.

## FE notes

- Reuse `FaceScan` from US-SEC-002 in `mode="enroll"`; it emits `complete` and does not decide match/no-match (that is the onboarding verification result, not the step-up Face match result control).

## Mock data

- Bundled sample face frame; no real camera required.
