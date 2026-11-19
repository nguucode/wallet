import { Link } from 'react-router'
import { cx } from '@/components/ui'

/** Web only: sidebar "Thanh toán" lands on Payment Code; Scan sits beside it (sitemap note). */
export function PayTabs({ active }: { active: 'code' | 'scan' }) {
  const tab = (id: 'code' | 'scan', to: string, label: string) => (
    <Link
      to={to} aria-current={active === id ? 'page' : undefined}
      className={cx('inline-flex h-11 items-center rounded-full border px-5 text-[14px] font-medium no-underline', active === id ? 'border-tint bg-primary-soft text-primary-ink' : 'border-line text-ink hover:bg-surface-2')}
    >
      {label}
    </Link>
  )
  return (
    <nav aria-label="Thanh toán" className="mb-6 flex gap-2">
      {tab('code', '/pay/code', 'Mã thanh toán')}
      {tab('scan', '/pay/scan', 'Quét mã')}
    </nav>
  )
}
