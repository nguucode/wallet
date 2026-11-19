import * as Dialog from '@radix-ui/react-dialog'
import { ChevronLeft, X } from 'lucide-react'
import { forwardRef, useEffect, useState, type ButtonHTMLAttributes, type InputHTMLAttributes, type ReactNode } from 'react'
import { Link } from 'react-router'
import { useLayout } from '@/app/layout'
import { formatVnd } from '@/domain/money'
import type { TxStatus } from '@/domain/types'

export const cx = (...c: (string | false | null | undefined)[]) => c.filter(Boolean).join(' ')

/* ── Buttons ──────────────────────────────────────────────────────── */

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'ink'
const VARIANT: Record<Variant, string> = {
  primary: 'bg-primary text-white hover:bg-primary-hover disabled:bg-surface-2 disabled:text-muted',
  ink: 'bg-ink text-on-ink hover:bg-ink/85 disabled:bg-surface-2 disabled:text-muted',
  secondary: 'bg-surface-2 text-tint hover:bg-primary-soft disabled:text-muted',
  ghost: 'text-tint hover:bg-surface-2 disabled:text-muted',
  danger: 'bg-danger-soft text-danger hover:bg-danger-soft-hover',
}
export const Button = forwardRef<HTMLButtonElement, ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant; size?: 'md' | 'sm'; block?: boolean; loading?: boolean }>(
  function Button({ variant = 'primary', size = 'md', block, loading, className, children, disabled, ...rest }, ref) {
    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        aria-busy={loading || undefined}
        className={cx(
          'inline-flex shrink-0 items-center justify-center gap-2 rounded-full font-semibold whitespace-nowrap transition-colors duration-150 select-none active:opacity-70',
          size === 'md' ? 'h-[50px] px-6 text-[17px] lg:h-11 lg:text-[15px]' : 'h-8 px-3.5 text-[15px] lg:text-[13px]',
          block && 'w-full',
          VARIANT[variant],
          className,
        )}
        {...rest}
      >
        {loading ? <span className="size-4 animate-spin rounded-full border-2 border-current border-r-transparent" aria-hidden /> : null}
        {children}
      </button>
    )
  },
)

export function ButtonLink({ to, variant = 'primary', size = 'md', block, className, children }: { to: string; variant?: Variant; size?: 'md' | 'sm'; block?: boolean; className?: string; children: ReactNode }) {
  return (
    <Link to={to} className={cx('inline-flex shrink-0 items-center justify-center gap-2 rounded-full font-semibold whitespace-nowrap no-underline transition-colors duration-150', size === 'md' ? 'h-[50px] px-6 text-[17px] lg:h-11 lg:text-[15px]' : 'h-8 px-3.5 text-[15px] lg:text-[13px]', block && 'w-full', VARIANT[variant], className)}>
      {children}
    </Link>
  )
}

export function IconButton({ label, children, className, ...rest }: ButtonHTMLAttributes<HTMLButtonElement> & { label: string }) {
  return (
    <button aria-label={label} title={label} className={cx('inline-flex size-11 items-center justify-center rounded-full text-ink hover:bg-surface-2', className)} {...rest}>
      {children}
    </button>
  )
}

/* ── Layout pieces ────────────────────────────────────────────────── */

export function Card({ className, children, as: As = 'div' }: { className?: string; children: ReactNode; as?: 'div' | 'section' | 'article' }) {
  return <As className={cx('card', className)}>{children}</As>
}

export function Section({ title, action, children, className }: { title: string; action?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <section className={cx('mt-8 lg:mt-10', className)} aria-label={title}>
      <div className="mb-2 flex items-baseline justify-between gap-4 px-1">
        <h2 className="title-3">{title}</h2>
        <span className="text-[15px] text-tint [&_a]:text-tint [&_a]:no-underline [&_a:hover]:underline [&_button]:text-tint">{action}</span>
      </div>
      {children}
    </section>
  )
}

export function PageTitle({ children, description }: { children: ReactNode; description?: ReactNode }) {
  return (
    <div className="mb-6">
      <h1 tabIndex={-1} data-page-title className="large-title outline-none">{children}</h1>
      {description ? <p className="mt-1 text-muted">{description}</p> : null}
    </div>
  )
}

/** True once the page has scrolled under the nav bar (bar material + inline title appear). */
export function useScrolled(px = 8) {
  const [on, setOn] = useState(false)
  useEffect(() => {
    const f = () => setOn(window.scrollY > px)
    f()
    window.addEventListener('scroll', f, { passive: true })
    return () => window.removeEventListener('scroll', f)
  }, [px])
  return on
}

/** iOS navigation bar: transparent at rest, bar material once content scrolls under it. Title node is the caller's (h1 or p). */
export function NavBar({ title, titleVisible = true, left, right, className }: { title: ReactNode; titleVisible?: boolean; left?: ReactNode; right?: ReactNode; className?: string }) {
  const scrolled = useScrolled()
  return (
    <header className={cx('sticky top-0 z-30 grid min-h-[52px] grid-cols-[minmax(88px,1fr)_auto_minmax(88px,1fr)] items-center px-1 pt-[env(safe-area-inset-top)] transition-[background-color,box-shadow] duration-200', scrolled && 'bar', className)}>
      <div className="flex items-center">{left}</div>
      <div className={cx('max-w-[60vw] truncate text-center text-[17px] font-semibold transition-opacity duration-200', titleVisible || scrolled ? 'opacity-100' : 'opacity-0')}>{title}</div>
      <div className="flex items-center justify-end">{right}</div>
    </header>
  )
}

/** Back: tint chevron, 44pt target. */
export function BackButton({ onClick, label = 'Quay lại' }: { onClick: () => void; label?: string }) {
  return <IconButton label={label} className="text-tint hover:bg-surface-2" onClick={onClick}><ChevronLeft size={28} strokeWidth={2.25} /></IconButton>
}

/** Close: small grey circle with an xmark inside a 44pt target, as on iOS sheets and modal flows. */
export const CloseButton = forwardRef<HTMLButtonElement, ButtonHTMLAttributes<HTMLButtonElement> & { label?: string }>(function CloseButton({ label = 'Đóng', className, ...rest }, ref) {
  return (
    <button ref={ref} type="button" aria-label={label} title={label} className={cx('group inline-flex size-11 items-center justify-center rounded-full', className)} {...rest}>
      <span className="inline-flex size-[30px] items-center justify-center rounded-full bg-surface-2 text-muted group-hover:text-ink"><X size={16} strokeWidth={2.75} aria-hidden /></span>
    </button>
  )
})

export function Row({ left, title, subtitle, right, rightSub, to, onClick, className }: {
  left?: ReactNode; title: ReactNode; subtitle?: ReactNode; right?: ReactNode; rightSub?: ReactNode; to?: string; onClick?: () => void; className?: string
}) {
  const body = (
    <>
      {left}
      <span className="min-w-0 flex-1">
        <span className="block truncate font-medium">{title}</span>
        {subtitle ? <span className="block truncate text-[13px] leading-[18px] text-muted">{subtitle}</span> : null}
      </span>
      {right !== undefined ? (
        <span className="shrink-0 text-right">
          <span className="block tnum font-semibold">{right}</span>
          {rightSub ? <span className="block text-[13px] leading-[18px]">{rightSub}</span> : null}
        </span>
      ) : null}
    </>
  )
  const cls = cx('flex min-h-[64px] w-full items-center gap-3 py-2 text-left', (to || onClick) && 'rounded-xl hover:bg-surface-2 active:bg-surface-2 -mx-2 px-2 w-[calc(100%+16px)]', className)
  if (to) return <Link to={to} className={cx(cls, 'no-underline text-ink')}>{body}</Link>
  if (onClick) return <button type="button" onClick={onClick} className={cls}>{body}</button>
  return <div className={cls}>{body}</div>
}

export function Disc({ children, tone = 'neutral', size = 48 }: { children: ReactNode; tone?: 'neutral' | 'primary' | 'success' | 'pending' | 'danger'; size?: number }) {
  const t = { neutral: 'bg-surface-2 text-tint', primary: 'bg-primary-soft text-primary-ink', success: 'bg-success-soft text-success', pending: 'bg-pending-soft text-pending', danger: 'bg-danger-soft text-danger' }[tone]
  return <span aria-hidden className={cx('inline-flex shrink-0 items-center justify-center rounded-full', t)} style={{ width: size, height: size }}>{children}</span>
}

export function Avatar({ name, size = 44 }: { name: string; size?: number }) {
  const parts = name.trim().split(/\s+/)
  const initials = ((parts.length > 1 ? parts[parts.length - 2][0] : '') + parts[parts.length - 1][0]).toUpperCase()
  return <Disc size={size}><span className="text-[14px] font-semibold text-ink/80">{initials}</span></Disc>
}

/** Neutral bank monogram: real bank names as text, never logos (mock-data.md). */
export function BankMark({ short, size = 44 }: { short: string; size?: number }) {
  return <span aria-hidden className="inline-flex shrink-0 items-center justify-center rounded-full bg-surface-2 text-[11px] font-bold tracking-tight text-ink/80" style={{ width: size, height: size }}>{short}</span>
}

/* ── Status & money ───────────────────────────────────────────────── */

export const STATUS_LABEL: Record<TxStatus, string> = { pending: 'Đang xử lý', success: 'Thành công', failed: 'Không thành công', refunded: 'Đã hoàn tiền' }
export function StatusPill({ status, className }: { status: TxStatus; className?: string }) {
  const tone = { pending: 'bg-pending-soft text-pending', success: 'bg-success-soft text-success', failed: 'bg-danger-soft text-danger', refunded: 'bg-surface-2 text-ink' }[status]
  return <span className={cx('inline-flex h-6 items-center rounded-full px-2.5 text-[13px] leading-4 font-semibold whitespace-nowrap', tone, className)}>{STATUS_LABEL[status]}</span>
}

export function Money({ amount, sign, hidden, className, tone }: { amount: number; sign?: 'in' | 'out'; hidden?: boolean; className?: string; tone?: boolean }) {
  if (hidden) return <span className={cx('tnum', className)} role="img" aria-label="Số dư đang ẩn">••••••<Dong /></span>
  const text = formatVnd(amount, { sign })
  return <span className={cx('tnum whitespace-nowrap', tone && sign === 'in' && 'text-success', className)}>{text.replace(' ₫', '')}<Dong /></span>
}

/** ₫ set small and raised beside the numerals (DESIGN.md signature); screen readers hear "đồng". */
export function Dong() {
  return <span className="ml-[0.12em] align-[0.42em] text-[0.55em] font-semibold"><span aria-hidden>₫</span><span className="sr-only"> đồng</span></span>
}

export function Badge({ children, tone = 'neutral' }: { children: ReactNode; tone?: 'neutral' | 'primary' | 'success' | 'pending' | 'danger' }) {
  const t = { neutral: 'bg-surface-2 text-ink', primary: 'bg-primary-soft text-primary-ink', success: 'bg-success-soft text-success', pending: 'bg-pending-soft text-pending', danger: 'bg-danger-soft text-danger' }[tone]
  return <span className={cx('inline-flex h-6 items-center rounded-full px-2.5 text-[13px] leading-4 font-semibold whitespace-nowrap', t)}>{children}</span>
}

export function Skeleton({ className }: { className?: string }) {
  return <span aria-hidden className={cx('block animate-pulse rounded-lg bg-surface-2', className)} />
}

export function EmptyState({ icon, title, body, action }: { icon: ReactNode; title: string; body?: ReactNode; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center px-6 py-12 text-center">
      <Disc>{icon}</Disc>
      <p className="mt-4 font-semibold">{title}</p>
      {body ? <p className="mt-1 max-w-[42ch] text-muted">{body}</p> : null}
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  )
}

export function Callout({ tone = 'neutral', title, children, action }: { tone?: 'neutral' | 'pending' | 'danger' | 'primary'; title: ReactNode; children?: ReactNode; action?: ReactNode }) {
  const t = { neutral: 'bg-surface', pending: 'bg-pending-soft', danger: 'bg-danger-soft', primary: 'bg-primary-soft' }[tone]
  return (
    <div role={tone === 'danger' ? 'alert' : 'status'} className={cx('rounded-[var(--radius-card)] p-5', t)}>
      <p className="font-semibold">{title}</p>
      {children ? <div className="mt-1 text-[14px] leading-[20px]">{children}</div> : null}
      {action ? <div className="mt-3">{action}</div> : null}
    </div>
  )
}

/* ── Form ─────────────────────────────────────────────────────────── */

export function Field({ label, hint, error, children, htmlFor }: { label: string; hint?: ReactNode; error?: ReactNode; children: ReactNode; htmlFor?: string }) {
  return (
    <div className="mb-5">
      <label htmlFor={htmlFor} className="mb-1.5 block text-[13px] leading-[18px] font-medium">{label}</label>
      {children}
      {error ? <p role="alert" className="mt-1.5 text-[13px] leading-[18px] text-danger">{error}</p> : hint ? <p className="mt-1.5 text-[13px] leading-[18px] text-muted">{hint}</p> : null}
    </div>
  )
}

export const TextInput = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement> & { invalid?: boolean }>(function TextInput({ invalid, className, ...rest }, ref) {
  return (
    <input
      ref={ref}
      aria-invalid={invalid || undefined}
      className={cx('h-12 w-full rounded-[var(--radius-input)] border bg-surface-2 px-4 text-[17px] placeholder:text-muted focus:outline-none focus-visible:outline-2 focus-visible:outline-tint lg:h-11 lg:text-[15px]', invalid ? 'border-danger' : 'border-transparent', className)}
      {...rest}
    />
  )
})

export function Segmented<T extends string>({ value, options, onChange, label }: { value: T; options: { value: T; label: string; count?: number }[]; onChange: (v: T) => void; label: string }) {
  return (
    <div role="tablist" aria-label={label} className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1 [scrollbar-width:none] [mask-image:linear-gradient(to_right,black_calc(100%-28px),transparent)]">
      {options.map((o) => (
        <button
          key={o.value}
          role="tab"
          aria-selected={o.value === value}
          onClick={() => onChange(o.value)}
          className={cx('h-9 shrink-0 rounded-full px-4 text-[14px] font-semibold whitespace-nowrap transition-colors', o.value === value ? 'bg-primary text-white' : 'bg-surface text-ink hover:bg-surface-2')}
        >
          {o.label}
          {o.count !== undefined ? <span className={cx('ml-1.5 tnum', o.value === value ? 'text-white/80' : 'text-muted')}>{o.count}</span> : null}
        </button>
      ))}
    </div>
  )
}

/* ── Overlays ─────────────────────────────────────────────────────── */

/** Bottom sheet on the app layout, centred dialog on web. */
export function Sheet({ open, onOpenChange, title, description, children, dismissible = true }: {
  open: boolean; onOpenChange: (o: boolean) => void; title: string; description?: ReactNode; children: ReactNode; dismissible?: boolean
}) {
  const layout = useLayout()
  return (
    <Dialog.Root open={open} onOpenChange={(o) => (dismissible || o) && onOpenChange(o)}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/40 animate-[fade-in_150ms_ease-out]" />
        <Dialog.Content
          onPointerDownOutside={(e) => !dismissible && e.preventDefault()}
          onEscapeKeyDown={(e) => !dismissible && e.preventDefault()}
          {...(description ? {} : { 'aria-describedby': undefined })}
          className={cx(
            'fixed z-50 bg-surface shadow-[var(--shadow-float)] focus:outline-none',
            layout === 'app'
              ? 'inset-x-0 bottom-0 max-h-[92dvh] overflow-y-auto rounded-t-[34px] px-5 pt-2 pb-[max(20px,env(safe-area-inset-bottom))] animate-[sheet-up_240ms_cubic-bezier(0.16,1,0.3,1)]'
              : 'top-1/2 left-1/2 max-h-[88vh] w-[440px] -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-[24px] p-6 animate-[fade-in_150ms_ease-out]',
          )}
        >
          {layout === 'app' ? <div aria-hidden className="mx-auto mb-3 h-[5px] w-9 rounded-full bg-line" /> : null}
          <div className="mb-4 flex items-start justify-between gap-4">
            <div>
              <Dialog.Title className="title-3">{title}</Dialog.Title>
              {description ? <Dialog.Description className="mt-1 text-muted">{description}</Dialog.Description> : null}
            </div>
            {dismissible ? (
              <Dialog.Close asChild>
                <CloseButton className="-mt-2 -mr-2" />
              </Dialog.Close>
            ) : null}
          </div>
          {children}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}

export function Confirm({ open, onOpenChange, title, body, confirmLabel, cancelLabel = 'Hủy', onConfirm, danger }: {
  open: boolean; onOpenChange: (o: boolean) => void; title: string; body?: ReactNode; confirmLabel: string; cancelLabel?: string; onConfirm: () => void; danger?: boolean
}) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange} title={title} description={body}>
      <div className="mt-2 flex flex-col gap-2">
        <Button variant={danger ? 'ink' : 'primary'} block onClick={() => { onConfirm(); onOpenChange(false) }}>{confirmLabel}</Button>
        <Button variant="secondary" block onClick={() => onOpenChange(false)}>{cancelLabel}</Button>
      </div>
    </Sheet>
  )
}

/** Page h1: visible on web; on app the shell header already shows the title, so the h1 is sr-only but still takes route focus. */
export function ScreenTitle({ children, description }: { children: ReactNode; description?: ReactNode }) {
  const layout = useLayout()
  return (
    <div className={layout === 'web' ? 'mb-6' : 'mb-2'}>
      <h1 tabIndex={-1} data-page-title className={cx('large-title outline-none', layout === 'app' && 'sr-only')}>{children}</h1>
      {description ? <p className="mt-1 text-muted">{description}</p> : null}
    </div>
  )
}

/** One transient confirmation at a time, in a polite live region. */
export function useToast(ms = 3000) {
  const [msg, setMsg] = useState<string | null>(null)
  useEffect(() => {
    if (!msg) return
    const t = setTimeout(() => setMsg(null), ms)
    return () => clearTimeout(t)
  }, [msg, ms])
  const node = (
    <div role="status" aria-live="polite" className="pointer-events-none fixed inset-x-0 bottom-24 z-50 flex justify-center px-4 lg:bottom-8 print:hidden">
      {msg ? <span className="max-w-[440px] rounded-full bg-ink px-5 py-3 text-center text-[14px] font-semibold text-on-ink shadow-[var(--shadow-float)]">{msg}</span> : null}
    </div>
  )
  return { show: (m: string) => setMsg(m), node }
}
