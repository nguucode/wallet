import {
  ArrowDownToLine, ArrowUpFromLine, Clock, Eye, EyeOff, FileText, Inbox, QrCode, ScanLine, Send,
} from 'lucide-react'
import type { MouseEvent, ReactNode } from 'react'
import { Link } from 'react-router'
import { useLayout } from '@/app/layout'
import {
  bankById, gateOf, getState, now, pendingOut, setBalanceHidden, useWorld,
} from '@/app/store'
import { formatVnd } from '@/domain/money'
import { Avatar, BankMark, Card, cx, Dong, EmptyState, IconButton, RailTile, Row, RowSkeleton, Section, Skeleton } from '@/components/app-ui'
import { TxIcon, TxRow } from '@/features/his/parts'
import { LineChart } from '@/components/charts'
import { maskAccount, maskPhone } from '@/features/flow/FlowKit'
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
    <div>
      <h1 tabIndex={-1} data-page-title className="sr-only">Trang chủ</h1>
      {layout === 'web' ? <p className="large-title mb-group" aria-hidden>Chào {shortName(w.customer.name)}</p> : null}
      <BalanceSection loaded={loaded} />
      <ShortcutsRow guard={guard} />
      {gate ? <section aria-label="Trạng thái ví" className="mt-section"><GateCallout gate={gate} /></section> : null}
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
    <section aria-label="Số dư" className="money-card rounded-[var(--radius-card)] p-hero">
      <Guilloche />
      <div className="flex items-center gap-1">
        <h2 className="text-[15px] leading-[22px] font-semibold text-white/85">Số dư khả dụng</h2>
        <IconButton label={hidden ? 'Hiện số dư' : 'Ẩn số dư'} aria-pressed={hidden} className="-my-1 size-[30px] text-white/85 hover:bg-white/15 focus-visible:outline-white" onClick={() => setBalanceHidden(!hidden)}>
          {hidden ? <EyeOff size={18} strokeWidth={1.75} aria-hidden /> : <Eye size={18} strokeWidth={1.75} aria-hidden />}
        </IconButton>
      </div>
      {!loaded ? (
        <Skeleton className={cx('mt-header w-[260px] max-w-full bg-white/20', layout === 'web' ? 'h-[52px]' : 'h-11')} />
      ) : (
        <p className={cx(size, 'mt-header whitespace-nowrap !leading-[1.08]')}>
          {hidden ? (
            <><span aria-hidden>•••••••<Dong /></span><span className="sr-only">Số dư đang ẩn</span></>
          ) : (
            <><span aria-hidden>{text.replace(' ₫', '')}<Dong /></span><span className="sr-only">{vndWords(amount)}</span></>
          )}
        </p>
      )}
      {loaded && held > 0 ? (
        <Link to="/history?tab=dang-xu-ly" className="mt-stack inline-flex min-h-8 items-center gap-2 rounded-full bg-[var(--color-pending-soft-on-card)] px-3 text-[13px] font-semibold text-[color:var(--color-pending-on-card)] no-underline ring-1 ring-[color-mix(in_oklab,var(--color-pending-on-card)_30%,transparent)] ring-inset focus-visible:outline-white">
          <Clock size={15} strokeWidth={2.25} aria-hidden />
          Đang xử lý{' '}
          {hidden ? <><span aria-hidden>••••••</span><span className="sr-only">số tiền đang ẩn</span></> : <span className="tnum">{formatVnd(held)}</span>}
        </Link>
      ) : null}
      {loaded && !hidden && series.length > 1 ? (
        <div className="mt-stack">
          <LineChart
            values={series}
            label={`Số dư 30 ngày qua, từ ${formatVnd(series[0])} đến ${formatVnd(series[series.length - 1])}`}
            endTag={delta ? `${delta > 0 ? '+' : '−'}${(Math.abs(delta) / 1_000_000).toLocaleString('vi-VN', { maximumFractionDigits: 2 })}tr · 30 ngày` : undefined}
            className="px-1 pt-2"
            wide={layout === 'web'}
            inverse
          />
          <p className="mt-header flex justify-between text-[12px] text-white/80" aria-hidden><span>30 ngày trước</span><span>Hôm nay</span></p>
        </div>
      ) : null}
    </section>
  )
}

/** Banknote-style guilloche: three hypotrochoids traced once at module load, drawn as hairlines in the card's top-right
 *  and masked so they fade out before reaching the balance text. Decorative only. */
const GUILLOCHE = [[60, 0], [48, 0.21], [36, 0.42]].map(([d, rot]) => {
  const R = 100, r = 37, k = (R - r) / r, pts: string[] = []
  for (let i = 0; i <= 1480; i++) {
    const t = (i / 1480) * 2 * Math.PI * 37
    const x = (R - r) * Math.cos(t) + d * Math.cos(k * t), y = (R - r) * Math.sin(t) - d * Math.sin(k * t)
    const c = Math.cos(rot), sn = Math.sin(rot)
    pts.push(`${(x * c - y * sn).toFixed(1)},${(x * sn + y * c).toFixed(1)}`)
  }
  return 'M' + pts.join('L')
})

function Guilloche() {
  return (
    <svg aria-hidden viewBox="-170 -170 340 340" className="pointer-events-none absolute -top-[200px] -right-[200px] -z-10 size-[400px] [mask-image:radial-gradient(circle,black_35%,transparent_70%)] lg:-top-[240px] lg:-right-[240px] lg:size-[480px]">
      {GUILLOCHE.map((d, i) => <path key={i} d={d} fill="none" stroke="#fff" strokeOpacity={0.14 - i * 0.03} strokeWidth={0.5} />)}
    </svg>
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
    <nav aria-label="Lối tắt" className="mt-stack card px-header py-stack lg:py-inset">
      {/* Equal columns: every shortcut gets the same width, so the gaps between icons and to the edges are one rhythm. */}
      <ul className={cx('grid', layout === 'app' ? 'grid-cols-6' : 'grid-cols-5')}>
        {items.map((s) => (
          <li key={s.to} className="min-w-0">
            <Link
              to={s.to}
              onClick={s.ungated ? undefined : guardedClick(guard, s.to)}
              className="group flex flex-col items-center gap-header text-center text-ink no-underline focus-visible:outline-none"
            >
              <span className="inline-flex size-12 items-center justify-center rounded-full bg-surface-2 text-tint group-focus-visible:outline-2 group-focus-visible:outline-offset-2 group-focus-visible:outline-tint transition-colors group-hover:bg-primary-soft group-active:bg-primary-soft-hover">
                <s.icon size={24} strokeWidth={1.75} aria-hidden />
              </span>
              {/* Six tiles in ~342px on the app layout: the dense-row label (11/14, tab-bar size) keeps a gutter and two lines. */}
              <span className="px-0.5 text-[11px] leading-[14px] font-semibold text-balance lg:px-0 lg:text-[12px] lg:leading-4 lg:whitespace-nowrap">{s.label}</span>
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
  const due = selectBillsDue(w.bills, now())
  if (loaded && !due.length) return null
  return (
    <Section title="Hóa đơn sắp đến hạn" action={loaded ? <Link to="/bills">Xem tất cả</Link> : undefined}>
      <Card className="overflow-hidden">
        {!loaded ? <RowSkeleton /> : (
          <ul>
            {due.slice(0, 3).map(({ bill, days, overdue }) => {
              const biller = w.billers.find((b) => b.id === bill.billerId)?.name ?? 'Hóa đơn'
              const dueLine = overdue
                ? <span className="font-medium text-danger">Quá hạn {Math.max(1, -days)} ngày</span>
                : <>Hạn {fmtYmd(bill.dueDate)}</>
              return (
                <li key={bill.id}>
                  <Row
                    to={`/bills/${bill.id}`} onClick={guardedClick(guard, `/bills/${bill.id}`)}
                    left={<TxIcon type="bill" />} title={biller}
                    subtitle={<>{dueLine} · <span className="tnum">{bill.customerCode}</span></>}
                    right={formatVnd(bill.amount)} chevron
                  />
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
    <Section title="Người nhận gần đây" action={<Link to="/transfer">Chuyển tiền</Link>}>
      {/* The 56px avatar sits centred in a 72px item, so the rail is pulled 8px left to put the first avatar on the title edge. */}
      <ul className="-mx-inset flex gap-header overflow-x-auto pr-inset pb-1 pl-2 lg:mr-0 lg:-ml-2 lg:overflow-visible lg:pr-0 lg:pl-0">
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
                  <RailTile
                    to={to} onClick={guardedClick(guard, to)} label={label} name={shortName(r.name)} sub={sub}
                    leading={r.kind === 'contact' ? <Avatar name={r.name} size={56} /> : <BankMark short={bankById(r.bankId).short} size={56} />}
                  />
                </li>
              )
            })}
      </ul>
    </Section>
  )
}

/* ── US-HOM-006 ───────────────────────────────────────────────────── */

function RecentActivity({ loaded, guard }: { loaded: boolean; guard: Guard }) {
  const w = useWorld()
  const recent = [...w.transactions].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 5)
  let body: ReactNode
  if (!loaded) body = <div>{Array.from({ length: 5 }, (_, i) => <RowSkeleton key={i} />)}</div>
  else if (!recent.length)
    body = <EmptyState icon={<Inbox size={22} strokeWidth={1.75} />} title="Chưa có giao dịch nào" action={<Link to="/topup" onClick={guardedClick(guard, '/topup')} className="font-semibold text-tint">Nạp tiền vào ví</Link>} />
  else body = <ul>{recent.map((t) => <li key={t.id}><TxRow t={t} withDate /></li>)}</ul>
  return (
    <Section title="Hoạt động gần đây" action={recent.length ? <Link to="/history">Xem tất cả</Link> : undefined}>
      <Card className="overflow-hidden">{body}</Card>
    </Section>
  )
}


