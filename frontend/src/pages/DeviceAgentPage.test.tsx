import React, { act } from 'react'
import { createRoot } from 'react-dom/client'
import { describe, it, expect, vi, beforeEach } from 'vitest'

// The device agent page: a device whose package its admin holds or locks reads blocked, with the mechanism — not as
// a failed upgrade.
const { daemon, context } = vi.hoisted(() => ({
  daemon: vi.fn(),
  context: { device: { id: '80:00:00:00:00:00:00:01', permissions: ['MANAGE'], targetPlatform: 769 } },
}))
vi.mock('../store', () => ({}))
vi.mock('../services/post', () => ({ post: vi.fn() }))
vi.mock('../services/graphQL', () => ({}))
vi.mock('../services/graphQLDaemon', async importOriginal => ({
  ...(await importOriginal<object>()),
  graphQLDeviceDaemon: daemon,
  graphQLSetDeviceDaemon: vi.fn(),
}))
vi.mock('../services/Context', () => ({
  DeviceContext: React.createContext(context),
}))
vi.mock('../components/DeviceHeaderMenu', () => ({ DeviceHeaderMenu: ({ children }: any) => <div>{children}</div> }))
vi.mock('../components/DeviceSettingRow', () => ({ DevicePolicyRow: () => null }))
vi.mock('../components/SelectSetting', () => ({ SelectSetting: () => null }))
vi.mock('../components/LoadingMessage', () => ({ LoadingMessage: () => <div>loading</div> }))
vi.mock('../components/Gutters', () => ({ Gutters: ({ children }: any) => <div>{children}</div> }))
vi.mock('../components/Notice', () => ({ Notice: ({ children }: any) => <div data-notice>{children}</div> }))
vi.mock('../hooks/useInterval', () => ({ useInterval: () => {} }))
vi.mock('../components/ListItemSetting', () => ({
  ListItemSetting: ({ icon, label, subLabel }: any) => (
    <div data-setting={icon}>
      <span data-label>{label}</span>
      <span data-sublabel>{subLabel}</span>
    </div>
  ),
}))
vi.mock('react-i18next', () => {
  const fill = (text: string, values?: any) => text.replace(/{{(\w+)}}/g, (_, k) => values?.[k] ?? '')
  return { useTranslation: () => ({ t: (_key: string, text: string, values?: any) => fill(text, values) }) }
})

import { DeviceAgentPage } from './DeviceAgentPage'
;(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true

const DAEMON = {
  deviceId: '80:00:00:00:00:00:00:01',
  running: 'connectd-go 5.6.1',
  package: { version: '1.1.0.9' },
  target: { version: '1.1.0.10', rollback: false },
  update: null,
  channel: 'stable',
  hold: false,
}

async function render() {
  const el = document.createElement('div')
  document.body.appendChild(el)
  await act(async () => createRoot(el).render(<DeviceAgentPage />))
  await act(async () => {})
  return el
}

beforeEach(() => {
  document.body.innerHTML = ''
  context.device.targetPlatform = 769
})

describe('DeviceAgentPage', () => {
  it("a held device reads blocked, held by the device's admin, with the mechanism the device names", async () => {
    daemon.mockResolvedValue({ ...DAEMON, update: { version: '1.1.0.10', state: 'held', detail: 'apt-mark hold' } })
    const el = await render()
    const row = el.querySelector('[data-setting="lock"]')!
    expect(row.querySelector('[data-label]')!.textContent).toBe("Blocked — held by the device's admin")
    expect(row.querySelector('[data-sublabel]')!.textContent).toBe('apt-mark hold')
    expect(el.querySelector('[data-setting="exclamation-triangle"]')).toBeNull()
  })

  it('a hold graphql reads from an older refusal is blocked too', async () => {
    daemon.mockResolvedValue({
      ...DAEMON,
      update: { version: '1.1.0.10', state: 'refused', detail: 'package is held' },
      updateState: 'held',
    })
    const el = await render()
    expect(el.querySelector('[data-setting="lock"] [data-sublabel]')!.textContent).toBe('package is held')
  })

  it('a failed upgrade still reads failed', async () => {
    daemon.mockResolvedValue({ ...DAEMON, update: { version: '1.1.0.10', state: 'failed', detail: 'disk full' } })
    const el = await render()
    expect(el.querySelector('[data-setting="exclamation-triangle"]')).not.toBeNull()
    expect(el.querySelector('[data-setting="lock"]')).toBeNull()
  })

  it('an API without Control Link devices says so, in those words', async () => {
    daemon.mockResolvedValue('UNSUPPORTED')
    const el = await render()
    expect(el.querySelector('[data-notice]')!.textContent).toContain('does not serve Control Link devices')
  })

  // A daemon with no package is updated by what carries it: connectd takes no release, and nothing here upgrades it.
  const PACKAGELESS = { ...DAEMON, running: 'connectd-go 5.6.1.20261113000137', package: null, target: null, distribution: 'none' }

  it("a browser's client updates with the portal: no target, no update, no Upgrades", async () => {
    context.device.targetPlatform = 1231
    daemon.mockResolvedValue(PACKAGELESS)
    const el = await render()
    const row = el.querySelector('[data-setting="browser"]')!
    expect(row.querySelector('[data-label]')!.textContent).toBe('Updates with the portal')
    expect(el.querySelector('[data-setting="bullseye-arrow"]')).toBeNull()
    expect(el.textContent).not.toContain('Upgrades')
    // What it runs is connectd's version: it has no package.
    expect(el.querySelector('[data-setting="microchip"] [data-label]')!.textContent).toBe('5.6.1.20261113000137')
  })

  it("another packageless daemon — a phone's app — is updated by what carries it", async () => {
    daemon.mockResolvedValue(PACKAGELESS)
    const el = await render()
    expect(el.querySelector('[data-setting="mobile"] [data-label]')!.textContent).toBe('Updated by the app that carries it')
    expect(el.textContent).not.toContain('Upgrades')
  })

  it('a packaged daemon keeps its target and Upgrades', async () => {
    daemon.mockResolvedValue({ ...DAEMON, distribution: 'remoteit-device' })
    const el = await render()
    expect(el.querySelector('[data-setting="bullseye-arrow"]')).not.toBeNull()
    expect(el.textContent).toContain('Upgrades')
  })

  // Something other than our rollouts upgrades it: said who and how, neutral — never a failure, whatever it refused.
  it('a container reads updated by its container image, the release available, no red', async () => {
    daemon.mockResolvedValue({
      ...DAEMON,
      package: { version: '1.1.0.9', format: 'container' },
      update: {
        version: '1.1.0.10',
        state: 'held',
        detail: 'this device does not take updates (updates_control); updated by image',
      },
      updatedBy: 'image',
      howToUpdate: 'IMAGE',
      available: '1.1.0.10',
    })
    const el = await render()
    const row = el.querySelector('[data-setting="box"]')!
    expect(row.querySelector('[data-label]')!.textContent).toBe('Updated by its container image; 1.1.0.10 is available')
    expect(row.querySelector('[data-sublabel]')!.textContent).toContain('Pull the image again')
    expect(el.querySelector('[data-setting="exclamation-triangle"]')).toBeNull()
    expect(el.querySelector('[data-setting="lock"]')).toBeNull()
    expect(el.textContent).not.toContain('Upgrades')
  })

  it('an older daemon refusing as a container, on an API before howToUpdate: by its updatedBy, no red', async () => {
    daemon.mockResolvedValue({
      ...DAEMON,
      package: { version: '1.1.0.9', format: 'container' },
      update: { version: '1.1.0.10', state: 'refused', detail: 'this device does not take updates (updates_control)' },
      updatedBy: 'image',
    })
    const el = await render()
    expect(el.querySelector('[data-setting="box"] [data-label]')!.textContent).toBe('Updated by its container image')
    expect(el.querySelector('[data-setting="exclamation-triangle"]')).toBeNull()
  })

  it('Home Assistant, a phone and updates turned off say who', async () => {
    daemon.mockResolvedValue({ ...DAEMON, updatedBy: 'home-assistant', howToUpdate: 'HOME_ASSISTANT', available: null })
    expect((await render()).querySelector('[data-setting="house"] [data-label]')!.textContent).toBe('Updated by Home Assistant')
    document.body.innerHTML = ''
    daemon.mockResolvedValue({ ...DAEMON, package: { version: '1.1.0.9', format: 'ios' }, updatedBy: 'app-store', howToUpdate: 'APP_STORE' })
    expect((await render()).querySelector('[data-setting="mobile"] [data-label]')!.textContent).toBe('Updated by the App Store')
    document.body.innerHTML = ''
    daemon.mockResolvedValue({ ...DAEMON, updatedBy: 'policy', howToUpdate: 'POLICY' })
    const el = await render()
    expect(el.querySelector('[data-setting="toggle-off"] [data-label]')!.textContent).toBe('Updates turned off on the device')
    // Its admin's setting is the one to change: Upgrades stays.
    expect(el.textContent).toContain('Upgrades')
  })
})
