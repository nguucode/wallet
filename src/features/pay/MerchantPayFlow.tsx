import { useEffect, useState, type ReactNode } from 'react'
import { useNavigate, useSearchParams } from 'react-router'
import { useLayout } from '@/app/layout'
import { getState, useWorld } from '@/app/store'
import { formatVnd } from '@/domain/money'
import { parseQr } from '@/domain/qr'
import { GatedRoute } from '@/features/sec/Gate'
import { AmountInput, checkAmount, ConfirmRows, FlowFrame, ResultView, useCloseFlow, useFlow, useMoneyCommit } from '@/features/flow/FlowKit'
import { Button, ButtonLink, Callout, Card, Disc, Money } from '@/components/app-ui'
import { Box } from '@/components/ui/box'
import { Heading } from '@/components/ui/heading'
import { HStack } from '@/components/ui/hstack'
import { Spinner } from '@/components/ui/spinner'
import { Text } from '@/components/ui/text'
import { VStack } from '@/components/ui/vstack'
import { AuthNote, useWakeLock } from '@/features/trf/shared'

type Draft = { merchantId?: string; name?: string; category?: string; amount: number; fixed?: boolean; txId?: string }
const STEPS = ['amount', 'confirm', 'result'] as const

export function MerchantHeader({ name, category }: { name: string; category?: string }) {
  return (
    <Card className="mb-6">
      <HStack className="items-center gap-3">
        <Disc><Text bold>{(category ?? name).charAt(0)}</Text></Disc>
        <VStack className="min-w-0">
          <Text bold className="break-words">{name}</Text>
          <Text size="sm" className="text-muted-foreground">{category ? `${category} · Hà Nội` : 'Hà Nội'}</Text>
        </VStack>
      </HStack>
    </Card>
  )
}

export default function MerchantPayFlow() {
  const nav = useNavigate()
  const [params] = useSearchParams()
  const flow = useFlow<Draft>('pay-merchant', STEPS, { amount: 0 })
  const { step, draft, setDraft, go, clear } = flow
  const [invalid, setInvalid] = useState(false)
  const { close, dialog } = useCloseFlow(draft.amount > 0 && !draft.fixed, clear, '/home')

  // Read ?qr= once, keep the merchant in the draft, drop the param (US-PAY-003 FE notes).
  useEffect(() => {
    const qr = params.get('qr')
    if (qr === null) return // no draft merchant → the invalid-QR state below
    const p = parseQr(qr)
    if (p.kind !== 'merchant') { setInvalid(true); nav('/pay/merchant', { replace: true }); return }
    const m = getState().world.merchants.find((x) => x.id === p.merchantId)
    const amount = p.amount ?? 0
    setDraft({ merchantId: p.merchantId, name: m?.name ?? p.name, category: m?.category, amount, fixed: amount > 0, txId: undefined })
    nav(`/pay/merchant?step=${amount > 0 ? 'confirm' : 'amount'}`, { replace: true })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  useEffect(() => { if (step === 'result') clear() }, [step, clear])

  let body: ReactNode
  if (invalid || (!draft.merchantId && step !== 'result'))
    body = <Callout tone="danger" title="Mã QR không hợp lệ. Hãy quét lại." action={<ButtonLink to="/pay/scan" size="sm">Quét lại</ButtonLink>} />
  else if (step === 'amount') body = <AmountStep draft={draft} setDraft={setDraft} onNext={() => go('confirm')} />
  else if (step === 'confirm') body = <ConfirmStep draft={draft} toAmount={() => go('amount')} onDone={(id) => flow.finish(id)} />
  else body = draft.txId ? <Result txId={draft.txId} onRetry={() => go('confirm')} /> : null

  const back = step === 'confirm' && !draft.fixed ? () => go('amount') : step === 'result' ? undefined : () => nav('/pay/scan')
  return (
    <GatedRoute>
      <FlowFrame title="Thanh toán" onBack={back} onClose={step === 'result' ? undefined : close}>{body}</FlowFrame>
      {dialog}
    </GatedRoute>
  )
}

function AmountStep({ draft, setDraft, onNext }: { draft: Draft; setDraft: (p: Partial<Draft>) => void; onNext: () => void }) {
  const w = useWorld()
  const check = draft.amount > 0 ? checkAmount('qr_merchant', draft.amount) : null
  return (
    <>
      <MerchantHeader name={draft.name!} category={draft.category} />
      <AmountInput value={draft.amount} onChange={(amount) => setDraft({ amount })} error={check && !check.ok ? check.message : undefined} hint={<>Số dư khả dụng: <Text className="tabular-nums">{formatVnd(w.balance)}</Text></>} />
      <Box className="mt-8"><Button block disabled={!check?.ok} onClick={onNext}>Tiếp tục</Button></Box>
    </>
  )
}

function ConfirmStep({ draft, toAmount, onDone }: { draft: Draft; toAmount: () => void; onDone: (id: string) => void }) {
  useWorld() // re-check when balance or limits change
  const check = checkAmount('qr_merchant', draft.amount)
  const commit = useMoneyCommit(
    () => ({ type: 'qr_merchant', amount: draft.amount, counterparty: { kind: 'merchant', id: draft.merchantId!, name: draft.name! }, authMethod: 'pin' }),
    (t) => onDone(t.id),
  )
  if (commit.busy)
    return (
      <VStack role="status" aria-live="polite" className="items-center py-16">
        <Spinner aria-hidden />
        <Text className="mt-3 font-semibold">Đang thanh toán…</Text>
        <Money amount={draft.amount} className="mt-1 text-4xl font-bold" />
        <Text className="mt-1 text-center text-muted-foreground">{draft.name}</Text>
      </VStack>
    )
  return (
    <>
      <MerchantHeader name={draft.name!} category={draft.category} />
      <Heading size="lg" as="h2" className="mb-3">Xác nhận</Heading>
      <VStack className="mb-3 items-center gap-1">
        <Money amount={draft.amount} className="text-4xl font-bold" />
        {draft.fixed ? <Text size="sm" className="text-center text-muted-foreground">Số tiền do cửa hàng đặt</Text> : null}
      </VStack>
      <ConfirmRows rows={[
        ['Cửa hàng', <Text className="break-words">{draft.name}</Text>],
        ['Số tiền', <Money amount={draft.amount} />],
        ['Phí', 'Miễn phí'],
        ['Tổng tiền', <Money amount={draft.amount} className="font-bold" />],
        ['Nguồn tiền', 'Ví'],
      ]} />
      <AuthNote type="qr_merchant" amount={draft.amount} />
      {draft.fixed && !check.ok ? <Text size="sm" role="alert" className="mt-3 text-destructive">{check.message}</Text> : null}
      {commit.error ? <Text size="sm" role="alert" className="mt-3 text-destructive">{commit.error}</Text> : null}
      <VStack className="mt-8 gap-2">
        {draft.fixed && !check.ok
          ? <ButtonLink to="/pay/scan" block>Quét mã khác</ButtonLink>
          : <Button block onClick={() => (check.ok ? commit.start() : toAmount())}>Xác nhận</Button>}
      </VStack>
      {commit.sheet}
    </>
  )
}

/** US-PAY-004: on app the screen stays awake and shows seconds so the cashier can check it. */
export function Result({ txId, onRetry }: { txId: string; onRetry?: () => void }) {
  const app = useLayout() === 'app'
  const t = useWorld().transactions.find((x) => x.id === txId)
  useWakeLock(app && t?.status === 'success')
  const secs = t && app && t.status === 'success'
    ? <Text className="mt-3 text-muted-foreground tabular-nums">Lúc {new Date(t.createdAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', second: '2-digit', timeZone: 'Asia/Ho_Chi_Minh' })}</Text>
    : null
  return <ResultView successHeading="Thanh toán thành công" txId={txId} onRetry={onRetry} extra={secs} />
}
