import type { PinResult } from '@/app/store'
import { CHANGE_PIN_START, changePinStep } from './changePin'
import { nextReset } from './limitsView'

describe('changePinStep', () => {
  const verify = (p: string): PinResult => (p === '123456' ? { ok: true } : { ok: false, attemptsLeft: 4 })

  it('wrong current PIN shows attempts left and stays', () => {
    const s = changePinStep(CHANGE_PIN_START, '000000', verify)
    expect(s.step).toBe('current')
    expect(s.error).toBe('Mã PIN không đúng. Còn 4 lần thử.')
  })

  it('rejects the same PIN and a mismatched confirmation, then completes', () => {
    let s = changePinStep(CHANGE_PIN_START, '123456', verify)
    expect(s.step).toBe('new')
    s = changePinStep(s, '123456', verify)
    expect([s.step, s.error]).toEqual(['new', 'Mã PIN mới phải khác mã PIN hiện tại.'])
    s = changePinStep(s, '654321', verify)
    expect(s.step).toBe('confirm')
    s = changePinStep(s, '111111', verify)
    expect([s.step, s.error]).toEqual(['new', 'Mã PIN nhập lại không khớp.'])
    s = changePinStep(changePinStep(s, '654321', verify), '654321', verify)
    expect([s.step, s.next]).toEqual(['done', '654321'])
  })

  it('a lock at the current step sets lockedUntil', () => {
    const s = changePinStep(CHANGE_PIN_START, '000000', () => ({ ok: false, attemptsLeft: 0, lockedUntil: '2026-11-17T07:35:00Z' }))
    expect(s.lockedUntil).toBeDefined()
  })
})

describe('nextReset', () => {
  it('is the 1st of next month in Hanoi, across the year end', () => {
    expect(nextReset(new Date('2026-11-17T03:00:00Z'))).toBe('01/12/2026')
    expect(nextReset(new Date('2026-12-31T16:59:00Z'))).toBe('01/01/2027') // 23:59 on 31/12 in Hanoi
    expect(nextReset(new Date('2026-12-31T17:00:00Z'))).toBe('01/02/2027') // already January in Hanoi
  })
})
