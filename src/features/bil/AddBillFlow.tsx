import { useState, type ReactNode } from 'react'
import { useNavigate } from 'react-router'
import { formatVnd } from '@/domain/money'
import { SampleBadge } from '@/app/Shell'
import { lookupBill, mutate, now, saveBill, useWorld } from '@/app/store'
import { ConfirmRows, FlowFrame, fmtDate, useCloseFlow, useFlow } from '@/features/flow/FlowKit'
import { GatedRoute } from '@/features/sec/Gate'
import { BankMark, Button, Card, Field, Row, TextInput, TextLink } from '@/components/app-ui'
import { Box } from '@/components/ui/box'
import { Heading } from '@/components/ui/heading'
import { HStack } from '@/components/ui/hstack'
import { Link, LinkText } from '@/components/ui/link'
import { Pressable } from '@/components/ui/pressable'
import { Text } from '@/components/ui/text'
import { VStack } from '@/components/ui/vstack'
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
        <Heading size="xs" as="h2" className="mb-2 px-4 uppercase text-muted-foreground">Điện</Heading>
        <Card className="overflow-hidden p-0">
          <VStack role="list" className="divide-y divide-border">
          {billers.map((b) => (
            <Box key={b.id} role="listitem">
              <Row
                onClick={() => { setDraft({ billerId: b.id, found: undefined, noDebt: false }); setError(undefined); go('customer-code') }}
                left={<BankMark short={monogram(b.name)} size={40} />}
                title={b.name}
                chevron
              />
            </Box>
          ))}
          </VStack>
        </Card>
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
        <Card>
          <Text className="font-semibold">{biller.name}</Text>
          <Text size="sm" className="text-muted-foreground tabular-nums">{draft.code}</Text>
          {draft.found ? (
            <>
              <Text size="4xl" bold className="mt-3 tabular-nums">{formatVnd(draft.found.amount)}</Text>
              <Box className="mt-3">
                <ConfirmRows rows={[
                  ['Chủ hộ', draft.found.holder],
                  ['Địa chỉ', draft.found.address],
                  ['Kỳ', periodLabel(draft.found.period)],
                  ['Hạn thanh toán', fmtDate(new Date(now() + 10 * 86_400_000))],
                ]} />
              </Box>
            </>
          ) : <Text role="status" className="mt-3">Không có hóa đơn cần thanh toán kỳ này</Text>}
        </Card>
        {dialog}
      </FlowFrame>
    )
  }

  /* customer-code */
  const lookup = async () => {
    setError(undefined)
    if (!isValidCustomerCode(draft.code)) return setError('Mã khách hàng không đúng định dạng')
    const saved = w.bills.find((b) => b.billerId === biller.id && b.customerCode === draft.code)
    if (saved) return setError(<>Hóa đơn này đã có trong danh sách. <TextLink to={`/bills/${saved.id}`}>Xem hóa đơn</TextLink></>)
    setBusy(true)
    try {
      const r = await lookupBill(biller.id, draft.code)
      if (r.ok) { setDraft({ found: { holder: r.holder, address: r.address, amount: r.amount, period: r.period }, noDebt: false }); go('lookup') }
      else if (r.error === 'no_debt') { setDraft({ found: undefined, noDebt: true }); go('lookup') }
      else setError(r.error === 'not_found' ? `Không tìm thấy mã khách hàng tại ${biller.name}` : 'Nhà cung cấp đang tạm gián đoạn, vui lòng thử lại sau')
    } catch {
      setError(<>Không tra cứu được. <Link role="button" onPress={() => void lookup()}><LinkText>Thử lại</LinkText></Link></>)
    } finally { setBusy(false) }
  }
  return (
    <FlowFrame title="Nhập mã khách hàng" onBack={() => go('biller')} onClose={close}
      footer={<Button block loading={busy} onClick={lookup}>{busy ? 'Đang tra cứu…' : 'Tra cứu'}</Button>}>
      <Box>
        <HStack className="mb-3 items-center gap-2">
          <BankMark short={monogram(biller.name)} size={32} />
          <Text className="font-medium">{biller.name}</Text>
        </HStack>
        <Field label="Mã khách hàng" htmlFor="bill-code" error={error} hint="Mã in ở góc trên hóa đơn tiền điện, ví dụ HH01234567890">
          <TextInput
            id="bill-code" autoFocus inputMode="text" autoCapitalize="characters" autoComplete="off" spellCheck={false} maxLength={13}
            invalid={!!error} readOnly={busy} value={draft.code} className="tabular-nums uppercase"
            onChange={(e) => { setError(undefined); setDraft({ code: e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '') }) }}
            onKeyDown={(e) => { if (e.key === 'Enter' && !busy) void lookup() }}
          />
        </Field>
      </Box>
      <Box className="rounded-lg border border-border bg-card p-4">
        <HStack className="mb-2 items-center gap-2"><Text size="sm" className="font-semibold">Mã mẫu</Text><SampleBadge /></HStack>
        <VStack role="list">
          {SAMPLES.map((s) => (
            <Box key={s.code} role="listitem">
              <Pressable role="button" onPress={() => { setError(undefined); setDraft({ code: s.code }) }} className="min-h-11 w-full flex-row items-center gap-2 data-[hover=true]:underline">
                <Text size="sm" className="font-semibold tabular-nums">{s.code}</Text><Text size="sm" className="text-muted-foreground">· {s.hint}</Text>
              </Pressable>
            </Box>
          ))}
        </VStack>
      </Box>
      {dialog}
    </FlowFrame>
  )
}

export default function AddBillFlow() {
  return <GatedRoute><Flow /></GatedRoute>
}
