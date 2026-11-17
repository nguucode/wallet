---
code: TRF
name: Transfer
route: /transfer
summary: Transfer chooser, wallet-to-wallet transfer by phone or contact, transfer to a bank with name lookup and pending or failed outcomes, prefill from a scanned QR, and the receive QR.
---

# TRF · Transfer

Everything that sends money to another person, plus the QR that lets others send money to me. A wallet transfer goes only to someone who has a wallet; contacts without one are shown as "Chưa dùng ví" and cannot be picked. A bank transfer always shows the looked-up holder name before confirm, carries the VietQR per-transaction cap and the shared free-slot fee, and can end pending or failed with the money's whereabouts stated plainly. Gates, limits and step-up come from rules.md; this Epic only applies them at the right step.

## P0 stories

- US-TRF-001 — Transfer chooser with recent recipients
- US-TRF-002 — Choose a wallet recipient by phone or contact
- US-TRF-003 — Wallet transfer amount and message
- US-TRF-004 — Wallet transfer confirm and result
- US-TRF-005 — Bank recipient with account name lookup
- US-TRF-006 — Bank transfer amount and confirm with fee
- US-TRF-007 — Bank transfer result with pending and failed outcomes
- US-TRF-008 — Prefill a transfer from a scanned QR
- US-TRF-009 — Receive QR with optional amount

## P1 backlog

| Title | Why P1 |
|---|---|
| Request money (Yêu cầu chuyển tiền, request link) | Listed P1 in PRODUCT.md; the demo loop works without it. |
| Group split (Chia tiền nhóm) | Listed P1 in PRODUCT.md; builds on request money. |
| Send-and-claim to contacts without a wallet (`awaiting_claim → claimed \| returned`, refund after 24 hours) | PRODUCT.md P1 "pending receipt with refund after 24 hours"; adds a state to the machine (object-model.md) and makes "Chưa dùng ví" rows selectable. |
| Risky-recipient warning at confirm | Listed P1 in PRODUCT.md; needs a risk signal the mock does not model yet. |
| Manage saved bank recipients (rename, remove) | Saved recipients are read-only in P0; nothing in the demo loop needs editing them. |
