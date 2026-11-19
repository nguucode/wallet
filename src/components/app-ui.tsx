/**
 * Wallet's shared UI, composed only from gluestack-ui components (src/components/ui/*) with the default gluestack theme
 * tokens (primary, secondary, muted, card, border, destructive, foreground, muted-foreground). No custom CSS, no custom tokens.
 * The exported API is the one the screens already use; everything inside is gluestack.
 */
import { Check, ChevronLeft, ChevronRight, X } from 'lucide-react'
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { useNavigate } from 'react-router'
import { useLayout } from '@/app/layout'
import { formatVnd } from '@/domain/money'
import type { TxStatus } from '@/domain/types'
import { Actionsheet, ActionsheetBackdrop, ActionsheetContent, ActionsheetDragIndicator, ActionsheetDragIndicatorWrapper } from '@/components/ui/actionsheet'
import { Avatar as GAvatar, AvatarFallbackText, AvatarImage } from '@/components/ui/avatar'
import { Badge as GBadge, BadgeText } from '@/components/ui/badge'
import { Box } from '@/components/ui/box'
import { Button as GButton, ButtonSpinner, ButtonText } from '@/components/ui/button'
import { Card as GCard } from '@/components/ui/card'
import { FormControl, FormControlError, FormControlErrorText, FormControlHelper, FormControlHelperText, FormControlLabel, FormControlLabelText } from '@/components/ui/form-control'
import { Heading } from '@/components/ui/heading'
import { HStack } from '@/components/ui/hstack'
import { Icon } from '@/components/ui/icon'
import { Input, InputField } from '@/components/ui/input'
import { Link, LinkText } from '@/components/ui/link'
import { Modal, ModalBackdrop, ModalBody, ModalContent, ModalHeader } from '@/components/ui/modal'
import { Pressable } from '@/components/ui/pressable'
import { Skeleton as GSkeleton } from '@/components/ui/skeleton'
import { Text } from '@/components/ui/text'
import { Toast, ToastTitle, useToast as useGToast } from '@/components/ui/toast'
import { VStack } from '@/components/ui/vstack'

export const cx = (...c: (string | false | null | undefined)[]) => c.filter(Boolean).join(' ')

type Press = (e?: any) => void // eslint-disable-line @typescript-eslint/no-explicit-any

/** Client-side navigation for a gluestack Pressable/Link rendered as <a href> (react-native-web): plain clicks route, modified clicks open natively. */
export function useLinkPress(to?: string, onClick?: Press) {
  const nav = useNavigate()
  return (e?: any) => { // eslint-disable-line @typescript-eslint/no-explicit-any
    const ev = e?.nativeEvent ?? e
    if (ev?.metaKey || ev?.ctrlKey || ev?.shiftKey) return
    onClick?.(e)
    if (!to || e?.defaultPrevented) return
    e?.preventDefault?.()
    nav(to)
  }
}

/* ── Buttons ──────────────────────────────────────────────────────── */

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'ink' | 'outline'
const VARIANT = { primary: 'default', ink: 'default', secondary: 'secondary', ghost: 'ghost', danger: 'destructive', outline: 'outline' } as const

type ButtonProps = {
  variant?: Variant; size?: 'md' | 'sm'; block?: boolean; loading?: boolean; disabled?: boolean
  onClick?: Press; className?: string; children?: ReactNode; to?: string
  'aria-label'?: string; 'aria-describedby'?: string; 'aria-expanded'?: boolean; 'aria-pressed'?: boolean; id?: string; title?: string; type?: 'button' | 'submit'
}

/** gluestack Button. String children become ButtonText; other nodes (icons) sit beside it. */
export function Button({ variant = 'primary', size = 'md', block, loading, disabled, onClick, className, children, to, type: _type, ...rest }: ButtonProps) {
  const press = useLinkPress(to, onClick)
  const parts = Array.isArray(children) ? children : [children]
  return (
    <GButton
      variant={VARIANT[variant]}
      size={size === 'sm' ? 'sm' : 'lg'}
      isDisabled={disabled || loading}
      onPress={press}
      {...(to ? { href: to, role: 'link' } : {})}
      aria-busy={loading || undefined}
      className={cx(block && 'w-full', className)}
      {...rest}
    >
      {loading ? <ButtonSpinner /> : null}
      {parts.map((c, i) => (typeof c === 'string' || typeof c === 'number' ? <ButtonText key={i}>{c}</ButtonText> : c))}
    </GButton>
  )
}

export function ButtonLink(props: Omit<ButtonProps, 'onClick'> & { to: string }) {
  return <Button {...props} />
}

export function IconButton({ label, children, onClick, className, ...rest }: { label: string; children: ReactNode; onClick?: Press; className?: string; 'aria-expanded'?: boolean; disabled?: boolean }) {
  return (
    <GButton variant="ghost" size="icon" aria-label={label} onPress={onClick} isDisabled={rest.disabled} className={cx('rounded-full', className)} {...rest}>
      {children}
    </GButton>
  )
}

/** Icon from lucide rendered through gluestack Icon. */
export function Ico({ as, size = 'md', className }: { as: React.ElementType; size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'; className?: string }) {
  return <Icon as={as} size={size} className={className} aria-hidden />
}

/* ── Layout pieces ────────────────────────────────────────────────── */

/**
 * Flat surface (sếp 2026-11-19): inside the web content panel (672px) nothing is a card; the panel is the only frame.
 * WebShell provides it; sheets and modals render outside the panel and the app layout keeps its cards.
 */
export const FlatContext = createContext(false)
export const useFlat = () => useContext(FlatContext)
// Appended last so tailwind-merge (gluestack's tva) drops the card's frame and side padding but keeps vertical rhythm.
const FLAT_CARD = 'rounded-none border-0 bg-transparent px-0 shadow-none'

export function Card({ className, children, role, ...aria }: { className?: string; children: ReactNode; as?: 'div' | 'section' | 'article'; role?: string; 'aria-label'?: string }) {
  const flat = useFlat()
  return <GCard role={role} {...aria} className={cx('gap-0', className, flat && FLAT_CARD)}>{children}</GCard>
}

export function Section({ title, action, children, className }: { title: string; action?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <VStack className={cx('mt-8 gap-3', className)} aria-label={title} role="region">
      <HStack className="items-baseline justify-between gap-4">
        <Heading as="h2" size="lg">{title}</Heading>
        {action}
      </HStack>
      {children}
    </VStack>
  )
}

export function PageTitle({ children, description }: { children: ReactNode; description?: ReactNode }) {
  return (
    <VStack className="mb-6 gap-1">
      <Heading size="3xl" tabIndex={-1} data-page-title className="outline-none">{children}</Heading>
      {description ? <Text className="text-muted-foreground">{description}</Text> : null}
    </VStack>
  )
}

/** True once the page has scrolled under the nav bar. */
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

/** App navigation bar: three slots, title centred; a bottom border once content scrolls under it. */
export function NavBar({ title, titleVisible = true, left, right, className }: { title: ReactNode; titleVisible?: boolean; left?: ReactNode; right?: ReactNode; className?: string }) {
  const scrolled = useScrolled()
  return (
    <HStack className={cx('sticky top-0 z-30 min-h-14 items-center bg-backdrop-app px-1', scrolled && 'border-b border-border', className)} role="banner">
      <HStack className="min-w-[88px] flex-1 items-center">{left}</HStack>
      <Text bold isTruncated className={cx('max-w-[60vw] text-center', titleVisible || scrolled ? 'opacity-100' : 'opacity-0')}>{title}</Text>
      <HStack className="min-w-[88px] flex-1 items-center justify-end">{right}</HStack>
    </HStack>
  )
}

/** Web back link above a large title. */
export function WebBackLink({ to, onClick, children = 'Quay lại' }: { to?: string; onClick?: () => void; children?: ReactNode }) {
  return (
    <Box className="mb-2 -ml-3 self-start">
      <Button variant="ghost" size="sm" to={to} onClick={onClick}><Ico as={ChevronLeft} size="sm" />{children}</Button>
    </Box>
  )
}

export function BackButton({ onClick, label = 'Quay lại' }: { onClick: () => void; label?: string }) {
  return <IconButton label={label} onClick={onClick}><Ico as={ChevronLeft} size="lg" /></IconButton>
}

export function CloseButton({ label = 'Đóng', className, onClick }: { label?: string; className?: string; onClick?: Press }) {
  return <IconButton label={label} className={className} onClick={onClick}><Ico as={X} /></IconButton>
}

/**
 * The one list row: leading, title + subtitle, trailing value, chevron or check. Rows have no separator of their own;
 * the list puts them in `<VStack className="divide-y divide-border">` inside a Card.
 */
export function Row({ left, title, subtitle, right, rightSub, chevron, selected, disabled, to, onClick, className, ...aria }: {
  left?: ReactNode; title: ReactNode; subtitle?: ReactNode; right?: ReactNode; rightSub?: ReactNode; chevron?: boolean
  selected?: boolean; disabled?: boolean
  to?: string; onClick?: Press; className?: string; 'aria-label'?: string; 'aria-current'?: 'page' | undefined; 'aria-describedby'?: string
}) {
  const press = useLinkPress(to, disabled ? undefined : onClick)
  const flat = useFlat()
  const body = (
    <HStack className={cx('min-h-[60px] w-full items-center gap-3 py-2', flat ? 'px-0' : 'px-4')}>
      {left ? <Box className="shrink-0">{left}</Box> : null}
      <VStack className="min-w-0 flex-1">
        <Text className="line-clamp-2 font-medium">{title}</Text>
        {subtitle ? <Text size="sm" isTruncated className="text-muted-foreground">{subtitle}</Text> : null}
      </VStack>
      {right !== undefined ? (
        <VStack className="shrink-0 items-end gap-1">
          <Text className="font-semibold tabular-nums">{right}</Text>
          {rightSub ? <Text size="sm">{rightSub}</Text> : null}
        </VStack>
      ) : null}
      {chevron ? <Ico as={ChevronRight} className="shrink-0 text-muted-foreground" /> : null}
      {selected !== undefined ? <Ico as={Check} className={cx('shrink-0 text-primary', !selected && 'invisible')} /> : null}
    </HStack>
  )
  if (!to && !onClick) return <Box className={className}>{body}</Box>
  return (
    <Pressable
      onPress={press}
      {...(to ? { href: to, role: 'link' } : { role: 'button', 'aria-pressed': selected })}
      aria-disabled={disabled || undefined}
      // Flat: text meets the content edge; the hover fill reaches 8px past it with rounded ends.
      className={cx('w-full data-[hover=true]:bg-accent data-[active=true]:bg-accent', flat && '-mx-2 w-[calc(100%+16px)] rounded-md px-2', disabled && 'opacity-40', className)}
      {...aria}
    >
      {body}
    </Pressable>
  )
}

/** One tile in a horizontal recipient rail: leading disc, short name, optional second line. */
export function RailTile({ to, onClick, label, leading, name, sub }: { to: string; onClick?: Press; label: string; leading: ReactNode; name: string; sub?: string }) {
  const press = useLinkPress(to, onClick)
  return (
    <Pressable onPress={press} href={to} role="link" aria-label={`${name}${sub ? ` ${sub}` : ''}, ${label}`} className="items-center rounded-lg data-[hover=true]:opacity-80 data-[active=true]:opacity-60">
      <VStack className="items-center gap-2">
        {leading}
        <VStack className="w-full items-center">
          <Text size="xs" bold isTruncated className="w-full text-center">{name}</Text>
          {sub ? <Text size="xs" isTruncated className="w-full text-center text-muted-foreground">{sub}</Text> : null}
        </VStack>
      </VStack>
    </Pressable>
  )
}

export function RowSkeleton() {
  const flat = useFlat()
  return (
    <HStack className={cx('min-h-[60px] items-center gap-3 py-2', flat ? 'px-0' : 'px-4')} aria-hidden>
      <GSkeleton variant="circular" className="h-10 w-10" />
      <VStack className="flex-1 gap-2"><GSkeleton className="h-4 w-2/5" /><GSkeleton className="h-3 w-1/4" /></VStack>
      <GSkeleton className="h-4 w-20" />
    </HStack>
  )
}

/** Round icon holder: gluestack Avatar with an icon inside. Tone maps to default theme tokens only. */
export function Disc({ children, tone = 'neutral', size = 48 }: { children: ReactNode; tone?: 'neutral' | 'primary' | 'secondary' | 'success' | 'pending' | 'danger'; size?: number }) {
  const t = tone === 'primary' ? 'bg-primary' : tone === 'success' ? 'bg-success/10' : tone === 'danger' ? 'bg-destructive/10' : 'bg-muted'
  const fg = tone === 'primary' ? 'text-primary-foreground' : tone === 'success' ? 'text-success' : tone === 'danger' ? 'text-destructive' : 'text-foreground'
  return <GAvatar aria-hidden className={cx(t, fg)} style={{ width: size, height: size }}>{children}</GAvatar>
}

export function Avatar({ name, size = 44, src }: { name: string; size?: number; src?: string }) {
  return (
    <GAvatar aria-hidden style={{ width: size, height: size }}>
      <AvatarFallbackText>{name}</AvatarFallbackText>
      {src ? <AvatarImage source={{ uri: src }} alt="" /> : null}
    </GAvatar>
  )
}

/** Neutral bank monogram: real bank names as text, never logos (mock-data.md). */
export function BankMark({ short, size = 44 }: { short: string; size?: number }) {
  return <GAvatar aria-hidden style={{ width: size, height: size }}><Text size="xs" bold>{short}</Text></GAvatar>
}

/* ── Status & money ───────────────────────────────────────────────── */

export const STATUS_LABEL: Record<TxStatus, string> = { pending: 'Đang xử lý', success: 'Thành công', failed: 'Không thành công', refunded: 'Đã hoàn tiền' }
/**
 * Money meaning (fintech rule, sếp 2026-11-19): green = positive / money gained (success token), red = negative / a cost
 * (destructive token). Pending stays neutral. Badges: success green, failed red, pending outline, refunded neutral.
 */
type Tone = 'neutral' | 'primary' | 'secondary' | 'success' | 'pending' | 'danger'
function ToneBadge({ tone, children }: { tone: Tone; children: ReactNode }) {
  // Success is the normal outcome: outline in green, so it reads calmly next to amounts; failure is the solid one.
  if (tone === 'success')
    return <GBadge variant="outline" className="border-success/50"><BadgeText className="text-success">{children}</BadgeText></GBadge>
  const variant = tone === 'danger' ? 'destructive' : tone === 'primary' ? 'default' : tone === 'pending' ? 'outline' : 'secondary'
  // Dark theme's destructive is a light red: white text fails (2.9:1), so it takes the background colour there.
  return <GBadge variant={variant} className={variant === 'destructive' ? 'dark:bg-destructive' : undefined}><BadgeText className={variant === 'destructive' ? 'dark:text-background' : undefined}>{children}</BadgeText></GBadge>
}

const STATUS_TONE: Record<TxStatus, Tone> = { success: 'success', failed: 'danger', pending: 'pending', refunded: 'neutral' }
export function StatusPill({ status }: { status: TxStatus; className?: string }) {
  return <ToneBadge tone={STATUS_TONE[status]}>{STATUS_LABEL[status]}</ToneBadge>
}

/**
 * A signed amount is coloured by direction: `in` green, `out` red. `struck` = a failed transaction (no money moved):
 * muted and struck through, no colour. `tone={false}` keeps a signed amount neutral.
 */
export function Money({ amount, sign, hidden, className, tone = true, struck }: { amount: number; sign?: 'in' | 'out'; hidden?: boolean; className?: string; tone?: boolean; struck?: boolean }) {
  if (hidden) return <Text className={cx('tabular-nums', className)} role="img" aria-label="Số dư đang ẩn">•••••• ₫</Text>
  const color = struck ? 'text-muted-foreground line-through' : tone && sign === 'in' ? 'text-success' : tone && sign === 'out' ? 'text-destructive' : undefined
  return <Text className={cx('whitespace-nowrap tabular-nums', color, className)}>{formatVnd(amount, { sign })}</Text>
}

/** A fee is a cost (red); no fee is good news (green). `label` overrides the free text (e.g. remaining free transfers). */
export function Fee({ amount, label = 'Miễn phí' }: { amount: number; label?: string }) {
  return amount ? <Text className="tabular-nums text-destructive">{formatVnd(amount)}</Text> : <Text className="text-success">{label}</Text>
}

/** Kept for call sites that render the currency mark on its own. */
export function Dong() {
  return <Text> ₫</Text>
}

export function Badge({ children, tone = 'neutral' }: { children: ReactNode; tone?: Tone }) {
  return <ToneBadge tone={tone}>{children}</ToneBadge>
}

export function Skeleton({ className }: { className?: string }) {
  return <GSkeleton aria-hidden className={cx('h-4', className)} />
}

export function EmptyState({ icon, title, body, action }: { icon: ReactNode; title: string; body?: ReactNode; action?: ReactNode }) {
  return (
    <VStack className="items-center px-4 py-12">
      <Disc>{icon}</Disc>
      <Text bold className="mt-3 text-center">{title}</Text>
      {body ? <Text className="mt-1 max-w-[42ch] text-center text-muted-foreground">{body}</Text> : null}
      {action ? <Box className="mt-6">{action}</Box> : null}
    </VStack>
  )
}

export function Callout({ tone = 'neutral', title, children, action }: { tone?: 'neutral' | 'pending' | 'danger' | 'primary'; title: ReactNode; children?: ReactNode; action?: ReactNode }) {
  return (
    <GCard role={tone === 'danger' ? 'alert' : 'status'} className={cx('gap-1', tone === 'danger' && 'border-destructive')}>
      <Text bold className={cx(tone === 'danger' && 'text-destructive')}>{title}</Text>
      {children ? <Box><Text size="sm">{children}</Text></Box> : null}
      {action ? <Box className="mt-3">{action}</Box> : null}
    </GCard>
  )
}

/* ── Form ─────────────────────────────────────────────────────────── */

export function Field({ label, hint, error, children }: { label: string; hint?: ReactNode; error?: ReactNode; children: ReactNode; htmlFor?: string }) {
  return (
    <FormControl isInvalid={!!error} className="mb-6">
      <FormControlLabel><FormControlLabelText>{label}</FormControlLabelText></FormControlLabel>
      {children}
      {error ? (
        <FormControlError role="alert"><FormControlErrorText>{error}</FormControlErrorText></FormControlError>
      ) : hint ? (
        <FormControlHelper><FormControlHelperText>{hint}</FormControlHelperText></FormControlHelper>
      ) : null}
    </FormControl>
  )
}

type TextInputProps = {
  id?: string; value?: string; placeholder?: string; invalid?: boolean; className?: string; maxLength?: number; autoFocus?: boolean
  inputMode?: 'numeric' | 'text' | 'tel' | 'search' | 'decimal' | 'email'; autoComplete?: string; autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters'; spellCheck?: boolean
  type?: string; readOnly?: boolean; disabled?: boolean; onBlur?: () => void
  onChange?: (e: { target: { value: string } }) => void
  onKeyDown?: (e: { key: string }) => void
  'aria-label'?: string; 'aria-describedby'?: string; 'aria-invalid'?: boolean
}

/** gluestack Input + InputField. onChange/onKeyDown keep the DOM-style signature the screens use. */
export function TextInput({ id, invalid, className, onChange, onKeyDown, type, disabled, readOnly, autoComplete, ...rest }: TextInputProps) {
  return (
    <Input isInvalid={invalid} isDisabled={disabled} isReadOnly={readOnly} className={cx('h-12', className)}>
      <InputField
        id={id}
        type={type === 'password' ? 'password' : 'text'}
        autoComplete={autoComplete as never}
        onChangeText={(v: string) => onChange?.({ target: { value: v } })}
        onKeyPress={(e: { nativeEvent: { key: string } }) => onKeyDown?.({ key: e.nativeEvent.key })}
        {...rest}
      />
    </Input>
  )
}

/** Filter chips: a row of gluestack Buttons acting as tabs (the selected one is the default variant). */
export function Segmented<T extends string>({ value, options, onChange, label }: { value: T; options: { value: T; label: string; count?: number }[]; onChange: (v: T) => void; label: string }) {
  return (
    <HStack role="tablist" aria-label={label} className="gap-2 overflow-x-auto pb-1">
      {options.map((o) => (
        <GButton key={o.value} role="tab" aria-selected={o.value === value} size="sm" variant={o.value === value ? 'default' : 'outline'} className="rounded-full" onPress={() => onChange(o.value)}>
          <ButtonText>{o.label}{o.count !== undefined ? ` ${o.count}` : ''}</ButtonText>
        </GButton>
      ))}
    </HStack>
  )
}

/* ── Overlays ─────────────────────────────────────────────────────── */

/** Actionsheet on the app layout, Modal on web. */
export function Sheet({ open, onOpenChange, title, description, children, dismissible = true }: {
  open: boolean; onOpenChange: (o: boolean) => void; title: string; description?: ReactNode; children: ReactNode; dismissible?: boolean
}) {
  const layout = useLayout()
  const close = () => dismissible && onOpenChange(false)
  const header = (
    <HStack className="w-full items-start justify-between gap-4">
      <VStack className="min-w-0 flex-1 gap-1">
        <Heading as="h2" size="lg">{title}</Heading>
        {description ? <Text className="text-muted-foreground">{description}</Text> : null}
      </VStack>
      {dismissible ? <CloseButton onClick={close} /> : null}
    </HStack>
  )
  if (layout === 'app')
    return (
      <Actionsheet isOpen={open} onClose={close} closeOnOverlayClick={dismissible}>
        <ActionsheetBackdrop />
        <ActionsheetContent role="dialog" aria-modal aria-label={title} className="max-h-[92dvh] items-stretch">
          <ActionsheetDragIndicatorWrapper><ActionsheetDragIndicator /></ActionsheetDragIndicatorWrapper>
          {header}
          {/* Scroll box is a fixed-height flex column: the content wrapper must not shrink, or its children overlap. */}
          <Box className="mt-4 overflow-y-auto pb-4"><Box className="shrink-0"><FlatContext.Provider value={false}>{children}</FlatContext.Provider></Box></Box>
        </ActionsheetContent>
      </Actionsheet>
    )
  return (
    <Modal isOpen={open} onClose={close} closeOnOverlayClick={dismissible} size="md">
      <ModalBackdrop />
      <ModalContent role="dialog" aria-modal aria-label={title} className="max-h-[88vh]">
        <ModalHeader>{header}</ModalHeader>
        <ModalBody className="mt-4"><Box className="shrink-0"><FlatContext.Provider value={false}>{children}</FlatContext.Provider></Box></ModalBody>
      </ModalContent>
    </Modal>
  )
}

export function Confirm({ open, onOpenChange, title, body, confirmLabel, cancelLabel = 'Hủy', onConfirm, danger }: {
  open: boolean; onOpenChange: (o: boolean) => void; title: string; body?: ReactNode; confirmLabel: string; cancelLabel?: string; onConfirm: () => void; danger?: boolean
}) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange} title={title} description={body}>
      <VStack className="gap-2">
        <Button variant={danger ? 'danger' : 'primary'} block onClick={() => { onConfirm(); onOpenChange(false) }}>{confirmLabel}</Button>
        <Button variant="secondary" block onClick={() => onOpenChange(false)}>{cancelLabel}</Button>
      </VStack>
    </Sheet>
  )
}

/** Page h1: visible on web; on app the shell header already shows the title, so the h1 is sr-only but still takes route focus. */
export function ScreenTitle({ children, description }: { children: ReactNode; description?: ReactNode }) {
  const layout = useLayout()
  return (
    <VStack className={cx('gap-1', layout === 'web' ? 'mb-6' : 'mb-3')}>
      <Heading size="3xl" tabIndex={-1} data-page-title className={cx('outline-none', layout === 'app' && 'sr-only')}>{children}</Heading>
      {description ? <Text className="text-muted-foreground">{description}</Text> : null}
    </VStack>
  )
}

/**
 * One transient confirmation at a time: gluestack Toast. `node` is a polite live region that repeats the message
 * for screen readers (and tests); the visible toast is gluestack's.
 */
export function useToast(ms = 3000) {
  const toast = useGToast()
  const [msg, setMsg] = useState<string | null>(null)
  useEffect(() => {
    if (!msg) return
    const t = setTimeout(() => setMsg(null), ms)
    return () => clearTimeout(t)
  }, [msg, ms])
  const show = (m: string) => {
    setMsg(m)
    toast.closeAll()
    toast.show({ placement: 'bottom', duration: ms, render: ({ id }) => <Toast nativeID={`toast-${id}`} action="muted" variant="solid"><ToastTitle>{m}</ToastTitle></Toast> })
  }
  const node = <Box role="status" aria-live="polite" className="sr-only">{msg}</Box>
  return { show, node }
}

/** Inline text link that routes on the client: gluestack Link + LinkText rendered as <a href>. */
export function TextLink({ to, children, onClick }: { to: string; children: ReactNode; onClick?: Press }) {
  const press = useLinkPress(to, onClick)
  return <Link href={to} onPress={press}><LinkText>{children}</LinkText></Link>
}

/** Key/value detail rows (confirm, result, profile): label left, value right, a divider between rows. */
export function DetailRows({ rows }: { rows: [string, ReactNode][] }) {
  return (
    <VStack role="list" className="divide-y divide-border">
      {rows.map(([k, v]) => (
        <HStack key={k} role="listitem" className="min-h-12 items-start justify-between gap-6 py-3">
          <Text className="shrink-0 text-muted-foreground">{k}</Text>
          <Box className="min-w-0 items-end"><Text className="text-right font-medium break-words">{v}</Text></Box>
        </HStack>
      ))}
    </VStack>
  )
}
