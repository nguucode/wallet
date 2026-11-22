import { Nfc } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { getState, now, useWorld } from '@/app/store'
import { Button, cx, Ico, INSET } from '@/components/app-ui'
import { Box } from '@/components/ui/box'
import { Center } from '@/components/ui/center'
import { Heading } from '@/components/ui/heading'
import { Text } from '@/components/ui/text'
import { VStack } from '@/components/ui/vstack'
import { fmtDate } from '@/features/flow/FlowKit'
import { DataList, StepShell, useOnb } from './Frame'
import { maskIdNumber } from './steps'

/** Identity record from the chip or VNeID (shared by US-ONB-005 and US-ONB-006). */
export function IdentitySummary({ title }: { title: string }) {
  const c = useWorld().customer
  return (
    <Box role="region" aria-label={title}>
      <Heading as="h2" size="lg" className={cx('mb-2', INSET)}>{title}</Heading>
      <DataList rows={[
        ['Họ và tên', c.name.toUpperCase()],
        ['Số CCCD', <Text className="tabular-nums">{maskIdNumber(c.idNumber)}</Text>],
        ['Ngày sinh', fmtDate(c.dob)],
        ['Ngày hết hạn', fmtDate(c.idExpiry)],
      ]} />
    </Box>
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
        {expired ? <Text role="alert" size="sm" className="text-destructive">{EXPIRED}</Text> : null}
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
      <Text>Áp CCCD vào mặt lưng điện thoại, gần camera, giữ yên khoảng 30 giây.</Text>
      <Box className="relative mx-auto my-8 size-44">
        <svg viewBox="0 0 100 100" className="absolute inset-0" aria-hidden>
          <circle cx="50" cy="50" r={r} fill="none" className="stroke-border" strokeWidth="4" />
          <circle cx="50" cy="50" r={r} fill="none" strokeWidth="4" strokeLinecap="round" strokeDasharray={len} strokeDashoffset={len * (1 - pct / 100)} transform="rotate(-90 50 50)" className="stroke-primary transition-[stroke-dashoffset] duration-150" />
        </svg>
        <Center className="absolute inset-5 rounded-full bg-muted"><Ico as={Nfc} className="size-14 text-muted-foreground" /></Center>
      </Box>
      <VStack aria-live="polite" className="min-h-12 items-center text-center">
        {phase === 'reading' ? <><Text className="font-semibold tabular-nums">Đang đọc chip… {pct}%</Text><Text size="sm" className="text-muted-foreground">Giữ yên thẻ, đừng nhấc ra.</Text></> : null}
        {phase === 'stalled' ? <Text role="alert" className="text-destructive">Chưa đọc được chip. Tháo ốp lưng và giữ thẻ sát mặt lưng điện thoại.</Text> : null}
      </VStack>
    </StepShell>
  )
}
