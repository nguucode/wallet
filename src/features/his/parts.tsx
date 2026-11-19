import { ArrowDownLeft, ArrowDownToLine, ArrowUpFromLine, Landmark, RotateCcw, Send, Store, Zap } from 'lucide-react'
import type { TxType } from '@/domain/types'
import { counterpartyName, typeLabel, useWorld } from '@/app/store'
import type { Transaction } from '@/mock/seed'
import { Disc, Ico, Money, Row, StatusPill } from '@/components/app-ui'
import { Text } from '@/components/ui/text'
import { fmtDate, fmtTime } from '@/features/flow/FlowKit'
import { rowAmount } from './history'

const ICON: Record<TxType, typeof Send> = {
  topup: ArrowDownToLine, withdraw: ArrowUpFromLine, p2p_out: Send, p2p_in: ArrowDownLeft,
  bank_transfer: Landmark, qr_merchant: Store, bill: Zap, refund: RotateCcw,
}

export function TxIcon({ type, size = 40 }: { type: TxType; size?: number }) {
  return <Disc size={size}><Ico as={ICON[type]} size={size >= 48 ? 'xl' : 'lg'} /></Disc>
}

/** The one amount rule for a transaction: signed, fee included on outgoing, failed muted and struck. */
export function TxAmount({ t }: { t: Transaction }) {
  const failed = t.status === 'failed'
  return (
    <Text className="whitespace-nowrap">
      <Money amount={rowAmount(t)} sign={t.direction} struck={failed} className="font-semibold" />
      {failed ? <Text className="sr-only"> (không có tiền dịch chuyển)</Text> : null}
    </Text>
  )
}

/** The one transaction row (Home activity, History list): type icon, counterparty, time · type, amount, status when not success. */
export function TxRow({ t, withDate, onOpen }: { t: Transaction; withDate?: boolean; onOpen?: (id: string) => void }) {
  const w = useWorld()
  return (
    <Row
      to={`/history/${t.id}`}
      onClick={onOpen ? (e) => { e.preventDefault(); onOpen(t.id) } : undefined}
      left={<TxIcon type={t.type} />}
      title={counterpartyName(t.counterparty, w)}
      // When the line truncates, the type goes first (the icon already says it), never the time.
      subtitle={<><Text size="sm" className="tabular-nums text-muted-foreground">{withDate ? `${fmtDate(t.createdAt)} · ` : ''}{fmtTime(t.createdAt)}</Text> · {typeLabel(t.type)}</>}
      right={<TxAmount t={t} />}
      rightSub={t.status !== 'success' ? <StatusPill status={t.status} /> : undefined}
    />
  )
}

export { ScreenTitle, useToast } from '@/components/app-ui'
