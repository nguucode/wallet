import { Check, ChevronDown, Search } from 'lucide-react'
import { useEffect, useRef, useState, type ReactNode } from 'react'
import { useNavigate, useSearchParams } from 'react-router'
import { config } from '@/domain/config'
import { fee } from '@/domain/fees'
import { formatVnd } from '@/domain/money'
import { parseQr } from '@/domain/qr'
import { BANKS, bankById, bankByBin, freeUsed, getState, lookupBankAccount, useWorld, type LookupResult } from '@/app/store'
import { GatedRoute } from '@/features/sec/Gate'
import {
  AmountInput, checkAmount, ConfirmRows, FeeValue, FlowFrame, maskAccount, ResultView, useCloseFlow, useFlow, useMoneyCommit,
} from '@/features/flow/FlowKit'
import { BankMark, Button, ButtonLink, Callout, Card, cx, Ico, Money, Row, Section, Sheet } from '@/components/app-ui'
import { Box } from '@/components/ui/box'
import { Heading } from '@/components/ui/heading'
import { HStack } from '@/components/ui/hstack'
import { Input, InputField, InputIcon, InputSlot } from '@/components/ui/input'
import { Pressable } from '@/components/ui/pressable'
import { Spinner } from '@/components/ui/spinner'
import { Text } from '@/components/ui/text'
import { VStack } from '@/components/ui/vstack'
import { fold, isValidAccountNumber } from './logic'
import { AuthNote, LockedAmount, MessageField, RecipientChip } from './shared'

type Draft = { bankId?: string; account: string; holder?: string; amount: number; message: string; locked?: boolean; fromQr?: boolean; txId?: string }
type Prefill = { bankId?: string; account: string; amount?: number; message?: string; fromQr: boolean; advance: boolean; invalid?: boolean }

const STEPS = ['recipient', 'amount', 'confirm', 'result'] as const

/** Reads ?recipient= (saved recipient, chooser) or ?qr= (VietQR, US-TRF-008) once. */
function readPrefill(params: URLSearchParams): Prefill | null {
  const rid = params.get('recipient'), qr = params.get('qr')
  if (rid) {
    const r = getState().world.bankRecipients.find((x) => x.id === rid)
    return r ? { bankId: r.bankId, account: r.account, fromQr: false, advance: false } : null
  }
  if (qr === null) return null
  const p = parseQr(qr)
  const bank = p.kind === 'vietqr' ? bankByBin(p.bin) : undefined
  if (p.kind !== 'vietqr' || !bank) return { account: '', fromQr: true, advance: false, invalid: true }
  return { bankId: bank.id, account: p.account, amount: p.amount, message: p.message?.slice(0, config.messageMax), fromQr: true, advance: true }
}

export default function BankTransferFlow() {
  const nav = useNavigate()
  const [params] = useSearchParams()
  const [prefill] = useState(() => readPrefill(params))
  const flow = useFlow<Draft>('transfer-bank', STEPS, { account: '', amount: 0, message: '' })
  const { step, draft, setDraft, go, clear } = flow
  const { close, dialog } = useCloseFlow(!!draft.holder, clear, '/transfer')

  useEffect(() => {
    if (params.has('qr') || params.has('recipient')) nav('/transfer/bank?step=recipient', { replace: true })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  useEffect(() => { if (step === 'result') clear() }, [step, clear])

  const onRecipient = (bankId: string, account: string, holder: string, replace: boolean) => {
    const same = prefill?.fromQr && prefill.bankId === bankId && prefill.account === account
    setDraft({
      bankId, account, holder, txId: undefined, fromQr: !!same,
      amount: same && prefill.amount ? prefill.amount : 0, locked: !!(same && prefill.amount), message: same ? prefill.message ?? '' : '',
    })
    if (replace) nav('/transfer/bank?step=amount', { replace: true })
    else go('amount')
  }

  const effective = (step === 'amount' || step === 'confirm') && !draft.holder ? 'recipient' : step
  let body: ReactNode
  if (effective === 'recipient') body = <RecipientStep prefill={prefill} draft={draft} onNext={onRecipient} />
  else if (effective === 'amount') body = <AmountStep draft={draft} setDraft={setDraft} onNext={() => go('confirm')} onChange={() => go('recipient')} />
  else if (effective === 'confirm') body = <ConfirmStep draft={draft} toAmount={() => go('amount')} onDone={(id) => flow.finish(id)} />
  else body = draft.txId ? <ResultView successHeading="Chuyển tiền thành công" txId={draft.txId} onRetry={() => go('confirm')} extra={<FailedFeeNote txId={draft.txId} />} /> : null

  const back = effective === 'amount' ? () => go('recipient') : effective === 'confirm' ? () => go('amount') : effective === 'recipient' ? () => nav('/transfer') : undefined
  return (
    <GatedRoute>
      <FlowFrame title="Chuyển đến ngân hàng" onBack={back} onClose={effective === 'result' ? undefined : close}>{body}</FlowFrame>
      {dialog}
    </GatedRoute>
  )
}

function FailedFeeNote({ txId }: { txId: string }) {
  const t = useWorld().transactions.find((x) => x.id === txId)
  return t?.status === 'failed' ? <Text className="mt-3 block text-muted-foreground">Phí đã được hoàn cùng số tiền.</Text> : null
}

/* ── recipient (US-TRF-005, US-TRF-008) ───────────────────────────── */

type LookupState = { status: 'idle' } | { status: 'loading' } | { status: 'done'; res: LookupResult }

function RecipientStep({ prefill: pf, draft, onNext }: { prefill: Prefill | null; draft: Draft; onNext: (bankId: string, account: string, holder: string, replace: boolean) => void }) {
  const w = useWorld()
  // A prefill applies once: coming back from the amount step keeps the confirmed recipient instead.
  const [prefill] = useState(() => (draft.holder ? null : pf))
  const [bankId, setBankId] = useState(prefill?.bankId ?? draft.bankId)
  const [account, setAccount] = useState(prefill?.account ?? draft.account)
  const [lookup, setLookup] = useState<LookupState>({ status: 'idle' })
  const [formatError, setFormatError] = useState<string>()
  const [picker, setPicker] = useState(false)
  const seq = useRef(0)
  const bank = bankId ? bankById(bankId) : undefined

  const run = async (b = bankId, a = account, advance = false) => {
    if (!b || !isValidAccountNumber(a)) { setFormatError(a ? 'Số tài khoản gồm 6 đến 19 chữ số.' : undefined); return }
    setFormatError(undefined)
    const id = ++seq.current
    setLookup({ status: 'loading' })
    const res = await lookupBankAccount(b, a)
    if (id !== seq.current) return
    setLookup({ status: 'done', res })
    if (res.ok && advance) onNext(b, a, res.holder, true)
  }
  useEffect(() => {
    if (prefill && !prefill.invalid && prefill.bankId) void run(prefill.bankId, prefill.account, prefill.advance)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const reset = () => { seq.current++; setLookup({ status: 'idle' }) }
  const found = lookup.status === 'done' && lookup.res.ok ? lookup.res.holder : undefined
  const lookupError = lookup.status === 'done' && !lookup.res.ok ? lookup.res.error : undefined

  if (prefill?.advance && lookup.status !== 'done')
    return <Text role="status" className="block py-10 text-center text-muted-foreground">Đang đọc mã…</Text>

  return (
    <>
      {prefill?.invalid ? <Box className="mb-6"><Callout tone="danger" title="Mã QR không hợp lệ. Hãy quét lại hoặc nhập người nhận." /></Box> : null}
      {w.bankRecipients.length ? (
        <Section title="Người nhận đã lưu" className="mt-0 lg:mt-0">
          <Card className="p-0 overflow-hidden">
            <VStack role="list" className="divide-y divide-border">
              {w.bankRecipients.slice(0, 6).map((r) => (
                <Box key={r.id} role="listitem">
                  <Row
                    onClick={() => { setBankId(r.bankId); setAccount(r.account); void run(r.bankId, r.account) }}
                    left={<BankMark short={bankById(r.bankId).short} size={40} />}
                    title={<Text title={r.holder}>{r.holder}</Text>}
                    subtitle={<Text className="whitespace-nowrap">{bankById(r.bankId).name} · {maskAccount(r.account)}</Text>}
                  />
                </Box>
              ))}
            </VStack>
          </Card>
        </Section>
      ) : null}

      <Section title="Tài khoản nhận" className="mt-8">
        <Card className="p-4">
        <VStack className="mb-6 gap-2">
          <Text id="bank-label" size="sm" className="font-medium">Ngân hàng</Text>
          <Pressable
            role="button" aria-labelledby="bank-label bank-value" aria-haspopup="dialog" onPress={() => setPicker(true)}
            className="h-12 w-full flex-row items-center gap-3 rounded-md border border-border bg-transparent px-3 mac:h-6 mac:w-auto mac:self-start mac:gap-1.5 mac:rounded-[6px] mac:border-0 mac:bg-secondary mac:px-2"
          >
            {bank ? <Box className="mac:hidden"><BankMark short={bank.short} size={28} /></Box> : null}
            <Text id="bank-value" className={cx('flex-1 text-left mac:flex-none', !bank && 'text-muted-foreground')}>{bank?.name ?? 'Chọn ngân hàng'}</Text>
            <Ico as={ChevronDown} size="md" className="text-muted-foreground" />
          </Pressable>
        </VStack>
        <Text id="account-label" size="sm" className="mb-2 block font-medium">Số tài khoản</Text>
        <HStack className="gap-2">
          <Input isInvalid={!!formatError || !!lookupError} className="h-12 flex-1 mac:h-[26px] mac:min-h-0 mac:rounded-[10px] mac:bg-background">
            <InputField
              id="account" inputMode="numeric" autoComplete="off" maxLength={19} value={account}
              aria-labelledby="account-label" aria-describedby="lookup-msg"
              onChangeText={(v: string) => { setAccount(v.replace(/\D/g, '').slice(0, 19)); reset() }}
              onBlur={() => { if (account && lookup.status === 'idle') void run() }}
              className="tabular-nums"
            />
          </Input>
          <Button variant="secondary" disabled={!bank || !account} onClick={() => void run()}>Kiểm tra</Button>
        </HStack>
        {/* The live region stays mounted for announcements but takes no space when empty, so the card's bottom inset matches its top. */}
        <Box id="lookup-msg" aria-live="polite" className={cx((formatError || lookup.status === 'loading' || lookupError) && 'mt-2')}>
          {formatError ? <Text size="sm" className="text-destructive">{formatError}</Text> : null}
          {lookup.status === 'loading' ? <HStack className="items-center gap-2"><Spinner size="small" aria-hidden /><Text size="sm" className="text-muted-foreground">Đang kiểm tra tên chủ tài khoản…</Text></HStack> : null}
          {lookupError === 'not_found' ? <Text size="sm" className="text-destructive">Không tìm thấy tài khoản. Kiểm tra lại ngân hàng và số tài khoản.</Text> : null}
          {lookupError === 'timeout' ? (
            <HStack className="flex-wrap items-center gap-2"><Text size="sm" className="text-destructive">Không kiểm tra được tên chủ tài khoản.</Text><Button size="sm" variant="secondary" onClick={() => void run()}>Thử lại</Button></HStack>
          ) : null}
        </Box>
        {found ? (
          <HStack className="mt-3 items-start gap-3 rounded-lg border border-border bg-card p-4">
            <Ico as={Check} size="lg" className="mt-1 shrink-0 text-primary" />
            <VStack className="min-w-0">
              <Text size="sm" className="text-muted-foreground">Tên chủ tài khoản</Text>
              <Text size="lg" bold className="break-words">{found}</Text>
            </VStack>
          </HStack>
        ) : null}
        </Card>
      </Section>
      <Box className="mt-8">
        <Button block disabled={!found || !bankId} onClick={() => onNext(bankId!, account, found!, false)}>Tiếp tục</Button>
      </Box>

      <BankPicker open={picker} onOpenChange={setPicker} onPick={(id) => { setBankId(id); setPicker(false); reset() }} />
    </>
  )
}

function BankPicker({ open, onOpenChange, onPick }: { open: boolean; onOpenChange: (o: boolean) => void; onPick: (id: string) => void }) {
  const [q, setQ] = useState('')
  const list = BANKS.filter((b) => fold(b.name).includes(fold(q)))
  return (
    <Sheet open={open} onOpenChange={onOpenChange} title="Chọn ngân hàng">
      <Input className="mb-3 h-12 mac:h-[26px] mac:min-h-0 mac:rounded-[10px] mac:bg-background">
        <InputSlot className="pl-1"><InputIcon as={Search} aria-hidden /></InputSlot>
        <InputField aria-label="Tìm ngân hàng" placeholder="Tìm ngân hàng" value={q} onChangeText={setQ} />
      </Input>
      {/* Rows run edge to edge in the sheet, like a grouped list. */}
      <VStack role="list" className="-mx-4">
        {list.map((b) => (
          <Box key={b.id} role="listitem"><Row onClick={() => onPick(b.id)} left={<BankMark short={b.short} size={40} />} title={b.name} /></Box>
        ))}
        {!list.length ? <Box role="listitem" className="px-4 py-6"><Text className="text-center text-muted-foreground">Không tìm thấy ngân hàng.</Text></Box> : null}
      </VStack>
    </Sheet>
  )
}

/* ── amount (US-TRF-006) ──────────────────────────────────────────── */

function AmountStep({ draft, setDraft, onNext, onChange }: { draft: Draft; setDraft: (p: Partial<Draft>) => void; onNext: () => void; onChange: () => void }) {
  const w = useWorld()
  const bank = bankById(draft.bankId!)
  const check = draft.amount > 0 ? checkAmount('bank_transfer', draft.amount) : null
  const error = check && !check.ok ? check.message : undefined
  const hint = <>Tối đa {formatVnd(config.bankTransferMax)} mỗi giao dịch · Số dư khả dụng: <Text className="tabular-nums">{formatVnd(w.balance)}</Text></>
  return (
    <>
      <RecipientChip name={draft.holder!} sub={<Text className="whitespace-nowrap">{bank.name} · {maskAccount(draft.account)}</Text>} note={draft.fromQr ? 'Từ mã VietQR' : undefined} onChange={draft.locked ? undefined : onChange} />
      {draft.locked
        ? <LockedAmount amount={draft.amount} note="Số tiền theo mã QR" error={error} />
        : <AmountInput value={draft.amount} onChange={(amount) => setDraft({ amount })} error={error} hint={hint} />}
      {draft.amount > 0 ? <Text className="mt-3 block"><Text className="text-muted-foreground">Phí: </Text><FeeValue type="bank_transfer" amount={draft.amount} /></Text> : null}
      <MessageField value={draft.message} onChange={(message) => setDraft({ message })} />
      <Box className="mt-8">
        {draft.locked && error
          ? <ButtonLink to="/pay/scan" variant="secondary" block>Đổi mã</ButtonLink>
          : <Button block disabled={!check?.ok} onClick={onNext}>Tiếp tục</Button>}
      </Box>
    </>
  )
}

/* ── confirm (US-TRF-006) ─────────────────────────────────────────── */

function ConfirmStep({ draft, toAmount, onDone }: { draft: Draft; toAmount: () => void; onDone: (id: string) => void }) {
  const w = useWorld()
  const bank = bankById(draft.bankId!)
  const f = fee('bank_transfer', draft.amount, freeUsed(w)).amount
  const counterparty = { kind: 'bank' as const, bankId: bank.id, account: draft.account, holder: draft.holder! }
  const commit = useMoneyCommit(() => ({ type: 'bank_transfer', amount: draft.amount, counterparty, message: draft.message.trim(), authMethod: 'pin' }), (t) => onDone(t.id))
  if (commit.busy)
    return (
      <VStack role="status" aria-live="polite" className="items-center py-16 text-center">
        <Spinner size="large" aria-hidden />
        <Text className="mt-3 font-semibold">Đang chuyển tiền…</Text>
        <Money amount={draft.amount} className="mt-1 text-4xl font-bold" />
        <Text className="mt-1 text-muted-foreground break-words">{draft.holder}</Text>
      </VStack>
    )
  return (
    <>
      <Heading as="h2" size="lg" className="mb-3">Xác nhận</Heading>
      <Money amount={draft.amount} className="mb-3 block text-center text-4xl font-bold" />
      <ConfirmRows rows={[
        ['Người nhận', <Text className="break-words">{draft.holder}</Text>],
        ['Ngân hàng', bank.name],
        ['Số tài khoản', <Text className="tabular-nums whitespace-nowrap">{maskAccount(draft.account)}</Text>],
        ['Số tiền', <Money amount={draft.amount} />],
        ['Phí', <><FeeValue type="bank_transfer" amount={draft.amount} />{f ? <Text size="sm" className="block font-normal text-muted-foreground">Đã dùng hết {config.fees.freeWithdrawPerMonth} lượt miễn phí trong tháng</Text> : null}</>],
        ['Tổng tiền', <Money amount={draft.amount + f} className="font-bold" />],
        ['Nguồn tiền', 'Ví'],
        ['Lời nhắn', draft.message.trim() || 'Chuyển tiền'],
      ]} />
      <AuthNote type="bank_transfer" amount={draft.amount} />
      {commit.error ? <Text role="alert" size="sm" className="mt-3 block text-destructive">{commit.error}</Text> : null}
      <VStack className="mt-8 gap-2">
        <Button block onClick={() => (checkAmount('bank_transfer', draft.amount).ok ? commit.start() : toAmount())}>Xác nhận</Button>
        <Button block variant="ghost" onClick={toAmount}>Quay lại</Button>
      </VStack>
      {commit.sheet}
    </>
  )
}
