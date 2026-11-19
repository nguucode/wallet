import { Download, Plus, Share2, X } from 'lucide-react'
import { toCanvas } from 'qrcode'
import { useEffect, useRef, useState, type ReactNode } from 'react'
import { useLayout } from '@/app/layout'
import { now, useWorld } from '@/app/store'
import { formatVnd } from '@/domain/money'
import { buildQr } from '@/domain/qr'
import { GatedRoute } from '@/features/sec/Gate'
import { AmountInput, formatPhone } from '@/features/flow/FlowKit'
import { Button, Card, Disc, Ico, Segmented, Sheet, TextLink } from '@/components/app-ui'
import { Box } from '@/components/ui/box'
import { Heading } from '@/components/ui/heading'
import { HStack } from '@/components/ui/hstack'
import { Pressable } from '@/components/ui/pressable'
import { Text } from '@/components/ui/text'
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
  g.fillStyle = '#1c1840'; g.textAlign = 'center'
  g.font = '700 30px "Be Vietnam Pro", sans-serif'
  g.fillText(name, 320, 660, 600)
  g.font = '500 24px "Be Vietnam Pro", sans-serif'
  g.fillStyle = '#625d7d'
  g.fillText('Mã nhận tiền · Wallet', 320, 702, 600)
  if (amount) { g.fillStyle = '#1c1840'; g.font = '700 30px "Be Vietnam Pro", sans-serif'; g.fillText(formatVnd(amount), 320, 770, 600) }
  return new Promise((res, rej) => c.toBlob((b) => (b ? res(b) : rej(new Error('toBlob'))), 'image/png'))
}

export default function ReceivePage() {
  return (
    <Box>
      <PageHeading>Nhận tiền</PageHeading>
      <GatedRoute allow={['kyc', 'kyc_review', 'no_source']}>
        <Receive />
      </GatedRoute>
    </Box>
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
    setToast(<>Bạn vừa nhận {formatVnd(incoming.amount)} từ {incoming.counterparty.name}. <TextLink to={`/history/${incoming.id}`}>Xem</TextLink></>)
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
      ? { label: 'Xóa số tiền', icon: <Ico as={X} size="lg" />, onClick: () => setAmount(0) }
      : { label: 'Thêm số tiền', icon: <Ico as={Plus} size="lg" />, onClick: () => { setEntry(0); setSheet(true) } },
    { label: 'Lưu ảnh', icon: <Ico as={Download} size="lg" />, onClick: () => void save() },
    { label: 'Chia sẻ', icon: <Ico as={Share2} size="lg" />, onClick: () => void share() },
  ]

  return (
    <>
      <Card className="items-center px-4 py-6 text-center">
        <Segmented label="Loại mã" value={kind} onChange={setKind} options={[{ value: 'wallet', label: 'Mã ví' }, { value: 'vietqr', label: 'VietQR' }]} />
        <Heading as="h2" size="xs" className="mt-6 font-medium text-muted-foreground">Mã nhận tiền</Heading>
        <Card className="mt-3 p-2">
          <QrImage payload={payload} size={size} label={`Mã nhận tiền của ${w.customer.name}${amount ? `, số tiền ${formatVnd(amount)}` : ''}`} />
        </Card>
        {kind === 'vietqr' ? <Text size="sm" className="mt-3 text-muted-foreground">Quét bằng app ngân hàng bất kỳ</Text> : null}
        {amount ? <Text size="4xl" bold className="mt-3 tabular-nums">{formatVnd(amount)}</Text> : null}
        <Text size="lg" bold className="mt-3 break-words">{w.customer.name}</Text>
        <Text className="text-muted-foreground tabular-nums">{formatPhone(phone)}</Text>

        {layout === 'web' ? (
          <HStack className="mt-6 flex-wrap justify-center gap-2">
            {actions.map((a) => <Button key={a.label} variant="secondary" onClick={a.onClick}>{a.icon}{a.label}</Button>)}
          </HStack>
        ) : (
          <HStack role="list" className="mt-6 w-full gap-2">
            {actions.map((a) => (
              <Box key={a.label} role="listitem" className="flex-1">
                <Pressable onPress={a.onClick} role="button" className="w-full items-center gap-2 rounded-xl py-1 data-[hover=true]:bg-muted data-[active=true]:bg-muted">
                  <Disc>{a.icon}</Disc>
                  <Text size="sm">{a.label}</Text>
                </Pressable>
              </Box>
            ))}
          </HStack>
        )}
      </Card>
      <Text role="status" aria-live="polite" className="mt-3 block min-h-6 text-center">{toast}</Text>

      <Sheet open={sheet} onOpenChange={setSheet} title="Thêm số tiền" description="Người quét mã sẽ thấy sẵn số tiền này.">
        <AmountInput value={entry} onChange={setEntry} quick={[50_000, 100_000, 200_000, 500_000]} />
        <Button block className="mt-6" disabled={!entry} onClick={() => { setAmount(entry); setSheet(false) }}>Xong</Button>
      </Sheet>
    </>
  )
}
