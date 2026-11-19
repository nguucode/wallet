import { useEffect } from 'react'
import { useNavigate } from 'react-router'
import { config } from '@/domain/config'
import { fee } from '@/domain/fees'
import { formatVnd } from '@/domain/money'
import { bankById, defaultSource, freeUsed, gateOf, getState, pendingEta, useWorld } from '@/app/store'
import { Button, ButtonLink, cx, Money } from '@/components/ui'
import {
  authLine, AmountInput, checkAmount, ConfirmRows, FAILURE_COPY, feeLabel, FlowFrame, fmtTime, useCloseFlow, useFlow, useMoneyCommit,
} from '@/features/flow/FlowKit'
import { GateCallout } from '@/features/sec/Gate'
import type { Transaction } from '@/mock/seed'
import { kindLabel, mask4, maxWithdrawable } from './logic'
import { ResultBlock, SourcePicker } from './parts'

const STEPS = ['amount', 'confirm', 'result'] as const
type Draft = { amount: number; sourceId?: string; txId?: string }

/** "Miễn phí (còn N lượt trong tháng)" or "Phí 25.000 ₫" (rules.md#fees). */
const feeText = (amount: number) => { const l = feeLabel('withdraw', amount); return l.startsWith('Miễn phí') ? l : `Phí ${l}` }

/** US-MNY-006 (amount, fee, confirm) and US-MNY-007 (result that follows the transaction live). */
export default function WithdrawFlow() {
  const w = useWorld()
  const nav = useNavigate()
  const { step, draft, setDraft, go, finish, clear } = useFlow<Draft>('withdraw', STEPS, { amount: 0, sourceId: defaultSource(getState().world)?.id })
  const { close, dialog } = useCloseFlow(draft.amount > 0 && step !== 'result', clear)
  useEffect(() => { if (draft.txId && step !== 'result') setDraft({ amount: 0, txId: undefined, sourceId: defaultSource(getState().world)?.id }) }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const source = w.sources.find((s) => s.id === draft.sourceId) ?? defaultSource(w)
  const commit = useMoneyCommit(
    () => ({ type: 'withdraw', amount: draft.amount, counterparty: { kind: 'source', id: source!.id }, sourceId: source!.id, authMethod: 'pin' }),
    (t) => finish(t.id),
  )

  if (step === 'result' && draft.txId) {
    const t = w.transactions.find((x) => x.id === draft.txId)
    if (!t) return null
    const done = (to: string) => () => { clear(); nav(to) }
    return (
      <FlowFrame title="Rút tiền" footer={<>
        <ButtonLink to={`/history/${t.id}`} block>Xem chi tiết</ButtonLink>
        <Button variant="secondary" block onClick={done('/home')}>Về trang chủ</Button>
      </>}>
        <WithdrawResult t={t} />
      </FlowFrame>
    )
  }

  const gate = gateOf(w)
  if (gate) return <FlowFrame title="Rút tiền" onClose={close}><GateCallout gate={gate} /></FlowFrame>

  if (step === 'confirm' && source) {
    const f = fee('withdraw', draft.amount, freeUsed(w)).amount
    return (
      <>
        <FlowFrame title="Xác nhận rút tiền" onBack={() => go('amount')} onClose={close}
          footer={<>
            {commit.error ? <p role="alert" className="text-[13px] text-danger">{commit.error}</p> : null}
            <Button block loading={commit.busy} onClick={commit.start}>Xác nhận</Button>
          </>}>
          <ConfirmRows rows={[
            ['Số tiền', <Money amount={draft.amount} />],
            ['Phí', feeText(draft.amount)],
            ['Về', <>{bankById(source.bankId).name}<br /><span className="text-[13px] text-muted">{kindLabel(source.kind)} <span className="tnum">{mask4(source.last4)}</span></span></>],
            ['Chủ tài khoản', w.customer.name.toUpperCase()],
          ]} />
          {/* Total separated by a 1px rule and bold (US-MNY-006 design notes). */}
          <div className="mt-stack flex items-baseline justify-between gap-4 border-t border-line px-4 pt-3">
            <span className="font-bold">Tổng tiền trừ từ ví</span>
            <Money amount={draft.amount + f} className="font-bold" />
          </div>
          <p className="mt-stack text-[15px] text-muted">{authLine('withdraw', draft.amount)}</p>
          {commit.busy ? <p role="status" className="mt-header text-[15px] text-muted">Đang gửi yêu cầu…</p> : null}
        </FlowFrame>
        {commit.sheet}
        {dialog}
      </>
    )
  }

  const used = freeUsed(w)
  const f = draft.amount ? fee('withdraw', draft.amount, used).amount : 0
  const over = draft.amount > 0 && draft.amount + f > w.balance
  const check = draft.amount && !over ? checkAmount('withdraw', draft.amount) : null
  const error = over ? `Số dư khả dụng không đủ. Bạn rút được tối đa ${formatVnd(maxWithdrawable(w.balance, used))}.` : check && !check.ok ? check.message : undefined
  // Amber only when a fee applies for the first time this month (the last free slot is gone).
  const feeTone = f > 0 && used === config.fees.freeWithdrawPerMonth ? 'text-pending' : 'text-muted'
  return (
    <>
      <FlowFrame title="Rút tiền" onClose={close} footer={<>
        {draft.amount > 0 && !error ? <p aria-live="polite" className={cx('text-[15px]', feeTone)}>{feeText(draft.amount)}</p> : null}
        <Button block disabled={!draft.amount || !!error} onClick={() => go('confirm')}>Tiếp tục</Button>
      </>}>
        <SourcePicker label="Về" value={draft.sourceId} onChange={(id) => setDraft({ sourceId: id })} />
        <AmountInput
          value={draft.amount} onChange={(n) => setDraft({ amount: n })} quick={[500_000, 1_000_000, 2_000_000]}
          error={error}
          hint={<>Số dư khả dụng: <span className="tnum">{formatVnd(w.balance)}</span></>}
        />
      </FlowFrame>
      {dialog}
    </>
  )
}

/** Subscribes through useWorld, so Demo "Resolve pending" updates it in place. */
function WithdrawResult({ t }: { t: Transaction }) {
  const w = useWorld()
  const src = w.sources.find((s) => s.id === t.sourceId)
  const name = src ? `${bankById(src.bankId).name} ${mask4(src.last4)}` : 'tài khoản của bạn'
  const amount = <Money amount={t.amount} className={t.amount >= 100_000_000 ? 'text-[28px] leading-[34px] font-bold' : 'amount-display'} />
  if (t.status === 'pending')
    return (
      <ResultBlock tone="pending" heading="Đang xử lý" amount={amount}>
        <p>Ngân hàng đang xử lý, dự kiến xong trước {fmtTime(pendingEta(t))}.</p>
        <p>Nếu không thành công, tiền và phí sẽ hoàn về ví.</p>
        <ol aria-label="Tiến trình" className="mt-stack flex flex-col gap-2 text-left text-ink">
          {['Đã gửi yêu cầu', 'Ngân hàng đang xử lý', 'Tiền về tài khoản'].map((l, i) => (
            <li key={l} className="flex items-center gap-3">
              <span aria-hidden className={cx('size-3 rounded-full', i === 0 ? 'bg-success' : i === 1 ? 'bg-pending' : 'border-2 border-line')} />
              <span className={i === 1 ? 'font-semibold text-pending' : i === 2 ? 'text-muted' : ''}>{l}{i === 1 ? ' (hiện tại)' : i === 0 ? ' (xong)' : ''}</span>
            </li>
          ))}
        </ol>
      </ResultBlock>
    )
  if (t.status === 'failed') {
    const reason = t.failureReason === 'bank_declined' && src ? `${bankById(src.bankId).name} đã từ chối giao dịch.` : t.failureReason ? FAILURE_COPY[t.failureReason] : ''
    return (
      <ResultBlock tone="failed" heading="Rút tiền không thành công" amount={amount}>
        <p>{reason}</p>
        {t.reversedAt ? <p>Tiền đã hoàn về ví lúc {fmtTime(t.reversedAt)}</p> : null}
        <p>Phí được hoàn và không tính vào lượt miễn phí.</p>
      </ResultBlock>
    )
  }
  return (
    <ResultBlock tone="success" heading="Rút tiền thành công" amount={amount}>
      <p>Tiền đã về {name}.</p>
    </ResultBlock>
  )
}
