import { executeMoney, getState, pendingOut, resolvePending, setScenario, setSetting, refundLatestMerchant, gateOf, verifyPin } from './store'

const contact = () => {
  const c = getState().world.contacts[5]
  return { kind: 'contact' as const, id: c.id, name: c.name, phone: c.phone }
}
const bank = { kind: 'bank' as const, bankId: 'bidv', account: '21510001234567', holder: 'TRAN VAN HAI' }

beforeEach(() => {
  setScenario('ready')
  setSetting('latency', 'none')
})

describe('money actions', () => {
  it('a successful wallet transfer debits the balance and creates a notification', async () => {
    const before = getState().world.balance
    const t = await executeMoney({ type: 'p2p_out', amount: 200_000, counterparty: contact(), authMethod: 'pin' })
    expect(t.status).toBe('success')
    expect(getState().world.balance).toBe(before - 200_000)
    expect(getState().world.notifications[0].link).toBe(`/history/${t.id}`)
  })

  it('a pending bank transfer is held in pendingOut and refunded in full if it later fails', async () => {
    setSetting('nextOutcome', 'pending')
    const before = getState().world.balance
    const held = pendingOut(getState().world)
    const t = await executeMoney({ type: 'bank_transfer', amount: 1_000_000, counterparty: bank, authMethod: 'pin' })
    expect(t.status).toBe('pending')
    expect(pendingOut(getState().world)).toBe(held + 1_000_000 + t.fee)
    resolvePending('failed')
    expect(getState().world.transactions.find((x) => x.id === t.id)?.status).toBe('failed')
    expect(getState().world.balance).toBe(before + held) // seed pending items are refunded too
  })

  it('a failed transfer never changes the balance', async () => {
    setSetting('nextOutcome', 'failed')
    const before = getState().world.balance
    const t = await executeMoney({ type: 'bank_transfer', amount: 500_000, counterparty: bank, authMethod: 'pin' })
    expect(t).toMatchObject({ status: 'failed', fee: 0 })
    expect(getState().world.balance).toBe(before)
  })

  it('instant types ignore a "pending" next outcome', async () => {
    setSetting('nextOutcome', 'pending')
    const t = await executeMoney({ type: 'p2p_out', amount: 10_000, counterparty: contact(), authMethod: 'pin' })
    expect(t.status).toBe('success')
  })

  it('a merchant refund links both rows and returns the money', () => {
    const before = getState().world.balance
    expect(refundLatestMerchant()).toBe(true)
    const [r] = getState().world.transactions
    const orig = getState().world.transactions.find((x) => x.id === r.refundOf)!
    expect(orig).toMatchObject({ status: 'refunded', refundedBy: r.id })
    expect(getState().world.balance).toBe(before + orig.amount)
  })
})

describe('scenarios and security', () => {
  it('maps scenarios to gates', () => {
    setScenario('no-source')
    expect(gateOf(getState().world)).toBe('no_source')
    setScenario('suspended')
    expect(gateOf(getState().world)).toBe('suspended')
  })
  it('locks PIN entry after the configured number of wrong attempts', () => {
    for (let i = 0; i < 4; i++) expect(verifyPin('000000')).toMatchObject({ ok: false })
    const last = verifyPin('000000')
    expect(last).toMatchObject({ ok: false, attemptsLeft: 0 })
    expect(verifyPin('123456')).toMatchObject({ ok: false })
  })
})
