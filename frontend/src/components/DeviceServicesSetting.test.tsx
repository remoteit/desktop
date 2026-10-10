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

import { DeviceServicesSetting } from './DeviceServicesSetting'
import type { DeviceSettings } from '../hooks/useDeviceSettings'
import type { DeviceSetting } from '../services/graphQLDeviceSettings'
;(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true

const services = (more: Partial<DeviceSetting> = {}): DeviceSetting => ({
  name: 'services',
  value: true,
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

const HINT =
  'People you share with can reach the services defined on this device, through it. Off, none are served — nor its ports beyond them or its console.'

describe('Allow remote access to services, the cloud’s side', () => {
  it('absent where the API serves no services setting — one before it, or no settings at all', async () => {
    for (const list of [null, [], [{ ...services(), name: 'mcp_exec' as const }]]) {
      const page = await render(<DeviceServicesSetting settings={settingsOf(list)} canManage />)
      expect(row(page)).toBeNull()
    }
  })

  it('on as graphql says a desktop is by default: switched off here through setDeviceSetting', async () => {
    const settings = settingsOf([services()])
    const page = await render(<DeviceServicesSetting settings={settings} canManage />)
    expect(row(page)!.dataset.on).toBe('true')
    expect(page.textContent).toBe(`Allow remote access to services — ${HINT}`)
    await act(async () => row(page)!.click())
    expect(settings.set).toHaveBeenCalledWith('services', false)
  })

  it('a phone’s, off by default: switched on here', async () => {
    const settings = settingsOf([services({ value: false })])
    const page = await render(<DeviceServicesSetting settings={settings} canManage />)
    expect(row(page)!.dataset.on).toBe('false')
    await act(async () => row(page)!.click())
    expect(settings.set).toHaveBeenCalledWith('services', true)
  })

  it('turned on on the device: says so', async () => {
    const page = await render(
      <DeviceServicesSetting settings={settingsOf([services({ value: true, onDevice: true, by: 'the app' })])} canManage />
    )
    expect(row(page)!.dataset.on).toBe('true')
    expect(page.textContent).toBe('Allow remote access to services — Set on the device by the app')
  })

  it('greyed for one who does not manage the device', async () => {
    const page = await render(<DeviceServicesSetting settings={settingsOf([services()])} canManage={false} />)
    expect(row(page)!.disabled).toBe(true)
  })
})
