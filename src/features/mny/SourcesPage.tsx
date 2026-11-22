import { Landmark, MoreHorizontal } from 'lucide-react'
import { useState } from 'react'
import { useLayout } from '@/app/layout'
import { bankById, setDefaultSource, unlinkSource, useWorld, verifyPin } from '@/app/store'
import { Button, ButtonLink, Card, EmptyState, Ico, IconButton, PageTitle, Sheet, cx, INSET } from '@/components/app-ui'
import { Box } from '@/components/ui/box'
import { Heading } from '@/components/ui/heading'
import { HStack } from '@/components/ui/hstack'
import { Text } from '@/components/ui/text'
import { VStack } from '@/components/ui/vstack'
import { PinPad } from '@/features/sec/AuthSheet'
import type { FundingSource } from '@/mock/seed'
import { canUnlink, sortSources, sourceName } from './logic'
import { DefaultBadge, SourceLine, useToast } from './parts'

const NOTE = 'Bạn chỉ nạp tiền từ và rút tiền về tài khoản hoặc thẻ đứng tên mình.'
const LAST_REASON = 'Không thể hủy liên kết nguồn tiền cuối cùng. Ví cần ít nhất một nguồn tiền chính chủ.'

/** US-MNY-001 list, US-MNY-003 set default, US-MNY-004 unlink (PIN, last source protected). */
export default function SourcesPage() {
  const w = useWorld()
  const layout = useLayout()
  const toast = useToast()
  const [sheetFor, setSheetFor] = useState<FundingSource | null>(null)
  const [unlinkFor, setUnlinkFor] = useState<FundingSource | null>(null)
  const [pinFor, setPinFor] = useState<FundingSource | null>(null)
  const [pinError, setPinError] = useState<string>()
  const sources = sortSources(w.sources)
  const holder = w.customer.name.toUpperCase()
  const unlinkable = canUnlink(w.sources)

  const makeDefault = (s: FundingSource) => {
    setSheetFor(null)
    setDefaultSource(s.id)
    toast.show(`Đã đặt ${sourceName(s)} làm nguồn mặc định.`)
  }
  const askUnlink = (s: FundingSource) => { setSheetFor(null); setUnlinkFor(s) }
  const onPin = (pin: string) => {
    const s = pinFor!
    const r = verifyPin(pin)
    if (!r.ok) return setPinError(r.lockedUntil ? 'Mã PIN đang tạm khóa do nhập sai nhiều lần.' : `Mã PIN không đúng. Còn ${r.attemptsLeft} lần thử.`)
    const wasDefault = s.isDefault
    setPinFor(null)
    if (!unlinkSource(s.id)) return toast.show('Chưa hủy được liên kết. Thử lại.')
    const next = wasDefault ? w.sources.find((x) => x.id !== s.id) : undefined
    toast.show(`Đã hủy liên kết ${sourceName(s)}.${next ? ` ${sourceName(next)} giờ là nguồn mặc định.` : ''}`)
  }

  const linkBtn = <ButtonLink to="/me/sources/link" variant="primary" block={layout === 'app'}>Liên kết ngân hàng</ButtonLink>
  const optionsLabel = (s: FundingSource) => `Tùy chọn ${bankById(s.bankId).name} ${s.last4}`

  return (
    <Box>
      {layout === 'web' ? (
        <PageTitle>Nguồn tiền</PageTitle>
      ) : (
        <Heading size="3xl" tabIndex={-1} data-page-title className="sr-only">Nguồn tiền</Heading>
      )}

      {!sources.length ? (
        <EmptyState
          icon={<Ico as={Landmark} size="lg" />}
          title="Chưa có nguồn tiền nào"
          body="Ví cần ít nhất một tài khoản hoặc thẻ ghi nợ đứng tên bạn để nạp, rút và thanh toán."
          action={<ButtonLink to="/me/sources/link">Liên kết ngân hàng</ButtonLink>}
        />
      ) : (
        <>
          {/* The note and (web) the link action share the line above the list, as a section header does. */}
          <HStack className={cx('mb-3 items-center justify-between gap-4', INSET)}>
            <Text className="min-w-0 flex-1 text-muted-foreground">{NOTE}</Text>
            {layout === 'web' ? linkBtn : null}
          </HStack>
          <Card inset="rows">
            <VStack role="list" className="divide-y divide-border">
              {sources.map((s) => (
                <HStack key={s.id} role="listitem" className={cx('min-h-[72px] items-center gap-3 py-3 mac:min-h-[38px] mac:py-2', INSET)}>
                  <SourceLine s={s} sub={<Text size="sm" className="break-words text-muted-foreground">{holder}</Text>} />
                  {s.isDefault ? <DefaultBadge /> : null}
                  <IconButton label={optionsLabel(s)} onClick={() => setSheetFor(s)} className="shrink-0">
                    <Ico as={MoreHorizontal} />
                  </IconButton>
                </HStack>
              ))}
            </VStack>
          </Card>
          {/* Sits above the app tab bar (80px) and the home indicator. */}
          {layout === 'app' ? <Box className="sticky bottom-[calc(80px+env(safe-area-inset-bottom))] mt-6">{linkBtn}</Box> : null}
        </>
      )}

      {/* Row actions: Actionsheet on app, Modal on web (one pattern for both layouts). */}
      <Sheet open={!!sheetFor} onOpenChange={(o) => !o && setSheetFor(null)} title={sheetFor ? sourceName(sheetFor) : ''}>
        {sheetFor ? (
          <VStack className="gap-2">
            {!sheetFor.isDefault ? <Button variant="secondary" block onClick={() => makeDefault(sheetFor)}>Đặt làm mặc định</Button> : null}
            <Button variant="danger" block disabled={!unlinkable} aria-describedby={!unlinkable ? 'last-reason' : undefined} onClick={() => askUnlink(sheetFor)}>Hủy liên kết</Button>
            {!unlinkable ? <Text id="last-reason" size="sm" className="text-muted-foreground">{LAST_REASON}</Text> : null}
          </VStack>
        ) : null}
      </Sheet>

      <Sheet
        open={!!unlinkFor} onOpenChange={(o) => !o && setUnlinkFor(null)}
        title={unlinkFor ? `Hủy liên kết ${sourceName(unlinkFor)}?` : ''}
        description="Bạn sẽ không nạp tiền từ hoặc rút tiền về nguồn này nữa. Giao dịch đang xử lý với nguồn này vẫn tiếp tục."
      >
        <VStack className="mt-2 gap-2">
          <Button variant="danger" block onClick={() => { setPinError(undefined); setPinFor(unlinkFor); setUnlinkFor(null) }}>Hủy liên kết</Button>
          <Button variant="ghost" block onClick={() => setUnlinkFor(null)}>Giữ lại</Button>
        </VStack>
      </Sheet>

      {/* PIN only: unlinking is not a transaction, so requiredAuth is not used (US-MNY-004). */}
      <Sheet open={!!pinFor} onOpenChange={(o) => !o && setPinFor(null)} title="Xác thực bằng mã PIN" description={pinFor ? `Nhập mã PIN để hủy liên kết ${sourceName(pinFor)}` : undefined}>
        <PinPad label="Mã PIN 6 số" error={pinError} onComplete={onPin} />
      </Sheet>

      {toast.node}
    </Box>
  )
}
