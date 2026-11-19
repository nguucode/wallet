/**
 * Viewer theme (sếp 2026-11-19): primary colour, light/dark, page backdrop. It only re-values gluestack tokens at runtime
 * (`--primary`, `--primary-foreground`, `--ring`) plus the app's `--backdrop` (the page behind the content panel);
 * "default" is the untouched gluestack theme. Green/red keep their money meaning, so no primary is green or red.
 * Stored per viewer in localStorage; "Đặt lại dữ liệu" (demo data) does not touch it.
 */
import { useSyncExternalStore } from 'react'
import { script as applyColorMode } from '@/components/ui/gluestack-ui-provider/script'

export type Mode = 'system' | 'light' | 'dark'
// Light values are -700 shades (white text, AA on white); dark values are -400 shades (dark text, AA on near-black).
export const PRIMARIES = {
  default: { label: 'Mặc định', light: null, dark: null },
  violet: { label: 'Tím', light: '91 43 224', dark: '167 139 250' },
  blue: { label: 'Xanh dương', light: '29 78 216', dark: '96 165 250' },
  indigo: { label: 'Chàm', light: '67 56 202', dark: '129 140 248' },
  pink: { label: 'Hồng', light: '190 24 93', dark: '244 114 182' },
} as const
export const BACKGROUNDS = {
  plain: { label: 'Trơn' },
  tint: { label: 'Ám màu' },
  warm: { label: 'Ấm' },
  pattern: { label: 'Sọc chéo' },
} as const
export const MODES: Record<Mode, string> = { system: 'Theo hệ thống', light: 'Sáng', dark: 'Tối' }

export type ThemePrefs = { primary: keyof typeof PRIMARIES; mode: Mode; background: keyof typeof BACKGROUNDS }
export const DEFAULT_THEME: ThemePrefs = { primary: 'default', mode: 'system', background: 'plain' }

// gluestack default primary, used to tint the backdrop when no colour is chosen.
export const GS_PRIMARY = { light: '23 23 23', dark: '255 245 245' }
const PLAIN = { light: '245 245 245', dark: '23 23 23' }
const WARM = { light: '250 241 236', dark: '30 25 23' }

const mix = (a: string, b: string, t: number) => {
  const x = a.split(' ').map(Number), y = b.split(' ').map(Number)
  return x.map((v, i) => Math.round(v * t + y[i] * (1 - t))).join(' ')
}

/** CSS variables for a theme in one colour mode. Only the primary overrides are set; the rest stay gluestack's. */
export function themeVars(p: ThemePrefs, dark: boolean): Record<string, string> {
  const m = dark ? 'dark' : 'light'
  const pick = PRIMARIES[p.primary]
  const v: Record<string, string> = {}
  if (pick.light) {
    v['--primary'] = pick[m]!
    v['--primary-foreground'] = dark ? '10 10 10' : '255 255 255'
    v['--ring'] = v['--primary']
  }
  const primary = pick[m] ?? GS_PRIMARY[m]
  v['--backdrop'] = p.background === 'warm' ? WARM[m] : p.background === 'tint' ? mix(primary, PLAIN[m], dark ? 0.14 : 0.08) : PLAIN[m]
  // App pages put gluestack's muted text straight on the page, so in light mode the app gets a paler cut of the same
  // backdrop (muted-foreground stays AA); dark backdrops already pass.
  v['--backdrop-app'] = dark ? v['--backdrop'] : mix(v['--backdrop'], '255 255 255', 0.2)
  return v
}

export const nextMode = (m: Mode): Mode => (m === 'system' ? 'light' : m === 'light' ? 'dark' : 'system')

import { THEME_KEY as KEY } from './theme-boot'
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
const isDark = () => document.documentElement.classList.contains('dark')

/** Sets the light/dark class (gluestack's own script) and writes the token overrides on <html>. */
export function applyTheme(p: ThemePrefs = current) {
  applyColorMode(p.mode)
  const root = document.documentElement
  for (const k of ['--primary', '--primary-foreground', '--ring']) root.style.removeProperty(k)
  for (const [k, val] of Object.entries(themeVars(p, isDark()))) root.style.setProperty(k, val)
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
 * Start-up: apply the stored theme, and re-apply after an OS light/dark change (gluestack's provider listener flips the
 * class to the OS value first; a forced Light or Dark must win, and "system" needs its token values re-read).
 */
let started = false
export function initTheme() {
  if (typeof window === 'undefined' || started) return
  started = true
  applyTheme()
  window.matchMedia?.('(prefers-color-scheme: dark)').addEventListener?.('change', () => setTimeout(() => {
    applyTheme()
    // Swatch previews read the active mode: re-render them too.
    current = { ...current }
    listeners.forEach((l) => l())
  }, 0))
}
