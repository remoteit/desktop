import React, { act } from 'react'
import { createRoot, Root } from 'react-dom/client'
import { describe, it, expect, vi, afterEach } from 'vitest'

vi.mock('../services/post', () => ({ post: vi.fn() }))
vi.mock('../services/graphQL', () => ({ graphQLGetErrors: vi.fn(), graphQLRequestWithReason: vi.fn() }))
vi.mock('./Icon', () => ({ Icon: () => null }))
vi.mock('./Notice', () => ({
  Notice: ({ severity, children }: any) => <div data-notice={severity}>{children}</div>,
}))
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

import { ProductPolicyPreview } from './ProductPolicyPreview'
import { previewOf } from '../services/productPolicy'
;(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true

let root: Root
async function render(node: React.ReactElement) {
  document.body.innerHTML = ''
  const container = document.createElement('div')
  document.body.appendChild(container)
  root = createRoot(container)
  await act(async () => root.render(node))
  return container
}
afterEach(() => act(() => root.unmount()))

const tag = (name: string) => ({ kind: 'tag', name })
const notices = (page: HTMLElement, severity: string) =>
  [...page.querySelectorAll(`[data-notice="${severity}"]`)].map(n => n.textContent)

describe('a preview of a change of product or level', () => {
  it('while it is read, and a refusal in graphql’s words', async () => {
    let page = await render(<ProductPolicyPreview preview={undefined} />)
    expect(page.querySelector('[data-preview="loading"]')?.textContent).toBe('Reading what changes…')
    page = await render(<ProductPolicyPreview preview={{ reason: 'Not yours to attach' }} />)
    expect(notices(page, 'error')).toEqual(['Not yours to attach'])
    page = await render(<ProductPolicyPreview preview={{ reason: '' }} />)
    expect(notices(page, 'error')).toEqual(['What would change could not be read.'])
  })

  it('nothing to change: said so', async () => {
    const page = await render(<ProductPolicyPreview preview={[previewOf({ deviceId: 'D1' })]} single />)
    expect(page.textContent).toBe('Nothing on the device changes.')
  })

  it('one device: each item named in its group, what is removed first', async () => {
    const preview = previewOf({
      deviceId: 'D1',
      added: [tag('prod'), { kind: 'network', name: 'Plant' }],
      locked: [{ kind: 'setting', name: 'subnet' }],
      removed: [tag('mine')],
      unlocked: [{ kind: 'service', name: 'SSH' }],
    })
    const page = await render(<ProductPolicyPreview preview={[preview]} single />)
    const groups = [...page.querySelectorAll('[data-preview-group]')].map(g => g.getAttribute('data-preview-group'))
    expect(groups).toEqual(['removed', 'added', 'locked', 'unlocked'])
    expect(page.querySelector('[data-preview-group="removed"]')?.textContent).toBe('RemovedTag mine')
    expect(page.querySelector('[data-preview-group="added"]')?.textContent).toBe('AddedTag prodNetwork Plant')
    expect(page.querySelector('[data-preview-group="locked"]')?.textContent).toBe('Locked to the productSetting subnet')
    expect(page.querySelector('[data-preview-group="unlocked"]')?.textContent).toBe('Becomes its ownService SSH')
  })

  it('a product’s devices: in brief, losses as warnings, and each device there to open', async () => {
    const previews = [
      previewOf({ deviceId: 'D1', name: 'pump-1', removed: [tag('a'), tag('b')], locked: [tag('prod')] }),
      previewOf({ deviceId: 'D2', name: 'pump-2', removed: [tag('b'), tag('c')], locked: [tag('prod')] }),
      previewOf({ deviceId: 'D3', name: 'pump-3' }),
    ]
    const page = await render(<ProductPolicyPreview preview={previews} />)
    expect(notices(page, 'warning')).toEqual(['2 devices will lose 3 tags'])
    expect([...page.querySelectorAll('[data-preview-line]')].map(l => l.textContent)).toEqual([
      '2 devices will have 1 tag locked to the product',
    ])
    expect(page.textContent).not.toContain('pump-3')
    const toggle = page.querySelector('[data-preview-toggle]') as HTMLButtonElement
    expect(toggle.textContent).toBe('Show each device')
    await act(async () => toggle.click())
    expect(toggle.textContent).toBe('Hide each device')
    expect(page.textContent).toContain('pump-1')
    expect(page.textContent).toContain('pump-2')
  })

  it('the lifecycle warning, once however many devices it is for', async () => {
    const warning =
      'It will be removed at its next reboot or after 10 minutes offline, unless this machine re-registers itself'
    const previews = [
      previewOf({ deviceId: 'D1', warning, added: [tag('a')] }),
      previewOf({ deviceId: 'D2', warning, added: [tag('a')] }),
    ]
    const page = await render(<ProductPolicyPreview preview={previews} />)
    expect(notices(page, 'warning')).toEqual([warning])
  })
})
