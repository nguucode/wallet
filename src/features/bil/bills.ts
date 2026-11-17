import { checkLimit, type LimitUsage } from '@/domain/limits'
import type { SavedBill } from '@/mock/seed'

/* Pure bill logic (US-BIL-001, -002, -003, -004). Dates are Asia/Ho_Chi_Minh calendar days. */

const DAY = 86_400_000
export const vnToday = (now: number) => new Date(now + 7 * 3600_000).toISOString().slice(0, 10)
const dayNum = (ymd: string) => Date.parse(ymd + 'T00:00:00Z') / DAY

export type BillStatus = SavedBill['status']

/** `due` turns `overdue` once today passes the due date (the store does not persist this, so it is derived). */
export const billStatusOn = (b: SavedBill, now: number): BillStatus => (b.status === 'due' && b.dueDate < vnToday(now) ? 'overdue' : b.status)
export const overdueDays = (b: SavedBill, now: number) => Math.max(0, dayNum(vnToday(now)) - dayNum(b.dueDate))

const ORDER: Record<BillStatus, number> = { overdue: 0, due: 1, settling: 2, paid: 3 }
export function sortBills(bills: SavedBill[], now: number) {
  return [...bills].sort((a, b) => ORDER[billStatusOn(a, now)] - ORDER[billStatusOn(b, now)] || a.dueDate.localeCompare(b.dueDate))
}

export const isPayable = (b: SavedBill, now: number) => ['due', 'overdue'].includes(billStatusOn(b, now))

/** Due and overdue bills whose due date is within `days` of today (overdue always included), soonest first. Reminder lead time per rules.md#notifications. */
/** rules.md#notifications: bill_due 3 days before due date. shortcut: not in config.ts (not ours to edit); move there when FND adds it. */
export const BILL_REMINDER_DAYS = 3
export function billsDueSoon(bills: SavedBill[], now: number, days = BILL_REMINDER_DAYS) {
  const limit = dayNum(vnToday(now)) + days
  return bills.filter((b) => isPayable(b, now) && dayNum(b.dueDate) <= limit).sort((a, b) => a.dueDate.localeCompare(b.dueDate))
}

/** Customer code: 2 letters + 11 digits (BIL-002 mock data). */
export const isValidCustomerCode = (code: string) => /^[A-Z]{2}\d{11}$/.test(code)
export const maskCode = (code: string) => '•••• ' + code.slice(-4)
export const periodLabel = (ym: string) => `Kỳ ${ym.slice(5)}/${ym.slice(0, 4)}`

export type PayCheck = { ok: true } | { ok: false; reason: 'not_payable' } | { ok: false; reason: 'insufficient_balance'; short: number } | { ok: false; reason: 'essential_limit'; remaining: number }

/** View-step pre-check (rules.md decisions: bills check on the view step, pay from wallet balance only). Bills are free. */
export function canPayBill(b: SavedBill, now: number, balance: number, usage: LimitUsage, essential: boolean): PayCheck {
  if (!isPayable(b, now)) return { ok: false, reason: 'not_payable' }
  if (b.amount > balance) return { ok: false, reason: 'insufficient_balance', short: b.amount - balance }
  const lim = checkLimit(usage, 'bill', b.amount, essential)
  if (!lim.ok) return { ok: false, reason: 'essential_limit', remaining: lim.remaining }
  return { ok: true }
}
