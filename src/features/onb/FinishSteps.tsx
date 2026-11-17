import { useState } from 'react'
import { useNavigate } from 'react-router'
import { config } from '@/domain/config'
import { formatVnd } from '@/domain/money'
import { delay, finishOnboarding, useWorld } from '@/app/store'
import { Button, Sheet } from '@/components/ui'
import { formatPhone } from '@/features/flow/FlowKit'
import { DataList, StatusMark, StepShell, useOnb } from './Frame'
import { TERMS_FULL, TERMS_SUMMARY } from './legal'
import { mark } from './marks'

/** US-ONB-010: terms; accepting opens the wallet (status active) and ends onboarding. */
export function TermsStep() {
  const { go } = useOnb()
  const [full, setFull] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(false)
  const accept = async () => {
    setBusy(true)
    setError(false)
    try {
      await delay()
      mark('termsAt', (w) => { w.walletStatus = 'active' })
      finishOnboarding()
      go('ready', { replace: true })
    } catch {
      setError(true)
    } finally {
      setBusy(false)
    }
  }
  return (
    <StepShell title="Điều khoản sử dụng ví" footer={<>
      {error ? <p role="alert" className="text-[14px] text-danger">Chưa mở được ví. Thử lại.</p> : null}
      <Button block loading={busy} onClick={accept}>{error ? 'Thử lại' : 'Đồng ý và mở ví'}</Button>
    </>}>
      <dl className="flex flex-col gap-4">
        {TERMS_SUMMARY.map(([k, v]) => (
          <div key={k}><dt className="font-semibold">{k}</dt><dd className="text-[14px] leading-5 text-muted">{v}</dd></div>
        ))}
      </dl>
      <Button variant="ghost" className="mt-4 -ml-4" onClick={() => setFull(true)}>Xem toàn bộ điều khoản</Button>
      <Sheet open={full} onOpenChange={setFull} title="Điều khoản sử dụng ví">
        <div className="flex flex-col gap-4">
          {TERMS_FULL.map(([k, v]) => <section key={k}><h3 className="font-semibold">{k}</h3><p className="text-[14px] leading-5 text-muted">{v}</p></section>)}
        </div>
        <Button variant="secondary" block className="mt-6" onClick={() => setFull(false)}>Đóng</Button>
      </Sheet>
    </StepShell>
  )
}

/** US-ONB-010: wallet ready, one primary CTA to link a bank; "Để sau" lands on Home with gate #4. */
export function ReadyStep() {
  const { clear } = useOnb()
  const w = useWorld()
  const nav = useNavigate()
  const leave = (to: string) => () => { clear(); nav(to) }
  return (
    <StepShell title="Ví của bạn đã sẵn sàng" footer={<>
      <Button block onClick={leave('/me/sources/link?return=home')}>Liên kết ngân hàng</Button>
      <Button variant="ghost" block onClick={leave('/home')}>Để sau</Button>
    </>}>
      <div className="mb-6"><StatusMark tone="primary" /></div>
      <p className="mb-2 text-[18px] leading-[26px] font-bold">{w.customer.name}</p>
      <DataList rows={[['Số ví', <span className="tnum whitespace-nowrap">{formatPhone(w.customer.walletNumber)}</span>]]} />
      <h2 className="mt-6 mb-1 font-semibold">Hạn mức giao dịch</h2>
      <DataList rows={[
        ['Chuyển tiền và thanh toán', <span className="tnum whitespace-nowrap">{formatVnd(config.limits.generalMonth)}/tháng</span>],
        ['Thanh toán thiết yếu (điện, nước…)', <span className="tnum whitespace-nowrap">{formatVnd(config.limits.essentialMonth)}/tháng</span>],
      ]} />
      {w.customer.kycStatus === 'verifying' ? (
        <p role="status" className="mt-6 rounded-[12px] bg-pending-soft p-3 text-[14px] leading-5 font-medium text-pending">Hồ sơ đang được kiểm tra, thường xong trong 24 giờ.</p>
      ) : null}
      <p className="mt-6">Bạn cần liên kết tài khoản hoặc thẻ ghi nợ đứng tên mình trước khi dùng ví.</p>
    </StepShell>
  )
}
