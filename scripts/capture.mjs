// Review captures through the Chrome DevTools Protocol, so mobile widths below headless Chrome's ~500px window minimum work.
// Usage: node scripts/capture.mjs <outDir> <width>x<height> <name>=<path> [<name>=<path> ...]
// Needs the dev server on :5174 and Google Chrome installed.
import { spawn } from 'node:child_process'
import { mkdtempSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

const [outDir, size, ...shots] = process.argv.slice(2)
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
await send('Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor: 2, mobile: width < 640 })
for (const shot of shots) {
  const [name, path] = shot.split(/=(.*)/s)
  await send('Page.navigate', { url: `http://localhost:5174${path}` })
  // The dataset loads with a top-level await; wait for the app to paint real content.
  for (let i = 0; i < 40; i++) {
    await sleep(250)
    const r = await send('Runtime.evaluate', { expression: 'document.querySelector("main")?.innerText.length ?? 0', returnByValue: true })
    if (r?.result?.value > 20) break
  }
  await sleep(400)
  const { data } = await send('Page.captureScreenshot', { format: 'png' })
  writeFileSync(join(outDir, `${name}.png`), Buffer.from(data, 'base64'))
  console.log('captured', name)
}
ws.close()
chrome.kill()
