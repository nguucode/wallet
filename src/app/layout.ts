import { useSyncExternalStore } from 'react'

const QUERY = '(min-width: 1024px)'
const mq = typeof window !== 'undefined' && window.matchMedia ? window.matchMedia(QUERY) : null

/** The element that scrolls page content: the web content panel, else the window. */
export const pageScroller = () => {
  const el = typeof document === 'undefined' ? null : document.getElementById('main-scroll')
  return { get y() { return el ? el.scrollTop : window.scrollY }, to: (y: number) => (el ? el.scrollTo(0, y) : window.scrollTo(0, y)) }
}

/** Layout depends only on viewport width (rules.md#spec-conventions). */
export function useLayout(): 'web' | 'app' {
  return useSyncExternalStore(
    (cb) => { mq?.addEventListener('change', cb); return () => mq?.removeEventListener('change', cb) },
    () => (mq?.matches ? 'web' : 'app'),
    () => 'web',
  )
}

