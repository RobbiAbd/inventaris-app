export function formatRupiah(value: string | number | null | undefined) {
  if (value == null || value === '') return '-'
  const amount = typeof value === 'string' ? Number(value) : value
  if (Number.isNaN(amount)) return '-'
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0
  }).format(amount)
}

export function formatCurrencyInput(value: number | null | undefined) {
  if (value == null || Number.isNaN(value)) return ''
  return new Intl.NumberFormat('id-ID', {
    maximumFractionDigits: 0
  }).format(value)
}

export function parseCurrencyInput(value: string) {
  const digits = value.replace(/\D/g, '')
  if (!digits) return undefined
  const parsed = Number(digits)
  return Number.isNaN(parsed) ? undefined : parsed
}
