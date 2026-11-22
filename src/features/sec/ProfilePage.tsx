import { Check, Clock, X } from 'lucide-react'
import type { ReactNode } from 'react'
import { gateOf, useWorld } from '@/app/store'
import { Avatar, Badge, Callout, Card, cx, DetailRows, Ico, Skeleton } from '@/components/app-ui'
import { Box } from '@/components/ui/box'
import { Text } from '@/components/ui/text'
import { VStack } from '@/components/ui/vstack'
import { formatPhone } from '@/features/flow/FlowKit'
import { fmtYmd } from '@/features/hom/selectors'
import { GateCallout } from './Gate'
import { KYC_LABEL, KYC_TONE, maskId, ScreenTitle, useLoaded, WALLET_LABEL } from './kit'

/** US-SEC-008. Nothing is editable in P0 (name and ID come from eKYC). */
export default function ProfilePage() {
  const w = useWorld()
  const loaded = useLoaded()
  const c = w.customer
  const gate = gateOf(w)
  const hasId = c.kycStatus !== 'unverified'
  const none = <Text className="text-muted-foreground">Chưa có</Text>
  const tone = KYC_TONE[c.kycStatus]
  const KycIcon = tone === 'success' ? Check : tone === 'pending' ? Clock : X
  const kycColor = tone === 'success' ? 'text-success' : tone === 'pending' ? 'text-muted-foreground' : 'text-destructive'

  const rows: [string, ReactNode][] = [
    ['Họ và tên', c.name],
    ['Số điện thoại', <Text className="tabular-nums">{formatPhone(c.phone)}</Text>],
    ['Số ví', <Text className="tabular-nums">{formatPhone(c.walletNumber)}</Text>],
    ['Số CCCD', hasId ? <Text className="whitespace-nowrap tabular-nums">{maskId(c.idNumber)}</Text> : none],
    ['Ngày hết hạn CCCD', hasId ? <Text className="tabular-nums">{fmtYmd(c.idExpiry)}</Text> : none],
    ['Phương thức xác thực', c.kycMethod ? (c.kycMethod === 'nfc' ? 'Chip CCCD (NFC)' : 'VNeID') : none],
    ['Trạng thái xác thực', (
      // DetailRows puts the value inside a Text (span), so only inline pieces here.
      <Text className={cx('font-medium', kycColor)}><Ico as={KycIcon} size="sm" className={cx('mr-2 inline-block align-middle', kycColor)} />{KYC_LABEL[c.kycStatus]}</Text>
    )],
    ['Trạng thái ví', (
      <Text className={cx('font-medium', w.walletStatus === 'active' ? 'text-success' : 'text-destructive')}>
        <Text aria-hidden className={cx('mr-2 inline-block size-2 rounded-full align-middle', w.walletStatus === 'active' ? 'bg-success' : 'bg-destructive')} />{WALLET_LABEL[w.walletStatus]}
      </Text>
    )],
  ]

  return (
    <Box>
      <ScreenTitle>Hồ sơ và xác thực</ScreenTitle>
      <Card className="flex-row items-center gap-4">
        <Avatar name={c.name} src={c.photo} size={64} />
        <VStack className="min-w-0 flex-1 items-start gap-1 pt-1">
          <Text size="lg" bold className="break-words">{c.name}</Text>
          <Badge tone={tone}>{KYC_LABEL[c.kycStatus]}</Badge>
        </VStack>
      </Card>

      {c.kycStatus === 'id_expiring' ? (
        <Box className="mt-6 mac:mt-5"><Callout tone="pending" title={`CCCD của bạn hết hạn vào ${fmtYmd(c.idExpiry)}. Sau ngày này ví sẽ tạm ngừng giao dịch.`} /></Box>
      ) : null}
      {gate ? <Box className="mt-6 mac:mt-5"><GateCallout gate={gate} /></Box> : null}

      <Card inset="rows" className="mt-6 mac:mt-5">
        <DetailRows rows={rows.map(([k, v]) => [k, loaded ? v : <Skeleton className="ml-auto h-4 w-28" />] as [string, React.ReactNode])} />
      </Card>
    </Box>
  )
}
