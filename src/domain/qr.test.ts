import { crc16, parseQr, buildQr } from './qr'

describe('crc16 (CCITT-FALSE)', () => {
  it('matches the standard check value', () => {
    expect(crc16('123456789')).toBe('29B1')
  })
})

describe('parseQr', () => {
  it('reads a VietQR bank account with amount and message', () => {
    const p = buildQr({ kind: 'vietqr', bin: '970436', account: '0011004123456', amount: 250_000, message: 'tien nha' })
    expect(parseQr(p)).toEqual({ kind: 'vietqr', bin: '970436', account: '0011004123456', amount: 250_000, message: 'tien nha' })
  })
  it('reads a wallet receive QR', () => {
    expect(parseQr(buildQr({ kind: 'wallet', phone: '0901234567' }))).toEqual({ kind: 'wallet', phone: '0901234567' })
  })
  it('reads a merchant QR with a fixed amount', () => {
    expect(parseQr(buildQr({ kind: 'merchant', merchantId: 'M07', name: 'CA PHE NHA', amount: 45_000 }))).toEqual({ kind: 'merchant', merchantId: 'M07', name: 'CA PHE NHA', amount: 45_000 })
  })
  it('rejects a payload whose checksum does not match', () => {
    const p = buildQr({ kind: 'wallet', phone: '0901234567' })
    expect(parseQr(p.slice(0, -1) + (p.endsWith('0') ? '1' : '0'))).toEqual({ kind: 'unknown', reason: 'checksum' })
  })
  it('rejects text that is not EMVCo', () => {
    expect(parseQr('https://example.com')).toEqual({ kind: 'unknown', reason: 'format' })
  })
})
