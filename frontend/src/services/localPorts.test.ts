import { describe, it, expect, vi, beforeEach } from 'vitest'

const { request, shell, beacon } = vi.hoisted(() => ({ request: vi.fn(), shell: { value: undefined as any }, beacon: vi.fn() }))
vi.mock('./graphQL', () => ({
  graphQLBasicRequest: (...args: unknown[]) => request(...args),
  graphQLRequestWithReason: (...args: unknown[]) => request(...args),
}))
vi.mock('./thisDevice', () => ({ thisDevice: async () => shell.value }))
vi.mock('./localSubnet', () => ({ beaconDevice: () => beacon() }))
vi.mock('./browser', () => ({ default: { isIOS: false } }))

import {
  localPortWebURL,
  wantsHttps,
  namesResolve,
  offersLocalPorts,
  openLocalPort,
  parseScopeServed,
  probeNames,
  scopeFor,
  resetLocalPorts,
  setNamesResolve,
  thisMachine,
} from './localPorts'

const MAC = '80:00:00:00:00:00:00:A1'
const shellOf = (platform: string, capabilities: string[] = [], signedIn?: { sub: string; email?: string }) => ({
  compatible: true,
  info: { platform, capabilities },
  has: (c: string) => capabilities.includes(c),
  call: async () => ({ device: { uid: MAC }, ...(signedIn && { signedIn }) }),
})

// The schema probe's answer: an API whose openLocalPort takes scope and whose LocalPort has it, or one before scope.
const SCOPED = {
  mutation: { fields: [{ name: 'openLocalPort', args: [{ name: 'deviceId' }, { name: 'https' }, { name: 'scope' }] }] },
  localPort: { fields: [{ name: 'port' }, { name: 'scope' }] },
}
const UNSCOPED = { mutation: { fields: [{ name: 'openLocalPort', args: [{ name: 'deviceId' }, { name: 'https' }] }] }, localPort: { fields: [{ name: 'port' }] } }
let schema: any
const isProbe = (query: unknown) => String(query).includes('__type')
// The calls other than the schema probe.
const calls = () => request.mock.calls.filter(([query]) => !isProbe(query))
// What graphql answers: the probe from `schema`, everything else `answer`.
const answering = (answer: unknown) =>
  request.mockImplementation(async (query: unknown) => (isProbe(query) ? { data: { data: schema } } : answer))

beforeEach(() => {
  resetLocalPorts()
  schema = UNSCOPED
  request.mockReset()
  beacon.mockReset()
  shell.value = undefined
  localStorage.clear()
})

describe('this machine', () => {
  it("an app: the shell's own device, and what the shell says — who is signed in on its account too", async () => {
    shell.value = shellOf('mac')
    expect(await thisMachine()).toEqual({ id: MAC, platform: 'mac', localPorts: false })
    expect(beacon).not.toHaveBeenCalled()
    resetLocalPorts()
    shell.value = shellOf('mac', [], { sub: 'U1', email: 'u@example.com' })
    expect(await thisMachine()).toEqual({ id: MAC, platform: 'mac', localPorts: false, signedIn: 'U1' })
  })

  it('a browser: the device the beacon was seen by; none, asked again later', async () => {
    beacon.mockResolvedValueOnce(null).mockResolvedValueOnce(MAC)
    expect(await thisMachine()).toBeNull()
    expect((await thisMachine())?.id).toBe(MAC)
  })
})

describe('offered', () => {
  it('wherever our daemon runs; on an iPhone only with the capability or the Test UI switch', () => {
    expect(offersLocalPorts(null)).toBe(false)
    expect(offersLocalPorts({ id: MAC, platform: 'mac' })).toBe(true)
    expect(offersLocalPorts({ id: MAC })).toBe(true)
    expect(offersLocalPorts({ id: MAC, platform: 'android' })).toBe(true)
    expect(offersLocalPorts({ id: MAC, platform: 'ios' })).toBe(false)
    expect(offersLocalPorts({ id: MAC, platform: 'ios', localPorts: true })).toBe(true)
    expect(offersLocalPorts({ id: MAC, platform: 'ios' }, true)).toBe(true)
  })
})

describe('open', () => {
  it("graphql's answer, or its refusal in its own words", async () => {
    answering({ data: { data: { openLocalPort: { port: 33000 } } } })
    expect(await openLocalPort(MAC, 'S', 8080)).toEqual({ port: 33000 })
    expect(calls()[0][1]).toEqual({ deviceId: MAC, serviceId: 'S', port: 8080 })
    answering({ reason: "Port 8080 is web-pi's on this machine" })
    expect(await openLocalPort(MAC, 'S', 8080)).toEqual({ reason: "Port 8080 is web-pi's on this machine" })
  })
})

// Whose a port is (graphql-api docs/PROXY-GROUPS.md §15): the app's own on this machine, for the person signed in on
// its account, is theirs; the portal's elsewhere, the machine's.
describe('scope', () => {
  it('ACCOUNT only where the app runs here and the person signed in on its account is the one using it', () => {
    expect(scopeFor({ id: MAC, signedIn: 'u1' }, 'U1')).toBe('ACCOUNT')
    expect(scopeFor({ id: MAC, signedIn: 'U2' }, 'U1')).toBeUndefined()
    expect(scopeFor({ id: MAC }, 'U1')).toBeUndefined() // a browser: the beacon's device, no account known
    expect(scopeFor({ id: MAC, signedIn: 'U1' }, undefined)).toBeUndefined()
    expect(scopeFor(null, 'U1')).toBeUndefined()
  })

  it('the API takes it where openLocalPort has the argument and LocalPort the field', () => {
    expect(parseScopeServed(SCOPED)).toBe(true)
    expect(parseScopeServed(UNSCOPED)).toBe(false)
    expect(parseScopeServed({ ...SCOPED, localPort: UNSCOPED.localPort })).toBe(false)
    expect(parseScopeServed(undefined)).toBe(false)
  })

  it('asked for, and read, where the API takes it', async () => {
    schema = SCOPED
    answering({ data: { data: { openLocalPort: { port: 33000, scope: 'ACCOUNT' } } } })
    expect(await openLocalPort(MAC, 'S', undefined, undefined, 'ACCOUNT')).toEqual({ port: 33000, scope: 'ACCOUNT' })
    const [query, variables] = calls()[0]
    expect(query).toContain('$scope: PortScope')
    expect(query).toContain('scope: $scope')
    expect(query).toMatch(/\{[^{}]*\bscope\b[^{}]*\} \}$/)
    expect(variables).toMatchObject({ scope: 'ACCOUNT' })
    // None asked: none sent, the field still read.
    await openLocalPort(MAC, 'S')
    expect(calls()[1][0]).not.toContain('$scope')
    expect(calls()[1][1]).not.toHaveProperty('scope')
    expect(calls()[1][0]).toMatch(/httpsAvailable scope/)
  })

  it('an API before it: neither asked for nor read', async () => {
    answering({ data: { data: { openLocalPort: { port: 33000 } } } })
    await openLocalPort(MAC, 'S', undefined, undefined, 'ACCOUNT')
    const [query, variables] = calls()[0]
    expect(query).not.toContain('scope')
    expect(variables).not.toHaveProperty('scope')
  })

  it('the schema read once; a failed read, again next time', async () => {
    request.mockImplementation(async (query: unknown) => (isProbe(query) ? 'ERROR' : { data: { data: { openLocalPort: {} } } }))
    await openLocalPort(MAC, 'S', undefined, undefined, 'ACCOUNT')
    expect(calls()[0][0]).not.toContain('scope')
    schema = SCOPED
    answering({ data: { data: { openLocalPort: {} } } })
    await openLocalPort(MAC, 'S', undefined, undefined, 'ACCOUNT')
    await openLocalPort(MAC, 'S', undefined, undefined, 'ACCOUNT')
    expect(calls()[1][0]).toContain('scope: $scope')
    expect(request.mock.calls.filter(([query]) => isProbe(query))).toHaveLength(2)
  })
})

describe('the name or localhost', () => {
  it('http on the name, or on localhost', () => {
    expect(localPortWebURL({ host: 'web-pi.at.remote.it', port: 33000 }, true)).toBe('http://web-pi.at.remote.it:33000')
    expect(localPortWebURL({ host: 'web-pi.at.remote.it', port: 33000 }, false)).toBe('http://localhost:33000')
  })

  it('an https page, or one not from this machine, cannot probe: unknown, and nothing fetched', async () => {
    const fetch = vi.spyOn(globalThis, 'fetch')
    expect(await probeNames({ protocol: 'https:', hostname: 'app.remote.it', port: '' })).toBeUndefined()
    expect(await probeNames({ protocol: 'http:', hostname: 'example.com', port: '' })).toBeUndefined()
    expect(fetch).not.toHaveBeenCalled()
  })

  it("a page from this machine asks its own port under a name: any answer is yes, a failure no", async () => {
    const fetch = vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(new Response(null))
    expect(await probeNames({ protocol: 'http:', hostname: 'localhost', port: '29999' })).toBe(true)
    expect(fetch.mock.calls[0][0]).toBe('http://probe.at.remote.it:29999/')
    expect(fetch.mock.calls[0][1]).toMatchObject({ mode: 'no-cors' })
    fetch.mockRejectedValueOnce(new TypeError('Failed to fetch'))
    expect(await probeNames({ protocol: 'http:', hostname: '127.0.0.1', port: '8080' })).toBe(false)

    fetch.mockRestore()
  })

  it("the person's choice is kept", async () => {
    setNamesResolve(false)
    expect(await namesResolve()).toBe(false)
    setNamesResolve(true)
    expect(await namesResolve()).toBe(true)
  })
})

describe('https (graphql-api docs/LOCAL-PORT.md, "TLS")', () => {
  const local = { host: 'ui-pi.at.remote.it', port: 33000 }

  it('https on the name where it is served so — never localhost, which the certificate does not name; else http', () => {
    expect(localPortWebURL({ ...local, https: true }, true)).toBe('https://ui-pi.at.remote.it:33000')
    expect(localPortWebURL({ ...local, https: true }, false)).toBe('https://ui-pi.at.remote.it:33000')
    expect(localPortWebURL({ ...local, https: false }, true)).toBe('http://ui-pi.at.remote.it:33000')
    expect(localPortWebURL({ ...local, https: false }, false)).toBe('http://localhost:33000')
  })

  it('asked for the first time a web service is opened; after that, as the person left it', () => {
    expect(wantsHttps(true, null)).toBe(true)
    expect(wantsHttps(true, { initiatorId: null })).toBe(true)
    expect(wantsHttps(true, { initiatorId: 'i1' })).toBe(false)
    expect(wantsHttps(false, null)).toBe(false)
  })

  it('the open sends https, and the fields are read', async () => {
    answering({ data: { data: { openLocalPort: { ...local, https: true, httpsAvailable: true } } } })
    await openLocalPort('M', 'S', undefined, true)
    const [query, variables] = calls()[0]
    expect(query).toContain('https: $https')
    expect(query).toContain('httpsAvailable')
    expect(variables).toEqual({ deviceId: 'M', serviceId: 'S', port: undefined, https: true })
  })
})
