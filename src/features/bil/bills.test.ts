import type { SavedBill } from '@/mock/seed'
import { billsDueSoon, billStatusOn, canPayBill, isValidCustomerCode, overdueDays, sortBills } from './bills'

const NOW = Date.parse('2026-11-17T05:00:00Z')
const bill = (p: Partial<SavedBill>): SavedBill => ({
  id: 'b', billerId: 'evn-hh', customerCode: 'HH01234567890', holder: 'A', address: '', period: '2026-11', amount: 500_000, dueDate: '2026-11-20', status: 'due', ...p,
})

describe('bills', () => {
  it('due turns overdue after the due date (VN calendar days)', () => {
    const b = bill({ dueDate: '2026-11-15' })
    expect(billStatusOn(b, NOW)).toBe('overdue')
    expect(overdueDays(b, NOW)).toBe(2)
    expect(billStatusOn(bill({ dueDate: '2026-11-17' }), NOW)).toBe('due')
  })
  it('sorts overdue, due by date, settling, paid', () => {
    const list = [bill({ id: 'paid', status: 'paid' }), bill({ id: 'late', dueDate: '2026-11-25' }), bill({ id: 'set', status: 'settling' }), bill({ id: 'soon' }), bill({ id: 'over', dueDate: '2026-11-10' })]
    expect(sortBills(list, NOW).map((b) => b.id)).toEqual(['over', 'soon', 'late', 'set', 'paid'])
  })
  it('billsDueSoon returns payable bills within the window, soonest first', () => {
    const list = [bill({ id: 'in3', dueDate: '2026-11-20' }), bill({ id: 'in4', dueDate: '2026-11-21' }), bill({ id: 'over', dueDate: '2026-11-01' }), bill({ id: 'paid', status: 'paid', dueDate: '2026-11-18' })]
    expect(billsDueSoon(list, NOW).map((b) => b.id)).toEqual(['over', 'in3'])
    expect(billsDueSoon(list, NOW, 7).map((b) => b.id)).toEqual(['over', 'in3', 'in4'])
    expect(billsDueSoon([], NOW)).toEqual([])
  })
  it('customer code is 2 letters + 11 digits', () => {
    expect(isValidCustomerCode('HH01234567890')).toBe(true)
    expect(isValidCustomerCode('HH0123456789')).toBe(false)
    expect(isValidCustomerCode('1101234567890')).toBe(false)
  })
  it('canPayBill checks payable, balance, then the essential limit', () => {
    const u = { general: 0, essential: 0 }
    expect(canPayBill(bill({}), NOW, 1_000_000, u, true)).toEqual({ ok: true })
    expect(canPayBill(bill({ status: 'paid' }), NOW, 1_000_000, u, true)).toEqual({ ok: false, reason: 'not_payable' })
    expect(canPayBill(bill({}), NOW, 255_000, u, true)).toEqual({ ok: false, reason: 'insufficient_balance', short: 245_000 })
    expect(canPayBill(bill({}), NOW, 1_000_000, { general: 100_000_000, essential: 299_800_000 }, true)).toEqual({ ok: false, reason: 'essential_limit', remaining: 200_000 })
    // essential bills never touch the general pool
    expect(canPayBill(bill({}), NOW, 1_000_000, { general: 100_000_000, essential: 0 }, true)).toEqual({ ok: true })
  })
})
