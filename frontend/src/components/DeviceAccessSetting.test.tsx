import React, { act } from 'react'
import { createRoot } from 'react-dom/client'
import { describe, it, expect, vi, beforeEach } from 'vitest'

const { state, set, setUserMode } = vi.hoisted(() => ({
  state: {
    subnet: undefined as any,
    userMode: undefined as any,
    info: undefined as any,
    portal: false as boolean | 'ERROR',
  },
  set: vi.fn(async () => true),
  setUserMode: vi.fn(async () => true),
}))

vi.mock('../store', () => ({}))
vi.mock('react-redux', () => ({ useSelector: (select: any) => select({ user: { email: 'me@example.com' } }) }))
vi.mock('../services/Context', async () => ({
  DeviceContext: (await import('react')).createContext({ device: { id: 'D1', permissions: ['MANAGE'] } }),
}))
vi.mock('../hooks/useDeviceSessions', () => ({ useDeviceSessions: () => true }))
vi.mock('../hooks/useDeviceSessionInfo', () => ({ useDeviceSessionInfo: () => state.info }))
vi.mock('../hooks/useDeviceSettings', () => ({
  useDeviceSettings: () => ({
    setting: (name: string) => (name === 'subnet' ? state.subnet : name === 'user_mode' ? state.userMode : undefined),
    set,
  }),
}))
vi.mock('../services/deviceSessionInfo', () => ({ setDeviceUserMode: setUserMode }))
vi.mock('../services/deviceSignIns', () => ({ portalUserModeServed: async () => state.portal }))
vi.mock('./DevicePortalUserMode', () => ({ DevicePortalUserMode: () => <div data-portal-user-mode /> }))
vi.mock('../helpers/productPolicyHelper', () => ({ productLockNote: (_t: any, lock: any) => `Set by its product ${lock.product}` }))
vi.mock('./SelectSetting', () => ({
  SelectSetting: ({ value, values, disabled, helperText, onChange }: any) => (
    <div data-select data-value={value} data-disabled={String(!!disabled)}>
      {values.map((v: any) => (
        <button key={v.key} data-choice={v.key} disabled={v.disabled} onClick={() => onChange(v.key)}>
          {v.name}
        </button>
      ))}
      <span data-help>{helperText}</span>
    </div>
  ),
}))
vi.mock('react-i18next', () => ({
  initReactI18next: { type: '3rdParty', init: () => {} },
  useTranslation: () => ({
    t: (_key: string, text: string, values?: any) => text.replace(/{{(\w+)}}/g, (_, k) => values?.[k] ?? ''),
  }),
}))

import { DeviceAccessSetting } from './DeviceAccessSetting'
;(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true

const setting = (name: string, value: any, control = 'cloud+local', locked: any = null) => ({
  name,
  value,
  control,
  locked,
  at: null,
  by: null,
  onDevice: false,
})

async function render() {
  const el = document.createElement('div')
  document.body.appendChild(el)
  await act(async () => createRoot(el).render(<DeviceAccessSetting />))
  await act(async () => {})
  return el
}

const select = (el: Element) => el.querySelector('[data-select]')!
const choice = (el: Element, key: string) => el.querySelector(`[data-choice="${key}"]`) as HTMLButtonElement

beforeEach(() => {
  document.body.innerHTML = ''
  set.mockClear()
  setUserMode.mockClear()
  state.subnet = setting('subnet', true)
  state.userMode = setting('user_mode', null)
  state.info = { subnetName: 'pi-jane.on.remote.it', actsFor: null }
  state.portal = false
})

describe('DeviceAccessSetting', () => {
  it.each([
    [false, null, 'off'],
    [true, null, 'networks'],
    [true, 'me@example.com', 'full'],
    [true, 'other@example.com', 'other'],
  ])('subnet %s, acting for %s, reads %s', async (subnet, actsFor, level) => {
    state.subnet = setting('subnet', subnet)
    state.info = { subnetName: 'pi-jane.on.remote.it', actsFor }
    expect(select(await render()).getAttribute('data-value')).toBe(level)
  })

  it('names the top level after the person, and someone else’s as theirs', async () => {
    state.info = { subnetName: 'pi-jane.on.remote.it', actsFor: 'other@example.com' }
    const el = await render()
    expect(choice(el, 'full').textContent).toBe('Full access as me@example.com')
    expect(choice(el, 'other').textContent).toBe('Full access as other@example.com')
  })

  it('Full access from Off turns the subnet on, then user mode', async () => {
    state.subnet = setting('subnet', false)
    const el = await render()
    await act(async () => choice(el, 'full').click())
    expect(set).toHaveBeenCalledWith('subnet', true)
    expect(setUserMode).toHaveBeenCalledWith('D1', true)
  })

  it('Off from Full access turns user mode off, then the subnet', async () => {
    state.info = { subnetName: 'pi-jane.on.remote.it', actsFor: 'me@example.com' }
    const el = await render()
    await act(async () => choice(el, 'off').click())
    expect(setUserMode).toHaveBeenCalledWith('D1', false)
    expect(set).toHaveBeenCalledWith('subnet', false)
  })

  it('a dormant user mode reads Off and says it is waiting', async () => {
    state.subnet = setting('subnet', false)
    state.info = { subnetName: 'pi-jane.on.remote.it', actsFor: 'me@example.com' }
    const el = await render()
    expect(select(el).getAttribute('data-value')).toBe('off')
    expect(el.querySelector('[data-help]')!.textContent).toBe(
      'Full access for me@example.com is waiting. It starts when Access is on.'
    )
  })

  it('a subnet the administrator locked says so and how to change it, and only Full access stays open', async () => {
    state.subnet = setting('subnet', true, 'on')
    const el = await render()
    expect(el.querySelector('[data-help]')!.textContent).toBe(
      "Locked by the device's administrator. They can change it on the device."
    )
    expect(choice(el, 'off').disabled).toBe(true)
    expect(choice(el, 'networks').disabled).toBe(false)
    expect(choice(el, 'full').disabled).toBe(false)
  })

  it('a subnet its product holds names the product', async () => {
    state.subnet = setting('subnet', true, 'cloud+local', { product: 'Kiosk', level: 'synced' })
    const el = await render()
    expect(el.querySelector('[data-help]')!.textContent).toBe('Set by its product Kiosk. Change it on the product.')
  })

  it('user mode refused on the device closes Full access, saying why', async () => {
    state.userMode = setting('user_mode', null, 'off')
    const el = await render()
    expect(choice(el, 'full').disabled).toBe(true)
  })

  it('without a name on your network, or with per-account sign-ins, Full access is not a level here', async () => {
    state.info = { subnetName: null, actsFor: null }
    expect(choice(await render(), 'full')).toBeNull()
    document.body.innerHTML = ''
    state.info = { subnetName: 'pi-jane.on.remote.it', actsFor: null }
    state.portal = true
    const el = await render()
    expect(choice(el, 'full')).toBeNull()
    expect(el.querySelector('[data-portal-user-mode]')).not.toBeNull()
  })
})
