import { describe, it, expect, vi, beforeEach } from 'vitest'

const { post, request, errors } = vi.hoisted(() => ({ post: vi.fn(), request: vi.fn(), errors: vi.fn() }))
vi.mock('./post', () => ({ post }))
vi.mock('./graphQL', () => ({ graphQLBasicRequest: request, graphQLGetErrors: errors }))

import { graphQLDeviceApps, graphQLSetDeviceApp, graphQLSetDeviceAppSetting } from './graphQLDeviceApps'

beforeEach(() => {
  post.mockReset()
  request.mockReset()
  errors.mockReset().mockReturnValue(undefined)
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
      'settings { name type label help default value at by onDevice control locked { product level } deprecated choices { value label } }'
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
