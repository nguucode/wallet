import { ScanFace } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { useLayout } from '@/app/layout'
import { Button, cx, Ico } from '@/components/app-ui'
import { Box } from '@/components/ui/box'
import { Center } from '@/components/ui/center'
import { Text } from '@/components/ui/text'
import { VStack } from '@/components/ui/vstack'
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
      <Text>Nhìn thẳng vào camera{layout === 'web' ? ' của máy tính' : ''}, đủ sáng, không đeo kính râm hay khẩu trang.</Text>
      {/* Simulated camera view: always dark, like a viewfinder, in either theme. */}
      <VStack className={cx('mt-6 items-center rounded-2xl bg-black', layout === 'web' ? 'aspect-[4/3] justify-center' : 'py-8')}>
        <Text aria-live="assertive" className="mb-3 min-h-6 px-4 text-center font-semibold text-white">{scanning ? PROMPTS[i] : ''}</Text>
        <Box className="relative h-[200px] w-[156px]">
          <svg viewBox="0 0 156 200" className="absolute inset-0" aria-hidden>
            <ellipse cx="78" cy="100" rx="74" ry="96" fill="none" stroke="rgb(255 255 255 / 0.35)" strokeWidth="3" />
            {scanning ? <ellipse cx="78" cy="100" rx="74" ry="96" fill="none" strokeWidth="3" pathLength={100} strokeDasharray="100" strokeDashoffset={100 * (1 - progress)} stroke="white" className="transition-[stroke-dashoffset] duration-700" /> : null}
          </svg>
          <Center className="absolute inset-0"><Ico as={ScanFace} className="size-[72px] text-white/70" /></Center>
        </Box>
      </VStack>
      <Text size="sm" className="mt-3 block text-muted-foreground">Mô phỏng: camera dùng khuôn mặt mẫu.</Text>
    </StepShell>
  )
}
