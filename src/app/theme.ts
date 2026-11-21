/**
 * Viewer theme (sếp 2026-11-19): tint colour, light/dark, page backdrop. It only re-values tokens at runtime
 * (`--primary`, `--primary-foreground`, `--ring`, plus the app's backdrop tokens), written as one stylesheet with a
 * `:root` (light) and a `.dark` rule, so any `.dark` scope (the dark balance card, dark mode) picks the right value.
 * Stored per viewer in localStorage; "Đặt lại dữ liệu" (demo data) does not touch it.
 */
import { useSyncExternalStore } from 'react'
import { script as applyColorMode } from '@/components/ui/gluestack-ui-provider/script'
import { THEME_KEY as KEY } from './theme-boot'

export type Mode = 'system' | 'light' | 'dark'
/**
 * The seven rainbow colours as Apple's accessible (increased-contrast) system colours: the light values carry white
 * text and read as text on white; the dark values carry black text and read on black. Blue is iOS's default tint.
 */
export const PRIMARIES = {
  red: { label: 'Đỏ', light: '215 0 21', dark: '255 105 97' },
  orange: { label: 'Cam', light: '201 52 0', dark: '255 179 64' },
  yellow: { label: 'Vàng', light: '178 80 0', dark: '255 212 38' },
  green: { label: 'Lục', light: '28 122 52', dark: '48 219 91' }, // Apple's #248A3D is 4.4:1 on the grouped grey; one step darker
  blue: { label: 'Lam', light: '0 64 221', dark: '64 156 255' },
  indigo: { label: 'Chàm', light: '54 52 163', dark: '125 122 255' },
  violet: { label: 'Tím', light: '137 68 171', dark: '218 143 255' },
} as const
export const BACKGROUNDS = {
  neutral: { label: 'Xám trung tính' },
  gradient: { label: 'Chuyển màu' },
  solid: { label: 'Đơn sắc' },
} as const
export const MODES: Record<Mode, string> = { system: 'Theo hệ thống', light: 'Sáng', dark: 'Tối' }

export type ThemePrefs = { primary: keyof typeof PRIMARIES; mode: Mode; background: keyof typeof BACKGROUNDS }
export const DEFAULT_THEME: ThemePrefs = { primary: 'blue', mode: 'system', background: 'neutral' }

// iOS systemGray5 / secondarySystemBackground behind the grouped panel; the app page is the grouped background itself.
const NEUTRAL = { light: '229 229 234', dark: '28 28 30' }
const GROUPED = { light: '242 242 247', dark: '0 0 0' }

const mix = (a: string, b: string, t: number) => {
  const x = a.split(' ').map(Number), y = b.split(' ').map(Number)
  return x.map((v, i) => Math.round(v * t + y[i] * (1 - t))).join(' ')
}

/** CSS variables for a theme in one colour mode. */
export function themeVars(p: ThemePrefs, dark: boolean): Record<string, string> {
  const m = dark ? 'dark' : 'light'
  const primary = PRIMARIES[p.primary][m]
  const solid = p.background === 'solid'
  const grad = p.background === 'gradient'
  // Web backdrop (behind the panel) and the gradient's tinted end.
  const backdrop = solid ? mix(primary, GROUPED[m], dark ? 0.2 : 0.14) : NEUTRAL[m]
  const tint = grad ? mix(primary, GROUPED[m], dark ? 0.3 : 0.22) : backdrop
  // App page: the same idea kept pale enough for secondary text (AA) in light mode.
  const APP_LIGHT = '248 248 250'
  const app = solid ? (dark ? mix(primary, GROUPED.dark, 0.14) : mix(primary, APP_LIGHT, 0.05)) : GROUPED[m]
  const appTint = grad ? (dark ? mix(primary, GROUPED.dark, 0.2) : mix(primary, APP_LIGHT, 0.06)) : app
  return {
    '--primary': primary,
    // macOS: blue is AppKit's selectedContentBackgroundColor (white text in both modes); other tints keep the iOS value.
    '--primary-mac': p.primary === 'blue' ? (dark ? '0 89 209' : '0 100 225') : primary,
    '--primary-mac-foreground': p.primary === 'blue' ? '255 255 255' : dark ? '0 0 0' : '255 255 255',
    '--primary-foreground': dark ? '0 0 0' : '255 255 255',
    '--ring': primary,
    '--backdrop': backdrop,
    '--backdrop-tint': tint,
    '--backdrop-app': app,
    '--backdrop-app-tint': appTint,
  }
}

const decl = (v: Record<string, string>) => Object.entries(v).map(([k, val]) => `${k}:${val};`).join('')
/** The theme as one stylesheet: light on :root, dark on .dark (the class gluestack's colour-mode script sets). */
export const themeCss = (p: ThemePrefs) => `:root{${decl(themeVars(p, false))}}.dark{${decl(themeVars(p, true))}}`

export const nextMode = (m: Mode): Mode => (m === 'system' ? 'light' : m === 'light' ? 'dark' : 'system')

export function loadTheme(): ThemePrefs {
  try {
    const raw = JSON.parse(localStorage.getItem(KEY) ?? '{}')
    if (raw.primary in PRIMARIES && raw.mode in MODES && raw.background in BACKGROUNDS) return raw
  } catch { /* storage unavailable or junk: default */ }
  return DEFAULT_THEME
}
export function saveTheme(p: ThemePrefs) {
  try { localStorage.setItem(KEY, JSON.stringify(p)) } catch { /* private mode: this session only */ }
}

/* ── Runtime store ────────────────────────────────────────────────── */

let current: ThemePrefs = typeof window === 'undefined' ? DEFAULT_THEME : loadTheme()
const listeners = new Set<() => void>()
const STYLE_ID = 'wallet-theme'

/** Sets the light/dark class (gluestack's own script) and (re)writes the theme stylesheet, last in <head> so it wins. */
export function applyTheme(p: ThemePrefs = current) {
  applyColorMode(p.mode)
  let el = document.getElementById(STYLE_ID)
  if (!el) { el = document.createElement('style'); el.id = STYLE_ID }
  document.head.appendChild(el)
  el.textContent = themeCss(p)
}

export function setTheme(patch: Partial<ThemePrefs>) {
  current = { ...current, ...patch }
  saveTheme(current)
  applyTheme(current)
  listeners.forEach((l) => l())
}

export function useTheme(): ThemePrefs {
  return useSyncExternalStore((cb) => { listeners.add(cb); return () => listeners.delete(cb) }, () => current, () => DEFAULT_THEME)
}

/**
 * Start-up: apply the stored theme, and after an OS light/dark change re-apply (gluestack's provider listener flips the
 * class to the OS value first; a forced Light or Dark must win) and re-render swatch previews.
 */
let started = false
export function initTheme() {
  if (typeof window === 'undefined' || started) return
  started = true
  applyTheme()
  window.matchMedia?.('(prefers-color-scheme: dark)').addEventListener?.('change', () => setTimeout(() => {
    applyTheme()
    current = { ...current }
    listeners.forEach((l) => l())
  }, 0))
}
