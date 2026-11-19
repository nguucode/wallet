import { useEffect, useRef, useState } from 'react'
import { delay, now } from '@/app/store'
import { Button, cx, Field, TextInput } from '@/components/ui'
import { formatPhone } from '@/features/flow/FlowKit'
import { StepShell, useOnb } from './Frame'
import { checkOtp, isValidVnMobile, OTP } from './steps'

/** US-ONB-002: phone. */
export function PhoneStep() {
  const { draft, setDraft, go } = useOnb()
  const [digits, setDigits] = useState(draft.phone.replace(/\D/g, ''))
  const [error, setError] = useState<string>()
  const [busy, setBusy] = useState(false)
  const ready = digits.length === 10 && digits.startsWith('0')
  const validate = () => (isValidVnMobile(digits) ? true : (setError('Số điện thoại không hợp lệ'), false))
  const submit = async () => {
    if (!validate()) return
    setBusy(true)
    await delay()
    setBusy(false)
    setDraft({ phone: digits, otpSentAt: now(), otpAttemptsLeft: OTP.attempts })
    go('otp')
  }
  return (
    <StepShell title="Nhập số điện thoại" footer={<Button block disabled={!ready} loading={busy} onClick={submit}>Tiếp tục</Button>}>
      <Field label="Số điện thoại" htmlFor="phone" error={error} hint="Số điện thoại này sẽ là số ví của bạn.">
        <TextInput
          id="phone" type="tel" inputMode="numeric" autoComplete="tel-national" placeholder="0901 234 567" invalid={!!error}
          value={formatPhone(digits)} className="tnum"
          onChange={(e) => { setError(undefined); setDigits(e.target.value.replace(/\D/g, '').slice(0, 10)) }}
          onBlur={() => digits.length > 0 && validate()}
          onKeyDown={(e) => e.key === 'Enter' && ready && submit()}
        />
      </Field>
    </StepShell>
  )
}

import { mmss } from '@/app/format'

/** US-ONB-002: OTP, checked on the sixth digit; attempts, resend cooldown and expiry from OTP config. */
export function OtpStep() {
  const { draft, setDraft, go } = useOnb()
  const [code, setCode] = useState('')
  const [error, setError] = useState<string>()
  const [checking, setChecking] = useState(false)
  const [, tick] = useState(0)
  const input = useRef<HTMLInputElement>(null)
  useEffect(() => { const t = setInterval(() => tick((n) => n + 1), 1000); return () => clearInterval(t) }, [])
  const sentAt = draft.otpSentAt ?? now()
  const attemptsLeft = draft.otpAttemptsLeft ?? OTP.attempts
  const exhausted = attemptsLeft <= 0
  const wait = Math.max(0, OTP.resendSeconds - Math.floor((now() - sentAt) / 1000))

  const resend = async () => {
    setError(undefined)
    setCode('')
    await delay()
    setDraft({ otpSentAt: now(), otpAttemptsLeft: OTP.attempts })
    input.current?.focus()
  }
  const verify = async (c: string) => {
    setChecking(true)
    await new Promise((r) => setTimeout(r, 250))
    setChecking(false)
    const r = checkOtp({ attemptsLeft, sentAt }, c, now())
    if (r.kind === 'ok') return go('pin')
    setCode('')
    if (r.kind === 'wrong') { setDraft({ otpAttemptsLeft: r.attemptsLeft }); setError(`Mã OTP không đúng. Còn ${r.attemptsLeft} lần thử.`) }
    if (r.kind === 'exhausted') { setDraft({ otpAttemptsLeft: 0 }); setError('Bạn đã nhập sai quá số lần cho phép. Hãy gửi lại mã.') }
    if (r.kind === 'expired') setError('Mã OTP đã hết hạn. Hãy gửi lại mã.')
    input.current?.focus()
  }

  return (
    <StepShell title="Nhập mã OTP" description={<>Mã gồm 6 số đã gửi đến <span className="whitespace-nowrap tnum">{formatPhone(draft.phone)}</span></>}>
      <label htmlFor="otp" className="sr-only">Mã OTP 6 số</label>
      <div className="relative mx-auto w-fit">
        <input
          id="otp" ref={input} autoFocus inputMode="numeric" autoComplete="one-time-code" maxLength={6}
          value={code} readOnly={checking} disabled={exhausted}
          aria-invalid={!!error || undefined} aria-describedby="otp-msg otp-note"
          onChange={(e) => { const v = e.target.value.replace(/\D/g, '').slice(0, 6); setCode(v); setError(undefined); if (v.length === 6) verify(v) }}
          className="peer absolute inset-0 z-10 w-full cursor-text opacity-0"
        />
        <div aria-hidden className="flex gap-2 rounded-[12px] peer-focus-visible:outline-2 peer-focus-visible:outline-offset-4 peer-focus-visible:outline-tint">
          {Array.from({ length: 6 }, (_, i) => (
            <span key={i} className={cx('flex size-11 items-center justify-center rounded-[12px] border text-[20px] font-semibold tnum lg:size-12', error ? 'border-danger' : i === code.length ? 'border-ink' : 'border-line', exhausted && 'bg-surface-2')}>
              {code[i] ?? ''}
            </span>
          ))}
        </div>
      </div>
      <p id="otp-msg" role="alert" className="mt-3 min-h-5 text-center text-[13px] leading-5 text-danger">{error}</p>
      <p id="otp-note" className="mt-1 text-center text-[13px] text-muted">Mô phỏng: mã OTP là 123456</p>
      <div className="mt-6 flex flex-col items-center gap-1">
        {wait > 0 && !exhausted ? (
          <p className="text-[15px] text-muted">Gửi lại mã sau <span className="tnum">{mmss(wait)}</span></p>
        ) : (
          <Button variant="ghost" onClick={resend}>Gửi lại mã</Button>
        )}
        <Button variant="ghost" onClick={() => go('phone')}>Đổi số điện thoại</Button>
      </div>
      {checking ? <p role="status" className="sr-only">Đang kiểm tra mã</p> : null}
    </StepShell>
  )
}
