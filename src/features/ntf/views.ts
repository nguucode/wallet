import type { Notification, NotificationKind } from '@/mock/seed'
import { vnDay } from '@/features/hom/selectors'

/** US-NTF-001 kind-to-view mapping (a decision of that story). */
export const VIEWS: { slug: string; label: string; kinds: NotificationKind[] | null; empty: string }[] = [
  { slug: 'tat-ca', label: 'Tất cả', kinds: null, empty: 'Chưa có thông báo nào' },
  { slug: 'giao-dich', label: 'Giao dịch', kinds: ['balance_change'], empty: 'Chưa có thông báo giao dịch' },
  { slug: 'bao-mat', label: 'Bảo mật', kinds: ['security', 'new_device_login', 'id_expiring'], empty: 'Chưa có thông báo bảo mật' },
  { slug: 'hoa-don', label: 'Hóa đơn', kinds: ['bill_due'], empty: 'Chưa có thông báo hóa đơn' },
]

export const inView = (kinds: NotificationKind[] | null) => (n: Notification) => !kinds || kinds.includes(n.kind)

/** Newest first, grouped "Hôm nay", "Hôm qua", then "15/11/2026" (Asia/Ho_Chi_Minh days). */
export function groupByDay(items: Notification[], now: number) {
  const today = vnDay(now), yesterday = vnDay(now - 86_400_000)
  const groups: { label: string; items: Notification[] }[] = []
  for (const n of [...items].sort((a, b) => b.createdAt.localeCompare(a.createdAt))) {
    const d = vnDay(Date.parse(n.createdAt))
    const label = d === today ? 'Hôm nay' : d === yesterday ? 'Hôm qua' : d.split('-').reverse().join('/')
    const last = groups[groups.length - 1]
    if (last?.label === label) last.items.push(n)
    else groups.push({ label, items: [n] })
  }
  return groups
}
