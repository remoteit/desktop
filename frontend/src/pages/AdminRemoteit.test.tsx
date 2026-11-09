import React, { act } from 'react'
import { createRoot, Root } from 'react-dom/client'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

// The admin's tabs of remote.it's proxies, exits and machines (pages/AdminProxiesPage.tsx wires them).
const {
  proxies,
  exits,
  machines,
  create,
  product,
  createJoinKey,
  revokeJoinKey,
  setLifecycle,
  answered,
  adopt,
  addProxyDevice,
  addExitDevice,
  setProxyActivation,
  setExitActivation,
  setProxyProduct,
  setExitProduct,
  after,
} = vi.hoisted(() => ({
  proxies: vi.fn(async () => [] as any),
  exits: vi.fn(async () => [] as any),
  machines: vi.fn(async () => [] as any),
  create: vi.fn(async (_kind: string, _at: any) => ({} as any)),
  product: vi.fn(async () => null as any),
  createJoinKey: vi.fn(async (_input: any) => ({} as any)),
  revokeJoinKey: vi.fn(async (_productId: string, _id: string) => ({} as any)),
  setLifecycle: vi.fn(async (_productId: string, _lifecycle: string) => ({} as any)),
  // What the product's join keys or its lifecycle were answered, for the dialog or the setting to say.
  answered: { current: undefined as any },
  adopt: vi.fn(async (_deviceId: string) => ({} as any)),
  addProxyDevice: vi.fn(async (_proxy: string, _deviceId: string) => ({ runs: {} } as any)),
  addExitDevice: vi.fn(async (_exit: string, _deviceId: string) => ({ runs: {} } as any)),
  setProxyActivation: vi.fn(async (_proxy: string, _activation: string) => ({} as any)),
  setExitActivation: vi.fn(async (_exit: string, _activation: string) => ({} as any)),
  setProxyProduct: vi.fn(async (_proxy: string, _productId: string, _joined: boolean) => ({} as any)),
  setExitProduct: vi.fn(async (_exit: string, _productId: string, _joined: boolean) => ({} as any)),
  // What a machine runs after an action on it: the exit alone, in service.
  after: {
    proxy: null,
    exit: { id: 'E1', name: 'e1', state: 'ACTIVE', joining: false, exit: { id: 'X1', name: 'remote.it pdx1a' } },
  },
}))
vi.mock('../services/graphQLRemoteit', () => ({
  graphQLRemoteitProxies: proxies,
  graphQLRemoteitExits: exits,
  graphQLRemoteitMachines: machines,
  graphQLCreateRemoteit: create,
  graphQLRemoteitProxyProduct: product,
  graphQLAdoptRemoteitProxy: adopt,
}))
vi.mock('../services/graphQLDeviceProducts', () => ({
  graphQLCreateDeviceProductJoinKey: createJoinKey,
  graphQLRevokeDeviceProductJoinKey: revokeJoinKey,
  graphQLSetDeviceProductLifecycle: setLifecycle,
}))
// remote.it's proxy product's join keys and lifecycle: what they were given, and their changes' ends.
vi.mock('../components/ProductJoinKeys', () => ({
  ProductJoinKeys: ({ product, manage, onCreate, onRevoke }: any) => (
    <div
      data-join-keys={product.id}
      data-keys={product.joinKeys.map((key: any) => key.name).join(',')}
      data-manage={manage ? '' : undefined}
    >
      <button
        data-create
        onClick={async () => (answered.current = await onCreate({ productId: product.id, name: 'pool' }))}
      />
      <button data-revoke onClick={() => onRevoke('K1')} />
    </div>
  ),
}))
vi.mock('../components/ProductLifecycle', () => ({
  ProductLifecycleSetting: ({ name, lifecycle, manage, onChange }: any) => (
    <div data-lifecycle={lifecycle} data-name={name} data-manage={manage ? '' : undefined}>
      <button data-lifecycle-change onClick={async () => (answered.current = await onChange('persistent'))} />
    </div>
  ),
}))
vi.mock('../services/graphQLDeviceRuns', () => ({
  graphQLAddProxyDevice: addProxyDevice,
  graphQLAddExitDevice: addExitDevice,
}))
vi.mock('../services/graphQLProxy', () => ({
  graphQLSetProxyActivation: setProxyActivation,
  graphQLSetProxyProduct: setProxyProduct,
}))
vi.mock('../services/graphQLExits', () => ({
  graphQLSetExitActivation: setExitActivation,
  graphQLSetExitProduct: setExitProduct,
}))
vi.mock('../components/Confirm', () => ({
  Confirm: ({ open, title, action, disabled, children, onConfirm, onDeny }: any) =>
    open ? (
      <div data-confirm={title}>
        {children}
        <button data-confirm-action disabled={disabled} onClick={onConfirm}>
          {action}
        </button>
        <button data-deny onClick={onDeny} />
      </div>
    ) : null,
}))
vi.mock('../services/graphQL', () => ({
  refusalOf: (result: any) => (result === 'ERROR' ? '' : result && 'reason' in result ? result.reason : undefined),
}))
vi.mock('../services/graphQLDaemon', () => ({ UNSUPPORTED: 'UNSUPPORTED' }))
// A machine in a proxy or an exit: what it was given, and its actions' end.
vi.mock('../components/RunListItem', () => ({
  RunListItem: ({ kind, run, name, title, activation, manage, onChanged, lan, children }: any) => (
    <div
      data-run={run.id}
      data-kind={kind}
      data-name={name}
      data-title={title}
      data-activation={activation}
      data-manage={manage ? '' : undefined}
      data-lan={lan ? '' : undefined}
    >
      <button data-changed onClick={() => onChanged(after, { id: run.id, name: run.name || run.id })} />
      {children}
    </div>
  ),
}))
// The actions on all a machine runs: what they act on, and their end.
vi.mock('../components/RunActions', () => ({
  RunActions: ({ device, scope, disabled, onDone }: any) => (
    <div
      data-run-actions={scope}
      data-device={device.id}
      data-device-name={device.name}
      data-disabled={disabled ? '' : undefined}
    >
      <button data-done onClick={() => onDone({ proxy: null, exit: null })} />
    </div>
  ),
}))
vi.mock('../components/SelectSetting', () => ({
  SelectSetting: ({ label, value, values, onChange }: any) => (
    <div data-select={label} data-value={value}>
      {values.map((each: any) => (
        <button key={each.key} data-option={each.key} onClick={() => onChange(each.key)}>
          {each.name}
        </button>
      ))}
    </div>
  ),
}))
vi.mock('../components/Timestamp', () => ({ Timestamp: () => <span>then</span> }))
vi.mock('../components/Icon', () => ({ Icon: ({ name, color }: any) => <i data-icon={name} data-color={color} /> }))
vi.mock('../components/LoadingMessage', () => ({ LoadingMessage: () => <div data-loading /> }))
vi.mock('../components/Gutters', () => ({ Gutters: ({ children }: any) => <div>{children}</div> }))
vi.mock('../components/Notice', () => ({
  Notice: ({ severity, children, onClose }: any) => (
    <div data-notice={severity ?? 'info'}>
      {children}
      {onClose && <button data-close onClick={onClose} />}
    </div>
  ),
}))
// A choice: each option a button that picks it. A text field: its input, and whether it is in error.
vi.mock('@mui/material', async () => {
  const actual: any = await vi.importActual('@mui/material')
  return {
    ...actual,
    TextField: ({ select, label, value, error, children, onChange }: any) =>
      select ? (
        <div data-choose={label} data-value={value}>
          {React.Children.map(children, (child: any) => (
            <button data-pick={child.props.value} onClick={() => onChange({ target: { value: child.props.value } })}>
              {child.props.children}
            </button>
          ))}
        </div>
      ) : (
        <label data-field={label} data-error={error ? '' : undefined}>
          <input value={value} onChange={onChange} />
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

import { AdminRemoteitExits, AdminRemoteitMachines, AdminRemoteitProxies } from './AdminRemoteit'
;(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true

const ACTIVATION = 'A machine added goes into service'

const run = (id: string, name: string | null, extra: any = {}) => ({
  id,
  name,
  state: 'ACTIVE',
  joining: false,
  activeSince: null,
  drainingSince: null,
  checks: [],
  ...extra,
})
const PDX_PROXY = { id: 'R1', name: 'remote.it pdx1a', host: 'pdx1a-r3.dev.r3proxy.com', remoteit: true }
const PDX_EXIT = { id: 'X1', name: 'remote.it pdx1a', remoteit: true }
// remote.it's proxy product, as a proxy or an exit names it: pdx1a's both take its new devices.
const POOL = { id: 'PP', name: 'remote.it proxies' }
const PROXY = {
  ...PDX_PROXY,
  location: 'pdx1',
  provider: 'AWS us-west-2 (Boardman)',
  activation: 'auto',
  latitude: 45.8,
  longitude: -119.7,
  products: [POOL],
  devices: [run('E1', 'e1'), run('E2', null)],
}
const SEA_PROXY = {
  ...PROXY,
  id: 'R2',
  name: 'remote.it sea1a',
  host: 'sea1a-r3.dev.r3proxy.com',
  location: 'sea1',
  provider: '',
  activation: 'admin',
  products: [],
  devices: [],
}
const EXIT = {
  ...PDX_EXIT,
  location: 'pdx1',
  provider: 'AWS us-west-2 (Boardman)',
  activation: 'auto',
  offered: true,
  dormant: false,
  lan: false,
  users: 3,
  latitude: 45.8,
  longitude: -119.7,
  products: [POOL],
  devices: [run('E1', 'e1')],
}
const SEA_EXIT = {
  ...EXIT,
  id: 'X2',
  name: 'remote.it sea1a',
  location: 'sea1',
  provider: '',
  offered: false,
  users: 1,
  products: [],
  devices: [],
}
const machine = (id: string, name: string | null, extra: any = {}) => ({
  id,
  name,
  state: 'active',
  lastReported: null,
  system: true,
  owner: null,
  proxy: null,
  exit: null,
  ...extra,
})
// remote.it's proxy product: ephemeral, with one join key.
const PRODUCT = {
  id: 'PP',
  name: 'remote.it proxies',
  lifecycle: 'ephemeral',
  joinKeys: [{ id: 'K1', name: 'pdx1a', created: '2026-11-09T10:00:00Z', joins: 2, joinRate: 10, inForce: true }],
}
// Runs remote.it pdx1a, the proxy and the exit.
const E1 = machine('E1', 'e1', {
  proxy: { ...run('E1', 'e1'), proxy: PDX_PROXY },
  exit: { ...run('E1', 'e1', { state: 'DRAINING' }), exit: PDX_EXIT },
})
// Registered with the code, offline, running nothing.
const SPARE = machine('M3', 'spare', { state: 'inactive', lastReported: '2026-11-06T10:00:00Z' })
// Runs an exit alone.
const EXITER = machine('M4', 'exit-box', { state: 'connected', exit: { ...run('M4', 'exit-box'), exit: PDX_EXIT } })

// One page at a time: the one before unmounted, so its half-minute reads stop with it.
let root: Root | undefined
async function unmount() {
  if (root) await act(async () => root!.unmount())
  root = undefined
}
async function render(element: React.ReactElement) {
  await unmount()
  document.body.innerHTML = ''
  const container = document.createElement('div')
  document.body.appendChild(container)
  root = createRoot(container)
  await act(async () => root!.render(element))
  return container
}
const $ = (selector: string, within: ParentNode = document.body) => within.querySelector(selector) as HTMLElement | null
const button = (text: string, within: ParentNode = document.body) =>
  [...within.querySelectorAll('button')].find(b => b.textContent === text) as HTMLButtonElement | undefined
const field = (label: string, within: ParentNode = document.body) =>
  [...within.querySelectorAll('[data-field]')].find(each => each.getAttribute('data-field') === label) as
    | HTMLElement
    | undefined
async function type(label: string, text: string, within: ParentNode = document.body) {
  const input = field(label, within)!.querySelector('input') as HTMLInputElement
  await act(async () => {
    Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')!.set!.call(input, text)
    input.dispatchEvent(new Event('input', { bubbles: true }))
  })
}
const value = (label: string) => (field(label)!.querySelector('input') as HTMLInputElement).value
const click = (element: Element | null | undefined) => act(async () => (element as HTMLElement).click())
const subheader = (list: Element) => list.querySelector('.MuiListSubheader-root')?.textContent
// An answer held back until the test lets it go.
function held<T>() {
  let release!: (value: T) => void
  const promise = new Promise<T>(resolve => (release = resolve))
  return { promise, release }
}

beforeEach(() => {
  vi.clearAllMocks()
  proxies.mockResolvedValue([PROXY, SEA_PROXY])
  exits.mockResolvedValue([EXIT, SEA_EXIT])
  machines.mockResolvedValue([E1, SPARE, EXITER])
  create.mockResolvedValue({})
  product.mockResolvedValue(PRODUCT)
  createJoinKey.mockResolvedValue({})
  revokeJoinKey.mockResolvedValue({})
  setLifecycle.mockResolvedValue({})
  answered.current = undefined
  adopt.mockResolvedValue({})
  addProxyDevice.mockResolvedValue({ runs: {} })
  addExitDevice.mockResolvedValue({ runs: {} })
  setProxyActivation.mockResolvedValue({})
  setExitActivation.mockResolvedValue({})
  setProxyProduct.mockResolvedValue({})
  setExitProduct.mockResolvedValue({})
})

afterEach(async () => {
  await unmount()
  vi.useRealTimers()
})

describe('remote.it’s proxies', () => {
  const proxy = (id: string) => $(`[data-remoteit-proxy="${id}"]`)!

  it('each with its host and where it is, the machines running it by their device names, and its activation', async () => {
    await render(<AdminRemoteitProxies onProblem={vi.fn()} />)
    expect(subheader(proxy('R1'))).toBe('remote.it pdx1a · pdx1a-r3.dev.r3proxy.com · AWS us-west-2 (Boardman)')
    expect(subheader(proxy('R2'))).toBe('remote.it sea1a · sea1a-r3.dev.r3proxy.com · sea1')
    const e1 = $('[data-run="E1"]', proxy('R1'))!
    expect(e1.getAttribute('data-kind')).toBe('proxy')
    expect(e1.getAttribute('data-name')).toBe('remote.it pdx1a')
    // No name of its own beside its device's (§11 wave 2), and nothing to renumber.
    expect(e1.hasAttribute('data-title')).toBe(false)
    expect(e1.textContent).toBe('')
    expect(e1.getAttribute('data-activation')).toBe('auto')
    expect(e1.hasAttribute('data-manage')).toBe(true)
    expect($('[data-run="E2"]', proxy('R1'))?.hasAttribute('data-title')).toBe(false)
    expect($(`[data-select="${ACTIVATION}"]`, proxy('R1'))?.getAttribute('data-value')).toBe('auto')
    expect($(`[data-select="${ACTIVATION}"]`, proxy('R2'))?.getAttribute('data-value')).toBe('admin')
  })

  it('offers the machines running no proxy, with no number asked; added, all read again', async () => {
    await render(<AdminRemoteitProxies onProblem={vi.fn()} />)
    const choose = $('[data-choose="Add a machine"]', proxy('R1'))!
    expect([...choose.querySelectorAll('[data-pick]')].map(pick => pick.textContent)).toEqual([
      'spare · offline',
      'exit-box · online',
    ])
    expect(field('e<number>-r3')).toBeUndefined()
    const add = button('Add', proxy('R1'))!
    expect(add.disabled).toBe(true)
    await click($('[data-pick="M3"]', proxy('R1')))
    expect(add.disabled).toBe(false)
    await click(add)
    expect(addProxyDevice).toHaveBeenCalledWith('R1', 'M3')
    expect(proxies).toHaveBeenCalledTimes(2)
    expect(machines).toHaveBeenCalledTimes(2)
    expect($('[data-choose="Add a machine"]', proxy('R1'))?.getAttribute('data-value')).toBe('')
  })

  it('a machine refused is said in graphql’s words, or that it was not added', async () => {
    const onProblem = vi.fn()
    await render(<AdminRemoteitProxies onProblem={onProblem} />)
    addProxyDevice.mockResolvedValue({ reason: 'Spare is not online to say what it can run' })
    await click($('[data-pick="M3"]', proxy('R1')))
    await click(button('Add', proxy('R1')))
    expect(onProblem).toHaveBeenLastCalledWith('Spare is not online to say what it can run')
    addProxyDevice.mockResolvedValue({ reason: '' })
    await click($('[data-pick="M3"]', proxy('R1')))
    await click(button('Add', proxy('R1')))
    expect(onProblem).toHaveBeenLastCalledWith('The machine was not added.')
    expect(proxies).toHaveBeenCalledTimes(3)
  })

  it('no machine runs no proxy: none offered', async () => {
    machines.mockResolvedValue([E1])
    await render(<AdminRemoteitProxies onProblem={vi.fn()} />)
    expect($('[data-choose="Add a machine"]')).toBeNull()
    expect(button('Add')).toBeUndefined()
  })

  it('sets how a machine added goes into service; a refusal is said', async () => {
    const onProblem = vi.fn()
    await render(<AdminRemoteitProxies onProblem={onProblem} />)
    await click($(`[data-select="${ACTIVATION}"] [data-option="admin"]`, proxy('R1')))
    expect(setProxyActivation).toHaveBeenCalledWith('R1', 'admin')
    expect(proxies).toHaveBeenCalledTimes(2)
    expect(onProblem).not.toHaveBeenCalled()
    setProxyActivation.mockResolvedValue({ reason: 'Its activation is auto or admin' })
    await click($(`[data-select="${ACTIVATION}"] [data-option="auto"]`, proxy('R2')))
    expect(onProblem).toHaveBeenLastCalledWith('Its activation is auto or admin')
    setProxyActivation.mockResolvedValue('ERROR')
    await click($(`[data-select="${ACTIVATION}"] [data-option="auto"]`, proxy('R2')))
    expect(onProblem).toHaveBeenLastCalledWith("remote.it sea1a's activation was not changed.")
  })

  it('a machine’s action in it says what the machine still runs, and all is read again; the notice closes', async () => {
    await render(<AdminRemoteitProxies onProblem={vi.fn()} />)
    await click($('[data-run="E1"] [data-changed]'))
    expect($('[data-notice="info"]')?.textContent).toBe('e1 runs the exit remote.it pdx1a (in service).')
    expect(proxies).toHaveBeenCalledTimes(2)
    await click($('[data-notice] [data-close]'))
    expect($('[data-notice]')).toBeNull()
  })

  it('makes a new one at a location: its code, its coordinates in range and its provider, checked as typed', async () => {
    await render(<AdminRemoteitProxies onProblem={vi.fn()} />)
    expect(document.body.textContent).toContain('New proxy at a location')
    const make = () => button('Make the proxy')!
    expect(make().disabled).toBe(true)
    await type('Location', 'SEA1')
    expect(value('Location')).toBe('sea1')
    await type('Latitude', '47.6')
    expect(make().disabled).toBe(true)
    await type('Longitude', '-122.3')
    expect(make().disabled).toBe(false)
    for (const [label, bad, good] of [
      ['Location', 'sea', 'sea1'],
      ['Location', 'sea12', 'sea1'],
      ['Location', 'se1a', 'sea1'],
      ['Latitude', '90.5', '47.6'],
      ['Latitude', 'north', '47.6'],
      ['Latitude', ' ', '47.6'],
      ['Longitude', '-180.5', '-122.3'],
      ['Longitude', '', '-122.3'],
    ]) {
      await type(label, bad)
      expect(make().disabled).toBe(true)
      await type(label, good)
      expect(make().disabled).toBe(false)
    }
    await type('Provider', ' AWS us-west-2 (Oregon) ')
    await click(make())
    expect(create).toHaveBeenCalledWith('proxy', {
      location: 'sea1',
      latitude: 47.6,
      longitude: -122.3,
      provider: 'AWS us-west-2 (Oregon)',
    })
    expect(['Location', 'Latitude', 'Longitude', 'Provider'].map(value)).toEqual(['', '', '', ''])
    expect(proxies).toHaveBeenCalledTimes(2)
  })

  it('the coordinates at their limits are a location, and no provider is none', async () => {
    await render(<AdminRemoteitProxies onProblem={vi.fn()} />)
    await type('Location', 'syd1')
    await type('Latitude', '-90')
    await type('Longitude', '180')
    await click(button('Make the proxy'))
    expect(create).toHaveBeenCalledWith('proxy', {
      location: 'syd1',
      latitude: -90,
      longitude: 180,
      provider: undefined,
    })
  })

  it('a new one refused is said, what was typed kept; with no words, that it was not made', async () => {
    const onProblem = vi.fn()
    await render(<AdminRemoteitProxies onProblem={onProblem} />)
    create.mockResolvedValue({ reason: 'Sea1 is not a location code' })
    await type('Location', 'sea1')
    await type('Latitude', '47.6')
    await type('Longitude', '-122.3')
    await click(button('Make the proxy'))
    expect(onProblem).toHaveBeenLastCalledWith('Sea1 is not a location code')
    expect(['Location', 'Latitude', 'Longitude'].map(value)).toEqual(['sea1', '47.6', '-122.3'])
    expect(proxies).toHaveBeenCalledTimes(1)
    create.mockResolvedValue('ERROR')
    await click(button('Make the proxy'))
    expect(onProblem).toHaveBeenLastCalledWith('The proxy was not made.')
  })

  it('none yet: says to make one at a location, then add machines', async () => {
    proxies.mockResolvedValue([])
    const page = await render(<AdminRemoteitProxies onProblem={vi.fn()} />)
    expect(page.textContent).toContain('None yet: make one at a location below, then add machines to run it.')
    expect(button('Make the proxy')).toBeDefined()
  })

  it('reading, it says so; an API without them shows nothing — the page above says why —; one not read says so', async () => {
    const answer = held<any>()
    proxies.mockReturnValue(answer.promise)
    await render(<AdminRemoteitProxies onProblem={vi.fn()} />)
    expect($('[data-loading]')).not.toBeNull()
    await act(async () => answer.release('UNSUPPORTED'))
    expect(document.body.textContent).toBe('')
    proxies.mockResolvedValue('ERROR')
    await render(<AdminRemoteitProxies onProblem={vi.fn()} />)
    expect($('[data-notice="error"]')?.textContent).toBe("Could not read remote.it's proxies.")
  })

  it('reads them again every half minute while a machine drains, and not otherwise', async () => {
    vi.useFakeTimers({ toFake: ['setInterval', 'clearInterval'] })
    proxies.mockResolvedValue([{ ...PROXY, devices: [run('E1', 'e1', { state: 'DRAINING' })] }])
    await render(<AdminRemoteitProxies onProblem={vi.fn()} />)
    expect(proxies).toHaveBeenCalledTimes(1)
    await act(async () => vi.advanceTimersByTime(30_000))
    expect(proxies).toHaveBeenCalledTimes(2)

    proxies.mockClear().mockResolvedValue([PROXY])
    await render(<AdminRemoteitProxies onProblem={vi.fn()} />)
    await act(async () => vi.advanceTimersByTime(90_000))
    expect(proxies).toHaveBeenCalledTimes(1)
  })
})

describe('a machine’s checks, its address among them', () => {
  const check = (name: string, passed: boolean, pending = false) => ({
    name,
    passed,
    pending,
    reason: `${name} reason`,
  })

  it('joining: each by name, passed, waiting or failed — the address check with the others', async () => {
    proxies.mockResolvedValue([
      {
        ...PROXY,
        devices: [
          run('E1', 'e1', {
            joining: true,
            checks: [check('address', true), check('certificate', false, true), check('health', false)],
          }),
          run('E2', null),
        ],
      },
    ])
    await render(<AdminRemoteitProxies onProblem={vi.fn()} />)
    expect($('[data-run="E1"] [data-checks]')?.textContent).toBe(
      'Checks: address passed · certificate waiting · health failed'
    )
    // Serving with none failing: nothing to say.
    expect($('[data-run="E2"] [data-checks]')).toBeNull()
  })

  it('an exit’s machine serving, its address failing now: said', async () => {
    exits.mockResolvedValue([{ ...EXIT, devices: [run('E1', 'e1', { checks: [check('address', false)] })] }])
    await render(<AdminRemoteitExits onProblem={vi.fn()} />)
    expect($('[data-run="E1"] [data-checks]')?.textContent).toBe('Checks: address failed')
  })
})

describe('the products whose new devices join a proxy or an exit', () => {
  const proxy = (id: string) => $(`[data-remoteit-proxy="${id}"]`)!
  const exit = (id: string) => $(`[data-remoteit-exit="${id}"]`)!
  const TAKE = 'Take new devices from'

  it('each proxy says the products it takes devices from, or none; remote.it’s proxy product offered where not', async () => {
    await render(<AdminRemoteitProxies onProblem={vi.fn()} />)
    expect($('[data-run-product="PP"]', proxy('R1'))?.textContent).toBe(
      'Takes new devices from remote.it proxiesA device it registers joins this proxy and goes into service as its activation says.Remove'
    )
    expect($(`[data-choose="${TAKE}"]`, proxy('R1'))).toBeNull()
    expect($('[data-run-product=""]', proxy('R2'))?.textContent).toBe(
      "Takes no product's new devices: a machine runs it once it is added below."
    )
    const choose = $(`[data-choose="${TAKE}"]`, proxy('R2'))!
    expect([...choose.querySelectorAll('[data-pick]')].map(pick => pick.textContent)).toEqual(['remote.it proxies'])
  })

  it('one added to a proxy, and all read again', async () => {
    await render(<AdminRemoteitProxies onProblem={vi.fn()} />)
    const add = button('Add product', proxy('R2'))!
    expect(add.disabled).toBe(true)
    await click($('[data-pick="PP"]', proxy('R2')))
    await click(add)
    expect(setProxyProduct).toHaveBeenCalledWith('R2', 'PP', true)
    expect(proxies).toHaveBeenCalledTimes(2)
    expect($(`[data-choose="${TAKE}"]`, proxy('R2'))?.getAttribute('data-value')).toBe('')
  })

  it('one removed only once it is said that no new device joins and none is taken out', async () => {
    await render(<AdminRemoteitProxies onProblem={vi.fn()} />)
    await click(button('Remove', proxy('R1')))
    expect(setProxyProduct).not.toHaveBeenCalled()
    expect($('[data-confirm]')?.getAttribute('data-confirm')).toBe('Remove remote.it proxies from remote.it pdx1a?')
    expect($('[data-confirm]')?.textContent).toContain(
      'No new device of remote.it proxies joins remote.it pdx1a any more. Its devices running it now keep running it'
    )
    await click($('[data-deny]'))
    expect($('[data-confirm]')).toBeNull()
    expect(setProxyProduct).not.toHaveBeenCalled()
    await click(button('Remove', proxy('R1')))
    await click($('[data-confirm-action]'))
    expect(setProxyProduct).toHaveBeenCalledWith('R1', 'PP', false)
    expect($('[data-confirm]')).toBeNull()
    expect(proxies).toHaveBeenCalledTimes(2)
  })

  it('a change refused is said in graphql’s words, or that it was not made', async () => {
    const onProblem = vi.fn()
    await render(<AdminRemoteitProxies onProblem={onProblem} />)
    setProxyProduct.mockResolvedValue({ reason: 'Only the system account’s products join remote.it’s proxies' })
    await click($('[data-pick="PP"]', proxy('R2')))
    await click(button('Add product', proxy('R2')))
    expect(onProblem).toHaveBeenLastCalledWith('Only the system account’s products join remote.it’s proxies')
    setProxyProduct.mockResolvedValue('ERROR')
    await click($('[data-pick="PP"]', proxy('R2')))
    await click(button('Add product', proxy('R2')))
    expect(onProblem).toHaveBeenLastCalledWith("remote.it sea1a's products were not changed.")
  })

  it('an exit’s the same: added, removed once said, refused in graphql’s words', async () => {
    const onProblem = vi.fn()
    await render(<AdminRemoteitExits onProblem={onProblem} />)
    expect($('[data-run-product="PP"]', exit('X1'))?.textContent).toContain('joins this exit')
    await click($('[data-pick="PP"]', exit('X2')))
    await click(button('Add product', exit('X2')))
    expect(setExitProduct).toHaveBeenCalledWith('X2', 'PP', true)
    expect(exits).toHaveBeenCalledTimes(2)
    await click(button('Remove', exit('X1')))
    await click($('[data-confirm-action]'))
    expect(setExitProduct).toHaveBeenLastCalledWith('X1', 'PP', false)
    setExitProduct.mockResolvedValue({ reason: '' })
    await click(button('Remove', exit('X1')))
    await click($('[data-confirm-action]'))
    expect(onProblem).toHaveBeenLastCalledWith("remote.it pdx1a's products were not changed.")
  })

  it('no product to offer — an API without remote.it’s proxy product —: none offered, those named still said', async () => {
    product.mockResolvedValue('UNSUPPORTED')
    await render(<AdminRemoteitProxies onProblem={vi.fn()} />)
    expect($(`[data-choose="${TAKE}"]`)).toBeNull()
    expect($('[data-run-product="PP"]', proxy('R1'))).not.toBeNull()
  })
})

describe('remote.it’s exits', () => {
  const exit = (id: string) => $(`[data-remoteit-exit="${id}"]`)!

  it('each with where it is and its users, one no machine takes traffic for said so, and the machines running it', async () => {
    exits.mockResolvedValue([EXIT, SEA_EXIT, { ...SEA_EXIT, id: 'X3', name: 'remote.it nyc1a', users: null }])
    await render(<AdminRemoteitExits onProblem={vi.fn()} />)
    expect(subheader(exit('X1'))).toBe('remote.it pdx1a · AWS us-west-2 (Boardman) · 3 users')
    expect(subheader(exit('X2'))).toBe('remote.it sea1a · sea1 · 1 user · not offered: no machine takes traffic')
    expect(subheader(exit('X3'))).toBe('remote.it nyc1a · sea1 · 0 users · not offered: no machine takes traffic')
    const e1 = $('[data-run="E1"]', exit('X1'))!
    // remote.it's exits reach no network of their machines: a machine's is said only where open or not the cloud's.
    expect(e1.hasAttribute('data-lan')).toBe(false)
    expect($('[data-lan-warning]')).toBeNull()
    expect(e1.getAttribute('data-kind')).toBe('exit')
    expect(e1.getAttribute('data-name')).toBe('remote.it pdx1a')
    expect(e1.getAttribute('data-activation')).toBe('auto')
    expect(e1.hasAttribute('data-manage')).toBe(true)
    expect(e1.hasAttribute('data-title')).toBe(false)
  })

  it('offers the machines running no exit, with no number asked; added, all read again; a refusal is said', async () => {
    const onProblem = vi.fn()
    await render(<AdminRemoteitExits onProblem={onProblem} />)
    expect([...exit('X1').querySelectorAll('[data-pick]')].map(pick => pick.getAttribute('data-pick'))).toEqual(['M3'])
    expect(field('e<number>-r3')).toBeUndefined()
    const add = button('Add', exit('X1'))!
    expect(add.disabled).toBe(true)
    await click($('[data-pick="M3"]', exit('X1')))
    await click(add)
    expect(addExitDevice).toHaveBeenCalledWith('X1', 'M3')
    expect(exits).toHaveBeenCalledTimes(2)
    expect(machines).toHaveBeenCalledTimes(2)
    expect(onProblem).not.toHaveBeenCalled()
    addExitDevice.mockResolvedValue({ reason: 'Its machine’s policy forbids exits' })
    await click($('[data-pick="M3"]', exit('X1')))
    await click(button('Add', exit('X1')))
    expect(onProblem).toHaveBeenLastCalledWith('Its machine’s policy forbids exits')
    addExitDevice.mockResolvedValue({ reason: '' })
    await click($('[data-pick="M3"]', exit('X1')))
    await click(button('Add', exit('X1')))
    expect(onProblem).toHaveBeenLastCalledWith('The machine was not added.')
  })

  it('a machine added to one whose LAN were open would say first that it opens its own', async () => {
    // Never so for remote.it's: said as wherever a device is added to an exit.
    exits.mockResolvedValue([{ ...EXIT, lan: true }])
    await render(<AdminRemoteitExits onProblem={vi.fn()} />)
    expect($('[data-lan-warning]', exit('X1'))?.textContent).toBe(
      'This exit lets its users reach its devices’ local networks: each device added opens its network to them.'
    )
    await click($('[data-pick="M3"]', exit('X1')))
    expect($('[data-lan-warning]', exit('X1'))?.textContent).toBe(
      'This exit lets its users reach its devices’ local networks: adding spare opens its network to them.'
    )
    expect(addExitDevice).not.toHaveBeenCalled()
    await click(button('Add', exit('X1')))
    expect(addExitDevice).toHaveBeenCalledWith('X1', 'M3')
  })

  it('sets how a machine added goes into service; a refusal is said', async () => {
    const onProblem = vi.fn()
    await render(<AdminRemoteitExits onProblem={onProblem} />)
    await click($(`[data-select="${ACTIVATION}"] [data-option="admin"]`, exit('X1')))
    expect(setExitActivation).toHaveBeenCalledWith('X1', 'admin')
    expect(exits).toHaveBeenCalledTimes(2)
    setExitActivation.mockResolvedValue('ERROR')
    await click($(`[data-select="${ACTIVATION}"] [data-option="admin"]`, exit('X2')))
    expect(onProblem).toHaveBeenLastCalledWith("remote.it sea1a's activation was not changed.")
  })

  it('a machine’s action in it says what the machine still runs, and all is read again', async () => {
    await render(<AdminRemoteitExits onProblem={vi.fn()} />)
    await click($('[data-run="E1"] [data-changed]', exit('X1')))
    expect($('[data-notice="info"]')?.textContent).toBe('e1 runs the exit remote.it pdx1a (in service).')
    expect(exits).toHaveBeenCalledTimes(2)
  })

  it('makes a new one at a location; refused, said', async () => {
    const onProblem = vi.fn()
    await render(<AdminRemoteitExits onProblem={onProblem} />)
    expect(document.body.textContent).toContain('New exit at a location')
    await type('Location', 'pdx1')
    await type('Latitude', '45.8')
    await type('Longitude', '-119.7')
    await click(button('Make the exit'))
    expect(create).toHaveBeenCalledWith('exit', {
      location: 'pdx1',
      latitude: 45.8,
      longitude: -119.7,
      provider: undefined,
    })
    expect(exits).toHaveBeenCalledTimes(2)
    create.mockResolvedValue({ reason: '' })
    await type('Location', 'pdx1')
    await type('Latitude', '45.8')
    await type('Longitude', '-119.7')
    await click(button('Make the exit'))
    expect(onProblem).toHaveBeenLastCalledWith('The exit was not made.')
  })

  it('none yet: says to make one at a location; an API without them shows nothing; one not read says so', async () => {
    exits.mockResolvedValue([])
    expect((await render(<AdminRemoteitExits onProblem={vi.fn()} />)).textContent).toContain(
      'None yet: make one at a location below, then add machines to run it.'
    )
    exits.mockResolvedValue('UNSUPPORTED')
    expect((await render(<AdminRemoteitExits onProblem={vi.fn()} />)).textContent).toBe('')
    exits.mockResolvedValue('ERROR')
    await render(<AdminRemoteitExits onProblem={vi.fn()} />)
    expect($('[data-notice="error"]')?.textContent).toBe("Could not read remote.it's exits.")
  })
})

describe('remote.it’s machines', () => {
  const row = (id: string) => $(`[data-machine="${id}"]`)!
  const primary = (id: string) => row(id).querySelector('.MuiListItemText-primary')?.textContent
  const secondary = (id: string) => row(id).querySelector('.MuiListItemText-secondary')?.textContent

  it('each online, or offline since when, with what it runs and its state in each, and the actions on all of it', async () => {
    await render(<AdminRemoteitMachines onProblem={vi.fn()} />)
    expect(document.body.textContent).toContain('Machines')
    expect(primary('E1')).toBe('e1 · online')
    expect(secondary('E1')).toBe('E1 · runs proxy remote.it pdx1a: in service; exit remote.it pdx1a: draining')
    expect(row('E1').querySelector('[data-icon="server"]')?.getAttribute('data-color')).toBe('primary')
    const actions = $('[data-run-actions]', row('E1'))!
    expect(actions.getAttribute('data-run-actions')).toBe('device')
    expect(actions.getAttribute('data-device')).toBe('E1')
    expect(actions.getAttribute('data-device-name')).toBe('e1')

    expect(primary('M3')).toBe('spare · offline since then')
    expect(secondary('M3')).toBe('M3 · runs nothing yet: add it on the Proxies or Exits tab')
    expect(row('M3').querySelector('[data-icon="server"]')?.getAttribute('data-color')).toBe('grayDark')
    expect($('[data-run-actions]', row('M3'))).toBeNull()

    expect(primary('M4')).toBe('exit-box · online')
    expect(secondary('M4')).toBe('M4 · runs exit remote.it pdx1a: in service')
    expect(button('Move to remote.it')).toBeUndefined()
  })

  it('one with no device behind it is said so, its actions by its id', async () => {
    machines.mockResolvedValue([{ ...E1, name: null, state: 'inactive' }])
    await render(<AdminRemoteitMachines onProblem={vi.fn()} />)
    expect(primary('E1')).toBe('no such device · offline')
    expect($('[data-run-actions]', row('E1'))?.getAttribute('data-device-name')).toBe('E1')
  })

  it('one in someone’s account is offered the move to remote.it, saying what it ends; moved, all read again', async () => {
    machines.mockResolvedValue([
      E1,
      machine('M5', 'old-box', { system: false, owner: 'staff@remote.it' }),
      machine('M6', 'older-box', { system: false }),
    ])
    await render(<AdminRemoteitMachines onProblem={vi.fn()} />)
    expect(button('Move to remote.it', row('E1'))).toBeUndefined()
    expect(row('M5').textContent).toContain(
      'In staff@remote.it account: move it, and its shares end and its owner no longer sees it.'
    )
    expect(row('M6').textContent).toContain('In another account: move it')
    await click(button('Move to remote.it', row('M5')))
    expect(adopt).toHaveBeenCalledWith('M5')
    expect(machines).toHaveBeenCalledTimes(2)
  })

  it('a move refused is said in graphql’s words, or that it was not moved', async () => {
    const onProblem = vi.fn()
    machines.mockResolvedValue([
      machine('M5', 'old-box', { system: false, owner: 'staff@remote.it' }),
      machine('M6', null, { system: false }),
    ])
    await render(<AdminRemoteitMachines onProblem={onProblem} />)
    adopt.mockResolvedValue({ reason: 'Old-box has endpoints of its owner’s' })
    await click(button('Move to remote.it', row('M5')))
    expect(onProblem).toHaveBeenLastCalledWith('Old-box has endpoints of its owner’s')
    adopt.mockResolvedValue('ERROR')
    await click(button('Move to remote.it', row('M5')))
    expect(onProblem).toHaveBeenLastCalledWith('old-box was not moved to remote.it.')
    await click(button('Move to remote.it', row('M6')))
    expect(onProblem).toHaveBeenLastCalledWith('M6 was not moved to remote.it.')
  })

  it('while one is moved, its move and its actions wait', async () => {
    const answer = held<any>()
    adopt.mockReturnValue(answer.promise)
    machines.mockResolvedValue([{ ...E1, system: false, owner: 'staff@remote.it' }])
    await render(<AdminRemoteitMachines onProblem={vi.fn()} />)
    await click(button('Move to remote.it', row('E1')))
    expect(button('Move to remote.it', row('E1'))!.disabled).toBe(true)
    expect($('[data-run-actions]', row('E1'))!.hasAttribute('data-disabled')).toBe(true)
    await act(async () => answer.release({}))
    expect(button('Move to remote.it', row('E1'))!.disabled).toBe(false)
    expect($('[data-run-actions]', row('E1'))!.hasAttribute('data-disabled')).toBe(false)
  })

  it('an action on all a machine runs says what it still runs, and all is read again', async () => {
    await render(<AdminRemoteitMachines onProblem={vi.fn()} />)
    await click($('[data-done]', row('E1')))
    expect($('[data-notice="info"]')?.textContent).toBe('e1 runs no proxy or exit now.')
    expect(machines).toHaveBeenCalledTimes(2)
  })

  it('none yet: says to register one with a join key; an API without them shows nothing; one not read says so', async () => {
    machines.mockResolvedValue([])
    expect((await render(<AdminRemoteitMachines onProblem={vi.fn()} />)).textContent).toContain(
      "None yet: a machine registers with a join key of remote.it's proxy product, below."
    )
    machines.mockResolvedValue('UNSUPPORTED')
    expect((await render(<AdminRemoteitMachines onProblem={vi.fn()} />)).textContent).toBe('')
    machines.mockResolvedValue('ERROR')
    await render(<AdminRemoteitMachines onProblem={vi.fn()} />)
    expect($('[data-notice="error"]')?.textContent).toBe('Could not read the machines.')
  })

  it('reads them again every half minute while a machine drains in a proxy or an exit, and not otherwise', async () => {
    vi.useFakeTimers({ toFake: ['setInterval', 'clearInterval'] })
    await render(<AdminRemoteitMachines onProblem={vi.fn()} />)
    expect(machines).toHaveBeenCalledTimes(1)
    await act(async () => vi.advanceTimersByTime(30_000))
    expect(machines).toHaveBeenCalledTimes(2)

    machines.mockClear().mockResolvedValue([SPARE, EXITER])
    await render(<AdminRemoteitMachines onProblem={vi.fn()} />)
    await act(async () => vi.advanceTimersByTime(90_000))
    expect(machines).toHaveBeenCalledTimes(1)
  })
})

describe('remote.it’s proxy product', () => {
  const section = () => $('[data-proxy-product]')!

  it('on the machines’ tab: its join keys and its lifecycle, for remote.it’s admins; no registration code', async () => {
    await render(<AdminRemoteitMachines onProblem={vi.fn()} />)
    expect(subheader(section())).toBe("remote.it's proxy product: remote.it proxies")
    expect(section().textContent).toContain('A new machine registers with one of its join keys')
    const keys = $('[data-join-keys]', section())!
    expect(keys.getAttribute('data-join-keys')).toBe('PP')
    expect(keys.getAttribute('data-keys')).toBe('pdx1a')
    expect(keys.hasAttribute('data-manage')).toBe(true)
    const lifecycle = $('[data-lifecycle]', section())!
    expect(lifecycle.getAttribute('data-lifecycle')).toBe('ephemeral')
    expect(lifecycle.getAttribute('data-name')).toBe('remote.it proxies')
    expect(lifecycle.hasAttribute('data-manage')).toBe(true)
    expect(document.body.textContent).not.toContain('registration code')
  })

  it('a join key made: the key answered once, for its dialog to show, and the product read again', async () => {
    await render(<AdminRemoteitMachines onProblem={vi.fn()} />)
    createJoinKey.mockResolvedValue({
      data: { data: { createDeviceProductJoinKey: { key: 'r3jk_PP.seed', joinKey: { id: 'K2' } } } },
    })
    product.mockResolvedValue({
      ...PRODUCT,
      joinKeys: [{ ...PRODUCT.joinKeys[0], id: 'K2', name: 'pool' }, ...PRODUCT.joinKeys],
    })
    await click($('[data-create]'))
    expect(createJoinKey).toHaveBeenCalledWith({ productId: 'PP', name: 'pool' })
    expect(answered.current).toEqual({ key: 'r3jk_PP.seed' })
    expect(product).toHaveBeenCalledTimes(2)
    expect($('[data-join-keys]')?.getAttribute('data-keys')).toBe('pool,pdx1a')
  })

  it('a join key refused: graphql’s words for its dialog, nothing read again; a failed request, nothing', async () => {
    await render(<AdminRemoteitMachines onProblem={vi.fn()} />)
    createJoinKey.mockResolvedValue({ reason: 'A name of 1 to 255 characters' })
    await click($('[data-create]'))
    expect(answered.current).toEqual({ reason: 'A name of 1 to 255 characters' })
    createJoinKey.mockResolvedValue('ERROR')
    await click($('[data-create]'))
    expect(answered.current).toEqual({})
    expect(product).toHaveBeenCalledTimes(1)
  })

  it('a join key revoked, and the product read again', async () => {
    await render(<AdminRemoteitMachines onProblem={vi.fn()} />)
    await click($('[data-revoke]'))
    expect(revokeJoinKey).toHaveBeenCalledWith('PP', 'K1')
    expect(product).toHaveBeenCalledTimes(2)
  })

  it('its lifecycle changed, and read again; refused, graphql’s words for the setting to say', async () => {
    await render(<AdminRemoteitMachines onProblem={vi.fn()} />)
    await click($('[data-lifecycle-change]'))
    expect(setLifecycle).toHaveBeenCalledWith('PP', 'persistent')
    expect(answered.current).toEqual({})
    expect(product).toHaveBeenCalledTimes(2)
    setLifecycle.mockResolvedValue({ reason: '2 devices of remote.it proxies run a daemon that cannot' })
    await click($('[data-lifecycle-change]'))
    expect(answered.current).toEqual({ reason: '2 devices of remote.it proxies run a daemon that cannot' })
    setLifecycle.mockResolvedValue('ERROR')
    await click($('[data-lifecycle-change]'))
    expect(answered.current).toEqual({ reason: '' })
  })

  it('read again and not read: what is shown stays — a key on screen with it —, and it is said', async () => {
    const onProblem = vi.fn()
    await render(<AdminRemoteitMachines onProblem={onProblem} />)
    product.mockResolvedValue('ERROR')
    await click($('[data-revoke]'))
    expect(onProblem).toHaveBeenLastCalledWith("Could not read remote.it's proxy product again.")
    expect($('[data-join-keys]')?.getAttribute('data-keys')).toBe('pdx1a')
  })

  it('not made yet, said; an API without it shows nothing of it; one not read says so', async () => {
    product.mockResolvedValue(null)
    await render(<AdminRemoteitMachines onProblem={vi.fn()} />)
    expect(subheader(section())).toBe("remote.it's proxy product")
    expect(section().textContent).toContain("remote.it's proxy product is not made yet.")
    expect($('[data-join-keys]')).toBeNull()
    product.mockResolvedValue('UNSUPPORTED')
    await render(<AdminRemoteitMachines onProblem={vi.fn()} />)
    expect($('[data-proxy-product]')).toBeNull()
    expect(document.body.textContent).toContain('Machines')
    product.mockResolvedValue('ERROR')
    await render(<AdminRemoteitMachines onProblem={vi.fn()} />)
    expect($('[data-notice="error"]')?.textContent).toBe("Could not read remote.it's proxy product.")
  })
})
