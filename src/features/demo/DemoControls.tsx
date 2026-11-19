import { Circle, FlaskConical, RotateCcw } from 'lucide-react'
import { useState, type ReactNode } from 'react'
import {
  advanceClock, cashierScan, msToNextMonth, refundLatestMerchant, reset, resolvePending, resolveVerification, setScenario, setSetting, simulateIncoming,
  useSettings, useWorld, type Settings,
} from '@/app/store'
import { SCENARIOS, type Scenario } from '@/mock/seed'
import { Button, cx, Ico, IconButton, Sheet } from '@/components/app-ui'
import { Box } from '@/components/ui/box'
import { Button as GButton, ButtonText } from '@/components/ui/button'
import { HStack } from '@/components/ui/hstack'
import { Radio, RadioGroup, RadioIcon, RadioIndicator, RadioLabel } from '@/components/ui/radio'
import { Text } from '@/components/ui/text'
import { VStack } from '@/components/ui/vstack'
import { formatVnd } from '@/domain/money'
import { ThemeControls } from './ThemeControls'

function Group({ title, note, children }: { title: string; note?: string; children: ReactNode }) {
  return (
    <VStack role="group" aria-label={title} className="border-t border-border py-3 first:border-t-0 first:pt-0">
      <Text size="sm" bold aria-hidden>{title}</Text>
      {note ? <Text size="xs" className="mt-1 text-muted-foreground">{note}</Text> : null}
      <HStack className="mt-2 flex-wrap gap-2">{children}</HStack>
    </VStack>
  )
}

function Chip<T extends string>({ value, current, onPick, children }: { value: T; current: T; onPick: (v: T) => void; children: string }) {
  const on = value === current
  return (
    <GButton size="sm" variant={on ? 'default' : 'secondary'} aria-pressed={on} onPress={() => onPick(value)} className="rounded-full">
      <ButtonText className="text-sm">{children}</ButtonText>
    </GButton>
  )
}

function Act({ onClick, children, disabled }: { onClick: () => void; children: string; disabled?: string }) {
  return (
    <VStack>
      <GButton size="sm" variant={disabled ? 'outline' : 'secondary'} isDisabled={!!disabled} onPress={onClick} className="rounded-full">
        <ButtonText className="text-sm">{children}</ButtonText>
      </GButton>
      {disabled ? <Text size="xs" className="mt-1 px-1 text-muted-foreground">{disabled}</Text> : null}
    </VStack>
  )
}

/** A native-select replacement: gluestack RadioGroup, one radio per option. */
function RadioList<T extends string>({ label, value, options, onChange }: { label: string; value: T; options: readonly (readonly [T, string])[]; onChange: (v: T) => void }) {
  return (
    <RadioGroup aria-label={label} value={value} onChange={(v: string) => onChange(v as T)} className="w-full gap-2">
      {options.map(([v, l]) => (
        <Radio key={v} value={v} size="md">
          <RadioIndicator><RadioIcon as={Circle} /></RadioIndicator>
          <RadioLabel>{l}</RadioLabel>
        </Radio>
      ))}
    </RadioGroup>
  )
}

const FAILURES = [
  ['bank_declined', 'Ngân hàng từ chối'],
  ['recipient_bank_rejected', 'Ngân hàng nhận từ chối'],
  ['timeout_reversed', 'Quá thời gian, đã hoàn'],
] as const satisfies readonly (readonly [Settings['nextFailure'], string])[]

/** The panel body. Every control is a simulation (mock-data.md#demo-controls). */
export function DemoControlsPanel({ onAction }: { onAction?: (msg: string) => void }) {
  const s = useSettings()
  const w = useWorld()
  const say = (m: string) => onAction?.(m)
  const set = <K extends keyof Settings>(k: K) => (v: Settings[K]) => setSetting(k, v)
  const pending = w.transactions.filter((t) => t.status === 'pending').length
  return (
    <VStack>
      <Text size="sm" className="mb-3 text-muted-foreground">Công cụ cho người xem demo. Mọi thao tác ở đây là mô phỏng. Mã PIN và OTP mẫu: <Text size="sm" bold className="tabular-nums">123456</Text>.</Text>
      <Group title="Kịch bản" note={SCENARIOS.find((x) => x.id === s.scenario)?.hint}>
        <RadioList
          label="Kịch bản" value={s.scenario}
          options={SCENARIOS.map((x) => [x.id, x.label] as const)}
          onChange={(v: Scenario) => { setScenario(v); say('Đã chuyển kịch bản') }}
        />
        <Button variant="secondary" size="sm" onClick={() => { reset(); say('Đã đặt lại dữ liệu mẫu') }}><Ico as={RotateCcw} size="sm" />Đặt lại dữ liệu</Button>
      </Group>
      <Group title="Kết quả giao dịch tiếp theo" note={s.nextOutcome === 'success' ? 'Nạp tiền, chuyển đến ví và thanh toán QR luôn xong ngay nên bỏ qua “Đang xử lý”.' : 'Áp dụng cho giao dịch tiếp theo, sau đó tự về “Thành công”.'}>
        <Chip value="success" current={s.nextOutcome} onPick={set('nextOutcome')}>Thành công</Chip>
        <Chip value="pending" current={s.nextOutcome} onPick={set('nextOutcome')}>Đang xử lý</Chip>
        <Chip value="failed" current={s.nextOutcome} onPick={set('nextOutcome')}>Không thành công</Chip>
        {s.nextOutcome === 'failed' ? (
          <Box className="mt-1 w-full">
            <RadioList label="Lý do không thành công" value={s.nextFailure} options={FAILURES} onChange={set('nextFailure')} />
          </Box>
        ) : null}
      </Group>
      <Group title="Giao dịch đang xử lý" note={pending ? `${pending} giao dịch đang chờ` : 'Không có giao dịch nào đang chờ'}>
        <Act disabled={pending ? undefined : 'Không có giao dịch đang xử lý'} onClick={() => { resolvePending('success'); say('Đã hoàn tất giao dịch đang xử lý') }}>Hoàn tất thành công</Act>
        <Act disabled={pending ? undefined : 'Không có giao dịch đang xử lý'} onClick={() => { resolvePending('failed'); say('Giao dịch đang xử lý không thành công') }}>Cho không thành công</Act>
      </Group>
      <Group title="Sự kiện">
        <Act onClick={() => { simulateIncoming(); say(`Có người chuyển ${formatVnd(350_000)} đến ví`) }}>Nhận tiền từ liên hệ</Act>
        <Act disabled={s.paymentCodeOpen ? undefined : 'Mở Mã thanh toán trước'} onClick={() => { cashierScan(186_000); say('Thu ngân đã quét Mã thanh toán') }}>Thu ngân quét Mã thanh toán</Act>
        <Act disabled={w.transactions.some((t) => t.type === 'qr_merchant' && t.status === 'success') ? undefined : 'Chưa có thanh toán nào để hoàn'} onClick={() => say(refundLatestMerchant() ? 'Cửa hàng đã hoàn tiền giao dịch gần nhất' : 'Chưa có thanh toán nào để hoàn')}>Cửa hàng hoàn tiền</Act>
      </Group>
      <Group title="Xác thực khi mở ví">
        {([['verified', 'Khớp ngay'], ['needs_review', 'Cần kiểm tra'], ['blurry_id', 'CCCD mờ'], ['chip_unreadable', 'Không đọc được chip'], ['face_mismatch', 'Khuôn mặt không khớp'], ['weak_network', 'Mạng yếu']] as const).map(([v, l]) => (
          <Chip key={v} value={v} current={s.verification} onPick={set('verification')}>{l}</Chip>
        ))}
        {w.customer.kycStatus === 'verifying' ? <Act onClick={() => { resolveVerification('verified'); say('Hồ sơ đã được duyệt') }}>Duyệt hồ sơ đang kiểm tra</Act> : null}
      </Group>
      <Group title="Xác thực khuôn mặt khi giao dịch">
        <Chip value="match" current={s.faceMatch} onPick={set('faceMatch')}>Khớp</Chip>
        <Chip value="no_match" current={s.faceMatch} onPick={set('faceMatch')}>Không khớp</Chip>
      </Group>
      <Group title="Đồng hồ" note="Tua thời gian để thấy giao dịch hoàn tất, hóa đơn đến hạn, hạn mức sang tháng.">
        <Act onClick={() => { advanceClock(3600_000); say('Đã tua 1 giờ') }}>+1 giờ</Act>
        <Act onClick={() => { advanceClock(86_400_000); say('Đã tua 1 ngày') }}>+1 ngày</Act>
        <Act onClick={() => { advanceClock(msToNextMonth()); say('Đã tua sang tháng sau') }}>Sang tháng sau</Act>
      </Group>
      <Group title="Độ trễ mạng">
        <Chip value="none" current={s.latency} onPick={set('latency')}>0 giây</Chip>
        <Chip value="normal" current={s.latency} onPick={set('latency')}>Bình thường</Chip>
        <Chip value="slow" current={s.latency} onPick={set('latency')}>Chậm (3 giây)</Chip>
      </Group>
    </VStack>
  )
}

/** The full demo panel in a Sheet; the web sidebar opens it from the Demo controls box (">"), the app from its NavBar. */
export function DemoControlsSheet({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  const [msg, setMsg] = useState('')
  return (
    <Sheet open={open} onOpenChange={onOpenChange} title="Demo controls">
      <VStack className="mb-3 border-b border-border pb-3"><ThemeControls title={false} /></VStack>
      <DemoControlsPanel onAction={setMsg} />
      <Box role="status" aria-live="polite" className="min-h-5"><Text size="sm">{msg}</Text></Box>
    </Sheet>
  )
}

export function DemoControlsButton({ compact, className }: { compact?: boolean; className?: string }) {
  const [open, setOpen] = useState(false)
  return (
    <>
      {compact ? (
        <IconButton label="Demo controls" className={cx(className)} onClick={() => setOpen(true)}><Ico as={FlaskConical} className="text-primary" /></IconButton>
      ) : (
        <Button variant="secondary" size="sm" className={className} onClick={() => setOpen(true)}><Ico as={FlaskConical} size="sm" />Demo controls</Button>
      )}
      <DemoControlsSheet open={open} onOpenChange={setOpen} />
    </>
  )
}
