import { useEffect, useState, type ComponentType } from 'react'
import { Navigate } from 'react-router'
import { getState } from '@/app/store'
import { useFlow } from '@/features/flow/FlowKit'
import { Ctx, type Draft } from './Frame'
import { marksOf } from './marks'
import { firstStep, isStep, STEPS, type Step } from './steps'
import { OtpStep, PhoneStep } from './PhoneSteps'
import { PinStep } from './PinStep'
import { IdCaptureStep, IdMethodStep } from './IdMethodSteps'
import { NfcStep } from './NfcStep'
import { VneidStep } from './VneidStep'
import { FaceStep } from './FaceStep'
import { VerifyingStep } from './VerifyingStep'
import { WarningStep } from './WarningStep'
import { ReadyStep, TermsStep } from './FinishSteps'

const VIEWS: Record<Step, ComponentType> = {
  phone: PhoneStep, otp: OtpStep, pin: PinStep, 'id-method': IdMethodStep, 'id-capture': IdCaptureStep, nfc: NfcStep,
  vneid: VneidStep, face: FaceStep, verifying: VerifyingStep, warning: WarningStep, terms: TermsStep, ready: ReadyStep,
}

/** /onboarding?step=… outside the shell (US-ONB-001). Start step is decided once, on entry, from the world. */
export default function OnboardingFlow() {
  const [start] = useState(() => {
    const w = getState().world
    return { step: firstStep({ signedIn: w.signedIn, kycStatus: w.customer.kycStatus, marks: marksOf(w) }), signedIn: w.signedIn }
  })
  if (start.step === 'home') return <Navigate to="/home" replace />
  return <Flow start={start.step} canSkipWallet={start.signedIn} />
}

function Flow({ start, canSkipWallet }: { start: Step; canSkipWallet: boolean }) {
  const order = [start, ...STEPS.filter((s) => s !== start)]
  const flow = useFlow<Draft>('onboarding', order, { phone: '' })
  const known = isStep(flow.step)
  // Unknown ?step= falls back to the first step for the current state; no 404.
  useEffect(() => { if (!known) flow.go(start, { replace: true }) }, [known]) // eslint-disable-line react-hooks/exhaustive-deps
  if (!known) return null
  const step = flow.step as Step
  const View = VIEWS[step]
  // "Để sau" only exists when a wallet already exists (unverified), and never once identity is submitted.
  const canSkip = canSkipWallet && ['id-method', 'id-capture', 'nfc', 'vneid', 'face'].includes(step)
  return (
    <Ctx.Provider value={{ step, start, draft: flow.draft, setDraft: flow.setDraft, go: flow.go, canSkip, clear: flow.clear }}>
      <View />
    </Ctx.Provider>
  )
}
