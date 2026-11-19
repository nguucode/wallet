import { Check, ChevronLeft, Clock, Delete, X } from 'lucide-react'
import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { Link, useNavigate, useSearchParams } from 'react-router'
import { requiredAuth } from '@/domain/auth'
import { config } from '@/domain/config'
import { fee } from '@/domain/fees'
import { checkLimit } from '@/domain/limits'
import { formatVnd, parseVndInput } from '@/domain/money'
import type { AuthMethod, TxType } from '@/domain/types'
import { useLayout } from '@/app/layout'
import {
  counterpartyName, dayCounter, executeMoney, freeUsed, gateOf, getState, pendingEta, sourceLabel, usage, useWorld,
  type MoneyRequest,
} from '@/app/store'
import type { FailureReason, Transaction } from '@/mock/seed'
import { AuthSheet } from '@/features/sec/AuthSheet'
import { GATE_COPY } from '@/features/sec/Gate'
import { Button, ButtonLink, Confirm, cx, BackButton, CloseButton, NavBar, Money } from '@/components/ui'

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

/** Flow page frame: app = full screen with header and sticky bottom bar; web = title + inline footer. */
export function FlowFrame({ title, onBack, onClose, footer, children, description }: {
  title: string; onBack?: () => void; onClose?: () => void; footer?: ReactNode; children: ReactNode; description?: ReactNode
}) {
  const layout = useLayout()
  if (layout === 'web')
    return (
      <div>
        {onBack ? <button type="button" onClick={onBack} className="-ml-2 mb-1 inline-flex h-9 items-center gap-0.5 rounded-full pr-3 pl-1 text-[15px] text-tint hover:bg-surface-2"><ChevronLeft size={22} strokeWidth={2.25} aria-hidden />Quay lại</button> : null}
        <div className="mb-6 flex items-start gap-2">
          <h1 tabIndex={-1} data-page-title className="large-title flex-1 outline-none">{title}</h1>
          {onClose ? <CloseButton onClick={onClose} /> : null}
        </div>
        {description ? <p className="-mt-4 mb-6 text-muted">{description}</p> : null}
        {/* One inset group for a plain step; a step that brings its own sections sits on the grouped background. */}
        <div className="[&:not(:has(.card))]:card [&:not(:has(.card))]:p-6">{children}</div>
        {footer ? <div className="mt-8 flex flex-col gap-2">{footer}</div> : null}
      </div>
    )
  return (
    <div className="relative isolate flex min-h-dvh flex-col">
      <div aria-hidden className="ambient pointer-events-none absolute -z-10 inset-x-0 top-0 h-[320px]" />
      <NavBar
        title={<h1 tabIndex={-1} data-page-title className="truncate outline-none">{title}</h1>}
        left={onBack ? <BackButton onClick={onBack} /> : <span className="w-11" />}
        right={onClose ? <CloseButton onClick={onClose} /> : <span className="w-11" />}
      />
      <main id="main" className="relative mx-auto w-full max-w-[560px] flex-1 px-4 pt-2 pb-6">
        {description ? <p className="mb-4 px-1 text-muted">{description}</p> : null}
        <div className="[&:not(:has(.card))]:card [&:not(:has(.card))]:p-5">{children}</div>
        {/* The app keypad portals here so it stands on its own below the card, like the system number pad. */}
        <div id="flow-keypad-slot" />
      </main>
      {footer ? <div className="sticky bottom-0 z-20 mx-auto flex w-full max-w-[560px] flex-col gap-2 border-t border-line/60 bg-ground/85 px-4 pt-3 pb-[max(16px,env(safe-area-inset-bottom))] backdrop-blur-xl">{footer}</div> : null}
    </div>
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
    return { ok: false, message: <>Số dư không đủ. Số dư khả dụng {formatVnd(w.balance)}{f ? `, phí ${formatVnd(f)}` : ''}. <Link to="/topup" className="font-semibold text-tint">Nạp tiền</Link></> }
  const lim = checkLimit(usage(w), type, amount, !!opts.essential)
  if (!lim.ok)
    return { ok: false, message: <>Vượt hạn mức {lim.pool === 'essential' ? 'thanh toán thiết yếu' : 'giao dịch'} tháng này. Còn lại {formatVnd(lim.remaining)}. <Link to="/me/limits" className="font-semibold text-tint">Xem hạn mức</Link></> }
  return { ok: true }
}

export function AmountInput({ value, onChange, error, label = 'Số tiền', quick = [100_000, 200_000, 500_000, 1_000_000], autoFocus = true, hint }: {
  value: number; onChange: (n: number) => void; error?: ReactNode; label?: string; quick?: number[]; autoFocus?: boolean; hint?: ReactNode
}) {
  const layout = useLayout()
  const shown = value ? value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.') : ''
  const set = (n: number) => { if (n <= 9_999_999_999) onChange(n) }
  return (
    <div>
      <label htmlFor="amount" className="mb-2 block text-center text-[15px] text-muted">{label}</label>
      <div className={cx('flex items-start justify-center border-b-2 pb-2', error ? 'border-danger' : 'border-line')}>
        <input
          id="amount" autoFocus={autoFocus && layout === 'web'} autoComplete="off" placeholder="0"
          // App: the wallet keypad below types; the system keyboard stays down. Web: the physical keyboard.
          inputMode={layout === 'app' ? 'none' : 'numeric'}
          value={shown}
          onChange={(e) => set(parseVndInput(e.target.value))}
          aria-invalid={!!error || undefined}
          aria-describedby="amount-msg"
          style={{ width: `${Math.max(1, shown.length || 1) * 0.62 + 0.2}em` }}
          className="amount-display max-w-full min-w-0 bg-transparent text-center outline-none placeholder:text-muted"
        />
        <span className="mt-1 ml-0.5 text-[17px] leading-6 font-semibold text-muted" aria-hidden>₫</span>
      </div>
      <p id="amount-msg" role={error ? 'alert' : undefined} className={cx('mt-2 min-h-5 text-center text-[13px] leading-5', error ? 'text-danger' : 'text-muted')}>{error ?? hint}</p>
      {quick.length ? (
        <div className="mt-3 flex flex-wrap justify-center gap-2">
          {quick.map((q) => (
            <button key={q} type="button" onClick={() => onChange(q)} className="h-9 rounded-full bg-surface-2 px-3.5 text-[13px] font-semibold text-primary-ink tnum hover:bg-primary-soft">{formatVnd(q).replace(' ₫', '')}</button>
          ))}
        </div>
      ) : null}
      {layout === 'app' ? <KeypadPortal value={value} onChange={set} /> : null}
    </div>
  )
}

function KeypadPortal(props: { value: number; onChange: (n: number) => void }) {
  const [slot, setSlot] = useState<HTMLElement | null>(null)
  useEffect(() => setSlot(document.getElementById('flow-keypad-slot')), [])
  const pad = <Keypad {...props} />
  return slot ? createPortal(pad, slot) : pad
}

/** Wallet keypad (app layout): system number-pad keys on the grouped background, with 000 for đồng amounts. */
export function Keypad({ value, onChange }: { value: number; onChange: (n: number) => void }) {
  const press = (k: string) => {
    if (k === 'del') return onChange(Math.floor(value / 10))
    const next = Number(String(value || '') + k)
    onChange(Number.isFinite(next) ? next : value)
  }
  const KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '000', '0', 'del']
  return (
    <div className="mt-4 px-1">
      <div className="grid grid-cols-3 gap-2" role="group" aria-label="Bàn phím số">
        {KEYS.map((k) => (
          <button
            key={k} type="button" onClick={() => press(k)}
            aria-label={k === 'del' ? 'Xóa một chữ số' : undefined}
            className="flex h-14 items-center justify-center rounded-[14px] bg-surface text-ink shadow-[0_1px_0_rgb(0_0_0/0.12)] active:bg-surface-2"
          >
            {k === 'del' ? <Delete size={24} strokeWidth={1.75} aria-hidden /> : <span className="text-[28px] leading-8 font-normal tnum">{k}</span>}
          </button>
        ))}
      </div>
    </div>
  )
}

/* ── Confirm (US-FND-007) ─────────────────────────────────────────── */

export function ConfirmRows({ rows }: { rows: [string, ReactNode][] }) {
  return (
    <dl className="divide-y divide-line-soft">
      {rows.map(([k, v]) => (
        <div key={k} className="flex items-start justify-between gap-4 py-3">
          <dt className="shrink-0 text-muted">{k}</dt>
          <dd className="min-w-0 text-right font-medium break-words">{v}</dd>
        </div>
      ))}
    </dl>
  )
}

export function feeLabel(type: TxType, amount: number) {
  const f = fee(type, amount, freeUsed(getState().world))
  if (f.amount) return formatVnd(f.amount)
  return f.freeLeft === null ? 'Miễn phí' : `Miễn phí (còn ${f.freeLeft} lượt trong tháng)`
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
  const tone = status === 'success' || status === 'refunded' ? 'bg-success-soft text-success' : status === 'pending' ? 'bg-pending-soft text-pending' : 'bg-danger-soft text-danger'
  const Icon = status === 'pending' ? Clock : status === 'failed' ? X : Check
  return (
    <span className={cx('inline-flex size-16 items-center justify-center rounded-full animate-[fade-in_200ms_ease-out]', tone)} aria-hidden>
      <Icon size={32} strokeWidth={2.25} />
    </span>
  )
}

export function ResultView({ txId, onRetry, extra, successHeading = 'Thành công' }: { txId: string; onRetry?: () => void; extra?: ReactNode; successHeading?: string }) {
  const w = useWorld()
  const t = w.transactions.find((x) => x.id === txId)
  if (!t) return <p className="py-10 text-center text-muted">Không tìm thấy giao dịch.</p>
  const heading = t.status === 'success' ? successHeading : t.status === 'pending' ? 'Đang xử lý' : t.status === 'failed' ? 'Không thành công' : 'Đã hoàn tiền'
  return (
    <div className="flex flex-col items-center pt-6 text-center">
      <StatusMark status={t.status} />
      <p role="status" className="mt-4 text-[17px] font-bold">{heading}</p>
      <p className="mt-2"><Money amount={t.amount + (t.status === 'failed' ? 0 : t.fee)} sign={t.direction} className="amount-display" /></p>
      <p className="mt-2 max-w-[40ch] text-muted">{counterpartyName(t.counterparty, w)}{t.sourceId && t.type !== 'topup' ? ` · từ ${sourceLabel(w, t.sourceId)}` : ''}</p>
      <div className="mt-6 w-full text-left">
        <ConfirmRows rows={[
          ['Trạng thái', truthLine(t)],
          ...(t.status === 'failed' && t.failureReason ? [['Lý do', FAILURE_COPY[t.failureReason]] as [string, ReactNode]] : []),
          ...(t.status === 'pending' ? [['Nếu không thành công', 'Tiền sẽ hoàn về ví.'] as [string, ReactNode]] : []),
          ['Thời gian', fmtDateTime(t.createdAt)],
          ...(t.fee ? [['Phí', formatVnd(t.fee)] as [string, ReactNode]] : []),
          ['Mã giao dịch', <span className="tnum">{t.id}</span>],
        ]} />
      </div>
      {extra}
      <div className="mt-6 flex w-full flex-col gap-2">
        {t.status === 'failed' && onRetry ? <Button block onClick={onRetry}>Thử lại</Button> : null}
        <ButtonLink to={`/history/${t.id}`} variant={t.status === 'failed' && onRetry ? 'secondary' : 'primary'} block>Xem chi tiết</ButtonLink>
        {t.status === 'failed' ? <ButtonLink to={`/support/new?tx=${t.id}`} variant="secondary" block>Liên hệ hỗ trợ</ButtonLink> : null}
        <ButtonLink to="/home" variant="ghost" block>Về trang chủ</ButtonLink>
      </div>
    </div>
  )
}

export { sourceLabel }
