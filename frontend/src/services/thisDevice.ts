/* thisDevice: the bridge from the portal to the machine it is running on (device-package docs/one-app-plan.md, "The
   bridge"). In a plain browser it is absent and the page's device-only parts do not show. In an app it is the native
   shell's: the menu app on a desktop (same-origin HTTP on its local server), the Capacitor shell on a phone (the
   ThisDevice plugin). Both shells implement exactly this file; a change to the bridge is made here first.

   One transport shape for both, so the shells stay alike: every method is `call(method, args)` returning its result,
   and every change arrives as an event.

   - Desktop: POST `bridge/<method>` (relative to the page, which the menu serves under its token path), body the args
     as JSON; 200 with the result as JSON, or 4xx/5xx with `{ "error": { "code", "message" } }`. Events: GET
     `bridge/events`, server-sent events, `event: <name>` with the payload as JSON data.
   - Phone: the Capacitor plugin `ThisDevice`, `call({ method, args })` resolving to `{ result }` or rejecting with
     the error's code; events through `addListener('event', { name, payload })`.

   The page decides what to show from `info().capabilities` only, never from the platform. Versioning is semver on
   BRIDGE_VERSION: a new method or capability is a minor version; a different major is "update the app". */

export const BRIDGE_VERSION = '1.0.0'

export type Capability =
  | 'status' // status() and the 'status' event
  | 'vpn' // vpn.set
  | 'exit' // exit.list, exit.set
  | 'settings' // settings.get, settings.set
  | 'permissions' // permissions.get, permissions.request (phones)
  | 'diagnostics' // diagnostics.save
  | 'auth' // auth.* — the shell signs in; the portal starts no flow of its own
  | 'stages' // stages.* — other stages joined beside the home stage (never in a prod build)

export type Platform = 'mac' | 'windows' | 'linux' | 'ios' | 'android'
export type Shell = 'menu' | 'capacitor'

export type BridgeInfo = {
  bridgeVersion: string
  platform: Platform
  shell: Shell
  shellVersion: string
  // The home stage: the one this app or package was built for ('prod', 'dev', 'solo', …).
  stage: string
  capabilities: Capability[]
}

export type EngineState = 'starting' | 'online' | 'offline' | 'signedOut' | 'stopped'
export type NetworkKind = 'wifi' | 'wired' | 'cellular' | 'none'

export type ExitRef = { id: string; name: string; kind: 'device' | 'remoteit' }

export type DeviceStatus = {
  stage: string
  device?: { uid: string; name: string; dnsName?: string }
  engine: EngineState
  signedIn?: { sub: string; email?: string }
  vpn: { on: boolean; changing?: boolean; error?: string }
  // The exit traffic goes through while the VPN is on; absent: none (the machine's own internet).
  exit?: ExitRef & { state: 'connecting' | 'up' | 'down'; error?: string }
  subnet?: { on: boolean; domain?: string; ipv4?: string; ipv6?: string }
  network: NetworkKind
  // Connections into this machine's own services (a phone's "Allow connections through this phone"): connectd's `served`.
  served?: { service: string; target: string; sessions: number; lastError?: string }[]
}

export type SettingValue = string | number | boolean | null

// Settings by their connectd names (device-package docs/device-settings.md): exit_node, lan_services, printers, …
// `source` says who set the value standing now: either side sets, the newer stands.
export type DeviceSetting = { name: string; value: SettingValue; source: 'machine' | 'cloud' | 'default'; locked?: boolean }

export type PermissionName = 'localNetwork' | 'vpnConfiguration'
export type PermissionState = 'granted' | 'denied' | 'notAsked' | 'unknown'

export type AuthAccount = { sub: string; email?: string; name?: string; active: boolean }

export type StageStatus = { stage: string; joined: boolean; signedIn?: { sub: string; email?: string }; engine: EngineState }

export type BridgeErrorCode =
  | 'unsupported' // no such method, or its capability is not offered
  | 'notSignedIn'
  | 'refused' // the machine's policy, or a person without the right
  | 'busy' // another change is in progress (a VPN starting)
  | 'unavailable' // the engine is not running
  | 'cancelled' // the person cancelled (a sign-in, a permission prompt)
  | 'failed'

export class BridgeError extends Error {
  constructor(public code: BridgeErrorCode, message?: string) {
    super(message || code)
    this.name = 'BridgeError'
  }
}

// Every method: its args and its result. Both shells implement exactly these.
export type BridgeMethods = {
  info: { args: {}; result: BridgeInfo }
  status: { args: {}; result: DeviceStatus }
  'vpn.set': { args: { on: boolean }; result: DeviceStatus }
  'exit.list': { args: {}; result: ExitRef[] }
  'exit.set': { args: { id: string | null }; result: DeviceStatus }
  'settings.get': { args: {}; result: DeviceSetting[] }
  'settings.set': { args: { name: string; value: SettingValue }; result: DeviceSetting }
  'permissions.get': { args: {}; result: Record<PermissionName, PermissionState> }
  'permissions.request': { args: { name: PermissionName }; result: PermissionState }
  'diagnostics.save': { args: {}; result: { saved: boolean; where?: string } }
  // An access token for the API, from the shell's sign-in; the shell keeps the refresh token and the DPoP key.
  'auth.accessToken': { args: { resource?: string; scope?: string }; result: { accessToken: string; expiresAt: number; tokenType: 'Bearer' | 'DPoP' } }
  // A DPoP proof for one request, made with the shell's key (only where the token is DPoP).
  'auth.dpopProof': { args: { method: string; url: string; accessToken: string }; result: { proof: string } }
  'auth.accounts': { args: {}; result: AuthAccount[] }
  'auth.signIn': { args: { addAccount?: boolean }; result: AuthAccount }
  'auth.switch': { args: { sub: string }; result: AuthAccount }
  'auth.signOut': { args: { sub?: string }; result: {} }
  'stages.list': { args: {}; result: StageStatus[] }
  'stages.join': { args: { stage: string }; result: StageStatus }
  'stages.leave': { args: { stage: string }; result: {} }
  'stages.signIn': { args: { stage: string }; result: StageStatus }
}

export type BridgeMethod = keyof BridgeMethods

export type BridgeEvents = {
  status: DeviceStatus
  settings: DeviceSetting[]
  // The shell's sign-in changed (signed in, out, switched, or the session ended): the portal reads auth.* again.
  auth: { active?: AuthAccount }
  stages: StageStatus[]
}

export type BridgeEvent = keyof BridgeEvents

// What a shell's transport provides; thisDevice wraps it.
export interface BridgeTransport {
  call<M extends BridgeMethod>(method: M, args: BridgeMethods[M]['args']): Promise<BridgeMethods[M]['result']>
  on<E extends BridgeEvent>(event: E, listener: (payload: BridgeEvents[E]) => void): () => void
}

export class ThisDevice {
  constructor(private transport: BridgeTransport, public info: BridgeInfo) {}

  has(capability: Capability) {
    return this.info.capabilities.includes(capability)
  }

  // Whether this page can run against the shell's bridge at all (the majors match).
  get compatible() {
    return major(this.info.bridgeVersion) === major(BRIDGE_VERSION)
  }

  call<M extends BridgeMethod>(method: M, args: BridgeMethods[M]['args']) {
    return this.transport.call(method, args)
  }

  on<E extends BridgeEvent>(event: E, listener: (payload: BridgeEvents[E]) => void) {
    return this.transport.on(event, listener)
  }
}

const major = (version: string) => version.split('.')[0]

// A shell's transport registers itself at boot (thisDeviceHttp.ts on a desktop, thisDeviceCapacitor.ts on a phone);
// none registered: a plain browser, and thisDevice is absent.
let detect: (() => Promise<BridgeTransport | undefined>) | undefined
let resolved: Promise<ThisDevice | undefined> | undefined

export function registerBridgeTransport(find: () => Promise<BridgeTransport | undefined>) {
  detect = find
  resolved = undefined
}

export function thisDevice(): Promise<ThisDevice | undefined> {
  if (!resolved) {
    resolved = (async () => {
      const transport = await detect?.().catch(() => undefined)
      if (!transport) return undefined
      const info = await transport.call('info', {}).catch(() => undefined)
      return info ? new ThisDevice(transport, info) : undefined
    })()
  }
  return resolved
}
