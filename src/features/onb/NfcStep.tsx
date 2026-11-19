import { Nfc } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { getState, now, useWorld } from '@/app/store'
import { Button } from '@/components/ui'
import { fmtDate } from '@/features/flow/FlowKit'
import { DataList, StepShell, useOnb } from './Frame'
import { maskIdNumber } from './steps'

/** Identity record from the chip or VNeID (shared by US-ONB-005 and US-ONB-006). */
export function IdentitySummary({ title }: { title: string }) {
  const c = useWorld().customer
  return (
    <section aria-label={title}>
      <h2 className="mb-2 text-[17px] leading-[26px] font-bold">{title}</h2>
      <DataList rows={[
        ['Họ và tên', c.name.toUpperCase()],
        ['Số CCCD', <span className="tnum">{maskIdNumber(c.idNumber)}</span>],
        ['Ngày sinh', fmtDate(c.dob)],
        ['Ngày hết hạn', fmtDate(c.idExpiry)],
      ]} />
    </section>
  )
}

export const idExpired = () => new Date(getState().world.customer.idExpiry).getTime() < now()
const EXPIRED = 'CCCD đã hết hạn. Bạn cần dùng CCCD còn hạn để mở ví.'

/** US-ONB-005: simulated NFC read. Demo latency "slow" (3 s) makes the read stall. */
export function NfcStep() {
  const { go } = useOnb()
  const [phase, setPhase] = useState<'intro' | 'reading' | 'stalled' | 'done'>('intro')
  const [pct, setPct] = useState(0)
  const timer = useRef<ReturnType<typeof setInterval>>(undefined)
  useEffect(() => () => clearInterval(timer.current), [])
  const stop = (next: 'stalled' | 'done') => { clearInterval(timer.current); setPhase(next) }
  const start = () => {
    const { latency } = getState().settings
    const stall = latency === 'slow'
    const stepMs = latency === 'none' ? 30 : 120
    setPct(0)
    setPhase('reading')
    let p = 0
    timer.current = setInterval(() => {
      p = Math.min(100, p + 5)
      setPct(p)
      if (stall && p >= 45) stop('stalled')
      else if (p >= 100) stop('done')
    }, stepMs)
  }

  if (phase === 'done') {
    const expired = idExpired()
    return (
      <StepShell title="Đọc chip CCCD" footer={<>
        {expired ? <p role="alert" className="text-[15px] text-danger">{EXPIRED}</p> : null}
        <Button block disabled={expired} onClick={() => go('face')}>Xác nhận</Button>
        <Button variant="ghost" block onClick={() => go('id-method')}>Thông tin không đúng?</Button>
      </>}>
        <IdentitySummary title="Thông tin trên chip" />
      </StepShell>
    )
  }

  const r = 44, len = 2 * Math.PI * r
  return (
    <StepShell title="Đọc chip CCCD" footer={
      phase === 'reading' ? <Button variant="secondary" block onClick={() => stop('stalled')}>Hủy</Button>
        : <Button block onClick={start}>{phase === 'stalled' ? 'Đọc lại' : 'Bắt đầu đọc'}</Button>
    }>
      <p>Áp CCCD vào mặt lưng điện thoại, gần camera, giữ yên khoảng 30 giây.</p>
      <div className="relative mx-auto my-8 size-44">
        <svg viewBox="0 0 100 100" className="absolute inset-0" aria-hidden>
          <circle cx="50" cy="50" r={r} fill="none" stroke="var(--color-line)" strokeWidth="4" />
          <circle cx="50" cy="50" r={r} fill="none" stroke="var(--color-tint)" strokeWidth="4" strokeLinecap="round" strokeDasharray={len} strokeDashoffset={len * (1 - pct / 100)} transform="rotate(-90 50 50)" className="transition-[stroke-dashoffset] duration-150" />
        </svg>
        <span className="absolute inset-5 flex items-center justify-center rounded-full bg-surface-2"><Nfc size={56} strokeWidth={1.25} aria-hidden className="text-muted" /></span>
      </div>
      <div aria-live="polite" className="min-h-12 text-center">
        {phase === 'reading' ? <><p className="font-semibold tnum">Đang đọc chip… {pct}%</p><p className="text-[15px] text-muted">Giữ yên thẻ, đừng nhấc ra.</p></> : null}
        {phase === 'stalled' ? <p role="alert" className="text-danger">Chưa đọc được chip. Tháo ốp lưng và giữ thẻ sát mặt lưng điện thoại.</p> : null}
      </div>
    </StepShell>
  )
}
