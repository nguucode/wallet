import { Check, Clock, X } from 'lucide-react'
import { createContext, useContext, useEffect, useRef, type ReactNode } from 'react'
import { useNavigate } from 'react-router'
import { useLayout } from '@/app/layout'
import { SampleBadge } from '@/app/Shell'
import { BackButton, Badge, Button, Card, cx, DetailRows, Ico, WebBackLink } from '@/components/app-ui'
import { Box } from '@/components/ui/box'
import { Center } from '@/components/ui/center'
import { Grid, GridItem } from '@/components/ui/grid'
import { Heading } from '@/components/ui/heading'
import { HStack } from '@/components/ui/hstack'
import { Image } from '@/components/ui/image'
import { Progress, ProgressFilledTrack } from '@/components/ui/progress'
import { Text } from '@/components/ui/text'
import { VStack } from '@/components/ui/vstack'
import { DemoControlsButton } from '@/features/demo/DemoControls'
import { backTarget, stageOf, STAGES, type IdPath, type Step } from './steps'

export type Draft = { phone: string; path?: IdPath; otpSentAt?: number; otpAttemptsLeft?: number }
export type OnbCtx = {
  step: Step; start: Step; draft: Draft; setDraft: (p: Partial<Draft>) => void
  go: (s: Step, opts?: { replace?: boolean }) => void; canSkip: boolean; clear: () => void
}
export const Ctx = createContext<OnbCtx>(null!)
export const useOnb = () => useContext(Ctx)

function Stages({ step }: { step: Step }) {
  const cur = stageOf(step)
  return (
    <Box className="w-full">
      <Text className="sr-only">Bước {cur + 1} trên 3: {STAGES[cur]}</Text>
      <Grid aria-hidden className="gap-2" _extra={{ className: 'grid-cols-3' }}>
        {STAGES.map((s, i) => (
          <GridItem key={s} className="min-w-0" _extra={{ className: 'col-span-1' }}>
            <Progress value={i <= cur ? 100 : 0} className="h-1">
              <ProgressFilledTrack />
            </Progress>
            <Text size="xs" className={cx('mt-2 block', i === cur ? 'font-semibold text-foreground' : 'text-muted-foreground')}>{s}</Text>
          </GridItem>
        ))}
      </Grid>
    </Box>
  )
}

/**
 * One onboarding step (US-ONB-001). Web: centred 560 column on the neutral background, step in a card.
 * App: full screen, header with back and "Để sau", primary pinned to the bottom safe area.
 */
export function StepShell({ title, children, footer, description }: { title: string; children?: ReactNode; footer?: ReactNode; description?: ReactNode }) {
  const { step, start, go, canSkip, clear } = useOnb()
  const layout = useLayout()
  const nav = useNavigate()
  const h1 = useRef<HTMLHeadingElement>(null)
  const back = backTarget(step, start)
  useEffect(() => {
    document.title = `${title} · Mở ví · Wallet`
    h1.current?.focus({ preventScroll: true })
    window.scrollTo(0, 0)
  }, [title])
  const skip = canSkip ? <Button variant="ghost" onClick={() => { clear(); nav('/home') }} className="rounded-full">Để sau</Button> : null
  const heading = <Heading size="3xl" ref={h1} tabIndex={-1} className="outline-none">{title}</Heading>
  const desc = description ? <Text className="mt-2 block text-muted-foreground">{description}</Text> : null

  if (layout === 'web')
    return (
      <Box className="relative min-h-dvh bg-background">
        <HStack role="banner" className="relative mx-auto h-16 max-w-[960px] items-center justify-between gap-4 px-8">
          <HStack className="items-center gap-2">
            <Image source={{ uri: '/icon.svg' }} alt="" size="none" className="size-7 rounded-md" />
            <Heading as="p" size="lg">Wallet</Heading>
          </HStack>
          <HStack className="items-center gap-2"><DemoControlsButton /><SampleBadge />{skip}</HStack>
        </HStack>
        <Box role="main" id="main" className="relative mx-auto max-w-[560px] px-4 pt-6 pb-16">
          <Box className="mb-3"><Stages step={step} /></Box>
          <Card className="p-5">
            {back ? <WebBackLink onClick={() => go(back)} /> : null}
            {heading}
            {desc}
            <Box className="mt-6">{children}</Box>
            {footer ? <VStack className="mt-8 gap-2">{footer}</VStack> : null}
          </Card>
        </Box>
      </Box>
    )

  return (
    <VStack className="min-h-dvh bg-background">
      <VStack role="banner" className="sticky top-0 z-30 bg-background px-1 pb-3 pt-[env(safe-area-inset-top)]">
        <HStack className="h-14 items-center gap-1">
          {back ? <BackButton onClick={() => go(back)} /> : <Box className="w-3" />}
          <HStack className="flex-1 items-center gap-1"><SampleBadge /></HStack>
          <DemoControlsButton compact />
          {skip}
        </HStack>
        <Box className="px-4"><Stages step={step} /></Box>
      </VStack>
      <Box role="main" id="main" className="mx-auto w-full max-w-[560px] flex-1 px-4 pt-3 pb-6">
        {heading}
        {desc}
        <Box className="mt-6">{children}</Box>
      </Box>
      {footer ? <VStack className="sticky bottom-0 z-20 mx-auto w-full max-w-[560px] gap-2 border-t border-border bg-background px-5 pt-3 pb-[max(16px,env(safe-area-inset-bottom))]">{footer}</VStack> : null}
    </VStack>
  )
}

/** Status mark in a soft circle: tick (primary), clock (muted), cross (destructive). */
export function StatusMark({ tone }: { tone: 'primary' | 'pending' | 'danger' }) {
  const icon = tone === 'pending' ? Clock : tone === 'danger' ? X : Check
  const cls = { primary: 'bg-primary/10 text-primary', pending: 'border border-border bg-card text-foreground', danger: 'bg-destructive/10 text-destructive' }[tone]
  return <Center aria-hidden className={cx('size-16 rounded-full', cls)}><Ico as={icon} size="xl" className="text-current" /></Center>
}

/** Label/value rows separated by 1px rules; long uppercase names wrap without clipping diacritics. */
export function DataList({ rows }: { rows: [string, ReactNode][] }) {
  return <Box className="border-y border-border"><DetailRows rows={rows} /></Box>
}

/** Simulated hand-off panel header, so it never reads as Wallet UI. */
export function SimLabel({ children }: { children: ReactNode }) {
  return <Box className="mb-3 self-start"><Badge tone="pending">{children}</Badge></Box>
}
