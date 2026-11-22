import React, { act } from 'react'
import { createRoot } from 'react-dom/client'
import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('../store', () => ({}))
vi.mock('../services/Controller', () => ({ emit: vi.fn() }))
vi.mock('react-redux', () => ({
  useDispatch: () => ({ devices: {}, ui: {} }),
  useSelector: (select: any) => select({ ui: { destroying: false }, auth: { user: { id: 'me' } } }),
}))
vi.mock('../hooks/useDeviceDisable', () => ({ useDeviceDisable: () => false }))
vi.mock('./RunActionDialog', () => ({ DeviceRunEffects: () => null }))
vi.mock('../buttons/DeleteButton', () => ({ DeleteButton: ({ warning }: any) => <div>{warning}</div> }))
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

import { DeleteDevice } from './DeleteDevice'
;(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true

beforeEach(() => {
  document.body.innerHTML = ''
})

describe('DeleteDevice', () => {
  it('a gateway offers to keep its virtual devices with no gateway, in the same words as disabling it', async () => {
    const container = document.createElement('div')
    document.body.appendChild(container)
    const gateway = {
      id: 'g1',
      name: 'g1',
      state: 'inactive',
      accountId: 'me',
      permissions: ['MANAGE'],
      hosts: 2,
      hostedDevices: [{ name: 'Cam' }, { name: 'NAS' }],
    } as unknown as IDevice
    await act(async () => createRoot(container).render(<DeleteDevice device={gateway} />))
    const text = document.body.textContent
    expect(text).toMatch(/This device is the gateway for 2 virtual devices/)
    expect(text).toMatch(/Keep them, with no gateway/)
    expect(text).toMatch(/Choose another gateway to bring them back/)
    expect(text?.toLowerCase()).not.toMatch(/hosted/)
  })
})
