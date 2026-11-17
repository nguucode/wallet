import { config } from './config'
import type { AuthMethod, TxType } from './types'

/** Types whose PIN-approved amounts accumulate in the daily counter (rules.md#step-up, TT 50 "Tksth"). */
const COUNTED: TxType[] = ['topup', 'withdraw', 'p2p_out', 'bank_transfer']

export function requiredAuth(input: {
  type: TxType
  amount: number
  dayCounter: number
  deviceBiometric?: boolean
  layout?: 'web' | 'app'
}): AuthMethod {
  const t = config.stepUp
  const needsFace = COUNTED.includes(input.type)
    ? input.amount > t.perTransaction || input.dayCounter + input.amount > t.perDay
    : input.amount > t.paymentFace
  if (needsFace) return 'face_match'
  return input.deviceBiometric && input.layout === 'app' ? 'device_biometric' : 'pin'
}

export function nextDayCounter(counter: number, tx: { type: TxType; amount: number; method: AuthMethod }): number {
  if (tx.method === 'face_match') return 0
  return COUNTED.includes(tx.type) ? counter + tx.amount : counter
}
