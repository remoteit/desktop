import React, { act } from 'react'
import { createRoot } from 'react-dom/client'
import { describe, it, expect, vi, beforeEach } from 'vitest'

// A service's own name (presence-server docs/subnet-service-names.md): switched on and off, and its name part edited,
// through setServiceSubnetName; nothing where the API has no service names.
const { field, checkbox, setName, info } = vi.hoisted(() => ({
  field: { props: undefined as any },
  checkbox: { props: undefined as any },
  setName: vi.fn().mockResolvedValue(undefined), // no refusal: done
  info: { value: undefined as any },
}))
vi.mock('../hooks/useDeviceSessions', () => ({ useDeviceSessions: () => true }))
vi.mock('../hooks/useDeviceSessionInfo', () => ({ useDeviceSessionInfo: () => info.value }))
vi.mock('../services/post', () => ({ post: vi.fn() }))
vi.mock('../services/graphQL', () => ({ graphQLBasicRequest: vi.fn(), graphQLGetErrors: vi.fn() }))
vi.mock('../services/deviceSessionInfo', () => ({
  refreshDeviceSessionInfo: vi.fn(),
  requestDeviceSessionInfo: vi.fn(),
}))
vi.mock('../services/graphQLDaemon', () => ({ UNSUPPORTED: 'UNSUPPORTED', withoutDeviceSessions: () => false }))
vi.mock('../services/subnetNames', async importOriginal => ({
  ...(await importOriginal<typeof import('../services/subnetNames')>()),
  setServiceSubnetName: setName,
}))
vi.mock('./InlineTextFieldSetting', () => ({
  InlineTextFieldSetting: (props: any) => {
    field.props = props
    return <div data-field>{props.displayValue}</div>
  },
}))
vi.mock('./Notice', () => ({ Notice: (props: any) => <div data-notice>{props.children}</div> }))
vi.mock('./ListItemCheckbox', () => ({
  ListItemCheckbox: (props: any) => {
    checkbox.props = props
    return <div data-checkbox>{props.subLabel}</div>
  },
}))
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (_key: string, text: string, values?: any) => text.replace(/{{(\w+)}}/g, (_, k) => values?.[k] ?? ''),
  }),
}))

import { ServiceSubnetNameSetting } from './ServiceSubnetNameSetting'
;(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true

const device = (permissions = ['MANAGE']) => ({ id: 'D', permissions } as unknown as IDevice)
const service = { id: 'S', name: 'Console' } as unknown as IService

async function render(permissions?: string[]) {
  field.props = undefined
  checkbox.props = undefined
  const container = document.createElement('div')
  const root = createRoot(container)
  await act(async () => root.render(<ServiceSubnetNameSetting device={device(permissions)} service={service} />))
  return container
}

beforeEach(() => {
  setName.mockClear()
  info.value = {
    subnetName: 'pi-acme.on.remote.it',
    services: { S: 'piconsole-acme.on.remote.it' },
    serviceNames: { S: { own: true, port: 22, ports: ['22 → 2222', '2222'], defaultLabel: 'piconsole' } },
  }
})

describe('ServiceSubnetNameSetting', () => {
  it('on: the name and its port shown, its name part edited', async () => {
    const container = await render()
    expect(checkbox.props.checked).toBe(true)
    expect(container.textContent).toContain('piconsole-acme.on.remote.it:22')
    expect(container.textContent).toContain('Ports: 22 → 2222, 2222')
    expect(field.props.value).toBe('piconsole')
    expect(field.props.validate('pi-console')).toMatch('no dashes')
    expect(field.props.helper('shell')).toBe('shell-acme.on.remote.it — the old name keeps working for 30 days')
    await act(async () => field.props.onSave('piconsole'))
    expect(setName).not.toHaveBeenCalled()
    await act(async () => field.props.onSave('Shell'))
    expect(setName).toHaveBeenCalledWith('D', 'S', true, 'Shell')
  })

  // Evan, 2026-11-19: a person may name a service; a name taken is refused, and why is shown; the default given back.
  it("a person's own name: taken is shown as refused, nothing else in its place; the default offered back", async () => {
    const container = await render()
    expect(field.props.resetValue).toBe('piconsole')
    setName.mockResolvedValueOnce('Pi is already a device, LAN host or service of this account')
    await act(async () => field.props.onSave('pi'))
    expect(setName).toHaveBeenCalledWith('D', 'S', true, 'pi')
    expect(container.querySelector('[data-notice]')?.textContent).toBe(
      'Pi is already a device, LAN host or service of this account'
    )
    // Then one that is free: done, the refusal gone.
    await act(async () => field.props.onSave('shell'))
    expect(container.querySelector('[data-notice]')).toBeNull()
  })

  it('a web service is on 443: no port shown', async () => {
    info.value.services.S = 'piweb-acme.on.remote.it'
    info.value.serviceNames.S = { own: true, port: 443 }
    expect((await render()).textContent).toContain('piweb-acme.on.remote.it')
    expect((await render()).textContent).not.toContain(':443')
  })

  it('off: switched on and off through setServiceSubnetName', async () => {
    info.value.services.S = 'pi-acme.on.remote.it'
    info.value.serviceNames.S = { own: false, port: 2222 }
    await render()
    expect(checkbox.props.checked).toBe(false)
    expect(field.props).toBeUndefined()
    await act(async () => checkbox.props.onClick(true))
    expect(setName).toHaveBeenCalledWith('D', 'S', true, undefined)
    await act(async () => checkbox.props.onClick(false))
    expect(setName).toHaveBeenLastCalledWith('D', 'S', false, undefined)
  })

  it('cannot be changed by someone who may not manage the device', async () => {
    await render(['VIEW'])
    expect(checkbox.props.disabled).toBe(true)
    expect(field.props.disabled).toBe(true)
  })

  it('nothing where the API has no service names', async () => {
    info.value.serviceNames = undefined
    expect((await render()).textContent).toBe('')
  })
})
