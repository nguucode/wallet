import { Check, ChevronDown, Clock, X } from 'lucide-react'
import { useState, type ReactNode } from 'react'
import { bankById, useWorld } from '@/app/store'
import { BankMark, Badge, cx, Sheet } from '@/components/ui'
import type { FundingSource } from '@/mock/seed'
import { kindLabel, mask4, sortSources } from './logic'


export function SourceLine({ s, sub }: { s: FundingSource; sub?: ReactNode }) {
  const bank = bankById(s.bankId)
  return (
    <span className="flex min-w-0 flex-1 items-center gap-3">
      <BankMark short={bank.short} />
      <span className="min-w-0 flex-1 text-left">
        <span className="block font-medium">{bank.name}</span>
        <span className="block text-[13px] leading-[18px] text-muted">{kindLabel(s.kind)} <span className="tnum">{mask4(s.last4)}</span>{sub}</span>
      </span>
    </span>
  )
}

/** Bordered select-card; opens a sheet (dialog on web) with radio rows. */
export function SourcePicker({ label, value, onChange }: { label: string; value?: string; onChange: (id: string) => void }) {
  const w = useWorld()
  const [open, setOpen] = useState(false)
  const current = w.sources.find((s) => s.id === value) ?? w.sources[0]
  if (!current) return null
  return (
    <div className="mb-6">
      <p id="source-label" className="mb-1.5 text-[13px] font-medium">{label}</p>
      <button type="button" aria-describedby="source-label" onClick={() => setOpen(true)} className="flex min-h-[64px] w-full items-center gap-3 rounded-[16px] bg-surface-2 px-4 py-2 hover:bg-primary-soft">
        <span id="source-current" className="contents"><SourceLine s={current} /></span>
        <ChevronDown size={20} strokeWidth={1.75} aria-hidden className="text-muted" />
      </button>
      <Sheet open={open} onOpenChange={setOpen} title={label}>
        <div role="radiogroup" aria-label={label} className="flex flex-col gap-1">
          {sortSources(w.sources).map((s) => (
            <button
              key={s.id} type="button" role="radio" aria-checked={s.id === current.id}
              onClick={() => { onChange(s.id); setOpen(false) }}
              className={cx('flex min-h-[64px] items-center gap-3 rounded-[12px] px-3 py-2', s.id === current.id ? 'bg-primary-soft' : 'hover:bg-surface-2')}
            >
              <SourceLine s={s} sub={s.isDefault ? ' · Mặc định' : null} />
              {s.id === current.id ? <Check size={20} strokeWidth={2} aria-hidden className="text-tint" /> : null}
            </button>
          ))}
        </div>
      </Sheet>
    </div>
  )
}

export function DefaultBadge() {
  return <Badge>Mặc định</Badge>
}

/** Result composition (US-FND-007 pattern) with story-specific copy. Flows pass actions to FlowFrame's footer instead (pinned on app). */
export function ResultBlock({ tone, heading, amount, children, actions }: {
  tone: 'success' | 'pending' | 'failed'; heading: string; amount?: ReactNode; children?: ReactNode; actions?: ReactNode
}) {
  const Icon = tone === 'pending' ? Clock : tone === 'failed' ? X : Check
  const cls = tone === 'success' ? 'bg-success-soft text-success' : tone === 'pending' ? 'bg-pending-soft text-pending' : 'bg-danger-soft text-danger'
  return (
    <div className="flex flex-col items-center pt-6 text-center">
      <span aria-hidden className={cx('inline-flex size-16 items-center justify-center rounded-full animate-[fade-in_200ms_ease-out]', cls)}><Icon size={32} strokeWidth={2.25} /></span>
      <div role="status" aria-live="polite" className="w-full">
        <p className="mt-4 text-[18px] leading-[26px] font-bold">{heading}</p>
        {amount ? <p className="mt-2 break-words">{amount}</p> : null}
        {children ? <div className="mx-auto mt-3 flex max-w-[44ch] flex-col gap-1 text-muted">{children}</div> : null}
      </div>
      {actions ? <div className="mt-8 flex w-full flex-col gap-2">{actions}</div> : null}
    </div>
  )
}

export { useToast } from '@/components/ui'
