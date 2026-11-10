import React, { act } from 'react'
import { createRoot, Root } from 'react-dom/client'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

const { hook, refresh, fetchSingleFull, dialog } = vi.hoisted(() => ({
  hook: { current: {} as any },
  refresh: vi.fn(),
  fetchSingleFull: vi.fn(),
  dialog: { props: undefined as any },
}))
vi.mock('../store', () => ({ dispatch: { devices: { fetchSingleFull } } }))
vi.mock('react-redux', () => ({ useSelector: (select: any) => select({}) }))
vi.mock('../selectors/accounts', () => ({
  selectActiveAccountId: (_state: any, accountId?: string) => accountId || 'A1',
}))
vi.mock('../hooks/useProductPolicy', () => ({ useDeviceProduct: () => hook.current }))
vi.mock('../hooks/useDeviceSettings', () => ({ refreshDeviceSettings: refresh }))
vi.mock('./ListItemSetting', () => ({
  ListItemSetting: ({ label, subLabel, button, onButtonClick }: any) => (
    <div data-row>
      {label}
      {subLabel ? ` — ${subLabel}` : ''}
      {button && (
        <button data-button onClick={onButtonClick}>
          {button}
        </button>
      )}
    </div>
  ),
}))
vi.mock('./ProductMoveDialog', () => ({
  ProductMoveDialog: (props: any) => {
    dialog.props = props
    return props.open ? <div data-dialog /> : null
  },
}))
vi.mock('react-i18next', () => {
  const fill = (text: string, values?: any) => text.replace(/{{(\w+)}}/g, (_, k) => values?.[k] ?? '')
  return {
    useTranslation: () => ({
      t: (_key: string, a: any, b?: any) => (typeof a === 'string' ? fill(a, b) : fill(a.defaultValue, a)),
    }),
  }
})

import { DeviceProductSetting } from './DeviceProductSetting'
;(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true

let root: Root
async function render(permissions = ['VIEW', 'MANAGE']) {
  const container = document.createElement('div')
  root = createRoot(container)
  const device = { id: 'D1', accountId: 'A2', permissions } as any
  await act(async () => root.render(<DeviceProductSetting device={device} />))
  return container
}
const reload = vi.fn()
const served = { device: true }
const pumps = { id: 'P1', name: 'Pumps', sync: 'synced', networks: [] }

beforeEach(() => {
  reload.mockReset().mockResolvedValue(undefined)
  refresh.mockReset()
  fetchSingleFull.mockReset()
  dialog.props = undefined
  hook.current = {
    served,
    state: { product: pumps, origin: { id: 'P1', name: 'Pumps' }, tags: [], services: [] },
    reload,
  }
})
afterEach(() => act(() => root.unmount()))

describe('a device’s product, on its settings', () => {
  it('its product and level; where it registered with another, that one too', async () => {
    let page = await render()
    expect(page.querySelector('[data-row]')?.textContent).toBe('Product: Pumps · SyncedChange')
    act(() => root.unmount())
    hook.current = {
      served,
      state: { product: pumps, origin: { id: 'P0', name: 'Pumps (staging)' }, tags: [], services: [] },
      reload,
    }
    page = await render()
    expect(page.querySelector('[data-row]')?.textContent).toBe(
      'Product: Pumps · Synced — Registered with Pumps (staging)Change'
    )
  })

  it('none: attached from here', async () => {
    hook.current = { served, state: { product: null, origin: null, tags: [], services: [] }, reload }
    const page = await render()
    expect(page.querySelector('[data-row]')?.textContent).toBe('No productAttach')
    await act(async () => (page.querySelector('[data-button]') as HTMLElement).click())
    expect(page.querySelector('[data-dialog]')).not.toBeNull()
    expect(dialog.props).toMatchObject({ accountId: 'A2', deviceIds: ['D1'], current: null })
  })

  it('once changed, what the product gave it is read again: its product, settings, tags and services', async () => {
    const page = await render()
    await act(async () => (page.querySelector('[data-button]') as HTMLElement).click())
    expect(dialog.props.current).toBe(pumps)
    await act(async () => dialog.props.onDone())
    expect(reload).toHaveBeenCalled()
    expect(refresh).toHaveBeenCalledWith('D1')
    expect(fetchSingleFull).toHaveBeenCalledWith({ id: 'D1', accountId: 'A2', silent: true })
  })

  it('one who does not manage the device sees it, and cannot change it', async () => {
    const page = await render(['VIEW'])
    expect(page.querySelector('[data-button]')).toBeNull()
  })

  it('nothing where the API has no product policy, or while it is read', async () => {
    hook.current = { served: { device: false }, state: null, reload }
    let page = await render()
    expect(page.innerHTML).toBe('')
    act(() => root.unmount())
    hook.current = { served, state: undefined, reload }
    page = await render()
    expect(page.innerHTML).toBe('')
  })
})
