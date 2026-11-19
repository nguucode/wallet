import { useState, type ReactNode } from 'react'
import { Link, useNavigate } from 'react-router'
import { formatVnd } from '@/domain/money'
import { SampleBadge } from '@/app/Shell'
import { lookupBill, mutate, now, saveBill, useWorld } from '@/app/store'
import { ConfirmRows, FlowFrame, fmtDate, useCloseFlow, useFlow } from '@/features/flow/FlowKit'
import { GatedRoute } from '@/features/sec/Gate'
import { BankMark, Button, Field, Row, TextInput } from '@/components/app-ui'
import { isValidCustomerCode, periodLabel, vnToday } from './bills'

const STEPS = ['biller', 'customer-code', 'lookup'] as const
type Found = { holder: string; address: string; amount: number; period: string }
type Draft = { billerId?: string; code: string; found?: Found; noDebt?: boolean }

/** rules.md decisions: XX… not found, …0000 no unpaid period, …9999 biller unavailable. */
const SAMPLES = [
  { code: 'XX01234567890', hint: 'Không tìm thấy' },
  { code: 'HH01234560000', hint: 'Không có hóa đơn cần thanh toán' },
  { code: 'HH01234569999', hint: 'Nhà cung cấp gián đoạn' },
]

const monogram = (name: string) => name.replace(/^Điện lực\s+/, '').split(/\s+/).slice(0, 2).map((p) => p[0]).join('').toUpperCase()

/** saveBill always stores a due period; a customer with nothing to pay is stored as already paid. Feature-local action via `mutate`. */
function saveNoDebtBill(billerId: string, customerCode: string): string {
  const id = 'b' + now()
  const today = vnToday(now())
  mutate((w) => { w.bills.unshift({ id, billerId, customerCode, holder: '', address: '', period: today.slice(0, 7), amount: 0, dueDate: today, status: 'paid' }) })
  return id
}

function Flow() {
  const w = useWorld()
  const nav = useNavigate()
  const flow = useFlow<Draft>('bill-new', STEPS, { code: '' })
  const { draft, setDraft, go } = flow
  const { close, dialog } = useCloseFlow(!!draft.code, flow.clear, '/bills')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<ReactNode>()
  const billers = w.billers.filter((b) => b.category === 'electricity' && !b.p1)
  const biller = billers.find((b) => b.id === draft.billerId)

  if (flow.step === 'biller' || !biller)
    return (
      <FlowFrame title="Chọn nhà cung cấp" onClose={close}>
        <h2 className="label-caps mb-header px-4">Điện</h2>
        <ul className="card overflow-hidden">
          {billers.map((b) => (
            <li key={b.id}>
              <Row
                onClick={() => { setDraft({ billerId: b.id, found: undefined, noDebt: false }); setError(undefined); go('customer-code') }}
                left={<BankMark short={monogram(b.name)} size={40} />}
                title={b.name}
                chevron
              />
            </li>
          ))}
        </ul>
        {dialog}
      </FlowFrame>
    )

  if (flow.step === 'lookup' && (draft.found || draft.noDebt)) {
    const finish = (pay: boolean) => {
      const id = draft.found ? saveBill({ billerId: biller.id, customerCode: draft.code, ...draft.found }) : saveNoDebtBill(biller.id, draft.code)
      flow.clear()
      if (pay) nav(`/bills/${id}`)
      else nav('/bills', { state: { toast: 'Đã lưu hóa đơn' } })
    }
    return (
      <FlowFrame title="Thông tin hóa đơn" onBack={() => go('customer-code')} onClose={close}
        footer={draft.found ? (
          <>
            <Button block onClick={() => finish(true)}>Lưu và thanh toán</Button>
            <Button block variant="secondary" onClick={() => finish(false)}>Chỉ lưu</Button>
          </>
        ) : <Button block onClick={() => finish(false)}>Lưu hóa đơn</Button>}>
        <div className="card p-inset">
          <p className="font-semibold">{biller.name}</p>
          <p className="text-[13px] text-muted tnum">{draft.code}</p>
          {draft.found ? (
            <>
              <p className="amount-display mt-stack">{formatVnd(draft.found.amount)}</p>
              <div className="mt-stack">
                <ConfirmRows rows={[
                  ['Chủ hộ', draft.found.holder],
                  ['Địa chỉ', draft.found.address],
                  ['Kỳ', periodLabel(draft.found.period)],
                  ['Hạn thanh toán', fmtDate(new Date(now() + 10 * 86_400_000))],
                ]} />
              </div>
            </>
          ) : <p role="status" className="mt-stack">Không có hóa đơn cần thanh toán kỳ này</p>}
        </div>
        {dialog}
      </FlowFrame>
    )
  }

  /* customer-code */
  const lookup = async () => {
    setError(undefined)
    if (!isValidCustomerCode(draft.code)) return setError('Mã khách hàng không đúng định dạng')
    const saved = w.bills.find((b) => b.billerId === biller.id && b.customerCode === draft.code)
    if (saved) return setError(<>Hóa đơn này đã có trong danh sách. <Link to={`/bills/${saved.id}`} className="font-semibold text-tint">Xem hóa đơn</Link></>)
    setBusy(true)
    try {
      const r = await lookupBill(biller.id, draft.code)
      if (r.ok) { setDraft({ found: { holder: r.holder, address: r.address, amount: r.amount, period: r.period }, noDebt: false }); go('lookup') }
      else if (r.error === 'no_debt') { setDraft({ found: undefined, noDebt: true }); go('lookup') }
      else setError(r.error === 'not_found' ? `Không tìm thấy mã khách hàng tại ${biller.name}` : 'Nhà cung cấp đang tạm gián đoạn, vui lòng thử lại sau')
    } catch {
      setError(<>Không tra cứu được. <button type="button" onClick={lookup} className="font-semibold text-tint underline">Thử lại</button></>)
    } finally { setBusy(false) }
  }
  return (
    <FlowFrame title="Nhập mã khách hàng" onBack={() => go('biller')} onClose={close}
      footer={<Button block loading={busy} onClick={lookup}>{busy ? 'Đang tra cứu…' : 'Tra cứu'}</Button>}>
      <form onSubmit={(e) => { e.preventDefault(); void lookup() }}>
        <p className="mb-stack flex items-center gap-2 font-medium">
          <BankMark short={monogram(biller.name)} size={32} />
          {biller.name}
        </p>
        <Field label="Mã khách hàng" htmlFor="bill-code" error={error} hint="Mã in ở góc trên hóa đơn tiền điện, ví dụ HH01234567890">
          <TextInput
            id="bill-code" autoFocus inputMode="text" autoCapitalize="characters" autoComplete="off" spellCheck={false} maxLength={13}
            invalid={!!error} readOnly={busy} value={draft.code} className="tnum uppercase"
            onChange={(e) => { setError(undefined); setDraft({ code: e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '') }) }}
          />
        </Field>
      </form>
      <div className="rounded-[var(--radius-input)] bg-surface-2 p-inset">
        <p className="mb-header flex items-center gap-2 text-[13px] font-semibold">Mã mẫu <SampleBadge /></p>
        <ul className="text-[13px]">
          {SAMPLES.map((s) => (
            <li key={s.code}>
              <button type="button" onClick={() => { setError(undefined); setDraft({ code: s.code }) }} className="flex min-h-11 w-full items-center gap-2 text-left hover:underline">
                <span className="font-semibold tnum">{s.code}</span><span className="text-muted">· {s.hint}</span>
              </button>
            </li>
          ))}
        </ul>
      </div>
      {dialog}
    </FlowFrame>
  )
}

export default function AddBillFlow() {
  return <GatedRoute><Flow /></GatedRoute>
}
