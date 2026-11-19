import * as DropdownMenu from '@radix-ui/react-dropdown-menu'
import { Bell, CreditCard, FileText, Gauge, HelpCircle, History, Home, Landmark, Monitor, PanelLeftClose, PanelLeftOpen, QrCode, ScanLine, Send, ShieldCheck, Smartphone, User, Wallet } from 'lucide-react'
import { useEffect, useState, type ReactNode } from 'react'
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router'
import { inFrame, useLayout } from '@/app/layout'
import { isTabRoot, screenFor, sidebar, tabBar, type NavItem } from '@/app/sitemap'
import { signOut, unreadCount, useWorld } from '@/app/store'
import { DemoControlsButton } from '@/features/demo/DemoControls'
import { BackButton, Confirm, cx, IconButton, NavBar, useScrolled } from '@/components/ui'

const ICONS: Record<string, typeof Home> = {
  home: Home, history: History, scan: ScanLine, notifications: Bell, me: User, transfer: Send, receive: QrCode, pay: CreditCard,
  bills: FileText, sources: Landmark, limits: Gauge, security: ShieldCheck, profile: User, support: HelpCircle, device: Smartphone,
}

export function SampleBadge({ className, compact }: { className?: string; compact?: boolean }) {
  return (
    <span title="Dữ liệu mẫu" className={cx('inline-flex h-6 items-center rounded-full px-2.5 text-[12px] font-semibold whitespace-nowrap bg-surface text-muted', className)}>
      {compact ? <><span aria-hidden>Mẫu</span><span className="sr-only">Dữ liệu mẫu</span></> : 'Dữ liệu mẫu'}
    </span>
  )
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

/* ── Web layout ───────────────────────────────────────────────────── */

function SideLink({ item, collapsed }: { item: NavItem; collapsed: boolean }) {
  const Icon = ICONS[item.id] ?? Wallet
  const { pathname } = useLocation()
  const active = isActive(pathname, item.route) || (item.id === 'pay' && pathname.startsWith('/pay'))
  return (
    <NavLink
      to={item.route!}
      aria-current={active ? 'page' : undefined}
      title={collapsed ? item.label : undefined}
      className={cx('flex h-10 shrink-0 items-center gap-3 rounded-[12px] text-[15px] no-underline', collapsed ? 'w-11 justify-center self-center' : 'px-3', active ? 'bg-surface-2 font-semibold text-tint' : 'text-ink hover:bg-surface-2')}
    >
      <Icon size={20} strokeWidth={1.75} aria-hidden className={cx('shrink-0', !active && 'text-tint')} />
      <span className={cx('truncate', collapsed && 'sr-only')}>{item.label}</span>
    </NavLink>
  )
}

/** Account in the sidebar footer, as on macOS: avatar (+ name when expanded); the menu opens upward. */
function AccountMenu({ expanded }: { expanded: boolean }) {
  const w = useWorld()
  const nav = useNavigate()
  const [confirm, setConfirm] = useState(false)
  const initials = w.customer.name.split(' ').slice(-2).map((p) => p[0]).join('')
  return (
    <>
      <DropdownMenu.Root>
        <DropdownMenu.Trigger asChild>
          <button type="button" title={expanded ? undefined : 'Tài khoản'} className={cx('flex min-w-0 items-center gap-2.5 rounded-[12px] text-left hover:bg-surface-2', expanded ? 'h-11 flex-1 px-1.5' : 'size-11 justify-center')}>
            <span aria-hidden className="inline-flex size-8 shrink-0 items-center justify-center rounded-full bg-surface-2 text-[12px] font-semibold text-ink">{initials}</span>
            {expanded ? <span className="min-w-0 truncate text-[13px] font-semibold">{w.customer.name.split(' ').slice(-2).join(' ')}</span> : null}
            <span className="sr-only">Tài khoản</span>
          </button>
        </DropdownMenu.Trigger>
        <DropdownMenu.Portal>
          <DropdownMenu.Content side="top" align="start" sideOffset={8} className="z-50 min-w-[220px] card p-2 shadow-[var(--shadow-float)]">
            <div className="px-3 py-2">
              <p className="font-semibold">{w.customer.name}</p>
              <p className="text-[13px] text-muted">Số ví {w.customer.walletNumber}</p>
            </div>
            <DropdownMenu.Separator className="my-1 h-px bg-line-soft" />
            {[['Hồ sơ', '/me/profile'], ['Bảo mật', '/me/security']].map(([l, r]) => (
              <DropdownMenu.Item key={r} onSelect={() => nav(r)} className="flex h-10 cursor-pointer items-center rounded-lg px-3 outline-none data-[highlighted]:bg-surface-2">{l}</DropdownMenu.Item>
            ))}
            <DropdownMenu.Item onSelect={() => setConfirm(true)} className="flex h-10 cursor-pointer items-center rounded-lg px-3 text-danger outline-none data-[highlighted]:bg-danger-soft">Đăng xuất</DropdownMenu.Item>
          </DropdownMenu.Content>
        </DropdownMenu.Portal>
      </DropdownMenu.Root>
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
  const w = useWorld()
  const unread = unreadCount(w)
  return (
    <div className="relative flex min-h-dvh">
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50 focus:rounded-full focus:bg-ink focus:px-4 focus:py-2 focus:text-on-ink">Bỏ qua điều hướng</a>
      <aside className={cx('glass sticky top-3 z-40 m-3 mr-0 flex h-[calc(100dvh-24px)] shrink-0 flex-col rounded-[28px] py-5 transition-[width] duration-200 motion-reduce:transition-none', collapsed ? 'w-[76px] px-2' : 'w-[240px] px-3')}>
        <div className={cx('mb-6 flex items-center', collapsed ? 'flex-col gap-3' : 'justify-between pr-1 pl-3')}>
          <Link to="/home" className="flex items-center gap-2 text-[20px] font-extrabold tracking-tight text-ink no-underline" aria-label="Wallet, về Trang chủ">
            <img src="/icon.svg" alt="" width={32} height={32} className="size-8 shrink-0" />
            {collapsed ? null : <span aria-hidden>Wallet</span>}
          </Link>
          <IconButton label={collapsed ? 'Mở rộng thanh bên' : 'Thu gọn thanh bên'} aria-expanded={!collapsed} className="text-muted hover:bg-surface-2 hover:text-ink" onClick={toggleCollapsed}>
            {collapsed ? <PanelLeftOpen size={20} strokeWidth={1.75} /> : <PanelLeftClose size={20} strokeWidth={1.75} />}
          </IconButton>
        </div>
        <nav aria-label="Điều hướng chính" className="flex flex-1 flex-col gap-1 overflow-x-hidden overflow-y-auto">
          {sidebar.map((x) =>
            'group' in x ? (
              <div key={x.group} className="mt-4 flex flex-col gap-1">
                {collapsed
                  ? <p className="sr-only">{x.group}</p>
                  : <p className="mb-1 truncate px-3 text-[12px] font-semibold text-muted">{x.group}</p>}
                {collapsed ? <span aria-hidden className="mx-auto mb-1 h-px w-8 bg-line" /> : null}
                {x.items.map((i) => <SideLink key={i.id} item={i} collapsed={collapsed} />)}
              </div>
            ) : (
              <SideLink key={x.id} item={x} collapsed={collapsed} />
            ),
          )}
        </nav>
        {/* Footer: account, notifications and demo controls live with navigation, so the content column has no toolbar. */}
        <div className={cx('mt-3 flex border-t border-line/70 pt-3', collapsed ? 'flex-col items-center gap-1' : 'items-center gap-0.5')}>
          <AccountMenu expanded={!collapsed} />
          <Link to="/notifications" title={unread ? `Thông báo, ${unread} chưa đọc` : 'Thông báo'} aria-label={unread ? `Thông báo, ${unread} chưa đọc` : 'Thông báo'} className={cx('relative inline-flex size-11 shrink-0 items-center justify-center rounded-full hover:bg-surface-2', collapsed && 'order-first', 'text-tint')}>
            <Bell size={20} strokeWidth={1.75} aria-hidden />
            {unread ? <span className="absolute top-1 right-0.5 min-w-[18px] rounded-full bg-badge px-1 text-center text-[11px] leading-[18px] font-semibold text-white tnum">{unread > 9 ? '9+' : unread}</span> : null}
          </Link>
          <span className={cx('shrink-0', collapsed && 'order-first')}><DemoControlsButton compact /></span>
        </div>
      </aside>
      <div className="relative flex min-w-0 flex-1 flex-col">
        <main id="main" className="relative mx-auto w-full max-w-[768px] flex-1 px-12 pt-14 pb-24">{children}</main>
      </div>
    </div>
  )
}

/* ── App layout ───────────────────────────────────────────────────── */

function TabBar() {
  const { pathname } = useLocation()
  const w = useWorld()
  const unread = unreadCount(w)
  // iOS 26 tab bar: a floating Liquid Glass capsule; Scan is the one filled tint button (Product principle 4).
  return (
    <nav aria-label="Điều hướng chính" className="fixed inset-x-3 bottom-[max(12px,env(safe-area-inset-bottom))] z-30 mx-auto max-w-[536px] rounded-full glass">
      <ul className="grid h-[64px] grid-cols-5 items-center px-1.5">
        {tabBar.map((t) => {
          const Icon = ICONS[t.id] ?? Wallet
          const active = isActive(pathname, t.route) || (t.id === 'me' && pathname.startsWith('/me')) || (t.id === 'scan' && pathname === '/pay/scan')
          if (t.emphasis === 'center')
            return (
              <li key={t.id} className="flex justify-center">
                <Link to={t.route!} aria-label={t.label} aria-current={active ? 'page' : undefined} className="inline-flex size-[52px] items-center justify-center rounded-full bg-primary text-white no-underline active:opacity-70">
                  <Icon size={24} strokeWidth={2} aria-hidden />
                </Link>
              </li>
            )
          return (
            <li key={t.id} className="h-full py-1.5">
              <Link to={t.route!} aria-current={active ? 'page' : undefined} className={cx('relative flex h-full flex-col items-center justify-center gap-0.5 rounded-full no-underline', active ? 'bg-surface-2 text-tint' : 'text-ink')}>
                <Icon size={22} strokeWidth={active ? 2.25 : 1.75} aria-hidden />
                <span className={cx('text-[10px] leading-3', active ? 'font-semibold' : 'font-medium')}>{t.label}{t.badge && unread ? <span className="sr-only">, {unread} chưa đọc</span> : null}</span>
                {t.badge && unread ? <span className="absolute top-1 left-1/2 ml-1 min-w-[18px] rounded-full bg-badge px-1 text-center text-[11px] leading-[18px] font-semibold text-white tnum" aria-hidden>{unread > 9 ? '9+' : unread}</span> : null}
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}

function AppShell({ children }: { children: ReactNode }) {
  const { pathname } = useLocation()
  const nav = useNavigate()
  const s = screenFor(pathname)
  const root = isTabRoot(pathname)
  const title = root && pathname === '/home' ? 'Wallet' : s?.title ?? 'Wallet'
  const scrolled = useScrolled()
  return (
    <div className="relative min-h-dvh">
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50 focus:rounded-full focus:bg-ink focus:px-4 focus:py-2 focus:text-on-ink">Bỏ qua điều hướng</a>
      <NavBar
        title={<p aria-hidden>{title}</p>}
        titleVisible={!root}
        left={root ? <span className="w-3" /> : <BackButton onClick={() => nav(-1)} />}
        right={<div className="flex items-center gap-0.5"><SampleBadge compact /><DemoControlsButton compact /></div>}
      />
      {root ? (
        <p aria-hidden className={cx('large-title mx-auto flex max-w-[560px] items-center gap-2.5 px-5 pb-1 transition-opacity duration-200', scrolled && 'opacity-0')}>
          {pathname === '/home' ? <img src="/icon.svg" alt="" width={34} height={34} className="size-[34px] rounded-[9px]" /> : null}
          {title}
        </p>
      ) : null}
      <main id="main" className="relative mx-auto w-full max-w-[560px] px-4 pt-3 pb-32">{children}</main>
      {/* Scroll-edge effect: content fades out before it reaches the glass tab bar. */}
      <div aria-hidden className="pointer-events-none fixed inset-x-0 bottom-0 z-20 h-28 bg-gradient-to-t from-ground from-35% to-transparent" />
      <TabBar />
    </div>
  )
}

/* ── Shell switch + FAB ───────────────────────────────────────────── */

export function ViewSwitchFab() {
  const layout = useLayout()
  const { pathname, search } = useLocation()
  const nav = useNavigate()
  if (inFrame || layout !== 'web') return null
  const onDevice = pathname === '/device'
  const target = onDevice ? new URLSearchParams(search).get('path') || '/home' : `/device?path=${encodeURIComponent(pathname + search)}`
  return (
    <button
      onClick={() => nav(target)}
      className={cx("fixed bottom-6 z-40 inline-flex", onDevice ? "right-[404px]" : "right-6") + "  h-12 items-center gap-2 rounded-full bg-ink pr-5 pl-4 text-[15px] font-semibold text-on-ink shadow-[var(--shadow-float)] hover:bg-ink/85"}
    >
      {onDevice ? <Monitor size={18} strokeWidth={2} aria-hidden /> : <Smartphone size={18} strokeWidth={2} aria-hidden />}
      {onDevice ? 'Xem bản web' : 'Xem bản điện thoại'}
    </button>
  )
}

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
  if (layout === 'web') return <WebShell><div className="max-w-[560px]"><Outlet /></div></WebShell>
  return <div className="min-h-dvh"><Outlet /></div>
}

