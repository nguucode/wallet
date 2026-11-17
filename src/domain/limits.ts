import { config } from './config'
import type { TxStatus, TxType } from './types'

type Countable = { type: TxType; status: TxStatus; amount: number; essential?: boolean; createdAt: string }
export type LimitUsage = { general: number; essential: number }

const LIMITED: TxType[] = ['bank_transfer', 'p2p_out', 'qr_merchant', 'bill']

/** Calendar month key in Asia/Ho_Chi_Minh (UTC+7, no DST). */
export const vnMonth = (d: Date) => new Date(d.getTime() + 7 * 3600_000).toISOString().slice(0, 7)

export function limitUsage(txs: Countable[], now: Date): LimitUsage {
  const month = vnMonth(now)
  const u = { general: 0, essential: 0 }
  for (const t of txs) {
    if (!LIMITED.includes(t.type) || t.status === 'failed' || vnMonth(new Date(t.createdAt)) !== month) continue
    if (t.type === 'bill' && t.essential) u.essential += t.amount
    else u.general += t.amount
  }
  return u
}

export type LimitCheck = { ok: true } | { ok: false; pool: 'general' | 'essential'; remaining: number }

export function checkLimit(usage: LimitUsage, type: TxType, amount: number, essential: boolean): LimitCheck {
  if (!LIMITED.includes(type)) return { ok: true }
  const pool = type === 'bill' && essential ? 'essential' : 'general'
  const remaining = (pool === 'essential' ? config.limits.essentialMonth : config.limits.generalMonth) - usage[pool]
  return amount <= remaining ? { ok: true } : { ok: false, pool, remaining: Math.max(0, remaining) }
}
