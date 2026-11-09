import React, { act } from 'react'
import { createRoot, Root } from 'react-dom/client'
import { ThemeProvider, createTheme } from '@mui/material/styles'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

const { products, permissions } = vi.hoisted(() => ({
  products: { setLifecycle: vi.fn() },
  permissions: { current: ['ADMIN'] as string[] },
}))
vi.mock('../store', () => ({ dispatch: { products } }))
vi.mock('react-redux', () => ({ useSelector: (select: any) => select({}) }))
vi.mock('../selectors/organizations', () => ({ selectPermissions: () => permissions.current }))
vi.mock('./Icon', () => ({ Icon: () => null }))
vi.mock('react-i18next', () => {
  const fill = (text: string, values?: any) => text.replace(/{{(\w+)}}/g, (_, k) => values?.[k] ?? '')
  return {
    useTranslation: () => ({
      t: (_key: string, a: any, b?: any) => (typeof a === 'string' ? fill(a, b) : fill(a.defaultValue, a)),
    }),
  }
})

import { ProductLifecycle } from './ProductLifecycle'
import { IDeviceProduct } from '../models/products'
import { lightColors } from '../styling'
;(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true

const theme = createTheme({
  palette: Object.fromEntries(Object.entries(lightColors).map(([name, main]) => [name, { main }])) as any,
})

const product = (fields: Partial<IDeviceProduct>): IDeviceProduct => ({
  id: 'p1',
  name: 'Pump',
  platform: { id: 769, name: 'Linux' },
  status: 'NEW',
  created: '2026-11-01T10:00:00Z',
  updated: '2026-11-01T10:00:00Z',
  services: [],
  joinKeys: [],
  lifecycle: 'persistent',
  ...fields,
})

let root: Root
const body = () => document.body.textContent || ''
const toggle = () => document.body.querySelector('input[type="checkbox"]') as HTMLInputElement
const dialog = () => document.body.querySelector('[role="dialog"]') as HTMLElement | null
const dialogButton = (label: string) =>
  [...(dialog()?.querySelectorAll('button') ?? [])].find(b => b.textContent?.trim() === label) as HTMLButtonElement

async function render(node: React.ReactElement) {
  const container = document.createElement('div')
  document.body.appendChild(container)
  root = createRoot(container)
  await act(async () => root.render(<ThemeProvider theme={theme}>{node}</ThemeProvider>))
}

beforeEach(() => {
  document.body.innerHTML = ''
  permissions.current = ['ADMIN']
  products.setLifecycle.mockReset().mockResolvedValue({})
})

afterEach(() => act(() => root.unmount()))

describe('ProductLifecycle', () => {
  it('a persistent product: its devices keep their identity on disk, the switch off', async () => {
    await render(<ProductLifecycle product={product({})} />)
    expect(body()).toContain('Device Lifecycle')
    expect(body()).toContain('Ephemeral devices')
    expect(body()).toContain('Off: each device keeps its identity on disk, through restarts and reboots')
    expect(toggle().checked).toBe(false)
  })

  it('an ephemeral product: said plainly — restarts keep it, a reboot is a new device, removed offline', async () => {
    await render(<ProductLifecycle product={product({ lifecycle: 'ephemeral' })} />)
    expect(toggle().checked).toBe(true)
    expect(body()).toContain('a daemon restart keeps it, but after a reboot or on a new machine each is a new device')
    expect(body()).toContain('registers again with a join key')
    expect(body()).toContain('removed when it deregisters, or after 10 minutes offline')
  })

  it('moving to ephemeral says what it means and warns first; confirmed, it is changed', async () => {
    await render(<ProductLifecycle product={product({})} />)
    await act(async () => toggle().click())
    expect(products.setLifecycle).not.toHaveBeenCalled()
    expect(dialog()?.textContent).toContain('Make Pump’s devices ephemeral?')
    expect(dialog()?.textContent).toContain('after a reboot or on a new machine each is a new device')
    expect(dialog()?.textContent).toContain(
      'Its devices are removed at their next reboot, or after 10 minutes offline, unless the machine can register itself again with a join key.'
    )
    await act(async () => dialogButton('Make Ephemeral').click())
    expect(products.setLifecycle).toHaveBeenCalledWith({ productId: 'p1', lifecycle: 'ephemeral' })
  })

  it('moving back to persistent says its devices are kept from now on', async () => {
    await render(<ProductLifecycle product={product({ lifecycle: 'ephemeral' })} />)
    await act(async () => toggle().click())
    expect(dialog()?.textContent).toContain('Make Pump’s devices persistent?')
    expect(dialog()?.textContent).toContain('no longer removed after 10 minutes offline')
    expect(dialog()?.textContent).not.toContain('removed at their next reboot')
    await act(async () => dialogButton('Make Persistent').click())
    expect(products.setLifecycle).toHaveBeenCalledWith({ productId: 'p1', lifecycle: 'persistent' })
  })

  it('nothing is changed when the question is cancelled', async () => {
    await render(<ProductLifecycle product={product({})} />)
    await act(async () => toggle().click())
    await act(async () => dialogButton('Cancel').click())
    expect(products.setLifecycle).not.toHaveBeenCalled()
  })

  it('a refusal is said in graphql’s words; with none, that it was not changed', async () => {
    const refusal = '3 devices of Pump run a daemon that cannot keep its identity in memory: upgrade them first'
    products.setLifecycle.mockResolvedValue({ reason: refusal })
    await render(<ProductLifecycle product={product({})} />)
    await act(async () => toggle().click())
    await act(async () => dialogButton('Make Ephemeral').click())
    expect(body()).toContain(refusal)
    products.setLifecycle.mockResolvedValue({ reason: '' })
    await act(async () => toggle().click())
    await act(async () => dialogButton('Make Ephemeral').click())
    expect(body()).not.toContain(refusal)
    expect(body()).toContain('The lifecycle was not changed.')
  })

  it('only its managers may change it', async () => {
    permissions.current = ['VIEW']
    await render(<ProductLifecycle product={product({})} />)
    expect(toggle().disabled).toBe(true)
  })

  it('nothing before its lifecycle is read', async () => {
    await render(<ProductLifecycle product={product({ lifecycle: undefined })} />)
    expect(body()).toBe('')
  })
})
