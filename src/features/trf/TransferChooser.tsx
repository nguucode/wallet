import { ChevronRight, Landmark, ScanLine, Wallet } from 'lucide-react'
import { Link } from 'react-router'
import { useLayout } from '@/app/layout'
import { bankById, useWorld } from '@/app/store'
import { GatedRoute } from '@/features/sec/Gate'
import { formatPhone, maskAccount } from '@/features/flow/FlowKit'
import { Avatar, BankMark, Card, Disc, Row, Section } from '@/components/ui'
import { recentRecipients, type Recent } from './logic'
import { PageHeading } from './shared'

const OPTIONS = [
  { to: '/transfer/wallet?step=recipient', icon: Wallet, title: 'Đến ví', sub: 'Số điện thoại hoặc danh bạ' },
  { to: '/transfer/bank?step=recipient', icon: Landmark, title: 'Đến ngân hàng', sub: 'Số tài khoản hoặc người nhận đã lưu' },
  { to: '/pay/scan', icon: ScanLine, title: 'Quét mã VietQR', sub: 'Quét hoặc tải ảnh mã của người nhận' },
]

export function recentLink(r: Recent, bankRecipients: { id: string; bankId: string; account: string }[]) {
  if (r.kind === 'wallet') return `/transfer/wallet?contact=${encodeURIComponent(r.id)}`
  const saved = bankRecipients.find((b) => b.bankId === r.bankId && b.account === r.account)
  return `/transfer/bank?step=recipient${saved ? `&recipient=${saved.id}` : ''}`
}

export default function TransferChooser() {
  const w = useWorld()
  const layout = useLayout()
  const recent = recentRecipients(w.transactions, 8)
  const name = (r: Recent) => (r.kind === 'wallet' ? r.name : r.holder)

  const options = (
    <Card className="px-inset">
      <ul className="divide-y divide-line-soft">
        {OPTIONS.map(({ to, icon: Icon, title, sub }) => (
          <li key={to}>
            <Row to={to} left={<Disc><Icon size={22} strokeWidth={1.75} /></Disc>} title={title} subtitle={sub} right={<ChevronRight size={20} strokeWidth={1.75} aria-hidden className="text-muted" />} />
          </li>
        ))}
      </ul>
    </Card>
  )
  const empty = <p className="text-muted">Chưa có người nhận gần đây.</p>

  const recentWeb = recent.length ? (
    <Card className="px-inset">
      <ul className="divide-y divide-line-soft">
        {recent.map((r) => (
          <li key={r.key}>
            <Row
              to={recentLink(r, w.bankRecipients)}
              left={r.kind === 'wallet' ? <Avatar name={r.name} /> : <BankMark short={bankById(r.bankId).short} />}
              title={<span title={name(r)}>{name(r)}</span>}
              subtitle={r.kind === 'wallet' ? formatPhone(r.phone) : <span className="whitespace-nowrap">{bankById(r.bankId).name} · {maskAccount(r.account)}</span>}
            />
          </li>
        ))}
      </ul>
    </Card>
  ) : empty

  // Same rail spec as Home's recipients: 72px items, 56px avatars, 8px gap, first avatar on the title edge.
  const recentApp = recent.length ? (
    <ul className="-mx-inset flex gap-header overflow-x-auto pr-inset pb-1 pl-2">
      {recent.map((r) => (
        <li key={r.key} className="w-[72px] shrink-0">
          <Link to={recentLink(r, w.bankRecipients)} title={name(r)} className="flex flex-col items-center gap-header rounded-xl py-1 text-center text-ink no-underline hover:bg-surface-2">
            {r.kind === 'wallet' ? <Avatar name={r.name} size={56} /> : <BankMark short={bankById(r.bankId).short} size={56} />}
            <span className="line-clamp-2 text-[12px] leading-4">{name(r)}</span>
          </Link>
        </li>
      ))}
    </ul>
  ) : empty

  return (
    <div>
      <PageHeading>Chuyển tiền</PageHeading>
      <GatedRoute>
        {layout === 'web' ? (
          <>
            {options}
            <Section title="Gần đây">{recentWeb}</Section>
          </>
        ) : (
          <>
            <div className="mt-header">{options}</div>
            <Section title="Gần đây">{recentApp}</Section>
          </>
        )}
      </GatedRoute>
    </div>
  )
}
