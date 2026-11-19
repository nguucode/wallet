import * as Dialog from '@radix-ui/react-dialog'
import { Check, ChevronLeft, ChevronRight, X } from 'lucide-react'
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
    <section className={cx('mt-section', className)} aria-label={title}>
      <div className="mb-header flex items-baseline justify-between gap-4">
        <h2 className="title-3">{title}</h2>
        {/* 44px hit area without moving the layout: vertical padding cancelled by a negative margin. */}
        <span className="text-[15px] font-semibold text-tint [&>a]:-my-3 [&>a]:inline-block [&>a]:py-3 [&>button]:-my-3 [&>button]:py-3 [&_a]:text-tint [&_a]:no-underline [&_a:hover]:underline [&_button]:text-tint [&_button:hover]:underline">{action}</span>
      </div>
      {children}
    </section>
  )
}

export function PageTitle({ children, description }: { children: ReactNode; description?: ReactNode }) {
  return (
    <div className="mb-group">
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

/** Web back link above a large title: tint chevron + label, one spec everywhere. */
export function WebBackLink({ to, onClick, children = 'Quay lại' }: { to?: string; onClick?: () => void; children?: ReactNode }) {
  const cls = 'mb-header -ml-2 inline-flex h-9 items-center gap-1 rounded-full pr-3 pl-1 text-[15px] text-tint no-underline transition-colors hover:bg-surface-2 active:bg-surface-2'
  const inner = <><ChevronLeft size={22} strokeWidth={2.25} aria-hidden />{children}</>
  return to ? <Link to={to} className={cls}>{inner}</Link> : <button type="button" onClick={onClick} className={cls}>{inner}</button>
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

/**
 * The one list row (DESIGN.md "List rows"). Full-bleed inside its card (the card clips the corners), padding by the
 * `inset` role, hover/press fill the whole row, and the separator starts where the text starts, as on iOS.
 * Put rows directly in a `card overflow-hidden` list (no divide-y, no padding on the list).
 */
export function Row({ left, title, subtitle, right, rightSub, chevron, selected, disabled, to, onClick, className, ...aria }: {
  left?: ReactNode; title: ReactNode; subtitle?: ReactNode; right?: ReactNode; rightSub?: ReactNode; chevron?: boolean
  /** Picker rows: the chosen one carries a tint checkmark (iOS), never a coloured fill or a text marker. */
  selected?: boolean
  /** Still focusable and announced (aria-disabled) so it can explain itself; no hover or press fill. */
  disabled?: boolean
  to?: string; onClick?: (e: React.MouseEvent) => void; className?: string; 'aria-label'?: string; 'aria-current'?: 'page' | undefined; 'aria-describedby'?: string
}) {
  const body = (
    <>
      {left ? <span className="flex shrink-0 items-center py-header">{left}</span> : null}
      <span className="row-sep flex min-h-[60px] min-w-0 flex-1 items-center gap-stack py-header pr-inset">
        <span className="min-w-0 flex-1">
          {/* The title is the identity of the row, so it wraps (two lines max) instead of truncating; the subtitle stays one line. */}
          <span className="line-clamp-2 block font-medium text-balance break-words">{title}</span>
          {subtitle ? <span className="block truncate text-[13px] leading-[18px] text-muted">{subtitle}</span> : null}
        </span>
        {right !== undefined ? (
          <span className="flex shrink-0 flex-col items-end gap-1 text-right">
            <span className="tnum font-semibold">{right}</span>
            {rightSub ? <span className="text-[13px] leading-[18px]">{rightSub}</span> : null}
          </span>
        ) : null}
        {chevron ? <ChevronRight size={20} strokeWidth={1.75} aria-hidden className="-mr-1 shrink-0 text-muted" /> : null}
        {selected !== undefined ? <Check size={20} strokeWidth={2.25} aria-hidden className={cx('shrink-0 text-tint', !selected && 'invisible')} /> : null}
      </span>
    </>
  )
  const cls = cx('row flex w-full items-stretch gap-stack pl-inset text-left text-ink', (to || onClick) && 'focus-visible:outline-offset-[-2px]', (to || onClick) && !disabled && 'transition-colors hover:bg-surface-2 active:bg-surface-2', disabled && 'cursor-not-allowed', className)
  if (to) return <Link to={to} onClick={onClick} className={cx(cls, 'no-underline')} {...aria}>{body}</Link>
  if (onClick) return <button type="button" onClick={onClick} aria-pressed={selected} aria-disabled={disabled || undefined} className={cls} {...aria}>{body}</button>
  return <div className={cls}>{body}</div>
}

/** One tile in a horizontal recipient rail (Home, Transfer): 72px item, 56px leading, short name + optional second line. */
export function RailTile({ to, onClick, label, leading, name, sub }: { to: string; onClick?: (e: React.MouseEvent) => void; label: string; leading: ReactNode; name: string; sub?: string }) {
  return (
    // Accessible name = the visible text first (WCAG 2.5.3), then the full identity for screen readers.
    <Link to={to} onClick={onClick} title={label} className="flex flex-col items-center gap-header rounded-xl py-1 text-center text-ink no-underline transition-colors hover:bg-surface-2 active:bg-surface-2">
      {leading}
      <span className="block w-full">
        <span className="block truncate text-[12px] leading-4 font-semibold">{name}</span>
        {sub ? <span className="block truncate text-[11px] leading-[14px] text-muted">{sub}</span> : null}
        <span className="sr-only">, {label}</span>
      </span>
    </Link>
  )
}

/** Loading placeholder with Row's geometry. */
export function RowSkeleton() {
  return (
    <div className="flex items-stretch gap-stack pl-inset" aria-hidden>
      <span className="flex items-center py-header"><Skeleton className="size-10 rounded-full" /></span>
      <span className="row-sep flex min-h-[60px] flex-1 items-center gap-stack py-header pr-inset">
        <span className="flex-1 space-y-header"><Skeleton className="h-4 w-2/5" /><Skeleton className="h-3 w-1/4" /></span>
        <Skeleton className="h-4 w-20" />
      </span>
    </div>
  )
}

export function Disc({ children, tone = 'neutral', size = 48 }: { children: ReactNode; tone?: 'neutral' | 'primary' | 'secondary' | 'success' | 'pending' | 'danger'; size?: number }) {
  const t = { neutral: 'bg-surface-2 text-tint', primary: 'bg-primary-soft text-primary-ink', secondary: 'bg-secondary-soft text-secondary-ink', success: 'bg-success-soft text-success', pending: 'bg-pending-soft text-pending', danger: 'bg-danger-soft text-danger' }[tone]
  return <span aria-hidden className={cx('inline-flex shrink-0 items-center justify-center rounded-full', t)} style={{ width: size, height: size }}>{children}</span>
}

export function Avatar({ name, size = 44, src }: { name: string; size?: number; src?: string }) {
  if (src) return <img src={src} alt="" width={size} height={size} className="shrink-0 rounded-full bg-surface-2 object-cover" style={{ width: size, height: size }} />
  const parts = name.trim().split(/\s+/)
  const initials = ((parts.length > 1 ? parts[parts.length - 2][0] : '') + parts[parts.length - 1][0]).toUpperCase()
  return <Disc size={size}><span className="text-[15px] font-semibold text-ink/80">{initials}</span></Disc>
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

export function Badge({ children, tone = 'neutral' }: { children: ReactNode; tone?: 'neutral' | 'primary' | 'secondary' | 'success' | 'pending' | 'danger' }) {
  const t = { neutral: 'bg-surface-2 text-ink', primary: 'bg-primary-soft text-primary-ink', secondary: 'bg-secondary-soft text-secondary-ink', success: 'bg-success-soft text-success', pending: 'bg-pending-soft text-pending', danger: 'bg-danger-soft text-danger' }[tone]
  return <span className={cx('inline-flex h-6 items-center rounded-full px-2.5 text-[13px] leading-4 font-semibold whitespace-nowrap', t)}>{children}</span>
}

export function Skeleton({ className }: { className?: string }) {
  return <span aria-hidden className={cx('block animate-pulse rounded-lg bg-surface-2', className)} />
}

export function EmptyState({ icon, title, body, action }: { icon: ReactNode; title: string; body?: ReactNode; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center px-inset py-12 text-center">
      <Disc>{icon}</Disc>
      <p className="mt-stack font-semibold">{title}</p>
      {body ? <p className="mt-1 max-w-[42ch] text-muted">{body}</p> : null}
      {action ? <div className="mt-group">{action}</div> : null}
    </div>
  )
}

export function Callout({ tone = 'neutral', title, children, action }: { tone?: 'neutral' | 'pending' | 'danger' | 'primary'; title: ReactNode; children?: ReactNode; action?: ReactNode }) {
  const t = { neutral: 'bg-surface', pending: 'bg-pending-soft', danger: 'bg-danger-soft', primary: 'bg-primary-soft' }[tone]
  return (
    <div role={tone === 'danger' ? 'alert' : 'status'} className={cx('rounded-[var(--radius-card)] p-inset', t)}>
      <p className="font-semibold">{title}</p>
      {children ? <div className="mt-1 text-[15px] leading-[20px]">{children}</div> : null}
      {action ? <div className="mt-stack">{action}</div> : null}
    </div>
  )
}

/* ── Form ─────────────────────────────────────────────────────────── */

export function Field({ label, hint, error, children, htmlFor }: { label: string; hint?: ReactNode; error?: ReactNode; children: ReactNode; htmlFor?: string }) {
  return (
    <div className="mb-group">
      <label htmlFor={htmlFor} className="mb-header block text-[13px] leading-[18px] font-medium">{label}</label>
      {children}
      {error ? <p role="alert" className="mt-header text-[13px] leading-[18px] text-danger">{error}</p> : hint ? <p className="mt-header text-[13px] leading-[18px] text-muted">{hint}</p> : null}
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
          className={cx('h-9 shrink-0 rounded-full px-4 text-[15px] font-semibold whitespace-nowrap transition-colors', o.value === value ? 'bg-primary text-white' : 'bg-surface text-ink hover:bg-surface-2')}
        >
          {o.label}
          {o.count !== undefined ? <span className={cx('ml-2 tnum', o.value === value ? 'text-white/80' : 'text-muted')}>{o.count}</span> : null}
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
            // Header stays put; only the body scrolls, so the scrollbar runs inside the body, clear of the rounded corners.
            'fixed z-50 flex flex-col overflow-hidden bg-surface shadow-[var(--shadow-float)] focus:outline-none',
            layout === 'app'
              ? 'inset-x-0 bottom-0 max-h-[92dvh] rounded-t-[34px] motion-safe:animate-[sheet-up_240ms_cubic-bezier(0.16,1,0.3,1)] motion-reduce:animate-[fade-in_150ms_ease-out]'
              : 'top-1/2 left-1/2 max-h-[88vh] w-[440px] -translate-x-1/2 -translate-y-1/2 rounded-[24px] animate-[fade-in_150ms_ease-out]',
          )}
        >
          {layout === 'app' ? <div aria-hidden className="mx-auto mt-header h-[5px] w-9 shrink-0 rounded-full bg-line" /> : null}
          <div className={cx('flex shrink-0 items-start justify-between gap-4 px-inset pb-stack', layout === 'app' ? 'pt-3' : 'pt-group')}>
            <div className="min-w-0">
              <Dialog.Title className="title-3">{title}</Dialog.Title>
              {description ? <Dialog.Description className="mt-1 text-muted">{description}</Dialog.Description> : null}
            </div>
            {/* The 30px circle sits inside a 44px target; pull it out so the circle's edge meets the same inset as the title. */}
            {dismissible ? (
              <Dialog.Close asChild>
                <CloseButton className="-mt-[10px] -mr-[7px]" />
              </Dialog.Close>
            ) : null}
          </div>
          <div className={cx('sheet-scroll min-h-0 overflow-y-auto overscroll-contain', layout === 'app' ? 'mr-1 px-inset pb-[max(20px,env(safe-area-inset-bottom))]' : 'mr-2 mb-stack px-inset pb-stack')}>
            {children}
          </div>
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
      <div className="mt-header flex flex-col gap-2">
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
    <div className={layout === 'web' ? 'mb-group' : 'mb-stack'}>
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
      {msg ? <span className="max-w-[440px] rounded-full bg-ink px-5 py-3 text-center text-[15px] font-semibold text-on-ink shadow-[var(--shadow-float)]">{msg}</span> : null}
    </div>
  )
  return { show: (m: string) => setMsg(m), node }
}
