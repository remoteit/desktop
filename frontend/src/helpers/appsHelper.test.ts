import { describe, it, expect } from 'vitest'
import type { TFunction } from 'i18next'
import {
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
} from './appsHelper'
import type { DeviceApp } from '../services/graphQLDeviceApps'

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
    expect(appIcon(null)).toBe('cube')
  })

  const app = (id: string, serviceId: string | null) => ({ id, serviceId } as DeviceApp)

  it('a service at an app’s host is looked for among its device’s apps; any other is no app’s', () => {
    expect(appHost('acme.shell')).toBe('remoteit-app-acme-shell')
    expect(isAppService({ host: 'remoteit-app-acme-shell' })).toBe(true)
    expect(isAppService({ host: 'localhost' })).toBe(false)
    expect(isAppService(undefined)).toBe(false)
  })

  it('the app naming the service, or — disabled, naming none — the one at whose host it is', () => {
    const service = { id: 'S5', host: 'remoteit-app-acme-shell' }
    expect(serviceApp([app('acme.files', 'S4'), app('acme.shell', 'S5')], service)?.id).toBe('acme.shell')
    expect(serviceApp([app('acme.shell', null)], service)?.id).toBe('acme.shell')
    expect(serviceApp([app('acme.shell', 'S9')], service)).toBeUndefined()
    expect(serviceApp([app('acme.shell', 'S5')], { id: 'S5', host: 'localhost' })).toBeUndefined()
    expect(serviceApp(null, service)).toBeUndefined()
  })

  // TEMPORARY (services/consoleUntilDeclared): deleted with it.
  it('until its migration, a service at the console’s own host is its app’s', () => {
    expect(isAppService({ host: 'remoteit-console' })).toBe(true)
    expect(serviceApp([app('remoteit.console', null)], { id: 'S1', host: 'remoteit-console' })?.id).toBe(
      'remoteit.console'
    )
  })
})
