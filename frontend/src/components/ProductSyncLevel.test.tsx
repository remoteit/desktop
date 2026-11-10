import React, { act } from 'react'
import { createRoot, Root } from 'react-dom/client'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

const { preview, setSync } = vi.hoisted(() => ({ preview: vi.fn(), setSync: vi.fn() }))
vi.mock('../services/post', () => ({ post: vi.fn() }))
vi.mock('../services/graphQL', () => ({ graphQLGetErrors: vi.fn(), graphQLRequestWithReason: vi.fn() }))
vi.mock('../services/productPolicy', async importOriginal => ({
  ...(await importOriginal<typeof import('../services/productPolicy')>()),
  graphQLProductSyncPreview: preview,
  graphQLSetDeviceProductSync: setSync,
}))
// The choice: each level a button, its value and whether it is disabled; the level's meaning beneath.
vi.mock('./SelectSetting', () => ({
  SelectSetting: ({ value, values, disabled, helperText, onChange }: any) => (
    <div data-select data-value={value} data-disabled={String(!!disabled)}>
      {values.map((v: any) => (
        <button key={v.key} data-choice={v.key} onClick={() => onChange(v.key)}>
          {v.name}
        </button>
      ))}
      <span data-help>{helperText}</span>
    </div>
  ),
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
  ProductPolicyPreview: ({ preview, summary }: any) => (
    <div data-preview data-summary={summary ?? ''}>
      {preview === undefined ? 'reading' : 'reason' in preview ? preview.reason : preview.length}
    </div>
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

import { ProductSyncLevel } from './ProductSyncLevel'
import { previewOf } from '../services/productPolicy'
;(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true

let root: Root
const onChanged = vi.fn()
async function render(props: Partial<React.ComponentProps<typeof ProductSyncLevel>> = {}) {
  document.body.innerHTML = ''
  const container = document.createElement('div')
  document.body.appendChild(container)
  root = createRoot(container)
  await act(async () =>
    root.render(
      <ProductSyncLevel productId="P1" name="Pumps" sync="template" manage onChanged={onChanged} {...props} />
    )
  )
  return container
}
const click = async (page: HTMLElement, selector: string) =>
  act(async () => (page.querySelector(selector) as HTMLElement).click())
const confirm = (page: HTMLElement) => page.querySelector('[data-confirm]') as HTMLElement | null

// As graphql's productSyncPreview answers: its summary, and each device it changes.
const losing = {
  summary: '1 device will lose 1 extra tag',
  devices: 4,
  previews: [previewOf({ deviceId: 'D1', removed: [{ kind: 'tag', name: 'mine' }] })],
}
const locking = {
  summary: '1 device will have 1 tag locked',
  devices: 4,
  previews: [previewOf({ deviceId: 'D1', locked: [{ kind: 'tag', name: 'prod' }] })],
}

beforeEach(() => {
  preview.mockReset().mockResolvedValue(locking)
  setSync.mockReset().mockResolvedValue(true)
  onChanged.mockReset()
})
afterEach(() => act(() => root.unmount()))

describe('a product’s sync level', () => {
  it('shows its level and what it means', async () => {
    const page = await render({ sync: 'synced' })
    expect(page.querySelector('[data-select]')?.getAttribute('data-value')).toBe('synced')
    expect(page.querySelector('[data-help]')?.textContent).toBe(
      'Its items are locked on its devices and follow its changes; a device may add its own.'
    )
    expect([...page.querySelectorAll('[data-choice]')].map(c => c.textContent)).toEqual([
      'Template',
      'Synced',
      'Enforced',
    ])
  })

  it('a change is previewed, then confirmed: graphql told it was confirmed only where something is removed', async () => {
    const page = await render()
    await click(page, '[data-choice="synced"]')
    expect(preview).toHaveBeenCalledWith('P1', 'synced')
    expect(confirm(page)?.querySelector('h2')?.textContent).toBe('Make Pumps Synced?')
    expect(confirm(page)?.querySelector('[data-action]')?.textContent).toBe('Make Synced')
    expect(confirm(page)?.querySelector('[data-preview]')?.textContent).toBe('1')
    expect(confirm(page)?.querySelector('[data-preview]')?.getAttribute('data-summary')).toBe(
      '1 device will have 1 tag locked'
    )
    await click(page, '[data-action]')
    expect(setSync).toHaveBeenCalledWith('P1', 'synced', false)
    expect(onChanged).toHaveBeenCalled()
    expect(confirm(page)).toBeNull()
  })

  it('raising to enforced, where devices lose their own items: a warning, and confirmed as such', async () => {
    preview.mockResolvedValue(losing)
    const page = await render()
    await click(page, '[data-choice="enforced"]')
    expect(confirm(page)?.getAttribute('data-color')).toBe('warning')
    expect(confirm(page)?.querySelector('[data-action]')?.textContent).toBe('Enforced and Remove')
    expect(confirm(page)?.textContent).toContain('Its devices are exactly the product')
    await click(page, '[data-action]')
    expect(setSync).toHaveBeenCalledWith('P1', 'enforced', true)
  })

  it('cannot be confirmed while the preview is read, or when it could not be', async () => {
    let resolve: (value: any) => void = () => {}
    preview.mockReturnValue(new Promise(r => (resolve = r)))
    const page = await render()
    await click(page, '[data-choice="synced"]')
    expect((confirm(page)?.querySelector('[data-action]') as HTMLButtonElement).disabled).toBe(true)
    expect(confirm(page)?.querySelector('[data-preview]')?.textContent).toBe('reading')
    await act(async () => resolve({ reason: 'Not yours' }))
    expect((confirm(page)?.querySelector('[data-action]') as HTMLButtonElement).disabled).toBe(true)
    expect(confirm(page)?.querySelector('[data-preview]')?.textContent).toBe('Not yours')
  })

  it('cancelled, nothing is changed; the level it has, nothing is asked', async () => {
    const page = await render()
    await click(page, '[data-choice="template"]')
    expect(preview).not.toHaveBeenCalled()
    await click(page, '[data-choice="synced"]')
    await click(page, '[data-deny]')
    expect(setSync).not.toHaveBeenCalled()
    expect(confirm(page)).toBeNull()
  })

  it('a refusal in graphql’s words, or that it was not changed', async () => {
    setSync.mockResolvedValue({ reason: 'Only its managers may change it' })
    const page = await render()
    await click(page, '[data-choice="synced"]')
    await click(page, '[data-action]')
    expect(page.querySelector('[data-notice]')?.textContent).toBe('Only its managers may change it')
    expect(onChanged).not.toHaveBeenCalled()
    setSync.mockResolvedValue('ERROR')
    await click(page, '[data-choice="synced"]')
    await click(page, '[data-action]')
    expect(page.querySelector('[data-notice]')?.textContent).toBe('The sync level was not changed.')
  })

  it('only its managers may change it', async () => {
    const page = await render({ manage: false })
    expect(page.querySelector('[data-select]')?.getAttribute('data-disabled')).toBe('true')
  })
})
