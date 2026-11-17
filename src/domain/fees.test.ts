import { fee } from './fees'

describe('fee', () => {
  it('is free for top-ups, wallet transfers, merchant payments and bills', () => {
    for (const type of ['topup', 'p2p_out', 'qr_merchant', 'bill'] as const) expect(fee(type, 5_000_000, 99)).toEqual({ amount: 0, freeLeft: null })
  })
  it('gives 5 free withdrawals or bank transfers a month, shared', () => {
    expect(fee('withdraw', 5_000_000, 0)).toEqual({ amount: 0, freeLeft: 4 })
    expect(fee('bank_transfer', 5_000_000, 4)).toEqual({ amount: 0, freeLeft: 0 })
  })
  it('then charges 0.5% rounded to 1.000 ₫ with a 1.000 ₫ minimum', () => {
    expect(fee('withdraw', 5_000_000, 5)).toEqual({ amount: 25_000, freeLeft: 0 })
    expect(fee('withdraw', 50_000, 5)).toEqual({ amount: 1_000, freeLeft: 0 })
    expect(fee('bank_transfer', 1_234_567, 6)).toEqual({ amount: 6_000, freeLeft: 0 })
  })
})
