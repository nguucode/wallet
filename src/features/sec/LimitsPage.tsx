import { now, dayCounter, useWorld } from '@/app/store'
import { config } from '@/domain/config'
import { formatVnd } from '@/domain/money'
import { Badge, Card, cx, Skeleton } from '@/components/ui'
import { ScreenTitle, useLoaded } from './kit'
import { limitCounters, nextReset, type Counter } from './limitsView'

/** US-SEC-005. */
export default function LimitsPage() {
  const w = useWorld()
  const loaded = useLoaded()
  const at = new Date(now())
  const c = limitCounters(w.transactions, at)
  const reset = `Làm mới lúc 00:00 ${nextReset(at)}`
  const s = config.stepUp

  return (
    <div>
      <ScreenTitle>Hạn mức</ScreenTitle>
      {!loaded ? (
        <div className="space-y-4" aria-busy>
          {[0, 1, 2].map((i) => (
            <Card key={i} className="space-y-3 p-5"><Skeleton className="h-5 w-1/2" /><Skeleton className="h-2 rounded-full" /><Skeleton className="h-4 w-2/3" /></Card>
          ))}
        </div>
      ) : (
        <div className="space-y-4">
          <Meter
            title="Hạn mức chung trong tháng" counter={c.general} reset={reset}
            note="Tính trên chuyển tiền, thanh toán QR và hóa đơn không thiết yếu. Không tính nạp tiền, rút tiền và tiền nhận vào."
          />
          <Meter title="Hạn mức thiết yếu trong tháng" counter={c.essential} reset={reset} note="Dành cho hóa đơn điện. Không trừ vào hạn mức chung." />
          <Card as="section" className="p-5">
            <h2 className="text-[18px] leading-[26px] font-bold">Xác thực giao dịch</h2>
            <p className="mt-2">Hôm nay đã giao dịch <span className="tnum font-semibold">{formatVnd(dayCounter(w))}</span> bằng mã PIN</p>
            <ul className="mt-4 space-y-2 border-t border-line-soft pt-4 text-[14px] leading-5">
              <li>Nạp, rút, chuyển tiền đến {formatVnd(s.perTransaction)} mỗi giao dịch và tổng {formatVnd(s.perDay)} mỗi ngày: mã PIN</li>
              <li>Vượt một trong hai mức trên: xác thực khuôn mặt</li>
              <li>Thanh toán QR và hóa đơn đến {formatVnd(s.paymentFace)}: mã PIN; trên mức này: xác thực khuôn mặt</li>
              <li>Sau mỗi lần xác thực khuôn mặt, tổng trong ngày bắt đầu lại từ 0</li>
            </ul>
          </Card>
        </div>
      )}
    </div>
  )
}

function Meter({ title, counter, note, reset }: { title: string; counter: Counter; note: string; reset: string }) {
  const pct = Math.min(100, Math.round((counter.used / counter.limit) * 100))
  // Design choice (not a rule): warning tone when 10% or less is left.
  const warn = counter.remaining <= counter.limit * 0.1
  return (
    <Card as="section" className="p-5">
      <div className="flex items-start justify-between gap-3">
        <h2 className="text-[18px] leading-[26px] font-bold">{title}</h2>
        {warn ? <Badge tone="pending">Sắp hết hạn mức</Badge> : null}
      </div>
      <p className="mt-3 tnum">Đã dùng {formatVnd(counter.used)} /<wbr /> {formatVnd(counter.limit)}</p>
      <div
        role="meter" aria-label={title} aria-valuemin={0} aria-valuemax={100} aria-valuenow={pct} aria-valuetext={`Đã dùng ${pct} phần trăm`}
        className="mt-2 h-2 overflow-hidden rounded-full bg-surface-2"
      >
        <div className={cx('h-full rounded-full', warn ? 'bg-pending' : 'bg-primary')} style={{ width: `${pct}%` }} />
      </div>
      <p className={cx('mt-2 font-semibold tnum', warn && 'text-pending')}>Còn lại {formatVnd(counter.remaining)}</p>
      {counter.pending ? <p className="mt-1 text-[14px] leading-5 text-muted">Gồm {formatVnd(counter.pending)} đang xử lý</p> : null}
      <p className="mt-3 text-[14px] leading-5 text-muted">{note}</p>
      <p className="mt-1 text-[13px] leading-[18px] text-muted tnum">{reset}</p>
    </Card>
  )
}
