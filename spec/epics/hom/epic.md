---
code: HOM
name: Home
route: /home
summary: Balance-first home with hide/show and the pending-out line, a fixed shortcut row led by Scan and Payment Code, the active gate, bills due, recent recipients, recent activity, and the app-only /me hub.
---

# HOM · Home

Home is built around the balance and the truth of each transaction, not around services. One number dominates the first viewport ("Số dư khả dụng"), with a second line whenever money is still in flight. Under it sits a fixed row of six shortcuts led by "Quét mã" and "Mã thanh toán" (web drops "Quét mã"), then only the sections that have something to say: the active gate, bills due in the next seven days, recent recipients, and the last five transactions. The app-only `/me` hub lives here too, since it is the fifth tab and a navigation surface rather than a security feature.

## P0 stories

- US-HOM-001 — Home page with the balance
- US-HOM-002 — Shortcuts row
- US-HOM-003 — Gate section on Home
- US-HOM-004 — Bills due section
- US-HOM-005 — Recent recipients
- US-HOM-006 — Recent activity
- US-HOM-007 — Me hub (app only)

## P1 backlog

| Title | Why P1 |
|---|---|
| CCCD expiring banner on Home (30 days before expiry) | PRODUCT.md lists "CCCD expiring and suspension" as P1; rules.md#gates defines the banner as not a gate. |
| Wallet locked state and "Mở khóa" on Home | Wallet lock is P1 in PRODUCT.md; gate #3 has no P0 scenario. |
| "Yêu cầu tiền" entry on Home | Request money and group split are P1 in PRODUCT.md. |
