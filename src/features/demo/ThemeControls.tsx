import { ChevronRight } from 'lucide-react'
import { useLayout } from '@/app/layout'
import { BACKGROUNDS, DEFAULT_THEME, GLASSES, MODES, PRIMARIES, setTheme, themeVars, useTheme, type Mode, type ThemePrefs } from '@/app/theme'
import { Card, cx, Ico, IconButton } from '@/components/app-ui'
import { Box } from '@/components/ui/box'
import { Button, ButtonText } from '@/components/ui/button'
import { Heading } from '@/components/ui/heading'
import { HStack } from '@/components/ui/hstack'
import { Pressable } from '@/components/ui/pressable'
import { Text } from '@/components/ui/text'
import { VStack } from '@/components/ui/vstack'

const isDarkNow = () => typeof document !== 'undefined' && document.documentElement.classList.contains('dark')
const rgb = (v: string) => `rgb(${v.replaceAll(' ', ',')})`

/** Page backdrop classes for a background choice: web sits behind the panel, app is the page itself. */
export function backdropClass(background: ThemePrefs['background'], app = false) {
  if (background === 'wallpaper') return 'bg-wallpaper-veiled'
  if (background === 'gradient') return app ? 'bg-backdrop-app bg-gradient-to-b from-backdrop-app-tint to-backdrop-app' : 'bg-backdrop bg-gradient-to-br from-backdrop-tint to-backdrop'
  return app ? 'bg-backdrop-app' : 'bg-backdrop'
}

type Scheme = 'light' | 'dark'
const WINDOW: Record<Scheme, { desk: string; win: string; side: string; line: string }> = {
  light: { desk: '#c9d3e6', win: '#ffffff', side: '#ececee', line: '#dcdce0' },
  dark: { desk: '#28304a', win: '#2f2f31', side: '#3b3b3e', line: '#4a4a4e' },
}

/** A tiny window in one colour scheme: sidebar, accent selection, two content lines (System Settings > Appearance). */
function MiniWindow({ scheme, accent, clip }: { scheme: Scheme; accent: string; clip?: string }) {
  const c = WINDOW[scheme]
  const fill = (x: object) => x as never
  return (
    <Box className="absolute inset-0" style={fill({ backgroundColor: c.desk, clipPath: clip })}>
      <Box className="absolute bottom-0 left-[14%] right-0 top-[18%] overflow-hidden rounded-tl-[4px]" style={fill({ backgroundColor: c.win })}>
        <Box className="absolute bottom-0 left-0 top-0 w-[32%]" style={fill({ backgroundColor: c.side })}>
          <Box className="mx-[3px] mt-[5px] h-[4px] rounded-[2px]" style={fill({ backgroundColor: accent })} />
        </Box>
        <Box className="absolute left-[40%] right-[8%] top-[6px] h-[3px] rounded-[2px]" style={fill({ backgroundColor: c.line })} />
        <Box className="absolute left-[40%] right-[24%] top-[13px] h-[3px] rounded-[2px]" style={fill({ backgroundColor: c.line })} />
      </Box>
    </Box>
  )
}

/** A glass sample: tinted wallpaper with two shapes under a panel drawn in the material itself. */
function GlassSample({ glass, accent }: { glass: ThemePrefs['glass']; accent: string }) {
  return (
    <Box className="absolute inset-0" style={{ backgroundImage: `linear-gradient(135deg, ${accent}, #f2b5d4 70%, #ffd9a0)` } as never}>
      <Box className="absolute left-[10%] top-[18%] h-[20px] w-[20px] rounded-full bg-white/80" />
      <Box className="absolute bottom-[14%] left-[30%] h-[12px] w-[26px] rounded-full bg-black/30" />
      <Box
        className={cx('absolute bottom-[10%] left-[22%] right-[10%] top-[12%] rounded-[6px] backdrop-saturate-200',
          glass === 'vibrancy' ? 'bg-white/55 backdrop-blur-md' : 'bg-white/15 backdrop-blur-[2px] shadow-[inset_0_1px_0_rgba(255,255,255,0.8),inset_0_0_0_0.5px_rgba(255,255,255,0.5)]')}
      />
    </Box>
  )
}

/** One choice shown as a picture with its name under it; the picture takes the accent ring when chosen (macOS). */
function Choice({ label, selected, onPress, children, w = 64, h = 42 }: { label: string; selected: boolean; onPress: () => void; children: React.ReactNode; w?: number; h?: number }) {
  return (
    <Pressable role="radio" aria-checked={selected} aria-label={label} onPress={onPress} className="items-center gap-1 rounded-[8px]">
      <Box
        className={cx('relative overflow-hidden rounded-[7px] border border-foreground/10', selected ? 'ring-2 ring-primary ring-offset-2 ring-offset-card' : 'data-[hover=true]:opacity-90')}
        style={{ width: w, height: h } as never}
      >
        {children}
      </Box>
      <Text size="xs" className={selected ? 'font-semibold text-foreground' : 'text-muted-foreground'}>{label}</Text>
    </Pressable>
  )
}

/** The grouped box every Demo controls section uses: no inner padding (rows carry the 10pt inset), grey on the app sheet. */
const BOX = 'divide-y divide-border bg-secondary/60 mac:bg-card'
/** Section header over a box: the same 10pt inset as the rows (macOS [render] Form). */
function BoxHeader({ title, note, action }: { title: string; note?: string; action?: React.ReactNode }) {
  return (
    <VStack className="mt-2.5 gap-0.5 px-4 mac:px-2.5">
      <HStack className="items-baseline justify-between gap-3">
        <Heading as="h3" size="sm" className="mac:text-base mac:font-bold">{title}</Heading>
        {action}
      </HStack>
      {note ? <Text size="xs" className="text-muted-foreground">{note}</Text> : null}
    </VStack>
  )
}

/** A form row: label (and note) leading, choices trailing; wraps under the label when narrow. */
function Line({ label, note, children }: { label: string; note?: string; children: React.ReactNode }) {
  return (
    <HStack className="flex-wrap items-start justify-between gap-x-4 gap-y-2 px-4 py-3 mac:px-2.5 mac:py-2.5">
      <VStack className="min-w-[96px] max-w-[170px] flex-1 gap-0.5 pt-0.5">
        <Text>{label}</Text>
        {note ? <Text size="xs" className="text-muted-foreground">{note}</Text> : null}
      </VStack>
      <HStack role="radiogroup" aria-label={label} className="flex-wrap gap-3">{children}</HStack>
    </HStack>
  )
}

/**
 * Demo controls theme block, laid out as System Settings > Appearance (sếp 2026-11-22): grouped boxes with the label
 * leading and every choice visible trailing. Giao diện and Kính are window pictures; Kính is web only (the app keeps
 * its own bars).
 */
export function ThemeControls({ onMore, title = true }: { onMore?: () => void; title?: boolean }) {
  const t = useTheme()
  const web = useLayout() === 'web'
  const dark = isDarkNow()
  const m = dark ? 'dark' : 'light'
  const accent = rgb(PRIMARIES[t.primary][m])
  const custom = JSON.stringify(t) !== JSON.stringify(DEFAULT_THEME)
  // Preview of a background choice in the current mode (gradient shown as its two ends), with a white box on it.
  const backdrop = (id: ThemePrefs['background']) => {
    const v = themeVars({ ...t, background: id }, dark)
    return id === 'gradient' ? { backgroundImage: `linear-gradient(135deg, ${rgb(v['--backdrop-tint'])}, ${rgb(v['--backdrop'])})` } : { backgroundColor: rgb(v['--backdrop']) }
  }
  return (
    <VStack className="gap-2.5" role="group" aria-label="Demo controls">
      {title || onMore ? (
        <HStack className="items-center justify-between px-4 mac:px-2.5">
          {title ? <Text size="sm" className="font-semibold">Demo controls</Text> : <Box />}
          {onMore ? <IconButton label="Mở toàn bộ Demo controls" onClick={onMore} className="h-8 w-8 border border-border"><Ico as={ChevronRight} size="sm" /></IconButton> : null}
        </HStack>
      ) : null}
      <Card inset="rows" className={BOX}>
        <Line label="Giao diện">
          {(Object.keys(MODES) as Mode[]).map((id) => (
            <Choice key={id} label={MODES[id]} selected={t.mode === id} onPress={() => setTheme({ mode: id })}>
              {id === 'dark' ? <MiniWindow scheme="dark" accent={accent} /> : <MiniWindow scheme="light" accent={accent} />}
              {id === 'system' ? <MiniWindow scheme="dark" accent={accent} clip="polygon(55% 0, 100% 0, 100% 100%, 45% 100%)" /> : null}
            </Choice>
          ))}
        </Line>
        {web ? (
          <Line label="Kính" note="Sidebar, thanh công cụ, menu.">
            {(Object.keys(GLASSES) as ThemePrefs['glass'][]).map((id) => (
              <Choice key={id} label={GLASSES[id].label} selected={t.glass === id} onPress={() => setTheme({ glass: id })}>
                <GlassSample glass={id} accent={accent} />
              </Choice>
            ))}
          </Line>
        ) : null}
      </Card>
      <BoxHeader
        title="Chủ đề"
        action={custom ? <Button variant="link" size="sm" className="h-auto min-h-11 px-0 mac:min-h-0" onPress={() => setTheme(DEFAULT_THEME)}><ButtonText className="text-sm mac:text-base">Mặc định</ButtonText></Button> : null}
      />
      <Card inset="rows" className={BOX}>
        <HStack className="flex-wrap items-start justify-between gap-x-4 gap-y-2 px-4 py-3 mac:px-2.5 mac:py-2.5">
          <Text className="pt-0.5">Màu chủ đạo</Text>
          {/* App: each swatch has a 44pt target; the row starts 11pt early so the first swatch sits on the inset. */}
          <HStack role="radiogroup" aria-label="Màu chủ đạo" className="-ml-[11px] flex-wrap mac:ml-0 mac:gap-2.5">
            {(Object.keys(PRIMARIES) as ThemePrefs['primary'][]).map((id) => {
              const on = t.primary === id
              return (
                <Pressable key={id} role="radio" aria-checked={on} aria-label={PRIMARIES[id].label} onPress={() => setTheme({ primary: id })} className="min-h-11 min-w-11 items-center justify-center gap-1 mac:min-h-0 mac:min-w-0">
                  <Box
                    className={cx('h-[22px] w-[22px] rounded-full border border-foreground/10', on && 'ring-2 ring-primary ring-offset-2 ring-offset-card')}
                    style={{ backgroundColor: rgb(PRIMARIES[id][m]) } as never}
                  />
                  {/* The name line is reserved under every swatch, so the row keeps its padding whichever is chosen. */}
                  <Box className="relative h-4 w-[22px] items-center">
                    {on ? <Text size="xs" aria-hidden className="absolute whitespace-nowrap font-semibold text-foreground">{PRIMARIES[id].label}</Text> : null}
                  </Box>
                </Pressable>
              )
            })}
          </HStack>
        </HStack>
        <Line label="Nền">
          {(Object.keys(BACKGROUNDS) as ThemePrefs['background'][]).map((id) => (
            <Choice key={id} label={BACKGROUNDS[id].label} selected={t.background === id} onPress={() => setTheme({ background: id })}>
              <Box className={cx('absolute inset-0', id === 'wallpaper' && 'bg-wallpaper')} style={(id === 'wallpaper' ? undefined : backdrop(id)) as never}>
                <Box className="absolute left-[18%] right-[18%] top-[24%] h-[34%] rounded-[3px] bg-card" />
              </Box>
            </Choice>
          ))}
        </Line>
      </Card>
    </VStack>
  )
}
