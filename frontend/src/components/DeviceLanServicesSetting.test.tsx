import React, { act } from 'react'
import { createRoot } from 'react-dom/client'
import { describe, it, expect, vi } from 'vitest'

vi.mock('../services/post', () => ({ post: vi.fn() }))
vi.mock('../services/graphQL', () => ({ graphQLBasicRequest: vi.fn(), graphQLGetErrors: vi.fn() }))
vi.mock('./ListItemSetting', () => ({
  ListItemSetting: ({ label, subLabel, toggle, disabled, onClick }: any) => (
    <button data-row data-on={String(toggle)} disabled={disabled} onClick={onClick}>
      {label}
      {subLabel ? ` — ${subLabel}` : ''}
    </button>
  ),
}))
vi.mock('./SelectSetting', () => ({ SelectSetting: () => null }))
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (_key: string, text: string, values?: any) => text.replace(/{{(\w+)}}/g, (_, k) => values?.[k] ?? ''),
  }),
}))

import { DeviceLanServicesSetting } from './DeviceLanServicesSetting'
import type { DeviceSettings } from '../hooks/useDeviceSettings'
import type { DeviceSetting } from '../services/graphQLDeviceSettings'
;(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true

const lan = (more: Partial<DeviceSetting> = {}): DeviceSetting => ({
  name: 'lan_services',
  value: false,
  at: null,
  by: null,
  onDevice: false,
  control: 'cloud+local',
  ...more,
})

const settingsOf = (list: DeviceSetting[] | null): DeviceSettings => ({
  settings: list,
  setting: name => list?.find(s => s.name === name),
  set: vi.fn(async () => true),
  reload: vi.fn(),
})

async function render(element: React.ReactElement) {
  const container = document.createElement('div')
  await act(async () => createRoot(container).render(element))
  return container
}

const row = (page: HTMLElement) => page.querySelector('[data-row]') as HTMLButtonElement | null

describe('remote access to services on a phone’s network', () => {
  it('absent where the API serves no lan_services — any device but a phone — or no settings at all', async () => {
    for (const list of [null, [], [{ ...lan(), name: 'mcp_exec' as const }]]) {
      const page = await render(<DeviceLanServicesSetting settings={settingsOf(list)} canManage />)
      expect(row(page)).toBeNull()
    }
  })

  it('off by default: switched on here through setDeviceSetting', async () => {
    const settings = settingsOf([lan()])
    const page = await render(<DeviceLanServicesSetting settings={settings} canManage />)
    expect(row(page)!.dataset.on).toBe('false')
    expect(page.textContent).toBe(
      'Allow remote access to services on the network — People you share with can reach devices on the network this phone is on, through it.'
    )
    await act(async () => row(page)!.click())
    expect(settings.set).toHaveBeenCalledWith('lan_services', true)
  })

  it('turned on in the phone’s app: says so', async () => {
    const page = await render(
      <DeviceLanServicesSetting
        settings={settingsOf([lan({ value: true, onDevice: true, by: 'the app' })])}
        canManage
      />
    )
    expect(row(page)!.dataset.on).toBe('true')
    expect(page.textContent).toBe('Allow remote access to services on the network — Set on the device by the app')
  })

  it('greyed for one who does not manage the phone', async () => {
    const page = await render(<DeviceLanServicesSetting settings={settingsOf([lan()])} canManage={false} />)
    expect(row(page)!.disabled).toBe(true)
  })
})
