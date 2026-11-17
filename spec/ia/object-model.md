# Object model

Business rules are in [rules.md](rules.md). Sources for every regulatory field are in the vault research note `10-projects/wallet/research/2026-11-17-ewallet-domain-and-platform.md` (§1–2).

The demo has **one signed-in Customer** (the persona). Everyone else (contacts, merchants, billers, banks) is a counterparty. Every object is front-end mock state; nothing is synced from a real system.

## Glossary: code term ↔ UI label

Use these UI labels exactly. Synonyms in the right column are banned in the UI.

| Code term | UI label (vi) | Do not use |
|---|---|---|
| Wallet | Ví | Tài khoản ví (except legal text) |
| Available balance | Số dư khả dụng | Số dư hiện tại |
| Funding source | Nguồn tiền | Phương thức thanh toán |
| Top up | Nạp tiền | Nạp ví |
| Withdraw | Rút tiền | Rút về |
| Transfer to wallet | Chuyển đến ví | Chuyển MoMo, chuyển nội bộ |
| Transfer to bank | Chuyển đến ngân hàng | Chuyển khoản liên ngân hàng |
| Receive QR | Mã nhận tiền | QR của tôi |
| Payment Code | Mã thanh toán | Mã QR thanh toán |
| Scan | Quét mã | Quét QR |
| Bill | Hóa đơn | Bill |
| Transaction | Giao dịch | Lệnh |
| Pending | Đang xử lý | Chờ |
| Failed | Không thành công | Thất bại, lỗi |
| Refunded | Đã hoàn tiền | Hoàn trả |
| Step-up auth | Xác thực giao dịch | OTP (unless it is literally an OTP) |
| Face match | Xác thực khuôn mặt | eKYC (outside onboarding) |
| Support request | Yêu cầu hỗ trợ | Khiếu nại, tra soát (except in legal copy) |
| Limit | Hạn mức | Giới hạn |

## Relationships

```
Customer 1─1 Wallet
Customer 1─* FundingSource            (bank account | domestic debit card) — at least 1 required to transact
Customer 1─* Device 1─* Session        (P1 surface; current device always exists)
Wallet 1─* Transaction
Transaction ─0..1 Counterparty         Contact | BankAccountRef | Merchant | Biller
Transaction ─0..1 FundingSource        topup / withdraw / pay-by-source
Transaction ─0..1 AuthChallenge        the step-up that approved it
Transaction 1─0..1 SupportRequest
Customer 1─* SavedBill ─1 Biller       Bill (period) is fetched on lookup
Customer 1─1 LimitCounters             derived from Transactions, never stored separately
Customer 1─* Notification              each may link to a Transaction, Bill, or security event
Contact ─0..1 hasWallet                contacts without a wallet cannot receive wallet transfers (P0)
```

## Objects

| Object | Key fields |
|---|---|
| **Customer** | name, phone, idNumber (masked in UI `001*******45`), idExpiry, dob, `kycStatus`, `kycMethod: nfc \| vneid` |
| **Wallet** | walletNumber (= phone in display), `status`, balance, `pendingOut` (sum of pending debits) |
| **FundingSource** | bankName, `kind: account \| debit_card`, last4, holderName (must equal Customer name), isDefault, `status: linked \| unlinked` |
| **Transaction** | id (`WL` + 12 digits), `type`, `status`, amount, fee, `direction: in \| out`, counterparty, message (≤ 50 chars), sourceId, `authMethod`, createdAt, updatedAt, `failureReason`, `pendingReason`, `essential` (bills) |
| **Contact** | name, phone, avatar initials, `hasWallet`, lastTransferAt |
| **BankAccountRef** | bankName, accountNumber, holderName (returned by lookup), saved |
| **Merchant** | name, category, `qr` payload, `fixedAmount?` |
| **Biller** | name, `category: electricity` (P0), `essential: true`, customerCode format |
| **SavedBill / Bill** | billerId, customerCode, holderName, period, amount, dueDate, `status` |
| **AuthChallenge** | `method`, attemptsLeft, lockedUntil |
| **SupportRequest** | id, transactionId?, `reason`, details, createdAt, `status` |
| **Notification** | `kind`, title, body, link, createdAt, read |

## Enums and lifecycles

| Object | Values |
|---|---|
| Customer.kycStatus | `unverified → verifying → verified → id_expiring → id_expired`. `verifying → unverified` on a failed match (with reason). `id_expiring` starts 30 days before idExpiry. |
| Wallet.status | `active \| suspended \| locked \| closed` (exact four from TT 40 appendix). `suspended` when id_expired. `locked` by the user or by risk (P1). `closed` is never reached in the demo. |
| Transaction.type | `topup, withdraw, p2p_out, p2p_in, bank_transfer, qr_merchant, bill, refund` |
| Transaction.status | see state machine below |
| failureReason | `bank_declined, recipient_bank_rejected, timeout_reversed, biller_unavailable, merchant_cancelled, system_busy` (wallet-to-wallet) |
| pendingReason | `bank_processing, biller_settling` |
| AuthChallenge.method | `pin \| device_biometric \| face_match` |
| Bill.status | `due \| overdue \| paid \| settling` |
| SupportRequest.reason | `wrong_recipient, not_received, charged_twice, failed_but_debited, other` |
| SupportRequest.status | `received → investigating → resolved \| escalated` (P1 surface) |
| Notification.kind | `balance_change, new_device_login, id_expiring, bill_due, security, support_update` |

## Transaction state machine

Every transaction is created only **after** a successful step-up; there is no "draft" or "awaiting auth" state stored. Pre-checks (balance, limits, gates) run before the auth sheet opens, so `insufficient balance` and `limit exceeded` are input errors, never failed transactions.

```
                ┌──────────────► success ──(merchant/biller refund)──► refunded
 [auth ok] ─► pending                                    (creates a separate `refund` tx, direction in)
                └──────────────► failed   (debit reversed, money back in balance)

 instant types (p2p_out, p2p_in, topup, qr_merchant): created directly as success or failed, never pending
 pending-capable types: bank_transfer (bank_processing), bill (biller_settling), withdraw (bank_processing)
```

| Status | UI label | Balance effect | Shown as |
|---|---|---|---|
| pending | Đang xử lý | Debited from available, counted in `pendingOut` | Amber timeline step with "dự kiến xong trước HH:mm" and what happens if it fails |
| success | Thành công | Final | Default |
| failed | Không thành công | Reversed; available balance restored | Reason in plain words + "Tiền đã hoàn về ví lúc HH:mm" when it had been debited |
| refunded | Đã hoàn tiền | Original stays success; the `refund` tx adds money back | Both rows link to each other |

P1 adds `p2p_out: awaiting_claim → claimed | returned` (24h) for recipients without a wallet.

## Derived values

- `available = balance − pendingOut` is the number on Home. When `pendingOut > 0`, Home shows a second line: "Đang xử lý: 1.200.000 ₫".
- `LimitCounters` are computed from the current month's / day's transactions (see rules.md#limits). They are never edited directly; demo controls adjust them only by injecting transactions.
