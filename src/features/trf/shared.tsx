import { Lock, ScanFace } from 'lucide-react'
import { toDataURL } from 'qrcode'
import { useEffect, useState, type ReactNode } from 'react'
import { useLayout } from '@/app/layout'
import { config } from '@/domain/config'
import { formatVnd } from '@/domain/money'
import { authFor, authLine } from '@/features/flow/FlowKit'
import { Avatar, Button, cx, PageTitle, Skeleton } from '@/components/ui'

/** In-shell page title: visible h1 on web; on app the shell header shows the title, so the h1 is for screen readers. */
export function PageHeading({ children }: { children: ReactNode }) {
  return useLayout() === 'web'
    ? <PageTitle>{children}</PageTitle>
    : <h1 tabIndex={-1} data-page-title className="sr-only">{children}</h1>
}

/** QR always black on white (DESIGN: scanner contrast), with loading and error states. */
export function QrImage({ payload, size, label }: { payload: string; size: number; label: string }) {
  const [state, setState] = useState<{ payload: string; url?: string; error?: boolean }>({ payload })
  const [retry, setRetry] = useState(0)
  useEffect(() => {
    let live = true
    toDataURL(payload, { margin: 2, width: size * 2, errorCorrectionLevel: 'M', color: { dark: '#000000', light: '#ffffff' } })
      .then((url) => live && setState({ payload, url }))
      .catch(() => live && setState({ payload, error: true }))
    return () => { live = false }
  }, [payload, size, retry])
  if (state.error && state.payload === payload)
    return (
      <div role="alert" className="flex flex-col items-center justify-center gap-3 rounded-[12px] border border-line bg-surface p-inset text-center" style={{ width: size, height: size }}>
        <p className="text-[15px]">Không tạo được mã. Thử lại.</p>
        <Button size="sm" variant="secondary" onClick={() => setRetry((r) => r + 1)}>Thử lại</Button>
      </div>
    )
  if (!state.url || state.payload !== payload)
    return <div aria-busy aria-label="Đang tạo mã" role="img" style={{ width: size, height: size }}><Skeleton className="size-full rounded-[12px]" /></div>
  return <img src={state.url} width={size} height={size} alt={label} className="rounded-[12px] bg-white" style={{ width: size, height: size }} />
}

export function MessageField({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <div className="mt-group">
      <div className="mb-header flex items-baseline justify-between">
        <label htmlFor="message" className="text-[13px] font-medium">Lời nhắn</label>
        <span className="text-[13px] text-muted tnum" aria-live="off">{value.length}/{config.messageMax}</span>
      </div>
      <textarea
        id="message" rows={2} maxLength={config.messageMax} value={value} placeholder={placeholder}
        onChange={(e) => onChange(e.target.value.slice(0, config.messageMax))}
        aria-describedby="message-count"
        className="w-full resize-none rounded-[12px] border border-line bg-surface px-4 py-3 text-[15px] leading-[22px] focus:outline-none focus-visible:outline-2 focus-visible:outline-tint"
      />
      <span id="message-count" className="sr-only">Tối đa {config.messageMax} ký tự</span>
    </div>
  )
}

/** Amount fixed by a QR: no caret, lock icon, the reason, and any check error. */
export function LockedAmount({ amount, note, error }: { amount: number; note: string; error?: ReactNode }) {
  return (
    <div>
      <p className="mb-header text-[13px] font-medium">Số tiền</p>
      <p className={cx('flex items-center gap-2 border-b-2 pb-2', error ? 'border-danger' : 'border-line')}>
        <span className="amount-display tnum">{formatVnd(amount)}</span>
        <Lock size={18} strokeWidth={1.75} aria-hidden className="text-muted" />
      </p>
      <p className="mt-header text-[13px] text-muted">{note}</p>
      {error ? <p role="alert" className="mt-1 text-[13px] leading-5 text-danger">{error}</p> : null}
    </div>
  )
}

/** Keeps the screen on while `on` (app layout only); silently ignored where unsupported. */
export function useWakeLock(on: boolean) {
  useEffect(() => {
    if (!on || !('wakeLock' in navigator)) return
    let lock: { release: () => Promise<void> } | undefined
    let live = true
    const get = () => (navigator as Navigator & { wakeLock: { request: (t: 'screen') => Promise<{ release: () => Promise<void> }> } }).wakeLock
      .request('screen').then((l) => { if (live) lock = l; else void l.release() }).catch(() => {})
    void get()
    const onVis = () => { if (document.visibilityState === 'visible') void get() }
    document.addEventListener('visibilitychange', onVis)
    return () => { live = false; document.removeEventListener('visibilitychange', onVis); void lock?.release().catch(() => {}) }
  }, [on])
}

export function RecipientChip({ name, sub, note, onChange }: { name: string; sub: ReactNode; note?: string; onChange?: () => void }) {
  return (
    <div className="mb-group flex items-center gap-3 card p-inset">
      <Avatar name={name} />
      <div className="min-w-0 flex-1">
        <p className="font-semibold break-words">{name}</p>
        <p className="text-[13px] text-muted">{sub}</p>
        {note ? <p className="text-[12px] text-muted">{note}</p> : null}
      </div>
      {onChange ? <Button variant="ghost" size="sm" onClick={onChange}>Đổi</Button> : null}
    </div>
  )
}

export function AuthNote({ type, amount }: { type: Parameters<typeof authLine>[0]; amount: number }) {
  const face = authFor(type, amount) === 'face_match'
  return (
    <p className="mt-stack flex items-start gap-2 rounded-[12px] bg-surface-2 px-4 py-3 text-[15px]">
      {face ? <ScanFace size={18} strokeWidth={1.75} aria-hidden className="mt-1 shrink-0" /> : <Lock size={18} strokeWidth={1.75} aria-hidden className="mt-1 shrink-0" />}
      {authLine(type, amount)}
    </p>
  )
}

