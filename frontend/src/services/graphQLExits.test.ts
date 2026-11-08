import { describe, it, expect, vi, beforeEach } from 'vitest'

// `ui.offline` makes post answer ERROR before any request: how a failed request reaches the callers.
const { uiSet, request, ui } = vi.hoisted(() => ({ uiSet: vi.fn(), request: vi.fn(), ui: {} as { offline?: boolean } }))
vi.mock('../store', () => ({
  store: { getState: () => ({ ui }), dispatch: { ui: { set: uiSet, deprecated: vi.fn() } } },
}))
vi.mock('./remoteit', () => ({ apiHeaders: vi.fn().mockResolvedValue({ authorization: 'token' }) }))
vi.mock('../helpers/apiHelper', () => ({ getApiURL: () => 'https://api.test/graphql' }))
vi.mock('./Network', () => ({ default: { offline: vi.fn() } }))
vi.mock('axios', () => ({ default: { request } }))

import { UNSUPPORTED } from './graphQLDaemon'
import {
  graphQLAccountExits,
  graphQLCreateExit,
  graphQLDeviceExit,
  graphQLExit,
  graphQLNetworkExits,
  graphQLOfferedExits,
  graphQLSetDeviceExit,
  graphQLSetExitLan,
  graphQLSetNetworkExit,
} from './graphQLExits'
import * as deviceRuns from './graphQLDeviceRuns'
import {
  EXIT_DEVICE_FIELDS,
  graphQLActionEffects,
  graphQLAddExitDevice,
  graphQLAddProxyDevice,
  graphQLDeviceRuns,
  graphQLRunAction,
  graphQLRunCandidates,
  RunAction,
} from './graphQLDeviceRuns'
import {
  graphQLCreateEndpoint,
  graphQLRenameProxy,
  graphQLSetProxyDomain,
  graphQLSetProxyLabel,
  graphQLSetProxyPublicEndpoints,
} from './graphQLProxy'
import {
  graphQLCreateRemoteit,
  graphQLRemoteitExits,
  graphQLRemoteitProxyCode,
  graphQLRenumberProxyDevice,
} from './graphQLRemoteit'
import { graphQLProxyAccess } from './graphQLProxyAccess'

const answer = (data: object) => ({ data: { data }, headers: {} })
const errors = (...errors: (string | { message: string; extensions?: object })[]) => ({
  data: { errors: errors.map(error => (typeof error === 'string' ? { message: error } : error)) },
  headers: {},
})
// A refusal as graphql words it: its reason in extensions.message.
const refusal = (reason: string) => errors({ message: 'Invalid argument', extensions: { message: reason } })
// What the last request asked.
const asked = () => request.mock.calls.at(-1)?.[0].data as { query: string; variables: ILookup<any> }

const PAT = { id: 'PAT', email: 'pat@example.com' }
const mac = { id: 'xmac', name: 'Office Mac', remoteit: false, offered: true, dormant: false, owner: PAT }
const created = '2026-11-01T10:00:00.000Z'
const RUNS = {
  proxy: null,
  exit: {
    id: 'DEV',
    name: 'Office Mac',
    state: 'ACTIVE',
    joining: false,
    exit: { id: 'xmac', name: 'Office Mac', remoteit: false },
  },
}

beforeEach(() => {
  request.mockReset()
  uiSet.mockReset()
  ui.offline = undefined
  vi.spyOn(console, 'error').mockImplementation(() => {})
})

describe('a network’s exits', () => {
  it('reads each network’s exits, by network, apart from the networks', async () => {
    request.mockResolvedValue(
      answer({ login: { account: { networks: [{ id: 'N1', exits: [mac] }, { id: 'N2', exits: [] }, { id: 'N3' }] } } })
    )
    const exits = await graphQLNetworkExits('ACCOUNT')
    expect(exits instanceof Map && [...exits]).toEqual([
      ['N1', [mac]],
      ['N2', []],
      ['N3', []],
    ])
    expect(asked().variables).toEqual({ accountId: 'ACCOUNT' })
    expect(asked().query).toMatch(/networks \{ id exits \{/)
  })

  it('an API that refuses the exits field on Network: UNSUPPORTED, silently — no error banner', async () => {
    request.mockResolvedValue(errors('Cannot query field "exits" on type "Network".'))
    expect(await graphQLNetworkExits('ACCOUNT')).toBe(UNSUPPORTED)
    expect(uiSet).not.toHaveBeenCalled()
  })

  it('a field this build asks for that the API lacks beside them, or any other error: ERROR, as silently', async () => {
    request.mockResolvedValue(errors('Cannot query field "dormant" on type "Exit".'))
    expect(await graphQLNetworkExits('ACCOUNT')).toBe('ERROR')
    request.mockResolvedValue(errors('boom'))
    expect(await graphQLNetworkExits('ACCOUNT')).toBe('ERROR')
    expect(uiSet).not.toHaveBeenCalled()
  })

  it('an account it cannot read: no network', async () => {
    request.mockResolvedValue(answer({ login: { account: null } }))
    const exits = await graphQLNetworkExits('ACCOUNT')
    expect(exits instanceof Map && exits.size).toBe(0)
  })
})

describe('an account’s exits', () => {
  it('its own and those other accounts share with it, each tag’s date a date', async () => {
    const own = { ...mac, tags: [{ name: 'lab', color: 3, created }] }
    const shared = { ...mac, id: 'xned', owner: { id: 'NED', email: 'ned@example.com' }, tags: [] }
    request.mockResolvedValue(
      answer({ login: { id: 'ME', account: { id: 'ACCOUNT', exits: [own], sharedExits: [shared] } } })
    )
    const exits = await graphQLAccountExits('ACCOUNT')
    expect(exits).toEqual({
      own: [{ ...own, tags: [{ name: 'lab', color: 3, created: new Date(created) }] }],
      shared: [shared],
    })
    expect(typeof exits === 'object' && exits.own[0].tags[0].created).toBeInstanceOf(Date)
    expect(asked().variables).toEqual({ accountId: 'ACCOUNT' })
    expect(asked().query).toMatch(/\bexits \{.*\} sharedExits \{/s)
  })

  it('an account it cannot read: none of either', async () => {
    request.mockResolvedValue(answer({ login: { id: 'ME', account: null } }))
    expect(await graphQLAccountExits('ACCOUNT')).toEqual({ own: [], shared: [] })
  })

  it('an API without exits: UNSUPPORTED, silently', async () => {
    request.mockResolvedValue(errors('Cannot query field "exits" on type "User".'))
    expect(await graphQLAccountExits('ACCOUNT')).toBe(UNSUPPORTED)
    expect(uiSet).not.toHaveBeenCalled()
  })
})

describe('one exit', () => {
  it('with the networks it is offered on, its tags’ dates dates', async () => {
    const exit = { ...mac, tags: [{ name: 'lab', color: 3, created }], networks: [{ id: 'N1', name: 'Office' }] }
    request.mockResolvedValue(answer({ exit }))
    expect(await graphQLExit('xmac')).toEqual({
      ...exit,
      tags: [{ name: 'lab', color: 3, created: new Date(created) }],
    })
    expect(asked().variables).toEqual({ id: 'xmac' })
    expect(asked().query).toContain('networks { id name }')
  })

  it('none for one you may not see', async () => {
    request.mockResolvedValue(answer({ exit: null }))
    expect(await graphQLExit('xmac')).toBeNull()
  })
})

describe('the exits offered', () => {
  it('each with why it is offered', async () => {
    request.mockResolvedValue(answer({ exits: [{ ...mac, reasons: ['SHARED', 'NETWORK'] }] }))
    expect(await graphQLOfferedExits('DEV')).toEqual([{ ...mac, reasons: ['SHARED', 'NETWORK'] }])
    expect(asked().query).toContain('reasons')
  })

  it('to you, or, with a device you manage, those it may use as itself too', async () => {
    request.mockResolvedValue(answer({ exits: [mac] }))
    expect(await graphQLOfferedExits('DEV')).toEqual([mac])
    expect(asked().variables).toEqual({ deviceId: 'DEV' })
    request.mockResolvedValue(answer({ exits: null }))
    expect(await graphQLOfferedExits()).toEqual([])
    expect(asked().variables.deviceId).toBeUndefined()
  })
})

describe('making an exit', () => {
  it('answers the exit made, its tags’ dates dates', async () => {
    const made = { ...mac, tags: [{ name: 'lab', color: 3, created }] }
    request.mockResolvedValue(answer({ createExit: made }))
    expect(await graphQLCreateExit('Office Mac', 'ACCOUNT')).toEqual({
      ...made,
      tags: [{ name: 'lab', color: 3, created: new Date(created) }],
    })
    expect(asked().variables).toEqual({ name: 'Office Mac', accountId: 'ACCOUNT' })
    expect(asked().query).toContain('createExit(name: $name, accountId: $accountId)')
  })

  it('a refusal in graphql’s words; none said where the request failed', async () => {
    request.mockResolvedValue(refusal('a name is 1 to 255 characters'))
    expect(await graphQLCreateExit('')).toEqual({ reason: 'A name is 1 to 255 characters' })
    expect(uiSet).not.toHaveBeenCalled()
    ui.offline = true
    expect(await graphQLCreateExit('Office Mac')).toEqual({ reason: '' })
  })
})

describe('an exit made available on a network', () => {
  it('or no longer, by the network and the exit', async () => {
    request.mockResolvedValue(answer({ setNetworkExit: true }))
    await graphQLSetNetworkExit('N1', 'xmac', true)
    expect(asked().variables).toEqual({ networkId: 'N1', exit: 'xmac', available: true })
    expect(asked().query).toContain('setNetworkExit(networkId: $networkId, exit: $exit, available: $available)')
    await graphQLSetNetworkExit('N1', 'xmac', false)
    expect(asked().variables).toEqual({ networkId: 'N1', exit: 'xmac', available: false })
  })
})

describe('a device’s exit', () => {
  it('reads the exit it uses, the device of it it goes through, and who chose it; an API without them is UNSUPPORTED, silently', async () => {
    const uses = {
      id: 'DEV',
      usesExit: mac,
      usesExitThrough: { id: 'MAC', name: 'Office Mac' },
      exitDormant: false,
      exitSetOnDevice: false,
      exitSetOnDeviceBy: null,
      exitSetBy: { email: 'pat@example.com' },
      exitPolicy: 'cloud+local',
      exitAllowed: null,
      exitPinned: null,
    }
    request.mockResolvedValue(answer({ login: { device: [uses] } }))
    expect(await graphQLDeviceExit('DEV')).toEqual(uses)
    expect(asked().variables).toEqual({ id: ['DEV'] })
    request.mockResolvedValue(errors('Cannot query field "usesExit" on type "Device".'))
    expect(await graphQLDeviceExit('DEV')).toBe(UNSUPPORTED)
    expect(uiSet).not.toHaveBeenCalled()
  })

  it('sends its traffic out through an exit, or none; a refusal comes back in graphql’s words', async () => {
    request.mockResolvedValue(answer({ setDeviceExit: true }))
    await graphQLSetDeviceExit('DEV', 'xmac')
    expect(asked().variables).toEqual({ deviceId: 'DEV', via: 'xmac' })
    expect(asked().query).toContain('setDeviceExit(deviceId: $deviceId, via: $via)')
    await graphQLSetDeviceExit('DEV', null)
    expect(asked().variables).toEqual({ deviceId: 'DEV', via: null })

    request.mockResolvedValue(refusal('it runs this exit: a device does not send its own traffic through it'))
    expect(await graphQLSetDeviceExit('DEV', 'xmac')).toEqual({
      reason: 'It runs this exit: a device does not send its own traffic through it',
    })
    expect(uiSet).not.toHaveBeenCalled()
  })
})

describe('actions on what a device runs', () => {
  const scopes = ['device', 'proxy', 'exit'] as const
  const actions: RunAction[] = ['DRAIN', 'UNDRAIN', 'RETIRE', 'REMOVE']
  // graphql's mutations (docs/PROXY-GROUPS.md §13): on everything the device runs, or on its proxy or its exit alone.
  const MUTATION = {
    device: { DRAIN: 'drainDevice', UNDRAIN: 'undrainDevice', RETIRE: 'retireDevice', REMOVE: 'removeDeviceRuns' },
    proxy: {
      DRAIN: 'drainProxyDevice',
      UNDRAIN: 'undrainProxyDevice',
      RETIRE: 'retireProxyDevice',
      REMOVE: 'removeProxyDevice',
    },
    exit: {
      DRAIN: 'drainExitDevice',
      UNDRAIN: 'undrainExitDevice',
      RETIRE: 'retireExitDevice',
      REMOVE: 'removeExitDevice',
    },
  }
  const cases = scopes.flatMap(scope => actions.map(action => [scope, action, MUTATION[scope][action]] as const))

  it.each(cases)('on the %s, %s is %s, answering what the device runs after', async (scope, action, field) => {
    request.mockResolvedValue(answer({ [field]: RUNS }))
    expect(await graphQLRunAction(scope, 'DEV', action)).toEqual({ runs: RUNS })
    expect(asked().query).toMatch(new RegExp(`\\b${field}\\(deviceId: \\$deviceId`))
  })

  it('a drain says how long it waits for connections to close, where given', async () => {
    for (const scope of scopes) {
      request.mockResolvedValue(answer({ [MUTATION[scope].DRAIN]: RUNS }))
      await graphQLRunAction(scope, 'DEV', 'DRAIN', { maxWaitMinutes: 30, force: true })
      expect(asked().variables).toEqual({ deviceId: 'DEV', maxWaitMinutes: 30 })
      expect(asked().query).toContain('maxWaitMinutes: $maxWaitMinutes')
      await graphQLRunAction(scope, 'DEV', 'DRAIN')
      expect(asked().variables).toEqual({ deviceId: 'DEV' })
    }
  })

  it('a retire ends open connections only where forced', async () => {
    for (const scope of scopes) {
      request.mockResolvedValue(answer({ [MUTATION[scope].RETIRE]: RUNS }))
      await graphQLRunAction(scope, 'DEV', 'RETIRE', { force: true, maxWaitMinutes: 30 })
      expect(asked().variables).toEqual({ deviceId: 'DEV', force: true })
      expect(asked().query).toContain('force: $force')
      await graphQLRunAction(scope, 'DEV', 'RETIRE')
      expect(asked().variables).toEqual({ deviceId: 'DEV', force: false })
    }
  })

  it('an undrain and a remove name the device alone', async () => {
    for (const scope of scopes)
      for (const action of ['UNDRAIN', 'REMOVE'] as const) {
        request.mockResolvedValue(answer({ [MUTATION[scope][action]]: RUNS }))
        await graphQLRunAction(scope, 'DEV', action, { maxWaitMinutes: 30, force: true })
        expect(asked().variables).toEqual({ deviceId: 'DEV' })
      }
  })

  it('a refusal in graphql’s words; none said where the request failed; a device left running nothing, none', async () => {
    request.mockResolvedValue(refusal('connections are open through it: end them, or force it'))
    expect(await graphQLRunAction('device', 'DEV', 'RETIRE')).toEqual({
      reason: 'Connections are open through it: end them, or force it',
    })
    expect(uiSet).not.toHaveBeenCalled()

    request.mockResolvedValue(answer({ removeExitDevice: null }))
    expect(await graphQLRunAction('exit', 'DEV', 'REMOVE')).toEqual({ runs: { proxy: null, exit: null } })

    ui.offline = true
    request.mockClear()
    expect(await graphQLRunAction('exit', 'DEV', 'REMOVE')).toEqual({ reason: '' })
    expect(request).not.toHaveBeenCalled()
  })
})

describe('what an action would do', () => {
  const effect = {
    kind: 'exit',
    id: 'xmac',
    name: 'Office Mac',
    state: 'ACTIVE',
    after: 'retired',
    sessions: 2,
    ends: true,
    endpoints: 0,
    users: 3,
    moved: 3,
    inService: 0,
    dormant: true,
    refusal: null,
  }

  it('asks for the action, forced or not, and answers each effect; none for a device it acts on nothing of', async () => {
    request.mockResolvedValue(answer({ login: { device: [{ id: 'DEV', actionEffects: [effect] }] } }))
    expect(await graphQLActionEffects('DEV', 'RETIRE', true)).toEqual([effect])
    expect(asked().variables).toEqual({ id: ['DEV'], action: 'RETIRE', force: true })
    await graphQLActionEffects('DEV', 'DRAIN')
    expect(asked().variables).toEqual({ id: ['DEV'], action: 'DRAIN', force: false })

    request.mockResolvedValue(answer({ login: { device: [{ id: 'DEV', actionEffects: null }] } }))
    expect(await graphQLActionEffects('DEV', 'REMOVE')).toEqual([])
    request.mockResolvedValue(answer({ login: { device: [] } }))
    expect(await graphQLActionEffects('DEV', 'REMOVE')).toEqual([])
  })

  it('an API without them: UNSUPPORTED, silently', async () => {
    request.mockResolvedValue(errors('Cannot query field "actionEffects" on type "Device".'))
    expect(await graphQLActionEffects('DEV', 'DELETE')).toBe(UNSUPPORTED)
    expect(uiSet).not.toHaveBeenCalled()
  })
})

describe('a device added', () => {
  it('to a proxy: one of remote.it’s with the number of its e<number>-r3 name, where given', async () => {
    request.mockResolvedValue(answer({ addProxyDevice: RUNS }))
    expect(await graphQLAddProxyDevice('PROXY', 'DEV', 3)).toEqual({ runs: RUNS })
    expect(asked().variables).toEqual({ proxy: 'PROXY', deviceId: 'DEV', number: 3 })
    expect(asked().query).toContain('$number: Int')
    await graphQLAddProxyDevice('PROXY', 'DEV')
    expect(asked().variables).toEqual({ proxy: 'PROXY', deviceId: 'DEV' })
  })

  it('to an exit; a refusal in graphql’s words', async () => {
    request.mockResolvedValue(answer({ addExitDevice: RUNS }))
    expect(await graphQLAddExitDevice('xmac', 'DEV')).toEqual({ runs: RUNS })
    expect(asked().variables).toEqual({ exit: 'xmac', deviceId: 'DEV' })
    request.mockResolvedValue(refusal('the device and the exit are in different accounts'))
    expect(await graphQLAddExitDevice('xmac', 'DEV')).toEqual({
      reason: 'The device and the exit are in different accounts',
    })
  })
})

describe('an endpoint', () => {
  it('is made on the proxy named', async () => {
    request.mockResolvedValue(answer({ createEndpoint: { id: 'E1' } }))
    await graphQLCreateEndpoint('S1', { kind: 'https', access: 'signed-in', lifetime: 'permanent', proxy: 'PROXY' })
    expect(asked().variables).toEqual({
      serviceId: 'S1',
      kind: 'https',
      access: 'signed-in',
      lifetime: 'permanent',
      proxy: 'PROXY',
    })
    expect(asked().query).toContain('proxy: $proxy')
  })
})

describe('remote.it’s proxies and exits', () => {
  it('one made at a location: a proxy or an exit', async () => {
    const at = { location: 'pdx1', latitude: 45.5, longitude: -122.7, provider: 'AWS us-west-2 (Boardman)' }
    request.mockResolvedValue(answer({ createRemoteitExit: { id: 'pdx1b' } }))
    await graphQLCreateRemoteit('exit', at)
    expect(asked().query).toContain('createRemoteitExit(location: $location')
    expect(asked().variables).toEqual(at)
    request.mockResolvedValue(answer({ createRemoteitProxy: { id: 'P' } }))
    await graphQLCreateRemoteit('proxy', at)
    expect(asked().query).toContain('createRemoteitProxy(location: $location')
  })

  it('their exits, for remote.it’s admins; an API without them is UNSUPPORTED, silently', async () => {
    const pdx = { id: 'pdx1a', name: 'remote.it pdx1a', remoteit: true, latitude: 45.5, longitude: -122.7, devices: [] }
    request.mockResolvedValue(answer({ remoteitExits: [pdx] }))
    expect(await graphQLRemoteitExits()).toEqual([pdx])
    request.mockResolvedValue(errors('Cannot query field "remoteitExits" on type "Query".'))
    expect(await graphQLRemoteitExits()).toBe(UNSUPPORTED)
    expect(uiSet).not.toHaveBeenCalled()
  })

  it('the code a machine installs with; ERROR where none is given', async () => {
    request.mockResolvedValue(answer({ remoteitProxyCode: 'CODE' }))
    expect(await graphQLRemoteitProxyCode()).toBe('CODE')
    request.mockResolvedValue(answer({ remoteitProxyCode: null }))
    expect(await graphQLRemoteitProxyCode()).toBe('ERROR')
  })
})

describe('the devices that could run a proxy or an exit', () => {
  const candidate = { id: 'DEV', name: 'Office Mac', fit: true, refusal: null, runs: { proxy: null, exit: null } }

  it('for the exit or proxy named, each fit or why not, and what it runs', async () => {
    request.mockResolvedValue(answer({ exitCandidates: [candidate] }))
    expect(await graphQLRunCandidates('exit', { id: 'xmac' })).toEqual([candidate])
    expect(asked().query).toContain('exitCandidates(exit: $id')
    expect(asked().variables).toEqual({ id: 'xmac', accountId: undefined, deviceIds: undefined })
    request.mockResolvedValue(answer({ proxyCandidates: [] }))
    expect(await graphQLRunCandidates('proxy', { accountId: 'ACCOUNT' }, ['DEV'])).toEqual([])
    expect(asked().query).toContain('proxyCandidates(proxy: $id')
    expect(asked().variables).toEqual({ id: undefined, accountId: 'ACCOUNT', deviceIds: ['DEV'] })
  })

  it('a refusal — too many to weigh whole — in graphql’s words', async () => {
    request.mockResolvedValue(refusal('the account has 1200 devices: name those to weigh (deviceIds), at most 1000'))
    expect(await graphQLRunCandidates('exit', { id: 'xmac' })).toEqual({
      reason: 'The account has 1200 devices: name those to weigh (deviceIds), at most 1000',
    })
  })
})

describe('its devices’ local networks: the exit’s setting', () => {
  it('opened or closed on the exit by its id; refused in graphql’s words, or none said where the request failed', async () => {
    request.mockResolvedValue(answer({ setExitLan: { id: 'xmac' } }))
    expect(await graphQLSetExitLan('xmac', true)).toEqual(answer({ setExitLan: { id: 'xmac' } }))
    expect(asked().variables).toEqual({ exitId: 'xmac', lan: true })
    expect(asked().query).toContain('setExitLan(exitId: $exitId, lan: $lan)')
    await graphQLSetExitLan('xmac', false)
    expect(asked().variables).toEqual({ exitId: 'xmac', lan: false })
    request.mockResolvedValue(refusal('garage Pi is not a device you manage'))
    expect(await graphQLSetExitLan('xmac', true)).toEqual({ reason: 'Garage Pi is not a device you manage' })
    expect(uiSet).not.toHaveBeenCalled()
    ui.offline = true
    expect(await graphQLSetExitLan('xmac', false)).toBe('ERROR')
  })

  it('read with each exit — open or not, and why you may not open it — and each device as its machine has it', async () => {
    request.mockResolvedValue(answer({ exit: { ...mac, lan: true, lanRefusal: null, tags: [] } }))
    expect(await graphQLExit('xmac')).toMatchObject({ lan: true, lanRefusal: null })
    expect(asked().query).toMatch(/\bdormant lan lanRefusal\b/)
    expect(asked().query).toContain(`devices { ${EXIT_DEVICE_FIELDS} }`)
    request.mockResolvedValue(answer({ login: { id: 'ME', account: { id: 'ACCOUNT', exits: [], sharedExits: [] } } }))
    await graphQLAccountExits('ACCOUNT')
    expect(asked().query).toMatch(/exits \{[^}]*\blan lanRefusal\b.*\} sharedExits \{[^}]*\blan lanRefusal\b/s)
  })

  it('a device in an exit says why its LAN is not as its exit says; nothing of the device’s own to set any more', async () => {
    expect(EXIT_DEVICE_FIELDS).toMatch(/\blan lanReason$/)
    expect(EXIT_DEVICE_FIELDS).not.toContain('lanRefusal')
    request.mockResolvedValue(answer({ login: { device: [{ id: 'DEV', runs: RUNS }] } }))
    await graphQLDeviceRuns('DEV')
    expect(asked().query).toContain('lan lanReason')
    expect(asked().query).not.toContain('lanRefusal')
    expect('graphQLSetExitDeviceLan' in deviceRuns).toBe(false)
  })

  it('remote.it’s exits are read with theirs too — never open —, so adding a machine says what it opens as anywhere', async () => {
    request.mockResolvedValue(answer({ remoteitExits: [] }))
    await graphQLRemoteitExits()
    expect(asked().query).toMatch(/\busers lan devices \{/)
  })
})

describe('a proxy’s names and public endpoints', () => {
  const moved = { host: 'gw2-acme.r3proxy.com', domain: null, addresses: [], certificate: 'pending', applied: false }

  it('its name alone renamed', async () => {
    request.mockResolvedValue(answer({ renameProxy: { id: 'P1' } }))
    await graphQLRenameProxy('P1', 'Gateway')
    expect(asked().variables).toEqual({ proxy: 'P1', name: 'Gateway' })
  })

  it('a label or a domain: what moves said, or with apply done; refused in graphql’s words', async () => {
    request.mockResolvedValue(answer({ setProxyLabel: moved }))
    expect(await graphQLSetProxyLabel('P1', 'gw2', false)).toEqual(moved)
    expect(asked().variables).toEqual({ proxy: 'P1', label: 'gw2', apply: false })
    request.mockResolvedValue(answer({ setProxyDomain: { ...moved, applied: true } }))
    expect(await graphQLSetProxyDomain('P1', null, true)).toEqual({ ...moved, applied: true })
    expect(asked().variables).toEqual({ proxy: 'P1', domain: null, apply: true })
    request.mockResolvedValue(refusal('r3proxy.com is remote.it’s'))
    expect(await graphQLSetProxyDomain('P1', 'r3proxy.com', false)).toEqual({ reason: 'R3proxy.com is remote.it’s' })
  })

  it('public endpoints given up, confirmed or not', async () => {
    request.mockResolvedValue(answer({ setProxyPublicEndpoints: { id: 'P1', publicEndpoints: false } }))
    await graphQLSetProxyPublicEndpoints('P1', false, true)
    expect(asked().variables).toEqual({ proxy: 'P1', publicEndpoints: false, confirm: true })
  })
})

describe('renumbering one of remote.it’s machines', () => {
  it('said, or with apply done; refused in graphql’s words', async () => {
    const said = { from: 'e1-r3.x', to: 'e3-r3.x', certificate: 'moved', record: true, applied: false }
    request.mockResolvedValue(answer({ renumberProxyDevice: said }))
    expect(await graphQLRenumberProxyDevice('E1', 3, false)).toEqual(said)
    expect(asked().variables).toEqual({ deviceId: 'E1', number: 3, apply: false })
    request.mockResolvedValue(refusal('e3-r3.x is another device’s'))
    expect(await graphQLRenumberProxyDevice('E1', 3, true)).toEqual({ reason: 'E3-r3.x is another device’s' })
  })
})

describe('who visited a proxy', () => {
  const page = { items: [], hasMore: false, last: null }

  it('a service’s, a proxy’s or a device’s; for admins, one proxy’s, one machine’s, or all', async () => {
    request.mockResolvedValue(answer({ proxyAccess: page }))
    await graphQLProxyAccess({ proxy: 'P1' })
    expect(asked().variables).toMatchObject({ proxy: 'P1', deviceId: undefined, serviceId: undefined })
    await graphQLProxyAccess({ deviceId: 'E1' })
    expect(asked().variables).toMatchObject({ deviceId: 'E1', proxy: undefined })
    expect(asked().query).toContain('deviceId')
    request.mockResolvedValue(answer({ adminProxyAccess: page }))
    await graphQLProxyAccess({ admin: true, proxy: 'P1' })
    expect(asked().query).toContain('adminProxyAccess(proxy: $proxy, deviceId: $deviceId')
    expect(asked().variables).toMatchObject({ proxy: 'P1', deviceId: undefined })
    await graphQLProxyAccess({ admin: true })
    expect(asked().variables).toMatchObject({ proxy: undefined, deviceId: undefined })
  })
})

