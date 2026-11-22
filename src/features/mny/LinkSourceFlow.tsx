import { isValidAccountNumber } from '@/features/trf/logic'
import { config } from '@/domain/config'
import { Check, Search } from 'lucide-react'
import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router'
import { useLayout } from '@/app/layout'
import { BANKS, bankById, linkSource, useWorld } from '@/app/store'
import { BankMark, Button, Card, DetailRows, Field, Ico, Row, Segmented, Sheet, TextInput } from '@/components/app-ui'
import { Box } from '@/components/ui/box'
import { HStack } from '@/components/ui/hstack'
import { Input, InputField, InputSlot } from '@/components/ui/input'
import { Spinner } from '@/components/ui/spinner'
import { Text } from '@/components/ui/text'
import { VStack } from '@/components/ui/vstack'
import { FlowFrame, useFlow } from '@/features/flow/FlowKit'
import { groupDigits, isOwnAccount, lookupHolder, mask4 } from './logic'
import { ResultBlock } from './parts'

const STEPS = ['bank', 'account', 'consent', 'bank-app', 'result'] as const
type Draft = { bankId: string; kind: 'account' | 'debit_card'; number: string; outcome?: 'linked' | 'declined'; first?: boolean }

/** US-MNY-002: bank → account → consent → simulated bank-app hand-off → result. Never gated. */
export default function LinkSourceFlow() {
  const w = useWorld()
  const nav = useNavigate()
  const layout = useLayout()
  const [params] = useSearchParams()
  const toHome = params.get('return') === 'home'
  const { step: raw, draft, setDraft, go, clear } = useFlow<Draft>('link-source', STEPS, { bankId: '', kind: 'account', number: '' }, { resultFallback: '/me/sources' })
  const holder = w.customer.name.toUpperCase()
  const bank = draft.bankId ? bankById(draft.bankId) : undefined
  // A later step without a chosen bank (stale draft) shows the first step.
  const step = bank ? raw : 'bank'

  const [query, setQuery] = useState('')
  const [error, setError] = useState<string>()
  const [checking, setChecking] = useState(false)
  const [sheetOpen, setSheetOpen] = useState(true)
  const [confirming, setConfirming] = useState(false)

  const close = () => { clear(); nav(toHome ? '/home' : '/me/sources') }
  const back = (s: (typeof STEPS)[number]) => () => { setError(undefined); go(s) }

  if (step === 'bank') {
    const q = query.trim().toLowerCase()
    const banks = BANKS.filter((b) => !q || b.name.toLowerCase().includes(q) || b.short.toLowerCase().includes(q))
    return (
      <FlowFrame title="Chọn ngân hàng" onClose={close}>
        <Field label="Tìm ngân hàng" htmlFor="bank-q">
          <Input className="h-12 mac:h-[26px] mac:min-h-0 mac:rounded-[10px] mac:bg-background">
            <InputSlot className="pl-3 mac:pl-2"><Ico as={Search} size="sm" className="text-muted-foreground mac:h-3.5 mac:w-3.5" /></InputSlot>
            <InputField id="bank-q" role="searchbox" aria-label="Tìm ngân hàng" value={query} onChangeText={setQuery} autoComplete="off" />
          </Input>
        </Field>
        {banks.length ? (
          <VStack role="list" className="divide-y divide-border">
            {banks.map((b) => {
              const linked = w.sources.find((s) => s.bankId === b.id)
              return (
                <Box key={b.id} role="listitem">
                  <Row
                    onClick={() => { setDraft({ bankId: b.id, number: draft.bankId === b.id ? draft.number : '' }); go('account') }}
                    left={<BankMark short={b.short} size={40} />}
                    title={b.name}
                    subtitle={linked ? <>Đã liên kết <Text size="sm" className="tabular-nums text-muted-foreground">{mask4(linked.last4)}</Text></> : undefined}
                    chevron
                  />
                </Box>
              )
            })}
          </VStack>
        ) : (
          <Text role="status" className="py-8 text-center text-muted-foreground">Không tìm thấy ngân hàng.</Text>
        )}
      </FlowFrame>
    )
  }

  if (step === 'account' && bank) {
    const isCard = draft.kind === 'debit_card'
    const valid = isValidAccountNumber(draft.number)
    const submit = async () => {
      setError(undefined)
      if (w.sources.some((s) => s.bankId === bank.id && s.kind === draft.kind && s.last4 === draft.number.slice(-4)))
        return setError('Tài khoản này đã được liên kết.')
      setChecking(true)
      const r = await lookupHolder(draft.number, w.customer.name)
      setChecking(false)
      if (!r.ok) return setError(r.error === 'not_found' ? (isCard ? 'Không tìm thấy thẻ. Kiểm tra lại số thẻ.' : 'Không tìm thấy tài khoản. Kiểm tra lại số tài khoản.') : 'Chưa kiểm tra được tài khoản. Thử lại.')
      if (!isOwnAccount(r.holder, w.customer.name)) return setError(`Tài khoản này không đứng tên ${holder}. Bạn chỉ liên kết được tài khoản chính chủ.`)
      go('consent')
    }
    return (
      <FlowFrame title={bank.name} onBack={back('bank')} onClose={close}
        footer={<Button block loading={checking} disabled={!valid} onClick={submit}>Tiếp tục</Button>}>
        <Card>
          <Box className="mb-6">
            <Segmented label="Loại nguồn tiền" value={draft.kind} onChange={(k) => { setError(undefined); setDraft({ kind: k }) }}
              options={[{ value: 'account', label: 'Tài khoản' }, { value: 'debit_card', label: 'Thẻ ghi nợ' }]} />
          </Box>
          <Field label={isCard ? 'Số thẻ' : 'Số tài khoản'} htmlFor="src-number" error={error} hint={`Từ ${config.accountDigits.min} đến ${config.accountDigits.max} chữ số`}>
            <TextInput
              id="src-number" aria-label={isCard ? 'Số thẻ' : 'Số tài khoản'} inputMode="numeric" autoComplete="off" invalid={!!error}
              value={groupDigits(draft.number)}
              onChange={(e) => { setError(undefined); setDraft({ number: e.target.value.replace(/\D/g, '').slice(0, config.accountDigits.max) }) }}
              onKeyDown={(e) => e.key === 'Enter' && valid && !checking && submit()}
              className="tabular-nums"
            />
          </Field>
          <Text className="break-words"><Text className="text-muted-foreground">Chủ tài khoản: </Text><Text className="font-medium">{holder}</Text></Text>
        </Card>
      </FlowFrame>
    )
  }

  if (step === 'consent' && bank) {
    return (
      <FlowFrame title="Cho phép Wallet" onBack={back('account')} onClose={close}
        footer={<Button block onClick={() => { setSheetOpen(true); go('bank-app') }}>Đồng ý liên kết</Button>}>
        <Card>
          <Text className="mb-3 text-muted-foreground">{bank.name} · {draft.kind === 'debit_card' ? 'Thẻ ghi nợ' : 'Tài khoản'} <Text className="tabular-nums text-muted-foreground">{mask4(draft.number.slice(-4))}</Text></Text>
          <VStack role="list" className="gap-3">
            {['Nạp tiền vào ví từ tài khoản này', 'Rút tiền từ ví về tài khoản này'].map((l) => (
              <HStack key={l} role="listitem" className="items-start gap-3"><Ico as={Check} className="mt-0.5 shrink-0 text-primary" /><Text>{l}</Text></HStack>
            ))}
          </VStack>
        </Card>
      </FlowFrame>
    )
  }

  if (step === 'bank-app' && bank) {
    const decide = async (ok: boolean) => {
      if (!ok) { setSheetOpen(false); setDraft({ outcome: 'declined' }); return go('result', { replace: true }) }
      setConfirming(true)
      const first = w.sources.length === 0
      await linkSource({ bankId: bank.id, kind: draft.kind, number: draft.number })
      setConfirming(false)
      setSheetOpen(false)
      setDraft({ outcome: 'linked', first })
      go('result', { replace: true })
    }
    return (
      <FlowFrame title="Xác nhận trên ứng dụng ngân hàng" onBack={back('consent')} onClose={close}
        footer={!sheetOpen ? <Button block onClick={() => setSheetOpen(true)}>Mở ứng dụng {bank.name}</Button> : undefined}>
        {layout === 'web' ? <Text className="mb-3 font-medium">Mở ứng dụng ngân hàng trên điện thoại để xác nhận</Text> : null}
        <HStack role="status" className="items-center gap-2">
          <Spinner size="small" aria-hidden />
          <Text className="text-muted-foreground">Đang chờ xác nhận từ ngân hàng…</Text>
        </HStack>
        <Sheet open={sheetOpen} onOpenChange={setSheetOpen} title={`Mô phỏng ứng dụng ${bank.name}`} description="Đây là màn hình mô phỏng của ngân hàng, không phải của Wallet.">
          <Card inset="rows" className="mb-6">
            <DetailRows rows={[['Yêu cầu', 'Liên kết với ví Wallet'], ['Nguồn tiền', `${draft.kind === 'debit_card' ? 'Thẻ ghi nợ' : 'Tài khoản'} ${mask4(draft.number.slice(-4))}`], ['Chủ tài khoản', holder], ['Số ví', w.customer.walletNumber]]} />
          </Card>
          <VStack className="gap-2">
            <Button variant="primary" block loading={confirming} onClick={() => decide(true)}>Xác nhận liên kết</Button>
            <Button variant="secondary" block disabled={confirming} onClick={() => decide(false)}>Từ chối</Button>
          </VStack>
        </Sheet>
      </FlowFrame>
    )
  }

  if (step === 'result' && bank && draft.outcome) {
    const name = `${bank.name} ${mask4(draft.number.slice(-4))}`
    if (draft.outcome === 'declined')
      return (
        <FlowFrame title="Liên kết ngân hàng" onClose={close} footer={<>
          <Button block onClick={() => { setSheetOpen(true); go('bank-app') }}>Thử lại</Button>
          <Button variant="secondary" block onClick={() => go('bank')}>Chọn ngân hàng khác</Button>
        </>}>
          <ResultBlock tone="failed" heading="Ngân hàng chưa xác nhận liên kết"><Text className="text-muted-foreground">Nguồn tiền chưa được thêm vào ví.</Text></ResultBlock>
        </FlowFrame>
      )
    const done = (to: string) => () => { clear(); nav(to) }
    return (
      <FlowFrame title="Liên kết ngân hàng" footer={draft.first ? <>
        <Button block onClick={done('/topup')}>Nạp tiền</Button>
        <Button variant="secondary" block onClick={done('/home')}>Về trang chủ</Button>
      </> : toHome ? <Button block onClick={done('/home')}>Về trang chủ</Button> : <Button block onClick={done('/me/sources')}>Xem nguồn tiền</Button>}>
        <ResultBlock tone="success" heading={`Đã liên kết ${name}`}>
          {draft.first ? <Text className="text-muted-foreground">Ví đã sẵn sàng để nạp tiền.</Text> : null}
        </ResultBlock>
      </FlowFrame>
    )
  }

  // Step opened without its draft: useFlow restarts at `bank`.
  return null
}
