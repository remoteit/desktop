import React, { act } from 'react'
import { createRoot, Root } from 'react-dom/client'
import { describe, it, expect, vi, afterEach } from 'vitest'

const { hook } = vi.hoisted(() => ({ hook: { current: {} as any } }))
vi.mock('../hooks/useProductPolicy', () => ({ useProductPolicy: () => hook.current }))
vi.mock('./ListItemLocation', () => ({
  ListItemLocation: ({ to, title, iconColor, children }: any) => (
    <a data-to={to} data-color={iconColor}>
      {title}
      {children}
    </a>
  ),
}))
vi.mock('./ColorChip', () => ({ ColorChip: ({ label }: any) => <span data-chip>{label}</span> }))
vi.mock('react-i18next', () => {
  const fill = (text: string, values?: any) => text.replace(/{{(\w+)}}/g, (_, k) => values?.[k] ?? '')
  return {
    useTranslation: () => ({
      t: (_key: string, a: any, b?: any) => (typeof a === 'string' ? fill(a, b) : fill(a.defaultValue, a)),
    }),
  }
})

import { ProductDevices } from './ProductDevices'
import { ProductPolicyLink } from './ProductPolicyLink'
;(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true

let root: Root
async function render(node: React.ReactElement) {
  const container = document.createElement('div')
  root = createRoot(container)
  await act(async () => root.render(node))
  return container
}
afterEach(() => act(() => root.unmount()))

describe('a product’s devices', () => {
  it('each to its own page, online ones coloured', async () => {
    const page = await render(
      <ProductDevices
        devices={[
          { id: 'D1', name: 'pump-1', state: 'active' },
          { id: 'D2', name: 'pump-2', state: 'inactive' },
        ]}
      />
    )
    expect(page.textContent).toContain('Devices (2)')
    const links = [...page.querySelectorAll('a')]
    expect(links.map(a => [a.dataset.to, a.textContent, a.dataset.color])).toEqual([
      ['/devices/D1', 'pump-1', 'primary'],
      ['/devices/D2', 'pump-2', 'grayDark'],
    ])
  })

  it('the newest listed, and how many more there are', async () => {
    const page = await render(<ProductDevices devices={[{ id: 'D1', name: 'pump-1', state: 'active' }]} count={140} />)
    expect(page.textContent).toContain('Devices (140)')
    expect(page.querySelector('[data-product-devices-more]')?.textContent).toBe('and 139 more')
  })

  it('none: said so', async () => {
    const page = await render(<ProductDevices devices={[]} />)
    expect(page.textContent).toBe('Devices (0)No device belongs to this product.')
  })
})

describe('the way to a product’s policy', () => {
  it('with its level, where the API has product policy', async () => {
    hook.current = { served: { product: true }, policy: { sync: 'enforced' } }
    let page = await render(<ProductPolicyLink productId="P1" />)
    expect(page.querySelector('a')?.dataset.to).toBe('/products/P1/policy')
    expect(page.querySelector('[data-chip]')?.textContent).toBe('Enforced')
    act(() => root.unmount())
    hook.current = { served: { product: false }, policy: null }
    page = await render(<ProductPolicyLink productId="P1" />)
    expect(page.innerHTML).toBe('')
  })
})
