import { CreditCard, Fingerprint, Smartphone } from 'lucide-react'
import { useState } from 'react'
import { useLayout } from '@/app/layout'
import { useWorld } from '@/app/store'
import { Button, Card, cx, Disc, Ico } from '@/components/app-ui'
import { Box } from '@/components/ui/box'
import { Center } from '@/components/ui/center'
import { HStack } from '@/components/ui/hstack'
import { Pressable } from '@/components/ui/pressable'
import { Text } from '@/components/ui/text'
import { VStack } from '@/components/ui/vstack'
import { StepShell, useOnb } from './Frame'
import { maskIdNumber } from './steps'

/** Layout, not device detection, decides NFC: the app layout (< 1024px) offers the chip path. */
export const canReadChip = (layout: 'web' | 'app') => layout === 'app'

/** US-ONB-004: identity method. */
export function IdMethodStep() {
  const { draft, setDraft, go } = useOnb()
  const layout = useLayout()
  const chip = canReadChip(layout)
  const pick = (path: 'nfc' | 'vneid') => { setDraft({ path }); go(path === 'nfc' ? 'id-capture' : 'vneid') }
  const options = [
    { path: 'nfc' as const, title: 'CCCD gắn chip', body: 'Chụp CCCD rồi áp vào lưng điện thoại để đọc chip', icon: <Ico as={CreditCard} />, disabled: !chip },
    { path: 'vneid' as const, title: 'Tài khoản VNeID', body: 'Dùng tài khoản định danh điện tử mức 2, không cần đọc chip', icon: <Ico as={Fingerprint} />, disabled: false },
  ]
  return (
    <StepShell title="Xác thực sinh trắc học" description="Theo quy định của Ngân hàng Nhà nước, bạn cần đối chiếu khuôn mặt với dữ liệu trên CCCD gắn chip trước khi dùng ví.">
      <VStack role="radiogroup" aria-label="Cách xác thực" className="gap-3">
        {options.map((o) => (
          <Pressable
            key={o.path} role="radio" aria-checked={draft.path === o.path} aria-disabled={o.disabled || undefined}
            aria-describedby={o.disabled ? 'chip-reason' : undefined}
            onPress={() => !o.disabled && pick(o.path)}
            className={cx('flex-row items-start gap-3 rounded-xl border p-4', o.disabled ? 'cursor-not-allowed border-dashed border-border bg-card' : draft.path === o.path ? 'border-primary bg-primary/10' : 'border-border hover:bg-muted')}
          >
            <Disc size={44}>{o.icon}</Disc>
            <VStack className="min-w-0 flex-1">
              <Text className={cx('font-semibold', o.disabled && 'text-muted-foreground')}>{o.title}</Text>
              <Text size="sm" className="text-muted-foreground">{o.body}</Text>
              {o.disabled ? <Text id="chip-reason" size="sm" className="mt-1 font-medium text-foreground">Máy tính không đọc được chip CCCD.</Text> : null}
            </VStack>
          </Pressable>
        ))}
      </VStack>
      {!chip ? (
        <Card className="mt-6 flex-row items-start gap-3">
          <Disc><Ico as={Smartphone} /></Disc>
          <VStack className="min-w-0 flex-1">
            <Text className="font-semibold">Mở ví trên điện thoại</Text>
            <Text size="sm" className="text-muted-foreground">Đọc chip CCCD cần điện thoại có NFC. Bạn cũng có thể dùng VNeID ngay trên máy tính. Bản demo: thu cửa sổ dưới 1024px hoặc mở trên điện thoại để thử đọc chip.</Text>
          </VStack>
        </Card>
      ) : null}
    </StepShell>
  )
}

/** Sample CCCD front (fictional data), drawn instead of a bundled image. */
export function SampleCard() {
  const w = useWorld()
  return (
    <Box className="aspect-[85.6/54] w-full rounded-xl border border-border bg-muted p-3" role="img" aria-label="Ảnh mặt trước CCCD mẫu">
      <Text size="xs" className="block text-center font-bold tracking-wide">CĂN CƯỚC CÔNG DÂN</Text>
      <HStack className="mt-2 gap-3">
        <Box className="aspect-[3/4] w-1/4 rounded bg-muted-foreground/30" />
        <VStack className="min-w-0">
          <Text size="xs">Số: {maskIdNumber(w.customer.idNumber)}</Text>
          <Text size="xs" className="font-bold">{w.customer.name.toUpperCase()}</Text>
          <Text size="xs">Ngày sinh: {w.customer.dob.split('-').reverse().join('/')}</Text>
        </VStack>
      </HStack>
    </Box>
  )
}

/** US-ONB-004: simulated camera capture of the CCCD front. */
export function IdCaptureStep() {
  const { go } = useOnb()
  const [shot, setShot] = useState(false)
  const [busy, setBusy] = useState(false)
  const use = () => { setBusy(true); setTimeout(() => go('nfc'), 700) }
  if (shot)
    return (
      <StepShell title="Chụp mặt trước CCCD" footer={<>
        <Button block loading={busy} onClick={use}>Dùng ảnh này</Button>
        <Button variant="secondary" block disabled={busy} onClick={() => setShot(false)}>Chụp lại</Button>
      </>}>
        <SampleCard />
        <Text className="mt-3 block">Kiểm tra ảnh: chữ và ảnh chân dung phải rõ nét.</Text>
        <Text role="status" size="sm" className="mt-2 block min-h-5 text-muted-foreground">{busy ? 'Đang xử lý ảnh…' : ''}</Text>
      </StepShell>
    )
  return (
    <StepShell title="Chụp mặt trước CCCD">
      {/* Simulated viewfinder: always dark, like a camera, in either theme. */}
      <VStack className="items-center rounded-2xl bg-black px-4 py-8">
        <Box aria-hidden className="aspect-[85.6/54] w-full max-w-[340px] rounded-xl border-2 border-white/90" />
        <Text size="sm" className="mt-3 text-center text-white">Đặt CCCD nằm gọn trong khung, đủ sáng, không bị lóa.</Text>
        <Pressable onPress={() => setShot(true)} aria-label="Chụp" className="mt-6 size-[72px] items-center justify-center rounded-full border-4 border-white">
          <Center aria-hidden className="size-14 rounded-full bg-white" />
        </Pressable>
        <Text aria-hidden size="sm" className="mt-2 text-white">Chụp</Text>
      </VStack>
      <Text size="sm" className="mt-3 block text-muted-foreground">Mô phỏng: camera dùng ảnh CCCD mẫu.</Text>
    </StepShell>
  )
}
