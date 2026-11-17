import { ArrowDownLeft, ArrowDownToLine, ArrowUpFromLine, Landmark, RotateCcw, Send, Store, Zap } from 'lucide-react'
import { useEffect, useState, type ReactNode } from 'react'
import type { TxType } from '@/domain/types'
import { useLayout } from '@/app/layout'
import { cx, Disc } from '@/components/ui'

const ICON: Record<TxType, typeof Send> = {
  topup: ArrowDownToLine, withdraw: ArrowUpFromLine, p2p_out: Send, p2p_in: ArrowDownLeft,
  bank_transfer: Landmark, qr_merchant: Store, bill: Zap, refund: RotateCcw,
}

export function TxIcon({ type, size = 40 }: { type: TxType; size?: number }) {
  const Icon = ICON[type]
  return <Disc size={size}><Icon size={size >= 48 ? 22 : 18} strokeWidth={1.75} /></Disc>
}

/** Page h1: visible on web; on app the shell header already shows the title, so the h1 is for focus and screen readers. */
export function ScreenTitle({ children, description }: { children: ReactNode; description?: ReactNode }) {
  const layout = useLayout()
  return (
    <div className={layout === 'web' ? 'mb-6' : 'mb-2'}>
      <h1 tabIndex={-1} data-page-title className={cx('text-[24px] leading-[32px] font-bold outline-none', layout === 'app' && 'sr-only')}>{children}</h1>
      {description ? <p className="mt-1 text-muted">{description}</p> : null}
    </div>
  )
}

/** Small floating status message (polite live region). shortcut: one toast at a time, feature-local; move to ui.tsx if a shared toast lands. */
export function useToast() {
  const [msg, setMsg] = useState<string | null>(null)
  useEffect(() => {
    if (!msg) return
    const t = setTimeout(() => setMsg(null), 3000)
    return () => clearTimeout(t)
  }, [msg])
  const node = (
    <div role="status" aria-live="polite" className="pointer-events-none fixed inset-x-0 bottom-24 z-50 flex justify-center px-4 print:hidden">
      {msg ? <span className="rounded-full bg-ink px-5 py-3 text-[14px] font-semibold text-white shadow-[var(--shadow-float)]">{msg}</span> : null}
    </div>
  )
  return { show: setMsg, node }
}
