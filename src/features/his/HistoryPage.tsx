import { ChevronDown, Inbox, SlidersHorizontal, X } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router'
import { formatVnd } from '@/domain/money'
import type { TxStatus, TxType } from '@/domain/types'
import { useLayout, pageScroller } from '@/app/layout'
import { counterpartyName, now, typeLabel, useWorld } from '@/app/store'
import type { Transaction, World } from '@/mock/seed'
import { fmtDate, fmtTime, truthLine } from '@/features/flow/FlowKit'
import { Button, Card, cx, EmptyState, Ico, IconButton, Segmented, Sheet, STATUS_LABEL, StatusPill, TextLink } from '@/components/app-ui'
import { Badge, BadgeText } from '@/components/ui/badge'
import { Box } from '@/components/ui/box'
import { Button as GButton, ButtonText } from '@/components/ui/button'
import { Heading } from '@/components/ui/heading'
import { HStack } from '@/components/ui/hstack'
import { Link, LinkText } from '@/components/ui/link'
import { Menu, MenuItem, MenuItemLabel } from '@/components/ui/menu'
import { Pressable } from '@/components/ui/pressable'
import { Text } from '@/components/ui/text'
import { VStack } from '@/components/ui/vstack'
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
  if (t.status === 'success') return web ? <StatusPill status="success" /> : null
  return (
    <VStack className="items-start gap-1">
      <StatusPill status={t.status} />
      {t.status === 'pending' ? <Text size="xs" className="text-muted-foreground">{truthLine(t).replace('Đang xử lý · ', '')}</Text> : null}
    </VStack>
  )
}

/** One filter field: a label over a gluestack Menu whose trigger shows the current choice. */
function Pick({ label, value, options, onChange, className }: { label: string; value: string; options: [string, string][]; onChange: (v: string) => void; className?: string }) {
  const current = options.find(([v]) => v === value)?.[1] ?? options[0][1]
  return (
    <VStack className={cx('gap-2', className)}>
      <Text size="sm" bold>{label}</Text>
      <Menu placement="bottom left" offset={4} className="max-h-80" trigger={(p) => (
        <GButton {...p} variant="outline" aria-label={`${label}: ${current}`} className="h-11 w-full justify-between">
          <ButtonText className="truncate font-normal">{current}</ButtonText>
          <Ico as={ChevronDown} className="text-muted-foreground" />
        </GButton>
      )}>
        {options.map(([v, l]) => (
          <MenuItem key={v || 'all'} textValue={l} onPress={() => onChange(v)}><MenuItemLabel>{l}</MenuItemLabel></MenuItem>
        ))}
      </Menu>
    </VStack>
  )
}

function Filters({ f, set, months, row }: { f: HistoryFilter; set: (k: keyof HistoryFilter, v?: string) => void; months: string[]; row?: boolean }) {
  const cls = row ? 'min-w-0 flex-1' : undefined
  return (
    <>
      <Pick className={cls} label="Tháng" value={f.month ?? ''} onChange={(v) => set('month', v)}
        options={[['', 'Tất cả các tháng'], ...months.map((m): [string, string] => [m, monthLabel(m)])]} />
      <Pick className={cls} label="Loại giao dịch" value={f.type ?? ''} onChange={(v) => set('type', v)}
        options={[['', 'Tất cả loại'], ...TYPES.map((t): [string, string] => [t, typeLabel(t)])]} />
      <Pick className={cls} label="Trạng thái" value={f.status ?? ''} onChange={(v) => set('status', v)}
        options={[['', 'Tất cả trạng thái'], ...STATUSES.map((st): [string, string] => [st, STATUS_LABEL[st]])]} />
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

/** Month-grouped table: ARIA table roles on gluestack stacks (gluestack has no Table). */
function WebTable({ groups, all, w, onOpen }: { groups: Group[]; all: Group[]; w: World; onOpen: (id: string) => void }) {
  // Flat inside the web panel: columns start and end on the content edge.
  const col = { date: 'w-28 shrink-0 pr-6', tx: 'min-w-0 flex-1 pr-6', status: 'w-44 shrink-0 pr-6', amount: 'w-36 shrink-0 items-end' }
  return (
    <Card className="overflow-hidden p-0 pb-2">
      <VStack role="table" aria-label="Lịch sử giao dịch, mới nhất trước, nhóm theo tháng">
        <HStack role="row" className="border-b border-border py-3">
          <Box role="columnheader" className={col.date}><Text size="sm" className="font-medium text-muted-foreground">Ngày</Text></Box>
          <Box role="columnheader" className={col.tx}><Text size="sm" className="font-medium text-muted-foreground">Giao dịch</Text></Box>
          <Box role="columnheader" className={col.status}><Text size="sm" className="font-medium text-muted-foreground">Trạng thái</Text></Box>
          <Box role="columnheader" className={col.amount}><Text size="sm" className="font-medium text-muted-foreground">Số tiền</Text></Box>
        </HStack>
        {groups.map((g, gi) => {
          const tot = monthTotals(all.find((x) => x.key === g.key)!.rows)
          return (
            <VStack key={g.key} role="rowgroup">
              <HStack role="row">
                <Box role="columnheader" aria-colspan={4} className={cx('pb-2', gi === 0 ? 'pt-3' : 'pt-6')}>
                  <Text size="sm" className="font-semibold text-muted-foreground">
                    {g.label} · Vào <Text size="sm" className="tabular-nums text-success">{formatVnd(tot.in, { sign: 'in' })}</Text> · Ra <Text size="sm" className="tabular-nums text-destructive">{formatVnd(tot.out, { sign: 'out' })}</Text>
                  </Text>
                </Box>
              </HStack>
              <VStack className="divide-y divide-border">
                {g.rows.map((t) => {
                  const name = counterpartyName(t.counterparty, w)
                  return (
                    <Pressable key={t.id} role="row" focusable={false} onPress={() => onOpen(t.id)} className="flex-row items-center py-3 data-[hover=true]:bg-accent data-[active=true]:bg-accent">
                      <VStack role="cell" className={col.date}>
                        <Text size="sm" className="tabular-nums">{fmtDate(t.createdAt)}</Text>
                        <Text size="sm" className="tabular-nums text-muted-foreground">{fmtTime(t.createdAt)}</Text>
                      </VStack>
                      <HStack role="cell" className={cx(col.tx, 'items-center gap-3')}>
                        <TxIcon type={t.type} />
                        <VStack className="min-w-0">
                          <Link href={`/history/${t.id}`} onPress={(e) => { e?.preventDefault(); onOpen(t.id) }} aria-label={`${name}, ${typeLabel(t.type)}`}>
                            <LinkText isTruncated className="font-medium text-foreground no-underline">{name}</LinkText>
                          </Link>
                          <Text size="sm" isTruncated className="text-muted-foreground">{typeLabel(t.type)}</Text>
                        </VStack>
                      </HStack>
                      <Box role="cell" className={col.status}><RowStatus t={t} web /></Box>
                      <Box role="cell" className={col.amount}><TxAmount t={t} /></Box>
                    </Pressable>
                  )
                })}
              </VStack>
            </VStack>
          )
        })}
      </VStack>
    </Card>
  )
}

function AppList({ groups, onOpen }: { groups: Group[]; onOpen: (id: string) => void }) {
  return (
    <VStack>
      {groups.map((g, gi) => (
        <VStack key={g.key} role="region" aria-label={g.label} className={gi === 0 ? 'mt-3' : 'mt-6'}>
          <Heading as="h2" size="xs" className="mb-2 px-4 uppercase tracking-wide text-muted-foreground">{g.label}</Heading>
          <Card className="overflow-hidden p-0">
            <VStack role="list" className="divide-y divide-border">
              {g.rows.map((t) => <Box key={t.id} role="listitem"><TxRow t={t} onOpen={onOpen} /></Box>)}
            </VStack>
          </Card>
        </VStack>
      ))}
    </VStack>
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
    if (saved?.key === key) requestAnimationFrame(() => pageScroller().to(saved!.y))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const filtered = useMemo(() => filterTransactions(w.transactions, f), [w.transactions, f.tab, f.month, f.type, f.status]) // eslint-disable-line react-hooks/exhaustive-deps
  const groups = useMemo(() => (layout === 'web' ? groupByMonth(filtered) : groupByDay(filtered, now())), [filtered, layout])
  const shown = take(groups, count)
  const months = useMemo(() => monthsOf(w.transactions), [w.transactions])
  const active = ([['month', f.month && monthLabel(f.month)], ['type', f.type && typeLabel(f.type)], ['status', f.status && STATUS_LABEL[f.status]]] as const).filter(([, v]) => v)

  const open = (id: string) => {
    try { sessionStorage.setItem(SCROLL_KEY, JSON.stringify({ key, y: pageScroller().y, count })) } catch { /* ignore */ }
    nav(`/history/${id}`)
  }

  if (!w.transactions.length)
    return (
      <Box>
        <ScreenTitle>Lịch sử</ScreenTitle>
        <EmptyState icon={<Ico as={Inbox} size="xl" />} title="Chưa có giao dịch nào" action={<TextLink to="/topup">Nạp tiền vào ví</TextLink>} />
      </Box>
    )

  return (
    <Box>
      <ScreenTitle>Lịch sử</ScreenTitle>
      <Box className={cx('gap-3', layout === 'web' ? 'flex-col' : 'flex-row items-center')}>
        <Box className="min-w-0 flex-1">
          <Segmented label="Chế độ xem" value={f.tab ?? 'all'} options={TABS} onChange={(v) => set('tab', v)} />
        </Box>
        {layout === 'web' ? (
          <HStack className="gap-3"><Filters f={f} set={set} months={months} row /></HStack>
        ) : (
          <GButton variant="secondary" size="sm" onPress={() => setSheet(true)} className="shrink-0 rounded-full">
            <Ico as={SlidersHorizontal} />
            <ButtonText>Bộ lọc</ButtonText>
            {active.length ? <Badge aria-label={`${active.length} bộ lọc đang bật`} className="rounded-full"><BadgeText className="tabular-nums">{active.length}</BadgeText></Badge> : null}
          </GButton>
        )}
      </Box>

      {active.length ? (
        <HStack className="mt-3 flex-wrap items-center gap-2">
          {active.map(([k, v]) => (
            <HStack key={k} className="h-9 items-center gap-1 rounded-full bg-secondary pr-1 pl-3">
              <Text size="sm" className="font-semibold text-secondary-foreground">{v}</Text>
              <IconButton label={`Bỏ lọc ${v}`} onClick={() => set(k)} className="h-8 w-8"><Ico as={X} size="sm" /></IconButton>
            </HStack>
          ))}
          <Button variant="ghost" size="sm" onClick={() => clear()}>Xóa bộ lọc</Button>
        </HStack>
      ) : null}

      <Box className="mt-6">
        {!filtered.length ? (
          <EmptyState icon={<Ico as={Inbox} size="xl" />} title="Không có giao dịch phù hợp" action={<Button variant="secondary" onClick={() => clear(true)}>Xóa bộ lọc</Button>} />
        ) : layout === 'web' ? (
          <WebTable groups={shown} all={groups} w={w} onOpen={open} />
        ) : (
          <AppList groups={shown} onOpen={open} />
        )}
        {filtered.length ? (
          <VStack className="mt-6 items-center gap-2">
            <Text size="sm" aria-live="polite" className="text-muted-foreground">{count >= filtered.length ? 'Đã hiển thị tất cả giao dịch' : `Đang hiển thị ${Math.min(count, filtered.length)}/${filtered.length} giao dịch`}</Text>
            {count < filtered.length ? <Button variant="secondary" onClick={() => setPage({ key, count: count + PAGE })}>Xem thêm</Button> : null}
          </VStack>
        ) : null}
      </Box>

      <Sheet open={sheet} onOpenChange={setSheet} title="Bộ lọc">
        <VStack className="gap-4"><Filters f={f} set={set} months={months} /></VStack>
        <VStack className="mt-6 gap-2">
          <Button block onClick={() => setSheet(false)}>Xem {filtered.length} giao dịch</Button>
          {active.length ? <Button variant="secondary" block onClick={() => clear()}>Xóa bộ lọc</Button> : null}
        </VStack>
      </Sheet>
    </Box>
  )
}
