import React, { act } from 'react'
import { createRoot } from 'react-dom/client'
import { expect, it, vi } from 'vitest'
import { DeviceContext } from '../services/Context'
import { DeviceAnyPortSetting } from './DeviceAnyPortSetting'

vi.mock('../hooks/useDeviceSessions', () => ({ useDeviceSessions: () => true }))
vi.mock('../hooks/useDeviceSettings', () => ({
  useDeviceSettings: () => ({
    setting: () => ({ name: 'any_port', control: 'off', value: { tcp: '*', udp: '*' } }),
    set: vi.fn(),
  }),
}))
vi.mock('../services/graphQLDaemon', () => ({ UNSUPPORTED: 'UNSUPPORTED' }))
vi.mock('../services/graphQLDeviceNetworks', () => ({ graphQLDeviceAnyPort: vi.fn(async () => null) }))
vi.mock('../services/graphQL', () => ({}))
vi.mock('../services/post', () => ({}))
vi.mock('./InlineTextFieldSetting', () => ({ InlineTextFieldSetting: () => <input /> }))
vi.mock('./ListItemSetting', () => ({
  ListItemSetting: ({ label, subLabel }: { label: string; subLabel: string }) => (
    <div>
      <span>{label}</span>
      <span>{subLabel}</span>
    </div>
  ),
}))
vi.mock('./SelectSetting', () => ({ SelectSetting: () => null }))
vi.mock('react-i18next', () => ({ useTranslation: () => ({ t: (_key: string, text: string) => text }) }))
;(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true

it('names the locked Any port setting for both protocols', async () => {
  const container = document.createElement('div')
  const root = createRoot(container)
  const device = { id: 'device', permissions: ['MANAGE'] } as IDevice
  const context = { device, user: {} as IUser, connection: {} as IConnection, connections: [], waiting: false }

  await act(async () => {
    root.render(
      <DeviceContext.Provider value={context}>
        <DeviceAnyPortSetting />
      </DeviceContext.Provider>
    )
  })

  expect(container.textContent).toContain('Any port access (TCP and UDP)')
  expect(container.textContent).toContain('Turned off on the device by its administrator')
  expect(container.querySelector('input')).toBeNull()
  await act(async () => root.unmount())
})
