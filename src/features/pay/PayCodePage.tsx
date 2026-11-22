import { RefreshCw } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router'
import { useLayout } from '@/app/layout'
import { executeMoney, getState, now, setPaymentCodeOpen, sourceLabel, useSettings, useWorld } from '@/app/store'
import { formatVnd } from '@/domain/money'
import type { AuthMethod } from '@/domain/types'
import type { FundingSource, Transaction } from '@/mock/seed'
import { AuthSheet } from '@/features/sec/AuthSheet'
import { GatedRoute } from '@/features/sec/Gate'
import { authFor, checkAmount } from '@/features/flow/FlowKit'
import { Button, Card, cx, Ico, Row, Sheet, TextLink, SheetList } from '@/components/app-ui'
import { Box } from '@/components/ui/box'
import { Heading } from '@/components/ui/heading'
import { HStack } from '@/components/ui/hstack'
import { Progress, ProgressFilledTrack } from '@/components/ui/progress'
import { Spinner } from '@/components/ui/spinner'
import { Text } from '@/components/ui/text'
import { VStack } from '@/components/ui/vstack'
import { PageHeading, QrImage, useWakeLock } from '@/features/trf/shared'
import { Result } from './MerchantPayFlow'
import { PayTabs } from './PayTabs'
import { code128c, fmtCountdown, newPayCode, PAY_CODE_TTL_S } from './scan'

const WALLET = 'wallet'
const srcLabel = (s: FundingSource) => sourceLabel(getState().world, s.id)

/** Commits a cashier capture; the store leaves the wallet alone when a linked bank pays (US-PAY-006). */
function payByCode(req: { merchantId: string; name: string; amount: number; sourceId?: string; authMethod: AuthMethod }): Promise<Transaction> {
  return executeMoney({ type: 'qr_merchant', amount: req.amount, counterparty: { kind: 'merchant', id: req.merchantId, name: req.name }, sourceId: req.sourceId, authMethod: req.authMethod })
}

function Barcode({ value }: { value: string }) {
  const modules = code128c(value)
  const quiet = 10
  const total = modules.reduce((a, b) => a + b, 0) + quiet * 2
  let x = quiet
  return (
    <svg viewBox={`0 0 ${total} 40`} preserveAspectRatio="none" className="h-16 w-full bg-white" role="img" aria-label="Mã vạch của mã thanh toán">
      {modules.map((wd, i) => { const r = i % 2 === 0 ? <rect key={i} x={x} y={0} width={wd} height={40} fill="#000" /> : null; x += wd; return r })}
    </svg>
  )
}

export default function PayCodePage() {
  const layout = useLayout()
  return (
    <Box>
      <PageHeading>{layout === 'web' ? 'Thanh toán' : 'Mã thanh toán'}</PageHeading>
      {layout === 'web' ? <PayTabs active="code" /> : null}
      <GatedRoute><PayCode /></GatedRoute>
    </Box>
  )
}

type Blocked = { kind: 'balance' | 'limit'; amount: number } | { kind: 'face' } | { kind: 'error' }

function PayCode() {
  const nav = useNavigate()
  const w = useWorld()
  const settings = useSettings()
  const app = useLayout() === 'app'
  const [phase, setPhase] = useState<'auth' | 'code' | 'paying' | 'result'>('auth')
  const [authOpen, setAuthOpen] = useState(true)
  const [code, setCode] = useState<{ value: string; expiresAt: number } | null>(null)
  const [tick, setTick] = useState(now())
  const [revealUntil, setRevealUntil] = useState(0)
  const [sourceId, setSourceId] = useState(WALLET)
  const [picker, setPicker] = useState(false)
  const [announce, setAnnounce] = useState('')
  const [blocked, setBlocked] = useState<Blocked | null>(null)
  const [face, setFace] = useState<{ merchantId: string; name: string; amount: number } | null>(null)
  const [txId, setTxId] = useState<string>()
  const seenNonce = useRef(settings.cashierScan?.nonce)
  const unlockMethod = useRef(authFor('qr_merchant', 0)).current

  const issue = (renewed: boolean) => {
    setCode({ value: newPayCode(), expiresAt: now() + PAY_CODE_TTL_S * 1000 })
    setRevealUntil(0)
    setTick(now())
    if (renewed) setAnnounce('Đã đổi mã thanh toán mới.')
  }

  const remaining = code ? Math.max(0, Math.ceil((code.expiresAt - tick) / 1000)) : 0
  useWakeLock(app && phase === 'code')

  // One-second tick; renew at 0 (also covers coming back after the tab was hidden past the TTL, or a demo clock jump).
  useEffect(() => {
    if (phase !== 'code') return
    const id = setInterval(() => setTick(now()), 1000)
    return () => clearInterval(id)
  }, [phase])
  useEffect(() => {
    if (phase !== 'code' || !code) return
    if (remaining === 0) issue(true)
    else if (remaining === 10) setAnnounce('Mã sẽ tự đổi sau 10 giây.')
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [remaining, phase])

  // Demo control "Thu ngân quét Mã thanh toán" (US-PAY-006): reacts to a new nonce while a code is open.
  useEffect(() => {
    const scan = settings.cashierScan
    if (!scan || scan.nonce === seenNonce.current) return
    seenNonce.current = scan.nonce
    if (phase !== 'code' || !code) return
    const m = getState().world.merchants.find((x) => x.id === scan.merchantId)
    if (!m) return
    const fromSource = sourceId !== WALLET
    setBlocked(null)
    if (!fromSource && scan.amount > getState().world.balance) return setBlocked({ kind: 'balance', amount: scan.amount })
    if (!checkAmount('qr_merchant', scan.amount, { fromSource }).ok) return setBlocked({ kind: 'limit', amount: scan.amount })
    const req = { merchantId: m.id, name: m.name, amount: scan.amount }
    if (authFor('qr_merchant', scan.amount) === 'face_match') return setFace(req)
    void capture(req, 'pin')
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [settings.cashierScan?.nonce])

  const capture = async (req: { merchantId: string; name: string; amount: number }, authMethod: AuthMethod) => {
    setPhase('paying')
    try {
      const t = await payByCode({ ...req, sourceId: sourceId === WALLET ? undefined : sourceId, authMethod })
      setCode(null) // the used code is invalid whatever the outcome
      setTxId(t.id)
      setPhase('result')
    } catch {
      setPhase('code')
      setBlocked({ kind: 'error' })
    }
  }

  // Demo controls enable "Thu ngân quét Mã thanh toán" only while a code is showing.
  useEffect(() => { setPaymentCodeOpen(phase === 'code' && !!code); return () => setPaymentCodeOpen(false) }, [phase, code])
  if (phase === 'result' && txId) return <Result txId={txId} />

  const sources = w.sources
  const label = sourceId === WALLET ? 'Ví' : srcLabel(sources.find((s) => s.id === sourceId) ?? sources[0])
  const revealed = revealUntil > tick
  const urgent = remaining <= 10

  const banner = blocked ? (
    <Box role="alert" className="mb-3">
      <Card>
        <Text className="font-semibold">
          {blocked.kind === 'balance' && `Chưa thanh toán: số dư khả dụng không đủ cho ${formatVnd(blocked.amount)}. Chọn nguồn tiền khác hoặc nạp tiền.`}
          {blocked.kind === 'limit' && `Chưa thanh toán: ${formatVnd(blocked.amount)} vượt hạn mức tháng.`}
          {blocked.kind === 'face' && 'Chưa thanh toán. Thu ngân có thể quét lại.'}
          {blocked.kind === 'error' && 'Không gửi được yêu cầu. Bạn chưa bị trừ tiền.'}
        </Text>
        {blocked.kind === 'balance' || blocked.kind === 'limit' ? (
          <HStack className="mt-3 flex-wrap gap-2">
            {sources.length ? <Button size="sm" variant="secondary" onClick={() => setPicker(true)}>Đổi nguồn tiền</Button> : null}
            <Button size="sm" variant="secondary" onClick={() => nav('/topup')}>Nạp tiền</Button>
          </HStack>
        ) : null}
      </Card>
    </Box>
  ) : null

  return (
    <>
      {phase !== 'auth' && code ? (
        <>
          {banner}
          <Card centered className="relative items-center py-6">
            {app ? null : <Heading size="lg" as="h2" className="mb-3">Mã thanh toán</Heading>}
            <Box className="rounded-xl bg-white p-2">
              <QrImage payload={code.value} size={240} label="Mã thanh toán, đưa thu ngân quét" />
            </Box>
            <Box className="mt-3 w-full max-w-sm bg-white px-2"><Barcode value={code.value} /></Box>
            <HStack className="mt-3 items-center gap-3">
              <Text className="font-semibold tracking-wider tabular-nums">{revealed ? code.value.replace(/(\d{4})(?=\d)/g, '$1 ') : `•••• ${code.value.slice(-4)}`}</Text>
              {revealed ? null : <Button variant="ghost" size="sm" onClick={() => setRevealUntil(now() + 10_000)}>Hiện số</Button>}
            </HStack>
            <VStack className="mt-3 w-full max-w-sm items-center gap-2">
              <Text aria-hidden className={cx('tabular-nums', urgent ? 'font-semibold text-foreground' : 'text-muted-foreground')}>Mã tự đổi sau {fmtCountdown(remaining)}</Text>
              <Progress aria-hidden value={(remaining / PAY_CODE_TTL_S) * 100} className="h-1">
                <ProgressFilledTrack className={cx('duration-1000 ease-linear', urgent && 'bg-destructive')} />
              </Progress>
              <Text className="sr-only" role="status" aria-live="polite">{announce}</Text>
            </VStack>
            <Button variant="ghost" size="sm" className="mt-3" onClick={() => issue(true)}><Ico as={RefreshCw} size="sm" />Làm mới</Button>
            {app ? <Text size="sm" className="mt-2 text-muted-foreground">Tăng độ sáng màn hình để thu ngân quét dễ hơn</Text> : null}
            {phase === 'paying' ? (
              <VStack role="status" aria-live="polite" className="absolute inset-0 items-center justify-center rounded-xl bg-card/90">
                <Spinner aria-hidden />
                <Text className="mt-3 font-semibold">Đang thanh toán…</Text>
              </VStack>
            ) : null}
          </Card>
          <Card inset="rows" className="mt-6">
            <Row
              onClick={sources.length ? () => setPicker(true) : undefined}
              title="Nguồn tiền"
              subtitle={<Text className="whitespace-nowrap text-foreground">{label}</Text>}
              chevron={sources.length > 0}
            />
          </Card>
          <Text size="sm" className="mt-3 text-muted-foreground">Thu ngân quét mã này để trừ tiền. Không chia sẻ mã với người khác. <TextLink to="/pay/scan">Quét mã thay vì đưa mã</TextLink></Text>
        </>
      ) : (
        <Card centered className="py-12"><Text className="text-center text-muted-foreground">Xác thực để hiện mã thanh toán.</Text></Card>
      )}

      <AuthSheet
        open={authOpen}
        method={unlockMethod}
        amount={0}
        onOpenChange={(o) => { setAuthOpen(o); if (!o && phase === 'auth') nav(-1) }}
        onSuccess={() => { setAuthOpen(false); setPhase('code'); issue(false) }}
      />
      {face ? (
        <AuthSheet
          open method="face_match" amount={face.amount}
          onOpenChange={(o) => { if (!o) { setFace(null); setBlocked({ kind: 'face' }) } }}
          onSuccess={() => { const r = face; setFace(null); void capture(r, 'face_match') }}
        />
      ) : null}
      <Sheet open={picker} onOpenChange={setPicker} title="Nguồn tiền">
        <SheetList>
          {[{ id: WALLET, title: 'Ví', sub: `Số dư khả dụng: ${formatVnd(w.balance)}` }, ...sources.map((s) => ({ id: s.id, title: srcLabel(s) + (s.isDefault ? ' (mặc định)' : ''), sub: s.kind === 'debit_card' ? 'Thẻ ghi nợ' : 'Tài khoản ngân hàng' }))].map((o) => (
            <Box key={o.id} role="listitem">
              <Row
                onClick={() => { setSourceId(o.id); setPicker(false); setBlocked(null); issue(true) }}
                title={o.title}
                selected={o.id === sourceId}
                subtitle={o.sub}
              />
            </Box>
          ))}
        </SheetList>
      </Sheet>
    </>
  )
}
