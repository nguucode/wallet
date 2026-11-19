// run axe-core (WCAG 2.2 A/AA) against each route in headless Chrome and print the violations.
// Usage: [SCHEME=dark] [PORT=5174] node scripts/a11y.mjs <width>x<height> <path> [<path> ...]   (dev server on :5174 by default)
// Needs the dev server on :5174 and Google Chrome installed.
import { spawn } from 'node:child_process'
import { mkdtempSync, readFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

const [size, ...paths] = process.argv.slice(2)
const [width, height] = size.split('x').map(Number)
const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
const port = 9300 + Math.floor(Math.random() * 500)
const chrome = spawn(CHROME, ['--headless=new', '--disable-gpu', '--hide-scrollbars', `--remote-debugging-port=${port}`, `--user-data-dir=${mkdtempSync(join(tmpdir(), 'cap-'))}`, 'about:blank'], { stdio: 'ignore' })
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

let target
for (let i = 0; i < 50 && !target; i++) {
  await sleep(200)
  target = await fetch(`http://127.0.0.1:${port}/json/list`).then((r) => r.json()).then((l) => l.find((t) => t.type === 'page')).catch(() => null)
}
const ws = new WebSocket(target.webSocketDebuggerUrl)
await new Promise((r) => ws.addEventListener('open', r))
let seq = 0
const pending = new Map()
ws.addEventListener('message', (e) => {
  const m = JSON.parse(e.data)
  if (m.id && pending.has(m.id)) pending.get(m.id)(m.result), pending.delete(m.id)
})
const send = (method, params = {}) => new Promise((r) => { const id = ++seq; pending.set(id, r); ws.send(JSON.stringify({ id, method, params })) })

await send('Page.enable')
await send('Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor: 1, mobile: width < 640 })
await send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-color-scheme', value: process.env.SCHEME === 'dark' ? 'dark' : 'light' }] })
const axe = readFileSync(new URL('../node_modules/axe-core/axe.min.js', import.meta.url), 'utf8')
let total = 0
for (const path of paths) {
  await send('Page.navigate', { url: `http://localhost:${process.env.PORT || 5174}${path}` })
  for (let i = 0; i < 40; i++) {
    await sleep(250)
    const r = await send('Runtime.evaluate', { expression: 'document.querySelector("main")?.innerText.length ?? 0', returnByValue: true })
    if (r?.result?.value > 20) break
  }
  await sleep(500)
  await send('Runtime.evaluate', { expression: axe })
  const r = await send('Runtime.evaluate', {
    expression: `axe.run(document, { runOnly: ['wcag2a','wcag2aa','wcag21a','wcag21aa','wcag22aa'] }).then(r => r.violations.map(v => ({ id: v.id, impact: v.impact, n: v.nodes.length, help: v.help, targets: v.nodes.slice(0, 3).map(n => n.target.join(' ')) })))`,
    awaitPromise: true,
    returnByValue: true,
  })
  const v = r?.result?.value ?? []
  total += v.length
  console.log(`\n${path}: ${v.length ? v.length + ' violation(s)' : 'clean'}`)
  for (const x of v) console.log(`  [${x.impact}] ${x.id} ×${x.n}: ${x.help}\n      ${x.targets.join('\n      ')}`)
}
ws.close()
chrome.kill()
process.exitCode = total ? 1 : 0
