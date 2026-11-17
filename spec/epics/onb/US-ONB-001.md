---
id: US-ONB-001
title: Onboarding frame and step routing
epic: ONB
priority: P0
status: Draft
size: S
routes: ["/onboarding"]
dependsOn: [US-FND-001, US-FND-003]
---

## Story

As a new or not-yet-verified customer, I want onboarding to be one focused flow that remembers where I am and only lets me go back where it is safe, so that I finish opening my wallet without getting lost or repeating identity checks.

## Acceptance criteria

- Given the scenario is `new`, when I open any route, then I am redirected to `/onboarding?step=phone`, and `/onboarding` renders without sidebar, top bar, or tab bar (sitemap `shell: none`).
- Given the scenario is `unverified`, when I open `/onboarding` (directly or from the gate #1 CTA "Xác thực ngay"), then the flow starts at `?step=id-method`, because phone, OTP, and PIN are already done.
- Given `kycStatus` is `verified` and the warning and terms are already accepted, when I open `/onboarding`, then I am redirected to `/home`.
- Given I am on any step, then the header shows the stage indicator with three stages "Tài khoản" (phone, otp, pin), "Xác thực" (id-method to verifying), "Hoàn tất" (warning, terms, ready), the current stage highlighted, and text read by screen readers as "Bước 2 trên 3: Xác thực".
- Given I press "Quay lại" on phone, otp, pin, id-method, id-capture, nfc, vneid, or terms, then I return to the previous step with my entries kept; on face, verifying, warning, and ready there is no back control, because identity data is already submitted or the step is a legal checkpoint.
- Given I refresh or open a step URL without an in-memory draft, then the flow restarts at the first step for my state (`phone` for `new`, `id-method` for `unverified`), per rules.md#spec-conventions.
- Given the scenario is `unverified` and I press "Để sau" in the header, then I go to `/home`, which shows gate #1; for `new` there is no exit, since no wallet exists yet.

## UI states

- Empty: not applicable; every step has content.
- Loading: the step body shows its own loading; the frame (logo, stage indicator, "Dữ liệu mẫu" badge) renders immediately.
- Error: an unknown `?step=` value falls back to the first step for the current state; no 404.
- Blocked: none (onboarding is the way out of gate #1).
- Overflow: stage labels never truncate at 320px; the longest step heading ("Xác thực khuôn mặt") wraps to two lines without clipping diacritics.

## Design notes

- Web (≥ 1024): centred column, max-width 560, on the light neutral background; a 1px bordered card holds the step; wordmark top-left, "Dữ liệu mẫu" badge top-right; stage indicator above the card.
- App (< 1024): full screen, header with back chevron left, stage indicator centre, "Để sau" right when allowed; primary pill button pinned to the bottom safe area, 48px tall.
- One primary black pill per step; secondary actions are text links. No shadows (paypal-style-study.md).

## FE notes

- `OnboardingPage` reads `?step=`; a `onboardingSteps(state)` pure function returns the ordered list for the current branch (`nfc` path vs `vneid` path) and the allowed back target per step. TDD it.
- Draft lives in `store.onboarding.draft` (in memory only); finishing writes `customer`, `wallet`, `kycStatus` to the mock store (US-FND-003).
- Redirect guard sits in the route loader, keyed on scenario and `customer.onboardingCompletedAt`.

## Mock data

- Scenarios `new` and `unverified` from ia/mock-data.md#scenarios; persona Trần Minh Anh, phone `0901 234 567`.
