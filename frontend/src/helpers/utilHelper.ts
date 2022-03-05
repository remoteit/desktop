export function toLookup<T>(array: T[], key: string): ILookup<T> {
  return array.reduce((obj, item) => ({ ...obj, [item[key]]: item }), {})
}

export const currencyFormatter = (currency?: string, value?: number, digits: number = 2) => {
  if (!currency || !value) return '-'
  const result = new Intl.NumberFormat('en-US', {
    currency,
    style: 'currency',
    minimumFractionDigits: digits,
  }).format(Math.abs(value / 100))

  if (value < 0) return `(${result})`
  return result
}

export const findTagIndex = (haystack: ILookup<any>[], needle: string) =>
  haystack.findIndex(h => h.name.toLowerCase() === needle.toLowerCase())

export const mergeTags = (legacy: ITag[], tags: ITag[]) => {
  const unique = legacy.filter(l => findTagIndex(tags, l.name) === -1) || []
  return tags.concat(unique)
}
