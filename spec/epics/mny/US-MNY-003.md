---
id: US-MNY-003
title: Set the default funding source
epic: MNY
priority: P0
status: Draft
size: S
routes: ["/me/sources"]
dependsOn: [US-MNY-001]
---

## Story

As a wallet user with several sources, I want to choose which one is used by default, so that top-ups and withdrawals start with the source I use most.

## Acceptance criteria

- Given a non-default source, when I choose "Đặt làm mặc định", then it becomes the only default immediately, moves to the top with the badge "Mặc định", and a toast reads "Đã đặt Techcombank ••4321 làm nguồn mặc định."
- Given the default source, then "Đặt làm mặc định" is not offered for it.
- Given a new default, when I open `/topup` or `/withdraw`, then that source is preselected.
- Given a single linked source, then it is always the default and the action is hidden.

## UI states

- Empty: not applicable (needs at least two sources).
- Loading: the row shows a small spinner in place of the badge until the store resolves.
- Error: "Chưa đổi được nguồn mặc định. Thử lại." as a toast; the previous default stays.
- Blocked: none; not a money action.
- Overflow: toast with long bank names wraps to two lines.

## Design notes

- Web: action in the row's overflow menu (three-dot button, 48px target); toast bottom-left of the content column.
- App: action in the row's bottom sheet; toast above the bottom safe area.

## FE notes

- `store.sources.setDefault(id)` enforces exactly one default; `selectDefaultSource` is used by US-MNY-005 and US-MNY-006.

## Mock data

- Scenario `ready` (three sources).
