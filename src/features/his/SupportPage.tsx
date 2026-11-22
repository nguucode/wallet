import { ChevronDown } from 'lucide-react'
import { useEffect, useState, type ReactNode } from 'react'
import { useLocation, useNavigate } from 'react-router'
import { useLayout } from '@/app/layout'
import { ButtonLink, Card, cx, Ico, Section, TextLink } from '@/components/app-ui'
import { Box } from '@/components/ui/box'
import { Heading } from '@/components/ui/heading'
import { HStack } from '@/components/ui/hstack'
import { Pressable } from '@/components/ui/pressable'
import { Text } from '@/components/ui/text'
import { VStack } from '@/components/ui/vstack'
import { FAQ } from './faq'
import { ScreenTitle } from './parts'

const topicOf = (slug: string) => FAQ.find((t) => t.items.some((i) => i.slug === slug))?.slug

/** Disclosure header: a heading that holds one toggle (WAI-ARIA accordion pattern). */
function Toggle({ level, open, controls, onPress, className, children }: { level: number; open: boolean; controls: string; onPress: () => void; className: string; children: ReactNode }) {
  return (
    <Box role="heading" aria-level={level}>
      <Pressable role="button" aria-expanded={open} aria-controls={controls} onPress={onPress}
        className={cx('w-full flex-row items-center justify-between gap-3 py-3 pr-4 data-[hover=true]:bg-accent data-[active=true]:bg-accent mac:min-h-[38px] mac:py-2 mac:pr-2.5 mac:[&_*]:font-normal', className)}>
        {children}
        <Ico as={ChevronDown} size="lg" className={cx('shrink-0 text-muted-foreground transition-transform duration-150', open && 'rotate-180')} />
      </Pressable>
    </Box>
  )
}

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
    <Box>
      <ScreenTitle>Trợ giúp</ScreenTitle>

      <Card>
        <Heading as="h2" size="lg">Có vấn đề với một giao dịch?</Heading>
        <Text className="mt-1 text-muted-foreground">Mở giao dịch trong Lịch sử và chọn Liên hệ hỗ trợ.</Text>
        <ButtonLink to="/history" block={layout === 'app'} className="mt-3 self-start">Mở Lịch sử</ButtonLink>
      </Card>

      <Section title="Câu hỏi thường gặp">
        <Card inset="rows">
          <VStack className="divide-y divide-border">
            {FAQ.map((tp) => {
              const tOpen = topic === tp.slug
              return (
                <Box key={tp.slug}>
                  <Toggle level={5} open={tOpen} controls={`t-${tp.slug}`} onPress={() => setTopic(tOpen ? undefined : tp.slug)} className="min-h-14 pl-4 mac:min-h-[38px] mac:pl-2.5">
                    <Text className="font-semibold">{tp.topic}</Text>
                  </Toggle>
                  <VStack id={`t-${tp.slug}`} hidden={!tOpen} data-align="free" className={cx('divide-y divide-border border-t border-border bg-muted/50', !tOpen && 'hidden')}>
                    {tp.items.map((q) => {
                      const qOpen = open === q.slug
                      return (
                        <Box key={q.slug} id={q.slug}>
                          <Toggle level={6} open={qOpen} controls={`a-${q.slug}`} onPress={() => toggleQ(q.slug)} className="min-h-12 pl-8 mac:min-h-[38px] mac:pl-5">
                            <Text className="font-medium">{q.question}</Text>
                          </Toggle>
                          <VStack id={`a-${q.slug}`} hidden={!qOpen} className={cx('gap-2 pr-4 pb-3 pl-8 mac:pr-2.5 mac:pl-5', !qOpen && 'hidden')}>
                            {q.answer.map((p) => <Text key={p}>{p}</Text>)}
                            {q.links?.length ? (
                              <HStack className="flex-wrap gap-x-4">
                                {q.links.map((l) => <Box key={l.to} className="min-h-11 justify-center"><TextLink to={l.to}>{l.label}</TextLink></Box>)}
                              </HStack>
                            ) : null}
                          </VStack>
                        </Box>
                      )
                    })}
                  </VStack>
                </Box>
              )
            })}
          </VStack>
        </Card>
      </Section>

      <Section title="Không tìm thấy câu trả lời?">
        <Card>
          <Text className="text-muted-foreground">Gửi yêu cầu cho chúng tôi. Thời gian xử lý tối đa 30 ngày làm việc.</Text>
          <ButtonLink to="/support/new" variant="secondary" block={layout === 'app'} className="mt-3 self-start">Gửi yêu cầu hỗ trợ</ButtonLink>
        </Card>
      </Section>
    </Box>
  )
}
