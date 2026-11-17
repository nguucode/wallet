import { ArrowLeft, Check, Clock, Wallet, X } from 'lucide-react'
import { createContext, useContext, useEffect, useRef, type ReactNode } from 'react'
import { useNavigate } from 'react-router'
import { useLayout } from '@/app/layout'
import { SampleBadge } from '@/app/Shell'
import { cx, IconButton } from '@/components/ui'
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
    <div className="w-full">
      <p className="sr-only">Bước {cur + 1} trên 3: {STAGES[cur]}</p>
      <ol aria-hidden className="grid grid-cols-3 gap-2">
        {STAGES.map((s, i) => (
          <li key={s} className="min-w-0">
            <span className={cx('block h-1 rounded-full', i <= cur ? 'bg-white' : 'bg-white/30')} />
            <span className={cx('mt-1.5 block text-[12px] leading-4 text-white', i === cur ? 'font-semibold' : 'opacity-75')}>{s}</span>
          </li>
        ))}
      </ol>
    </div>
  )
}

/**
 * One onboarding step (US-ONB-001). Web: centred 560 column on the neutral background, step in a 1px card.
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
  const skip = canSkip ? <button type="button" onClick={() => { clear(); nav('/home') }} className="h-11 rounded-full px-3 text-[14px] font-semibold text-white hover:bg-white/15">Để sau</button> : null
  const heading = <h1 ref={h1} tabIndex={-1} className={cx('font-bold outline-none', layout === 'web' ? 'text-[24px] leading-[32px]' : 'text-[22px] leading-[30px]')}>{title}</h1>

  if (layout === 'web')
    return (
      <div className="relative min-h-dvh bg-ground">
        <div aria-hidden className="sky pointer-events-none absolute inset-x-0 top-0 h-[360px]" />
        <header className="relative mx-auto flex h-16 max-w-[960px] items-center justify-between gap-4 px-8 text-white">
          <span className="flex items-center gap-2 text-[20px] font-extrabold tracking-tight">
            <span aria-hidden className="inline-flex size-8 items-center justify-center rounded-[10px] bg-white text-primary"><Wallet size={18} strokeWidth={2} /></span>
            Wallet
          </span>
          <span className="flex items-center gap-2"><DemoControlsButton /><SampleBadge onSky />{skip}</span>
        </header>
        <main id="main" className="relative mx-auto max-w-[560px] px-4 pt-6 pb-16">
          <div className="mb-4"><Stages step={step} /></div>
          <div className="card p-8">
            {back ? (
              <button type="button" onClick={() => go(back)} className="-ml-2 mb-3 inline-flex h-11 items-center gap-1.5 rounded-full px-2 text-[14px] font-medium hover:bg-surface-2">
                <ArrowLeft size={18} strokeWidth={1.75} aria-hidden />Quay lại
              </button>
            ) : null}
            {heading}
            {description ? <p className="mt-2 text-muted">{description}</p> : null}
            <div className="mt-6">{children}</div>
            {footer ? <div className="mt-8 flex flex-col gap-2">{footer}</div> : null}
          </div>
        </main>
      </div>
    )

  return (
    <div className="flex min-h-dvh flex-col bg-surface">
      <header className="sticky top-0 z-30 bg-sky-from px-2 pb-3 text-white">
        <div className="flex h-14 items-center gap-1">
          {back ? <IconButton label="Quay lại" className="text-white hover:bg-white/15" onClick={() => go(back)}><ArrowLeft size={22} strokeWidth={1.75} /></IconButton> : <span className="w-3" />}
          <span className="flex flex-1 items-center gap-1"><SampleBadge onSky /></span>
          <DemoControlsButton compact />
          {skip}
        </div>
        <div className="px-3"><Stages step={step} /></div>
      </header>
      <main id="main" className="mx-auto w-full max-w-[560px] flex-1 px-5 pt-4 pb-6">
        {heading}
        {description ? <p className="mt-2 text-muted">{description}</p> : null}
        <div className="mt-5">{children}</div>
      </main>
      {footer ? <div className="sticky bottom-0 z-20 mx-auto flex w-full max-w-[560px] flex-col gap-2 bg-surface px-5 pt-3 pb-[max(16px,env(safe-area-inset-bottom))]">{footer}</div> : null}
    </div>
  )
}

/** 64px status mark in a soft circle: tick (accent), clock (amber), cross (danger). */
export function StatusMark({ tone }: { tone: 'primary' | 'pending' | 'danger' }) {
  const Icon = tone === 'pending' ? Clock : tone === 'danger' ? X : Check
  const cls = { primary: 'bg-primary-soft text-primary', pending: 'bg-pending-soft text-pending', danger: 'bg-danger-soft text-danger' }[tone]
  return <span aria-hidden className={cx('inline-flex size-16 items-center justify-center rounded-full animate-[fade-in_200ms_ease-out]', cls)}><Icon size={32} strokeWidth={2.25} /></span>
}

/** Label/value rows separated by 1px rules; long uppercase names wrap without clipping diacritics. */
export function DataList({ rows }: { rows: [string, ReactNode][] }) {
  return (
    <dl className="divide-y divide-line-soft border-y border-line-soft">
      {rows.map(([k, v]) => (
        <div key={k} className="flex items-start justify-between gap-4 py-3">
          <dt className="shrink-0 text-muted">{k}</dt>
          <dd className="min-w-0 text-right leading-[24px] font-medium break-words">{v}</dd>
        </div>
      ))}
    </dl>
  )
}

/** Simulated hand-off panel header, so it never reads as Wallet UI. */
export function SimLabel({ children }: { children: ReactNode }) {
  return <p className="mb-3 inline-flex h-6 items-center rounded-full border border-dashed border-line px-2.5 text-[12px] font-medium text-muted">{children}</p>
}
