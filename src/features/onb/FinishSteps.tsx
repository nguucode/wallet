import { useState } from 'react'
import { useNavigate } from 'react-router'
import { config } from '@/domain/config'
import { formatVnd } from '@/domain/money'
import { delay, finishOnboarding, useWorld } from '@/app/store'
import { Button, Callout, Sheet } from '@/components/app-ui'
import { Box } from '@/components/ui/box'
import { Heading } from '@/components/ui/heading'
import { Text } from '@/components/ui/text'
import { VStack } from '@/components/ui/vstack'
import { formatPhone } from '@/features/flow/FlowKit'
import { DataList, StatusMark, StepShell, useOnb } from './Frame'
import { TERMS_FULL, TERMS_SUMMARY } from './legal'
import { mark } from './marks'

/** US-ONB-010: terms; accepting opens the wallet (status active) and ends onboarding. */
export function TermsStep() {
  const { go } = useOnb()
  const [full, setFull] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(false)
  const accept = async () => {
    setBusy(true)
    setError(false)
    try {
      await delay()
      mark('termsAt', (w) => { w.walletStatus = 'active' })
      finishOnboarding()
      go('ready', { replace: true })
    } catch {
      setError(true)
    } finally {
      setBusy(false)
    }
  }
  return (
    <StepShell title="Điều khoản sử dụng ví" footer={<>
      {error ? <Text role="alert" size="sm" className="text-destructive">Chưa mở được ví. Thử lại.</Text> : null}
      <Button block loading={busy} onClick={accept}>{error ? 'Thử lại' : 'Đồng ý và mở ví'}</Button>
    </>}>
      <VStack role="list" className="gap-4">
        {TERMS_SUMMARY.map(([k, v]) => (
          <VStack key={k} role="listitem"><Text className="font-semibold">{k}</Text><Text size="sm" className="text-muted-foreground">{v}</Text></VStack>
        ))}
      </VStack>
      <Box className="mt-3 -ml-4 self-start"><Button variant="ghost" onClick={() => setFull(true)}>Xem toàn bộ điều khoản</Button></Box>
      <Sheet open={full} onOpenChange={setFull} title="Điều khoản sử dụng ví">
        <VStack className="gap-4">
          {TERMS_FULL.map(([k, v]) => <VStack key={k}><Heading as="h3" size="sm">{k}</Heading><Text size="sm" className="text-muted-foreground">{v}</Text></VStack>)}
        </VStack>
        <Button variant="secondary" block className="mt-6" onClick={() => setFull(false)}>Đóng</Button>
      </Sheet>
    </StepShell>
  )
}

/** US-ONB-010: wallet ready, one primary CTA to link a bank; "Để sau" lands on Home with gate #4. */
export function ReadyStep() {
  const { clear } = useOnb()
  const w = useWorld()
  const nav = useNavigate()
  const leave = (to: string) => () => { clear(); nav(to) }
  return (
    <StepShell title="Ví của bạn đã sẵn sàng" footer={<>
      <Button block onClick={leave('/me/sources/link?return=home')}>Liên kết ngân hàng</Button>
      <Button variant="ghost" block onClick={leave('/home')}>Để sau</Button>
    </>}>
      <Box className="mb-6"><StatusMark tone="primary" /></Box>
      <Text size="lg" className="mb-2 block font-semibold">{w.customer.name}</Text>
      <DataList rows={[['Số ví', <Text className="whitespace-nowrap tabular-nums">{formatPhone(w.customer.walletNumber)}</Text>]]} />
      <Heading as="h2" size="md" className="mt-6 mb-1">Hạn mức giao dịch</Heading>
      <DataList rows={[
        ['Chuyển tiền và thanh toán', <Text className="whitespace-nowrap tabular-nums">{formatVnd(config.limits.generalMonth)}/tháng</Text>],
        ['Thanh toán thiết yếu (điện, nước…)', <Text className="whitespace-nowrap tabular-nums">{formatVnd(config.limits.essentialMonth)}/tháng</Text>],
      ]} />
      {w.customer.kycStatus === 'verifying' ? (
        <Box className="mt-6"><Callout tone="pending" title="Hồ sơ đang được kiểm tra, thường xong trong 24 giờ." /></Box>
      ) : null}
      <Text className="mt-6 block">Bạn cần liên kết tài khoản hoặc thẻ ghi nợ đứng tên mình trước khi dùng ví.</Text>
    </StepShell>
  )
}
