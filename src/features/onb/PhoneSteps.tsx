import { useEffect, useRef, useState } from 'react'
import { mmss } from '@/app/format'
import { delay, now } from '@/app/store'
import { Button, cx, Field, TextInput } from '@/components/app-ui'
import { Box } from '@/components/ui/box'
import { HStack } from '@/components/ui/hstack'
import { Input, InputField } from '@/components/ui/input'
import { Text } from '@/components/ui/text'
import { VStack } from '@/components/ui/vstack'
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
          value={formatPhone(digits)} className="tabular-nums"
          onChange={(e) => { setError(undefined); setDigits(e.target.value.replace(/\D/g, '').slice(0, 10)) }}
          onBlur={() => digits.length > 0 && validate()}
          onKeyDown={(e) => e.key === 'Enter' && ready && submit()}
        />
      </Field>
    </StepShell>
  )
}

/** US-ONB-002: OTP, checked on the sixth digit; attempts, resend cooldown and expiry from OTP config. */
export function OtpStep() {
  const { draft, setDraft, go } = useOnb()
  const [code, setCode] = useState('')
  const [error, setError] = useState<string>()
  const [checking, setChecking] = useState(false)
  const [, tick] = useState(0)
  const input = useRef<{ focus: () => void }>(null)
  const [focused, setFocused] = useState(false)
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
    <StepShell title="Nhập mã OTP" description={<>Mã gồm 6 số đã gửi đến <Text className="whitespace-nowrap tabular-nums text-muted-foreground">{formatPhone(draft.phone)}</Text></>}>
      <Box className="relative mx-auto w-fit">
        {/* One real input sits invisibly over the six boxes; the boxes only mirror its value. */}
        <Input isDisabled={exhausted} isReadOnly={checking} className="absolute inset-0 z-10 h-full w-full cursor-text border-0 opacity-0 data-[disabled=true]:opacity-0">
          <InputField
            id="otp" ref={input as never} autoFocus inputMode="numeric" autoComplete={'one-time-code' as never} maxLength={6}
            aria-label="Mã OTP 6 số"
            value={code}
            aria-invalid={!!error || undefined} aria-describedby="otp-msg otp-note"
            onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
            onChangeText={(t: string) => { const v = t.replace(/\D/g, '').slice(0, 6); setCode(v); setError(undefined); if (v.length === 6) verify(v) }}
          />
        </Input>
        <HStack aria-hidden className={cx('gap-2 rounded-xl', focused && 'ring-2 ring-ring ring-offset-4')}>
          {Array.from({ length: 6 }, (_, i) => (
            <Box key={i} className={cx('flex size-11 items-center justify-center rounded-xl border lg:size-12', error ? 'border-destructive' : i === code.length ? 'border-foreground' : 'border-border', exhausted && 'bg-muted')}>
              <Text size="xl" className="font-semibold tabular-nums">{code[i] ?? ''}</Text>
            </Box>
          ))}
        </HStack>
      </Box>
      <Text id="otp-msg" role="alert" size="sm" className="mt-3 block min-h-5 text-center text-destructive">{error}</Text>
      <Text id="otp-note" data-align="free" size="sm" className="mt-1 block text-center text-muted-foreground">Mô phỏng: mã OTP là 123456</Text>
      <VStack className="mt-6 items-center gap-1">
        {wait > 0 && !exhausted ? (
          <Text className="text-muted-foreground">Gửi lại mã sau <Text className="tabular-nums text-muted-foreground">{mmss(wait)}</Text></Text>
        ) : (
          <Button variant="ghost" onClick={resend}>Gửi lại mã</Button>
        )}
        <Button variant="ghost" onClick={() => go('phone')}>Đổi số điện thoại</Button>
      </VStack>
      {checking ? <Text role="status" className="sr-only">Đang kiểm tra mã</Text> : null}
    </StepShell>
  )
}
