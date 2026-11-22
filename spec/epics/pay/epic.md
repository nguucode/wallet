---
code: PAY
name: Pay
route: /pay/scan
summary: One scan screen that reads wallet QR, VietQR and merchant QR through a tested EMVCo parser, merchant payment with fixed-amount skip, and the rotating Payment Code (the cashier scan is a store action for tests since 2026-11-22).
---

# PAY · Pay

Paying at a counter, both ways round. "Quét mã" reads whatever QR the user points at (camera on the app, sample library or upload on web), classifies it with a real EMVCo TLV parser, and routes to a merchant payment or into the TRF flows. "Mã thanh toán" shows a one-time code bound to a chosen source that a cashier scans, simulated by a demo control. Merchant payments are instant: they end in success or failed, never pending, and a later refund appears as its own transaction in history.

## P0 stories

- US-PAY-001 — EMVCo QR payload parser and builder
- US-PAY-002 — Scan a QR on app or pick one on web
- US-PAY-003 — Merchant payment amount and confirm
- US-PAY-004 — Merchant payment result
- US-PAY-005 — Payment Code with countdown and source picker
- US-PAY-006 — Cashier scans the Payment Code (removed 2026-11-22)

## P1 backlog

| Title | Why P1 |
|---|---|
| Risky-merchant warning on a scanned QR | Extends PRODUCT.md's P1 risky-recipient warning to scan; needs a risk signal the mock does not model. |
| Pay a merchant QR from a linked source | P0 merchant QR pays from the wallet only; Payment Code already shows pay-by-source. |
| Merchant-presented VietQR from third-party counters (NAPAS merchant service codes) | P0 reads the demo's own merchant QR; supporting other acquirers adds parser cases without changing the flow. |
