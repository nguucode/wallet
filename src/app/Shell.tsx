import { Bell, CreditCard, FileText, Gauge, HelpCircle, History, Home, Landmark, PanelLeftClose, PanelLeftOpen, QrCode, ScanLine, Send, ShieldCheck, User, Wallet } from 'lucide-react'
import { useEffect, useState, type ReactNode } from 'react'
import { Outlet, useLocation, useNavigate } from 'react-router'
import { useLayout } from '@/app/layout'
import { isTabRoot, screenFor, sidebar, tabBar, type NavItem } from '@/app/sitemap'
import { signOut, unreadCount, useWorld } from '@/app/store'
import { DemoControlsButton } from '@/features/demo/DemoControls'
import { Avatar, BackButton, Confirm, cx, Ico, IconButton, NavBar, useLinkPress } from '@/components/app-ui'
import { Badge, BadgeText } from '@/components/ui/badge'
import { Box } from '@/components/ui/box'
import { Button, ButtonText } from '@/components/ui/button'
import { Divider } from '@/components/ui/divider'
import { Heading } from '@/components/ui/heading'
import { HStack } from '@/components/ui/hstack'
import { Image } from '@/components/ui/image'
import { Menu, MenuItem, MenuItemLabel, MenuSeparator } from '@/components/ui/menu'
import { Pressable } from '@/components/ui/pressable'
import { Text } from '@/components/ui/text'
import { VStack } from '@/components/ui/vstack'

const ICONS: Record<string, typeof Home> = {
  home: Home, history: History, scan: ScanLine, notifications: Bell, me: User, transfer: Send, receive: QrCode, pay: CreditCard,
  bills: FileText, sources: Landmark, limits: Gauge, security: ShieldCheck, profile: User, support: HelpCircle,
}

export function SampleBadge({ compact }: { className?: string; compact?: boolean }) {
  return <Badge variant="outline" aria-label="Dữ liệu mẫu"><BadgeText>{compact ? 'Mẫu' : 'Dữ liệu mẫu'}</BadgeText></Badge>
}

/** Moves focus to the page h1 and updates the document title on route change (a11y). */
function useRouteFocus() {
  const { pathname } = useLocation()
  useEffect(() => {
    const s = screenFor(pathname)
    document.title = (s ? s.title + ' · ' : '') + 'Wallet'
    const h = document.querySelector<HTMLElement>('[data-page-title]')
    h?.focus({ preventScroll: true })
    window.scrollTo(0, 0)
  }, [pathname])
}

const isActive = (pathname: string, route?: string) => !!route && (pathname === route || pathname.startsWith(route + '/'))

function Logo({ size = 28 }: { size?: number }) {
  return <Image source={{ uri: '/icon.svg' }} alt="" style={{ width: size, height: size }} />
}

function UnreadBadge({ n }: { n: number }) {
  return <Badge variant="destructive" className="absolute -top-1 -right-1 min-w-[18px] rounded-full px-1" aria-hidden><BadgeText className="normal-case">{n > 9 ? '9+' : n}</BadgeText></Badge>
}

/* ── Web layout ───────────────────────────────────────────────────── */

function SideLink({ item, collapsed }: { item: NavItem; collapsed: boolean }) {
  const I = ICONS[item.id] ?? Wallet
  const { pathname } = useLocation()
  const active = isActive(pathname, item.route) || (item.id === 'pay' && pathname.startsWith('/pay'))
  const press = useLinkPress(item.route)
  return (
    <Button
      variant={active ? 'secondary' : 'ghost'}
      size="sm"
      onPress={press}
      href={item.route}
      role="link"
      aria-current={active ? 'page' : undefined}
      aria-label={collapsed ? item.label : undefined}
      className={cx('h-9 justify-start gap-3', collapsed ? 'w-9 justify-center self-center px-0' : 'px-2.5')}
    >
      <Ico as={I} size="sm" className="shrink-0 text-foreground" />
      {collapsed ? null : <ButtonText className={cx('truncate', active && 'font-semibold')}>{item.label}</ButtonText>}
    </Button>
  )
}

function AccountMenu({ expanded }: { expanded: boolean }) {
  const w = useWorld()
  const nav = useNavigate()
  const [confirm, setConfirm] = useState(false)
  return (
    <>
      <Menu
        placement="top left"
        offset={8}
        trigger={(props) => (
          <Button {...props} variant="ghost" size="sm" aria-label="Tài khoản" className={cx('h-9 gap-2 px-1', expanded ? 'min-w-0 flex-1 justify-start' : 'w-9 justify-center px-0')}>
            <Avatar name={w.customer.name} src={w.customer.photo} size={28} />
            {expanded ? <ButtonText className="min-w-0 truncate">{w.customer.name.split(' ').slice(-2).join(' ')}</ButtonText> : null}
          </Button>
        )}
      >
        <MenuItem key="profile" textValue="Hồ sơ" onPress={() => nav('/me/profile')}>
          <VStack>
            <MenuItemLabel bold>{w.customer.name}</MenuItemLabel>
            <MenuItemLabel className="text-sm text-muted-foreground">Hồ sơ · Số ví {w.customer.walletNumber}</MenuItemLabel>
          </VStack>
        </MenuItem>
        <MenuSeparator />
        <MenuItem key="security" textValue="Bảo mật" onPress={() => nav('/me/security')}><MenuItemLabel>Bảo mật</MenuItemLabel></MenuItem>
        <MenuItem key="signout" textValue="Đăng xuất" onPress={() => setConfirm(true)}><MenuItemLabel className="text-destructive">Đăng xuất</MenuItemLabel></MenuItem>
      </Menu>
      <Confirm open={confirm} onOpenChange={setConfirm} title="Đăng xuất khỏi Wallet?" body="Bản demo sẽ quay về màn Mở ví." confirmLabel="Đăng xuất" onConfirm={() => { signOut(); nav('/onboarding') }} danger />
    </>
  )
}

const COLLAPSE_KEY = 'wallet.sidebar.collapsed'

/** Per-viewer preference; storage may be unavailable (private mode), so default to expanded. */
function useSidebarCollapsed() {
  const [collapsed, setCollapsed] = useState(() => { try { return localStorage.getItem(COLLAPSE_KEY) === '1' } catch { return false } })
  const toggle = () => setCollapsed((c) => { try { localStorage.setItem(COLLAPSE_KEY, c ? '0' : '1') } catch { /* ignore */ } return !c })
  return [collapsed, toggle] as const
}

function WebShell({ children }: { children: ReactNode }) {
  const [collapsed, toggleCollapsed] = useSidebarCollapsed()
  // Collapsed rail: hovering the logo peeks the full sidebar over the content; clicking it pins the sidebar open.
  const [peek, setPeek] = useState(false)
  const rail = collapsed && !peek
  const w = useWorld()
  const unread = unreadCount(w)
  const pin = () => { setPeek(false); toggleCollapsed() }
  const home = useLinkPress('/home')
  const bell = useLinkPress('/notifications')
  const bellLabel = unread ? `Thông báo, ${unread} chưa đọc` : 'Thông báo'
  return (
    <HStack className="min-h-dvh bg-background">
      <Box className={cx('sticky top-0 z-40 h-dvh shrink-0', collapsed ? 'w-16' : 'w-60')}>
        <VStack
          role="complementary"
          onMouseLeave={() => setPeek(false)}
          className={cx('absolute inset-y-0 left-0 border-r border-border bg-card px-2.5 py-3', rail ? 'w-16' : 'w-60')}
        >
          <HStack className={cx('mb-3 h-9 shrink-0 items-center', rail ? 'justify-center' : 'justify-between pl-1')}>
            {rail ? (
              <Pressable onHoverIn={() => setPeek(true)} onPress={pin} aria-expanded={false} aria-label="Mở rộng thanh bên" className="h-9 w-9 items-center justify-center rounded-md data-[hover=true]:bg-accent">
                <Logo />
              </Pressable>
            ) : (
              <>
                <Pressable onPress={home} href="/home" role="link" aria-label="Wallet, về Trang chủ">
                  <HStack className="items-center gap-2"><Logo /><Heading size="md" aria-hidden>Wallet</Heading></HStack>
                </Pressable>
                <IconButton label={collapsed ? 'Ghim thanh bên mở rộng' : 'Thu gọn thanh bên'} aria-expanded={!collapsed} onClick={pin}>
                  <Ico as={collapsed ? PanelLeftOpen : PanelLeftClose} size="sm" className="text-muted-foreground" />
                </IconButton>
              </>
            )}
          </HStack>
          <VStack role="navigation" aria-label="Điều hướng chính" className="flex-1 gap-px overflow-y-auto overflow-x-hidden">
            {sidebar.map((x) =>
              'group' in x ? (
                <VStack key={x.group} className="mt-3 gap-px">
                  {rail
                    ? <><Text className="sr-only">{x.group}</Text><Divider className="mx-auto mb-1 w-6" /></>
                    : <Text size="xs" bold isTruncated className="px-2.5 pb-0.5 text-muted-foreground">{x.group}</Text>}
                  {x.items.map((i) => <SideLink key={i.id} item={i} collapsed={rail} />)}
                </VStack>
              ) : (
                <SideLink key={x.id} item={x} collapsed={rail} />
              ),
            )}
          </VStack>
          {/* Footer: account, notifications and demo controls live with navigation, so the content column has no toolbar. */}
          <Divider className="my-2" />
          <Box className={cx('flex shrink-0', rail ? 'flex-col-reverse items-center gap-px' : 'flex-row items-center gap-1')}>
            <AccountMenu expanded={!rail} />
            <Box className="relative">
              <IconButton label={bellLabel} onClick={bell}><Ico as={Bell} size="sm" /></IconButton>
              {unread ? <UnreadBadge n={unread} /> : null}
            </Box>
            <DemoControlsButton compact />
          </Box>
        </VStack>
      </Box>
      <Box className="min-w-0 flex-1">
        <Box role="main" id="main" className="mx-auto w-full max-w-[768px] px-12 pb-24 pt-14">{children}</Box>
      </Box>
    </HStack>
  )
}

/* ── App layout ───────────────────────────────────────────────────── */

function TabItem({ t, active, unread }: { t: NavItem; active: boolean; unread: number }) {
  const I = ICONS[t.id] ?? Wallet
  const press = useLinkPress(t.route)
  if (t.emphasis === 'center')
    return (
      <Box className="flex-1 items-center">
        <Button onPress={press} href={t.route} role="link" aria-label={t.label} aria-current={active ? 'page' : undefined} className="h-13 w-13 rounded-full px-0">
          <Ico as={I} size="lg" className="text-primary-foreground" />
        </Button>
      </Box>
    )
  return (
    <Pressable onPress={press} href={t.route} role="link" aria-current={active ? 'page' : undefined} className="relative flex-1 items-center justify-center gap-1 py-1.5">
      <Ico as={I} size="lg" className={active ? 'text-foreground' : 'text-muted-foreground'} />
      <Text size="2xs" className={active ? 'font-semibold text-foreground' : 'text-muted-foreground'}>
        {t.label}{t.badge && unread ? <Text className="sr-only">, {unread} chưa đọc</Text> : null}
      </Text>
      {t.badge && unread ? <UnreadBadge n={unread} /> : null}
    </Pressable>
  )
}

function TabBar() {
  const { pathname } = useLocation()
  const unread = unreadCount(useWorld())
  return (
    <HStack role="navigation" aria-label="Điều hướng chính" className="fixed inset-x-0 bottom-0 z-30 h-16 items-center border-t border-border bg-background px-1.5 pb-[env(safe-area-inset-bottom)]">
      {tabBar.map((t) => {
        const active = isActive(pathname, t.route) || (t.id === 'me' && pathname.startsWith('/me')) || (t.id === 'scan' && pathname === '/pay/scan')
        return <TabItem key={t.id} t={t} active={active} unread={unread} />
      })}
    </HStack>
  )
}

function AppShell({ children }: { children: ReactNode }) {
  const { pathname } = useLocation()
  const nav = useNavigate()
  const s = screenFor(pathname)
  const root = isTabRoot(pathname)
  const title = root && pathname === '/home' ? 'Wallet' : s?.title ?? 'Wallet'
  return (
    <Box className="min-h-dvh bg-background">
      <NavBar
        title={<Text aria-hidden>{title}</Text>}
        titleVisible={!root}
        left={root ? <Box className="w-3" /> : <BackButton onClick={() => nav(-1)} />}
        right={<HStack className="items-center gap-1"><SampleBadge compact /><DemoControlsButton compact /></HStack>}
      />
      {root ? (
        <HStack aria-hidden className="mx-auto max-w-[560px] items-center gap-3 px-4 pb-1">
          {pathname === '/home' ? <Logo size={34} /> : null}
          <Heading size="3xl">{title}</Heading>
        </HStack>
      ) : null}
      <Box role="main" id="main" className="mx-auto w-full max-w-[560px] px-4 pb-32 pt-3">{children}</Box>
      <TabBar />
    </Box>
  )
}

/* ── Shell switch ─────────────────────────────────────────────────── */

/** Shell for nav screens. Flows and onboarding render without it (FlowShell / bare). */
export function Shell() {
  const layout = useLayout()
  useRouteFocus()
  const Body = layout === 'web' ? WebShell : AppShell
  return (
    <Body>
      <Outlet />
    </Body>
  )
}

/** Flow screens: full screen on app (tab bar hidden), 560px column inside the web shell. */
export function FlowShell() {
  const layout = useLayout()
  useRouteFocus()
  if (layout === 'web') return <WebShell><Box className="max-w-[560px]"><Outlet /></Box></WebShell>
  return <Box className="min-h-dvh bg-background"><Outlet /></Box>
}
