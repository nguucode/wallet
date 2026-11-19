import { isValidAccountNumber } from '@/features/trf/logic'
import { config } from '@/domain/config'
import { Check, Search } from 'lucide-react'
import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router'
import { useLayout } from '@/app/layout'
import { BANKS, bankById, linkSource, useWorld } from '@/app/store'
import { BankMark, Button, Card, Field, Row, Segmented, Sheet, TextInput } from '@/components/ui'
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
          <div className="relative">
            <Search size={18} strokeWidth={1.75} aria-hidden className="absolute top-1/2 left-4 -translate-y-1/2 text-muted" />
            <TextInput id="bank-q" type="search" value={query} onChange={(e) => setQuery(e.target.value)} className="pl-11" autoComplete="off" />
          </div>
        </Field>
        {banks.length ? (
          <ul className="-mx-inset">
            {banks.map((b) => {
              const linked = w.sources.find((s) => s.bankId === b.id)
              return (
                <li key={b.id}>
                  <Row
                    onClick={() => { setDraft({ bankId: b.id, number: draft.bankId === b.id ? draft.number : '' }); go('account') }}
                    left={<BankMark short={b.short} size={40} />}
                    title={b.name}
                    subtitle={linked ? <>Đã liên kết <span className="tnum">{mask4(linked.last4)}</span></> : undefined}
                    chevron
                  />
                </li>
              )
            })}
          </ul>
        ) : (
          <p role="status" className="py-section text-center text-muted">Không tìm thấy ngân hàng.</p>
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
        <Card className="p-inset">
          <div className="mb-group">
            <Segmented label="Loại nguồn tiền" value={draft.kind} onChange={(k) => { setError(undefined); setDraft({ kind: k }) }}
              options={[{ value: 'account', label: 'Tài khoản' }, { value: 'debit_card', label: 'Thẻ ghi nợ' }]} />
          </div>
          <Field label={isCard ? 'Số thẻ' : 'Số tài khoản'} htmlFor="src-number" error={error} hint={`Từ ${config.accountDigits.min} đến ${config.accountDigits.max} chữ số`}>
            <TextInput
              id="src-number" inputMode="numeric" autoComplete="off" invalid={!!error}
              value={groupDigits(draft.number)}
              onChange={(e) => { setError(undefined); setDraft({ number: e.target.value.replace(/\D/g, '').slice(0, config.accountDigits.max) }) }}
              onKeyDown={(e) => e.key === 'Enter' && valid && !checking && submit()}
              className="tnum"
            />
          </Field>
          <p className="break-words"><span className="text-muted">Chủ tài khoản: </span><span className="font-medium">{holder}</span></p>
        </Card>
      </FlowFrame>
    )
  }

  if (step === 'consent' && bank) {
    return (
      <FlowFrame title="Cho phép Wallet" onBack={back('account')} onClose={close}
        footer={<Button block onClick={() => { setSheetOpen(true); go('bank-app') }}>Đồng ý liên kết</Button>}>
        <Card className="p-inset">
          <p className="mb-stack text-muted">{bank.name} · {draft.kind === 'debit_card' ? 'Thẻ ghi nợ' : 'Tài khoản'} <span className="tnum">{mask4(draft.number.slice(-4))}</span></p>
          <ul className="flex flex-col gap-3">
            {['Nạp tiền vào ví từ tài khoản này', 'Rút tiền từ ví về tài khoản này'].map((l) => (
              <li key={l} className="flex items-start gap-3"><Check size={20} strokeWidth={2} aria-hidden className="mt-1 shrink-0 text-success" />{l}</li>
            ))}
          </ul>
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
        {layout === 'web' ? <p className="mb-stack font-medium">Mở ứng dụng ngân hàng trên điện thoại để xác nhận</p> : null}
        <p role="status" className="flex items-center gap-2 text-muted">
          <span aria-hidden className="size-4 animate-spin rounded-full border-2 border-current border-r-transparent" />
          Đang chờ xác nhận từ ngân hàng…
        </p>
        <Sheet open={sheetOpen} onOpenChange={setSheetOpen} title={`Mô phỏng ứng dụng ${bank.name}`} description="Đây là màn hình mô phỏng của ngân hàng, không phải của Wallet.">
          <dl className="mb-group divide-y divide-line-soft rounded-[12px] bg-surface-2 px-4">
            {[['Yêu cầu', 'Liên kết với ví Wallet'], ['Nguồn tiền', `${draft.kind === 'debit_card' ? 'Thẻ ghi nợ' : 'Tài khoản'} ${mask4(draft.number.slice(-4))}`], ['Chủ tài khoản', holder], ['Số ví', w.customer.walletNumber]].map(([k, v]) => (
              <div key={k} className="flex justify-between gap-4 py-2.5"><dt className="text-muted">{k}</dt><dd className="text-right font-medium break-words">{v}</dd></div>
            ))}
          </dl>
          <div className="flex flex-col gap-2">
            <Button variant="ink" block loading={confirming} onClick={() => decide(true)}>Xác nhận liên kết</Button>
            <Button variant="secondary" block disabled={confirming} onClick={() => decide(false)}>Từ chối</Button>
          </div>
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
          <ResultBlock tone="failed" heading="Ngân hàng chưa xác nhận liên kết"><p>Nguồn tiền chưa được thêm vào ví.</p></ResultBlock>
        </FlowFrame>
      )
    const done = (to: string) => () => { clear(); nav(to) }
    return (
      <FlowFrame title="Liên kết ngân hàng" footer={draft.first ? <>
        <Button block onClick={done('/topup')}>Nạp tiền</Button>
        <Button variant="secondary" block onClick={done('/home')}>Về trang chủ</Button>
      </> : toHome ? <Button block onClick={done('/home')}>Về trang chủ</Button> : <Button block onClick={done('/me/sources')}>Xem nguồn tiền</Button>}>
        <ResultBlock tone="success" heading={`Đã liên kết ${name}`}>
          {draft.first ? <p>Ví đã sẵn sàng để nạp tiền.</p> : null}
        </ResultBlock>
      </FlowFrame>
    )
  }

  // Step opened without its draft: useFlow restarts at `bank`.
  return null
}
