import { Lock, ScanFace } from 'lucide-react'
import { toDataURL } from 'qrcode'
import { useEffect, useState, type ReactNode } from 'react'
import { useLayout } from '@/app/layout'
import { config } from '@/domain/config'
import { formatVnd } from '@/domain/money'
import { authFor, authLine } from '@/features/flow/FlowKit'
import { Avatar, Button, Card, cx, Ico, PageTitle, Skeleton } from '@/components/app-ui'
import { Box } from '@/components/ui/box'
import { Heading } from '@/components/ui/heading'
import { HStack } from '@/components/ui/hstack'
import { Image } from '@/components/ui/image'
import { Text } from '@/components/ui/text'
import { Textarea, TextareaInput } from '@/components/ui/textarea'
import { VStack } from '@/components/ui/vstack'

/** In-shell page title: visible h1 on web; on app the shell header shows the title, so the h1 is for screen readers. */
export function PageHeading({ children }: { children: ReactNode }) {
  return useLayout() === 'web'
    ? <PageTitle>{children}</PageTitle>
    : <Heading size="3xl" tabIndex={-1} data-page-title className="sr-only">{children}</Heading>
}

/** QR always black on white (DESIGN: scanner contrast), with loading and error states. */
export function QrImage({ payload, size, label }: { payload: string; size: number; label: string }) {
  const [state, setState] = useState<{ payload: string; url?: string; error?: boolean }>({ payload })
  const [retry, setRetry] = useState(0)
  useEffect(() => {
    let live = true
    toDataURL(payload, { margin: 2, width: size * 2, errorCorrectionLevel: 'M', color: { dark: '#000000', light: '#ffffff' } })
      .then((url) => live && setState({ payload, url }))
      .catch(() => live && setState({ payload, error: true }))
    return () => { live = false }
  }, [payload, size, retry])
  const box = { width: size, height: size }
  if (state.error && state.payload === payload)
    return (
      <VStack role="alert" className="items-center justify-center gap-3 rounded-xl border border-border bg-card p-4 text-center" style={box}>
        <Text>Không tạo được mã. Thử lại.</Text>
        <Button size="sm" variant="secondary" onClick={() => setRetry((r) => r + 1)}>Thử lại</Button>
      </VStack>
    )
  if (!state.url || state.payload !== payload)
    return <Box aria-busy aria-label="Đang tạo mã" role="img" style={box}><Skeleton className="size-full rounded-xl" /></Box>
  return <Box style={box}><Image size="full" source={{ uri: state.url }} aria-label={label} className="rounded-xl" /></Box>
}

export function MessageField({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <VStack className="mt-6 gap-2">
      <HStack className="items-baseline justify-between">
        <Text id="message-label" size="sm" className="font-medium">Lời nhắn</Text>
        <Text size="sm" className="text-muted-foreground tabular-nums" aria-live="off">{value.length}/{config.messageMax}</Text>
      </HStack>
      <Textarea className="h-auto">
        <TextareaInput
          id="message" multiline numberOfLines={2} maxLength={config.messageMax} value={value} placeholder={placeholder}
          onChangeText={(v: string) => onChange(v.slice(0, config.messageMax))}
          aria-labelledby="message-label"
          aria-describedby="message-count"
          className="px-4 py-3"
        />
      </Textarea>
      <Text id="message-count" className="sr-only">Tối đa {config.messageMax} ký tự</Text>
    </VStack>
  )
}

/** Amount fixed by a QR: no caret, lock icon, the reason, and any check error. */
export function LockedAmount({ amount, note, error }: { amount: number; note: string; error?: ReactNode }) {
  return (
    <VStack className="gap-2">
      <Text size="sm" className="font-medium">Số tiền</Text>
      <HStack className={cx('items-center gap-2 border-b-2 pb-2', error ? 'border-destructive' : 'border-border')}>
        <Text size="4xl" bold className="tabular-nums">{formatVnd(amount)}</Text>
        <Ico as={Lock} size="md" className="text-muted-foreground" />
      </HStack>
      <Text size="sm" className="text-muted-foreground">{note}</Text>
      {error ? <Text role="alert" size="sm" className="text-destructive">{error}</Text> : null}
    </VStack>
  )
}

/** Keeps the screen on while `on` (app layout only); silently ignored where unsupported. */
export function useWakeLock(on: boolean) {
  useEffect(() => {
    if (!on || !('wakeLock' in navigator)) return
    let lock: { release: () => Promise<void> } | undefined
    let live = true
    const get = () => (navigator as Navigator & { wakeLock: { request: (t: 'screen') => Promise<{ release: () => Promise<void> }> } }).wakeLock
      .request('screen').then((l) => { if (live) lock = l; else void l.release() }).catch(() => {})
    void get()
    const onVis = () => { if (document.visibilityState === 'visible') void get() }
    document.addEventListener('visibilitychange', onVis)
    return () => { live = false; document.removeEventListener('visibilitychange', onVis); void lock?.release().catch(() => {}) }
  }, [on])
}

export function RecipientChip({ name, sub, note, onChange }: { name: string; sub: ReactNode; note?: string; onChange?: () => void }) {
  return (
    <Card className="mb-6">
      <HStack className="items-center gap-3">
        <Avatar name={name} />
        <VStack className="min-w-0 flex-1">
          <Text className="font-semibold break-words">{name}</Text>
          <Text size="sm" className="text-muted-foreground">{sub}</Text>
          {note ? <Text size="xs" className="text-muted-foreground">{note}</Text> : null}
        </VStack>
        {onChange ? <Button variant="ghost" size="sm" onClick={onChange}>Đổi</Button> : null}
      </HStack>
    </Card>
  )
}

export function AuthNote({ type, amount }: { type: Parameters<typeof authLine>[0]; amount: number }) {
  const face = authFor(type, amount) === 'face_match'
  return (
    <HStack className="mt-3 items-start gap-2 rounded-lg border border-border bg-card px-4 py-3">
      <Ico as={face ? ScanFace : Lock} size="md" className="mt-1 shrink-0" />
      <Text>{authLine(type, amount)}</Text>
    </HStack>
  )
}
