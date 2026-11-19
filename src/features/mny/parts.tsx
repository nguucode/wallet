import { Check, ChevronDown, Clock, X } from 'lucide-react'
import { useState, type ReactNode } from 'react'
import { bankById, useWorld } from '@/app/store'
import { BankMark, Badge, Disc, Ico, Row, Sheet } from '@/components/app-ui'
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
        <Text size="sm" className="text-muted-foreground">{kindLabel(s.kind)} <Text size="sm" className="tabular-nums text-muted-foreground">{mask4(s.last4)}</Text></Text>
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
  return (
    <VStack className="mb-6 gap-2">
      <Text id="source-label" size="sm" className="font-medium">{label}</Text>
      <Pressable
        role="button" aria-describedby="source-label" onPress={() => setOpen(true)}
        className="min-h-[60px] w-full flex-row items-center gap-3 rounded-md border border-border bg-card px-4 py-2 data-[hover=true]:bg-accent data-[active=true]:bg-accent"
      >
        <Box id="source-current" className="contents"><SourceLine s={current} /></Box>
        <Ico as={ChevronDown} className="text-muted-foreground" />
      </Pressable>
      <Sheet open={open} onOpenChange={setOpen} title={label}>
        <VStack role="list" aria-label={label} className="-mx-4 divide-y divide-border">
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
        </VStack>
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
    <VStack className="items-center pt-6 text-center">
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
