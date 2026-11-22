---
id: US-FND-004
title: Demo controls (viewer theme)
epic: FND
priority: P0
status: Done
size: S
routes: ["/home"]
dependsOn: [US-FND-001, US-FND-003]
---

## Story

> **Changed 2026-11-22 (owner):** the simulation controls (scenario and reset, next outcome, resolve pending, incoming transfer, cashier scan, verification and face match results, merchant refund, clock, latency) are gone from the UI. They stay as store actions that tests drive (ia/mock-data.md#demo-controls). The sheet now holds the viewer theme and the sample PIN only.

As a reviewer, I want to change how the demo looks (light or dark, accent colour, background, glass) and find the sample PIN, so that I can judge the design in the setting I care about and get through step-up without guessing.

## Acceptance criteria

- Given the web layout, when I press the palette button in the sidebar footer, then the "Demo controls" sheet opens; given the app layout, when I press the flask button in the nav bar, then the same content opens as a bottom sheet.
- Given the sheet, then it shows, laid out as System Settings > Appearance (DESIGN.md "Viewer theme"): "Giao diện" (Theo hệ thống, Sáng, Tối), "Kính" on web only (Vibrancy, Liquid Glass), then under "Chủ đề": "Màu chủ đạo" (the seven colours) and "Nền" (Hình nền, Xám trung tính, Chuyển màu), every choice visible, the current one ringed and named.
- Given I pick a choice, then the whole app re-themes at once and the choice is kept for this viewer across reloads (localStorage); demo data is not touched.
- Given any choice differs from the default, then "Mặc định" shows in the "Chủ đề" header and restores Lam / Theo hệ thống / Hình nền / Vibrancy.
- Given the sheet, then it states that everything in it is a simulation and shows the sample PIN and OTP `123456`.
- Given I press "Xong" (web) or the close button (app), or Esc, then the sheet closes and focus returns to the button that opened it.

## UI states

- Empty, loading, error: not applicable (no store action).
- Blocked: none.
- Overflow: the web sheet body scrolls; at 390px every row wraps its choices under the label.

## Design notes

- DESIGN.md "Viewer theme (Demo controls)": grouped boxes, label leading, choices trailing, 10pt insets, picture choices for appearance, glass and background.

## FE notes

- `src/features/demo/DemoControls.tsx` (sheet), `src/features/demo/ThemeControls.tsx` (theme block), `src/app/theme.ts` (prefs, tokens, `loadTheme` falls back per field).

## Mock data

- None.
