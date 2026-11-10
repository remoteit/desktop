import React, { act } from 'react'
import { createRoot, Root } from 'react-dom/client'
import { ThemeProvider, createTheme } from '@mui/material/styles'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

const { hook } = vi.hoisted(() => ({ hook: { current: {} as any } }))
vi.mock('../services/post', () => ({ post: vi.fn() }))
vi.mock('../services/graphQL', () => ({ graphQLGetErrors: vi.fn(), graphQLRequestWithReason: vi.fn() }))
vi.mock('../hooks/useProductPolicy', () => ({ useDeviceProduct: () => hook.current }))
vi.mock('../hooks/useLabel', () => ({ useLabel: () => () => undefined }))
vi.mock('./Icon', () => ({ Icon: ({ name }: any) => <i data-icon={name} /> }))
vi.mock('./Notice', () => ({ Notice: ({ severity, children }: any) => <div data-notice={severity}>{children}</div> }))
vi.mock('react-i18next', () => {
  const fill = (text: string, values?: any) => text.replace(/{{(\w+)}}/g, (_, k) => values?.[k] ?? '')
  return { useTranslation: () => ({ t: (_key: string, a: any, b?: any) => fill(a, b) }) }
})

import { DeviceProductNotice, ProductMark, holdingProduct, useProductHold } from './DeviceProductNotice'
import { Tags } from './Tags'
import { lightColors } from '../styling'
;(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true

const theme = createTheme({
  palette: Object.fromEntries(Object.entries(lightColors).map(([name, main]) => [name, { main }])) as any,
})

let root: Root
async function render(node: React.ReactElement) {
  document.body.innerHTML = ''
  const container = document.createElement('div')
  document.body.appendChild(container)
  root = createRoot(container)
  await act(async () => root.render(<ThemeProvider theme={theme}>{node}</ThemeProvider>))
  return container
}
afterEach(() => act(() => root.unmount()))

const device = { id: 'D1', permissions: ['MANAGE'] } as any
const product = (sync: string, networks: any[] = []) => ({ id: 'P1', name: 'Pumps', sync, networks })
const holding = (sync: string, networks: any[] = []) => ({
  state: { product: product(sync, networks), origin: null, tags: ['prod'], services: ['S1'] },
})

const Hold = () => {
  const hold = useProductHold(device)
  return <pre data-hold>{JSON.stringify({ ...hold, product: hold.product?.name ?? null })}</pre>
}
const held = (page: HTMLElement) => JSON.parse(page.querySelector('[data-hold]')!.textContent!)

beforeEach(() => {
  hook.current = { state: null }
})

describe('what a device holds from its product', () => {
  it('under synced or enforced: its tags and services; under template, or with no product, nothing', async () => {
    hook.current = holding('enforced')
    let page = await render(<Hold />)
    expect(held(page)).toEqual({ product: 'Pumps', enforced: true, tags: ['prod'], services: ['S1'] })
    hook.current = holding('synced')
    page = await render(<Hold />)
    expect(held(page)).toMatchObject({ enforced: false, tags: ['prod'] })
    hook.current = holding('template')
    page = await render(<Hold />)
    expect(held(page)).toEqual({ product: null, enforced: false, tags: [], services: [] })
    expect(holdingProduct(null)).toBeUndefined()
  })
})

describe('the notice on a device’s page', () => {
  it('enforced: read-only, managed by the product, its networks named', async () => {
    hook.current = holding('enforced', [{ id: 'N1', name: 'Plant', role: 'BOTH' }])
    const page = await render(<DeviceProductNotice device={device} />)
    expect(page.querySelector('[data-notice]')?.getAttribute('data-notice')).toBe('warning')
    expect(page.textContent).toContain('Managed by product Pumps (enforced)')
    expect(page.textContent).toContain('nothing else is added here')
    expect(page.querySelector('[data-device-product-networks]')?.textContent).toBe(
      'Networks from the product: Plant (Initiator and target)'
    )
  })

  it('synced: from the product, locked, the device free to add its own', async () => {
    hook.current = holding('synced')
    const page = await render(<DeviceProductNotice device={device} />)
    expect(page.querySelector('[data-notice]')?.getAttribute('data-notice')).toBe('info')
    expect(page.textContent).toContain('From product Pumps')
    expect(page.textContent).toContain('It may have its own besides.')
    expect(page.querySelector('[data-device-product-networks]')).toBeNull()
  })

  it('nothing under template, with no product, or where the API has none', async () => {
    hook.current = holding('template')
    let page = await render(<DeviceProductNotice device={device} />)
    expect(page.innerHTML).toBe('')
    hook.current = { state: null }
    page = await render(<DeviceProductNotice device={device} />)
    expect(page.innerHTML).toBe('')
  })

  it('an item’s mark: a lock', async () => {
    const page = await render(<ProductMark product={product('synced') as any} />)
    expect(page.querySelector('[data-product-mark] [data-icon="lock"]')).not.toBeNull()
  })
})

describe('tags its product holds', () => {
  it('shown with a lock, and not deleted here; the device’s own are', async () => {
    const onDelete = vi.fn()
    const tags = [
      { name: 'prod', color: 1, created: new Date() },
      { name: 'mine', color: 2, created: new Date() },
    ]
    const page = await render(
      <Tags tags={tags} locked={{ names: ['prod'], title: 'From product Pumps' }} onDelete={onDelete} />
    )
    const chips = [...page.querySelectorAll('.MuiChip-root')]
    const chip = (name: string) => chips.find(c => c.textContent === name) as HTMLElement
    expect(chip('prod').querySelector('[data-locked]')).not.toBeNull()
    expect(chip('prod').querySelector('.MuiChip-deleteIcon')).toBeNull()
    expect(chip('mine').querySelector('[data-locked]')).toBeNull()
    expect(chip('mine').querySelector('.MuiChip-deleteIcon')).not.toBeNull()
  })
})
