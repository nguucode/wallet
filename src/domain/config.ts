/** Every configurable threshold from spec/ia/rules.md lives here. */
export const config = {
  stepUp: { perTransaction: 10_000_000, perDay: 20_000_000, paymentFace: 100_000_000 },
  limits: { generalMonth: 100_000_000, essentialMonth: 300_000_000 },
  bankTransferMax: 499_999_999,
  fees: { freeWithdrawPerMonth: 5, rate: 0.005, min: 1_000, roundTo: 1_000 },
  pin: { length: 6, maxAttempts: 5, lockMinutes: 30 },
  face: { maxRetries: 3 },
  supportWindowDays: 60,
  messageMax: 50,
  pendingEtaMinutes: { bank_processing: 30, biller_settling: 120 },
} as const
