import { BellOff, CheckCheck, FileText, HelpCircle, IdCard, ShieldCheck, Smartphone, Wallet } from 'lucide-react'
import { useNavigate, useSearchParams } from 'react-router'
import { useLayout } from '@/app/layout'
import { markRead, now, useWorld } from '@/app/store'
import type { Notification, NotificationKind } from '@/mock/seed'
import { Button, Card, cx, Disc, EmptyState, Ico, IconButton, RowSkeleton, Segmented, GroupLabel, INSET } from '@/components/app-ui'
import { Box } from '@/components/ui/box'
import { HStack } from '@/components/ui/hstack'
import { Pressable } from '@/components/ui/pressable'
import { Text } from '@/components/ui/text'
import { VStack } from '@/components/ui/vstack'
import { fmtTime } from '@/features/flow/FlowKit'
import { ScreenTitle, useLoaded } from '@/features/sec/kit'
import { useReminders } from './useReminders'
import { groupByDay, inView, VIEWS } from './views'

const ICON: Record<NotificationKind, typeof Wallet> = {
  balance_change: Wallet, security: ShieldCheck, new_device_login: Smartphone, id_expiring: IdCard, bill_due: FileText, support_update: HelpCircle,
}

/** US-NTF-001. */
export default function NotificationsPage() {
  const w = useWorld()
  const layout = useLayout()
  const nav = useNavigate()
  const loaded = useLoaded()
  const [params, setParams] = useSearchParams()
  useReminders()

  const view = VIEWS.find((v) => v.slug === params.get('view')) ?? VIEWS[0]
  const items = w.notifications.filter(inView(view.kinds))
  const unreadIds = items.filter((n) => !n.read).map((n) => n.id)
  const groups = groupByDay(items, now())

  const open = (n: Notification) => {
    if (!n.read) markRead([n.id])
    if (n.link) nav(n.link)
  }
  const markAll = unreadIds.length && loaded ? (
    layout === 'web'
      ? <Button variant="ghost" size="sm" onClick={() => markRead(unreadIds)} className="shrink-0">Đánh dấu tất cả đã đọc</Button>
      : <IconButton label="Đánh dấu tất cả đã đọc" onClick={() => markRead(unreadIds)} className="shrink-0"><Ico as={CheckCheck} className="text-primary" /></IconButton>
  ) : null

  return (
    <Box>
      <ScreenTitle>Thông báo</ScreenTitle>
      <HStack className="items-center gap-2">
        <Box className="min-w-0 flex-1">
          <Segmented
            label="Loại thông báo"
            value={view.slug}
            onChange={(slug) => { const p = new URLSearchParams(params); p.set('view', slug); setParams(p, { replace: true }) }}
            options={VIEWS.map((v) => {
              const c = w.notifications.filter(inView(v.kinds)).filter((n) => !n.read).length
              return { value: v.slug, label: v.label, count: loaded && c ? c : undefined }
            })}
          />
        </Box>
        {markAll}
      </HStack>

      <VStack className="mt-3 gap-6">
        {!loaded ? (
          <VStack aria-busy>{Array.from({ length: 8 }, (_, i) => <RowSkeleton key={i} />)}</VStack>
        ) : !items.length ? (
          <EmptyState icon={<Ico as={BellOff} />} title={view.empty} />
        ) : (
          groups.map((g) => (
            <VStack key={g.label} role="region" aria-label={g.label} className="gap-2">
              <GroupLabel>{g.label}</GroupLabel>
              <Card inset="rows">
                <VStack role="list" className="divide-y divide-border">
                  {g.items.map((n) => (
                    <Box key={n.id} role="listitem">
                      <NotificationRow n={n} onOpen={open} />
                    </Box>
                  ))}
                </VStack>
              </Card>
            </VStack>
          ))
        )}
      </VStack>
    </Box>
  )
}

/** Row geometry with a two-line body, so the icon top-aligns instead of centring. */
function NotificationRow({ n, onOpen }: { n: Notification; onOpen: (n: Notification) => void }) {
  return (
    <Pressable role="button" onPress={() => onOpen(n)} className="w-full data-[hover=true]:bg-accent data-[active=true]:bg-accent">
      <HStack className={cx('items-start gap-3 py-3 mac:py-2', INSET)}>
        <Disc size={40}><Ico as={ICON[n.kind]} /></Disc>
        <VStack className="min-w-0 flex-1">
          <HStack className="items-baseline gap-2">
            <Text className={cx('min-w-0 flex-1', n.read ? 'font-medium' : 'font-semibold')}>{n.title}</Text>
            <Text size="sm" className="shrink-0 tabular-nums text-muted-foreground">{fmtTime(n.createdAt)}</Text>
          </HStack>
          {n.body ? <Text size="sm" className="mt-1 line-clamp-2 text-muted-foreground">{n.body}</Text> : null}
        </VStack>
        {n.read ? <Box className="w-2 shrink-0" /> : (
          <Box className="mt-2 size-2 shrink-0 rounded-full bg-primary"><Text className="sr-only">Chưa đọc</Text></Box>
        )}
      </HStack>
    </Pressable>
  )
}
