import { ChevronDown, Inbox, SlidersHorizontal, X } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router'
import { formatVnd } from '@/domain/money'
import type { TxStatus, TxType } from '@/domain/types'
import { useLayout } from '@/app/layout'
import { counterpartyName, now, typeLabel, useWorld } from '@/app/store'
import type { Transaction, World } from '@/mock/seed'
import { fmtDate, fmtTime, truthLine } from '@/features/flow/FlowKit'
import { Button, cx, EmptyState, Segmented, Sheet, STATUS_LABEL, StatusPill } from '@/components/ui'
import {
  filterTransactions, groupByDay, groupByMonth, monthLabel, monthsOf, monthTotals, TABS,
  type Group, type HistoryFilter, type Tab,
} from './history'
import { ScreenTitle, TxAmount, TxIcon, TxRow } from './parts'

const PAGE = 50
const TYPES: TxType[] = ['topup', 'withdraw', 'p2p_out', 'p2p_in', 'bank_transfer', 'qr_merchant', 'bill', 'refund']
const STATUSES: TxStatus[] = ['success', 'pending', 'failed', 'refunded']
const SCROLL_KEY = 'his.scroll'

function useHistoryParams() {
  const [params, setParams] = useSearchParams()
  const f: HistoryFilter = {
    tab: (params.get('tab') as Tab) || 'all',
    month: params.get('month') || undefined,
    type: (params.get('type') as TxType) || undefined,
    status: (params.get('status') as TxStatus) || undefined,
  }
  const set = (k: keyof HistoryFilter, v?: string) => {
    const next = new URLSearchParams(params)
    if (!v || (k === 'tab' && v === 'all')) next.delete(k)
    else next.set(k, v)
    setParams(next, { replace: true })
  }
  const clear = (withTab = false) => {
    const next = new URLSearchParams(params)
    ;['month', 'type', 'status', ...(withTab ? ['tab'] : [])].forEach((k) => next.delete(k))
    setParams(next, { replace: true })
  }
  return { f, set, clear, key: params.toString() }
}

/** Status: chip only when not success; pending also carries its ETA so the row says what happens next. */
function RowStatus({ t, web }: { t: Transaction; web?: boolean }) {
  if (t.status === 'success') return web ? <span className="text-[13px] text-muted">{STATUS_LABEL.success}</span> : null
  return (
    <span className="flex flex-col items-start gap-1">
      <StatusPill status={t.status} />
      {t.status === 'pending' ? <span className="text-[12px] leading-4 text-pending">{truthLine(t).replace('Đang xử lý · ', '')}</span> : null}
    </span>
  )
}

function Filters({ f, set, months, onGround }: { f: HistoryFilter; set: (k: keyof HistoryFilter, v?: string) => void; months: string[]; onGround?: boolean }) {
  // Fields take the fill that contrasts with what they sit on: white on the grouped background, tertiary fill inside a sheet.
  const sel = cx('h-11 w-full appearance-none rounded-[var(--radius-input)] pr-9', onGround ? 'bg-surface' : 'bg-surface-2') + ' pl-3 text-[15px] font-normal text-ink'
  return (
    <>
      <label className="flex flex-col gap-header text-[13px] font-semibold">
        Tháng
        <span className="relative block"><select className={sel} value={f.month ?? ''} onChange={(e) => set('month', e.target.value)}>
          <option value="">Tất cả các tháng</option>
          {months.map((m) => <option key={m} value={m}>{monthLabel(m)}</option>)}
        </select><ChevronDown size={16} strokeWidth={1.75} aria-hidden className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-muted" /></span>
      </label>
      <label className="flex flex-col gap-header text-[13px] font-semibold">
        Loại giao dịch
        <span className="relative block"><select className={sel} value={f.type ?? ''} onChange={(e) => set('type', e.target.value)}>
          <option value="">Tất cả loại</option>
          {TYPES.map((t) => <option key={t} value={t}>{typeLabel(t)}</option>)}
        </select><ChevronDown size={16} strokeWidth={1.75} aria-hidden className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-muted" /></span>
      </label>
      <label className="flex flex-col gap-header text-[13px] font-semibold">
        Trạng thái
        <span className="relative block"><select className={sel} value={f.status ?? ''} onChange={(e) => set('status', e.target.value)}>
          <option value="">Tất cả trạng thái</option>
          {STATUSES.map((s) => <option key={s} value={s}>{STATUS_LABEL[s]}</option>)}
        </select><ChevronDown size={16} strokeWidth={1.75} aria-hidden className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-muted" /></span>
      </label>
    </>
  )
}

/** Slice groups so only the first `count` rows render, keeping each group's header and totals for the full month. */
function take(groups: Group[], count: number) {
  const out: Group[] = []
  let left = count
  for (const g of groups) {
    if (left <= 0) break
    out.push({ ...g, rows: g.rows.slice(0, left) })
    left -= g.rows.length
  }
  return out
}

function WebTable({ groups, all, w, onOpen }: { groups: Group[]; all: Group[]; w: World; onOpen: (id: string) => void }) {
  return (
    <div className="card overflow-hidden pb-header">
    <table className="w-full border-collapse text-left">
      <caption className="sr-only">Lịch sử giao dịch, mới nhất trước, nhóm theo tháng</caption>
      <thead>
        <tr className="border-b border-line-soft text-[13px] text-muted">
          <th scope="col" className="w-[120px] py-stack pr-group pl-inset font-medium">Ngày</th>
          <th scope="col" className="py-stack pr-group font-medium">Giao dịch</th>
          <th scope="col" className="w-[180px] py-stack pr-group font-medium">Trạng thái</th>
          <th scope="col" className="w-[136px] py-stack pr-inset text-right font-medium">Số tiền</th>
        </tr>
      </thead>
      {groups.map((g) => {
        const tot = monthTotals(all.find((x) => x.key === g.key)!.rows)
        return (
          <tbody key={g.key}>
            <tr>
              <th scope="colgroup" colSpan={4} className="bg-surface px-inset pt-group pb-header text-[13px] font-semibold text-muted [tbody:first-of-type_&]:pt-stack">
                {g.label} · Vào <span className="tnum text-success">{formatVnd(tot.in, { sign: 'in' })}</span> · Ra <span className="tnum">{formatVnd(tot.out, { sign: 'out' })}</span>
              </th>
            </tr>
            {g.rows.map((t) => {
              const name = counterpartyName(t.counterparty, w)
              return (
                <tr key={t.id} onClick={() => onOpen(t.id)} className="cursor-pointer border-b border-line-soft transition-colors last:border-0 hover:bg-surface-2 active:bg-surface-2">
                  <td className="py-stack pr-group pl-inset align-middle text-[13px] tnum">
                    <span className="block">{fmtDate(t.createdAt)}</span>
                    <span className="block text-muted">{fmtTime(t.createdAt)}</span>
                  </td>
                  <td className="max-w-0 py-stack pr-group align-middle">
                    <span className="flex items-center gap-3">
                      <TxIcon type={t.type} />
                      <span className="min-w-0">
                        <Link to={`/history/${t.id}`} onClick={(e) => { e.preventDefault(); onOpen(t.id) }} aria-label={`${name}, ${typeLabel(t.type)}`} className="block truncate font-medium text-ink no-underline">{name}</Link>
                        <span className="block truncate text-[13px] text-muted">{typeLabel(t.type)}</span>
                      </span>
                    </span>
                  </td>
                  <td className="py-stack pr-group align-middle"><RowStatus t={t} web /></td>
                  <td className="py-stack pr-inset text-right align-middle"><TxAmount t={t} /></td>
                </tr>
              )
            })}
          </tbody>
        )
      })}
    </table>
    </div>
  )
}

function AppList({ groups, onOpen }: { groups: Group[]; onOpen: (id: string) => void }) {
  return (
    <div>
      {groups.map((g) => (
        <section key={g.key} aria-label={g.label} className="mt-group first:mt-stack">
          <h2 className="label-caps mb-header px-inset">{g.label}</h2>
          <ul className="card overflow-hidden">
            {g.rows.map((t) => <li key={t.id}><TxRow t={t} onOpen={onOpen} /></li>)}
          </ul>
        </section>
      ))}
    </div>
  )
}

export default function HistoryPage() {
  const layout = useLayout()
  const w = useWorld()
  const nav = useNavigate()
  const { f, set, clear, key } = useHistoryParams()
  const [sheet, setSheet] = useState(false)
  // Rows shown, tied to the filter key: a new filter starts again at 50.
  const [page, setPage] = useState(() => {
    try { const s = JSON.parse(sessionStorage.getItem(SCROLL_KEY) ?? 'null'); if (s?.key === key) return { key, count: s.count as number } } catch { /* ignore */ }
    return { key, count: PAGE }
  })
  const count = page.key === key ? page.count : PAGE

  // Back from a detail: restore count + scroll after the shell's route-change scrollTo(0,0) has run.
  useEffect(() => {
    let saved: { key: string; y: number } | null = null
    try { saved = JSON.parse(sessionStorage.getItem(SCROLL_KEY) ?? 'null'); sessionStorage.removeItem(SCROLL_KEY) } catch { /* ignore */ }
    if (saved?.key === key) requestAnimationFrame(() => window.scrollTo(0, saved!.y))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const filtered = useMemo(() => filterTransactions(w.transactions, f), [w.transactions, f.tab, f.month, f.type, f.status]) // eslint-disable-line react-hooks/exhaustive-deps
  const groups = useMemo(() => (layout === 'web' ? groupByMonth(filtered) : groupByDay(filtered, now())), [filtered, layout])
  const shown = take(groups, count)
  const months = useMemo(() => monthsOf(w.transactions), [w.transactions])
  const active = ([['month', f.month && monthLabel(f.month)], ['type', f.type && typeLabel(f.type)], ['status', f.status && STATUS_LABEL[f.status]]] as const).filter(([, v]) => v)

  const open = (id: string) => {
    try { sessionStorage.setItem(SCROLL_KEY, JSON.stringify({ key, y: window.scrollY, count })) } catch { /* ignore */ }
    nav(`/history/${id}`)
  }

  if (!w.transactions.length)
    return (
      <div>
        <ScreenTitle>Lịch sử</ScreenTitle>
        <EmptyState icon={<Inbox size={22} strokeWidth={1.75} />} title="Chưa có giao dịch nào" action={<Link to="/topup" className="font-semibold text-tint">Nạp tiền vào ví</Link>} />
      </div>
    )

  return (
    <div>
      <ScreenTitle>Lịch sử</ScreenTitle>
      <div className={cx('flex gap-stack', layout === 'web' ? 'flex-col' : 'items-center')}>
        <div className="min-w-0 flex-1">
          <Segmented label="Chế độ xem" value={f.tab ?? 'all'} options={TABS} onChange={(v) => set('tab', v)} />
        </div>
        {layout === 'web' ? (
          <div className="grid grid-cols-3 gap-stack"><Filters f={f} set={set} months={months} onGround /></div>
        ) : (
          <button type="button" onClick={() => setSheet(true)} className="inline-flex h-9 shrink-0 items-center gap-2 rounded-full bg-surface px-3 text-[15px] font-semibold text-tint transition-colors hover:bg-surface-2 active:bg-surface-2">
            <SlidersHorizontal size={16} strokeWidth={1.75} aria-hidden />Bộ lọc
            {active.length ? <span className="min-w-5 rounded-full bg-primary px-1.5 text-[12px] leading-5 text-white tnum" aria-label={`${active.length} bộ lọc đang bật`}>{active.length}</span> : null}
          </button>
        )}
      </div>

      {active.length ? (
        <div className="mt-stack flex flex-wrap items-center gap-header">
          {active.map(([k, v]) => (
            <span key={k} className="inline-flex h-9 items-center gap-1 rounded-full bg-primary-soft pr-1 pl-3 text-[13px] font-semibold text-primary-ink">
              {v}
              <button type="button" aria-label={`Bỏ lọc ${v}`} onClick={() => set(k)} className="inline-flex size-8 items-center justify-center rounded-full hover:bg-primary/10"><X size={14} strokeWidth={2} aria-hidden /></button>
            </span>
          ))}
          <Button variant="ghost" size="sm" onClick={() => clear()}>Xóa bộ lọc</Button>
        </div>
      ) : null}

      <div className="mt-group">
        {!filtered.length ? (
          <EmptyState icon={<Inbox size={22} strokeWidth={1.75} />} title="Không có giao dịch phù hợp" action={<Button variant="secondary" onClick={() => clear(true)}>Xóa bộ lọc</Button>} />
        ) : layout === 'web' ? (
          <WebTable groups={shown} all={groups} w={w} onOpen={open} />
        ) : (
          <AppList groups={shown} onOpen={open} />
        )}
        {filtered.length ? (
          <div className="mt-group flex flex-col items-center gap-header text-[13px] text-muted">
            <p aria-live="polite">{count >= filtered.length ? 'Đã hiển thị tất cả giao dịch' : `Đang hiển thị ${Math.min(count, filtered.length)}/${filtered.length} giao dịch`}</p>
            {count < filtered.length ? <Button variant="secondary" onClick={() => setPage({ key, count: count + PAGE })}>Xem thêm</Button> : null}
          </div>
        ) : null}
      </div>

      <Sheet open={sheet} onOpenChange={setSheet} title="Bộ lọc">
        <div className="flex flex-col gap-inset"><Filters f={f} set={set} months={months} /></div>
        <div className="mt-group flex flex-col gap-header">
          <Button block onClick={() => setSheet(false)}>Xem {filtered.length} giao dịch</Button>
          {active.length ? <Button variant="secondary" block onClick={() => clear()}>Xóa bộ lọc</Button> : null}
        </div>
      </Sheet>
    </div>
  )
}
