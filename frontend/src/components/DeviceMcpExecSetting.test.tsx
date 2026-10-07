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

import { DeviceMcpExecSetting } from './DeviceMcpExecSetting'
import type { DeviceSettings } from '../hooks/useDeviceSettings'
import type { DeviceSetting } from '../services/graphQLDeviceSettings'
;(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true

const mcpExec = (more: Partial<DeviceSetting> = {}): DeviceSetting => ({
  name: 'mcp_exec',
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

describe('AI commands', () => {
  it('absent where the API’s settings have no mcp_exec, or no settings at all', async () => {
    for (const list of [null, [], [{ ...mcpExec(), name: 'console' as const }]]) {
      const page = await render(<DeviceMcpExecSetting settings={settingsOf(list)} canManage />)
      expect(row(page)).toBeNull()
    }
  })

  it('on by default: switched off here through setDeviceSetting', async () => {
    const settings = settingsOf([mcpExec()])
    const page = await render(<DeviceMcpExecSetting settings={settings} canManage />)
    expect(row(page)!.dataset.on).toBe('true')
    expect(page.textContent).toMatch(/^AI commands — Let AI assistants you authorize/)
    await act(async () => row(page)!.click())
    expect(settings.set).toHaveBeenCalledWith('mcp_exec', false)
  })

  it('set on the device: says by whom', async () => {
    const page = await render(
      <DeviceMcpExecSetting settings={settingsOf([mcpExec({ value: false, onDevice: true, by: 'root' })])} canManage />
    )
    expect(row(page)!.dataset.on).toBe('false')
    expect(page.textContent).toBe('AI commands — Set on the device by root')
  })

  it('turned off by the administrator: off and greyed, whatever the value', async () => {
    const page = await render(<DeviceMcpExecSetting settings={settingsOf([mcpExec({ control: 'off' })])} canManage />)
    expect(row(page)!.dataset.on).toBe('false')
    expect(row(page)!.disabled).toBe(true)
    expect(page.textContent).toBe('AI commands — Turned off on the device by its administrator')
  })

  it('greyed for one who does not manage the device', async () => {
    const page = await render(<DeviceMcpExecSetting settings={settingsOf([mcpExec()])} canManage={false} />)
    expect(row(page)!.disabled).toBe(true)
  })
})
