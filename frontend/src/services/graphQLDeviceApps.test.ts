import { describe, it, expect, vi, beforeEach } from 'vitest'

const { post, request, reasoned, errors, lockFields } = vi.hoisted(() => ({
  post: vi.fn(),
  request: vi.fn(),
  reasoned: vi.fn(),
  errors: vi.fn(),
  lockFields: vi.fn(),
}))
vi.mock('./post', () => ({ post }))
vi.mock('./graphQL', () => ({ graphQLBasicRequest: request, graphQLGetErrors: errors, graphQLRequestWithReason: reasoned }))
// What the schema says of an app's product lock (services/productPolicy reads it): an API without product apps first.
vi.mock('./productPolicy', async importOriginal => ({
  ...(await importOriginal<typeof import('./productPolicy')>()),
  appPolicyFields: lockFields,
}))

import {
  graphQLAddDeviceApp,
  graphQLAddDeviceApps,
  graphQLAvailableApps,
  graphQLDeviceApps,
  graphQLRemoveDeviceApp,
  graphQLSetDeviceAppEnabled,
  graphQLSetDeviceAppRelease,
  graphQLSetDeviceAppSetting,
  graphQLSetDeviceAppsRelease,
  needsNewer,
} from './graphQLDeviceApps'

beforeEach(() => {
  post.mockReset()
  request.mockReset()
  reasoned.mockReset()
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
  enabled: true,
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
    for (const field of ['id', 'name', 'publisher', 'root', 'enabled', 'added', 'channel', 'pinned', 'version', 'release', 'latest', 'upToDate', 'grantUntil', 'adminControl', 'state', 'detail', 'serviceId'])
      expect(query).toMatch(new RegExp(`\\b${field}\\b`))
    expect(query).toContain(
      'settings { name type label help default value at by onDevice control locked { product level } deprecated choices { value label } declaration }'
    )
    // What draws any app, none by its id: the contract it is written to, how its service opens, what it asks of
    // remote.it, the key its service presents, the sessions it serves, what it serves at runtime, and the setting
    // that is its service's port.
    for (const field of ['contract', 'protocol', 'capabilities', 'hostKey', 'sessionsOpen', 'features', 'portSetting'])
      expect(query).toMatch(new RegExp(`\\b${field}\\b`))
    // A session as the app reports it: never a person.
    expect(query).toContain('sessions { session login via since }')
    expect(query).not.toMatch(/\bperson\b/)
    // Its services, the primary first, each with its listeners and its service on the device; where its named listeners
    // listen. An app's own port is never asked: a service's is.
    const services =
      'services { key name protocol multiPort port portSetting listeners { name type port portSetting ports } serviceId }'
    expect(query).toContain(`${services} listeners { name listen }`)
    expect(query.replace(services, '')).not.toMatch(/\bport\b|\bon\b/)
    expect(query).toContain('heldBack { reason detail }')
    expect(apps?.[0].settings[0].value).toBe(true)
    expect(apps?.[0].adminControl).toBe('cloud+local') // none said: the default
  })

  it('how its service opens, what it asks of remote.it, its host key and sessions, as graphql says them', async () => {
    const session = {
      session: '9f2c1e',
      login: 'r3-evan',
      via: 'ai',
      since: '2026-11-15T10:00:00.000Z',
    }
    const shell = {
      ...consoleApp,
      id: 'acme.shell',
      protocol: 'ssh',
      capabilities: ['person-certificates'],
      hostKey: 'SHA256:abc',
      sessions: [session, { session: 'k2' }],
      sessionsOpen: 40,
      contract: 1,
      features: ['remoteit-commands@remote.it'],
      portSetting: 'port',
    }
    post.mockResolvedValue(
      answer({ login: { device: [{ id: 'D1', apps: [shell, { ...consoleApp, id: 'acme.files' }] }] } })
    )
    const [app, files] = (await graphQLDeviceApps('D1'))!
    expect(app).toMatchObject({
      protocol: 'ssh',
      capabilities: ['person-certificates'],
      hostKey: 'SHA256:abc',
      sessionsOpen: 40,
      contract: 1,
      features: ['remoteit-commands@remote.it'],
      portSetting: 'port',
    })
    expect(app.sessions).toEqual([session, { session: 'k2', login: null, via: null, since: null }])
    // None said: none, and an app that serves nothing.
    expect(files).toMatchObject({
      contract: null,
      protocol: null,
      capabilities: [],
      hostKey: null,
      sessions: [],
      sessionsOpen: 0,
      features: [],
      portSetting: null,
    })
  })

  it('a choice as its owner sees it and the app gets it: its label, its value; the shorthand labelled by its value', async () => {
    const mode = {
      ...aiCommands,
      name: 'root_login',
      type: 'choice',
      choices: [{ value: 'prohibit-password', label: 'Keys only' }, { value: ':0', label: null }, ':1'],
    }
    post.mockResolvedValue(answer({ login: { device: [{ id: 'D1', apps: [{ ...consoleApp, settings: [mode] }] }] } }))
    const [app] = (await graphQLDeviceApps('D1'))!
    expect(app.settings[0].choices).toEqual([
      { value: 'prohibit-password', label: 'Keys only' },
      { value: ':0', label: ':0' },
      { value: ':1', label: ':1' },
    ])
  })

  it('its administrator’s control as graphql says it', async () => {
    post.mockResolvedValue(answer({ login: { device: [{ id: 'D1', apps: [{ ...consoleApp, adminControl: 'local' }] }] } }))
    expect((await graphQLDeviceApps('D1'))?.[0].adminControl).toBe('local')
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
      /sessionsOpen features portSetting services \{[^}]*\{[^}]*}[^}]*} listeners \{ name listen } problems \{ name error detail } settings \{[^}]*\{[^}]*}[^}]*\{[^}]*} declaration } locked \{ product level }/
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

describe('the lifecycle: add, enable or disable, channel and pin, remove', () => {
  const sent = () => reasoned.mock.calls[reasoned.mock.calls.length - 1]

  it('addDeviceApp(deviceId, app, channel?, version?, consentRoot?, settings?): the app as it then stands', async () => {
    reasoned.mockResolvedValue(answer({ addDeviceApp: { ...consoleApp, heldBack: { reason: 'pending', detail: 'Given' } } }))
    const app = await graphQLAddDeviceApp('D1', 'remoteit.console', { consentRoot: true, channel: 'beta' })
    const [query, variables] = sent()
    expect(query).toContain(
      'addDeviceApp(deviceId: $deviceId, app: $app, channel: $channel, version: $version, consentRoot: $consentRoot, settings: $settings)'
    )
    expect(query).toContain('$settings: Any')
    expect(variables).toEqual({ deviceId: 'D1', app: 'remoteit.console', channel: 'beta', consentRoot: true })
    expect(app).toMatchObject({ id: 'remoteit.console', enabled: true, heldBack: { reason: 'pending', detail: 'Given' } })
  })

  it('a refusal in graphql’s own words; a failed request, a refusal with none', async () => {
    reasoned.mockResolvedValue({ reason: 'Managed by its product Kiosks' })
    expect(await graphQLSetDeviceAppEnabled('D1', 'acme.backup', false)).toEqual({ reason: 'Managed by its product Kiosks' })
    reasoned.mockResolvedValue('ERROR')
    expect(await graphQLRemoveDeviceApp('D1', 'acme.backup')).toEqual({ reason: '' })
  })

  it('setDeviceAppEnabled(deviceId, app, enabled, consentRoot?)', async () => {
    reasoned.mockResolvedValue(answer({ setDeviceAppEnabled: { ...consoleApp, enabled: false, state: 'disabled' } }))
    const app = await graphQLSetDeviceAppEnabled('D1', 'remoteit.console', false)
    const [query, variables] = sent()
    expect(query).toContain('setDeviceAppEnabled(deviceId: $deviceId, app: $app, enabled: $enabled, consentRoot: $consentRoot)')
    expect(query).toContain('$enabled: Boolean!')
    expect(variables).toEqual({ deviceId: 'D1', app: 'remoteit.console', enabled: false })
    expect(app).toMatchObject({ enabled: false, state: 'disabled' })
  })

  it('setDeviceAppRelease: "" unpins, consentRoot alone is Update now; absent is left out', async () => {
    reasoned.mockResolvedValue(answer({ setDeviceAppRelease: consoleApp }))
    await graphQLSetDeviceAppRelease('D1', 'remoteit.console', { version: '' })
    expect(sent()[1]).toEqual({ deviceId: 'D1', app: 'remoteit.console', version: '' })
    await graphQLSetDeviceAppRelease('D1', 'remoteit.console', { consentRoot: true })
    expect(sent()[1]).toEqual({ deviceId: 'D1', app: 'remoteit.console', consentRoot: true })
    expect(sent()[0]).toContain('setDeviceAppRelease(deviceId: $deviceId, app: $app, channel: $channel, version: $version, consentRoot: $consentRoot)')
  })

  it('removeDeviceApp: true where a row went, false where there was none', async () => {
    reasoned.mockResolvedValue(answer({ removeDeviceApp: true }))
    expect(await graphQLRemoveDeviceApp('D1', 'acme.backup')).toBe(true)
    expect(sent()[0]).toMatch(/removeDeviceApp\(deviceId: \$deviceId, app: \$app\) }/)
    reasoned.mockResolvedValue(answer({ removeDeviceApp: false }))
    expect(await graphQLRemoveDeviceApp('D1', 'acme.backup')).toBe(false)
  })

  it('addDeviceApps and setDeviceAppsRelease: a result a device, a refusal that device’s', async () => {
    const changes = [
      { deviceId: 'D1', name: 'pi', outcome: 'added', error: null },
      { deviceId: 'D2', name: 'nas', outcome: 'refused', error: 'No build for linux-mips' },
    ]
    reasoned.mockResolvedValue(answer({ addDeviceApps: changes }))
    expect(
      await graphQLAddDeviceApps('acme.backup', { tags: { operator: 'ANY', values: ['office'] }, accountId: 'A1' })
    ).toEqual(changes)
    expect(sent()[0]).toContain('$tags: ListFilter')
    expect(sent()[0]).toContain('{ deviceId name outcome error }')
    expect(sent()[1]).toEqual({ app: 'acme.backup', tags: { operator: 'ANY', values: ['office'] }, accountId: 'A1' })
    reasoned.mockResolvedValue(answer({ setDeviceAppsRelease: changes }))
    await graphQLSetDeviceAppsRelease('acme.backup', ['D1', 'D2'], { version: '' })
    expect(sent()[0]).toContain('$deviceIds: [String!]!')
    expect(sent()[1]).toEqual({ app: 'acme.backup', deviceIds: ['D1', 'D2'], version: '' })
  })
})

describe('setDeviceAppSetting', () => {
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
      { id: 'remoteit.files', name: 'Files', publisher: 'remote.it', publisherVerifiedDomain: null, description: null, root: false, version: '1.0.0', refused: null, adminControl: 'cloud+local', needsNewer: true, oldInstall: false,
        conversion: null, conversionDetail: null, protocol: null, icon: null, capabilities: [], contract: null, services: [] },
    ])
    expect(post.mock.calls[0][0].query).toContain('availableApps { id name publisher publisherVerifiedDomain description root version refused adminControl needsNewer oldInstall conversion conversionDetail protocol icon capabilities contract services { key name protocol multiPort port portSetting listeners { name type port portSetting ports } } }')
    // How its service opens and what it asks of remote.it, of the release its stage gives.
    post.mockResolvedValue(answer({ login: { device: [{ availableApps: [{ id: 'acme.shell', name: 'Shell', publisher: 'Acme', protocol: 'ssh', capabilities: ['person-certificates'], contract: 1 }] }] } }))
    expect((await graphQLAvailableApps('D1'))[0]).toMatchObject({ protocol: 'ssh', capabilities: ['person-certificates'], contract: 1 })
    // Its administrator's control, where it says one (none said: the default).
    post.mockResolvedValue(answer({ login: { device: [{ availableApps: [{ id: 'remoteit.files', name: 'Files', publisher: 'remote.it', adminControl: 'local' }] }] } }))
    expect((await graphQLAvailableApps('D1'))[0].adminControl).toBe('local')
    post.mockResolvedValue('ERROR')
    expect(await graphQLAvailableApps('D1')).toEqual([])
  })

  it('its services, the primary first: each its listeners and, while served, its service on the device', async () => {
    const services = [
      { key: null, name: 'Camera', protocol: 'http', multiPort: false, port: null, portSetting: 'web_port',
        listeners: [{ name: 'web', type: 'tcp', port: null, portSetting: 'web_port', ports: null }], serviceId: 'S1' },
      { key: 'rtsp', name: 'Stream', protocol: 'tcp', multiPort: true,
        listeners: [{ name: 'rtsp', type: 'tcp', port: 8554 }, { name: 'rtp', type: 'udp', ports: '5004-5005' }], serviceId: 'S2' },
    ]
    post.mockResolvedValue(answer({ login: { device: [{ apps: [{ ...consoleApp, services, listeners: [{ name: 'web', listen: 'tcp:8080' }] }] }] } }))
    const [app] = (await graphQLDeviceApps('D1'))!
    expect(app.services).toEqual([
      services[0],
      { ...services[1], port: null, portSetting: null, listeners: [
        { name: 'rtsp', type: 'tcp', port: 8554, portSetting: null, ports: null },
        { name: 'rtp', type: 'udp', port: null, portSetting: null, ports: '5004-5005' },
      ] },
    ])
    expect(app.listeners).toEqual([{ name: 'web', listen: 'tcp:8080' }])
    // An app that serves nothing: none.
    post.mockResolvedValue(answer({ login: { device: [{ apps: [consoleApp] }] } }))
    expect((await graphQLDeviceApps('D1'))![0].services).toEqual([])
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
