import { buildQr } from '@/domain/qr'
import type { AuthMethod, TxStatus, TxType } from '@/domain/types'
import type { KycStatus, WalletStatus } from '@/domain/gate'

/* ── Types: the whole persisted world ─────────────────────────────── */

export type Bank = { id: string; name: string; short: string; bin: string }
export type FundingSource = { id: string; bankId: string; kind: 'account' | 'debit_card'; last4: string; isDefault: boolean }
export type Contact = { id: string; name: string; phone: string; hasWallet: boolean; lastTransferAt?: string }
export type BankRecipient = { id: string; bankId: string; account: string; holder: string }
export type Merchant = { id: string; name: string; category: string; fixedAmount?: number }
export type Biller = { id: string; name: string; category: 'electricity' | 'water' | 'internet'; essential: boolean; p1?: boolean }
export type SavedBill = {
  id: string; billerId: string; customerCode: string; holder: string; address: string
  period: string; amount: number; dueDate: string; status: 'due' | 'overdue' | 'paid' | 'settling'
}
export type Counterparty =
  | { kind: 'contact'; id: string; name: string; phone: string }
  | { kind: 'bank'; bankId: string; account: string; holder: string }
  | { kind: 'merchant'; id: string; name: string }
  | { kind: 'biller'; id: string; name: string; billId: string }
  | { kind: 'source'; id: string }
export type FailureReason = 'bank_declined' | 'recipient_bank_rejected' | 'timeout_reversed' | 'biller_unavailable' | 'merchant_cancelled' | 'system_busy'
export type PendingReason = 'bank_processing' | 'biller_settling'
export type Transaction = {
  id: string; type: TxType; status: TxStatus; amount: number; fee: number; direction: 'in' | 'out'
  counterparty: Counterparty; message?: string; sourceId?: string; authMethod?: AuthMethod
  createdAt: string; updatedAt: string; failureReason?: FailureReason; pendingReason?: PendingReason
  essential?: boolean; refundOf?: string; refundedBy?: string; reversedAt?: string
}
export type NotificationKind = 'balance_change' | 'new_device_login' | 'id_expiring' | 'bill_due' | 'security' | 'support_update'
export type Notification = { id: string; kind: NotificationKind; title: string; body: string; link?: string; createdAt: string; read: boolean }
export type SupportRequest = {
  id: string; transactionId?: string; reason: 'wrong_recipient' | 'not_received' | 'charged_twice' | 'failed_but_debited' | 'other'
  details: string; createdAt: string; status: 'received' | 'investigating' | 'resolved' | 'escalated'
}
export type Customer = {
  name: string; phone: string; idNumber: string; idExpiry: string; dob: string
  kycStatus: KycStatus; kycMethod?: 'nfc' | 'vneid'; walletNumber: string
  /** Profile photo URL (stock, see public/avatar-minh-anh.jpg provenance). Initials show when absent. */
  photo?: string
}

export type World = {
  signedIn: boolean
  customer: Customer
  walletStatus: WalletStatus
  balance: number
  sources: FundingSource[]
  contacts: Contact[]
  bankRecipients: BankRecipient[]
  merchants: Merchant[]
  billers: Biller[]
  bills: SavedBill[]
  transactions: Transaction[]
  notifications: Notification[]
  support: SupportRequest[]
  security: { pin: string; deviceBiometric: boolean; pinAttemptsLeft: number; pinLockedUntil?: string; balanceHidden: boolean }
  dayCounter: { date: string; amount: number }
}

/* ── Seeded PRNG so every reset gives the same world ─────────────── */

export function rng(seed: number) {
  let s = seed >>> 0
  const next = () => {
    s = (s + 0x6d2b79f5) >>> 0
    let t = s
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
  return {
    next,
    int: (min: number, max: number) => Math.floor(next() * (max - min + 1)) + min,
    pick: <T,>(xs: readonly T[]) => xs[Math.floor(next() * xs.length)],
    round: (min: number, max: number, step: number) => Math.round((min + next() * (max - min)) / step) * step,
  }
}

/* ── Reference data ───────────────────────────────────────────────── */

export const BANKS: Bank[] = [
  { id: 'vcb', name: 'Vietcombank', short: 'VCB', bin: '970436' },
  { id: 'ctg', name: 'VietinBank', short: 'CTG', bin: '970415' },
  { id: 'bidv', name: 'BIDV', short: 'BIDV', bin: '970418' },
  { id: 'tcb', name: 'Techcombank', short: 'TCB', bin: '970407' },
  { id: 'mb', name: 'MB Bank', short: 'MB', bin: '970422' },
  { id: 'acb', name: 'ACB', short: 'ACB', bin: '970416' },
]
export const bankById = (id: string) => BANKS.find((b) => b.id === id)!
export const bankByBin = (bin: string) => BANKS.find((b) => b.bin === bin)

const FAMILY = ['Nguyễn', 'Trần', 'Lê', 'Phạm', 'Hoàng', 'Vũ', 'Đặng', 'Bùi', 'Đỗ', 'Hồ', 'Ngô', 'Dương']
const MIDDLE = ['Văn', 'Thị', 'Minh', 'Đức', 'Thu', 'Ngọc', 'Quốc', 'Hải', 'Thanh', 'Bảo']
const GIVEN = ['An', 'Bình', 'Châu', 'Dũng', 'Giang', 'Hà', 'Hiếu', 'Huyền', 'Khánh', 'Linh', 'Lộc', 'Mai', 'Nam', 'Ngân', 'Phúc', 'Quân', 'Quyên', 'Sơn', 'Thảo', 'Trang', 'Tuấn', 'Vy', 'Yến', 'Đạt']

const MERCHANTS: Omit<Merchant, 'id'>[] = [
  { name: 'Cà phê Góc Phố', category: 'Cà phê' }, { name: 'Highlands Lý Thái Tổ', category: 'Cà phê' },
  { name: 'Cộng Cà phê Tràng Thi', category: 'Cà phê', fixedAmount: 45_000 }, { name: 'Trà sữa Mây', category: 'Cà phê', fixedAmount: 38_000 },
  { name: 'Cà phê Muối Hồ Gươm', category: 'Cà phê' }, { name: 'Siêu thị Hàng Xanh', category: 'Siêu thị' },
  { name: 'Cửa hàng Tiện lợi 24h', category: 'Siêu thị' }, { name: 'Chợ Sạch Ba Đình', category: 'Siêu thị' },
  { name: 'Mini Mart Nắng Mai', category: 'Siêu thị' }, { name: 'Bún chả Hàng Mành', category: 'Nhà hàng', fixedAmount: 60_000 },
  { name: 'Phở Bát Đàn', category: 'Nhà hàng', fixedAmount: 55_000 }, { name: 'Lẩu Nấm Rừng Xanh', category: 'Nhà hàng' },
  { name: 'Cơm Tấm Phúc Lộc Thọ', category: 'Nhà hàng' }, { name: 'Bánh mì Phố Cổ', category: 'Nhà hàng', fixedAmount: 30_000 },
  { name: 'Quán Nướng Đêm Trắng', category: 'Nhà hàng' }, { name: 'Xăng dầu Kim Liên', category: 'Xăng dầu' },
  { name: 'Trạm xăng Ngọc Khánh', category: 'Xăng dầu' }, { name: 'Xăng dầu Cầu Giấy', category: 'Xăng dầu' },
  { name: 'Nhà thuốc An Khang Phúc', category: 'Nhà thuốc' }, { name: 'Nhà thuốc Thanh Tâm', category: 'Nhà thuốc' },
  { name: 'Hiệu sách Tràng Tiền', category: 'Mua sắm' }, { name: 'Giày Thể Thao Phố Huế', category: 'Mua sắm' },
  { name: 'Tiệm Hoa Hồng Nhung', category: 'Mua sắm' }, { name: 'Rạp phim Hòa Bình', category: 'Giải trí' },
  { name: 'Gym Năng Lượng Xanh', category: 'Giải trí' },
]

const BILLERS: Biller[] = [
  { id: 'evn-hh', name: 'Điện lực Hồng Hà', category: 'electricity', essential: true },
  { id: 'evn-dp', name: 'Điện lực Đông Phố', category: 'electricity', essential: true },
  { id: 'evn-th', name: 'Điện lực Tây Hồ Xanh', category: 'electricity', essential: true },
  { id: 'nuoc-sh', name: 'Nước sạch Sông Hồng', category: 'water', essential: true, p1: true },
  { id: 'net-mx', name: 'Internet Mây Xanh', category: 'internet', essential: true, p1: true },
]

/* ── Helpers ──────────────────────────────────────────────────────── */

const DAY = 86_400_000
export const isoAgo = (now: number, ms: number) => new Date(now - ms).toISOString()
export const txId = (n: number) => 'WL' + String(260_000_000_000 + n * 7919).padStart(12, '0')

export type Scenario = 'new' | 'unverified' | 'no-source' | 'ready' | 'id-expiring' | 'suspended' | 'near-limit' | 'rich'
export const SCENARIOS: { id: Scenario; label: string; hint: string }[] = [
  { id: 'new', label: 'Người dùng mới', hint: 'Chưa có ví, bắt đầu ở Mở ví' },
  { id: 'unverified', label: 'Chưa xác thực', hint: 'Đã mở ví, chưa xác thực sinh trắc học' },
  { id: 'no-source', label: 'Chưa liên kết ngân hàng', hint: 'Đã xác thực, chưa có nguồn tiền' },
  { id: 'ready', label: 'Sẵn sàng', hint: 'Mặc định: 3 nguồn tiền, đủ lịch sử' },
  { id: 'id-expiring', label: 'CCCD sắp hết hạn', hint: 'Hết hạn sau 21 ngày' },
  { id: 'suspended', label: 'Tạm ngừng', hint: 'CCCD đã hết hạn' },
  { id: 'near-limit', label: 'Gần hết hạn mức', hint: 'Đã dùng 97,5tr/100tr tháng này' },
  { id: 'rich', label: 'Số dư lớn', hint: 'Số dư 12 ký tự' },
]

/* ── The generator ────────────────────────────────────────────────── */

export function seedWorld(scenario: Scenario, now: number): World {
  const r = rng(20261117)
  const contacts: Contact[] = Array.from({ length: 40 }, (_, i) => ({
    id: `c${i + 1}`,
    name: i === 0 ? 'Nguyễn Hoàng Phương Thảo Nguyệt Quỳnh Như' : `${r.pick(FAMILY)} ${r.pick(MIDDLE)} ${r.pick(GIVEN)}`,
    phone: '09' + String(r.int(10_000_000, 99_999_999)),
    hasWallet: i < 32,
  }))
  const family = contacts[1], landlord = contacts[2], friends = contacts.slice(3, 12)
  family.name = 'Trần Văn Hải'
  landlord.name = 'Lê Thị Thu Hà'
  const merchants: Merchant[] = MERCHANTS.map((m, i) => ({ ...m, id: `m${String(i + 1).padStart(2, '0')}` }))
  const sources: FundingSource[] = [
    { id: 's1', bankId: 'vcb', kind: 'account', last4: '6789', isDefault: true },
    { id: 's2', bankId: 'tcb', kind: 'account', last4: '2468', isDefault: false },
    { id: 's3', bankId: 'mb', kind: 'debit_card', last4: '1357', isDefault: false },
  ]
  const bankRecipients: BankRecipient[] = [
    { id: 'br1', bankId: 'bidv', account: '21510001234567', holder: 'TRAN VAN HAI' },
    { id: 'br2', bankId: 'acb', account: '19034567', holder: 'LE THI THU HA' },
    { id: 'br3', bankId: 'ctg', account: '106870123456', holder: 'CONG TY TNHH NANG MAI' },
    { id: 'br4', bankId: 'vcb', account: '0451000987654', holder: 'PHAM QUOC BAO' },
    { id: 'br5', bankId: 'tcb', account: '19033445566011', holder: 'DO NGOC MAI' },
    { id: 'br6', bankId: 'mb', account: '0868123456', holder: 'HOANG MINH DUC' },
  ]

  const txs: Transaction[] = []
  let n = 0
  const add = (t: Omit<Transaction, 'id' | 'fee' | 'updatedAt' | 'direction'> & { fee?: number; direction?: 'in' | 'out' }) => {
    const tx: Transaction = {
      fee: 0, direction: t.type === 'topup' || t.type === 'p2p_in' || t.type === 'refund' ? 'in' : 'out',
      updatedAt: t.createdAt, id: txId(++n), ...t,
    }
    txs.push(tx)
    return tx
  }
  const at = (daysAgo: number, hour: number, min = 0) => {
    const d = new Date(now - daysAgo * DAY)
    // set Vietnam local hour (UTC+7)
    d.setUTCHours(hour - 7, min, 0, 0)
    return d.toISOString()
  }

  // 12 months of life: salary top-ups, rent, family, coffee, groceries, electricity.
  for (let m = 11; m >= 0; m--) {
    const base = m * 30
    add({ type: 'topup', status: 'success', amount: 12_000_000, counterparty: { kind: 'source', id: 's1' }, sourceId: 's1', authMethod: 'face_match', createdAt: at(base + 25, 9, 12) })
    add({ type: 'bank_transfer', status: 'success', amount: 6_500_000, counterparty: { kind: 'bank', bankId: 'acb', account: '19034567', holder: 'LE THI THU HA' }, message: 'Tien nha thang', authMethod: 'pin', createdAt: at(base + 24, 20, 5) })
    add({ type: 'p2p_out', status: 'success', amount: r.round(2_000_000, 5_000_000, 500_000), counterparty: { kind: 'contact', id: family.id, name: family.name, phone: family.phone }, message: 'Con gửi bố mẹ', authMethod: 'pin', createdAt: at(base + 23, 19, 40) })
    add({ type: 'bill', status: 'success', amount: r.round(450_000, 1_400_000, 1_000), essential: true, counterparty: { kind: 'biller', id: 'evn-hh', name: 'Điện lực Hồng Hà', billId: 'b1' }, authMethod: 'pin', createdAt: at(base + 12, 21, 3) })
    const outings = m === 0 ? 0 : r.int(11, 15)
    for (let k = 0; k < outings; k++) {
      const merchant = r.pick(merchants)
      const amount = merchant.fixedAmount ?? (merchant.category === 'Siêu thị' ? r.round(150_000, 1_200_000, 1_000) : merchant.category === 'Xăng dầu' ? r.round(80_000, 250_000, 1_000) : r.round(35_000, 450_000, 1_000))
      add({ type: 'qr_merchant', status: 'success', amount, counterparty: { kind: 'merchant', id: merchant.id, name: merchant.name }, authMethod: 'pin', createdAt: at(base + r.int(1, 29), r.int(7, 21), r.int(0, 59)) })
    }
    if (m > 0) {
      const f = r.pick(friends)
      add({ type: 'p2p_in', status: 'success', amount: r.round(100_000, 800_000, 10_000), counterparty: { kind: 'contact', id: f.id, name: f.name, phone: f.phone }, message: 'Trả tiền ăn trưa', createdAt: at(base + r.int(1, 28), 12, 30) })
    }
  }

  // This month (~62% of the general limit): rent, family, a couple of transfers, coffees.
  const mDay = (d: number) => Math.max(0, Math.min(d, Number(new Date(now + 7 * 3600_000).toISOString().slice(8, 10)) - 1))
  add({ type: 'topup', status: 'success', amount: 30_000_000, counterparty: { kind: 'source', id: 's1' }, sourceId: 's1', authMethod: 'face_match', createdAt: at(mDay(15), 8, 50) })
  add({ type: 'bank_transfer', status: 'success', amount: 6_500_000, counterparty: { kind: 'bank', bankId: 'acb', account: '19034567', holder: 'LE THI THU HA' }, message: 'Tien nha T11', authMethod: 'pin', createdAt: at(mDay(14), 20, 15) })
  add({ type: 'bank_transfer', status: 'success', amount: 45_000_000, counterparty: { kind: 'bank', bankId: 'ctg', account: '106870123456', holder: 'CONG TY TNHH NANG MAI' }, message: 'Dat coc khoa hoc', authMethod: 'face_match', createdAt: at(mDay(10), 10, 20) })
  add({ type: 'p2p_out', status: 'success', amount: 4_000_000, counterparty: { kind: 'contact', id: family.id, name: family.name, phone: family.phone }, message: 'Con gửi bố mẹ', authMethod: 'pin', createdAt: at(mDay(13), 19, 10) })
  for (let k = 0; k < 9; k++) {
    const merchant = merchants[k % 6]
    add({ type: 'qr_merchant', status: 'success', amount: merchant.fixedAmount ?? r.round(35_000, 350_000, 1_000), counterparty: { kind: 'merchant', id: merchant.id, name: merchant.name }, authMethod: 'pin', createdAt: at(mDay(k + 1), 8 + k, 15) })
  }
  add({ type: 'p2p_out', status: 'success', amount: 2_350_000, counterparty: { kind: 'contact', id: friends[0].id, name: friends[0].name, phone: friends[0].phone }, message: 'Tiền vé concert', authMethod: 'pin', createdAt: at(mDay(5), 22, 10) })

  // Hand-made edge cases (mock-data.md).
  const refunded = add({ type: 'qr_merchant', status: 'refunded', amount: 1_150_000, counterparty: { kind: 'merchant', id: 'm22', name: 'Giày Thể Thao Phố Huế' }, authMethod: 'pin', createdAt: at(9, 18, 22) })
  const refund = add({ type: 'refund', status: 'success', amount: 1_150_000, counterparty: { kind: 'merchant', id: 'm22', name: 'Giày Thể Thao Phố Huế' }, refundOf: refunded.id, createdAt: at(8, 10, 5) })
  refunded.refundedBy = refund.id
  add({ type: 'bank_transfer', status: 'failed', amount: 3_200_000, failureReason: 'timeout_reversed', counterparty: { kind: 'bank', bankId: 'tcb', account: '19033445566011', holder: 'DO NGOC MAI' }, message: 'Gop quy du lich', authMethod: 'pin', createdAt: at(6, 16, 40), reversedAt: at(6, 17, 10) })
  add({ type: 'bill', status: 'pending', pendingReason: 'biller_settling', amount: 912_000, essential: true, counterparty: { kind: 'biller', id: 'evn-dp', name: 'Điện lực Đông Phố', billId: 'b3' }, authMethod: 'pin', createdAt: isoAgo(now, 50 * 60_000) })
  add({ type: 'bank_transfer', status: 'pending', pendingReason: 'bank_processing', amount: 1_200_000, counterparty: { kind: 'bank', bankId: 'bidv', account: '21510001234567', holder: 'TRAN VAN HAI' }, message: 'Bo mua thuoc', authMethod: 'pin', createdAt: isoAgo(now, 20 * 60_000) })
  add({ type: 'p2p_in', status: 'success', amount: 500_000, counterparty: { kind: 'contact', id: friends[2].id, name: friends[2].name, phone: friends[2].phone }, message: 'Gửi lại tiền taxi', createdAt: isoAgo(now, 3 * 3600_000) })

  txs.sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  // Recent recipients
  for (const t of txs) if (t.counterparty.kind === 'contact' && t.type === 'p2p_out') {
    const c = contacts.find((x) => x.id === (t.counterparty as { id: string }).id)!
    c.lastTransferAt ??= t.createdAt
  }

  const ymd = (ms: number) => new Date(ms + 7 * 3600_000).toISOString().slice(0, 10)
  const period = new Date(now + 7 * 3600_000 - 20 * DAY).toISOString().slice(0, 7)
  const bills: SavedBill[] = [
    { id: 'b1', billerId: 'evn-hh', customerCode: 'PD12000345678', holder: 'TRẦN MINH ANH', address: '18 ngõ 34 Hoàng Cầu, Đống Đa', period, amount: 1_086_000, dueDate: ymd(now + 3 * DAY), status: 'due' },
    { id: 'b2', billerId: 'evn-th', customerCode: 'TH05000112233', holder: 'TRẦN VĂN HẢI', address: '7 Yên Phụ, Tây Hồ', period, amount: 640_000, dueDate: ymd(now - 6 * DAY), status: 'paid' },
    { id: 'b3', billerId: 'evn-dp', customerCode: 'DP09000654321', holder: 'TRẦN MINH ANH', address: '22 Lò Đúc, Hai Bà Trưng', period, amount: 912_000, dueDate: ymd(now + 9 * DAY), status: 'settling' },
  ]

  const notifications: Notification[] = []
  for (const t of txs.slice(0, 50)) {
    if (t.status === 'pending') continue
    notifications.push({
      id: 'n' + t.id, kind: 'balance_change', createdAt: t.updatedAt, read: true,
      title: t.direction === 'in' ? 'Tiền vào ví' : 'Tiền ra khỏi ví',
      body: '', link: `/history/${t.id}`,
    })
  }
  notifications.push({ id: 'n-bill', kind: 'bill_due', createdAt: isoAgo(now, 2 * 3600_000), read: false, title: 'Hóa đơn điện sắp đến hạn', body: 'Điện lực Hồng Hà · hạn thanh toán trong 3 ngày', link: '/bills/b1' })
  notifications.push({ id: 'n-login', kind: 'new_device_login', createdAt: isoAgo(now, 4 * DAY), read: true, title: 'Đăng nhập trên thiết bị mới', body: 'iPhone 15 · Hà Nội. Nếu không phải bạn, hãy đổi mã PIN ngay.', link: '/me/security' })
  notifications.push({ id: 'n-support', kind: 'support_update', createdAt: isoAgo(now, 5 * DAY), read: true, title: 'Yêu cầu hỗ trợ đã được xử lý', body: 'HT20261102 · Giao dịch đã được hoàn tiền', link: '/support' })
  notifications.sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  notifications.slice(0, 7).forEach((x) => (x.read = false))

  const balanceFromHistory = 4_870_000
  const world: World = {
    signedIn: true,
    customer: {
      name: 'Trần Minh Anh', phone: '0901234567', idNumber: '001099012345', dob: '1999-04-12',
      idExpiry: ymd(now + 4 * 365 * DAY), kycStatus: 'verified', kycMethod: 'nfc', walletNumber: '0901234567',
      photo: '/avatar-minh-anh.jpg',
    },
    walletStatus: 'active',
    balance: balanceFromHistory,
    sources, contacts, bankRecipients, merchants, billers: BILLERS, bills,
    transactions: txs, notifications,
    support: [
      { id: 'HT20261102', transactionId: txs.find((t) => t.status === 'refunded')?.id, reason: 'charged_twice', details: 'Bị trừ tiền hai lần khi mua giày.', createdAt: isoAgo(now, 9 * DAY), status: 'resolved' },
      { id: 'HT20261115', reason: 'other', details: 'Hỏi về hạn mức chuyển tiền tháng này.', createdAt: isoAgo(now, 2 * DAY), status: 'received' },
    ],
    security: { pin: '123456', deviceBiometric: false, pinAttemptsLeft: 5, balanceHidden: false },
    dayCounter: { date: ymd(now), amount: 1_200_000 },
  }

  switch (scenario) {
    case 'new':
      world.signedIn = false
      world.customer.kycStatus = 'unverified'
      world.sources = []
      world.balance = 0
      world.transactions = []
      world.notifications = []
      world.support = []
      world.bills = []
      break
    case 'unverified':
      world.customer.kycStatus = 'unverified'
      world.customer.kycMethod = undefined
      world.sources = []
      world.balance = 0
      world.transactions = []
      world.notifications = []
      world.support = []
      world.bills = []
      break
    case 'no-source':
      world.sources = []
      world.balance = 0
      world.transactions = []
      world.notifications = []
      world.support = []
      world.bills = []
      break
    case 'id-expiring':
      world.customer.idExpiry = ymd(now + 21 * DAY)
      world.customer.kycStatus = 'id_expiring'
      world.notifications.unshift({ id: 'n-id', kind: 'id_expiring', createdAt: isoAgo(now, 3600_000), read: false, title: 'CCCD sắp hết hạn', body: 'CCCD của bạn hết hạn sau 21 ngày. Cập nhật để không bị gián đoạn giao dịch.', link: '/me/profile' })
      break
    case 'suspended':
      world.customer.idExpiry = ymd(now - 2 * DAY)
      world.customer.kycStatus = 'id_expired'
      world.walletStatus = 'suspended'
      break
    case 'near-limit':
      add({ type: 'bank_transfer', status: 'success', amount: 35_500_000, counterparty: { kind: 'bank', bankId: 'vcb', account: '0451000987654', holder: 'PHAM QUOC BAO' }, message: 'Mua xe may', authMethod: 'face_match', createdAt: isoAgo(now, 5 * 3600_000) })
      world.transactions.sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      break
    case 'rich':
      world.balance = 128_450_000
      break
  }
  return world
}

/** Sample QR library for /pay/scan on web and in demo (mock-data.md). */
export function sampleQrs(world: World) {
  const m = (id: string) => world.merchants.find((x) => x.id === id)!
  return [
    { id: 'q1', label: 'Cà phê Góc Phố', hint: 'QR quầy', payload: buildQr({ kind: 'merchant', merchantId: 'm01', name: m('m01').name }) },
    { id: 'q2', label: 'Cộng Cà phê Tràng Thi', hint: 'QR quầy · 45.000 ₫', payload: buildQr({ kind: 'merchant', merchantId: 'm03', name: m('m03').name, amount: 45_000 }) },
    { id: 'q3', label: 'Siêu thị Hàng Xanh', hint: 'QR quầy', payload: buildQr({ kind: 'merchant', merchantId: 'm06', name: m('m06').name }) },
    { id: 'q4', label: 'BIDV · Trần Văn Hải', hint: 'VietQR ngân hàng', payload: buildQr({ kind: 'vietqr', bin: '970418', account: '21510001234567' }) },
    { id: 'q5', label: 'ACB · Lê Thị Thu Hà', hint: 'VietQR · 6.500.000 ₫', payload: buildQr({ kind: 'vietqr', bin: '970416', account: '19034567', amount: 6_500_000, message: 'Tien nha' }) },
    { id: 'q6', label: world.contacts[3].name, hint: 'Mã nhận tiền ví', payload: buildQr({ kind: 'wallet', phone: world.contacts[3].phone }) },
    { id: 'q7', label: world.contacts[4].name, hint: 'Mã nhận tiền ví · 200.000 ₫', payload: buildQr({ kind: 'wallet', phone: world.contacts[4].phone, amount: 200_000 }) },
    { id: 'q8', label: 'Mã không hợp lệ', hint: 'Không phải QR thanh toán', payload: 'https://example.com/khuyen-mai' },
  ]
}
