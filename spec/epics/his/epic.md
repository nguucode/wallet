---
code: HIS
name: History and support
route: /history
summary: History list with filters and saved views, transaction detail with status timeline, receipt, contact support from a transaction, and the help page.
---

# HIS · History and support

History is where "no hidden states" is proven: every transaction, including pending and failed ones, is listed and can be opened to a detail that says where it is, what happened, and what happens next. The detail is also the only door to support for a specific transaction, so the support form arrives prefilled and honest about its limits (the 60-day window, and the fact that the wallet cannot reverse a completed transfer to the wrong person). `/support` itself is a light help page in P0: FAQ entry points and a general contact form.

## P0 stories

- US-HIS-001 — History list with filters and saved views
- US-HIS-002 — Transaction detail
- US-HIS-003 — Receipt view
- US-HIS-004 — Contact support form
- US-HIS-005 — Help page with FAQ entry points

## P1 backlog

| Title | Why P1 |
|---|---|
| Monthly statement (`/history?view=statement`) | Marked P1 in sitemap.yaml; the list grouped by month already shows totals. |
| Support cases list and case tracking (`/support/:caseId`) | Dispute tracking is P1 in PRODUCT.md; P0 shows the request on the transaction detail instead. |
| Free-text search in history | Filters and saved views cover the demo; search adds index and empty-state work. |
| Receipt as an image file | Needs an HTML-to-image dependency; P0 uses print and share. |
| Custom date range and CSV export | Desktop power-user features, not part of the demo loop. |
| Chat with support | Real-time channel; out of scope for a front-end mock. |
