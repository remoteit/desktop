import {
  AppPrefs,
  AuthAccount,
  BRIDGE_VERSION,
  BridgeError,
  BridgeEvent,
  BridgeEvents,
  BridgeInfo,
  BridgeMethod,
  BridgeMethods,
  BridgeTransport,
  Capability,
  DeviceSetting,
  DeviceStatus,
  ExitRef,
  LoggingState,
  PermissionState,
} from './thisDevice'

/* A stand-in shell for thisDevice: a machine's state in memory, every method of the bridge over it, and its events —
   what the page and the sign-in seam are tested against, on any platform, without a shell. Only the capabilities it is
   given answer; the rest are 'unsupported', as a shell's would be. */

export type MockBridgeOptions = {
  capabilities?: Capability[]
  info?: Partial<BridgeInfo>
  status?: Partial<DeviceStatus>
  exits?: ExitRef[]
  settings?: DeviceSetting[]
  accounts?: AuthAccount[]
  tokenType?: 'Bearer' | 'DPoP'
  // The exit Protect routes through, as the engine keeps it (none: none chosen yet).
  route?: string
  // Whether traffic stops while the exit cannot be reached (protect.killSwitch); true unless said.
  killSwitch?: boolean
  // With 'services' or 'lanServices': whether it is on a local network (true unless said), and — a phone's, with
  // 'permissions' — its Local Network permission ('notAsked' unless said; services.set on asks, and a person not
  // refusing grants it).
  onLocalNetwork?: boolean
  localNetworkPermission?: PermissionState
  // 1.5.0: the app's preferences ('app'), the logging ('logging'), and whether the person confirms a removal ('remove').
  app?: AppPrefs
  logging?: LoggingState
  confirmRemove?: boolean
}

export type MockBridge = {
  transport: BridgeTransport
  calls: { method: BridgeMethod; args: any }[]
  status: DeviceStatus
  settings: DeviceSetting[]
  accounts: AuthAccount[]
  app: AppPrefs
  logging: LoggingState
  removed: boolean
  emit<E extends BridgeEvent>(event: E, payload: BridgeEvents[E]): void
}

const CAPABILITY_OF: { [method: string]: Capability | undefined } = {
  status: 'status',
  'vpn.set': 'vpn',
  'access.set': 'access',
  'protect.set': 'protect',
  'protect.route': 'protect',
  'exit.list': 'exit',
  'exit.set': 'exit',
  'settings.get': 'settings',
  'settings.set': 'settings',
  'permissions.get': 'permissions',
  'permissions.request': 'permissions',
  'diagnostics.save': 'diagnostics',
  'lanServices.set': 'lanServices',
  'services.set': 'services',
  'logging.get': 'logging',
  'logging.set': 'logging',
  'app.get': 'app',
  'app.set': 'app',
  'device.remove': 'remove',
  'device.start': 'start',
}

export function createMockBridge(options: MockBridgeOptions = {}): MockBridge {
  const capabilities = options.capabilities ?? [
    'status',
    'vpn',
    'exit',
    'settings',
    'diagnostics',
    'auth',
    'access',
    'protect',
  ]
  const info: BridgeInfo = {
    bridgeVersion: BRIDGE_VERSION,
    platform: 'mac',
    shell: 'menu',
    shellVersion: 'mock',
    stage: 'solo',
    capabilities,
    deviceKind: 'Mac',
    ...options.info,
  }
  const exits: ExitRef[] = options.exits ?? [
    { id: '80:00:00:00:01:0B:00:01', name: 'Office', kind: 'device' },
    { id: '80:00:00:00:01:0B:00:03', name: 'US West', kind: 'remoteit' },
  ]
  const listeners: { [event: string]: Set<(payload: any) => void> } = {}
  const calls: MockBridge['calls'] = []
  // The engine's route: the exit Protect goes back on through, kept while it is off (connectd exit_protect.go).
  let route = options.route
  let localNetwork: PermissionState = options.localNetworkPermission ?? 'notAsked'
  // A phone's shell: the one with a Local Network permission to ask (lanServices was a phone's alone).
  const phone = capabilities.includes('permissions') || capabilities.includes('lanServices')

  const bridge: MockBridge = {
    calls,
    status: {
      stage: info.stage,
      device: { uid: '80:00:00:00:01:0A:BC:DE', name: 'Mock MacBook', dnsName: 'mockmacbook.on.solo.remote.it' },
      engine: 'online',
      vpn: { on: false },
      subnet: { on: true, domain: 'on.solo.remote.it', ipv6: 'fd52:3f0e:7d1a::12' },
      network: 'unknown',
      // What it serves, as a phone's shell says it: nothing yet.
      ...(capabilities.includes('lanServices') || capabilities.includes('permissions') ? { served: [] } : {}),
      ...options.status,
    },
    settings: options.settings ?? [
      { name: 'exit_node', value: false, source: 'default' },
      { name: 'printers', value: true, source: 'machine' },
      { name: 'websocket', value: 'auto', source: 'cloud', locked: true },
    ],
    accounts: options.accounts ?? [{ sub: 'sub-person', email: 'person@example.com', active: true }],
    app: options.app ?? { openAtLogin: { on: true } },
    logging: options.logging ?? { detailed: false },
    removed: false,
    emit(event, payload) {
      for (const listener of listeners[event] ?? []) listener(payload)
    },
    transport: {
      async call<M extends BridgeMethod>(method: M, args: BridgeMethods[M]['args']): Promise<any> {
        calls.push({ method, args })
        const needs = method.startsWith('auth.')
          ? 'auth'
          : method.startsWith('stages.')
          ? 'stages'
          : CAPABILITY_OF[method]
        if (method !== 'info' && (!needs || !capabilities.includes(needs))) throw new BridgeError('unsupported', method)
        const a = args as any
        const active = () => bridge.accounts.find(x => x.active)
        const changed = () => bridge.emit('status', bridge.status)
        switch (method) {
          case 'info':
            return info
          case 'status':
            return bridge.status
          case 'vpn.set':
          case 'protect.set':
            if (a.on) {
              const exit = exits.find(e => e.id === route) ?? (exits.length === 1 ? exits[0] : undefined)
              if (!exit) throw new BridgeError('refused', 'choose an exit to route through first')
              use(exit)
            } else use(undefined)
            changed()
            return bridge.status
          case 'protect.route': {
            const exit = exits.find(e => e.id === a.id)
            if (!exit) throw new BridgeError('refused', `${a.id} is not among this device's exits`)
            if (bridge.status.vpn.on) use(exit)
            else {
              route = exit.id
              derive()
            }
            changed()
            return bridge.status
          }
          case 'access.set':
            bridge.status = { ...bridge.status, subnet: { ...bridge.status.subnet, on: !!a.on } }
            derive()
            changed()
            return bridge.status
          case 'services.set':
          case 'lanServices.set': {
            const setting = bridge.settings.find(s => s.name === 'services')
            if (setting?.locked) throw new BridgeError('refused', 'services: kept on this machine by its administrator')
            // Turned on, a phone's shell asks for the Local Network permission (the person's answer: granted unless
            // the mock says they refused it); a desktop's sets the setting alone.
            if (a.on && phone && localNetwork !== 'granted' && localNetwork !== 'denied') localNetwork = 'granted'
            const next: DeviceSetting = { name: 'services', value: !!a.on, source: 'machine' }
            bridge.settings = setting
              ? bridge.settings.map(s => (s.name === 'services' ? next : s))
              : [...bridge.settings, next]
            derive()
            changed()
            bridge.emit('settings', bridge.settings)
            return bridge.status
          }
          case 'exit.list':
            return exits
          case 'exit.set': {
            if (a.id === null) use(undefined)
            else {
              const exit = exits.find(e => e.id === a.id)
              if (!exit) throw new BridgeError('refused', 'no such exit')
              use(exit)
            }
            changed()
            return bridge.status
          }
          case 'settings.get':
            return bridge.settings
          case 'settings.set': {
            const setting = bridge.settings.find(s => s.name === a.name)
            if (!setting) throw new BridgeError('unsupported', a.name)
            if (setting.locked) throw new BridgeError('refused', 'set by the administrator')
            const next: DeviceSetting = { ...setting, value: a.value, source: 'machine' }
            bridge.settings = bridge.settings.map(s => (s.name === a.name ? next : s))
            bridge.emit('settings', bridge.settings)
            if (a.name === 'services') {
              derive()
              changed()
            }
            return next
          }
          case 'permissions.get':
            return { localNetwork, vpnConfiguration: 'notAsked' }
          case 'permissions.request':
            if (a.name === 'localNetwork') {
              if (localNetwork !== 'denied') localNetwork = 'granted'
              derive()
              changed()
              return localNetwork
            }
            return 'granted'
          case 'diagnostics.save':
            return { saved: true, where: '/tmp/remoteit-log.txt' }
          case 'logging.get':
            return bridge.logging
          case 'logging.set':
            bridge.logging = { detailed: !!a.detailed }
            return bridge.logging
          case 'app.get':
            return bridge.app
          case 'app.set':
            bridge.app = { openAtLogin: { on: !!a.openAtLogin } }
            return bridge.app
          case 'device.remove':
            bridge.removed = options.confirmRemove ?? false
            return { removed: bridge.removed }
          case 'device.start':
            if (bridge.status.engine === 'stopped') {
              bridge.status = { ...bridge.status, engine: 'online' }
              changed()
            }
            return bridge.status
          case 'auth.accessToken': {
            const who = active()
            if (!who) throw new BridgeError('notSignedIn')
            return {
              accessToken: `token-for:${who.sub}:${a.resource ?? 'api'}`,
              expiresAt: Math.floor(Date.now() / 1000) + 300,
              tokenType: options.tokenType ?? 'Bearer',
            }
          }
          case 'auth.dpopProof':
            return { proof: `proof:${a.method}:${a.url}` }
          case 'auth.accounts':
            return bridge.accounts
          case 'auth.signIn': {
            const added: AuthAccount = { sub: 'sub-new', email: 'new@example.com', active: true }
            bridge.accounts = [...bridge.accounts.map(x => ({ ...x, active: false })), added]
            bridge.emit('auth', { active: added })
            return added
          }
          case 'auth.switch': {
            const to = bridge.accounts.find(x => x.sub === a.sub)
            if (!to) throw new BridgeError('refused', 'not remembered')
            bridge.accounts = bridge.accounts.map(x => ({ ...x, active: x.sub === a.sub }))
            bridge.emit('auth', { active: { ...to, active: true } })
            return { ...to, active: true }
          }
          case 'auth.signOut':
            bridge.accounts = bridge.accounts.map(x => ({ ...x, active: false }))
            bridge.emit('auth', {})
            return {}
        }
        throw new BridgeError('unsupported', method)
      },
      on(event, listener) {
        ;(listeners[event] ??= new Set()).add(listener)
        return () => listeners[event]?.delete(listener)
      },
    },
  }
  // The exit in use (none: Protect off, the route kept); the route follows the exit that stands, as the engine's does.
  function use(exit: ExitRef | undefined) {
    if (exit) route = exit.id
    bridge.status = {
      ...bridge.status,
      vpn: { on: !!exit },
      exit: exit ? { ...exit, state: 'up' } : undefined,
    }
    derive()
  }
  // access, protect and services (and lanServices, its 1.3.0 name), said from the state as a shell says them, where
  // offered. A desktop's default is on, a phone's off.
  function derive() {
    const s = bridge.status
    const setting = bridge.settings.find(x => x.name === 'services')
    const on = setting ? setting.value === true : !phone
    const served = {
      on,
      locked: setting?.locked || undefined,
      ...(phone ? { onLocalNetwork: options.onLocalNetwork ?? true, localNetworkPermission: localNetwork } : {}),
    }
    bridge.status = {
      ...s,
      access: capabilities.includes('access') ? { on: !!s.subnet?.on } : undefined,
      protect: capabilities.includes('protect')
        ? { on: s.vpn.on, route: exits.find(e => e.id === route), killSwitch: options.killSwitch ?? true }
        : undefined,
      lanServices: capabilities.includes('lanServices') ? served : undefined,
      services: capabilities.includes('services') ? served : undefined,
    }
  }
  derive()
  return bridge
}
