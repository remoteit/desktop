import { REGEX_VALID_IP } from '../constants'

// One comparator behind every alphabetical sort in the UI, so "alphabetical" means the same
// thing everywhere: numeric so device2 sorts before device10, base sensitivity so case and
// accents don't split otherwise equal names. Held as a collator because localeCompare with an
// options object builds a new one on every call.
const collator = new Intl.Collator(undefined, { numeric: true, sensitivity: 'base' })

export function alphaSort(a: string = '', b: string = '') {
  return collator.compare(a, b)
}

export function byName<T extends { name?: string }>(a: T, b: T) {
  return alphaSort(a.name, b.name)
}

// The counterpart to alphaSort for time: one comparator behind every "most recent first" sort,
// so recency means the same thing everywhere. Missing or unparseable dates fall back to the
// epoch so they sort last, rather than returning NaN and silently comparing as equal.
function timeOf(date?: ISOTimestamp | number | Date) {
  const time = date ? new Date(date).getTime() : NaN
  return Number.isNaN(time) ? 0 : time
}

// Newest first
export function dateSort(a?: ISOTimestamp | number | Date, b?: ISOTimestamp | number | Date) {
  return timeOf(b) - timeOf(a)
}

export function byNewest<T extends { updated?: ISOTimestamp }>(a: T, b: T) {
  return dateSort(a.updated, b.updated)
}

export function toLookup<T>(array: T[], key: string): ILookup<T> {
  return array.reduce((obj, item) => ({ ...obj, [item[key]]: item }), {})
}

export function dedupe<T>(collection: T[], id: string) {
  let keys: string[] = []
  return collection.reduce((result: T[], item) => {
    if (!keys.includes(item[id])) result.push(item)
    keys.push(item[id])
    return result
  }, [])
}

export function pickTruthy(keys: string[], object: object) {
  return keys.reduce((result, key) => {
    if (object[key]) result[key] = object[key]
    return result
  }, {})
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

export const tagsInclude = (haystack: ILookup<any>[], needle: string) =>
  !!haystack.find(h => h.name.toLowerCase() === needle.toLowerCase())

export const mergeTags = (legacy: ITag[], tags: ITag[]) => {
  const unique = legacy.filter(l => findTagIndex(tags, l.name) === -1) || []
  return tags.concat(unique)
}

export function containsIpAddress(url: URL): boolean {
  return REGEX_VALID_IP.test(url.hostname)
}

// Remove an object from an array by object value and return it without modifying the original array
export function removeObject<T>(array: T[], callback: (item: T) => boolean): [T | undefined, T[]] {
  const index = array.findIndex(callback)

  if (index !== -1) {
    const newArray = [...array]
    const [removedElement] = newArray.splice(index, 1)
    return [removedElement, newArray]
  }

  return [undefined, array]
}

export function removeObjectAttribute<T, K extends keyof T>(obj: T, key: K): Omit<T, K> {
  const { [key]: _, ...rest } = obj
  return rest
}


export function createMemoDebugger(componentName) {
  return (prevProps, nextProps) => {
    Object.keys(prevProps).forEach(key => {
      if (prevProps[key] !== nextProps[key]) {
        console.log(`[${componentName}] ${key} prop changed`)
      }
    })
    return Object.keys(prevProps).every(key => prevProps[key] === nextProps[key])
  }
}

export function containsNonPrintableChars(text: string): boolean {
  const nonPrintableCharLimit = 0.1 // Allow 10% of non-printable chars max
  let nonPrintableCount = 0

  for (let i = 0; i < text.length; i++) {
    const charCode = text.charCodeAt(i)
    // Consider characters below 32, except common text ones like tab, newline, carriage return as non-printable
    if (charCode < 32 && ![9, 10, 13].includes(charCode)) {
      nonPrintableCount++
    }
  }

  // Calculate the ratio of non-printable characters in the text
  return nonPrintableCount / text.length > nonPrintableCharLimit
}
