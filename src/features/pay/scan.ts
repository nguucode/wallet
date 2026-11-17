import type { QrPayload } from '@/domain/qr'

export type ScanRoute = { ok: true; to: string } | { ok: false; title: string; body: string }

/** US-PAY-002 / sitemap `scan`: where a decoded payload goes. Unknown kinds explain what Wallet can read. */
export function routeForQr(parsed: QrPayload, raw: string): ScanRoute {
  const q = encodeURIComponent(raw.trim())
  switch (parsed.kind) {
    case 'wallet': return { ok: true, to: `/transfer/wallet?qr=${q}` }
    case 'vietqr': return { ok: true, to: `/transfer/bank?qr=${q}` }
    case 'merchant': return { ok: true, to: `/pay/merchant?qr=${q}` }
    default:
      return {
        ok: false, title: 'Không nhận ra mã này',
        body: parsed.reason === 'checksum' ? 'Mã QR bị hỏng hoặc không đầy đủ.' : 'Wallet đọc được mã nhận tiền của ví, VietQR và mã của cửa hàng.',
      }
  }
}

/* ── Payment Code (US-PAY-005) ────────────────────────────────────── */

export const PAY_CODE_TTL_S = 60 // shortcut: not in domain/config yet; move to config.paymentCodeTtlSeconds when FND adds it

/** 18-digit one-time code (demo only, not a CPM token). */
export const newPayCode = (rand: () => number = Math.random) => Array.from({ length: 18 }, (_, i) => (i === 0 ? 1 + Math.floor(rand() * 9) : Math.floor(rand() * 10))).join('')

export const fmtCountdown = (s: number) => `${Math.floor(s / 60)}:${String(Math.max(0, s) % 60).padStart(2, '0')}`

/* ── Code 128 set C (even-length digit strings) for the Payment Code barcode ── */

const C128 = [
  '212222', '222122', '222221', '121223', '121322', '131222', '122213', '122312', '132212', '221213', '221312', '231212', '112232', '122132', '122231', '113222',
  '123122', '123221', '223211', '221132', '221231', '213212', '223112', '312131', '311222', '321122', '321221', '312212', '322112', '322211', '212123', '212321',
  '232121', '111323', '131123', '131321', '112313', '132113', '132311', '211313', '231113', '231311', '112133', '112331', '132131', '113123', '113321', '133121',
  '313121', '211331', '231131', '213113', '213311', '213131', '311123', '311321', '331121', '312113', '312311', '332111', '314111', '221411', '431111', '111224',
  '111422', '121124', '121421', '141122', '141221', '112214', '112412', '122114', '122411', '142112', '142211', '241211', '221114', '413111', '241112', '134111',
  '111242', '121142', '121241', '114212', '124112', '124211', '411212', '421112', '421211', '212141', '214121', '412121', '111143', '111341', '131141', '114113',
  '114311', '411113', '411311', '113141', '114131', '311141', '411131', '211412', '211214', '211232', '2331112',
]
export const C128_TABLE_SIZE = C128.length

/** Bar/space module widths, starting with a bar: start C, digit pairs, checksum, stop. */
export function code128c(digits: string): number[] {
  if (!/^(\d\d)+$/.test(digits)) throw new Error('Code 128C needs an even number of digits')
  const values = digits.match(/\d\d/g)!.map(Number)
  const check = values.reduce((sum, v, i) => sum + v * (i + 1), 105) % 103
  return [105, ...values, check, 106].flatMap((v) => C128[v].split('').map(Number))
}
