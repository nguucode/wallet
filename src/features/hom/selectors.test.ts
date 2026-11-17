import type { SavedBill, Transaction } from '@/mock/seed'
import { selectBillsDue, selectRecentRecipients, shortName, vndWords } from './selectors'

const NOW = Date.parse('2026-11-17T03:00:00Z')

describe('vndWords', () => {
  it.each([
    [0, 'không đồng'],
    [15, 'mười lăm đồng'],
    [21, 'hai mươi mốt đồng'],
    [105, 'một trăm linh năm đồng'],
    [1_250_000, 'một triệu hai trăm năm mươi nghìn đồng'],
    [1_050_000, 'một triệu không trăm năm mươi nghìn đồng'],
    [128_450_000, 'một trăm hai mươi tám triệu bốn trăm năm mươi nghìn đồng'],
    [2_000_000_000, 'hai tỷ đồng'],
  ])('%i → %s', (n, s) => expect(vndWords(n)).toBe(s))
})

describe('selectBillsDue', () => {
  const bill = (id: string, dueDate: string, status: SavedBill['status'] = 'due'): SavedBill =>
    ({ id, billerId: 'evn-hh', customerCode: 'X', holder: '', address: '', period: '2026-11', amount: 1, dueDate, status })
  it('keeps 7-day due and overdue, overdue first, excludes paid/settling', () => {
    const r = selectBillsDue([
      bill('later', '2026-11-25'), bill('soon', '2026-11-24'), bill('next', '2026-11-19'),
      bill('od', '2026-11-15', 'overdue'), bill('paid', '2026-11-18', 'paid'), bill('settling', '2026-11-18', 'settling'),
    ], NOW)
    expect(r.map((x) => x.bill.id)).toEqual(['od', 'next', 'soon'])
    expect(r[0].days).toBe(-2)
  })
})

describe('selectRecentRecipients', () => {
  const tx = (id: string, at: string, counterparty: Transaction['counterparty'], type: Transaction['type']): Transaction =>
    ({ id, type, status: 'success', amount: 1, fee: 0, direction: 'out', counterparty, createdAt: at, updatedAt: at })
  it('dedupes by contact or bank+account, newest first, capped', () => {
    const c = { kind: 'contact' as const, id: 'c1', name: 'Lê Thu Hà', phone: '0900' }
    const b = { kind: 'bank' as const, bankId: 'bidv', account: '123', holder: 'TRAN VAN HAI' }
    const r = selectRecentRecipients([
      tx('1', '2026-11-10', c, 'p2p_out'), tx('2', '2026-11-12', b, 'bank_transfer'), tx('3', '2026-11-11', c, 'p2p_out'),
      tx('4', '2026-11-13', { kind: 'merchant', id: 'm', name: 'Shop' }, 'qr_merchant'),
    ])
    expect(r.map((x) => x.key)).toEqual(['b:bidv:123', 'c:c1'])
    expect(selectRecentRecipients([tx('1', '2026-11-10', c, 'p2p_out'), tx('2', '2026-11-12', b, 'bank_transfer')], 1)).toHaveLength(1)
  })
  it('short name is the last word, title-cased from bank caps', () => {
    expect(shortName('Nguyễn Hoàng Phương Thảo Nguyệt Quỳnh Như')).toBe('Như')
    expect(shortName('TRAN VAN HAI')).toBe('Hai')
  })
})

describe('balanceSeries', () => {
  it('walks the balance back through each day, skipping failed transactions', async () => {
    const { balanceSeries } = await import('./selectors')
    const now = Date.parse('2026-11-17T10:00:00Z')
    const tx = (h: number, direction: 'in' | 'out', amount: number, status = 'success') => ({ createdAt: new Date(now - h * 3600_000).toISOString(), direction, amount, fee: 0, status }) as never
    const s = balanceSeries({ balance: 1_000_000, transactions: [tx(2, 'out', 200_000), tx(30, 'in', 500_000), tx(31, 'out', 9_000_000, 'failed')] }, now, 3)
    expect(s).toEqual([700_000, 1_200_000, 1_000_000])
  })
})
