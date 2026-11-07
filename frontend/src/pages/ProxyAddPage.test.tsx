import React, { act } from 'react'
import { createRoot } from 'react-dom/client'
import { describe, it, expect, vi, beforeEach } from 'vitest'

const { createProxy, addDevice, reload, push, picker } = vi.hoisted(() => ({
  createProxy: vi.fn(async (_set: any) => ({} as any)),
  addDevice: vi.fn(async (_proxy: string, _deviceId: string) => ({ runs: { proxy: null, exit: null } } as any)),
  reload: vi.fn(),
  push: vi.fn(),
  picker: { chosen: [] as string[] },
}))
vi.mock('react-redux', () => ({ useSelector: (select: any) => select({}) }))
vi.mock('../selectors/accounts', () => ({ selectActiveAccountId: () => 'ACCOUNT' }))
vi.mock('react-router-dom', () => ({ useHistory: () => ({ push }) }))
vi.mock('../services/graphQLProxy', () => ({ graphQLCreateProxy: createProxy }))
vi.mock('../services/graphQLDeviceRuns', () => ({ graphQLAddProxyDevice: addDevice }))
// What subnetNames calls through: the label rule is its own.
vi.mock('../services/post', () => ({ post: vi.fn() }))
vi.mock('../services/graphQL', () => ({ graphQLBasicRequest: vi.fn(), graphQLGetErrors: vi.fn() }))
vi.mock('../services/deviceSessionInfo', () => ({
  refreshDeviceSessionInfo: vi.fn(),
  requestDeviceSessionInfo: vi.fn(),
}))
vi.mock('../services/graphQLDaemon', () => ({ UNSUPPORTED: 'UNSUPPORTED', withoutDeviceSessions: () => false }))
vi.mock('../hooks/useAccountExits', () => ({ useAccountProxies: () => ({ value: undefined, reload }) }))
// The picker is its own (RunDevicePicker.tsx): here, what it was given, the devices chosen added, and Not now. addEach
// is its.
vi.mock('../selectors/devices', () => ({ getAllDevices: () => [] }))
vi.mock('../components/RunDevicePicker', async importOriginal => ({
  ...(await importOriginal<typeof import('../components/RunDevicePicker')>()),
  RunDevicePicker: ({ kind, ownerId, exclude, busy, refusals, onAdd, onSkip }: any) => (
    <div
      data-picker={kind}
      data-owner={ownerId}
      data-exclude={exclude.join('|')}
      data-refusals={JSON.stringify(refusals)}
    >
      <button data-add disabled={busy} onClick={() => onAdd(picker.chosen)} />
      <button data-skip disabled={busy} onClick={onSkip} />
    </div>
  ),
}))
vi.mock('../components/Container', () => ({
  Container: ({ header, children }: any) => (
    <div>
      <div data-header>{header}</div>
      {children}
    </div>
  ),
}))
vi.mock('../components/Title', () => ({ Title: ({ children }: any) => <>{children}</> }))
vi.mock('../components/Gutters', () => ({ Gutters: ({ children }: any) => <>{children}</> }))
vi.mock('../components/Notice', () => ({
  Notice: ({ severity, children }: any) => <div data-notice={severity ?? 'info'}>{children}</div>,
}))
// A field: its input, and whether it is in error with what it says.
vi.mock('@mui/material', async () => {
  const actual: any = await vi.importActual('@mui/material')
  return {
    ...actual,
    TextField: ({ label, value, error, helperText, placeholder, inputProps, onChange }: any) => (
      <label data-field={label} data-error={error ? '' : undefined}>
        <input value={value} placeholder={placeholder} maxLength={inputProps?.maxLength} onChange={onChange} />
        <span data-helper>{helperText}</span>
      </label>
    ),
  }
})
vi.mock('react-i18next', () => {
  const fill = (text: string, values?: any) => text.replace(/{{(\w+)}}/g, (_, k) => values?.[k] ?? '')
  return {
    useTranslation: () => ({
      t: (_key: string, a: any, b?: any) =>
        typeof a === 'string' ? fill(a, b) : fill(a.count === 1 ? a.defaultValue_one : a.defaultValue_other, a),
    }),
  }
})

import { ProxyAddPage } from './ProxyAddPage'
;(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true

const NAME = 'Name'
const LABEL = 'Host label, before your account slug'
const DOMAIN = 'Your own domain for its https names (optional)'

const MADE = {
  id: 'P1',
  name: 'Gateway',
  host: 'gw-acme.dev.r3proxy.com',
  domain: null,
  remoteit: false,
  publicEndpoints: true,
  location: null,
  provider: '',
  activation: 'auto',
  manage: true,
  owner: { id: 'ACCOUNT', email: 'pat@example.com' },
  devices: [],
  endpoints: 0,
  certificate: 'pending',
}

async function render() {
  document.body.innerHTML = ''
  const container = document.createElement('div')
  document.body.appendChild(container)
  await act(async () => createRoot(container).render(<ProxyAddPage />))
  return container
}
const $ = (selector: string) => document.body.querySelector(selector) as HTMLElement | null
const field = (label: string) =>
  [...document.body.querySelectorAll('[data-field]')].find(each => each.getAttribute('data-field') === label) as
    | HTMLElement
    | undefined
const input = (label: string) => field(label)!.querySelector('input') as HTMLInputElement
const make = () => [...document.body.querySelectorAll('button')].find(b => b.textContent === 'Make the proxy')!
async function type(label: string, text: string) {
  const element = input(label)
  await act(async () => {
    Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')!.set!.call(element, text)
    element.dispatchEvent(new Event('input', { bubbles: true }))
  })
}
const click = (element: Element | null) => act(async () => (element as HTMLElement).click())
// An answer held back until the test lets it go.
function held<T>() {
  let release!: (value: T) => void
  const promise = new Promise<T>(resolve => (release = resolve))
  return { promise, release }
}

beforeEach(() => {
  createProxy.mockReset().mockResolvedValue(MADE)
  addDevice.mockReset().mockResolvedValue({ runs: { proxy: null, exit: null } })
  reload.mockReset()
  push.mockReset()
  picker.chosen = []
})

describe('a new proxy', () => {
  it('is made once it has a name; its label lower case letters and digits as typed, one too long said and refused', async () => {
    await render()
    expect($('[data-header]')?.textContent).toBe('New proxy')
    expect(make().disabled).toBe(true)
    await type(NAME, '   ')
    expect(make().disabled).toBe(true)
    await type(NAME, 'Gateway')
    expect(make().disabled).toBe(false)
    expect(input(NAME).maxLength).toBe(255)

    expect(input(LABEL).placeholder).toBe('none: made from its name')
    expect(input(LABEL).maxLength).toBe(29)
    await type(LABEL, 'Gw-1_X')
    expect(input(LABEL).value).toBe('gw1x')
    expect(field(LABEL)!.hasAttribute('data-error')).toBe(false)
    expect(make().disabled).toBe(false)
    await type(LABEL, 'x'.repeat(30))
    expect(field(LABEL)!.hasAttribute('data-error')).toBe(true)
    expect(field(LABEL)!.querySelector('[data-helper]')?.textContent).toBe('Lower case letters and digits, at most 29')
    expect(make().disabled).toBe(true)
    await type(LABEL, '')
    expect(field(LABEL)!.hasAttribute('data-error')).toBe(false)
    expect(make().disabled).toBe(false)
  })

  it('is made in the active account with its name trimmed, its label, its own domain and public endpoints as chosen', async () => {
    await render()
    await type(NAME, ' Gateway ')
    await type(LABEL, 'gw')
    await type(DOMAIN, ' proxy.example.com ')
    const publicEndpoints = $('input[type=checkbox]') as HTMLInputElement
    expect(publicEndpoints.checked).toBe(true)
    await click(publicEndpoints)
    expect(publicEndpoints.checked).toBe(false)
    await click(make())
    expect(createProxy).toHaveBeenCalledWith({
      name: 'Gateway',
      label: 'gw',
      domain: 'proxy.example.com',
      publicEndpoints: false,
      accountId: 'ACCOUNT',
    })
  })

  it('with no label or domain given, graphql makes its label from its name, and it takes public endpoints', async () => {
    await render()
    await type(NAME, 'Gateway')
    await type(DOMAIN, '  ')
    await click(make())
    expect(createProxy).toHaveBeenCalledWith({
      name: 'Gateway',
      label: undefined,
      domain: undefined,
      publicEndpoints: true,
      accountId: 'ACCOUNT',
    })
  })

  it('made: says where it is reached, the list beside it read again, and the devices that run it chosen of its account', async () => {
    await render()
    await type(NAME, 'Gateway')
    await click(make())
    expect($('[data-header]')?.textContent).toBe('Gateway')
    expect(document.body.textContent).toContain(
      'Made: it is reached under gw-acme.dev.r3proxy.com. Now choose the devices that run it: each goes into service once its checks pass.'
    )
    expect(field(NAME)).toBeUndefined()
    expect(reload).toHaveBeenCalledTimes(1)
    const shown = $('[data-picker]')!
    expect(shown.getAttribute('data-picker')).toBe('proxy')
    expect(shown.getAttribute('data-owner')).toBe('ACCOUNT')
    expect(shown.getAttribute('data-exclude')).toBe('')
  })

  it('the devices chosen are added one after another, then its page is opened', async () => {
    await render()
    await type(NAME, 'Gateway')
    await click(make())
    picker.chosen = ['D1', 'D2']
    await click($('[data-picker] [data-add]'))
    expect(addDevice.mock.calls).toEqual([
      ['P1', 'D1'],
      ['P1', 'D2'],
    ])
    expect(reload).toHaveBeenCalledTimes(2)
    expect(push).toHaveBeenCalledWith('/proxies/P1')
  })

  it('a device refused is said in the picker by it, the page left to choose again; Not now opens the proxy, kept', async () => {
    addDevice.mockImplementation(async (_proxy: string, id: string) =>
      id === 'D2'
        ? { reason: 'Office Mac is not online to say what it can run' }
        : { runs: { proxy: null, exit: null } }
    )
    await render()
    await type(NAME, 'Gateway')
    await click(make())
    picker.chosen = ['D1', 'D2']
    await click($('[data-picker] [data-add]'))
    expect(addDevice).toHaveBeenCalledTimes(2)
    expect($('[data-picker]')?.getAttribute('data-refusals')).toBe(
      '{"D2":"Office Mac is not online to say what it can run"}'
    )
    expect(reload).toHaveBeenCalledTimes(2)
    expect(push).not.toHaveBeenCalled()
    await click($('[data-picker] [data-skip]'))
    expect(push).toHaveBeenCalledWith('/proxies/P1')
  })

  it('its devices are of the account it was made in, the active one where it says none', async () => {
    createProxy.mockResolvedValue({ ...MADE, owner: { id: 'ORG', email: 'it@example.com' } })
    await render()
    await type(NAME, 'Gateway')
    await click(make())
    expect($('[data-picker]')?.getAttribute('data-owner')).toBe('ORG')
    createProxy.mockResolvedValue({ ...MADE, owner: null })
    await render()
    await type(NAME, 'Gateway')
    await click(make())
    expect($('[data-picker]')?.getAttribute('data-owner')).toBe('ACCOUNT')
  })

  it('a refusal to make it is said in graphql’s words, or that it was not made, and the form stays to change', async () => {
    createProxy.mockResolvedValue({ reason: 'Gw-acme.dev.r3proxy.com is another proxy’s: choose another label' })
    await render()
    await type(NAME, 'Gateway')
    await type(LABEL, 'gw')
    await click(make())
    expect($('[data-notice="error"]')?.textContent).toBe(
      'Gw-acme.dev.r3proxy.com is another proxy’s: choose another label'
    )
    expect(input(LABEL).value).toBe('gw')
    expect($('[data-picker]')).toBeNull()
    expect(reload).not.toHaveBeenCalled()
    expect(make().disabled).toBe(false)

    createProxy.mockResolvedValue({ reason: '' })
    await click(make())
    expect($('[data-notice="error"]')?.textContent).toBe('It was not made: try again.')

    createProxy.mockResolvedValue(MADE)
    await type(LABEL, 'gw2')
    await click(make())
    expect($('[data-notice]')).toBeNull()
    expect($('[data-picker]')).not.toBeNull()
  })

  it('while it is being made, it cannot be made again', async () => {
    const answer = held<any>()
    createProxy.mockReturnValue(answer.promise)
    await render()
    await type(NAME, 'Gateway')
    await click(make())
    expect(make().disabled).toBe(true)
    await act(async () => answer.release({ reason: 'Its account has no slug yet: set one first' }))
    expect(make().disabled).toBe(false)
    expect(createProxy).toHaveBeenCalledTimes(1)
  })
})
