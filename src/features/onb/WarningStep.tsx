import { TriangleAlert } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { useLayout } from '@/app/layout'
import { Button, cx } from '@/components/app-ui'
import { Alert, AlertIcon, AlertText } from '@/components/ui/alert'
import { Box } from '@/components/ui/box'
import { HStack } from '@/components/ui/hstack'
import { CheckIcon } from '@/components/ui/icon'
import { Text } from '@/components/ui/text'
import { VStack } from '@/components/ui/vstack'
import { Checkbox, CheckboxIcon, CheckboxIndicator, CheckboxLabel } from '@/components/ui/checkbox'
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
      <Checkbox
        value="read" isChecked={ticked} isDisabled={!reached} onChange={setTicked}
        aria-label="Tôi đã đọc và hiểu" aria-describedby={!reached ? 'warn-help' : undefined}
        className="min-h-11 gap-3"
      >
        <CheckboxIndicator><CheckboxIcon as={CheckIcon} /></CheckboxIndicator>
        <CheckboxLabel className={cx('text-base', !reached && 'text-muted-foreground')}>Tôi đã đọc và hiểu</CheckboxLabel>
      </Checkbox>
      {!reached ? <Text id="warn-help" size="sm" className="text-muted-foreground">Cuộn hết nội dung để xác nhận</Text> : null}
      <Button block disabled={!ok} onClick={() => { mark('warningAt'); go('terms') }}>Tiếp tục</Button>
    </>}>
      <Box tabIndex={0} role="region" aria-label="Các hành vi bị cấm" className={cx('relative overflow-y-auto rounded-xl border border-border p-4', layout === 'web' ? 'max-h-[360px]' : 'max-h-[calc(100dvh-380px)] min-h-40')}>
        <VStack role="list" className="gap-4">
          {WARNING_ITEMS.map((t) => (
            <HStack key={t} role="listitem" className="gap-3"><Box aria-hidden className="mt-2 size-1.5 shrink-0 rounded-full bg-foreground" /><Text>{t}</Text></HStack>
          ))}
        </VStack>
        <Alert variant="destructive" className="mt-6 gap-3 bg-destructive/10 p-3">
          <AlertIcon as={TriangleAlert} className="size-5" />
          <AlertText className="text-base">{WARNING_CONSEQUENCE}</AlertText>
        </Alert>
        <Box ref={ref} aria-hidden className="h-px" />
      </Box>
    </StepShell>
  )
}
