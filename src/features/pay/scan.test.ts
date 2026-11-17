import { buildQr, parseQr } from '@/domain/qr'
import { C128_TABLE_SIZE, code128c, fmtCountdown, newPayCode, routeForQr } from './scan'

const route = (raw: string) => routeForQr(parseQr(raw), raw)

describe('routeForQr', () => {
  it('sends a wallet receive QR to the wallet transfer with the payload encoded', () => {
    const raw = buildQr({ kind: 'wallet', phone: '0912345678', amount: 200_000 })
    expect(route(raw)).toEqual({ ok: true, to: `/transfer/wallet?qr=${encodeURIComponent(raw)}` })
  })
  it('sends a VietQR to the bank transfer', () => {
    const raw = buildQr({ kind: 'vietqr', bin: '970418', account: '21510001234567' })
    expect(route(raw)).toMatchObject({ ok: true, to: expect.stringMatching(/^\/transfer\/bank\?qr=/) })
  })
  it('sends a merchant QR to merchant payment', () => {
    const raw = buildQr({ kind: 'merchant', merchantId: 'm03', name: 'Cong Ca phe', amount: 45_000 })
    expect(route(raw)).toMatchObject({ ok: true, to: expect.stringMatching(/^\/pay\/merchant\?qr=/) })
  })
  it('explains an unknown payload', () => {
    expect(route('https://example.com/khuyen-mai')).toEqual({ ok: false, title: 'Không nhận ra mã này', body: 'Wallet đọc được mã nhận tiền của ví, VietQR và mã của cửa hàng.' })
  })
  it('calls a checksum mismatch a damaged code', () => {
    const raw = buildQr({ kind: 'wallet', phone: '0912345678' })
    const broken = raw.slice(0, -1) + (raw.endsWith('0') ? '1' : '0')
    expect(route(broken)).toMatchObject({ ok: false, body: 'Mã QR bị hỏng hoặc không đầy đủ.' })
  })
})

describe('Payment Code', () => {
  it('issues 18 digits without a leading zero', () => {
    expect(newPayCode()).toMatch(/^[1-9]\d{17}$/)
    expect(newPayCode(() => 0)).toBe('1' + '0'.repeat(17))
  })
  it('formats the countdown', () => {
    expect(fmtCountdown(59)).toBe('0:59')
    expect(fmtCountdown(60)).toBe('1:00')
    expect(fmtCountdown(5)).toBe('0:05')
  })
})

describe('code128c', () => {
  it('has the full symbol table', () => expect(C128_TABLE_SIZE).toBe(107))
  it('encodes start C, pairs, checksum and stop with 11-module symbols', () => {
    const m = code128c('1234')
    // start + 2 pairs + checksum = 4 symbols × 11 modules, stop = 13
    expect(m.reduce((a, b) => a + b, 0)).toBe(4 * 11 + 13)
    // 6 widths per symbol; checksum = (105 + 12·1 + 34·2) mod 103 = 82 → pattern 121241
    expect(m.slice(0, 6)).toEqual([2, 1, 1, 2, 3, 2])
    expect(m.slice(18, 24)).toEqual([1, 2, 1, 2, 4, 1])
  })
  it('every 18-digit code gives a well-formed barcode', () => {
    const m = code128c('123456789012345678')
    expect(m.reduce((a, b) => a + b, 0)).toBe((9 + 2) * 11 + 13)
  })
  it('rejects odd-length input', () => expect(() => code128c('123')).toThrow())
})
