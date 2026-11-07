import React, { act } from 'react'
import { createRoot } from 'react-dom/client'
import { describe, it, expect, vi, beforeEach } from 'vitest'

const { deviceRuns, settings, admin } = vi.hoisted(() => ({
  deviceRuns: vi.fn(async (_id: string) => null as any),
  settings: { proxy: undefined as any, reload: vi.fn(async () => {}) },
  admin: { is: false },
}))
vi.mock('react-redux', () => ({ useSelector: (select: any) => select({}) }))
vi.mock('../selectors/state', () => ({ getUserAdmin: () => admin.is }))
vi.mock('react-i18next', () => {
  const fill = (text: string, values?: any) => text.replace(/{{(\w+)}}/g, (_, k) => values?.[k] ?? '')
  return {
    useTranslation: () => ({
      t: (_key: string, a: any, b?: any) =>
        typeof a === 'string' ? fill(a, b) : fill(a.count === 1 ? a.defaultValue_one : a.defaultValue_other, a),
    }),
  }
})
vi.mock('../services/Context', async () => ({ DeviceContext: (await import('react')).createContext({}) }))
vi.mock('../services/graphQLDaemon', () => ({ UNSUPPORTED: 'UNSUPPORTED' }))
vi.mock('../services/graphQLDeviceRuns', () => ({ graphQLDeviceRuns: deviceRuns }))
vi.mock('../services/post', () => ({ post: vi.fn() }))
vi.mock('../services/graphQL', () => ({ graphQLBasicRequest: vi.fn(), graphQLGetErrors: vi.fn() }))
vi.mock('../components/DeviceSettingRow', () => ({ CONFIGURATION: 'configuration' }))
vi.mock('../hooks/useDeviceSettings', () => ({
  useDeviceSettings: () => ({ setting: (name: string) => (name === 'proxy' ? settings.proxy : undefined), reload: settings.reload }),
}))
vi.mock('../components/DeviceHeaderMenu', () => ({ DeviceHeaderMenu: ({ children }: any) => <>{children}</> }))
vi.mock('../components/ProxyAccessList', () => ({
  ProxyAccessList: ({ scope }: any) => <div data-visitors={scope.deviceId} />,
}))
vi.mock('../components/ListItemSetting', () => ({ ListItemSetting: ({ label }: any) => <div data-setting>{label}</div> }))
vi.mock('../components/LoadingMessage', () => ({ LoadingMessage: () => <div data-loading /> }))
vi.mock('../components/Gutters', () => ({ Gutters: ({ children }: any) => <>{children}</> }))
vi.mock('../components/Notice', () => ({ Notice: ({ children }: any) => <div data-notice>{children}</div> }))
vi.mock('../components/Icon', () => ({ Icon: () => null }))
// A proxy or exit the device runs: what it was given, and an action on it answering what the device runs after.
vi.mock('../components/RunListItem', () => ({
  RunListItem: ({ kind, title, to, manage, onChanged, run, lan }: any) => (
    <div data-run={kind} data-to={to ?? ''} data-manage={manage ? 'yes' : 'no'} data-lan={lan ? 'yes' : 'no'}>
      {title}
      <button data-act={kind} onClick={() => onChanged(AFTER, { id: run.id, name: 'Office Mac' })} />
    </div>
  ),
}))
vi.mock('../components/RunActions', () => ({
  RunActions: ({ scope, onDone }: any) => <button data-everything={scope} onClick={() => onDone(NOTHING)} />,
}))
vi.mock('../components/MakeRunDialog', () => ({
  MakeRunDialog: ({ kind, device, onDone }: any) => (
    <button data-make-dialog={kind} data-owner={device.ownerId} onClick={() => onDone(JOINING)} />
  ),
}))

import { DeviceRunsPage, proxyListeningLine } from './DeviceRunsPage'
import { DeviceContext } from '../services/Context'
import type { DeviceSetting, DeviceSettingControl } from '../services/graphQLDeviceSettings'
;(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true

const exitRun = (fields: any = {}) => ({
  id: 'MAC',
  name: 'Office Mac',
  state: 'ACTIVE',
  joining: false,
  checks: [],
  exit: { id: 'xha', name: 'HA Derby', remoteit: false },
  ...fields,
})
const proxyRun = (fields: any = {}) => ({
  id: 'MAC',
  name: 'Office Mac',
  state: 'ACTIVE',
  joining: false,
  checks: [],
  proxy: { id: 'P-OWN', name: 'Remote-Dragon', host: 'test-evan.solo.r3proxy.com', remoteit: false },
  ...fields,
})
const BOTH = { exit: exitRun(), proxy: proxyRun() }
const AFTER = { exit: exitRun({ state: 'DRAINING' }), proxy: proxyRun() }
const NOTHING = { exit: null, proxy: null }
const JOINING = { exit: exitRun({ state: 'RETIRED', joining: true }), proxy: null }
const MAC = { id: 'MAC', name: 'Office Mac', permissions: ['VIEW', 'MANAGE'], shared: false, owner: { id: 'ACCOUNT' } }

const find = (selector: string) => document.body.querySelector(selector) as HTMLElement

async function render(device: any = MAC) {
  document.body.innerHTML = ''
  const container = document.createElement('div')
  document.body.appendChild(container)
  await act(async () =>
    createRoot(container).render(
      <DeviceContext.Provider value={{ device } as any}>
        <DeviceRunsPage />
      </DeviceContext.Provider>
    )
  )
  await act(async () => {})
  return container
}

beforeEach(() => {
  admin.is = false
  settings.proxy = undefined
  settings.reload.mockClear()
  deviceRuns.mockReset().mockResolvedValue(BOTH)
})

describe('what a device runs', () => {
  it('the exit and the proxy it runs, each linked to its page, with its actions for whoever manages it', async () => {
    await render()
    expect(deviceRuns).toHaveBeenCalledWith('MAC')
    expect(find('[data-run="exit"]').textContent).toBe('Exit HA Derby')
    expect(find('[data-run="exit"]').getAttribute('data-to')).toBe('/exits/xha')
    expect(find('[data-run="proxy"]').textContent).toBe('Proxy Remote-Dragon')
    expect(find('[data-run="proxy"]').getAttribute('data-to')).toBe('/proxies/P-OWN')
    expect(find('[data-run="exit"]').getAttribute('data-manage')).toBe('yes')
    // Its own exit's LAN is set here; remote.it's reach no network of theirs.
    expect(find('[data-run="exit"]').getAttribute('data-lan')).toBe('yes')
    expect(find('[data-everything]').getAttribute('data-everything')).toBe('device')
    expect(find('[data-visitors]').getAttribute('data-visitors')).toBe('MAC')
    expect(find('[data-make]')).toBeNull()
  })

  it('an action on one of them says what the device runs after, and reads it again', async () => {
    await render()
    deviceRuns.mockResolvedValue(AFTER)
    await act(async () => find('[data-act="exit"]').click())
    expect(find('[data-notice]').textContent).toBe(
      'Office Mac runs the proxy Remote-Dragon (in service) and the exit HA Derby (draining).'
    )
    expect(deviceRuns).toHaveBeenCalledTimes(2)
    // Its proxy's listening follows what it runs.
    expect(settings.reload).toHaveBeenCalled()
  })

  it('the device’s actions on everything it runs say what is left after', async () => {
    await render()
    await act(async () => find('[data-everything]').click())
    expect(find('[data-notice]').textContent).toBe('Office Mac runs no proxy or exit now.')
  })

  it('one it does not run: "Make this device an exit", in its own account, saying what it runs after', async () => {
    deviceRuns.mockResolvedValue(NOTHING)
    await render()
    expect(find('[data-not-running="exit"]').textContent).toContain('No exit')
    expect(find('[data-not-running="proxy"]').textContent).toContain('No proxy')
    // Nothing to act on, and no visitors to show.
    expect(find('[data-everything]')).toBeNull()
    expect(find('[data-visitors]')).toBeNull()
    await act(async () => find('[data-make="exit"]').click())
    expect(find('[data-make-dialog]').getAttribute('data-make-dialog')).toBe('exit')
    expect(find('[data-make-dialog]').getAttribute('data-owner')).toBe('ACCOUNT')
    await act(async () => find('[data-make-dialog]').click())
    expect(find('[data-notice]').textContent).toBe('Office Mac runs the exit HA Derby (joining).')
  })

  it('"Make this device a proxy" too', async () => {
    deviceRuns.mockResolvedValue({ exit: exitRun(), proxy: null })
    await render()
    expect(find('[data-make="exit"]')).toBeNull()
    await act(async () => find('[data-make="proxy"]').click())
    expect(find('[data-make-dialog]').getAttribute('data-make-dialog')).toBe('proxy')
  })

  it('remote.it’s link to the admin page, for an admin only', async () => {
    const remoteit = {
      exit: exitRun({ exit: { id: 'pdx1a', name: 'remote.it pdx1a', remoteit: true } }),
      proxy: proxyRun({ proxy: { id: 'P1', name: 'remote.it pdx1a', host: 'pdx1a-r3.solo.r3proxy.com', remoteit: true } }),
    }
    deviceRuns.mockResolvedValue(remoteit)
    admin.is = true
    await render()
    expect(find('[data-run="exit"]').getAttribute('data-to')).toBe('/admin/proxies?view=exits')
    expect(find('[data-run="exit"]').getAttribute('data-lan')).toBe('no')
    expect(find('[data-run="proxy"]').getAttribute('data-to')).toBe('/admin/proxies?view=proxies')
    admin.is = false
    await render()
    expect(find('[data-run="exit"]').getAttribute('data-to')).toBe('')
  })

  it('one who may not manage it: neither making nor acting', async () => {
    deviceRuns.mockResolvedValue(NOTHING)
    await render({ ...MAC, permissions: ['VIEW', 'CONNECT'] })
    expect(find('[data-make]')).toBeNull()
    // graphql says what a device runs to its managers alone.
    deviceRuns.mockResolvedValue(null)
    expect((await render({ ...MAC, permissions: ['VIEW'] })).textContent).toContain(
      'What a device runs is seen by those who manage it.'
    )
  })

  it('an API without proxies and exits, or a failed read: said', async () => {
    deviceRuns.mockResolvedValue('UNSUPPORTED')
    expect((await render()).textContent).toContain('This server does not have proxies and exits.')
    deviceRuns.mockResolvedValue('ERROR')
    expect((await render()).textContent).toContain('What it runs could not be read.')
  })

  it('a proxy that is not listening says why', async () => {
    settings.proxy = { name: 'proxy', value: false, at: null, by: null, onDevice: false, control: 'off' }
    await render()
    expect(find('[data-setting]').textContent).toBe('Not listening: turned off on the device by its administrator')
  })
})

const proxySetting = (
  value: boolean,
  control: DeviceSettingControl,
  more: Partial<DeviceSetting> = {}
): DeviceSetting => ({
  name: 'proxy',
  value,
  at: '2026-10-05T17:04:05.123Z',
  by: null,
  onDevice: false,
  control,
  ...more,
})
const t = ((_key: string, text: string, values?: any) => text.replace(/{{(\w+)}}/g, (_, k) => values?.[k] ?? '')) as any

describe('a proxy’s listening, where it disagrees with its running one', () => {
  it('none where they agree, or where the API has no device settings', () => {
    expect(proxyListeningLine(t, true, proxySetting(true, 'cloud+local'))).toBeUndefined()
    expect(proxyListeningLine(t, false, proxySetting(false, 'cloud+local'))).toBeUndefined()
    expect(proxyListeningLine(t, true, undefined)).toBeUndefined()
  })

  it('running a proxy and not listening: why, from its control and who set it on the device', () => {
    expect(proxyListeningLine(t, true, proxySetting(true, 'off'))).toBe(
      'Not listening: turned off on the device by its administrator'
    )
    expect(proxyListeningLine(t, true, proxySetting(false, 'local', { onDevice: true, by: 'bob' }))).toBe(
      'Not listening: set only on the device, which keeps it off'
    )
    expect(proxyListeningLine(t, true, proxySetting(false, 'cloud+local', { onDevice: true, by: 'bob' }))).toBe(
      'Not listening: turned off on the device by bob'
    )
    expect(
      proxyListeningLine(t, true, proxySetting(false, 'cloud+local', { onDevice: true, by: 'configuration' }))
    ).toBe("Not listening: turned off in the device's configuration")
  })

  it('listening, though it runs no proxy', () => {
    expect(proxyListeningLine(t, false, proxySetting(false, 'on'))).toBe(
      'Listening, though not a proxy: turned on on the device by its administrator'
    )
    expect(proxyListeningLine(t, false, proxySetting(true, 'cloud+local', { onDevice: true, by: 'bob' }))).toBe(
      'Listening, though not a proxy: turned on on the device by bob'
    )
  })
})
