import { withGluestackUI } from '@gluestack/ui-next-adapter'
import { fileURLToPath } from 'node:url'

/** Static export (Cloudflare Pages). The app is a client-side SPA under app/[[...slug]]; `npm run build` deletes out/404.html so Pages falls back to index.html for every path (its SPA mode), and writes
 * out/_next/404.html so a missing build asset is a real 404 (Pages uses the nearest 404.html): otherwise, while a deploy
 * propagates, a chunk request gets index.html, the browser caches it as the script for 4 h, and the page stays blank. */
const nextConfig = {
  // Export only for the build; `next dev` must serve every client path through the catch-all.
  output: process.env.NODE_ENV === 'production' ? 'export' : undefined,
  trailingSlash: false,
  images: { unoptimized: true },
  eslint: { ignoreDuringBuilds: true },
  // `npm run typecheck` (tsc) is the type gate; Next's own pass would duplicate it.
  typescript: { ignoreBuildErrors: true },
  transpilePackages: [],
  outputFileTracingRoot: fileURLToPath(new URL('.', import.meta.url)),
  webpack(config, { webpack }) {
    // react-native-reanimated (used by gluestack Modal, Menu, Toast) reads the Node-style `global`.
    config.plugins.push(new webpack.DefinePlugin({ global: 'globalThis' }))
    config.module.rules.push({ resourceQuery: /json/, test: /\.ya?ml$/, type: 'javascript/auto', use: fileURLToPath(new URL('./scripts/yaml-json-loader.cjs', import.meta.url)) })
    return config
  },
}

export default withGluestackUI(nextConfig)
