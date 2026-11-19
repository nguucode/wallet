# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack

React 19 + Vite + TypeScript + React Router 7 + Tailwind v4 + Radix, Vitest, axe, the same stack as Fortify. One app with two layouts: a desktop web wallet (≥ 1024px, sidebar) and a mobile app shell (< 1024px, tab bar, sheets, numeric keypad). It is installable as a PWA. The layout follows the viewport width, so a desktop reviewer sees the mobile shell by narrowing the window below 1024px (or on a phone); the `/device` phone-frame preview was removed 2026-11-19. Deployed to Cloudflare Pages at wallet.ontheshore.biz by GitHub Actions on every push to `main` (check-spec, test, build, deploy). Capacitor is added only if a real install file is ever needed. Expo and a split web + Expo monorepo were ruled out.

## Users

- **Persona in the product:** a young urban professional in Vietnam, 22–35 and salaried. They send money to friends and family by phone number or contact, scan merchant QR codes at the counter, pay electricity and phone bills, and transfer out to bank accounts via VietQR. They use the wallet on a phone, one-handed, often while standing at a counter or in a queue.
- **Audience of the demo:** enterprise and fintech product teams (PMs, BAs, POs, designers) viewing it as a portfolio case study. They judge the product thinking: how regulation, transaction states and edge cases become UI. Most open it on desktop, so the mobile experience must be reviewable there by narrowing the window.

## Product Purpose

A front-end-only e-wallet demo for the Vietnamese market, running on mock data from a fixed seed. It shows that a wallet can do the core jobs (top up, withdraw, transfer, pay by QR, pay bills, review history) without the super-app sprawl. It succeeds when a reviewer can walk every P0 flow end to end, including the failure and pending paths, and comes away understanding why each screen is the way it is.

## Positioning

Simple, with every state always clear. Wallet does only the core jobs, and it shows every transaction state plainly: pending, failed, refunded, waiting for the recipient, needs verification. It also surfaces every rule the State Bank of Vietnam imposes (linked-bank requirement, monthly limits, face-match step-up) as visible, explained UI rather than surprise errors. MoMo and ZaloPay are super-apps whose home screens are built around services; this one is built around the balance and the truth of each transaction.

## Operating Context

- Mobile: at a shop counter scanning a QR code, with a queue behind; on the move sending money; at home paying a bill. Speed to Scan/Payment Code matters most.
- Desktop web wallet: reviewing history, receipts, statements and limits.
- Reviewers: open wallet.ontheshore.biz on desktop, narrow the window to see the app layout, and trigger demo states with demo controls (as in Fortify).

## Capabilities and Constraints

- **P0 flows:**
  - Onboarding + mock eKYC: CCCD → NFC or VNeID → face match → mandatory warning → link a bank account.
  - Home: balance first, plus a fixed row of shortcuts led by Scan / Payment Code.
  - Top up and withdraw via linked bank only (cash top-up and withdrawal are banned by law).
  - Wallet-to-wallet transfer by phone number and contacts.
  - Transfer out to a bank via VietQR.
  - Merchant QR scan and Payment Code.
  - Electricity bill payment.
  - History, detail and receipt, plus Contact support.
  - Step-up auth (PIN / face match).
  - Limits screen.
  - Notifications.
  - All pending, failed and refunded states.
- **P1:**
  - Request money and group split.
  - Pending receipt with refund after 24 hours.
  - Dispute tracking.
  - CCCD expiring and suspension.
  - Wallet lock and device management.
  - Risky-recipient warning.
- **Out of scope:** super-app verticals, BNPL, interest or yield on balance (banned), cash top-up or withdrawal (banned), real integrations, real auth, real money.
- **Regulatory rules as UI** (source: research note in the vault, `10-projects/wallet/research/2026-11-17-ewallet-domain-and-platform.md`):
  - The wallet is unusable until linked to the owner's own bank account or debit card.
  - Limits: 100 million VND/month in total, plus up to 300 million VND/month for essential payments.
  - Step-up thresholds (10M VND per transaction, 20M VND cumulative per day, as MoMo publishes them) live in config.
- **Currency:** VND, no decimals, formatted `1.250.000 ₫`. The balance can be hidden or shown.
- **Language:** UI in Vietnamese. Spec, User Stories and code identifiers in English.
- **Visual system:** Apple Human Interface Guidelines (decided 2026-11-19), documented in DESIGN.md as "Inset Grouped". Violet `#5B2BE0` is the app tint; type is the system stack (SF Pro on Apple devices, Be Vietnam Pro elsewhere for full Vietnamese diacritics); light and dark follow the system setting.

## Brand Commitments

- The product name is **Wallet** (working name), hosted at wallet.ontheshore.biz.
- UI follows Apple's Human Interface Guidelines (iOS on the app layout, macOS sidebar conventions on web) as a third-party app would: grouped backgrounds, inset grouped sections, large titles, Liquid Glass on navigation chrome only, the app's own violet tint. It borrows no Apple brand: no Apple logo, no Apple Pay or Apple Wallet marks or names, no SF Symbols artwork (icons are Lucide), and SF Pro is never shipped as a webfont, only reached through the system font stack.
- History: PayPal grammar ("Clear Ledger", 2026-11-17), then Copilot grammar ("Violet Sky", 2026-11-17), then Apple HIG ("Inset Grouped", 2026-11-19). The PayPal study stays in the vault note `10-projects/wallet/paypal-style-study.md` for flow reference.
- Never use the PayPal logo or monogram, PayPal Pro or PayPal Open fonts, PayPal's exact colours (#0065F2, #002991, #001435, #0070BA, #003087), its yellow or black logo buttons, or the word "PayPal".
- No MoMo, ZaloPay, NAPAS or bank logos. Banks use real Vietnamese bank names as text (decided 2026-11-17: it is a demo). People, merchants and billers in mock data are fictional; VietQR is referenced by name only.

## Evidence on Hand

- Research note with primary sources: regulation, MoMo/ZaloPay IA, object model, proposed sitemap, P0 scope (vault path above).
- PayPal style measurements (vault path above), kept for flow reference; the visual system is now DESIGN.md.
- No real users, transactions, testimonials or metrics. All data is mock from a fixed seed. Do not fabricate user counts, ratings or partner logos.

## Product Principles

1. **Law is UI, not an error.** Every regulatory rule appears before the user hits it, with a plain reason.
2. **No hidden states.** Every transaction always shows where it is and what happens next. Pending and failed get as much design care as success.
3. **Core jobs only.** Anything that is not top up, withdraw, transfer, pay, bills or history must earn its place; no filler tiles.
4. **Scan is one tap away.** On mobile, Scan and Payment Code are reachable from anywhere in one tap.
5. **Reviewable by design.** Demo controls let a reviewer reach any state without real setup, and the responsive layout shows mobile without a device.

## Accessibility & Inclusion

WCAG 2.2 AA, checked with axe on every route at desktop and mobile widths, as in Fortify. Touch targets are at least 44px on the mobile shell. Vietnamese diacritics must never clip, including at large display sizes such as the balance. Amounts are read correctly by screen readers (VND, not decimals).
