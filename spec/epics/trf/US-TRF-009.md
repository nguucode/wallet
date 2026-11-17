---
id: US-TRF-009
title: Receive QR with optional amount
epic: TRF
priority: P0
status: Draft
size: M
routes: ["/receive"]
dependsOn: [US-FND-001, US-FND-002, US-FND-004, US-PAY-001]
---

## Story

As a wallet user, I want to show or share my own QR, with an amount when I am collecting a fixed sum, so that friends can pay me without typing my number.

## Acceptance criteria

- Given I open `/receive`, then I see the title "Nhận tiền", the label "Mã nhận tiền", my QR, my name "Trần Minh Anh" and wallet number "0901 234 567", with the switch "Mã ví" / "VietQR" (default "Mã ví").
- Given "Mã ví", then the QR encodes my wallet receive payload; given "VietQR", then the QR encodes a VietQR payload for my wallet's receiving account, with the caption "Quét bằng app ngân hàng bất kỳ".
- Given I tap "Thêm số tiền" and enter an amount, then the QR regenerates with that amount, the amount shows under the QR, and the action becomes "Xóa số tiền"; the amount input uses the same formatting as US-FND-002 (no limit check: receiving is not limited, rules.md#limits).
- Given I tap "Lưu ảnh", then a PNG with the QR, my name and amount (if any) downloads; given "Chia sẻ" on a device with Web Share, then the share sheet opens with that image; otherwise "Chia sẻ" copies the wallet number and shows "Đã sao chép số ví".
- Given I am on `/receive` and the demo control "Incoming transfer" fires, then a toast shows "Bạn vừa nhận 500.000 ₫ từ Lê Quang Huy" with "Xem" (to `/history/:txId`).
- Given any gate is active, then the QR still shows (rules.md#gates lists only money-out actions); given the wallet is `suspended` or `locked`, then the QR is replaced by the gate message, because the wallet cannot accept funds while suspended or locked.

## UI states

- Empty: not applicable; the QR always has a payload.
- Loading: QR area shows a square skeleton until the payload is built (synchronous in practice; skeleton covers image generation).
- Error: QR image fails to render → "Không tạo được mã. Thử lại." with "Thử lại"; the wallet number stays visible so receiving still works by phone.
- Blocked: gates #2 and #3 (rules.md#gates) replace the QR with the gate message; gates #1 and #4 do not block receiving.
- Overflow: name "Nguyễn Hoàng Phương Thảo Nguyệt Quỳnh Như" (for a reviewer who edits the persona) wraps under the QR; amount `128.450.000 ₫` fits under the QR at 375px; the saved image keeps diacritics (font embedded in the canvas render).

## Design notes

- Web (≥ 1024): content column, max-width 560. One bordered card centred: segmented switch on top, QR 240px with a quiet zone on white, name 16px bold, number 14px muted, then pill buttons "Thêm số tiền", "Lưu ảnh", "Chia sẻ" in a row.
- App (< 1024): full-screen with header "Nhận tiền"; QR 264px; buttons as a row of 48px icon circles with 2-line labels (style study "Truy cập nhanh" grammar). The amount input opens as a bottom sheet with the numeric keypad.
- The QR is always black on white regardless of theme, for scanner contrast.

## FE notes

- `ReceivePage`; payloads from `buildQrPayload` (US-PAY-001) so parse(build(x)) round-trips in tests.
- QR image: a small QR encoder (e.g. `qrcode` on npm) rendering to canvas; compare with the open-source wallets listed in the vault research note §5 before choosing.
- Amount changes produce a dynamic QR (tag 01 = `12`); no amount produces static (`11`).
- VietQR form needs a receiving account number for the wallet; the mock uses a virtual account at a fixed bank BIN (see Mock data). Flagged as an ia gap.

## Mock data

- Persona wallet number `0901 234 567`; VietQR form uses mock virtual account `0901234567` under the Vietcombank BIN 970436 (assumption, see ia gap).
- Demo control "Incoming transfer" with a random seeded contact and amount.
