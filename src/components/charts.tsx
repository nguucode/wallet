import { useId } from 'react'
import { cx } from '@/components/ui'

/** Daily line (e.g. balance over 30 days). Decorative shape; the summary lives in aria-label. */
export function LineChart({ values, label, className, endTag, wide }: { values: number[]; label: string; className?: string; endTag?: string; wide?: boolean }) {
  const id = useId()
  const W = wide ? 560 : 320, H = 96, pad = 8
  if (values.length < 2) return null
  const min = Math.min(...values), max = Math.max(...values)
  const span = max - min || 1
  const pts = values.map((v, i) => [pad + (i * (W - pad * 2)) / (values.length - 1), pad + (1 - (v - min) / span) * (H - pad * 2)] as const)
  const d = pts.map(([x, y], i) => `${i ? 'L' : 'M'}${x.toFixed(1)},${y.toFixed(1)}`).join(' ')
  const [ex, ey] = pts[pts.length - 1]
  return (
    <div className={cx('relative', className)}>
      <svg viewBox={`0 0 ${W} ${H}`} className="block h-auto w-full overflow-visible" role="img" aria-label={label}>
        <defs>
          <linearGradient id={id} x1="0" x2="0" y1="0" y2="1">
            <stop offset="0" stopColor="var(--color-tint)" stopOpacity="0.18" />
            <stop offset="1" stopColor="var(--color-tint)" stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d={`${d} L${ex},${H} L${pts[0][0]},${H} Z`} fill={`url(#${id})`} />
        <path d={d} fill="none" stroke="var(--color-tint)" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />
        <circle cx={ex} cy={ey} r="5" fill="var(--color-surface)" stroke="var(--color-tint)" strokeWidth="2.5" />
      </svg>
      {endTag ? (
        <span aria-hidden className="absolute -translate-x-full -translate-y-[130%] rounded-[8px] bg-primary px-2 py-0.5 text-[12px] font-bold whitespace-nowrap text-white" style={{ left: `${(ex / W) * 100}%`, top: `${(ey / H) * 100}%` }}>{endTag}</span>
      ) : null}
    </div>
  )
}

export type RingTone = 'ok' | 'warn' | 'over'
const RING: Record<RingTone, string> = { ok: 'var(--color-chart-up)', warn: 'var(--color-chart-warn)', over: 'var(--color-chart-over)' }

/** Progress ring for a limit pool: used share drawn, tone by how close to the limit. */
export function Ring({ used, size = 96, tone, children }: { used: number; size?: number; tone: RingTone; children?: React.ReactNode }) {
  const r = 42, c = 2 * Math.PI * r
  // A sliver of use still reads as an arc, not a dot.
  const f = used > 0 ? Math.max(0.04, Math.min(1, used)) : 0
  return (
    <span className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg viewBox="0 0 100 100" className="absolute inset-0" aria-hidden>
        <circle cx="50" cy="50" r={r} fill="none" stroke="var(--color-line-soft)" strokeWidth="9" />
        <circle cx="50" cy="50" r={r} fill="none" stroke={RING[tone]} strokeWidth="9" strokeLinecap="round" strokeDasharray={`${c * f} ${c}`} transform="rotate(-90 50 50)" />
      </svg>
      <span className="relative">{children}</span>
    </span>
  )
}

export const ringTone = (share: number): RingTone => (share >= 0.95 ? 'over' : share >= 0.75 ? 'warn' : 'ok')

/** Monthly bars against a limit line with a navy flag (Copilot grammar). */
export function BarsWithLimit({ bars, limit, limitLabel, label }: { bars: { key: string; short: string; value: number; current?: boolean }[]; limit: number; limitLabel: string; label: string }) {
  const max = Math.max(limit * 1.15, ...bars.map((b) => b.value))
  const H = 120
  const y = (v: number) => H - (v / max) * H
  return (
    <figure className="m-0" aria-label={label}>
      <div className="relative" style={{ height: H + 24 }}>
        <div aria-hidden className="absolute inset-x-0 border-t-2 border-ink" style={{ top: y(limit) }}>
          <span className="absolute right-0 -translate-y-1/2 rounded-l-[10px] rounded-r-[4px] bg-ink px-2 py-0.5 text-[12px] font-bold text-on-ink tnum">{limitLabel}</span>
        </div>
        <ul className="absolute inset-x-0 top-0 flex items-end justify-between gap-1.5" style={{ height: H }}>
          {bars.map((b) => {
            const tone = b.value > limit ? 'bg-chart-over' : b.current ? 'bg-chart-up' : 'bg-chart-up/70'
            return (
              <li key={b.key} className="flex h-full flex-1 flex-col justify-end">
                <span className={cx('block w-full rounded-t-[6px] rounded-b-[2px]', b.value ? tone : 'h-1 bg-line')} style={b.value ? { height: Math.max(4, H - y(b.value)) } : undefined} />
              </li>
            )
          })}
        </ul>
        <ul aria-hidden className="absolute inset-x-0 bottom-0 flex justify-between gap-1.5">
          {bars.map((b) => <li key={b.key} className={cx('flex-1 text-center text-[11px] leading-4', b.current ? 'font-bold text-ink' : 'text-muted')}>{b.short}</li>)}
        </ul>
      </div>
    </figure>
  )
}
