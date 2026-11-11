/* How many of an exit's devices carry its flows (graphql-api docs/PROXY-GROUPS.md §13, Exit.serving): an exit is run by
   one device or several, and remote.it picks the one each new connection goes through — so someone choosing an exit,
   who cannot see its devices (Exit.devices is its managers'), is told how many run it and how they stand. Counted as
   the pick weighs them: `devices` running it (retired ones not), `carrying` its flows now, and of those `healthy` (in
   service, not judged unhealthy: given new connections first) and `draining` (taking nothing new). Carrying, neither
   healthy nor draining, is in service and judged unhealthy. Said in words here; read in services/exitServing. */

export type ExitServing = { devices: number; carrying: number; healthy: number; draining: number }

// As useTranslation's t, and This device's (components/thisDevice/shared.tsx T).
type T = (key: string, text: string, values?: any) => string

// An exit's devices in a few words, for a list of exits and under the one in use: "2 devices", "1 of 2 devices carrying
// traffic · 1 unhealthy"; none where the API did not count them.
export function servingLine(t: T, serving?: ExitServing | null): string | null {
  if (!serving) return null
  const { devices, carrying, healthy, draining } = serving
  if (!carrying) return t('exitServing.none', 'No device carrying its traffic')
  const parts = [
    carrying === devices
      ? devices === 1
        ? t('exitServing.one', '1 device')
        : t('exitServing.all', '{{n}} devices', { n: devices })
      : t('exitServing.some', '{{carrying}} of {{devices}} devices carrying traffic', { carrying, devices }),
  ]
  const unhealthy = carrying - healthy - draining
  if (unhealthy > 0) parts.push(t('exitServing.unhealthy', '{{n}} unhealthy', { n: unhealthy }))
  if (draining > 0) parts.push(t('exitServing.draining', '{{n}} draining', { n: draining }))
  return parts.join(' · ')
}
