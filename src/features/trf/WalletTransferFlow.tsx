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
import { Avatar, Badge, Button, ButtonLink, Callout, cx, Money, Row, Skeleton, TextInput } from '@/components/app-ui'
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
      <div aria-busy className="space-y-stack">
        <p role="status" className="text-muted">Đang đọc mã…</p>
        <Skeleton className="h-16" />
      </div>
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
      <li key={group + c.id}>
        <Row
          disabled={disabled}
          aria-describedby={disabled ? 'no-wallet-help' : undefined}
          onClick={() => (disabled ? setHelper(`${c.name}: Người này chưa dùng ví nên chưa nhận được tiền qua ví.`) : onPick({ kind: 'contact', id: c.id, name: c.name, phone: c.phone }))}
          left={<span className={cx(disabled && 'opacity-60')}><Avatar name={c.name} size={40} /></span>}
          title={<span title={c.name} className={cx(disabled && 'text-muted')}>{c.name}</span>}
          subtitle={<span className="tnum">{formatPhone(c.phone)}</span>}
          right={disabled ? <Badge>Chưa dùng ví</Badge> : undefined}
        />
      </li>
    )
  }

  let single: ReactNode = null
  if (self) single = <p role="status" className="py-3 text-danger">{SELF}</p>
  else if (needsLookup && lookup?.phone === digits) {
    const res = lookup.res
    if (!res) single = <p role="status" className="flex items-center gap-2 py-3 text-muted"><span className="size-4 animate-spin rounded-full border-2 border-current border-r-transparent" aria-hidden />Đang tìm…</p>
    else if (res.status === 'wallet')
      single = <ul className="-mx-inset">{row({ ...res.contact, hasWallet: true }, 'lookup')}</ul>
    else if (res.status === 'error')
      single = <div role="alert" className="flex items-center justify-between gap-3 py-3"><span className="text-danger">Không kiểm tra được số điện thoại. Thử lại.</span><Button size="sm" variant="secondary" onClick={() => setRetry((n) => n + 1)}>Thử lại</Button></div>
    else single = <p role="status" className="py-3 text-muted">Số điện thoại này chưa dùng ví.</p>
  }

  return (
    <div>
      {banner ? <div className="mb-group"><Callout tone="danger" title={banner} /></div> : null}
      <label htmlFor="recipient-search" className="mb-header block text-[13px] font-medium">Người nhận</label>
      <div className="relative">
        <Search size={18} strokeWidth={1.75} aria-hidden className="pointer-events-none absolute top-1/2 left-4 -translate-y-1/2 text-muted" />
        <TextInput
          id="recipient-search" type="search" autoComplete="off" placeholder="Nhập số điện thoại hoặc tên" className="pl-11"
          inputMode={/^\d/.test(query) ? 'tel' : 'text'}
          value={digits ? formatPhone(digits) : query}
          onChange={(e) => { setHelper(undefined); setQuery(/^[\d\s]+$/.test(e.target.value) ? e.target.value.replace(/\D/g, '').slice(0, 10) : e.target.value) }}
        />
      </div>
      <p id="no-wallet-help" role="status" aria-live="polite" className="mt-header min-h-5 text-[13px] leading-5 text-muted">{helper}</p>
      {single}
      {!single && !fRecent.length && !fAll.length ? <p className="py-3 text-muted">Không tìm thấy người nhận.</p> : null}
      {!single && fRecent.length ? (
        <section aria-labelledby="g-recent" className="mt-header">
          <h2 id="g-recent" className="label-caps sticky top-14 z-10 bg-surface py-header lg:top-0">Gần đây</h2>
          <ul className="-mx-inset">{fRecent.map((c) => row(c, 'r'))}</ul>
        </section>
      ) : null}
      {!single && fAll.length ? (
        <section aria-labelledby="g-all" className="mt-stack">
          <h2 id="g-all" className="label-caps sticky top-14 z-10 bg-surface py-header lg:top-0">Danh bạ</h2>
          <ul className="-mx-inset">{fAll.map((c) => row(c, 'a'))}</ul>
        </section>
      ) : null}
    </div>
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
      <RecipientChip name={r.name} sub={<span className="tnum">{formatPhone(r.phone)}</span>} note={draft.fromQr ? 'Từ mã nhận tiền' : undefined} onChange={draft.locked ? undefined : onChange} />
      {draft.locked
        ? <LockedAmount amount={draft.amount} note="Số tiền theo mã QR" error={error} />
        : <AmountInput value={draft.amount} onChange={(amount) => setDraft({ amount })} error={error} hint={<>Số dư khả dụng: <span className="tnum">{formatVnd(w.balance)}</span></>} />}
      <MessageField value={draft.message} onChange={(message) => setDraft({ message })} placeholder={`${w.customer.name} chuyển tiền`} />
      <div className="mt-section">
        {draft.locked && error
          ? <ButtonLink to="/pay/scan" variant="secondary" block>Đổi mã</ButtonLink>
          : <Button block disabled={!check?.ok} onClick={onNext}>Tiếp tục</Button>}
      </div>
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
      <div role="status" aria-live="polite" className="flex flex-col items-center py-16 text-center">
        <span className="size-8 animate-spin rounded-full border-2 border-current border-r-transparent" aria-hidden />
        <p className="mt-stack font-semibold">Đang chuyển tiền…</p>
        <p className="mt-1"><Money amount={draft.amount} className="amount-display" /></p>
      </div>
    )
  return (
    <>
      <h2 className="mb-stack headline">Xác nhận</h2>
      <p className="mb-stack text-center"><Money amount={draft.amount} className="amount-display" /></p>
      <ConfirmRows rows={[
        ['Người nhận', <><span className="block break-words">{r.name}</span><span className="block text-[13px] font-normal text-muted tnum">{maskPhone(r.phone)}</span></>],
        ['Số tiền', <Money amount={draft.amount} />],
        ['Phí', 'Miễn phí'],
        ['Tổng tiền', <b><Money amount={draft.amount} /></b>],
        ['Nguồn tiền', 'Ví'],
        ['Lời nhắn', message],
      ]} />
      <AuthNote type="p2p_out" amount={draft.amount} />
      {commit.error ? <p role="alert" className="mt-stack text-[13px] text-danger">{commit.error}</p> : null}
      <div className="mt-section flex flex-col gap-2">
        <Button block onClick={() => (checkAmount('p2p_out', draft.amount).ok ? commit.start() : toAmount())}>Xác nhận</Button>
        <Button block variant="ghost" onClick={toAmount}>Quay lại</Button>
      </div>
      {commit.sheet}
    </>
  )
}
