/**
 * Dev-only UI checker (sếp 2026-11-22: "không muốn bất kì lỗi sai nào về UI"). Loaded by src/main.tsx in development
 * only. `__uiCheck()` audits the current page; `__uiCheckAll(opts)` loads every route in a same-origin iframe at a given
 * width and colour mode and returns the issues per route. Rules mirror DESIGN.md:
 *
 * - box-edge / content-edge: boxes ([data-box], set by Card) sit on the column; every line inside starts on the box edge
 *   + inset (web 10, app 16); free text in the column starts on column + inset.
 * - gap: vertical gaps between stacked blocks come from the token set.
 * - type: font sizes come from the layout's type scale; clipped text, overlapping text.
 * - target: app interactive targets are at least 44×44.
 * - axe: WCAG 2.2 A/AA (contrast included); broken images; horizontal overflow.
 */
import axe from 'axe-core'
import { SCENARIOS } from './uiScenarios'
import { reset, resolvePending, setScenario, setSetting, signOut } from '@/app/store'

type Issue = { rule: string; msg: string; where: string }

// Console errors (React warnings, style errors) count as UI errors: collected from the moment the checker loads.
const consoleErrors: string[] = []
if (typeof window !== 'undefined') {
  const orig = console.error.bind(console)
  console.error = (...args: unknown[]) => {
    const text = args.map((x) => (typeof x === 'string' ? x : x instanceof Error ? x.message : '')).join(' ')
    consoleErrors.push(text.replace(/\s+/g, ' ').slice(0, 160))
    orig(...args)
  }
}

const TYPE = { web: [11, 12, 13, 15, 17, 22, 26], app: [13, 15, 17, 20, 22, 28, 30, 34, 48] }
const GAPS = { web: [11, 12, 20, 30], app: [12, 24, 32] }
const near = (a: number, b: number, t = 1.01) => Math.abs(a - b) <= t

function label(el: Element) {
  const t = (el.textContent ?? '').trim().replace(/\s+/g, ' ').slice(0, 40)
  const tag = el.tagName.toLowerCase()
  const aria = el.getAttribute('aria-label')
  return `${tag}${aria ? `[${aria.slice(0, 30)}]` : ''}${t ? ` "${t}"` : ''}`
}

function visible(el: Element, win: Window) {
  const r = el.getBoundingClientRect()
  if (r.width < 1 || r.height < 1 || r.bottom <= 0 || r.right <= 0) return false
  const s = win.getComputedStyle(el)
  if (s.visibility === 'hidden' || s.opacity === '0' || s.display === 'none') return false
  // sr-only: clipped to 1px.
  if (s.position === 'absolute' && r.width <= 1 && r.height <= 1) return false
  for (let p: Element | null = el; p; p = p.parentElement) {
    const ps = win.getComputedStyle(p)
    if (ps.opacity === '0' || ps.display === 'none') return false
    // Inside an sr-only box (1px, clipped): not on screen.
    const pr = p.getBoundingClientRect()
    if (p !== el && pr.width <= 1 && pr.height <= 1 && ps.overflow === 'hidden') return false
  }
  return true
}

function painted(el: Element, win: Window) {
  const s = win.getComputedStyle(el)
  const bg = s.backgroundColor !== 'rgba(0, 0, 0, 0)' && s.backgroundColor !== 'transparent'
  // A row's separator is drawn as a background image by `.divide-y` (app/globals.css); that is not a painted shape.
  const img = s.backgroundImage !== 'none' && !el.parentElement?.classList.contains('divide-y')
  const border = parseFloat(s.borderLeftWidth) > 0 && s.borderLeftColor !== 'rgba(0, 0, 0, 0)' && s.borderLeftStyle !== 'none'
  return bg || img || border
}

function ownText(el: Element) {
  return [...el.childNodes].some((n) => n.nodeType === 3 && (n.textContent ?? '').trim())
}

/** Visual atoms inside a container: text leaves, svgs, images, inputs, and painted shapes (discs, buttons, badges). */
function atoms(root: Element, win: Window, stop: (el: Element) => boolean) {
  const out: Element[] = []
  const walk = (el: Element) => {
    for (const c of el.children) {
      if (stop(c)) continue
      // Spinning or animating content (a loading spinner) has a bounding box that swells as it turns: not a layout edge.
      if (win.getComputedStyle(c).animationName !== 'none' || c.getAttribute('role') === 'progressbar') continue
      // display: contents has no box of its own: its children take part in the layout.
      if (win.getComputedStyle(c).display === 'contents') { walk(c); continue }
      if (!visible(c, win)) continue
      const tag = c.tagName.toLowerCase()
      if (tag === 'svg' || tag === 'img' || tag === 'input' || tag === 'textarea' || c.getAttribute('role') === 'img' || painted(c, win)) { out.push(c); continue }
      if (ownText(c)) out.push(c)
      walk(c)
    }
  }
  walk(root)
  return out
}

/** What shows of an element: its rect cut by every scrolling or clipping ancestor. */
function shown(t: Element) {
  const win = t.ownerDocument.defaultView!
  const r = t.getBoundingClientRect()
  let l = r.left, tp = r.top, rt = r.right, bt = r.bottom
  for (let p = t.parentElement; p; p = p.parentElement) {
    const s = win.getComputedStyle(p)
    if (s.overflowX !== 'visible' || s.overflowY !== 'visible') { const q = p.getBoundingClientRect(); l = Math.max(l, q.left); tp = Math.max(tp, q.top); rt = Math.min(rt, q.right); bt = Math.min(bt, q.bottom) }
  }
  return { left: l, top: tp, right: rt, bottom: bt }
}

/** Where an atom's ink starts: a text atom is measured by its text (padding excluded), anything else by its box. */
function rect(el: Element) {
  if (ownText(el) && !(el.tagName === 'BUTTON' || el.getAttribute('role') === 'button')) {
    const r = el.ownerDocument.createRange()
    const nodes = [...el.childNodes].filter((n) => n.nodeType === 3 && (n.textContent ?? '').trim())
    r.setStart(nodes[0], 0)
    r.setEnd(nodes[nodes.length - 1], (nodes[nodes.length - 1].textContent ?? '').length)
    const b = r.getBoundingClientRect()
    if (b.width > 0) return b
  }
  return el.getBoundingClientRect()
}

/** Right edge of the line an atom starts: its own right and every atom beside it. */
function lineRight(a: Element, list: Element[]) {
  const ra = rect(a)
  return Math.max(...list.map(rect).filter((r) => r.top < ra.bottom - 2 && r.bottom > ra.top + 2).map((r) => r.right))
}

/** Atoms that start a line: nothing else in the set sits to their left on the same line. */
function leading(list: Element[]) {
  const rs = list.map(rect)
  // A row's lines can run above or below its centred leading icon: 30px of slack keeps them on the icon's line.
  return list.filter((_, i) => !rs.some((r, j) => j !== i && r.left < rs[i].left - 1 && r.top < rs[i].bottom + 30 && r.bottom > rs[i].top - 30))
}

export function uiCheck(doc: Document = document): Issue[] {
  const win = doc.defaultView!
  const issues: Issue[] = []
  const add = (rule: string, el: Element | null, msg: string) => issues.push({ rule, msg, where: el ? label(el) : '' })
  const layout = win.innerWidth >= 1024 ? 'web' : 'app'
  const inset = layout === 'web' ? 10 : 16
  const free = (el: Element) => !!el.closest('[data-align="free"]')

  // Overflow of the page itself.
  if (doc.documentElement.scrollWidth > win.innerWidth + 1) add('overflow', doc.documentElement, `page scrolls sideways: ${doc.documentElement.scrollWidth} > ${win.innerWidth}`)

  const roots: Element[] = [doc.getElementById('main'), ...doc.querySelectorAll('[role="dialog"],[role="alertdialog"]')].filter((x): x is Element => !!x && visible(x, win))
  for (const root of roots) {
    const rr = root.getBoundingClientRect()
    const rs = win.getComputedStyle(root)
    const colLeft = rr.left + parseFloat(rs.paddingLeft)
    // Top-level boxes only: a box inside a content box is flattened into it (app/globals.css).
    const boxes = [...root.querySelectorAll('[data-box]')].filter((b) => visible(b, win) && !b.parentElement?.closest('[data-box]'))
    const isDialog = root.getAttribute('role')?.includes('dialog')
    for (const b of boxes) {
      const br = b.getBoundingClientRect()
      if (!b.parentElement?.closest('[data-align="free"]') && !near(br.left, colLeft)) add('box-edge', b, `box starts at +${Math.round(br.left - colLeft)} from the column`)
      const list = atoms(b, win, () => false)
      for (const a of leading(list)) {
        if (free(a)) continue
        const d = rect(a).left - br.left
        // A trailing group (a default button, an action) ends on the box's content edge instead.
        const trail = d > 40 && near(lineRight(a, list), br.right - inset)
        if (!near(d, inset) && !trail) add('content-edge', a, `starts at box +${Math.round(d)} (want +${inset})`)
      }
      for (const a of list) {
        const ar = shown(a)
        if (ar.right > br.right + 1 && !free(a)) add('spill', a, `sticks out of its box by ${Math.round(ar.right - br.right)}px`)
      }
    }
    // Free content in the column (outside boxes): starts on column + inset; painted controls may sit on the column.
    const outside = atoms(root, win, (el) => el.hasAttribute('data-box') || (isDialog === true && el === root))
    for (const a of leading(outside)) {
      if (free(a) || a.tagName === 'H1') continue
      const ra = rect(a)
      const d = ra.left - colLeft
      // In a dialog the panel's own margin is the edge: its title and text start on it (macOS NSAlert, iOS sheet).
      if (isDialog && near(d, 0)) continue
      const colRight = rr.right - parseFloat(rs.paddingRight)
      // Trailing items (a footer button, an action link) end on the column edge or its inset instead.
      const lr = lineRight(a, outside)
      const trailing = near(lr, colRight) || near(lr, colRight - inset)
      // A page with no grouped boxes (onboarding, a bare step) has its edge on the column itself.
      const colW = rr.width - parseFloat(rs.paddingLeft) - parseFloat(rs.paddingRight)
      const blocky = boxes.length > 0 || outside.some((o) => { const r = o.getBoundingClientRect(); return painted(o, win) && near(r.left, colLeft) && r.width > colW * 0.4 && r.height > 100 })
      const edge = blocky ? inset : 0
      const ok = near(d, edge) || (painted(a, win) && near(d, 0)) || (trailing && ra.left - colLeft > 40)
      if (!ok) add('content-edge', a, `starts at column +${Math.round(d)} (want +${edge})`)
    }
    // Vertical rhythm between stacked blocks (boxes, and the header line right above a box).
    const blocks = [...boxes].map((b) => b.getBoundingClientRect()).sort((a, b) => a.top - b.top)
    for (let i = 1; i < blocks.length; i++) {
      const gap = blocks[i].top - blocks[i - 1].bottom
      if (gap < 0 || gap > 120) continue
      // Anything between the two boxes? Then the gap is box→header→box, checked as header→box below.
      const between = outside.some((a) => { const r = a.getBoundingClientRect(); return r.top >= blocks[i - 1].bottom - 1 && r.bottom <= blocks[i].top + 1 })
      if (!between && !GAPS[layout].some((g) => near(gap, g, 1.5))) add('gap', null, `${Math.round(gap)}px between boxes at y=${Math.round(blocks[i].top)} (tokens ${GAPS[layout].join('/')})`)
    }
  }

  // Type scale, clipping, line height.
  const texts = [...doc.body.querySelectorAll('*')].filter((e) => ownText(e) && visible(e, win) && !e.closest('[data-align="free"]') && !e.closest('nextjs-portal'))
  const sizes = TYPE[layout]
  for (const t of texts) {
    const s = win.getComputedStyle(t)
    const fs = parseFloat(s.fontSize)
    if (!sizes.some((x) => near(fs, x, 0.5))) add('type', t, `font-size ${fs}px off the ${layout} scale`)
    const lh = parseFloat(s.lineHeight)
    if (lh && lh / fs < 1.18) add('leading', t, `line-height ${lh}/${fs} too tight for Vietnamese diacritics`)
    const clipped = (t.scrollWidth > t.clientWidth + 1 && s.textOverflow !== 'ellipsis' && s.overflowX !== 'visible') || (t.scrollHeight > t.clientHeight + 2 && s.overflowY !== 'visible' && s.webkitLineClamp === 'none')
    if (clipped) add('clip', t, 'text is cut off')
  }
  // Overlapping text.
  // Bars (tab bar, toolbar, nav bar) float over scrolling content by design: leave them out.
  const floating = (el: Element) => { for (let p: Element | null = el; p; p = p.parentElement) { const pos = win.getComputedStyle(p).position; if (pos === 'fixed' || pos === 'sticky') return true } return false }
  // With a modal open, the page behind it is covered: only the dialog's own text can collide.
  const modal = [...doc.querySelectorAll('[aria-modal="true"],[role="dialog"],[role="alertdialog"],[role="menu"]')].filter((d) => visible(d, win))
  const inModal = (t: Element) => modal.some((d) => d.contains(t))
  const rects = texts.filter((t) => !floating(t) && (!modal.length || inModal(t))).map((t) => [t, shown(t)] as const)
  for (let i = 0; i < rects.length; i++) for (let j = i + 1; j < rects.length; j++) {
    const [a, ra] = rects[i], [b, rb] = rects[j]
    if (a.contains(b) || b.contains(a)) continue
    const w = Math.min(ra.right, rb.right) - Math.max(ra.left, rb.left), h = Math.min(ra.bottom, rb.bottom) - Math.max(ra.top, rb.top)
    if (w > 2 && h > 2) add('overlap', a, `overlaps ${label(b)}`)
  }
  // App touch targets.
  if (layout === 'app') {
    const hits = doc.querySelectorAll('button,a[href],[role="button"],[role="link"],[role="tab"],[role="radio"],[role="switch"],[role="checkbox"],input:not([type="hidden"]),textarea')
    for (const h of hits) {
      if (!visible(h, win) || win.getComputedStyle(h).display === 'inline') continue
      if (h.closest('nextjs-portal')) continue
      // A native radio or checkbox is hit through its labelled row.
      const row = h.matches('input') ? h.closest('label,[role="radio"],[role="checkbox"],[role="switch"]') : null
      const r = (row ?? h).getBoundingClientRect()
      if (r.width < 43.5 || r.height < 43.5) add('target', h, `${Math.round(r.width)}×${Math.round(r.height)} under 44×44`)
    }
  }
  // Console errors since load (uiCheck runs once per page load in __uiCheckAll).
  for (const e of new Set(consoleErrors.splice(0))) add('console', null, e)
  // Broken images.
  for (const img of doc.querySelectorAll('img')) if (visible(img, win) && img.complete && img.naturalWidth === 0) add('image', img, 'image failed to load')
  return issues
}

export async function axeCheck(doc: Document = document): Promise<Issue[]> {
  const r = await axe.run(doc, { runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'] }, resultTypes: ['violations'] })
  return r.violations.flatMap((v) => v.nodes.map((n) => ({ rule: `axe:${v.id}`, msg: v.help, where: String(n.target[0]).slice(0, 90) + ' ' + (n.failureSummary ?? '').split('\n')[1]?.trim().slice(0, 90) })))
}

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms))

/** Loads each route in an iframe of `width` in colour `mode` and returns issues per route. */
/**
 * A scripted state: load `route`, run `steps` in the frame the way a person would, and check at every `check`.
 * Steps: { click: text } presses the visible control whose text or aria-label is exactly `text` (inside an open dialog
 * first); { fill: [css, value] } types into a field; { key } presses a key on the focused element; { wait: ms };
 * { store: [fn, ...args] } calls a dev store hook (setSetting, setScenario, reset, resolvePending); { check: label }.
 */
export type Step = { click: string; optional?: boolean } | { fill: [string, string] } | { key: string } | { wait: number } | { store: [string, ...unknown[]] } | { check: string }
export type Scenario = { name: string; route: string; steps: Step[] }

function press(el: Element) {
  const o = { bubbles: true, cancelable: true, composed: true, button: 0, pointerId: 1, pointerType: 'mouse', isPrimary: true }
  const V = el.ownerDocument.defaultView as Window & typeof globalThis
  el.dispatchEvent(new V.PointerEvent('pointerdown', o)); el.dispatchEvent(new V.MouseEvent('mousedown', o))
  el.dispatchEvent(new V.PointerEvent('pointerup', o)); el.dispatchEvent(new V.MouseEvent('mouseup', o))
  ;(el as HTMLElement).click()
}

function findControl(doc: Document, text: string) {
  const win = doc.defaultView!
  const sel = 'button,a[href],[role="button"],[role="link"],[role="radio"],[role="tab"],[role="menuitem"],[role="switch"],[role="option"],label,input[type="radio"]'
  const dialogs = [...doc.querySelectorAll('[role="dialog"],[role="alertdialog"],[role="menu"]')].filter((d) => visible(d, win))
  // Open dialogs first, then the page content, then everything (sidebar, bars).
  const main = doc.getElementById('main')
  const scopes: ParentNode[] = [...dialogs.reverse(), ...(main ? [main] : []), doc]
  for (const scope of scopes) {
    const all = [...scope.querySelectorAll(sel)].filter((el) => visible(el, win))
    const norm = (el: Element) => (el.textContent ?? '').trim().replace(/\s+/g, ' ')
    // Exact text or label first; then a composite control (row, option card) whose text starts with it.
    const hit = all.find((el) => norm(el) === text || el.getAttribute('aria-label') === text) ?? all.find((el) => norm(el).startsWith(text))
      ?? all.filter((el) => norm(el).includes(text)).sort((a, b) => norm(a).length - norm(b).length)[0]
    if (hit) return hit
  }
  return null
}

function fill(doc: Document, css: string, value: string) {
  const el = doc.querySelector<HTMLInputElement | HTMLTextAreaElement>(css)
  if (!el) return false
  const V = doc.defaultView as Window & typeof globalThis
  const proto = el instanceof V.HTMLTextAreaElement ? V.HTMLTextAreaElement.prototype : V.HTMLInputElement.prototype
  el.focus()
  Object.getOwnPropertyDescriptor(proto, 'value')!.set!.call(el, value)
  el.dispatchEvent(new V.Event('input', { bubbles: true }))
  el.dispatchEvent(new V.Event('change', { bubbles: true }))
  return true
}

/** Loads each route (or scenario) in an iframe of `width` in colour `mode` and returns issues per route or check. */
export async function uiCheckAll({ routes, width, height = 900, mode, axeOn = true }: { routes: (string | Scenario)[]; width: number; height?: number; mode: 'light' | 'dark'; axeOn?: boolean }) {
  const KEY = 'wallet.theme'
  const saved = localStorage.getItem(KEY)
  // Scenarios change the demo data (scenario, outcome): put the viewer's data back afterwards.
  const savedState = localStorage.getItem('wallet.state.v1')
  const prefs = { ...(saved ? JSON.parse(saved) : {}), mode }
  localStorage.setItem(KEY, JSON.stringify(prefs))
  const frame = document.createElement('iframe')
  frame.style.cssText = `position:fixed;left:-${width + 50}px;top:0;width:${width}px;height:${height}px;border:0;`
  document.body.appendChild(frame)
  const out: Record<string, Issue[]> = {}
  const check = async (label: string) => {
    const fw = frame.contentWindow as Window
    // Let opening and closing animations (sheets, menus) finish: a half-faded panel is not the state a person sees.
    for (let i = 0; i < 20; i++) {
      const running = frame.contentDocument!.getAnimations().filter((a) => a.playState === 'running' && a.effect?.getTiming().iterations !== Infinity)
      if (!running.length) break
      await wait(100)
    }
    const issues = fw.__uiCheck ? fw.__uiCheck() : [{ rule: 'harness', msg: 'checker not loaded in frame', where: label }]
    if (axeOn && fw.__axeCheck) issues.push(...(await fw.__axeCheck()))
    out[label] = issues
  }
  const load = async (route: string) => {
    frame.src = route
    await new Promise((r) => (frame.onload = r))
    await wait(1600)
    // The checker loads by dynamic import: give a slow frame a moment more.
    for (let i = 0; i < 10 && !(frame.contentWindow as Window).__uiCheck; i++) await wait(300)
  }
  try {
    for (const item of routes) {
      if (typeof item === 'string') { await load(item); await check(item); continue }
      await load(item.route)
      // Setup (store steps) first, then load the route again so it renders from that state (redirects included).
      const lead = item.steps.findIndex((s) => !('store' in s) && !('wait' in s))
      const setup = lead < 0 ? item.steps : item.steps.slice(0, lead)
      for (const s of setup) if ('store' in s) { const [fn, ...args] = s.store; ((frame.contentWindow as Window).__store as Record<string, (...a: unknown[]) => void>)[fn](...args) }
      if (setup.length) await load(item.route)
      for (const step of lead < 0 ? [] : item.steps.slice(lead)) {
        const fw = frame.contentWindow as Window
        const doc = frame.contentDocument!
        if ('check' in step) { await check(`${item.name} › ${step.check}`); continue }
        if ('wait' in step) { await wait(step.wait); continue }
        if ('store' in step) { const [fn, ...args] = step.store; (fw.__store as Record<string, (...a: unknown[]) => void>)[fn](...args); await wait(400); continue }
        if ('fill' in step) { if (!fill(doc, step.fill[0], step.fill[1])) (out[`${item.name} › harness`] ??= []).push({ rule: 'harness', msg: `no field ${step.fill[0]}`, where: item.name }); await wait(400); continue }
        if ('key' in step) { const el = doc.activeElement ?? doc.body; const V = fw as Window & typeof globalThis; el.dispatchEvent(new V.KeyboardEvent('keydown', { key: step.key, bubbles: true })); el.dispatchEvent(new V.KeyboardEvent('keyup', { key: step.key, bubbles: true })); await wait(500); continue }
        const el = findControl(doc, step.click)
        if (!el) { if (step.optional) continue; (out[`${item.name} › harness`] ??= []).push({ rule: 'harness', msg: `no control "${step.click}"`, where: item.name }); break }
        press(el)
        await wait(900)
      }
    }
  } finally {
    frame.remove()
    if (saved) localStorage.setItem(KEY, saved); else localStorage.removeItem(KEY)
    if (savedState) localStorage.setItem('wallet.state.v1', savedState)
  }
  return out
}

declare global { interface Window { __uiCheck?: typeof uiCheck; __uiCheckAll?: typeof uiCheckAll; __axeCheck?: typeof axeCheck; __store?: unknown; __uiScenarios?: Scenario[]; __uiDo?: unknown } }
if (typeof window !== 'undefined') Object.assign(window, { __uiCheck: uiCheck, __uiCheckAll: uiCheckAll, __axeCheck: axeCheck, __store: { setSetting, setScenario, reset, resolvePending, signOut }, __uiScenarios: SCENARIOS, __uiDo: { press, fill, findControl } })
