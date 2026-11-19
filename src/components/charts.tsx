import { useId } from 'react'
import { cx } from '@/components/app-ui'
import { Badge, BadgeText } from '@/components/ui/badge'
import { Box } from '@/components/ui/box'
import { HStack } from '@/components/ui/hstack'
import { Text } from '@/components/ui/text'
import { VStack } from '@/components/ui/vstack'

// gluestack has no chart component; charts are SVG painted only with gluestack theme tokens (stroke-/fill- classes).

/** Daily line (e.g. balance over 30 days). Decorative shape; the summary lives in aria-label. */
export function LineChart({ values, label, className, endTag, wide }: { values: number[]; label: string; className?: string; endTag?: string; wide?: boolean; inverse?: boolean }) {
  const id = useId()
  const W = wide ? 560 : 320, H = 96, pad = 8
  if (values.length < 2) return null
  const min = Math.min(...values), max = Math.max(...values)
  const span = max - min || 1
  const pts = values.map((v, i) => [pad + (i * (W - pad * 2)) / (values.length - 1), pad + (1 - (v - min) / span) * (H - pad * 2)] as const)
  const d = pts.map(([x, y], i) => `${i ? 'L' : 'M'}${x.toFixed(1)},${y.toFixed(1)}`).join(' ')
  const [ex, ey] = pts[pts.length - 1]
  return (
    <Box className={cx('relative', className)}>
      <svg viewBox={`0 0 ${W} ${H}`} className="block h-auto w-full overflow-visible" role="img" aria-label={label}>
        <defs>
          <linearGradient id={id} x1="0" x2="0" y1="0" y2="1">
            <stop offset="0" className="[stop-color:rgb(var(--primary))]" stopOpacity={0.12} />
            <stop offset="1" className="[stop-color:rgb(var(--primary))]" stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d={`${d} L${ex},${H} L${pts[0][0]},${H} Z`} fill={`url(#${id})`} />
        <path d={d} className="fill-none stroke-primary" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
        <circle cx={ex} cy={ey} r="4" className="fill-background stroke-primary" strokeWidth="2" />
      </svg>
      {endTag ? (
        <Box aria-hidden className="absolute -translate-x-full -translate-y-[130%]" style={{ left: `${(ex / W) * 100}%`, top: `${(ey / H) * 100}%` }}>
          <Badge><BadgeText className="whitespace-nowrap">{endTag}</BadgeText></Badge>
        </Box>
      ) : null}
    </Box>
  )
}

export type RingTone = 'ok' | 'warn' | 'over'
const RING: Record<RingTone, string> = { ok: 'stroke-primary', warn: 'stroke-muted-foreground', over: 'stroke-destructive' }

/** Progress ring for a limit pool: used share drawn, tone by how close to the limit. */
export function Ring({ used, size = 96, tone, children }: { used: number; size?: number; tone: RingTone; children?: React.ReactNode }) {
  const r = 42, c = 2 * Math.PI * r
  // A sliver of use still reads as an arc, not a dot.
  const f = used > 0 ? Math.max(0.04, Math.min(1, used)) : 0
  return (
    <Box className="relative items-center justify-center" style={{ width: size, height: size }}>
      <svg viewBox="0 0 100 100" className="absolute inset-0" aria-hidden>
        <circle cx="50" cy="50" r={r} className="fill-none stroke-muted" strokeWidth="9" />
        <circle cx="50" cy="50" r={r} className={cx('fill-none', RING[tone])} strokeWidth="9" strokeLinecap="round" strokeDasharray={`${c * f} ${c}`} transform="rotate(-90 50 50)" />
      </svg>
      <Box className="relative">{children}</Box>
    </Box>
  )
}

export const ringTone = (share: number): RingTone => (share >= 0.95 ? 'over' : share >= 0.75 ? 'warn' : 'ok')

/** Monthly bars against a limit line. */
export function BarsWithLimit({ bars, limit, limitLabel, label }: { bars: { key: string; short: string; value: number; current?: boolean }[]; limit: number; limitLabel: string; label: string }) {
  const max = Math.max(limit * 1.15, ...bars.map((b) => b.value))
  const H = 120
  const y = (v: number) => H - (v / max) * H
  return (
    <VStack role="figure" aria-label={label}>
      <Box className="relative" style={{ height: H + 24 }}>
        <Box aria-hidden className="absolute inset-x-0 border-t-2 border-foreground" style={{ top: y(limit) }}>
          <Box className="absolute right-0 -translate-y-1/2"><Badge><BadgeText className="whitespace-nowrap">{limitLabel}</BadgeText></Badge></Box>
        </Box>
        <HStack className="absolute inset-x-0 top-0 items-end justify-between gap-2" style={{ height: H }}>
          {bars.map((b) => (
            <Box key={b.key} className="h-full flex-1 justify-end">
              <Box
                className={cx('w-full rounded-t-md', !b.value ? 'h-1 bg-muted' : b.value > limit ? 'bg-destructive' : b.current ? 'bg-primary' : 'bg-primary/60')}
                style={b.value ? { height: Math.max(4, H - y(b.value)) } : undefined}
              />
            </Box>
          ))}
        </HStack>
        <HStack aria-hidden className="absolute inset-x-0 bottom-0 justify-between gap-2">
          {bars.map((b) => <Text key={b.key} size="xs" className={cx('flex-1 text-center', b.current ? 'font-bold text-foreground' : 'text-muted-foreground')}>{b.short}</Text>)}
        </HStack>
      </Box>
    </VStack>
  )
}
