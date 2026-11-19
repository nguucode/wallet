import { useEffect } from 'react'
import { useNavigate } from 'react-router'
import { config } from '@/domain/config'
import { fee } from '@/domain/fees'
import { formatVnd } from '@/domain/money'
import { bankById, defaultSource, freeUsed, gateOf, getState, pendingEta, useWorld } from '@/app/store'
import { Button, ButtonLink, cx, Money } from '@/components/app-ui'
import { Box } from '@/components/ui/box'
import { HStack } from '@/components/ui/hstack'
import { Text } from '@/components/ui/text'
import { VStack } from '@/components/ui/vstack'
import {
  authLine, AmountInput, checkAmount, ConfirmRows, FAILURE_COPY, feeLabel, FeeValue, FlowFrame, fmtTime, useCloseFlow, useFlow, useMoneyCommit,
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
            {commit.error ? <Text role="alert" size="sm" className="text-destructive">{commit.error}</Text> : null}
            <Button block loading={commit.busy} onClick={commit.start}>Xác nhận</Button>
          </>}>
          <ConfirmRows rows={[
            ['Số tiền', <Money amount={draft.amount} />],
            ['Phí', <FeeValue type="withdraw" amount={draft.amount} />],
            ['Về', <>{bankById(source.bankId).name}{'\n'}<Text size="sm" className="text-muted-foreground">{kindLabel(source.kind)} <Text size="sm" className="tabular-nums text-muted-foreground">{mask4(source.last4)}</Text></Text></>],
            ['Chủ tài khoản', w.customer.name.toUpperCase()],
          ]} />
          {/* Total separated by a 1px rule and bold (US-MNY-006 design notes). */}
          <HStack className="mt-3 items-baseline justify-between gap-4 border-t border-border pt-3">
            <Text className="font-bold">Tổng tiền trừ từ ví</Text>
            <Money amount={draft.amount + f} className="font-bold" />
          </HStack>
          <Text className="mt-3 text-muted-foreground">{authLine('withdraw', draft.amount)}</Text>
          {commit.busy ? <Text role="status" className="mt-2 text-muted-foreground">Đang gửi yêu cầu…</Text> : null}
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
  // Emphasised only when a fee applies for the first time this month (the last free slot is gone); no amber in the default theme.
  // A fee is a cost (red, bold the first time it applies this month); free withdrawals read green.
  const feeTone = f > 0 ? cx('text-destructive', used === config.fees.freeWithdrawPerMonth && 'font-semibold') : 'text-success'
  return (
    <>
      <FlowFrame title="Rút tiền" onClose={close} footer={<>
        {draft.amount > 0 && !error ? <Text aria-live="polite" className={feeTone}>{feeText(draft.amount)}</Text> : null}
        <Button block disabled={!draft.amount || !!error} onClick={() => go('confirm')}>Tiếp tục</Button>
      </>}>
        <SourcePicker label="Về" value={draft.sourceId} onChange={(id) => setDraft({ sourceId: id })} />
        <AmountInput
          value={draft.amount} onChange={(n) => setDraft({ amount: n })} quick={[500_000, 1_000_000, 2_000_000]}
          error={error}
          hint={<>Số dư khả dụng: <Text size="sm" className="tabular-nums text-muted-foreground">{formatVnd(w.balance)}</Text></>}
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
  const amount = <Money amount={t.amount + t.fee} sign="out" struck={t.status === 'failed'} className="text-3xl font-bold" />
  if (t.status === 'pending')
    return (
      <ResultBlock tone="pending" heading="Đang xử lý" amount={amount}>
        <Text className="text-muted-foreground">Ngân hàng đang xử lý, dự kiến xong trước {fmtTime(pendingEta(t))}.</Text>
        <Text className="text-muted-foreground">Nếu không thành công, tiền và phí sẽ hoàn về ví.</Text>
        <VStack role="list" aria-label="Tiến trình" className="mt-3 gap-2 text-left">
          {['Đã gửi yêu cầu', 'Ngân hàng đang xử lý', 'Tiền về tài khoản'].map((l, i) => (
            <HStack key={l} role="listitem" className="items-center gap-3">
              <Box aria-hidden className={cx('size-3 rounded-full', i === 0 ? 'bg-primary' : i === 1 ? 'bg-foreground' : 'border-2 border-border')} />
              <Text className={i === 1 ? 'font-semibold' : i === 2 ? 'text-muted-foreground' : ''}>{l}{i === 1 ? ' (hiện tại)' : i === 0 ? ' (xong)' : ''}</Text>
            </HStack>
          ))}
        </VStack>
      </ResultBlock>
    )
  if (t.status === 'failed') {
    const reason = t.failureReason === 'bank_declined' && src ? `${bankById(src.bankId).name} đã từ chối giao dịch.` : t.failureReason ? FAILURE_COPY[t.failureReason] : ''
    return (
      <ResultBlock tone="failed" heading="Rút tiền không thành công" amount={amount}>
        <Text className="text-muted-foreground">{reason}</Text>
        {t.reversedAt ? <Text className="text-muted-foreground">Tiền đã hoàn về ví lúc {fmtTime(t.reversedAt)}</Text> : null}
        <Text className="text-muted-foreground">Phí được hoàn và không tính vào lượt miễn phí.</Text>
      </ResultBlock>
    )
  }
  return (
    <ResultBlock tone="success" heading="Rút tiền thành công" amount={amount}>
      <Text className="text-muted-foreground">Tiền đã về {name}.</Text>
    </ResultBlock>
  )
}
