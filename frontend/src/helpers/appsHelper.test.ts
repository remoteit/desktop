import { describe, it, expect } from 'vitest'
import type { TFunction } from 'i18next'
import {
  addAsks,
  appHost,
  appIcon,
  capabilitiesLine,
  capabilityWords,
  isAppService,
  offered,
  outcomeLine,
  serviceApp,
  stateLine,
  stateWord,
  withdrawal,
  appServiceOf,
} from './appsHelper'
import type { DeviceApp, DeviceAppService } from '../services/graphQLDeviceApps'
import { withServices } from '../test/deviceApps'

const t = ((_key: string, text: string, values?: any) =>
  text.replace(/{{(\w+)}}/g, (_, k) => values?.[k] ?? '')) as unknown as TFunction

// graphql's words (services/device-apps.ts): WITHDRAWN, withdrawnDisabled('1.5.0'), KEPT_WITHDRAWN.
const WITHDRAWN = 'Its release was withdrawn by its publisher: removed from the device until a new one is published'
const WITHDRAWN_DISABLED = 'Its release was withdrawn by its publisher: removed from the device; enabling installs 1.5.0 anew'
const KEPT = 'Kept by this device’s administrator, though its release was withdrawn'
const app = (state: any, detail: string | null) => ({ state, detail, root: false, awaitingRoot: null })

describe('a withdrawn release, said once', () => {
  it('graphql’s sentence alone where it cannot run — not "Not available here: Its release was withdrawn …"', () => {
    expect(stateLine(t, app('unavailable', WITHDRAWN))).toBe(WITHDRAWN)
    expect(stateWord(t, 'unavailable', WITHDRAWN)).toBe('Withdrawn')
  })

  it('disabled: graphql’s withdrawnDisabled words after Disabled', () => {
    expect(stateLine(t, app('disabled', WITHDRAWN_DISABLED))).toBe(`Disabled — ${WITHDRAWN_DISABLED}`)
    expect(stateWord(t, 'disabled', WITHDRAWN_DISABLED)).toBe('Disabled')
  })

  it('the daemon’s own words (This device reads connectd): "Withdrawn by its publisher"', () => {
    expect(stateLine(t, app('unavailable', 'withdrawn by its publisher'))).toBe('Withdrawn by its publisher')
    expect(withdrawal({ detail: 'withdrawn by its publisher' })).toBe('withdrawn')
  })

  it('kept by its administrator: graphql’s words, or the daemon’s in lower case, in the portal’s', () => {
    expect(stateLine(t, app('running', KEPT))).toBe(`Running — ${KEPT}`)
    expect(stateLine(t, app('unavailable', KEPT))).toBe(KEPT)
    expect(stateLine(t, app('disabled', 'kept by this device\'s administrator, though its release was withdrawn'))).toBe(
      `Disabled — ${KEPT}`
    )
    expect(stateWord(t, 'running', KEPT)).toBe('Running')
    expect(withdrawal({ detail: KEPT })).toBe('kept')
  })

  it('any other detail as before', () => {
    expect(withdrawal({ detail: 'No release on this stage' })).toBeUndefined()
    expect(stateLine(t, app('unavailable', 'No release on this stage'))).toBe('Not available here: No release on this stage')
    expect(stateWord(t, 'unavailable', 'No release on this stage')).toBe('Unavailable')
  })
})

describe('a many-device call’s outcome a device (DeviceAppChange.outcome)', () => {
  it('added, enabled, changed, unchanged — Already there when adding — and refused with why', () => {
    const line = (outcome: string, error: string | null = null, adding?: boolean) => outcomeLine(t, { outcome, error }, adding)
    expect(line('added', null, true)).toBe('Added')
    expect(line('enabled', null, true)).toBe('Enabled')
    expect(line('changed')).toBe('Changed')
    expect(line('unchanged', null, true)).toBe('Already there')
    expect(line('unchanged')).toBe('Unchanged')
    expect(line('refused', 'Managed by its product Kiosks')).toBe('Refused: Managed by its product Kiosks')
    expect(line('refused')).toBe('Refused')
  })
})

describe('what an app asks of remote.it, in words', () => {
  it('each capability as the catalogue and the consent say it; one unknown by its name', () => {
    expect(capabilityWords(t, 'person-accounts')).toBe('Keeps accounts for the people you share with')
    expect(capabilityWords(t, 'person-certificates')).toBe('Signs in people by remote.it certificate')
    expect(capabilityWords(t, 'ssh-exec')).toBe('AI commands go through this app')
    expect(capabilityWords(t, 'gpu')).toBe('gpu')
    expect(capabilitiesLine(t, ['person-certificates', 'ssh-exec'])).toBe(
      'Signs in people by remote.it certificate · AI commands go through this app'
    )
    expect(capabilitiesLine(t, [])).toBe('')
  })

  it('an offered app keeps what its catalogue entry says of it', () => {
    const app = offered({
      id: 'acme.shell',
      name: 'Shell',
      publisher: 'Acme',
      description: null,
      root: true,
      version: '1.0.0',
      refused: null,
      needsNewer: false,
      protocol: 'ssh',
      capabilities: ['person-certificates'],
    })
    expect(app).toMatchObject({ protocol: 'ssh', capabilities: ['person-certificates'], sessions: [], sessionsOpen: 0 })
  })
})

describe('an app’s icon and service, from what the API says — never its id', () => {
  it('its icon from how its service opens', () => {
    expect(appIcon('ssh')).toBe('terminal')
    expect(appIcon('https')).toBe('globe')
    expect(appIcon('http')).toBe('globe')
    expect(appIcon('tcp')).toBe('cube')
    expect(appIcon('udp')).toBe('cube')
    expect(appIcon(null)).toBe('cube')
  })

  const app = (id: string, serviceId: string | null) => withServices({ id, name: id, serviceId, protocol: null } as DeviceApp)

  it('a service at an app’s host is looked for among its device’s apps; any other is no app’s', () => {
    expect(appHost('acme.shell')).toBe('remoteit-app-acme-shell')
    expect(isAppService({ host: 'remoteit-app-acme-shell' })).toBe(true)
    expect(isAppService({ host: 'localhost' })).toBe(false)
    expect(isAppService(undefined)).toBe(false)
    // No app is known by a host of its own: the console's service is at its app host like any app's.
    expect(isAppService({ host: 'remoteit-console' })).toBe(false)
  })

  it('the app naming the service, or — disabled, naming none — the one at whose host it is', () => {
    const service = { id: 'S5', host: 'remoteit-app-acme-shell' }
    expect(serviceApp([app('acme.files', 'S4'), app('acme.shell', 'S5')], service)?.id).toBe('acme.shell')
    expect(serviceApp([app('acme.shell', null)], service)?.id).toBe('acme.shell')
    expect(serviceApp([app('acme.shell', 'S9')], service)).toBeUndefined()
    expect(serviceApp([app('acme.shell', 'S5')], { id: 'S5', host: 'localhost' })).toBeUndefined()
    expect(serviceApp(null, service)).toBeUndefined()
  })

  it('an app of several services: any of them is the app’s, and which of its services it is', () => {
    const stream: DeviceAppService = {
      key: 'rtsp', name: 'Stream', protocol: 'tcp', multiPort: true, port: null, portSetting: null, listeners: [], serviceId: 'S6',
    }
    const camera = withServices(app('acme.camera', 'S5'))
    const both = { ...camera, services: [...camera.services, stream] }
    const other = { id: 'S6', host: 'remoteit-app-acme-camera' }
    expect(serviceApp([both], other)?.id).toBe('acme.camera')
    expect(appServiceOf(both, other)?.key).toBe('rtsp')
    expect(appServiceOf(both, { id: 'S5', host: 'remoteit-app-acme-camera' })?.key).toBeNull()
    // Disabled, naming none: the primary, at the app's host.
    const disabled = withServices({ ...app('acme.camera', null), services: undefined, protocol: 'http' })
    expect(appServiceOf(disabled, { id: 'S5', host: 'remoteit-app-acme-camera' })?.key).toBeNull()
    expect(appServiceOf(disabled, { id: 'S5', host: 'remoteit-app-acme-other' })).toBeUndefined()
  })
})

describe('addAsks: what adding an app gives, and so asks', () => {
  const release = (version: string, more: any = {}) => ({ version, root: false, capabilities: [], withdrawn: null, ...more })
  const app = (more: any = {}) =>
    ({
      root: false,
      capabilities: [],
      accountChannel: null,
      channels: [
        { channel: 'stable', current: '1.0.0', candidate: null, share: 0 },
        { channel: 'beta', current: '1.1.0', candidate: '1.2.0', share: 10 },
      ],
      releases: [
        release('1.2.0', { root: true }),
        release('1.1.0', { capabilities: ['ssh-exec'] }),
        release('1.0.0', { capabilities: ['person-accounts'] }),
      ],
      ...more,
    } as any)

  it('the account’s channel, else stable: its current, and its candidate where it has a share', () => {
    expect(addAsks(app(), '')).toEqual({ versions: ['1.0.0'], root: false, capabilities: ['person-accounts'] })
    expect(addAsks(app({ accountChannel: 'beta' }), '')).toEqual({
      versions: ['1.2.0', '1.1.0'],
      root: true,
      capabilities: ['ssh-exec'],
    })
    // The channel chosen over the account's.
    expect(addAsks(app({ accountChannel: 'beta' }), 'stable').versions).toEqual(['1.0.0'])
    // A candidate at no share goes to no device.
    const none = app().channels.map((c: any) => ({ ...c, share: 0 }))
    expect(addAsks(app({ channels: none }), 'beta')).toEqual({ versions: ['1.1.0'], root: false, capabilities: ['ssh-exec'] })
  })

  it('a pin over the channel; a channel naming none gives stable’s; a withdrawn release none', () => {
    expect(addAsks(app(), 'beta', '1.0.0').versions).toEqual(['1.0.0'])
    const bare = [app().channels[0], { channel: 'beta', current: null, candidate: null, share: 0 }]
    expect(addAsks(app({ channels: bare }), 'beta').versions).toEqual(['1.0.0'])
    // Beta's current withdrawn, its candidate rolling out: the candidate alone is given.
    const withdrawn = app({ releases: [release('1.2.0'), release('1.1.0', { withdrawn: '2026-11-01' })] })
    expect(addAsks(withdrawn, 'beta').versions).toEqual(['1.2.0'])
  })

  it('a release not among those read asks what the app’s own fields say', () => {
    const own = app({ root: true, capabilities: ['person-certificates'], releases: [] })
    expect(addAsks(own, 'beta')).toEqual({ versions: ['1.2.0', '1.1.0'], root: true, capabilities: ['person-certificates'] })
  })
})
