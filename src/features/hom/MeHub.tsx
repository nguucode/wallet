import { maskAccount } from '@/app/format'
import { Gauge, HelpCircle, Landmark, ShieldCheck, User } from 'lucide-react'
import { useState } from 'react'
import { Link, useNavigate } from 'react-router'
import { bankById, defaultSource, signOut, useWorld } from '@/app/store'
import { Avatar, Badge, Card, Confirm, Disc, Row, Skeleton } from '@/components/ui'
import { formatPhone } from '@/features/flow/FlowKit'
import { KYC_LABEL, KYC_TONE, ScreenTitle, useLoaded } from '@/features/sec/kit'

/** US-HOM-007. App only: App.tsx redirects web to /me/profile. */
export default function MeHub() {
  const w = useWorld()
  const nav = useNavigate()
  const loaded = useLoaded()
  const [confirm, setConfirm] = useState(false)
  const src = defaultSource(w)
  const kyc = w.customer.kycStatus
  const badge = <Badge tone={KYC_TONE[kyc]}>{KYC_LABEL[kyc]}</Badge>

  const links = [
    { label: 'Nguồn tiền', to: '/me/sources', icon: Landmark, sub: src ? `${bankById(src.bankId).name} · ${maskAccount(src.last4)}` : 'Chưa liên kết' },
    { label: 'Hạn mức', to: '/me/limits', icon: Gauge },
    { label: 'Bảo mật', to: '/me/security', icon: ShieldCheck },
    { label: 'Hồ sơ và xác thực', to: '/me/profile', icon: User },
    { label: 'Trợ giúp', to: '/support', icon: HelpCircle },
  ]

  return (
    <div>
      <ScreenTitle>Tôi</ScreenTitle>
      <Card className="p-inset">
        {!loaded ? (
          <div className="flex items-center gap-3" aria-hidden>
            <Skeleton className="size-14 rounded-full" />
            <span className="flex-1 space-y-header"><Skeleton className="h-5 w-1/2" /><Skeleton className="h-4 w-1/3" /></span>
          </div>
        ) : (
          <div className="flex items-start gap-3">
            <Avatar name={w.customer.name} src={w.customer.photo} size={56} />
            <div className="min-w-0 flex-1">
              <p className="headline break-words">{w.customer.name}</p>
              <p className="tnum text-muted">Số ví {formatPhone(w.customer.walletNumber)}</p>
              <div className="mt-header">
                {kyc === 'unverified' ? (
                  <Link to="/onboarding?step=id-method" aria-label="Chưa xác thực. Xác thực ngay" className="inline-flex min-h-11 items-center no-underline">{badge}</Link>
                ) : badge}
              </div>
            </div>
          </div>
        )}
      </Card>

      <nav aria-label="Tài khoản" className="mt-group">
        <ul className="card overflow-hidden">
          {links.map((l) => (
            <li key={l.to}><Row to={l.to} left={<Disc size={40}><l.icon size={20} strokeWidth={1.75} /></Disc>} title={l.label} subtitle={l.sub || undefined} chevron /></li>
          ))}
        </ul>
      </nav>

      <button type="button" onClick={() => setConfirm(true)} className="card mt-section flex h-12 w-full items-center justify-center text-danger hover:bg-danger-soft">Đăng xuất</button>
      <Confirm
        open={confirm} onOpenChange={setConfirm} title="Đăng xuất khỏi Wallet?" confirmLabel="Đăng xuất" danger
        onConfirm={() => { signOut(); nav('/onboarding') }}
      />
    </div>
  )
}
