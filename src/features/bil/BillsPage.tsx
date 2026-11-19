import { Droplet, FileText, Wifi, Zap } from 'lucide-react'
import { useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router'
import { formatVnd } from '@/domain/money'
import { now, useWorld } from '@/app/store'
import type { SavedBill, World } from '@/mock/seed'
import { fmtDate } from '@/features/flow/FlowKit'
import { useGuard } from '@/features/sec/Gate'
import { ScreenTitle, TxIcon, useToast } from '@/features/his/parts'
import { Badge, Button, Card, cx, EmptyState, Ico, Row, Section } from '@/components/app-ui'
import { Box } from '@/components/ui/box'
import { Center } from '@/components/ui/center'
import { HStack } from '@/components/ui/hstack'
import { Pressable } from '@/components/ui/pressable'
import { Text } from '@/components/ui/text'
import { VStack } from '@/components/ui/vstack'
import { billStatusOn, isPayable, maskCode, overdueDays, periodLabel, sortBills, type BillStatus } from './bills'

const CHIP: Record<BillStatus, { label: string; tone: 'danger' | 'secondary' | 'pending' | 'neutral' | 'success' }> = {
  overdue: { label: 'Quá hạn', tone: 'danger' }, due: { label: 'Sắp đến hạn', tone: 'secondary' },
  settling: { label: 'Đang xử lý', tone: 'pending' }, paid: { label: 'Đã thanh toán', tone: 'success' },
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
  if (s === 'overdue') return <Text size="sm" className="text-destructive">Quá hạn {overdueDays(b, at)} ngày</Text>
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
    <Box>
      <ScreenTitle description={payable.length ? <Text className="tabular-nums">{payable.length} hóa đơn cần thanh toán · {formatVnd(total)}</Text> : undefined}>Hóa đơn</ScreenTitle>

      <Section title="Hóa đơn của tôi" className="mt-0" action={bills.length ? <Button variant="ghost" size="sm" onClick={() => guard('/bills/new')}>Thêm hóa đơn</Button> : undefined}>
        {!bills.length ? (
          <Card>
            <EmptyState icon={<Ico as={FileText} size="lg" />} title="Chưa có hóa đơn nào được lưu"
              action={<Button variant="ghost" onClick={() => guard('/bills/new')}>Thêm hóa đơn điện</Button>} />
          </Card>
        ) : (
          <Card className="overflow-hidden p-0">
            <VStack role="list" className="divide-y divide-border">
              {bills.map((b) => {
                const s = billStatusOn(b, at)
                return (
                  <Box key={b.id} role="listitem">
                    <Row
                      to={`/bills/${b.id}`}
                      onClick={isPayable(b, at) ? (e) => { e.preventDefault(); guard(`/bills/${b.id}`) } : undefined}
                      left={<TxIcon type="bill" />}
                      title={billerName(b.billerId)}
                      subtitle={<>{keyFact(b, w, at)}{b.holder ? ` · ${b.holder}` : ''} · <Text size="sm" className="tabular-nums">{maskCode(b.customerCode)}</Text></>}
                      right={formatVnd(b.amount)}
                      rightSub={<BillChip status={s} />}
                      chevron
                    />
                  </Box>
                )
              })}
            </VStack>
          </Card>
        )}
      </Section>

      <Section title="Thêm hóa đơn">
        {/* Same pitch as Home's recipient rail (72px items, 8px gap); pulled 12px left so the first circle meets the title edge. */}
        <HStack role="list" className="-ml-3 gap-2">
          {tiles.map((t) => (
            <Box key={t.label} role="listitem">
              <Pressable role="button" disabled={!t.enabled} onPress={() => guard('/bills/new')} className="w-[72px] items-center gap-2 rounded-xl data-[hover=true]:opacity-80 data-[active=true]:opacity-60 data-[disabled=true]:opacity-100">
                <Center aria-hidden className="size-12 rounded-full bg-muted">
                  <Ico as={t.icon} size="lg" className={t.enabled ? 'text-primary' : 'text-muted-foreground'} />
                </Center>
                <Text size="sm" className={cx('text-center font-medium', !t.enabled && 'text-muted-foreground')}>{t.label}</Text>
                {!t.enabled ? <Text size="xs" className="text-muted-foreground">Sắp có</Text> : null}
              </Pressable>
            </Box>
          ))}
        </HStack>
      </Section>
      {sheet}
      {toast.node}
    </Box>
  )
}
