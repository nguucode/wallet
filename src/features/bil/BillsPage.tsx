import { Droplet, FileText, Wifi, Zap } from 'lucide-react'
import { useEffect } from 'react'
import { Link, useLocation, useNavigate } from 'react-router'
import { formatVnd } from '@/domain/money'
import { useLayout } from '@/app/layout'
import { now, useWorld } from '@/app/store'
import type { SavedBill, World } from '@/mock/seed'
import { fmtDate } from '@/features/flow/FlowKit'
import { useGuard } from '@/features/sec/Gate'
import { ScreenTitle, useToast } from '@/features/his/parts'
import { Badge, Button, Card, cx, EmptyState, Section } from '@/components/ui'
import { billStatusOn, isPayable, maskCode, overdueDays, periodLabel, sortBills, type BillStatus } from './bills'

const CHIP: Record<BillStatus, { label: string; tone: 'danger' | 'primary' | 'pending' | 'neutral' }> = {
  overdue: { label: 'Quá hạn', tone: 'danger' }, due: { label: 'Sắp đến hạn', tone: 'primary' },
  settling: { label: 'Đang xử lý', tone: 'pending' }, paid: { label: 'Đã thanh toán', tone: 'neutral' },
}

export function BillChip({ status }: { status: BillStatus }) {
  const c = CHIP[status]
  const dot = { danger: 'bg-danger', primary: 'bg-primary', pending: 'bg-pending', neutral: 'bg-muted' }[c.tone]
  return <Badge tone={c.tone}><span aria-hidden className={cx('mr-1.5 size-1.5 rounded-full', dot)} />{c.label}</Badge>
}

/** Latest transaction that paid this saved bill (for "Đã thanh toán dd/mm" and "Xem giao dịch"). */
export const billTx = (w: World, billId: string) => w.transactions.find((t) => t.counterparty.kind === 'biller' && t.counterparty.billId === billId && t.status !== 'failed')

function dueLine(b: SavedBill, w: World, at: number) {
  const s = billStatusOn(b, at)
  if (s === 'overdue') return <span className="text-danger">Quá hạn {overdueDays(b, at)} ngày</span>
  if (s === 'due') return <>Hạn {fmtDate(b.dueDate + 'T12:00:00+07:00')}</>
  if (s === 'settling') return <span className="text-pending">Nhà cung cấp đang xác nhận thanh toán</span>
  const tx = billTx(w, b.id)
  return <>Đã thanh toán{tx ? ' ' + fmtDate(tx.updatedAt) : ''}</>
}

export default function BillsPage() {
  const layout = useLayout()
  const w = useWorld()
  const nav = useNavigate()
  const loc = useLocation()
  const toast = useToast()
  const { guard, sheet } = useGuard()
  const at = now()
  const bills = sortBills(w.bills, at)
  const payable = bills.filter((b) => isPayable(b, at))
  const total = payable.reduce((a, b) => a + b.amount, 0)
  const billerName = (id: string) => w.billers.find((x) => x.id === id)?.name ?? id

  useEffect(() => {
    const msg = (loc.state as { toast?: string } | null)?.toast
    if (msg) { toast.show(msg); nav(loc.pathname, { replace: true, state: null }) }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const tiles = [
    { label: 'Điện', icon: Zap, enabled: true },
    { label: 'Nước', icon: Droplet, enabled: false },
    { label: 'Internet', icon: Wifi, enabled: false },
  ]

  return (
    <div>
      <ScreenTitle description={payable.length ? <span className="tnum">{payable.length} hóa đơn cần thanh toán · {formatVnd(total)}</span> : undefined}>Hóa đơn</ScreenTitle>

      <Section title="Hóa đơn của tôi" className="mt-0!" action={<Button size="sm" variant="ink" onClick={() => guard('/bills/new')}>Thêm hóa đơn</Button>}>
        {!bills.length ? (
          <Card>
            <EmptyState icon={<FileText size={22} strokeWidth={1.75} />} title="Chưa có hóa đơn nào được lưu"
              action={<button type="button" onClick={() => guard('/bills/new')} className="min-h-11 font-semibold text-primary">Thêm hóa đơn điện</button>} />
          </Card>
        ) : (
          <Card>
            <ul className="divide-y divide-line-soft">
              {bills.map((b) => {
                const s = billStatusOn(b, at)
                const name = billerName(b.billerId)
                return (
                  <li key={b.id} className={cx('flex gap-3 px-4 py-3', layout === 'app' ? 'flex-col' : 'items-center')}>
                    <Link to={`/bills/${b.id}`}
                      className="-mx-2 -my-1 flex min-w-0 flex-1 items-start gap-3 rounded-xl px-2 py-1 text-ink no-underline hover:bg-surface-2">
                      <span className="min-w-0 flex-1">
                        <span className="block font-semibold">{name}</span>
                        {b.holder ? <span className="line-clamp-2 block text-[14px] leading-5">{b.holder}</span> : null}
                        <span className="block text-[13px] leading-[18px] text-muted">
                          <span className="tnum">{maskCode(b.customerCode)}</span> · {periodLabel(b.period)}
                        </span>
                        <span className="block text-[13px] leading-[18px] text-muted">{dueLine(b, w, at)}</span>
                      </span>
                      <span className="flex shrink-0 flex-col items-end gap-1">
                        <span className="tnum font-semibold whitespace-nowrap">{formatVnd(b.amount)}</span>
                        <BillChip status={s} />
                      </span>
                    </Link>
                    {s === 'due' || s === 'overdue' ? (
                      <Button size={layout === 'app' ? 'md' : 'sm'} variant="secondary" block={layout === 'app'} className="border-primary text-primary" onClick={() => guard(`/bills/${b.id}`)}>Thanh toán</Button>
                    ) : null}
                  </li>
                )
              })}
            </ul>
          </Card>
        )}
      </Section>

      <Section title="Thêm hóa đơn">
        <ul className="flex gap-6">
          {tiles.map((t) => (
            <li key={t.label}>
              <button type="button" disabled={!t.enabled} onClick={() => guard('/bills/new')} className="flex w-20 flex-col items-center gap-1.5 disabled:cursor-not-allowed">
                <span aria-hidden className={cx('inline-flex size-12 items-center justify-center rounded-full', t.enabled ? 'bg-surface-2 text-ink' : 'bg-surface-2 text-muted')}><t.icon size={22} strokeWidth={1.75} /></span>
                <span className={cx('text-[13px] leading-[18px] font-medium', !t.enabled && 'text-muted')}>{t.label}</span>
                {!t.enabled ? <span className="text-[12px] leading-4 text-muted">Sắp có</span> : null}
              </button>
            </li>
          ))}
        </ul>
      </Section>
      {sheet}
      {toast.node}
    </div>
  )
}
