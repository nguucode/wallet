import { Delete, Fingerprint, ScanFace } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { config } from '@/domain/config'
import { formatVnd } from '@/domain/money'
import type { AuthMethod } from '@/domain/types'
import { getState, verifyPin } from '@/app/store'
import { Button, cx, Ico, Sheet } from '@/components/app-ui'
import { Box } from '@/components/ui/box'
import { Button as GButton, ButtonText } from '@/components/ui/button'
import { Center } from '@/components/ui/center'
import { Grid, GridItem } from '@/components/ui/grid'
import { Input, InputField } from '@/components/ui/input'
import { Pressable } from '@/components/ui/pressable'
import { Text } from '@/components/ui/text'
import { VStack } from '@/components/ui/vstack'

import { fmtTime } from '@/app/format'

/** 6-digit PIN pad. Used by the auth sheet, onboarding and change-PIN. */
export function PinPad({ length = config.pin.length, onComplete, error, disabled, label }: {
  length?: number; onComplete: (pin: string) => void; error?: string; disabled?: boolean; label: string
}) {
  const [pin, setPin] = useState('')
  const [shake, setShake] = useState(false)
  const inputRef = useRef<{ focus: () => void }>(null)
  useEffect(() => {
    if (error) { setPin(''); setShake(true); const t = setTimeout(() => setShake(false), 300); return () => clearTimeout(t) }
  }, [error])
  const push = (d: string) => {
    if (disabled) return
    const next = (pin + d).slice(0, length)
    setPin(next)
    if (next.length === length) setTimeout(() => onComplete(next), 80)
  }
  return (
    <Box>
      {/* Real input so keyboards, password managers off, and screen readers work. macOS: it is the visible secure
          text field (24pt, AppKit regular); the dots and keypad are iPhone idioms, app only. */}
      <Box className="sr-only mac:not-sr-only mac:mx-auto mac:w-48">
        <Input isDisabled={disabled} isInvalid={!!error} className="mac:h-[26px] mac:min-h-0 mac:rounded-[10px] mac:bg-background">
          <InputField
            id="pin-input" ref={inputRef as never} autoFocus inputMode="numeric" autoComplete="off" type="password" maxLength={length}
            aria-label={label}
            value={pin}
            onChangeText={(t: string) => { const v = t.replace(/\D/g, '').slice(0, length); setPin(v); if (v.length === length) setTimeout(() => onComplete(v), 80) }}
            aria-invalid={!!error || undefined}
            aria-describedby={error ? 'pin-error' : undefined}
          />
        </Input>
      </Box>
      <Pressable onPress={() => inputRef.current?.focus()} aria-hidden focusable={false} className={cx('mx-auto flex-row gap-4 py-3 mac:hidden', shake && 'animate-pulse')}>
        {Array.from({ length }, (_, i) => (
          <Box key={i} className={cx('size-3.5 rounded-full', i < pin.length ? 'bg-foreground' : 'bg-muted')} />
        ))}
      </Pressable>
      <Text id="pin-error" role="alert" size="sm" className="min-h-5 text-center text-destructive">{error}</Text>
      <Grid className="mx-auto mt-2 max-w-xs gap-2 mac:hidden" _extra={{ className: 'grid-cols-3' }} aria-hidden>
        {['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', 'del'].map((k) => (
          <GridItem key={k || 'blank'} _extra={{ className: 'col-span-1' }}>
            {k === '' ? null : (
              <GButton
                variant="secondary" focusable={false} isDisabled={disabled}
                aria-label={k === 'del' ? 'Xóa' : undefined}
                onPress={() => (k === 'del' ? setPin((p) => p.slice(0, -1)) : push(k))}
                className="h-14 w-full rounded-xl"
              >
                {k === 'del' ? <Ico as={Delete} /> : <ButtonText className="text-2xl font-normal">{k}</ButtonText>}
              </GButton>
            )}
          </GridItem>
        ))}
      </Grid>
    </Box>
  )
}

function FaceScan({ onDone, reason }: { onDone: (ok: boolean) => void; reason: string }) {
  const [attempt, setAttempt] = useState(1)
  const [phase, setPhase] = useState<'ready' | 'scanning' | 'failed' | 'out'>('ready')
  const start = () => {
    setPhase('scanning')
    setTimeout(() => {
      if (getState().settings.faceMatch === 'match') return onDone(true)
      if (attempt >= config.face.maxRetries) setPhase('out')
      else { setPhase('failed'); setAttempt((a) => a + 1) }
    }, 1600)
  }
  return (
    <VStack className="items-center text-center">
      <Text className="text-center text-muted-foreground">{reason}</Text>
      <Box className="relative mx-auto my-6 size-44">
        <svg viewBox="0 0 100 100" className="absolute inset-0" aria-hidden>
          <circle cx="50" cy="50" r="46" fill="none" className="stroke-border" strokeWidth="3" />
          {/* Arc fills over the 1.6s scan; no keyframes needed (the old `ring` keyframe lived in the removed CSS). */}
          <circle cx="50" cy="50" r="46" fill="none" className="stroke-primary" strokeWidth="3" strokeDasharray="289" strokeDashoffset={phase === 'scanning' ? 0 : 289} strokeLinecap="round" style={{ transition: phase === 'scanning' ? 'stroke-dashoffset 1.6s linear' : 'none' }} transform="rotate(-90 50 50)" />
        </svg>
        <Center className="absolute inset-4 rounded-full bg-muted"><Ico as={ScanFace} size="xl" className="size-16 text-muted-foreground" /></Center>
      </Box>
      <Text role="status" aria-live="polite" className={cx('min-h-10 text-center', (phase === 'failed' || phase === 'out') && 'text-destructive')}>
        {phase === 'ready' && 'Đưa khuôn mặt vào giữa khung tròn, giữ máy ngang tầm mắt.'}
        {phase === 'scanning' && 'Đang xác thực…'}
        {phase === 'failed' && <>Khuôn mặt không khớp với CCCD. Còn {config.face.maxRetries - attempt + 1} lần thử.</>}
        {phase === 'out' && 'Bạn đã thử quá số lần cho phép. Thử lại sau.'}
      </Text>
      {phase === 'out' ? (
        <Button variant="secondary" block className="mt-3" onClick={() => onDone(false)}>Đóng</Button>
      ) : (
        <Button block className="mt-3" loading={phase === 'scanning'} onClick={start}>{phase === 'failed' ? 'Thử lại' : 'Bắt đầu quét'}</Button>
      )}
    </VStack>
  )
}

/** Step-up auth (US-SEC-001/002). onSuccess runs only after a verified PIN/biometric/face. */
export function AuthSheet({ open, onOpenChange, method, amount, onSuccess }: {
  open: boolean; onOpenChange: (o: boolean) => void; method: AuthMethod; amount: number; onSuccess: (method: AuthMethod) => void
}) {
  const [error, setError] = useState<string>()
  const [usePin, setUsePin] = useState(false)
  const sec = getState().world.security
  const locked = sec.pinLockedUntil && new Date(sec.pinLockedUntil).getTime() > Date.now() + getState().settings.clockOffsetMs
  useEffect(() => { if (open) { setError(undefined); setUsePin(false) } }, [open])

  const effective = method === 'device_biometric' && usePin ? 'pin' : method
  const title = effective === 'face_match' ? 'Xác thực khuôn mặt' : 'Xác thực giao dịch'
  const reason = amount > config.stepUp.perTransaction
    ? `Giao dịch trên ${formatVnd(config.stepUp.perTransaction)} cần xác thực khuôn mặt theo quy định.`
    : `Tổng giao dịch hôm nay vượt ${formatVnd(config.stepUp.perDay)} nên cần xác thực khuôn mặt theo quy định.`

  return (
    <Sheet open={open} onOpenChange={onOpenChange} title={title} closeLabel="Hủy" description={effective === 'face_match' ? undefined : `Nhập mã PIN để xác nhận ${formatVnd(amount)}`}>
      {effective === 'face_match' ? (
        <FaceScan reason={reason} onDone={(ok) => (ok ? onSuccess('face_match') : onOpenChange(false))} />
      ) : effective === 'device_biometric' ? (
        <VStack className="items-center text-center">
          <GButton variant="secondary" onPress={() => setTimeout(() => onSuccess('device_biometric'), 500)} className="mx-auto my-6 size-24 rounded-full" aria-label="Xác thực bằng sinh trắc học thiết bị">
            <Ico as={Fingerprint} className="size-12" />
          </GButton>
          <Text className="text-center text-muted-foreground">Chạm để dùng vân tay hoặc Face ID của điện thoại.</Text>
          <Button variant="ghost" className="mt-3" onClick={() => setUsePin(true)}>Dùng mã PIN</Button>
        </VStack>
      ) : locked ? (
        <Text role="alert" className="py-6 text-center text-destructive">Mã PIN đang tạm khóa do nhập sai nhiều lần. Thử lại sau {fmtTime(sec.pinLockedUntil!)}.</Text>
      ) : (
        <PinPad
          label="Mã PIN 6 số"
          error={error}
          onComplete={(pin) => {
            const r = verifyPin(pin)
            if (r.ok) return onSuccess('pin')
            setError(r.lockedUntil ? `Mã PIN đã bị khóa đến ${fmtTime(r.lockedUntil)}.` : `Mã PIN không đúng. Còn ${r.attemptsLeft} lần thử.`)
          }}
        />
      )}
    </Sheet>
  )
}
