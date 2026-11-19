import { ScanFace } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { useLayout } from '@/app/layout'
import { Button } from '@/components/app-ui'
import { StepShell, useOnb } from './Frame'

const PROMPTS = ['Đưa khuôn mặt vào khung', 'Quay nhẹ sang trái', 'Quay nhẹ sang phải', 'Giữ yên']
const STEP_MS = 1100

/** US-ONB-007: guided liveness scan (enrol mode). It never decides match; verification does. */
export function FaceStep() {
  const { go } = useOnb()
  const layout = useLayout()
  const [i, setI] = useState(-1)
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined)
  useEffect(() => () => clearTimeout(timer.current), [])
  useEffect(() => {
    if (i < 0) return
    timer.current = setTimeout(() => (i < PROMPTS.length - 1 ? setI(i + 1) : go('verifying', { replace: true })), STEP_MS)
  }, [i]) // eslint-disable-line react-hooks/exhaustive-deps
  const scanning = i >= 0
  const progress = scanning ? (i + 1) / PROMPTS.length : 0
  return (
    <StepShell title="Xác thực khuôn mặt" footer={!scanning ? <Button block onClick={() => setI(0)}>Bắt đầu</Button> : undefined}>
      <p>Nhìn thẳng vào camera{layout === 'web' ? ' của máy tính' : ''}, đủ sáng, không đeo kính râm hay khẩu trang.</p>
      <div className={layout === 'web' ? 'mt-group flex aspect-[4/3] flex-col items-center justify-center rounded-[16px] bg-black' : 'mt-group flex flex-col items-center rounded-[16px] bg-black py-section'}>
        <p aria-live="assertive" className="mb-stack min-h-6 px-4 text-center font-semibold text-white">{scanning ? PROMPTS[i] : ''}</p>
        <div className="relative h-[200px] w-[156px]">
          <svg viewBox="0 0 156 200" className="absolute inset-0" aria-hidden>
            <ellipse cx="78" cy="100" rx="74" ry="96" fill="none" stroke="rgb(255 255 255 / 0.35)" strokeWidth="3" />
            {scanning ? <ellipse cx="78" cy="100" rx="74" ry="96" fill="none" stroke="var(--color-card-violet)" strokeWidth="3" pathLength={100} strokeDasharray="100" strokeDashoffset={100 * (1 - progress)} className="transition-[stroke-dashoffset] duration-700" /> : null}
          </svg>
          <span className="absolute inset-0 flex items-center justify-center"><ScanFace size={72} strokeWidth={1} aria-hidden className="text-white/70" /></span>
        </div>
      </div>
      <p className="mt-stack text-[13px] text-muted">Mô phỏng: camera dùng khuôn mặt mẫu.</p>
    </StepShell>
  )
}
