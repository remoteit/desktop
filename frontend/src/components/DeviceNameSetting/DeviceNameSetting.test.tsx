import React, { act } from 'react'
import { createRoot } from 'react-dom/client'
import { describe, it, expect, vi, beforeEach } from 'vitest'

const { field, rename, setDevice, setLabel, info } = vi.hoisted(() => ({
  field: { props: undefined as any, typed: '' },
  rename: vi.fn(),
  setDevice: vi.fn(),
  setLabel: vi.fn().mockResolvedValue(true),
  info: { value: undefined as any },
}))
vi.mock('../../store', () => ({}))
vi.mock('../../selectors/devices', () => ({ getDevices: () => [] }))
vi.mock('@common/nameHelper', () => ({ safeHostname: () => 'host' }))
vi.mock('react-redux', () => ({
  useSelector: (select: any) => select({ backend: { environment: { hostname: 'host' } } }),
  useDispatch: () => ({ accounts: { setDevice }, devices: { rename } }),
}))
vi.mock('../../hooks/useDeviceSessions', () => ({ useDeviceSessions: () => true }))
vi.mock('../../hooks/useDeviceSessionInfo', () => ({ useDeviceSessionInfo: () => info.value }))
// What subnetNames calls through; its rules are its own.
vi.mock('../../services/post', () => ({ post: vi.fn() }))
vi.mock('../../services/graphQL', () => ({ graphQLBasicRequest: vi.fn(), graphQLGetErrors: vi.fn() }))
vi.mock('../../services/deviceSessionInfo', () => ({ refreshDeviceSessionInfo: vi.fn(), requestDeviceSessionInfo: vi.fn() }))
vi.mock('../../services/graphQLDaemon', () => ({ UNSUPPORTED: 'UNSUPPORTED', withoutDeviceSessions: () => false }))
vi.mock('../../services/subnetNames', async importOriginal => ({
  ...(await importOriginal<typeof import('../../services/subnetNames')>()),
  setDeviceSubnetLabel: setLabel,
}))
// The field itself is the app's; what is under test is what goes below it while typing, and what saving does.
vi.mock('../InlineTextFieldSetting', () => ({
  InlineTextFieldSetting: (props: any) => {
    field.props = props
    return <div data-helper>{props.helper?.(field.typed)}</div>
  },
}))
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (_key: string, text: string, values?: any) => text.replace(/{{(\w+)}}/g, (_, k) => values?.[k] ?? ''),
  }),
}))

import { DeviceContext } from '../../services/Context'
import { DeviceNameSetting } from './DeviceNameSetting'
;(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true

const device = { id: 'D', name: 'Kitchen Pi', permissions: ['MANAGE'] } as unknown as IDevice

async function render(typed: string) {
  field.typed = typed
  const container = document.createElement('div')
  document.body.appendChild(container)
  const root = createRoot(container)
  await act(async () =>
    root.render(
      <DeviceContext.Provider value={{ device } as any}>
        <DeviceNameSetting />
      </DeviceContext.Provider>
    )
  )
  return container
}

beforeEach(() => {
  rename.mockReset().mockResolvedValue({})
  setLabel.mockClear()
  setDevice.mockClear()
  info.value = { subnetName: 'kitchenpi-acme.on.remote.it', actsFor: null, agent: null }
})

describe('renaming a device whose DNS name is still the one its name made', () => {
  it('offers, unchecked, to change the DNS name too — and does not unless checked', async () => {
    const container = await render('Garage Pi')
    expect(container.textContent).toContain('Also change its DNS name to garagepi-acme.on.remote.it')
    const box = container.querySelector('input[type=checkbox]') as HTMLInputElement
    expect(box.checked).toBe(false)

    await act(async () => field.props.onSave('Garage Pi'))
    expect(rename).toHaveBeenCalledWith({ id: 'D', name: 'Garage Pi' })
    expect(setLabel).not.toHaveBeenCalled()
  })

  it('checked, changes it after the rename', async () => {
    const container = await render('Garage Pi')
    await act(async () => (container.querySelector('input[type=checkbox]') as HTMLInputElement).click())
    expect((container.querySelector('input[type=checkbox]') as HTMLInputElement).checked).toBe(true)

    await act(async () => field.props.onSave('Garage Pi'))
    expect(setLabel).toHaveBeenCalledWith('D', 'garagepi')
    expect(rename.mock.invocationCallOrder[0]).toBeLessThan(setLabel.mock.invocationCallOrder[0])
  })

  it('checked for one name, does not carry over to another typed after', async () => {
    const container = await render('Garage Pi')
    await act(async () => (container.querySelector('input[type=checkbox]') as HTMLInputElement).click())
    await act(async () => field.props.onSave('Shed Pi'))
    expect(setLabel).not.toHaveBeenCalled()
  })

  it('a refused rename leaves the DNS name alone', async () => {
    rename.mockResolvedValue('ERROR')
    const container = await render('Garage Pi')
    await act(async () => (container.querySelector('input[type=checkbox]') as HTMLInputElement).click())
    await act(async () => field.props.onSave('Garage Pi'))
    expect(setLabel).not.toHaveBeenCalled()
  })
})

describe('no offer', () => {
  it('when the DNS name was chosen, not made from the name', async () => {
    info.value = { subnetName: 'kitchen-acme.on.remote.it', actsFor: null, agent: null }
    expect((await render('Garage Pi')).querySelector('input[type=checkbox]')).toBeNull()
  })

  it('when the new name makes the same DNS name, makes none, or the API serves no DNS names', async () => {
    expect((await render('kitchen-pi')).querySelector('input[type=checkbox]')).toBeNull()
    expect((await render('!!!')).querySelector('input[type=checkbox]')).toBeNull()
    info.value = { subnetName: null, actsFor: null, agent: null }
    expect((await render('Garage Pi')).querySelector('input[type=checkbox]')).toBeNull()
  })
})
