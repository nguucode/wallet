import { Download, Plus, Share2, X } from 'lucide-react'
import { toCanvas } from 'qrcode'
import { useEffect, useRef, useState, type ReactNode } from 'react'
import { Link } from 'react-router'
import { useLayout } from '@/app/layout'
import { now, useWorld } from '@/app/store'
import { formatVnd } from '@/domain/money'
import { buildQr } from '@/domain/qr'
import { GatedRoute } from '@/features/sec/Gate'
import { AmountInput, formatPhone } from '@/features/flow/FlowKit'
import { Button, Card, Disc, Segmented, Sheet } from '@/components/ui'
import { PageHeading, QrImage } from './shared'

/** rules.md decisions: the wallet's VietQR form is a virtual account at the Vietcombank BIN. */
export const RECEIVE_BIN = '970436'

export function receivePayload(kind: 'wallet' | 'vietqr', phone: string, amount: number) {
  const a = amount > 0 ? { amount } : {}
  return kind === 'wallet' ? buildQr({ kind: 'wallet', phone, ...a }) : buildQr({ kind: 'vietqr', bin: RECEIVE_BIN, account: phone, ...a })
}

/** PNG with QR, name and amount; drawn on a canvas with the page font so diacritics survive. */
async function renderImage(payload: string, name: string, amount: number): Promise<Blob> {
  const qr = document.createElement('canvas')
  await toCanvas(qr, payload, { margin: 2, width: 560, color: { dark: '#000000', light: '#ffffff' } })
  const c = document.createElement('canvas')
  c.width = 640; c.height = amount ? 820 : 760
  const g = c.getContext('2d')!
  g.fillStyle = '#ffffff'; g.fillRect(0, 0, c.width, c.height)
  g.drawImage(qr, 40, 40)
  await document.fonts?.ready
  g.fillStyle = '#0E0B16'; g.textAlign = 'center'
  g.font = '700 30px "Be Vietnam Pro", sans-serif'
  g.fillText(name, 320, 660, 600)
  g.font = '500 24px "Be Vietnam Pro", sans-serif'
  g.fillStyle = '#5D5869'
  g.fillText('Mã nhận tiền · Wallet', 320, 702, 600)
  if (amount) { g.fillStyle = '#0E0B16'; g.font = '700 30px "Be Vietnam Pro", sans-serif'; g.fillText(formatVnd(amount), 320, 770, 600) }
  return new Promise((res, rej) => c.toBlob((b) => (b ? res(b) : rej(new Error('toBlob'))), 'image/png'))
}

export default function ReceivePage() {
  return (
    <div>
      <PageHeading>Nhận tiền</PageHeading>
      <GatedRoute allow={['kyc', 'kyc_review', 'no_source']}>
        <Receive />
      </GatedRoute>
    </div>
  )
}

function Receive() {
  const w = useWorld()
  const layout = useLayout()
  const [kind, setKind] = useState<'wallet' | 'vietqr'>('wallet')
  const [amount, setAmount] = useState(0)
  const [sheet, setSheet] = useState(false)
  const [entry, setEntry] = useState(0)
  const [toast, setToast] = useState<ReactNode>()
  const phone = w.customer.walletNumber
  const payload = receivePayload(kind, phone, amount)
  const size = layout === 'web' ? 240 : 264

  // Demo "Incoming transfer" while this page is open → toast with a link to the transaction.
  const since = useRef(new Date(now()).toISOString())
  const incoming = w.transactions.find((t) => t.type === 'p2p_in' && t.createdAt > since.current)
  useEffect(() => {
    if (!incoming || incoming.counterparty.kind !== 'contact') return
    setToast(<>Bạn vừa nhận {formatVnd(incoming.amount)} từ {incoming.counterparty.name}. <Link to={`/history/${incoming.id}`} className="font-semibold text-primary">Xem</Link></>)
  }, [incoming])

  const save = async () => {
    try {
      const blob = await renderImage(payload, w.customer.name, amount)
      const a = document.createElement('a')
      a.href = URL.createObjectURL(blob); a.download = `ma-nhan-tien-${phone}.png`; a.click()
      setTimeout(() => URL.revokeObjectURL(a.href), 1000)
    } catch { setToast('Không tạo được ảnh. Thử lại.') }
  }
  const share = async () => {
    try {
      const file = new File([await renderImage(payload, w.customer.name, amount)], 'ma-nhan-tien.png', { type: 'image/png' })
      if (navigator.canShare?.({ files: [file] })) return await navigator.share({ files: [file], title: 'Mã nhận tiền' })
    } catch (e) { if ((e as Error).name === 'AbortError') return }
    try { await navigator.clipboard.writeText(phone); setToast('Đã sao chép số ví') } catch { setToast(`Số ví: ${formatPhone(phone)}`) }
  }

  const actions: { label: string; icon: ReactNode; onClick: () => void }[] = [
    amount
      ? { label: 'Xóa số tiền', icon: <X size={22} strokeWidth={1.75} />, onClick: () => setAmount(0) }
      : { label: 'Thêm số tiền', icon: <Plus size={22} strokeWidth={1.75} />, onClick: () => { setEntry(0); setSheet(true) } },
    { label: 'Lưu ảnh', icon: <Download size={22} strokeWidth={1.75} />, onClick: () => void save() },
    { label: 'Chia sẻ', icon: <Share2 size={22} strokeWidth={1.75} />, onClick: () => void share() },
  ]

  return (
    <>
      <Card className="flex flex-col items-center px-5 py-6 text-center">
        <Segmented label="Loại mã" value={kind} onChange={setKind} options={[{ value: 'wallet', label: 'Mã ví' }, { value: 'vietqr', label: 'VietQR' }]} />
        <h2 className="mt-5 text-[13px] font-medium text-muted">Mã nhận tiền</h2>
        <div className="mt-3 card p-2">
          <QrImage payload={payload} size={size} label={`Mã nhận tiền của ${w.customer.name}${amount ? `, số tiền ${formatVnd(amount)}` : ''}`} />
        </div>
        {kind === 'vietqr' ? <p className="mt-3 text-[13px] text-muted">Quét bằng app ngân hàng bất kỳ</p> : null}
        {amount ? <p className="mt-3 amount-display tnum">{formatVnd(amount)}</p> : null}
        <p className="mt-3 text-[16px] font-bold break-words">{w.customer.name}</p>
        <p className="text-[14px] text-muted tnum">{formatPhone(phone)}</p>

        {layout === 'web' ? (
          <div className="mt-6 flex flex-wrap justify-center gap-2">
            {actions.map((a) => <Button key={a.label} variant="secondary" onClick={a.onClick}>{a.icon}{a.label}</Button>)}
          </div>
        ) : (
          <ul className="mt-6 grid w-full grid-cols-3 gap-2">
            {actions.map((a) => (
              <li key={a.label}>
                <button type="button" onClick={a.onClick} className="flex w-full flex-col items-center gap-1.5 rounded-xl py-1 hover:bg-surface-2">
                  <Disc>{a.icon}</Disc>
                  <span className="text-[13px] leading-[18px]">{a.label}</span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </Card>
      <p role="status" aria-live="polite" className="mt-4 min-h-6 text-center text-[14px]">{toast}</p>

      <Sheet open={sheet} onOpenChange={setSheet} title="Thêm số tiền" description="Người quét mã sẽ thấy sẵn số tiền này.">
        <AmountInput value={entry} onChange={setEntry} quick={[50_000, 100_000, 200_000, 500_000]} />
        <Button block className="mt-6" disabled={!entry} onClick={() => { setAmount(entry); setSheet(false) }}>Xong</Button>
      </Sheet>
    </>
  )
}
