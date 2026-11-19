import QRCode from 'qrcode'
import { mmss } from '@/app/format'
import { useEffect, useState } from 'react'
import { useLayout } from '@/app/layout'
import { now } from '@/app/store'
import { Button, Sheet } from '@/components/ui'
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
    <div className="flex flex-col gap-2">
      <p className="mb-header text-[15px] leading-5">Wallet yêu cầu: họ và tên, số CCCD, ngày sinh, ngày hết hạn, ảnh chân dung.</p>
      <Button variant="ink" block onClick={() => decide(true)}>Đồng ý chia sẻ</Button>
      <Button variant="secondary" block onClick={() => decide(false)}>Từ chối</Button>
    </div>
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
        <p role="alert" className="text-danger">Bạn chưa đồng ý chia sẻ thông tin trên VNeID.</p>
      </StepShell>
    )

  if (layout === 'web')
    return (
      <StepShell title="Xác thực qua VNeID" description="Bạn sẽ được chuyển sang ứng dụng VNeID để đồng ý chia sẻ thông tin định danh với Wallet. Cần tài khoản định danh điện tử mức 2.">
        <div className="flex flex-col items-center text-center">
          {left > 0 ? (
            <>
              {qr ? <img src={qr} alt="Mã QR để quét bằng ứng dụng VNeID" width={200} height={200} className="size-[200px]" /> : <span className="size-[200px] rounded-[12px] bg-surface-2" />}
              <p className="mt-stack font-medium">Quét mã bằng ứng dụng VNeID trên điện thoại</p>
              <p className="text-[15px] text-muted">Mã hết hạn sau <span className="tnum">{mmss(left)}</span></p>
            </>
          ) : (
            <div role="status" className="py-group">
              <p className="font-semibold">Mã đã hết hạn</p>
              <Button className="mt-stack" onClick={() => setIssuedAt(now())}>Tạo mã mới</Button>
            </div>
          )}
        </div>
        {left > 0 ? (
          <section aria-label="Mô phỏng ứng dụng VNeID" className="mt-group rounded-[16px] border border-dashed border-line bg-surface-2 p-inset">
            <SimLabel>Mô phỏng ứng dụng VNeID</SimLabel>
            {sim}
          </section>
        ) : null}
      </StepShell>
    )

  return (
    <StepShell title="Xác thực qua VNeID" footer={phase === 'intro' ? <Button block onClick={() => setPhase('waiting')}>Mở VNeID</Button> : <Button variant="secondary" block onClick={() => setPhase('intro')}>Hủy</Button>}>
      <p>Bạn sẽ được chuyển sang ứng dụng VNeID để đồng ý chia sẻ thông tin định danh với Wallet. Cần tài khoản định danh điện tử mức 2.</p>
      {phase === 'waiting' ? (
        <p role="status" className="mt-group flex items-center gap-2 text-muted">
          <span aria-hidden className="size-4 animate-spin rounded-full border-2 border-current border-r-transparent" />
          Đang chờ xác nhận từ VNeID…
        </p>
      ) : null}
      <Sheet open={phase === 'waiting'} onOpenChange={(o) => !o && setPhase('intro')} title="Mô phỏng ứng dụng VNeID" description="Màn hình mô phỏng của VNeID, không phải của Wallet.">
        {sim}
      </Sheet>
    </StepShell>
  )
}
