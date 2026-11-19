import { BACKGROUNDS, DEFAULT_THEME, loadTheme, nextMode, PRIMARIES, saveTheme, themeVars, type ThemePrefs } from './theme'

// WCAG relative luminance / contrast for "r g b" token strings.
const lum = (rgb: string) => {
  const [r, g, b] = rgb.split(' ').map(Number).map((c) => { const s = c / 255; return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4 })
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}
const contrast = (a: string, b: string) => { const [x, y] = [lum(a), lum(b)].sort((m, n) => n - m); return (x + 0.05) / (y + 0.05) }
const BG = { light: '255 255 255', dark: '10 10 10' }

describe('themeVars', () => {
  it('default leaves the gluestack primary alone', () => {
    expect(themeVars(DEFAULT_THEME, false)['--primary']).toBeUndefined()
  })

  it.each(Object.keys(PRIMARIES).filter((k) => k !== 'default'))('%s passes AA as a button fill and as text, light and dark', (id) => {
    for (const dark of [false, true]) {
      const v = themeVars({ ...DEFAULT_THEME, primary: id as ThemePrefs['primary'] }, dark)
      expect(contrast(v['--primary'], v['--primary-foreground'])).toBeGreaterThanOrEqual(4.5)
      expect(contrast(v['--primary'], dark ? BG.dark : BG.light)).toBeGreaterThanOrEqual(4.5)
      expect(v['--ring']).toBe(v['--primary'])
    }
  })

  it.each(Object.keys(BACKGROUNDS))('%s backdrop keeps foreground text above 7:1, light and dark', (id) => {
    for (const dark of [false, true]) {
      const v = themeVars({ ...DEFAULT_THEME, background: id as ThemePrefs['background'], primary: 'violet' }, dark)
      expect(contrast(v['--backdrop'], dark ? '250 250 250' : '10 10 10')).toBeGreaterThanOrEqual(7)
      // The panel (background token) must stand apart from the backdrop.
      expect(v['--backdrop']).not.toBe(dark ? BG.dark : BG.light)
    }
  })

  it.each(Object.keys(BACKGROUNDS))('%s app backdrop keeps gluestack muted text at AA (app pages put muted text on it)', (id) => {
    for (const dark of [false, true]) {
      const v = themeVars({ ...DEFAULT_THEME, background: id as ThemePrefs['background'], primary: 'pink' }, dark)
      expect(contrast(v['--backdrop-app'], dark ? '161 161 161' : '115 115 115')).toBeGreaterThanOrEqual(4.5)
    }
  })

  it('tint follows the chosen primary', () => {
    const a = themeVars({ ...DEFAULT_THEME, background: 'tint', primary: 'violet' }, false)['--backdrop']
    const b = themeVars({ ...DEFAULT_THEME, background: 'tint', primary: 'blue' }, false)['--backdrop']
    expect(a).not.toBe(b)
  })
})

describe('prefs', () => {
  beforeEach(() => localStorage.clear())
  it('mode cycles system → light → dark → system', () => {
    expect([nextMode('system'), nextMode('light'), nextMode('dark')]).toEqual(['light', 'dark', 'system'])
  })
  it('round-trips through storage and falls back to the default on junk', () => {
    saveTheme({ primary: 'pink', mode: 'dark', background: 'pattern' })
    expect(loadTheme()).toEqual({ primary: 'pink', mode: 'dark', background: 'pattern' })
    localStorage.setItem('wallet.theme', '{"primary":"nope","mode":1}')
    expect(loadTheme()).toEqual(DEFAULT_THEME)
  })
})
