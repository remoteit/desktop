import React, { act } from 'react'
import { createRoot } from 'react-dom/client'
import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('../store', () => ({}))
vi.mock('react-redux', () => ({
  useDispatch: () => ({ devices: {} }),
  useSelector: (select: any) => select({ ui: { destroying: false }, auth: { user: { id: 'me' } } }),
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

import { DisableConfirm } from './DisableDevice'
;(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true

const device = (id: string, over: Partial<IDevice> = {}) =>
  ({ id, name: id, state: 'active', permissions: ['MANAGE'], ...over } as IDevice)

const button = (text: string) =>
  [...document.body.querySelectorAll('button')].find(b => b.textContent?.trim() === text) as HTMLButtonElement

async function render(devices: IDevice[], onConfirm = vi.fn()) {
  const container = document.createElement('div')
  document.body.appendChild(container)
  const root = createRoot(container)
  await act(async () => root.render(<DisableConfirm open devices={devices} onConfirm={onConfirm} onDeny={vi.fn()} />))
  return onConfirm
}

beforeEach(() => {
  document.body.innerHTML = ''
})

describe('DisableConfirm', () => {
  it('a device that hosts nothing: no choice, and keepHosted left to graphql', async () => {
    const onConfirm = await render([device('d1')])
    expect(document.body.querySelector('input[type="radio"]')).toBeNull()
    await act(async () => button('Disable').click())
    expect(onConfirm).toHaveBeenCalledWith(undefined)
  })

  it('a gateway: its virtual devices kept by default, or disabled with it', async () => {
    const gateway = device('g1', { hosts: 2, hostedDevices: [{ name: 'Cam' }, { name: 'NAS' }] as IHostedDevice[] })
    const onConfirm = await render([gateway])
    expect(document.body.textContent).toMatch(/It hosts 2 virtual devices/)
    expect(document.body.textContent).toMatch(/Cam, NAS/)
    await act(async () => button('Disable').click())
    expect(onConfirm).toHaveBeenLastCalledWith(true)

    const disableToo = document.body.querySelector('input[value="disable"]') as HTMLInputElement
    await act(async () => disableToo.click())
    await act(async () => button('Disable').click())
    expect(onConfirm).toHaveBeenLastCalledWith(false)
  })

  it("this machine's own device: says Remote.It stays installed and serves again once restored", async () => {
    await render([device('d1', { thisDevice: true })])
    expect(document.body.textContent).toMatch(/stays installed and registered on this machine/)
  })
})
