/** Shared display formats (rules.md#spec-conventions: 17/11/2026, 14:05, 0901 234 567, •••• 6789). */
const TZ = 'Asia/Ho_Chi_Minh'
export const fmtTime = (iso: string | Date) => new Date(iso).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', timeZone: TZ })
export const fmtDate = (iso: string | Date) => new Date(iso).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric', timeZone: TZ })
export const fmtDateTime = (iso: string | Date) => `${fmtTime(iso)} · ${fmtDate(iso)}`
export const formatPhone = (p: string) => p.replace(/\D/g, '').replace(/^(\d{4})(\d{3})(\d+)$/, '$1 $2 $3')
export const maskPhone = (p: string) => p.replace(/\D/g, '').replace(/^(\d{4})(\d{3})(\d+)$/, (_, a, _b, c) => `${a} ••• ${c.slice(-3)}`)
/** Account, card or customer code: last 4 visible. */
export const maskAccount = (a: string) => `•••• ${a.slice(-4)}`
/** CCCD keeps its real 12-digit length: 001*******45. */
export const maskId = (id: string) => id.slice(0, 3) + '*'.repeat(Math.max(0, id.length - 5)) + id.slice(-2)
/** Countdown seconds as mm:ss. */
export const mmss = (s: number) => `${String(Math.floor(Math.max(0, s) / 60)).padStart(2, '0')}:${String(Math.max(0, s) % 60).padStart(2, '0')}`
