import React, { act } from 'react'
import { createRoot } from 'react-dom/client'
import { describe, it, expect, vi, beforeEach } from 'vitest'

// The admin page's public proxies: each of remote.it's proxies with where its device is owned (one still in a person's
// account offered to move to remote.it), the devices the proxy code registered waiting for a region, and the code shown
// only when asked.
const { devices, code, adopt, setRemoteit, setExit, setEnabled } = vi.hoisted(() => ({
  devices: vi.fn(),
  code: vi.fn(async () => 'PROXY-CODE' as any),
  adopt: vi.fn(async () => ({} as any)),
  setRemoteit: vi.fn(async () => ({} as any)),
  setExit: vi.fn(async () => ({} as any)),
  setEnabled: vi.fn(async () => ({} as any)),
}))
vi.mock('../services/graphQLProxy', () => ({
  graphQLRemoteitProxyDevices: devices,
  graphQLRemoteitProxyCode: code,
  graphQLAdoptRemoteitProxy: adopt,
  graphQLSetRemoteitProxy: setRemoteit,
  graphQLRemoveRemoteitProxy: vi.fn(),
  graphQLSetProxyPublicExit: setExit,
  graphQLSetRemoteitProxyEnabled: setEnabled,
}))
vi.mock('../components/Confirm', () => ({
  Confirm: ({ open, title, children, onConfirm }: any) =>
    open ? (
      <div data-confirm>
        {title} {children}
        <button onClick={onConfirm}>Confirm</button>
      </div>
    ) : null,
}))
vi.mock('../components/CopyCodeBlock', () => ({ CopyCodeBlock: ({ value }: any) => <div data-code>{value}</div> }))
vi.mock('../buttons/ConfirmIconButton', () => ({ ConfirmIconButton: ({ title }: any) => <button>{title}</button> }))
vi.mock('../components/Timestamp', () => ({ Timestamp: () => <span>then</span> }))
vi.mock('../components/Icon', () => ({ Icon: () => null }))
vi.mock('../components/LoadingMessage', () => ({ LoadingMessage: () => <div>loading</div> }))
vi.mock('../components/Gutters', () => ({ Gutters: ({ children }: any) => <div>{children}</div> }))

import { AdminPublicProxies, bareRemoteitNumber, drainHint } from './AdminPublicProxies'
;(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true

const E1 = {
  id: 'E1',
  name: 'edge-1',
  state: 'active',
  lastReported: null,
  system: true,
  owner: null,
  endpoints: 2,
  openSessions: 3,
  proxy: { id: 'E1', host: 'e1.r3proxy.com', region: 'us-west-2', publicExit: false, enabled: true },
}
const E2 = {
  ...E1,
  id: 'E2',
  name: 'edge-2',
  system: false,
  owner: 'staff@remote.it',
  endpoints: 1,
  proxy: { ...E1.proxy, id: 'E2', host: 'e2.r3proxy.com' },
}
const NEW = {
  ...E1,
  id: 'N1',
  name: 'new-box',
  state: 'inactive',
  lastReported: '2026-10-26T10:00:00Z',
  endpoints: 0,
  proxy: null,
}

async function render() {
  const el = document.createElement('div')
  document.body.appendChild(el)
  await act(async () => createRoot(el).render(<AdminPublicProxies onProblem={() => undefined} />))
  return el
}

const button = (el: HTMLElement, text: string) => [...el.querySelectorAll('button')].find(b => b.textContent === text)!
// A row's switch by its label.
const toggle = (row: Element, label: string) =>
  [...row.querySelectorAll('label')]
    .find(l => l.textContent === label)!
    .querySelector('input[type=checkbox]') as HTMLInputElement

describe('AdminPublicProxies', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    devices.mockResolvedValue([E1, E2, NEW])
  })

  it("lists the proxies, offers to move one still in a person's account, and lists what waits for a region", async () => {
    const el = await render()
    expect(el.textContent).toContain('e1.r3proxy.com · us-west-2 · 2 endpoints')
    expect(el.textContent).toContain('e2.r3proxy.com · us-west-2 · 1 endpoint')
    expect(el.textContent).toContain('In staff@remote.it account')
    expect([...el.querySelectorAll('button')].filter(b => b.textContent === 'Move to remote.it')).toHaveLength(1)
    expect(el.textContent).toContain('Registered, waiting for a region')
    expect(el.textContent).toContain('new-box · offline since then')
    expect(el.textContent).toContain('Made a public proxy, it starts disabled: enable it once it is ready.')

    await act(async () => button(el, 'Move to remote.it').click())
    expect(adopt).toHaveBeenCalledWith('E2')
    expect(devices).toHaveBeenCalledTimes(2) // read again after the move
  })

  it('each proxy on one row: its exit switched there, turning it off asked first', async () => {
    devices.mockResolvedValue([{ ...E1, proxy: { ...E1.proxy, publicExit: true } }])
    const el = await render()
    // the proxy's row: its name, region and endpoints with its exit switch, one list item
    const rows = [...el.querySelectorAll('li')].filter(li => li.textContent?.includes('e1.r3proxy.com'))
    expect(rows).toHaveLength(1)
    expect(rows[0].textContent).toContain('e1.r3proxy.com · us-west-2 · 2 endpoints')
    expect(rows[0].textContent).toContain('Public exit')
    const exit = toggle(rows[0], 'Public exit')
    expect(exit.checked).toBe(true)
    await act(async () => exit.click())
    expect(setExit).not.toHaveBeenCalled()
    expect(el.querySelector('[data-confirm]')?.textContent).toContain('Stop e1.r3proxy.com being a public exit?')
    await act(async () => button(el, 'Confirm').click())
    expect(setExit).toHaveBeenCalledWith('E1', false)
  })

  it('shows the sessions open through each; disabling is asked first and says what keeps running', async () => {
    const el = await render()
    const row = [...el.querySelectorAll('li')].find(li => li.textContent?.includes('e1.r3proxy.com'))!
    expect(row.textContent).toContain('e1.r3proxy.com · us-west-2 · 2 endpoints · 3 open')
    expect(row.textContent).not.toContain('disabled')
    const enabled = toggle(row, 'Enabled')
    expect(enabled.checked).toBe(true)
    await act(async () => enabled.click())
    expect(setEnabled).not.toHaveBeenCalled()
    const confirm = el.querySelector('[data-confirm]')!.textContent
    expect(confirm).toContain('Disable e1.r3proxy.com?')
    expect(confirm).toContain('3 open connections keep running until they close; it takes no new ones.')
    await act(async () => button(el, 'Confirm').click())
    expect(setEnabled).toHaveBeenCalledWith('E1', false)
    expect(devices).toHaveBeenCalledTimes(2)
  })

  it('a disabled proxy: greyed and said so, its exit not switchable, enabled again without asking', async () => {
    devices.mockResolvedValue([{ ...E1, openSessions: 0, proxy: { ...E1.proxy, enabled: false, publicExit: true } }])
    const el = await render()
    const row = [...el.querySelectorAll('li')].find(li => li.textContent?.includes('e1.r3proxy.com'))!
    expect(row.textContent).toContain('e1.r3proxy.com · us-west-2 · 2 endpoints · 0 open · disabled')
    const exit = toggle(row, 'Public exit')
    expect(exit.checked).toBe(true) // the admin's setting, kept for when it is enabled again
    expect(exit.disabled).toBe(true)
    await act(async () => toggle(row, 'Enabled').click())
    expect(el.querySelector('[data-confirm]')).toBeNull()
    expect(setEnabled).toHaveBeenCalledWith('E1', true)
  })

  it('the drain hint counts what is open', () => {
    expect(drainHint(0)).toBe('No connections are open through it now; it takes no new ones.')
    expect(drainHint(1)).toBe('1 open connection keeps running until it closes; it takes no new ones.')
    expect(drainHint(7)).toBe('7 open connections keep running until they close; it takes no new ones.')
  })

  it("makes a waiting device a public proxy only with a region's name", async () => {
    const el = await render()
    const make = button(el, 'Make public proxy')
    expect(make.disabled).toBe(true)
    const input = el.querySelector('input:not([type=checkbox])') as HTMLInputElement
    await act(async () => {
      const set = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')!.set!
      set.call(input, 'eu-west-1')
      input.dispatchEvent(new Event('input', { bubbles: true }))
    })
    expect(make.disabled).toBe(false)
    await act(async () => make.click())
    expect(setRemoteit).toHaveBeenCalledWith('N1', 'eu-west-1')
  })

  it('offers to rename a proxy with a bare e<n> to e<n>-r3, asked first; one named e<n>-r3 already is not offered it', async () => {
    devices.mockResolvedValue([E1, { ...E2, system: true, proxy: { ...E2.proxy, host: 'e2-r3.r3proxy.com' } }])
    const el = await render()
    expect(el.textContent).toContain('e2-r3.r3proxy.com · us-west-2 · 1 endpoint')
    const renames = [...el.querySelectorAll('button')].filter(b => b.textContent?.startsWith('Rename'))
    expect(renames.map(b => b.textContent)).toEqual(['Rename e1-r3'])
    await act(async () => renames[0].click())
    expect(setRemoteit).not.toHaveBeenCalled()
    expect(el.querySelector('[data-confirm]')?.textContent).toContain('Rename e1.r3proxy.com to e1-r3?')
    await act(async () => button(el, 'Confirm').click())
    expect(setRemoteit).toHaveBeenCalledWith('E1', 'us-west-2', 1)
  })

  it('reads the number of a bare e<n> host only', () => {
    expect(bareRemoteitNumber('e1.solo.r3proxy.com')).toBe(1)
    expect(bareRemoteitNumber('e12-r3.solo.r3proxy.com')).toBeUndefined()
    expect(bareRemoteitNumber('geo.solo.r3proxy.com')).toBeUndefined()
  })

  it('shows the registration code only when asked', async () => {
    const el = await render()
    expect(code).not.toHaveBeenCalled()
    expect(el.querySelector('[data-code]')).toBeNull()
    await act(async () => button(el, 'Show the registration code').click())
    expect(code).toHaveBeenCalledTimes(1)
    expect(el.querySelector('[data-code]')?.textContent).toBe('PROXY-CODE')
  })

  it('with none yet, says how to add one', async () => {
    devices.mockResolvedValue([])
    const el = await render()
    expect(el.textContent).toContain('None yet: install a device with the registration code below.')
    expect(el.textContent).not.toContain('waiting for a region')
  })
})
