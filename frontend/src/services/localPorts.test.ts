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
  probeNames,
  resetLocalPorts,
  setNamesResolve,
  thisMachine,
} from './localPorts'

const MAC = '80:00:00:00:00:00:00:A1'
const shellOf = (platform: string, capabilities: string[] = []) => ({
  compatible: true,
  info: { platform, capabilities },
  has: (c: string) => capabilities.includes(c),
  call: async () => ({ device: { uid: MAC } }),
})

beforeEach(() => {
  resetLocalPorts()
  request.mockReset()
  beacon.mockReset()
  shell.value = undefined
  localStorage.clear()
})

describe('this machine', () => {
  it("an app: the shell's own device, and what the shell says", async () => {
    shell.value = shellOf('mac')
    expect(await thisMachine()).toEqual({ id: MAC, platform: 'mac', localPorts: false })
    expect(beacon).not.toHaveBeenCalled()
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
    request.mockResolvedValueOnce({ data: { data: { openLocalPort: { port: 33000 } } } })
    expect(await openLocalPort(MAC, 'S', 8080)).toEqual({ port: 33000 })
    expect(request.mock.calls[0][1]).toEqual({ deviceId: MAC, serviceId: 'S', port: 8080 })
    request.mockResolvedValueOnce({ reason: "Port 8080 is web-pi's on this machine" })
    expect(await openLocalPort(MAC, 'S', 8080)).toEqual({ reason: "Port 8080 is web-pi's on this machine" })
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
    request.mockResolvedValue({ data: { data: { openLocalPort: { ...local, https: true, httpsAvailable: true } } } })
    await openLocalPort('M', 'S', undefined, true)
    const [query, variables] = request.mock.calls[0]
    expect(query).toContain('https: $https')
    expect(query).toContain('httpsAvailable')
    expect(variables).toEqual({ deviceId: 'M', serviceId: 'S', port: undefined, https: true })
  })
})
