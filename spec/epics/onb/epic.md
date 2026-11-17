---
code: ONB
name: Onboarding and eKYC
route: /onboarding
summary: Open a wallet outside the shell: phone, OTP, PIN, identity by CCCD chip (NFC) or VNeID, face match, verification result, mandatory warning, terms, and the ready screen that asks for a linked bank.
---

# ONB · Onboarding and eKYC

Opening a wallet is where the law shows up first, so this Epic turns TT 40 Đ.22 into screens rather than fine print (rules.md#onboarding). The flow runs outside the shell at `/onboarding` with `?step=`: phone → OTP → PIN → identity method (CCCD chip by NFC, or VNeID) → face → verifying → mandatory warning → terms → ready. Verification has three visible outcomes (verified, needs review, failed with a reason), the warning cannot be skipped, and the ready screen states the wallet number and both monthly limits before offering "Liên kết ngân hàng". Web cannot read a chip, so it routes the reviewer to `/device` or to VNeID.

## P0 stories

- US-ONB-001 — Onboarding frame and step routing
- US-ONB-002 — Phone number and OTP
- US-ONB-003 — Create wallet PIN
- US-ONB-004 — Choose identity method and capture the CCCD
- US-ONB-005 — Read the CCCD chip with NFC
- US-ONB-006 — Verify identity with VNeID
- US-ONB-007 — Face scan
- US-ONB-008 — Verification result
- US-ONB-009 — Mandatory warning
- US-ONB-010 — Terms and wallet ready

## P1 backlog

| Title | Why P1 |
|---|---|
| Update CCCD after expiry (re-verify chip and face, lift suspension) | PRODUCT.md lists "CCCD expiring and suspension" as P1; gate #2 in P0 shows the message only (rules.md#gates). |
| Relative scans the chip on their phone, owner confirms on own device | Third MoMo method from research §2.3; NFC and VNeID already cover the law. |
