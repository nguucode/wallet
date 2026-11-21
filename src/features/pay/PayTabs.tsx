import { cx, useLinkPress } from '@/components/app-ui'
import { Button, ButtonText } from '@/components/ui/button'
import { HStack } from '@/components/ui/hstack'

function Tab({ to, label, current }: { to: string; label: string; current: boolean }) {
  const press = useLinkPress(to)
  return (
    <Button
      href={to} role="link" onPress={press} aria-current={current ? 'page' : undefined}
      variant={current ? 'default' : 'outline'}
      className={cx('rounded-full mac:h-6 mac:min-h-0 mac:rounded-[6px] mac:border-0 mac:px-3', current ? 'mac:bg-segment-selected' : 'mac:bg-transparent')}
    >
      <ButtonText className={cx('mac:text-base mac:font-normal', current && 'mac:text-foreground mac:dark:text-white')}>{label}</ButtonText>
    </Button>
  )
}

/** Web only: sidebar "Thanh toán" lands on Payment Code; Scan sits beside it (sitemap note). */
export function PayTabs({ active }: { active: 'code' | 'scan' }) {
  return (
    // macOS: the 24pt segmented look (neutral selection); the app keeps capsules.
    <HStack role="navigation" aria-label="Thanh toán" className="mb-6 gap-2 mac:gap-0 mac:self-start mac:rounded-[6px] mac:bg-secondary">
      <Tab to="/pay/code" label="Mã thanh toán" current={active === 'code'} />
      <Tab to="/pay/scan" label="Quét mã" current={active === 'scan'} />
    </HStack>
  )
}
