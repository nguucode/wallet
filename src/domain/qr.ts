/**
 * EMVCo merchant-presented QR (TLV: 2-digit tag, 2-digit length, value; tag 63 = CRC-16/CCITT-FALSE).
 * VietQR bank accounts use NAPAS GUID A000000727 in tag 38. Wallet and merchant QRs use this demo's own GUIDs.
 */
export type QrPayload =
  | { kind: 'vietqr'; bin: string; account: string; amount?: number; message?: string }
  | { kind: 'wallet'; phone: string; amount?: number }
  | { kind: 'merchant'; merchantId: string; name: string; amount?: number }
  | { kind: 'unknown'; reason: 'format' | 'checksum' }

const NAPAS = 'A000000727'
const WALLET = 'VN.DEMOWALLET.USER'
const MERCHANT = 'VN.DEMOWALLET.MERCHANT'

export function crc16(s: string): string {
  let crc = 0xffff
  for (let i = 0; i < s.length; i++) {
    crc ^= s.charCodeAt(i) << 8
    for (let b = 0; b < 8; b++) crc = crc & 0x8000 ? ((crc << 1) ^ 0x1021) & 0xffff : (crc << 1) & 0xffff
  }
  return crc.toString(16).toUpperCase().padStart(4, '0')
}

const tlv = (tag: string, value: string) => tag + value.length.toString().padStart(2, '0') + value

function readTlv(s: string): Map<string, string> | null {
  const out = new Map<string, string>()
  let i = 0
  while (i < s.length) {
    const tag = s.slice(i, i + 2), len = Number(s.slice(i + 2, i + 4))
    if (!/^\d{2}$/.test(tag) || !Number.isInteger(len) || i + 4 + len > s.length) return null
    out.set(tag, s.slice(i + 4, i + 4 + len))
    i += 4 + len
  }
  return out
}

export function buildQr(p: Exclude<QrPayload, { kind: 'unknown' }>): string {
  let account: string
  if (p.kind === 'vietqr') account = tlv('38', tlv('00', NAPAS) + tlv('01', tlv('00', p.bin) + tlv('01', p.account)) + tlv('02', 'QRIBFTTA'))
  else if (p.kind === 'wallet') account = tlv('26', tlv('00', WALLET) + tlv('01', p.phone))
  else account = tlv('26', tlv('00', MERCHANT) + tlv('01', p.merchantId))
  let s = tlv('00', '01') + tlv('01', p.amount ? '12' : '11') + account + tlv('53', '704')
  if (p.amount) s += tlv('54', String(p.amount))
  s += tlv('58', 'VN')
  if (p.kind === 'merchant') s += tlv('59', p.name) + tlv('60', 'HA NOI')
  if (p.kind === 'vietqr' && p.message) s += tlv('62', tlv('08', p.message))
  s += '6304'
  return s + crc16(s)
}

export function parseQr(raw: string): QrPayload {
  const s = raw.trim()
  const top = readTlv(s)
  if (!top || top.get('00') !== '01' || !top.has('63')) return { kind: 'unknown', reason: 'format' }
  if (crc16(s.slice(0, -4)) !== top.get('63')) return { kind: 'unknown', reason: 'checksum' }
  const amount = top.has('54') ? Number(top.get('54')) : undefined
  const withAmount = <T extends object>(o: T) => (amount ? { ...o, amount } : o)

  const napas = top.has('38') ? readTlv(top.get('38')!) : null
  if (napas?.get('00') === NAPAS) {
    const bene = readTlv(napas.get('01') ?? '')
    const message = top.has('62') ? readTlv(top.get('62')!)?.get('08') : undefined
    if (bene?.get('00') && bene.get('01'))
      return { kind: 'vietqr', bin: bene.get('00')!, account: bene.get('01')!, ...(amount ? { amount } : {}), ...(message ? { message } : {}) }
  }
  const own = top.has('26') ? readTlv(top.get('26')!) : null
  if (own?.get('00') === WALLET && own.get('01')) return withAmount({ kind: 'wallet' as const, phone: own.get('01')! })
  if (own?.get('00') === MERCHANT && own.get('01')) return withAmount({ kind: 'merchant' as const, merchantId: own.get('01')!, name: top.get('59') ?? '' })
  return { kind: 'unknown', reason: 'format' }
}
