import type { ReactNode } from 'react'
import { useNavigate, useParams } from 'react-router'
import { formatVnd } from '@/domain/money'
import { now, usage, useWorld } from '@/app/store'
import { NotFound } from '@/features/demo/NotFound'
import { authLine, ConfirmRows, FlowFrame, fmtDate, FeeValue, ResultView, useFlow, useMoneyCommit } from '@/features/flow/FlowKit'
import { useGuard } from '@/features/sec/Gate'
import { Button, ButtonLink, Callout, TextLink } from '@/components/app-ui'
import { Box } from '@/components/ui/box'
import { HStack } from '@/components/ui/hstack'
import { Text } from '@/components/ui/text'
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
    ['Chủ hộ', <Text className="break-words">{bill.holder || '—'}</Text>],
    ['Mã khách hàng', <Text className="tabular-nums">{bill.customerCode}</Text>],
    ['Kỳ', periodLabel(bill.period)],
    ['Hạn thanh toán', fmtDate(bill.dueDate + 'T12:00:00+07:00')],
  ]

  if (flow.step === 'confirm')
    return (
      <FlowFrame title="Xác nhận thanh toán" onBack={() => flow.go('view')} onClose={exit}
        footer={<Button block loading={commit.busy} onClick={commit.start}>Xác nhận</Button>}>
        <Text size="sm" className="font-medium text-muted-foreground">Số tiền</Text>
        <Text size="4xl" bold className="mb-6 tabular-nums">{formatVnd(bill.amount)}</Text>
        <ConfirmRows rows={[
          ['Phí', <FeeValue type="bill" amount={bill.amount} />],
          ['Tổng tiền', <Text className="tabular-nums">{formatVnd(bill.amount)}</Text>],
          ['Nguồn tiền', 'Số dư ví'],
          ['Nhà cung cấp', <Text className="break-words">{biller.name} · <Text className="tabular-nums">{maskCode(bill.customerCode)}</Text></Text>],
          ['Chủ hộ', <Text className="break-words">{bill.holder || '—'}</Text>],
        ]} />
        <Text className="mt-3 text-muted-foreground">{authLine('bill', bill.amount)}</Text>
        {commit.error ? <Text role="alert" className="mt-3 text-destructive">{commit.error}</Text> : null}
        {commit.sheet}
      </FlowFrame>
    )

  /* view: balance and essential-limit checks run here (rules.md decisions), so "Thanh toán" is disabled with the reason. */
  const check = canPayBill(bill, at, w.balance, usage(w), biller.essential)
  const tx = billTx(w, bill.id)
  return (
    <FlowFrame title="Chi tiết hóa đơn" onBack={() => nav('/bills')}
      footer={status === 'due' || status === 'overdue' ? <Button block disabled={!check.ok} onClick={() => guard(() => flow.go('confirm'))}>Thanh toán</Button> : undefined}>
      <HStack className="items-center gap-2"><BillChip status={status} />{status === 'overdue' ? <Text className="text-destructive">Quá hạn {overdueDays(bill, at)} ngày</Text> : null}</HStack>
      <Text size="4xl" bold className="mt-2 mb-6 tabular-nums">{formatVnd(bill.amount)}</Text>
      <ConfirmRows rows={detailRows()} />

      <Box className="mt-3">
        {status === 'settling' || status === 'paid' ? (
          <Callout tone={status === 'settling' ? 'pending' : 'neutral'} title={status === 'settling' ? 'Đang xử lý · Nhà cung cấp đang xác nhận' : 'Đã thanh toán'}
            action={tx ? <ButtonLink to={`/history/${tx.id}`} size="sm" variant="secondary">Xem giao dịch</ButtonLink> : undefined} />
        ) : !check.ok && check.reason === 'insufficient_balance' ? (
          <Text role="alert" className="text-destructive">Số dư không đủ, cần thêm {formatVnd(check.short)}. <TextLink to="/topup">Nạp tiền</TextLink></Text>
        ) : !check.ok && check.reason === 'essential_limit' ? (
          <Text role="alert" className="text-destructive">Vượt hạn mức thanh toán thiết yếu tháng này, còn lại {formatVnd(check.remaining)}. <TextLink to="/me/limits">Xem hạn mức</TextLink></Text>
        ) : <Text className="text-muted-foreground">Thanh toán từ số dư ví · Miễn phí</Text>}
      </Box>
      {gateSheet}
    </FlowFrame>
  )
}
