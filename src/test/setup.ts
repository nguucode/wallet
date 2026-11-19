import '@testing-library/jest-dom/vitest'
import Module from 'node:module'

// CommonJS deps (nativewind, react-native-svg) `require('react-native')` outside Vite's alias; point them at react-native-web too.
const M = Module as unknown as { _resolveFilename: (req: string, ...rest: unknown[]) => string }
const resolve = M._resolveFilename
M._resolveFilename = function (req, ...rest) { return resolve.call(this, req === 'react-native' ? 'react-native-web' : req, ...rest) }

// jsdom has no matchMedia; reanimated reads it at import. Nothing matches, as before (layout falls back to 'app').
window.matchMedia ??= ((query: string) => ({ matches: false, media: query, onchange: null, addListener() {}, removeListener() {}, addEventListener() {}, removeEventListener() {}, dispatchEvent: () => false })) as typeof window.matchMedia
