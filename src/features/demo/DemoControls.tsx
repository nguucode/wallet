import { FlaskConical } from 'lucide-react'
import { useState } from 'react'
import { Button, cx, Ico, IconButton, Sheet } from '@/components/app-ui'
import { Text } from '@/components/ui/text'
import { ThemeControls } from './ThemeControls'

/**
 * The Demo controls sheet: the viewer theme and the sample PIN. Scenario, outcome, event and clock controls were removed
 * from the UI (sếp 2026-11-22); their store actions remain for tests and code.
 */
export function DemoControlsSheet({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange} title="Demo controls" closeLabel="Xong">
      <ThemeControls title={false} />
      <Text size="sm" className="mt-5 px-4 text-muted-foreground mac:px-2.5">Công cụ cho người xem demo. Mọi thao tác ở đây là mô phỏng. Mã PIN và OTP mẫu: <Text size="sm" bold className="tabular-nums">123456</Text>.</Text>
    </Sheet>
  )
}

export function DemoControlsButton({ compact, className }: { compact?: boolean; className?: string }) {
  const [open, setOpen] = useState(false)
  return (
    <>
      {compact ? (
        <IconButton label="Demo controls" className={cx(className)} onClick={() => setOpen(true)}><Ico as={FlaskConical} className="text-primary" /></IconButton>
      ) : (
        <Button variant="secondary" size="sm" className={className} onClick={() => setOpen(true)}><Ico as={FlaskConical} size="sm" />Demo controls</Button>
      )}
      <DemoControlsSheet open={open} onOpenChange={setOpen} />
    </>
  )
}
