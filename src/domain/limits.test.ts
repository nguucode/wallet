import { limitUsage, checkLimit } from './limits'

const now = new Date('2026-11-17T10:00:00+07:00')
const tx = (over: object) => ({ type: 'p2p_out', status: 'success', amount: 1_000_000, essential: false, createdAt: '2026-11-10T09:00:00+07:00', ...over }) as never

describe('limitUsage', () => {
  it('counts outgoing transfers and payments this month, not top-ups, withdrawals, incoming or failed', () => {
    const u = limitUsage([
      tx({}),
      tx({ type: 'bank_transfer', status: 'pending', amount: 2_000_000 }),
      tx({ type: 'qr_merchant', status: 'refunded', amount: 500_000 }),
      tx({ type: 'topup', amount: 9_000_000 }),
      tx({ type: 'withdraw', amount: 9_000_000 }),
      tx({ type: 'p2p_in', amount: 9_000_000 }),
      tx({ status: 'failed', amount: 9_000_000 }),
      tx({ createdAt: '2026-10-31T23:59:00+07:00', amount: 9_000_000 }),
    ], now)
    expect(u.general).toBe(3_500_000)
    expect(u.essential).toBe(0)
  })

  it('puts essential bills in their own pool', () => {
    const u = limitUsage([tx({ type: 'bill', essential: true, amount: 800_000 }), tx({ type: 'bill', essential: false, amount: 200_000 })], now)
    expect(u).toMatchObject({ general: 200_000, essential: 800_000 })
  })

  it('uses Vietnam time for the month boundary', () => {
    // 2026-11-01 00:30 in Vietnam is still October in UTC
    expect(limitUsage([tx({ createdAt: '2026-10-31T17:30:00Z' })], now).general).toBe(1_000_000)
  })
})

describe('checkLimit', () => {
  const usage = { general: 97_500_000, essential: 0 }
  it('rejects an amount over the remaining general limit and reports what is left', () => {
    expect(checkLimit(usage, 'p2p_out', 3_000_000, false)).toEqual({ ok: false, pool: 'general', remaining: 2_500_000 })
    expect(checkLimit(usage, 'p2p_out', 2_500_000, false)).toEqual({ ok: true })
  })
  it('never limits top-ups and withdrawals', () => {
    expect(checkLimit(usage, 'topup', 50_000_000, false)).toEqual({ ok: true })
  })
  it('checks essential bills against the essential pool', () => {
    expect(checkLimit(usage, 'bill', 5_000_000, true)).toEqual({ ok: true })
  })
})
