import QRCode from 'qrcode'
import { mmss } from '@/app/format'
import { useEffect, useState } from 'react'
import { useLayout } from '@/app/layout'
import { now } from '@/app/store'
import { Button, Sheet, Card } from '@/components/app-ui'
import { Box } from '@/components/ui/box'
import { HStack } from '@/components/ui/hstack'
import { Image } from '@/components/ui/image'
import { Spinner } from '@/components/ui/spinner'
import { Text } from '@/components/ui/text'
import { VStack } from '@/components/ui/vstack'
import { SimLabel, StepShell, useOnb } from './Frame'
import { IdentitySummary } from './NfcStep'

const QR_SECONDS = 180

/** US-ONB-006: VNeID hand-off. App: "Mở VNeID" + simulated sheet. Web: QR with a 3-minute countdown + simulated panel. */
export function VneidStep() {
  const { setDraft, go } = useOnb()
  const layout = useLayout()
  const [phase, setPhase] = useState<'intro' | 'waiting' | 'approved' | 'declined'>(layout === 'web' ? 'waiting' : 'intro')
  const [issuedAt, setIssuedAt] = useState(() => now())
  const [qr, setQr] = useState('')
  const [, tick] = useState(0)
  useEffect(() => { setDraft({ path: 'vneid' }) }, []) // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (layout !== 'web') return
    QRCode.toDataURL(`VNEID-DEMO:WALLET:${issuedAt}`, { margin: 1, width: 400 }).then(setQr).catch(() => setQr(''))
    const t = setInterval(() => tick((n) => n + 1), 1000)
    return () => clearInterval(t)
  }, [layout, issuedAt])
  const left = Math.max(0, QR_SECONDS - Math.floor((now() - issuedAt) / 1000))
  const decide = (ok: boolean) => setPhase(ok ? 'approved' : 'declined')
  const sim = (
    <VStack className="gap-2">
      <Text size="sm" className="mb-2">Wallet yêu cầu: họ và tên, số CCCD, ngày sinh, ngày hết hạn, ảnh chân dung.</Text>
      <Button variant="primary" block onClick={() => decide(true)}>Đồng ý chia sẻ</Button>
      <Button variant="secondary" block onClick={() => decide(false)}>Từ chối</Button>
    </VStack>
  )

  if (phase === 'approved')
    return (
      <StepShell title="Xác thực qua VNeID" footer={<Button block onClick={() => go('face')}>Xác nhận</Button>}>
        <IdentitySummary title="Thông tin từ VNeID" />
      </StepShell>
    )
  if (phase === 'declined')
    return (
      <StepShell title="Xác thực qua VNeID" footer={<>
        <Button block onClick={() => { setIssuedAt(now()); setPhase(layout === 'web' ? 'waiting' : 'intro') }}>Thử lại</Button>
        <Button variant="secondary" block onClick={() => go('id-method')}>Chọn cách khác</Button>
      </>}>
        <Text role="alert" className="text-destructive">Bạn chưa đồng ý chia sẻ thông tin trên VNeID.</Text>
      </StepShell>
    )

  if (layout === 'web')
    return (
      <StepShell title="Xác thực qua VNeID" description="Bạn sẽ được chuyển sang ứng dụng VNeID để đồng ý chia sẻ thông tin định danh với Wallet. Cần tài khoản định danh điện tử mức 2.">
        <VStack data-align="free" className="items-center text-center">
          {left > 0 ? (
            <>
              {qr ? <Image source={{ uri: qr }} alt="Mã QR để quét bằng ứng dụng VNeID" size="none" className="size-[200px]" /> : <Box className="size-[200px] rounded-xl bg-muted" />}
              <Text className="mt-3 font-medium">Quét mã bằng ứng dụng VNeID trên điện thoại</Text>
              <Text size="sm" className="text-muted-foreground">Mã hết hạn sau <Text size="sm" className="tabular-nums text-muted-foreground">{mmss(left)}</Text></Text>
            </>
          ) : (
            <VStack role="status" className="items-center py-6">
              <Text className="font-semibold">Mã đã hết hạn</Text>
              <Button className="mt-3" onClick={() => setIssuedAt(now())}>Tạo mã mới</Button>
            </VStack>
          )}
        </VStack>
        {left > 0 ? (
          <Card role="region" aria-label="Mô phỏng ứng dụng VNeID" className="mt-6 border border-dashed border-border">
            {/* Dashed edge: a simulated third-party app, not Wallet's own UI. */}
            <SimLabel>Mô phỏng ứng dụng VNeID</SimLabel>
            {sim}
          </Card>
        ) : null}
      </StepShell>
    )

  return (
    <StepShell title="Xác thực qua VNeID" footer={phase === 'intro' ? <Button block onClick={() => setPhase('waiting')}>Mở VNeID</Button> : <Button variant="secondary" block onClick={() => setPhase('intro')}>Hủy</Button>}>
      <Text>Bạn sẽ được chuyển sang ứng dụng VNeID để đồng ý chia sẻ thông tin định danh với Wallet. Cần tài khoản định danh điện tử mức 2.</Text>
      {phase === 'waiting' ? (
        <HStack role="status" className="mt-6 items-center gap-2">
          <Spinner aria-hidden size="small" />
          <Text className="text-muted-foreground">Đang chờ xác nhận từ VNeID…</Text>
        </HStack>
      ) : null}
      <Sheet open={phase === 'waiting'} onOpenChange={(o) => !o && setPhase('intro')} title="Mô phỏng ứng dụng VNeID" description="Màn hình mô phỏng của VNeID, không phải của Wallet.">
        {sim}
      </Sheet>
    </StepShell>
  )
}
