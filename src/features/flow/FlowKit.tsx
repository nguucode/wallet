import { Check, Clock, Delete, X } from 'lucide-react'
import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { useNavigate, useSearchParams } from 'react-router'
import { requiredAuth } from '@/domain/auth'
import { config } from '@/domain/config'
import { fee } from '@/domain/fees'
import { checkLimit } from '@/domain/limits'
import { formatVnd, parseVndInput } from '@/domain/money'
import type { AuthMethod, TxType } from '@/domain/types'
import { useLayout } from '@/app/layout'
import { useToolbarNav } from '@/app/toolbar'
import { rowAmount } from '@/features/his/history'
import {
  counterpartyName, dayCounter, executeMoney, freeUsed, gateOf, getState, pendingEta, sourceLabel, usage, useWorld,
  type MoneyRequest,
} from '@/app/store'
import type { FailureReason, Transaction } from '@/mock/seed'
import { AuthSheet } from '@/features/sec/AuthSheet'
import { GATE_COPY } from '@/features/sec/Gate'
import { BackButton, Button, ButtonLink, CloseButton, Confirm, cx, DetailRows, Fee, Ico, Money, NavBar, TextLink, Card } from '@/components/app-ui'
import { Avatar } from '@/components/ui/avatar'
import { Box } from '@/components/ui/box'
import { Button as GButton, ButtonText } from '@/components/ui/button'
import { Grid, GridItem } from '@/components/ui/grid'
import { Heading } from '@/components/ui/heading'
import { HStack } from '@/components/ui/hstack'
import { Input, InputField } from '@/components/ui/input'
import { Text } from '@/components/ui/text'
import { VStack } from '@/components/ui/vstack'

export { fmtTime, fmtDate, fmtDateTime, maskPhone, formatPhone, maskAccount } from '@/app/format'
import { fmtTime, fmtDateTime } from '@/app/format'

/* ── Step state (rules.md#spec-conventions) ───────────────────────── */

const drafts = new Map<string, Record<string, unknown>>()

/**
 * Flow step in `?step=`, draft kept in memory. A step opened by URL without its draft restarts at the first step;
 * `result` without its transaction redirects to the transaction (or history).
 */
export function useFlow<D extends Record<string, unknown>>(flowId: string, steps: readonly string[], initial: D, opts: { resultFallback?: string } = {}) {
  const [params, setParams] = useSearchParams()
  const nav = useNavigate()
  const step = params.get('step') ?? steps[0]
  const [draft, setDraftState] = useState<D>(() => (drafts.get(flowId) as D) ?? initial)
  const hasDraft = drafts.has(flowId)
  useEffect(() => {
    if (step === 'result' && !hasDraft) {
      let txId: string | null = null
      try { txId = sessionStorage.getItem('flow.result.' + flowId) } catch { /* ignore */ }
      nav(opts.resultFallback ?? (txId ? `/history/${txId}` : '/history'), { replace: true })
    } else if (step !== steps[0] && !hasDraft) {
      const next = new URLSearchParams(params)
      next.set('step', steps[0])
      setParams(next, { replace: true })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  const setDraft = (patch: Partial<D>) => setDraftState((d) => { const n = { ...d, ...patch }; drafts.set(flowId, n); return n })
  const go = (s: string, opts?: { replace?: boolean }) => {
    drafts.set(flowId, drafts.get(flowId) ?? draft)
    const next = new URLSearchParams(params)
    next.set('step', s)
    setParams(next, opts)
  }
  const finish = (txId: string) => {
    try { sessionStorage.setItem('flow.result.' + flowId, txId) } catch { /* ignore */ }
    setDraft({ txId } as unknown as Partial<D>)
    go('result', { replace: true })
  }
  const clear = () => drafts.delete(flowId)
  return { step, draft, setDraft, go, finish, clear, index: steps.indexOf(step) }
}

/* ── Frame ────────────────────────────────────────────────────────── */

/** Flow page frame: app = full screen with header and sticky bottom bar; web = title + inline footer. Content sits in one Card. */
export function FlowFrame({ title, onBack, onClose, footer, children, description }: {
  title: string; onBack?: () => void; onClose?: () => void; footer?: ReactNode; children: ReactNode; description?: ReactNode
}) {
  const layout = useLayout()
  // HIG Toolbars: back at the toolbar's leading edge, then the title; close joins them in the toolbar.
  useToolbarNav({ title, onBack, onClose }, layout === 'web')
  if (layout === 'web')
    return (
      // macOS System Settings: the step title, back and close live in the toolbar; the form sits in one grouped box and
      // the default button is trailing.
      <VStack>
        <Heading size="sm" tabIndex={-1} data-page-title className="sr-only outline-none">{title}</Heading>
        {description ? <Text className="mb-3 px-2.5 text-muted-foreground">{description}</Text> : null}
        <Card className="mac:p-2.5">{children}</Card>
        {footer ? <HStack className="mt-5 flex-row-reverse flex-wrap gap-2 [&>*]:w-auto">{footer}</HStack> : null}
      </VStack>
    )
  return (
    <VStack className="min-h-dvh bg-backdrop-app">
      <NavBar
        title={<Heading as="h1" size="sm" tabIndex={-1} data-page-title className="truncate outline-none">{title}</Heading>}
        left={onBack ? <BackButton onClick={onBack} /> : <Box className="w-11" />}
        right={onClose ? <CloseButton onClick={onClose} /> : <Box className="w-11" />}
      />
      <Box role="main" id="main" className="mx-auto w-full max-w-[560px] flex-1 px-4 pb-6 pt-2">
        {description ? <Text className="mb-3 text-muted-foreground">{description}</Text> : null}
        <Card>{children}</Card>
        {/* The app keypad portals here so it stands on its own below the card, like the system number pad. */}
        <Box id="flow-keypad-slot" />
      </Box>
      {footer ? <VStack className="sticky bottom-0 z-20 mx-auto w-full max-w-[560px] gap-2 border-t border-border bg-backdrop-app px-4 pb-[max(16px,env(safe-area-inset-bottom))] pt-3">{footer}</VStack> : null}
    </VStack>
  )
}

/** Close with "Hủy giao dịch?" when something was entered (US-FND-007). */
export function useCloseFlow(dirty: boolean, clear: () => void, to = '/home') {
  const nav = useNavigate()
  const [ask, setAsk] = useState(false)
  const close = () => (dirty ? setAsk(true) : (clear(), nav(to)))
  const dialog = (
    <Confirm open={ask} onOpenChange={setAsk} title="Hủy giao dịch?" body="Thông tin bạn đã nhập sẽ không được lưu." confirmLabel="Hủy" cancelLabel="Tiếp tục nhập" onConfirm={() => { clear(); nav(to) }} danger />
  )
  return { close, dialog }
}

/* ── Amount (US-FND-010) ──────────────────────────────────────────── */

export type AmountCheck = { ok: true } | { ok: false; message: ReactNode }

/** Balance, limit, min and per-type max checks. Run at the amount step and again on confirm. */
export function checkAmount(type: TxType, amount: number, opts: { essential?: boolean; fromSource?: boolean } = {}): AmountCheck {
  const w = getState().world
  const min = type === 'topup' || type === 'withdraw' ? config.minAmount.topupWithdraw : config.minAmount.default
  if (amount <= 0) return { ok: false, message: 'Nhập số tiền' }
  if (amount < min) return { ok: false, message: `Số tiền tối thiểu là ${formatVnd(min)}` }
  if (type === 'bank_transfer' && amount > config.bankTransferMax) return { ok: false, message: `Mỗi lần chuyển đến ngân hàng tối đa ${formatVnd(config.bankTransferMax)}` }
  const f = fee(type, amount, freeUsed(w)).amount
  if (type !== 'topup' && !opts.fromSource && amount + f > w.balance)
    return { ok: false, message: <>Số dư không đủ. Số dư khả dụng {formatVnd(w.balance)}{f ? `, phí ${formatVnd(f)}` : ''}. <TextLink to="/topup">Nạp tiền</TextLink></> }
  const lim = checkLimit(usage(w), type, amount, !!opts.essential)
  if (!lim.ok)
    return { ok: false, message: <>Vượt hạn mức {lim.pool === 'essential' ? 'thanh toán thiết yếu' : 'giao dịch'} tháng này. Còn lại {formatVnd(lim.remaining)}. <TextLink to="/me/limits">Xem hạn mức</TextLink></> }
  return { ok: true }
}

export function AmountInput({ value, onChange, error, label = 'Số tiền', quick = [100_000, 200_000, 500_000, 1_000_000], autoFocus = true, hint }: {
  value: number; onChange: (n: number) => void; error?: ReactNode; label?: string; quick?: number[]; autoFocus?: boolean; hint?: ReactNode
}) {
  const layout = useLayout()
  const shown = value ? value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.') : ''
  const set = (n: number) => { if (n <= 9_999_999_999) onChange(n) }
  return (
    <VStack className="items-center">
      <Text id="amount-label" className="mb-2 text-muted-foreground">{label}</Text>
      <Input isInvalid={!!error} className="h-16 w-full">
        <InputField
          id="amount" autoFocus={autoFocus && layout === 'web'} autoComplete="off" placeholder="0 ₫"
          // App: the wallet keypad below types; the system keyboard stays down. Web: the physical keyboard.
          inputMode={layout === 'app' ? 'none' : 'numeric'}
          value={shown ? `${shown} ₫` : ''}
          onChangeText={(v: string) => set(parseVndInput(v))}
          aria-labelledby="amount-label"
          aria-invalid={!!error || undefined}
          aria-describedby="amount-msg"
          className="text-center text-4xl font-bold tabular-nums placeholder:text-foreground/60 mac:!text-4xl"
        />
      </Input>
      <Text id="amount-msg" role={error ? 'alert' : undefined} size="sm" className={cx('mt-2 min-h-5 text-center', error ? 'text-destructive' : 'text-muted-foreground')}>{error ?? hint}</Text>
      {quick.length ? (
        <HStack className="mt-3 flex-wrap justify-center gap-2">
          {quick.map((q) => (
            <GButton key={q} variant="secondary" size="sm" className="h-11 rounded-full mac:h-6 mac:min-h-0 mac:rounded-[6px]" onPress={() => onChange(q)}><ButtonText className="text-sm tabular-nums mac:text-base mac:font-normal">{formatVnd(q).replace(' ₫', '')}</ButtonText></GButton>
          ))}
        </HStack>
      ) : null}
      {layout === 'app' ? <KeypadPortal value={value} onChange={set} /> : null}
    </VStack>
  )
}

function KeypadPortal(props: { value: number; onChange: (n: number) => void }) {
  const [slot, setSlot] = useState<HTMLElement | null>(null)
  useEffect(() => setSlot(document.getElementById('flow-keypad-slot')), [])
  const pad = <Keypad {...props} />
  return slot ? createPortal(pad, slot) : pad
}

/** Wallet keypad (app layout): a 3×4 grid of gluestack Buttons, with 000 for đồng amounts. */
export function Keypad({ value, onChange }: { value: number; onChange: (n: number) => void }) {
  const press = (k: string) => {
    if (k === 'del') return onChange(Math.floor(value / 10))
    const next = Number(String(value || '') + k)
    onChange(Number.isFinite(next) ? next : value)
  }
  const KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '000', '0', 'del']
  return (
    <Grid className="mt-3 gap-2" _extra={{ className: 'grid-cols-3' }} role="group" aria-label="Bàn phím số">
      {KEYS.map((k) => (
        <GridItem key={k} _extra={{ className: 'col-span-1' }}>
          <GButton variant="outline" className="h-14 w-full" onPress={() => press(k)} aria-label={k === 'del' ? 'Xóa một chữ số' : undefined}>
            {k === 'del' ? <Ico as={Delete} size="lg" /> : <ButtonText className="text-2xl font-normal tabular-nums">{k}</ButtonText>}
          </GButton>
        </GridItem>
      ))}
    </Grid>
  )
}

/* ── Confirm (US-FND-007) ─────────────────────────────────────────── */

/** Key/value detail rows (confirm, result, profile). */
export const ConfirmRows = DetailRows

export function feeLabel(type: TxType, amount: number) {
  const f = fee(type, amount, freeUsed(getState().world))
  if (f.amount) return formatVnd(f.amount)
  return f.freeLeft === null ? 'Miễn phí' : `Miễn phí (còn ${f.freeLeft} lượt trong tháng)`
}

/** The fee for a confirm row: red when charged, green when free (with the free transfers left, if counted). */
export function FeeValue({ type, amount }: { type: TxType; amount: number }) {
  const f = fee(type, amount, freeUsed(getState().world))
  return <Fee amount={f.amount} label={f.freeLeft === null ? 'Miễn phí' : `Miễn phí (còn ${f.freeLeft} lượt trong tháng)`} />
}

export function authFor(type: TxType, amount: number) {
  const w = getState().world
  return requiredAuth({ type, amount, dayCounter: dayCounter(w), deviceBiometric: w.security.deviceBiometric, layout: window.matchMedia?.('(min-width: 1024px)').matches ? 'web' : 'app' })
}

export function authLine(type: TxType, amount: number) {
  const m = authFor(type, amount)
  if (m === 'pin') return 'Xác thực bằng mã PIN'
  if (m === 'device_biometric') return 'Xác thực bằng vân tay hoặc Face ID'
  const counted = ['topup', 'withdraw', 'p2p_out', 'bank_transfer'].includes(type)
  if (counted && amount <= config.stepUp.perTransaction) return `Cần xác thực khuôn mặt vì tổng giao dịch hôm nay vượt ${formatVnd(config.stepUp.perDay)}`
  return `Cần xác thực khuôn mặt vì giao dịch trên ${formatVnd(counted ? config.stepUp.perTransaction : config.stepUp.paymentFace)}`
}

/** Standard confirm block: rows, auth line, and the "Xác nhận" path through gates → checks → auth → commit. */
export function useMoneyCommit(build: () => MoneyRequest & { fromSource?: boolean }, onDone: (t: Transaction) => void) {
  const [authOpen, setAuthOpen] = useState(false)
  const [error, setError] = useState<ReactNode>()
  const [busy, setBusy] = useState(false)
  const reqRef = useRef<ReturnType<typeof build> | null>(null)
  const start = () => {
    setError(undefined)
    const g = gateOf(getState().world)
    if (g) return setError(GATE_COPY[g].title)
    const req = build()
    const c = checkAmount(req.type, req.amount, { essential: req.essential, fromSource: req.fromSource })
    if (!c.ok) return setError(c.message)
    reqRef.current = req
    setAuthOpen(true)
  }
  const method = useMemo(() => (authOpen && reqRef.current ? authFor(reqRef.current.type, reqRef.current.amount) : 'pin'), [authOpen])
  const sheet = reqRef.current ? (
    <AuthSheet
      open={authOpen}
      onOpenChange={setAuthOpen}
      method={method}
      amount={reqRef.current.amount}
      onSuccess={async (m: AuthMethod) => {
        setAuthOpen(false)
        setBusy(true)
        const { fromSource: _ignored, ...req } = reqRef.current!
        void _ignored
        const t = await executeMoney({ ...req, authMethod: m })
        setBusy(false)
        onDone(t)
      }}
    />
  ) : null
  return { start, sheet, error, busy }
}

/* ── Result ───────────────────────────────────────────────────────── */

export const FAILURE_COPY: Record<FailureReason, string> = {
  bank_declined: 'Ngân hàng đã từ chối giao dịch.',
  recipient_bank_rejected: 'Ngân hàng nhận từ chối giao dịch. Kiểm tra lại số tài khoản.',
  timeout_reversed: 'Ngân hàng nhận không phản hồi kịp nên giao dịch đã được hủy.',
  biller_unavailable: 'Nhà cung cấp đang gián đoạn, chưa ghi nhận thanh toán.',
  merchant_cancelled: 'Cửa hàng đã hủy giao dịch.',
  system_busy: 'Hệ thống đang bận nên giao dịch chưa được thực hiện.',
}

/** The truth line (DESIGN.md signature): one plain statement of where a transaction is. */
export function truthLine(t: Transaction): string {
  if (t.status === 'pending') return `Đang xử lý · dự kiến xong trước ${fmtTime(pendingEta(t))}`
  if (t.status === 'failed') return t.reversedAt ? `Không thành công · Tiền đã hoàn về ví lúc ${fmtTime(t.reversedAt)}` : 'Không thành công · Tiền chưa bị trừ'
  if (t.status === 'refunded') return 'Đã hoàn tiền · tiền đã về ví'
  return `Thành công · ${fmtDateTime(t.updatedAt)}`
}

function StatusMark({ status }: { status: Transaction['status'] }) {
  const I = status === 'pending' ? Clock : status === 'failed' ? X : Check
  return (
    <Avatar aria-hidden className={"h-16 w-16 " + (status === 'failed' ? 'bg-destructive' : status === 'pending' ? 'bg-muted' : 'bg-success')}>
      <Ico as={I} size="xl" className={status === 'pending' ? 'text-foreground' : status === 'failed' ? 'text-primary-foreground' : 'text-success-foreground'} />
    </Avatar>
  )
}

export function ResultView({ txId, onRetry, extra, successHeading = 'Thành công' }: { txId: string; onRetry?: () => void; extra?: ReactNode; successHeading?: string }) {
  const w = useWorld()
  const t = w.transactions.find((x) => x.id === txId)
  if (!t) return <Text className="py-10 text-center text-muted-foreground">Không tìm thấy giao dịch.</Text>
  const heading = t.status === 'success' ? successHeading : t.status === 'pending' ? 'Đang xử lý' : t.status === 'failed' ? 'Không thành công' : 'Đã hoàn tiền'
  return (
    <VStack className="items-center pt-6">
      <StatusMark status={t.status} />
      <Heading as="h2" size="lg" role="status" className="mt-3 text-center">{heading}</Heading>
      {/* Same amount rule as every transaction row (rowAmount): signed, fee on outgoing, failed struck through. */}
      <Money amount={rowAmount(t)} sign={t.direction} struck={t.status === 'failed'} className="mt-2 text-4xl font-bold" />
      <Text className="mt-2 max-w-[40ch] text-center text-muted-foreground">{counterpartyName(t.counterparty, w)}{t.sourceId && t.type !== 'topup' ? ` · từ ${sourceLabel(w, t.sourceId)}` : ''}</Text>
      <Box className="mt-6 w-full">
        <ConfirmRows rows={[
          ['Trạng thái', truthLine(t)],
          ...(t.status === 'failed' && t.failureReason ? [['Lý do', FAILURE_COPY[t.failureReason]] as [string, ReactNode]] : []),
          ...(t.status === 'pending' ? [['Nếu không thành công', 'Tiền sẽ hoàn về ví.'] as [string, ReactNode]] : []),
          ['Thời gian', fmtDateTime(t.createdAt)],
          ...(t.fee ? [['Phí', <Fee amount={t.fee} />] as [string, ReactNode]] : []),
          ['Mã giao dịch', <Text className="tabular-nums">{t.id}</Text>],
        ]} />
      </Box>
      {extra}
      <VStack className="mt-6 w-full gap-2">
        {t.status === 'failed' && onRetry ? <Button block onClick={onRetry}>Thử lại</Button> : null}
        <ButtonLink to={`/history/${t.id}`} variant={t.status === 'failed' && onRetry ? 'secondary' : 'primary'} block>Xem chi tiết</ButtonLink>
        {t.status === 'failed' ? <ButtonLink to={`/support/new?tx=${t.id}`} variant="secondary" block>Liên hệ hỗ trợ</ButtonLink> : null}
        <ButtonLink to="/home" variant="ghost" block>Về trang chủ</ButtonLink>
      </VStack>
    </VStack>
  )
}

export { sourceLabel }
