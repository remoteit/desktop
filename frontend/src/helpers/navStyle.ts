export type NavStyle = 'a' | 'b' | 'b2' | 'b3' | 'c' | 'c2' | 'd' | 'e'

const KEY = 'navstyle'
const STYLES: NavStyle[] = ['a', 'b', 'b2', 'b3', 'c', 'c2', 'd', 'e']

function read(): NavStyle {
  const query = window.location.search + '&' + (window.location.hash.split('?')[1] || '')
  const asked = new URLSearchParams(query).get(KEY) as NavStyle | null
  try {
    if (asked && STYLES.includes(asked)) window.localStorage.setItem(KEY, asked)
    const kept = window.localStorage.getItem(KEY) as NavStyle | null
    return kept && STYLES.includes(kept) ? kept : 'a'
  } catch {
    return asked && STYLES.includes(asked) ? asked : 'a'
  }
}

export const NAV_STYLE: NavStyle = read()
