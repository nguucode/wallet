export type KycStatus = 'unverified' | 'verifying' | 'verified' | 'id_expiring' | 'id_expired'
export type WalletStatus = 'active' | 'suspended' | 'locked' | 'closed'
export type GateId = 'kyc' | 'kyc_review' | 'suspended' | 'locked' | 'no_source'

export function activeGate(s: { kycStatus: KycStatus; walletStatus: WalletStatus; linkedSources: number }): GateId | null {
  if (s.kycStatus === 'unverified') return 'kyc'
  if (s.kycStatus === 'verifying') return 'kyc_review'
  if (s.walletStatus === 'suspended' || s.kycStatus === 'id_expired') return 'suspended'
  if (s.walletStatus === 'locked' || s.walletStatus === 'closed') return 'locked'
  if (s.linkedSources === 0) return 'no_source'
  return null
}
