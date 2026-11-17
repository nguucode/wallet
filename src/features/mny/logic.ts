import { fee } from '@/domain/fees'
import { bankById, delay } from '@/app/store'
import type { FundingSource } from '@/mock/seed'

/** Holder names match when equal after uppercase, diacritics removed, single spaces (US-MNY-002). */
export function isOwnAccount(holderName: string, customerName: string) {
  const norm = (s: string) => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[đĐ]/g, 'D').toUpperCase().trim().replace(/\s+/g, ' ')
  return norm(holderName) === norm(customerName)
}

/** The last linked source cannot be unlinked (rules.md#gates, TT 40 Đ.24). */
export const canUnlink = (sources: FundingSource[]) => sources.length > 1

/** Default first, then link order (the store keeps sources in link order). */
export const sortSources = (sources: FundingSource[]) => [...sources].sort((a, b) => Number(b.isDefault) - Number(a.isDefault))

export const kindLabel = (k: FundingSource['kind']) => (k === 'debit_card' ? 'Thẻ ghi nợ' : 'Tài khoản')
export const mask4 = (last4: string) => `•••• ${last4}`
export const sourceName = (s: FundingSource) => `${bankById(s.bankId).name} ${mask4(s.last4)}`

/** Cards (and long numbers) group in fours for display. */
export const groupDigits = (d: string) => d.replace(/(\d{4})(?=\d)/g, '$1 ')

/** Largest amount whose amount + withdraw fee fits in the available balance. */
export function maxWithdrawable(available: number, freeUsed: number) {
  const total = (a: number) => a + fee('withdraw', a, freeUsed).amount
  if (total(available) <= available) return available
  let a = Math.floor(available / 1.005)
  while (a > 0 && total(a) > available) a--
  while (total(a + 1) <= available) a++
  return a
}

export type HolderLookup = { ok: true; holder: string } | { ok: false; error: 'not_found' | 'timeout' }

/** Demo lookup rules (rules.md decisions): 000… not found, 999… time out, …0000 another holder. */
export async function lookupHolder(number: string, customerName: string): Promise<HolderLookup> {
  await delay()
  if (number.startsWith('000')) return { ok: false, error: 'not_found' }
  if (number.startsWith('999')) return { ok: false, error: 'timeout' }
  if (number.endsWith('0000')) return { ok: true, holder: 'NGUYỄN VĂN BÌNH' }
  return { ok: true, holder: customerName.toUpperCase() }
}
