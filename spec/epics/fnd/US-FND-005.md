---
id: US-FND-005
title: Phone-frame preview at /device
epic: FND
priority: P0
status: Removed
size: M
routes: []
dependsOn: [US-FND-001, US-FND-004]
---

## Story

> **Removed 2026-11-19 (owner):** the phone-frame preview and the "Xem bản điện thoại" button are gone; the responsive app layout (< 1024px, or a real phone) is how reviewers see mobile. `/device` redirects to `/home`. Kept for history; the criteria below no longer apply.

As a reviewer on a desktop, I want to use the real app layout inside a phone frame with the demo controls beside it, so that I can judge the mobile experience without picking up a phone.

## Acceptance criteria

- Given I open `/device` at a viewport ≥ 1024px, then I see a 390×844 phone frame containing a same-origin iframe of the app at `/home`, rendered in the app layout, and the Demo controls panel docked beside it.
- Given `/device?path=/history`, then the iframe opens at `/history`; given I navigate inside the frame, then the page URL's `path` updates (replace, not push) so the link can be shared.
- Given the window is shorter than the frame plus margins, then the frame scales down uniformly to fit, never below 0.6, and never scrolls inside the page.
- Given the toolbar above the frame, then it shows "Xem trên điện thoại", "Tải lại" (reloads the iframe) and "Mở bản web" (goes to the same path outside the frame).
- Given I change state in the panel beside the frame, then the iframe reflects it within one second (US-FND-003 cross-window sync).
- Given I open `/device` at a viewport < 1024px, then I see "Bạn đang dùng màn hình nhỏ. Ví đã hiển thị dạng ứng dụng." with "Mở ví" → `/home`, and no frame.

## UI states

- Empty: not applicable.
- Loading: the frame shows a neutral screen with the iframe's own skeletons; the panel is usable immediately.
- Error: if the iframe fails to load, the frame shows "Không tải được bản điện thoại" with "Tải lại".
- Blocked: none.
- Overflow: at 1024×700 the frame scales to fit beside a 360px panel; the "Dữ liệu mẫu" badge stays visible inside the frame.

## Design notes

- Web only by definition. Frame: 1px dark border, 48px corner radius, no device chrome or brand, a 4px home-indicator bar; centred in the remaining space; light neutral page background.
- App layout inside the frame is the real one (tab bar, sheets, keypad), not a mock-up.
- The iframe has `title="Ví trên điện thoại (mô phỏng)"`.

## FE notes

- `src/demo/DevicePage.tsx`, `shell: none`. Iframe `src={path}` with `?embedded=1` so the inner app suppresses its own demo-controls long-press hint and top-level redirects to `/device`.
- Track inner navigation via the iframe's `load` event and `contentWindow.location` (same-origin), plus a `postMessage('wallet:navigated')` from the inner router.
- Scale with CSS `transform: scale()` computed from `ResizeObserver`; respect `prefers-reduced-motion`.

## Mock data

- Default scenario `ready`; test with `rich` for balance size at 390px and `unverified` for the gate inside the frame.
