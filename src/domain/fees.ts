import { config } from './config'
import type { TxType } from './types'

/** freeUsed = successful withdraw + bank_transfer this month (failed ones never consume a slot). */
export function fee(type: TxType, amount: number, freeUsed: number): { amount: number; freeLeft: number | null } {
  if (type !== 'withdraw' && type !== 'bank_transfer') return { amount: 0, freeLeft: null }
  const f = config.fees
  if (freeUsed < f.freeWithdrawPerMonth) return { amount: 0, freeLeft: f.freeWithdrawPerMonth - freeUsed - 1 }
  return { amount: Math.max(f.min, Math.round((amount * f.rate) / f.roundTo) * f.roundTo), freeLeft: 0 }
}
