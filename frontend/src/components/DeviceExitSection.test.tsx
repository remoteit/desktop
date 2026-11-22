import React, { act } from 'react'
import { createRoot } from 'react-dom/client'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { DeviceExit } from '../services/graphQLExits'

const { deviceExit, offered, protect, setExit, setRoute, keeps, usageHint, settings, reload, fetchSingleFull } =
  vi.hoisted(() => ({
    settings: vi.fn((_deviceId?: string) => [] as any[]),
    reload: vi.fn(async () => {}),
    deviceExit: vi.fn(async (_deviceId: string) => null as any),
    offered: vi.fn(async (_deviceId?: string) => [] as any),
    protect: vi.fn(async (_deviceId: string) => null as any),
    setExit: vi.fn(async (_deviceId: string, _via: string | null) => ({} as any)),
    setRoute: vi.fn(async (_deviceId: string, _via: string) => ({} as any)),
    keeps: vi.fn(async () => true),
    fetchSingleFull: vi.fn(),
    // How the hint reads the usage is TransferUsage.test.tsx's: here, whose transfer it is and whether it is shown.
    usageHint: vi.fn((_accountId: string | undefined, _kind: string, shown: boolean) =>
      shown ? { text: '8.2 of 10 GB this month', over: false } : null
    ),
  }))
vi.mock('../services/graphQLExits', () => ({
  graphQLDeviceExit: deviceExit,
  graphQLDeviceProtect: protect,
  graphQLOfferedExits: offered,
  graphQLSetDeviceExit: setExit,
}))
vi.mock('../services/deviceProtect', () => ({
  keepProtectServed: keeps,
  graphQLSetDeviceRoute: setRoute,
}))
vi.mock('../store', () => ({ dispatch: { devices: { fetchSingleFull } } }))
vi.mock('../hooks/useDeviceSettings', () => ({
  useDeviceSettings: (deviceId?: string) => ({
    setting: (name: string) => settings(deviceId).find(s => s.name === name),
    reload,
  }),
}))
vi.mock('../services/post', () => ({ post: vi.fn() }))
vi.mock('../services/graphQL', () => ({
  graphQLBasicRequest: vi.fn(),
  graphQLGetErrors: vi.fn(),
  graphQLRequestWithReason: vi.fn(),
  refusalOf: (result: any) => (result === 'ERROR' ? '' : result && 'reason' in result ? result.reason : undefined),
}))
vi.mock('./TransferUsage', () => ({
  useTransferUsageHint: usageHint,
  TransferUsageHintText: ({ hint }: any) => <p data-usage>{hint.text}</p>,
}))
vi.mock('./Notice', () => ({
  Notice: ({ children, onClose }: any) => (
    <div data-notice>
      {children}
      {onClose && <button data-close onClick={onClose} />}
    </div>
  ),
}))
// A row: its label and sub-label, and its switch (if any) — not clickable while disabled, as the real one.
vi.mock('./ListItemSetting', () => ({
  ListItemSetting: ({ icon, iconColor, label, subLabel, toggle, disabled, onClick }: any) => (
    <div data-item={icon} data-color={iconColor}>
      <span data-label>{label}</span>
      {subLabel ? <span data-sub> — {subLabel}</span> : null}
      {toggle !== undefined ? (
        <button data-toggle data-on={String(!!toggle)} disabled={!!disabled} onClick={onClick} />
      ) : null}
    </div>
  ),
}))
// The picker: its value, whether it is disabled, the lines under it, and each option a button that picks it —
// clickable even while disabled, so the component's own guard is what is tested.
vi.mock('./SelectSetting', () => ({
  SelectSetting: ({ disabled, value, values, helperText, onChange }: any) => (
    <div data-select data-value={value} data-disabled={String(!!disabled)}>
      {values.map((each: any) => (
        <button
          key={each.key}
          data-choice={each.key}
          data-description={each.description ?? ''}
          data-off={String(!!each.disabled)}
          onClick={() => onChange(each.key)}
        >
          {each.name}
        </button>
      ))}
      <div data-helper>{helperText}</div>
    </div>
  ),
}))
vi.mock('react-i18next', () => {
  const fill = (text: string, values?: any) => text.replace(/{{(\w+)}}/g, (_, k) => values?.[k] ?? '')
  return {
    useTranslation: () => ({
      t: (_key: string, a: any, b?: any) =>
        typeof a === 'string' ? fill(a, b) : fill(a.count === 1 ? a.defaultValue_one : a.defaultValue_other, a),
    }),
  }
})

import {
  DeviceExitChoice,
  choiceName,
  choiceOf,
  chosenLine,
  exitErrorLine,
  lentLine,
  policyLine,
  protectState,
  statusLine,
} from './DeviceExitSection'
;(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true

const t = ((_key: string, text: string, values?: any) => text.replace(/{{(\w+)}}/g, (_, k) => values?.[k] ?? '')) as any

const OWNER = { id: 'OWNER', email: 'owner@example.com' }
const PAT = { id: 'PAT', email: 'pat@example.com' }
const NED = { id: 'NED', email: 'ned@example.com' }
// Each as exits(deviceId) offers it, with why: remote.it's by plan, the account's own, one shared with the person
// choosing, and one the device's network gives it.
const pdx = { id: 'pdx1a', name: 'remote.it pdx1a', remoteit: true, owner: null, reasons: ['PLAN'] as any }
const office = { id: 'xoffice', name: 'Office', remoteit: false, owner: OWNER, reasons: ['OWN'] as any }
const pats = { id: 'xpat', name: 'Pat exit', remoteit: false, owner: PAT, reasons: ['SHARED'] as any }
const router = { id: 'xrouter', name: 'Home router', remoteit: false, owner: NED, reasons: ['NETWORK'] as any }
const spare = { id: 'xspare', name: 'Spare', remoteit: false, owner: OWNER, reasons: ['OWN'] as any }

// An exit as a device uses it: offered, and not dormant, unless said.
const uses = (exit: typeof office | typeof pdx, fields: { offered?: boolean; dormant?: boolean } = {}) => ({
  ...exit,
  offered: true,
  dormant: false,
  ...fields,
})

const none: DeviceExit = {
  usesExit: null,
  usesExitThrough: null,
  exitDormant: false,
  exitSetOnDevice: null,
  exitSetOnDeviceBy: null,
  exitSetBy: null,
  exitPolicy: 'cloud+local',
  exitAllowed: null,
  exitPinned: null,
}
const exitOf = (fields: Partial<DeviceExit> = {}): DeviceExit => ({ ...none, ...fields })

async function render(permissions = ['VIEW', 'MANAGE']) {
  document.body.innerHTML = ''
  const container = document.createElement('div')
  document.body.appendChild(container)
  const device = { id: 'LAPTOP', name: 'Laptop', permissions, owner: OWNER, accountId: 'OWNER' } as any
  await act(async () => createRoot(container).render(<DeviceExitChoice device={device} />))
  return container
}
const click = async (element: Element | null | undefined) => act(async () => (element as HTMLElement).click())
const select = (page: HTMLElement) => page.querySelector('[data-select]') as HTMLElement
const choices = (page: HTMLElement) =>
  [...page.querySelectorAll('[data-choice]')].map(each => `${each.getAttribute('data-choice')}=${each.textContent}`)
const choice = (page: HTMLElement, key: string) => page.querySelector(`[data-choice="${key}"]`)
// Each choice's line under it, and whether it may be chosen.
const described = (page: HTMLElement) =>
  [...page.querySelectorAll('[data-choice]')].map(
    each =>
      `${each.getAttribute('data-choice')}=${each.getAttribute('data-description')}${
        each.getAttribute('data-off') === 'true' ? ' (off)' : ''
      }`
  )
const notice = (page: HTMLElement) => page.querySelector('[data-notice]')?.textContent ?? null
const helper = (page: HTMLElement) => select(page)?.querySelector('[data-helper]')?.textContent ?? ''
const helperLines = (page: HTMLElement) =>
  [...(select(page)?.querySelectorAll('[data-helper] > span') ?? [])].map(line => line.textContent)
// Route through's state, first under it; then who set it, and why it is held.
const routeStatus = (page: HTMLElement) => helperLines(page)[0] ?? null
const lines = (page: HTMLElement) => helperLines(page).slice(1)

beforeEach(() => {
  deviceExit.mockReset().mockResolvedValue(exitOf())
  offered.mockReset().mockResolvedValue([pdx, office, pats, router])
  protect.mockReset().mockResolvedValue(null)
  setExit.mockReset().mockResolvedValue({})
  setRoute.mockReset().mockResolvedValue({})
  keeps.mockReset().mockResolvedValue(true)
  fetchSingleFull.mockReset()
  reload.mockClear()
  usageHint.mockClear()
  settings.mockReset().mockReturnValue([])
})

// Protect on: graphql's exit in use. Off: the route the device keeps (about.protect).
const on = (exit: any = office, fields: Partial<DeviceExit> = {}) => exitOf({ usesExit: uses(exit), ...fields })
const offWith = (route: string, routeName: string | null = null) =>
  protect.mockResolvedValue({ on: false, route, routeName })

describe('Route through, one control', () => {
  it('Off, then the exits offered for the device, named by why, each with its devices counted', async () => {
    const two = { devices: 2, carrying: 2, healthy: 2, draining: 0 }
    offered.mockResolvedValue([{ ...pdx, serving: two }, office, pats, router])
    const page = await render()
    expect(page.querySelector('[data-item="shield"]')).toBeNull() // no separate switch
    expect(select(page).dataset.value).toBe('')
    expect(choices(page)).toEqual([
      '=Off',
      'pdx1a=remote.it pdx1a',
      'xoffice=Office',
      'xpat=Pat exit · pat@example.com’s',
      'xrouter=Home router · chosen by a network',
    ])
    expect(described(page)[1]).toBe('pdx1a=2 devices')
    expect(routeStatus(page)).toBe('Off. Traffic goes out directly.')
  })

  it('on: the exit chosen, and what goes through it, in words', async () => {
    deviceExit.mockResolvedValue(on(office, { usesExitThrough: { id: 'MAC', name: 'Office Mac' } }))
    const page = await render()
    expect(select(page).dataset.value).toBe('xoffice')
    expect(routeStatus(page)).toBe('All traffic goes through Office (device Office Mac).')
  })

  it('choosing an exit routes through it; Off stops; the device read again', async () => {
    offWith('xoffice', 'Office')
    let page = await render()
    // Off, though the device keeps an exit for next time.
    expect(select(page).dataset.value).toBe('')
    await click(choice(page, 'pdx1a'))
    expect(setExit).toHaveBeenLastCalledWith('LAPTOP', 'pdx1a')
    expect(fetchSingleFull).toHaveBeenCalledWith({ id: 'LAPTOP', accountId: 'OWNER', silent: true })
    expect(reload).toHaveBeenCalled()

    deviceExit.mockResolvedValue(on(office))
    page = await render()
    await click(choice(page, ''))
    expect(setExit).toHaveBeenLastCalledWith('LAPTOP', null)
    // The same choice again sends nothing.
    setExit.mockClear()
    await click(choice(page, 'xoffice'))
    expect(setExit).not.toHaveBeenCalled()
    expect(setRoute).not.toHaveBeenCalled()
  })

  it('a refusal in graphql’s words, or that nothing was changed; gone when closed', async () => {
    setExit.mockResolvedValue({ reason: 'That exit is not offered to this device' })
    let page = await render()
    await click(choice(page, 'xoffice'))
    expect(notice(page)).toBe('That exit is not offered to this device')
    expect(fetchSingleFull).not.toHaveBeenCalled()
    await click(page.querySelector('[data-close]'))
    expect(notice(page)).toBeNull()
    setExit.mockResolvedValue('ERROR')
    page = await render()
    await click(choice(page, 'xoffice'))
    expect(notice(page)).toBe('Couldn’t change Route through. Try again.')
  })

  it('while a change is being made, the control is disabled and nothing else is sent', async () => {
    let finish: (value: any) => void = () => {}
    setExit.mockImplementation(() => new Promise(resolve => (finish = resolve)))
    const page = await render()
    await click(choice(page, 'xoffice'))
    expect(select(page).dataset.disabled).toBe('true')
    await click(choice(page, 'pdx1a'))
    expect(setExit).toHaveBeenCalledTimes(1)
    await act(async () => finish({}))
    expect(select(page).dataset.disabled).toBe('false')
  })

  it('the exit not working on the device: said first, in the device’s words', async () => {
    deviceExit.mockResolvedValue(on(office, { exitError: { code: 'routes-failed', message: FAILED, at: null } }))
    let page = await render()
    expect(routeStatus(page)).toBe('Exit not working on this device. Traffic goes out directly.')
    expect(helper(page)).toContain(FAILED)
    deviceExit.mockResolvedValue(on(office, { exitError: { code: 'routes-held', message: HELD, at: null } }))
    page = await render()
    expect(routeStatus(page)).toBe('Exit not working on this device. Traffic is blocked.')
  })

  it('waiting for its exit: dormant, or none of its devices taking its traffic', async () => {
    deviceExit.mockResolvedValue(on(office, { exitDormant: true }))
    expect(routeStatus(await render())).toBe(
      'Waiting for exit. Office has no device available, so traffic goes out directly.'
    )
    deviceExit.mockResolvedValue(exitOf({ usesExit: uses(office, { offered: false }) }))
    expect(routeStatus(await render())).toBe('Waiting for exit. Traffic is blocked until a device of Office takes it.')
  })

  it('a route no longer offered still shows, as itself; one the administrator does not allow is listed, not chosen', async () => {
    deviceExit.mockResolvedValue(on(spare, { exitAllowed: ['xoffice'] }))
    const page = await render()
    expect(choices(page)).toContain('xspare=Spare')
    expect(described(page)).toContain('pdx1a=Not allowed by this device’s administrator (off)')
    expect(described(page)).toContain('xoffice=')
  })

  it('no exits for the device: Off alone, said so', async () => {
    offered.mockResolvedValue([])
    const page = await render()
    expect(choices(page)).toEqual(['=Off'])
    expect(helper(page)).toContain('No exits for this device yet.')
  })
})

describe('who set it, and what the administrator holds', () => {
  const protectSet = (fields: any) =>
    settings.mockReturnValue([
      { name: 'protect', value: false, at: null, by: null, onDevice: false, control: 'cloud+local', ...fields },
    ])

  it('who chose the exit, and whose exit the device goes through', async () => {
    deviceExit.mockResolvedValue(
      on(pats, { exitSetOnDevice: true, exitSetOnDeviceBy: 'pat', exitSetOnDeviceSignedIn: PAT, exitThroughPerson: PAT })
    )
    expect(lines(await render())).toEqual([
      'Set on the device by pat@example.com, until pat@example.com signs out',
      'The whole device goes through Pat exit, pat@example.com’s exit',
    ])
    deviceExit.mockResolvedValue(on(office, { exitSetBy: { email: 'ann@example.com' } }))
    expect(lines(await render())).toEqual(['Set in Remote.It by ann@example.com'])
  })

  it('held by the protect setting’s control: read-only, saying so', async () => {
    for (const [control, line] of [
      ['off', 'Turned off on the device by its administrator'],
      ['on', 'Turned on on the device by its administrator'],
      ['local', 'Set only on the device'],
    ]) {
      protectSet({ control })
      const page = await render()
      expect(select(page).dataset.disabled).toBe('true')
      expect(lines(page)).toContain(line)
    }
  })

  it('the exit kept local, or one fixed: read-only, the reason said', async () => {
    deviceExit.mockResolvedValue(on(office, { exitSetOnDevice: true, exitSetOnDeviceBy: 'bob', exitPolicy: 'local' }))
    let page = await render()
    expect(select(page).dataset.disabled).toBe('true')
    expect(lines(page)).toEqual([
      'Set on the device by bob',
      'Set on the device only. Its administrator keeps the exit local.',
    ])
    expect(page.querySelector('[data-item="lock"]')?.textContent).toContain(
      'The exit is chosen on the device only. Remote.It can’t change it.'
    )
    deviceExit.mockResolvedValue(on(office, { exitPinned: 'xoffice' }))
    page = await render()
    expect(select(page).dataset.disabled).toBe('true')
    expect(lines(page)).toContain('Set by this device’s administrator')
    expect(page.querySelector('[data-item="lock"]')?.textContent).toContain(
      'Fixed by this device’s administrator to xoffice'
    )
  })

  it('no exit allowed: read-only while off; while on, Off alone may be chosen', async () => {
    deviceExit.mockResolvedValue(exitOf({ exitPolicy: 'never' }))
    let page = await render()
    expect(select(page).dataset.disabled).toBe('true')
    expect(page.querySelector('[data-item="lock"]')?.textContent).toContain('This device’s administrator allows no exit')
    deviceExit.mockResolvedValue(on(office, { exitPolicy: 'never' }))
    page = await render()
    expect(select(page).dataset.disabled).toBe('false')
    expect(described(page).filter(each => each.endsWith('(off)')).length).toBe(choices(page).length - 1)
    await click(choice(page, ''))
    expect(setExit).toHaveBeenLastCalledWith('LAPTOP', null)
  })
})

describe('one who does not manage the device', () => {
  it('sees Route through as the device says it, read-only, and why; nothing sent', async () => {
    protect.mockResolvedValue({ on: true, route: 'pdx1a', routeName: 'remote.it pdx1a' })
    let page = await render(['VIEW'])
    expect(routeStatus(page)).toBe('All traffic goes through remote.it pdx1a.')
    expect(select(page).dataset.disabled).toBe('true')
    expect(select(page).dataset.value).toBe('pdx1a')
    expect(lines(page)).toContain('Only someone who manages this device can change Route through.')
    offWith('xoffice', 'Office')
    page = await render(['VIEW'])
    expect(routeStatus(page)).toBe('Off. Traffic goes out directly.')
    await click(choice(page, 'xpat'))
    expect(setExit).not.toHaveBeenCalled()
  })
})

describe('nothing shown', () => {
  it('where the API has no device exits or the device’s exit cannot be read, and nothing more is asked', async () => {
    for (const answer of ['UNSUPPORTED', 'ERROR', null]) {
      deviceExit.mockClear().mockResolvedValue(answer)
      offered.mockClear()
      protect.mockClear()
      expect((await render()).textContent).toBe('')
      expect(deviceExit).toHaveBeenCalledWith('LAPTOP')
      expect(offered).not.toHaveBeenCalled()
      expect(protect).not.toHaveBeenCalled()
    }
  })
})

describe('the account’s transfer this month, under the picker', () => {
  const usage = (page: HTMLElement) => page.querySelector('[data-usage]')?.textContent ?? null

  it('routed through one of Remote.It’s exits: the device owner’s; nothing while off', async () => {
    deviceExit.mockResolvedValue(on(pdx))
    expect(usage(await render())).toBe('8.2 of 10 GB this month')
    expect(usageHint).toHaveBeenLastCalledWith('OWNER', 'exit', true)
    deviceExit.mockResolvedValue(exitOf())
    offWith('pdx1a')
    expect(usage(await render())).toBeNull()
  })

  it('none for an own exit, for no route, or for one who does not manage the device', async () => {
    deviceExit.mockResolvedValue(on(office))
    expect(usage(await render())).toBeNull()
    deviceExit.mockResolvedValue(exitOf())
    expect(usage(await render())).toBeNull()
    protect.mockResolvedValue({ on: true, route: 'pdx1a', routeName: null })
    expect(usage(await render(['VIEW']))).toBeNull()
    expect(usageHint).toHaveBeenLastCalledWith('OWNER', 'exit', false)
  })
})

describe('in words', () => {
  it('Route through’s state, as the menu says it', () => {
    const state = (fields: any) => ({
      on: true,
      exit: null,
      route: 'xoffice',
      routeName: 'Office',
      dormant: false,
      offered: true,
      ...fields,
    })
    expect(statusLine(t, state({}), 'Office Mac', null)).toBe('All traffic goes through Office (device Office Mac).')
    expect(statusLine(t, state({}), undefined, null)).toBe('All traffic goes through Office.')
    expect(statusLine(t, state({ on: false }), undefined, null)).toBe('Off. Traffic goes out directly.')
    expect(statusLine(t, state({ dormant: true }), undefined, null)).toContain('Office has no device available')
    expect(statusLine(t, state({ offered: false }), undefined, null)).toContain('until a device of Office takes it')
    expect(
      statusLine(t, state({}), 'Office Mac', { label: 'Exit not working on this device', words: undefined, color: 'danger' })
    ).toBe('Exit not working on this device')
  })

  it('the route: the exit in use; else the one kept, named by the device, the exits offered, or its id', () => {
    expect(protectState(on(office), null, [], true)).toMatchObject({ on: true, route: 'xoffice', routeName: 'Office' })
    expect(protectState(exitOf(), { on: false, route: 'xoffice', routeName: null }, [office], true)).toMatchObject({
      on: false,
      route: 'xoffice',
      routeName: 'Office',
    })
    expect(protectState(exitOf(), { on: false, route: 'xgone', routeName: null }, [office], true).routeName).toBe(
      'xgone'
    )
    // The device's word on alone counts for one who does not manage it: graphql tells a manager.
    expect(protectState(exitOf(), { on: true, route: 'xoffice', routeName: null }, [], true).on).toBe(false)
    expect(protectState(exitOf(), { on: true, route: 'xoffice', routeName: null }, [], false).on).toBe(true)
    expect(protectState(exitOf(), null, [], true)).toMatchObject({ on: false, route: null, routeName: null })
  })

  it('an exit offered, as the picker lists it', () => {
    const two = { devices: 2, carrying: 2, healthy: 2, draining: 0 }
    expect(choiceOf(t, null, { ...office, serving: two } as any)).toEqual({
      key: 'xoffice',
      name: 'Office',
      description: '2 devices',
      disabled: false,
    })
    expect(choiceOf(t, { exitAllowed: [] }, pdx as any)).toMatchObject({ disabled: true })
    expect(choiceOf(t, { exitAllowed: null }, pdx as any)).toEqual({
      key: 'pdx1a',
      name: 'remote.it pdx1a',
      description: undefined,
      disabled: false,
    })
  })

  it('the exit not working: a code it does not know is said as not working, in the device’s words; words that are only the code, not repeated', () => {
    expect(exitErrorLine(t, null)).toBeNull()
    expect(exitErrorLine(t, { code: 'routes-held', message: 'routes-held', at: null })).toEqual({
      label: 'Exit not working on this device. Traffic is blocked.',
      words: undefined,
      color: 'warning',
    })
    expect(exitErrorLine(t, { code: 'dns-failed', message: 'its names could not be taken', at: null })).toEqual({
      label: 'Exit not working on this device',
      words: 'its names could not be taken',
      color: 'danger',
    })
  })
})

describe('an exit offered for the device, named', () => {
  it('remote.it’s by its name, by plan', () => {
    expect(choiceName(t, pdx)).toBe('remote.it pdx1a')
  })

  it('the account’s own by its name, whatever else holds', () => {
    expect(choiceName(t, office)).toBe('Office')
    expect(choiceName(t, { ...office, reasons: ['OWN', 'NETWORK'] })).toBe('Office')
  })

  it('one shared with you, or reached by your role, by whose it is; one with no email by its name', () => {
    expect(choiceName(t, pats)).toBe('Pat exit · pat@example.com’s')
    expect(choiceName(t, { ...pats, reasons: ['ROLE'] })).toBe('Pat exit · pat@example.com’s')
    expect(choiceName(t, { ...pats, reasons: ['SHARED', 'NETWORK'] })).toBe('Pat exit · pat@example.com’s')
    expect(choiceName(t, { ...pats, owner: { id: 'PAT', email: null } })).toBe('Pat exit')
  })

  it('one its networks alone give it: said so', () => {
    expect(choiceName(t, router)).toBe('Home router · chosen by a network')
  })

  it('with no reasons said, by whose it is', () => {
    expect(choiceName(t, { ...router, reasons: null })).toBe('Home router · ned@example.com’s')
  })
})

describe('who chose the exit, and the machine’s policy', () => {
  it('says who chose it: on the device, by whom; or in the portal', () => {
    expect(chosenLine(t, { ...none, exitSetOnDevice: true, exitSetOnDeviceBy: 'bob' })).toBe('Set on the device by bob')
    expect(chosenLine(t, { ...none, exitSetOnDevice: true })).toBe('Set on the device')
    expect(chosenLine(t, { ...none, exitSetOnDevice: false, exitSetBy: { email: 'ann@example.com' } })).toBe(
      'Set in Remote.It by ann@example.com'
    )
    expect(chosenLine(t, { ...none, exitSetBy: { email: null } })).toBeNull()
    expect(chosenLine(t, none)).toBeNull()
    expect(chosenLine(t, null)).toBeNull()
  })

  // Sign-ins per OS account (graphql-api docs/PROXY-GROUPS.md §15): the exit is the machine's, and one a signed-in
  // person chose on it ends at their sign-out.
  it('a choice made on the device by someone signed in there: ends at their sign-out; its administrator’s, said', () => {
    const onDevice = { ...none, exitSetOnDevice: true, exitSetOnDeviceBy: 'pat' }
    expect(chosenLine(t, { ...onDevice, exitSetOnDeviceSignedIn: PAT })).toBe(
      'Set on the device by pat@example.com, until pat@example.com signs out'
    )
    expect(chosenLine(t, { ...onDevice, exitSetOnDeviceSignedIn: { id: 'PAT', email: null } })).toContain('by PAT,')
    expect(chosenLine(t, { ...onDevice, exitSetOnDeviceBy: 'root', exitSetOnDeviceAdmin: true })).toBe(
      'Set on the device by root'
    )
    expect(chosenLine(t, { ...onDevice, exitSetOnDeviceBy: null, exitSetOnDeviceAdmin: true })).toBe(
      'Set on the device by its administrator'
    )
    // An API without them: as before.
    expect(chosenLine(t, onDevice)).toBe('Set on the device by pat')
  })

  it('an exit gone through on a person’s own access: lent to the whole machine, said so', () => {
    const pat = { ...none, usesExit: uses(pats), exitSetOnDevice: true, exitThroughPerson: PAT }
    expect(lentLine(t, pat)).toBe('The whole device goes through Pat exit, pat@example.com’s exit')
    expect(lentLine(t, { ...pat, exitThroughPerson: null })).toBeNull()
    expect(lentLine(t, { ...pat, usesExit: null })).toBeNull()
  })

  it('says what the administrator decided', () => {
    expect(policyLine(t, none)).toBeNull()
    expect(policyLine(t, null)).toBeNull()
    expect(policyLine(t, { ...none, exitPolicy: 'local' })).toEqual({
      label: 'This device’s administrator keeps the exit local',
      hint: 'The exit is chosen on the device only. Remote.It can’t change it.',
    })
    expect(policyLine(t, { ...none, exitPolicy: 'never' })).toEqual({
      label: 'This device’s administrator allows no exit',
      hint: 'Set on the device: sudo remoteit-device policy',
    })
    expect(policyLine(t, { ...none, exitPinned: 'xoffice' })).toEqual({
      label: 'Fixed by this device’s administrator to xoffice',
      hint: 'The fixed exit holds over any chosen here.',
    })
    expect(policyLine(t, { ...none, exitAllowed: ['xoffice', 'pdx1a'] })).toEqual({
      label: 'This device’s administrator allows only some exits',
      hint: 'xoffice, pdx1a',
    })
    expect(policyLine(t, { ...none, exitAllowed: [] })?.hint).toBe('None is allowed')
    // No exit at all holds over any exit pinned or allowed.
    expect(
      policyLine(t, { ...none, exitPolicy: 'never', exitPinned: 'xoffice', exitAllowed: ['xoffice'] })?.label
    ).toBe('This device’s administrator allows no exit')
  })
})

// connectd's report while it cannot set the exit's routes on the machine (busybox's ip): graphql's Device.exitError.
const FAILED =
  "the exit's routes could not be set: ip -4 route replace blackhole default metric 4096 table 29801: invalid argument '29801' to 'table'; this machine's traffic goes out directly, not through the exit"
const HELD =
  "the exit's routes could not be set: ip -4 rule add fwmark 0x1: invalid argument; the kill switch holds this machine's traffic"
