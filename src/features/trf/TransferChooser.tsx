import { shortName } from '@/features/hom/selectors'
import { Landmark, ScanLine, Wallet } from 'lucide-react'
import { useLayout } from '@/app/layout'
import { bankById, useWorld } from '@/app/store'
import { GatedRoute } from '@/features/sec/Gate'
import { formatPhone, maskAccount } from '@/features/flow/FlowKit'
import { Avatar, BankMark, Card, Disc, Ico, RailTile, Row, Section } from '@/components/app-ui'
import { Box } from '@/components/ui/box'
import { HStack } from '@/components/ui/hstack'
import { Text } from '@/components/ui/text'
import { VStack } from '@/components/ui/vstack'
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
    <Card className="p-0 overflow-hidden">
      <VStack role="list" className="divide-y divide-border">
        {OPTIONS.map(({ to, icon, title, sub }) => (
          <Box key={to} role="listitem">
            <Row to={to} left={<Disc size={40}><Ico as={icon} size="md" /></Disc>} title={title} subtitle={sub} chevron />
          </Box>
        ))}
      </VStack>
    </Card>
  )
  const empty = <Text className="text-muted-foreground">Chưa có người nhận gần đây.</Text>

  const recentWeb = recent.length ? (
    <Card className="p-0 overflow-hidden">
      <VStack role="list" className="divide-y divide-border">
        {recent.map((r) => (
          <Box key={r.key} role="listitem">
            <Row
              to={recentLink(r, w.bankRecipients)}
              left={r.kind === 'wallet' ? <Avatar name={r.name} size={40} /> : <BankMark short={bankById(r.bankId).short} size={40} />}
              title={<Text title={name(r)}>{name(r)}</Text>}
              subtitle={r.kind === 'wallet' ? formatPhone(r.phone) : <Text className="whitespace-nowrap">{bankById(r.bankId).name} · {maskAccount(r.account)}</Text>}
            />
          </Box>
        ))}
      </VStack>
    </Card>
  ) : empty

  // Same rail spec as Home's recipients: 72px items, 56px avatars, 8px gap, first avatar on the title edge.
  const recentApp = recent.length ? (
    <HStack role="list" className="-mx-4 gap-2 overflow-x-auto pr-4 pb-1 pl-2">
      {recent.map((r) => (
        <Box key={r.key} role="listitem" className="w-[72px] shrink-0">
          <RailTile
            to={recentLink(r, w.bankRecipients)} label={name(r)} name={shortName(name(r))} sub={r.kind === 'wallet' ? undefined : bankById(r.bankId).name}
            leading={r.kind === 'wallet' ? <Avatar name={r.name} size={56} /> : <BankMark short={bankById(r.bankId).short} size={56} />}
          />
        </Box>
      ))}
    </HStack>
  ) : empty

  return (
    <Box>
      <PageHeading>Chuyển tiền</PageHeading>
      <GatedRoute>
        {layout === 'web' ? (
          <>
            {options}
            <Section title="Gần đây">{recentWeb}</Section>
          </>
        ) : (
          <>
            <Box className="mt-2">{options}</Box>
            <Section title="Gần đây">{recentApp}</Section>
          </>
        )}
      </GatedRoute>
    </Box>
  )
}
