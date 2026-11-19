import { ArrowDownLeft, ArrowDownToLine, ArrowUpFromLine, Landmark, RotateCcw, Send, Store, Zap } from 'lucide-react'
import type { TxType } from '@/domain/types'
import { counterpartyName, typeLabel, useWorld } from '@/app/store'
import { formatVnd } from '@/domain/money'
import type { Transaction } from '@/mock/seed'
import { cx, Disc, Row, StatusPill } from '@/components/app-ui'
import { fmtDate, fmtTime } from '@/features/flow/FlowKit'
import { rowAmount } from './history'

const ICON: Record<TxType, typeof Send> = {
  topup: ArrowDownToLine, withdraw: ArrowUpFromLine, p2p_out: Send, p2p_in: ArrowDownLeft,
  bank_transfer: Landmark, qr_merchant: Store, bill: Zap, refund: RotateCcw,
}

export function TxIcon({ type, size = 40 }: { type: TxType; size?: number }) {
  const Icon = ICON[type]
  return <Disc size={size}><Icon size={size >= 48 ? 22 : 20} strokeWidth={1.75} /></Disc>
}


/** The one amount rule for a transaction: signed, fee included on outgoing, incoming green, failed muted and struck. */
export function TxAmount({ t }: { t: Transaction }) {
  const failed = t.status === 'failed'
  return (
    <span className={cx('tnum font-semibold whitespace-nowrap', failed ? 'text-muted line-through' : t.direction === 'in' && 'text-success')}>
      {formatVnd(rowAmount(t), { sign: t.direction })}
      {failed ? <span className="sr-only"> (không có tiền dịch chuyển)</span> : null}
    </span>
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
      subtitle={<><span className="tnum">{withDate ? `${fmtDate(t.createdAt)} · ` : ''}{fmtTime(t.createdAt)}</span> · {typeLabel(t.type)}</>}
      right={<TxAmount t={t} />}
      rightSub={t.status !== 'success' ? <StatusPill status={t.status} /> : undefined}
    />
  )
}

export { ScreenTitle, useToast } from '@/components/app-ui'
