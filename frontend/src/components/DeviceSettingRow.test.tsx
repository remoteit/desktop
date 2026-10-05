import React, { act } from 'react'
import { createRoot } from 'react-dom/client'
import { describe, it, expect, vi } from 'vitest'

const { settings } = vi.hoisted(() => ({ settings: vi.fn() }))
vi.mock('../services/post', () => ({ post: vi.fn() }))
vi.mock('../services/graphQL', () => ({ graphQLBasicRequest: vi.fn(), graphQLGetErrors: vi.fn() }))
vi.mock('../hooks/useDeviceSettings', () => ({ useDeviceSettings: () => ({ setting: settings }) }))
vi.mock('./ListItemSetting', () => ({
  ListItemSetting: ({ label, subLabel, toggle, disabled, onClick }: any) => (
    <button data-row data-on={String(toggle)} disabled={disabled} onClick={onClick}>
      {label}
      {subLabel ? ` — ${subLabel}` : ''}
    </button>
  ),
}))
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (_key: string, text: string, values?: any) => text.replace(/{{(\w+)}}/g, (_, k) => values?.[k] ?? ''),
  }),
}))

import { DevicePolicyRow, DeviceSettingRow } from './DeviceSettingRow'
import type { DeviceSetting, DeviceSettingControl } from '../services/graphQLDeviceSettings'
;(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true

const subnet = (control: DeviceSettingControl, more: Partial<DeviceSetting> = {}): DeviceSetting => ({
  name: 'subnet',
  value: true,
  at: '2026-10-05T17:04:05.123Z',
  by: null,
  onDevice: false,
  control,
  ...more,
})

async function render(element: React.ReactElement) {
  const container = document.createElement('div')
  await act(async () => createRoot(container).render(element))
  return container
}

const row = (page: HTMLElement) => page.querySelector('[data-row]') as HTMLButtonElement

describe('a device setting’s row', () => {
  it('cloud+local and cloud: the value, switched here', async () => {
    for (const control of ['cloud+local', 'cloud'] as const) {
      const onChange = vi.fn()
      const page = await render(
        <DeviceSettingRow setting={subnet(control)} label="Subnet" subLabel="What it does" onChange={onChange} />
      )
      expect(row(page).dataset.on).toBe('true')
      expect(row(page).disabled).toBe(false)
      expect(page.textContent).toBe('Subnet — What it does')
      await act(async () => row(page).click())
      expect(onChange).toHaveBeenCalledWith(false)
    }
  })

  it('set on the device: says by whom, in place of the hint', async () => {
    let page = await render(
      <DeviceSettingRow
        setting={subnet('cloud+local', { onDevice: true, by: 'bob' })}
        label="Subnet"
        subLabel="x"
        onChange={vi.fn()}
      />
    )
    expect(page.textContent).toBe('Subnet — Set on the device by bob')
    page = await render(
      <DeviceSettingRow setting={subnet('cloud+local', { onDevice: true })} label="Subnet" onChange={vi.fn()} />
    )
    expect(page.textContent).toBe('Subnet — Set on the device')
  })

  it('off and on: fixed by the administrator, greyed', async () => {
    let page = await render(<DeviceSettingRow setting={subnet('off')} label="Subnet" onChange={vi.fn()} />)
    expect(row(page).dataset.on).toBe('false')
    expect(row(page).disabled).toBe(true)
    expect(page.textContent).toContain('Turned off on the device by its administrator')

    page = await render(<DeviceSettingRow setting={subnet('on', { value: false })} label="Subnet" onChange={vi.fn()} />)
    expect(row(page).dataset.on).toBe('true')
    expect(row(page).disabled).toBe(true)
    expect(page.textContent).toContain('Turned on on the device by its administrator')
  })

  it('local: set only on the device, greyed at its value', async () => {
    const page = await render(
      <DeviceSettingRow
        setting={subnet('local', { value: false, onDevice: true, by: 'bob' })}
        label="Subnet"
        onChange={vi.fn()}
      />
    )
    expect(row(page).dataset.on).toBe('false')
    expect(row(page).disabled).toBe(true)
    expect(page.textContent).toContain('Set only on the device')
  })

  it('the caller’s own disabling holds under any control', async () => {
    const page = await render(
      <DeviceSettingRow setting={subnet('cloud+local')} label="Subnet" disabled onChange={vi.fn()} />
    )
    expect(row(page).disabled).toBe(true)
  })

  it('a part of the value: exit_node’s on, and its lan by `on`, quiet beneath', async () => {
    const exitNode: DeviceSetting = {
      ...subnet('cloud+local', { onDevice: true, by: 'bob' }),
      name: 'exit_node',
      value: { on: true, lan: false },
    }
    let page = await render(<DeviceSettingRow setting={exitNode} label="Exit node" onChange={vi.fn()} />)
    expect(row(page).dataset.on).toBe('true')
    page = await render(
      <DeviceSettingRow
        setting={exitNode}
        label="LAN"
        subLabel="its LAN"
        on={exitNode.value.lan}
        quiet
        onChange={vi.fn()}
      />
    )
    expect(row(page).dataset.on).toBe('false')
    expect(page.textContent).toBe('LAN — its LAN')
  })

  it('a policy-only setting shows only where the administrator turned it off', async () => {
    settings.mockReturnValue({ ...subnet('off'), name: 'updates', value: null })
    let page = await render(<DevicePolicyRow deviceId="D" name="updates" label="Remote upgrades" />)
    expect(page.textContent).toBe('Remote upgrades — Turned off on the device by its administrator')
    settings.mockReturnValue({ ...subnet('on'), name: 'updates', value: null })
    page = await render(<DevicePolicyRow deviceId="D" name="updates" label="Remote upgrades" />)
    expect(page.textContent).toBe('')
    settings.mockReturnValue(undefined)
    page = await render(<DevicePolicyRow deviceId="D" name="updates" label="Remote upgrades" />)
    expect(page.textContent).toBe('')
  })
})
