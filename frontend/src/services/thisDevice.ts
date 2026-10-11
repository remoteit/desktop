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
   BRIDGE_VERSION: a new method or capability is a minor version; a different major is "update the app".

   Each transport registers itself only where it applies (thisDeviceHttp.ts: an embedded build not running as a
   Capacitor native app; thisDeviceCapacitor.ts: a Capacitor native app), so one embedded bundle serves both shells.

   1.1.0 (additive): NetworkKind 'unknown', for a shell that cannot tell the machine's network (the menu); the
   epoch-seconds unit of auth.accessToken's expiresAt said here; auth.signIn's optional deviceName; DeviceSetting's
   source and locked said from connectd's own fields.

   1.2.0 (additive): the two switches that replace "VPN" as what a person sees (Evan, 2026-10-10) — Access remote
   devices ('access': access.set, the machine reaching its devices by name: connectd's subnet setting) and remote.it
   Protect ('protect': protect.set and protect.route, all of the machine's traffic through an exit). They are
   independent; a shell runs its tunnel whenever either is on (a phone's packet tunnel, off with both off). The exit
   Protect routes through is the engine's (connectd keeps it while Protect is off, beside the device's key): every shell
   and the portal turn Protect back on through the same one. DeviceStatus gains access and protect, BridgeInfo
   deviceKind. vpn.set and vpn stay as they were.

   1.3.0 (additive): the third switch (Evan, 2026-10-10) — Allow remote access to services on the network
   ('lanServices': lanServices.set; DeviceStatus.lanServices): people this machine's services are shared with reach
   hosts on the network it is on, through it. connectd's lan_services setting, which only a client-only device (a
   phone) has a use for — a desktop serves its services whatever it says — so only such a shell offers it. A shell runs
   its tunnel while any of Access, Protect and this is on, and stops it with all three off. settings.set('lan_services')
   still works; the page shows the switch in its place.

   1.4.0 (additive): Allow remote access to services, every device's (Evan, 2026-10-10) — 'services': services.set;
   DeviceStatus.services. connectd's services setting (lan_services renamed): whether this machine serves its
   services — lets people reach the hosts and ports defined as its services, through it; off, none are, nor its ports
   beyond them or its console. On by default on a desktop, off on a phone; every shell offers it. On a phone, turning
   it on also starts the tunnel and asks for the Local Network permission, as lanServices did; on a desktop it is just
   the setting — the difference is the shell's. 'lanServices' (1.3.0) is deprecated: a phone's shell still offers it
   and lanServices.set as services for one version, so a page built before 1.4.0 keeps working; a page uses 'services'
   where offered.

   1.5.0 (additive): everything the menu's own Settings window shows, so This device takes its place (device-package
   docs/one-app-plan.md, "Settings → This device") — the administrator's reason a setting, Access, Protect or the
   services are held (lockedWhy) and a change made here that the portal's newer one replaced (overridden); what is said
   of the subnet's range (subnet.range); whether remote.it's relay carries the device's traffic now (relay); the
   device's owner, since when it is online, its versions, and what removing it is here (device.removal); the detailed
   connection logging ('logging': logging.get, logging.set); the app's own preferences for the person, the machine's
   and every stage's alike ('app': app.get, app.set — Open at login); and taking the device off this machine ('remove':
   device.remove — the shell asks the person and an administrator first).

   1.6.0 (additive): a device stopped on the machine (device-package docs/menu-app.md §7.4, "Quit and Stop": the menu's
   Quit and Stop, or `remoteit-device stop`) — offline, nothing served, Access and Protect off, until started — is
   engine 'stopped' with its details, as an engine not running always was; 'start' (device.start) starts it again, its
   switches back as they were. Stopping is the menu's, not the page's. */

export const BRIDGE_VERSION = '1.6.0'

export type Capability =
  | 'status' // status() and the 'status' event
  | 'vpn' // vpn.set
  | 'exit' // exit.list, exit.set
  | 'settings' // settings.get, settings.set
  | 'permissions' // permissions.get, permissions.request (phones)
  | 'diagnostics' // diagnostics.save
  | 'auth' // auth.* — the shell signs in; the portal starts no flow of its own
  | 'stages' // stages.* — other stages joined beside the home stage (never in a prod build)
  | 'access' // 1.2.0: access.set — Access remote devices; DeviceStatus.access
  | 'protect' // 1.2.0: protect.set, protect.route — remote.it Protect; DeviceStatus.protect
  | 'lanServices' // 1.3.0, deprecated by 'services': lanServices.set; DeviceStatus.lanServices
  | 'services' // 1.4.0: services.set — Allow remote access to services; DeviceStatus.services
  | 'logging' // 1.5.0: logging.get, logging.set — the detailed connection logging
  | 'app' // 1.5.0: app.get, app.set — the app's own preferences for the person (Open at login)
  | 'remove' // 1.5.0: device.remove — take the device off this machine (DeviceStatus.device.removal)
  | 'start' // 1.6.0: device.start — start remote.it again on a machine where it was stopped (engine 'stopped')

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
  // 1.2.0: what this machine is called in a sentence ("Mac", "iPhone", "computer"): "All traffic from this Mac …".
  deviceKind?: string
}

export type EngineState = 'starting' | 'online' | 'offline' | 'signedOut' | 'stopped'
export type NetworkKind = 'wifi' | 'wired' | 'cellular' | 'none' | 'unknown'

export type ExitRef = { id: string; name: string; kind: 'device' | 'remoteit' }

// 1.2.0: Access remote devices — this machine reaching its devices by name (connectd's subnet setting). locked: the
// machine's administrator holds it.
// 1.5.0 lockedWhy: the administrator's reason, in the shell's words.
export type AccessStatus = { on: boolean; changing?: boolean; error?: string; locked?: boolean; lockedWhy?: string }

// 1.2.0: remote.it Protect — all of this machine's traffic through an exit. route is the exit it routes through, said
// while Protect is off too (the engine keeps it): Protect on goes through it. killSwitch: traffic stops while the exit
// cannot be reached, rather than going out the usual way (always on a desktop; a phone's setting). error: why the
// exit chosen is not used (refused, or another stage's Protect on), or that it cannot be reached. locked: pinned by
// the machine's administrator.
export type ProtectStatus = {
  on: boolean
  route?: ExitRef
  changing?: boolean
  error?: string
  killSwitch?: boolean
  locked?: boolean
  lockedWhy?: string // 1.5.0
}

// 1.4.0: Allow remote access to services — connectd's services setting (1.3.0's lanServices, a phone's, the same
// shape): on, this machine's services — hosts and ports defined as its services (on a phone, hosts on the network it
// is on) — take connections from whoever they are shared with, through it; off, none.
// What keeps them from being reached while it is on: onLocalNetwork false (cellular alone, or no network: there are no
// neighbours to reach), and localNetworkPermission (a phone's Local Network permission, which its dials need; absent
// where the shell has none to ask). error: why the last change was not made, or why it is not working. locked: the
// machine's administrator holds it. The connections themselves are DeviceStatus.served.
export type ServicesStatus = {
  on: boolean
  changing?: boolean
  error?: string
  locked?: boolean
  lockedWhy?: string // 1.5.0
  onLocalNetwork?: boolean
  localNetworkPermission?: PermissionState
}
// 1.3.0's name for it.
export type LanServicesStatus = ServicesStatus

// 1.5.0: what is said of the subnet's IPv4 range, only when there is something to say — off for want of a free range,
// a range shared with another network, a move within the last hour (at: RFC 3339).
export type SubnetRange = {
  noRange?: string
  warning?: string
  moved?: { from: string; to: string; at: string; why?: string }
}

export type DeviceStatus = {
  stage: string
  // 1.5.0: owner, since (online since, RFC 3339), package and connectd (versions), and removal — what device.remove is
  // here: 'remove' (this stage's device off this machine) or 'uninstall' (the machine's only one: the app goes too).
  device?: {
    uid: string
    name: string
    dnsName?: string
    owner?: string
    since?: string
    package?: string
    connectd?: string
    removal?: 'remove' | 'uninstall'
  }
  engine: EngineState
  signedIn?: { sub: string; email?: string }
  vpn: { on: boolean; changing?: boolean; error?: string }
  // The exit traffic goes through while the VPN is on; absent: none (the machine's own internet).
  exit?: ExitRef & { state: 'connecting' | 'up' | 'down'; error?: string }
  subnet?: { on: boolean; domain?: string; ipv4?: string; ipv6?: string; range?: SubnetRange }
  network: NetworkKind
  // This machine's services and the connections open to them through it (a phone's shell): connectd's `served`.
  served?: { service: string; target: string; sessions: number; lastError?: string }[]
  // 1.2.0, with the 'access' and 'protect' capabilities.
  access?: AccessStatus
  protect?: ProtectStatus
  // 1.3.0, with the 'lanServices' capability (deprecated: services).
  lanServices?: LanServicesStatus
  // 1.4.0, with the 'services' capability.
  services?: ServicesStatus
  // 1.5.0: whether remote.it's relay (the websocket setting) carries this device's traffic now.
  relay?: { using: boolean }
}

export type SettingValue = string | number | boolean | null

// Settings by their connectd names (device-package docs/device-settings.md): exit_node, services, printers, …
// `source` says who set the value standing now: either side sets, the newer stands. From connectd's `from`: `local`,
// `config` (the machine's configuration file) and `policy` → 'machine'; `cloud` → 'cloud'; anything else → 'default'.
// `locked`: the machine may not change it — connectd's `control` is `off`, `on` or `cloud` (or a value it fixes), or
// `from` is `policy`.
// 1.5.0: lockedWhy, the administrator's reason it is locked; overridden, a change made here that the portal's newer one
// replaced, said by the shell.
export type DeviceSetting = {
  name: string
  value: SettingValue
  source: 'machine' | 'cloud' | 'default'
  locked?: boolean
  lockedWhy?: string
  overridden?: string
}

// 1.5.0: the app's own preferences for the person on this machine — the machine's, not a stage's, so every stage's
// page shows them alike. openAtLogin absent where the app keeps no login item itself.
export type AppPrefs = { openAtLogin?: { on: boolean; pending?: boolean; error?: string } }

// 1.5.0: the detailed connection logging (a line a second for each connection in the log), until remote.it restarts.
export type LoggingState = { detailed: boolean; error?: string }

export type PermissionName = 'localNetwork' | 'vpnConfiguration'
export type PermissionState = 'granted' | 'denied' | 'notAsked' | 'unknown'

export type AuthAccount = { sub: string; email?: string; name?: string; active: boolean }

export type StageStatus = {
  stage: string
  joined: boolean
  signedIn?: { sub: string; email?: string }
  engine: EngineState
}

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
  // 1.0: the menu's Protect, a phone's packet tunnel; a page with 'access' and 'protect' uses those.
  'vpn.set': { args: { on: boolean }; result: DeviceStatus }
  // 1.2.0: Access remote devices on or off. A phone starts its tunnel for it, and stops it when Protect is off too.
  'access.set': { args: { on: boolean }; result: DeviceStatus }
  // 1.2.0: Protect on — through protect.route, the exit it routes through ('refused' when there is none yet and more
  // than one to choose from) — or off, that exit kept. A phone starts its tunnel for it, and stops it when Access is off.
  'protect.set': { args: { on: boolean }; result: DeviceStatus }
  // 1.2.0: the exit Protect routes through: with Protect on the exit changes to it; off, it is kept for when Protect
  // is turned on, and nothing else changes.
  'protect.route': { args: { id: string }; result: DeviceStatus }
  // 1.3.0, deprecated by services.set: Allow remote access to services on the network on or off. A phone starts its tunnel
  // for it and asks for the Local Network permission as it turns on; off, it stops the tunnel when Access and Protect
  // are off too.
  'lanServices.set': { args: { on: boolean }; result: DeviceStatus }
  // 1.4.0: Allow remote access to services on or off (connectd's services). A phone starts its tunnel for it and asks
  // for the Local Network permission as it turns on, and stops the tunnel when Access and Protect are off too; on a
  // desktop it is the setting alone. lanServices.set (1.3.0) is the same, deprecated.
  'services.set': { args: { on: boolean }; result: DeviceStatus }
  'exit.list': { args: {}; result: ExitRef[] }
  'exit.set': { args: { id: string | null }; result: DeviceStatus }
  'settings.get': { args: {}; result: DeviceSetting[] }
  'settings.set': { args: { name: string; value: SettingValue }; result: DeviceSetting }
  'permissions.get': { args: {}; result: Record<PermissionName, PermissionState> }
  'permissions.request': { args: { name: PermissionName }; result: PermissionState }
  'diagnostics.save': { args: {}; result: { saved: boolean; where?: string } }
  // An access token for the API, from the shell's sign-in; the shell keeps the refresh token and the DPoP key.
  // `resource` absent: the stage's API. expiresAt is the token's expiry in seconds since the epoch (a JWT's exp).
  'auth.accessToken': {
    args: { resource?: string; scope?: string }
    result: { accessToken: string; expiresAt: number; tokenType: 'Bearer' | 'DPoP' }
  }
  // A DPoP proof for one request, made with the shell's key (only where the token is DPoP).
  'auth.dpopProof': { args: { method: string; url: string; accessToken: string }; result: { proof: string } }
  'auth.accounts': { args: {}; result: AuthAccount[] }
  // deviceName: what to call this machine where the first sign-in registers it (a phone; iOS gives an app only
  // "iPhone"). A shell that registers nothing ignores it.
  'auth.signIn': { args: { addAccount?: boolean; deviceName?: string }; result: AuthAccount }
  'auth.switch': { args: { sub: string }; result: AuthAccount }
  'auth.signOut': { args: { sub?: string }; result: {} }
  // 1.5.0
  'logging.get': { args: {}; result: LoggingState }
  'logging.set': { args: { detailed: boolean }; result: LoggingState }
  'app.get': { args: {}; result: AppPrefs }
  'app.set': { args: { openAtLogin: boolean }; result: AppPrefs }
  // The shell asks the person, then an administrator; removed false when either said no.
  'device.remove': { args: {}; result: { removed: boolean } }
  // 1.6.0: remote.it started again where it was stopped; nothing to do while it runs.
  'device.start': { args: {}; result: DeviceStatus }
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
let known: ThisDevice | null | undefined

export function registerBridgeTransport(find: () => Promise<BridgeTransport | undefined>) {
  detect = find
  resolved = undefined
  known = undefined
}

export function thisDevice(): Promise<ThisDevice | undefined> {
  if (!resolved) {
    resolved = (async () => {
      const transport = await detect?.().catch(() => undefined)
      if (!transport) return undefined
      const info = await transport.call('info', {}).catch(() => undefined)
      return info ? new ThisDevice(transport, info) : undefined
    })()
    const asked = resolved
    asked.then(d => resolved === asked && (known = d ?? null))
  }
  return resolved
}

/** thisDevice's answer once it has one — null where there is none — else undefined: for a first render that must not
 *  wait a turn for an answer the boot already has (the sign-in asks it before anything draws). */
export const thisDeviceKnown = (): ThisDevice | null | undefined => known
