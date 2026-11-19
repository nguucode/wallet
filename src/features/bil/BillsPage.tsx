import { Droplet, FileText, Wifi, Zap } from 'lucide-react'
import { useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router'
import { formatVnd } from '@/domain/money'
import { now, useWorld } from '@/app/store'
import type { SavedBill, World } from '@/mock/seed'
import { fmtDate } from '@/features/flow/FlowKit'
import { useGuard } from '@/features/sec/Gate'
import { ScreenTitle, TxIcon, useToast } from '@/features/his/parts'
import { Badge, Card, cx, EmptyState, Row, Section } from '@/components/ui'
import { billStatusOn, isPayable, maskCode, overdueDays, periodLabel, sortBills, type BillStatus } from './bills'

const CHIP: Record<BillStatus, { label: string; tone: 'danger' | 'secondary' | 'pending' | 'neutral' }> = {
  overdue: { label: 'Quá hạn', tone: 'danger' }, due: { label: 'Sắp đến hạn', tone: 'secondary' },
  settling: { label: 'Đang xử lý', tone: 'pending' }, paid: { label: 'Đã thanh toán', tone: 'neutral' },
}

export function BillChip({ status }: { status: BillStatus }) {
  const c = CHIP[status]
  // Same capsule spec as StatusPill (no dot): one status chip across the product.
  return <Badge tone={c.tone}>{c.label}</Badge>
}

/** Latest transaction that paid this saved bill (for "Đã thanh toán dd/mm" and "Xem giao dịch"). */
export const billTx = (w: World, billId: string) => w.transactions.find((t) => t.counterparty.kind === 'biller' && t.counterparty.billId === billId && t.status !== 'failed')

/** The one fact a list row must keep when it truncates: when it is due, or when it was paid. */
function keyFact(b: SavedBill, w: World, at: number) {
  const s = billStatusOn(b, at)
  if (s === 'overdue') return <span className="text-danger">Quá hạn {overdueDays(b, at)} ngày</span>
  if (s === 'due') return <>Hạn {fmtDate(b.dueDate + 'T12:00:00+07:00')}</>
  if (s === 'settling') return <>{periodLabel(b.period)}</>
  const tx = billTx(w, b.id)
  return <>Đã trả{tx ? ' ' + fmtDate(tx.updatedAt) : ''}</>
}

export default function BillsPage() {
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

      <Section title="Hóa đơn của tôi" className="mt-0" action={bills.length ? <button type="button" onClick={() => guard('/bills/new')}>Thêm hóa đơn</button> : undefined}>
        {!bills.length ? (
          <Card>
            <EmptyState icon={<FileText size={22} strokeWidth={1.75} />} title="Chưa có hóa đơn nào được lưu"
              action={<button type="button" onClick={() => guard('/bills/new')} className="min-h-11 font-semibold text-tint">Thêm hóa đơn điện</button>} />
          </Card>
        ) : (
          <Card className="overflow-hidden">
            <ul>
              {bills.map((b) => {
                const s = billStatusOn(b, at)
                return (
                  <li key={b.id}>
                    <Row
                      to={`/bills/${b.id}`}
                      onClick={isPayable(b, at) ? (e) => { e.preventDefault(); guard(`/bills/${b.id}`) } : undefined}
                      left={<TxIcon type="bill" />}
                      title={billerName(b.billerId)}
                      subtitle={<>{keyFact(b, w, at)}{b.holder ? ` · ${b.holder}` : ''} · <span className="tnum">{maskCode(b.customerCode)}</span></>}
                      right={formatVnd(b.amount)}
                      rightSub={<BillChip status={s} />}
                      chevron
                    />
                  </li>
                )
              })}
            </ul>
          </Card>
        )}
      </Section>

      <Section title="Thêm hóa đơn">
        {/* Same pitch as Home's recipient rail (72px items, 8px gap); pulled 12px left so the first circle meets the title edge. */}
        <ul className="-ml-3 flex gap-header">
          {tiles.map((t) => (
            <li key={t.label}>
              <button type="button" disabled={!t.enabled} onClick={() => guard('/bills/new')} className="group flex w-[72px] flex-col items-center gap-header rounded-xl disabled:cursor-not-allowed">
                <span aria-hidden className={cx('inline-flex size-12 items-center justify-center rounded-full', t.enabled ? 'bg-surface-2 text-tint transition-colors group-hover:bg-primary-soft group-active:bg-primary-soft-hover' : 'bg-surface-2 text-muted')}><t.icon size={24} strokeWidth={1.75} /></span>
                <span className={cx('text-[12px] leading-4 font-semibold text-balance', !t.enabled && 'text-muted')}>{t.label}</span>
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
