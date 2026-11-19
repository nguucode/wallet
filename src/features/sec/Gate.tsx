import { useState, type ReactNode } from 'react'
import { useNavigate } from 'react-router'
import type { GateId } from '@/domain/gate'
import { gateOf, getState, useWorld } from '@/app/store'
import { Button, Callout, Sheet } from '@/components/ui'

/** rules.md#gates copy: why the money action is blocked and the single next step. */
export const GATE_COPY: Record<GateId, { title: string; body: string; cta?: { label: string; to: string } }> = {
  kyc: { title: 'Ví chưa được xác thực sinh trắc học', body: 'Theo quy định, bạn cần đối chiếu khuôn mặt với CCCD gắn chip hoặc VNeID trước khi giao dịch. Bạn vẫn xem được số dư và lịch sử.', cta: { label: 'Xác thực ngay', to: '/onboarding?step=id-method' } },
  kyc_review: { title: 'Ví chưa được xác thực sinh trắc học', body: 'Đang kiểm tra, thường xong trong 24 giờ. Chúng tôi sẽ báo ngay khi ví sẵn sàng giao dịch.' },
  suspended: { title: 'Giấy tờ tùy thân đã hết hạn, ví tạm ngừng giao dịch', body: 'Theo quy định, ví tạm ngừng giao dịch cho đến khi bạn cập nhật giấy tờ mới.' },
  locked: { title: 'Ví đang tạm khóa', body: 'Mọi giao dịch đã được tạm dừng để bảo vệ tài khoản. Liên hệ hỗ trợ để mở khóa.', cta: { label: 'Liên hệ hỗ trợ', to: '/support' } },
  no_source: { title: 'Cần liên kết ngân hàng chính chủ trước khi dùng ví', body: 'Theo quy định, ví chỉ dùng được sau khi liên kết tài khoản hoặc thẻ ghi nợ đứng tên bạn.', cta: { label: 'Liên kết ngân hàng', to: '/me/sources/link' } },
}

export function GateCallout({ gate }: { gate: GateId }) {
  const nav = useNavigate()
  const c = GATE_COPY[gate]
  return (
    <Callout tone="pending" title={c.title} action={c.cta ? <Button size="sm" onClick={() => nav(c.cta!.to)}>{c.cta.label}</Button> : undefined}>
      {c.body}
    </Callout>
  )
}

/**
 * Wraps a money entry point (rules.md#gates: gate shows at the entry, before any amount is typed).
 * `allow` lets an entry ignore some gates (e.g. /receive only respects suspended/locked).
 */
export function useGuard(allow: GateId[] = []) {
  const [gate, setGate] = useState<GateId | null>(null)
  const nav = useNavigate()
  const guard = (to: string | (() => void)) => {
    const g = gateOf(getState().world)
    if (g && !allow.includes(g)) return setGate(g)
    if (typeof to === 'string') nav(to)
    else to()
  }
  const sheet: ReactNode = gate ? (
    <Sheet open onOpenChange={(o) => !o && setGate(null)} title={GATE_COPY[gate].title} description={GATE_COPY[gate].body}>
      <div className="flex flex-col gap-2">
        {GATE_COPY[gate].cta ? <Button block onClick={() => { setGate(null); nav(GATE_COPY[gate].cta!.to) }}>{GATE_COPY[gate].cta!.label}</Button> : null}
        <Button variant="secondary" block onClick={() => setGate(null)}>Để sau</Button>
      </div>
    </Sheet>
  ) : null
  return { guard, sheet }
}

/** For a flow route opened directly by URL: render the gate instead of the flow. */
export function GatedRoute({ children, allow = [] }: { children: ReactNode; allow?: GateId[] }) {
  const w = useWorld()
  const g = gateOf(w)
  if (g && !allow.includes(g)) return <div className="pt-stack"><GateCallout gate={g} /></div>
  return <>{children}</>
}
