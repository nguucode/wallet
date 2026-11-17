import { mutate, now } from '@/app/store'
import type { World } from '@/mock/seed'
import type { Marks } from './steps'

// shortcut: feature-local fields on World via mutate (World has no onboarding marks); move into seed.ts types when the coordinator adds them.
type WithMarks = World & { onboarding?: Marks; customer: World['customer'] & { warningAcknowledgedAt?: string; termsAcceptedAt?: string } }

export const marksOf = (w: World): Marks => (w as WithMarks).onboarding ?? {}

export function mark(key: keyof Marks, extra?: (w: WithMarks) => void) {
  mutate((w) => {
    const x = w as WithMarks
    const at = new Date(now()).toISOString()
    x.onboarding = { ...x.onboarding, [key]: at }
    if (key === 'warningAt') x.customer.warningAcknowledgedAt = at
    if (key === 'termsAt') x.customer.termsAcceptedAt = at
    extra?.(x)
  })
}
