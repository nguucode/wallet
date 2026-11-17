import { requiredAuth, nextDayCounter } from './auth'

// Cases from spec/ia/rules.md#step-up
describe('requiredAuth', () => {
  it.each([
    ['p2p_out', 10_000_000, 0, 'pin'],
    ['p2p_out', 10_000_001, 0, 'face_match'],
    ['bank_transfer', 5_000_000, 15_000_000, 'pin'],
    ['bank_transfer', 5_000_000, 15_000_001, 'face_match'],
    ['topup', 9_000_000, 12_000_000, 'face_match'],
    ['withdraw', 2_000_000, 0, 'pin'],
    ['qr_merchant', 100_000_000, 50_000_000, 'pin'],
    ['qr_merchant', 100_000_001, 0, 'face_match'],
    ['bill', 1_200_000, 19_900_000, 'pin'],
  ] as const)('%s %d with day counter %d → %s', (type, amount, day, expected) => {
    expect(requiredAuth({ type, amount, dayCounter: day })).toBe(expected)
  })

  it('offers device biometric in place of PIN only when enabled on the app layout', () => {
    expect(requiredAuth({ type: 'p2p_out', amount: 50_000, dayCounter: 0, deviceBiometric: true, layout: 'app' })).toBe('device_biometric')
    expect(requiredAuth({ type: 'p2p_out', amount: 50_000, dayCounter: 0, deviceBiometric: true, layout: 'web' })).toBe('pin')
    expect(requiredAuth({ type: 'p2p_out', amount: 20_000_000, dayCounter: 0, deviceBiometric: true, layout: 'app' })).toBe('face_match')
  })
})

describe('nextDayCounter', () => {
  it('adds PIN-approved counted transfers and resets after a face match', () => {
    expect(nextDayCounter(3_000_000, { type: 'p2p_out', amount: 2_000_000, method: 'pin' })).toBe(5_000_000)
    expect(nextDayCounter(3_000_000, { type: 'bill', amount: 2_000_000, method: 'pin' })).toBe(3_000_000)
    expect(nextDayCounter(18_000_000, { type: 'bank_transfer', amount: 15_000_000, method: 'face_match' })).toBe(0)
  })
})
