import { config } from '@/domain/config'
import type { Contact, Counterparty, Transaction, World } from '@/mock/seed'

export type Recent =
  | { kind: 'wallet'; key: string; id: string; name: string; phone: string }
  | { kind: 'bank'; key: string; bankId: string; account: string; holder: string }

/** US-TRF-001: distinct recipients of successful or pending transfers, newest first. */
export function recentRecipients(txs: Transaction[], limit: number): Recent[] {
  const out: Recent[] = []
  const seen = new Set<string>()
  const sorted = [...txs].sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  for (const t of sorted) {
    if (out.length >= limit) break
    if ((t.type !== 'p2p_out' && t.type !== 'bank_transfer') || (t.status !== 'success' && t.status !== 'pending')) continue
    const c = t.counterparty
    const r: Recent | null =
      c.kind === 'contact' ? { kind: 'wallet', key: 'w' + c.phone, id: c.id, name: c.name, phone: c.phone }
      : c.kind === 'bank' ? { kind: 'bank', key: 'b' + c.bankId + c.account, bankId: c.bankId, account: c.account, holder: c.holder }
      : null
    if (!r || seen.has(r.key)) continue
    seen.add(r.key)
    out.push(r)
  }
  return out
}

/** Lowercase, no diacritics, đ → d (US-TRF-002). */
export const fold = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/gi, 'd').toLowerCase()

/** Letters match names ignoring diacritics; digits match the phone. */
export function filterContacts<T extends Pick<Contact, 'name' | 'phone'>>(contacts: T[], query: string): T[] {
  const q = query.trim()
  if (!q) return contacts
  const digits = q.replace(/\D/g, '')
  if (/^[\d\s+]+$/.test(q)) return contacts.filter((c) => c.phone.includes(digits))
  const f = fold(q)
  return contacts.filter((c) => fold(c.name).includes(f))
}

export const isValidAccountNumber = (s: string) => /^\d+$/.test(s) && s.length >= config.accountDigits.min && s.length <= config.accountDigits.max
export const isFullPhone = (s: string) => /^0\d{9}$/.test(s)

export type PhoneLookup =
  | { status: 'self' }
  | { status: 'wallet'; contact: Extract<Counterparty, { kind: 'contact' }> }
  | { status: 'no_wallet' }
  | { status: 'error' }

const NAMES = ['Phạm Gia Bảo', 'Đỗ Thùy Linh', 'Ngô Quang Vinh', 'Lý Hải Yến', 'Trịnh Đức Anh', 'Mai Phương Thảo', 'Võ Minh Khoa', 'Đinh Bảo Ngọc', 'Tạ Hồng Nhung', 'Lâm Tuấn Kiệt']

/**
 * Wallet directory for a 10-digit phone. Contacts resolve to themselves. For other numbers (demo rule):
 * ending 0000 → lookup error, even last digit → a wallet holder with a seeded name, odd → no wallet.
 * shortcut: no real non-contact directory in the seed; move to store if HOM/demo needs the same answer.
 */
export function resolvePhone(w: Pick<World, 'contacts' | 'customer'>, phone: string): PhoneLookup {
  if (phone === w.customer.phone) return { status: 'self' }
  const c = w.contacts.find((x) => x.phone === phone)
  if (c) return c.hasWallet ? { status: 'wallet', contact: { kind: 'contact', id: c.id, name: c.name, phone: c.phone } } : { status: 'no_wallet' }
  if (phone.endsWith('0000')) return { status: 'error' }
  const last = Number(phone.slice(-1))
  if (last % 2) return { status: 'no_wallet' }
  return { status: 'wallet', contact: { kind: 'contact', id: 'p' + phone, name: NAMES[Number(phone.slice(-3, -1)) % NAMES.length], phone } }
}
