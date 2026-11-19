import data from '../../spec/ia/sitemap.yaml?json'

export type NavItem = { id: string; label: string; route?: string; priority?: string; demo?: boolean; badge?: string; emphasis?: string; menu?: string[]; note?: string }
export type NavGroup = { group: string; items: NavItem[] }
export type Screen = { id: string; route: string; title: string; steps?: string[]; priority?: string; shell?: string; demo?: boolean }
type Sitemap = { sidebarFooter: NavItem[]; tabBar: NavItem[]; sidebar: (NavItem | NavGroup)[]; screens: Screen[] }

export const sitemap = data as Sitemap

const p0 = (i: { priority?: string }) => i.priority !== 'P1'
export const sidebar = sitemap.sidebar
  .map((x) => ('group' in x ? { ...x, items: x.items.filter(p0) } : x))
  .filter((x) => ('group' in x ? x.items.length > 0 : p0(x)))
export const tabBar = sitemap.tabBar.filter(p0)
export const sidebarFooter = sitemap.sidebarFooter.filter(p0)

/** Match a concrete path to its sitemap screen (":param" segments match anything). */
export function screenFor(path: string): Screen | undefined {
  const parts = path.split('?')[0].split('/').filter(Boolean)
  return sitemap.screens.find((s) => {
    if (s.route === '*') return false
    const sp = s.route.split('?')[0].split('/').filter(Boolean)
    return sp.length === parts.length && sp.every((seg, i) => seg.startsWith(':') || seg === parts[i])
  })
}

const TAB_ROOTS = ['/home', '/history', '/pay/scan', '/notifications', '/me']
export const isTabRoot = (path: string) => TAB_ROOTS.includes(path)
