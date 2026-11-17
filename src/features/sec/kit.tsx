import { useEffect, useState, type ReactNode } from 'react'
import { useLayout } from '@/app/layout'
import { delay } from '@/app/store'
import type { KycStatus, WalletStatus } from '@/domain/gate'
import { PageTitle } from '@/components/ui'

/** Feature-local helpers shared by HOM, NTF and SEC pages. */

/** First render shows skeletons for one simulated network round trip (Demo controls latency). */
export function useLoaded() {
  const [ok, setOk] = useState(false)
  useEffect(() => {
    let live = true
    void delay().then(() => live && setOk(true))
    return () => { live = false }
  }, [])
  return ok
}

/** Page h1: visible on web; on app the shell header already shows the title, so the h1 is sr-only but still takes focus. */
export function ScreenTitle({ children, description }: { children: ReactNode; description?: ReactNode }) {
  const layout = useLayout()
  if (layout === 'web') return <PageTitle description={description}>{children}</PageTitle>
  return (
    <>
      <h1 tabIndex={-1} data-page-title className="sr-only">{children}</h1>
      {description ? <p className="mb-5 text-muted">{description}</p> : null}
    </>
  )
}

/** Small transient confirmation. shortcut: local toast, no shared queue; move to components/ui when a second epic needs one. */
export function useToast() {
  const [msg, setMsg] = useState<string>()
  useEffect(() => {
    if (!msg) return
    const t = setTimeout(() => setMsg(undefined), 3000)
    return () => clearTimeout(t)
  }, [msg])
  const node = (
    <div role="status" aria-live="polite" className="pointer-events-none fixed inset-x-0 bottom-24 z-50 flex justify-center px-5 lg:bottom-8">
      {msg ? <span className="rounded-full bg-ink px-5 py-3 text-[14px] font-medium text-white shadow-[var(--shadow-float)]">{msg}</span> : null}
    </div>
  )
  return { show: setMsg, node }
}

export const KYC_LABEL: Record<KycStatus, string> = {
  unverified: 'Chưa xác thực', verifying: 'Đang kiểm tra', verified: 'Đã xác thực', id_expiring: 'CCCD sắp hết hạn', id_expired: 'CCCD đã hết hạn',
}
export const KYC_TONE: Record<KycStatus, 'neutral' | 'pending' | 'danger' | 'success'> = {
  unverified: 'danger', verifying: 'pending', verified: 'success', id_expiring: 'pending', id_expired: 'danger',
}
export const WALLET_LABEL: Record<WalletStatus, string> = {
  active: 'Đang hoạt động', suspended: 'Tạm ngừng giao dịch', locked: 'Tạm khóa', closed: 'Đã đóng',
}
/** rules.md decisions: CCCD keeps its 12-digit length, `001*******45`. */
export const maskId = (id: string) => id.slice(0, 3) + '*'.repeat(Math.max(0, id.length - 5)) + id.slice(-2)
