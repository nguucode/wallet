import * as DropdownMenu from '@radix-ui/react-dropdown-menu'
import { Landmark, MoreVertical } from 'lucide-react'
import { useState } from 'react'
import { useLayout } from '@/app/layout'
import { bankById, setDefaultSource, unlinkSource, useWorld, verifyPin } from '@/app/store'
import { Button, ButtonLink, Card, cx, EmptyState, PageTitle, Sheet } from '@/components/ui'
import { PinPad } from '@/features/sec/AuthSheet'
import type { FundingSource } from '@/mock/seed'
import { canUnlink, sortSources, sourceName } from './logic'
import { DefaultBadge, SourceLine, useToast } from './parts'

const NOTE = 'Bạn chỉ nạp tiền từ và rút tiền về tài khoản hoặc thẻ đứng tên mình.'
const LAST_REASON = 'Không thể hủy liên kết nguồn tiền cuối cùng. Ví cần ít nhất một nguồn tiền chính chủ.'
const itemCls = 'flex min-h-12 w-full cursor-pointer flex-col justify-center rounded-lg px-3 py-2 text-left outline-none data-[highlighted]:bg-surface-2 data-[disabled]:cursor-not-allowed'

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

  const linkBtn = <ButtonLink to="/me/sources/link" variant={layout === 'web' ? 'ink' : 'primary'} block={layout === 'app'}>Liên kết ngân hàng</ButtonLink>

  return (
    <div>
      {layout === 'web' ? (
        <div className="flex items-start justify-between gap-4">
          <PageTitle>Nguồn tiền</PageTitle>
          {sources.length ? linkBtn : null}
        </div>
      ) : (
        <h1 tabIndex={-1} data-page-title className="sr-only">Nguồn tiền</h1>
      )}

      {!sources.length ? (
        <EmptyState
          icon={<Landmark size={22} strokeWidth={1.75} />}
          title="Chưa có nguồn tiền nào"
          body="Ví cần ít nhất một tài khoản hoặc thẻ ghi nợ đứng tên bạn để nạp, rút và thanh toán."
          action={<ButtonLink to="/me/sources/link">Liên kết ngân hàng</ButtonLink>}
        />
      ) : (
        <>
          <p className="mb-4 text-muted">{NOTE}</p>
          <ul className="flex flex-col gap-3">
            {sources.map((s) => (
              <li key={s.id}>
                <Card className="flex min-h-[72px] items-center gap-3 py-3 pr-2 pl-4">
                  <SourceLine s={s} sub={<span className="block break-words">{holder}</span>} />
                  {s.isDefault ? <DefaultBadge /> : null}
                  {layout === 'web' ? (
                    <DropdownMenu.Root>
                      <DropdownMenu.Trigger asChild>
                        <button aria-label={`Tùy chọn ${bankById(s.bankId).name} ${s.last4}`} className="inline-flex size-12 shrink-0 items-center justify-center rounded-full hover:bg-surface-2">
                          <MoreVertical size={20} strokeWidth={1.75} aria-hidden />
                        </button>
                      </DropdownMenu.Trigger>
                      <DropdownMenu.Portal>
                        <DropdownMenu.Content align="end" sideOffset={4} className="z-50 w-[280px] card p-2 shadow-[var(--shadow-float)]">
                          {!s.isDefault ? <DropdownMenu.Item onSelect={() => makeDefault(s)} className={itemCls}>Đặt làm mặc định</DropdownMenu.Item> : null}
                          <DropdownMenu.Item disabled={!unlinkable} onSelect={() => askUnlink(s)} className={cx(itemCls, unlinkable ? 'text-danger' : 'text-muted')}>
                            Hủy liên kết
                            {!unlinkable ? <span className="mt-0.5 block text-[13px] leading-[18px]">{LAST_REASON}</span> : null}
                          </DropdownMenu.Item>
                        </DropdownMenu.Content>
                      </DropdownMenu.Portal>
                    </DropdownMenu.Root>
                  ) : (
                    <button aria-label={`Tùy chọn ${bankById(s.bankId).name} ${s.last4}`} onClick={() => setSheetFor(s)} className="inline-flex size-12 shrink-0 items-center justify-center rounded-full hover:bg-surface-2">
                      <MoreVertical size={20} strokeWidth={1.75} aria-hidden />
                    </button>
                  )}
                </Card>
              </li>
            ))}
          </ul>
          {layout === 'app' ? <div className="sticky bottom-[calc(80px+env(safe-area-inset-bottom))] mt-6">{linkBtn}</div> : null}
        </>
      )}

      {/* App: row actions in a bottom sheet. */}
      <Sheet open={!!sheetFor} onOpenChange={(o) => !o && setSheetFor(null)} title={sheetFor ? sourceName(sheetFor) : ''}>
        {sheetFor ? (
          <div className="flex flex-col gap-2">
            {!sheetFor.isDefault ? <Button variant="secondary" block onClick={() => makeDefault(sheetFor)}>Đặt làm mặc định</Button> : null}
            <Button variant="danger" block disabled={!unlinkable} aria-describedby={!unlinkable ? 'last-reason' : undefined} onClick={() => askUnlink(sheetFor)}>Hủy liên kết</Button>
            {!unlinkable ? <p id="last-reason" className="text-[13px] leading-[18px] text-muted">{LAST_REASON}</p> : null}
          </div>
        ) : null}
      </Sheet>

      <Sheet
        open={!!unlinkFor} onOpenChange={(o) => !o && setUnlinkFor(null)}
        title={unlinkFor ? `Hủy liên kết ${sourceName(unlinkFor)}?` : ''}
        description="Bạn sẽ không nạp tiền từ hoặc rút tiền về nguồn này nữa. Giao dịch đang xử lý với nguồn này vẫn tiếp tục."
      >
        <div className="mt-2 flex flex-col gap-2">
          <Button variant="danger" block onClick={() => { setPinError(undefined); setPinFor(unlinkFor); setUnlinkFor(null) }}>Hủy liên kết</Button>
          <Button variant="ghost" block onClick={() => setUnlinkFor(null)}>Giữ lại</Button>
        </div>
      </Sheet>

      {/* PIN only: unlinking is not a transaction, so requiredAuth is not used (US-MNY-004). */}
      <Sheet open={!!pinFor} onOpenChange={(o) => !o && setPinFor(null)} title="Xác thực bằng mã PIN" description={pinFor ? `Nhập mã PIN để hủy liên kết ${sourceName(pinFor)}` : undefined}>
        <PinPad label="Mã PIN 6 số" error={pinError} onComplete={onPin} />
      </Sheet>

      {toast.node}
    </div>
  )
}
