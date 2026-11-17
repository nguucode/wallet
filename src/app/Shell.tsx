import * as DropdownMenu from '@radix-ui/react-dropdown-menu'
import { ArrowLeft, Bell, CreditCard, FileText, Gauge, HelpCircle, History, Home, Landmark, Monitor, QrCode, ScanLine, Send, ShieldCheck, Smartphone, User, Wallet } from 'lucide-react'
import { useEffect, useState, type ReactNode } from 'react'
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router'
import { inFrame, useLayout } from '@/app/layout'
import { isTabRoot, screenFor, sidebar, tabBar, type NavItem } from '@/app/sitemap'
import { signOut, unreadCount, useWorld } from '@/app/store'
import { DemoControlsButton } from '@/features/demo/DemoControls'
import { Confirm, cx, IconButton } from '@/components/ui'

const ICONS: Record<string, typeof Home> = {
  home: Home, history: History, scan: ScanLine, notifications: Bell, me: User, transfer: Send, receive: QrCode, pay: CreditCard,
  bills: FileText, sources: Landmark, limits: Gauge, security: ShieldCheck, profile: User, support: HelpCircle, device: Smartphone,
}

export function SampleBadge({ className }: { className?: string }) {
  return <span className={cx('inline-flex h-6 items-center rounded-full border border-line bg-surface px-2.5 text-[12px] font-medium text-muted', className)}>Dữ liệu mẫu</span>
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

function SideLink({ item }: { item: NavItem }) {
  const Icon = ICONS[item.id] ?? Wallet
  const { pathname } = useLocation()
  const active = isActive(pathname, item.route) || (item.id === 'pay' && pathname.startsWith('/pay'))
  return (
    <NavLink
      to={item.route!}
      aria-current={active ? 'page' : undefined}
      className={cx('flex h-11 items-center gap-3 rounded-full px-4 text-[15px] no-underline', active ? 'bg-primary-soft font-semibold text-primary-ink' : 'text-ink hover:bg-line-soft')}
    >
      <Icon size={20} strokeWidth={1.75} aria-hidden />
      {item.label}
    </NavLink>
  )
}

function AccountMenu() {
  const w = useWorld()
  const nav = useNavigate()
  const [confirm, setConfirm] = useState(false)
  return (
    <>
      <DropdownMenu.Root>
        <DropdownMenu.Trigger asChild>
          <button aria-label="Tài khoản" className="inline-flex size-10 items-center justify-center rounded-full bg-primary text-[13px] font-semibold text-white">
            {w.customer.name.split(' ').slice(-2).map((p) => p[0]).join('')}
          </button>
        </DropdownMenu.Trigger>
        <DropdownMenu.Portal>
          <DropdownMenu.Content align="end" sideOffset={8} className="z-50 min-w-[220px] rounded-[16px] border border-line bg-surface p-2 shadow-[var(--shadow-float)]">
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
      <Confirm open={confirm} onOpenChange={setConfirm} title="Đăng xuất khỏi ví?" body="Bản demo sẽ quay về màn Mở ví." confirmLabel="Đăng xuất" onConfirm={() => { signOut(); nav('/onboarding') }} danger />
    </>
  )
}

function WebShell({ children }: { children: ReactNode }) {
  const w = useWorld()
  const unread = unreadCount(w)
  return (
    <div className="flex min-h-dvh">
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50 focus:rounded-full focus:bg-ink focus:px-4 focus:py-2 focus:text-white">Bỏ qua điều hướng</a>
      <aside className="sticky top-0 flex h-dvh w-[232px] shrink-0 flex-col bg-surface-2 px-3 py-5">
        <Link to="/home" className="mb-6 flex items-center gap-2 px-4 text-[20px] font-extrabold tracking-tight text-ink no-underline" aria-label="Wallet, về Trang chủ">
          <span aria-hidden className="inline-flex size-8 items-center justify-center rounded-[10px] bg-primary text-white"><Wallet size={18} strokeWidth={2} /></span>
          Wallet
        </Link>
        <nav aria-label="Điều hướng chính" className="flex flex-1 flex-col gap-1 overflow-y-auto">
          {sidebar.map((x) =>
            'group' in x ? (
              <div key={x.group} className="mt-4">
                <p className="mb-1 px-4 text-[12px] font-semibold text-muted">{x.group}</p>
                {x.items.map((i) => <SideLink key={i.id} item={i} />)}
              </div>
            ) : (
              <SideLink key={x.id} item={x} />
            ),
          )}
        </nav>
        <SampleBadge className="mx-4 mt-4 self-start" />
      </aside>
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-16 items-center justify-end gap-2 border-b border-line-soft bg-surface/95 px-8 backdrop-blur-sm">
          <Link to="/notifications" aria-label={unread ? `Thông báo, ${unread} chưa đọc` : 'Thông báo'} className="relative inline-flex size-11 items-center justify-center rounded-full text-ink hover:bg-surface-2">
            <Bell size={20} strokeWidth={1.75} aria-hidden />
            {unread ? <span className="absolute top-1.5 right-1 min-w-[18px] rounded-full bg-danger px-1 text-center text-[11px] leading-[18px] font-semibold text-white tnum">{unread > 99 ? '99+' : unread}</span> : null}
          </Link>
          <DemoControlsButton />
          <span aria-hidden className="mx-2 h-6 w-px bg-line" />
          <AccountMenu />
        </header>
        <main id="main" className="w-full max-w-[768px] flex-1 px-12 pt-10 pb-24">{children}</main>
      </div>
    </div>
  )
}

/* ── App layout ───────────────────────────────────────────────────── */

function TabBar() {
  const { pathname } = useLocation()
  const w = useWorld()
  const unread = unreadCount(w)
  return (
    <nav aria-label="Điều hướng chính" className="fixed inset-x-0 bottom-0 z-30 border-t border-line-soft bg-surface/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-sm">
      <ul className="mx-auto grid h-16 max-w-[560px] grid-cols-5">
        {tabBar.map((t) => {
          const Icon = ICONS[t.id] ?? Wallet
          const active = isActive(pathname, t.route) || (t.id === 'me' && pathname.startsWith('/me')) || (t.id === 'scan' && pathname === '/pay/scan')
          if (t.emphasis === 'center')
            return (
              <li key={t.id} className="flex justify-center">
                <Link to={t.route!} aria-label={t.label} aria-current={active ? 'page' : undefined} className="-mt-5 flex flex-col items-center gap-1 no-underline">
                  <span className="inline-flex size-14 items-center justify-center rounded-full bg-primary text-white shadow-[var(--shadow-float)]"><Icon size={26} strokeWidth={2} aria-hidden /></span>
                  <span className="text-[11px] leading-3 font-semibold text-ink">{t.label}</span>
                </Link>
              </li>
            )
          return (
            <li key={t.id}>
              <Link to={t.route!} aria-current={active ? 'page' : undefined} className={cx('relative flex h-full flex-col items-center justify-center gap-1 no-underline', active ? 'text-primary' : 'text-muted')}>
                <Icon size={22} strokeWidth={active ? 2.25 : 1.75} aria-hidden />
                <span className={cx('text-[11px] leading-3', active ? 'font-semibold' : 'font-medium')}>{t.label}</span>
                {t.badge && unread ? <span className="absolute top-2 left-1/2 ml-1.5 min-w-[18px] rounded-full bg-danger px-1 text-center text-[11px] leading-[18px] font-semibold text-white tnum" aria-label={`${unread} chưa đọc`}>{unread > 99 ? '99+' : unread}</span> : null}
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}

export function AppHeader({ title, back, right }: { title: string; back?: boolean | string; right?: ReactNode }) {
  const nav = useNavigate()
  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-1 bg-surface/95 px-2 backdrop-blur-sm">
      {back ? (
        <IconButton label="Quay lại" onClick={() => (typeof back === 'string' ? nav(back) : nav(-1))}><ArrowLeft size={22} strokeWidth={1.75} /></IconButton>
      ) : <span className="w-3" />}
      <p className="flex-1 truncate text-[17px] font-bold">{title}</p>
      {right}
    </header>
  )
}

function AppShell({ children }: { children: ReactNode }) {
  const { pathname } = useLocation()
  const s = screenFor(pathname)
  const root = isTabRoot(pathname)
  return (
    <div className="min-h-dvh">
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50 focus:rounded-full focus:bg-ink focus:px-4 focus:py-2 focus:text-white">Bỏ qua điều hướng</a>
      <AppHeader
        title={root && pathname === '/home' ? 'Wallet' : s?.title ?? 'Wallet'}
        back={!root}
        right={<div className="flex items-center gap-1 pr-1"><SampleBadge /><DemoControlsButton compact /></div>}
      />
      <main id="main" className="mx-auto w-full max-w-[560px] px-5 pt-2 pb-28">{children}</main>
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
      className="fixed right-6 bottom-6 z-40 inline-flex h-12 items-center gap-2 rounded-full bg-ink pr-5 pl-4 text-[14px] font-semibold text-white shadow-[var(--shadow-float)] hover:bg-ink/85"
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

