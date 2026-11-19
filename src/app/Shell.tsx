import { Bell, CreditCard, Palette, FileText, Gauge, HelpCircle, History, Home, Landmark, PanelLeftClose, PanelLeftOpen, QrCode, ScanLine, Send, ShieldCheck, User, Wallet } from 'lucide-react'
import { useEffect, useState, type ReactNode } from 'react'
import { Outlet, useLocation, useNavigate } from 'react-router'
import { pageScroller, useLayout } from '@/app/layout'
import { isTabRoot, screenFor, sidebar, tabBar, type NavItem } from '@/app/sitemap'
import { signOut, unreadCount, useWorld } from '@/app/store'
import { useTheme } from '@/app/theme'
import { DemoControlsButton, DemoControlsSheet } from '@/features/demo/DemoControls'
import { BACKDROP_PATTERN, ThemeControls } from '@/features/demo/ThemeControls'
import { Avatar, BackButton, Confirm, cx, Ico, IconButton, NavBar, useLinkPress } from '@/components/app-ui'
import { Badge, BadgeText } from '@/components/ui/badge'
import { Box } from '@/components/ui/box'
import { Button, ButtonText } from '@/components/ui/button'
import { Divider } from '@/components/ui/divider'
import { Heading } from '@/components/ui/heading'
import { HStack } from '@/components/ui/hstack'
import { Image } from '@/components/ui/image'
import { Link, LinkText } from '@/components/ui/link'
import { Menu, MenuItem, MenuItemLabel, MenuSeparator } from '@/components/ui/menu'
import { Popover, PopoverBackdrop, PopoverBody, PopoverContent } from '@/components/ui/popover'
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
    pageScroller().to(0)
  }, [pathname])
}

const isActive = (pathname: string, route?: string) => !!route && (pathname === route || pathname.startsWith(route + '/'))

function Logo({ size = 28 }: { size?: number }) {
  return <Image source={{ uri: '/icon.svg' }} alt="" size="none" className={size > 28 ? 'h-9 w-9 rounded-lg' : 'h-7 w-7 rounded-md'} />
}

/** Keyboard users skip the navigation: first focusable element, visible only when focused. */
function SkipLink() {
  return (
    <Link href="#main" className="absolute left-2 top-2 z-50 -translate-y-20 rounded-md bg-background px-4 py-2 data-[focus-visible=true]:translate-y-0">
      <LinkText>Bỏ qua điều hướng</LinkText>
    </Link>
  )
}

function UnreadBadge({ n }: { n: number }) {
  return <Badge variant="destructive" className="absolute -top-1 -right-1 min-w-[18px] rounded-full px-1 dark:bg-destructive" aria-hidden><BadgeText className="dark:text-background">{n > 9 ? '9+' : n}</BadgeText></Badge>
}

/* ── Web layout ───────────────────────────────────────────────────── */

function SideLink({ item, collapsed }: { item: NavItem; collapsed: boolean }) {
  const I = ICONS[item.id] ?? Wallet
  const { pathname } = useLocation()
  const active = isActive(pathname, item.route) || (item.id === 'pay' && pathname.startsWith('/pay'))
  const press = useLinkPress(item.route)
  return (
    <Button
      variant="ghost"
      size="sm"
      onPress={press}
      href={item.route}
      role="link"
      aria-current={active ? 'page' : undefined}
      aria-label={collapsed ? item.label : undefined}
      // On the backdrop the current page is the panel's own surface: bg-background with a hairline, icon in primary.
      className={cx('h-9 justify-start gap-3 data-[hover=true]:bg-background/70', collapsed ? 'w-9 justify-center self-center px-0' : 'px-2.5', active && 'border border-border bg-background')}
    >
      <Ico as={I} size="sm" className={cx('shrink-0', active ? 'text-primary' : 'text-foreground')} />
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

/** Collapsed rail: the Demo controls box folds into one palette button that opens it in a popover beside the rail. */
function RailThemeButton({ onMore }: { onMore: () => void }) {
  const [open, setOpen] = useState(false)
  return (
    <Popover
      isOpen={open}
      onOpen={() => setOpen(true)}
      onClose={() => setOpen(false)}
      placement="right bottom"
      offset={12}
      trigger={(props) => (
        <Button {...props} variant="ghost" size="icon" aria-label="Demo controls" className="h-9 w-9 rounded-full">
          <Ico as={Palette} size="sm" />
        </Button>
      )}
    >
      <PopoverBackdrop />
      <PopoverContent className="w-64">
        <PopoverBody><ThemeControls onMore={() => { setOpen(false); onMore() }} /></PopoverBody>
      </PopoverContent>
    </Popover>
  )
}

/**
 * Web shell (sếp's sketch 2026-11-19): the whole window is the viewer's backdrop; the sidebar sits on it with no surface
 * of its own; content lives in one rounded panel that fills the rest of the window and scrolls inside.
 */
function WebShell({ children }: { children: ReactNode }) {
  const [collapsed, toggleCollapsed] = useSidebarCollapsed()
  const [demoOpen, setDemoOpen] = useState(false)
  const theme = useTheme()
  const w = useWorld()
  const unread = unreadCount(w)
  const home = useLinkPress('/home')
  const bell = useLinkPress('/notifications')
  const bellLabel = unread ? `Thông báo, ${unread} chưa đọc` : 'Thông báo'
  const toggleLabel = collapsed ? 'Mở rộng thanh bên' : 'Thu gọn thanh bên'
  return (
    <HStack className={cx('h-dvh overflow-hidden bg-backdrop print:h-auto print:overflow-visible', theme.background === 'pattern' && BACKDROP_PATTERN)}>
      <SkipLink />
      <VStack role="complementary" className={cx('h-full shrink-0 px-2.5 py-3', collapsed ? 'w-16' : 'w-64')}>
        <HStack className={cx('mb-3 h-9 shrink-0 items-center', collapsed ? 'flex-col gap-2 h-auto' : 'justify-between pl-1')}>
          <Pressable onPress={home} href="/home" role="link" aria-label="Wallet, về Trang chủ">
            <HStack className="items-center gap-2"><Logo />{collapsed ? null : <Heading as="p" size="md" aria-hidden>Wallet</Heading>}</HStack>
          </Pressable>
          <IconButton label={toggleLabel} aria-expanded={!collapsed} onClick={toggleCollapsed} className="h-9 w-9">
            <Ico as={collapsed ? PanelLeftOpen : PanelLeftClose} size="sm" className="text-foreground/70" />
          </IconButton>
        </HStack>
        <VStack role="navigation" aria-label="Điều hướng chính" className="flex-1 gap-px overflow-y-auto overflow-x-hidden">
          {sidebar.map((x) =>
            'group' in x ? (
              <VStack key={x.group} className="mt-3 gap-px">
                {collapsed
                  ? <><Text className="sr-only">{x.group}</Text><Divider className="mx-auto mb-1 w-6" /></>
                  : <Text size="xs" bold isTruncated className="px-2.5 pb-0.5 text-foreground/70">{x.group}</Text>}
                {x.items.map((i) => <SideLink key={i.id} item={i} collapsed={collapsed} />)}
              </VStack>
            ) : (
              <SideLink key={x.id} item={x} collapsed={collapsed} />
            ),
          )}
        </VStack>
        {/* Footer: demo controls, then account and notifications (sketch). */}
        <VStack className={cx('mt-2 shrink-0 gap-2', collapsed && 'items-center')}>
          {collapsed
            ? <RailThemeButton onMore={() => setDemoOpen(true)} />
            : <Box className="rounded-xl border border-border bg-background p-3"><ThemeControls onMore={() => setDemoOpen(true)} /></Box>}
          <Box className={cx('flex', collapsed ? 'flex-col items-center gap-px' : 'flex-row items-center gap-1')}>
            <AccountMenu expanded={!collapsed} />
            <Box className="relative">
              <IconButton label={bellLabel} onClick={bell}><Ico as={Bell} size="sm" /></IconButton>
              {unread ? <UnreadBadge n={unread} /> : null}
            </Box>
          </Box>
        </VStack>
      </VStack>
      <Box id="main-scroll" className="my-2 mr-2 min-w-0 flex-1 overflow-y-auto rounded-2xl border border-border bg-background print:overflow-visible">
        <Box role="main" id="main" className="mx-auto w-full max-w-[768px] shrink-0 px-12 pb-24 pt-12">{children}</Box>
      </Box>
      <DemoControlsSheet open={demoOpen} onOpenChange={setDemoOpen} />
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
        <Button onPress={press} href={t.route} role="link" aria-label={t.label} aria-current={active ? 'page' : undefined} className="h-12 w-12 rounded-full px-0">
          <Ico as={I} size="lg" className="text-primary-foreground" />
        </Button>
      </Box>
    )
  return (
    <Pressable onPress={press} href={t.route} role="link" aria-current={active ? 'page' : undefined} className="relative flex-1 items-center justify-center gap-1 py-1.5">
      <Ico as={I} size="lg" className={active ? 'text-foreground' : 'text-muted-foreground'} />
      <Text size="xs" className={active ? 'font-semibold text-foreground' : 'text-muted-foreground'}>
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
  const theme = useTheme()
  return (
    <Box className={cx('min-h-dvh bg-backdrop-app', theme.background === 'pattern' && BACKDROP_PATTERN)}>
      <SkipLink />
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
  return <Box className="min-h-dvh bg-backdrop-app"><Outlet /></Box>
}
