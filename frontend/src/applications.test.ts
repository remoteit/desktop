import { describe, it, expect, beforeAll } from 'vitest'
import { initialize } from '@common/adaptor'
import { getApplication } from '@common/applications'
import { DEFAULT_CONNECTION, DEFAULT_SERVICE } from '@common/constants'

const HTTP = 7
const TCP = 1

beforeAll(() =>
  initialize({
    getState: () => ({ environment: { portal: true } as IEnvironment, preferences: {} as IPreferences }),
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

  it('is not a public reverse proxy on a persistent connect link', () => {
    const app = getApplication(service(HTTP), connection({ public: true, connectLink: true }))
    expect(app.publicReverseProxy).toBe(false)
  })
})
