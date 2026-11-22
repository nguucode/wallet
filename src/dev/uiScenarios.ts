// Dev-only: the scripted states the UI checker walks (src/dev/uiCheck.ts) besides plain routes: every flow to its
// confirm, auth and result (success, pending, failed), the sheets, menus and dialogs, and onboarding. Run with
// `__uiCheckAll({ routes: __uiScenarios, width, mode })` at 1280 and 390, light and dark.
import type { Scenario, Step } from './uiCheck'

const fresh: Step[] = [{ store: ['setScenario', 'ready'] }, { store: ['setSetting', 'latency', 'none'] }]
const pin: Step[] = [{ check: 'auth' }, { fill: ['#pin-input', '123456'] }, { wait: 1500 }, { check: 'result' }]
const outcome = (o: 'success' | 'pending' | 'failed'): Step[] => [...fresh, { store: ['setSetting', 'nextOutcome', o] }]

const bank = (o: 'success' | 'pending' | 'failed'): Scenario => ({
  name: `bank-${o}`, route: '/transfer/bank', steps: [
    ...outcome(o), { click: 'TRAN VAN HAI' }, { wait: 800 }, { check: 'recipient found' }, { click: 'Tiếp tục' }, { check: 'amount' },
    { fill: ['#amount', '200000'] }, { click: 'Tiếp tục' }, { check: 'confirm' }, { click: 'Xác nhận' }, ...pin,
  ],
})

export const SCENARIOS: Scenario[] = [
  { name: 'topup', route: '/topup', steps: [...fresh, { fill: ['#amount', '100000'] }, { check: 'amount' }, { click: 'Tiếp tục' }, { check: 'confirm' }, { click: 'Xác nhận' }, ...pin] },
  { name: 'topup-error', route: '/topup', steps: [...fresh, { fill: ['#amount', '999999999999'] }, { check: 'amount too large' }] },
  { name: 'withdraw', route: '/withdraw', steps: [...fresh, { fill: ['#amount', '500000'] }, { click: 'Tiếp tục' }, { check: 'confirm' }, { click: 'Xác nhận' }, ...pin] },
  { name: 'wallet', route: '/transfer/wallet', steps: [...fresh, { fill: ['#recipient-search', 'Bùi'] }, { check: 'search' }, { click: 'Bùi Thu Bình' }, { check: 'amount' }, { fill: ['#amount', '50000'] }, { click: 'Tiếp tục' }, { check: 'confirm' }, { click: 'Xác nhận' }, ...pin] },
  bank('success'), bank('pending'), bank('failed'),
  { name: 'bank-lookup', route: '/transfer/bank', steps: [...fresh, { click: 'Chọn ngân hàng' }, { check: 'bank picker' }, { click: 'BIDV' }, { fill: ['#account', '0001234567'] }, { click: 'Kiểm tra' }, { wait: 800 }, { check: 'not found' }] },
  { name: 'merchant', route: '/pay/scan', steps: [...fresh, { click: 'Mã mẫu', optional: true }, { click: 'Cà phê Góc Phố' }, { wait: 800 }, { check: 'merchant amount' }, { fill: ['#amount', '45000'] }, { click: 'Tiếp tục' }, { check: 'confirm' }, { click: 'Xác nhận' }, ...pin] },
  { name: 'bill-pay', route: '/bills/b1', steps: [...fresh, { click: 'Thanh toán' }, { wait: 800 }, { check: 'confirm' }, { click: 'Xác nhận' }, ...pin] },
  { name: 'bill-add', route: '/bills/new', steps: [...fresh, { click: 'Điện lực Hồng Hà' }, { check: 'code' }, { click: 'XX01234567890' }, { click: 'Tra cứu' }, { wait: 800 }, { check: 'not found' }, { click: 'HH01234560000' }, { click: 'Tra cứu' }, { wait: 800 }, { check: 'no debt' }] },
  { name: 'support', route: '/support/new?tx=WL260001773856', steps: [...fresh, { check: 'reason' }, { click: 'Người nhận chưa nhận được tiền' }, { click: 'Tiếp tục' }, { check: 'details' }, { fill: ['#sp-details', 'Người nhận báo chưa thấy tiền sau hai giờ.'] }, { click: 'Gửi yêu cầu' }, { wait: 1000 }, { check: 'sent' }] },
  { name: 'link-bank', route: '/me/sources/link', steps: [...fresh, { click: 'BIDV' }, { wait: 600 }, { check: 'details' }] },
  { name: 'source-sheet', route: '/topup', steps: [...fresh, { click: 'Vietcombank' }, { check: 'open' }] },
  { name: 'source-options', route: '/me/sources', steps: [...fresh, { click: 'Tùy chọn Techcombank 2468' }, { check: 'open' }] },
  { name: 'demo-controls', route: '/home', steps: [...fresh, { click: 'Demo controls' }, { check: 'open' }] },
  { name: 'account-menu', route: '/home', steps: [...fresh, { click: 'Trần Minh Anh', optional: true }, { check: 'menu (web)' }, { click: 'Đăng xuất…', optional: true }, { wait: 500 }, { check: 'sign-out confirm' }] },
  { name: 'sign-out-app', route: '/me', steps: [...fresh, { click: 'Đăng xuất', optional: true }, { check: 'confirm' }] },
  { name: 'history-filter', route: '/history', steps: [...fresh, { click: 'Bộ lọc', optional: true }, { check: 'filter sheet (app)' }] },
  { name: 'receive-amount', route: '/receive', steps: [...fresh, { click: 'Thêm số tiền' }, { check: 'sheet' }, { fill: ['#amount', '150000'] }, { click: 'Xong' }, { check: 'with amount' }] },
  { name: 'change-pin', route: '/me/security', steps: [...fresh, { click: 'Đổi mã PIN' }, { check: 'sheet' }] },
  { name: 'scan-samples', route: '/pay/scan', steps: [...fresh, { click: 'Mã mẫu', optional: true }, { check: 'samples (app)' }] },
  { name: 'pending-resolved', route: '/history/WL260001773856', steps: [...fresh, { store: ['resolvePending', 'failed'] }, { wait: 600 }, { check: 'failed detail' }] },
  { name: 'onboarding', route: '/onboarding', steps: [
    { store: ['setScenario', 'new'] }, { store: ['setSetting', 'latency', 'none'] }, { wait: 600 }, { check: 'phone' },
    { fill: ['#phone', '0901234567'] }, { click: 'Tiếp tục' }, { wait: 800 }, { check: 'otp' },
    { fill: ['#otp', '123456'] }, { wait: 1200 }, { check: 'pin' },
    { fill: ['#pin-input', '123456'] }, { wait: 800 }, { fill: ['#pin-input', '123456'] }, { wait: 1200 }, { check: 'id method' },
    { click: 'Tài khoản VNeID' }, { check: 'vneid' }, { click: 'Mở VNeID', optional: true }, { check: 'vneid sheet (app)' },
    { click: 'Đồng ý chia sẻ', optional: true }, { wait: 1500 }, { check: 'after vneid' },
    { store: ['setScenario', 'ready'] },
  ] },
]
