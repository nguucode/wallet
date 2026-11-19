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
  AmountInput, checkAmount, ConfirmRows, FlowFrame, feeLabel, maskAccount, ResultView, useCloseFlow, useFlow, useMoneyCommit,
} from '@/features/flow/FlowKit'
import { BankMark, Button, ButtonLink, Callout, Card, cx, Money, Row, Section, Sheet, TextInput } from '@/components/app-ui'
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
  return t?.status === 'failed' ? <p className="mt-stack text-[15px] text-muted">Phí đã được hoàn cùng số tiền.</p> : null
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
    return <p role="status" className="py-10 text-center text-muted">Đang đọc mã…</p>

  return (
    <>
      {prefill?.invalid ? <div className="mb-group"><Callout tone="danger" title="Mã QR không hợp lệ. Hãy quét lại hoặc nhập người nhận." /></div> : null}
      {w.bankRecipients.length ? (
        <Section title="Người nhận đã lưu" className="mt-0 lg:mt-0">
          <Card className="overflow-hidden">
            <ul>
              {w.bankRecipients.slice(0, 6).map((r) => (
                <li key={r.id}>
                  <Row
                    onClick={() => { setBankId(r.bankId); setAccount(r.account); void run(r.bankId, r.account) }}
                    left={<BankMark short={bankById(r.bankId).short} size={40} />}
                    title={<span title={r.holder}>{r.holder}</span>}
                    subtitle={<span className="whitespace-nowrap">{bankById(r.bankId).name} · {maskAccount(r.account)}</span>}
                  />
                </li>
              ))}
            </ul>
          </Card>
        </Section>
      ) : null}

      <Section title="Tài khoản nhận" className="mt-section">
        <Card className="p-inset">
        <div className="mb-group">
          <p id="bank-label" className="mb-header text-[13px] font-medium">Ngân hàng</p>
          <button
            type="button" aria-labelledby="bank-label bank-value" aria-haspopup="dialog" onClick={() => setPicker(true)}
            className="flex h-12 w-full items-center gap-3 rounded-[var(--radius-input)] bg-surface-2 px-4 text-left lg:h-11"
          >
            {bank ? <BankMark short={bank.short} size={28} /> : null}
            <span id="bank-value" className={cx('flex-1', !bank && 'text-muted')}>{bank?.name ?? 'Chọn ngân hàng'}</span>
            <ChevronDown size={18} strokeWidth={1.75} aria-hidden className="text-muted" />
          </button>
        </div>
        <label htmlFor="account" className="mb-header block text-[13px] font-medium">Số tài khoản</label>
        <div className="flex gap-2">
          <TextInput
            id="account" inputMode="numeric" autoComplete="off" maxLength={19} value={account} invalid={!!formatError || !!lookupError}
            aria-describedby="lookup-msg"
            onChange={(e) => { setAccount(e.target.value.replace(/\D/g, '').slice(0, 19)); reset() }}
            onBlur={() => { if (account && lookup.status === 'idle') void run() }}
            className="tnum"
          />
          <Button variant="secondary" disabled={!bank || !account} onClick={() => void run()}>Kiểm tra</Button>
        </div>
        {/* The live region stays mounted for announcements but takes no space when empty, so the card's bottom inset matches its top. */}
        <div id="lookup-msg" aria-live="polite" className={cx('text-[13px] leading-5', (formatError || lookup.status === 'loading' || lookupError) && 'mt-header')}>
          {formatError ? <span className="text-danger">{formatError}</span> : null}
          {lookup.status === 'loading' ? <span className="flex items-center gap-2 text-muted"><span className="size-4 animate-spin rounded-full border-2 border-current border-r-transparent" aria-hidden />Đang kiểm tra tên chủ tài khoản…</span> : null}
          {lookupError === 'not_found' ? <span className="text-danger">Không tìm thấy tài khoản. Kiểm tra lại ngân hàng và số tài khoản.</span> : null}
          {lookupError === 'timeout' ? (
            <span className="flex flex-wrap items-center gap-2 text-danger">Không kiểm tra được tên chủ tài khoản.<Button size="sm" variant="secondary" onClick={() => void run()}>Thử lại</Button></span>
          ) : null}
        </div>
        {found ? (
          <div className="mt-stack flex items-start gap-3 rounded-[12px] border border-line bg-success-soft/40 p-inset">
            <Check size={20} strokeWidth={2} aria-hidden className="mt-1 shrink-0 text-success" />
            <div className="min-w-0">
              <p className="text-[13px] text-muted">Tên chủ tài khoản</p>
              <p className="text-[16px] font-bold break-words">{found}</p>
            </div>
          </div>
        ) : null}
        </Card>
      </Section>
      <div className="mt-section">
        <Button block disabled={!found || !bankId} onClick={() => onNext(bankId!, account, found!, false)}>Tiếp tục</Button>
      </div>

      <BankPicker open={picker} onOpenChange={setPicker} onPick={(id) => { setBankId(id); setPicker(false); reset() }} />
    </>
  )
}

function BankPicker({ open, onOpenChange, onPick }: { open: boolean; onOpenChange: (o: boolean) => void; onPick: (id: string) => void }) {
  const [q, setQ] = useState('')
  const list = BANKS.filter((b) => fold(b.name).includes(fold(q)))
  return (
    <Sheet open={open} onOpenChange={onOpenChange} title="Chọn ngân hàng">
      <div className="relative mb-stack">
        <Search size={18} strokeWidth={1.75} aria-hidden className="pointer-events-none absolute top-1/2 left-4 -translate-y-1/2 text-muted" />
        <TextInput aria-label="Tìm ngân hàng" placeholder="Tìm ngân hàng" value={q} onChange={(e) => setQ(e.target.value)} className="pl-11" />
      </div>
      {/* Rows run edge to edge in the sheet, like a grouped list. */}
      <ul className="-mx-inset">
        {list.map((b) => (
          <li key={b.id}><Row onClick={() => onPick(b.id)} left={<BankMark short={b.short} size={40} />} title={b.name} /></li>
        ))}
        {!list.length ? <li className="px-inset py-group text-center text-muted">Không tìm thấy ngân hàng.</li> : null}
      </ul>
    </Sheet>
  )
}

/* ── amount (US-TRF-006) ──────────────────────────────────────────── */

function AmountStep({ draft, setDraft, onNext, onChange }: { draft: Draft; setDraft: (p: Partial<Draft>) => void; onNext: () => void; onChange: () => void }) {
  const w = useWorld()
  const bank = bankById(draft.bankId!)
  const check = draft.amount > 0 ? checkAmount('bank_transfer', draft.amount) : null
  const error = check && !check.ok ? check.message : undefined
  const hint = <>Tối đa {formatVnd(config.bankTransferMax)} mỗi giao dịch · Số dư khả dụng: <span className="tnum">{formatVnd(w.balance)}</span></>
  return (
    <>
      <RecipientChip name={draft.holder!} sub={<span className="whitespace-nowrap">{bank.name} · {maskAccount(draft.account)}</span>} note={draft.fromQr ? 'Từ mã VietQR' : undefined} onChange={draft.locked ? undefined : onChange} />
      {draft.locked
        ? <LockedAmount amount={draft.amount} note="Số tiền theo mã QR" error={error} />
        : <AmountInput value={draft.amount} onChange={(amount) => setDraft({ amount })} error={error} hint={hint} />}
      {draft.amount > 0 ? <p className="mt-stack text-[15px]"><span className="text-muted">Phí: </span>{feeLabel('bank_transfer', draft.amount)}</p> : null}
      <MessageField value={draft.message} onChange={(message) => setDraft({ message })} />
      <div className="mt-section">
        {draft.locked && error
          ? <ButtonLink to="/pay/scan" variant="secondary" block>Đổi mã</ButtonLink>
          : <Button block disabled={!check?.ok} onClick={onNext}>Tiếp tục</Button>}
      </div>
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
      <div role="status" aria-live="polite" className="flex flex-col items-center py-16 text-center">
        <span className="size-8 animate-spin rounded-full border-2 border-current border-r-transparent" aria-hidden />
        <p className="mt-stack font-semibold">Đang chuyển tiền…</p>
        <p className="mt-1"><Money amount={draft.amount} className="amount-display" /></p>
        <p className="mt-1 text-muted break-words">{draft.holder}</p>
      </div>
    )
  return (
    <>
      <h2 className="mb-stack headline">Xác nhận</h2>
      <p className="mb-stack text-center"><Money amount={draft.amount} className="amount-display" /></p>
      <ConfirmRows rows={[
        ['Người nhận', <span className="break-words">{draft.holder}</span>],
        ['Ngân hàng', bank.name],
        ['Số tài khoản', <span className="tnum whitespace-nowrap">{maskAccount(draft.account)}</span>],
        ['Số tiền', <Money amount={draft.amount} />],
        ['Phí', <>{feeLabel('bank_transfer', draft.amount)}{f ? <span className="block text-[13px] font-normal text-muted">Đã dùng hết {config.fees.freeWithdrawPerMonth} lượt miễn phí trong tháng</span> : null}</>],
        ['Tổng tiền', <b><Money amount={draft.amount + f} /></b>],
        ['Nguồn tiền', 'Ví'],
        ['Lời nhắn', draft.message.trim() || 'Chuyển tiền'],
      ]} />
      <AuthNote type="bank_transfer" amount={draft.amount} />
      {commit.error ? <p role="alert" className="mt-stack text-[13px] text-danger">{commit.error}</p> : null}
      <div className="mt-section flex flex-col gap-2">
        <Button block onClick={() => (checkAmount('bank_transfer', draft.amount).ok ? commit.start() : toAmount())}>Xác nhận</Button>
        <Button block variant="ghost" onClick={toAmount}>Quay lại</Button>
      </div>
      {commit.sheet}
    </>
  )
}
