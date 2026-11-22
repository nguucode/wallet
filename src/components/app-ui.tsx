/**
 * Wallet's shared UI, composed only from gluestack-ui components (src/components/ui/*) with the default gluestack theme
 * tokens (primary, secondary, muted, card, border, destructive, foreground, muted-foreground). No custom CSS, no custom tokens.
 * The exported API is the one the screens already use; everything inside is gluestack.
 */
import { Check, ChevronLeft, ChevronRight, X } from 'lucide-react'
import { useCallback, useEffect, useState, type ReactNode } from 'react'
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
import { Image } from '@/components/ui/image'
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
      // iOS: capsule buttons; the large (md) size is the 50pt iOS filled button.
      // macOS: the regular push button, 24pt tall with 6pt corners ([appkit] NSButton fittingSize, [render] corner).
      // App: every button keeps a 44pt target (HIG), the small one included.
      className={cx('rounded-full mac:h-6 mac:min-h-0 mac:rounded-[6px] mac:px-3', variant === 'secondary' && 'push-button', size === 'md' ? 'h-12' : 'min-h-11', block && 'w-full mac:w-auto mac:self-end', className)}
      {...rest}
    >
      {loading ? <ButtonSpinner /> : null}
      {/* Label role: 14px for every size (gluestack's sm button would drop to 12px). */}
      {parts.map((c, i) => (typeof c === 'string' || typeof c === 'number' ? <ButtonText key={i} className="text-sm mac:text-base mac:font-normal">{c}</ButtonText> : c))}
    </GButton>
  )
}

export function ButtonLink(props: Omit<ButtonProps, 'onClick'> & { to: string }) {
  return <Button {...props} />
}

export function IconButton({ label, children, onClick, className, ...rest }: { label: string; children: ReactNode; onClick?: Press; className?: string; 'aria-expanded'?: boolean; disabled?: boolean }) {
  return (
    <GButton variant="ghost" size="icon" aria-label={label} onPress={onClick} isDisabled={rest.disabled} className={cx('h-11 w-11 rounded-full mac:h-7 mac:min-h-0 mac:w-7 mac:min-w-0', className)} {...rest}>
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
 * Content inset: the one horizontal edge inside a box and for text in the column (DESIGN.md "One content edge"):
 * 16 on the app (iOS inset grouped), 10 on web (macOS Form). Rows, headers and notes take it; nothing else sets one.
 */
// `content-inset` (app/globals.css): inside a padded box the box already supplies the edge, so the inset drops to 0.
export const INSET = 'content-inset px-4 mac:px-2.5'

/**
 * The grouped box. `inset="rows"`: no padding, the rows inside carry INSET. `inset="content"` (default): the box pads
 * its content by the inset (app 16, web 10). Callers never add padding of their own (guarded by a test).
 */
export function Card({ className, children, role, inset = 'content', centered, ...aria }: { className?: string; children: ReactNode; inset?: 'rows' | 'content'; /** Centred content (a QR, a receipt head): its lines do not start on the inset. */ centered?: boolean; as?: 'div' | 'section' | 'article'; role?: string; 'aria-label'?: string; 'aria-labelledby'?: string }) {
  // iOS inset grouped: cells on the grouped background, 24px corners, no border or shadow.
  // macOS: the grouped Form section box, 12pt corners ([render]).
  return (
    <GCard role={role} {...aria} data-box={inset} data-align={centered ? 'free' : undefined} className={cx('gap-0 rounded-3xl border-0 shadow-none mac:rounded-[12px]', inset === 'rows' ? 'overflow-hidden p-0' : 'p-4 mac:p-2.5', className)}>
      {children}
    </GCard>
  )
}

export function Section({ title, action, children, className }: { title: string; action?: ReactNode; children: ReactNode; className?: string }) {
  return (
    // macOS [render]: 57.5pt from one box to the next, header in Headline (13 bold) inset 10pt, 11pt above its box.
    <VStack className={cx('mt-8 gap-3 mac:mt-[30px] mac:gap-[11px]', className)} aria-label={title} role="region">
      <HStack className={cx('items-baseline justify-between gap-4', INSET)}>
        <Heading as="h2" size="lg" className="mac:text-base mac:font-bold">{title}</Heading>
        {action}
      </HStack>
      {children}
    </VStack>
  )
}

/**
 * Type roles (impeccable typeset, 2026-11-19): display 48 bold (balance) · amount 36 bold · page title 36 bold ·
 * section 20 bold · group 14 semibold muted (sentence case) · body/row 16 · label 14 medium (every button, chip, tile) ·
 * meta 14 muted · caption 12 (status, axis, tile second line).
 */
/** Group heading over a list (date, category): one style everywhere. Sentence case: Vietnamese capitals stack diacritics. */
export function GroupLabel({ children, as = 'h2', id, className }: { children: ReactNode; as?: 'h2' | 'h3'; id?: string; className?: string }) {
  return <Heading as={as} id={id} size="xs" className={cx('text-sm font-semibold text-muted-foreground mac:text-base mac:font-bold mac:text-foreground', INSET, className)}>{children}</Heading>
}

/** Same as ScreenTitle: on web the toolbar carries the title (macOS); on app the nav bar / large title does. */
export function PageTitle(props: { children: ReactNode; description?: ReactNode }) {
  return <ScreenTitle {...props} />
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
    // iOS: the bar is clear at rest and becomes a glass material once content scrolls under it.
    <HStack className={cx('sticky top-0 z-30 min-h-14 items-center px-1', scrolled ? 'border-b border-border/60 bg-backdrop-app/75 backdrop-blur-xl' : 'bg-transparent', className)} role="banner">
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
  const body = (
    // macOS [render]: rows 38pt with 10pt side insets.
    <HStack className={cx('min-h-[60px] w-full items-center gap-3 py-2 mac:min-h-[38px] mac:gap-2 mac:py-1.5', INSET)}>
      {left ? <Box className="shrink-0">{left}</Box> : null}
      <VStack className="min-w-0 flex-1">
        <Text className="line-clamp-2">{title}</Text>
        {subtitle ? <Text size="sm" isTruncated className="text-muted-foreground">{subtitle}</Text> : null}
      </VStack>
      {right !== undefined ? (
        <VStack className="shrink-0 items-end gap-1">
          <Text className="font-semibold tabular-nums mac:font-normal">{right}</Text>
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
      className={cx('w-full data-[hover=true]:bg-accent data-[active=true]:bg-accent mac:data-[hover=true]:bg-transparent mac:data-[active=true]:bg-accent', disabled && 'opacity-40', className)}
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
    <Pressable onPress={press} href={to} role="link" className="items-center rounded-lg data-[hover=true]:opacity-80 data-[active=true]:opacity-60">
      <VStack className="items-center gap-2">
        <Box aria-hidden>{leading}</Box>
        <VStack className="w-full items-center">
          <Text size="sm" isTruncated className="w-full text-center font-medium">{name}</Text>
          {sub ? <Text size="xs" isTruncated className="w-full text-center text-muted-foreground">{sub}</Text> : null}
        </VStack>
      </VStack>
      <Text className="sr-only">, {label}</Text>
    </Pressable>
  )
}

export function RowSkeleton() {
  return (
    <HStack className={cx('min-h-[60px] items-center gap-3 py-2 mac:min-h-[38px]', INSET)} aria-hidden>
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
    return <GBadge variant="outline" className="rounded-full border-success/50"><BadgeText className="normal-case font-semibold text-success">{children}</BadgeText></GBadge>
  const variant = tone === 'danger' ? 'destructive' : tone === 'primary' ? 'default' : tone === 'pending' ? 'outline' : 'secondary'
  // Dark theme's destructive is a light red: white text fails (2.9:1), so it takes the background colour there.
  // iOS capsules in sentence case (gluestack's BadgeText is uppercase by default).
  return <GBadge variant={variant} className={cx('rounded-full', variant === 'destructive' && 'dark:bg-destructive')}><BadgeText className={cx('normal-case font-semibold', variant === 'destructive' && 'dark:text-background')}>{children}</BadgeText></GBadge>
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
    <VStack data-align="free" className="items-center px-4 py-12">
      <Disc>{icon}</Disc>
      <Text bold className="mt-3 text-center">{title}</Text>
      {body ? <Text className="mt-1 max-w-[42ch] text-center text-muted-foreground">{body}</Text> : null}
      {action ? <Box className="mt-6">{action}</Box> : null}
    </VStack>
  )
}

export function Callout({ tone = 'neutral', title, children, action }: { tone?: 'neutral' | 'pending' | 'danger' | 'primary'; title: ReactNode; children?: ReactNode; action?: ReactNode }) {
  return (
    <Card role={tone === 'danger' ? 'alert' : 'status'} className={cx('gap-1', tone === 'danger' && 'border border-destructive')}>
      <Text bold className={cx(tone === 'danger' && 'text-destructive')}>{title}</Text>
      {children ? <Box><Text size="sm">{children}</Text></Box> : null}
      {action ? <Box className="mt-3 items-start">{action}</Box> : null}
    </Card>
  )
}

/**
 * A pickable list inside a Sheet. App: rows run edge to edge and their inset matches the sheet's 16pt padding. Web: a
 * grouped box, so the rows sit on the box's 10pt inset like every other list in a macOS panel.
 */
export function SheetList({ label, children }: { label?: string; children: ReactNode }) {
  const layout = useLayout()
  const list = <VStack role="list" aria-label={label} className={cx('divide-y divide-border', layout === 'app' && '-mx-4')}>{children}</VStack>
  return layout === 'web' ? <Card inset="rows">{list}</Card> : list
}

/* ── Form ─────────────────────────────────────────────────────────── */

export function Field({ label, hint, error, children }: { label: string; hint?: ReactNode; error?: ReactNode; children: ReactNode; htmlFor?: string }) {
  return (
    // macOS grouped form: the label leads the row and the control trails it; iOS keeps the label above.
    <FormControl isInvalid={!!error} className="mb-6 mac:mb-4">
      <Box className="mac:flex-row mac:items-center mac:gap-3">
        <FormControlLabel className="mac:mb-0 mac:w-[38%] mac:shrink-0"><FormControlLabelText className="mac:text-base mac:font-normal">{label}</FormControlLabelText></FormControlLabel>
        <Box className="mac:min-w-0 mac:flex-1">{children}</Box>
      </Box>
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
    // macOS [render]: rounded-border text field 26pt tall, ~10pt corners, window-background fill.
    <Input isInvalid={invalid} isDisabled={disabled} isReadOnly={readOnly} className={cx('h-12 mac:h-[26px] mac:min-h-0 mac:rounded-[10px] mac:bg-background', className)}>
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
    // macOS [render]: a segmented control, 24pt track on the control fill, 6pt corners, the selected segment a darker
    // neutral fill (no accent). App keeps iOS capsule chips.
    <HStack role="tablist" aria-label={label} className="gap-2 overflow-x-auto pb-1 mac:gap-0 mac:self-start mac:overflow-visible mac:rounded-[6px] mac:bg-secondary mac:pb-0">
      {options.map((o) => {
        const on = o.value === value
        return (
          <GButton key={o.value} role="tab" aria-selected={on} size="sm" variant={on ? 'default' : 'outline'} onPress={() => onChange(o.value)}
            className={cx('h-11 rounded-full mac:h-6 mac:min-h-0 mac:rounded-[6px] mac:border-0 mac:px-3', on ? 'mac:bg-segment-selected mac:data-[hover=true]:bg-segment-selected' : 'mac:bg-transparent mac:data-[hover=true]:bg-transparent')}>
            <ButtonText className={cx('text-sm mac:text-base mac:font-normal', on && 'mac:text-foreground mac:dark:text-white')}>{o.label}{o.count !== undefined ? ` ${o.count}` : ''}</ButtonText>
          </GButton>
        )
      })}
    </HStack>
  )
}

/* ── Overlays ─────────────────────────────────────────────────────── */

/**
 * Web dialogs (macOS): focus moves into the dialog when it opens (the default button of an alert, else the first
 * control), and Esc cancels, as HIG Alerts lists "Pressing Escape (Esc)" among the ways to cancel on macOS.
 */
function useDialogKeys(open: boolean, label: string, onEsc: () => void, focus: 'default' | 'first') {
  const layout = useLayout()
  useEffect(() => {
    if (!open || layout !== 'web') return
    // Focus returns to whatever opened the dialog once it closes.
    const opener = document.activeElement as HTMLElement | null
    const find = () => document.querySelector<HTMLElement>(`[aria-label="${CSS.escape(label)}"][aria-modal]`)
    const t = setTimeout(() => {
      const box = find()
      const all = box ? [...box.querySelectorAll<HTMLElement>('button, [href], input, textarea, [tabindex]:not([tabindex="-1"])')] : []
      ;(focus === 'default' ? all[all.length - 1] : all[0])?.focus()
    }, 60)
    const key = (e: KeyboardEvent) => { if (e.key === 'Escape') { e.preventDefault(); onEsc() } }
    // Capture phase: focused controls inside the dialog may stop the event before it bubbles.
    window.addEventListener('keydown', key, true)
    return () => { clearTimeout(t); window.removeEventListener('keydown', key, true); setTimeout(() => opener?.isConnected && opener.focus(), 0) }
  }, [open, layout, label, onEsc, focus])
}

/** Actionsheet on the app layout, Modal on web. */
export function Sheet({ open, onOpenChange, title, description, children, dismissible = true, hideClose, closeLabel = 'Đóng' }: {
  open: boolean; onOpenChange: (o: boolean) => void; title: string; description?: ReactNode; children: ReactNode; dismissible?: boolean; hideClose?: boolean
  /** Web dismiss button (HIG Sheets): "Hủy" when the sheet holds a pending task, "Đóng" otherwise, "Xong" when it only applies settings. */
  closeLabel?: string
}) {
  const layout = useLayout()
  const close = () => dismissible && onOpenChange(false)
  useDialogKeys(open, title, close, 'first')
  const showClose = dismissible && !hideClose
  if (layout === 'app')
    return (
      <Actionsheet isOpen={open} onClose={close} closeOnOverlayClick={dismissible}>
        <ActionsheetBackdrop />
        <ActionsheetContent role="dialog" aria-modal aria-label={title} className="max-h-[92dvh] items-stretch rounded-t-[32px] border-0 bg-card">
          <ActionsheetDragIndicatorWrapper><ActionsheetDragIndicator /></ActionsheetDragIndicatorWrapper>
          {/* HIG Sheets (iOS): dismissal at the leading edge; HIG Toolbars: a close glyph, not a "Close" text label. Inline
              title centred. */}
          <HStack className="w-full items-center">
            <Box className="w-11">{showClose ? <IconButton label="Đóng" onClick={close} className="bg-secondary"><Ico as={X} size="sm" /></IconButton> : null}</Box>
            <Heading as="h2" size="sm" className="min-w-0 flex-1 text-center">{title}</Heading>
            <Box className="w-11" />
          </HStack>
          {description ? <Text data-align="free" className="mt-2 text-center text-muted-foreground">{description}</Text> : null}
          {/* Scroll box is a fixed-height flex column: the content wrapper must not shrink, or its children overlap. */}
          <Box className="mt-4 overflow-y-auto pb-4"><Box className="shrink-0">{children}</Box></Box>
        </ActionsheetContent>
      </Actionsheet>
    )
  return (
    <Modal isOpen={open} onClose={close} closeOnOverlayClick={dismissible} size="md">
      <ModalBackdrop />
      {/* macOS [render]: a system panel (NSAlert) is 26pt-cornered glass with 16pt margins; HIG Sheets dismisses with a
          Cancel/Done button at the bottom trailing edge, not a close glyph. */}
      <ModalContent role="dialog" aria-modal aria-label={title} className="max-h-[88vh] rounded-[26px] border border-foreground/10 bg-popover/90 p-4 backdrop-blur-2xl material-sheet">
        <ModalHeader>
          <VStack className="min-w-0 flex-1 gap-1">
            <Heading as="h2" size="lg" className="text-base font-bold">{title}</Heading>
            {description ? <Text className="text-muted-foreground">{description}</Text> : null}
          </VStack>
        </ModalHeader>
        <ModalBody className="mb-0 mt-4 overflow-y-auto"><Box className="shrink-0">{children}</Box></ModalBody>
        {showClose ? <HStack className="mt-4 justify-end"><Button variant="secondary" size="sm" onClick={close}>{closeLabel}</Button></HStack> : null}
      </ModalContent>
    </Modal>
  )
}

export function Confirm({ open, onOpenChange, title, body, confirmLabel, cancelLabel = 'Hủy', onConfirm, danger }: {
  open: boolean; onOpenChange: (o: boolean) => void; title: string; body?: ReactNode; confirmLabel: string; cancelLabel?: string; onConfirm: () => void; danger?: boolean
}) {
  const layout = useLayout()
  const confirm = () => { onConfirm(); onOpenChange(false) }
  const cancel = useCallback(() => onOpenChange(false), [onOpenChange])
  useDialogKeys(open, title, cancel, 'default')
  if (layout === 'web')
    // macOS NSAlert ([render] macOS 26.6): 260pt wide, 26pt corners, app icon, centred bold title and message, two equal
    // 28pt capsules with cancel leading and the action trailing; no close button. HIG Alerts keeps the destructive style
    // for actions people didn't deliberately choose, so a confirmation of a chosen action uses the default style.
    return (
      <Modal isOpen={open} onClose={() => onOpenChange(false)} size="xs">
        <ModalBackdrop />
        <ModalContent role="alertdialog" aria-modal aria-label={title} className="w-[260px] max-w-[260px] items-center rounded-[26px] border border-foreground/10 bg-popover/90 p-4 backdrop-blur-2xl material-sheet">
          {/* The app icon is decoration (the title names the alert): hidden from assistive tech. */}
          <Box aria-hidden className="mt-2"><Image source={{ uri: '/icon.svg' }} alt="" size="none" className="h-16 w-16" /></Box>
          <Heading as="h2" size="sm" className="mt-3 text-center text-base font-bold">{title}</Heading>
          {body ? <Text className="mt-1 text-center">{body}</Text> : null}
          <HStack className="mt-4 w-full gap-2">
            <Box className="flex-1"><Button variant="secondary" block className="mac:h-7 mac:min-h-0 mac:!w-full mac:rounded-full" onClick={() => onOpenChange(false)}>{cancelLabel}</Button></Box>
            <Box className="flex-1"><Button variant="primary" block className="mac:h-7 mac:min-h-0 mac:!w-full mac:rounded-full" onClick={confirm}>{confirmLabel}</Button></Box>
          </HStack>
        </ModalContent>
      </Modal>
    )
  return (
    <Sheet open={open} onOpenChange={onOpenChange} title={title} description={body} hideClose>
      <VStack className="gap-2">
        <Button variant={danger ? 'danger' : 'primary'} block onClick={confirm}>{confirmLabel}</Button>
        <Button variant="secondary" block onClick={() => onOpenChange(false)}>{cancelLabel}</Button>
      </VStack>
    </Sheet>
  )
}

/** Page h1: visible on web; on app the shell header already shows the title, so the h1 is sr-only but still takes route focus. */
export function ScreenTitle({ children, description }: { children: ReactNode; description?: ReactNode }) {
  const layout = useLayout()
  return (
    // Web (macOS): the toolbar shows the title, as in System Settings; the h1 stays for screen readers and route focus.
    <VStack className={cx('gap-1', layout === 'web' ? (description ? 'mb-4' : '') : 'mb-3')}>
      <Heading size="3xl" tabIndex={-1} data-page-title className="sr-only outline-none">{children}</Heading>
      {description ? <Text className={cx('text-muted-foreground', INSET)}>{description}</Text> : null}
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
  // iOS: links are tint-coloured text, not underlined. App: a 44pt target around the text without moving it (HIG).
  return <Link href={to} onPress={press} className="-my-[10.5px] min-h-11 justify-center mac:my-0 mac:min-h-0"><LinkText className="font-medium no-underline">{children}</LinkText></Link>
}

/** Key/value detail rows (confirm, result, profile): label left, value right, a divider between rows. */
export function DetailRows({ rows }: { rows: [string, ReactNode][] }) {
  return (
    <VStack role="list" className="divide-y divide-border">
      {rows.map(([k, v]) => (
        // macOS [render] LabeledContent: label in label colour leading, value in secondary label trailing, 38pt rows.
        <HStack key={k} role="listitem" className={cx('min-h-12 items-start justify-between gap-6 py-3 mac:min-h-[38px] mac:items-center mac:py-2.5', INSET)}>
          <Text className="shrink-0 text-muted-foreground mac:text-foreground">{k}</Text>
          <Box className="min-w-0 items-end"><Text className="text-right font-medium break-words mac:font-normal mac:text-muted-foreground">{v}</Text></Box>
        </HStack>
      ))}
    </VStack>
  )
}
