import { config } from '@/domain/config'
import type { Settings } from '@/app/store'
import type { KycStatus } from '@/domain/gate'

export const STEPS = ['phone', 'otp', 'pin', 'id-method', 'id-capture', 'nfc', 'vneid', 'face', 'verifying', 'warning', 'terms', 'ready'] as const
export type Step = (typeof STEPS)[number]
export type IdPath = 'nfc' | 'vneid'
export const isStep = (s: string | null): s is Step => !!s && (STEPS as readonly string[]).includes(s)

/** Onboarding marks kept in the world (feature-local fields, see ./marks.ts). */
export type Marks = { pinSetAt?: string; verifiedAt?: string; warningAt?: string; termsAt?: string }

/** Where onboarding (re)starts for the current state (US-ONB-001); 'home' means redirect out. */
export function firstStep(s: { signedIn: boolean; kycStatus: KycStatus; marks: Marks }): Step | 'home' {
  if (s.kycStatus !== 'unverified') {
    const midFlow = !s.signedIn || (s.marks.verifiedAt && !s.marks.termsAt)
    return midFlow ? 'warning' : 'home'
  }
  return s.signedIn || s.marks.pinSetAt ? 'id-method' : 'phone'
}

/** Allowed back target per step; null = no back control (identity submitted or legal checkpoint). */
export function backTarget(step: Step, start: Step): Step | null {
  switch (step) {
    case 'otp': return 'phone'
    case 'pin': return 'otp'
    case 'id-method': return start === 'phone' ? 'pin' : null
    case 'id-capture': return 'id-method'
    case 'nfc': return 'id-capture'
    case 'vneid': return 'id-method'
    case 'terms': return 'warning'
    default: return null
  }
}

export const STAGES = ['Tài khoản', 'Xác thực', 'Hoàn tất'] as const
export function stageOf(step: Step): 0 | 1 | 2 {
  const i = STEPS.indexOf(step)
  return i <= STEPS.indexOf('pin') ? 0 : i <= STEPS.indexOf('verifying') ? 1 : 2
}

export type FailReason = Exclude<Settings['verification'], 'verified' | 'needs_review'>

/** The step that fixes a verification failure; chip/photo reasons on the VNeID path go back to id-method. */
export function retryStepFor(reason: FailReason, path: IdPath): Step {
  switch (reason) {
    case 'blurry_id': return path === 'nfc' ? 'id-capture' : 'id-method'
    case 'chip_unreadable': return path === 'nfc' ? 'nfc' : 'id-method'
    case 'face_mismatch': return 'face'
    case 'weak_network': return 'verifying'
  }
}

/** Mandatory warning (rules.md#onboarding): read to the end AND ticked. */
export const canContinue = (s: { reachedEnd: boolean; ticked: boolean }) => s.reachedEnd && s.ticked

/* ── Phone and OTP (US-ONB-002) ───────────────────────────────────── */

export const OTP = config.otp

export const isValidVnMobile = (digits: string) => /^0[35789]\d{8}$/.test(digits)

export type OtpResult = { kind: 'ok' } | { kind: 'wrong'; attemptsLeft: number } | { kind: 'exhausted' } | { kind: 'expired' }
export function checkOtp(s: { attemptsLeft: number; sentAt: number }, code: string, now: number): OtpResult {
  if (s.attemptsLeft <= 0) return { kind: 'exhausted' }
  if (code !== OTP.code) return s.attemptsLeft - 1 <= 0 ? { kind: 'exhausted' } : { kind: 'wrong', attemptsLeft: s.attemptsLeft - 1 }
  if (now - s.sentAt > OTP.ttlSeconds * 1000) return { kind: 'expired' }
  return { kind: 'ok' }
}

/** CCCD keeps its 12-digit length: 001*******45 (rules.md decisions). */
export { maskId as maskIdNumber } from '@/app/format'
