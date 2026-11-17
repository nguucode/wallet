---
code: PRD
name: Product menu
route: /product
summary: "Case-study layer rendered from spec/: overview, sitemap viewer with story coverage, object model and glossary, rules, backlog and story pages. Web only, P1."
---

# PRD · Product menu

The Product menu turns `spec/` into pages a reviewer can read beside the running wallet, so the product thinking (routes, objects, law-as-UI rules, the backlog) is visible without opening the repo. It is a demo layer, web only, and reads the same files the app and the stories are built from, so it can never drift from them. It is entirely P1: the wallet's P0 loop must work and be reviewable on its own first.

## P0 stories

None.

## P1 backlog

| Title | Why P1 |
|---|---|
| Product overview (`/product`) | Case-study entry page: purpose, positioning, principles from PRODUCT.md, and links into the other views; useful only once the P0 loop exists to point at. |
| Sitemap viewer with per-route story coverage | Renders sitemap.yaml for both layouts and marks which stories cover each route; depends on the backlog being written. |
| Object model and glossary viewer | Renders object-model.md, including the transaction state machine and the code term ↔ UI label table. |
| Rules viewer | Renders rules.md grouped by tag ([law], [demo]) with links to the screens that apply each rule. |
| Backlog table and story pages | Filterable table of all stories by Epic, priority, status, size, plus one page per story rendered from its file. |
