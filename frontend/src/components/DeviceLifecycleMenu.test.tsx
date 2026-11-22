import React, { act } from 'react'
import { createRoot, Root } from 'react-dom/client'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

const { dispatch, push } = vi.hoisted(() => ({
  dispatch: { devices: { restore: vi.fn(), decommission: vi.fn() }, ui: { set: vi.fn() } },
  push: vi.fn(),
}))
vi.mock('../store', () => ({}))
vi.mock('react-redux', () => ({
  useDispatch: () => dispatch,
  useSelector: (select: any) => select({ ui: { destroying: false }, organization: {} }),
}))
vi.mock('react-router-dom', () => ({
  useHistory: () => ({ push }),
  useParams: () => ({ deviceID: 'D1' }),
  Link: ({ children }: any) => <a>{children}</a>,
}))
vi.mock('../selectors/organizations', () => ({ selectPermissions: () => ['ADMIN'] }))
vi.mock('../hooks/useDeviceDisable', () => ({
  useDeviceDisable: () => true,
  useCanDecommission: () => true,
  disabledWhen: () => undefined,
}))
vi.mock('../hooks/useVirtualDevices', () => ({ useVirtualDevices: () => false }))
vi.mock('./RunActionDialog', () => ({ DeviceRunEffects: () => null }))
vi.mock('./DisableDevice', () => ({ DisableDevice: () => <li>Disable device…</li> }))
vi.mock('./DeleteDevice', () => ({ DeleteDevice: () => null }))
vi.mock('./LeaveDevice', () => ({ LeaveDevice: () => null }))
vi.mock('./CopyMenuItem', () => ({ CopyMenuItem: ({ title }: any) => <li>{title}</li> }))
vi.mock('./ListItemLocation', () => ({ ListItemLocation: ({ title }: any) => <li>{title}</li> }))
vi.mock('./MobileUI', () => ({ MobileUI: () => null }))
vi.mock('./HostedDevices', () => ({ openVirtualDeviceAdd: vi.fn() }))
vi.mock('../buttons/InfoButton', () => ({ InfoButton: () => null }))
vi.mock('../buttons/DeleteServiceMenuItem', () => ({ DeleteServiceMenuItem: () => null }))
vi.mock('../buttons/IconButton', () => ({
  IconButton: ({ onClick }: any) => <button data-open-menu onClick={onClick} />,
}))
vi.mock('./Icon', () => ({ Icon: () => null }))
vi.mock('react-i18next', () => {
  const fill = (text: string, values?: any) => text.replace(/{{(\w+)}}/g, (_, k) => values?.[k] ?? '')
  return {
    useTranslation: () => ({
      t: (_key: string, a: any, b?: any) =>
        typeof a === 'string'
          ? fill(a, b)
          : fill(a.defaultValue ?? (a.count === 1 ? a.defaultValue_one : a.defaultValue_other), a),
    }),
  }
})

import { DeviceOptionMenu } from './DeviceOptionMenu'
;(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true

const device = (more: Partial<IDevice> = {}) =>
  ({ id: 'D1', name: 'Kitchen Pi', permissions: ['MANAGE'], services: [], loaded: true, ...more } as unknown as IDevice)

let root: Root
let container: HTMLElement
async function render(d: IDevice) {
  container = document.createElement('div')
  document.body.appendChild(container)
  root = createRoot(container)
  await act(async () => root.render(<DeviceOptionMenu device={d} />))
  await act(async () => (container.querySelector('[data-open-menu]') as HTMLElement).click())
}
afterEach(() => {
  act(() => root.unmount())
  container.remove()
  document.body.innerHTML = ''
})
beforeEach(() => {
  dispatch.devices.restore.mockReset()
  dispatch.devices.decommission.mockReset().mockResolvedValue(true)
  dispatch.ui.set.mockReset()
  push.mockReset()
})

const item = (words: string) =>
  [...document.body.querySelectorAll('li')].find(li => li.textContent?.startsWith(words)) as HTMLElement | undefined

describe('the device menu: recover, restore and delete permanently', () => {
  it('Recover device… says what it does and opens the recovery code, as Restore Device did', async () => {
    await render(device())
    const recover = item('Recover device…')!
    expect(recover.textContent).toBe('Recover device…Make a reset or reinstalled machine this device again')
    expect(item('Restore')).toBeUndefined()
    await act(async () => recover.click())
    expect(dispatch.ui.set).toHaveBeenCalledWith({ showRestoreModal: true })
  })

  it('a virtual device has nothing to recover', async () => {
    await render(device({ virtual: true } as Partial<IDevice>))
    expect(item('Recover device…')).toBeUndefined()
  })

  it('disabled: Restore device brings it back; Delete permanently… asks, then decommissions it', async () => {
    await render(device({ disabled: true } as Partial<IDevice>))
    expect(item('Recover device…')).toBeUndefined()
    await act(async () => item('Restore device')!.click())
    expect(dispatch.devices.restore).toHaveBeenCalledWith(['D1'])
    expect(dispatch.devices.decommission).not.toHaveBeenCalled()
    await act(async () => (container.querySelector('[data-open-menu]') as HTMLElement).click())
    await act(async () => item('Delete permanently…')!.click())
    expect(document.body.textContent).toContain('Delete "Kitchen Pi" permanently?')
    const input = document.body.querySelector('input[aria-label="decommission-confirm"]') as HTMLInputElement
    await act(async () => {
      Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')!.set!.call(input, 'Kitchen Pi')
      input.dispatchEvent(new Event('input', { bubbles: true }))
    })
    const confirm = [...document.body.querySelectorAll('button')].find(
      b => b.textContent?.trim() === 'Delete permanently'
    )!
    await act(async () => confirm.click())
    expect(dispatch.devices.decommission).toHaveBeenCalledWith(['D1'])
    expect(push).toHaveBeenCalledWith('/devices/disabled')
  })
})
