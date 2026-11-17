import { seedWorld } from '@/mock/seed'
import { dueReminders } from './reminders'
import { groupByDay } from './views'

// 2026-11-17 10:00 in Hanoi
const NOW = Date.parse('2026-11-17T03:00:00Z')
const DAY = 86_400_000

describe('dueReminders', () => {
  const base = () => {
    const w = seedWorld('ready', NOW)
    w.notifications = []
    return w
  }

  it('creates one bill_due inside 3 days and is idempotent', () => {
    const w = base()
    const add = dueReminders(w, NOW)
    expect(add.map((n) => n.id)).toEqual([`bill_due:b1:${w.bills[0].period}`])
    expect(add[0].body).toMatch(/^Điện lực Hồng Hà · 1\.086\.000 ₫ · hạn 20\/11\/2026$/)
    w.notifications.push(...add)
    expect(dueReminders(w, NOW)).toEqual([])
  })

  it('skips the seed reminder with the same kind and link', () => {
    expect(dueReminders(seedWorld('ready', NOW), NOW).filter((n) => n.kind === 'bill_due')).toEqual([])
  })

  it('respects the window boundaries and paid/settling bills', () => {
    const w = base()
    w.bills = [
      { ...w.bills[0], id: 'x4', dueDate: '2026-11-21' }, // 4 days: too early
      { ...w.bills[0], id: 'x3', dueDate: '2026-11-20' }, // 3 days: in
      { ...w.bills[0], id: 'x0', dueDate: '2026-11-17' }, // today: in
      { ...w.bills[0], id: 'past', dueDate: '2026-11-16' }, // past due: not a reminder
      { ...w.bills[0], id: 'paid', dueDate: '2026-11-18', status: 'paid' },
    ]
    expect(dueReminders(w, NOW).map((n) => n.link)).toEqual(['/bills/x3', '/bills/x0'])
    expect(dueReminders(w, NOW + DAY).map((n) => n.link)).toEqual(['/bills/x4', '/bills/x3'])
  })

  it('creates id_expiring 30 days before expiry, only for a verified customer', () => {
    const w = base()
    w.bills = []
    w.customer.idExpiry = '2026-12-17'
    expect(dueReminders(w, NOW)).toHaveLength(1)
    expect(dueReminders(w, NOW)[0].body).toContain('17/12/2026')
    w.customer.idExpiry = '2026-12-18'
    expect(dueReminders(w, NOW)).toHaveLength(0)
    expect(dueReminders(w, NOW + DAY)[0].id).toBe('id_expiring:2026-12-18')
    w.customer.kycStatus = 'unverified'
    expect(dueReminders(w, NOW + DAY)).toHaveLength(0)
  })
})

describe('groupByDay', () => {
  it('groups by Hanoi calendar day, newest first', () => {
    const n = (id: string, iso: string) => ({ id, kind: 'security' as const, title: '', body: '', createdAt: iso, read: false })
    const g = groupByDay([
      n('old', '2026-11-15T05:00:00Z'),
      n('y', '2026-11-16T16:59:00Z'), // 23:59 on 16/11 in Hanoi
      n('t', '2026-11-16T17:00:00Z'), // 00:00 on 17/11 in Hanoi
    ], NOW)
    expect(g.map((x) => [x.label, x.items.map((i) => i.id)])).toEqual([['Hôm nay', ['t']], ['Hôm qua', ['y']], ['15/11/2026', ['old']]])
  })
})
