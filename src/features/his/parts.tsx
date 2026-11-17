import { ArrowDownLeft, ArrowDownToLine, ArrowUpFromLine, Landmark, RotateCcw, Send, Store, Zap } from 'lucide-react'
import type { TxType } from '@/domain/types'
import { Disc } from '@/components/ui'

const ICON: Record<TxType, typeof Send> = {
  topup: ArrowDownToLine, withdraw: ArrowUpFromLine, p2p_out: Send, p2p_in: ArrowDownLeft,
  bank_transfer: Landmark, qr_merchant: Store, bill: Zap, refund: RotateCcw,
}

export function TxIcon({ type, size = 40 }: { type: TxType; size?: number }) {
  const Icon = ICON[type]
  return <Disc size={size}><Icon size={size >= 48 ? 22 : 18} strokeWidth={1.75} /></Disc>
}



export { ScreenTitle, useToast } from '@/components/ui'
