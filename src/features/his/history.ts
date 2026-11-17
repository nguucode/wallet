import { formatVnd } from '@/domain/money'
import type { TxStatus, TxType } from '@/domain/types'
import type { SupportRequest, Transaction } from '@/mock/seed'

/* Pure history/support logic (US-HIS-001, -002, -003, -004). Dates resolve in Asia/Ho_Chi_Minh (UTC+7, no DST). */

const VN = 7 * 3600_000
const DAY = 86_400_000
export const vnDay = (iso: string | number) => new Date(new Date(iso).getTime() + VN).toISOString().slice(0, 10)
export const vnMonthOf = (iso: string | number) => vnDay(iso).slice(0, 7)
const dmy = (ymd: string) => ymd.split('-').reverse().join('/')

export type Tab = 'all' | 'in' | 'out' | 'pending' | 'failed'
export const TABS: { value: Tab; label: string }[] = [
  { value: 'all', label: 'Tất cả' }, { value: 'in', label: 'Tiền vào' }, { value: 'out', label: 'Tiền ra' },
  { value: 'pending', label: 'Đang xử lý' }, { value: 'failed', label: 'Không thành công' },
]
export type HistoryFilter = { tab?: Tab; month?: string; type?: TxType; status?: TxStatus }

/** Newest first; pending and failed are never dropped unless a filter asks for a different status. */
export function filterTransactions(txs: Transaction[], f: HistoryFilter): Transaction[] {
  return txs
    .filter((t) =>
      (f.tab === 'in' ? t.direction === 'in' : f.tab === 'out' ? t.direction === 'out' : f.tab === 'pending' ? t.status === 'pending' : f.tab === 'failed' ? t.status === 'failed' : true)
      && (!f.month || vnMonthOf(t.createdAt) === f.month)
      && (!f.type || t.type === f.type)
      && (!f.status || t.status === f.status))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
}

export type Group = { key: string; label: string; rows: Transaction[] }

function groupBy(txs: Transaction[], keyOf: (t: Transaction) => string, labelOf: (k: string) => string): Group[] {
  const out: Group[] = []
  for (const t of txs) {
    const k = keyOf(t)
    const last = out[out.length - 1]
    if (last?.key === k) last.rows.push(t)
    else out.push({ key: k, label: labelOf(k), rows: [t] })
  }
  return out
}

export const monthLabel = (ym: string) => `Tháng ${ym.slice(5)}/${ym.slice(0, 4)}`
export const groupByMonth = (txs: Transaction[]) => groupBy(txs, (t) => vnMonthOf(t.createdAt), monthLabel)
export function groupByDay(txs: Transaction[], now: number) {
  const today = vnDay(now), yesterday = vnDay(now - DAY)
  return groupBy(txs, (t) => vnDay(t.createdAt), (k) => (k === today ? 'Hôm nay' : k === yesterday ? 'Hôm qua' : dmy(k)))
}

/** Signed amount a row shows: out includes the fee actually charged. */
export const rowAmount = (t: Transaction) => (t.direction === 'out' ? t.amount + t.fee : t.amount)

/** Month header totals: success and pending only (failed moved no money; refunded is shown by its refund row). */
export function monthTotals(txs: Transaction[]) {
  let inSum = 0, outSum = 0
  for (const t of txs) {
    if (t.status !== 'success' && t.status !== 'pending') continue
    if (t.direction === 'in') inSum += rowAmount(t)
    else outSum += rowAmount(t)
  }
  return { in: inSum, out: outSum }
}

/** Months present in the data, newest first, for the "Tháng" filter. */
export const monthsOf = (txs: Transaction[]) => [...new Set(txs.map((t) => vnMonthOf(t.createdAt)))].sort().reverse()

/* ── Support (US-HIS-004) ─────────────────────────────────────────── */

export type Reason = SupportRequest['reason']
export const REASON_LABEL: Record<Reason, string> = {
  wrong_recipient: 'Chuyển nhầm người nhận',
  not_received: 'Người nhận chưa nhận được tiền',
  charged_twice: 'Bị trừ tiền hai lần',
  failed_but_debited: 'Giao dịch không thành công nhưng tiền chưa hoàn về',
  other: 'Vấn đề khác',
}
export const TX_REASONS: Reason[] = ['wrong_recipient', 'not_received', 'charged_twice', 'failed_but_debited']

/** Reasons that fit a transaction; without one, every reason is listed (only "other" can continue). */
export function reasonsFor(tx?: Transaction): Reason[] {
  if (!tx) return [...TX_REASONS, 'other']
  const transfer = tx.type === 'p2p_out' || tx.type === 'bank_transfer'
  return [
    ...(transfer ? (['wrong_recipient', 'not_received'] as Reason[]) : []),
    'charged_twice',
    ...(tx.status === 'failed' ? (['failed_but_debited'] as Reason[]) : []),
    'other',
  ]
}

export const isWithinSupportWindow = (tx: Transaction, now: number, days: number) => now - new Date(tx.createdAt).getTime() <= days * DAY

export function validateDescription(text: string): string | null {
  const n = text.trim().length
  if (n < 20) return 'Mô tả tối thiểu 20 ký tự'
  if (n > 500) return 'Mô tả tối đa 500 ký tự'
  return null
}

export const SUPPORT_STATUS_LABEL: Record<SupportRequest['status'], string> = {
  received: 'Đã tiếp nhận', investigating: 'Đang xử lý', resolved: 'Đã giải quyết', escalated: 'Đã chuyển cấp cao hơn',
}

/* ── Receipt (US-HIS-003) ─────────────────────────────────────────── */

const RECEIPT_STATUS: Record<TxStatus, string> = { pending: 'Đang xử lý', success: 'Thành công', failed: 'Không thành công', refunded: 'Đã hoàn tiền' }

/** Plain-text receipt for share/copy. Never includes balance, PIN or a full account number. */
export function receiptShareText(r: { id: string; status: TxStatus; amount: number; typeLabel: string; counterparty: string; time: string; link: string }) {
  return [
    `Biên lai giao dịch Wallet · ${RECEIPT_STATUS[r.status]}`,
    `${r.typeLabel}: ${formatVnd(r.amount)}`,
    r.counterparty,
    `Thời gian: ${r.time}`,
    `Mã giao dịch: ${r.id}`,
    r.link,
  ].join('\n')
}
