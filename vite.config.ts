import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { fileURLToPath } from 'node:url'
import { parse } from 'yaml'

/** Parse `*.yaml?json` at build time so the YAML parser never ships to the browser (it was ~1/3 of the entry chunk). */
const yamlAsJson = {
  name: 'yaml-as-json',
  load(id: string) {
    if (!id.endsWith('.yaml?json')) return null
    return import('node:fs').then((fs) => `export default ${JSON.stringify(parse(fs.readFileSync(id.slice(0, -'?json'.length), 'utf8')))}`)
  },
}

export default defineConfig({
  plugins: [react(), tailwindcss(), yamlAsJson],
  resolve: { alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) } },
  server: { port: 5173, fs: { allow: ['.'] } },
  test: { environment: 'jsdom', globals: true, setupFiles: ['src/test/setup.ts'], exclude: ['**/node_modules/**', '**/._*'] },
})
