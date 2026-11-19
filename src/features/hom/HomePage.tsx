import {
  ArrowDownToLine, ArrowUpFromLine, Clock, Eye, EyeOff, FileText, Inbox, QrCode, ScanLine, Send,
} from 'lucide-react'
import type { ReactNode } from 'react'
import { useLayout } from '@/app/layout'
import {
  bankById, gateOf, getState, now, pendingOut, setBalanceHidden, useWorld,
} from '@/app/store'
import { formatVnd } from '@/domain/money'
import { Avatar, BankMark, Card, EmptyState, Ico, RailTile, Row, RowSkeleton, Section, Skeleton, TextLink, useLinkPress } from '@/components/app-ui'
import { Badge, BadgeIcon, BadgeText } from '@/components/ui/badge'
import { Box } from '@/components/ui/box'
import { Button as GButton } from '@/components/ui/button'
import { Card as GCard } from '@/components/ui/card'
import { Center } from '@/components/ui/center'
import { Grid, GridItem } from '@/components/ui/grid'
import { Heading } from '@/components/ui/heading'
import { HStack } from '@/components/ui/hstack'
import { Pressable } from '@/components/ui/pressable'
import { Text } from '@/components/ui/text'
import { VStack } from '@/components/ui/vstack'
import { TxIcon, TxRow } from '@/features/his/parts'
import { LineChart } from '@/components/charts'
import { maskAccount, maskPhone } from '@/features/flow/FlowKit'
import { GateCallout, useGuard } from '@/features/sec/Gate'
import { useLoaded } from '@/features/sec/kit'
import { useReminders } from '@/features/ntf/useReminders'
import { balanceSeries, fmtYmd, selectBillsDue, selectRecentRecipients, shortName, vndWords } from './selectors'

type Guard = ReturnType<typeof useGuard>['guard']
/** Link semantics, but a gated tap opens the gate sheet instead of navigating (US-SEC-004). */
const guardedClick = (guard: Guard, to: string) => (e?: { preventDefault?: () => void }) => {
  if (gateOf(getState().world)) { e?.preventDefault?.(); guard(to) }
}

export default function HomePage() {
  const w = useWorld()
  const layout = useLayout()
  const loaded = useLoaded()
  const { guard, sheet } = useGuard()
  useReminders()
  const gate = gateOf(w)

  return (
    <Box>
      <Heading size="3xl" tabIndex={-1} data-page-title className="sr-only">Trang chủ</Heading>
      {layout === 'web' ? <Text size="3xl" bold className="mb-6" aria-hidden>Chào {shortName(w.customer.name)}</Text> : null}
      <BalanceSection loaded={loaded} />
      <ShortcutsRow guard={guard} />
      {gate ? <Box role="region" aria-label="Trạng thái ví" className="mt-8"><GateCallout gate={gate} /></Box> : null}
      <BillsDue loaded={loaded} guard={guard} />
      <RecentRecipients loaded={loaded} guard={guard} />
      <RecentActivity loaded={loaded} guard={guard} />
      {sheet}
    </Box>
  )
}

/* ── US-HOM-001 ───────────────────────────────────────────────────── */

function BalanceSection({ loaded }: { loaded: boolean }) {
  const w = useWorld()
  const layout = useLayout()
  const pendingPress = useLinkPress('/history?tab=dang-xu-ly')
  const hidden = w.security.balanceHidden
  const amount = w.balance
  const held = pendingOut(w)
  const text = formatVnd(amount)
  // US-HOM-001 overflow: 12-character balances step down one size on the app layout.
  const size = layout === 'web' ? '4xl' : text.length > 11 ? '2xl' : '3xl'
  const series = loaded ? balanceSeries(w, now()) : []
  const delta = series.length ? series[series.length - 1] - series[0] : 0
  return (
    <GCard role="region" aria-label="Số dư" className="gap-0 p-5">
      <HStack className="items-center gap-1">
        <Heading as="h2" size="sm" className="font-semibold text-muted-foreground">Số dư khả dụng</Heading>
        <GButton
          variant="ghost" size="icon" className="-my-1 rounded-full"
          aria-label={hidden ? 'Hiện số dư' : 'Ẩn số dư'} aria-pressed={hidden}
          onPress={() => setBalanceHidden(!hidden)}
        >
          <Ico as={hidden ? EyeOff : Eye} />
        </GButton>
      </HStack>
      {!loaded ? (
        <Skeleton className={layout === 'web' ? 'mt-2 h-12 w-64 max-w-full' : 'mt-2 h-11 w-64 max-w-full'} />
      ) : (
        <>
          <Heading as="p" size={size} aria-hidden className="mt-2 whitespace-nowrap tabular-nums">{hidden ? '••••••• ₫' : text}</Heading>
          <Text className="sr-only">{hidden ? 'Số dư đang ẩn' : vndWords(amount)}</Text>
        </>
      )}
      {loaded && held > 0 ? (
        <Pressable href="/history?tab=dang-xu-ly" role="link" onPress={pendingPress} className="mt-3 min-h-8 self-start justify-center">
          <Badge variant="outline" className="gap-2 rounded-full px-3 py-1">
            <BadgeIcon as={Clock} aria-hidden />
            <BadgeText>
              Đang xử lý{' '}
              {hidden ? <><Text size="xs" aria-hidden>••••••</Text><Text className="sr-only">số tiền đang ẩn</Text></> : <Text size="xs" className="font-medium tabular-nums">{formatVnd(held)}</Text>}
            </BadgeText>
          </Badge>
        </Pressable>
      ) : null}
      {loaded && !hidden && series.length > 1 ? (
        <VStack className="mt-3">
          <LineChart
            values={series}
            label={`Số dư 30 ngày qua, từ ${formatVnd(series[0])} đến ${formatVnd(series[series.length - 1])}`}
            endTag={delta ? `${delta > 0 ? '+' : '−'}${(Math.abs(delta) / 1_000_000).toLocaleString('vi-VN', { maximumFractionDigits: 2 })}tr · 30 ngày` : undefined}
            className="px-1 pt-2"
            wide={layout === 'web'}
          />
          <HStack className="mt-2 justify-between" aria-hidden>
            <Text size="xs" className="text-muted-foreground">30 ngày trước</Text>
            <Text size="xs" className="text-muted-foreground">Hôm nay</Text>
          </HStack>
        </VStack>
      ) : null}
    </GCard>
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

function ShortcutTile({ s, guard }: { s: (typeof SHORTCUTS)[number]; guard: Guard }) {
  const press = useLinkPress(s.to, s.ungated ? undefined : guardedClick(guard, s.to))
  return (
    <Pressable href={s.to} role="link" onPress={press} className="items-center gap-2 rounded-lg py-1 data-[hover=true]:bg-accent data-[active=true]:bg-accent">
      <Center className="size-12 rounded-full bg-muted">
        <Ico as={s.icon} size="lg" className="text-primary" />
      </Center>
      <Text size="xs" bold className="px-0.5 text-center text-balance">{s.label}</Text>
    </Pressable>
  )
}

function ShortcutsRow({ guard }: { guard: Guard }) {
  const layout = useLayout()
  const items = SHORTCUTS.filter((s) => layout === 'app' || !s.app)
  return (
    <GCard role="navigation" aria-label="Lối tắt" className="mt-3 gap-0 px-2 py-3 lg:py-4">
      {/* Equal columns: every shortcut gets the same width, so the gaps between icons and to the edges are one rhythm. */}
      <Grid role="list" _extra={{ className: layout === 'app' ? 'grid-cols-6' : 'grid-cols-5' }}>
        {items.map((s) => (
          <GridItem key={s.to} role="listitem" className="min-w-0" _extra={{ className: 'col-span-1' }}>
            <ShortcutTile s={s} guard={guard} />
          </GridItem>
        ))}
      </Grid>
    </GCard>
  )
}

/* ── US-HOM-004 ───────────────────────────────────────────────────── */

function BillsDue({ loaded, guard }: { loaded: boolean; guard: Guard }) {
  const w = useWorld()
  const due = selectBillsDue(w.bills, now())
  if (loaded && !due.length) return null
  return (
    <Section title="Hóa đơn sắp đến hạn" action={loaded ? <TextLink to="/bills">Xem tất cả</TextLink> : undefined}>
      <Card className="overflow-hidden p-0">
        {!loaded ? <RowSkeleton /> : (
          <VStack role="list" className="divide-y divide-border">
            {due.slice(0, 3).map(({ bill, days, overdue }) => {
              const biller = w.billers.find((b) => b.id === bill.billerId)?.name ?? 'Hóa đơn'
              const dueLine = overdue
                ? <Text size="sm" className="font-medium text-destructive">Quá hạn {Math.max(1, -days)} ngày</Text>
                : <>Hạn {fmtYmd(bill.dueDate)}</>
              return (
                <Box key={bill.id} role="listitem">
                  <Row
                    to={`/bills/${bill.id}`} onClick={guardedClick(guard, `/bills/${bill.id}`)}
                    left={<TxIcon type="bill" />} title={biller}
                    subtitle={<>{dueLine} · <Text size="sm" className="tabular-nums text-muted-foreground">{bill.customerCode}</Text></>}
                    right={formatVnd(bill.amount)} chevron
                  />
                </Box>
              )
            })}
          </VStack>
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
    <Section title="Người nhận gần đây" action={<TextLink to="/transfer">Chuyển tiền</TextLink>}>
      {/* The 56px avatar sits centred in a 72px item, so the rail is pulled 8px left to put the first avatar on the title edge. */}
      <HStack role="list" className="-mx-4 gap-2 overflow-x-auto pr-4 pb-1 pl-2 lg:mr-0 lg:-ml-2 lg:overflow-visible lg:pr-0 lg:pl-0">
        {!loaded
          ? Array.from({ length: 4 }, (_, i) => <Box key={i} role="listitem" className="w-[72px] shrink-0"><Skeleton className="mx-auto size-14 rounded-full" /></Box>)
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
                <Box key={r.key} role="listitem" className="w-[72px] shrink-0">
                  <RailTile
                    to={to} onClick={guardedClick(guard, to)} label={label} name={shortName(r.name)} sub={sub}
                    leading={r.kind === 'contact' ? <Avatar name={r.name} size={56} /> : <BankMark short={bankById(r.bankId).short} size={56} />}
                  />
                </Box>
              )
            })}
      </HStack>
    </Section>
  )
}

/* ── US-HOM-006 ───────────────────────────────────────────────────── */

function RecentActivity({ loaded, guard }: { loaded: boolean; guard: Guard }) {
  const w = useWorld()
  const recent = [...w.transactions].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 5)
  let body: ReactNode
  if (!loaded) body = <VStack>{Array.from({ length: 5 }, (_, i) => <RowSkeleton key={i} />)}</VStack>
  else if (!recent.length)
    body = <EmptyState icon={<Ico as={Inbox} />} title="Chưa có giao dịch nào" action={<TextLink to="/topup" onClick={guardedClick(guard, '/topup')}>Nạp tiền vào ví</TextLink>} />
  else body = <VStack role="list" className="divide-y divide-border">{recent.map((t) => <Box key={t.id} role="listitem"><TxRow t={t} withDate /></Box>)}</VStack>
  return (
    <Section title="Hoạt động gần đây" action={recent.length ? <TextLink to="/history">Xem tất cả</TextLink> : undefined}>
      <Card className="overflow-hidden p-0">{body}</Card>
    </Section>
  )
}
