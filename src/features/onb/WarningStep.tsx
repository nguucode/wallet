import { TriangleAlert } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { useLayout } from '@/app/layout'
import { Button, cx } from '@/components/ui'
import { StepShell, useOnb } from './Frame'
import { WARNING_CONSEQUENCE, WARNING_ITEMS } from './legal'
import { mark } from './marks'
import { canContinue } from './steps'

/** Sentinel at the end of the list; text that fits without scrolling counts as reached on render. */
function useScrolledToEnd() {
  const ref = useRef<HTMLDivElement>(null)
  const [reached, setReached] = useState(false)
  useEffect(() => {
    const el = ref.current
    if (!el || typeof IntersectionObserver === 'undefined') return setReached(true)
    const io = new IntersectionObserver((es) => { if (es.some((e) => e.isIntersecting)) { setReached(true); io.disconnect() } })
    io.observe(el)
    return () => io.disconnect()
  }, [])
  return { ref, reached }
}

/** US-ONB-009: mandatory warning; no back, no skip (TT 40 Đ.22 k.1 c). */
export function WarningStep() {
  const { go } = useOnb()
  const layout = useLayout()
  const { ref, reached } = useScrolledToEnd()
  const [ticked, setTicked] = useState(false)
  const ok = canContinue({ reachedEnd: reached, ticked })
  return (
    <StepShell title="Cảnh báo quan trọng" footer={<>
      <label className={cx('flex min-h-11 items-center gap-3', !reached && 'text-muted')}>
        <input type="checkbox" checked={ticked} disabled={!reached} onChange={(e) => setTicked(e.target.checked)} aria-describedby={!reached ? 'warn-help' : undefined} className="size-5 accent-[var(--color-primary)]" />
        <span className="font-medium">Tôi đã đọc và hiểu</span>
      </label>
      {!reached ? <p id="warn-help" className="text-[13px] text-muted">Cuộn hết nội dung để xác nhận</p> : null}
      <Button block disabled={!ok} onClick={() => { mark('warningAt'); go('terms') }}>Tiếp tục</Button>
    </>}>
      <div tabIndex={0} role="region" aria-label="Các hành vi bị cấm" className={cx('relative overflow-y-auto rounded-[12px] border border-line p-4', layout === 'web' ? 'max-h-[360px]' : 'max-h-[calc(100dvh-380px)] min-h-40')}>
        <ul className="flex flex-col gap-4">
          {WARNING_ITEMS.map((t) => (
            <li key={t} className="flex gap-3"><span aria-hidden className="mt-2 size-1.5 shrink-0 rounded-full bg-ink" />{t}</li>
          ))}
        </ul>
        <p className="mt-5 flex gap-3 rounded-[12px] bg-danger-soft p-3 font-medium text-danger">
          <TriangleAlert size={20} strokeWidth={1.75} aria-hidden className="mt-0.5 shrink-0" />{WARNING_CONSEQUENCE}
        </p>
        <div ref={ref} aria-hidden className="h-px" />
      </div>
    </StepShell>
  )
}
