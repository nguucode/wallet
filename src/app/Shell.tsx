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

export function SampleBadge({ className, onSky, compact }: { className?: string; onSky?: boolean; compact?: boolean }) {
  return (
    <span title="Dữ liệu mẫu" className={cx('inline-flex h-6 items-center rounded-full px-2.5 text-[11px] font-bold tracking-[0.04em] whitespace-nowrap uppercase', onSky ? 'bg-white/15 text-white' : 'bg-surface-2 text-primary-ink', className)}>
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

function SideLink({ item }: { item: NavItem }) {
  const Icon = ICONS[item.id] ?? Wallet
  const { pathname } = useLocation()
  const active = isActive(pathname, item.route) || (item.id === 'pay' && pathname.startsWith('/pay'))
  return (
    <NavLink
      to={item.route!}
      aria-current={active ? 'page' : undefined}
      className={cx('flex h-11 items-center gap-3 rounded-full px-4 text-[15px] no-underline', active ? 'bg-surface font-semibold text-primary-ink shadow-[var(--shadow-card)]' : 'text-ink hover:bg-surface/70')}
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
          <button className="inline-flex size-10 items-center justify-center rounded-full bg-white text-[13px] font-bold text-primary-ink">
            <span aria-hidden>{w.customer.name.split(' ').slice(-2).map((p) => p[0]).join('')}</span>
            <span className="sr-only">Tài khoản</span>
          </button>
        </DropdownMenu.Trigger>
        <DropdownMenu.Portal>
          <DropdownMenu.Content align="end" sideOffset={8} className="z-50 min-w-[220px] card p-2 shadow-[var(--shadow-float)]">
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

function WebShell({ children }: { children: ReactNode }) {
  const w = useWorld()
  const unread = unreadCount(w)
  return (
    <div className="flex min-h-dvh">
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50 focus:rounded-full focus:bg-ink focus:px-4 focus:py-2 focus:text-white">Bỏ qua điều hướng</a>
      <aside className="sticky top-0 z-40 flex h-dvh w-[240px] shrink-0 flex-col bg-surface-2 px-3 py-5">
        <Link to="/home" className="mb-6 flex items-center gap-2 px-4 text-[20px] font-extrabold tracking-tight text-ink no-underline" aria-label="Wallet, về Trang chủ">
          <img src="/icon.svg" alt="" width={32} height={32} className="size-8" />
          Wallet
        </Link>
        <nav aria-label="Điều hướng chính" className="flex flex-1 flex-col gap-1 overflow-y-auto">
          {sidebar.map((x) =>
            'group' in x ? (
              <div key={x.group} className="mt-4">
                <p className="mb-1 px-4 text-[11px] font-bold tracking-[0.06em] text-muted uppercase">{x.group}</p>
                {x.items.map((i) => <SideLink key={i.id} item={i} />)}
              </div>
            ) : (
              <SideLink key={x.id} item={x} />
            ),
          )}
        </nav>
        <SampleBadge className="mx-4 mt-4 self-start" />
      </aside>
      <div className="relative flex min-w-0 flex-1 flex-col">
        <div aria-hidden className="sky pointer-events-none absolute inset-x-0 top-0 h-[300px]" />
        <header className="relative z-30 flex h-16 items-center justify-end gap-2 px-8 text-white">
          <Link to="/notifications" aria-label={unread ? `Thông báo, ${unread} chưa đọc` : 'Thông báo'} className="relative inline-flex size-11 items-center justify-center rounded-full text-white hover:bg-white/15">
            <Bell size={20} strokeWidth={1.75} aria-hidden />
            {unread ? <span className="absolute top-1.5 right-1 min-w-[18px] rounded-full bg-white px-1 text-center text-[11px] leading-[18px] font-bold text-primary-ink tnum">{unread > 9 ? '9+' : unread}</span> : null}
          </Link>
          <DemoControlsButton />
          <span aria-hidden className="mx-2 h-6 w-px bg-white/30" />
          <AccountMenu />
        </header>
        <main id="main" className="relative mx-auto w-full max-w-[768px] flex-1 px-12 pt-4 pb-24">{children}</main>
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
    <nav aria-label="Điều hướng chính" className="fixed inset-x-0 bottom-0 z-30 bg-surface pb-[env(safe-area-inset-bottom)] shadow-[0_-8px_24px_-12px_rgb(28_24_64/0.18)]">
      <ul className="mx-auto grid h-16 max-w-[560px] grid-cols-5">
        {tabBar.map((t) => {
          const Icon = ICONS[t.id] ?? Wallet
          const active = isActive(pathname, t.route) || (t.id === 'me' && pathname.startsWith('/me')) || (t.id === 'scan' && pathname === '/pay/scan')
          if (t.emphasis === 'center')
            return (
              <li key={t.id} className="flex justify-center">
                <Link to={t.route!} aria-label={t.label} aria-current={active ? 'page' : undefined} className="-mt-5 flex flex-col items-center gap-1 no-underline">
                  <span className="sky inline-flex size-14 items-center justify-center rounded-full text-white shadow-[var(--shadow-float)] ring-4 ring-surface"><Icon size={26} strokeWidth={2} aria-hidden /></span>
                  <span className="text-[11px] leading-3 font-semibold text-ink">{t.label}</span>
                </Link>
              </li>
            )
          return (
            <li key={t.id}>
              <Link to={t.route!} aria-current={active ? 'page' : undefined} className={cx('relative flex h-full flex-col items-center justify-center gap-1 no-underline', active ? 'text-primary' : 'text-muted')}>
                <Icon size={22} strokeWidth={active ? 2.25 : 1.75} aria-hidden />
                <span className={cx('text-[11px] leading-3', active ? 'font-semibold' : 'font-medium')}>{t.label}{t.badge && unread ? <span className="sr-only">, {unread} chưa đọc</span> : null}</span>
                {t.badge && unread ? <span className="absolute top-2 left-1/2 ml-1.5 min-w-[18px] rounded-full bg-ink px-1 text-center text-[11px] leading-[18px] font-semibold text-white tnum" aria-hidden>{unread > 9 ? '9+' : unread}</span> : null}
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}

export function AppHeader({ title, back, right, centered }: { title: string; back?: boolean | string; right?: ReactNode; centered?: boolean }) {
  const nav = useNavigate()
  // Transparent over the sky so band and header read as one; solid once content scrolls under it.
  const [solid, setSolid] = useState(false)
  useEffect(() => {
    const on = () => setSolid(window.scrollY > 8)
    on()
    window.addEventListener('scroll', on, { passive: true })
    return () => window.removeEventListener('scroll', on)
  }, [])
  return (
    <header className={cx('sticky top-0 z-30 flex h-14 items-center gap-1 px-2 text-white transition-colors duration-200', solid ? 'bg-sky-from' : 'bg-transparent')}>
      {back ? (
        <IconButton label="Quay lại" className="text-white hover:bg-white/15" onClick={() => (typeof back === 'string' ? nav(back) : nav(-1))}><ArrowLeft size={22} strokeWidth={1.75} /></IconButton>
      ) : <span className="w-3" />}
      {centered ? (
        title === 'Wallet' ? (
          <p className="pointer-events-none absolute inset-x-[100px] flex items-center justify-center gap-2 text-[22px] font-bold tracking-tight">
            <img src="/mark-on-sky.svg" alt="" width={34} height={19} className="h-[19px] w-auto" />{title}
          </p>
        ) : <p className="pointer-events-none absolute inset-x-[100px] truncate text-center text-[17px] font-bold tracking-tight">{title}</p>
      ) : null}
      <p className={cx('flex-1 truncate text-[17px] font-bold', centered && 'invisible')} aria-hidden={centered || undefined}>{centered ? '' : title}</p>
      {right}
    </header>
  )
}

function AppShell({ children }: { children: ReactNode }) {
  const { pathname } = useLocation()
  const s = screenFor(pathname)
  const root = isTabRoot(pathname)
  return (
    <div className="relative min-h-dvh">
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50 focus:rounded-full focus:bg-ink focus:px-4 focus:py-2 focus:text-white">Bỏ qua điều hướng</a>
      <AppHeader
        title={root && pathname === '/home' ? 'Wallet' : s?.title ?? 'Wallet'}
        back={!root}
        centered
        right={<div className="flex items-center gap-0.5"><SampleBadge onSky compact /><DemoControlsButton compact onSky /></div>}
      />
      <div aria-hidden className="sky pointer-events-none absolute inset-x-0 top-0 h-[276px]" />
      <main id="main" className="relative mx-auto w-full max-w-[560px] px-5 pt-3 pb-28">{children}</main>
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
      className={cx("fixed bottom-6 z-40 inline-flex", onDevice ? "right-[404px]" : "right-6") + "  h-12 items-center gap-2 rounded-full bg-ink pr-5 pl-4 text-[14px] font-semibold text-white shadow-[var(--shadow-float)] hover:bg-ink/85"}
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

