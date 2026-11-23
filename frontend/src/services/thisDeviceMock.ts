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
  ExitNodeCheck,
  ExitNodeExit,
  ExitNodeJoined,
  ExitNodeRuns,
  ExitNodeStatus,
  ExitRef,
  LoggingState,
  PermissionState,
  SshState,
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
  // The shell cannot say yet whose sign-in this is (its device has not said its stage): auth.* 'unavailable'.
  authUnavailable?: boolean
  tokenType?: 'Bearer' | 'DPoP'
  // The exit Protect routes through, as the engine keeps it (none: none chosen yet).
  route?: string
  // Whether traffic stops while the exit cannot be reached (protect.killSwitch); true unless said.
  killSwitch?: boolean
  // 1.10.0: why this account may not choose the exit here (protect.chooseRefusal): the route, Protect on and exit.set
  // refused with it, as the shell refuses; Protect off still taken. None unless said.
  chooseRefusal?: string
  // The engine refusing a route (exit.set, protect.route, Protect on) with this reason, the state left as it was, as a
  // policy or a stage holding the exit would. Not said in the status.
  routeRefusal?: string
  // With 'services' or 'lanServices': whether it is on a local network (true unless said), and — a phone's, with
  // 'permissions' — its Local Network permission ('notAsked' unless said; services.set on asks, and a person not
  // refusing grants it).
  onLocalNetwork?: boolean
  localNetworkPermission?: PermissionState
  // 1.5.0: the app's preferences ('app'), the logging ('logging'), and whether the person confirms a removal ('remove').
  app?: AppPrefs
  logging?: LoggingState
  confirmRemove?: boolean
  // 1.12.0: the person's ssh ('ssh'; off and signed in unless said), and offering the machine as an exit ('exitNode').
  ssh?: SshState
  exitNode?: MockExitNode
}

// The owner's exits and the one the machine runs (none unless said); a join or a create puts it in one, joining, with
// checks; refusal refuses every join and create as the cloud would, leaveRefusal a leave; confirm false is the administrator saying no ('cancelled').
export type MockExitNode = {
  status?: ExitNodeStatus
  exits?: ExitNodeExit[]
  runs?: ExitNodeRuns | null
  checks?: ExitNodeCheck[]
  refusal?: string
  leaveRefusal?: string
  confirm?: boolean
}

export type MockBridge = {
  transport: BridgeTransport
  calls: { method: BridgeMethod; args: any }[]
  status: DeviceStatus
  settings: DeviceSetting[]
  accounts: AuthAccount[]
  authUnavailable: boolean
  app: AppPrefs
  logging: LoggingState
  removed: boolean
  ssh: SshState
  exitNode: Required<Pick<MockExitNode, 'exits' | 'runs'>>
  emit<E extends BridgeEvent>(event: E, payload: BridgeEvents[E]): void
  // 1.7.0: what the shell offers changes (its engine came, went or changed): info's answer, the status said from it,
  // and the info event, as a shell sends it.
  offer(capabilities: Capability[]): void
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
  'ssh.get': 'ssh',
  'ssh.set': 'ssh',
  'exitNode.list': 'exitNode',
  'exitNode.join': 'exitNode',
  'exitNode.create': 'exitNode',
  'exitNode.leave': 'exitNode',
}

export function createMockBridge(options: MockBridgeOptions = {}): MockBridge {
  let capabilities = options.capabilities ?? [
    'status',
    'vpn',
    'exit',
    'settings',
    'diagnostics',
    'auth',
    'access',
    'protect',
  ]
  let info: BridgeInfo = {
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
  let notifications: PermissionState = 'notAsked'
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
    authUnavailable: options.authUnavailable ?? false,
    app: options.app ?? { openAtLogin: { on: true } },
    logging: options.logging ?? { detailed: false },
    removed: false,
    ssh: options.ssh ?? { on: false },
    exitNode: { exits: options.exitNode?.exits ?? [], runs: options.exitNode?.runs ?? null },
    emit(event, payload) {
      for (const listener of listeners[event] ?? []) listener(payload)
    },
    offer(next) {
      capabilities = next
      info = { ...info, capabilities: next }
      derive()
      bridge.emit('info', info)
      bridge.emit('status', bridge.status)
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
        if (needs === 'auth' && bridge.authUnavailable)
          throw new BridgeError('unavailable', 'its stage is not known yet')
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
            if (a.on && options.chooseRefusal) throw new BridgeError('refused', options.chooseRefusal)
            if (a.on && options.routeRefusal) throw new BridgeError('refused', options.routeRefusal)
            if (a.on) {
              const exit = exits.find(e => e.id === route) ?? (exits.length === 1 ? exits[0] : undefined)
              if (!exit) throw new BridgeError('refused', 'choose an exit to route through first')
              use(exit)
            } else use(undefined)
            changed()
            return bridge.status
          case 'protect.route': {
            if (options.chooseRefusal) throw new BridgeError('refused', options.chooseRefusal)
            if (options.routeRefusal) throw new BridgeError('refused', options.routeRefusal)
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
            if (a.id !== null && options.chooseRefusal) throw new BridgeError('refused', options.chooseRefusal)
            if (a.id !== null && options.routeRefusal) throw new BridgeError('refused', options.routeRefusal)
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
            // 1.8.0: the notification permission beside the two, where the shell offers it.
            return {
              localNetwork,
              vpnConfiguration: 'notAsked',
              ...(capabilities.includes('notifications') ? { notifications } : {}),
            }
          case 'permissions.request':
            if (a.name === 'notifications') {
              if (!capabilities.includes('notifications'))
                throw new BridgeError('unsupported', 'no permission notifications')
              notifications = 'granted'
              return notifications
            }
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
          case 'ssh.get':
            return bridge.ssh
          case 'ssh.set':
            if (bridge.ssh.needsSignIn) throw new BridgeError('notSignedIn', 'sign in to use remote.it for ssh')
            bridge.ssh = { on: !!a.on }
            derive()
            changed()
            return bridge.ssh
          case 'exitNode.list':
          case 'exitNode.join':
          case 'exitNode.create':
          case 'exitNode.leave': {
            const held = bridge.status.exitNode?.held
            if (held) throw new BridgeError('refused', `held: ${held}`)
            if (method === 'exitNode.leave') {
              const ran = bridge.exitNode.runs
              if (options.exitNode?.leaveRefusal) throw new BridgeError('refused', options.exitNode.leaveRefusal)
              if (!ran) throw new BridgeError('refused', 'it runs no exit')
              bridge.exitNode.runs = null
              return { left: { id: ran.id, name: ran.name } }
            }
            if (method !== 'exitNode.list' && options.exitNode?.confirm === false)
              throw new BridgeError('cancelled', 'the administrator’s confirmation was cancelled')
            if (method === 'exitNode.list') {
              const runs = bridge.exitNode.runs
              return { exits: bridge.exitNode.exits, runs: runs && { ...runs, checks: null } }
            }
            if (options.exitNode?.refusal) throw new BridgeError('refused', options.exitNode.refusal)
            let exit = bridge.exitNode.exits.find(x => x.id === a.id)
            const created = method === 'exitNode.create'
            if (created) {
              exit = {
                id: `gmock${bridge.exitNode.exits.length + 1}`,
                name: a.name?.trim() || `${bridge.status.device?.name} exit`,
                devices: 1,
                inService: 0,
                users: 0,
                dormant: true,
                lan: false,
              }
              bridge.exitNode.exits = [...bridge.exitNode.exits, exit]
            }
            if (!exit) throw new BridgeError('refused', 'no such exit of its owner’s')
            const runs: ExitNodeRuns = {
              id: exit.id,
              name: exit.name,
              state: 'retired',
              joining: true,
              lan: exit.lan,
              checks: options.exitNode?.checks ?? [],
            }
            bridge.exitNode.runs = runs
            const joined: ExitNodeJoined = { exit: { id: exit.id, name: exit.name }, runs, created, turnedOn: false }
            return joined
          }
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
        ? {
            on: s.vpn.on,
            route: exits.find(e => e.id === route),
            killSwitch: options.killSwitch ?? true,
            ...(options.chooseRefusal ? { chooseRefusal: options.chooseRefusal } : {}),
          }
        : undefined,
      lanServices: capabilities.includes('lanServices') ? served : undefined,
      services: capabilities.includes('services') ? served : undefined,
      exitNode: capabilities.includes('exitNode') ? s.exitNode ?? options.exitNode?.status ?? {} : undefined,
      ssh: capabilities.includes('ssh') ? bridge.ssh : undefined,
    }
  }
  derive()
  return bridge
}
