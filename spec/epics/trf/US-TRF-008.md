---
id: US-TRF-008
title: Prefill a transfer from a scanned QR
epic: TRF
priority: P0
status: Draft
size: S
routes: ["/transfer/bank", "/transfer/wallet"]
dependsOn: [US-TRF-002, US-TRF-005, US-PAY-001]
---

## Story

As a wallet user who just scanned someone's VietQR or wallet QR, I want the transfer to open with the recipient (and amount, if the QR carries one) already filled in, so that paying a friend's QR takes only the amount and the auth.

## Acceptance criteria

- Given I land on `/transfer/bank?qr=<payload>` with a valid VietQR, then the bank (from the BIN) and account number are filled, the name lookup runs automatically (rules.md#money-rules), and on success I go to `?step=amount` with the recipient shown.
- Given the VietQR carries an amount (tag 54), then the amount is filled and locked with the note "Số tiền theo mã QR"; given it carries a purpose (tag 62, sub 08), then "Lời nhắn" is prefilled with it, cut to 50 characters.
- Given the lookup on a scanned VietQR fails, then I stay on `?step=recipient` with the fields filled and the not-found or timeout message from US-TRF-005.
- Given I land on `/transfer/wallet?qr=<payload>` with a valid wallet receive QR, then the recipient is set from the phone in the QR, the name is confirmed by the phone lookup, and I go to `?step=amount` (amount locked if the QR has one); a wallet QR whose phone is mine shows "Bạn không thể chuyển tiền cho chính mình."
- Given the payload is invalid or of the wrong kind for the route, then I land on `?step=recipient` with the banner "Mã QR không hợp lệ. Hãy quét lại hoặc nhập người nhận." and nothing filled.
- Given the prefill, then the `qr` param is removed from the URL once the draft is built (history `replace`), so back and refresh follow rules.md#spec-conventions.

## UI states

- Empty: not applicable (prefill always carries a payload).
- Loading: "Đang đọc mã…" for the parse plus the lookup, as a full-step skeleton of the recipient card.
- Error: invalid payload banner as above; lookup errors as in US-TRF-005.
- Blocked: gates #1–#4 apply at entry (rules.md#gates) via the same `useGate()` check as the base route; a QR does not bypass a gate.
- Overflow: a 25-character VietQR purpose with diacritics fits the message field; a locked `128.450.000 ₫` amount fits at 375px.

## Design notes

- Web (≥ 1024): no extra screen; the bank or wallet flow opens at the right step with a small muted line under the recipient "Từ mã VietQR" or "Từ mã nhận tiền". The locked amount shows a lock icon and no caret.
- App (< 1024): same; the numeric keypad is not shown when the amount is locked, and "Tiếp tục" sits at the bottom.

## FE notes

- Both flows read `?qr=` on mount, call `parseQrPayload` (US-PAY-001), then build the draft and `navigate(…, { replace: true })` to the right step.
- The `?qr=` convention for `/transfer/wallet` mirrors the `/transfer/bank?qr=` example in rules.md#spec-conventions.
- Amount from a QR is still validated (balance, limit, cap) at the amount step; when it fails, the error shows with the locked value and only "Đổi mã" (back to `/pay/scan`) is offered.

## Mock data

- Sample QR library: 2 VietQR (one with amount + purpose, one static), 2 wallet receive QR (one for a contact, one for a non-contact wallet holder), 1 invalid payload.
