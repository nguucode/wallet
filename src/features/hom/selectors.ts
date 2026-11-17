import type { SavedBill, Transaction, World } from '@/mock/seed'

const DAY = 86_400_000
/** Calendar date in Asia/Ho_Chi_Minh (UTC+7, no DST). */
export const vnDay = (ms: number) => new Date(ms + 7 * 3600_000).toISOString().slice(0, 10)
/** Whole days from today (VN) to a `YYYY-MM-DD` date; negative when past. */
export const daysUntil = (ymd: string, now: number) => Math.round((Date.parse(ymd) - Date.parse(vnDay(now))) / DAY)
export const fmtYmd = (ymd: string) => ymd.split('-').reverse().join('/')

/** US-HOM-004: `due` within 7 days, or overdue (status or date); overdue first, then by due date. */
export function selectBillsDue(bills: SavedBill[], now: number) {
  return bills
    .map((b) => ({ bill: b, days: daysUntil(b.dueDate, now) }))
    .filter(({ bill, days }) => bill.status === 'overdue' || (bill.status === 'due' && days <= 7))
    .map((x) => ({ ...x, overdue: x.bill.status === 'overdue' || x.days < 0 }))
    .sort((a, b) => Number(b.overdue) - Number(a.overdue) || a.bill.dueDate.localeCompare(b.bill.dueDate))
}

export type Recipient =
  | { key: string; kind: 'contact'; id: string; name: string; phone: string }
  | { key: string; kind: 'bank'; bankId: string; account: string; name: string }

/** US-HOM-005: distinct recipients of outgoing transfers, most recent first. */
export function selectRecentRecipients(txs: Transaction[], max = 8): Recipient[] {
  const out: Recipient[] = []
  const seen = new Set<string>()
  for (const t of [...txs].sort((a, b) => b.createdAt.localeCompare(a.createdAt))) {
    const c = t.counterparty
    let r: Recipient | null = null
    if (t.type === 'p2p_out' && c.kind === 'contact') r = { key: 'c:' + c.id, kind: 'contact', id: c.id, name: c.name, phone: c.phone }
    if (t.type === 'bank_transfer' && c.kind === 'bank') r = { key: `b:${c.bankId}:${c.account}`, kind: 'bank', bankId: c.bankId, account: c.account, name: c.holder }
    if (!r || seen.has(r.key)) continue
    seen.add(r.key)
    out.push(r)
    if (out.length === max) break
  }
  return out
}

/** Last word of a name, title-cased when it came in upper case from a bank lookup ("TRAN VAN HAI" → "Hai"). */
export function shortName(name: string) {
  const last = name.trim().split(/\s+/).pop() ?? ''
  return last === last.toUpperCase() ? last.charAt(0) + last.slice(1).toLowerCase() : last
}

const DIGIT = ['không', 'một', 'hai', 'ba', 'bốn', 'năm', 'sáu', 'bảy', 'tám', 'chín']
function triple(n: number, full: boolean): string[] {
  const h = Math.floor(n / 100), t = Math.floor(n / 10) % 10, u = n % 10
  const w: string[] = []
  if (full || h) w.push(DIGIT[h], 'trăm')
  if (t === 0) { if (u && (full || h)) w.push('linh') }
  else if (t === 1) w.push('mười')
  else w.push(DIGIT[t], 'mươi')
  if (u) w.push(u === 1 && t >= 2 ? 'mốt' : u === 5 && t >= 1 ? 'lăm' : DIGIT[u])
  return w
}
/** Amount read as Vietnamese words for screen readers: 1.250.000 → "một triệu hai trăm năm mươi nghìn đồng". */
export function vndWords(amount: number): string {
  let n = Math.abs(Math.round(amount))
  if (n === 0) return 'không đồng'
  const groups: number[] = []
  while (n > 0) { groups.push(n % 1000); n = Math.floor(n / 1000) }
  const UNIT = ['', 'nghìn', 'triệu', 'tỷ', 'nghìn tỷ']
  const words: string[] = []
  for (let i = groups.length - 1; i >= 0; i--) {
    if (!groups[i]) continue
    words.push(...triple(groups[i], i < groups.length - 1))
    if (UNIT[i]) words.push(UNIT[i])
  }
  return words.join(' ') + ' đồng'
}

/** Daily closing balance for the last `days` days (oldest first), walked back from the current balance. */
export function balanceSeries(w: Pick<World, 'balance' | 'transactions'>, nowMs: number, days = 30): number[] {
  const DAY = 86_400_000
  const out: number[] = []
  let bal = w.balance
  const txs = w.transactions.filter((t) => t.status !== 'failed')
  let i = 0
  for (let d = 0; d < days; d++) {
    const dayStart = nowMs - d * DAY
    // undo every transaction newer than this day's close
    while (i < txs.length && new Date(txs[i].createdAt).getTime() > dayStart) {
      const t = txs[i++]
      bal -= t.direction === 'in' ? t.amount : -(t.amount + t.fee)
    }
    out.push(bal)
  }
  return out.reverse()
}
