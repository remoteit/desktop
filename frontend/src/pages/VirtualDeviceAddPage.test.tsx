import React, { act } from 'react'
import { createRoot, Root } from 'react-dom/client'
import { describe, it, expect, vi, afterEach } from 'vitest'

const { limits } = vi.hoisted(() => ({ limits: { value: [] as any[] } }))
vi.mock('../store', () => ({}))
vi.mock('react-redux', () => ({
  useDispatch: () => ({ devices: { fetchIfEmpty: vi.fn() } }),
  useSelector: (select: any) => select({}),
}))
vi.mock('../selectors/organizations', () => ({ selectLimits: () => limits.value }))
vi.mock('react-router-dom', () => ({
  useHistory: () => ({ push: vi.fn(), goBack: vi.fn() }),
  useParams: () => ({}),
  Link: ({ children }: any) => <a>{children}</a>,
}))
vi.mock('../components/VirtualDeviceForm', () => ({ VirtualDeviceForm: () => <form /> }))
vi.mock('../components/HostedDevices', () => ({ takeVirtualDevicePrefill: () => undefined }))
vi.mock('../components/Container', () => ({
  Container: ({ header, children }: any) => (
    <div>
      {header}
      {children}
    </div>
  ),
}))
vi.mock('../components/Gutters', () => ({ Gutters: ({ children }: any) => <div>{children}</div> }))
vi.mock('../components/Title', () => ({ Title: ({ children }: any) => <span>{children}</span> }))
vi.mock('../components/Notice', () => ({
  Notice: ({ children, button }: any) => (
    <div data-notice>
      {children}
      {button}
    </div>
  ),
}))
vi.mock('../components/BillingUI', () => ({ BillingUI: ({ children }: any) => <>{children}</> }))
vi.mock('react-i18next', () => {
  const fill = (text: string, values?: any) => text.replace(/{{(\w+)}}/g, (_, k) => values?.[k] ?? '')
  return {
    useTranslation: () => ({
      t: (_key: string, a: any, b?: any) => (typeof a === 'string' ? fill(a, b) : fill(a.defaultValue, a)),
    }),
  }
})

import { VirtualDeviceAddPage, planRoom } from './VirtualDeviceAddPage'
;(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true

const devices = (actual: any, value: any): ILimit[] => [
  { name: 'iot-devices', value, actual, base: 0, scale: 1, license: null },
]

let root: Root | undefined
let container: HTMLElement
async function render() {
  container = document.createElement('div')
  document.body.appendChild(container)
  root = createRoot(container)
  await act(async () => root!.render(<VirtualDeviceAddPage />))
  return container
}
afterEach(() => {
  if (!root) return
  act(() => root!.unmount())
  container.remove()
  root = undefined
})

describe('a virtual device counts toward the plan', () => {
  it('room: full at or over the limit, near one below it, none with room or no limit', () => {
    expect(planRoom(devices(5, 5))).toEqual({ full: true, limit: 5, count: 5 })
    expect(planRoom(devices(6, 5))).toEqual({ full: true, limit: 5, count: 6 })
    expect(planRoom(devices(4, 5))).toEqual({ full: false, limit: 5, count: 4 })
    expect(planRoom(devices(3, 5))).toBeUndefined()
    expect(planRoom(devices(3, null))).toBeUndefined()
    expect(planRoom([])).toBeUndefined()
  })

  it('said before it is created: at the limit with a way to the plans; near it, which device it will be', async () => {
    limits.value = devices(5, 5)
    let page = await render()
    expect(page.querySelector('[data-device-limit="full"]')?.textContent).toBe(
      'Your plan allows 5 devices and you have 5. A virtual device counts as one, so this one needs a license.See plans'
    )
    act(() => root!.unmount())
    container.remove()
    limits.value = devices(4, 5)
    page = await render()
    expect(page.querySelector('[data-device-limit="near"]')?.textContent).toBe(
      'A virtual device counts toward your plan. This one will be device 5 of 5.'
    )
    act(() => root!.unmount())
    container.remove()
    limits.value = devices(1, 5)
    page = await render()
    expect(page.querySelector('[data-device-limit]')).toBeNull()
    expect(page.querySelector('form')).not.toBeNull()
  })
})
