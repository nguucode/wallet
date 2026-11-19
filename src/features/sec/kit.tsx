import { useEffect, useState } from 'react'
import { delay } from '@/app/store'
import type { KycStatus, WalletStatus } from '@/domain/gate'

/** Feature-local helpers shared by HOM, NTF and SEC pages. */

/** First render shows skeletons for one simulated network round trip (Demo controls latency). */
export function useLoaded() {
  const [ok, setOk] = useState(false)
  useEffect(() => {
    let live = true
    void delay().then(() => live && setOk(true))
    return () => { live = false }
  }, [])
  return ok
}



export const KYC_LABEL: Record<KycStatus, string> = {
  unverified: 'Chưa xác thực', verifying: 'Đang kiểm tra', verified: 'Đã xác thực', id_expiring: 'CCCD sắp hết hạn', id_expired: 'CCCD đã hết hạn',
}
export const KYC_TONE: Record<KycStatus, 'neutral' | 'pending' | 'danger' | 'success'> = {
  unverified: 'danger', verifying: 'pending', verified: 'success', id_expiring: 'pending', id_expired: 'danger',
}
export const WALLET_LABEL: Record<WalletStatus, string> = {
  active: 'Đang hoạt động', suspended: 'Tạm ngừng giao dịch', locked: 'Tạm khóa', closed: 'Đã đóng',
}
/** rules.md decisions: CCCD keeps its 12-digit length, `001*******45`. */
export { maskId } from '@/app/format'

export { ScreenTitle, useToast } from '@/components/app-ui'
