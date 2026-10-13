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

import { DeviceScriptsSetting } from './DeviceScriptsSetting'
import type { DeviceSettings } from '../hooks/useDeviceSettings'
import type { DeviceSetting } from '../services/graphQLDeviceSettings'
;(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true

const scripts = (more: Partial<DeviceSetting> = {}): DeviceSetting => ({
  name: 'scripts',
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

describe('Allow scripts', () => {
  it('absent where the device does not serve scripts (no scripts setting), or the API has no settings', async () => {
    for (const list of [null, [], [{ ...scripts(), name: 'services' as const }]]) {
      const page = await render(<DeviceScriptsSetting settings={settingsOf(list)} canManage />)
      expect(row(page)).toBeNull()
    }
  })

  it('on by default, saying what it allows; switched off here through setDeviceSetting', async () => {
    const settings = settingsOf([scripts()])
    const page = await render(<DeviceScriptsSetting settings={settings} canManage />)
    expect(row(page)!.dataset.on).toBe('true')
    expect(page.textContent).toMatch(/^Allow scripts — Anyone who may script this device can run commands on it — as their own account on it, or as root/)
    await act(async () => row(page)!.click())
    expect(settings.set).toHaveBeenCalledWith('scripts', false)
  })

  it('set on the device: says so, and by whom', async () => {
    const page = await render(
      <DeviceScriptsSetting settings={settingsOf([scripts({ value: false, onDevice: true, by: 'root' })])} canManage />
    )
    expect(row(page)!.dataset.on).toBe('false')
    expect(page.textContent).toBe('Allow scripts — Set on the device by root')
  })

  it('locked by the administrator’s policy: off or on, greyed; local, set only on the device', async () => {
    let page = await render(<DeviceScriptsSetting settings={settingsOf([scripts({ control: 'off' })])} canManage />)
    expect([row(page)!.dataset.on, row(page)!.disabled, page.textContent]).toEqual([
      'false',
      true,
      'Allow scripts — Turned off on the device by its administrator',
    ])
    page = await render(<DeviceScriptsSetting settings={settingsOf([scripts({ value: false, control: 'on' })])} canManage />)
    expect([row(page)!.dataset.on, row(page)!.disabled]).toEqual(['true', true])
    page = await render(<DeviceScriptsSetting settings={settingsOf([scripts({ control: 'local' })])} canManage />)
    expect([row(page)!.disabled, page.textContent]).toEqual([true, 'Allow scripts — Set only on the device'])
  })

  it('greyed for one who does not manage the device', async () => {
    const page = await render(<DeviceScriptsSetting settings={settingsOf([scripts()])} canManage={false} />)
    expect(row(page)!.disabled).toBe(true)
  })
})
