import { now, dayCounter, useWorld } from '@/app/store'
import { config } from '@/domain/config'
import { formatVnd } from '@/domain/money'
import { Badge, Card, Skeleton } from '@/components/app-ui'
import { Box } from '@/components/ui/box'
import { Grid, GridItem } from '@/components/ui/grid'
import { Heading } from '@/components/ui/heading'
import { HStack } from '@/components/ui/hstack'
import { Progress, ProgressFilledTrack } from '@/components/ui/progress'
import { Text } from '@/components/ui/text'
import { VStack } from '@/components/ui/vstack'
import { BarsWithLimit, Ring, ringTone } from '@/components/charts'
import { ScreenTitle, useLoaded } from './kit'
import { limitCounters, monthlyGeneral, nextReset, type Counter } from './limitsView'

/** US-SEC-005. */
export default function LimitsPage() {
  const w = useWorld()
  const loaded = useLoaded()
  const at = new Date(now())
  const c = limitCounters(w.transactions, at)
  const reset = `Làm mới lúc 00:00 ${nextReset(at)}`
  const s = config.stepUp

  return (
    <Box>
      <ScreenTitle>Hạn mức</ScreenTitle>
      {!loaded ? (
        <VStack className="gap-6 mac:gap-5" aria-busy>
          {[0, 1, 2].map((i) => (
            <Card key={i} className="gap-3"><Skeleton className="h-5 w-1/2" /><Skeleton className="h-2 rounded-full" /><Skeleton className="h-4 w-2/3" /></Card>
          ))}
        </VStack>
      ) : (
        <VStack className="gap-6 mac:gap-5">
          <Card centered className="py-6">
            <Heading as="h2" size="lg" className="sr-only">Tổng quan hạn mức tháng này</Heading>
            <Grid className="gap-4" _extra={{ className: 'grid-cols-2' }}>
              <GridItem _extra={{ className: 'col-span-1' }}><RingStat title="Chung" counter={c.general} /></GridItem>
              <GridItem _extra={{ className: 'col-span-1' }}><RingStat title="Thiết yếu" counter={c.essential} /></GridItem>
            </Grid>
            <Text size="sm" className="mt-3 text-center tabular-nums text-muted-foreground">{reset}</Text>
          </Card>
          <Card>
            <Heading as="h2" size="lg">Hạn mức chung theo tháng</Heading>
            <Text className="mt-1 mb-6 text-muted-foreground">Cột đỏ là tháng vượt mức {formatVnd(config.limits.generalMonth)}</Text>
            <BarsWithLimit
              bars={monthlyGeneral(w.transactions, at)}
              limit={config.limits.generalMonth}
              limitLabel={`${config.limits.generalMonth / 1_000_000}tr`}
              label={`Hạn mức chung 12 tháng gần nhất; tháng này đã dùng ${formatVnd(c.general.used)}`}
            />
          </Card>
          <Meter
            title="Hạn mức chung trong tháng" counter={c.general} reset={reset}
            note="Tính trên chuyển tiền, thanh toán QR và hóa đơn không thiết yếu. Không tính nạp tiền, rút tiền và tiền nhận vào."
          />
          <Meter title="Hạn mức thiết yếu trong tháng" counter={c.essential} reset={reset} note="Dành cho hóa đơn điện. Không trừ vào hạn mức chung." />
          <Card>
            <Heading as="h2" size="lg">Xác thực giao dịch</Heading>
            <Text className="mt-2">Hôm nay đã giao dịch <Text className="font-semibold tabular-nums">{formatVnd(dayCounter(w))}</Text> bằng mã PIN</Text>
            <VStack role="list" className="mt-3 gap-2 border-t border-border pt-3">
              <Text role="listitem">Nạp, rút, chuyển tiền đến {formatVnd(s.perTransaction)} mỗi giao dịch và tổng {formatVnd(s.perDay)} mỗi ngày: mã PIN</Text>
              <Text role="listitem">Vượt một trong hai mức trên: xác thực khuôn mặt</Text>
              <Text role="listitem">Thanh toán QR và hóa đơn đến {formatVnd(s.paymentFace)}: mã PIN; trên mức này: xác thực khuôn mặt</Text>
              <Text role="listitem">Sau mỗi lần xác thực khuôn mặt, tổng trong ngày bắt đầu lại từ 0</Text>
            </VStack>
          </Card>
        </VStack>
      )}
    </Box>
  )
}

function RingStat({ title, counter }: { title: string; counter: Counter }) {
  const share = counter.used / counter.limit
  return (
    <VStack className="items-center">
      <Ring used={share} tone={ringTone(share)} size={112}>
        <VStack className="items-center">
          <Text size="xl" bold className="tabular-nums">{Math.round(share * 100)}%</Text>
          <Text size="xs" className="text-muted-foreground">đã dùng</Text>
        </VStack>
      </Ring>
      <Text size="lg" bold className="mt-3 tabular-nums">{formatVnd(counter.remaining)}</Text>
      <Text className="text-muted-foreground">còn lại · {title}</Text>
    </VStack>
  )
}

function Meter({ title, counter, note, reset }: { title: string; counter: Counter; note: string; reset: string }) {
  // Design choice (not a rule): warning tone when 10% or less is left.
  const warn = counter.remaining <= counter.limit * 0.1
  return (
    <Card>
      <HStack className="items-start justify-between gap-3">
        <Heading as="h2" size="lg">{title}</Heading>
        {warn ? <Badge tone="pending">Sắp hết hạn mức</Badge> : null}
      </HStack>
      <Text className="mt-3 tabular-nums">Đã dùng {formatVnd(counter.used)} /{'\u200b'} {formatVnd(counter.limit)}</Text>
      <Progress value={Math.min(100, (counter.used / counter.limit) * 100)} aria-hidden className="mt-2">
        <ProgressFilledTrack className={warn ? 'bg-destructive' : undefined} />
      </Progress>
      <Text className="mt-2 font-semibold tabular-nums">Còn lại {formatVnd(counter.remaining)}</Text>
      {counter.pending ? <Text className="mt-1 text-muted-foreground">Gồm {formatVnd(counter.pending)} đang xử lý</Text> : null}
      <Text className="mt-3 text-muted-foreground">{note}</Text>
      <Text size="sm" className="mt-1 tabular-nums text-muted-foreground">{reset}</Text>
    </Card>
  )
}
