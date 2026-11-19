import { Fingerprint, KeyRound } from 'lucide-react'
import { useEffect, useState, type ReactNode } from 'react'
import { Link } from 'react-router'
import { useLayout } from '@/app/layout'
import { addNotification, changePin, now, setDeviceBiometric, useWorld, verifyPin } from '@/app/store'
import { Button, Card, cx, Disc, Sheet, Skeleton } from '@/components/ui'
import { fmtTime } from '@/features/flow/FlowKit'
import { PinPad } from './AuthSheet'
import { CHANGE_PIN_START, changePinStep, type ChangePin } from './changePin'
import { ScreenTitle, useLoaded, useToast } from './kit'

const security = (title: string, body: string) => addNotification({ kind: 'security', title, body, link: '/me/security' })

/** US-SEC-006 (biometric toggle) and US-SEC-007 (change PIN sheet). P1 rows (devices, lock wallet) are not shown. */
export default function SecurityPage() {
  const w = useWorld()
  const layout = useLayout()
  const loaded = useLoaded()
  const toast = useToast()
  const [pinFor, setPinFor] = useState<'biometric' | 'change' | null>(null)
  const sec = w.security
  const lockedUntil = sec.pinLockedUntil && new Date(sec.pinLockedUntil).getTime() > now() ? sec.pinLockedUntil : undefined

  const toggle = () => {
    if (!sec.deviceBiometric) return setPinFor('biometric')
    setDeviceBiometric(false)
    toast.show('Đã tắt sinh trắc học thiết bị')
    security('Đã tắt sinh trắc học thiết bị', 'Giao dịch sẽ dùng mã PIN.')
  }

  return (
    <div>
      <ScreenTitle>Bảo mật</ScreenTitle>
      <Card className="px-4">
        <ul className="divide-y divide-line-soft">
          <SettingRow
            icon={<KeyRound size={22} strokeWidth={1.75} />}
            title="Mã PIN"
            desc={lockedUntil ? <span className="text-danger">Mã PIN đang tạm khóa đến {fmtTime(lockedUntil)}</span> : 'Dùng để xác thực giao dịch. Không chia sẻ cho bất kỳ ai.'}
            control={<Button variant="secondary" size="sm" className="min-h-11" onClick={() => setPinFor('change')}>Đổi mã PIN</Button>}
          />
          <SettingRow
            icon={<Fingerprint size={22} strokeWidth={1.75} />}
            title="Sinh trắc học thiết bị"
            descId="bio-desc"
            desc={layout === 'web'
              ? <>Chỉ có trên ứng dụng điện thoại. <Link to="/device?path=/me/security" className="font-semibold text-tint">Xem trên điện thoại</Link></>
              : 'Dùng Face ID hoặc vân tay thay mã PIN cho giao dịch không cần xác thực khuôn mặt.'}
            control={layout === 'web' ? null : !loaded ? <Skeleton className="h-7 w-12 rounded-full" /> : (
              <button
                type="button" role="switch" aria-checked={sec.deviceBiometric} aria-label="Sinh trắc học thiết bị" aria-describedby="bio-desc"
                disabled={!sec.deviceBiometric && !!lockedUntil} onClick={toggle}
                className="flex h-12 w-14 items-center justify-center disabled:opacity-40"
              >
                <span className={cx('flex h-7 w-12 items-center rounded-full p-0.5 transition-colors duration-150', sec.deviceBiometric ? 'bg-primary' : 'bg-line')}>
                  <span className={cx('size-6 rounded-full bg-white transition-transform duration-150', sec.deviceBiometric && 'translate-x-5')} />
                </span>
              </button>
            )}
          />
        </ul>
      </Card>

      <Sheet open={pinFor === 'biometric'} onOpenChange={(o) => !o && setPinFor(null)} title="Xác thực giao dịch" description="Bật sinh trắc học thiết bị">
        <VerifyPin onOk={() => {
          setPinFor(null)
          setDeviceBiometric(true)
          toast.show('Đã bật sinh trắc học thiết bị')
          security('Đã bật sinh trắc học thiết bị', 'Face ID hoặc vân tay có thể thay mã PIN cho giao dịch nhỏ.')
        }} />
      </Sheet>
      <ChangePinSheet open={pinFor === 'change'} onClose={() => setPinFor(null)} onDone={() => {
        setPinFor(null)
        toast.show('Đã đổi mã PIN')
        security('Mã PIN đã được thay đổi', 'Nếu không phải bạn, hãy liên hệ hỗ trợ ngay.')
      }} />
      {toast.node}
    </div>
  )
}

function SettingRow({ icon, title, desc, descId, control }: { icon: ReactNode; title: string; desc: ReactNode; descId?: string; control: ReactNode }) {
  return (
    <li className="flex min-h-16 items-center gap-3 py-3">
      <Disc size={48}>{icon}</Disc>
      <div className="min-w-0 flex-1">
        <p className="text-[15px] leading-5 font-bold">{title}</p>
        <p id={descId} className="text-[13px] leading-[18px] text-muted">{desc}</p>
      </div>
      {control}
    </li>
  )
}

function LockedNote({ until }: { until: string }) {
  return <p role="alert" className="py-6 text-center text-danger">Mã PIN đang tạm khóa do nhập sai nhiều lần. Thử lại sau {fmtTime(until)}.</p>
}

function VerifyPin({ onOk }: { onOk: () => void }) {
  const [error, setError] = useState<string>()
  const [locked, setLocked] = useState<string>()
  if (locked) return <LockedNote until={locked} />
  return (
    <PinPad label="Mã PIN 6 số" error={error} onComplete={(pin) => {
      const r = verifyPin(pin)
      if (r.ok) return onOk()
      if (r.lockedUntil) setLocked(r.lockedUntil)
      else setError(`Mã PIN không đúng. Còn ${r.attemptsLeft} lần thử.`)
    }} />
  )
}

const STEP_LABEL = { current: 'Nhập mã PIN hiện tại', new: 'Nhập mã PIN mới', confirm: 'Nhập lại mã PIN mới', done: '' }

/** US-SEC-007: wrong current PINs count against the same counter and lock as transactions (verifyPin). */
function ChangePinSheet({ open, onClose, onDone }: { open: boolean; onClose: () => void; onDone: () => void }) {
  const w = useWorld()
  const [s, setS] = useState<ChangePin>(CHANGE_PIN_START)
  useEffect(() => { if (open) setS(CHANGE_PIN_START) }, [open])
  useEffect(() => {
    if (s.step === 'done') { changePin(s.next); onDone() }
  }, [s.step]) // eslint-disable-line react-hooks/exhaustive-deps
  const until = s.lockedUntil ?? (w.security.pinLockedUntil && new Date(w.security.pinLockedUntil).getTime() > now() ? w.security.pinLockedUntil : undefined)
  const idx = ['current', 'new', 'confirm'].indexOf(s.step)
  return (
    <Sheet open={open} onOpenChange={(o) => !o && onClose()} title="Đổi mã PIN">
      <ol className="mb-4 flex justify-center gap-2" aria-label={`Bước ${idx + 1} trên 3`}>
        {[0, 1, 2].map((i) => <li key={i} aria-hidden className={cx('size-2 rounded-full', i <= idx ? 'bg-ink' : 'bg-line')} />)}
      </ol>
      {s.step === 'current' && until ? <LockedNote until={until} /> : s.step === 'done' ? null : (
        <>
          <p className="mb-2 text-center font-semibold" aria-live="polite">{STEP_LABEL[s.step]}</p>
          <PinPad key={s.n} label={STEP_LABEL[s.step]} error={s.error} onComplete={(pin) => setS(changePinStep(s, pin, verifyPin))} />
        </>
      )}
    </Sheet>
  )
}
