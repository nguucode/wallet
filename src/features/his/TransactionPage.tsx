import { Copy, FileText, LifeBuoy, MessageCircle, Printer, Repeat, Share2, X } from 'lucide-react'
import type { ReactNode } from 'react'
import { Link, Navigate, useNavigate, useParams, useSearchParams } from 'react-router'
import { config } from '@/domain/config'
import { formatVnd } from '@/domain/money'
import { useLayout } from '@/app/layout'
import { SampleBadge } from '@/app/Shell'
import { bankById, counterpartyName, now, pendingEta, sourceLabel, typeLabel, useWorld } from '@/app/store'
import type { Transaction, World } from '@/mock/seed'
import { NotFound } from '@/features/demo/NotFound'
import { ConfirmRows, FAILURE_COPY, fmtDateTime, fmtTime, maskAccount, maskPhone, truthLine } from '@/features/flow/FlowKit'
import { useGuard } from '@/features/sec/Gate'
import { Button, ButtonLink, cx, Money, STATUS_LABEL, StatusPill, WebBackLink } from '@/components/ui'
import { maskCode } from '@/features/bil/bills'
import { isWithinSupportWindow, receiptShareText, rowAmount, SUPPORT_STATUS_LABEL } from './history'
import { TxIcon, useToast } from './parts'

const AUTH_LABEL = { pin: 'Mã PIN', device_biometric: 'Sinh trắc học thiết bị', face_match: 'Khuôn mặt' } as const

/** Counterparty role label and masked identifier (US-HIS-002). */
function counterpartyRow(t: Transaction, w: World): [string, ReactNode] | null {
  const c = t.counterparty
  const name = counterpartyName(c, w)
  switch (c.kind) {
    case 'contact': return [t.direction === 'in' ? 'Người gửi' : 'Người nhận', `${name} · ${maskPhone(c.phone)}`]
    case 'bank': return ['Người nhận', `${name} · ${bankById(c.bankId).name} ${maskAccount(c.account)}`]
    case 'merchant': return ['Cửa hàng', name]
    case 'biller': {
      const code = w.bills.find((b) => b.id === c.billId)?.customerCode
      return ['Nhà cung cấp', code ? `${name} · ${maskCode(code)}` : name]
    }
    case 'source': return null
  }
}

function detailRows(t: Transaction, w: World): [string, ReactNode][] {
  const cp = counterpartyRow(t, w)
  return [
    ['Thời gian', fmtDateTime(t.createdAt)],
    ['Loại giao dịch', typeLabel(t.type)],
    ...(cp ? [cp] : []),
    ...(t.message ? [['Lời nhắn', t.message] as [string, ReactNode]] : []),
    ['Nguồn tiền', t.sourceId ? sourceLabel(w, t.sourceId).replace(' •••• ', ' ••••') : 'Số dư ví'],
    ['Phí', t.fee ? formatVnd(t.fee) : 'Miễn phí'],
    ['Tổng tiền', formatVnd(rowAmount(t))],
  ]
}

/* ── Timeline (object-model.md state machine) ─────────────────────── */

type Step = { label: string; lines: string[]; tone: 'done' | 'current' | 'failed' | 'upcoming' }
const PENDING_CAPABLE = ['bank_transfer', 'bill', 'withdraw']

export function timelineSteps(t: Transaction, refundTx?: Transaction): Step[] {
  const failed: Step = {
    label: STATUS_LABEL.failed, tone: 'failed',
    lines: [t.failureReason ? FAILURE_COPY[t.failureReason] : '', t.reversedAt ? `Tiền đã hoàn về ví lúc ${fmtTime(t.reversedAt)}` : 'Tiền chưa bị trừ khỏi ví'].filter(Boolean),
  }
  const done: Step = { label: STATUS_LABEL.success, tone: 'done', lines: [fmtDateTime(t.updatedAt)] }
  const refund: Step[] = t.status === 'refunded' ? [{ label: STATUS_LABEL.refunded, tone: 'done', lines: refundTx ? [`+${formatVnd(refundTx.amount)} · ${fmtDateTime(refundTx.createdAt)}`] : [] }] : []
  if (!PENDING_CAPABLE.includes(t.type)) return [t.status === 'failed' ? failed : { ...done, lines: [fmtDateTime(t.createdAt)] }, ...refund]
  const created: Step = { label: `Đã tạo · ${fmtTime(t.createdAt)}`, tone: 'done', lines: [] }
  if (t.status === 'pending')
    return [created, { label: STATUS_LABEL.pending, tone: 'current', lines: [`Dự kiến xong trước ${fmtTime(pendingEta(t))}`, 'Nếu không thành công, tiền sẽ tự hoàn về ví'] }, { label: 'Hoàn tất', tone: 'upcoming', lines: [] }]
  return [created, t.status === 'failed' ? failed : done, ...refund]
}

function Timeline({ steps }: { steps: Step[] }) {
  const dot = { done: 'bg-ink', current: 'bg-pending', failed: 'bg-danger', upcoming: 'border-2 border-line bg-surface' }
  return (
    <ol className="card p-inset" aria-label="Trạng thái giao dịch">
      {steps.map((s, i) => (
        <li key={i} className="relative flex gap-3 pb-stack last:pb-0">
          {i < steps.length - 1 ? <span aria-hidden className="absolute top-4 left-[5px] h-full w-0.5 bg-line" /> : null}
          <span aria-hidden className={cx('relative mt-header size-3 shrink-0 rounded-full', dot[s.tone])} />
          <div className="min-w-0">
            <p className={cx('font-semibold', s.tone === 'current' && 'text-pending', s.tone === 'failed' && 'text-danger', s.tone === 'upcoming' && 'font-normal text-muted')}>
              {s.label}{s.tone === 'upcoming' ? <span className="sr-only"> (chưa đến)</span> : null}
            </p>
            {s.lines.map((l) => <p key={l} className="text-[15px] leading-5 text-muted">{l}</p>)}
          </div>
        </li>
      ))}
    </ol>
  )
}

/* ── Receipt (US-HIS-003) ─────────────────────────────────────────── */

const PRINT_CSS = '@media print { body * { visibility: hidden !important; } #receipt, #receipt * { visibility: visible !important; color: #000 !important; } #receipt { position: absolute; inset: 0 auto auto 0; width: 100%; max-width: 480px; border-color: #000 !important; } }'

function Receipt({ t, w }: { t: Transaction; w: World }) {
  const layout = useLayout()
  const nav = useNavigate()
  const toast = useToast()
  const refundTx = t.refundedBy ? w.transactions.find((x) => x.id === t.refundedBy) : undefined
  if (t.status === 'failed') return <Navigate to={`/history/${t.id}`} replace />
  const cp = counterpartyRow(t, w)
  const canShare = typeof navigator !== 'undefined' && 'share' in navigator
  const link = `${location.origin}/history/${t.id}?view=receipt`
  const text = receiptShareText({ id: t.id, status: t.status, amount: rowAmount(t), typeLabel: typeLabel(t.type), counterparty: cp ? `${cp[0]}: ${cp[1]}` : '', time: fmtDateTime(t.createdAt), link })
  const share = async () => {
    if (canShare) { try { await navigator.share({ title: 'Biên lai giao dịch', text, url: link }) } catch { /* user cancelled */ } return }
    try { await navigator.clipboard.writeText(text); toast.show('Đã sao chép') } catch { toast.show('Không sao chép được') }
  }
  const close = () => nav(`/history/${t.id}`, { replace: true })
  return (
    <div className="pt-2">
      <style>{PRINT_CSS}</style>
      <div className="mb-stack flex items-center justify-between gap-2 print:hidden">
        <h1 tabIndex={-1} data-page-title className="text-[22px] leading-[28px] font-bold outline-none">Biên lai</h1>
        {layout === 'app' ? <button type="button" onClick={close} aria-label="Đóng" className="inline-flex size-11 items-center justify-center rounded-full hover:bg-surface-2"><X size={22} strokeWidth={1.75} aria-hidden /></button> : null}
      </div>
      <article id="receipt" aria-label="Biên lai giao dịch" className="mx-auto max-w-[420px] card p-inset">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="headline">Biên lai giao dịch</p>
            <p className="text-[15px] font-extrabold tracking-tight">Wallet</p>
          </div>
          <SampleBadge />
        </div>
        <div className="my-group text-center">
          <p className="amount-display">{formatVnd(rowAmount(t))}</p>
          <p className="mt-1 inline-flex items-center gap-2 font-semibold">
            <span aria-hidden className={cx('size-2 rounded-full', t.status === 'pending' ? 'bg-pending' : t.status === 'success' ? 'bg-success' : 'bg-ink')} />
            {STATUS_LABEL[t.status]}
          </p>
          {t.status === 'pending' ? <p className="mt-1 text-[15px] text-pending">Biên lai này chưa phải xác nhận cuối cùng</p> : null}
          {t.status === 'refunded' && refundTx ? <p className="mt-1 text-[15px]">Đã hoàn {formatVnd(refundTx.amount)} lúc {fmtDateTime(refundTx.createdAt)}</p> : null}
        </div>
        <ConfirmRows rows={[
          ['Mã giao dịch', <span className="tnum">{t.id}</span>],
          ['Thời gian', fmtDateTime(t.createdAt)],
          ...(cp ? [cp] : []),
          ['Lời nhắn', t.message ?? '—'],
          ['Phí', t.fee ? formatVnd(t.fee) : 'Miễn phí'],
          ['Tổng tiền', formatVnd(rowAmount(t))],
        ]} />
      </article>
      <div className="mx-auto mt-group flex max-w-[420px] flex-col gap-2 print:hidden">
        {layout === 'web' ? (
          <div className="flex gap-2">
            <Button onClick={() => window.print()}><Printer size={18} strokeWidth={1.75} aria-hidden />In biên lai</Button>
            <Button variant="secondary" onClick={close}>Đóng</Button>
          </div>
        ) : (
          <Button variant="ink" block onClick={share}><Share2 size={18} strokeWidth={1.75} aria-hidden />{canShare ? 'Chia sẻ' : 'Sao chép'}</Button>
        )}
      </div>
      {toast.node}
    </div>
  )
}

/* ── Detail (US-HIS-002) ──────────────────────────────────────────── */

function Action({ label, icon, onClick, to }: { label: string; icon: ReactNode; onClick?: () => void; to?: string }) {
  const layout = useLayout()
  if (layout === 'web') return to ? <ButtonLink to={to} variant="secondary">{icon}{label}</ButtonLink> : <Button variant="secondary" onClick={onClick}>{icon}{label}</Button>
  const inner = (
    <>
      <span aria-hidden className="inline-flex size-12 items-center justify-center rounded-full bg-surface-2 text-tint transition-colors group-hover:bg-primary-soft group-active:bg-primary-soft-hover">{icon}</span>
      <span className="text-[12px] leading-4 font-semibold whitespace-nowrap">{label}</span>
    </>
  )
  const cls = 'group flex min-w-20 flex-col items-center gap-header rounded-xl text-ink no-underline'
  return to ? <Link to={to} className={cls}>{inner}</Link> : <button type="button" onClick={onClick} className={cls}>{inner}</button>
}

export default function TransactionPage() {
  const { txId } = useParams()
  const [params] = useSearchParams()
  const layout = useLayout()
  const w = useWorld()
  const { guard, sheet } = useGuard()
  const toast = useToast()
  const t = w.transactions.find((x) => x.id === txId)
  if (!t) return <NotFound />
  if (params.get('view') === 'receipt') return <Receipt t={t} w={w} />

  const name = counterpartyName(t.counterparty, w)
  const refundTx = t.refundedBy ? w.transactions.find((x) => x.id === t.refundedBy) : undefined
  const original = t.refundOf ? w.transactions.find((x) => x.id === t.refundOf) : undefined
  const request = w.support.find((s) => s.transactionId === t.id)
  const inWindow = isWithinSupportWindow(t, now(), config.supportWindowDays)
  const supportTo = `/support/new?tx=${t.id}`

  const resendTo = (() => {
    const c = t.counterparty
    const extra = `&amount=${t.amount}${t.message ? `&message=${encodeURIComponent(t.message)}` : ''}`
    if (t.type === 'p2p_out' && c.kind === 'contact') return `/transfer/wallet?contact=${c.id}${extra}`
    if (t.type === 'bank_transfer' && c.kind === 'bank') {
      const r = w.bankRecipients.find((x) => x.bankId === c.bankId && x.account === c.account)
      return r ? `/transfer/bank?recipient=${r.id}${extra}` : '/transfer/bank'
    }
    return null
  })()

  const copyId = async () => { try { await navigator.clipboard.writeText(t.id); toast.show('Đã sao chép mã giao dịch') } catch { toast.show('Không sao chép được') } }
  const ic = { size: layout === 'app' ? 24 : 20, strokeWidth: 1.75, 'aria-hidden': true } as const // app tiles match Home shortcuts (48 disc, 24 glyph); web buttons keep 20

  const actions = (
    <div className={cx('flex gap-2', layout === 'web' ? 'flex-wrap' : 'card justify-around px-header py-inset')}>
      {t.status !== 'failed' ? <Action label="Biên lai" icon={<FileText {...ic} />} to={`/history/${t.id}?view=receipt`} /> : null}
      {!request ? <Action label="Liên hệ hỗ trợ" icon={<LifeBuoy {...ic} />} to={supportTo} /> : null}
      {resendTo ? <Action label="Chuyển lại" icon={<Repeat {...ic} />} onClick={() => guard(resendTo)} /> : null}
    </div>
  )

  const wrongRecipient = t.type === 'p2p_out' && t.status === 'success' ? (
    <section aria-labelledby="wr-title" className="rounded-[var(--radius-input)] bg-surface-2 p-inset">
      <h2 id="wr-title" className="font-semibold">Chuyển nhầm người nhận?</h2>
      <p className="mt-1 text-[15px] leading-5">Giao dịch chuyển tiền đã thành công không thể hủy hoặc thu hồi. Hãy nhắn người nhận để đề nghị chuyển trả.</p>
      <div className="mt-stack flex flex-wrap gap-2">
        {/* Placeholder deep link (rules.md#history-and-support): no chat in P0. */}
        <a href={`sms:${t.counterparty.kind === 'contact' ? t.counterparty.phone : ''}`} className="inline-flex h-11 items-center gap-2 rounded-full bg-ink px-4 text-[15px] font-semibold text-on-ink no-underline"><MessageCircle size={18} strokeWidth={1.75} aria-hidden />Nhắn người nhận</a>
        {!request ? <ButtonLink to={supportTo} variant="secondary" className="h-11">Liên hệ hỗ trợ</ButtonLink> : null}
      </div>
    </section>
  ) : null

  return (
    <div className="max-w-[560px]">
      {layout === 'web' ? <WebBackLink to="/history">Lịch sử</WebBackLink> : null}

      <header className="card flex flex-col items-center gap-2 px-inset py-group text-center">
        <TxIcon type={t.type} size={56} />
        <h1 tabIndex={-1} data-page-title className="mt-1 line-clamp-2 headline break-words outline-none">{name}</h1>
        <p className="-mt-1 text-[13px] text-muted">{typeLabel(t.type)}</p>
        <p className={cx('amount-display mt-1 break-all', t.status === 'failed' ? 'text-muted line-through' : t.direction === 'in' && 'text-success')}>
          <Money amount={rowAmount(t)} sign={t.direction} />
        </p>
        <StatusPill status={t.status} />
        <span className="text-[15px] text-muted">{t.status === 'success' ? fmtDateTime(t.updatedAt) : truthLine(t)}</span>
      </header>

      <div className="mt-group flex flex-col gap-4">
        {timelineSteps(t, refundTx).length > 1 ? <Timeline steps={timelineSteps(t, refundTx)} /> : null}

        {refundTx ? (
          <Link to={`/history/${refundTx.id}`} className="flex min-h-12 items-center justify-between gap-3 card px-inset py-stack text-ink no-underline hover:bg-surface-2">
            <span>Hoàn tiền · <span className="tnum text-success">{formatVnd(refundTx.amount, { sign: 'in' })}</span> · {fmtDateTime(refundTx.createdAt).split(' · ')[1]}</span>
            <span aria-hidden className="text-muted">›</span>
          </Link>
        ) : null}
        {original ? (
          <Link to={`/history/${original.id}`} className="flex min-h-12 items-center justify-between gap-3 card px-inset py-stack text-ink no-underline hover:bg-surface-2">
            <span>Hoàn tiền cho giao dịch <span className="tnum">{original.id}</span></span>
            <span aria-hidden className="text-muted">›</span>
          </Link>
        ) : null}

        {layout === 'app' ? <>{actions}{wrongRecipient}</> : null}

        <ConfirmRows rows={[
          ['Mã giao dịch', (
            <span className="inline-flex items-center gap-1">
              <span className="tnum">{t.id}</span>
              <button type="button" onClick={copyId} aria-label="Sao chép mã giao dịch" title="Sao chép" className="-my-2 -mr-2 inline-flex size-11 shrink-0 items-center justify-center rounded-full text-tint hover:bg-primary-soft"><Copy size={18} strokeWidth={1.75} aria-hidden /></button>
            </span>
          )],
          ...detailRows(t, w),
          ...(t.authMethod ? [['Xác thực bằng', AUTH_LABEL[t.authMethod]] as [string, ReactNode]] : []),
        ]} />

        {request ? (
          <p className="text-[15px]">Đã gửi yêu cầu hỗ trợ ngày {fmtDateTime(request.createdAt).split(' · ')[1]} · {SUPPORT_STATUS_LABEL[request.status]}</p>
        ) : !inWindow ? (
          <p className="text-[15px] text-muted">Giao dịch đã quá {config.supportWindowDays} ngày; yêu cầu hỗ trợ trực tuyến không còn mở.</p>
        ) : null}

        {layout === 'web' ? <>{wrongRecipient}{actions}</> : null}
      </div>
      {sheet}
      {toast.node}
    </div>
  )
}
