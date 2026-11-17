import { useSyncExternalStore } from 'react'
import { config } from '@/domain/config'
import { nextDayCounter } from '@/domain/auth'
import { activeGate } from '@/domain/gate'
import { fee } from '@/domain/fees'
import { limitUsage, vnMonth } from '@/domain/limits'
import type { AuthMethod, TxType } from '@/domain/types'
import { formatVnd } from '@/domain/money'
import {
  bankByBin, bankById, BANKS, seedWorld, txId,
  type Counterparty, type FailureReason, type Notification, type Scenario, type SupportRequest, type Transaction, type World,
} from '@/mock/seed'

/* ── State ────────────────────────────────────────────────────────── */

export type Outcome = 'success' | 'pending' | 'failed'
export type Settings = {
  scenario: Scenario
  nextOutcome: Outcome
  nextFailure: FailureReason
  latency: 'normal' | 'none' | 'slow'
  verification: 'verified' | 'needs_review' | 'blurry_id' | 'chip_unreadable' | 'face_mismatch' | 'weak_network'
  faceMatch: 'match' | 'no_match'
  clockOffsetMs: number
  /** Demo: last "cashier scans the Payment Code" signal; PayCode page reacts to a new nonce. */
  cashierScan?: { nonce: number; merchantId: string; amount: number }
}
export type State = { world: World; settings: Settings; version: number }

const KEY = 'wallet.state.v1'
const DEFAULT_SETTINGS: Settings = {
  scenario: 'ready', nextOutcome: 'success', nextFailure: 'bank_declined', latency: 'normal',
  verification: 'verified', faceMatch: 'match', clockOffsetMs: 0,
}

export const now = () => Date.now() + state.settings.clockOffsetMs

function fresh(scenario: Scenario, keep?: Partial<Settings>): State {
  const settings = { ...DEFAULT_SETTINGS, ...keep, scenario, clockOffsetMs: 0 }
  return { world: seedWorld(scenario, Date.now()), settings, version: 1 }
}

function load(): State {
  try {
    const raw = sessionStorage.getItem(KEY)
    if (raw) return JSON.parse(raw) as State
  } catch { /* storage blocked: fall back to a fresh seed */ }
  return fresh('ready')
}

let state: State = load()
const listeners = new Set<() => void>()
let channel: BroadcastChannel | null = null
try {
  channel = new BroadcastChannel('wallet')
  channel.onmessage = (e) => {
    state = e.data as State
    listeners.forEach((l) => l())
  }
} catch { /* no BroadcastChannel: single-window only */ }

function commit(next: State) {
  state = { ...next, version: next.version + 1 }
  try { sessionStorage.setItem(KEY, JSON.stringify(state)) } catch { /* ignore quota/private mode */ }
  channel?.postMessage(state)
  listeners.forEach((l) => l())
}
export function mutate(fn: (w: World, s: Settings) => void) {
  const draft: State = structuredClone(state)
  fn(draft.world, draft.settings)
  commit(draft)
}

export function getState() { return state }
export function subscribe(l: () => void) { listeners.add(l); return () => { listeners.delete(l) } }
export function useStore<T>(select: (s: State) => T): T {
  return useSyncExternalStore(subscribe, () => select(state), () => select(state))
}
export const useWorld = () => useStore((s) => s.world)
export const useSettings = () => useStore((s) => s.settings)

/** Simulated network latency (mock-data.md#latency), seeded by a counter so it is deterministic. */
let latencyTick = 0
export function delay(): Promise<void> {
  const l = state.settings.latency
  const ms = l === 'none' ? 0 : l === 'slow' ? 3000 : 300 + ((latencyTick++ * 137) % 600)
  return new Promise((r) => setTimeout(r, ms))
}

/* ── Selectors ────────────────────────────────────────────────────── */

const ymd = (ms: number) => new Date(ms + 7 * 3600_000).toISOString().slice(0, 10)

export function pendingOut(w: World) {
  return w.transactions.filter((t) => t.status === 'pending' && t.direction === 'out').reduce((a, t) => a + t.amount + t.fee, 0)
}
export const available = (w: World) => w.balance
export const usage = (w: World) => limitUsage(w.transactions, new Date(now()))
export function freeUsed(w: World) {
  const month = vnMonth(new Date(now()))
  return w.transactions.filter((t) => (t.type === 'withdraw' || t.type === 'bank_transfer') && t.status !== 'failed' && vnMonth(new Date(t.createdAt)) === month).length
}
export function dayCounter(w: World) { return w.dayCounter.date === ymd(now()) ? w.dayCounter.amount : 0 }
export function gateOf(w: World) {
  return activeGate({ kycStatus: w.customer.kycStatus, walletStatus: w.walletStatus, linkedSources: w.sources.length })
}
export const defaultSource = (w: World) => w.sources.find((s) => s.isDefault) ?? w.sources[0]
export const unreadCount = (w: World) => w.notifications.filter((n) => !n.read).length
export const sourceLabel = (w: World, id?: string) => {
  const s = w.sources.find((x) => x.id === id)
  return s ? `${bankById(s.bankId).name} ${s.kind === 'debit_card' ? 'thẻ' : ''} •••• ${s.last4}`.replace('  ', ' ') : 'Ví'
}
export function counterpartyName(c: Counterparty, w?: World): string {
  switch (c.kind) {
    case 'contact': case 'merchant': case 'biller': return c.name
    case 'bank': return c.holder
    case 'source': return w ? sourceLabel(w, c.id) : 'Nguồn tiền'
  }
}
export function pendingEta(t: Transaction) {
  const mins = t.pendingReason ? config.pendingEtaMinutes[t.pendingReason] : 30
  return new Date(new Date(t.createdAt).getTime() + mins * 60_000)
}

/* ── Actions: money ───────────────────────────────────────────────── */

const INSTANT: TxType[] = ['topup', 'p2p_out', 'p2p_in', 'qr_merchant', 'refund']

export type MoneyRequest = {
  type: Exclude<TxType, 'p2p_in' | 'refund'>
  amount: number
  counterparty: Counterparty
  message?: string
  sourceId?: string
  authMethod: AuthMethod
  essential?: boolean
}

const TYPE_LABEL: Record<TxType, string> = {
  topup: 'Nạp tiền', withdraw: 'Rút tiền', p2p_out: 'Chuyển đến ví', p2p_in: 'Nhận tiền', bank_transfer: 'Chuyển đến ngân hàng',
  qr_merchant: 'Thanh toán', bill: 'Hóa đơn', refund: 'Hoàn tiền',
}
export const typeLabel = (t: TxType) => TYPE_LABEL[t]

function notifyBalance(w: World, t: Transaction, at: number) {
  w.notifications.unshift({
    id: 'n' + t.id + '-' + t.status, kind: 'balance_change', read: false, createdAt: new Date(at).toISOString(),
    title: t.direction === 'in' ? `+${formatVnd(t.amount)}` : `−${formatVnd(t.amount + t.fee)}`,
    body: `${typeLabel(t.type)} · ${counterpartyName(t.counterparty, w)} · Số dư ${formatVnd(w.balance)}`,
    link: `/history/${t.id}`,
  })
}

/** Commits a money action that already passed gates, amount checks and step-up. */
export async function executeMoney(req: MoneyRequest): Promise<Transaction> {
  await delay()
  let created!: Transaction
  mutate((w, s) => {
    const at = now()
    const f = fee(req.type, req.amount, freeUsed(w)).amount
    let outcome: Outcome = s.nextOutcome
    if (outcome === 'pending' && INSTANT.includes(req.type)) outcome = 'success'
    const direction = req.type === 'topup' ? 'in' : 'out'
    const t: Transaction = {
      id: txId(w.transactions.length + 1000 + Math.floor(at / 1000) % 100000), type: req.type, status: outcome === 'failed' ? 'failed' : outcome,
      amount: req.amount, fee: outcome === 'failed' ? 0 : f, direction, counterparty: req.counterparty, message: req.message || undefined,
      sourceId: req.sourceId, authMethod: req.authMethod, createdAt: new Date(at).toISOString(), updatedAt: new Date(at).toISOString(),
      essential: req.essential,
    }
    if (outcome === 'pending') t.pendingReason = req.type === 'bill' ? 'biller_settling' : 'bank_processing'
    if (outcome === 'failed') {
      t.failureReason = req.type === 'bill' ? 'biller_unavailable' : req.type === 'qr_merchant' ? 'merchant_cancelled' : s.nextFailure
      // Bank-side failures debit first and reverse within a minute; others never leave the wallet.
      if (req.type === 'bank_transfer' || req.type === 'withdraw') t.reversedAt = new Date(at + 60_000).toISOString()
    }
    if (outcome !== 'failed') w.balance += direction === 'in' ? req.amount : -(req.amount + f)
    w.transactions.unshift(t)
    if (outcome !== 'failed') {
      w.dayCounter = { date: ymd(at), amount: nextDayCounter(dayCounter(w), { type: req.type, amount: req.amount, method: req.authMethod }) }
      if (outcome === 'success') notifyBalance(w, t, at)
    }
    if (req.counterparty.kind === 'contact') {
      const c = w.contacts.find((x) => x.id === (req.counterparty as { id: string }).id)
      if (c) c.lastTransferAt = t.createdAt
    }
    if (req.counterparty.kind === 'biller') {
      const b = w.bills.find((x) => x.id === (req.counterparty as { billId: string }).billId)
      if (b && outcome !== 'failed') b.status = outcome === 'pending' ? 'settling' : 'paid'
    }
    if (req.counterparty.kind === 'bank') {
      const cp = req.counterparty
      if (!w.bankRecipients.some((r) => r.bankId === cp.bankId && r.account === cp.account))
        w.bankRecipients.unshift({ id: 'br' + at, bankId: cp.bankId, account: cp.account, holder: cp.holder })
    }
    created = t
  })
  return created
}

/** Demo: settle every pending transaction. */
export function resolvePending(outcome: 'success' | 'failed') {
  mutate((w) => {
    const at = now()
    for (const t of w.transactions.filter((x) => x.status === 'pending')) {
      t.updatedAt = new Date(at).toISOString()
      t.pendingReason = undefined
      if (outcome === 'success') { t.status = 'success'; notifyBalance(w, t, at) }
      else {
        t.status = 'failed'
        t.failureReason = t.type === 'bill' ? 'biller_unavailable' : 'timeout_reversed'
        t.reversedAt = new Date(at).toISOString()
        w.balance += t.amount + t.fee
        t.fee = 0
        notifyBalance(w, { ...t, direction: 'in', type: 'refund' }, at)
      }
      if (t.counterparty.kind === 'biller') {
        const b = w.bills.find((x) => x.id === (t.counterparty as { billId: string }).billId)
        if (b) b.status = outcome === 'success' ? 'paid' : 'due'
      }
    }
    for (const b of w.bills) if (b.status === 'settling' && !w.transactions.some((t) => t.status === 'pending' && t.counterparty.kind === 'biller' && t.counterparty.billId === b.id)) b.status = outcome === 'success' ? 'paid' : 'due'
  })
}

/** Demo: a contact sends money now. */
export function simulateIncoming(amount = 350_000) {
  mutate((w) => {
    const at = now()
    const c = w.contacts.filter((x) => x.hasWallet)[(Math.floor(at / 1000) % 20) + 3]
    const t: Transaction = {
      id: txId(w.transactions.length + 5000 + Math.floor(at / 1000) % 100000), type: 'p2p_in', status: 'success', amount, fee: 0, direction: 'in',
      counterparty: { kind: 'contact', id: c.id, name: c.name, phone: c.phone }, message: 'Trả tiền bữa tối',
      createdAt: new Date(at).toISOString(), updatedAt: new Date(at).toISOString(),
    }
    w.balance += amount
    w.transactions.unshift(t)
    notifyBalance(w, t, at)
  })
}

/** Demo: the latest successful merchant payment is refunded. */
export function refundLatestMerchant(): boolean {
  let ok = false
  mutate((w) => {
    const orig = w.transactions.find((t) => t.type === 'qr_merchant' && t.status === 'success')
    if (!orig) return
    const at = now()
    const r: Transaction = {
      id: txId(w.transactions.length + 7000 + Math.floor(at / 1000) % 100000), type: 'refund', status: 'success', amount: orig.amount, fee: 0, direction: 'in',
      counterparty: orig.counterparty, refundOf: orig.id, createdAt: new Date(at).toISOString(), updatedAt: new Date(at).toISOString(),
    }
    orig.status = 'refunded'
    orig.refundedBy = r.id
    w.balance += orig.amount
    w.transactions.unshift(r)
    notifyBalance(w, r, at)
    ok = true
  })
  return ok
}

/* ── Actions: lookups ─────────────────────────────────────────────── */

export type LookupResult = { ok: true; holder: string } | { ok: false; error: 'not_found' | 'timeout' }

/** rules.md decisions: 000… not found, 999… timeout, otherwise a deterministic holder name. */
export async function lookupBankAccount(bankId: string, account: string): Promise<LookupResult> {
  await delay()
  if (account.startsWith('000')) return { ok: false, error: 'not_found' }
  if (account.startsWith('999')) return { ok: false, error: 'timeout' }
  const known = state.world.bankRecipients.find((r) => r.bankId === bankId && r.account === account)
  if (known) return { ok: true, holder: known.holder }
  const names = ['NGUYEN VAN AN', 'PHAM THI MAI', 'HOANG DUC MINH', 'VU THU HUYEN', 'DANG QUOC BAO', 'BUI NGOC LINH']
  return { ok: true, holder: names[Number(account.slice(-2)) % names.length] }
}
export { BANKS, bankByBin, bankById }

export function contactByPhone(phone: string) {
  return state.world.contacts.find((c) => c.phone === phone.replace(/\D/g, ''))
}

/* ── Actions: account & security ─────────────────────────────────── */

export function setDefaultSource(id: string) {
  mutate((w) => w.sources.forEach((s) => (s.isDefault = s.id === id)))
}
export function unlinkSource(id: string): boolean {
  if (state.world.sources.length <= 1) return false
  mutate((w) => {
    const wasDefault = w.sources.find((s) => s.id === id)?.isDefault
    w.sources = w.sources.filter((s) => s.id !== id)
    if (wasDefault && w.sources[0]) w.sources[0].isDefault = true
  })
  return true
}
export async function linkSource(input: { bankId: string; kind: 'account' | 'debit_card'; number: string }) {
  await delay()
  mutate((w) => {
    w.sources.push({ id: 's' + now(), bankId: input.bankId, kind: input.kind, last4: input.number.slice(-4), isDefault: w.sources.length === 0 })
  })
}

export type PinResult = { ok: true } | { ok: false; attemptsLeft: number; lockedUntil?: string }
export function verifyPin(pin: string): PinResult {
  const sec = state.world.security
  if (sec.pinLockedUntil && new Date(sec.pinLockedUntil).getTime() > now()) return { ok: false, attemptsLeft: 0, lockedUntil: sec.pinLockedUntil }
  if (pin === sec.pin) {
    mutate((w) => { w.security.pinAttemptsLeft = config.pin.maxAttempts; w.security.pinLockedUntil = undefined })
    return { ok: true }
  }
  let res!: PinResult
  mutate((w) => {
    const left = Math.max(0, (w.security.pinLockedUntil ? config.pin.maxAttempts : w.security.pinAttemptsLeft) - 1)
    w.security.pinAttemptsLeft = left
    if (left === 0) w.security.pinLockedUntil = new Date(now() + config.pin.lockMinutes * 60_000).toISOString()
    res = { ok: false, attemptsLeft: left, lockedUntil: w.security.pinLockedUntil }
  })
  return res
}
export function changePin(pin: string) { mutate((w) => { w.security.pin = pin }) }
export function setDeviceBiometric(on: boolean) { mutate((w) => { w.security.deviceBiometric = on }) }
export function setBalanceHidden(on: boolean) { mutate((w) => { w.security.balanceHidden = on }) }

/* ── Actions: onboarding ──────────────────────────────────────────── */

export function startOnboarding(phone: string, pin: string) {
  mutate((w) => {
    w.customer.phone = phone
    w.customer.walletNumber = phone
    w.security.pin = pin
  })
}
/** Applies the Demo-controls verification result. Returns the outcome shown to the user. */
export async function submitVerification(method: 'nfc' | 'vneid'): Promise<Settings['verification']> {
  await delay()
  const v = state.settings.verification
  mutate((w) => {
    w.customer.kycMethod = method
    w.customer.kycStatus = v === 'verified' ? 'verified' : v === 'needs_review' ? 'verifying' : 'unverified'
  })
  return v
}
export function finishOnboarding() {
  mutate((w) => {
    w.signedIn = true
    if (!w.notifications.some((n) => n.id === 'n-welcome'))
      w.notifications.unshift({ id: 'n-welcome', kind: 'security', read: false, createdAt: new Date(now()).toISOString(), title: 'Ví đã sẵn sàng', body: `Số ví ${w.customer.walletNumber}. Liên kết ngân hàng để bắt đầu giao dịch.`, link: '/me/sources' })
  })
}
export function resolveVerification(result: 'verified' | 'unverified') {
  mutate((w) => { w.customer.kycStatus = result })
}

/* ── Actions: bills, support, notifications ───────────────────────── */

export async function lookupBill(_billerId: string, code: string): Promise<{ ok: true; holder: string; address: string; amount: number; period: string } | { ok: false; error: 'not_found' | 'no_debt' | 'unavailable' }> {
  await delay()
  if (code.startsWith('XX')) return { ok: false, error: 'not_found' }
  if (code.endsWith('0000')) return { ok: false, error: 'no_debt' }
  if (code.endsWith('9999')) return { ok: false, error: 'unavailable' }
  const amount = 300_000 + (Number(code.replace(/\D/g, '').slice(-5)) % 1100) * 1000
  return { ok: true, holder: 'TRẦN MINH ANH', address: '18 ngõ 34 Hoàng Cầu, Đống Đa', amount, period: vnMonth(new Date(now() - 20 * 86_400_000)) }
}
export function saveBill(input: { billerId: string; customerCode: string; holder: string; address: string; amount: number; period: string }): string {
  const id = 'b' + now()
  mutate((w) => {
    w.bills.unshift({ id, ...input, dueDate: ymd(now() + 10 * 86_400_000), status: 'due' })
  })
  return id
}

export async function createSupportRequest(input: Omit<SupportRequest, 'id' | 'createdAt' | 'status'>): Promise<SupportRequest> {
  await delay()
  const req: SupportRequest = { ...input, id: 'HT' + String(20260000 + (now() % 10000)).padStart(8, '0'), createdAt: new Date(now()).toISOString(), status: 'received' }
  mutate((w) => {
    w.support.unshift(req)
    w.notifications.unshift({ id: 'n' + req.id, kind: 'support_update', read: false, createdAt: req.createdAt, title: 'Đã nhận yêu cầu hỗ trợ', body: `${req.id} · Chúng tôi phản hồi trong tối đa 30 ngày làm việc.`, link: '/support' })
  })
  return req
}

export function markRead(ids?: string[]) {
  mutate((w) => w.notifications.forEach((n) => { if (!ids || ids.includes(n.id)) n.read = true }))
}
export function addNotification(n: Omit<Notification, 'id' | 'createdAt' | 'read'>) {
  mutate((w) => { w.notifications.unshift({ ...n, id: 'n' + now(), createdAt: new Date(now()).toISOString(), read: false }) })
}

/* ── Demo controls ────────────────────────────────────────────────── */

export function setScenario(scenario: Scenario) { commit({ ...fresh(scenario, state.settings), version: state.version }) }
export function reset() { setScenario(state.settings.scenario) }
export function setSetting<K extends keyof Settings>(k: K, v: Settings[K]) { mutate((_, s) => { s[k] = v }) }
/** Advance the demo clock; pending items whose ETA has passed settle as success. */
export function advanceClock(ms: number) {
  mutate((_, s) => { s.clockOffsetMs += ms })
  const due = state.world.transactions.some((t) => t.status === 'pending' && pendingEta(t).getTime() <= now())
  if (due) resolvePending('success')
}
export function signOut() { setScenario('new') }
export function cashierScan(amount: number, merchantId = 'm06') {
  mutate((_, s) => { s.cashierScan = { nonce: now(), merchantId, amount } })
}
