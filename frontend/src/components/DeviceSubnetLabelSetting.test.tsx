import React, { act } from 'react'
import { createRoot } from 'react-dom/client'
import { describe, it, expect, vi, beforeEach } from 'vitest'

const { field, setLabel, info } = vi.hoisted(() => ({
  field: { props: undefined as any },
  setLabel: vi.fn().mockResolvedValue(true),
  info: { value: undefined as any },
}))
vi.mock('../hooks/useDeviceSessions', () => ({ useDeviceSessions: () => true }))
vi.mock('../hooks/useDeviceSessionInfo', () => ({ useDeviceSessionInfo: () => info.value }))
// What subnetNames calls through; its rules are its own.
vi.mock('../services/post', () => ({ post: vi.fn() }))
vi.mock('../services/graphQL', () => ({ graphQLBasicRequest: vi.fn(), graphQLGetErrors: vi.fn() }))
vi.mock('../services/deviceSessionInfo', () => ({ refreshDeviceSessionInfo: vi.fn(), requestDeviceSessionInfo: vi.fn() }))
vi.mock('../services/graphQLDaemon', () => ({ UNSUPPORTED: 'UNSUPPORTED', withoutDeviceSessions: () => false }))
vi.mock('../services/subnetNames', async importOriginal => ({
  ...(await importOriginal<typeof import('../services/subnetNames')>()),
  setDeviceSubnetLabel: setLabel,
}))
vi.mock('./InlineTextFieldSetting', () => ({
  InlineTextFieldSetting: (props: any) => {
    field.props = props
    return <div data-value>{props.displayValue}</div>
  },
}))
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (_key: string, text: string, values?: any) => text.replace(/{{(\w+)}}/g, (_, k) => values?.[k] ?? ''),
  }),
}))

import { DeviceContext } from '../services/Context'
import { DeviceSubnetLabelSetting } from './DeviceSubnetLabelSetting'
;(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true

async function render(permissions = ['MANAGE']) {
  field.props = undefined
  const container = document.createElement('div')
  const root = createRoot(container)
  const device = { id: 'D', name: 'Kitchen Pi', permissions } as unknown as IDevice
  await act(async () =>
    root.render(
      <DeviceContext.Provider value={{ device } as any}>
        <DeviceSubnetLabelSetting />
      </DeviceContext.Provider>
    )
  )
  return container
}

beforeEach(() => {
  setLabel.mockClear()
  info.value = { subnetName: 'kitchenpi-acme.on.remote.it', actsFor: null, agent: null }
})

describe('DeviceSubnetLabelSetting', () => {
  it('shows the full name and edits its name part, checked as typed', async () => {
    const container = await render()
    expect(container.textContent).toBe('kitchenpi-acme.on.remote.it')
    expect(field.props.value).toBe('kitchenpi')
    expect(field.props.disabled).toBe(false)
    expect(field.props.validate('garage2')).toBeUndefined()
    expect(field.props.validate('Garage')).toBeUndefined() // graphql lower-cases it
    for (const bad of ['garage-pi', 'garage pi', 'x'.repeat(30), ''])
      expect(field.props.validate(bad)).toMatch('no dashes')
    expect(field.props.helper('Garage')).toBe('garage-acme.on.remote.it — the old name keeps working for 30 days')
  })

  it('saves a changed name through setDeviceSubnetLabel, and nothing when it is the same', async () => {
    await render()
    await act(async () => field.props.onSave('kitchenpi'))
    expect(setLabel).not.toHaveBeenCalled()
    await act(async () => field.props.onSave('Garage'))
    expect(setLabel).toHaveBeenCalledWith('D', 'Garage')
  })

  it('cannot be edited by someone who may not manage the device', async () => {
    await render(['VIEW'])
    expect(field.props.disabled).toBe(true)
  })

  it('nothing where the API serves no DNS names', async () => {
    info.value = { subnetName: null, actsFor: null, agent: null }
    expect((await render()).textContent).toBe('')
  })
})
