import React, { act } from 'react'
import { createRoot } from 'react-dom/client'
import { describe, it, expect, vi, beforeEach } from 'vitest'

const { readWebsocket, settings, device } = vi.hoisted(() => ({
  readWebsocket: vi.fn(),
  settings: { list: [] as any[], set: (() => {}) as any },
  device: { current: { id: 'D', permissions: ['MANAGE'] } as any },
}))
vi.mock('../services/post', () => ({ post: vi.fn() }))
vi.mock('../services/graphQL', () => ({ graphQLBasicRequest: vi.fn(), graphQLGetErrors: vi.fn() }))
vi.mock('../services/graphQLDeviceSettings', async importOriginal => ({
  ...(await importOriginal<any>()),
  graphQLDeviceWebsocket: readWebsocket,
}))
vi.mock('../services/Context', async () => ({ DeviceContext: (await import('react')).createContext({}) }))
vi.mock('../hooks/useDeviceSettings', () => ({
  useDeviceSettings: () => ({
    settings: settings.list,
    setting: (name: string) => settings.list.find(s => s.name === name),
    set: settings.set,
    reload: vi.fn(),
  }),
}))
vi.mock('./ListItemSetting', () => ({ ListItemSetting: () => null }))
vi.mock('./SelectSetting', () => ({
  SelectSetting: ({ label, value, values, disabled, helperText, onChange }: any) => (
    <div data-select data-value={value} data-disabled={String(!!disabled)}>
      <span data-label>{label}</span>
      {values.map((v: any) => (
        <button key={v.key} data-choice={v.key} disabled={disabled} onClick={() => onChange(v.key)}>
          {v.name} — {v.description}
        </button>
      ))}
      <span data-note>{helperText}</span>
    </div>
  ),
}))
vi.mock('./Confirm', () => ({
  Confirm: ({ open, title, action, children, onConfirm, onDeny }: any) =>
    open ? (
      <div data-confirm>
        {title} {children}
        <button data-confirm-ok onClick={onConfirm}>
          {action}
        </button>
        <button data-confirm-deny onClick={onDeny} />
      </div>
    ) : null,
}))
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (_key: string, text: string, values?: any) => text.replace(/{{(\w+)}}/g, (_, k) => values?.[k] ?? ''),
  }),
}))

import { DeviceContext } from '../services/Context'
import { DeviceWebsocketSetting } from './DeviceWebsocketSetting'
import type { DeviceSetting } from '../services/graphQLDeviceSettings'
;(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true

const websocket = (more: Partial<DeviceSetting> = {}): DeviceSetting => ({
  name: 'websocket',
  value: 'auto',
  at: null,
  by: null,
  onDevice: false,
  control: 'cloud+local',
  ...more,
})
const using = (on: boolean) => ({ mode: 'auto', using: on, since: on ? '2026-10-06T17:04:05.123Z' : null })

async function render() {
  const container = document.createElement('div')
  await act(async () =>
    createRoot(container).render(
      <DeviceContext.Provider value={{ device: device.current } as any}>
        <DeviceWebsocketSetting />
      </DeviceContext.Provider>
    )
  )
  return container
}

const select = (page: HTMLElement) => page.querySelector('[data-select]') as HTMLElement | null
const note = (page: HTMLElement) => page.querySelector('[data-note]')!.textContent
const choose = async (page: HTMLElement, key: string) =>
  act(async () => (page.querySelector(`[data-choice="${key}"]`) as HTMLButtonElement).click())

beforeEach(() => {
  readWebsocket.mockReset()
  readWebsocket.mockResolvedValue(using(false))
  settings.set = vi.fn(async () => true)
  settings.list = [websocket()]
  device.current = { id: 'D', permissions: ['MANAGE'] }
})

describe('the reflector (websocket) setting', () => {
  it('absent where the API’s settings do not have it', async () => {
    settings.list = [{ ...websocket(), name: 'subnet' }]
    const page = await render()
    expect(select(page)).toBeNull()
    expect(readWebsocket).not.toHaveBeenCalled()
  })

  it('three choices, automatic by default, each said', async () => {
    settings.list = [websocket({ value: null })]
    const page = await render()
    expect(select(page)!.dataset.value).toBe('auto')
    expect(page.textContent).toContain('Reflector (websocket)')
    expect(page.textContent).toContain('Automatic — Used only when this device’s UDP is blocked')
    expect(page.textContent).toContain(
      'Always — All traffic through remote.it’s reflector — for networks that block UDP'
    )
    expect(page.textContent).toContain('Off — Never; with UDP blocked the device goes offline')
  })

  it('Always: written through setDeviceSetting, no question', async () => {
    const page = await render()
    await choose(page, 'on')
    expect(settings.set).toHaveBeenCalledWith('websocket', 'on')
    expect(page.querySelector('[data-confirm]')).toBeNull()
  })

  it('Off while not through the reflector: written, no question', async () => {
    const page = await render()
    await choose(page, 'off')
    expect(settings.set).toHaveBeenCalledWith('websocket', 'off')
    expect(page.querySelector('[data-confirm]')).toBeNull()
  })

  it('through the reflector: said, and Off asked first — written only once confirmed', async () => {
    readWebsocket.mockResolvedValue(using(true))
    const page = await render()
    expect(note(page)).toBe('Reaching remote.it through the reflector')
    await choose(page, 'off')
    expect(settings.set).not.toHaveBeenCalled()
    expect(page.querySelector('[data-confirm]')!.textContent).toContain(
      'This device reaches remote.it through the reflector now. Turning it off disconnects it until someone changes it on the device.'
    )
    await act(async () => (page.querySelector('[data-confirm-ok]') as HTMLButtonElement).click())
    expect(settings.set).toHaveBeenCalledWith('websocket', 'off')
    expect(page.querySelector('[data-confirm]')).toBeNull()
  })

  it('the state unknown (not reported, null, or the read failed): Off asked too, more softly', async () => {
    const soft =
      "remote.it can't tell whether this device needs the reflector right now. If its UDP is blocked, turning it off disconnects it until someone changes it on the device."
    for (const answer of [null, { mode: null, using: null, since: null }, 'ERROR']) {
      readWebsocket.mockResolvedValue(answer)
      settings.set = vi.fn(async () => true)
      const page = await render()
      expect(note(page)).toBe('')
      await choose(page, 'off')
      expect(settings.set).not.toHaveBeenCalled()
      const dialog = page.querySelector('[data-confirm]')!.textContent
      expect(dialog).toContain('Turn the reflector off?')
      expect(dialog).toContain(soft)
      expect(dialog).not.toContain('reaches remote.it through the reflector now')
      await act(async () => (page.querySelector('[data-confirm-ok]') as HTMLButtonElement).click())
      expect(settings.set).toHaveBeenCalledWith('websocket', 'off')
    }
  })

  it('declined: nothing written', async () => {
    readWebsocket.mockResolvedValue(using(true))
    const page = await render()
    await choose(page, 'off')
    await act(async () => (page.querySelector('[data-confirm-deny]') as HTMLButtonElement).click())
    expect(page.querySelector('[data-confirm]')).toBeNull()
    expect(settings.set).not.toHaveBeenCalled()
  })

  it('the device’s state read again at the choice: asked once it is through the reflector since the page opened', async () => {
    const page = await render()
    expect(note(page)).toBe('')
    readWebsocket.mockResolvedValue(using(true))
    await choose(page, 'off')
    expect(page.querySelector('[data-confirm]')).not.toBeNull()
    expect(settings.set).not.toHaveBeenCalled()
  })

  it('set on the device: says by whom', async () => {
    settings.list = [websocket({ value: 'on', onDevice: true, by: 'bob' })]
    const page = await render()
    expect(select(page)!.dataset.value).toBe('on')
    expect(note(page)).toBe('Set on the device by bob')
  })

  it('fixed by the administrator (off, on, auto) or set only on the device: greyed at that value, with why', async () => {
    const cases = [
      ['off', 'off', "Set to Off by the device's administrator"],
      ['on', 'on', "Set to Always by the device's administrator"],
      ['auto', 'auto', "Set to Automatic by the device's administrator"],
      ['local', 'on', 'Set only on the device'],
    ] as const
    for (const [control, mode, why] of cases) {
      settings.list = [websocket({ control, value: control === 'local' ? 'on' : 'off' })]
      const page = await render()
      expect(select(page)!.dataset.value).toBe(mode)
      expect(select(page)!.dataset.disabled).toBe('true')
      expect(note(page)).toBe(why)
    }
  })

  it('greyed for one who does not manage the device', async () => {
    device.current = { id: 'D', permissions: [] }
    const page = await render()
    expect(select(page)!.dataset.disabled).toBe('true')
  })
})
