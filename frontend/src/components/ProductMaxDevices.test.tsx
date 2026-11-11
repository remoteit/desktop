import React, { act } from 'react'
import { createRoot, Root } from 'react-dom/client'
import { ThemeProvider, createTheme } from '@mui/material/styles'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

const { read, permissions } = vi.hoisted(() => ({
  read: vi.fn(),
  permissions: { current: ['ADMIN'] as string[] },
}))
vi.mock('../services/post', () => ({ post: vi.fn() }))
vi.mock('../services/graphQL', () => ({
  graphQLBasicRequest: vi.fn(),
  graphQLRequestWithReason: vi.fn(),
  refusalOf: vi.fn(),
}))
vi.mock('../services/productMaxDevices', async original => ({
  ...(await original<typeof import('../services/productMaxDevices')>()),
  graphQLProductMaxDevices: read,
  setProductMaxDevices: vi.fn(),
}))
vi.mock('react-redux', () => ({ useSelector: (select: any) => select({}) }))
vi.mock('../selectors/organizations', () => ({ selectPermissions: () => permissions.current }))
vi.mock('../selectors/accounts', () => ({ selectActiveAccountId: () => 'ACCOUNT' }))
vi.mock('./Icon', () => ({ Icon: () => null }))
vi.mock('react-i18next', () => {
  const fill = (text: string, values?: any) => text.replace(/{{(\w+)}}/g, (_, k) => values?.[k] ?? '')
  return {
    useTranslation: () => ({
      t: (_key: string, a: any, b?: any) => (typeof a === 'string' ? fill(a, b) : fill(a.defaultValue, a)),
    }),
  }
})

import { ProductMaxDevices, ProductMaxDevicesSetting } from './ProductMaxDevices'
import { IDeviceProduct } from '../models/products'
import { lightColors } from '../styling'
;(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true

const theme = createTheme({
  palette: Object.fromEntries(Object.entries(lightColors).map(([name, main]) => [name, { main }])) as any,
})

let root: Root
const body = () => document.body.textContent || ''

async function render(node: React.ReactElement) {
  const container = document.createElement('div')
  document.body.appendChild(container)
  root = createRoot(container)
  await act(async () => root.render(<ThemeProvider theme={theme}>{node}</ThemeProvider>))
}

beforeEach(() => {
  document.body.innerHTML = ''
  permissions.current = ['ADMIN']
  read.mockReset()
})

afterEach(() => act(() => root.unmount()))

const onChange = vi.fn()

describe('ProductMaxDevicesSetting', () => {
  it('none: says so, with how many devices count', async () => {
    await render(
      <ProductMaxDevicesSetting value={{ maxDevices: null, devicesCounted: 4 }} manage onChange={onChange} />
    )
    expect(body()).toContain('Device Limit')
    expect(body()).toContain('No maximum')
    expect(body()).toContain('4 device(s) count against it, disabled ones included')
    expect(body()).not.toContain('over')
  })

  it('lowered below its devices: says how many are over, and that none joins until they are removed', async () => {
    await render(<ProductMaxDevicesSetting value={{ maxDevices: 10, devicesCounted: 12 }} manage onChange={onChange} />)
    expect(body()).toContain('10')
    expect(body()).toContain('2 over: no device joins until 2 are removed.')
  })

  it('without a count (not a manager), only the maximum', async () => {
    await render(
      <ProductMaxDevicesSetting value={{ maxDevices: 5, devicesCounted: null }} manage={false} onChange={onChange} />
    )
    expect(body()).toContain('5')
    expect(body()).not.toContain('count against it')
  })
})

describe('ProductMaxDevices', () => {
  const product = { id: 'p1', name: 'Pump' } as IDeviceProduct

  it("reads the product's on its own, for the active account", async () => {
    read.mockResolvedValue({ maxDevices: 3, devicesCounted: 1 })
    await render(<ProductMaxDevices product={product} />)
    expect(read).toHaveBeenCalledWith('p1', 'ACCOUNT')
    expect(body()).toContain('Maximum devices')
    expect(body()).toContain('1 device(s) count against it')
  })

  it('shows nothing where the API has no maximum, or the read failed', async () => {
    read.mockResolvedValue(undefined)
    await render(<ProductMaxDevices product={product} />)
    expect(body()).toBe('')
    await act(() => root.unmount())
    read.mockResolvedValue('ERROR')
    await render(<ProductMaxDevices product={product} />)
    expect(body()).toBe('')
  })
})
