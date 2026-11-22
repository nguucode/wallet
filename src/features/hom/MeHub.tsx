import { maskAccount } from '@/app/format'
import { Gauge, HelpCircle, Landmark, ShieldCheck, User } from 'lucide-react'
import { useState } from 'react'
import { useNavigate } from 'react-router'
import { bankById, defaultSource, signOut, useWorld } from '@/app/store'
import { Avatar, Badge, Card, Confirm, Disc, Ico, Row, Skeleton, useLinkPress } from '@/components/app-ui'
import { Box } from '@/components/ui/box'
import { HStack } from '@/components/ui/hstack'
import { Pressable } from '@/components/ui/pressable'
import { Text } from '@/components/ui/text'
import { VStack } from '@/components/ui/vstack'
import { formatPhone } from '@/features/flow/FlowKit'
import { KYC_LABEL, KYC_TONE, ScreenTitle, useLoaded } from '@/features/sec/kit'

const VERIFY = '/onboarding?step=id-method'

/** US-HOM-007. App only: App.tsx redirects web to /me/profile. */
export default function MeHub() {
  const w = useWorld()
  const nav = useNavigate()
  const loaded = useLoaded()
  const verifyPress = useLinkPress(VERIFY)
  const [confirm, setConfirm] = useState(false)
  const src = defaultSource(w)
  const kyc = w.customer.kycStatus
  const badge = <Badge tone={KYC_TONE[kyc]}>{KYC_LABEL[kyc]}</Badge>

  const links = [
    { label: 'Nguồn tiền', to: '/me/sources', icon: Landmark, sub: src ? `${bankById(src.bankId).name} · ${maskAccount(src.last4)}` : 'Chưa liên kết' },
    { label: 'Hạn mức', to: '/me/limits', icon: Gauge },
    { label: 'Bảo mật', to: '/me/security', icon: ShieldCheck },
    { label: 'Hồ sơ và xác thực', to: '/me/profile', icon: User },
    { label: 'Trợ giúp', to: '/support', icon: HelpCircle },
  ]

  return (
    <Box>
      <ScreenTitle>Tôi</ScreenTitle>
      <Card>
        {!loaded ? (
          <HStack className="items-center gap-3" aria-hidden>
            <Skeleton className="size-14 rounded-full" />
            <VStack className="flex-1 gap-2"><Skeleton className="h-5 w-1/2" /><Skeleton className="h-4 w-1/3" /></VStack>
          </HStack>
        ) : (
          <HStack className="items-start gap-3">
            <Avatar name={w.customer.name} src={w.customer.photo} size={56} />
            <VStack className="min-w-0 flex-1">
              <Text size="lg" bold className="break-words">{w.customer.name}</Text>
              <Text className="tabular-nums text-muted-foreground">Số ví {formatPhone(w.customer.walletNumber)}</Text>
              <Box className="mt-2 items-start">
                {kyc === 'unverified' ? (
                  <Pressable href={VERIFY} role="link" onPress={verifyPress} aria-label="Chưa xác thực. Xác thực ngay" className="min-h-11 justify-center">{badge}</Pressable>
                ) : badge}
              </Box>
            </VStack>
          </HStack>
        )}
      </Card>

      <Box role="navigation" aria-label="Tài khoản" className="mt-6 mac:mt-5">
        <Card inset="rows">
          <VStack role="list" className="divide-y divide-border">
            {links.map((l) => (
              <Box key={l.to} role="listitem">
                <Row to={l.to} left={<Disc size={40}><Ico as={l.icon} /></Disc>} title={l.label} subtitle={l.sub || undefined} chevron />
              </Box>
            ))}
          </VStack>
        </Card>
      </Box>

      {/* iOS Settings: sign out is a destructive text row in its own grouped box. */}
      <Card inset="rows" centered className="mt-8 mac:mt-[30px]">
        <Pressable role="button" onPress={() => setConfirm(true)} className="min-h-11 items-center justify-center py-3 mac:min-h-[38px] mac:py-2 data-[active=true]:bg-accent">
          <Text className="text-destructive">Đăng xuất</Text>
        </Pressable>
      </Card>
      <Confirm
        open={confirm} onOpenChange={setConfirm} title="Đăng xuất khỏi Wallet?" confirmLabel="Đăng xuất" danger
        onConfirm={() => { signOut(); nav('/onboarding') }}
      />
    </Box>
  )
}
