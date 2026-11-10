import React, { act } from 'react'
import { createRoot, Root } from 'react-dom/client'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

const { keepDuplicates, makeOriginal, requestDuplicateCopies, push, served, can } = vi.hoisted(() => ({
  keepDuplicates: vi.fn(),
  makeOriginal: vi.fn(),
  requestDuplicateCopies: vi.fn(),
  push: vi.fn(),
  served: { current: { keepDuplicate: true, makeOriginal: true } as any },
  can: { current: true },
}))
vi.mock('../store', () => ({}))
vi.mock('react-redux', () => ({
  useDispatch: () => ({ devices: { keepDuplicates, makeOriginal } }),
  useSelector: (select: any) => select({ ui: { destroying: false } }),
}))
vi.mock('react-router-dom', () => ({
  Link: ({ to, children }: any) => <a href={to}>{children}</a>,
  useHistory: () => ({ push }),
}))
vi.mock('../services/deviceIdentity', () => ({ requestDuplicateCopies }))
vi.mock('../hooks/useDeviceIdentity', () => ({ useDeviceIdentity: () => served.current }))
vi.mock('../hooks/useDeviceDisable', () => ({
  useCanDecommission: () => can.current,
  disabledWhen: (date?: Date) => date && 'Nov 9, 10:00',
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
vi.mock('react-i18next', () => {
  const fill = (text: string, values?: any) => text.replace(/{{(\w+)}}/g, (_, k) => values?.[k] ?? '')
  return {
    useTranslation: () => ({
      t: (_key: string, a: any, b?: any) => (typeof a === 'string' ? fill(a, b) : fill(a.defaultValue, a)),
    }),
  }
})

import { DuplicateCopyNotice } from './DuplicateCopyNotice'
;(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true

const copy = (over: Partial<IDevice> = {}) =>
  ({
    id: 'Y1',
    name: 'Pump (copy)',
    accountId: 'A1',
    permissions: ['VIEW', 'MANAGE'],
    disabled: true,
    disabledReason: 'duplicate',
    disabledAt: new Date('2026-11-09T10:00:00Z'),
    duplicateOf: { id: 'X1', name: 'Pump' },
    ...over,
  } as IDevice)

let root: Root
let container: HTMLDivElement
const text = () => container.textContent || ''
const button = (label: string) =>
  [...container.querySelectorAll('button')].find(b => b.textContent?.trim() === label) as HTMLButtonElement

async function render(device = copy()) {
  container = document.createElement('div')
  document.body.appendChild(container)
  root = createRoot(container)
  await act(async () => root.render(<DuplicateCopyNotice device={device} />))
}

beforeEach(() => {
  document.body.innerHTML = ''
  keepDuplicates.mockReset().mockResolvedValue(undefined)
  makeOriginal.mockReset().mockResolvedValue(undefined)
  requestDuplicateCopies.mockReset()
  push.mockReset()
  served.current = { keepDuplicate: true, makeOriginal: true }
  can.current = true
})

afterEach(() => act(() => root.unmount()))

describe('DuplicateCopyNotice', () => {
  it('says whose duplicate it is, when it was split off, and that it is disabled until a choice', async () => {
    await render()
    expect(text()).toContain('Duplicate of Pump')
    expect(container.querySelector('a')!.getAttribute('href')).toBe('/devices/X1')
    expect(text()).toContain('This machine signed in as Pump while Pump was online, and was split off Nov 9, 10:00.')
    expect(text()).toContain('It is disabled — no access, no licence')
    expect(button('Keep as new device')).toBeTruthy()
    expect(button('Make it the original')).toBeTruthy()
    expect(button('Remove…')).toBeTruthy()
  })

  it("keeps it as a new device, from the original's setup unless unticked", async () => {
    await render()
    await act(async () => button('Keep as new device').click())
    expect(text()).toContain('Start from the setup of Pump: its services, tags and product')
    const tick = container.querySelector('[data-confirm] input[type="checkbox"]') as HTMLInputElement
    expect(tick.checked).toBe(true)
    await act(async () => button('Keep').click())
    expect(keepDuplicates).toHaveBeenCalledWith({ ids: ['Y1'], fromOriginal: true })

    await act(async () => button('Keep as new device').click())
    await act(async () => (container.querySelector('[data-confirm] input[type="checkbox"]') as HTMLElement).click())
    await act(async () => button('Keep').click())
    expect(keepDuplicates).toHaveBeenLastCalledWith({ ids: ['Y1'], fromOriginal: false })
  })

  it('makes it the original, explaining the swap', async () => {
    await render()
    await act(async () => button('Make it the original').click())
    const confirm = container.querySelector('[data-confirm]')!.textContent
    expect(confirm).toContain('The two machines swap. This machine becomes Pump')
    expect(confirm).toContain('the machine that is Pump now becomes Pump (copy), disabled until you decide')
    expect(confirm).toContain('at once where both are online, otherwise as each next signs in')
    await act(async () => button('Swap').click())
    expect(makeOriginal).toHaveBeenCalledWith({ id: 'Y1', originalId: 'X1' })
  })

  it("shows graphql's refusal", async () => {
    makeOriginal.mockResolvedValue('Pump is not a Control Link device')
    await render()
    await act(async () => button('Make it the original').click())
    await act(async () => button('Swap').click())
    expect(container.querySelector('[data-refusal]')!.textContent).toBe('Pump is not a Control Link device')
  })

  it('removes it by decommission, then goes to the original', async () => {
    await render()
    await act(async () => button('Remove…').click())
    expect(container.querySelector('[data-decommission]')!.getAttribute('data-decommission')).toBe('Y1')
    await act(async () => button('Decommissioned').click())
    expect(requestDuplicateCopies).toHaveBeenCalledWith('A1', true)
    expect(push).toHaveBeenCalledWith('/devices/X1')
  })

  it('offers only what the API serves and the reader may do', async () => {
    can.current = false
    await render(copy({ permissions: ['VIEW'] }))
    expect(container.querySelectorAll('button')).toHaveLength(0)
    expect(text()).toContain('Duplicate of Pump')

    can.current = true
    served.current = { keepDuplicate: false, makeOriginal: false }
    await render()
    expect([...container.querySelectorAll('button')].map(b => b.textContent)).toEqual(['Remove…'])
  })

  it('an original known only by its id is named by it', async () => {
    await render(copy({ duplicateOf: { id: 'X1' }, disabledAt: undefined }))
    expect(text()).toContain('Duplicate of X1')
    expect(text()).toContain('This machine signed in as X1 while X1 was online, and was split off.')
  })
})
