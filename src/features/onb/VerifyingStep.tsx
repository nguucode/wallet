import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router'
import { getState, mutate, submitVerification, type Settings } from '@/app/store'
import { Button } from '@/components/ui'
import { StatusMark, StepShell, useOnb } from './Frame'
import { mark } from './marks'
import { retryStepFor, type FailReason } from './steps'

const FAIL: Record<FailReason, { body: string; action: string }> = {
  blurry_id: { body: 'Ảnh CCCD bị mờ hoặc lóa nên không đọc được thông tin.', action: 'Chụp lại CCCD' },
  chip_unreadable: { body: 'Không đọc được chip CCCD. Hãy tháo ốp lưng và giữ thẻ sát mặt lưng điện thoại.', action: 'Đọc lại chip' },
  face_mismatch: { body: 'Khuôn mặt không khớp với ảnh trong chip CCCD.', action: 'Xác thực lại khuôn mặt' },
  weak_network: { body: 'Mạng yếu nên chưa gửi được hồ sơ.', action: 'Thử lại' },
}

/** US-ONB-008: applies the Demo-controls "Verification result" through submitVerification. */
export function VerifyingStep() {
  const { draft, go, clear } = useOnb()
  const nav = useNavigate()
  const path = draft.path ?? 'vneid'
  const [attempt, setAttempt] = useState(0)
  const [result, setResult] = useState<Settings['verification'] | null>(null)
  const ran = useRef(-1)
  useEffect(() => {
    if (ran.current === attempt) return
    ran.current = attempt
    setResult(null)
    mutate((w) => { w.customer.kycStatus = 'verifying' })
    submitVerification(path)
      .catch(() => 'weak_network' as const) // a store error reads as "mạng yếu"
      .then((v) => {
        if (v === 'verified' || v === 'needs_review') mark('verifiedAt')
        setResult(v)
        if (v === 'verified') setTimeout(() => go('warning', { replace: true }), 1000)
      })
  }, [attempt]) // eslint-disable-line react-hooks/exhaustive-deps

  if (!result)
    return (
      <StepShell title="Đang đối chiếu thông tin…">
        <div role="status" className="flex flex-col items-center py-8 text-center">
          <span aria-hidden className="size-12 animate-spin rounded-full border-4 border-current border-r-transparent" />
          <p className="mt-4 text-muted">Thường mất vài giây.</p>
        </div>
      </StepShell>
    )

  if (result === 'verified')
    return (
      <StepShell title="Xác thực thành công">
        <div role="status" className="flex flex-col items-center py-8"><StatusMark tone="primary" /><p className="sr-only">Xác thực thành công</p></div>
      </StepShell>
    )

  if (result === 'needs_review')
    return (
      <StepShell title="Hồ sơ đang được kiểm tra" footer={<Button block onClick={() => go('warning', { replace: true })}>Tiếp tục</Button>}>
        <div role="status" className="flex flex-col items-center text-center">
          <StatusMark tone="pending" />
          <p className="mt-4 max-w-[44ch]">Thường xong trong 24 giờ. Bạn vẫn có thể hoàn tất mở ví, nhưng chưa giao dịch được cho đến khi có kết quả.</p>
        </div>
      </StepShell>
    )

  const f = FAIL[result]
  const target = retryStepFor(result, path)
  // "Để sau" needs an existing wallet (unverified); a brand-new customer has nowhere to land yet.
  const canLeave = getState().world.signedIn
  return (
    <StepShell title="Chưa xác thực được" footer={<>
      <Button block onClick={() => (target === 'verifying' ? setAttempt((a) => a + 1) : go(target))}>{f.action}</Button>
      {canLeave ? <Button variant="ghost" block onClick={() => { clear(); nav('/home') }}>Để sau</Button> : null}
    </>}>
      <div role="alert" className="flex flex-col items-center text-center">
        <StatusMark tone="danger" />
        <p className="mt-4 max-w-[44ch]">{f.body}</p>
      </div>
    </StepShell>
  )
}
