import { Check, Clock, X } from 'lucide-react'
import type { ReactNode } from 'react'
import { gateOf, useWorld } from '@/app/store'
import { Avatar, Badge, Callout, Card, cx, Skeleton } from '@/components/ui'
import { formatPhone } from '@/features/flow/FlowKit'
import { fmtYmd } from '@/features/hom/selectors'
import { GateCallout } from './Gate'
import { KYC_LABEL, KYC_TONE, maskId, ScreenTitle, useLoaded, WALLET_LABEL } from './kit'

/** US-SEC-008. Nothing is editable in P0 (name and ID come from eKYC). */
export default function ProfilePage() {
  const w = useWorld()
  const loaded = useLoaded()
  const c = w.customer
  const gate = gateOf(w)
  const hasId = c.kycStatus !== 'unverified'
  const none = <span className="text-muted">Chưa có</span>
  const tone = KYC_TONE[c.kycStatus]
  const KycIcon = tone === 'success' ? Check : tone === 'pending' ? Clock : X

  const rows: [string, ReactNode][] = [
    ['Họ và tên', c.name],
    ['Số điện thoại', <span className="tnum">{formatPhone(c.phone)}</span>],
    ['Số ví', <span className="tnum">{formatPhone(c.walletNumber)}</span>],
    ['Số CCCD', hasId ? <span className="tnum whitespace-nowrap">{maskId(c.idNumber)}</span> : none],
    ['Ngày hết hạn CCCD', hasId ? <span className="tnum">{fmtYmd(c.idExpiry)}</span> : none],
    ['Phương thức xác thực', c.kycMethod ? (c.kycMethod === 'nfc' ? 'Chip CCCD (NFC)' : 'VNeID') : none],
    ['Trạng thái xác thực', (
      <span className={cx('inline-flex items-center gap-1.5', tone === 'success' ? 'text-ink' : tone === 'pending' ? 'text-pending' : 'text-danger')}>
        <KycIcon size={16} strokeWidth={2.25} aria-hidden />{KYC_LABEL[c.kycStatus]}
      </span>
    )],
    ['Trạng thái ví', (
      <span className={cx('inline-flex items-center gap-1.5', w.walletStatus === 'active' ? 'text-ink' : 'text-danger')}>
        <span aria-hidden className={cx('size-2 rounded-full', w.walletStatus === 'active' ? 'bg-success' : 'bg-danger')} />{WALLET_LABEL[w.walletStatus]}
      </span>
    )],
  ]

  return (
    <div>
      <ScreenTitle>Hồ sơ và xác thực</ScreenTitle>
      <div className="card flex items-center gap-4 p-5">
        <Avatar name={c.name} size={64} />
        <div className="min-w-0 flex-1 pt-1">
          <p className="text-[17px] leading-[26px] font-bold break-words">{c.name}</p>
          <div className="mt-1"><Badge tone={tone}>{KYC_LABEL[c.kycStatus]}</Badge></div>
        </div>
      </div>

      {c.kycStatus === 'id_expiring' ? (
        <div className="mt-6"><Callout tone="pending" title={`CCCD của bạn hết hạn vào ${fmtYmd(c.idExpiry)}. Sau ngày này ví sẽ tạm ngừng giao dịch.`} /></div>
      ) : null}
      {gate ? <div className="mt-6"><GateCallout gate={gate} /></div> : null}

      <Card className="mt-6 px-4">
        <dl className="divide-y divide-line-soft">
          {rows.map(([k, v]) => (
            <div key={k} className="flex min-h-12 items-start justify-between gap-4 py-3">
              <dt className="shrink-0 text-muted">{k}</dt>
              <dd className="min-w-0 text-right font-medium break-words">{loaded ? v : <Skeleton className="ml-auto h-4 w-28" />}</dd>
            </div>
          ))}
        </dl>
      </Card>
    </div>
  )
}
