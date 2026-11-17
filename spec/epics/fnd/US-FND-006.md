---
id: US-FND-006
title: Not-found page and error boundary
epic: FND
priority: P0
status: Draft
size: S
routes: ["*"]
dependsOn: [US-FND-001]
---

## Story

As a wallet user, I want a clear way back when a link is wrong or a screen breaks, so that I never wonder whether my money is affected.

## Acceptance criteria

- Given I open an unknown route such as `/vi-cua-toi`, then the shell renders "Không tìm thấy trang" with "Trang bạn tìm không tồn tại hoặc đã được chuyển." and a primary button "Về trang chủ" → `/home`.
- Given a screen asks for an object that does not exist (for example an unknown transaction ID), then that screen can render the same component with its own title, for example "Không tìm thấy giao dịch".
- Given a render error in any route, then the error boundary replaces only the content area with "Đã có lỗi xảy ra" and "Màn hình này gặp sự cố. Số dư và giao dịch của bạn không bị ảnh hưởng.", with "Tải lại" and "Về trang chủ"; nav stays usable.
- Given the error boundary in a development build, then a collapsed "Chi tiết kỹ thuật" shows the error message; production builds omit it.
- Given a `shell: none` route errors, then the boundary renders full-page with the same copy.

## UI states

- Empty: not applicable.
- Loading: not applicable.
- Error: this story is the error state.
- Blocked: none.
- Overflow: long technical messages wrap in monospace inside "Chi tiết kỹ thuật" without widening the page.

## Design notes

- Web: content column, line icon in a 48px neutral circle, H1 24px, one paragraph, one black pill button. App: same, vertically centred, tab bar visible (not a flow).

## FE notes

- `src/shell/NotFound.tsx` (`title?`, `body?`) on the `*` route and exported for detail screens; `src/shell/RouteError.tsx` as React Router `errorElement` on the shell route and on `shell: none` routes.
- Test: unknown route renders NotFound; a component that throws renders RouteError and the sidebar is still in the DOM.

## Mock data

- None.
