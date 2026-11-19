import { Delete, Fingerprint, ScanFace } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { config } from '@/domain/config'
import { formatVnd } from '@/domain/money'
import type { AuthMethod } from '@/domain/types'
import { getState, verifyPin } from '@/app/store'
import { Button, cx, Sheet } from '@/components/ui'

import { fmtTime } from '@/app/format'

/** 6-digit PIN pad. Used by the auth sheet, onboarding and change-PIN. */
export function PinPad({ length = config.pin.length, onComplete, error, disabled, label }: {
  length?: number; onComplete: (pin: string) => void; error?: string; disabled?: boolean; label: string
}) {
  const [pin, setPin] = useState('')
  const [shake, setShake] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  useEffect(() => {
    if (error) { setPin(''); setShake(true); const t = setTimeout(() => setShake(false), 300); return () => clearTimeout(t) }
  }, [error])
  const push = (d: string) => {
    if (disabled) return
    const next = (pin + d).slice(0, length)
    setPin(next)
    if (next.length === length) setTimeout(() => onComplete(next), 80)
  }
  return (
    <div>
      {/* Real input so keyboards, password managers off, and screen readers work. */}
      <label className="sr-only" htmlFor="pin-input">{label}</label>
      <input
        id="pin-input" ref={inputRef} autoFocus inputMode="numeric" autoComplete="off" type="password" maxLength={length}
        value={pin} disabled={disabled}
        onChange={(e) => { const v = e.target.value.replace(/\D/g, '').slice(0, length); setPin(v); if (v.length === length) setTimeout(() => onComplete(v), 80) }}
        className="sr-only"
        aria-invalid={!!error || undefined}
        aria-describedby={error ? 'pin-error' : undefined}
      />
      <button type="button" onClick={() => inputRef.current?.focus()} aria-hidden tabIndex={-1} className={cx('mx-auto flex gap-4 py-3', shake && 'animate-[pulse_300ms]')}>
        {Array.from({ length }, (_, i) => (
          <span key={i} className={cx('size-3.5 rounded-full border-2 transition-colors', i < pin.length ? 'border-tint bg-primary' : 'border-line')} />
        ))}
      </button>
      <p id="pin-error" role="alert" className="min-h-5 text-center text-[13px] leading-5 text-danger">{error}</p>
      <div className="mx-auto mt-2 grid max-w-[320px] grid-cols-3 gap-2 rounded-[24px] bg-primary-soft/60 p-2" aria-hidden>
        {['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', 'del'].map((k) =>
          k === '' ? <span key="blank" /> : (
            <button
              key={k} type="button" tabIndex={-1} disabled={disabled}
              onClick={() => (k === 'del' ? setPin((p) => p.slice(0, -1)) : push(k))}
              className="flex h-14 items-center justify-center rounded-[14px] bg-surface-2 text-[28px] font-normal text-ink hover:bg-primary-soft active:bg-primary-soft-hover disabled:opacity-40"
            >
              {k === 'del' ? <Delete size={22} strokeWidth={1.75} /> : k}
            </button>
          ),
        )}
      </div>
    </div>
  )
}

function FaceScan({ onDone, reason }: { onDone: (ok: boolean) => void; reason: string }) {
  const [attempt, setAttempt] = useState(1)
  const [phase, setPhase] = useState<'ready' | 'scanning' | 'failed' | 'out'>('ready')
  const start = () => {
    setPhase('scanning')
    setTimeout(() => {
      if (getState().settings.faceMatch === 'match') return onDone(true)
      if (attempt >= config.face.maxRetries) setPhase('out')
      else { setPhase('failed'); setAttempt((a) => a + 1) }
    }, 1600)
  }
  return (
    <div className="text-center">
      <p className="text-[15px] text-muted">{reason}</p>
      <div className="relative mx-auto my-6 size-44">
        <svg viewBox="0 0 100 100" className="absolute inset-0" aria-hidden>
          <circle cx="50" cy="50" r="46" fill="none" stroke="var(--color-line)" strokeWidth="3" />
          {phase === 'scanning' ? <circle cx="50" cy="50" r="46" fill="none" stroke="var(--color-tint)" strokeWidth="3" strokeDasharray="289" strokeDashoffset="289" strokeLinecap="round" style={{ animation: 'ring 1.6s linear forwards' }} transform="rotate(-90 50 50)" /> : null}
        </svg>
        <span className="absolute inset-4 flex items-center justify-center rounded-full bg-surface-2"><ScanFace size={64} strokeWidth={1.25} aria-hidden className="text-muted" /></span>
      </div>
      <p role="status" aria-live="polite" className="min-h-10 text-[15px]">
        {phase === 'ready' && 'Đưa khuôn mặt vào giữa khung tròn, giữ máy ngang tầm mắt.'}
        {phase === 'scanning' && 'Đang xác thực…'}
        {phase === 'failed' && <span className="text-danger">Khuôn mặt không khớp với CCCD. Còn {config.face.maxRetries - attempt + 1} lần thử.</span>}
        {phase === 'out' && <span className="text-danger">Bạn đã thử quá số lần cho phép. Thử lại sau.</span>}
      </p>
      {phase === 'out' ? (
        <Button variant="secondary" block className="mt-4" onClick={() => onDone(false)}>Đóng</Button>
      ) : (
        <Button block className="mt-4" loading={phase === 'scanning'} onClick={start}>{phase === 'failed' ? 'Thử lại' : 'Bắt đầu quét'}</Button>
      )}
    </div>
  )
}

/** Step-up auth (US-SEC-001/002). onSuccess runs only after a verified PIN/biometric/face. */
export function AuthSheet({ open, onOpenChange, method, amount, onSuccess }: {
  open: boolean; onOpenChange: (o: boolean) => void; method: AuthMethod; amount: number; onSuccess: (method: AuthMethod) => void
}) {
  const [error, setError] = useState<string>()
  const [usePin, setUsePin] = useState(false)
  const sec = getState().world.security
  const locked = sec.pinLockedUntil && new Date(sec.pinLockedUntil).getTime() > Date.now() + getState().settings.clockOffsetMs
  useEffect(() => { if (open) { setError(undefined); setUsePin(false) } }, [open])

  const effective = method === 'device_biometric' && usePin ? 'pin' : method
  const title = effective === 'face_match' ? 'Xác thực khuôn mặt' : 'Xác thực giao dịch'
  const reason = amount > config.stepUp.perTransaction
    ? `Giao dịch trên ${formatVnd(config.stepUp.perTransaction)} cần xác thực khuôn mặt theo quy định.`
    : `Tổng giao dịch hôm nay vượt ${formatVnd(config.stepUp.perDay)} nên cần xác thực khuôn mặt theo quy định.`

  return (
    <Sheet open={open} onOpenChange={onOpenChange} title={title} description={effective === 'face_match' ? undefined : `Nhập mã PIN để xác nhận ${formatVnd(amount)}`}>
      {effective === 'face_match' ? (
        <FaceScan reason={reason} onDone={(ok) => (ok ? onSuccess('face_match') : onOpenChange(false))} />
      ) : effective === 'device_biometric' ? (
        <div className="text-center">
          <button type="button" onClick={() => setTimeout(() => onSuccess('device_biometric'), 500)} className="mx-auto my-6 flex size-24 items-center justify-center rounded-full bg-primary-soft text-primary-ink" aria-label="Xác thực bằng sinh trắc học thiết bị">
            <Fingerprint size={48} strokeWidth={1.5} aria-hidden />
          </button>
          <p className="text-[15px] text-muted">Chạm để dùng vân tay hoặc Face ID của điện thoại.</p>
          <Button variant="ghost" className="mt-4" onClick={() => setUsePin(true)}>Dùng mã PIN</Button>
        </div>
      ) : locked ? (
        <p role="alert" className="py-6 text-center text-danger">Mã PIN đang tạm khóa do nhập sai nhiều lần. Thử lại sau {fmtTime(sec.pinLockedUntil!)}.</p>
      ) : (
        <PinPad
          label="Mã PIN 6 số"
          error={error}
          onComplete={(pin) => {
            const r = verifyPin(pin)
            if (r.ok) return onSuccess('pin')
            setError(r.lockedUntil ? `Mã PIN đã bị khóa đến ${fmtTime(r.lockedUntil)}.` : `Mã PIN không đúng. Còn ${r.attemptsLeft} lần thử.`)
          }}
        />
      )}
    </Sheet>
  )
}
