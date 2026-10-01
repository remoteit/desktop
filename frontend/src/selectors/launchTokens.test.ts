import { describe, it, expect } from 'vitest'
import { getApplication } from '@common/applications'

// What a launch asked for and was given, kept per service in the person's cloud attributes (helpers/connectionHelper
// saveLaunchTokens): it fills what the connection leaves empty, ahead of their defaults for the type.
describe('saved launch tokens', () => {
  const service = { id: 'S1', typeID: 28, attributes: {} } as unknown as IService
  const connection = { id: 'S1', host: 'web1-acme.on.remote.it', port: 22 } as unknown as IConnection
  const ssh = (connected: Partial<IConnection>, saved: ILookup<string>, defaults: ILookup<any> = {}) => {
    const app = getApplication(service, { ...connection, ...connected } as IConnection, { 28: defaults })
    app.savedTokens = saved
    return app
  }

  it('fill a token the connection leaves empty, so the launch asks no more', () => {
    expect(ssh({}, {}).missingTokens).toContain('username')
    const app = ssh({ username: undefined } as any, { username: 'pi' })
    expect(app.missingTokens).not.toContain('username')
    expect(app.value('username')).toBe('pi')
  })

  it('come ahead of the defaults for the type, behind what the connection itself has', () => {
    expect(ssh({}, { username: 'pi' }, { username: 'admin' }).value('username')).toBe('pi')
    expect(ssh({ username: 'root' } as any, { username: 'pi' }).value('username')).toBe('root')
  })
})
