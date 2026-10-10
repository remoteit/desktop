import {
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
}

export type MockBridge = {
  transport: BridgeTransport
  calls: { method: BridgeMethod; args: any }[]
  status: DeviceStatus
  settings: DeviceSetting[]
  accounts: AuthAccount[]
  emit<E extends BridgeEvent>(event: E, payload: BridgeEvents[E]): void
}

const CAPABILITY_OF: { [method: string]: Capability | undefined } = {
  status: 'status',
  'vpn.set': 'vpn',
  'exit.list': 'exit',
  'exit.set': 'exit',
  'settings.get': 'settings',
  'settings.set': 'settings',
  'permissions.get': 'permissions',
  'permissions.request': 'permissions',
  'diagnostics.save': 'diagnostics',
}

export function createMockBridge(options: MockBridgeOptions = {}): MockBridge {
  const capabilities = options.capabilities ?? ['status', 'vpn', 'exit', 'settings', 'diagnostics', 'auth']
  const info: BridgeInfo = {
    bridgeVersion: BRIDGE_VERSION,
    platform: 'mac',
    shell: 'menu',
    shellVersion: 'mock',
    stage: 'solo',
    capabilities,
    ...options.info,
  }
  const exits: ExitRef[] = options.exits ?? [
    { id: '80:00:00:00:01:0B:00:01', name: 'Office', kind: 'device' },
    { id: '80:00:00:00:01:0B:00:03', name: 'US West', kind: 'remoteit' },
  ]
  const listeners: { [event: string]: Set<(payload: any) => void> } = {}
  const calls: MockBridge['calls'] = []
  let lastExit = exits[0]?.id

  const bridge: MockBridge = {
    calls,
    status: {
      stage: info.stage,
      device: { uid: '80:00:00:00:01:0A:BC:DE', name: 'Mock MacBook', dnsName: 'mockmacbook.on.solo.remote.it' },
      engine: 'online',
      vpn: { on: false },
      subnet: { on: true, domain: 'on.solo.remote.it', ipv6: 'fd52:3f0e:7d1a::12' },
      network: 'unknown',
      ...options.status,
    },
    settings: options.settings ?? [
      { name: 'exit_node', value: false, source: 'default' },
      { name: 'printers', value: true, source: 'machine' },
      { name: 'websocket', value: 'auto', source: 'cloud', locked: true },
    ],
    accounts: options.accounts ?? [{ sub: 'sub-person', email: 'person@example.com', active: true }],
    emit(event, payload) {
      for (const listener of listeners[event] ?? []) listener(payload)
    },
    transport: {
      async call<M extends BridgeMethod>(method: M, args: BridgeMethods[M]['args']): Promise<any> {
        calls.push({ method, args })
        const needs = method.startsWith('auth.') ? 'auth' : method.startsWith('stages.') ? 'stages' : CAPABILITY_OF[method]
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
            if (a.on) {
              const exit = exits.find(e => e.id === lastExit)
              if (!exit) throw new BridgeError('failed', 'choose an exit')
              bridge.status = { ...bridge.status, vpn: { on: true }, exit: { ...exit, state: 'up' } }
            } else bridge.status = { ...bridge.status, vpn: { on: false }, exit: undefined }
            changed()
            return bridge.status
          case 'exit.list':
            return exits
          case 'exit.set': {
            if (a.id === null) bridge.status = { ...bridge.status, vpn: { on: false }, exit: undefined }
            else {
              const exit = exits.find(e => e.id === a.id)
              if (!exit) throw new BridgeError('refused', 'no such exit')
              lastExit = exit.id
              bridge.status = { ...bridge.status, vpn: { on: true }, exit: { ...exit, state: 'up' } }
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
            return next
          }
          case 'permissions.get':
            return { localNetwork: 'granted', vpnConfiguration: 'notAsked' }
          case 'permissions.request':
            return 'granted'
          case 'diagnostics.save':
            return { saved: true, where: '/tmp/remoteit-log.txt' }
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
  return bridge
}
