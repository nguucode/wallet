import { Copy, FileText, LifeBuoy, MessageCircle, Printer, Repeat, Share2, type LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'
import { Navigate, useNavigate, useParams, useSearchParams } from 'react-router'
import { config } from '@/domain/config'
import { formatVnd } from '@/domain/money'
import { useLayout } from '@/app/layout'
import { SampleBadge } from '@/app/Shell'
import { bankById, counterpartyName, now, pendingEta, sourceLabel, typeLabel, useWorld } from '@/app/store'
import type { Transaction, World } from '@/mock/seed'
import { NotFound } from '@/features/demo/NotFound'
import { ConfirmRows, FAILURE_COPY, fmtDateTime, fmtTime, maskAccount, maskPhone, truthLine } from '@/features/flow/FlowKit'
import { useGuard } from '@/features/sec/Gate'
import { Button, ButtonLink, Card, CloseButton, cx, Disc, Ico, IconButton, Money, Row, STATUS_LABEL, StatusPill, useLinkPress, WebBackLink } from '@/components/app-ui'
import { Box } from '@/components/ui/box'
import { Button as GButton, ButtonText } from '@/components/ui/button'
import { Heading } from '@/components/ui/heading'
import { HStack } from '@/components/ui/hstack'
import { Pressable } from '@/components/ui/pressable'
import { Text } from '@/components/ui/text'
import { VStack } from '@/components/ui/vstack'
import { maskCode } from '@/features/bil/bills'
import { isWithinSupportWindow, receiptShareText, rowAmount, SUPPORT_STATUS_LABEL } from './history'
import { TxIcon, useToast } from './parts'

const AUTH_LABEL = { pin: 'Mã PIN', device_biometric: 'Sinh trắc học thiết bị', face_match: 'Khuôn mặt' } as const

/** Counterparty role label and masked identifier (US-HIS-002). */
function counterpartyRow(t: Transaction, w: World): [string, ReactNode] | null {
  const c = t.counterparty
  const name = counterpartyName(c, w)
  switch (c.kind) {
    case 'contact': return [t.direction === 'in' ? 'Người gửi' : 'Người nhận', `${name} · ${maskPhone(c.phone)}`]
    case 'bank': return ['Người nhận', `${name} · ${bankById(c.bankId).name} ${maskAccount(c.account)}`]
    case 'merchant': return ['Cửa hàng', name]
    case 'biller': {
      const code = w.bills.find((b) => b.id === c.billId)?.customerCode
      return ['Nhà cung cấp', code ? `${name} · ${maskCode(code)}` : name]
    }
    case 'source': return null
  }
}

function detailRows(t: Transaction, w: World): [string, ReactNode][] {
  const cp = counterpartyRow(t, w)
  return [
    ['Thời gian', fmtDateTime(t.createdAt)],
    ['Loại giao dịch', typeLabel(t.type)],
    ...(cp ? [cp] : []),
    ...(t.message ? [['Lời nhắn', t.message] as [string, ReactNode]] : []),
    ['Nguồn tiền', t.sourceId ? sourceLabel(w, t.sourceId).replace(' •••• ', ' ••••') : 'Số dư ví'],
    ['Phí', t.fee ? formatVnd(t.fee) : 'Miễn phí'],
    ['Tổng tiền', formatVnd(rowAmount(t))],
  ]
}

/* ── Timeline (object-model.md state machine) ─────────────────────── */

type Step = { label: string; lines: string[]; tone: 'done' | 'current' | 'failed' | 'upcoming' }
const PENDING_CAPABLE = ['bank_transfer', 'bill', 'withdraw']

export function timelineSteps(t: Transaction, refundTx?: Transaction): Step[] {
  const failed: Step = {
    label: STATUS_LABEL.failed, tone: 'failed',
    lines: [t.failureReason ? FAILURE_COPY[t.failureReason] : '', t.reversedAt ? `Tiền đã hoàn về ví lúc ${fmtTime(t.reversedAt)}` : 'Tiền chưa bị trừ khỏi ví'].filter(Boolean),
  }
  const done: Step = { label: STATUS_LABEL.success, tone: 'done', lines: [fmtDateTime(t.updatedAt)] }
  const refund: Step[] = t.status === 'refunded' ? [{ label: STATUS_LABEL.refunded, tone: 'done', lines: refundTx ? [`+${formatVnd(refundTx.amount)} · ${fmtDateTime(refundTx.createdAt)}`] : [] }] : []
  if (!PENDING_CAPABLE.includes(t.type)) return [t.status === 'failed' ? failed : { ...done, lines: [fmtDateTime(t.createdAt)] }, ...refund]
  const created: Step = { label: `Đã tạo · ${fmtTime(t.createdAt)}`, tone: 'done', lines: [] }
  if (t.status === 'pending')
    return [created, { label: STATUS_LABEL.pending, tone: 'current', lines: [`Dự kiến xong trước ${fmtTime(pendingEta(t))}`, 'Nếu không thành công, tiền sẽ tự hoàn về ví'] }, { label: 'Hoàn tất', tone: 'upcoming', lines: [] }]
  return [created, t.status === 'failed' ? failed : done, ...refund]
}

function Timeline({ steps }: { steps: Step[] }) {
  const dot = { done: 'bg-foreground', current: 'bg-primary', failed: 'bg-destructive', upcoming: 'border-2 border-border bg-card' }
  return (
    <Card>
      <VStack role="list" aria-label="Trạng thái giao dịch">
        {steps.map((s, i) => (
          <HStack key={i} role="listitem" className="relative gap-3 pb-3 last:pb-0">
            {i < steps.length - 1 ? <Box aria-hidden className="absolute top-4 left-[5px] h-full w-0.5 bg-border" /> : null}
            <Box aria-hidden className={cx('mt-1.5 h-3 w-3 shrink-0 rounded-full', dot[s.tone])} />
            <VStack className="min-w-0">
              <Text className={cx('font-semibold', s.tone === 'failed' && 'text-destructive', s.tone === 'upcoming' && 'font-normal text-muted-foreground')}>
                {s.label}{s.tone === 'upcoming' ? <Text className="sr-only"> (chưa đến)</Text> : null}
              </Text>
              {s.lines.map((l) => <Text key={l} size="sm" className="text-muted-foreground">{l}</Text>)}
            </VStack>
          </HStack>
        ))}
      </VStack>
    </Card>
  )
}

/* ── Receipt (US-HIS-003) ─────────────────────────────────────────── */

const PRINT_CSS = '@media print { body * { visibility: hidden !important; } #receipt, #receipt * { visibility: visible !important; color: #000 !important; } #receipt { position: absolute; inset: 0 auto auto 0; width: 100%; max-width: 480px; border-color: #000 !important; } }'

function Receipt({ t, w }: { t: Transaction; w: World }) {
  const layout = useLayout()
  const nav = useNavigate()
  const toast = useToast()
  const refundTx = t.refundedBy ? w.transactions.find((x) => x.id === t.refundedBy) : undefined
  if (t.status === 'failed') return <Navigate to={`/history/${t.id}`} replace />
  const cp = counterpartyRow(t, w)
  const canShare = typeof navigator !== 'undefined' && 'share' in navigator
  const link = `${location.origin}/history/${t.id}?view=receipt`
  const text = receiptShareText({ id: t.id, status: t.status, amount: rowAmount(t), typeLabel: typeLabel(t.type), counterparty: cp ? `${cp[0]}: ${cp[1]}` : '', time: fmtDateTime(t.createdAt), link })
  const share = async () => {
    if (canShare) { try { await navigator.share({ title: 'Biên lai giao dịch', text, url: link }) } catch { /* user cancelled */ } return }
    try { await navigator.clipboard.writeText(text); toast.show('Đã sao chép') } catch { toast.show('Không sao chép được') }
  }
  const close = () => nav(`/history/${t.id}`, { replace: true })
  return (
    <Box className="pt-2">
      <style>{PRINT_CSS}</style>
      <HStack className="mb-3 items-center justify-between gap-2 print:hidden">
        <Heading size="3xl" tabIndex={-1} data-page-title className="text-2xl outline-none">Biên lai</Heading>
        {layout === 'app' ? <CloseButton onClick={close} /> : null}
      </HStack>
      <Box id="receipt" role="article" aria-label="Biên lai giao dịch" className="mx-auto w-full max-w-md">
        <Card>
          <HStack className="items-start justify-between gap-3">
            <VStack>
              <Text size="lg" bold>Biên lai giao dịch</Text>
              <Text size="sm" className="font-extrabold tracking-tight">Wallet</Text>
            </VStack>
            <SampleBadge />
          </HStack>
          <VStack className="my-6 items-center gap-2">
            <Money amount={rowAmount(t)} className="text-3xl font-bold" />
            <StatusPill status={t.status} />
            {t.status === 'pending' ? <Text size="sm" className="text-center font-medium">Biên lai này chưa phải xác nhận cuối cùng</Text> : null}
            {t.status === 'refunded' && refundTx ? <Text size="sm" className="text-center">Đã hoàn {formatVnd(refundTx.amount)} lúc {fmtDateTime(refundTx.createdAt)}</Text> : null}
          </VStack>
          <ConfirmRows rows={[
            ['Mã giao dịch', <Text className="font-medium tabular-nums">{t.id}</Text>],
            ['Thời gian', fmtDateTime(t.createdAt)],
            ...(cp ? [cp] : []),
            ['Lời nhắn', t.message ?? '—'],
            ['Phí', t.fee ? formatVnd(t.fee) : 'Miễn phí'],
            ['Tổng tiền', formatVnd(rowAmount(t))],
          ]} />
        </Card>
      </Box>
      <VStack className="mx-auto mt-6 w-full max-w-md gap-2 print:hidden">
        {layout === 'web' ? (
          <HStack className="gap-2">
            <Button onClick={() => window.print()}><Ico as={Printer} />In biên lai</Button>
            <Button variant="secondary" onClick={close}>Đóng</Button>
          </HStack>
        ) : (
          <Button variant="primary" block onClick={share}><Ico as={Share2} />{canShare ? 'Chia sẻ' : 'Sao chép'}</Button>
        )}
      </VStack>
      {toast.node}
    </Box>
  )
}

/* ── Detail (US-HIS-002) ──────────────────────────────────────────── */

function Action({ label, icon, onClick, to }: { label: string; icon: LucideIcon; onClick?: () => void; to?: string }) {
  const layout = useLayout()
  const press = useLinkPress(to, onClick)
  if (layout === 'web') return <Button variant="secondary" to={to} onClick={onClick}><Ico as={icon} />{label}</Button>
  // App tiles match Home shortcuts (48 disc, 24 glyph).
  return (
    <Pressable onPress={press} {...(to ? { href: to, role: 'link' } : { role: 'button' })}
      className="min-w-20 items-center gap-2 rounded-xl data-[hover=true]:opacity-80 data-[active=true]:opacity-60">
      <Disc><Ico as={icon} size="xl" className="text-primary" /></Disc>
      <Text size="xs" bold className="whitespace-nowrap">{label}</Text>
    </Pressable>
  )
}

/** A full-width card row that links to a related transaction. */
function LinkCard({ to, children }: { to: string; children: ReactNode }) {
  return <Card className="overflow-hidden p-0"><Row to={to} title={children} chevron /></Card>
}

export default function TransactionPage() {
  const { txId } = useParams()
  const [params] = useSearchParams()
  const layout = useLayout()
  const w = useWorld()
  const { guard, sheet } = useGuard()
  const toast = useToast()
  const t = w.transactions.find((x) => x.id === txId)
  if (!t) return <NotFound />
  if (params.get('view') === 'receipt') return <Receipt t={t} w={w} />

  const name = counterpartyName(t.counterparty, w)
  const refundTx = t.refundedBy ? w.transactions.find((x) => x.id === t.refundedBy) : undefined
  const original = t.refundOf ? w.transactions.find((x) => x.id === t.refundOf) : undefined
  const request = w.support.find((s) => s.transactionId === t.id)
  const inWindow = isWithinSupportWindow(t, now(), config.supportWindowDays)
  const supportTo = `/support/new?tx=${t.id}`

  const resendTo = (() => {
    const c = t.counterparty
    const extra = `&amount=${t.amount}${t.message ? `&message=${encodeURIComponent(t.message)}` : ''}`
    if (t.type === 'p2p_out' && c.kind === 'contact') return `/transfer/wallet?contact=${c.id}${extra}`
    if (t.type === 'bank_transfer' && c.kind === 'bank') {
      const r = w.bankRecipients.find((x) => x.bankId === c.bankId && x.account === c.account)
      return r ? `/transfer/bank?recipient=${r.id}${extra}` : '/transfer/bank'
    }
    return null
  })()

  const copyId = async () => { try { await navigator.clipboard.writeText(t.id); toast.show('Đã sao chép mã giao dịch') } catch { toast.show('Không sao chép được') } }

  const items = (
    <>
      {t.status !== 'failed' ? <Action label="Biên lai" icon={FileText} to={`/history/${t.id}?view=receipt`} /> : null}
      {!request ? <Action label="Liên hệ hỗ trợ" icon={LifeBuoy} to={supportTo} /> : null}
      {resendTo ? <Action label="Chuyển lại" icon={Repeat} onClick={() => guard(resendTo)} /> : null}
    </>
  )
  const actions = layout === 'web'
    ? <HStack className="flex-wrap gap-2">{items}</HStack>
    : <Card className="px-2 py-4"><HStack className="justify-around gap-2">{items}</HStack></Card>

  const wrongRecipient = t.type === 'p2p_out' && t.status === 'success' ? (
    <Box role="region" aria-labelledby="wr-title" className="rounded-lg border border-border bg-card p-4">
      <Heading as="h2" size="md" id="wr-title">Chuyển nhầm người nhận?</Heading>
      <Text size="sm" className="mt-1">Giao dịch chuyển tiền đã thành công không thể hủy hoặc thu hồi. Hãy nhắn người nhận để đề nghị chuyển trả.</Text>
      <HStack className="mt-3 flex-wrap gap-2">
        {/* Placeholder deep link (rules.md#history-and-support): no chat in P0. */}
        <GButton href={`sms:${t.counterparty.kind === 'contact' ? t.counterparty.phone : ''}`} role="link" size="lg">
          <Ico as={MessageCircle} /><ButtonText>Nhắn người nhận</ButtonText>
        </GButton>
        {!request ? <ButtonLink to={supportTo} variant="secondary">Liên hệ hỗ trợ</ButtonLink> : null}
      </HStack>
    </Box>
  ) : null

  return (
    <Box className="max-w-xl">
      {layout === 'web' ? <WebBackLink to="/history">Lịch sử</WebBackLink> : null}

      <Card className="items-center gap-2 px-4 py-6">
        <TxIcon type={t.type} size={56} />
        <Heading size="3xl" tabIndex={-1} data-page-title className="mt-1 line-clamp-2 text-center text-lg break-words outline-none">{name}</Heading>
        <Text size="sm" className="-mt-1 text-muted-foreground">{typeLabel(t.type)}</Text>
        <Money amount={rowAmount(t)} sign={t.direction} className={cx('mt-1 text-3xl font-bold break-all', t.status === 'failed' && 'text-muted-foreground line-through')} />
        <StatusPill status={t.status} />
        <Text size="sm" className="text-center text-muted-foreground">{t.status === 'success' ? fmtDateTime(t.updatedAt) : truthLine(t)}</Text>
      </Card>

      <VStack className="mt-6 gap-4">
        {timelineSteps(t, refundTx).length > 1 ? <Timeline steps={timelineSteps(t, refundTx)} /> : null}

        {refundTx ? (
          <LinkCard to={`/history/${refundTx.id}`}>
            Hoàn tiền · <Text className="tabular-nums">{formatVnd(refundTx.amount, { sign: 'in' })}</Text> · {fmtDateTime(refundTx.createdAt).split(' · ')[1]}
          </LinkCard>
        ) : null}
        {original ? (
          <LinkCard to={`/history/${original.id}`}>
            Hoàn tiền cho giao dịch <Text className="tabular-nums">{original.id}</Text>
          </LinkCard>
        ) : null}

        {layout === 'app' ? <>{actions}{wrongRecipient}</> : null}

        <ConfirmRows rows={[
          ['Mã giao dịch', (
            <HStack className="items-center gap-1">
              <Text className="font-medium tabular-nums">{t.id}</Text>
              <IconButton label="Sao chép mã giao dịch" onClick={copyId} className="-my-2 -mr-2 shrink-0"><Ico as={Copy} className="text-primary" /></IconButton>
            </HStack>
          )],
          ...detailRows(t, w),
          ...(t.authMethod ? [['Xác thực bằng', AUTH_LABEL[t.authMethod]] as [string, ReactNode]] : []),
        ]} />

        {request ? (
          <Text size="sm">Đã gửi yêu cầu hỗ trợ ngày {fmtDateTime(request.createdAt).split(' · ')[1]} · {SUPPORT_STATUS_LABEL[request.status]}</Text>
        ) : !inWindow ? (
          <Text size="sm" className="text-muted-foreground">Giao dịch đã quá {config.supportWindowDays} ngày; yêu cầu hỗ trợ trực tuyến không còn mở.</Text>
        ) : null}

        {layout === 'web' ? <>{wrongRecipient}{actions}</> : null}
      </VStack>
      {sheet}
      {toast.node}
    </Box>
  )
}
