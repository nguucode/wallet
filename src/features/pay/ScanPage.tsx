import { Flashlight, ImageUp, LayoutGrid } from 'lucide-react'
import { useEffect, useRef, useState, type DragEvent, type ElementType } from 'react'
import { useNavigate } from 'react-router'
import { useLayout } from '@/app/layout'
import { useWorld } from '@/app/store'
import { parseQr } from '@/domain/qr'
import { sampleQrs } from '@/mock/seed'
import { GatedRoute } from '@/features/sec/Gate'
import { Button, Callout, CloseButton, cx, GroupLabel, Ico, Sheet, INSET } from '@/components/app-ui'
import { Box } from '@/components/ui/box'
import { Center } from '@/components/ui/center'
import { HStack } from '@/components/ui/hstack'
import { Pressable } from '@/components/ui/pressable'
import { Text } from '@/components/ui/text'
import { VStack } from '@/components/ui/vstack'
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
    <Box role="list" className={cx('grid gap-3', cols)}>
      {sampleQrs(w).map((q) => (
        <Box key={q.id} role="listitem">
          <Pressable role="button" onPress={() => onPick(q.payload)} className="h-full w-full items-center gap-2 rounded-3xl bg-card p-4 mac:rounded-[12px] mac:p-2.5 data-[hover=true]:bg-accent data-[active=true]:bg-accent">
            <QrImage payload={q.payload} size={88} label="" />
            <Text size="sm" className="line-clamp-2 text-center font-medium" title={q.label}>{q.label}</Text>
            <Text size="xs" className="text-center text-muted-foreground">{q.hint}</Text>
          </Pressable>
        </Box>
      ))}
    </Box>
  )
}

export default function ScanPage() {
  const layout = useLayout()
  return layout === 'web'
    ? <Box><PageHeading>Quét mã</PageHeading><GatedRoute><WebScan /></GatedRoute></Box>
    : <Box><PageHeading>Quét mã</PageHeading><GatedRoute><AppScan /></GatedRoute></Box>
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
      <GroupLabel className="mb-3 mac:mb-[11px]">Tải ảnh mã QR</GroupLabel>
      <Box
        onDragOver={(e) => { e.preventDefault(); setOver(true) }} onDragLeave={() => setOver(false)} onDrop={onDrop}
        className={cx('rounded-3xl border border-dashed mac:rounded-[12px]', over ? 'border-primary bg-primary/10' : 'border-foreground/25 hover:bg-muted')}
      >
        <Pressable role="button" onPress={() => fileRef.current?.click()} className="min-h-40 w-full items-center justify-center gap-2 rounded-xl p-6">
          <Ico as={ImageUp} size="xl" className="text-muted-foreground" />
          <Text aria-live="polite" className="text-center">{busy ? 'Đang đọc mã…' : 'Kéo ảnh vào đây hoặc chọn từ máy'}</Text>
          <Text size="sm" className="text-muted-foreground">PNG hoặc JPG</Text>
        </Pressable>
        {/* No gluestack file picker: a hidden native file input does the picking. */}
        <input ref={fileRef} type="file" accept="image/png,image/jpeg" className="sr-only" tabIndex={-1} aria-label="Chọn ảnh mã QR" onChange={(e) => { void take(e.target.files?.[0]); e.target.value = '' }} />
      </Box>
      {problem ? (
        <Box className="mt-3">
          <Callout tone="danger" title={problem.title} action={<Button size="sm" variant="secondary" onClick={() => (problem.action === 'other-image' ? fileRef.current?.click() : setProblem(null))}>{problem.action === 'other-image' ? 'Chọn ảnh khác' : 'Quét lại'}</Button>}>
            {problem.body}
          </Callout>
        </Box>
      ) : null}
      <GroupLabel className="mt-8 mb-1 mac:mt-[30px]">Mã mẫu</GroupLabel>
      <Text size="sm" className={cx('mb-3 text-muted-foreground', INSET)}>Mã dựng sẵn cho bản demo. Chọn một mã để đi tiếp như khi quét thật.</Text>
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
  const [samples, setSamples] = useState(false)
  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

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
  if (cam === 'denied') message = 'Wallet cần quyền dùng camera để quét mã.'
  else if (cam === 'error') message = 'Không mở được camera.'
  else if (cam === 'starting') message = 'Đang mở camera…'
  else if (cam === 'live') message = Detector ? 'Đưa mã QR vào khung' : 'Trình duyệt này chưa đọc được mã từ camera. Dùng Chọn ảnh hoặc Mã mẫu.'
  else message = 'Bật camera để quét mã của cửa hàng, ngân hàng hoặc ví.'

  const tool = (label: string, icon: ElementType, onClick: () => void, pressed?: boolean) => (
    <Pressable role="button" onPress={onClick} aria-pressed={pressed} className="min-w-16 items-center gap-2 rounded-xl py-1">
      <Center aria-hidden className={cx('size-12 rounded-full', pressed ? 'bg-foreground' : 'bg-foreground/15')}>
        <Ico as={icon} size="lg" className={pressed ? 'text-background' : 'text-foreground'} />
      </Center>
      <Text size="sm" className="text-foreground">{label}</Text>
    </Pressable>
  )

  // The camera surface stays dark in either theme: the `dark` class scopes the gluestack dark tokens to it.
  return (
    <VStack className="dark fixed inset-0 z-40 bg-background">
      {/* A camera feed has no gluestack equivalent: the native <video> stays. */}
      <video ref={videoRef} playsInline muted aria-hidden className={cx('absolute inset-0 size-full object-cover', cam !== 'live' && 'hidden')} />
      <HStack className="relative z-10 h-14 items-center px-2 pt-[env(safe-area-inset-top)]">
        <CloseButton onClick={close} />
        <Text size="lg" bold className="flex-1 text-center">Quét mã</Text>
        <Box className="w-11" />
      </HStack>
      <VStack className="relative z-10 flex-1 items-center justify-center px-4">
        <Text role="status" aria-live="polite" className="mb-6 max-w-[32ch] text-center">{message}</Text>
        <Box className="relative aspect-square w-[min(240px,calc(100vw-32px))]" aria-hidden>
          {['top-0 left-0 border-t-4 border-l-4 rounded-tl-2xl', 'top-0 right-0 border-t-4 border-r-4 rounded-tr-2xl', 'bottom-0 left-0 border-b-4 border-l-4 rounded-bl-2xl', 'bottom-0 right-0 border-r-4 border-b-4 rounded-br-2xl'].map((c) => (
            <Box key={c} className={cx('absolute size-12 border-foreground', c)} />
          ))}
        </Box>
        {cam !== 'live' && cam !== 'starting' ? (
          <Button className="mt-6" onClick={() => void start()}>{cam === 'error' ? 'Thử lại' : cam === 'denied' ? 'Thử lại' : 'Bật camera'}</Button>
        ) : null}
      </VStack>
      <HStack className="relative z-10 justify-center gap-6 px-4 pt-3 pb-[max(20px,env(safe-area-inset-bottom))]">
        {torch !== null ? tool('Đèn', Flashlight, () => void toggleTorch(), torch) : null}
        {tool('Chọn ảnh', ImageUp, () => fileRef.current?.click())}
        {tool('Mã mẫu', LayoutGrid, () => setSamples(true))}
        <input ref={fileRef} type="file" accept="image/png,image/jpeg" className="sr-only" tabIndex={-1} aria-label="Chọn ảnh mã QR" onChange={(e) => { setProblem(null); void handleFile(e.target.files?.[0]); e.target.value = '' }} />
      </HStack>

      <Sheet open={samples} onOpenChange={setSamples} title="Mã mẫu" description="Mã dựng sẵn cho bản demo.">
        <SampleGrid onPick={(p) => { setSamples(false); handle(p) }} cols="grid-cols-2" />
      </Sheet>
      <Sheet open={!!problem} onOpenChange={(o) => !o && setProblem(null)} title={problem?.title ?? ''} description={problem?.body}>
        <Button block onClick={() => { if (problem?.action === 'other-image') fileRef.current?.click(); setProblem(null) }}>
          {problem?.action === 'other-image' ? 'Chọn ảnh khác' : 'Quét lại'}
        </Button>
      </Sheet>
    </VStack>
  )
}
