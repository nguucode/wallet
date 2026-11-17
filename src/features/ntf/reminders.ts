import { formatVnd } from '@/domain/money'
import type { Notification, World } from '@/mock/seed'
import { daysUntil, fmtYmd } from '@/features/hom/selectors'

/** rules.md#notifications lead times. */
export const REMINDER_DAYS = { bill: 3, id: 30 }

/**
 * US-NTF-004: reminders that should exist at `now` but do not yet. Keyed `bill_due:<billId>:<period>` and
 * `id_expiring:<idExpiry>`; an existing notification of the same kind and link (the seed's) also counts, so nothing duplicates.
 */
export function dueReminders(w: Pick<World, 'bills' | 'billers' | 'customer' | 'notifications'>, now: number): Notification[] {
  const createdAt = new Date(now).toISOString()
  const exists = (id: string, kind: Notification['kind'], link: string) => w.notifications.some((n) => n.id === id || (n.kind === kind && n.link === link))
  const out: Notification[] = []
  for (const b of w.bills) {
    const d = daysUntil(b.dueDate, now)
    if (b.status !== 'due' || d < 0 || d > REMINDER_DAYS.bill) continue
    const id = `bill_due:${b.id}:${b.period}`, link = `/bills/${b.id}`
    if (exists(id, 'bill_due', link)) continue
    const biller = w.billers.find((x) => x.id === b.billerId)
    // shortcut: title says "điện" because electricity is the only P0 biller category; derive from biller.category when water/internet ship.
    out.push({ id, kind: 'bill_due', title: 'Hóa đơn điện sắp đến hạn', body: `${biller?.name ?? 'Hóa đơn'} · ${formatVnd(b.amount)} · hạn ${fmtYmd(b.dueDate)}`, link, createdAt, read: false })
  }
  const c = w.customer
  const verified = c.kycStatus !== 'unverified' && c.kycStatus !== 'verifying'
  const d = daysUntil(c.idExpiry, now)
  const id = `id_expiring:${c.idExpiry}`
  if (verified && d >= 0 && d <= REMINDER_DAYS.id && !exists(id, 'id_expiring', '/me/profile'))
    out.push({ id, kind: 'id_expiring', title: 'CCCD sắp hết hạn', body: `CCCD của bạn hết hạn vào ${fmtYmd(c.idExpiry)}. Cập nhật để ví không bị tạm ngừng giao dịch.`, link: '/me/profile', createdAt, read: false })
  return out
}
