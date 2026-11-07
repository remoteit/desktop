import React, { act } from 'react'
import { createRoot, Root } from 'react-dom/client'
import { describe, it, expect, vi, beforeEach } from 'vitest'

const {
  readProxy,
  accountProxies,
  deleteProxy,
  moveEndpoints,
  renameProxy,
  setActivation,
  addDevice,
  reloadList,
  push,
  params,
  picker,
  inline,
  drained,
} = vi.hoisted(() => ({
  readProxy: vi.fn(async (_id: string) => null as any),
  accountProxies: vi.fn(async (_accountId: string) => [] as any),
  deleteProxy: vi.fn(async (_proxy: string, _confirm: boolean) => ({} as any)),
  moveEndpoints: vi.fn(async (_from: string, _to: string, _apply: boolean) => ({} as any)),
  renameProxy: vi.fn(async (_proxy: string, _set: { name?: string; label?: string }) => ({} as any)),
  setActivation: vi.fn(async (_proxy: string, _activation: string) => ({} as any)),
  addDevice: vi.fn(async (_proxy: string, _deviceId: string) => ({ runs: { proxy: null, exit: null } } as any)),
  reloadList: vi.fn(),
  push: vi.fn(),
  params: { proxyID: 'P1' },
  picker: { chosen: [] as string[] },
  // Each inline field's props, by its label: its value, its checks and its save.
  inline: {} as Record<string, any>,
  // What a device runs after an action on it in the proxy: still the proxy, draining.
  drained: {
    proxy: { id: 'D1', name: 'Office Mac', state: 'DRAINING', joining: false, proxy: { name: 'Gateway' } },
    exit: null,
  },
}))
vi.mock('react-router-dom', () => ({ useHistory: () => ({ push }), useParams: () => params }))
vi.mock('../services/graphQLProxy', () => ({
  graphQLProxy: readProxy,
  graphQLAccountProxies: accountProxies,
  graphQLDeleteProxy: deleteProxy,
  graphQLMoveProxyEndpoints: moveEndpoints,
  graphQLRenameProxy: renameProxy,
  graphQLSetProxyActivation: setActivation,
}))
vi.mock('../services/graphQLDeviceRuns', () => ({ graphQLAddProxyDevice: addDevice }))
vi.mock('../services/graphQL', () => ({
  refusalOf: (result: any) => (result === 'ERROR' ? '' : result && 'reason' in result ? result.reason : undefined),
  graphQLBasicRequest: vi.fn(),
  graphQLGetErrors: vi.fn(),
}))
// What subnetNames calls through: the label rule is its own.
vi.mock('../services/post', () => ({ post: vi.fn() }))
vi.mock('../services/deviceSessionInfo', () => ({
  refreshDeviceSessionInfo: vi.fn(),
  requestDeviceSessionInfo: vi.fn(),
}))
vi.mock('../services/graphQLDaemon', () => ({ UNSUPPORTED: 'UNSUPPORTED', withoutDeviceSessions: () => false }))
vi.mock('../hooks/useAccountExits', () => ({ useAccountProxies: () => ({ value: undefined, reload: reloadList }) }))
// The picker is its own (RunDevicePicker.tsx): here, what it was given, and the devices chosen added. addEach is its.
vi.mock('../selectors/devices', () => ({ getAllDevices: () => [] }))
vi.mock('../components/RunDevicePicker', async importOriginal => ({
  ...(await importOriginal<typeof import('../components/RunDevicePicker')>()),
  RunDevicePicker: ({ kind, ownerId, exclude, busy, refusals, onAdd }: any) => (
    <div
      data-picker={kind}
      data-owner={ownerId}
      data-exclude={exclude.join('|')}
      data-busy={busy ? '' : undefined}
      data-refusals={JSON.stringify(refusals)}
    >
      <button data-add disabled={busy} onClick={() => onAdd(picker.chosen)} />
    </div>
  ),
}))
// A device running it: what it was given, and its actions' end.
vi.mock('../components/RunListItem', () => ({
  RunListItem: ({ kind, run, name, activation, to, manage, onChanged }: any) => (
    <div
      data-run={run.id}
      data-kind={kind}
      data-name={name}
      data-activation={activation}
      data-to={to}
      data-manage={manage ? '' : undefined}
    >
      <button data-changed onClick={() => onChanged(drained, { id: run.id, name: run.name || run.id })} />
    </div>
  ),
}))
vi.mock('../components/InlineTextFieldSetting', () => ({
  InlineTextFieldSetting: (props: any) => {
    inline[props.label] = props
    return (
      <div
        data-inline={props.label}
        data-value={props.value}
        data-display={props.displayValue}
        data-disabled={props.disabled ? '' : undefined}
      />
    )
  },
}))
// A line, by its icon: what it says, and its button.
vi.mock('../components/ListItemSetting', () => ({
  ListItemSetting: ({ icon, iconColor, label, subLabel, button, disabled, onButtonClick }: any) => (
    <div data-setting={icon} data-color={iconColor}>
      <span data-label>{label}</span>
      <span data-sublabel>{subLabel}</span>
      {button && (
        <button disabled={disabled} onClick={onButtonClick}>
          {button}
        </button>
      )}
    </div>
  ),
}))
vi.mock('../components/SelectSetting', () => ({
  SelectSetting: ({ label, value, values, disabled, onChange }: any) => (
    <div data-select={label} data-value={value} data-disabled={disabled ? '' : undefined}>
      {values.map((each: any) => (
        <button key={each.key} data-option={each.key} disabled={disabled} onClick={() => onChange(each.key)}>
          {each.name}
        </button>
      ))}
    </div>
  ),
}))
vi.mock('../components/Confirm', () => ({
  Confirm: ({ open, title, action, disabled, children, onConfirm, onDeny }: any) =>
    open ? (
      <div data-confirm>
        <div data-confirm-title>{title}</div>
        {children}
        <button data-confirm-action disabled={disabled} onClick={onConfirm}>
          {action}
        </button>
        <button data-deny onClick={onDeny} />
      </div>
    ) : null,
}))
vi.mock('../buttons/IconButton', () => ({
  IconButton: ({ title, icon, disabled, onClick }: any) => (
    <button data-icon={icon} disabled={disabled} onClick={onClick}>
      {title}
    </button>
  ),
}))
vi.mock('../components/Notice', () => ({
  Notice: ({ severity, children, onClose }: any) => (
    <div data-notice={severity ?? 'info'}>
      {children}
      {onClose && <button data-close onClick={onClose} />}
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
vi.mock('../components/LoadingMessage', () => ({ LoadingMessage: () => <div data-loading /> }))
// The proxy to move the endpoints to: each one offered a button that chooses it.
vi.mock('@mui/material', async () => {
  const actual: any = await vi.importActual('@mui/material')
  return {
    ...actual,
    TextField: ({ label, value, children, onChange }: any) => (
      <div data-choose={label} data-value={value}>
        {React.Children.map(children, (child: any) => (
          <button data-pick={child.props.value} onClick={() => onChange({ target: { value: child.props.value } })}>
            {child.props.children}
          </button>
        ))}
      </div>
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

import { ProxyPage, certificateLine, hostWith, labelOf } from './ProxyPage'
import { post } from '../services/post'
;(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true

const t = ((_key: string, text: string, values?: any) => text.replace(/{{(\w+)}}/g, (_, k) => values?.[k] ?? '')) as any

const NAME = 'Name'
const LABEL = 'Host: its label before your account slug'
const ACTIVATION = 'A device added goes into service'

const run = (id: string, name: string | null, extra: any = {}) => ({
  id,
  name,
  state: 'ACTIVE',
  joining: false,
  activeSince: null,
  drainingSince: null,
  checks: [],
  host: null,
  drainMaxWaitMinutes: null,
  health: null,
  certificate: 'ready',
  openConnections: null,
  drain: null,
  ...extra,
})
const GATEWAY = {
  id: 'P1',
  name: 'Gateway',
  host: 'gw-acme-corp.dev.r3proxy.com',
  domain: null,
  remoteit: false,
  publicEndpoints: true,
  location: null,
  provider: '',
  activation: 'auto',
  manage: true,
  owner: { id: 'ACCOUNT', email: 'pat@example.com' },
  devices: [run('D1', 'Office Mac')],
  endpoints: 2,
  certificate: 'ready',
} as any
// No device runs it: its endpoints may be moved, and it deleted.
const IDLE = { ...GATEWAY, devices: [] }
const SPARE = { ...IDLE, id: 'P2', name: 'Spare', host: 'sp-acme-corp.dev.r3proxy.com', endpoints: 0 }
const NAS = { ...IDLE, id: 'P3', name: 'NAS', host: 'nas-acme-corp.dev.r3proxy.com', endpoints: 0 }
const PDX = {
  ...GATEWAY,
  id: 'R1',
  name: 'remote.it pdx1a',
  host: 'pdx1a.dev.r3proxy.com',
  remoteit: true,
  location: 'pdx1',
  provider: 'AWS us-west-2 (Boardman)',
  owner: null,
  devices: [run('E1', 'e1', { host: 'e1-r3.dev.r3proxy.com' })],
  endpoints: 5,
  certificate: null,
}
const MOVE = {
  addresses: [
    {
      endpoint: 'EP1',
      kind: 'https',
      from: 'https://web-gw-acme-corp.dev.r3proxy.com',
      to: 'https://web-sp-acme-corp.dev.r3proxy.com',
    },
    {
      endpoint: 'EP2',
      kind: 'tcp',
      from: 'gw-acme-corp.dev.r3proxy.com:30001',
      to: 'sp-acme-corp.dev.r3proxy.com:30001',
    },
  ],
  applied: false,
}

// One page at a time: the one before unmounted, so it never writes the fields' props again.
let root: Root | undefined
async function mount() {
  if (root) await act(async () => root!.unmount())
  document.body.innerHTML = ''
  const container = document.createElement('div')
  document.body.appendChild(container)
  root = createRoot(container)
  await act(async () => root!.render(<ProxyPage />))
  return container
}
async function render(proxy: any = GATEWAY) {
  readProxy.mockResolvedValue(proxy)
  return mount()
}
const $ = (selector: string) => document.body.querySelector(selector) as HTMLElement | null
const setting = (icon: string) => $(`[data-setting="${icon}"]`)
const label = (icon: string) => setting(icon)?.querySelector('[data-label]')?.textContent
const sublabel = (icon: string) => setting(icon)?.querySelector('[data-sublabel]')?.textContent
const settingButton = (icon: string) => setting(icon)!.querySelector('button') as HTMLButtonElement
const click = (element: Element | null) => act(async () => (element as HTMLElement).click())
// An answer held back until the test lets it go.
function held<T>() {
  let release!: (value: T) => void
  const promise = new Promise<T>(resolve => (release = resolve))
  return { promise, release }
}

beforeEach(() => {
  for (const each of [readProxy, accountProxies, deleteProxy, moveEndpoints, renameProxy, setActivation, addDevice])
    each.mockReset()
  deleteProxy.mockResolvedValue({})
  renameProxy.mockResolvedValue({})
  setActivation.mockResolvedValue({})
  addDevice.mockResolvedValue({ runs: { proxy: null, exit: null } })
  accountProxies.mockResolvedValue([GATEWAY, SPARE, NAS])
  reloadList.mockReset()
  push.mockReset()
  params.proxyID = 'P1'
  picker.chosen = []
  for (const key of Object.keys(inline)) delete inline[key]
})

describe('an own proxy’s host', () => {
  it('its label is what comes before the account’s slug; a new label keeps the slug and the domain', () => {
    expect(labelOf('gw-acme-corp.dev.r3proxy.com')).toBe('gw')
    expect(labelOf('nas2-acme.r3proxy.com')).toBe('nas2')
    expect(hostWith('gw-acme-corp.dev.r3proxy.com', 'nas')).toBe('nas-acme-corp.dev.r3proxy.com')
    expect(hostWith('gw-acme-corp.dev.r3proxy.com', 'gateway2')).toBe('gateway2-acme-corp.dev.r3proxy.com')
  })

  it('its certificate: its domain’s on its devices, remote.it’s ready, or remote.it’s still to come', () => {
    expect(certificateLine(t, 'own')).toBe("Your domain's, on its devices (proxy_cert, proxy_key)")
    expect(certificateLine(t, 'ready')).toBe("remote.it's, for its names")
    expect(certificateLine(t, 'pending')).toBe(
      "remote.it's, issued within a day of its name: until then https names fail"
    )
  })
})

describe('a proxy’s page', () => {
  it('reads the proxy the route names, saying it is reading meanwhile', async () => {
    const answer = held<any>()
    readProxy.mockReturnValue(answer.promise)
    await mount()
    expect(readProxy).toHaveBeenCalledWith('P1')
    expect($('[data-loading]')).not.toBeNull()
    await act(async () => answer.release(GATEWAY))
    expect($('[data-loading]')).toBeNull()
    expect($('[data-header]')?.textContent).toBe('Gatewaygw-acme-corp.dev.r3proxy.com')
  })

  it('says a proxy that could not be read, and one there is not or that may not be seen', async () => {
    await render('ERROR')
    expect($('[data-notice="error"]')?.textContent).toBe('The proxy could not be read.')
    await render(null)
    expect($('[data-notice="info"]')?.textContent).toBe('No such proxy, or not one you may see.')
    await render('UNSUPPORTED')
    expect($('[data-notice="info"]')?.textContent).toBe('No such proxy, or not one you may see.')
  })

  it('an own proxy, for whoever manages it: its name and host label to change, its domain, certificate, public endpoints, activation and endpoints', async () => {
    await render()
    expect(inline[NAME].value).toBe('Gateway')
    expect(inline[NAME].maxLength).toBe(255)
    expect(inline[LABEL].value).toBe('gw')
    expect(inline[LABEL].displayValue).toBe('gw-acme-corp.dev.r3proxy.com')
    expect(inline[LABEL].maxLength).toBe(29)
    expect('Gw-1_x'.replace(inline[LABEL].filter, '')).toBe('w1x')
    expect(label('earth-americas')).toBe('remote.it’s names')
    expect(sublabel('earth-americas')).toBe('Its https names: your own domain, or remote.it’s')
    expect(label('certificate')).toBe("remote.it's, for its names")
    expect(setting('certificate')?.getAttribute('data-color')).toBe('success')
    expect(label('users')).toBe('Takes public endpoints')
    expect($(`[data-select="${ACTIVATION}"]`)?.getAttribute('data-value')).toBe('auto')
    expect(label('plug')).toBe('2 endpoints')
    expect(sublabel('plug')).toBe('Made on it from a service’s page, under Proxy endpoints')
    expect(setting('globe')).toBeNull()

    await render({
      ...GATEWAY,
      domain: 'proxy.example.com',
      certificate: 'pending',
      publicEndpoints: false,
      endpoints: 1,
    })
    expect(label('earth-americas')).toBe('proxy.example.com')
    expect(label('certificate')).toBe("remote.it's, issued within a day of its name: until then https names fail")
    expect(setting('certificate')?.getAttribute('data-color')).toBe('warning')
    expect(label('users')).toBe('Takes no public endpoints')
    expect(label('plug')).toBe('1 endpoint')

    await render({ ...GATEWAY, certificate: null, endpoints: 0 })
    expect(setting('certificate')).toBeNull()
    expect(label('plug')).toBe('No endpoints')
  })

  it('renames it, the name trimmed, then reads it and the list beside it again', async () => {
    await render()
    readProxy.mockResolvedValue({ ...GATEWAY, name: 'Office gateway' })
    await act(async () => inline[NAME].onSave('  Office gateway '))
    expect(renameProxy).toHaveBeenCalledWith('P1', { name: 'Office gateway' })
    expect(readProxy).toHaveBeenCalledTimes(2)
    expect(reloadList).toHaveBeenCalledTimes(1)
    expect($('[data-header]')?.textContent).toContain('Office gateway')
    expect($('[data-notice]')).toBeNull()
  })

  it('a new host label is checked as typed, says the host it moves to and what that does, and is saved as the label', async () => {
    await render()
    expect(inline[LABEL].validate('nas2')).toBeUndefined()
    expect(inline[LABEL].validate('')).toBe('Lower case letters and digits, at most 29')
    expect(inline[LABEL].validate('x'.repeat(30))).toBe('Lower case letters and digits, at most 29')
    expect(inline[LABEL].helper('nas2')).toBe(
      'Its host becomes nas2-acme-corp.dev.r3proxy.com: every endpoint’s address moves to it, and its certificate is issued again — https names fail until then.'
    )
    expect(inline[LABEL].helper('gw')).toBeFalsy()
    expect(inline[LABEL].helper('')).toBeFalsy()
    await act(async () => inline[LABEL].onSave('nas2'))
    expect(renameProxy).toHaveBeenCalledWith('P1', { label: 'nas2' })
    expect(readProxy).toHaveBeenCalledTimes(2)
    expect(reloadList).toHaveBeenCalledTimes(1)
  })

  it('a change refused is said in graphql’s words, or that it was not changed; one that goes through clears it', async () => {
    await render()
    renameProxy.mockResolvedValue({ reason: 'Nas2-acme-corp.dev.r3proxy.com is another proxy’s: choose another label' })
    await act(async () => inline[LABEL].onSave('nas2'))
    expect($('[data-notice="error"]')?.textContent).toBe(
      'Nas2-acme-corp.dev.r3proxy.com is another proxy’s: choose another label'
    )
    expect(readProxy).toHaveBeenCalledTimes(2)
    renameProxy.mockResolvedValue('ERROR')
    await act(async () => inline[NAME].onSave('Office gateway'))
    expect($('[data-notice="error"]')?.textContent).toBe('It was not changed: try again.')
    renameProxy.mockResolvedValue({ reason: '' })
    await act(async () => inline[NAME].onSave('Office gateway'))
    expect($('[data-notice="error"]')?.textContent).toBe('It was not changed: try again.')
    renameProxy.mockResolvedValue({})
    await act(async () => inline[NAME].onSave('Office gateway'))
    expect($('[data-notice]')).toBeNull()
  })

  it('a notice is closed by its own button', async () => {
    await render()
    renameProxy.mockResolvedValue({ reason: 'Not yours to rename' })
    await act(async () => inline[NAME].onSave('Office gateway'))
    await click($('[data-notice] [data-close]'))
    expect($('[data-notice]')).toBeNull()
  })

  it('sets how a device added goes into service; a refusal is said', async () => {
    await render()
    const select = $(`[data-select="${ACTIVATION}"]`)!
    expect([...select.querySelectorAll('[data-option]')].map(option => option.textContent)).toEqual([
      'By itself, once its checks pass',
      'When an admin puts it in service',
    ])
    await click(select.querySelector('[data-option="admin"]'))
    expect(setActivation).toHaveBeenCalledWith('P1', 'admin')
    expect(readProxy).toHaveBeenCalledTimes(2)
    setActivation.mockResolvedValue({ reason: 'Its activation is auto or admin' })
    await click($(`[data-select="${ACTIVATION}"] [data-option="auto"]`))
    expect($('[data-notice="error"]')?.textContent).toBe('Its activation is auto or admin')
  })

  it('while a change is being made, nothing else can be', async () => {
    await render(IDLE)
    const answer = held<any>()
    renameProxy.mockReturnValue(answer.promise)
    await act(async () => {
      void inline[NAME].onSave('Office gateway')
    })
    expect(inline[NAME].disabled).toBe(true)
    expect(inline[LABEL].disabled).toBe(true)
    expect($(`[data-select="${ACTIVATION}"]`)?.hasAttribute('data-disabled')).toBe(true)
    expect(($('[data-icon="plus"]') as HTMLButtonElement).disabled).toBe(true)
    expect(settingButton('arrow-right-arrow-left').disabled).toBe(true)
    expect(settingButton('trash').disabled).toBe(true)
    await act(async () => answer.release({}))
    expect(inline[NAME].disabled).toBe(false)
    expect(inline[LABEL].disabled).toBe(false)
    expect($(`[data-select="${ACTIVATION}"]`)?.hasAttribute('data-disabled')).toBe(false)
    expect(($('[data-icon="plus"]') as HTMLButtonElement).disabled).toBe(false)
    expect(settingButton('arrow-right-arrow-left').disabled).toBe(false)
    expect(settingButton('trash').disabled).toBe(false)
  })
})

describe('the devices a proxy runs on', () => {
  it('each with its actions in it, leading to the device’s page; what the device runs after one is said, and all read again', async () => {
    await render()
    const device = $('[data-runs-on] [data-run="D1"]')!
    expect(device.getAttribute('data-kind')).toBe('proxy')
    expect(device.getAttribute('data-name')).toBe('Gateway')
    expect(device.getAttribute('data-activation')).toBe('auto')
    expect(device.getAttribute('data-to')).toBe('/devices/D1/runs')
    expect(device.hasAttribute('data-manage')).toBe(true)
    await click(device.querySelector('[data-changed]'))
    expect($('[data-notice="info"]')?.textContent).toBe('Office Mac runs the proxy Gateway (draining).')
    expect(readProxy).toHaveBeenCalledTimes(2)
    expect(reloadList).toHaveBeenCalledTimes(1)
  })

  it('adds the devices chosen of its account, those running it aside, one after another; none refused, the picker closes', async () => {
    await render()
    expect($('[data-picker]')).toBeNull()
    const add = $('[data-runs-on] [data-icon="plus"]')!
    expect(add.textContent).toBe('Add devices')
    await click(add)
    const shown = $('[data-picker]')!
    expect(shown.getAttribute('data-picker')).toBe('proxy')
    expect(shown.getAttribute('data-owner')).toBe('ACCOUNT')
    expect(shown.getAttribute('data-exclude')).toBe('D1')
    picker.chosen = ['D2', 'D3']
    await click($('[data-picker] [data-add]'))
    expect(addDevice.mock.calls).toEqual([
      ['P1', 'D2'],
      ['P1', 'D3'],
    ])
    expect($('[data-picker]')).toBeNull()
    expect(readProxy).toHaveBeenCalledTimes(2)
    expect(reloadList).toHaveBeenCalledTimes(1)
  })

  it('a device refused is said in the picker, which stays to choose again; Cancel closes it, and the next opens clear', async () => {
    await render()
    addDevice.mockImplementation(async (_proxy: string, id: string) =>
      id === 'D3' ? { reason: 'Its machine is a client only' } : { runs: { proxy: null, exit: null } }
    )
    await click($('[data-icon="plus"]'))
    picker.chosen = ['D2', 'D3']
    await click($('[data-picker] [data-add]'))
    expect(addDevice).toHaveBeenCalledTimes(2)
    expect($('[data-picker]')?.getAttribute('data-refusals')).toBe('{"D3":"Its machine is a client only"}')
    const cancel = $('[data-runs-on] [data-icon="times"]')!
    expect(cancel.textContent).toBe('Cancel')
    await click(cancel)
    expect($('[data-picker]')).toBeNull()
    await click($('[data-icon="plus"]'))
    expect($('[data-picker]')?.getAttribute('data-refusals')).toBe('{}')
  })

  it('none runs it: says what becomes of its endpoints, or that one is needed to serve them', async () => {
    await render(IDLE)
    expect($('[data-runs-on]')?.textContent).toContain(
      'No device runs it: its endpoints keep their addresses, and work again once a device added is in service.'
    )
    await render({ ...IDLE, endpoints: 0 })
    expect($('[data-runs-on]')?.textContent).toContain('No device runs it: add one to serve its endpoints.')
  })
})

describe('deleting a proxy', () => {
  it('waits until no device runs it', async () => {
    await render()
    expect(settingButton('trash').disabled).toBe(true)
    expect(sublabel('trash')).toBe('Take its devices out of it first')
    await render(IDLE)
    expect(settingButton('trash').disabled).toBe(false)
    expect(sublabel('trash')).toBe('It is kept until it is deleted, with no device running it too')
  })

  it('says its endpoints go with it, confirms that to graphql, and leads back to the proxies', async () => {
    await render(IDLE)
    await click(settingButton('trash'))
    expect($('[data-confirm-title]')?.textContent).toBe('Delete Gateway?')
    expect($('[data-confirm]')?.textContent).toContain('Its 2 endpoints are removed, for everyone using one.')
    expect($('[data-confirm-action]')?.textContent).toBe('Delete')
    readProxy.mockResolvedValue(null)
    await click($('[data-confirm-action]'))
    expect(deleteProxy).toHaveBeenCalledWith('P1', true)
    expect(reloadList).toHaveBeenCalledTimes(1)
    expect(push).toHaveBeenCalledWith('/proxies')
  })

  it('with no endpoints: says nothing else changes, and asks graphql no confirm', async () => {
    await render({ ...IDLE, endpoints: 0 })
    await click(settingButton('trash'))
    expect($('[data-confirm]')?.textContent).toContain('It has no endpoints: nothing else changes.')
    await click($('[data-confirm-action]'))
    expect(deleteProxy).toHaveBeenCalledWith('P1', false)
    expect(push).toHaveBeenCalledWith('/proxies')
  })

  it('Cancel deletes nothing', async () => {
    await render(IDLE)
    await click(settingButton('trash'))
    await click($('[data-deny]'))
    expect($('[data-confirm]')).toBeNull()
    expect(deleteProxy).not.toHaveBeenCalled()
  })

  it('a delete refused is said on the page, which stays', async () => {
    await render(IDLE)
    deleteProxy.mockResolvedValue({ reason: 'A device was added to Gateway meanwhile: it is not deleted' })
    await click(settingButton('trash'))
    await click($('[data-confirm-action]'))
    expect($('[data-confirm]')).toBeNull()
    expect($('[data-notice="error"]')?.textContent).toBe('A device was added to Gateway meanwhile: it is not deleted')
    expect(push).not.toHaveBeenCalled()
    deleteProxy.mockResolvedValue('ERROR')
    await click(settingButton('trash'))
    await click($('[data-confirm-action]'))
    expect($('[data-notice="error"]')?.textContent).toBe('It was not deleted.')
    expect(push).not.toHaveBeenCalled()
  })
})

describe('moving a proxy’s endpoints', () => {
  it('offered once no device runs it and it has endpoints', async () => {
    await render()
    expect(setting('arrow-right-arrow-left')).toBeNull()
    await render({ ...IDLE, endpoints: 0 })
    expect(setting('arrow-right-arrow-left')).toBeNull()
    await render(IDLE)
    expect(label('arrow-right-arrow-left')).toBe('Move its endpoints to another proxy')
  })

  it('to another proxy of its account: each address before and after said first, then moved, and all read again', async () => {
    await render(IDLE)
    await click(settingButton('arrow-right-arrow-left'))
    expect(accountProxies).toHaveBeenCalledWith('ACCOUNT')
    expect($('[data-confirm-title]')?.textContent).toBe('Move the endpoints of Gateway')
    const picks = [...document.body.querySelectorAll('[data-pick]')]
    expect(picks.map(pick => pick.textContent)).toEqual([
      'Spare · sp-acme-corp.dev.r3proxy.com',
      'NAS · nas-acme-corp.dev.r3proxy.com',
    ])
    expect(($('[data-confirm-action]') as HTMLButtonElement).disabled).toBe(true)

    moveEndpoints.mockResolvedValue(MOVE)
    await click($('[data-pick="P2"]'))
    expect(moveEndpoints).toHaveBeenCalledWith('P1', 'P2', false)
    expect($('[data-choose]')?.getAttribute('data-value')).toBe('P2')
    const preview = [...document.body.querySelectorAll('[data-move-preview] li')].map(item => [
      item.querySelector('.MuiListItemText-primary')?.textContent,
      item.querySelector('.MuiListItemText-secondary')?.textContent,
    ])
    expect(preview).toEqual([
      ['https://web-sp-acme-corp.dev.r3proxy.com', 'was https://web-gw-acme-corp.dev.r3proxy.com'],
      ['sp-acme-corp.dev.r3proxy.com:30001', 'was gw-acme-corp.dev.r3proxy.com:30001'],
    ])
    expect(($('[data-confirm-action]') as HTMLButtonElement).disabled).toBe(false)

    moveEndpoints.mockResolvedValue({ ...MOVE, applied: true })
    await click($('[data-confirm-action]'))
    expect(moveEndpoints).toHaveBeenLastCalledWith('P1', 'P2', true)
    expect($('[data-confirm]')).toBeNull()
    expect(readProxy).toHaveBeenCalledTimes(2)
    expect(reloadList).toHaveBeenCalledTimes(1)
  })

  it('a clash is said in the dialog in graphql’s words, and the move cannot be made until another proxy is chosen', async () => {
    await render(IDLE)
    await click(settingButton('arrow-right-arrow-left'))
    moveEndpoints.mockResolvedValue({ reason: 'Port 30001 is taken on Spare' })
    await click($('[data-pick="P2"]'))
    expect($('[data-confirm] [data-notice="error"]')?.textContent).toBe('Port 30001 is taken on Spare')
    expect($('[data-move-preview]')).toBeNull()
    expect(($('[data-confirm-action]') as HTMLButtonElement).disabled).toBe(true)
    moveEndpoints.mockResolvedValue(MOVE)
    await click($('[data-pick="P3"]'))
    expect($('[data-confirm] [data-notice]')).toBeNull()
    expect(($('[data-confirm-action]') as HTMLButtonElement).disabled).toBe(false)
  })

  it('a move refused as it is made is said, and the dialog stays; one with no words says it could not be', async () => {
    await render(IDLE)
    await click(settingButton('arrow-right-arrow-left'))
    moveEndpoints.mockResolvedValue(MOVE)
    await click($('[data-pick="P2"]'))
    moveEndpoints.mockResolvedValue({ reason: 'An endpoint was made on Spare meanwhile: web clashes' })
    await click($('[data-confirm-action]'))
    expect($('[data-confirm] [data-notice="error"]')?.textContent).toBe(
      'An endpoint was made on Spare meanwhile: web clashes'
    )
    expect(($('[data-confirm-action]') as HTMLButtonElement).disabled).toBe(true)
    expect(readProxy).toHaveBeenCalledTimes(1)
    moveEndpoints.mockResolvedValue({ reason: '' })
    await click($('[data-pick="P3"]'))
    expect($('[data-confirm] [data-notice="error"]')?.textContent).toBe('The move could not be said: try again.')
  })

  // An answer for a proxy chosen before must not stand for the one chosen now, which the move is then made to.
  it('the addresses said are those of the proxy chosen last, whatever order the answers come in', async () => {
    await render(IDLE)
    await click(settingButton('arrow-right-arrow-left'))
    const toSpare = held<any>()
    const toNas = held<any>()
    moveEndpoints.mockReturnValueOnce(toSpare.promise).mockReturnValueOnce(toNas.promise)
    await click($('[data-pick="P2"]'))
    await click($('[data-pick="P3"]'))
    await act(async () =>
      toNas.release({
        addresses: [
          {
            endpoint: 'EP2',
            kind: 'tcp',
            from: 'gw-acme-corp.dev.r3proxy.com:30001',
            to: 'nas-acme-corp.dev.r3proxy.com:30001',
          },
        ],
        applied: false,
      })
    )
    await act(async () => toSpare.release(MOVE))
    expect($('[data-choose]')?.getAttribute('data-value')).toBe('P3')
    expect($('[data-move-preview]')?.textContent).toContain('nas-acme-corp.dev.r3proxy.com:30001')
    expect($('[data-move-preview]')?.textContent).not.toContain('sp-acme-corp')
  })

  it('its account with no other proxy: says none can take them; Cancel closes it', async () => {
    accountProxies.mockResolvedValue([IDLE])
    await render(IDLE)
    await click(settingButton('arrow-right-arrow-left'))
    expect($('[data-confirm]')?.textContent).toContain('Its account has no other proxy to take them.')
    expect($('[data-pick]')).toBeNull()
    expect(($('[data-confirm-action]') as HTMLButtonElement).disabled).toBe(true)
    await click($('[data-deny]'))
    expect($('[data-confirm]')).toBeNull()
    expect(moveEndpoints).not.toHaveBeenCalled()
  })
})

describe('a proxy that is not the account’s own, or not managed', () => {
  it('remote.it’s, for its admins: where it is reached, its activation, endpoints and devices; nothing to rename, add, move or delete', async () => {
    await render(PDX)
    expect($('[data-header]')?.textContent).toBe('remote.it pdx1aOne of remote.it’s proxies · pdx1a.dev.r3proxy.com')
    expect($('[data-inline]')).toBeNull()
    expect(label('globe')).toBe('pdx1a.dev.r3proxy.com')
    expect(sublabel('globe')).toBe('Where it is reached')
    for (const icon of ['earth-americas', 'certificate', 'users', 'arrow-right-arrow-left', 'trash'])
      expect(setting(icon)).toBeNull()
    expect($(`[data-select="${ACTIVATION}"]`)).not.toBeNull()
    expect(label('plug')).toBe('5 endpoints')
    expect($('[data-runs-on] [data-run="E1"]')).not.toBeNull()
    expect($('[data-icon="plus"]')).toBeNull()
  })

  it('one who does not manage it sees its name and host alone', async () => {
    const container = await render({ ...GATEWAY, manage: false, devices: null, endpoints: null, certificate: null })
    expect($('[data-header]')?.textContent).toBe('Gatewaygw-acme-corp.dev.r3proxy.com')
    expect(container.textContent).toBe('Gatewaygw-acme-corp.dev.r3proxy.com')
    expect($('[data-inline]')).toBeNull()
    expect($('[data-select]')).toBeNull()
    expect($('[data-runs-on]')).toBeNull()
  })

  it('another proxy opened is read anew, the notice and the picker of the one before gone', async () => {
    await render()
    renameProxy.mockResolvedValue({ reason: 'Not yours to rename' })
    await act(async () => inline[NAME].onSave('Office gateway'))
    await click($('[data-icon="plus"]'))
    expect($('[data-notice]')).not.toBeNull()
    expect($('[data-picker]')).not.toBeNull()
    params.proxyID = 'P2'
    readProxy.mockResolvedValue(SPARE)
    await act(async () => root!.render(<ProxyPage />))
    expect(readProxy).toHaveBeenLastCalledWith('P2')
    expect($('[data-header]')?.textContent).toBe('Sparesp-acme-corp.dev.r3proxy.com')
    expect($('[data-notice]')).toBeNull()
    expect($('[data-picker]')).toBeNull()
  })
})

describe('another proxy’s address, with a dialog open or an answer still to come', () => {
  it('closes the last proxy’s dialogs: none is left to act on the next one', async () => {
    await render(IDLE)
    await click(settingButton('trash'))
    expect($('[data-confirm-title]')?.textContent).toBe('Delete Gateway?')
    params.proxyID = 'P2'
    readProxy.mockResolvedValue(SPARE)
    await act(async () => root!.render(<ProxyPage />))
    expect($('[data-header]')?.textContent).toContain('Spare')
    expect($('[data-confirm]')).toBeNull()
    expect(deleteProxy).not.toHaveBeenCalled()
  })

  it('shows the proxy at its address, whichever read is answered first', async () => {
    const answers: Record<string, (proxy: any) => void> = {}
    readProxy.mockImplementation((id: string) => new Promise(resolve => (answers[id] = resolve)))
    await mount()
    params.proxyID = 'P2'
    await act(async () => root!.render(<ProxyPage />))
    await act(async () => answers.P2(SPARE))
    await act(async () => answers.P1(IDLE))
    expect($('[data-header]')?.textContent).toContain('Spare')
  })

  it('a read answered late after a newer one is not shown over it', async () => {
    await render()
    const answers: ((proxy: any) => void)[] = []
    readProxy.mockImplementation(() => new Promise(resolve => answers.push(resolve)))
    // Two actions on its device, each reading the proxy again.
    await click($('[data-run="D1"] [data-changed]'))
    await click($('[data-run="D1"] [data-changed]'))
    expect(answers).toHaveLength(2)
    await act(async () => answers[1]({ ...GATEWAY, name: 'Newest' }))
    await act(async () => answers[0]({ ...GATEWAY, name: 'Older' }))
    expect($('[data-header]')?.textContent).toContain('Newest')
  })
})

describe('saving a proxy’s name or host label', () => {
  it('as it was: nothing sent — a label sent again would move its host to the account’s slug', async () => {
    await render()
    await act(async () => inline[LABEL].onSave('gw'))
    await act(async () => inline[NAME].onSave(' Gateway '))
    expect(renameProxy).not.toHaveBeenCalled()
    await act(async () => inline[LABEL].onSave('gw2'))
    expect(renameProxy).toHaveBeenCalledWith('P1', { label: 'gw2' })
  })

  it('a new label’s host is said under the account’s slug as it is now, as graphql makes it', async () => {
    vi.mocked(post).mockImplementation(async (body: any) =>
      body.query.includes('accountSlug') ? ({ data: { data: { accountSlug: 'acme' } }, headers: {} } as any) : 'ERROR'
    )
    await render()
    expect(inline[LABEL].helper('nas2')).toContain('Its host becomes nas2-acme.dev.r3proxy.com:')
    vi.mocked(post).mockReset()
  })

  it('the host a label gives: under the slug given, else the one in its host', () => {
    expect(hostWith('gw-acme-corp.dev.r3proxy.com', 'nas', 'acme')).toBe('nas-acme.dev.r3proxy.com')
    expect(hostWith('gw-acme-corp.dev.r3proxy.com', 'nas', null)).toBe('nas-acme-corp.dev.r3proxy.com')
  })
})

describe('moving the endpoints, read or made amiss', () => {
  it('its account’s proxies not read: said so, not that none can take them', async () => {
    accountProxies.mockResolvedValue('ERROR')
    await render(IDLE)
    await click(settingButton('arrow-right-arrow-left'))
    expect($('[data-confirm] [data-notice="error"]')?.textContent).toBe(
      'Its account’s proxies could not be read: try again.'
    )
    expect($('[data-confirm]')?.textContent).not.toContain('no other proxy')
  })

  it('a move refused as it is made, with no words, says it was not made', async () => {
    await render(IDLE)
    await click(settingButton('arrow-right-arrow-left'))
    moveEndpoints.mockResolvedValue(MOVE)
    await click($('[data-pick="P2"]'))
    moveEndpoints.mockResolvedValue({ reason: '' })
    await click($('[data-confirm-action]'))
    expect($('[data-confirm] [data-notice="error"]')?.textContent).toBe('The move was not made: try again.')
  })
})

