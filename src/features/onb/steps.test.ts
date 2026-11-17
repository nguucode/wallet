import { backTarget, canContinue, checkOtp, firstStep, isValidVnMobile, maskIdNumber, retryStepFor, stageOf } from './steps'

describe('firstStep', () => {
  it('new user starts at phone, then id-method once the PIN exists', () => {
    expect(firstStep({ signedIn: false, kycStatus: 'unverified', marks: {} })).toBe('phone')
    expect(firstStep({ signedIn: false, kycStatus: 'unverified', marks: { pinSetAt: 'x' } })).toBe('id-method')
  })
  it('unverified wallet re-enters at id-method', () => expect(firstStep({ signedIn: true, kycStatus: 'unverified', marks: {} })).toBe('id-method'))
  it('verified mid-flow resumes at the warning; finished goes home', () => {
    expect(firstStep({ signedIn: false, kycStatus: 'verified', marks: {} })).toBe('warning')
    expect(firstStep({ signedIn: true, kycStatus: 'verifying', marks: { verifiedAt: 'x' } })).toBe('warning')
    expect(firstStep({ signedIn: true, kycStatus: 'verified', marks: { verifiedAt: 'x', termsAt: 'y' } })).toBe('home')
    expect(firstStep({ signedIn: true, kycStatus: 'verified', marks: {} })).toBe('home')
  })
})

describe('backTarget and stages', () => {
  it('no back after identity is submitted or at legal checkpoints', () => {
    for (const s of ['face', 'verifying', 'warning', 'ready', 'phone'] as const) expect(backTarget(s, 'phone')).toBeNull()
    expect(backTarget('terms', 'phone')).toBe('warning')
  })
  it('id-method goes back to pin only when the flow started at phone', () => {
    expect(backTarget('id-method', 'phone')).toBe('pin')
    expect(backTarget('id-method', 'id-method')).toBeNull()
  })
  it('maps steps to the three stages', () => {
    expect([stageOf('otp'), stageOf('vneid'), stageOf('verifying'), stageOf('warning')]).toEqual([0, 1, 1, 2])
  })
})

describe('retryStepFor', () => {
  it('nfc path', () => {
    expect(retryStepFor('blurry_id', 'nfc')).toBe('id-capture')
    expect(retryStepFor('chip_unreadable', 'nfc')).toBe('nfc')
    expect(retryStepFor('face_mismatch', 'nfc')).toBe('face')
    expect(retryStepFor('weak_network', 'nfc')).toBe('verifying')
  })
  it('vneid path sends chip and photo reasons to id-method', () => {
    expect(retryStepFor('blurry_id', 'vneid')).toBe('id-method')
    expect(retryStepFor('chip_unreadable', 'vneid')).toBe('id-method')
    expect(retryStepFor('face_mismatch', 'vneid')).toBe('face')
    expect(retryStepFor('weak_network', 'vneid')).toBe('verifying')
  })
})

describe('warning and otp', () => {
  it('needs both the end reached and the tick', () => {
    expect(canContinue({ reachedEnd: true, ticked: false })).toBe(false)
    expect(canContinue({ reachedEnd: false, ticked: true })).toBe(false)
    expect(canContinue({ reachedEnd: true, ticked: true })).toBe(true)
  })
  it('wrong, exhausted, expired, ok', () => {
    expect(checkOtp({ attemptsLeft: 5, sentAt: 0 }, '000000', 1000)).toEqual({ kind: 'wrong', attemptsLeft: 4 })
    expect(checkOtp({ attemptsLeft: 1, sentAt: 0 }, '000000', 1000)).toEqual({ kind: 'exhausted' })
    expect(checkOtp({ attemptsLeft: 0, sentAt: 0 }, '123456', 1000)).toEqual({ kind: 'exhausted' })
    expect(checkOtp({ attemptsLeft: 3, sentAt: 0 }, '123456', 301_000)).toEqual({ kind: 'expired' })
    expect(checkOtp({ attemptsLeft: 3, sentAt: 0 }, '123456', 299_000)).toEqual({ kind: 'ok' })
  })
  it('validates Vietnamese mobiles and masks the CCCD', () => {
    expect(isValidVnMobile('0901234567')).toBe(true)
    expect(isValidVnMobile('0201234567')).toBe(false)
    expect(maskIdNumber('001099012345')).toBe('001*******45')
  })
})
