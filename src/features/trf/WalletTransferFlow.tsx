import { Search } from 'lucide-react'
import { useEffect, useState, type ReactNode } from 'react'
import { useNavigate, useSearchParams } from 'react-router'
import { parseQr } from '@/domain/qr'
import { formatVnd } from '@/domain/money'
import { delay, getState, useWorld } from '@/app/store'
import type { Counterparty } from '@/mock/seed'
import { GatedRoute } from '@/features/sec/Gate'
import {
  AmountInput, checkAmount, ConfirmRows, FlowFrame, formatPhone, maskPhone, ResultView, useCloseFlow, useFlow, useMoneyCommit,
} from '@/features/flow/FlowKit'
import { Avatar, Badge, Button, ButtonLink, Callout, cx, Fee, Money, Row, Skeleton, GroupLabel } from '@/components/app-ui'
import { Box } from '@/components/ui/box'
import { Heading } from '@/components/ui/heading'
import { HStack } from '@/components/ui/hstack'
import { Input, InputField, InputIcon, InputSlot } from '@/components/ui/input'
import { Spinner } from '@/components/ui/spinner'
import { Text } from '@/components/ui/text'
import { VStack } from '@/components/ui/vstack'
import { filterContacts, isFullPhone, recentRecipients, resolvePhone, type PhoneLookup } from './logic'
import { AuthNote, LockedAmount, MessageField, RecipientChip } from './shared'

type Recipient = Extract<Counterparty, { kind: 'contact' }>
type Draft = { recipient?: Recipient; amount: number; message: string; locked?: boolean; fromQr?: boolean; txId?: string }

const STEPS = ['recipient', 'amount', 'confirm', 'result'] as const
const INVALID_QR = 'Mã QR không hợp lệ. Hãy quét lại hoặc nhập người nhận.'
const SELF = 'Bạn không thể chuyển tiền cho chính mình.'

export default function WalletTransferFlow() {
  const w = useWorld()
  const nav = useNavigate()
  const [params] = useSearchParams()
  const flow = useFlow<Draft>('transfer-wallet', STEPS, { amount: 0, message: '' })
  const { step, draft, setDraft, go, clear } = flow
  const [banner, setBanner] = useState<string>()
  const [reading, setReading] = useState(!!params.get('qr'))
  const defaultMessage = `${w.customer.name} chuyển tiền`
  const { close, dialog } = useCloseFlow(!!draft.recipient, clear, '/transfer')

  const pick = (r: Recipient, amount = 0, fromQr = false, replace = false) => {
    setDraft({ recipient: r, amount, locked: amount > 0, fromQr, message: defaultMessage, txId: undefined })
    if (replace) nav('/transfer/wallet?step=amount', { replace: true })
    else go('amount')
  }

  // US-TRF-008 / chooser prefill: ?qr= or ?contact=, then drop the param (history replace).
  useEffect(() => {
    const qr = params.get('qr'), contactId = params.get('contact')
    if (contactId) {
      const c = getState().world.contacts.find((x) => x.id === contactId && x.hasWallet)
      if (c) pick({ kind: 'contact', id: c.id, name: c.name, phone: c.phone }, 0, false, true)
      else nav('/transfer/wallet?step=recipient', { replace: true })
      return
    }
    if (!qr) return
    const p = parseQr(qr)
    const fail = (msg: string) => { setBanner(msg); setReading(false); nav('/transfer/wallet?step=recipient', { replace: true }) }
    if (p.kind !== 'wallet') return fail(INVALID_QR)
    let live = true
    void delay().then(() => {
      if (!live) return
      const r = resolvePhone(getState().world, p.phone)
      if (r.status === 'wallet') { setReading(false); pick(r.contact, p.amount ?? 0, true, true) }
      else fail(r.status === 'self' ? SELF : r.status === 'no_wallet' ? 'Số điện thoại này chưa dùng ví.' : 'Không kiểm tra được số điện thoại. Thử lại.')
    })
    return () => { live = false }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => { if (step === 'result') clear() }, [step, clear])

  const effective = step !== 'recipient' && step !== 'result' && !draft.recipient ? 'recipient' : step
  let body: ReactNode
  if (reading)
    body = (
      <VStack aria-busy className="gap-3">
        <Text role="status" className="text-muted-foreground">Đang đọc mã…</Text>
        <Skeleton className="h-16" />
      </VStack>
    )
  else if (effective === 'recipient') body = <RecipientStep banner={banner} onPick={(r) => pick(r)} />
  else if (effective === 'amount') body = <AmountStep draft={draft} setDraft={setDraft} onNext={() => go('confirm')} onChange={() => go('recipient')} />
  else if (effective === 'confirm') body = <ConfirmStep draft={draft} defaultMessage={defaultMessage} toAmount={() => go('amount')} onDone={(id) => flow.finish(id)} />
  else body = draft.txId ? <ResultView successHeading="Chuyển tiền thành công" txId={draft.txId} onRetry={() => go('confirm')} /> : null

  const back = effective === 'amount' ? () => go('recipient') : effective === 'confirm' ? () => go('amount') : effective === 'recipient' ? () => nav('/transfer') : undefined
  return (
    <GatedRoute>
      <FlowFrame title="Chuyển đến ví" onBack={back} onClose={effective === 'result' ? undefined : close}>
        {body}
      </FlowFrame>
      {dialog}
    </GatedRoute>
  )
}

/* ── recipient (US-TRF-002) ───────────────────────────────────────── */

function RecipientStep({ banner, onPick }: { banner?: string; onPick: (r: Recipient) => void }) {
  const w = useWorld()
  const [query, setQuery] = useState('')
  const [helper, setHelper] = useState<string>()
  const [lookup, setLookup] = useState<{ phone: string; res?: PhoneLookup }>()
  const [retry, setRetry] = useState(0)
  const digits = /^[\d\s]+$/.test(query) ? query.replace(/\D/g, '') : ''
  const self = digits === w.customer.phone
  const inContacts = w.contacts.some((c) => c.phone === digits)
  const needsLookup = isFullPhone(digits) && !inContacts && !self

  useEffect(() => {
    if (!needsLookup) return
    let live = true
    setLookup({ phone: digits })
    void delay().then(() => live && setLookup({ phone: digits, res: resolvePhone(getState().world, digits) }))
    return () => { live = false }
  }, [digits, needsLookup, retry])

  const sorted = [...w.contacts].sort((a, b) => a.name.localeCompare(b.name, 'vi'))
  const recentIds = recentRecipients(w.transactions, 50).filter((r) => r.kind === 'wallet').slice(0, 5)
  const recent = recentIds.map((r) => (r.kind === 'wallet' ? w.contacts.find((c) => c.phone === r.phone) ?? { id: r.id, name: r.name, phone: r.phone, hasWallet: true } : null)).filter((c) => !!c)
  const fRecent = filterContacts(recent, query)
  const fAll = filterContacts(sorted, query)

  const row = (c: { id: string; name: string; phone: string; hasWallet: boolean }, group: string) => {
    const disabled = !c.hasWallet
    return (
      <Box key={group + c.id} role="listitem">
        <Row
          disabled={disabled}
          aria-describedby={disabled ? 'no-wallet-help' : undefined}
          onClick={() => (disabled ? setHelper(`${c.name}: Người này chưa dùng ví nên chưa nhận được tiền qua ví.`) : onPick({ kind: 'contact', id: c.id, name: c.name, phone: c.phone }))}
          left={<Box className={cx(disabled && 'opacity-60')}><Avatar name={c.name} size={40} /></Box>}
          title={<Text title={c.name} className={cx(disabled && 'text-muted-foreground')}>{c.name}</Text>}
          subtitle={<Text className="tabular-nums">{formatPhone(c.phone)}</Text>}
          right={disabled ? <Badge>Chưa dùng ví</Badge> : undefined}
        />
      </Box>
    )
  }

  let single: ReactNode = null
  if (self) single = <Text role="status" className="block py-3 text-destructive">{SELF}</Text>
  else if (needsLookup && lookup?.phone === digits) {
    const res = lookup.res
    if (!res) single = <HStack role="status" className="items-center gap-2 py-3"><Spinner size="small" aria-hidden /><Text className="text-muted-foreground">Đang tìm…</Text></HStack>
    else if (res.status === 'wallet')
      single = <VStack role="list" className="-mx-4">{row({ ...res.contact, hasWallet: true }, 'lookup')}</VStack>
    else if (res.status === 'error')
      single = <HStack role="alert" className="items-center justify-between gap-3 py-3"><Text className="text-destructive">Không kiểm tra được số điện thoại. Thử lại.</Text><Button size="sm" variant="secondary" onClick={() => setRetry((n) => n + 1)}>Thử lại</Button></HStack>
    else single = <Text role="status" className="block py-3 text-muted-foreground">Số điện thoại này chưa dùng ví.</Text>
  }

  return (
    <Box>
      {banner ? <Box className="mb-6"><Callout tone="danger" title={banner} /></Box> : null}
      <Text id="recipient-search-label" size="sm" className="mb-2 block font-medium">Người nhận</Text>
      <Input className="h-12">
        <InputSlot className="pl-1"><InputIcon as={Search} aria-hidden /></InputSlot>
        <InputField
          id="recipient-search" role="searchbox" autoComplete="off" placeholder="Nhập số điện thoại hoặc tên"
          aria-labelledby="recipient-search-label"
          inputMode={/^\d/.test(query) ? 'tel' : 'text'}
          value={digits ? formatPhone(digits) : query}
          onChangeText={(v: string) => { setHelper(undefined); setQuery(/^[\d\s]+$/.test(v) ? v.replace(/\D/g, '').slice(0, 10) : v) }}
        />
      </Input>
      <Text id="no-wallet-help" role="status" aria-live="polite" size="sm" className="mt-2 block min-h-5 text-muted-foreground">{helper}</Text>
      {single}
      {!single && !fRecent.length && !fAll.length ? <Text className="block py-3 text-muted-foreground">Không tìm thấy người nhận.</Text> : null}
      {!single && fRecent.length ? (
        <VStack role="region" aria-labelledby="g-recent" className="mt-2">
          <GroupLabel id="g-recent" className="sticky top-14 z-10 bg-background py-2 lg:top-0">Gần đây</GroupLabel>
          <VStack role="list" className="-mx-4">{fRecent.map((c) => row(c, 'r'))}</VStack>
        </VStack>
      ) : null}
      {!single && fAll.length ? (
        <VStack role="region" aria-labelledby="g-all" className="mt-3">
          <GroupLabel id="g-all" className="sticky top-14 z-10 bg-background py-2 lg:top-0">Danh bạ</GroupLabel>
          <VStack role="list" className="-mx-4">{fAll.map((c) => row(c, 'a'))}</VStack>
        </VStack>
      ) : null}
    </Box>
  )
}

/* ── amount (US-TRF-003) ──────────────────────────────────────────── */

function AmountStep({ draft, setDraft, onNext, onChange }: { draft: Draft; setDraft: (p: Partial<Draft>) => void; onNext: () => void; onChange: () => void }) {
  const w = useWorld()
  const r = draft.recipient!
  const check = draft.amount > 0 ? checkAmount('p2p_out', draft.amount) : null
  const error = check && !check.ok ? check.message : undefined
  return (
    <>
      <RecipientChip name={r.name} sub={<Text className="tabular-nums">{formatPhone(r.phone)}</Text>} note={draft.fromQr ? 'Từ mã nhận tiền' : undefined} onChange={draft.locked ? undefined : onChange} />
      {draft.locked
        ? <LockedAmount amount={draft.amount} note="Số tiền theo mã QR" error={error} />
        : <AmountInput value={draft.amount} onChange={(amount) => setDraft({ amount })} error={error} hint={<>Số dư khả dụng: <Text className="tabular-nums">{formatVnd(w.balance)}</Text></>} />}
      <MessageField value={draft.message} onChange={(message) => setDraft({ message })} placeholder={`${w.customer.name} chuyển tiền`} />
      <Box className="mt-8">
        {draft.locked && error
          ? <ButtonLink to="/pay/scan" variant="secondary" block>Đổi mã</ButtonLink>
          : <Button block disabled={!check?.ok} onClick={onNext}>Tiếp tục</Button>}
      </Box>
    </>
  )
}

/* ── confirm (US-TRF-004) ─────────────────────────────────────────── */

function ConfirmStep({ draft, defaultMessage, toAmount, onDone }: { draft: Draft; defaultMessage: string; toAmount: () => void; onDone: (id: string) => void }) {
  const r = draft.recipient!
  const message = draft.message.trim() || defaultMessage
  const commit = useMoneyCommit(() => ({ type: 'p2p_out', amount: draft.amount, counterparty: r, message, authMethod: 'pin' }), (t) => onDone(t.id))
  if (commit.busy)
    return (
      <VStack role="status" aria-live="polite" className="items-center py-16 text-center">
        <Spinner size="large" aria-hidden />
        <Text className="mt-3 font-semibold">Đang chuyển tiền…</Text>
        <Money amount={draft.amount} className="mt-1 text-4xl font-bold" />
      </VStack>
    )
  return (
    <>
      <Heading as="h2" size="lg" className="mb-3">Xác nhận</Heading>
      <Money amount={draft.amount} className="mb-3 block text-center text-4xl font-bold" />
      <ConfirmRows rows={[
        ['Người nhận', <><Text className="block break-words">{r.name}</Text><Text size="sm" className="block font-normal text-muted-foreground tabular-nums">{maskPhone(r.phone)}</Text></>],
        ['Số tiền', <Money amount={draft.amount} />],
        ['Phí', <Fee amount={0} />],
        ['Tổng tiền', <Money amount={draft.amount} className="font-bold" />],
        ['Nguồn tiền', 'Ví'],
        ['Lời nhắn', message],
      ]} />
      <AuthNote type="p2p_out" amount={draft.amount} />
      {commit.error ? <Text role="alert" size="sm" className="mt-3 block text-destructive">{commit.error}</Text> : null}
      <VStack className="mt-8 gap-2">
        <Button block onClick={() => (checkAmount('p2p_out', draft.amount).ok ? commit.start() : toAmount())}>Xác nhận</Button>
        <Button block variant="ghost" onClick={toAmount}>Quay lại</Button>
      </VStack>
      {commit.sheet}
    </>
  )
}
