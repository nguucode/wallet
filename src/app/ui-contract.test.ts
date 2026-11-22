// Guards for the one content edge (DESIGN.md "One content edge"): the box owns its padding, nobody else sets one.
// The in-browser checker (src/dev/uiCheck.ts) measures the rendered result; this catches the source pattern early.
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join } from 'node:path'

const ROOT = join(__dirname, '..')
const files = (dir: string): string[] =>
  readdirSync(dir).flatMap((f) => {
    if (f.startsWith('._')) return [] // exFAT metadata
    const p = join(dir, f)
    return statSync(p).isDirectory() ? (p.includes('/components/ui') ? [] : files(p)) : p.endsWith('.tsx') ? [p] : []
  })
const sources = files(ROOT).map((p) => [p.slice(ROOT.length + 1), readFileSync(p, 'utf8')] as const)

describe('UI contract', () => {
  it('no Card sets its own horizontal padding (use inset="rows" | "content")', () => {
    const bad = sources.flatMap(([f, s]) =>
      [...s.matchAll(/<Card\b[^>]*className=(?:"([^"]*)"|\{([^}]*)\})/g)]
        .filter((m) => /(^|[\s'"])(mac:|lg:)?(p|px|pl|pr)-\d/.test(m[1] ?? m[2] ?? ''))
        .map((m) => `${f}: ${m[0].slice(0, 80)}`),
    )
    expect(bad).toEqual([])
  })

  it('boxes are drawn by Card only (no direct gluestack Card outside app-ui)', () => {
    const bad = sources.filter(([f, s]) => f !== 'components/app-ui.tsx' && /<GCard\b|from '@\/components\/ui\/card'/.test(s)).map(([f]) => f)
    expect(bad).toEqual([])
  })

  it('no hand-drawn bordered boxes (rounded + border + bg-card on a container)', () => {
    const bad = sources.flatMap(([f, s]) =>
      [...s.matchAll(/<(Box|HStack|VStack)\b[^>]*className="([^"]*)"/g)]
        .filter((m) => /\brounded-(lg|xl|2xl|md)\b/.test(m[2]) && /\bborder\b/.test(m[2]) && /\bbg-card\b/.test(m[2]))
        .map((m) => `${f}: ${m[0].slice(0, 90)}`),
    )
    expect(bad).toEqual([])
  })
})
