import type { Transaction } from '@/mock/seed'
import { filterContacts, isValidAccountNumber, recentRecipients, resolvePhone } from './logic'

let n = 0
const tx = (p: Partial<Transaction>): Transaction => ({
  id: 'WL' + ++n, type: 'p2p_out', status: 'success', amount: 1000, fee: 0, direction: 'out',
  counterparty: { kind: 'contact', id: 'c1', name: 'An', phone: '0911111111' },
  createdAt: `2026-11-${String(10 + n).padStart(2, '0')}T00:00:00Z`, updatedAt: '', ...p,
})

describe('recentRecipients', () => {
  it('dedupes, ignores failed and other types, keeps newest first', () => {
    const txs = [
      tx({}),
      tx({ counterparty: { kind: 'bank', bankId: 'acb', account: '19034567', holder: 'LE THI THU HA' } }),
      tx({ status: 'failed', counterparty: { kind: 'contact', id: 'c9', name: 'Failed', phone: '0999999999' } }),
      tx({ type: 'qr_merchant', counterparty: { kind: 'merchant', id: 'm1', name: 'Shop' } }),
      tx({ status: 'pending', type: 'bank_transfer', counterparty: { kind: 'bank', bankId: 'bidv', account: '215100', holder: 'TRAN VAN HAI' } }),
      tx({}),
    ]
    const r = recentRecipients(txs, 8)
    expect(r.map((x) => x.key)).toEqual(['w0911111111', 'bbidv215100', 'bacb19034567'])
  })
  it('respects the limit', () => {
    const txs = Array.from({ length: 12 }, (_, i) => tx({ counterparty: { kind: 'contact', id: 'c' + i, name: 'X', phone: '09000000' + String(i).padStart(2, '0') } }))
    expect(recentRecipients(txs, 8)).toHaveLength(8)
  })
})

describe('filterContacts', () => {
  const cs = [{ name: 'Nguyễn Phương Thảo', phone: '0901234567' }, { name: 'Đặng Quốc Bảo', phone: '0987654321' }]
  it('matches names without diacritics or case', () => {
    expect(filterContacts(cs, 'thao')).toEqual([cs[0]])
    expect(filterContacts(cs, 'dang')).toEqual([cs[1]])
  })
  it('matches digits on the phone, ignoring spaces', () => {
    expect(filterContacts(cs, '0987 654')).toEqual([cs[1]])
  })
  it('returns all for an empty query', () => expect(filterContacts(cs, '  ')).toEqual(cs))
})

describe('resolvePhone', () => {
  const w = {
    customer: { phone: '0901234567' } as never,
    contacts: [{ id: 'c1', name: 'An', phone: '0911111111', hasWallet: true }, { id: 'c2', name: 'Bình', phone: '0922222222', hasWallet: false }],
  }
  it('refuses my own number', () => expect(resolvePhone(w, '0901234567')).toEqual({ status: 'self' }))
  it('uses contacts first', () => {
    expect(resolvePhone(w, '0911111111')).toMatchObject({ status: 'wallet', contact: { id: 'c1' } })
    expect(resolvePhone(w, '0922222222')).toEqual({ status: 'no_wallet' })
  })
  it('applies the demo directory for strangers', () => {
    expect(resolvePhone(w, '0933330000')).toEqual({ status: 'error' })
    expect(resolvePhone(w, '0933333332')).toMatchObject({ status: 'wallet', contact: { id: 'p0933333332' } })
    expect(resolvePhone(w, '0933333331')).toEqual({ status: 'no_wallet' })
  })
})

describe('isValidAccountNumber', () => {
  it('accepts 6–19 digits only', () => {
    expect(isValidAccountNumber('123456')).toBe(true)
    expect(isValidAccountNumber('1'.repeat(19))).toBe(true)
    expect(isValidAccountNumber('12345')).toBe(false)
    expect(isValidAccountNumber('1'.repeat(20))).toBe(false)
    expect(isValidAccountNumber('12a456')).toBe(false)
  })
})
