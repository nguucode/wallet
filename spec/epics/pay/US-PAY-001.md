---
id: US-PAY-001
title: EMVCo QR payload parser and builder
epic: PAY
priority: P0
status: Draft
size: M
routes: ["/pay/scan"]
dependsOn: []
---

## Story

As the scan screen (and the reviewer reading the code), I need a real, tested parser that turns a QR string into "wallet", "VietQR", "merchant" or "unknown" with its fields, so that every scan routes to the right flow and bad codes fail safely.

## Acceptance criteria

- Given a string, when `parseQrPayload(raw)` runs, then it reads EMVCo TLV (2-digit ID, 2-digit length, value) at the top level and inside templates 26–51 and 62, and returns `{ kind: 'wallet' | 'vietqr' | 'merchant' | 'unknown', … }` without throwing on any input.
- Given tag 00 is not `01`, a length runs past the end, or the CRC in tag 63 (CRC-16/CCITT-FALSE over the payload up to and including `6304`) does not match, then it returns `{ kind: 'unknown', reason: 'not_emv' | 'malformed' | 'crc_mismatch' }`.
- Given tag 38 with GUID `A000000727` and service code `QRIBFTTA` or `QRIBFTTC`, then it returns `kind: 'vietqr'` with `bin`, `accountNumber`, `amount?` (tag 54), `purpose?` (tag 62 sub 08), `isDynamic` (tag 01 = `12`).
- Given tag 26 with the demo GUID `ONTHESHORE.WALLET` and sub 01 = `P2P`, then `kind: 'wallet'` with `phone` (sub 02), `name` (tag 59), `amount?`; with sub 01 = `MERCHANT`, then `kind: 'merchant'` with `merchantId` (sub 02), `name` (59), `city` (60), `mcc` (52), `amount?`.
- Given currency (tag 53) present and not `704`, then `kind: 'unknown', reason: 'unsupported_currency'`; given a well-formed EMV payload matching none of the above, then `reason: 'unsupported'`.
- Given `buildQrPayload(spec)` for each kind, then the output carries a valid CRC and `parseQrPayload(buildQrPayload(spec))` returns the same fields (round-trip property test over the sample library and random amounts).
- Given amounts in tag 54, then they parse as whole đồng integers; a decimal or non-digit amount returns `reason: 'malformed'` (VND has no decimals, rules.md#spec-conventions).

## UI states

- Empty: `parseQrPayload('')` → `unknown / not_emv`.
- Loading: none (pure, synchronous).
- Error: never throws; every failure is a typed `unknown` result consumed by US-PAY-002.
- Blocked: none (no money action; gates apply at the scan entry, US-PAY-002).
- Overflow: tag 59 names up to 25 characters (EMV max) in UTF-8 with Vietnamese diacritics parse intact; payloads up to 512 characters.

## Design notes

- No UI. Web and app layouts both consume the same result; the copy for each `reason` lives in US-PAY-002.

## FE notes

- `src/domain/qr/emv.ts`: `parseTlv`, `crc16ccitt`, `parseQrPayload`, `buildQrPayload`. Pure, no dependencies; TDD with fixtures first.
- Compare with open-source EMVCo/VietQR parsers on GitHub (e.g. JS `vietqr` builders and `emv-qrcps` style libraries) for edge cases before writing; do not add one as a dependency for ~150 lines.
- The sample QR library images (mock-data.md) are generated at build time from `buildQrPayload` fixtures, so the library and parser cannot drift.
- BIN → bank name map is shared with US-TRF-005.

## Mock data

- Fixtures: the 8 sample library payloads (3 merchant incl. one fixed amount, 2 VietQR, 2 wallet, 1 invalid), plus hand-made broken ones: bad CRC, truncated length, currency `840`, decimal amount, non-EMV text (`https://…`).
