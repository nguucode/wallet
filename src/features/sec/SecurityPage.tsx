import { Fingerprint, KeyRound } from 'lucide-react'
import { useEffect, useState, type ReactNode } from 'react'
import { useLayout } from '@/app/layout'
import { addNotification, changePin, now, setDeviceBiometric, useWorld, verifyPin } from '@/app/store'
import { Button, Card, cx, Disc, Ico, Sheet, Skeleton, INSET } from '@/components/app-ui'
import { Box } from '@/components/ui/box'
import { useGluestackColors } from '@/components/ui/gluestack-ui-provider/useGluestackColors'
import { HStack } from '@/components/ui/hstack'
import { Switch } from '@/components/ui/switch'
import { Text } from '@/components/ui/text'
import { VStack } from '@/components/ui/vstack'
import { fmtTime } from '@/features/flow/FlowKit'
import { PinPad } from './AuthSheet'
import { CHANGE_PIN_START, changePinStep, type ChangePin } from './changePin'
import { ScreenTitle, useLoaded, useToast } from './kit'

const security = (title: string, body: string) => addNotification({ kind: 'security', title, body, link: '/me/security' })

/** US-SEC-006 (biometric toggle) and US-SEC-007 (change PIN sheet). P1 rows (devices, lock wallet) are not shown. */
export default function SecurityPage() {
  const w = useWorld()
  const layout = useLayout()
  const loaded = useLoaded()
  const toast = useToast()
  const colors = useGluestackColors()
  const [pinFor, setPinFor] = useState<'biometric' | 'change' | null>(null)
  const sec = w.security
  const lockedUntil = sec.pinLockedUntil && new Date(sec.pinLockedUntil).getTime() > now() ? sec.pinLockedUntil : undefined

  const toggle = () => {
    if (!sec.deviceBiometric) return setPinFor('biometric')
    setDeviceBiometric(false)
    toast.show('Đã tắt sinh trắc học thiết bị')
    security('Đã tắt sinh trắc học thiết bị', 'Giao dịch sẽ dùng mã PIN.')
  }

  return (
    <Box>
      <ScreenTitle>Bảo mật</ScreenTitle>
      <Card inset="rows">
        <VStack role="list" className="divide-y divide-border">
          <SettingRow
            icon={<Ico as={KeyRound} />}
            title="Mã PIN"
            desc={lockedUntil ? <Text size="sm" className="text-destructive">Mã PIN đang tạm khóa đến {fmtTime(lockedUntil)}</Text> : 'Dùng để xác thực giao dịch. Không chia sẻ cho bất kỳ ai.'}
            control={<Button variant="secondary" size="sm" onClick={() => setPinFor('change')}>Đổi mã PIN</Button>}
          />
          <SettingRow
            icon={<Ico as={Fingerprint} />}
            title="Sinh trắc học thiết bị"
            descId="bio-desc"
            desc={layout === 'web'
              ? 'Chỉ có trên ứng dụng điện thoại. Bản demo: thu cửa sổ dưới 1024px để thử.'
              : 'Dùng Face ID hoặc vân tay thay mã PIN cho giao dịch không cần xác thực khuôn mặt.'}
            control={layout === 'web' ? null : !loaded ? <Skeleton className="h-7 w-12 rounded-full" /> : (
              <Switch
                value={sec.deviceBiometric} onValueChange={toggle}
                aria-label="Sinh trắc học thiết bị" aria-describedby="bio-desc"
                isDisabled={!sec.deviceBiometric && !!lockedUntil}
                trackColor={{ false: colors.input, true: colors.primary }}
                thumbColor={colors.background}
              />
            )}
          />
        </VStack>
      </Card>

      <Sheet open={pinFor === 'biometric'} onOpenChange={(o) => !o && setPinFor(null)} title="Xác thực giao dịch" description="Bật sinh trắc học thiết bị">
        <VerifyPin onOk={() => {
          setPinFor(null)
          setDeviceBiometric(true)
          toast.show('Đã bật sinh trắc học thiết bị')
          security('Đã bật sinh trắc học thiết bị', 'Face ID hoặc vân tay có thể thay mã PIN cho giao dịch nhỏ.')
        }} />
      </Sheet>
      <ChangePinSheet open={pinFor === 'change'} onClose={() => setPinFor(null)} onDone={() => {
        setPinFor(null)
        toast.show('Đã đổi mã PIN')
        security('Mã PIN đã được thay đổi', 'Nếu không phải bạn, hãy liên hệ hỗ trợ ngay.')
      }} />
      {toast.node}
    </Box>
  )
}

function SettingRow({ icon, title, desc, descId, control }: { icon: ReactNode; title: string; desc: ReactNode; descId?: string; control: ReactNode }) {
  return (
    <HStack role="listitem" className={cx('min-h-[60px] items-center gap-3 py-3 mac:min-h-[38px] mac:py-2', INSET)}>
      <Disc size={40}>{icon}</Disc>
      <VStack className="min-w-0 flex-1">
        <Text className="font-medium">{title}</Text>
        <Text id={descId} size="sm" className="text-muted-foreground">{desc}</Text>
      </VStack>
      {control}
    </HStack>
  )
}

function LockedNote({ until }: { until: string }) {
  return <Text role="alert" className="py-6 text-center text-destructive">Mã PIN đang tạm khóa do nhập sai nhiều lần. Thử lại sau {fmtTime(until)}.</Text>
}

function VerifyPin({ onOk }: { onOk: () => void }) {
  const [error, setError] = useState<string>()
  const [locked, setLocked] = useState<string>()
  if (locked) return <LockedNote until={locked} />
  return (
    <PinPad label="Mã PIN 6 số" error={error} onComplete={(pin) => {
      const r = verifyPin(pin)
      if (r.ok) return onOk()
      if (r.lockedUntil) setLocked(r.lockedUntil)
      else setError(`Mã PIN không đúng. Còn ${r.attemptsLeft} lần thử.`)
    }} />
  )
}

const STEP_LABEL = { current: 'Nhập mã PIN hiện tại', new: 'Nhập mã PIN mới', confirm: 'Nhập lại mã PIN mới', done: '' }

/** US-SEC-007: wrong current PINs count against the same counter and lock as transactions (verifyPin). */
function ChangePinSheet({ open, onClose, onDone }: { open: boolean; onClose: () => void; onDone: () => void }) {
  const w = useWorld()
  const [s, setS] = useState<ChangePin>(CHANGE_PIN_START)
  useEffect(() => { if (open) setS(CHANGE_PIN_START) }, [open])
  useEffect(() => {
    if (s.step === 'done') { changePin(s.next); onDone() }
  }, [s.step]) // eslint-disable-line react-hooks/exhaustive-deps
  const until = s.lockedUntil ?? (w.security.pinLockedUntil && new Date(w.security.pinLockedUntil).getTime() > now() ? w.security.pinLockedUntil : undefined)
  const idx = ['current', 'new', 'confirm'].indexOf(s.step)
  return (
    <Sheet open={open} onOpenChange={(o) => !o && onClose()} title="Đổi mã PIN">
      <HStack role="list" className="mb-3 justify-center gap-2" aria-label={`Bước ${idx + 1} trên 3`}>
        {[0, 1, 2].map((i) => <Box key={i} role="listitem" aria-hidden className={cx('size-2 rounded-full', i <= idx ? 'bg-foreground' : 'bg-muted')} />)}
      </HStack>
      {s.step === 'current' && until ? <LockedNote until={until} /> : s.step === 'done' ? null : (
        <>
          <Text data-align="free" className="mb-2 text-center font-semibold" aria-live="polite">{STEP_LABEL[s.step]}</Text>
          <PinPad key={s.n} label={STEP_LABEL[s.step]} error={s.error} onComplete={(pin) => setS(changePinStep(s, pin, verifyPin))} />
        </>
      )}
    </Sheet>
  )
}
