import React, { act } from 'react'
import { createRoot, Root } from 'react-dom/client'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

// Each part: what it was given, kept to be looked at, and its name on the page.
const { hook, refreshCredentials, permissions, children, part } = vi.hoisted(() => {
  const children: Record<string, any> = {}
  return {
    hook: { current: {} as any },
    refreshCredentials: vi.fn(),
    permissions: { current: ['ADMIN'] as string[] },
    children,
    part: (name: string) => (props: any) => {
      children[name] = props
      return <div data-part={name}>{props.children}</div>
    },
  }
})
vi.mock('../../store', () => ({ dispatch: { products: { refreshCredentials } } }))
vi.mock('react-redux', () => ({ useSelector: (select: any) => select({}) }))
vi.mock('react-router-dom', () => ({ useParams: () => ({ productId: 'P1' }) }))
vi.mock('../../selectors/products', () => ({
  getProductModel: () => ({ all: [{ id: 'P1', name: 'Pumps', registrationWarning: 'Use join keys' }] }),
}))
vi.mock('../../selectors/accounts', () => ({ selectActiveAccountId: () => 'A1' }))
vi.mock('../../selectors/organizations', () => ({ selectPermissions: () => permissions.current }))
vi.mock('../../hooks/useProductPolicy', () => ({ useProductPolicy: () => hook.current }))
vi.mock('../../components/ProductHeaderMenu', () => ({ ProductHeaderMenu: part('header') }))
vi.mock('../../components/ProductSyncLevel', () => ({ ProductSyncLevel: part('sync') }))
vi.mock('../../components/ProductPolicySettings', () => ({ ProductPolicySettings: part('settings') }))
vi.mock('../../components/ProductGrants', () => ({ ProductGrants: part('grants') }))
vi.mock('../../components/ProductDevices', () => ({ ProductDevices: part('devices') }))
vi.mock('../../components/Gutters', () => ({ Gutters: ({ children }: any) => <>{children}</> }))
vi.mock('../../components/Container', () => ({ Container: ({ children }: any) => <>{children}</> }))
vi.mock('../../components/LoadingMessage', () => ({
  LoadingMessage: ({ message }: any) => <div data-loading>{message}</div>,
}))
vi.mock('react-i18next', () => ({ useTranslation: () => ({ t: (_key: string, text: string) => text }) }))

import { ProductPolicyPage } from './ProductPolicyPage'
;(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true

let root: Root
async function render() {
  const container = document.createElement('div')
  root = createRoot(container)
  await act(async () => root.render(<ProductPolicyPage />))
  return container
}
const parts = (page: HTMLElement) => [...page.querySelectorAll('[data-part]')].map(p => p.getAttribute('data-part'))

const SERVED = { device: true, product: true, settings: true, networks: true, proxies: true, devices: true }
const POLICY = {
  sync: 'synced',
  settings: [{ name: 'subnet', value: true }],
  networks: [{ id: 'N1', name: 'Plant', role: 'TARGET' }],
  devices: [{ id: 'D1', name: 'pump-1', state: 'active' }],
}
const reload = vi.fn()

beforeEach(() => {
  permissions.current = ['ADMIN']
  reload.mockReset().mockResolvedValue(undefined)
  refreshCredentials.mockReset()
  hook.current = { served: SERVED, policy: POLICY, reload }
  Object.keys(children).forEach(key => delete children[key])
})
afterEach(() => act(() => root.unmount()))

describe('a product’s policy page', () => {
  it('its level, settings, grants and devices, each given what the product holds', async () => {
    const page = await render()
    expect(parts(page)).toEqual(['header', 'sync', 'settings', 'grants', 'devices'])
    expect(children.sync).toMatchObject({ productId: 'P1', name: 'Pumps', sync: 'synced', manage: true })
    expect(children.settings.settings).toBe(POLICY.settings)
    expect(children.grants).toMatchObject({
      accountId: 'A1',
      networks: POLICY.networks,
      registrationWarning: 'Use join keys',
    })
    expect(children.devices.devices).toBe(POLICY.devices)
  })

  it('a change reads the product again, its registration warning with it', async () => {
    await render()
    await act(async () => children.grants.onChanged())
    expect(reload).toHaveBeenCalled()
    expect(refreshCredentials).toHaveBeenCalledWith({ productId: 'P1', accountId: 'A1' })
  })

  it('a part the API does not serve is not shown', async () => {
    hook.current = { served: SERVED, policy: { ...POLICY, settings: null, devices: null }, reload }
    const page = await render()
    expect(parts(page)).toEqual(['header', 'sync', 'grants'])
  })

  it('while read, when it could not be, and where the API has no product policy', async () => {
    hook.current = { served: SERVED, policy: undefined, reload }
    let page = await render()
    expect(page.querySelector('[data-loading]')?.textContent).toBe('Loading its policy...')
    act(() => root.unmount())
    hook.current = { served: SERVED, policy: null, reload }
    page = await render()
    expect(page.textContent).toBe('Its policy could not be read.')
    act(() => root.unmount())
    hook.current = { served: { ...SERVED, product: false }, policy: null, reload }
    page = await render()
    expect(page.textContent).toBe('Product policy is not available here.')
  })

  it('only its managers change it', async () => {
    permissions.current = ['VIEW']
    await render()
    expect(children.sync.manage).toBe(false)
    expect(children.grants.manage).toBe(false)
  })
})
