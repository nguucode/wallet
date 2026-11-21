import { useEffect, useSyncExternalStore } from 'react'

/**
 * Web toolbar (macOS): a page may put a back button, its own title and a close button into the shell's toolbar, as
 * HIG Toolbars asks ("Elements that let people return to the previous document" at the leading edge, then the title).
 */
export type ToolbarNav = { title?: string; onBack?: () => void; onClose?: () => void }

let nav: ToolbarNav = {}
const listeners = new Set<() => void>()
const emit = () => listeners.forEach((l) => l())

export function useToolbarState(): ToolbarNav {
  return useSyncExternalStore((cb) => { listeners.add(cb); return () => listeners.delete(cb) }, () => nav, () => nav)
}

/** Registers toolbar items for as long as the calling page is mounted (pass `active: false` on the app layout). */
export function useToolbarNav(next: ToolbarNav, active = true) {
  const { title, onBack, onClose } = next
  useEffect(() => {
    if (!active) return
    nav = { title, onBack, onClose }
    emit()
    return () => { nav = {}; emit() }
  }, [active, title, onBack, onClose])
}
