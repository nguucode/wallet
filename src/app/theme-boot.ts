// Server-safe (no React): the layout inlines MODE_BOOT in <head>; src/app/theme.ts owns the rest.
import { script } from '@/components/ui/gluestack-ui-provider/script'

export const THEME_KEY = 'wallet.theme'

/** Inline <head> script: read the stored mode, then run gluestack's own colour-mode script before first paint. */
export const MODE_BOOT = `(function(){var m='system';try{m=JSON.parse(localStorage.getItem('${THEME_KEY}')||'{}').mode||'system'}catch(e){}if(['system','light','dark'].indexOf(m)<0)m='system';(${script.toString()})(m)})()`
