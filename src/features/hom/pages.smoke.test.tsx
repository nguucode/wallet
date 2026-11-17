import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { getState, setScenario, setSetting } from '@/app/store'
import HomePage from './HomePage'
import MeHub from './MeHub'
import NotificationsPage from '@/features/ntf/NotificationsPage'
import LimitsPage from '@/features/sec/LimitsPage'
import ProfilePage from '@/features/sec/ProfilePage'
import SecurityPage from '@/features/sec/SecurityPage'

const pages = { HomePage, MeHub, NotificationsPage, LimitsPage, ProfilePage, SecurityPage }

describe.each(['ready', 'unverified', 'no-source', 'suspended', 'id-expiring'] as const)('scenario %s', (scenario) => {
  beforeEach(() => { setScenario(scenario); setSetting('latency', 'none') })
  it.each(Object.entries(pages))('%s renders its h1 and loads', async (_, Page) => {
    render(<MemoryRouter><Page /></MemoryRouter>)
    expect(document.querySelector('[data-page-title]')).not.toBeNull()
    await new Promise((r) => setTimeout(r, 10))
  })
})

it('Home shows the balance and the reminder hook does not duplicate the seed bill reminder', async () => {
  setScenario('ready'); setSetting('latency', 'none')
  const before = getState().world.notifications.length
  render(<MemoryRouter><HomePage /></MemoryRouter>)
  expect(await screen.findByText('Số dư khả dụng')).toBeTruthy()
  expect(await screen.findByText(/Đang xử lý:/)).toBeTruthy()
  expect(getState().world.notifications.length).toBe(before)
})
