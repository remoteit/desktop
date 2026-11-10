import React, { act } from 'react'
import { createRoot, Root } from 'react-dom/client'
import { ThemeProvider, createTheme } from '@mui/material/styles'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

const { choices, preview, setOne, setMany } = vi.hoisted(() => ({
  choices: vi.fn(),
  preview: vi.fn(),
  setOne: vi.fn(),
  setMany: vi.fn(),
}))
vi.mock('../services/post', () => ({ post: vi.fn() }))
vi.mock('../services/graphQL', () => ({ graphQLGetErrors: vi.fn(), graphQLRequestWithReason: vi.fn() }))
vi.mock('../services/productPolicy', async importOriginal => ({
  ...(await importOriginal<typeof import('../services/productPolicy')>()),
  graphQLProductChoices: choices,
  graphQLDeviceProductPreview: preview,
  graphQLSetDeviceProduct: setOne,
  graphQLSetDevicesProduct: setMany,
}))
vi.mock('./Confirm', () => ({
  Confirm: ({ open, title, action, color, disabled, children, onConfirm, onDeny }: any) =>
    open ? (
      <div data-confirm data-color={color}>
        <h2>{title}</h2>
        {children}
        <button data-deny onClick={onDeny} />
        <button data-action disabled={disabled} onClick={onConfirm}>
          {action}
        </button>
      </div>
    ) : null,
}))
vi.mock('./ProductPolicyPreview', () => ({
  ProductPolicyPreview: ({ preview, single }: any) => (
    <div data-preview data-single={String(!!single)}>
      {preview === undefined ? 'reading' : 'reason' in preview ? preview.reason : preview.length}
    </div>
  ),
}))
vi.mock('./Notice', () => ({ Notice: ({ severity, children }: any) => <div data-notice={severity}>{children}</div> }))
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

import { ProductMoveDialog } from './ProductMoveDialog'
import { previewOf } from '../services/productPolicy'
import { lightColors } from '../styling'
;(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true

const theme = createTheme({
  palette: Object.fromEntries(Object.entries(lightColors).map(([name, main]) => [name, { main }])) as any,
})

let root: Root
const onClose = vi.fn()
const onDone = vi.fn()
async function render(props: Partial<React.ComponentProps<typeof ProductMoveDialog>> = {}) {
  document.body.innerHTML = ''
  const container = document.createElement('div')
  document.body.appendChild(container)
  root = createRoot(container)
  await act(async () =>
    root.render(
      <ThemeProvider theme={theme}>
        <ProductMoveDialog open accountId="A1" deviceIds={['D1']} onClose={onClose} onDone={onDone} {...props} />
      </ThemeProvider>
    )
  )
  return container
}
const dialog = () => document.body.querySelector('[data-confirm]') as HTMLElement
const action = () => dialog().querySelector('[data-action]') as HTMLButtonElement
// A MUI select's choice, as a browser's autofill would make it: through its hidden input.
async function choose(value: string) {
  const input = document.body.querySelector('[data-product-choice]') as HTMLInputElement
  await act(async () => {
    Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')!.set!.call(input, value)
    input.dispatchEvent(new Event('change', { bubbles: true }))
  })
}

const PRODUCTS = [
  { id: 'P1', name: 'Pumps', sync: 'synced' },
  { id: 'P2', name: 'Kiosks', sync: 'enforced' },
  { id: 'P3', name: 'Lab', sync: 'template' },
]
const adds = previewOf({ deviceId: 'D1', added: [{ kind: 'tag', name: 'prod' }] })
const strips = previewOf({ deviceId: 'D1', removed: [{ kind: 'tag', name: 'mine' }] })

beforeEach(() => {
  choices.mockReset().mockResolvedValue(PRODUCTS)
  preview.mockReset().mockResolvedValue(adds)
  setOne.mockReset().mockResolvedValue(true)
  setMany.mockReset().mockResolvedValue(true)
  onClose.mockReset()
  onDone.mockReset()
})
afterEach(() => act(() => root.unmount()))

describe('attaching, changing or detaching a device’s product', () => {
  it('a device with no product: attached after a preview of what it gets', async () => {
    await render()
    expect(choices).toHaveBeenCalledWith('A1')
    expect(dialog().querySelector('h2')?.textContent).toBe('Attach it to a product')
    expect(action().disabled).toBe(true)
    await choose('P1')
    expect(preview).toHaveBeenCalledWith('D1', 'P1')
    expect(dialog().querySelector('[data-preview]')?.getAttribute('data-single')).toBe('true')
    expect(dialog().textContent).toContain('Its items are locked on its devices and follow its changes')
    expect(action().textContent).toBe('Attach')
    await act(async () => action().click())
    expect(setOne).toHaveBeenCalledWith('D1', 'P1', false)
    expect(onDone).toHaveBeenCalled()
    expect(onClose).toHaveBeenCalled()
  })

  it('a move into an enforced product that removes its own items: a warning, and confirmed as such', async () => {
    preview.mockResolvedValue(strips)
    await render({ current: { id: 'P1', name: 'Pumps' } })
    expect(dialog().querySelector('h2')?.textContent).toBe('Change its product from Pumps')
    await choose('P2')
    expect(dialog().getAttribute('data-color')).toBe('warning')
    expect(action().textContent).toBe('Move and Remove')
    await act(async () => action().click())
    expect(setOne).toHaveBeenCalledWith('D1', 'P2', true)
  })

  it('its own product is not offered; detaching is, keeping everything as its own', async () => {
    await render({ current: { id: 'P1', name: 'Pumps' } })
    expect(document.body.querySelector('[data-product-choice]')).not.toBeNull()
    await choose('-')
    expect(preview).toHaveBeenCalledWith('D1', null)
    expect(dialog().textContent).toContain('Everything it has from its product is kept as its own')
    expect(action().textContent).toBe('Detach')
    await act(async () => action().click())
    expect(setOne).toHaveBeenCalledWith('D1', null, false)
  })

  it('a move graphql’s preview says cannot be done: said in its words, and not confirmed', async () => {
    preview.mockResolvedValue({ ...adds, refusal: 'its daemon does not say product-lifecycle: upgrade it first' })
    await render()
    await choose('P1')
    expect(dialog().querySelector('[data-preview]')?.textContent).toBe(
      'its daemon does not say product-lifecycle: upgrade it first'
    )
    expect(action().disabled).toBe(true)
  })

  it('a refusal in graphql’s words, the dialog kept open; a preview refused cannot be confirmed', async () => {
    setOne.mockResolvedValue({
      reason: 'Its daemon cannot move its key between disk and memory: upgrade it to change its lifecycle',
    })
    await render()
    await choose('P3')
    await act(async () => action().click())
    expect(dialog().querySelector('[data-notice="error"]')?.textContent).toBe(
      'Its daemon cannot move its key between disk and memory: upgrade it to change its lifecycle'
    )
    expect(onClose).not.toHaveBeenCalled()
    preview.mockResolvedValue({ reason: 'Not a Control Link device' })
    await choose('P1')
    expect(dialog().querySelector('[data-preview]')?.textContent).toBe('Not a Control Link device')
    expect(action().disabled).toBe(true)
  })
})

describe('moving several devices to a product', () => {
  it('each previewed, then moved together', async () => {
    await render({ deviceIds: ['D1', 'D2'] })
    expect(dialog().querySelector('h2')?.textContent).toBe('Move 2 devices to a product')
    await choose('P1')
    expect(preview.mock.calls).toEqual([
      ['D1', 'P1'],
      ['D2', 'P1'],
    ])
    expect(dialog().querySelector('[data-preview]')?.textContent).toBe('2')
    await act(async () => action().click())
    expect(setMany).toHaveBeenCalledWith(['D1', 'D2'], 'P1', false)
    expect(setOne).not.toHaveBeenCalled()
  })

  it('one device’s refusal among several: named', async () => {
    preview.mockImplementation(async (id: string) =>
      id === 'D2' ? { ...adds, deviceId: 'D2', name: 'pump-2', refusal: 'it is not a Control Link device' } : adds
    )
    await render({ deviceIds: ['D1', 'D2'] })
    await choose('P1')
    expect(dialog().querySelector('[data-preview]')?.textContent).toBe('pump-2: it is not a Control Link device')
  })

  it('more than graphql moves at once: said, and not offered', async () => {
    await render({ deviceIds: Array.from({ length: 351 }, (_, i) => `D${i}`) })
    expect(dialog().querySelector('[data-notice="warning"]')?.textContent).toBe(
      'At most 350 devices are moved at once: select fewer.'
    )
    await choose('P1')
    expect(action().disabled).toBe(true)
  })

  it('too many to preview: moved on graphql’s word, a move into an enforced product warned of and confirmed', async () => {
    const many = Array.from({ length: 60 }, (_, i) => `D${i}`)
    await render({ deviceIds: many })
    await choose('P2')
    expect(preview).not.toHaveBeenCalled()
    expect(dialog().querySelector('[data-notice="warning"]')?.textContent).toContain(
      'Each device becomes exactly the product'
    )
    expect(action().disabled).toBe(false)
    await act(async () => action().click())
    expect(setMany).toHaveBeenCalledWith(many, 'P2', true)
  })
})
