import { platforms } from '.'

/* A virtual device's platform: picked by its owner, since no daemon reports one (graphql-api docs/VIRTUAL-DEVICES.md;
   the portal proposal's "What kind of machine it is"). The picker leads with these, the machines most often reached
   through a gateway, and searches the whole catalogue for the rest. Custom labels ("Line 2", "Keyence") are tags. */

// graphql's own default for a virtual device given no platform (the catalogue's 264, "Unknown")
export const PLATFORM_UNKNOWN = 264

export const VIRTUAL_PLATFORM_TYPES = [
  1284, // Printer
  1210, // NAS (the catalogue's NAS row is Synology's)
  1282, // PLC
  1283, // IP camera
  4, // Windows
  1285, // HMI / industrial PC
  1286, // Router / switch
  256, // Mac
  769, // Linux
  PLATFORM_UNKNOWN, // Other
]

export type PlatformChoice = { type: number; name: string }

export const virtualPlatformChoices = (): PlatformChoice[] =>
  VIRTUAL_PLATFORM_TYPES.map(type => ({ type, name: type === PLATFORM_UNKNOWN ? 'Other' : platforms.name(type) }))

// The whole catalogue, one entry a name, for "More…".
export function allPlatformChoices(): PlatformChoice[] {
  const seen = new Set<string>()
  return Object.entries(platforms.allTypes)
    .map(([type, name]) => ({ type: Number(type), name }))
    .filter(choice => choice.name && !seen.has(choice.name) && !!seen.add(choice.name))
    .sort((a, b) => a.name.localeCompare(b.name))
}

/* What discovery suggests for a machine from what it advertises (DNS-SD service types, a TXT model). Undefined: no
   suggestion, the picker opens on its common entries. */
export function suggestPlatform(offers: { type?: string; txt?: ILookup<string> }[], host?: string): number | undefined {
  const types = offers.map(o => (o.type || '').toLowerCase())
  const has = (...names: string[]) => types.some(t => names.some(n => t.startsWith(n)))
  const model = offers
    .map(o => Object.values(o.txt || {}).join(' '))
    .join(' ')
    .toLowerCase()
  if (has('_ipp._tcp', '_ipps._tcp')) return 1284
  if (has('_smb._tcp', '_afpovertcp._tcp') && /synology|qnap|diskstation|ds\d{3}/.test(model)) return 1210
  if (has('_rtsp._tcp', '_onvif')) return 1283
  if (has('_rfb._tcp', '_rdp._tcp') && /windows|desktop-|win/.test(`${model} ${host || ''}`.toLowerCase())) return 4
  return undefined
}
