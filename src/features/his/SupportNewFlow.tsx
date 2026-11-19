import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router'
import { config } from '@/domain/config'
import { formatVnd } from '@/domain/money'
import { createSupportRequest, now, useWorld } from '@/app/store'
import type { SupportRequest, Transaction } from '@/mock/seed'
import { ConfirmRows, FlowFrame, fmtDateTime, formatPhone, useCloseFlow, useFlow } from '@/features/flow/FlowKit'
import { Button, ButtonLink, Callout, cx, Field, TextInput } from '@/components/ui'
import { isWithinSupportWindow, REASON_LABEL, reasonsFor, rowAmount, SUPPORT_STATUS_LABEL, TX_REASONS, validateDescription, type Reason } from './history'

const STEPS = ['reason', 'details', 'sent'] as const
type Draft = { txId?: string; reason?: Reason; details: string; phone: string; sent?: SupportRequest }

function Summary({ t }: { t: Transaction }) {
  return (
    <div className="mb-group">
      <ConfirmRows rows={[
        ['Mã giao dịch', <span className="tnum">{t.id}</span>],
        ['Số tiền', <span className="tnum">{formatVnd(rowAmount(t))}</span>],
        ['Thời gian', fmtDateTime(t.createdAt)],
      ]} />
    </div>
  )
}

export default function SupportNewFlow() {
  const w = useWorld()
  const nav = useNavigate()
  const [params] = useSearchParams()
  const txParam = params.get('tx') ?? params.get('txId') ?? undefined
  const t = txParam ? w.transactions.find((x) => x.id === txParam) : undefined
  const flow = useFlow<Draft>('support-new', STEPS, { txId: txParam, details: '', phone: w.customer.phone })
  // A draft left over from another transaction never leaks into this one.
  const draft: Draft = flow.draft.txId === txParam ? flow.draft : { txId: txParam, details: '', phone: w.customer.phone }
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string>()
  const backTo = t ? `/history/${t.id}` : '/support'
  const { close, dialog } = useCloseFlow(!!draft.details && flow.step !== 'sent', flow.clear, backTo)

  if (txParam && !t)
    return (
      <FlowFrame title="Liên hệ hỗ trợ" onClose={() => nav('/history')}>
        <Callout title="Không tìm thấy giao dịch" action={<ButtonLink to="/history" size="sm">Mở Lịch sử</ButtonLink>} />
      </FlowFrame>
    )

  const existing = t ? w.support.find((s) => s.transactionId === t.id && s.id !== draft.sent?.id) : undefined
  if (t && existing && !busy)
    return (
      <FlowFrame title="Liên hệ hỗ trợ" onClose={() => nav(backTo)}>
        <Summary t={t} />
        <Callout title="Giao dịch này đã có yêu cầu hỗ trợ" action={<ButtonLink to={backTo} size="sm" variant="secondary">Về giao dịch</ButtonLink>}>
          Mã yêu cầu <span className="tnum font-semibold">{existing.id}</span> · {SUPPORT_STATUS_LABEL[existing.status]}
        </Callout>
      </FlowFrame>
    )

  const locked = !!t && !isWithinSupportWindow(t, now(), config.supportWindowDays)
  const lockedNote = locked ? <p role="status" className="mb-stack rounded-[16px] bg-surface-2 p-inset text-[15px] leading-5">Giao dịch đã quá {config.supportWindowDays} ngày nên không thể gửi yêu cầu hỗ trợ trực tuyến</p> : null

  /* sent */
  if (flow.step === 'sent' && draft.sent)
    return (
      <FlowFrame title="Liên hệ hỗ trợ" footer={<ButtonLink to={backTo} block>{t ? 'Về giao dịch' : 'Về Trợ giúp'}</ButtonLink>}>
        <div className="flex flex-col items-center pt-group text-center">
          <p role="status" className="text-[17px] font-bold">Đã gửi yêu cầu hỗ trợ</p>
          <p className="mt-header">Mã yêu cầu <span className="tnum font-semibold">{draft.sent.id}</span></p>
          <p className="mt-1 text-muted">Thời gian xử lý tối đa 30 ngày làm việc</p>
        </div>
      </FlowFrame>
    )

  /* details */
  if (flow.step === 'details' && draft.reason) {
    const invalid = validateDescription(draft.details)
    const n = draft.details.trim().length
    const submit = async () => {
      setError(undefined)
      setBusy(true)
      try {
        const req = await createSupportRequest({ transactionId: t?.id, reason: draft.reason!, details: draft.details.trim() })
        flow.setDraft({ ...draft, sent: req })
        flow.go('sent', { replace: true })
      } catch {
        setError('Không gửi được yêu cầu. Thử lại')
      } finally { setBusy(false) }
    }
    return (
      <FlowFrame title="Liên hệ hỗ trợ" onBack={() => flow.go('reason')} onClose={close}
        footer={<Button block loading={busy} disabled={!!invalid || locked} onClick={submit}>Gửi yêu cầu</Button>}>
        {t ? <Summary t={t} /> : null}
        {lockedNote}
        {draft.reason === 'wrong_recipient' && t?.type === 'p2p_out' && t.status === 'success' ? (
          <div className="mb-group rounded-[16px] bg-surface-2 p-inset">
            <p className="font-semibold">Ví không thể tự hủy giao dịch đã thành công</p>
            <a href={`sms:${t.counterparty.kind === 'contact' ? t.counterparty.phone : ''}`} className="mt-header inline-flex min-h-11 items-center font-semibold text-tint">Nhắn người nhận</a>
          </div>
        ) : null}
        <p className="mb-stack text-[15px] text-muted">Lý do: <span className="font-medium text-ink">{REASON_LABEL[draft.reason]}</span></p>
        <Field label="Mô tả vấn đề" htmlFor="sp-details">
          <textarea
            id="sp-details" disabled={locked} rows={5} maxLength={600} aria-required aria-describedby="sp-count"
            value={draft.details} onChange={(e) => flow.setDraft({ ...draft, details: e.target.value })}
            className="field-sizing-content min-h-32 w-full rounded-[12px] border border-line bg-surface px-4 py-3 text-[15px] disabled:bg-surface-2"
          />
          <p id="sp-count" className={cx('mt-header text-right text-[13px] tnum', n > 500 ? 'text-danger' : 'text-muted')}>{n}/500 · tối thiểu 20 ký tự</p>
        </Field>
        <Field label="Số điện thoại liên hệ" htmlFor="sp-phone">
          <TextInput id="sp-phone" disabled={locked} inputMode="tel" value={formatPhone(draft.phone)} onChange={(e) => flow.setDraft({ ...draft, phone: e.target.value.replace(/\D/g, '').slice(0, 10) })} />
        </Field>
        {error ? <p role="alert" className="text-danger">{error}</p> : null}
        {dialog}
      </FlowFrame>
    )
  }

  /* reason */
  const reasons = reasonsFor(t)
  const needsTx = !t && draft.reason && TX_REASONS.includes(draft.reason)
  return (
    <FlowFrame title="Liên hệ hỗ trợ" onClose={close}
      footer={<Button block disabled={!draft.reason || !!needsTx || locked} onClick={() => { flow.setDraft(draft); flow.go('details') }}>Tiếp tục</Button>}>
      {t ? <Summary t={t} /> : null}
      {lockedNote}
      <fieldset disabled={locked}>
        <legend className="mb-stack font-semibold">Bạn gặp vấn đề gì?</legend>
        <div className="divide-y divide-line-soft card">
          {reasons.map((r) => (
            <label key={r} className="flex min-h-12 cursor-pointer items-center gap-3 px-4 py-3 has-disabled:cursor-not-allowed">
              <input type="radio" name="reason" value={r} checked={draft.reason === r} onChange={() => flow.setDraft({ ...draft, reason: r })} className="size-5 accent-tint" />
              <span>{REASON_LABEL[r]}</span>
            </label>
          ))}
        </div>
      </fieldset>
      {needsTx ? (
        <p role="status" className="mt-stack rounded-[16px] bg-surface-2 p-inset text-[15px] leading-5">
          Hãy mở giao dịch trong Lịch sử và chọn Liên hệ hỗ trợ để gửi yêu cầu về giao dịch đó. <Link to="/history" className="font-semibold text-tint">Mở Lịch sử</Link>
        </p>
      ) : null}
      {dialog}
    </FlowFrame>
  )
}
