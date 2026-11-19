---
id: US-FND-001
title: App shell for both layouts with nav from sitemap.yaml
epic: FND
priority: P0
status: Draft
size: M
routes: ["/home", "/me"]
dependsOn: [US-FND-003]
---

## Story

As a wallet user, I want the same wallet on a wide screen and on my phone, with navigation that fits each, so that I can reach every core job in one tap or click and Scan is always one tap away on the phone.

## Acceptance criteria

- Given `spec/ia/sitemap.yaml`, when the app loads at a viewport ≥ 1024px, then the web layout renders the `sidebar` items and groups ("Chuyển và thanh toán", "Ví của tôi") in file order and the `topBar` items ("Thông báo", "Xem trên điện thoại", "Demo controls", "Tài khoản"), with no nav label or route hard-coded in a component; items with `priority: P1` (Product) are not rendered.
- Given a viewport < 1024px, when any shell screen loads, then the app layout renders the `tabBar` ("Trang chủ", "Lịch sử", "Quét mã", "Thông báo", "Tôi") with "Quét mã" in the centre slot as the largest target, and a per-screen header with the screen `title` from sitemap.yaml and a back button on screens below a tab root.
- Given I resize across 1024px, when the layout switches, then the route, query string and any in-progress flow draft stay unchanged (layout depends only on width, rules.md#spec-conventions).
- Given I am on a flow route with `steps` (for example `/topup?step=amount`), when the app layout renders, then the tab bar is hidden and the flow is full-screen; in the web layout the flow renders in the content column at max-width 560px.
- Given I am on `/history/WL000000001234`, when the nav renders, then "Lịch sử" is active by route prefix with `aria-current="page"`.
- Given any screen, including onboarding, then a "Dữ liệu mẫu" badge is visible (mock-data.md).
- Given `/` or `/me` in the web layout, then `/` redirects to `/home` and `/me` redirects to `/me/profile`; given scenario `new`, any shell route redirects to `/onboarding`.
- Given the avatar menu "Tài khoản", when I open it, then it lists "Hồ sơ" (`/me/profile`), "Bảo mật" (`/me/security`) and "Đăng xuất"; "Đăng xuất" asks "Đăng xuất khỏi ví?" and on confirm switches to scenario `new`.

## UI states

- Empty: not applicable; the shell always has nav.
- Loading: the shell paints immediately; only the content area shows its own skeleton while store data resolves (US-FND-003 latency).
- Error: if sitemap.yaml fails to parse, a full-page error "Không tải được điều hướng" with the parse message in monospace; this is a build-time defect caught by a unit test.
- Blocked: none. The shell never hides or disables nav for a gate; gates appear at the entry point (rules.md#gates, US-SEC-004).
- Overflow: per-screen header titles truncate with ellipsis at one line ("Chuyển đến ngân hàng" must fit at 320px without clipping diacritics); on a 700px-tall web window the sidebar scrolls while the top bar stays fixed.

## Design notes

- Web (≥ 1024): sidebar about 200px on the light neutral surface, items 48px tall, active item on a pale accent fill with pill radius; content is one left column, max-width about 610px for pages and 560px for flows, right side empty. Top bar right-aligned icons in 48px targets; the notification badge is the only red in the chrome.
- App (< 1024): tab bar 64px plus safe-area inset; "Quét mã" is a filled accent circle (56px) raised in the centre, the other four are 48px icon + 10–12px label. Header 56px: back chevron, centred title, optional trailing action.
- "Dữ liệu mẫu": small outlined pill, 12px, muted text; web in the top bar left, app in the header trailing slot (on screens without a header, fixed top-right).
- Black and white with one accent, 1px borders, no shadow (paypal-style-study.md). Skip link "Chuyển đến nội dung chính" first in tab order.

## FE notes

- `src/shell/AppShell.tsx` chooses `WebLayout` or `AppLayout` from `useLayout()` (matchMedia `(min-width: 1024px)`); both wrap the same `<Outlet>`.
- `src/shell/nav.ts` imports `/spec/ia/sitemap.yaml?raw`, parses once with `yaml`, and exposes `sidebar()`, `tabBar()`, `topBar()`, `screenFor(pathname)` (title, steps, shell). Pure, unit-tested against the real file: Product filtered, order preserved, `screenFor('/history/WL1')` returns the transaction screen.
- `shell: none` screens (`/onboarding`) render outside `AppShell` but still mount `<SampleDataBadge>`.
- Icons: one Lucide icon per nav id in `nav-icons.ts`. Badge slot reads `badge: unread` and renders US-NTF-002.
- Long-press (600 ms) on the app header opens Demo controls (US-FND-004).
- "Đăng xuất" calls `store.demo.setScenario('new')`; there is no sign-in screen in the sitemap (reported gap).

## Mock data

- None beyond the active scenario. Test with `ready` and `new` (redirect), at 1440, 1024, 1023, 390 and 320px widths.
