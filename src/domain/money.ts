/** VND has no minor unit: amounts are whole đồng. */
export function formatVnd(amount: number, opts: { sign?: 'in' | 'out' } = {}): string {
  const body = Math.abs(Math.round(amount)).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.') + ' ₫'
  return opts.sign === 'in' ? '+' + body : opts.sign === 'out' ? '−' + body : body
}

export function parseVndInput(raw: string): number {
  const digits = raw.replace(/\D/g, '')
  return digits ? Number(digits) : 0
}
