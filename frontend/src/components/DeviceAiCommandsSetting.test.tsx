import React, { act } from 'react'
import { createRoot } from 'react-dom/client'
import { describe, it, expect, vi } from 'vitest'

const setSetting = vi.fn(async () => true)
const terminal = {
  id: 'remoteit.console',
  enabled: true,
  settings: [{ name: 'ai_commands', type: 'bool', value: true }],
}

vi.mock('../hooks/useDeviceApps', () => ({ useDeviceApps: () => ({ apps: [terminal], setSetting }) }))
vi.mock('./DeviceAppSetting', () => ({ adminHolds: () => false, appSettingNote: () => '' }))
vi.mock('./DeviceSettingRow', () => ({
  lockedLine: () => undefined,
  DeviceSettingRow: ({ label, subLabel, onChange }: any) => (
    <button data-row onClick={() => onChange(false)}>
      <span data-label>{label}</span>
      <span data-sub>{subLabel}</span>
    </button>
  ),
}))
vi.mock('react-i18next', () => ({ useTranslation: () => ({ t: (_key: string, text: string) => text }) }))

import { DeviceAiCommandsSetting } from './DeviceAiCommandsSetting'
;(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true

describe('AI commands in device Settings', () => {
  it('the Terminal app page’s words, and the same setting changed', async () => {
    const container = document.createElement('div')
    const device = { id: 'D1', accountId: 'A1', permissions: ['MANAGE'] } as unknown as IDevice
    await act(async () => createRoot(container).render(<DeviceAiCommandsSetting device={device} />))
    expect(container.querySelector('[data-label]')?.textContent).toBe('AI can run commands on this device')
    expect(container.querySelector('[data-sub]')?.textContent).toBe(
      'AI tools you connect run commands as the people you allow.'
    )
    await act(async () => (container.querySelector('[data-row]') as HTMLElement).click())
    expect(setSetting).toHaveBeenCalledWith(terminal, 'ai_commands', false)
  })
})
