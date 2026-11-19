import { ChevronDown } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router'
import { useLayout } from '@/app/layout'
import { ButtonLink, Card, cx, Section } from '@/components/app-ui'
import { FAQ } from './faq'
import { ScreenTitle } from './parts'

const topicOf = (slug: string) => FAQ.find((t) => t.items.some((i) => i.slug === slug))?.slug

export default function SupportPage() {
  const layout = useLayout()
  const { hash } = useLocation()
  const nav = useNavigate()
  const fromHash = hash.slice(1)
  const [topic, setTopic] = useState<string | undefined>(() => topicOf(fromHash))
  const [open, setOpen] = useState<string | undefined>(() => (topicOf(fromHash) ? fromHash : undefined))

  useEffect(() => {
    if (!topicOf(fromHash)) return
    setTopic(topicOf(fromHash)); setOpen(fromHash)
    requestAnimationFrame(() => document.getElementById(fromHash)?.scrollIntoView({ block: 'center' }))
  }, [fromHash])

  const toggleQ = (slug: string) => {
    const next = open === slug ? undefined : slug
    setOpen(next)
    nav({ hash: next ?? '' }, { replace: true })
  }

  return (
    <div>
      <ScreenTitle>Trợ giúp</ScreenTitle>

      <Card className="p-inset">
        <h2 className="headline">Có vấn đề với một giao dịch?</h2>
        <p className="mt-1 text-muted">Mở giao dịch trong Lịch sử và chọn Liên hệ hỗ trợ.</p>
        <ButtonLink to="/history" block={layout === 'app'} className="mt-stack">Mở Lịch sử</ButtonLink>
      </Card>

      <Section title="Câu hỏi thường gặp">
        <Card className="divide-y divide-line-soft">
          {FAQ.map((tp) => {
            const tOpen = topic === tp.slug
            return (
              <div key={tp.slug}>
                <h3>
                  <button type="button" aria-expanded={tOpen} aria-controls={`t-${tp.slug}`} onClick={() => setTopic(tOpen ? undefined : tp.slug)}
                    className="flex min-h-14 w-full items-center justify-between gap-3 px-4 py-3 text-left font-semibold hover:bg-surface-2">
                    {tp.topic}
                    <ChevronDown size={20} strokeWidth={1.75} aria-hidden className={cx('shrink-0 transition-transform duration-150', tOpen && 'rotate-180')} />
                  </button>
                </h3>
                <div id={`t-${tp.slug}`} hidden={!tOpen} className="border-t border-line-soft bg-surface-2/50">
                  {tp.items.map((q) => {
                    const qOpen = open === q.slug
                    return (
                      <div key={q.slug} id={q.slug} className="border-b border-line-soft last:border-b-0">
                        <h4>
                          <button type="button" aria-expanded={qOpen} aria-controls={`a-${q.slug}`} onClick={() => toggleQ(q.slug)}
                            className="flex min-h-12 w-full items-center justify-between gap-3 py-3 pr-4 pl-6 text-left text-[15px] font-medium hover:bg-surface-2">
                            {q.question}
                            <ChevronDown size={18} strokeWidth={1.75} aria-hidden className={cx('shrink-0 transition-transform duration-150', qOpen && 'rotate-180')} />
                          </button>
                        </h4>
                        <div id={`a-${q.slug}`} hidden={!qOpen} className="space-y-header pr-4 pb-stack pl-6 text-[15px] leading-[20px]">
                          {q.answer.map((p) => <p key={p}>{p}</p>)}
                          {q.links?.length ? (
                            <p className="flex flex-wrap gap-x-4">
                              {q.links.map((l) => <Link key={l.to} to={l.to} className="inline-flex min-h-11 items-center font-semibold text-tint">{l.label}</Link>)}
                            </p>
                          ) : null}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </Card>
      </Section>

      <Section title="Không tìm thấy câu trả lời?">
        <Card className="p-inset">
          <p className="text-muted">Gửi yêu cầu cho chúng tôi. Thời gian xử lý tối đa 30 ngày làm việc.</p>
          <ButtonLink to="/support/new" variant="secondary" block={layout === 'app'} className="mt-stack">Gửi yêu cầu hỗ trợ</ButtonLink>
        </Card>
      </Section>
    </div>
  )
}
