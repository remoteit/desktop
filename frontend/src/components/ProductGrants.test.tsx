import React, { act } from 'react'
import { createRoot, Root } from 'react-dom/client'
import { ThemeProvider, createTheme } from '@mui/material/styles'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

const { addNetwork, removeNetwork, proxies, setProxy, networks } = vi.hoisted(() => ({
  addNetwork: vi.fn(),
  removeNetwork: vi.fn(),
  proxies: vi.fn(),
  setProxy: vi.fn(),
  networks: { current: [] as any },
}))
vi.mock('../services/post', () => ({ post: vi.fn() }))
vi.mock('../services/graphQL', () => ({
  graphQLGetErrors: vi.fn(),
  graphQLRequestWithReason: vi.fn(),
  refusalOf: (result: any) => (result === 'ERROR' ? '' : result && 'reason' in result ? result.reason : undefined),
}))
vi.mock('../services/productPolicy', async importOriginal => ({
  ...(await importOriginal<typeof import('../services/productPolicy')>()),
  graphQLAddDeviceProductNetwork: addNetwork,
  graphQLRemoveDeviceProductNetwork: removeNetwork,
  graphQLProductProxies: proxies,
}))
vi.mock('../services/graphQLProxy', () => ({ graphQLSetProxyProduct: setProxy }))
vi.mock('../hooks/useDeviceNetworks', () => ({ useDeviceNetworks: () => ({ networks: networks.current }) }))
vi.mock('./Icon', () => ({ Icon: () => null }))
// Confirmed at once: the question asked is the button's title.
vi.mock('../buttons/ConfirmIconButton', () => ({
  ConfirmIconButton: ({ confirmProps, onClick }: any) => (
    <button data-remove title={confirmProps?.title} onClick={onClick} />
  ),
}))
vi.mock('./ListItemSetting', () => ({
  ListItemSetting: ({ label, subLabel, toggle, disabled, onClick }: any) => (
    <button data-proxy={label} data-on={String(toggle)} disabled={disabled} onClick={onClick}>
      {label} — {subLabel}
    </button>
  ),
}))
vi.mock('./Notice', () => ({ Notice: ({ children }: any) => <div data-notice>{children}</div> }))
vi.mock('react-i18next', () => {
  const fill = (text: string, values?: any) => text.replace(/{{(\w+)}}/g, (_, k) => values?.[k] ?? '')
  return {
    useTranslation: () => ({
      t: (_key: string, a: any, b?: any) => (typeof a === 'string' ? fill(a, b) : fill(a.defaultValue, a)),
    }),
  }
})

import { ProductGrants } from './ProductGrants'
import { NOTHING_SERVED } from '../services/productPolicy'
import { lightColors } from '../styling'
;(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true

const theme = createTheme({
  palette: Object.fromEntries(Object.entries(lightColors).map(([name, main]) => [name, { main }])) as any,
})
const ALL = { ...NOTHING_SERVED, product: true, networks: true, proxies: true }

let root: Root
const onChanged = vi.fn()
async function render(props: Partial<React.ComponentProps<typeof ProductGrants>> = {}) {
  document.body.innerHTML = ''
  const container = document.createElement('div')
  document.body.appendChild(container)
  root = createRoot(container)
  await act(async () =>
    root.render(
      <ThemeProvider theme={theme}>
        <ProductGrants
          productId="P1"
          accountId="A1"
          name="Pumps"
          served={ALL}
          networks={[{ id: 'N1', name: 'Plant', role: 'INITIATOR' }]}
          manage
          onChanged={onChanged}
          {...props}
        />
      </ThemeProvider>
    )
  )
  return container
}
const click = async (element: Element | null) => act(async () => (element as HTMLElement).click())

// A MUI select's choice, as a browser's autofill would make it: through its hidden input.
async function choose(page: HTMLElement, selector: string, value: string) {
  const input = page.querySelector(selector) as HTMLInputElement
  await act(async () => {
    Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')!.set!.call(input, value)
    input.dispatchEvent(new Event('change', { bubbles: true }))
  })
}

beforeEach(() => {
  addNetwork.mockReset().mockResolvedValue(true)
  removeNetwork.mockReset().mockResolvedValue(true)
  setProxy.mockReset().mockResolvedValue({ data: {} })
  proxies.mockReset().mockResolvedValue([
    { id: 'x1', name: 'Office', joined: true },
    { id: 'x2', name: 'Lab', joined: false },
  ])
  networks.current = [
    { id: 'N1', name: 'Plant' },
    { id: 'N2', name: 'Lab' },
  ]
  onChanged.mockReset()
})
afterEach(() => act(() => root.unmount()))

describe('what a product grants its devices', () => {
  it('its networks, each with its devices’ role; one taken off after the question', async () => {
    const page = await render()
    const network = page.querySelector('[data-network="N1"]') as HTMLElement
    expect(network.textContent).toBe('PlantInitiator')
    expect(network.querySelector('[data-remove]')?.getAttribute('title')).toBe('Take Pumps off Plant?')
    await click(network.querySelector('[data-remove]'))
    expect(removeNetwork).toHaveBeenCalledWith('P1', 'N1')
    expect(onChanged).toHaveBeenCalled()
  })

  it('another of the account’s networks added, with the role chosen', async () => {
    const page = await render()
    await choose(page, '[data-add-network]', 'N2')
    await choose(page, '[data-add-role]', 'BOTH')
    await click(page.querySelector('[data-add-network-button]'))
    expect(addNetwork).toHaveBeenCalledWith('P1', 'N2', 'BOTH')
  })

  it('the account’s proxies, each joined or not: switched, the product joins or leaves it', async () => {
    const page = await render()
    expect(proxies).toHaveBeenCalledWith('P1', 'A1')
    expect(page.querySelector('[data-proxy="Office"]')?.getAttribute('data-on')).toBe('true')
    await click(page.querySelector('[data-proxy="Lab"]'))
    expect(setProxy).toHaveBeenCalledWith('x2', 'P1', true)
    expect(proxies).toHaveBeenCalledTimes(2)
  })

  it('a refusal in graphql’s words, the product read again either way', async () => {
    removeNetwork.mockResolvedValue({ reason: 'You do not manage Plant' })
    setProxy.mockResolvedValue({ reason: 'Lab is not yours' })
    const page = await render()
    await click(page.querySelector('[data-remove]'))
    expect(page.querySelector('[data-notice]')?.textContent).toBe('You do not manage Plant')
    await click(page.querySelector('[data-proxy="Lab"]'))
    expect(page.querySelector('[data-notice]')?.textContent).toBe('Lab is not yours')
    expect(onChanged).toHaveBeenCalledTimes(2)
  })

  it('the registration warning for a product with grants and reusable codes', async () => {
    const page = await render({ registrationWarning: 'Its network Plant is given to anyone holding a reusable code' })
    expect(page.textContent).toContain('Register its devices with join keys')
    expect(page.textContent).toContain('Its network Plant is given to anyone holding a reusable code')
  })

  it('only what the API serves; nothing to change for one who does not manage the product', async () => {
    let page = await render({ served: { ...ALL, networks: false, proxies: false } })
    expect(page.querySelector('[data-product-networks]')).toBeNull()
    expect(page.querySelector('[data-product-proxies]')).toBeNull()
    // The exit a device goes out through is never a product's.
    expect(page.querySelector('[data-product-exit]')).toBeNull()
    page = await render({ manage: false })
    expect(page.querySelector('[data-remove]')).toBeNull()
    expect(page.querySelector('[data-add-network-button]')).toBeNull()
    expect((page.querySelector('[data-proxy="Lab"]') as HTMLButtonElement).disabled).toBe(true)
  })
})
