import React, { act } from 'react'
import { createRoot } from 'react-dom/client'
import { MemoryRouter } from 'react-router-dom'
import { describe, it, expect, vi, beforeEach } from 'vitest'

// The Upgrades page's Minimums tab: every kind listed with its minimum or none, one set or changed with its reason,
// cleared, the API's refusal said as it is — and an API without minimums says so.
const { read, set } = vi.hoisted(() => ({ read: vi.fn(), set: vi.fn() }))
vi.mock('../../services/graphQLDeviceMinimums', async () => ({
  ...(await import('../../services/deviceMinimumKinds')),
  graphQLDeviceMinimums: read,
  graphQLSetDeviceMinimum: set,
}))
vi.mock('../../services/graphQLDaemon', () => ({ UNSUPPORTED: 'UNSUPPORTED' }))
vi.mock('../../components/Notice', () => ({ Notice: ({ children }: any) => <div data-notice>{children}</div> }))
vi.mock('../../components/LoadingMessage', () => ({ LoadingMessage: () => <div>loading</div> }))
vi.mock('../../components/Gutters', () => ({ Gutters: ({ children }: any) => <div>{children}</div> }))
vi.mock('../../components/Container', () => ({
  Container: ({ header, children }: any) => (
    <div>
      {header}
      {children}
    </div>
  ),
}))
vi.mock('../../buttons/IconButton', () => ({
  IconButton: ({ title, onClick }: any) => <button onClick={onClick}>{title}</button>,
}))

import { AdminMinimumsTab } from './AdminMinimumsTab'
;(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true

async function render() {
  const el = document.createElement('div')
  document.body.appendChild(el)
  await act(async () =>
    createRoot(el).render(
      <MemoryRouter>
        <AdminMinimumsTab />
      </MemoryRouter>
    )
  )
  await act(async () => {})
  return el
}

const row = (el: Element, kind: string) => el.querySelector(`[data-minimum="${kind}"]`)!
const click = async (node: Element) => act(async () => (node as HTMLElement).click())
async function type(input: HTMLInputElement, value: string) {
  await act(async () => {
    const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')!.set!
    setter.call(input, value)
    input.dispatchEvent(new Event('input', { bubbles: true }))
  })
}
const button = (scope: Element, text: string) =>
  [...scope.querySelectorAll('button')].find(b => b.textContent === text)!

beforeEach(() => {
  document.body.innerHTML = ''
  read.mockReset()
  set.mockReset()
})

describe('AdminMinimumsTab', () => {
  it('lists every kind, with its minimum and reason where one is set', async () => {
    read.mockResolvedValue([{ kind: 'app-store', minimum: '1.1.0.20261108160000', message: 'Its sign-in was retired' }])
    const el = await render()
    expect(el.querySelectorAll('[data-minimum]').length).toBe(10)
    expect(row(el, 'app-store').textContent).toContain('1.1.0.20261108160000 or newer — Its sign-in was retired')
    expect(row(el, 'image').textContent).toContain('Containers updated by pulling the image')
    expect(row(el, '*').textContent).toContain('Every kind')
  })

  it('sets one: the minimum and its reason sent, the row then showing it', async () => {
    read.mockResolvedValue([])
    set.mockResolvedValue({ set: { kind: 'image', minimum: '2026-11-08', message: 'Old images cannot sign in' } })
    const el = await render()
    await click(row(el, 'image').querySelector('[data-edit="image"]')!)
    await type(row(el, 'image').querySelector('[data-field="minimum"]')!, '2026-11-08')
    await type(row(el, 'image').querySelector('[data-field="message"]')!, 'Old images cannot sign in')
    await click(button(row(el, 'image'), 'Save'))
    expect(set).toHaveBeenCalledWith('image', '2026-11-08', 'Old images cannot sign in')
    expect(row(el, 'image').textContent).toContain('2026-11-08 or newer — Old images cannot sign in')
    expect(row(el, 'image').querySelector('[data-field="minimum"]')).toBeNull()
  })

  it("the API's refusal is said as it is, and the edit stays open", async () => {
    read.mockResolvedValue([])
    set.mockResolvedValue({ error: 'soon names no build: a package or connectd version with its stamp' })
    const el = await render()
    await click(row(el, '*').querySelector('[data-edit="*"]')!)
    await type(row(el, '*').querySelector('[data-field="minimum"]')!, 'soon')
    await click(button(row(el, '*'), 'Save'))
    expect(row(el, '*').querySelector('[data-error]')!.textContent).toContain('names no build')
    expect(row(el, '*').querySelector('[data-field="minimum"]')).not.toBeNull()
  })

  it('clears one: no minimum sent, the row back to its hint', async () => {
    read.mockResolvedValue([{ kind: 'rollout', minimum: '2026-10-01', message: null }])
    set.mockResolvedValue({ set: null })
    const el = await render()
    await click(row(el, 'rollout').querySelector('[data-edit="rollout"]')!)
    await click(button(row(el, 'rollout'), 'Clear'))
    expect(set).toHaveBeenCalledWith('rollout', '', '')
    expect(row(el, 'rollout').textContent).toContain('Package installs and self-updating containers')
  })

  it('an API without minimums says so', async () => {
    read.mockResolvedValue('UNSUPPORTED')
    const el = await render()
    expect(el.querySelector('[data-notice]')!.textContent).toContain('no device minimums')
  })
})
