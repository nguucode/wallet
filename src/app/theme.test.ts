import { BACKGROUNDS, DEFAULT_THEME, loadTheme, nextMode, PRIMARIES, saveTheme, themeCss, themeVars, type ThemePrefs } from './theme'

// WCAG relative luminance / contrast for "r g b" token strings.
const lum = (rgb: string) => {
  const [r, g, b] = rgb.split(' ').map(Number).map((c) => { const s = c / 255; return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4 })
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}
const contrast = (a: string, b: string) => { const [x, y] = [lum(a), lum(b)].sort((m, n) => n - m); return (x + 0.05) / (y + 0.05) }
// iOS grouped background (page / web panel) and cell (card) colours, light and dark (src/components/ui/gluestack-ui-provider/config.ts).
const SURFACES = { light: ['242 242 247', '255 255 255'], dark: ['0 0 0', '28 28 30'] }
const FG = { light: '0 0 0', dark: '255 255 255' }
const MUTED = { light: '100 100 105', dark: '174 174 178' } // secondaryLabel, one step darker than Apple's #6C6C70 (4.4:1 on the grouped grey)
const ids = <T extends object>(o: T) => Object.keys(o) as (keyof T)[]

describe('themeVars', () => {
  it('offers the seven rainbow colours, default blue', () => {
    expect(ids(PRIMARIES)).toEqual(['red', 'orange', 'yellow', 'green', 'blue', 'indigo', 'violet'])
    expect(DEFAULT_THEME.primary).toBe('blue')
  })

  it.each(ids(PRIMARIES))('%s passes AA as a button fill and as text on every surface, light and dark', (id) => {
    for (const dark of [false, true]) {
      const v = themeVars({ ...DEFAULT_THEME, primary: id }, dark)
      expect(contrast(v['--primary'], v['--primary-foreground'])).toBeGreaterThanOrEqual(4.5)
      for (const s of SURFACES[dark ? 'dark' : 'light']) expect(contrast(v['--primary'], s)).toBeGreaterThanOrEqual(4.5)
      expect(v['--ring']).toBe(v['--primary'])
    }
  })

  it.each(ids(BACKGROUNDS))('%s backdrop keeps sidebar text above 7:1 and stands apart from the panel, light and dark', (id) => {
    for (const primary of ids(PRIMARIES)) for (const dark of [false, true]) {
      const v = themeVars({ ...DEFAULT_THEME, background: id, primary }, dark)
      const m = dark ? 'dark' : 'light'
      for (const k of ['--backdrop', '--backdrop-tint']) expect(contrast(v[k], FG[m])).toBeGreaterThanOrEqual(7)
      expect(v['--backdrop']).not.toBe(SURFACES[m][0])
    }
  })

  it.each(ids(BACKGROUNDS))('%s app backdrop keeps secondary text at AA (app pages put it straight on the page)', (id) => {
    for (const primary of ids(PRIMARIES)) for (const dark of [false, true]) {
      const v = themeVars({ ...DEFAULT_THEME, background: id, primary }, dark)
      for (const k of ['--backdrop-app', '--backdrop-app-tint']) expect(contrast(v[k], MUTED[dark ? 'dark' : 'light'])).toBeGreaterThanOrEqual(4.5)
    }
  })

  it('solid and gradient follow the chosen primary; neutral does not', () => {
    const at = (background: ThemePrefs['background'], primary: ThemePrefs['primary']) => themeVars({ ...DEFAULT_THEME, background, primary }, false)
    expect(at('solid', 'red')['--backdrop']).not.toBe(at('solid', 'blue')['--backdrop'])
    expect(at('gradient', 'red')['--backdrop-tint']).not.toBe(at('gradient', 'blue')['--backdrop-tint'])
    expect(at('neutral', 'red')['--backdrop']).toBe(at('neutral', 'blue')['--backdrop'])
  })

  it('themeCss writes light values on :root and dark values on .dark', () => {
    const css = themeCss({ ...DEFAULT_THEME, primary: 'violet' })
    expect(css).toMatch(/^:root\{[^}]*--primary:137 68 171;/)
    expect(css).toMatch(/\.dark\{[^}]*--primary:218 143 255;/)
  })
})

describe('prefs', () => {
  beforeEach(() => localStorage.clear())
  it('mode cycles system → light → dark → system', () => {
    expect([nextMode('system'), nextMode('light'), nextMode('dark')]).toEqual(['light', 'dark', 'system'])
  })
  it('round-trips through storage and falls back to the default on junk or old values', () => {
    saveTheme({ primary: 'orange', mode: 'dark', background: 'gradient' })
    expect(loadTheme()).toEqual({ primary: 'orange', mode: 'dark', background: 'gradient' })
    localStorage.setItem('wallet.theme', '{"primary":"pink","mode":"dark","background":"pattern"}')
    expect(loadTheme()).toEqual(DEFAULT_THEME)
  })
})

describe('iOS palette (gluestack tokens)', () => {
  it('keeps text, secondary text, red and green at AA on the grouped background and on cards, light and dark', async () => {
    const { colors } = await import('@/components/ui/gluestack-ui-provider/config')
    for (const m of ['light', 'dark'] as const) {
      const c = colors[m] as Record<string, string>
      for (const surface of [c['--background'], c['--card']])
        for (const fg of ['--foreground', '--muted-foreground', '--destructive', '--success'])
          expect(contrast(c[fg], surface), `${m} ${fg} on ${surface}`).toBeGreaterThanOrEqual(4.5)
      expect(contrast(c['--success-foreground'], c['--success'])).toBeGreaterThanOrEqual(4.5)
    }
  })
})
