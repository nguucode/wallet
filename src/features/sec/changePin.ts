import type { PinResult } from '@/app/store'

/** US-SEC-007 change-PIN steps: current → new → confirm → done. `n` bumps on every entry so the keypad resets. */
export type ChangePin = { step: 'current' | 'new' | 'confirm' | 'done'; current: string; next: string; error?: string; lockedUntil?: string; n: number }
export const CHANGE_PIN_START: ChangePin = { step: 'current', current: '', next: '', n: 0 }

export function changePinStep(s: ChangePin, pin: string, verify: (pin: string) => PinResult): ChangePin {
  const n = s.n + 1
  if (s.step === 'current') {
    const r = verify(pin)
    if (r.ok) return { ...s, step: 'new', current: pin, error: undefined, n }
    return { ...s, n, lockedUntil: r.lockedUntil, error: r.lockedUntil ? undefined : `Mã PIN không đúng. Còn ${r.attemptsLeft} lần thử.` }
  }
  if (s.step === 'new') {
    if (pin === s.current) return { ...s, n, error: 'Mã PIN mới phải khác mã PIN hiện tại.' }
    return { ...s, step: 'confirm', next: pin, error: undefined, n }
  }
  if (s.step === 'confirm') {
    if (pin !== s.next) return { ...s, step: 'new', next: '', n, error: 'Mã PIN nhập lại không khớp.' }
    return { ...s, step: 'done', error: undefined, n }
  }
  return s
}
