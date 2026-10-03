// The plans' proxy and exit limits as graphql gives them (proxyLimits): a plan of null is the default row — an
// account with no plan's, and the rate one over its month's transfer slows to.
export type ProxyLimitRow = { plan: string | null; name: string; value: number | null; scale: number | null }
export type ProxyLimits = { names: string[]; plans: string[]; rows: ProxyLimitRow[] }

export const LIMIT_LABELS: Record<string, { label: string; unit?: string; toggle?: boolean }> = {
  'proxy-rate': { label: 'Endpoint rate', unit: 'Mbit/s' },
  'proxy-transfer': { label: 'Endpoint transfer', unit: 'GB/month' },
  'proxy-exit': { label: "remote.it's exits", toggle: true },
  'exit-rate': { label: 'Exit rate', unit: 'Mbit/s' },
  'exit-transfer': { label: 'Exit transfer', unit: 'GB/month' },
}

export const findRow = (limits: ProxyLimits, plan: string | null, name: string) =>
  limits.rows.find(row => row.plan === plan && row.name === name)

// A row's value as read: a number, with what each license adds; "no limit" for an empty value.
export function valueLabel(name: string, value: number | null, scale: number | null): string {
  if (value === null) return 'no limit'
  if (LIMIT_LABELS[name]?.toggle) return value > 0 ? 'on' : 'off'
  return scale ? `${value} + ${scale} a license` : String(value)
}

// What a plan has for a limit: its own row, or the default's when it has none ("default (…)").
export function cellLabel(
  limits: ProxyLimits,
  plan: string | null,
  name: string
): { text: string; inherited: boolean } {
  const own = findRow(limits, plan, name)
  if (own) return { text: valueLabel(name, own.value, own.scale), inherited: false }
  const fallback = plan === null ? undefined : findRow(limits, null, name)
  return { text: fallback ? `default (${valueLabel(name, fallback.value, null)})` : 'no limit', inherited: true }
}
