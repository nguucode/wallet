---
code: SEC
name: Security, limits, and gates
route: /me/security
summary: Step-up auth sheet (PIN, device biometric, face match), the pure requiredAuth rule, gates on money actions, the limits screen, security settings and PIN change, profile and verification status, and the app-only Me hub.
---

# SEC · Security, limits, and gates

The rules the State Bank imposes, made visible. Every money action passes through the same gate check at its entry point and the same step-up sheet before it is created, both driven by pure functions over config (`activeGate`, `requiredAuth`, `dayCounter`, `limitCounters`) so the law is testable and the thresholds change in one place. The limits screen and the profile screen explain the user's standing (how much of each monthly limit is left, when face match will be asked, whether the wallet is verified and active) before any refusal can surprise them.

## P0 stories

- US-SEC-001 — Step-up auth sheet with PIN
- US-SEC-002 — Face match step-up
- US-SEC-003 — Required-auth rule with configurable thresholds
- US-SEC-004 — Gates on money actions
- US-SEC-005 — Limits screen
- US-SEC-006 — Security settings with device biometric toggle
- US-SEC-007 — Change PIN
- US-SEC-008 — Profile and verification status

## P1 backlog

| Title | Why P1 |
|---|---|
| Devices and sessions (`/me/security?view=devices`) | PRODUCT.md lists device management as P1; P0 has one current device and no sign-in. |
| Lock and unlock wallet (gate #3 next step) | PRODUCT.md P1. Gate #3 is enforced in P0 by `activeGate`, but no P0 scenario or control reaches `locked`. |
| Face match on first login from a new device, with `new_device_login` surface | rules.md#step-up marks it P1 surface; there is no sign-in flow in P0. |
| Update CCCD (gate #2 and `id_expiring` next step) | PRODUCT.md P1 "CCCD expiring and suspension"; P0 shows the message and the expiry date only. |
| Forgot PIN (reset through face match) | Needed once PIN lockout is real; in the demo a reviewer resets via Demo controls. |
- Me hub on the app layout lives in US-HOM-007 (merged; SEC-009 removed as a duplicate).
