import { useState } from 'react'
import { delay, startOnboarding } from '@/app/store'
import { PinPad } from '@/features/sec/AuthSheet'
import { StepShell, useOnb } from './Frame'
import { mark } from './marks'

/** US-ONB-003: create + confirm a 6-digit PIN. No "remember" or "show PIN" option (TT 50 Đ.8 k.5). */
export function PinStep() {
  const { draft, go } = useOnb()
  const [first, setFirst] = useState<string | null>(null)
  const [error, setError] = useState<string>()
  const [saving, setSaving] = useState(false)
  const onComplete = async (pin: string) => {
    if (!first) { setError(undefined); return setFirst(pin) }
    if (pin !== first) { setFirst(null); return setError('Mã PIN không khớp. Hãy tạo lại.') }
    setSaving(true)
    await delay()
    startOnboarding(draft.phone, pin)
    mark('pinSetAt')
    go('id-method')
  }
  return (
    <StepShell title={first ? 'Nhập lại mã PIN' : 'Tạo mã PIN'} description="Mã PIN gồm 6 số, dùng để xác thực giao dịch.">
      {/* Remount between phases so the dots start empty. */}
      <PinPad key={first ? 'confirm' : 'create'} label={first ? 'Nhập lại mã PIN 6 số' : 'Tạo mã PIN 6 số'} error={error} disabled={saving} onComplete={onComplete} />
      <p role="status" className="mt-2 min-h-5 text-center text-[13px] text-muted">{saving ? 'Đang lưu mã PIN…' : ''}</p>
      <p className="mt-6 rounded-[12px] bg-surface-2 p-4 text-[14px] leading-5">Không chia sẻ mã PIN với bất kỳ ai, kể cả nhân viên Wallet.</p>
    </StepShell>
  )
}
