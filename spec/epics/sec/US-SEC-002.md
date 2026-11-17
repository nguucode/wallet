---
id: US-SEC-002
title: Face match step-up
epic: SEC
priority: P0
status: Draft
size: M
routes: ["/transfer/bank", "/withdraw"]
dependsOn: [US-SEC-001, US-SEC-003, US-FND-004]
---

## Story

As a wallet user sending a large amount, I want to confirm it with my face and be told why, so that a stolen PIN alone can never move large sums out of my wallet.

## Acceptance criteria

- Given `requiredAuth` returns `face_match`, when the auth sheet opens, then it shows "Xác thực khuôn mặt" with the reason from the confirm step (for example "Cần xác thực khuôn mặt vì giao dịch trên 10.000.000 ₫"), an oval frame over a simulated camera view, the hint "Đưa khuôn mặt vào khung" and the button "Bắt đầu".
- Given I press "Bắt đầu", then the frame shows "Đang so khớp…" for the store latency, then resolves per Demo controls "Kết quả xác thực khuôn mặt" (default "Khớp").
- Given a match, then the sheet shows a check and resolves `{ method: 'face_match' }`; the transaction is then created and `dayCounter` resets to 0 (rules.md#step-up, US-SEC-003).
- Given no match with retries left, then the sheet shows "Khuôn mặt không khớp. Còn 2 lần thử." and "Thử lại".
- Given the configured number of failures is reached (rules.md#step-up), then the sheet shows "Thử lại sau" with "Không xác thực được khuôn mặt. Giao dịch chưa được thực hiện.", a "Đóng" button, and `requestAuth` rejects with `face_failed`; no transaction is created.
- Given the web layout, then the face step runs in the same dialog with the same simulated camera (no real camera access is requested) and the label "Camera mô phỏng".
- Given the user cancels at any point, then the sheet rejects with `cancelled` and nothing is created.

## UI states

- Empty: oval frame on a dark neutral camera placeholder, hint text, "Bắt đầu".
- Loading: "Đang so khớp…" with an indeterminate ring around the oval; buttons disabled.
- Error: no match and "Thử lại sau" above; a store error shows "Không kết nối được. Thử lại." without consuming a retry.
- Blocked: face failure ends this attempt only; it does not lock PIN. Gates (rules.md#gates) are checked before the sheet opens.
- Overflow: reason line with "499.999.999 ₫" and the summary line with a 40-character name wrap without pushing the oval off a 667px-tall screen.

## Design notes

- App: the sheet expands to full height for the face step; oval 240×300 centred, instructions below, primary pill at the bottom.
- Web: dialog 480px wide, oval 200×250.
- No real biometric imagery; a neutral silhouette. Success check uses the neutral-dark colour, not green fill; failure text in danger colour with `aria-live`.

## FE notes

- `src/auth/FaceStep.tsx` inside `AuthSheet`; `store.auth.faceMatch()` reads the Demo controls result (`store.demo.faceResult: 'match' | 'no_match'`).
- `faceReducer` (idle → matching → matched | retry | exhausted) TDD-tested with config `face.maxAttempts`.
- Do not call `getUserMedia`; the camera is a simulation on both layouts.

## Mock data

- Demo controls "Kết quả xác thực khuôn mặt": "Khớp" / "Không khớp". Amounts above the per-transaction threshold for transfers (for example 15.000.000 ₫) and the 100.000.000 ₫ payment threshold.
