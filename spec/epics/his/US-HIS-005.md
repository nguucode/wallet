---
id: US-HIS-005
title: Help page with FAQ entry points
epic: HIS
priority: P0
status: Draft
size: S
routes: ["/support"]
dependsOn: [US-FND-001, US-FND-003]
---

## Story

As a wallet user, I want a help page that answers the common questions and tells me how to report a transaction, so that I can sort out most problems myself and know where to go when I can't.

## Acceptance criteria

- Given I open `/support`, then the first card reads "Có vấn đề với một giao dịch?" with "Mở giao dịch trong Lịch sử và chọn Liên hệ hỗ trợ." and the button "Mở Lịch sử" to `/history`.
- Given the FAQ section "Câu hỏi thường gặp", then I see the topics "Nạp và rút tiền", "Chuyển tiền", "Thanh toán và hóa đơn", "Xác thực giao dịch", "Hạn mức", and "Hồ sơ và CCCD", each expanding to 3 or 4 questions with answers.
- Given the FAQ answers, then the ones about regulatory rules explain the reason and link to where the rule shows in the app, e.g. "Vì sao phải liên kết ngân hàng?" links to `/me/sources` and "Hạn mức tháng được tính thế nào?" links to `/me/limits`; numbers in answers come from config, not hard-coded text.
- Given the last card "Không tìm thấy câu trả lời?", when I tap "Gửi yêu cầu hỗ trợ", then I go to `/support/new` without a transaction (US-HIS-004).
- Given I expand a question, then only that question opens, and the URL hash (`#han-muc-thang`) lets a link open it directly.

## UI states

- Empty: none; FAQ content is static.
- Loading: none beyond the shell; content is bundled.
- Error: none.
- Blocked: none; help is never gated (rules.md#gates).
- Overflow: a long question such as "Giao dịch không thành công nhưng tiền chưa hoàn về thì phải làm gì?" wraps to two lines without clipping diacritics; an answer of 6 short paragraphs stays readable.

## Design notes

- Web (≥ 1024): content column, H1 "Trợ giúp"; the transaction card first, then FAQ topics as one 1px bordered card of accordion rows with a chevron; the contact card last. No search in P0.
- App (< 1024): reached from `/me`; header "Trợ giúp" with back; topics as 56px rows; the "Mở Lịch sử" pill full width.
- Accordions are buttons with `aria-expanded`; answers use 14px body text and plain links.

## FE notes

- `SupportPage` with `FaqAccordion`; content from `src/mock/data/faq.json` with `{ topic, question, answer, slug, links }`.
- Numbers in answers use template tokens filled from config (`{generalMonthlyLimit}`, `{supportWindowDays}`) so rules.md stays the single source.
- Enhanced by HIS P1: Support cases list and case tracking (adds a "Yêu cầu của tôi" section).

## Mock data

- About 20 FAQ entries across the six topics, written in Vietnamese, each tied to a rule in rules.md where one applies.
