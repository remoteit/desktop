import React, { act } from 'react'
import { createRoot, Root } from 'react-dom/client'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

const { keepDuplicates, requestDuplicateCopies, served, rule } = vi.hoisted(() => ({
  keepDuplicates: vi.fn(),
  requestDuplicateCopies: vi.fn(),
  served: { current: { keepDuplicate: true, keepDuplicates: true } as any },
  rule: { current: (_: any): boolean => true },
}))
vi.mock('../store', () => ({}))
vi.mock('react-redux', () => ({
  useDispatch: () => ({ devices: { keepDuplicates } }),
  useSelector: (select: any) => select({ ui: { destroying: false } }),
}))
vi.mock('react-router-dom', () => ({ Link: ({ to, children }: any) => <a href={to}>{children}</a> }))
vi.mock('../services/deviceIdentity', () => ({ requestDuplicateCopies }))
vi.mock('../hooks/useDeviceIdentity', () => ({ useDeviceIdentity: () => served.current }))
vi.mock('../hooks/useDeviceDisable', () => ({
  useDecommissionRule: () => rule.current,
  disabledWhen: (date?: Date) => date && 'Nov 9',
}))
vi.mock('./DecommissionDialog', () => ({
  DecommissionDialog: ({ open, devices, onDone }: any) =>
    open ? (
      <div data-decommission={devices.map((d: any) => d.id).join(',')}>
        <button onClick={onDone}>Decommissioned</button>
      </div>
    ) : null,
}))
vi.mock('./Confirm', () => ({
  Confirm: ({ open, title, action, children, onConfirm }: any) =>
    open ? (
      <div data-confirm>
        <h2>{title}</h2>
        {children}
        <button onClick={onConfirm}>{action}</button>
      </div>
    ) : null,
}))
vi.mock('./Notice', () => ({
  Notice: ({ children, button }: any) => (
    <div data-notice>
      {children}
      {button}
    </div>
  ),
}))
vi.mock('./Icon', () => ({ Icon: () => null }))
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

import { DuplicateCopies } from './DuplicateCopies'
;(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true

const original = { id: 'X1', name: 'Pump' }
const copy = (id: string, over: any = {}) => ({
  id,
  name: `Pump (copy${id === 'Y1' ? '' : ' 2'})`,
  permissions: ['VIEW', 'MANAGE'] as IPermission[],
  owner: { id: 'U1', email: 'a@example.com' },
  disabledAt: new Date('2026-11-09T10:00:00Z'),
  duplicateOf: { id: 'X1', name: 'Pump' },
  ...over,
})

let root: Root
let container: HTMLDivElement
const text = () => container.textContent || ''
const button = (label: string) =>
  [...container.querySelectorAll('button')].find(b => b.textContent?.trim() === label) as HTMLButtonElement

async function render(copies = [copy('Y1'), copy('Y2')], variant?: 'row' | 'notice') {
  container = document.createElement('div')
  document.body.appendChild(container)
  root = createRoot(container)
  await act(async () =>
    root.render(<DuplicateCopies original={original} copies={copies} accountId="A1" variant={variant} />)
  )
}

beforeEach(() => {
  document.body.innerHTML = ''
  keepDuplicates.mockReset().mockResolvedValue(undefined)
  requestDuplicateCopies.mockReset()
  served.current = { keepDuplicate: true, keepDuplicates: true }
  rule.current = () => true
})

afterEach(() => act(() => root.unmount()))

describe('DuplicateCopies', () => {
  it('a row under the original: "N copies of X", opening to each copy and when it was split off', async () => {
    await render()
    expect(text()).toContain('2 copies of Pump')
    expect(container.querySelector('[data-duplicate-copies]')).toBeNull()
    await act(async () => button('2 copies of Pump').click())
    const links = [...container.querySelectorAll('[data-duplicate-copies] a')]
    expect(links.map(a => a.getAttribute('href'))).toEqual(['/devices/Y1', '/devices/Y2'])
    expect(text()).toContain('Split off Nov 9')
  })

  it('keeps all as new devices from the original’s setup, once confirmed', async () => {
    await render()
    await act(async () => button('Keep all').click())
    expect(container.querySelector('[data-confirm]')!.textContent).toContain(
      'Each becomes a device of its own: enabled, starting from the setup of Pump'
    )
    await act(async () => button('Keep All').click())
    expect(keepDuplicates).toHaveBeenCalledWith({ ids: ['Y1', 'Y2'] })
  })

  it("shows graphql's refusal", async () => {
    keepDuplicates.mockResolvedValue('Licence limit reached')
    await render()
    await act(async () => button('Keep all').click())
    await act(async () => button('Keep All').click())
    expect(container.querySelector('[data-refusal]')!.textContent).toBe('Licence limit reached')
  })

  it('removes all by decommissioning them, then reads the copies again', async () => {
    await render()
    await act(async () => button('Remove all…').click())
    expect(container.querySelector('[data-decommission]')!.getAttribute('data-decommission')).toBe('Y1,Y2')
    await act(async () => button('Decommissioned').click())
    expect(requestDuplicateCopies).toHaveBeenCalledWith('A1', true)
  })

  it('offers each bulk action only where it may be taken on every copy', async () => {
    rule.current = (device: any) => device.owner?.id === 'U1'
    await render([copy('Y1'), copy('Y2', { owner: { id: 'U2' }, permissions: ['VIEW'] })])
    expect(button('Keep all')).toBeUndefined()
    expect(button('Remove all…')).toBeUndefined()
  })

  it('one copy needs keepDuplicate; several, keepDuplicates', async () => {
    served.current = { keepDuplicate: true, keepDuplicates: false }
    await render()
    expect(button('Keep all')).toBeUndefined()
    await render([copy('Y1')])
    expect(text()).toContain('1 copy of Pump')
    expect(button('Keep all')).toBeTruthy()
  })

  it("on the original's page: a notice, open, saying what the copies are", async () => {
    await render(undefined, 'notice')
    expect(container.querySelector('[data-notice]')).not.toBeNull()
    expect(text()).toContain('Machines that signed in as Pump while it was online')
    expect(container.querySelectorAll('[data-duplicate-copies] a')).toHaveLength(2)
  })

  it('nothing for no copies', async () => {
    await render([])
    expect(text()).toBe('')
  })
})
