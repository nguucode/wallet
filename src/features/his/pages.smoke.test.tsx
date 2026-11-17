import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router'
import { getState, setScenario, setSetting } from '@/app/store'
import HistoryPage from './HistoryPage'
import TransactionPage from './TransactionPage'
import SupportNewFlow from './SupportNewFlow'
import SupportPage from './SupportPage'
import BillsPage from '@/features/bil/BillsPage'
import AddBillFlow from '@/features/bil/AddBillFlow'
import PayBillFlow from '@/features/bil/PayBillFlow'

const at = (path: string) => render(
  <MemoryRouter initialEntries={[path]}>
    <Routes>
      <Route path="/history" element={<HistoryPage />} />
      <Route path="/history/:txId" element={<TransactionPage />} />
      <Route path="/support" element={<SupportPage />} />
      <Route path="/support/new" element={<SupportNewFlow />} />
      <Route path="/bills" element={<BillsPage />} />
      <Route path="/bills/new" element={<AddBillFlow />} />
      <Route path="/bills/:billId" element={<PayBillFlow />} />
    </Routes>
  </MemoryRouter>,
)

beforeEach(() => { setScenario('ready'); setSetting('latency', 'none') })

describe('HIS/BIL pages render on seed data', () => {
  it('history shows 50 rows first and keeps pending/failed', () => {
    at('/history')
    expect(screen.getByRole('button', { name: 'Xem thêm' })).toBeInTheDocument()
    expect(screen.getAllByText('Đang xử lý').length).toBeGreaterThan(0)
  })
  it('failed transaction detail and receipt redirect', () => {
    const failed = getState().world.transactions.find((t) => t.status === 'failed')!
    at(`/history/${failed.id}?view=receipt`)
    expect(screen.queryByText('Biên lai giao dịch')).toBeNull()
    expect(screen.getAllByText('Không thành công').length).toBeGreaterThan(0)
  })
  it('refunded receipt and p2p_out wrong-recipient panel', () => {
    const w = getState().world
    at(`/history/${w.transactions.find((t) => t.status === 'refunded')!.id}?view=receipt`)
    expect(screen.getByText('Biên lai giao dịch')).toBeInTheDocument()
  })
  it('wrong recipient panel on a successful p2p_out', () => {
    at(`/history/${getState().world.transactions.find((t) => t.type === 'p2p_out' && t.status === 'success')!.id}`)
    expect(screen.getByText('Chuyển nhầm người nhận?')).toBeInTheDocument()
  })
  it('support form is disabled outside the window', () => {
    const old = getState().world.transactions.find((t) => Date.now() - Date.parse(t.createdAt) > 61 * 86_400_000)!
    at(`/support/new?tx=${old.id}`)
    expect(screen.getByText(/không thể gửi yêu cầu hỗ trợ trực tuyến/)).toBeInTheDocument()
  })
  it('help', () => { at('/support'); expect(screen.getByText('Câu hỏi thường gặp')).toBeInTheDocument() })
  it('bills summary', () => { at('/bills'); expect(screen.getByText(/hóa đơn cần thanh toán/)).toBeInTheDocument() })
  it('add bill lists billers', () => { at('/bills/new'); expect(screen.getByText('Điện lực Tây Hồ Xanh')).toBeInTheDocument() })
  it('pay bill view', () => { at('/bills/b1'); expect(screen.getByRole('button', { name: 'Thanh toán' })).toBeEnabled() })
})
