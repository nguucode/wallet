import { useSyncExternalStore } from 'react'

const QUERY = '(min-width: 1024px)'
const mq = typeof window !== 'undefined' && window.matchMedia ? window.matchMedia(QUERY) : null

/** Layout depends only on viewport width (rules.md#spec-conventions). */
export function useLayout(): 'web' | 'app' {
  return useSyncExternalStore(
    (cb) => { mq?.addEventListener('change', cb); return () => mq?.removeEventListener('change', cb) },
    () => (mq?.matches ? 'web' : 'app'),
    () => 'web',
  )
}

export const inFrame = typeof window !== 'undefined' && window.self !== window.top
