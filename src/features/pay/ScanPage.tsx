import { Flashlight, ImageUp, LayoutGrid, X } from 'lucide-react'
import { useEffect, useRef, useState, type DragEvent, type ReactNode } from 'react'
import { useNavigate } from 'react-router'
import { inFrame, useLayout } from '@/app/layout'
import { useWorld } from '@/app/store'
import { parseQr } from '@/domain/qr'
import { sampleQrs } from '@/mock/seed'
import { GatedRoute } from '@/features/sec/Gate'
import { Button, Callout, cx, Sheet } from '@/components/ui'
import { PageHeading, QrImage } from '@/features/trf/shared'
import { PayTabs } from './PayTabs'
import { routeForQr } from './scan'

type Detector = { detect: (src: ImageBitmapSource) => Promise<{ rawValue: string }[]> }
type DetectorCtor = new (o: { formats: string[] }) => Detector
const Detector = (globalThis as unknown as { BarcodeDetector?: DetectorCtor }).BarcodeDetector
const makeDetector = () => (Detector ? new Detector({ formats: ['qr_code'] }) : null)

type Problem = { title: string; body?: string; action: 'rescan' | 'other-image' }

/** Decodes a picked image. null = no QR found; 'unsupported' = this browser has no decoder. */
async function decodeFile(file: File): Promise<string | null | 'unsupported'> {
  const d = makeDetector()
  if (!d) return 'unsupported'
  const bmp = await createImageBitmap(file)
  try { return (await d.detect(bmp))[0]?.rawValue ?? null } finally { bmp.close() }
}

/** Shared: payload → route, or a problem to show (US-PAY-002). */
function useScanHandler() {
  const nav = useNavigate()
  const layout = useLayout()
  const [problem, setProblem] = useState<Problem | null>(null)
  const handle = (raw: string) => {
    const r = routeForQr(parseQr(raw), raw)
    if (!r.ok) return setProblem({ title: r.title, body: r.body, action: 'rescan' })
    if (layout === 'app' && navigator.userActivation?.hasBeenActive) navigator.vibrate?.(30)
    nav(r.to)
  }
  const handleFile = async (file?: File) => {
    if (!file) return
    const res = await decodeFile(file).catch(() => null)
    if (res === 'unsupported') return setProblem({ title: 'Trình duyệt này chưa đọc được ảnh mã QR.', body: 'Dùng Mã mẫu để thử luồng thanh toán.', action: 'rescan' })
    if (res === null) return setProblem({ title: 'Không tìm thấy mã QR trong ảnh.', action: 'other-image' })
    handle(res)
  }
  return { problem, setProblem, handle, handleFile }
}

function SampleGrid({ onPick, cols }: { onPick: (payload: string) => void; cols: string }) {
  const w = useWorld()
  return (
    <ul className={cx('grid gap-3', cols)}>
      {sampleQrs(w).map((q) => (
        <li key={q.id}>
          <button type="button" onClick={() => onPick(q.payload)} className="flex h-full w-full flex-col items-center gap-2 card p-3 text-center text-ink hover:bg-surface-2">
            <QrImage payload={q.payload} size={88} label="" />
            <span className="line-clamp-2 text-[13px] leading-[18px] font-medium" title={q.label}>{q.label}</span>
            <span className="text-[12px] leading-4 text-muted">{q.hint}</span>
          </button>
        </li>
      ))}
    </ul>
  )
}

export default function ScanPage() {
  const layout = useLayout()
  return layout === 'web'
    ? <div><PageHeading>Quét mã</PageHeading><GatedRoute><WebScan /></GatedRoute></div>
    : <div><PageHeading>Quét mã</PageHeading><GatedRoute><AppScan /></GatedRoute></div>
}

/* ── Web: upload + sample library ─────────────────────────────────── */

function WebScan() {
  const { problem, setProblem, handle, handleFile } = useScanHandler()
  const [busy, setBusy] = useState(false)
  const [over, setOver] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)
  const take = async (f?: File) => { setProblem(null); setBusy(true); await handleFile(f); setBusy(false) }
  const onDrop = (e: DragEvent) => { e.preventDefault(); setOver(false); void take(e.dataTransfer.files[0]) }
  return (
    <>
      <PayTabs active="scan" />
      <h2 className="mb-3 text-[17px] leading-[26px] font-bold">Tải ảnh mã QR</h2>
      <label
        onDragOver={(e) => { e.preventDefault(); setOver(true) }} onDragLeave={() => setOver(false)} onDrop={onDrop}
        className={cx('flex min-h-[160px] cursor-pointer flex-col items-center justify-center gap-2 rounded-[12px] border border-dashed p-6 text-center focus-within:outline-2 focus-within:outline-tint', over ? 'border-tint bg-primary-soft' : 'border-line hover:bg-surface-2')}
      >
        <ImageUp size={28} strokeWidth={1.75} aria-hidden className="text-muted" />
        <span aria-live="polite">{busy ? 'Đang đọc mã…' : 'Kéo ảnh vào đây hoặc chọn từ máy'}</span>
        <span className="text-[13px] text-muted">PNG hoặc JPG</span>
        <input ref={fileRef} type="file" accept="image/png,image/jpeg" className="sr-only" onChange={(e) => { void take(e.target.files?.[0]); e.target.value = '' }} />
      </label>
      {problem ? (
        <div className="mt-4">
          <Callout tone="danger" title={problem.title} action={<Button size="sm" variant="secondary" onClick={() => (problem.action === 'other-image' ? fileRef.current?.click() : setProblem(null))}>{problem.action === 'other-image' ? 'Chọn ảnh khác' : 'Quét lại'}</Button>}>
            {problem.body}
          </Callout>
        </div>
      ) : null}
      <h2 className="mt-12 mb-1 text-[17px] leading-[26px] font-bold">Mã mẫu</h2>
      <p className="mb-3 text-[13px] text-muted">Mã dựng sẵn cho bản demo. Chọn một mã để đi tiếp như khi quét thật.</p>
      <SampleGrid onPick={(p) => { setProblem(null); handle(p) }} cols="grid-cols-2 sm:grid-cols-4" />
    </>
  )
}

/* ── App: camera, image, samples ──────────────────────────────────── */

type Cam = 'idle' | 'starting' | 'live' | 'denied' | 'error'

function AppScan() {
  const nav = useNavigate()
  const { problem, setProblem, handle, handleFile } = useScanHandler()
  const [cam, setCam] = useState<Cam>('idle')
  const [torch, setTorch] = useState<boolean | null>(null) // null = unsupported
  const [samples, setSamples] = useState(inFrame) // in /device there is no camera: samples first
  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)
  const canOfferCamera = !inFrame

  const stop = () => {
    streamRef.current?.getTracks().forEach((t) => t.stop())
    streamRef.current = null
    setTorch(null)
    setCam((c) => (c === 'live' || c === 'starting' ? 'idle' : c))
  }
  const start = async () => {
    if (!navigator.mediaDevices?.getUserMedia) return setCam('denied')
    setCam('starting')
    try {
      const s = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' }, audio: false })
      streamRef.current = s
      if (videoRef.current) { videoRef.current.srcObject = s; await videoRef.current.play().catch(() => {}) }
      const caps = s.getVideoTracks()[0]?.getCapabilities?.() as (MediaTrackCapabilities & { torch?: boolean }) | undefined
      setTorch(caps?.torch ? false : null)
      setCam('live')
    } catch (e) {
      const n = (e as Error).name
      setCam(n === 'NotAllowedError' || n === 'SecurityError' || n === 'NotFoundError' || n === 'OverconstrainedError' ? 'denied' : 'error')
    }
  }

  // Stop on unmount, when the tab is hidden, and whenever a sheet covers the viewfinder.
  useEffect(() => {
    const onVis = () => { if (document.visibilityState === 'hidden') stop() }
    document.addEventListener('visibilitychange', onVis)
    return () => { document.removeEventListener('visibilitychange', onVis); streamRef.current?.getTracks().forEach((t) => t.stop()) }
  }, [])
  useEffect(() => { if (samples || problem) stop() }, [samples, problem])

  // Detection loop while live (BarcodeDetector where the browser has it).
  useEffect(() => {
    if (cam !== 'live') return
    const d = makeDetector()
    if (!d) return
    let busy = false
    const id = setInterval(async () => {
      const v = videoRef.current
      if (busy || !v || v.readyState < 2) return
      busy = true
      try { const r = await d.detect(v); if (r[0]?.rawValue) { clearInterval(id); handle(r[0].rawValue) } } catch { /* frame not ready */ }
      busy = false
    }, 250)
    return () => clearInterval(id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cam])

  const toggleTorch = async () => {
    const t = streamRef.current?.getVideoTracks()[0]
    if (!t || torch === null) return
    try { await t.applyConstraints({ advanced: [{ torch: !torch } as MediaTrackConstraintSet] }); setTorch(!torch) } catch { setTorch(null) }
  }
  const close = () => (window.history.length > 1 ? nav(-1) : nav('/home'))

  let message: string
  if (!canOfferCamera) message = 'Bản xem trên điện thoại không dùng camera. Chọn Mã mẫu hoặc ảnh.'
  else if (cam === 'denied') message = 'Wallet cần quyền dùng camera để quét mã.'
  else if (cam === 'error') message = 'Không mở được camera.'
  else if (cam === 'starting') message = 'Đang mở camera…'
  else if (cam === 'live') message = Detector ? 'Đưa mã QR vào khung' : 'Trình duyệt này chưa đọc được mã từ camera. Dùng Chọn ảnh hoặc Mã mẫu.'
  else message = 'Bật camera để quét mã của cửa hàng, ngân hàng hoặc ví.'

  const tool = (label: string, icon: ReactNode, onClick: () => void, pressed?: boolean) => (
    <button type="button" onClick={onClick} aria-pressed={pressed} className="flex min-w-[64px] flex-col items-center gap-1.5 rounded-xl py-1 text-white">
      <span aria-hidden className={cx('inline-flex size-12 items-center justify-center rounded-full', pressed ? 'bg-white text-ink' : 'bg-white/15')}>{icon}</span>
      <span className="text-[13px] leading-[18px]">{label}</span>
    </button>
  )

  return (
    <div className="fixed inset-0 z-40 flex flex-col bg-black text-white">
      <video ref={videoRef} playsInline muted aria-hidden className={cx('absolute inset-0 size-full object-cover', cam !== 'live' && 'hidden')} />
      <div className="relative z-10 flex h-14 items-center px-2 pt-[env(safe-area-inset-top)]">
        <button type="button" onClick={close} aria-label="Đóng" className="inline-flex size-11 items-center justify-center rounded-full hover:bg-white/10"><X size={24} strokeWidth={1.75} /></button>
        <p className="flex-1 text-center text-[17px] font-bold">Quét mã</p>
        <span className="w-11" />
      </div>
      <div className="relative z-10 flex flex-1 flex-col items-center justify-center px-4">
        <p role="status" aria-live="polite" className="mb-5 max-w-[32ch] text-center text-[15px] leading-[22px]">{message}</p>
        <div className="relative aspect-square w-[min(240px,calc(100vw-32px))]" aria-hidden>
          {['top-0 left-0 border-t-4 border-l-4 rounded-tl-[20px]', 'top-0 right-0 border-t-4 border-r-4 rounded-tr-[20px]', 'bottom-0 left-0 border-b-4 border-l-4 rounded-bl-[20px]', 'bottom-0 right-0 border-r-4 border-b-4 rounded-br-[20px]'].map((c) => (
            <span key={c} className={cx('absolute size-12 border-white', c)} />
          ))}
        </div>
        {canOfferCamera && cam !== 'live' && cam !== 'starting' ? (
          <Button className="mt-6" onClick={() => void start()}>{cam === 'error' ? 'Thử lại' : cam === 'denied' ? 'Thử lại' : 'Bật camera'}</Button>
        ) : null}
      </div>
      <div className="relative z-10 flex justify-center gap-6 px-4 pt-3 pb-[max(20px,env(safe-area-inset-bottom))]">
        {torch !== null ? tool('Đèn', <Flashlight size={22} strokeWidth={1.75} />, () => void toggleTorch(), torch) : null}
        {tool('Chọn ảnh', <ImageUp size={22} strokeWidth={1.75} />, () => fileRef.current?.click())}
        {tool('Mã mẫu', <LayoutGrid size={22} strokeWidth={1.75} />, () => setSamples(true))}
        <input ref={fileRef} type="file" accept="image/png,image/jpeg" className="sr-only" tabIndex={-1} aria-label="Chọn ảnh mã QR" onChange={(e) => { setProblem(null); void handleFile(e.target.files?.[0]); e.target.value = '' }} />
      </div>

      <Sheet open={samples} onOpenChange={setSamples} title="Mã mẫu" description="Mã dựng sẵn cho bản demo.">
        <SampleGrid onPick={(p) => { setSamples(false); handle(p) }} cols="grid-cols-2" />
      </Sheet>
      <Sheet open={!!problem} onOpenChange={(o) => !o && setProblem(null)} title={problem?.title ?? ''} description={problem?.body}>
        <Button block onClick={() => { if (problem?.action === 'other-image') fileRef.current?.click(); setProblem(null) }}>
          {problem?.action === 'other-image' ? 'Chọn ảnh khác' : 'Quét lại'}
        </Button>
      </Sheet>
    </div>
  )
}
