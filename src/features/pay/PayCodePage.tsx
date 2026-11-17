import { ChevronRight, RefreshCw } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router'
import { useLayout } from '@/app/layout'
import { executeMoney, getState, now, setPaymentCodeOpen, sourceLabel, useSettings, useWorld } from '@/app/store'
import { formatVnd } from '@/domain/money'
import type { AuthMethod } from '@/domain/types'
import type { FundingSource, Transaction } from '@/mock/seed'
import { AuthSheet } from '@/features/sec/AuthSheet'
import { GatedRoute } from '@/features/sec/Gate'
import { authFor, checkAmount } from '@/features/flow/FlowKit'
import { Button, Card, cx, Row, Sheet } from '@/components/ui'
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
    <div>
      <PageHeading>{layout === 'web' ? 'Thanh toán' : 'Mã thanh toán'}</PageHeading>
      {layout === 'web' ? <PayTabs active="code" /> : null}
      <GatedRoute><PayCode /></GatedRoute>
    </div>
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

  if (phase === 'result' && txId) return <Result txId={txId} />

  const sources = w.sources
  const label = sourceId === WALLET ? 'Ví' : srcLabel(sources.find((s) => s.id === sourceId) ?? sources[0])
  // Demo controls enable "Thu ngân quét Mã thanh toán" only while a code is showing.
  useEffect(() => { setPaymentCodeOpen(phase === 'code' && !!code); return () => setPaymentCodeOpen(false) }, [phase, code])
  const revealed = revealUntil > tick
  const urgent = remaining <= 10

  const banner = blocked ? (
    <div role="alert" className="mb-4 card p-4">
      <p className="font-semibold">
        {blocked.kind === 'balance' && `Chưa thanh toán: số dư khả dụng không đủ cho ${formatVnd(blocked.amount)}. Chọn nguồn tiền khác hoặc nạp tiền.`}
        {blocked.kind === 'limit' && `Chưa thanh toán: ${formatVnd(blocked.amount)} vượt hạn mức tháng.`}
        {blocked.kind === 'face' && 'Chưa thanh toán. Thu ngân có thể quét lại.'}
        {blocked.kind === 'error' && 'Không gửi được yêu cầu. Bạn chưa bị trừ tiền.'}
      </p>
      {blocked.kind === 'balance' || blocked.kind === 'limit' ? (
        <div className="mt-3 flex flex-wrap gap-2">
          {sources.length ? <Button size="sm" variant="secondary" onClick={() => setPicker(true)}>Đổi nguồn tiền</Button> : null}
          <Button size="sm" variant="secondary" onClick={() => nav('/topup')}>Nạp tiền</Button>
        </div>
      ) : null}
    </div>
  ) : null

  return (
    <>
      {phase !== 'auth' && code ? (
        <>
          {banner}
          <Card className="relative flex flex-col items-center px-4 py-6 text-center">
            {app ? null : <h2 className="mb-4 text-[18px] leading-[26px] font-bold">Mã thanh toán</h2>}
            <div className="rounded-[12px] bg-white p-2">
              <QrImage payload={code.value} size={240} label="Mã thanh toán, đưa thu ngân quét" />
            </div>
            <div className="mt-4 w-full max-w-[360px] bg-white px-2"><Barcode value={code.value} /></div>
            <p className="mt-3 flex items-center gap-3 text-[15px]">
              <span className="tnum font-semibold tracking-wider">{revealed ? code.value.replace(/(\d{4})(?=\d)/g, '$1 ') : `•••• ${code.value.slice(-4)}`}</span>
              {revealed ? null : <Button variant="ghost" size="sm" onClick={() => setRevealUntil(now() + 10_000)}>Hiện số</Button>}
            </p>
            <div className="mt-4 w-full max-w-[360px]">
              <p className={cx('text-[14px] tnum', urgent ? 'font-semibold text-pending' : 'text-muted')} aria-hidden>Mã tự đổi sau {fmtCountdown(remaining)}</p>
              <div className="mt-2 h-1 w-full overflow-hidden rounded-full bg-line-soft" aria-hidden>
                <div className={cx('h-full rounded-full transition-[width] duration-1000 ease-linear', urgent ? 'bg-pending' : 'bg-ink')} style={{ width: `${(remaining / PAY_CODE_TTL_S) * 100}%` }} />
              </div>
              <p className="sr-only" role="status" aria-live="polite">{announce}</p>
            </div>
            <Button variant="ghost" size="sm" className="mt-3" onClick={() => issue(true)}><RefreshCw size={16} aria-hidden />Làm mới</Button>
            {app ? <p className="mt-2 text-[13px] text-muted">Tăng độ sáng màn hình để thu ngân quét dễ hơn</p> : null}
            {phase === 'paying' ? (
              <div role="status" aria-live="polite" className="absolute inset-0 flex flex-col items-center justify-center rounded-[16px] bg-surface/90">
                <span className="size-8 animate-spin rounded-full border-2 border-current border-r-transparent" aria-hidden />
                <p className="mt-3 font-semibold">Đang thanh toán…</p>
              </div>
            ) : null}
          </Card>
          <Card className="mt-4 px-4">
            <Row
              onClick={sources.length ? () => setPicker(true) : undefined}
              title="Nguồn tiền"
              subtitle={<span className="whitespace-nowrap text-ink">{label}</span>}
              right={sources.length ? <ChevronRight size={20} strokeWidth={1.75} aria-hidden className="text-muted" /> : undefined}
            />
          </Card>
          <p className="mt-4 text-[13px] text-muted">Thu ngân quét mã này để trừ tiền. Không chia sẻ mã với người khác. <Link to="/pay/scan" className="font-medium text-primary">Quét mã thay vì đưa mã</Link></p>
        </>
      ) : (
        <p className="card py-10 text-center text-muted">Xác thực để hiện mã thanh toán.</p>
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
        <ul className="divide-y divide-line-soft">
          {[{ id: WALLET, title: 'Ví', sub: `Số dư khả dụng: ${formatVnd(w.balance)}` }, ...sources.map((s) => ({ id: s.id, title: srcLabel(s) + (s.isDefault ? ' (mặc định)' : ''), sub: s.kind === 'debit_card' ? 'Thẻ ghi nợ' : 'Tài khoản ngân hàng' }))].map((o) => (
            <li key={o.id}>
              <Row
                onClick={() => { setSourceId(o.id); setPicker(false); setBlocked(null); issue(true) }}
                title={<span className="flex items-center gap-2">{o.title}{o.id === sourceId ? <span className="text-[12px] font-semibold text-primary-ink">· Đang chọn</span> : null}</span>}
                subtitle={o.sub}
              />
            </li>
          ))}
        </ul>
      </Sheet>
    </>
  )
}
