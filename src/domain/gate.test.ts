import { activeGate } from './gate'

const base = { kycStatus: 'verified', walletStatus: 'active', linkedSources: 1 } as const

describe('activeGate (rules.md#gates, first match wins)', () => {
  it('is null for a verified, active wallet with a linked bank', () => {
    expect(activeGate(base)).toBeNull()
  })
  it('blocks unverified and verifying wallets first', () => {
    expect(activeGate({ ...base, kycStatus: 'unverified', linkedSources: 0 })).toBe('kyc')
    expect(activeGate({ ...base, kycStatus: 'verifying' })).toBe('kyc_review')
  })
  it('then suspended, locked, and no linked source, in that order', () => {
    expect(activeGate({ ...base, walletStatus: 'suspended', linkedSources: 0 })).toBe('suspended')
    expect(activeGate({ ...base, walletStatus: 'locked', linkedSources: 0 })).toBe('locked')
    expect(activeGate({ ...base, linkedSources: 0 })).toBe('no_source')
  })
  it('does not gate an expiring ID', () => {
    expect(activeGate({ ...base, kycStatus: 'id_expiring' })).toBeNull()
  })
})
