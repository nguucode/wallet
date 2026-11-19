---
id: US-FND-003
title: Mock store, scenarios, and latency
epic: FND
priority: P0
status: Draft
size: M
routes: ["/home"]
dependsOn: [US-FND-008]
---

## Story

As a reviewer, I want the wallet to behave like a real one, with data that changes when I act, loading that I can see, and a named state I can switch to, so that I can walk every flow, including the pending and failed paths, without real setup.

## Acceptance criteria

- Given the app loads for the first time, then the store holds the seed from US-FND-008 with relative dates resolved against "now", and the scenario is `ready`.
- Given any store action (read or write), when it is called, then it resolves after a seeded random delay of 300–900 ms; with the latency override set to 0 s or 3 s, every action uses that delay.
- Given I pick a scenario from the mock-data.md table (`new`, `unverified`, `no-source`, `ready`, `id-expiring`, `suspended`, `near-limit`, `rich`), when it applies, then the store resets to the seed and applies that scenario's overlay; for example `near-limit` sets this month's general usage to 97.500.000 ₫ by injecting transactions, never by editing a counter.
- Given I change data (for example a top up succeeds) and reload the page, then the change is still there; "Reset" restores the seed and the current scenario.
- Given a money commit action, when it runs, then the transaction, the balance change and its notification are written in one update, so no screen ever renders one without the others.
- Given the next-outcome override is "Đang xử lý" or "Không thành công", when the next money commit runs, then the transaction is created in that state (respecting the state machine in object-model.md: instant types never become pending) and the override returns to "Thành công".
- Given the clock is advanced by demo controls, then every derived value (day groups, limit month, pending expiry, bill due) recomputes from the new "now".
- Given two tabs of the app are open in the same browser, when one changes the store, then the other reflects it within one second.

## UI states

- Empty: not applicable; every scenario except `new` has a wallet.
- Loading: each screen shows its own skeleton while its action resolves; the store exposes `status: 'idle' | 'loading' | 'error'` per query.
- Error: if persisted state is corrupt or from an older version, the store discards it silently and loads the seed (logged to console).
- Blocked: none here; gates are computed from store state by US-SEC-004.
- Overflow: about 260 transactions and 60 notifications must load and filter without perceptible lag at 0 s latency.

## Design notes

- No UI of its own. Web and app layouts consume the same store; skeletons are drawn by each screen in both layouts.

## FE notes

- `src/mock/store.ts`: one module-level state object with `useSyncExternalStore` subscriptions; actions grouped by domain (`store.wallet`, `store.tx`, `store.sources`, `store.notifications`, `store.auth`, `store.demo`). No state library unless Fortify's choice is reused as-is.
- `applyScenario(seed, name)` and `resolveOffsets(seed, now)` are pure and TDD-tested; one test per scenario asserts the gate it should produce (cross-checked with `activeGate`, US-SEC-004).
- `now()` = `Date.now() + clockOffset`; every date in the app reads `now()`, never `new Date()` directly.
- `commitMoney(draft, outcome)` builds the transaction (id `WL` + 12 digits), adjusts `balance` and `pendingOut`, and calls the notification builder from US-NTF-003.
- Persistence: `localStorage` key `wallet.state.v1` with a version number, wrapped in try/catch; cross-window sync via `BroadcastChannel('wallet')` with `storage` event fallback.
- Derived selectors: `available = balance − pendingOut` (object-model.md#derived-values).

## Mock data

- All eight scenarios. The hand-made edge cases from mock-data.md must survive every scenario overlay except `new`.
