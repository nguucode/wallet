import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import { fileURLToPath } from 'node:url'
import { parse } from 'yaml'

/** Vitest only (the app builds with Next). `*.yaml?json` is parsed at load time, as the Next loader does. */
const yamlAsJson = {
  name: 'yaml-as-json',
  load(id: string) {
    if (!id.endsWith('.yaml?json')) return null
    return import('node:fs').then((fs) => `export default ${JSON.stringify(parse(fs.readFileSync(id.slice(0, -'?json'.length), 'utf8')))}`)
  },
}

export default defineConfig({
  // Plain React JSX in tests (tsconfig says nativewind for the Next build).
  plugins: [react({ jsxImportSource: 'react' }), yamlAsJson],
  oxc: { jsx: { importSource: 'react' } },
  define: { __DEV__: 'true', global: 'globalThis' },
  resolve: {
    alias: [
      { find: '@', replacement: fileURLToPath(new URL('./src', import.meta.url)) },
      { find: /^react-native$/, replacement: 'react-native-web' },
      { find: /^nativewind$/, replacement: fileURLToPath(new URL('./src/test/nativewind-stub.ts', import.meta.url)) },
      { find: /^react-native-safe-area-context$/, replacement: 'react-native-safe-area-context/lib/module/index.js' },
      { find: /^react-native-svg$/, replacement: 'react-native-svg/lib/module/ReactNativeSVG.web.js' },
    ],
    // gluestack ships `.web.tsx` variants (plain DOM) next to the native ones.
    extensions: ['.web.tsx', '.web.ts', '.web.js', '.tsx', '.ts', '.jsx', '.js', '.mjs', '.json'],
  },
  test: {
    environment: 'jsdom', globals: true, setupFiles: ['src/test/setup.ts'], exclude: ['**/node_modules/**', '**/._*'],
    server: { deps: { inline: [/@gluestack-ui/, /@expo\/html-elements/, /@legendapp/, /react-native-reanimated/, /react-native-worklets/, /react-native-svg/, /react-native-safe-area-context/] } },
  },
})
