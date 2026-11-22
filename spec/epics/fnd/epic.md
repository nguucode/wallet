---
code: FND
name: Foundation
route: /home
summary: Shell for both layouts with nav from sitemap.yaml, money and date formatting, the mock store with scenarios and latency, the seed generator, Demo controls (viewer theme), 404 and error boundary, and the shared money flow pattern every top up, transfer, payment and bill uses.
---

# FND · Foundation

Everything every other Epic stands on. One route tree renders two layouts (web ≥ 1024px with sidebar and top bar, app < 1024px with tab bar and per-screen header), both built from `spec/ia/sitemap.yaml`. A single in-memory mock store, seeded from a fixed-seed generator and switchable between the scenarios in `ia/mock-data.md`, holds all state with visible latency. Demo controls set the viewer theme; the simulations that reach other states are store actions that tests drive (removed from the UI 2026-11-22); the app layout is reviewed by narrowing the window below 1024px or on a phone. The money flow pattern (amount → confirm → auth → result, on `?step=`) is defined once here so that MNY, TRF, PAY and BIL only supply their recipient step and their commit action.

## P0 stories

- US-FND-001 — App shell for both layouts with nav from sitemap.yaml
- US-FND-002 — Money, date, and phone formatting with the amount input
- US-FND-003 — Mock store, scenarios, and latency
- US-FND-004 — Demo controls (viewer theme)
- US-FND-006 — Not-found page and error boundary
- US-FND-007 — Money flow pattern: steps, confirm, and result
- US-FND-008 — Seed data generator with hand-made edge cases
- US-FND-009 — Fee rule with free monthly slots
- US-FND-010 — Amount step with balance and limit checks

## P1 backlog

| Title | Why P1 |
|---|---|
| Installable PWA (manifest, icons, offline shell) | PRODUCT.md names it in the stack, but no P0 flow needs installation; narrowing the window covers desktop review of the app layout. |
| `/device` phone-frame preview (was US-FND-005) | Built, then removed 2026-11-19 (owner): responsive layout is enough; old `/device` links redirect to /home. |
| Latency presets beyond 0 s and 3 s (per-action, slow network profile) | The 300–900 ms default plus 0/3 s override already makes every loading state reachable. |
