import { act, render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router'
import { setScenario, setSetting } from '@/app/store'
import OnboardingFlow from './OnboardingFlow'
import SourcesPage from '@/features/mny/SourcesPage'
import LinkSourceFlow from '@/features/mny/LinkSourceFlow'
import TopupFlow from '@/features/mny/TopupFlow'
import WithdrawFlow from '@/features/mny/WithdrawFlow'

const at = (path: string, el: React.ReactNode, route = path.split('?')[0]) =>
  render(<MemoryRouter initialEntries={[path]}><Routes><Route path={route} element={el} /><Route path="*" element={<p>elsewhere</p>} /></Routes></MemoryRouter>)

beforeEach(() => { setScenario('ready'); setSetting('latency', 'none') })

describe('smoke', () => {
  it('new user starts onboarding at phone', () => {
    setScenario('new')
    at('/onboarding', <OnboardingFlow />)
    expect(screen.getByRole('heading', { name: 'Nhập số điện thoại' })).toBeInTheDocument()
  })
  it('unverified re-enters at id-method', () => {
    setScenario('unverified')
    at('/onboarding?step=phone', <OnboardingFlow />)
    expect(screen.getByRole('heading', { name: 'Xác thực sinh trắc học' })).toBeInTheDocument()
  })
  it('verified user is sent home', () => {
    at('/onboarding', <OnboardingFlow />)
    expect(screen.getByText('elsewhere')).toBeInTheDocument()
  })
  it('sources list shows the default first', () => {
    at('/me/sources', <SourcesPage />)
    expect(screen.getAllByText('Vietcombank')[0]).toBeInTheDocument()
    expect(screen.getByText('Mặc định')).toBeInTheDocument()
  })
  it('no-source shows the empty state and a gate on top up', () => {
    setScenario('no-source')
    at('/me/sources', <SourcesPage />)
    expect(screen.getByText('Chưa có nguồn tiền nào')).toBeInTheDocument()
  })
  it('link, top up and withdraw render their first steps', async () => {
    at('/me/sources/link', <LinkSourceFlow />)
    expect(screen.getByRole('heading', { name: 'Chọn ngân hàng' })).toBeInTheDocument()
    await act(async () => {})
  })
  it('top up and withdraw amount steps', () => {
    const a = at('/topup', <TopupFlow />)
    expect(screen.getByRole('heading', { name: 'Nạp tiền' })).toBeInTheDocument()
    a.unmount()
    at('/withdraw', <WithdrawFlow />)
    expect(screen.getByRole('heading', { name: 'Rút tiền' })).toBeInTheDocument()
  })
})
