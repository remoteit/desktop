import React, { act } from 'react'
import { createRoot } from 'react-dom/client'
import { describe, it, expect, vi } from 'vitest'

const { exit, chooser } = vi.hoisted(() => ({ exit: vi.fn(), chooser: vi.fn() }))
vi.mock('../services/graphQLProxy', () => ({
  graphQLDeviceExit: exit,
  graphQLDeviceExitChooser: chooser,
  graphQLExits: async () => [{ id: 'EXIT', name: 'office' }],
  graphQLSetDeviceExit: async () => true,
}))
vi.mock('./ListItemSetting', () => ({
  ListItemSetting: ({ label, subLabel }: any) => (
    <div data-item>
      {label}
      {subLabel ? ` — ${subLabel}` : ''}
    </div>
  ),
}))
vi.mock('../services/graphQLDeviceSettings', () => ({ settingOn: (s: any) => !!s?.value?.on }))
vi.mock('./DeviceSettingRow', () => ({
  DeviceSettingRow: ({ label, on, setting }: any) => (
    <div data-switch>
      {label} {String(on ?? setting.value.on)}
    </div>
  ),
}))
vi.mock('./SelectSetting', () => ({
  SelectSetting: ({ disabled }: any) => <div data-select>{disabled ? 'locked' : 'open'}</div>,
}))
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (_key: string, text: string, values?: any) => text.replace(/{{(\w+)}}/g, (_, k) => values?.[k] ?? ''),
  }),
}))

import { DeviceExitSection, chosenLine, policyLine } from './DeviceExitSection'
;(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true

const t = ((_key: string, text: string, values?: any) => text.replace(/{{(\w+)}}/g, (_, k) => values?.[k] ?? '')) as any
const none = {
  exitSetOnDevice: null,
  exitSetOnDeviceBy: null,
  exitSetBy: null,
  exitPolicy: 'cloud+local' as const,
  exitAllowed: null,
  exitPinned: null,
}

async function render(settings?: any, permissions = ['MANAGE']) {
  const container = document.createElement('div')
  const root = createRoot(container)
  const device = { id: 'LAPTOP', permissions } as any
  await act(async () => root.render(<DeviceExitSection device={device} settings={settings} />))
  return container
}

describe('who chose the exit, and the machine’s policy', () => {
  it('says who chose it: on the device, by whom; or in the portal', () => {
    expect(chosenLine(t, { ...none, exitSetOnDevice: true, exitSetOnDeviceBy: 'bob' })).toBe('Set on the device by bob')
    expect(chosenLine(t, { ...none, exitSetOnDevice: true })).toBe('Set on the device')
    expect(chosenLine(t, { ...none, exitSetOnDevice: false, exitSetBy: { email: 'ann@example.com' } })).toBe(
      'Set by ann@example.com'
    )
    expect(chosenLine(t, null)).toBeNull()
  })

  it('says what the administrator decided', () => {
    expect(policyLine(t, none)).toBeNull()
    expect(policyLine(t, { ...none, exitPolicy: 'local' })?.label).toBe(
      'This machine’s administrator keeps its exit local'
    )
    expect(policyLine(t, { ...none, exitPolicy: 'never' })?.label).toBe(
      'This machine’s administrator allows it no exit'
    )
    expect(policyLine(t, { ...none, exitAllowed: ['EXIT'] })?.hint).toBe('EXIT')
    expect(policyLine(t, { ...none, exitPinned: 'EXIT' })?.label).toBe('Pinned by this machine’s administrator to EXIT')
  })

  it('shows them, and locks the choice under local', async () => {
    exit.mockResolvedValue({ offersExit: false, exit: { id: 'EXIT', name: 'office' } })
    chooser.mockResolvedValue({ ...none, exitSetOnDevice: true, exitSetOnDeviceBy: 'bob', exitPolicy: 'local' })
    const page = await render()
    expect(page.textContent).toContain('Set on the device by bob')
    expect(page.textContent).toContain('keeps its exit local')
    expect(page.querySelector('[data-select]')?.textContent).toBe('locked')
  })

  it('an API without the fields still shows the exit', async () => {
    exit.mockResolvedValue({ offersExit: false, exit: { id: 'EXIT', name: 'office' } })
    chooser.mockResolvedValue('UNSUPPORTED')
    const page = await render()
    expect(page.querySelector('[data-select]')?.textContent).toBe('open')
    expect(page.textContent).not.toContain('Set on the device')
  })

  it('with device settings, whoever manages it switches it an exit node, and its LAN beneath while on', async () => {
    exit.mockResolvedValue({ offersExit: true, exit: null })
    chooser.mockResolvedValue(none)
    const setting = { name: 'exit_node', value: { on: true, lan: false }, control: 'cloud+local' }
    const settings = { setting: () => setting, set: vi.fn() }
    let page = await render(settings)
    const switches = [...page.querySelectorAll('[data-switch]')].map(e => e.textContent)
    expect(switches).toEqual(['Offer itself as an exit node true', 'Its local network too false'])

    page = await render(settings, [])
    expect(page.querySelector('[data-switch]')).toBeNull()
    expect(page.textContent).toContain('Offers itself as an exit node')
  })
})
