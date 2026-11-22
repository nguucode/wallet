import { Check, ChevronDown, ChevronsUpDown, Clock, X } from 'lucide-react'
import { useState, type ReactNode } from 'react'
import { bankById, useWorld } from '@/app/store'
import { useLayout } from '@/app/layout'
import { BankMark, Badge, Disc, Ico, Row, Sheet, SheetList } from '@/components/app-ui'
import { Box } from '@/components/ui/box'
import { HStack } from '@/components/ui/hstack'
import { Pressable } from '@/components/ui/pressable'
import { Text } from '@/components/ui/text'
import { VStack } from '@/components/ui/vstack'
import type { FundingSource } from '@/mock/seed'
import { kindLabel, mask4, sortSources } from './logic'


export function SourceLine({ s, sub }: { s: FundingSource; sub?: ReactNode }) {
  const bank = bankById(s.bankId)
  return (
    <HStack className="min-w-0 flex-1 items-center gap-3">
      <BankMark short={bank.short} size={40} />
      <VStack className="min-w-0 flex-1">
        <Text className="font-medium">{bank.name}</Text>
        {/* One line: the masked number never breaks away from its label. */}
        <Text size="sm" isTruncated className="text-muted-foreground">{kindLabel(s.kind)} <Text size="sm" className="tabular-nums text-muted-foreground">{mask4(s.last4)}</Text></Text>
        {sub}
      </VStack>
    </HStack>
  )
}

/** Bordered select-card; opens a sheet (dialog on web) with radio rows. */
export function SourcePicker({ label, value, onChange }: { label: string; value?: string; onChange: (id: string) => void }) {
  const w = useWorld()
  const [open, setOpen] = useState(false)
  const current = w.sources.find((s) => s.id === value) ?? w.sources[0]
  if (!current) return null
  const layout = useLayout()
  const bank = bankById(current.bankId)
  return (
    // macOS: a form row with a pop-up button (label leading, control trailing), like Field and the bank picker.
    // iOS: the label above a tappable source row.
    <VStack className="mb-6 gap-2 mac:mb-4 mac:flex-row mac:items-center mac:gap-3">
      <Text id="source-label" size="sm" className="font-medium mac:w-[38%] mac:shrink-0 mac:text-base mac:font-normal">{label}</Text>
      {layout === 'web' ? (
        <Pressable
          role="button" aria-describedby="source-label" aria-haspopup="dialog" onPress={() => setOpen(true)}
          className="h-6 flex-row items-center gap-1.5 self-start rounded-[6px] bg-secondary px-2.5 data-[hover=true]:bg-secondary/80"
        >
          <Text id="source-current">{bank.name} · {kindLabel(current.kind)} <Text className="tabular-nums">{mask4(current.last4)}</Text></Text>
          <Ico as={ChevronsUpDown} size="xs" className="text-muted-foreground" />
        </Pressable>
      ) : (
        <Pressable
          role="button" aria-describedby="source-label" onPress={() => setOpen(true)}
          className="min-h-[60px] w-full flex-row items-center gap-3 rounded-md border border-border bg-card px-4 py-2 data-[hover=true]:bg-accent data-[active=true]:bg-accent"
        >
          <Box id="source-current" className="contents"><SourceLine s={current} /></Box>
          <Ico as={ChevronDown} className="text-muted-foreground" />
        </Pressable>
      )}
      <Sheet open={open} onOpenChange={setOpen} title={label}>
        <SheetList label={label}>
          {sortSources(w.sources).map((s) => {
            const bank = bankById(s.bankId)
            return (
              <Box key={s.id} role="listitem">
                <Row
                  onClick={() => { onChange(s.id); setOpen(false) }}
                  selected={s.id === current.id}
                  left={<BankMark short={bank.short} size={40} />}
                  title={bank.name}
                  subtitle={<>{kindLabel(s.kind)} <Text size="sm" className="tabular-nums text-muted-foreground">{mask4(s.last4)}</Text>{s.isDefault ? ' · Mặc định' : null}</>}
                />
              </Box>
            )
          })}
        </SheetList>
      </Sheet>
    </VStack>
  )
}

export function DefaultBadge() {
  return <Badge>Mặc định</Badge>
}

/** Result composition (US-FND-007 pattern) with story-specific copy. Flows pass actions to FlowFrame's footer instead (pinned on app). */
export function ResultBlock({ tone, heading, amount, children, actions }: {
  tone: 'success' | 'pending' | 'failed'; heading: string; amount?: ReactNode; children?: ReactNode; actions?: ReactNode
}) {
  const icon = tone === 'pending' ? Clock : tone === 'failed' ? X : Check
  const disc = tone === 'success' ? 'success' : tone === 'failed' ? 'danger' : 'neutral'
  return (
    <VStack data-align="free" className="items-center pt-6 text-center">
      <Disc tone={disc} size={64}><Ico as={icon} size="xl" className={tone === 'success' ? 'text-success' : tone === 'failed' ? 'text-destructive' : 'text-foreground'} /></Disc>
      <VStack role="status" aria-live="polite" className="w-full items-center">
        <Text size="lg" bold className="mt-3 text-center">{heading}</Text>
        {amount ? <Box className="mt-2 items-center break-words">{amount}</Box> : null}
        {children ? <VStack className="mx-auto mt-3 max-w-[44ch] gap-1 *:text-center">{children}</VStack> : null}
      </VStack>
      {actions ? <VStack className="mt-8 w-full gap-2">{actions}</VStack> : null}
    </VStack>
  )
}

export { useToast } from '@/components/app-ui'
