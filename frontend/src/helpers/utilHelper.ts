export function toLookup<T>(array: T[], key: string): ILookup<T> {
  return array.reduce((obj, item) => ({ ...obj, [item[key]]: item }), {})
}

export const currencyFormatter = (currency?: string, value?: number) => {
  if (!currency || !value) return '-'
  const result = new Intl.NumberFormat('en-US', {
    currency,
    style: 'currency',
    minimumFractionDigits: 2,
  }).format(Math.abs(value / 100))

  if (value < 0) return `(${result})`
  return result
}
