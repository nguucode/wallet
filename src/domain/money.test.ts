import { formatVnd, parseVndInput } from './money'

describe('formatVnd', () => {
  it('uses dot thousands and a spaced ₫ suffix', () => {
    expect(formatVnd(1250000)).toBe('1.250.000 ₫')
    expect(formatVnd(0)).toBe('0 ₫')
    expect(formatVnd(128450000)).toBe('128.450.000 ₫')
  })
  it('signs amounts when asked', () => {
    expect(formatVnd(35000, { sign: 'in' })).toBe('+35.000 ₫')
    expect(formatVnd(35000, { sign: 'out' })).toBe('−35.000 ₫')
  })
})

describe('parseVndInput', () => {
  it('keeps digits only and drops leading zeros', () => {
    expect(parseVndInput('1.250.000')).toBe(1250000)
    expect(parseVndInput('00a12')).toBe(12)
    expect(parseVndInput('')).toBe(0)
  })
})
