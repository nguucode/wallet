import { BellOff, CheckCheck, FileText, HelpCircle, IdCard, ShieldCheck, Smartphone, Wallet } from 'lucide-react'
import { useNavigate, useSearchParams } from 'react-router'
import { useLayout } from '@/app/layout'
import { markRead, now, useWorld } from '@/app/store'
import type { Notification, NotificationKind } from '@/mock/seed'
import { cx, Disc, EmptyState, IconButton, Segmented, Skeleton } from '@/components/ui'
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
      ? <button type="button" onClick={() => markRead(unreadIds)} className="h-11 shrink-0 rounded-full px-3 text-[14px] font-semibold text-white hover:bg-white/15">Đánh dấu tất cả đã đọc</button>
      : <IconButton label="Đánh dấu tất cả đã đọc" onClick={() => markRead(unreadIds)} className="shrink-0 text-white hover:bg-white/15"><CheckCheck size={22} strokeWidth={1.75} /></IconButton>
  ) : null

  return (
    <div>
      <ScreenTitle>Thông báo</ScreenTitle>
      <div className="flex items-center gap-2">
        <div className="min-w-0 flex-1">
          <Segmented
            label="Loại thông báo"
            value={view.slug}
            onChange={(slug) => { const p = new URLSearchParams(params); p.set('view', slug); setParams(p, { replace: true }) }}
            options={VIEWS.map((v) => {
              const c = w.notifications.filter(inView(v.kinds)).filter((n) => !n.read).length
              return { value: v.slug, label: v.label, count: loaded && c ? c : undefined }
            })}
          />
        </div>
        {markAll}
      </div>

      <div className="mt-4">
        {!loaded ? (
          <div aria-busy>{Array.from({ length: 8 }, (_, i) => <RowSkeleton key={i} />)}</div>
        ) : !items.length ? (
          <EmptyState icon={<BellOff size={22} strokeWidth={1.75} />} title={view.empty} />
        ) : (
          groups.map((g) => (
            <section key={g.label} aria-label={g.label} className="card mt-4 px-4 pt-4 first:mt-2">
              <h2 className="label-caps">{g.label}</h2>
              <ul className="divide-y divide-line-soft">
                {g.items.map((n) => {
                  const Icon = ICON[n.kind]
                  return (
                    <li key={n.id}>
                      <button type="button" onClick={() => open(n)} className="-mx-2 flex min-h-[72px] w-[calc(100%+16px)] items-start gap-3 rounded-xl px-2 py-3 text-left hover:bg-surface-2">
                        <Disc size={48}><Icon size={22} strokeWidth={1.75} /></Disc>
                        <span className="min-w-0 flex-1">
                          <span className="flex items-baseline gap-2">
                            <span className={cx('min-w-0 flex-1 tnum', n.read ? 'font-medium' : 'font-bold')}>{n.title}</span>
                            <span className="shrink-0 text-[13px] leading-[18px] text-muted tnum">{fmtTime(n.createdAt)}</span>
                          </span>
                          {n.body ? <span className="mt-0.5 line-clamp-2 block text-[14px] leading-5 text-muted">{n.body}</span> : null}
                        </span>
                        {n.read ? <span className="w-2 shrink-0" /> : (
                          <span className="mt-2 size-2 shrink-0 rounded-full bg-ink"><span className="sr-only">Chưa đọc</span></span>
                        )}
                      </button>
                    </li>
                  )
                })}
              </ul>
            </section>
          ))
        )}
      </div>
    </div>
  )
}

function RowSkeleton() {
  return (
    <div className="flex min-h-[72px] items-start gap-3 py-3" aria-hidden>
      <Skeleton className="size-12 rounded-full" />
      <span className="flex-1 space-y-2"><Skeleton className="h-4 w-1/2" /><Skeleton className="h-3 w-4/5" /></span>
    </div>
  )
}
