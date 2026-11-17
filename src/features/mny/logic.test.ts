import { canUnlink, groupDigits, isOwnAccount, maxWithdrawable, sortSources } from './logic'
import type { FundingSource } from '@/mock/seed'

const src = (id: string, isDefault = false): FundingSource => ({ id, bankId: 'vcb', kind: 'account', last4: '0000', isDefault })

describe('isOwnAccount', () => {
  it('ignores case, diacritics, đ and extra spaces', () => {
    expect(isOwnAccount('TRAN  MINH ANH ', 'Trần Minh Anh')).toBe(true)
    expect(isOwnAccount('DO DUC', 'Đỗ Đức')).toBe(true)
    expect(isOwnAccount('NGUYỄN VĂN BÌNH', 'Trần Minh Anh')).toBe(false)
  })
})

describe('sources', () => {
  it('canUnlink is false for the last source', () => {
    expect(canUnlink([src('a', true)])).toBe(false)
    expect(canUnlink([src('a', true), src('b')])).toBe(true)
  })
  it('sorts the default first and keeps link order otherwise', () => {
    expect(sortSources([src('a'), src('b', true), src('c')]).map((s) => s.id)).toEqual(['b', 'a', 'c'])
  })
  it('groups digits in fours', () => expect(groupDigits('9704361234567890123')).toBe('9704 3612 3456 7890 123'))
})

describe('maxWithdrawable', () => {
  it('is the whole balance while a free slot remains', () => expect(maxWithdrawable(3_250_000, 2)).toBe(3_250_000))
  it('leaves room for the fee once free slots are used', () => {
    const max = maxWithdrawable(3_250_000, 5)
    expect(max).toBe(3_234_000)
  })
  it('respects the minimum fee', () => expect(maxWithdrawable(50_000, 5)).toBe(49_000))
})
