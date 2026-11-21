import React, { act } from 'react'
import { createRoot } from 'react-dom/client'
import { expect, it, vi } from 'vitest'
import { DeviceRegistration } from './DeviceRegistration'
import { DeviceStatus, ThisDevice } from '../../services/thisDevice'

const { create, read } = vi.hoisted(() => ({ create: vi.fn(), read: vi.fn() }))
vi.mock('../../services/deviceOnboarding', () => ({ createAppRegistration: create, readDeviceSetupAccount: read }))
vi.mock('../../selectors/organizations', () => ({
  selectOrganizationOptions: () => [{ id: 'work', name: 'Acme', disabled: false }],
  selectCanRegister: () => true,
}))
vi.mock('react-redux', async importOriginal => ({
  ...(await importOriginal<object>()),
  useSelector: (selector: any) => selector({ user: { id: 'me', email: 'me@example.test' } }),
}))
vi.mock('react-router-dom', () => ({
  useLocation: () => ({ pathname: '/this-device/setup/' + 'b'.repeat(48) }),
}))
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (_key: string, text: string, values?: Record<string, string>) =>
      text.replace(/{{(\w+)}}/g, (_, k) => values?.[k] ?? ''),
  }),
}))
;(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true

it('carries the browser account into onboarding and only registers on confirmation', async () => {
  const registration = { name: 'Laptop', platform: 1232 }
  const status: DeviceStatus = { stage: 'solo', registration, engine: 'offline', network: 'wifi', vpn: { on: false } }
  const call = vi.fn().mockImplementation(method => (method === 'status' ? status : 'registered'))
  const device = { info: { shell: 'menu' }, call } as unknown as ThisDevice
  const container = document.body.appendChild(document.createElement('div'))
  const root = createRoot(container)
  const button = (label: string) => [...document.querySelectorAll('button')].find(b => b.textContent === label)!

  read.mockResolvedValue('work')
  create.mockResolvedValue('registration-code')
  try {
    await act(async () => root.render(<DeviceRegistration device={device} status={status} />))
    expect(document.body.textContent).toContain('Add this device to Acme?')
    await act(async () => button('Later').click())
    expect(create).not.toHaveBeenCalled()
    expect(call).not.toHaveBeenCalled()

    await act(async () => button('Add this device').click())
    await act(async () => button('Add device').click())
    expect(create).toHaveBeenCalledWith('work', 'Laptop', 1232, false)
    expect(call).toHaveBeenCalledWith('device.register', {
      code: 'registration-code',
      name: 'Laptop',
      accountId: 'work',
    })
    expect(document.body.textContent).toContain('Device added to Acme.')
  } finally {
    await act(async () => root.unmount())
    container.remove()
  }
})

it('requests a fresh code when resuming a phone’s saved setup', async () => {
  create.mockClear()
  read.mockResolvedValue('work')
  create.mockResolvedValue('new-registration-code')
  const status: DeviceStatus = {
    stage: 'local2',
    registration: { name: 'Phone', platform: 1213, pendingAccount: 'work' },
    engine: 'stopped',
    network: 'wifi',
    vpn: { on: false },
  }
  const call = vi.fn().mockImplementation(method => (method === 'status' ? status : 'registered'))
  const device = { info: { shell: 'capacitor' }, call } as unknown as ThisDevice
  const container = document.body.appendChild(document.createElement('div'))
  const root = createRoot(container)
  try {
    await act(async () => root.render(<DeviceRegistration device={device} status={status} />))
    expect(create).not.toHaveBeenCalled()
    const add = [...document.querySelectorAll('button')].find(button => button.textContent === 'Add device')!
    await act(async () => add.click())
    expect(create).toHaveBeenCalledWith('work', 'Phone', 1213, true)
    expect(call).toHaveBeenCalledWith('device.register', {
      code: 'new-registration-code',
      name: 'Phone',
      accountId: 'work',
    })
  } finally {
    await act(async () => root.unmount())
    container.remove()
  }
})
