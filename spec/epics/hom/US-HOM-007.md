---
id: US-HOM-007
title: Me hub (app only)
epic: HOM
priority: P0
status: Draft
size: S
routes: ["/me", "/me/profile", "/me/sources", "/me/limits", "/me/security", "/support"]
dependsOn: [US-FND-001, US-MNY-001, US-SEC-005]
---

## Story

As a wallet user on my phone, I want one "Tôi" tab that shows who I am and whether I am verified, with links to my sources, limits, security, and help, so that account matters are one tap from the tab bar.

## Acceptance criteria

- Given the app layout, when I open `/me`, then a profile card shows initials avatar, "Trần Minh Anh", the wallet number "0901 234 567", and a KYC badge: "Đã xác thực" (`verified`), "Đang kiểm tra" (`verifying`), or "Chưa xác thực" (`unverified`).
- Given the hub, then it lists in order: "Nguồn tiền" (`/me/sources`, with the default source as sub-line, e.g. "Vietcombank ••6789"), "Hạn mức" (`/me/limits`), "Bảo mật" (`/me/security`), "Hồ sơ và xác thực" (`/me/profile`), "Trợ giúp" (`/support`).
- Given `kycStatus = unverified`, then the badge is tappable and goes to `/onboarding?step=id-method`.
- Given the web layout, when I open `/me`, then I am redirected to `/me/profile` (sitemap).
- Given I press "Đăng xuất" at the bottom, then a confirm dialog "Đăng xuất khỏi Wallet?" with "Đăng xuất" and "Hủy" appears; confirming switches to scenario `new` and lands on `/onboarding`.

## UI states

- Empty: with no sources, the "Nguồn tiền" sub-line reads "Chưa liên kết".
- Loading: profile card skeleton; the list renders immediately.
- Error: profile card shows "Chưa tải được hồ sơ." with "Thử lại"; links still work.
- Blocked: none (navigation only).
- Overflow: a 40-character name wraps to two lines in the card; the KYC badge moves under the name rather than truncating.

## Design notes

- App only: header "Tôi", profile card as a 1px bordered card, then a grouped list with 56px rows, line icons in 40px grey circles, chevrons right; "Đăng xuất" as a text button in danger colour at the bottom.
- Web: no page; the same destinations are in the sidebar group "Ví của tôi" and the avatar menu.

## FE notes

- `MeHubPage`; redirect in the route loader when `layout === 'web'`. Sign-out calls the scenario switch from US-FND-003.

## Mock data

- Scenarios `ready`, `unverified`, `no-source`.
