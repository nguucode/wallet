# Mock data

All people, transactions, merchants, and billers are fictional. Banks use **real Vietnamese bank names** (text only, no logos), since this is a demo. Every screen shows a small **Dữ liệu mẫu** badge. No wallet brand names or logos; VietQR is referenced by name only.

## The persona

**Trần Minh Anh**, 27, Hà Nội, salaried office worker. Phone `0901 234 567` (fictional range). CCCD expires 21 days after "today" in the `id-expiring` scenario, 4 years out otherwise.

## Scale

| Entity | Count |
|---|---|
| Customer / Wallet | 1 / 1 |
| Funding sources | 3: two bank accounts (one default), one domestic debit card |
| Contacts | 40 (32 with a wallet, 8 without) |
| Saved bank recipients | 6 |
| Merchants | 25 across cà phê, siêu thị, nhà hàng, xăng, nhà thuốc; 5 with a fixed-amount QR |
| Billers | 3 electricity companies (P0); water and internet billers exist but are flagged P1 |
| Saved bills | 2 electricity (one due in 3 days, one paid) |
| Transactions | ~260 over 12 months: salary-funded top-ups, rent and family transfers, coffee QR payments, monthly electricity |
| Notifications | ~60, latest 8 unread |
| Support requests | 2 (one received, one resolved) |

Banks (real names, shown as text with a neutral monogram, no logos): Vietcombank, VietinBank, BIDV, Techcombank, MB Bank, ACB. The persona's linked sources: Vietcombank account (default), Techcombank account, MB Bank debit card. Fictional electricity companies: Điện lực Hồng Hà, Điện lực Đông Phố, Điện lực Tây Hồ Xanh.

## Generation

- `@faker-js/faker` with the `vi` locale and a fixed seed; JSON output committed to `src/mock/data/`, as in Fortify.
- Dates stored as offsets from "today" and resolved at app load, so the demo never goes stale.
- Amounts are realistic VND and always whole đồng: coffee 35.000–75.000, groceries 150.000–1.200.000, rent 6.500.000, family transfer 2.000.000–5.000.000, electricity 450.000–1.400.000.
- The current month is seeded to sit at ~62% of the general limit and ~1% of essential, so the limits screen has something to show.
- Hand-made edge cases (always present):
  - One `bank_transfer` **pending** (bank_processing) from 20 minutes ago, so `pendingOut > 0` on first load.
  - One `bank_transfer` **failed** (timeout_reversed) last week with the reversal time.
  - One `qr_merchant` **refunded** with its linked `refund` row.
  - One `bill` **settling** (biller_settling).
  - A contact with a 40-character Vietnamese name with stacked diacritics ("Nguyễn Hoàng Phương Thảo Nguyệt Quỳnh Như") for overflow.
  - A 12-character balance (`128.450.000 ₫`) in the `rich` scenario to test the display size at 375px.
- Sample QR library (for /pay/scan on web and in demo): 3 merchant QR (one fixed amount), 2 VietQR bank accounts, 2 wallet receive QR, 1 unknown/invalid payload. Payloads follow EMVCo TLV structure so the parser is real; images are generated at build time.

## Scenarios

The persona's state is a named scenario, picked in Demo controls. Default is `ready`.

| Scenario | State |
|---|---|
| `new` | Signed out; starts at /onboarding |
| `unverified` | Wallet opened, biometrics not done (gate #1) |
| `no-source` | Verified, no linked bank (gate #4) |
| `ready` | Verified, 3 sources, full history (default) |
| `id-expiring` | `ready` + CCCD expires in 21 days |
| `suspended` | CCCD expired (gate #2) |
| `near-limit` | `ready` + general month at 97.5tr of 100tr |
| `rich` | `ready` + large balance for display-size checks |

## Demo controls

A panel available from the web top bar, beside the phone frame on /device, and via a long-press on the app header in the app shell. Every control is labelled as a simulation.

- **Scenario** picker (table above) and **Reset** to the seed.
- **Next outcome** for the next money action: Thành công (default) / Đang xử lý / Không thành công (with reason).
- **Resolve pending**: settle every pending transaction as success or failed.
- **Incoming transfer**: a contact sends money now (creates `p2p_in` + notification).
- **Cashier scans Payment Code**: completes the open /pay/code with a merchant and amount.
- **Verification result** for onboarding: instant / needs review / failure reason.
- **Face match result**: match / no match (to show retries and lockout).
- **Merchant refund**: refund the latest `qr_merchant`.
- **Clock**: advance time (+1 hour, +1 day, to next month) to show pending resolution, bill due, limit reset.

## Latency

Store actions resolve after 300–900 ms (random, seeded), as in Fortify, so loading states are visible. A Demo control can set latency to 0 or 3 s.
