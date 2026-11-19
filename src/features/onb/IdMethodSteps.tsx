import { CreditCard, Fingerprint, Smartphone } from 'lucide-react'
import { useState } from 'react'
import { useLayout } from '@/app/layout'
import { useWorld } from '@/app/store'
import { Button, cx, Disc } from '@/components/app-ui'
import { StepShell, useOnb } from './Frame'
import { maskIdNumber } from './steps'

/** Layout, not device detection, decides NFC: the app layout (< 1024px) offers the chip path. */
export const canReadChip = (layout: 'web' | 'app') => layout === 'app'

/** US-ONB-004: identity method. */
export function IdMethodStep() {
  const { draft, setDraft, go } = useOnb()
  const layout = useLayout()
  const chip = canReadChip(layout)
  const pick = (path: 'nfc' | 'vneid') => { setDraft({ path }); go(path === 'nfc' ? 'id-capture' : 'vneid') }
  const options = [
    { path: 'nfc' as const, title: 'CCCD gắn chip', body: 'Chụp CCCD rồi áp vào lưng điện thoại để đọc chip', icon: <CreditCard size={22} strokeWidth={1.75} />, disabled: !chip },
    { path: 'vneid' as const, title: 'Tài khoản VNeID', body: 'Dùng tài khoản định danh điện tử mức 2, không cần đọc chip', icon: <Fingerprint size={22} strokeWidth={1.75} />, disabled: false },
  ]
  return (
    <StepShell title="Xác thực sinh trắc học" description="Theo quy định của Ngân hàng Nhà nước, bạn cần đối chiếu khuôn mặt với dữ liệu trên CCCD gắn chip trước khi dùng ví.">
      <div role="radiogroup" aria-label="Cách xác thực" className="flex flex-col gap-3">
        {options.map((o) => (
          <button
            key={o.path} type="button" role="radio" aria-checked={draft.path === o.path} aria-disabled={o.disabled || undefined}
            aria-describedby={o.disabled ? 'chip-reason' : undefined}
            onClick={() => !o.disabled && pick(o.path)}
            className={cx('flex items-start gap-3 rounded-[12px] border p-4 text-left', o.disabled ? 'cursor-not-allowed border-line-soft bg-surface-2 text-muted' : draft.path === o.path ? 'border-tint bg-primary-soft' : 'border-line hover:bg-surface-2')}
          >
            <Disc size={44}>{o.icon}</Disc>
            <span className="min-w-0 flex-1">
              <span className="block font-semibold">{o.title}</span>
              <span className="block text-[15px] leading-5 text-muted">{o.body}</span>
              {o.disabled ? <span id="chip-reason" className="mt-1 block text-[13px] leading-[18px] font-medium text-ink">Máy tính không đọc được chip CCCD.</span> : null}
            </span>
          </button>
        ))}
      </div>
      {!chip ? (
        <div className="mt-group flex items-start gap-3 rounded-[12px] border border-line p-inset">
          <Disc><Smartphone size={22} strokeWidth={1.75} /></Disc>
          <div>
            <p className="font-semibold">Mở ví trên điện thoại</p>
            <p className="text-[15px] leading-5 text-muted">Đọc chip CCCD cần điện thoại có NFC. Bạn cũng có thể dùng VNeID ngay trên máy tính. Bản demo: thu cửa sổ dưới 1024px hoặc mở trên điện thoại để thử đọc chip.</p>
          </div>
        </div>
      ) : null}
    </StepShell>
  )
}

/** Sample CCCD front (fictional data), drawn instead of a bundled image. */
export function SampleCard() {
  const w = useWorld()
  return (
    <div className="aspect-[85.6/54] w-full rounded-[12px] bg-gradient-to-br from-[#e9eef5] to-[#cfd9e6] p-3 text-[#1d2a3a]" role="img" aria-label="Ảnh mặt trước CCCD mẫu">
      <p className="text-center text-[10px] font-bold tracking-wide">CĂN CƯỚC CÔNG DÂN</p>
      <div className="mt-header flex gap-3">
        <span className="aspect-[3/4] w-[24%] rounded bg-[#9fb0c4]" />
        <div className="min-w-0 text-[10px] leading-[14px]">
          <p>Số: {maskIdNumber(w.customer.idNumber)}</p>
          <p className="font-bold">{w.customer.name.toUpperCase()}</p>
          <p>Ngày sinh: {w.customer.dob.split('-').reverse().join('/')}</p>
        </div>
      </div>
    </div>
  )
}

/** US-ONB-004: simulated camera capture of the CCCD front. */
export function IdCaptureStep() {
  const { go } = useOnb()
  const [shot, setShot] = useState(false)
  const [busy, setBusy] = useState(false)
  const use = () => { setBusy(true); setTimeout(() => go('nfc'), 700) }
  if (shot)
    return (
      <StepShell title="Chụp mặt trước CCCD" footer={<>
        <Button block loading={busy} onClick={use}>Dùng ảnh này</Button>
        <Button variant="secondary" block disabled={busy} onClick={() => setShot(false)}>Chụp lại</Button>
      </>}>
        <SampleCard />
        <p className="mt-stack">Kiểm tra ảnh: chữ và ảnh chân dung phải rõ nét.</p>
        <p role="status" className="mt-header min-h-5 text-[15px] text-muted">{busy ? 'Đang xử lý ảnh…' : ''}</p>
      </StepShell>
    )
  return (
    <StepShell title="Chụp mặt trước CCCD">
      <div className="flex flex-col items-center rounded-[16px] bg-black px-inset py-section text-white">
        <div aria-hidden className="aspect-[85.6/54] w-full max-w-[340px] rounded-[12px] border-2 border-white/90" />
        <p className="mt-stack text-center text-[15px] leading-5">Đặt CCCD nằm gọn trong khung, đủ sáng, không bị lóa.</p>
        <button type="button" onClick={() => setShot(true)} aria-label="Chụp" className="mt-group inline-flex size-[72px] items-center justify-center rounded-full border-4 border-white focus-visible:outline-white">
          <span aria-hidden className="size-14 rounded-full bg-white" />
        </button>
        <span aria-hidden className="mt-header text-[13px]">Chụp</span>
      </div>
      <p className="mt-stack text-[13px] text-muted">Mô phỏng: camera dùng ảnh CCCD mẫu.</p>
    </StepShell>
  )
}
