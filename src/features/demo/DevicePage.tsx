import { ExternalLink, RotateCw, Smartphone } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router'
import { useLayout } from '@/app/layout'
import { SampleBadge } from '@/app/Shell'
import { DemoControlsPanel } from '@/features/demo/DemoControls'
import { Button, ButtonLink, Card } from '@/components/ui'

const W = 390, H = 844, BEZEL = 14

/** US-FND-005: the app shell in a phone frame, demo controls docked beside it. */
export default function DevicePage() {
  const layout = useLayout()
  const [params, setParams] = useSearchParams()
  const nav = useNavigate()
  const path = params.get('path') || '/home'
  const [src] = useState(path)
  const frame = useRef<HTMLIFrameElement>(null)
  const [scale, setScale] = useState(1)
  const [msg, setMsg] = useState('')

  useEffect(() => { document.title = 'Xem trên điện thoại · Wallet' }, [])
  useEffect(() => {
    const fit = () => setScale(Math.max(0.6, Math.min(1, (window.innerHeight - 120) / (H + BEZEL * 2))))
    fit()
    window.addEventListener('resize', fit)
    return () => window.removeEventListener('resize', fit)
  }, [])
  // Mirror the framed page's path into ?path= (replace, so the link stays shareable).
  useEffect(() => {
    const id = setInterval(() => {
      try {
        const loc = frame.current?.contentWindow?.location
        const now = loc ? loc.pathname + loc.search : null
        if (now && now !== params.get('path')) setParams({ path: now }, { replace: true })
      } catch { /* cross-origin: never happens for same-origin frames */ }
    }, 500)
    return () => clearInterval(id)
  }, [params, setParams])

  if (layout === 'app')
    return (
      <main className="mx-auto max-w-[560px] px-5 pt-16 text-center">
        <h1 data-page-title tabIndex={-1} className="text-[20px] font-bold">Bạn đang dùng màn hình nhỏ</h1>
        <p className="mt-2 text-muted">Ví đã hiển thị dạng ứng dụng.</p>
        <ButtonLink to="/home" className="mt-6">Mở ví</ButtonLink>
      </main>
    )

  return (
    <div className="flex min-h-dvh bg-surface-2">
      <main className="flex flex-1 flex-col items-center px-8 pt-6">
        <div className="mb-4 flex w-full max-w-[560px] items-center gap-2">
          <Smartphone size={18} strokeWidth={1.75} aria-hidden />
          <h1 data-page-title tabIndex={-1} className="flex-1 text-[15px] font-semibold outline-none">Xem trên điện thoại</h1>
          <SampleBadge />
          <Button variant="secondary" size="sm" onClick={() => frame.current?.contentWindow?.location.reload()}><RotateCw size={14} aria-hidden />Tải lại</Button>
          <Button variant="secondary" size="sm" onClick={() => nav(params.get('path') || '/home')}><ExternalLink size={14} aria-hidden />Mở bản web</Button>
        </div>
        <div style={{ width: (W + BEZEL * 2) * scale, height: (H + BEZEL * 2) * scale }}>
          <div className="origin-top-left rounded-[56px] bg-black p-[14px] shadow-[var(--shadow-float)]" style={{ transform: `scale(${scale})`, width: W + BEZEL * 2 }}>
            <iframe ref={frame} title="Wallet trên điện thoại" src={src} width={W} height={H} className="block rounded-[42px] bg-surface" />
          </div>
        </div>
      </main>
      <aside aria-label="Demo controls" className="h-dvh w-[380px] shrink-0 overflow-y-auto border-l border-line bg-surface p-6">
        <h2 className="mb-3 text-[17px] font-bold">Demo controls</h2>
        <DemoControlsPanel onAction={setMsg} />
        <p role="status" aria-live="polite" className="min-h-5 text-[13px] text-success">{msg}</p>
        <Card className="mt-2 p-4 text-[13px] leading-[18px] text-muted">Thay đổi ở đây hiện ngay trong khung điện thoại. Dùng nút “Xem bản web” để quay lại giao diện máy tính tại đúng màn đang xem.</Card>
      </aside>
    </div>
  )
}
