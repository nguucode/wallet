import { config } from '@/domain/config'
import { limitUsage, vnMonth } from '@/domain/limits'
import type { Transaction } from '@/mock/seed'

export type Counter = { used: number; limit: number; remaining: number; pending: number }

/** US-SEC-005: used/remaining per pool, with the pending share. Counting rules live in domain/limitUsage. */
export function limitCounters(txs: Transaction[], now: Date): { general: Counter; essential: Counter } {
  const used = limitUsage(txs, now)
  const pending = limitUsage(txs.filter((t) => t.status === 'pending'), now)
  const mk = (k: 'general' | 'essential', limit: number): Counter => ({ used: used[k], limit, remaining: Math.max(0, limit - used[k]), pending: pending[k] })
  return { general: mk('general', config.limits.generalMonth), essential: mk('essential', config.limits.essentialMonth) }
}

/** First day of next calendar month in Asia/Ho_Chi_Minh, as "01/12/2026". */
export function nextReset(now: Date) {
  const [y, m] = vnMonth(now).split('-').map(Number)
  return `01/${String((m % 12) + 1).padStart(2, '0')}/${m === 12 ? y + 1 : y}`
}
