import type { ReactNode } from 'react'
import { Link, useNavigate, useParams } from 'react-router'
import { formatVnd } from '@/domain/money'
import { now, usage, useWorld } from '@/app/store'
import { NotFound } from '@/features/demo/NotFound'
import { authLine, ConfirmRows, FlowFrame, fmtDate, feeLabel, ResultView, useFlow, useMoneyCommit } from '@/features/flow/FlowKit'
import { useGuard } from '@/features/sec/Gate'
import { Button, ButtonLink, Callout } from '@/components/ui'
import { billTx, BillChip } from './BillsPage'
import { billStatusOn, canPayBill, maskCode, overdueDays, periodLabel } from './bills'

const STEPS = ['view', 'confirm', 'auth', 'result'] as const
type Draft = { txId?: string }

export default function PayBillFlow() {
  const { billId = '' } = useParams()
  const w = useWorld()
  const nav = useNavigate()
  const flow = useFlow<Draft>(`bill-pay-${billId}`, STEPS, {})
  const { guard, sheet: gateSheet } = useGuard()
  const bill = w.bills.find((b) => b.id === billId)
  const biller = bill ? w.billers.find((b) => b.id === bill.billerId) : undefined
  const commit = useMoneyCommit(
    () => ({ type: 'bill', amount: bill!.amount, essential: biller!.essential, counterparty: { kind: 'biller', id: biller!.id, name: biller!.name, billId: bill!.id }, authMethod: 'pin' }),
    (t) => flow.finish(t.id),
  )
  if (!bill || !biller) return <NotFound />

  const exit = () => { flow.clear(); nav('/bills') }
  const at = now()
  const status = billStatusOn(bill, at)

  if (flow.step === 'result' && flow.draft.txId)
    return (
      <FlowFrame title="Thanh toán hóa đơn" onClose={exit}>
        <ResultView txId={flow.draft.txId} successHeading="Thanh toán thành công" onRetry={() => { flow.setDraft({ txId: undefined }); flow.go('view', { replace: true }) }} />
      </FlowFrame>
    )

  const detailRows = (): [string, ReactNode][] => [
    ['Nhà cung cấp', biller.name],
    ['Chủ hộ', <span className="break-words">{bill.holder || '—'}</span>],
    ['Mã khách hàng', <span className="tnum">{bill.customerCode}</span>],
    ['Kỳ', periodLabel(bill.period)],
    ['Hạn thanh toán', fmtDate(bill.dueDate + 'T12:00:00+07:00')],
  ]

  if (flow.step === 'confirm')
    return (
      <FlowFrame title="Xác nhận thanh toán" onBack={() => flow.go('view')} onClose={exit}
        footer={<Button block loading={commit.busy} onClick={commit.start}>Xác nhận</Button>}>
        <p className="text-[13px] font-medium text-muted">Số tiền</p>
        <p className="amount-display mb-6">{formatVnd(bill.amount)}</p>
        <ConfirmRows rows={[
          ['Phí', feeLabel('bill', bill.amount)],
          ['Tổng tiền', <span className="tnum">{formatVnd(bill.amount)}</span>],
          ['Nguồn tiền', 'Số dư ví'],
          ['Nhà cung cấp', <span className="break-words">{biller.name} · <span className="tnum">{maskCode(bill.customerCode)}</span></span>],
          ['Chủ hộ', <span className="break-words">{bill.holder || '—'}</span>],
        ]} />
        <p className="mt-4 text-[15px] text-muted">{authLine('bill', bill.amount)}</p>
        {commit.error ? <p role="alert" className="mt-3 text-danger">{commit.error}</p> : null}
        {commit.sheet}
      </FlowFrame>
    )

  /* view: balance and essential-limit checks run here (rules.md decisions), so "Thanh toán" is disabled with the reason. */
  const check = canPayBill(bill, at, w.balance, usage(w), biller.essential)
  const tx = billTx(w, bill.id)
  return (
    <FlowFrame title="Chi tiết hóa đơn" onBack={() => nav('/bills')}
      footer={status === 'due' || status === 'overdue' ? <Button block disabled={!check.ok} onClick={() => guard(() => flow.go('confirm'))}>Thanh toán</Button> : undefined}>
      <div className="flex items-center gap-2"><BillChip status={status} />{status === 'overdue' ? <span className="text-[15px] text-danger">Quá hạn {overdueDays(bill, at)} ngày</span> : null}</div>
      <p className="amount-display mt-2 mb-6">{formatVnd(bill.amount)}</p>
      <ConfirmRows rows={detailRows()} />

      <div className="mt-4">
        {status === 'settling' || status === 'paid' ? (
          <Callout tone={status === 'settling' ? 'pending' : 'neutral'} title={status === 'settling' ? 'Đang xử lý · Nhà cung cấp đang xác nhận' : 'Đã thanh toán'}
            action={tx ? <ButtonLink to={`/history/${tx.id}`} size="sm" variant="secondary">Xem giao dịch</ButtonLink> : undefined} />
        ) : !check.ok && check.reason === 'insufficient_balance' ? (
          <p role="alert" className="text-danger">Số dư không đủ, cần thêm {formatVnd(check.short)}. <Link to="/topup" className="font-semibold text-tint">Nạp tiền</Link></p>
        ) : !check.ok && check.reason === 'essential_limit' ? (
          <p role="alert" className="text-danger">Vượt hạn mức thanh toán thiết yếu tháng này, còn lại {formatVnd(check.remaining)}. <Link to="/me/limits" className="font-semibold text-tint">Xem hạn mức</Link></p>
        ) : <p className="text-[15px] text-muted">Thanh toán từ số dư ví · Miễn phí</p>}
      </div>
      {gateSheet}
    </FlowFrame>
  )
}
