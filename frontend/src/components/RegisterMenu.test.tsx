import React, { act } from 'react'
import { createRoot, Root } from 'react-dom/client'
import { MemoryRouter } from 'react-router-dom'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

const { devices } = vi.hoisted(() => ({ devices: { initialized: true, total: 0 } }))

vi.mock('react-redux', () => ({
  useSelector: (select: (state: any) => any) => select({ ui: { layout: { hideSidebar: false } } }),
  useDispatch: () => ({ ui: { pop: vi.fn(), popAll: vi.fn() } }),
}))
vi.mock('../selectors/devices', () => ({ selectDeviceModelAttributes: () => devices }))
vi.mock('../selectors/organizations', () => ({ selectCanRegister: () => true }))
vi.mock('./GuideBubble', () => ({
  GuideBubble: ({ hide, width, placement, children }: any) => (
    <div data-tip={hide ? 'hidden' : 'shown'} data-width={width} data-placement={placement}>
      {children}
    </div>
  ),
}))
vi.mock('../buttons/IconButton', () => ({ IconButton: () => <button /> }))
vi.mock('react-i18next', () => ({ useTranslation: () => ({ t: (_: string, text: string) => text }) }))

import { RegisterMenu, showsAddDeviceTip } from './RegisterMenu'

Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true })

describe('the "Add a device" tip', () => {
  let container: HTMLDivElement
  let root: Root

  beforeEach(() => {
    container = document.createElement('div')
    document.body.appendChild(container)
    root = createRoot(container)
    Object.assign(devices, { initialized: true, total: 0 })
  })

  afterEach(() => {
    act(() => root.unmount())
    container.remove()
  })

  const render = (path = '/devices') =>
    act(() =>
      root.render(
        <MemoryRouter initialEntries={[path]}>
          <RegisterMenu buttonSize={38} sidebar />
        </MemoryRouter>
      )
    )
  const tip = () => container.querySelector('[data-tip]')!

  it('shows only for an account known to have no devices', () => {
    expect(showsAddDeviceTip({ initialized: true, total: 0 })).toBe(true)
    expect(showsAddDeviceTip({ initialized: true, total: 1 })).toBe(false)
    expect(showsAddDeviceTip({ initialized: false, total: 0 })).toBe(false)
  })

  it('is gone once the account has a device', () => {
    render()
    expect(tip().getAttribute('data-tip')).toBe('shown')
    devices.total = 3
    render()
    expect(tip().getAttribute('data-tip')).toBe('hidden')
  })

  it('stays inside the sidebar, under its button, clear of the page title', () => {
    render()
    expect(tip().getAttribute('data-placement')).toBe('bottom-end')
    expect(Number(tip().getAttribute('data-width'))).toBeLessThanOrEqual(220)
  })

  it('is not shown on the Add page itself', () => {
    render('/add')
    expect(tip().getAttribute('data-tip')).toBe('hidden')
  })
})
