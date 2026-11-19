import { FlaskConical, RotateCcw } from 'lucide-react'
import { useState, type ReactNode } from 'react'
import {
  advanceClock, cashierScan, msToNextMonth, refundLatestMerchant, reset, resolvePending, resolveVerification, setScenario, setSetting, simulateIncoming,
  useSettings, useWorld, type Settings,
} from '@/app/store'
import { SCENARIOS, type Scenario } from '@/mock/seed'
import { Button, cx, IconButton, Sheet } from '@/components/ui'
import { formatVnd } from '@/domain/money'

function Group({ title, note, children }: { title: string; note?: string; children: ReactNode }) {
  return (
    <fieldset className="border-t border-line-soft pt-stack pb-stack first:border-t-0 first:pt-0">
      <legend className="text-[13px] font-semibold">{title}</legend>
      {note ? <p className="mt-1 text-[12px] leading-4 text-muted">{note}</p> : null}
      <div className="mt-header flex flex-wrap gap-2">{children}</div>
    </fieldset>
  )
}

function Chip<T extends string>({ value, current, onPick, children }: { value: T; current: T; onPick: (v: T) => void; children: ReactNode }) {
  const on = value === current
  return (
    <button type="button" aria-pressed={on} onClick={() => onPick(value)} className={cx('h-8 rounded-full px-3 text-[13px] font-medium', on ? 'bg-primary text-white' : 'bg-surface-2 text-primary-ink hover:bg-primary-soft')}>
      {children}
    </button>
  )
}

function Act({ onClick, children, disabled }: { onClick: () => void; children: ReactNode; disabled?: string }) {
  return (
    <span className="inline-flex flex-col">
      <button type="button" onClick={onClick} disabled={!!disabled} className="h-8 rounded-full bg-surface-2 px-3 text-[13px] font-medium text-primary-ink hover:bg-primary-soft disabled:bg-transparent disabled:text-muted disabled:ring-1 disabled:ring-line">{children}</button>
      {disabled ? <span className="mt-1 px-1 text-[12px] leading-4 text-muted">{disabled}</span> : null}
    </span>
  )
}

/** The panel body. Every control is a simulation (mock-data.md#demo-controls). */
export function DemoControlsPanel({ onAction }: { onAction?: (msg: string) => void }) {
  const s = useSettings()
  const w = useWorld()
  const say = (m: string) => onAction?.(m)
  const set = <K extends keyof Settings>(k: K) => (v: Settings[K]) => setSetting(k, v)
  const pending = w.transactions.filter((t) => t.status === 'pending').length
  return (
    <div className="text-[15px]">
      <p className="mb-stack text-[13px] leading-[18px] text-muted">Công cụ cho người xem demo. Mọi thao tác ở đây là mô phỏng. Mã PIN và OTP mẫu: <b className="tnum text-ink">123456</b>.</p>
      <Group title="Kịch bản" note={SCENARIOS.find((x) => x.id === s.scenario)?.hint}>
        <label className="sr-only" htmlFor="demo-scenario">Kịch bản</label>
        <select id="demo-scenario" value={s.scenario} onChange={(e) => { setScenario(e.target.value as Scenario); say('Đã chuyển kịch bản') }} className="h-10 flex-1 rounded-[12px] border border-line bg-surface px-3">
          {SCENARIOS.map((x) => <option key={x.id} value={x.id}>{x.label}</option>)}
        </select>
        <Button variant="secondary" size="sm" onClick={() => { reset(); say('Đã đặt lại dữ liệu mẫu') }}><RotateCcw size={14} aria-hidden />Đặt lại dữ liệu</Button>
      </Group>
      <Group title="Kết quả giao dịch tiếp theo" note={s.nextOutcome === 'success' ? 'Nạp tiền, chuyển đến ví và thanh toán QR luôn xong ngay nên bỏ qua “Đang xử lý”.' : 'Áp dụng cho giao dịch tiếp theo, sau đó tự về “Thành công”.'}>
        <Chip value="success" current={s.nextOutcome} onPick={set('nextOutcome')}>Thành công</Chip>
        <Chip value="pending" current={s.nextOutcome} onPick={set('nextOutcome')}>Đang xử lý</Chip>
        <Chip value="failed" current={s.nextOutcome} onPick={set('nextOutcome')}>Không thành công</Chip>
        {s.nextOutcome === 'failed' ? (
          <select aria-label="Lý do không thành công" value={s.nextFailure} onChange={(e) => setSetting('nextFailure', e.target.value as Settings['nextFailure'])} className="h-8 rounded-full border border-line bg-surface px-3 text-[13px]">
            <option value="bank_declined">Ngân hàng từ chối</option>
            <option value="recipient_bank_rejected">Ngân hàng nhận từ chối</option>
            <option value="timeout_reversed">Quá thời gian, đã hoàn</option>
          </select>
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
    </div>
  )
}

export function DemoControlsButton({ compact, className }: { compact?: boolean; className?: string }) {
  const [open, setOpen] = useState(false)
  const [msg, setMsg] = useState('')
  return (
    <>
      {compact ? (
        <IconButton label="Demo controls" className={cx('text-tint', className)} onClick={() => setOpen(true)}><FlaskConical size={20} strokeWidth={1.75} /></IconButton>
      ) : (
        <Button variant="secondary" size="sm" onClick={() => setOpen(true)}><FlaskConical size={16} strokeWidth={1.75} aria-hidden />Demo controls</Button>
      )}
      <Sheet open={open} onOpenChange={setOpen} title="Demo controls">
        <DemoControlsPanel onAction={setMsg} />
        <p role="status" aria-live="polite" className="min-h-5 text-[13px] text-success">{msg}</p>
      </Sheet>
    </>
  )
}
