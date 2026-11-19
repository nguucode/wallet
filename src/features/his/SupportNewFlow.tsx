import { Circle } from 'lucide-react'
import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router'
import { config } from '@/domain/config'
import { formatVnd } from '@/domain/money'
import { createSupportRequest, now, useWorld } from '@/app/store'
import type { SupportRequest, Transaction } from '@/mock/seed'
import { ConfirmRows, FlowFrame, fmtDateTime, formatPhone, useCloseFlow, useFlow } from '@/features/flow/FlowKit'
import { Button, ButtonLink, Callout, Card, cx, Field, TextInput, TextLink } from '@/components/app-ui'
import { Box } from '@/components/ui/box'
import { Link, LinkText } from '@/components/ui/link'
import { Radio, RadioGroup, RadioIcon, RadioIndicator, RadioLabel } from '@/components/ui/radio'
import { Text } from '@/components/ui/text'
import { Textarea, TextareaInput } from '@/components/ui/textarea'
import { VStack } from '@/components/ui/vstack'
import { isWithinSupportWindow, REASON_LABEL, reasonsFor, rowAmount, SUPPORT_STATUS_LABEL, TX_REASONS, validateDescription, type Reason } from './history'

const STEPS = ['reason', 'details', 'sent'] as const
type Draft = { txId?: string; reason?: Reason; details: string; phone: string; sent?: SupportRequest }

function Summary({ t }: { t: Transaction }) {
  return (
    <Box className="mb-6">
      <ConfirmRows rows={[
        ['Mã giao dịch', <Text className="font-medium tabular-nums">{t.id}</Text>],
        ['Số tiền', <Text className="font-medium tabular-nums">{formatVnd(rowAmount(t))}</Text>],
        ['Thời gian', fmtDateTime(t.createdAt)],
      ]} />
    </Box>
  )
}

export default function SupportNewFlow() {
  const w = useWorld()
  const nav = useNavigate()
  const [params] = useSearchParams()
  const txParam = params.get('tx') ?? params.get('txId') ?? undefined
  const t = txParam ? w.transactions.find((x) => x.id === txParam) : undefined
  const flow = useFlow<Draft>('support-new', STEPS, { txId: txParam, details: '', phone: w.customer.phone })
  // A draft left over from another transaction never leaks into this one.
  const draft: Draft = flow.draft.txId === txParam ? flow.draft : { txId: txParam, details: '', phone: w.customer.phone }
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string>()
  const backTo = t ? `/history/${t.id}` : '/support'
  const { close, dialog } = useCloseFlow(!!draft.details && flow.step !== 'sent', flow.clear, backTo)

  if (txParam && !t)
    return (
      <FlowFrame title="Liên hệ hỗ trợ" onClose={() => nav('/history')}>
        <Callout title="Không tìm thấy giao dịch" action={<ButtonLink to="/history" size="sm">Mở Lịch sử</ButtonLink>} />
      </FlowFrame>
    )

  const existing = t ? w.support.find((s) => s.transactionId === t.id && s.id !== draft.sent?.id) : undefined
  if (t && existing && !busy)
    return (
      <FlowFrame title="Liên hệ hỗ trợ" onClose={() => nav(backTo)}>
        <Summary t={t} />
        <Callout title="Giao dịch này đã có yêu cầu hỗ trợ" action={<ButtonLink to={backTo} size="sm" variant="secondary">Về giao dịch</ButtonLink>}>
          Mã yêu cầu <Text size="sm" className="font-semibold tabular-nums">{existing.id}</Text> · {SUPPORT_STATUS_LABEL[existing.status]}
        </Callout>
      </FlowFrame>
    )

  const locked = !!t && !isWithinSupportWindow(t, now(), config.supportWindowDays)
  const lockedNote = locked ? <Box role="status" className="mb-3 rounded-lg border border-border bg-card p-4"><Text>Giao dịch đã quá {config.supportWindowDays} ngày nên không thể gửi yêu cầu hỗ trợ trực tuyến</Text></Box> : null

  /* sent */
  if (flow.step === 'sent' && draft.sent)
    return (
      <FlowFrame title="Liên hệ hỗ trợ" footer={<ButtonLink to={backTo} block>{t ? 'Về giao dịch' : 'Về Trợ giúp'}</ButtonLink>}>
        <VStack className="items-center pt-6">
          <Text role="status" size="lg" bold className="text-center">Đã gửi yêu cầu hỗ trợ</Text>
          <Text className="mt-2 text-center">Mã yêu cầu <Text className="font-semibold tabular-nums">{draft.sent.id}</Text></Text>
          <Text className="mt-1 text-center text-muted-foreground">Thời gian xử lý tối đa 30 ngày làm việc</Text>
        </VStack>
      </FlowFrame>
    )

  /* details */
  if (flow.step === 'details' && draft.reason) {
    const invalid = validateDescription(draft.details)
    const n = draft.details.trim().length
    const submit = async () => {
      setError(undefined)
      setBusy(true)
      try {
        const req = await createSupportRequest({ transactionId: t?.id, reason: draft.reason!, details: draft.details.trim() })
        flow.setDraft({ ...draft, sent: req })
        flow.go('sent', { replace: true })
      } catch {
        setError('Không gửi được yêu cầu. Thử lại')
      } finally { setBusy(false) }
    }
    return (
      <FlowFrame title="Liên hệ hỗ trợ" onBack={() => flow.go('reason')} onClose={close}
        footer={<Button block loading={busy} disabled={!!invalid || locked} onClick={submit}>Gửi yêu cầu</Button>}>
        {t ? <Summary t={t} /> : null}
        {lockedNote}
        {draft.reason === 'wrong_recipient' && t?.type === 'p2p_out' && t.status === 'success' ? (
          <VStack className="mb-6 items-start rounded-lg border border-border bg-card p-4">
            <Text className="font-semibold">Ví không thể tự hủy giao dịch đã thành công</Text>
            <Link href={`sms:${t.counterparty.kind === 'contact' ? t.counterparty.phone : ''}`} className="mt-2 min-h-11 justify-center">
              <LinkText className="font-semibold">Nhắn người nhận</LinkText>
            </Link>
          </VStack>
        ) : null}
        <Text className="mb-3 text-muted-foreground">Lý do: <Text className="font-medium">{REASON_LABEL[draft.reason]}</Text></Text>
        <Field label="Mô tả vấn đề" htmlFor="sp-details">
          <Textarea isDisabled={locked} className="h-32">
            <TextareaInput
              id="sp-details" multiline numberOfLines={5} maxLength={600} aria-required aria-describedby="sp-count" textAlignVertical="top"
              value={draft.details} onChangeText={(v: string) => flow.setDraft({ ...draft, details: v })}
              className="px-4 py-3"
            />
          </Textarea>
          <Text id="sp-count" size="sm" className={cx('mt-2 self-end tabular-nums', n > 500 ? 'text-destructive' : 'text-muted-foreground')}>{n}/500 · tối thiểu 20 ký tự</Text>
        </Field>
        <Field label="Số điện thoại liên hệ" htmlFor="sp-phone">
          <TextInput id="sp-phone" disabled={locked} inputMode="tel" value={formatPhone(draft.phone)} onChange={(e) => flow.setDraft({ ...draft, phone: e.target.value.replace(/\D/g, '').slice(0, 10) })} />
        </Field>
        {error ? <Text role="alert" className="text-destructive">{error}</Text> : null}
        {dialog}
      </FlowFrame>
    )
  }

  /* reason */
  const reasons = reasonsFor(t)
  const needsTx = !t && draft.reason && TX_REASONS.includes(draft.reason)
  return (
    <FlowFrame title="Liên hệ hỗ trợ" onClose={close}
      footer={<Button block disabled={!draft.reason || !!needsTx || locked} onClick={() => { flow.setDraft(draft); flow.go('details') }}>Tiếp tục</Button>}>
      {t ? <Summary t={t} /> : null}
      {lockedNote}
      <Text id="sp-reason" className="mb-3 font-semibold">Bạn gặp vấn đề gì?</Text>
      <Card className="overflow-hidden p-0">
        <RadioGroup value={draft.reason ?? ''} onChange={(r: Reason) => flow.setDraft({ ...draft, reason: r })} isDisabled={locked} aria-labelledby="sp-reason" className="gap-0 divide-y divide-border">
          {reasons.map((r) => (
            <Radio key={r} value={r} aria-label={REASON_LABEL[r]} size="md" className="min-h-12 gap-3 px-4 py-3">
              <RadioIndicator className="h-5 w-5"><RadioIcon as={Circle} /></RadioIndicator>
              <RadioLabel className="text-base font-normal">{REASON_LABEL[r]}</RadioLabel>
            </Radio>
          ))}
        </RadioGroup>
      </Card>
      {needsTx ? (
        <Box role="status" className="mt-3 rounded-lg border border-border bg-card p-4">
          <Text>Hãy mở giao dịch trong Lịch sử và chọn Liên hệ hỗ trợ để gửi yêu cầu về giao dịch đó. <TextLink to="/history">Mở Lịch sử</TextLink></Text>
        </Box>
      ) : null}
      {dialog}
    </FlowFrame>
  )
}
