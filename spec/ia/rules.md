# Business rules and cross-Epic decisions

These rules win over any assumption in an individual story. Rules marked **[law]** come from Vietnamese regulation (sources in the vault research note §1). Rules marked **[demo]** are product decisions for this demo.

## Spec conventions

- **One route tree, two layouts.** Layout depends only on viewport: `web` ≥ 1024px, `app` < 1024px. A story describes both layouts in its Design notes; it never creates a separate route for mobile. [demo]
- **No new route segments for steps.** Multi-step flows use `?step=`. Sub-views use `?view=` (`/history?view=statement`, `/history/:txId?view=receipt`, `/me/security?view=devices`). Prefill uses query params (`/transfer/bank?qr=<payload>`). [demo]
- **Back and refresh.** Each step is reachable by URL, but a flow restored from a URL without its in-memory draft restarts at its first step. The `result` step is only reachable right after `auth`; on refresh it redirects to `/history/:txId`. [demo]
- **Language.** UI copy in Vietnamese. Story text, IDs, code in English. Use the UI labels in [object-model.md](object-model.md#glossary-code-term--ui-label). [demo]
- **Formats.** Money `1.250.000 ₫` (dot thousands, no decimals, ₫ after a space). Input fields accept digits only and format live. Date `17/11/2026`, time `14:05`. Phone `0901 234 567`. [demo]

## Gates

A gate blocks money actions (top up, withdraw, transfer, pay, bills) and explains the single next step. Viewing balance and history is never blocked. Order of precedence, first match wins: [law] unless noted

| # | Condition | Message intent | Next step |
|---|---|---|---|
| 1 | `kycStatus` is `unverified` or `verifying` | Ví chưa được xác thực sinh trắc học | Xác thực ngay → /onboarding?step=id-method (or "Đang kiểm tra, thường xong trong 24 giờ") |
| 2 | Wallet `suspended` (id_expired) | Giấy tờ tùy thân đã hết hạn, ví tạm ngừng giao dịch | Cập nhật CCCD (P1 flow; P0 shows the message) |
| 3 | Wallet `locked` | Ví đang tạm khóa | Mở khóa (P1) |
| 4 | No linked FundingSource | Cần liên kết ngân hàng chính chủ trước khi dùng ví | Liên kết ngân hàng → /me/sources/link |
| — | `kycStatus = id_expiring` | Not a gate: banner on Home + notification 30 days before expiry | Cập nhật CCCD |

- A gate appears **at the entry point** (tapping Nạp, Chuyển, Quét…), never after the user has typed an amount. Home also shows the active gate as its own section.
- The last linked source cannot be unlinked: the action is disabled with the reason inline. [law]

## Money rules

- **No cash in or out** anywhere, no interest on balance, no credit. These features do not exist even as disabled tiles. [law]
- **Top up / withdraw** go only to/from the customer's own linked sources. [law]
- **No balance cap.** The consolidated TT 40 has none; the 200tr figure on MoMo's FAQ is not used. [law]
- **Wallet transfer recipients** must be a Contact with `hasWallet: true` or a scanned wallet QR. Contacts without a wallet show "Chưa dùng ví" and are not selectable in P0 (P1: send-and-claim). [demo]
- **Bank transfer** requires a name lookup: after bank + account number, the holder name is shown and must be visible on the confirm step. Lookup fails → inline error, no transaction. Max 499.999.999 ₫ per transaction (VietQR/NAPAS limit). [law]
- **Message** is optional, max 50 characters, Vietnamese diacritics allowed; default for wallet transfers "<Name> chuyển tiền". [demo]
- **Confirm step always shows**: amount, fee, total debited, source, counterparty (name + masked account/phone), and which auth will be asked ("Cần xác thực khuôn mặt vì giao dịch trên 10.000.000 ₫"). [demo]

## Fees

Fictional fee schedule modelled on the shape of ZaloPay's published one. Fees live in config. [demo]

| Action | Fee |
|---|---|
| Top up from linked account or debit card | Free |
| Wallet to wallet | Free |
| Withdraw and transfer to bank | First 5 per month free (shared counter), then 0,5% rounded to the nearest 1.000 ₫, min 1.000 ₫ |
| Merchant QR, bills | Free |
| Failed transaction | Fee refunded with the amount; does not consume a free slot |

The confirm step shows the free slots left: "Miễn phí (còn 3 lượt trong tháng)".

## Limits

- **General monthly limit 100.000.000 ₫** per customer, counted on: `bank_transfer`, `p2p_out`, `qr_merchant`, non-essential `bill`. Not counted: `topup`, `withdraw`, incoming money, refunds. [law, TT 40 Đ.26 k.1 with Đ.25 k.2 b–đ]
- **Essential monthly limit 300.000.000 ₫**, separate, counted on bills whose biller is `essential: true` (electricity in P0). Essential payments do not consume the general limit. [law, Đ.26 k.3]
- `failed` transactions do not count; `pending` ones do (they may succeed). `refunded` ones still count (the payment happened). [demo]
- Months are calendar months, Asia/Ho_Chi_Minh time. [demo]
- A request that would exceed a limit is rejected **at the amount step** with the remaining amount shown and a link to /me/limits. [demo]

## Step-up

`requiredAuth(type, amount, dayCounter)` is a pure function and the first TDD seam. Thresholds follow MoMo's published reading of QĐ 2345 and live in config. [law, as applied by MoMo]

| Case | Auth |
|---|---|
| Transfer between own wallet and own linked source (`topup`, `withdraw`) ≤ 10.000.000 ₫ and dayCounter + amount ≤ 20.000.000 ₫ | PIN |
| `p2p_out`, `bank_transfer` with the same thresholds | PIN |
| Any of the above above either threshold | Face match |
| `qr_merchant`, `bill` ≤ 100.000.000 ₫ | PIN |
| `qr_merchant`, `bill` above 100.000.000 ₫ | Face match |
| First login on a new device | Face match (P1 surface) |

- `dayCounter` sums today's successful + pending PIN-approved `topup`, `withdraw`, `p2p_out`, `bank_transfer`, and **resets to 0 after any face-matched transaction** and at midnight. [law, TT 50 "Tksth"]
- Device biometric (Face ID / vân tay on the phone) may replace PIN only where PIN would apply, when the user enabled it. On web it is never offered. [law, TT 50 Đ.11]
- PIN is exactly 6 digits. 5 wrong attempts lock PIN entry for 30 minutes (configurable, law caps at 10). The sheet always shows attempts left after the first mistake. [law cap / demo value]
- Face match failure: up to 3 retries, then "Thử lại sau" and the transaction is not created. [demo]
- The app never offers "remember PIN". [law, TT 50 Đ.8 k.5]

## Onboarding

- Order: phone → OTP → create PIN → identity method (CCCD chip via NFC, or VNeID) → face → verifying → mandatory warning → terms → ready → link bank. [law, TT 40 Đ.22]
- **Mandatory warning** lists prohibited uses (renting/selling the wallet, using it for illegal transactions, etc.). The continue button enables only after scrolling to the end **and** ticking "Tôi đã đọc và hiểu". [law, Đ.22 k.1 c]
- **Ready** screen shows wallet number, the two monthly limits, and one primary CTA: Liên kết ngân hàng. Skipping is allowed ("Để sau") and lands on Home with gate #4. [law, Đ.22 k.1 đ]
- Verifying resolves instantly to `verified` by default; demo controls can force `needs_review` (stays `verifying`, message "thường xong trong 24 giờ") or failure with a reason from: ảnh CCCD mờ, không đọc được chip (ốp lưng/NFC), khuôn mặt không khớp, mạng yếu. [demo, error set from MoMo help]
- On web, NFC is not possible: the web onboarding shows "Mở ví trên điện thoại" (use the app layout: narrow window or phone), or the VNeID path. [demo]

## History and support

- History is newest first, grouped by day (app) or month (web). Pending and failed rows are never hidden by default; "Tất cả" includes them. [demo]
- The transaction detail is the only entry to support for a specific transaction. "Liên hệ hỗ trợ" prefills transaction ID, amount, time. [demo, from MoMo pattern]
- For `p2p_out` to a wrong recipient, the detail explains that the wallet cannot reverse it and offers "Nhắn người nhận" (deep link placeholder) before the support form. [law: intermediary cannot cancel a completed transfer]
- Support requests can be opened up to 60 days after the transaction; older ones show the form disabled with the reason. Resolution target shown: "tối đa 30 ngày làm việc". [demo, from ZaloPay terms Đ.9]

## Notifications

- Every balance change creates a `balance_change` notification. [law, TT 50 Đ.7 k.10]
- New-device login creates a `new_device_login` notification (P1 surface, P0 data). [law, TT 50 Đ.7 k.6 h]
- `id_expiring` 30 days before CCCD expiry; `bill_due` 3 days before due date. [law / demo]

## Decisions from story writing (2026-11-17)

Resolved by the coordinator from the four story agents' gap reports. These win over any story that says otherwise.

- **Query params.** History saved views use `?tab=`; `?view=` stays for sub-views. Prefill: `/transfer/wallet?contact=<id>` or `?qr=<payload>`, `/transfer/bank?recipient=<id>` or `?qr=`, `/pay/merchant?qr=`.
- **Bills.** The amount is fixed, so balance and essential-limit checks run on the bill's `view` step and disable "Thanh toán" with the reason. P0 pays bills from the wallet balance only. Browsing `/bills` is not gated; the gate appears on "Thanh toán" and on "Thêm hóa đơn".
- **Receive.** `/receive` is gated only by `suspended` and `locked`; an unverified wallet or one without a bank can still show its receive QR.
- **Link and unlink** are never gated. Unlink asks for PIN.
- **Free slots.** Pending withdraw/bank transfers consume a free slot (they may succeed); a slot is returned if the transaction later fails. Rounding is half-up to 1.000 ₫.
- **Next outcome on instant types.** "Đang xử lý" is ignored for instant types (top up, wallet transfer, merchant QR) and they succeed; the Demo controls panel says so.
- **Pending ETA.** "dự kiến xong trước HH:mm" = createdAt + `config.pendingEtaMinutes[pendingReason]` (bank 30 min, bill 120 min).
- **Device biometric approvals** count in the day counter like PIN.
- **Face match** allows 3 attempts in total; then "Thử lại sau".
- **Payment Code.** Showing the code requires PIN. When the cashier scans, the amount is checked against balance and limit; above the merchant face threshold the face match sheet opens; a failed check creates no transaction. Code lifetime 60 s.
- **Onboarding needs review.** The flow continues through warning, terms, and ready with an amber line; gate #1 shows "Đang kiểm tra". Demo control "Verification result" can resolve it later.
- **CCCD.** Gate #2 message and the expiry date on the profile are P0; the Home banner and the update flow are P1.
- **Sign out** switches to scenario `new`.
- **Demo values.** PIN `123456`, OTP `123456` (shown in Demo controls). Bank lookup: account numbers starting `000` are not found, `999` time out, ending `0000` return a different holder ("not your name" case on linking). Account number length 6–19 digits. Minimum amount for any money action 1.000 ₫ (10.000 ₫ for top up and withdraw).
- **QR identifiers.** VietQR bank accounts: NAPAS GUID `A000000727` in tag 38 with the real bank BIN. Wallet receive and merchant QR: tag 26 with GUIDs `VN.DEMOWALLET.USER` / `VN.DEMOWALLET.MERCHANT` (see `src/domain/qr.ts`). The wallet's VietQR form uses a virtual account at the Vietcombank BIN.
- **IDs.** Transaction `WL` + 12 digits; support request `HT` + 8 digits.
- **Masks.** CCCD keeps its real 12-digit length: `001*******45`. Bank accounts `•••• 6789`.
