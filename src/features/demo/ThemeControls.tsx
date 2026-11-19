import { Check, ChevronRight, Monitor, Moon, Sun } from 'lucide-react'
import { useState } from 'react'
import { BACKGROUNDS, DEFAULT_THEME, MODES, nextMode, PRIMARIES, setTheme, themeVars, useTheme, type ThemePrefs } from '@/app/theme'
import { cx, Ico, IconButton } from '@/components/app-ui'
import { Button, ButtonText } from '@/components/ui/button'
import { HStack } from '@/components/ui/hstack'
import { Pressable } from '@/components/ui/pressable'
import { Text } from '@/components/ui/text'
import { VStack } from '@/components/ui/vstack'

const MODE_ICON = { system: Monitor, light: Sun, dark: Moon }
const isDarkNow = () => typeof document !== 'undefined' && document.documentElement.classList.contains('dark')
const rgb = (v: string) => `rgb(${v.replaceAll(' ', ',')})`

/** Page backdrop classes for a background choice: web sits behind the panel, app is the page itself. */
export function backdropClass(background: ThemePrefs['background'], app = false) {
  if (background === 'gradient') return app ? 'bg-backdrop-app bg-gradient-to-b from-backdrop-app-tint to-backdrop-app' : 'bg-backdrop bg-gradient-to-br from-backdrop-tint to-backdrop'
  return app ? 'bg-backdrop-app' : 'bg-backdrop'
}

/** A round swatch: the thing it changes, shown as itself. Previews of other options are computed colours (inline style). */
function Swatch({ label, color, image, selected, expanded, onPress, children, className, radio }: {
  label: string; color?: string; image?: string; selected?: boolean; expanded?: boolean; onPress: () => void; children?: React.ReactNode; className?: string
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
      className={cx('h-8 w-8 items-center justify-center rounded-full border border-border data-[hover=true]:opacity-80', selected && 'ring-2 ring-ring ring-offset-2 ring-offset-card', className)}
      // backgroundImage is web-only (react-native-web passes it through); RN style types do not list it.
      style={(color || image ? { backgroundColor: color, backgroundImage: image } : undefined) as never}
    >
      {children}
    </Pressable>
  )
}

/**
 * Demo controls box (web sidebar footer, app demo sheet): tint colour (the seven rainbow colours), light/dark, page
 * background, and ">" for the full demo panel. Picking a swatch opens its options inline (gluestack's popover cannot
 * shift at screen edges).
 */
export function ThemeControls({ onMore, title = true }: { onMore?: () => void; title?: boolean }) {
  const t = useTheme()
  const [open, setOpen] = useState<'primary' | 'background' | null>(null)
  const dark = isDarkNow()
  const m = dark ? 'dark' : 'light'
  const toggle = (k: 'primary' | 'background') => setOpen((o) => (o === k ? null : k))
  const custom = JSON.stringify(t) !== JSON.stringify(DEFAULT_THEME)
  // Preview of a background choice in the current mode (gradient shown as its two ends).
  const preview = (id: ThemePrefs['background']) => {
    const v = themeVars({ ...t, background: id }, dark)
    return id === 'gradient' ? { image: `linear-gradient(135deg, ${rgb(v['--backdrop-tint'])}, ${rgb(v['--backdrop'])})` } : { color: rgb(v['--backdrop']) }
  }
  return (
    <VStack className="gap-2.5" role="group" aria-label="Demo controls">
      {title ? (
        <HStack className="items-center justify-between">
          <Text size="sm" className="font-semibold">Demo controls</Text>
          {custom ? (
            <Button variant="link" size="sm" className="h-auto px-0" onPress={() => { setTheme(DEFAULT_THEME); setOpen(null) }}>
              <ButtonText className="text-sm">Mặc định</ButtonText>
            </Button>
          ) : null}
        </HStack>
      ) : null}
      <HStack className="items-center gap-2">
        <Swatch label={`Màu chủ đạo: ${PRIMARIES[t.primary].label}`} color={rgb(PRIMARIES[t.primary][m])} expanded={open === 'primary'} onPress={() => toggle('primary')} />
        <Swatch label={`Giao diện: ${MODES[t.mode]}. Bấm để đổi`} onPress={() => setTheme({ mode: nextMode(t.mode) })} className="bg-card">
          <Ico as={MODE_ICON[t.mode]} size="sm" />
        </Swatch>
        <Swatch label={`Nền: ${BACKGROUNDS[t.background].label}`} expanded={open === 'background'} onPress={() => toggle('background')} {...preview(t.background)} />
        {onMore ? <IconButton label="Mở toàn bộ Demo controls" onClick={onMore} className="h-8 w-8 border border-border"><Ico as={ChevronRight} size="sm" /></IconButton> : null}
      </HStack>
      {open === 'primary' ? (
        <VStack className="gap-1.5">
          <HStack role="radiogroup" aria-label="Màu chủ đạo" className="flex-wrap gap-2">
            {(Object.keys(PRIMARIES) as ThemePrefs['primary'][]).map((id) => (
              <Swatch key={id} radio label={PRIMARIES[id].label} color={rgb(PRIMARIES[id][m])} selected={t.primary === id} onPress={() => setTheme({ primary: id })}>
                {t.primary === id ? <Ico as={Check} size="xs" className={dark ? 'text-black' : 'text-white'} /> : null}
              </Swatch>
            ))}
          </HStack>
          <Text size="xs" className="text-muted-foreground">{PRIMARIES[t.primary].label}</Text>
        </VStack>
      ) : null}
      {open === 'background' ? (
        <VStack className="gap-1.5">
          <HStack role="radiogroup" aria-label="Nền" className="flex-wrap gap-2">
            {(Object.keys(BACKGROUNDS) as ThemePrefs['background'][]).map((id) => (
              <Swatch key={id} radio label={BACKGROUNDS[id].label} selected={t.background === id} onPress={() => setTheme({ background: id })} {...preview(id)}>
                {t.background === id ? <Ico as={Check} size="xs" /> : null}
              </Swatch>
            ))}
          </HStack>
          <Text size="xs" className="text-muted-foreground">{BACKGROUNDS[t.background].label}</Text>
        </VStack>
      ) : null}
    </VStack>
  )
}
