import { describe, it, expect, beforeAll, afterEach } from 'vitest'
import { initialize } from '@common/adaptor'
import { getApplication, isWebType, getApplicationType, webTypeOf } from '@common/applications'
import { DEFAULT_CONNECTION, DEFAULT_SERVICE } from '@common/constants'

const HTTP = 7
const TCP = 1
const environment = { portal: true } as IEnvironment

beforeAll(() =>
  initialize({
    getState: () => ({ environment, preferences: {} as IPreferences }),
    getCloudData: typeId => ({ proxy: typeId === HTTP } as IApplicationType),
    escapeRegex: string => string,
  })
)

const service = (typeID: number, attributes: IService['attributes'] = {}): IService => ({
  ...DEFAULT_SERVICE,
  id: 'service-1',
  typeID,
  attributes,
})
const connection = (update: Partial<IConnection>): IConnection => ({
  ...DEFAULT_CONNECTION,
  id: 'service-1',
  ...update,
})

describe('public reverse proxy launch template', () => {
  afterEach(() => {
    environment.portal = true
  })

  it('drops the port, which the cloud reverse proxy never has', () => {
    const app = getApplication(service(HTTP), connection({ public: true }))
    expect(app.publicReverseProxy).toBe(true)
    expect(app.template).toBe('https://[host]')
    expect(app.defaultTemplate).toBe('https://[host]')
  })

  it('drops the port from a service launch template', () => {
    const app = getApplication(
      service(HTTP, { launchTemplate: 'https://[host]:[port]/admin' }),
      connection({ public: true })
    )
    expect(app.template).toBe('https://[host]/admin')
  })

  it('keeps the port on a local connection', () => {
    const app = getApplication(service(HTTP), connection({ public: false }))
    expect(app.publicReverseProxy).toBe(false)
    expect(app.template).toBe('https://[host]:[port]')
  })

  it('keeps the port on a public port proxy', () => {
    const app = getApplication(service(TCP), connection({ public: true }))
    expect(app.publicReverseProxy).toBe(false)
    expect(app.template).toBe('https://[host]:[port]')
  })

  it('drops every port from a service launch template', () => {
    const app = getApplication(
      service(HTTP, { launchTemplate: 'https://[host]:[port]/?next=[host]:[port]' }),
      connection({ public: true })
    )
    expect(app.template).toBe('https://[host]/?next=[host]')
  })

  it('launches https from an http service template', () => {
    const app = getApplication(service(HTTP, { launchTemplate: 'http://[host]:[port]' }), connection({ public: true }))
    expect(app.template).toBe('https://[host]')
  })

  it('launches https without the port from a saved connection template', () => {
    const app = getApplication(
      service(HTTP),
      connection({ public: true, launchTemplates: { URL: 'http://[host]:[port]/admin' } })
    )
    expect(app.template).toBe('https://[host]/admin')
  })

  it('keeps a saved http template on a local connection', () => {
    const app = getApplication(
      service(HTTP),
      connection({ public: false, launchTemplates: { URL: 'http://[host]:[port]/admin' } })
    )
    expect(app.template).toBe('http://[host]:[port]/admin')
  })

  it('keeps the template on desktop, where the connection can go back to a local route', () => {
    environment.portal = false
    const app = getApplication(service(HTTP, { launchTemplate: 'http://[host]:[port]' }), connection({ public: true }))
    expect(app.publicReverseProxy).toBe(true)
    expect(app.publicOnlyTemplate).toBe(false)
    expect(app.template).toBe('http://[host]:[port]')
  })

  it('is not a public reverse proxy on a persistent connect link', () => {
    const app = getApplication(service(HTTP), connection({ public: true, connectLink: true }))
    expect(app.publicReverseProxy).toBe(false)
  })
})

// Before the cloud's list of types is loaded, what only it says is not known — never taken for not web.
describe('whether a type is a web one', () => {
  const list = [
    { id: 7, scheme: 'http', proxy: true },
    { id: 48, scheme: '', proxy: true },
    { id: 28, scheme: 'ssh', proxy: false },
    { id: 900, scheme: 'https', proxy: true },
  ] as IApplicationType[]

  it('is the list’s to say, once it is loaded', () => {
    for (const id of [7, 48, 28, 900, 901])
      expect(webTypeOf(id, list)).toBe(
        isWebType(
          getApplicationType(id),
          list.find(type => type.id === id)
        )
      )
    expect([7, 48, 28, 900, 901].map(id => webTypeOf(id, list))).toEqual([true, true, false, true, false])
  })

  it('is known before where the app itself knows: a web form, or a protocol no browser opens', () => {
    expect([7, 8, 33, 37, 38, 42].map(id => webTypeOf(id, []))).toEqual(Array(6).fill(true))
    expect([1, 4, 5, 28, 34, 39, 41, 44, 45, 46, 49, 32769, 40000].map(id => webTypeOf(id, []))).toEqual(
      Array(13).fill(false)
    )
    expect(webTypeOf(undefined, [])).toBe(false)
  })

  it('is not known before where only the list says: ScreenView, Docker, a type the app does not know', () => {
    expect([48, 47, 900].map(id => webTypeOf(id, []))).toEqual([undefined, undefined, undefined])
  })
})
