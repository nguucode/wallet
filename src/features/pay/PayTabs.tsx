import { useLinkPress } from '@/components/app-ui'
import { Button, ButtonText } from '@/components/ui/button'
import { HStack } from '@/components/ui/hstack'

function Tab({ to, label, current }: { to: string; label: string; current: boolean }) {
  const press = useLinkPress(to)
  return (
    <Button
      href={to} role="link" onPress={press} aria-current={current ? 'page' : undefined}
      variant={current ? 'default' : 'outline'} className="rounded-full"
    >
      <ButtonText>{label}</ButtonText>
    </Button>
  )
}

/** Web only: sidebar "Thanh toán" lands on Payment Code; Scan sits beside it (sitemap note). */
export function PayTabs({ active }: { active: 'code' | 'scan' }) {
  return (
    <HStack role="navigation" aria-label="Thanh toán" className="mb-6 gap-2">
      <Tab to="/pay/code" label="Mã thanh toán" current={active === 'code'} />
      <Tab to="/pay/scan" label="Quét mã" current={active === 'scan'} />
    </HStack>
  )
}
