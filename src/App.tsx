import { Component, lazy, Suspense, type ReactNode } from 'react'
import { Navigate, Route, Routes, useLocation } from 'react-router'
import { useLayout } from '@/app/layout'
import { FlowShell, Shell } from '@/app/Shell'
import { useWorld } from '@/app/store'
import { NotFound, ErrorPage } from '@/features/demo/NotFound'
import { Skeleton } from '@/components/ui'

const p = (load: () => Promise<{ default: () => ReactNode }>) => lazy(load)
const HomePage = p(() => import('@/features/hom/HomePage'))
const MeHub = p(() => import('@/features/hom/MeHub'))
const HistoryPage = p(() => import('@/features/his/HistoryPage'))
const TransactionPage = p(() => import('@/features/his/TransactionPage'))
const SupportPage = p(() => import('@/features/his/SupportPage'))
const SupportNewFlow = p(() => import('@/features/his/SupportNewFlow'))
const TransferChooser = p(() => import('@/features/trf/TransferChooser'))
const ReceivePage = p(() => import('@/features/trf/ReceivePage'))
const WalletTransferFlow = p(() => import('@/features/trf/WalletTransferFlow'))
const BankTransferFlow = p(() => import('@/features/trf/BankTransferFlow'))
const ScanPage = p(() => import('@/features/pay/ScanPage'))
const PayCodePage = p(() => import('@/features/pay/PayCodePage'))
const MerchantPayFlow = p(() => import('@/features/pay/MerchantPayFlow'))
const BillsPage = p(() => import('@/features/bil/BillsPage'))
const AddBillFlow = p(() => import('@/features/bil/AddBillFlow'))
const PayBillFlow = p(() => import('@/features/bil/PayBillFlow'))
const ProfilePage = p(() => import('@/features/sec/ProfilePage'))
const LimitsPage = p(() => import('@/features/sec/LimitsPage'))
const SecurityPage = p(() => import('@/features/sec/SecurityPage'))
const SourcesPage = p(() => import('@/features/mny/SourcesPage'))
const LinkSourceFlow = p(() => import('@/features/mny/LinkSourceFlow'))
const TopupFlow = p(() => import('@/features/mny/TopupFlow'))
const WithdrawFlow = p(() => import('@/features/mny/WithdrawFlow'))
const NotificationsPage = p(() => import('@/features/ntf/NotificationsPage'))
const OnboardingFlow = p(() => import('@/features/onb/OnboardingFlow'))

class Boundary extends Component<{ children: ReactNode; resetKey: string }, { error: boolean }> {
  state = { error: false }
  static getDerivedStateFromError() { return { error: true } }
  componentDidUpdate(prev: { resetKey: string }) { if (prev.resetKey !== this.props.resetKey && this.state.error) this.setState({ error: false }) }
  render() { return this.state.error ? <ErrorPage /> : this.props.children }
}

function Loading() {
  return <div className="space-y-stack pt-stack" aria-busy><Skeleton className="h-8 w-48" /><Skeleton className="h-24" /><Skeleton className="h-16" /></div>
}

/** Scenario `new` (signed out): every shell route goes to onboarding. */
function RequireWallet({ children }: { children: ReactNode }) {
  const w = useWorld()
  return w.signedIn ? <>{children}</> : <Navigate to="/onboarding" replace />
}

function MeRoute() {
  return useLayout() === 'web' ? <Navigate to="/me/profile" replace /> : <MeHub />
}

export default function App() {
  const { pathname } = useLocation()
  return (
    <Boundary resetKey={pathname}>
      <Suspense fallback={<Loading />}>
        <Routes>
          <Route path="/" element={<Navigate to="/home" replace />} />
          <Route path="/onboarding" element={<OnboardingFlow />} />
          {/* The phone-frame preview was removed 2026-11-19; the app layout is reached by width (< 1024px). Old links land on Home. */}
          <Route path="/device" element={<Navigate to="/home" replace />} />
          <Route element={<RequireWallet><Shell /></RequireWallet>}>
            <Route path="/home" element={<HomePage />} />
            <Route path="/history" element={<HistoryPage />} />
            <Route path="/history/:txId" element={<TransactionPage />} />
            <Route path="/transfer" element={<TransferChooser />} />
            <Route path="/receive" element={<ReceivePage />} />
            <Route path="/pay/scan" element={<ScanPage />} />
            <Route path="/pay/code" element={<PayCodePage />} />
            <Route path="/bills" element={<BillsPage />} />
            <Route path="/me" element={<MeRoute />} />
            <Route path="/me/profile" element={<ProfilePage />} />
            <Route path="/me/sources" element={<SourcesPage />} />
            <Route path="/me/limits" element={<LimitsPage />} />
            <Route path="/me/security" element={<SecurityPage />} />
            <Route path="/notifications" element={<NotificationsPage />} />
            <Route path="/support" element={<SupportPage />} />
            <Route path="*" element={<NotFound />} />
          </Route>
          <Route element={<RequireWallet><FlowShell /></RequireWallet>}>
            <Route path="/topup" element={<TopupFlow />} />
            <Route path="/withdraw" element={<WithdrawFlow />} />
            <Route path="/transfer/wallet" element={<WalletTransferFlow />} />
            <Route path="/transfer/bank" element={<BankTransferFlow />} />
            <Route path="/pay/merchant" element={<MerchantPayFlow />} />
            <Route path="/bills/new" element={<AddBillFlow />} />
            <Route path="/bills/:billId" element={<PayBillFlow />} />
            <Route path="/me/sources/link" element={<LinkSourceFlow />} />
            <Route path="/support/new" element={<SupportNewFlow />} />
          </Route>
        </Routes>
      </Suspense>
    </Boundary>
  )
}
