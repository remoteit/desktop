import { describe, it, expect, vi, beforeEach } from 'vitest'

const { post, request, errors, lockFields } = vi.hoisted(() => ({
  post: vi.fn(),
  request: vi.fn(),
  errors: vi.fn(),
  lockFields: vi.fn(),
}))
vi.mock('./post', () => ({ post }))
vi.mock('./graphQL', () => ({ graphQLBasicRequest: request, graphQLGetErrors: errors }))
// What the schema says of an app's product lock (services/productPolicy reads it): an API without product apps first.
vi.mock('./productPolicy', async importOriginal => ({
  ...(await importOriginal<typeof import('./productPolicy')>()),
  appPolicyFields: lockFields,
}))

import { graphQLAvailableApps, graphQLDeviceApps, graphQLSetDeviceApp, graphQLSetDeviceAppSetting, needsNewer } from './graphQLDeviceApps'

beforeEach(() => {
  post.mockReset()
  request.mockReset()
  errors.mockReset().mockReturnValue(undefined)
  lockFields.mockReset().mockResolvedValue('')
})

const answer = (data: any) => ({ data: { data } })

const aiCommands = {
  name: 'ai_commands',
  type: 'bool',
  label: 'Allow AI commands',
  help: null,
  default: true,
  value: null, // none set: the declared default
  at: null,
  by: null,
  onDevice: false,
  control: 'cloud+local',
  locked: null,
  deprecated: null,
  choices: null,
}

const consoleApp = {
  id: 'remoteit.console',
  name: 'Console',
  publisher: 'remote.it',
  root: true,
  on: true,
  channel: 'stable',
  version: '1.4.0',
  state: 'running',
  detail: null,
  serviceId: 'S1',
  settings: [aiCommands],
}

describe('Device.apps', () => {
  it('asks each app’s fields as the design names them, and its settings’ declaration and state', async () => {
    post.mockResolvedValue(answer({ login: { device: [{ id: 'D1', apps: [consoleApp] }] } }))
    const apps = await graphQLDeviceApps('D1')
    const { query, variables } = post.mock.calls[0][0]
    expect(variables).toEqual({ id: ['D1'] })
    for (const field of ['id', 'name', 'publisher', 'root', 'on', 'channel', 'version', 'state', 'detail', 'serviceId'])
      expect(query).toMatch(new RegExp(`\\b${field}\\b`))
    expect(query).toContain(
      'settings { name type label help default value at by onDevice control locked { product level } deprecated choices { value label } declaration }'
    )
    // The console's host key and port are not the app's: its own extras ask them (components/ConsoleApp).
    expect(query).not.toMatch(/hostKey|port/)
    expect(apps?.[0].settings[0].value).toBe(true)
  })

  it('a setting’s lock only where it names a product or a level', async () => {
    post.mockResolvedValue(
      answer({
        login: {
          device: [
            {
              apps: [
                {
                  ...consoleApp,
                  settings: [
                    { ...aiCommands, value: false, locked: { product: null, level: null } },
                    { ...aiCommands, name: 'x', locked: { product: 'Acme', level: 'synced' } },
                  ],
                },
              ],
            },
          ],
        },
      })
    )
    const [app] = (await graphQLDeviceApps('D1'))!
    expect(app.settings[0].value).toBe(false)
    expect(app.settings[0].locked).toBeNull()
    expect(app.settings[1].locked).toEqual({ product: 'Acme', level: 'synced' })
  })

  it('whether its product holds it on or off, where the API says: which product, how firmly', async () => {
    lockFields.mockResolvedValue('locked { product level }')
    post.mockResolvedValue(
      answer({
        login: {
          device: [
            {
              apps: [
                { ...consoleApp, locked: { product: 'Acme', level: 'enforced' } },
                { ...consoleApp, id: 'acme.logs', locked: null },
              ],
            },
          ],
        },
      })
    )
    const apps = (await graphQLDeviceApps('D1'))!
    expect(post.mock.calls[0][0].query).toMatch(
      /serviceId settings \{[^}]*\{[^}]*}[^}]*\{[^}]*} declaration } locked \{ product level }/
    )
    expect(apps[0].locked).toEqual({ product: 'Acme', level: 'enforced' })
    expect(apps[1].locked).toBeNull()

    lockFields.mockResolvedValue('')
    await graphQLDeviceApps('D1')
    expect(post.mock.calls[1][0].query).not.toMatch(/} locked/)
  })

  it('the consent to root it runs under — who, their email, when, which release, how — and a release waiting for one', async () => {
    lockFields.mockResolvedValue('rootConsent { by at version via user { email } } awaitingRoot')
    const consent = {
      by: 'AAAA',
      at: '2026-11-13T18:00:00.000Z',
      version: '1.4.0',
      via: 'product',
      user: { email: 'pat@example.com' },
    }
    post.mockResolvedValue(
      answer({
        login: {
          device: [
            {
              apps: [
                { ...consoleApp, rootConsent: consent, awaitingRoot: null },
                { ...consoleApp, id: 'acme.logs', root: false, rootConsent: null, awaitingRoot: '2.0.0' },
              ],
            },
          ],
        },
      })
    )
    const apps = (await graphQLDeviceApps('D1'))!
    expect(post.mock.calls[0][0].query).toContain('rootConsent { by at version via user { email } } awaitingRoot')
    expect(apps[0]).toMatchObject({
      rootConsent: {
        by: 'AAAA',
        email: 'pat@example.com',
        at: '2026-11-13T18:00:00.000Z',
        version: '1.4.0',
        via: 'product',
      },
      awaitingRoot: null,
    })
    expect(apps[1]).toMatchObject({ rootConsent: null, awaitingRoot: '2.0.0' })
    // An API that says neither: none.
    lockFields.mockResolvedValue('')
    post.mockResolvedValue(answer({ login: { device: [{ apps: [consoleApp] }] } }))
    expect((await graphQLDeviceApps('D1'))![0]).toMatchObject({ rootConsent: null, awaitingRoot: null })
  })

  it('null where the API has no apps, or the request failed', async () => {
    post.mockResolvedValue('ERROR')
    expect(await graphQLDeviceApps('D1')).toBeNull()
    post.mockResolvedValue(answer({}))
    errors.mockReturnValue([new Error('Cannot query field "apps"')])
    expect(await graphQLDeviceApps('D1')).toBeNull()
  })
})

describe('setDeviceApp and setDeviceAppSetting', () => {
  it('setDeviceApp(deviceId, app, on, channel?, version?, consentRoot?)', async () => {
    request.mockResolvedValue(answer({ setDeviceApp: consoleApp }))
    const app = await graphQLSetDeviceApp('D1', 'remoteit.console', true, { consentRoot: true })
    const [query, variables] = request.mock.calls[0]
    expect(query).toContain(
      'setDeviceApp(\n          deviceId: $deviceId, app: $app, on: $on, channel: $channel, version: $version, consentRoot: $consentRoot\n        )'
    )
    expect(query).toContain('$consentRoot: Boolean')
    expect(variables).toEqual({
      deviceId: 'D1',
      app: 'remoteit.console',
      on: true,
      channel: undefined,
      version: undefined,
      consentRoot: true,
    })
    expect(app?.id).toBe('remoteit.console')
    request.mockResolvedValue('ERROR')
    expect(await graphQLSetDeviceApp('D1', 'remoteit.console', false)).toBeNull()
  })

  it('setDeviceAppSetting(deviceId, app, name, value): the setting as it then stands', async () => {
    request.mockResolvedValue(answer({ setDeviceAppSetting: { ...aiCommands, value: false } }))
    const setting = await graphQLSetDeviceAppSetting('D1', 'remoteit.console', 'ai_commands', false)
    const [query, variables] = request.mock.calls[0]
    expect(query).toContain('setDeviceAppSetting(deviceId: $deviceId, app: $app, name: $name, value: $value)')
    expect(query).toContain('$value: Any')
    expect(variables).toEqual({ deviceId: 'D1', app: 'remoteit.console', name: 'ai_commands', value: false })
    expect(setting?.value).toBe(false)
  })
})

describe('build step 5: what a device may add, and a remote.it too old', () => {
  it('graphQLAvailableApps reads Device.availableApps with needsNewer; [] on an error', async () => {
    post.mockResolvedValue(
      answer({ login: { device: [{ availableApps: [{ id: 'remoteit.files', name: 'Files', publisher: 'remote.it', root: false, version: '1.0.0', needsNewer: true }] }] } })
    )
    expect(await graphQLAvailableApps('D1')).toEqual([
      { id: 'remoteit.files', name: 'Files', publisher: 'remote.it', description: null, root: false, version: '1.0.0', refused: null, needsNewer: true },
    ])
    expect(post.mock.calls[0][0].query).toContain('availableApps { id name publisher description root version refused needsNewer }')
    post.mockResolvedValue('ERROR')
    expect(await graphQLAvailableApps('D1')).toEqual([])
  })

  it('a setting\'s declaration is read, for a string\'s max and pattern', async () => {
    post.mockResolvedValue(answer({ login: { device: [{ apps: [{ ...consoleApp, settings: [{ ...aiCommands, declaration: { string: { max: 8, pattern: null } } }] }] }] } }))
    const [app] = (await graphQLDeviceApps('D1'))!
    expect(app.settings[0].declaration).toEqual({ string: { max: 8, pattern: null } })
    expect(post.mock.calls[0][0].query).toContain('choices { value label } declaration')
  })

  it('needsNewer: unavailable for that reason alone', () => {
    expect(needsNewer({ state: 'unavailable', detail: 'Needs a newer remote.it on this device' })).toBe(true)
    expect(needsNewer({ state: 'unavailable', detail: 'refused' })).toBe(false)
  })
})
