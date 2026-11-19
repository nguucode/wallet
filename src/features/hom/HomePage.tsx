import {
  ArrowDownToLine, ArrowDownLeft, ArrowUpFromLine, ArrowUpRight, Clock, Eye, EyeOff, FileText, QrCode, RotateCcw, ScanLine, Send,
} from 'lucide-react'
import type { MouseEvent, ReactNode } from 'react'
import { Link } from 'react-router'
import { useLayout } from '@/app/layout'
import {
  bankById, counterpartyName, gateOf, getState, now, pendingOut, setBalanceHidden, typeLabel, useWorld,
} from '@/app/store'
import { formatVnd } from '@/domain/money'
import type { Transaction } from '@/mock/seed'
import { Avatar, Button, Card, cx, Disc, Dong, IconButton, Section, Skeleton } from '@/components/ui'
import { LineChart } from '@/components/charts'
import { fmtDate, fmtTime, maskAccount, maskPhone } from '@/features/flow/FlowKit'
import { GateCallout, useGuard } from '@/features/sec/Gate'
import { useLoaded } from '@/features/sec/kit'
import { useReminders } from '@/features/ntf/useReminders'
import { balanceSeries, fmtYmd, selectBillsDue, selectRecentRecipients, shortName, vndWords } from './selectors'

type Guard = ReturnType<typeof useGuard>['guard']
/** Link semantics, but a gated tap opens the gate sheet instead of navigating (US-SEC-004). */
const guardedClick = (guard: Guard, to: string) => (e: MouseEvent) => {
  if (gateOf(getState().world)) { e.preventDefault(); guard(to) }
}

export default function HomePage() {
  const w = useWorld()
  const layout = useLayout()
  const loaded = useLoaded()
  const { guard, sheet } = useGuard()
  useReminders()
  const gate = gateOf(w)

  return (
    <div className="lg:max-w-[610px]">
      <h1 tabIndex={-1} data-page-title className="sr-only">Trang chủ</h1>
      {layout === 'web' ? <p className="large-title mb-5" aria-hidden>Chào {shortName(w.customer.name)}</p> : null}
      <BalanceSection loaded={loaded} />
      <ShortcutsRow guard={guard} />
      {gate ? <section aria-label="Trạng thái ví" className="mt-8 lg:mt-12"><GateCallout gate={gate} /></section> : null}
      <BillsDue loaded={loaded} guard={guard} />
      <RecentRecipients loaded={loaded} guard={guard} />
      <RecentActivity loaded={loaded} guard={guard} />
      {sheet}
    </div>
  )
}

/* ── US-HOM-001 ───────────────────────────────────────────────────── */

function BalanceSection({ loaded }: { loaded: boolean }) {
  const w = useWorld()
  const layout = useLayout()
  const hidden = w.security.balanceHidden
  const amount = w.balance
  const held = pendingOut(w)
  const text = formatVnd(amount)
  // US-HOM-001 overflow: 12-character balances step down one token on the app layout.
  const size = layout === 'web' ? 'balance' : text.length > 11 ? 'amount-display' : 'balance-app'
  const series = loaded ? balanceSeries(w, now()) : []
  const delta = series.length ? series[series.length - 1] - series[0] : 0
  return (
    <section aria-label="Số dư" className="card px-5 pt-5 pb-4 text-center lg:px-8 lg:pt-7">
      <div className="flex items-center justify-center gap-0.5">
        <h2 className="text-[15px] leading-[22px] font-semibold text-muted">Số dư khả dụng</h2>
        <IconButton label={hidden ? 'Hiện số dư' : 'Ẩn số dư'} aria-pressed={hidden} className="size-11 text-muted" onClick={() => setBalanceHidden(!hidden)}>
          {hidden ? <EyeOff size={18} strokeWidth={1.75} aria-hidden /> : <Eye size={18} strokeWidth={1.75} aria-hidden />}
        </IconButton>
      </div>
      {!loaded ? (
        <Skeleton className={cx('mx-auto mt-1 w-[260px] max-w-full', layout === 'web' ? 'h-[58px]' : 'h-12')} />
      ) : (
        <p className={cx(size, 'whitespace-nowrap')}>
          {hidden ? (
            <><span aria-hidden>•••••••<Dong /></span><span className="sr-only">Số dư đang ẩn</span></>
          ) : (
            <><span aria-hidden>{text.replace(' ₫', '')}<Dong /></span><span className="sr-only">{vndWords(amount)}</span></>
          )}
        </p>
      )}
      {loaded && held > 0 ? (
        <Link to="/history?tab=dang-xu-ly" className="mt-2 inline-flex min-h-9 items-center gap-1.5 rounded-full bg-pending-soft px-3 text-[13px] font-semibold text-pending no-underline">
          <Clock size={15} strokeWidth={2.25} aria-hidden />
          Đang xử lý{' '}
          {hidden ? <><span aria-hidden>••••••</span><span className="sr-only">số tiền đang ẩn</span></> : <span className="tnum">{formatVnd(held)}</span>}
        </Link>
      ) : null}
      {loaded && !hidden && series.length > 1 ? (
        <div className="mt-4">
          <LineChart
            values={series}
            label={`Số dư 30 ngày qua, từ ${formatVnd(series[0])} đến ${formatVnd(series[series.length - 1])}`}
            endTag={delta ? `${delta > 0 ? '+' : '−'}${(Math.abs(delta) / 1_000_000).toLocaleString('vi-VN', { maximumFractionDigits: 2 })}tr · 30 ngày` : undefined}
            className="px-1 pt-6"
            wide={layout === 'web'}
          />
          <p className="mt-1 flex justify-between text-[12px] text-muted" aria-hidden><span>30 ngày trước</span><span>Hôm nay</span></p>
        </div>
      ) : null}
    </section>
  )
}

/* ── US-HOM-002 ───────────────────────────────────────────────────── */

const SHORTCUTS: { label: string; to: string; icon: typeof Send; app?: true; ungated?: true }[] = [
  { label: 'Quét mã', to: '/pay/scan', icon: ScanLine, app: true },
  { label: 'Mã thanh toán', to: '/pay/code', icon: QrCode },
  { label: 'Nạp', to: '/topup', icon: ArrowDownToLine },
  { label: 'Rút', to: '/withdraw', icon: ArrowUpFromLine },
  { label: 'Chuyển', to: '/transfer', icon: Send },
  // rules.md decisions: browsing /bills is not gated; the gate shows on "Thanh toán" / "Thêm hóa đơn".
  { label: 'Hóa đơn', to: '/bills', icon: FileText, ungated: true },
]

function ShortcutsRow({ guard }: { guard: Guard }) {
  const layout = useLayout()
  const items = SHORTCUTS.filter((s) => layout === 'app' || !s.app)
  return (
    <nav aria-label="Lối tắt" className="mt-4 card px-2 py-4">
      <ul className={cx(layout === 'app' ? 'grid grid-cols-6' : 'flex justify-around gap-2')}>
        {items.map((s) => (
          <li key={s.to} className="min-w-0">
            <Link
              to={s.to}
              onClick={s.ungated ? undefined : guardedClick(guard, s.to)}
              className="group flex flex-col items-center gap-2 rounded-xl py-1 text-center text-ink no-underline focus-visible:outline-none lg:w-[84px]"
            >
              <span className="inline-flex size-12 items-center justify-center rounded-full bg-surface-2 text-tint group-hover:bg-primary-soft group-focus-visible:outline-2 group-focus-visible:outline-offset-2 group-focus-visible:outline-tint">
                <s.icon size={24} strokeWidth={1.75} aria-hidden />
              </span>
              <span className="px-0.5 text-[11px] leading-[14px] font-semibold lg:text-[12px] lg:leading-4 lg:whitespace-nowrap">{s.label}</span>
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  )
}

/* ── US-HOM-004 ───────────────────────────────────────────────────── */

function BillsDue({ loaded, guard }: { loaded: boolean; guard: Guard }) {
  const w = useWorld()
  const layout = useLayout()
  const due = selectBillsDue(w.bills, now())
  if (loaded && !due.length) return null
  return (
    <Section title="Hóa đơn sắp đến hạn" action={loaded ? <Link to="/bills" className="text-[14px] font-semibold text-tint">Xem tất cả</Link> : undefined}>
      <Card className="px-4">
        {!loaded ? <SkeletonRow /> : (
          <ul className="divide-y divide-line-soft">
            {due.slice(0, 3).map(({ bill, days, overdue }) => {
              const biller = w.billers.find((b) => b.id === bill.billerId)?.name ?? 'Hóa đơn'
              const dueLine = overdue
                ? <span className="font-medium text-danger">Quá hạn {Math.max(1, -days)} ngày</span>
                : <span>Hạn {fmtYmd(bill.dueDate)}</span>
              const left = <Disc size={40}><span className="text-[13px] font-semibold">{biller.split(' ').slice(-1)[0][0]}</span></Disc>
              return (
                <li key={bill.id}>
                  {layout === 'app' ? (
                    <Link to={`/bills/${bill.id}`} className="-mx-2 flex min-h-[64px] items-center gap-3 rounded-xl px-2 py-2 text-ink no-underline hover:bg-surface-2">
                      {left}
                      <span className="min-w-0 flex-1">
                        <span className="block font-medium">{biller}</span>
                        <span className="block text-[13px] leading-[18px] text-muted">{bill.customerCode}</span>
                        <span className="block text-[13px] leading-[18px]"><span className="tnum font-semibold">{formatVnd(bill.amount)}</span> · {dueLine}</span>
                      </span>
                    </Link>
                  ) : (
                    <div className="flex min-h-[64px] items-center gap-3 py-2">
                      {left}
                      <span className="min-w-0 flex-1">
                        <span className="block font-medium">{biller}</span>
                        <span className="block text-[13px] leading-[18px] text-muted">{bill.customerCode} · {dueLine}</span>
                      </span>
                      <span className="tnum font-semibold">{formatVnd(bill.amount)}</span>
                      <Button size="sm" onClick={() => guard(`/bills/${bill.id}`)} className="min-h-11">Thanh toán</Button>
                    </div>
                  )}
                </li>
              )
            })}
          </ul>
        )}
      </Card>
    </Section>
  )
}

/* ── US-HOM-005 ───────────────────────────────────────────────────── */

function RecentRecipients({ loaded, guard }: { loaded: boolean; guard: Guard }) {
  const w = useWorld()
  const list = selectRecentRecipients(w.transactions, 8)
  if (loaded && !list.length) return null
  return (
    <Section title="Người nhận gần đây" action={<Link to="/transfer" className="text-[14px] font-semibold text-tint">Chuyển tiền</Link>}>
      <ul className="-mx-5 flex gap-2 overflow-x-auto px-3 pb-1 lg:mx-0 lg:overflow-visible lg:px-0">
        {!loaded
          ? Array.from({ length: 4 }, (_, i) => <li key={i} className="w-[72px] shrink-0"><Skeleton className="mx-auto size-14 rounded-full" /></li>)
          : list.map((r) => {
              let to: string, label: string, sub: string | undefined
              if (r.kind === 'contact') {
                to = `/transfer/wallet?contact=${r.id}`
                label = `${r.name}, ${maskPhone(r.phone)}`
              } else {
                const saved = w.bankRecipients.find((x) => x.bankId === r.bankId && x.account === r.account)
                to = saved ? `/transfer/bank?recipient=${saved.id}` : '/transfer/bank'
                sub = bankById(r.bankId).name
                label = `${r.name}, ${sub} ${maskAccount(r.account)}`
              }
              return (
                <li key={r.key} className="w-[72px] shrink-0">
                  <Link to={to} onClick={guardedClick(guard, to)} title={label} className="flex flex-col items-center gap-1 rounded-xl py-1 text-center text-ink no-underline">
                    <Avatar name={r.name} size={56} />
                    <span className="block w-full truncate text-[12px] leading-4 font-medium">{shortName(r.name)}</span>
                    {sub ? <span className="block w-full truncate text-[11px] leading-[14px] text-muted">{sub}</span> : null}
                  </Link>
                </li>
              )
            })}
      </ul>
    </Section>
  )
}

/* ── US-HOM-006 ───────────────────────────────────────────────────── */

const STATUS_LINE: Partial<Record<Transaction['status'], { text: string; cls: string }>> = {
  pending: { text: 'Đang xử lý', cls: 'text-pending' },
  failed: { text: 'Không thành công', cls: 'text-danger' },
  refunded: { text: 'Đã hoàn tiền', cls: 'text-muted' },
}

function TxIcon({ t }: { t: Transaction }) {
  if (t.counterparty.kind === 'contact') return <Avatar name={t.counterparty.name} size={40} />
  const Icon = t.type === 'refund' ? RotateCcw : t.direction === 'in' ? ArrowDownLeft : ArrowUpRight
  return <Disc size={40}><Icon size={20} strokeWidth={1.75} /></Disc>
}

function RecentActivity({ loaded, guard }: { loaded: boolean; guard: Guard }) {
  const w = useWorld()
  const recent = [...w.transactions].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 5)
  let body: ReactNode
  if (!loaded) body = <div className="px-4">{Array.from({ length: 5 }, (_, i) => <SkeletonRow key={i} />)}</div>
  else if (!recent.length)
    body = (
      <p className="px-4 py-6 text-center text-muted">
        Chưa có giao dịch nào.{' '}
        <Link to="/topup" onClick={guardedClick(guard, '/topup')} className="font-semibold text-tint">Nạp tiền</Link>
      </p>
    )
  else
    body = (
      <ul className="divide-y divide-line-soft px-4">
        {recent.map((t) => {
          const name = t.counterparty.kind === 'source' ? typeLabel(t.type) : counterpartyName(t.counterparty, w)
          const st = STATUS_LINE[t.status]
          const total = t.direction === 'out' && t.status !== 'failed' ? t.amount + t.fee : t.amount
          return (
            <li key={t.id}>
              <Link to={`/history/${t.id}`} className="-mx-2 flex min-h-[64px] items-center gap-3 rounded-xl px-2 py-2 text-ink no-underline hover:bg-surface-2">
                <TxIcon t={t} />
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-medium">{name}</span>
                  <span className="block text-[13px] leading-[18px] text-muted tnum">{fmtDate(t.createdAt)} · {fmtTime(t.createdAt)}</span>
                </span>
                <span className="shrink-0 text-right">
                  <span className={cx('block tnum font-semibold whitespace-nowrap', t.status === 'failed' && 'line-through')}>{formatVnd(total, { sign: t.direction })}</span>
                  {st ? <span className={cx('block text-[13px] leading-[18px] font-medium', st.cls)}>{st.text}</span> : null}
                </span>
              </Link>
            </li>
          )
        })}
      </ul>
    )
  return (
    <Section title="Hoạt động gần đây" action={recent.length ? <Link to="/history" className="text-[14px] font-semibold text-tint">Xem tất cả</Link> : undefined}>
      <Card>{body}</Card>
    </Section>
  )
}

function SkeletonRow() {
  return (
    <div className="flex min-h-[64px] items-center gap-3 py-2" aria-hidden>
      <Skeleton className="size-10 rounded-full" />
      <span className="flex-1 space-y-2"><Skeleton className="h-4 w-2/5" /><Skeleton className="h-3 w-1/4" /></span>
      <Skeleton className="h-4 w-20" />
    </div>
  )
}

