import React, { act } from 'react'
import { createRoot } from 'react-dom/client'
import { describe, it, expect, vi, beforeEach } from 'vitest'

// The device agent page: a device whose package its admin holds or locks reads blocked, with the mechanism — not as
// a failed upgrade.
const { daemon } = vi.hoisted(() => ({ daemon: vi.fn() }))
vi.mock('../store', () => ({}))
vi.mock('../services/post', () => ({ post: vi.fn() }))
vi.mock('../services/graphQL', () => ({}))
vi.mock('../services/graphQLDaemon', async importOriginal => ({
  ...(await importOriginal<object>()),
  graphQLDeviceDaemon: daemon,
  graphQLSetDeviceDaemon: vi.fn(),
}))
vi.mock('../services/Context', () => ({
  DeviceContext: React.createContext({ device: { id: '80:00:00:00:00:00:00:01', permissions: ['MANAGE'] } }),
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
})
