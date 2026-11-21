import { Bell, ChevronLeft, CreditCard, Palette, FileText, Gauge, HelpCircle, History, Home, Landmark, QrCode, ScanLine, Send, ShieldCheck, User, Wallet, X } from 'lucide-react'
import { useEffect, useState, type ReactNode } from 'react'
import { Outlet, useLocation, useNavigate } from 'react-router'
import { pageScroller, useLayout } from '@/app/layout'
import { isTabRoot, screenFor, sidebar, tabBar, type NavItem } from '@/app/sitemap'
import { signOut, unreadCount, useWorld } from '@/app/store'
import { useTheme } from '@/app/theme'
import { useToolbarState } from '@/app/toolbar'
import { DemoControlsButton, DemoControlsSheet } from '@/features/demo/DemoControls'
import { backdropClass } from '@/features/demo/ThemeControls'
import { Avatar, BackButton, Confirm, cx, Ico, IconButton, NavBar, useLinkPress } from '@/components/app-ui'
import { Badge, BadgeText } from '@/components/ui/badge'
import { Box } from '@/components/ui/box'
import { Heading } from '@/components/ui/heading'
import { HStack } from '@/components/ui/hstack'
import { Link, LinkText } from '@/components/ui/link'
import { Menu, MenuItem, MenuItemLabel, MenuSeparator } from '@/components/ui/menu'
import { Pressable } from '@/components/ui/pressable'
import { Text } from '@/components/ui/text'
import { VStack } from '@/components/ui/vstack'

const ICONS: Record<string, typeof Home> = {
  home: Home, history: History, scan: ScanLine, notifications: Bell, me: User, transfer: Send, receive: QrCode, pay: CreditCard,
  bills: FileText, sources: Landmark, limits: Gauge, security: ShieldCheck, profile: User, support: HelpCircle,
}

export function SampleBadge({ compact }: { className?: string; compact?: boolean }) {
  return <Badge variant="outline" aria-label="Dữ liệu mẫu" className="rounded-full"><BadgeText className="normal-case font-semibold">{compact ? 'Mẫu' : 'Dữ liệu mẫu'}</BadgeText></Badge>
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

/* ── Web layout: macOS System Settings ───────────────────────────────
 * Geometry is Apple's own (DESIGN.md "Provenance"): a NavigationSplitView rendered by macOS 26.6 gives a floating
 * sidebar 215pt wide, inset 8pt from the window on three sides, 18pt corners; List(.sidebar) rows are 32pt
 * (NSTableView .sourceList, medium) with the selection inset 10pt and ~10pt corners; the toolbar title sits on the
 * content's leading edge, 20pt right of the sidebar, and the first box starts 72pt down.
 * HIG Sidebars: "By default, sidebar icons use your app's accent color."
 */

function SideLink({ item }: { item: NavItem }) {
  const I = ICONS[item.id] ?? Wallet
  const { pathname } = useLocation()
  const active = isActive(pathname, item.route) || (item.id === 'pay' && pathname.startsWith('/pay'))
  const press = useLinkPress(item.route)
  return (
    <Pressable
      onPress={press}
      href={item.route}
      role="link"
      aria-current={active ? 'page' : undefined}
      className={cx('h-8 flex-row items-center gap-2 rounded-[10px] px-2.5', active ? 'bg-primary' : 'data-[hover=true]:bg-foreground/5')}
    >
      <Box className="w-[18px] items-center"><Ico as={I} size="sm" className={active ? 'text-primary-foreground' : 'text-primary'} /></Box>
      <Text isTruncated className={active ? 'text-primary-foreground' : 'text-foreground'}>{item.label}</Text>
    </Pressable>
  )
}

function AccountMenu() {
  const w = useWorld()
  const nav = useNavigate()
  const [confirm, setConfirm] = useState(false)
  return (
    <>
      <Menu
        placement="bottom left"
        offset={4}
        trigger={(props) => (
          <Pressable {...props} className="flex-row items-center gap-2 rounded-[10px] px-2.5 py-1.5 data-[hover=true]:bg-foreground/5">
            <Avatar name={w.customer.name} src={w.customer.photo} size={28} />
            <VStack className="min-w-0 flex-1">
              <Text bold isTruncated>{w.customer.name}</Text>
              <Text size="xs" isTruncated className="text-muted-foreground">Số ví {w.customer.walletNumber}</Text>
            </VStack>
          </Pressable>
        )}
      >
        <MenuItem key="profile" textValue="Hồ sơ" onPress={() => nav('/me/profile')} className="mac:h-6 mac:min-h-0 mac:min-w-[180px] mac:rounded-[5px] mac:px-2.5 mac:py-0"><MenuItemLabel className="mac:text-base">Hồ sơ và xác thực</MenuItemLabel></MenuItem>
        <MenuItem key="security" textValue="Bảo mật" onPress={() => nav('/me/security')} className="mac:h-6 mac:min-h-0 mac:min-w-[180px] mac:rounded-[5px] mac:px-2.5 mac:py-0"><MenuItemLabel className="mac:text-base">Bảo mật</MenuItemLabel></MenuItem>
        <MenuSeparator />
        <MenuItem key="signout" textValue="Đăng xuất" onPress={() => setConfirm(true)} className="mac:h-6 mac:min-h-0 mac:min-w-[180px] mac:rounded-[5px] mac:px-2.5 mac:py-0"><MenuItemLabel className="mac:text-base">Đăng xuất…</MenuItemLabel></MenuItem>
      </Menu>
      <Confirm open={confirm} onOpenChange={setConfirm} title="Đăng xuất khỏi Wallet?" body="Bản demo sẽ quay về màn Mở ví." confirmLabel="Đăng xuất" onConfirm={() => { signOut(); nav('/onboarding') }} danger />
    </>
  )
}

function WebShell({ children }: { children: ReactNode }) {
  const [demoOpen, setDemoOpen] = useState(false)
  const w = useWorld()
  const unread = unreadCount(w)
  const bell = useLinkPress('/notifications')
  const { pathname } = useLocation()
  const tb = useToolbarState()
  const title = tb.title ?? screenFor(pathname)?.title ?? 'Wallet'
  return (
    <HStack className="h-dvh overflow-hidden bg-background print:h-auto print:overflow-visible">
      <SkipLink />
      <VStack role="complementary" className="absolute bottom-2 left-2 top-2 z-30 w-[215px] rounded-[18px] border border-foreground/10 bg-sidebar/90 px-2.5 pb-2.5 pt-3 shadow-sm backdrop-blur-xl">
        <AccountMenu />
        <VStack role="navigation" aria-label="Điều hướng chính" className="mt-3 flex-1 overflow-y-auto overflow-x-hidden">
          {sidebar.map((x) =>
            'group' in x ? (
              // Settings separates groups with space only; the group name stays for screen readers.
              <VStack key={x.group} className="mt-3">
                <Text className="sr-only">{x.group}</Text>
                {x.items.map((i) => <SideLink key={i.id} item={i} />)}
              </VStack>
            ) : (
              <SideLink key={x.id} item={x} />
            ),
          )}
        </VStack>
        <HStack className="mt-2 items-center justify-between px-1">
          <SampleBadge />
          <IconButton label="Demo controls" onClick={() => setDemoOpen(true)}><Ico as={Palette} size="sm" /></IconButton>
        </HStack>
      </VStack>
      <Box id="main-scroll" className="h-full min-w-0 flex-1 overflow-y-auto pl-[223px] print:overflow-visible print:pl-0">
        <HStack className="sticky top-0 z-20 h-[52px] shrink-0 items-center gap-2 bg-background/80 px-5 backdrop-blur-xl" role="banner">
          {tb.onBack ? <IconButton label="Quay lại" onClick={tb.onBack} className="-ml-1"><Ico as={ChevronLeft} size="sm" /></IconButton> : null}
          <Text bold isTruncated className="flex-1 text-lg" aria-hidden>{title}</Text>
          {tb.onClose ? <IconButton label="Đóng" onClick={tb.onClose}><Ico as={X} size="sm" /></IconButton> : null}
          <Box className="relative">
            <IconButton label={unread ? `Thông báo, ${unread} chưa đọc` : 'Thông báo'} onClick={bell}><Ico as={Bell} size="sm" /></IconButton>
            {unread ? <UnreadBadge n={unread} /> : null}
          </Box>
        </HStack>
        <Box role="main" id="main" className="w-full max-w-[680px] shrink-0 px-5 pb-16 pt-5">
          {children}
        </Box>
      </Box>
      <DemoControlsSheet open={demoOpen} onOpenChange={setDemoOpen} />
    </HStack>
  )
}

/* ── App layout ───────────────────────────────────────────────────── */

function TabItem({ t, active, unread }: { t: NavItem; active: boolean; unread: number }) {
  const I = ICONS[t.id] ?? Wallet
  const press = useLinkPress(t.route)
  // HIG Tab bars: a tab bar is for navigation, not actions, so Quét mã is an ordinary tab (still one tap away).
  return (
    <Pressable onPress={press} href={t.route} role="link" aria-current={active ? 'page' : undefined} className={cx('relative h-full flex-1 items-center justify-center gap-0.5 rounded-full', active && 'bg-primary/10')}>
      <Ico as={I} size="lg" className={active ? 'text-primary' : 'text-foreground'} />
      {/* Label stays label-coloured: tint text on the 10% tint pill drops under AA for yellow/orange. */}
      <Text size="xs" className={active ? 'font-semibold text-foreground' : 'text-foreground'}>
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
    // iOS 27 tab bar: a floating Liquid Glass capsule above the home indicator; the current tab is a tinted pill.
    <HStack role="navigation" aria-label="Điều hướng chính" className="fixed inset-x-3 bottom-[max(12px,env(safe-area-inset-bottom))] z-30 mx-auto h-16 max-w-[520px] items-center rounded-full border border-border/50 bg-card/75 p-1.5 shadow-hard-5 backdrop-blur-2xl">
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
    <Box className={cx('min-h-dvh', backdropClass(theme.background, true))}>
      <SkipLink />
      <NavBar
        title={<Text aria-hidden>{title}</Text>}
        titleVisible={!root}
        left={root ? <Box className="w-3" /> : <BackButton onClick={() => nav(-1)} />}
        right={<HStack className="items-center gap-1"><SampleBadge compact /><DemoControlsButton compact /></HStack>}
      />
      {root ? (
        // iOS large title: leading-aligned under the bar.
        <Box aria-hidden className="mx-auto w-full max-w-[560px] items-start px-4 pb-1">
          <Heading size="3xl">{title}</Heading>
        </Box>
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
  if (layout === 'web') return <WebShell><Outlet /></WebShell>
  return <Box className="min-h-dvh bg-backdrop-app"><Outlet /></Box>
}
