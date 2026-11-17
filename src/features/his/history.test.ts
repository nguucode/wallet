import type { Transaction } from '@/mock/seed'
import { filterTransactions, groupByDay, groupByMonth, isWithinSupportWindow, monthTotals, reasonsFor, validateDescription } from './history'

const NOW = Date.parse('2026-11-17T05:00:00Z') // 12:00 in Hà Nội
const tx = (p: Partial<Transaction>): Transaction => ({
  id: 'WL' + Math.random(), type: 'p2p_out', status: 'success', amount: 100_000, fee: 0, direction: 'out',
  counterparty: { kind: 'merchant', id: 'm1', name: 'Shop' }, createdAt: '2026-11-17T01:00:00Z', updatedAt: '2026-11-17T01:00:00Z', ...p,
})

describe('history filtering', () => {
  const txs = [
    tx({ id: 'a', direction: 'in', type: 'p2p_in' }),
    tx({ id: 'b', status: 'pending', type: 'bank_transfer' }),
    tx({ id: 'c', status: 'failed', type: 'bank_transfer', createdAt: '2026-10-31T18:00:00Z' }), // 01/11 01:00 VN
    tx({ id: 'd', createdAt: '2026-10-31T16:00:00Z' }), // 31/10 23:00 VN
  ]
  it('"Tất cả" keeps pending and failed', () => {
    expect(filterTransactions(txs, { tab: 'all' }).map((t) => t.id)).toEqual(['a', 'b', 'c', 'd'])
  })
  it('"Tiền ra" includes pending and failed out rows', () => {
    expect(filterTransactions(txs, { tab: 'out' }).map((t) => t.id)).toEqual(['b', 'c', 'd'])
  })
  it('month filter uses Asia/Ho_Chi_Minh', () => {
    expect(filterTransactions(txs, { month: '2026-11' }).map((t) => t.id)).toEqual(['a', 'b', 'c'])
    expect(filterTransactions(txs, { month: '2026-10' }).map((t) => t.id)).toEqual(['d'])
  })
  it('combines tab, type and status', () => {
    expect(filterTransactions(txs, { tab: 'failed', type: 'bank_transfer' }).map((t) => t.id)).toEqual(['c'])
    expect(filterTransactions(txs, { tab: 'in', status: 'failed' })).toEqual([])
  })
  it('groups by VN month and day with Hôm nay / Hôm qua labels', () => {
    expect(groupByMonth(txs).map((g) => [g.label, g.rows.length])).toEqual([['Tháng 11/2026', 3], ['Tháng 10/2026', 1]])
    const days = groupByDay([tx({ createdAt: '2026-11-17T01:00:00Z' }), tx({ createdAt: '2026-11-16T01:00:00Z' }), tx({ createdAt: '2026-11-15T01:00:00Z' })], NOW)
    expect(days.map((g) => g.label)).toEqual(['Hôm nay', 'Hôm qua', '15/11/2026'])
  })
  it('month totals count success and pending only, out includes fee', () => {
    expect(monthTotals([tx({ direction: 'in', amount: 500 }), tx({ amount: 200, fee: 10, status: 'pending' }), tx({ amount: 999, status: 'failed' })])).toEqual({ in: 500, out: 210 })
  })
})

describe('support', () => {
  it('60-day window is inclusive of day 60', () => {
    expect(isWithinSupportWindow(tx({ createdAt: new Date(NOW - 60 * 86_400_000).toISOString() }), NOW, 60)).toBe(true)
    expect(isWithinSupportWindow(tx({ createdAt: new Date(NOW - 61 * 86_400_000).toISOString() }), NOW, 60)).toBe(false)
  })
  it('reasons fit the transaction', () => {
    expect(reasonsFor(tx({ type: 'p2p_out' }))).toEqual(['wrong_recipient', 'not_received', 'charged_twice', 'other'])
    expect(reasonsFor(tx({ type: 'qr_merchant', status: 'failed' }))).toEqual(['charged_twice', 'failed_but_debited', 'other'])
    expect(reasonsFor()).toHaveLength(5)
  })
  it('description must be 20–500 characters', () => {
    expect(validateDescription('ngắn quá')).not.toBeNull()
    expect(validateDescription('Tôi chuyển nhầm số điện thoại')).toBeNull()
    expect(validateDescription('a'.repeat(501))).not.toBeNull()
  })
})
