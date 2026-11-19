---
id: US-PAY-002
title: Scan a QR on app or pick one on web
epic: PAY
priority: P0
status: Draft
size: M
routes: ["/pay/scan"]
dependsOn: [US-PAY-001, US-FND-001, US-SEC-004]
---

## Story

As a wallet user at a counter, I want one scan screen that reads whatever QR is in front of me and takes me straight to the right flow, so that I do not have to know whether it is a shop, a bank account or a friend's wallet.

## Acceptance criteria

- Given the app layout and camera permission, when I open `/pay/scan` (centre tab "Quét mã"), then the camera viewfinder opens with the frame and "Đưa mã QR vào khung", plus "Đèn" (torch, when supported), "Chọn ảnh" and "Mã mẫu".
- Given camera permission is denied or no camera exists, then the viewfinder is replaced by "Wallet cần quyền dùng camera để quét mã." with "Chọn ảnh" and "Mã mẫu" still available.
- Given the web layout, then the page shows two options instead of a camera: "Tải ảnh mã QR" (drop zone and file picker, PNG/JPG) and "Mã mẫu" (a grid of the 8 sample QR from mock-data.md, each labelled, e.g. "Cửa hàng · số tiền cố định").
- Given a decoded payload, then `parseQrPayload` (US-PAY-001) routes it: `wallet` → `/transfer/wallet?qr=…`, `vietqr` → `/transfer/bank?qr=…`, `merchant` → `/pay/merchant?qr=…`, with the payload URL-encoded and haptic feedback on app where supported.
- Given `kind: 'unknown'`, then scanning pauses and a sheet (app) or inline panel (web) shows "Không nhận ra mã này" with "Wallet đọc được mã nhận tiền của ví, VietQR và mã của cửa hàng." (or "Mã QR bị hỏng hoặc không đầy đủ." for `crc_mismatch` / `malformed`, "Chỉ hỗ trợ thanh toán bằng VND." for `unsupported_currency`) and "Quét lại".
- Given an uploaded image contains no QR, then it shows "Không tìm thấy mã QR trong ảnh." with "Chọn ảnh khác".
- Given a gate is active (rules.md#gates), when I open "Quét mã" from the tab bar, Home or a URL, then the gate overlay shows before the camera starts (US-SEC-004); the camera is never opened behind a gate.

## UI states

- Empty: web with no upload yet → drop zone with "Kéo ảnh vào đây hoặc chọn từ máy" and the sample grid below.
- Loading: camera starting → black viewfinder with "Đang mở camera…"; decoding an upload → spinner on the drop zone "Đang đọc mã…".
- Error: unknown payload, no QR in image, and permission denied as above; camera stream error → "Không mở được camera." with "Thử lại".
- Blocked: gates #1–#4 (rules.md#gates) at entry via US-SEC-004.
- Overflow: sample labels up to 2 lines ("Ví · Nguyễn Hoàng Phương Thảo Nguyệt Quỳnh Như" truncates on line 2); on a 320px-wide app viewport the frame keeps ≥ 16px side margins and the three buttons stay ≥ 44px.

## Design notes

- App (< 1024): full-screen dark camera surface (the only dark screen), white rounded-corner frame 240px, hint text above, a bottom bar with three 48px icon circles ("Đèn", "Chọn ảnh", "Mã mẫu"), close (×) top-left. Tab bar hidden. "Mã mẫu" opens a bottom sheet with the sample grid. Reachable in one tap from every app screen (PRODUCT principle 4).
- Web (≥ 1024): content column, max-width 560, H1 "Quét mã". Drop zone as a 1px dashed bordered card (12px radius), then "Mã mẫu" as a 4-column grid of bordered cards with the QR thumbnail and label. A link to "Mã thanh toán" (`/pay/code`) at the top, because the sidebar "Thanh toán" lands on Payment Code.

## FE notes

- `ScanPage`. Decoder: `qr-scanner` (nimiq; uses native `BarcodeDetector` with a worker fallback) for both camera and image file; compare with `@zxing/browser` and `jsQR` before committing.
- Stop the stream on unmount and when the tab is hidden; never keep the camera on behind a sheet.
- `routeForQr(parsed)` → path: pure, TDD.
- The sample library comes from build-time fixtures (US-PAY-001); selecting one skips decoding and calls `parseQrPayload` on its payload directly.

## Mock data

- Sample QR library: 3 merchant (one with fixed amount), 2 VietQR, 2 wallet receive, 1 invalid (mock-data.md).
- Scenarios `unverified` and `no-source` for the gate.
