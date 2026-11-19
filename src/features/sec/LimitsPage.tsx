import { now, dayCounter, useWorld } from '@/app/store'
import { config } from '@/domain/config'
import { formatVnd } from '@/domain/money'
import { Badge, Card, cx, Dong, Skeleton } from '@/components/app-ui'
import { BarsWithLimit, Ring, ringTone } from '@/components/charts'
import { ScreenTitle, useLoaded } from './kit'
import { limitCounters, monthlyGeneral, nextReset, type Counter } from './limitsView'

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
        <div className="space-y-group" aria-busy>
          {[0, 1, 2].map((i) => (
            <Card key={i} className="space-y-stack p-inset"><Skeleton className="h-5 w-1/2" /><Skeleton className="h-2 rounded-full" /><Skeleton className="h-4 w-2/3" /></Card>
          ))}
        </div>
      ) : (
        <div className="space-y-group">
          <Card as="section" className="px-inset py-group">
            <h2 className="sr-only">Tổng quan hạn mức tháng này</h2>
            <div className="grid grid-cols-2 gap-4 text-center">
              <RingStat title="Chung" counter={c.general} />
              <RingStat title="Thiết yếu" counter={c.essential} />
            </div>
            <p className="mt-stack text-center text-[13px] text-muted tnum">{reset}</p>
          </Card>
          <Card as="section" className="p-inset">
            <h2 className="headline">Hạn mức chung theo tháng</h2>
            <p className="mt-1 mb-group text-[15px] text-muted">Cột đỏ là tháng vượt mức {formatVnd(config.limits.generalMonth)}</p>
            <BarsWithLimit
              bars={monthlyGeneral(w.transactions, at)}
              limit={config.limits.generalMonth}
              limitLabel={`${config.limits.generalMonth / 1_000_000}tr`}
              label={`Hạn mức chung 12 tháng gần nhất; tháng này đã dùng ${formatVnd(c.general.used)}`}
            />
          </Card>
          <Meter
            title="Hạn mức chung trong tháng" counter={c.general} reset={reset}
            note="Tính trên chuyển tiền, thanh toán QR và hóa đơn không thiết yếu. Không tính nạp tiền, rút tiền và tiền nhận vào."
          />
          <Meter title="Hạn mức thiết yếu trong tháng" counter={c.essential} reset={reset} note="Dành cho hóa đơn điện. Không trừ vào hạn mức chung." />
          <Card as="section" className="p-inset">
            <h2 className="headline">Xác thực giao dịch</h2>
            <p className="mt-header">Hôm nay đã giao dịch <span className="tnum font-semibold">{formatVnd(dayCounter(w))}</span> bằng mã PIN</p>
            <ul className="mt-stack space-y-header border-t border-line-soft pt-stack text-[15px] leading-5">
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

function RingStat({ title, counter }: { title: string; counter: Counter }) {
  const share = counter.used / counter.limit
  return (
    <div className="flex flex-col items-center">
      <Ring used={share} tone={ringTone(share)} size={112}>
        <span className="block text-[22px] leading-7 font-bold tnum">{Math.round(share * 100)}%</span>
        <span className="block text-[12px] text-muted">đã dùng</span>
      </Ring>
      <p className="mt-stack text-[17px] leading-6 font-bold tnum">{formatVnd(counter.remaining).replace(' ₫', '')}<Dong /></p>
      <p className="text-[15px] text-muted">còn lại · {title}</p>
    </div>
  )
}

function Meter({ title, counter, note, reset }: { title: string; counter: Counter; note: string; reset: string }) {
  // Design choice (not a rule): warning tone when 10% or less is left.
  const warn = counter.remaining <= counter.limit * 0.1
  return (
    <Card as="section" className="p-inset">
      <div className="flex items-start justify-between gap-3">
        <h2 className="headline">{title}</h2>
        {warn ? <Badge tone="pending">Sắp hết hạn mức</Badge> : null}
      </div>
      <p className="mt-stack tnum">Đã dùng {formatVnd(counter.used)} /<wbr /> {formatVnd(counter.limit)}</p>
      <p className={cx('mt-header font-semibold tnum', warn && 'text-pending')}>Còn lại {formatVnd(counter.remaining)}</p>
      {counter.pending ? <p className="mt-1 text-[15px] leading-5 text-muted">Gồm {formatVnd(counter.pending)} đang xử lý</p> : null}
      <p className="mt-stack text-[15px] leading-5 text-muted">{note}</p>
      <p className="mt-1 text-[13px] leading-[18px] text-muted tnum">{reset}</p>
    </Card>
  )
}
