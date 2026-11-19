import { Check, ChevronRight, Monitor, Moon, Sun } from 'lucide-react'
import { useState } from 'react'
import { BACKGROUNDS, DEFAULT_THEME, GS_PRIMARY, MODES, nextMode, PRIMARIES, setTheme, themeVars, useTheme, type ThemePrefs } from '@/app/theme'
import { cx, Ico, IconButton } from '@/components/app-ui'
import { Button, ButtonText } from '@/components/ui/button'
import { HStack } from '@/components/ui/hstack'
import { Pressable } from '@/components/ui/pressable'
import { Text } from '@/components/ui/text'
import { VStack } from '@/components/ui/vstack'

const MODE_ICON = { system: Monitor, light: Sun, dark: Moon }
const isDarkNow = () => typeof document !== 'undefined' && document.documentElement.classList.contains('dark')
const rgb = (v: string) => `rgb(${v.replaceAll(' ', ',')})`

/** A round swatch: the thing it changes, shown as itself. Previews of other options are computed colours (inline style). */
function Swatch({ label, color, selected, expanded, onPress, children, className, radio }: {
  label: string; color?: string; selected?: boolean; expanded?: boolean; onPress: () => void; children?: React.ReactNode; className?: string
  /** An option inside a radiogroup (role radio, aria-checked) rather than a button. */
  radio?: boolean
}) {
  return (
    <Pressable
      onPress={onPress}
      role={radio ? 'radio' : 'button'}
      aria-label={label}
      {...(radio ? { 'aria-checked': !!selected } : {})}
      aria-expanded={expanded}
      className={cx('h-9 w-9 items-center justify-center rounded-full border border-border data-[hover=true]:opacity-80', selected && 'ring-2 ring-ring ring-offset-2 ring-offset-background', className)}
      style={color ? { backgroundColor: color } : undefined}
    >
      {children}
    </Pressable>
  )
}

const PATTERN = 'bg-[repeating-linear-gradient(135deg,rgb(var(--foreground)/0.08)_0_1px,transparent_1px_7px)]'

/**
 * Demo controls box (web sidebar footer, app demo sheet): primary colour, light/dark, backdrop, and ">" for the full
 * demo panel. Picking a swatch opens its options inline (no popover: gluestack's popover cannot shift at screen edges).
 */
export function ThemeControls({ onMore, title = true }: { onMore?: () => void; title?: boolean }) {
  const t = useTheme()
  const [open, setOpen] = useState<'primary' | 'background' | null>(null)
  const dark = isDarkNow()
  const m = dark ? 'dark' : 'light'
  const toggle = (k: 'primary' | 'background') => setOpen((o) => (o === k ? null : k))
  const custom = JSON.stringify(t) !== JSON.stringify(DEFAULT_THEME)
  const primaryOf = (id: ThemePrefs['primary']) => PRIMARIES[id][m] ?? GS_PRIMARY[m]
  return (
    <VStack className="gap-2.5" role="group" aria-label="Demo controls">
      {title ? (
        <HStack className="items-center justify-between">
          <Text size="sm" bold>Demo controls</Text>
          {custom ? (
            <Button variant="link" size="sm" className="h-auto px-0" onPress={() => { setTheme(DEFAULT_THEME); setOpen(null) }}>
              <ButtonText>Mặc định</ButtonText>
            </Button>
          ) : null}
        </HStack>
      ) : null}
      <HStack className="items-center gap-2">
        <Swatch label={`Màu chủ đạo: ${PRIMARIES[t.primary].label}`} color={rgb(primaryOf(t.primary))} expanded={open === 'primary'} onPress={() => toggle('primary')} />
        <Swatch label={`Giao diện: ${MODES[t.mode]}. Bấm để đổi`} onPress={() => setTheme({ mode: nextMode(t.mode) })} className="bg-background">
          <Ico as={MODE_ICON[t.mode]} size="sm" />
        </Swatch>
        <Swatch label={`Nền: ${BACKGROUNDS[t.background].label}`} expanded={open === 'background'} onPress={() => toggle('background')} className={cx('bg-backdrop', t.background === 'pattern' && PATTERN)} />
        {onMore ? <IconButton label="Mở toàn bộ Demo controls" onClick={onMore} className="h-9 w-9 border border-border"><Ico as={ChevronRight} size="sm" /></IconButton> : null}
      </HStack>
      {open === 'primary' ? (
        <VStack className="gap-1.5">
          <HStack role="radiogroup" aria-label="Màu chủ đạo" className="flex-wrap gap-2">
            {(Object.keys(PRIMARIES) as ThemePrefs['primary'][]).map((id) => (
              <Swatch key={id} radio label={PRIMARIES[id].label} color={rgb(primaryOf(id))} selected={t.primary === id} onPress={() => setTheme({ primary: id })}>
                {t.primary === id ? <Ico as={Check} size="sm" className={dark ? 'text-background' : 'text-white'} /> : null}
              </Swatch>
            ))}
          </HStack>
          <Text size="xs" className="text-foreground/70">{PRIMARIES[t.primary].label}</Text>
        </VStack>
      ) : null}
      {open === 'background' ? (
        <VStack className="gap-1.5">
          <HStack role="radiogroup" aria-label="Nền" className="flex-wrap gap-2">
            {(Object.keys(BACKGROUNDS) as ThemePrefs['background'][]).map((id) => (
              <Swatch
                key={id}
                radio
                label={BACKGROUNDS[id].label}
                color={rgb(themeVars({ ...t, background: id }, dark)['--backdrop'])}
                selected={t.background === id}
                onPress={() => setTheme({ background: id })}
                className={id === 'pattern' ? PATTERN : undefined}
              >
                {t.background === id ? <Ico as={Check} size="sm" /> : null}
              </Swatch>
            ))}
          </HStack>
          <Text size="xs" className="text-foreground/70">{BACKGROUNDS[t.background].label}</Text>
        </VStack>
      ) : null}
    </VStack>
  )
}

export { PATTERN as BACKDROP_PATTERN }
