import React, { act } from 'react'
import { createRoot } from 'react-dom/client'
import { describe, it, expect, vi, beforeEach } from 'vitest'

const { createProxy, addDevice, reload, push } = vi.hoisted(() => ({
  createProxy: vi.fn(async (_set: any) => ({} as any)),
  addDevice: vi.fn(async (_proxy: string, _deviceId: string) => ({ runs: { proxy: null, exit: null } } as any)),
  reload: vi.fn(),
  push: vi.fn(),
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
// The picker is its own (RunDevicePicker.tsx): here, what it was given, and a device chosen through onChoose.
vi.mock('../selectors/devices', () => ({ getAllDevices: () => [] }))
vi.mock('../components/RunDevicePicker', () => ({
  RunDevicePicker: ({ kind, target, ownerId, single, onChoose }: any) => (
    <div data-picker={kind} data-owner={ownerId} data-for={target ?? ''} data-single={single ? '' : undefined}>
      <button data-choose="D1" onClick={() => onChoose('D1')} />
      <button data-unchoose onClick={() => onChoose(undefined)} />
    </div>
  ),
}))
vi.mock('../components/LoadingMessage', () => ({ LoadingMessage: () => <div data-loading /> }))
vi.mock('../components/Icon', () => ({ Icon: () => null }))
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
const LABEL = 'Address label'

const MADE = {
  id: 'P1',
  name: 'Gateway',
  host: 'gw-acme.dev.r3proxy.com',
  remoteit: false,
  local: false,
  localNetwork: null,
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
const button = (text: string) => [...document.body.querySelectorAll('button')].find(b => b.textContent === text)!
const make = () => ($('[data-create]') as HTMLButtonElement)
const kind = (value: 'internet' | 'local') => $(`input[type=radio][value="${value}"]`) as HTMLInputElement
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
})

describe('a new proxy server, in one step', () => {
  it('is created once it has a name; its address label, under More options, lower case letters and digits', async () => {
    await render()
    expect($('[data-header]')?.textContent).toContain('Create proxy server')
    expect(make().textContent).toBe('Create proxy server')
    expect(make().disabled).toBe(true)
    await type(NAME, '   ')
    expect(make().disabled).toBe(true)
    await type(NAME, 'Gateway')
    expect(make().disabled).toBe(false)
    expect(input(NAME).maxLength).toBe(255)
    expect(button('More options')).toBeDefined()
    expect(input(LABEL).placeholder).toBe('Made from the name')
    expect(input(LABEL).maxLength).toBe(29)
    await type(LABEL, 'Gw-1_X')
    expect(input(LABEL).value).toBe('gw1x')
    expect(field(LABEL)!.hasAttribute('data-error')).toBe(false)
    await type(LABEL, 'x'.repeat(30))
    expect(field(LABEL)!.hasAttribute('data-error')).toBe(true)
    expect(field(LABEL)!.querySelector('[data-helper]')?.textContent).toBe('Lower case letters and digits, at most 29')
    expect(make().disabled).toBe(true)
    await type(LABEL, '')
    expect(make().disabled).toBe(false)
  })

  it('is Internet unless Local network is chosen, said to be fixed for good', async () => {
    await render()
    expect($('[data-proxy-kind]')?.getAttribute('data-proxy-kind')).toBe('internet')
    expect($('[data-proxy-kind]')?.textContent).toContain('You can’t change this later.')
    await click(kind('local'))
    await type(NAME, 'Office')
    await click(make())
    expect(createProxy).toHaveBeenCalledWith({
      name: 'Office',
      label: undefined,
      publicEndpoints: true,
      local: true,
      accountId: 'ACCOUNT',
    })
  })

  it('is created in the active account, its name trimmed, label and public addresses as chosen', async () => {
    await render()
    await type(NAME, ' Gateway ')
    await type(LABEL, 'gw')
    const publicEndpoints = $('input[type=checkbox]') as HTMLInputElement
    expect(publicEndpoints.checked).toBe(true)
    await click(publicEndpoints)
    await click(make())
    expect(createProxy).toHaveBeenCalledWith({
      name: 'Gateway',
      label: 'gw',
      publicEndpoints: false,
      local: false,
      accountId: 'ACCOUNT',
    })
  })

  it('offers one device of the active account to run it, before it is made', async () => {
    await render()
    expect($('[data-picker]')?.getAttribute('data-picker')).toBe('proxy')
    expect($('[data-picker]')?.getAttribute('data-owner')).toBe('ACCOUNT')
    expect($('[data-picker]')?.getAttribute('data-for')).toBe('')
    expect($('[data-picker]')?.hasAttribute('data-single')).toBe(true)
  })

  it('with a device chosen: created, the device added, the list read again and its page opened', async () => {
    await render()
    await type(NAME, 'Gateway')
    await click($('[data-choose]'))
    await click(make())
    expect(addDevice).toHaveBeenCalledWith('P1', 'D1')
    expect(reload).toHaveBeenCalled()
    expect(push).toHaveBeenCalledWith('/proxies/P1')
  })

  it('with no device chosen: created, and its page opened to add one there', async () => {
    await render()
    await type(NAME, 'Gateway')
    await click(make())
    expect(addDevice).not.toHaveBeenCalled()
    expect(push).toHaveBeenCalledWith('/proxies/P1')
  })

  it('a device refused: said in plain words, the proxy server kept, another to add or the page to open', async () => {
    addDevice.mockResolvedValue({ reason: 'its daemon is not online to say whether it can be a proxy' })
    await render()
    await type(NAME, 'Gateway')
    await click($('[data-choose]'))
    await click(make())
    expect(push).not.toHaveBeenCalled()
    expect($('[data-notice="error"]')?.textContent).toBe(
      'Proxy server created, but that device couldn’t be added. This device is offline. Bring it online to add it.'
    )
    expect($('[data-picker]')?.getAttribute('data-for')).toBe('P1')
    expect(make().textContent).toBe('Add device')
    addDevice.mockResolvedValue({ runs: { proxy: null, exit: null } })
    await click(make())
    expect(createProxy).toHaveBeenCalledTimes(1)
    expect(push).toHaveBeenCalledWith('/proxies/P1')
    push.mockReset()
    await click(button('Open proxy server'))
    expect(push).toHaveBeenCalledWith('/proxies/P1')
  })

  it('a refusal to create it is said in graphql’s words, or that it was not created; the form stays', async () => {
    createProxy.mockResolvedValue({ reason: 'A proxy is named so already' })
    await render()
    await type(NAME, 'Gateway')
    await click(make())
    expect($('[data-notice="error"]')?.textContent).toBe('A proxy is named so already')
    createProxy.mockResolvedValue({ reason: '' })
    await click(make())
    expect($('[data-notice="error"]')?.textContent).toBe('Couldn’t create the proxy server. Try again.')
    expect(input(NAME).value).toBe('Gateway')
    expect(push).not.toHaveBeenCalled()
  })

  it('while it is being created, it cannot be created again', async () => {
    const answer = held<any>()
    createProxy.mockReturnValue(answer.promise)
    await render()
    await type(NAME, 'Gateway')
    await click(make())
    expect(make().disabled).toBe(true)
    await act(async () => answer.release(MADE))
    expect(createProxy).toHaveBeenCalledTimes(1)
  })

  it('Cancel goes back to the proxy servers', async () => {
    await render()
    await click(button('Cancel'))
    expect(push).toHaveBeenCalledWith('/proxies')
  })
})
