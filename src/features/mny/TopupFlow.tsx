import { useEffect } from 'react'
import { useNavigate } from 'react-router'
import { formatVnd } from '@/domain/money'
import { bankById, defaultSource, gateOf, getState, useWorld } from '@/app/store'
import { Button, ButtonLink, cx, Money } from '@/components/app-ui'
import { Text } from '@/components/ui/text'
import { authLine, AmountInput, checkAmount, ConfirmRows, feeLabel, FlowFrame, formatPhone, useCloseFlow, useFlow, useMoneyCommit } from '@/features/flow/FlowKit'
import { GateCallout } from '@/features/sec/Gate'
import { kindLabel, mask4 } from './logic'
import { ResultBlock, SourcePicker } from './parts'

const STEPS = ['amount', 'confirm', 'result'] as const
type Draft = { amount: number; sourceId?: string; txId?: string }
const QUICK = [100_000, 500_000, 1_000_000, 2_000_000]

/** US-MNY-005. Gates at entry, then amount → confirm → step-up → result (instant: success or failed). */
export default function TopupFlow() {
  const w = useWorld()
  const nav = useNavigate()
  const { step, draft, setDraft, go, finish, clear } = useFlow<Draft>('topup', STEPS, { amount: 0, sourceId: defaultSource(getState().world)?.id })
  const { close, dialog } = useCloseFlow(draft.amount > 0 && step !== 'result', clear)
  // A finished draft must not leak into the next top-up.
  useEffect(() => { if (draft.txId && step !== 'result') setDraft({ amount: 0, txId: undefined, sourceId: defaultSource(getState().world)?.id }) }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const source = w.sources.find((s) => s.id === draft.sourceId) ?? defaultSource(w)
  const commit = useMoneyCommit(
    () => ({ type: 'topup', amount: draft.amount, counterparty: { kind: 'source', id: source!.id }, sourceId: source!.id, authMethod: 'pin', fromSource: true }),
    (t) => finish(t.id),
  )

  if (step === 'result' && draft.txId) {
    const t = w.transactions.find((x) => x.id === draft.txId)
    if (!t) return null
    const bankName = t.sourceId ? bankById(w.sources.find((s) => s.id === t.sourceId)?.bankId ?? 'vcb').name : 'Ngân hàng'
    const ok = t.status !== 'failed'
    const done = (to: string) => () => { clear(); nav(to) }
    return (
      <FlowFrame title="Nạp tiền" footer={ok ? <>
        <ButtonLink to={`/history/${t.id}`} block>Xem chi tiết</ButtonLink>
        <Button variant="secondary" block onClick={done('/home')}>Về trang chủ</Button>
      </> : <>
        <Button block onClick={() => go('confirm')}>Thử lại</Button>
        <ButtonLink to={`/history/${t.id}`} variant="secondary" block>Xem chi tiết</ButtonLink>
      </>}>
        <ResultBlock tone={ok ? 'success' : 'failed'} heading={ok ? 'Nạp tiền thành công' : 'Nạp tiền không thành công'} amount={<Money amount={t.amount} sign="in" tone={ok} className={cx('text-3xl font-bold', !ok && 'text-muted-foreground line-through')} />}>
          {ok ? <Text className="text-muted-foreground">Số dư khả dụng: <Text className="tabular-nums text-muted-foreground">{formatVnd(w.balance)}</Text></Text> : <Text className="text-muted-foreground">{bankName} đã từ chối giao dịch. Ví không bị trừ tiền.</Text>}
        </ResultBlock>
      </FlowFrame>
    )
  }

  // rules.md#gates: the gate shows at entry, before any amount is typed.
  const gate = gateOf(w)
  if (gate) return <FlowFrame title="Nạp tiền" onClose={close}><GateCallout gate={gate} /></FlowFrame>

  return (
    <>
      {step === 'confirm' && source ? (
        <FlowFrame title="Xác nhận nạp tiền" onBack={() => go('amount')} onClose={close}
          footer={<>
            {commit.error ? <Text role="alert" size="sm" className="text-destructive">{commit.error}</Text> : null}
            <Button block loading={commit.busy} onClick={commit.start}>Xác nhận</Button>
          </>}>
          <ConfirmRows rows={[
            ['Số tiền', <Money amount={draft.amount} />],
            ['Phí', feeLabel('topup', draft.amount)],
            ['Tổng tiền', <Money amount={draft.amount} className="font-bold" />],
            ['Từ', <>{bankById(source.bankId).name}{'\n'}<Text size="sm" className="text-muted-foreground">{kindLabel(source.kind)} <Text size="sm" className="tabular-nums text-muted-foreground">{mask4(source.last4)}</Text></Text></>],
            ['Đến', `Ví của bạn · ${formatPhone(w.customer.walletNumber)}`],
          ]} />
          <Text className="mt-3 text-muted-foreground">{authLine('topup', draft.amount)}</Text>
          {commit.busy ? <Text role="status" className="mt-2 text-muted-foreground">Đang gửi yêu cầu…</Text> : null}
        </FlowFrame>
      ) : (
        <AmountStep draft={draft} setDraft={setDraft} onNext={() => go('confirm')} onClose={close} balance={w.balance} />
      )}
      {commit.sheet}
      {dialog}
    </>
  )
}

function AmountStep({ draft, setDraft, onNext, onClose, balance }: { draft: Draft; setDraft: (p: Partial<Draft>) => void; onNext: () => void; onClose: () => void; balance: number }) {
  const check = draft.amount ? checkAmount('topup', draft.amount, { fromSource: true }) : null
  return (
    <FlowFrame title="Nạp tiền" onClose={onClose} footer={<Button block disabled={!check?.ok} onClick={onNext}>Tiếp tục</Button>}>
      <SourcePicker label="Từ" value={draft.sourceId} onChange={(id) => setDraft({ sourceId: id })} />
      <AmountInput
        value={draft.amount} onChange={(n) => setDraft({ amount: n })} quick={QUICK}
        error={check && !check.ok ? check.message : undefined}
        hint={<>Số dư khả dụng: <Text size="sm" className="tabular-nums text-muted-foreground">{formatVnd(balance)}</Text></>}
      />
    </FlowFrame>
  )
}
