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
const protectRow = (page: HTMLElement) => page.querySelector('[data-item="shield"]') as HTMLElement
const status = (page: HTMLElement) => protectRow(page)?.querySelector('[data-protect-status]')?.textContent ?? null
// Protect's lines under its status: who set it, why it is held, why it cannot be turned on.
const protectLines = (page: HTMLElement) =>
  [...(protectRow(page)?.querySelectorAll('[data-sub] > span[class]') ?? [])].slice(1).map(line => line.textContent)
const toggle = (page: HTMLElement) => protectRow(page)?.querySelector('[data-toggle]') as HTMLButtonElement
const helper = (page: HTMLElement) => select(page)?.querySelector('[data-helper]')?.textContent ?? ''

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

describe('remote.it Protect, a switch', () => {
  it('on: protecting, through its exit and the device of it in use', async () => {
    deviceExit.mockResolvedValue(on(office, { usesExitThrough: { id: 'MAC', name: 'Office Mac' } }))
    let page = await render()
    expect(protectRow(page).querySelector('[data-label]')?.textContent).toBe('remote.it Protect')
    expect(status(page)).toBe('Protecting — going out through Office (device Office Mac)')
    expect(toggle(page).dataset.on).toBe('true')
    expect(toggle(page).disabled).toBe(false)
    expect(protectRow(page).dataset.color).toBe('primary')
    deviceExit.mockResolvedValue(on(office))
    page = await render()
    expect(status(page)).toBe('Protecting — going out through Office')
  })

  it('off: traffic goes its usual way; the route kept, and a hint to turn Protect on through it', async () => {
    offWith('xoffice', 'Office')
    const page = await render()
    expect(status(page)).toBe('Off — traffic goes its usual way')
    expect(toggle(page).dataset.on).toBe('false')
    expect(toggle(page).disabled).toBe(false)
    expect(select(page).dataset.value).toBe('xoffice')
    expect(helper(page)).toContain('Turn Protect on to send traffic through it')
  })

  it('turned on through the route kept, off keeping it; the device read again, for the list', async () => {
    offWith('xoffice', 'Office')
    let page = await render()
    await click(toggle(page))
    expect(setExit).toHaveBeenLastCalledWith('LAPTOP', 'xoffice')
    expect(deviceExit).toHaveBeenCalledTimes(2)
    expect(reload).toHaveBeenCalled()
    expect(fetchSingleFull).toHaveBeenCalledWith({ id: 'LAPTOP', accountId: 'OWNER', silent: true })

    deviceExit.mockResolvedValue(on(office))
    page = await render()
    await click(toggle(page))
    expect(setExit).toHaveBeenLastCalledWith('LAPTOP', null)
  })

  it('no route: not turned on, saying why; nothing sent', async () => {
    const page = await render()
    expect(status(page)).toBe('Off — traffic goes its usual way')
    expect(toggle(page).disabled).toBe(true)
    expect(protectLines(page)).toEqual(['Choose an exit under Route through to turn Protect on'])
    expect(select(page).dataset.value).toBe('')
    expect(choices(page)[0]).toBe('=Choose an exit')
    expect(helper(page)).not.toContain('Turn Protect on')
    await click(toggle(page))
    expect(setExit).not.toHaveBeenCalled()
  })

  it('the exit not working on the device: Protect’s line says so, in the danger or warning colour, in the device’s words', async () => {
    deviceExit.mockResolvedValue(
      on(office, {
        usesExitThrough: { id: 'MAC', name: 'Office Mac' },
        exitError: { code: 'routes-failed', message: FAILED, at: '2026-11-11T20:00:00Z' },
      })
    )
    let page = await render()
    expect(status(page)).toBe(
      'Not working on this device: the exit’s routes could not be set — traffic goes out directly'
    )
    expect(protectRow(page).dataset.color).toBe('danger')
    expect(protectLines(page)).toEqual([FAILED])
    expect(page.textContent).not.toContain('Office Mac')
    deviceExit.mockResolvedValue(on(office, { exitError: { code: 'routes-held', message: HELD, at: null } }))
    page = await render()
    expect(status(page)).toBe('Not working on this device: the exit’s routes could not be set — traffic is blocked')
    expect(protectRow(page).dataset.color).toBe('warning')
    // Off, an error left from before is not Protect's state.
    deviceExit.mockResolvedValue(exitOf({ exitError: { code: 'routes-held', message: HELD, at: null } }))
    offWith('xoffice')
    expect(status(await render())).toBe('Off — traffic goes its usual way')
  })

  it('on with its exit dormant, or none of its devices taking its traffic: said in its line', async () => {
    deviceExit.mockResolvedValue(
      exitOf({ usesExit: uses(spare, { offered: false, dormant: true }), exitDormant: true })
    )
    let page = await render()
    expect(status(page)).toBe('On — Spare has no device available, so traffic goes its usual way until one does')
    expect(toggle(page).disabled).toBe(false) // off is still the portal's
    expect(choices(page).at(-1)).toBe('xspare=Spare · no device available')
    deviceExit.mockResolvedValue(exitOf({ usesExit: uses(office, { offered: false }) }))
    page = await render()
    expect(status(page)).toBe('On — none of Office’s devices takes its traffic now: it stops until one does')
  })

  it('off with its route dormant: not turned on until a device of it is in service, saying so', async () => {
    deviceExit.mockResolvedValue(exitOf({ exitDormant: true }))
    offWith('xspare', 'Spare')
    const page = await render()
    expect(toggle(page).disabled).toBe(true)
    expect(protectLines(page)).toEqual([
      'Spare has no device available: Protect can be turned on through it once one does',
    ])
    expect(helper(page)).not.toContain('Turn Protect on')
  })

  it('a refusal in graphql’s words, or that nothing was changed; gone when closed', async () => {
    deviceExit.mockResolvedValue(on(office))
    const page = await render()
    setExit.mockResolvedValueOnce({ reason: 'this machine’s administrator turned Protect on on the device' })
    await click(toggle(page))
    expect(notice(page)).toBe('this machine’s administrator turned Protect on on the device')
    expect(fetchSingleFull).not.toHaveBeenCalled()
    setExit.mockResolvedValueOnce('ERROR')
    await click(toggle(page))
    expect(notice(page)).toBe('It was not changed: try again.')
    await click(page.querySelector('[data-close]'))
    expect(notice(page)).toBeNull()
  })
})

describe('Route through, a picker apart from Protect', () => {
  it('offers the exits offered for the device, named by why, each with its devices counted', async () => {
    const two = { devices: 2, carrying: 2, healthy: 2, draining: 0 }
    offered.mockResolvedValue([{ ...pdx, serving: two }, office, pats, router])
    const page = await render()
    expect(offered).toHaveBeenCalledTimes(1)
    expect(choices(page)).toEqual([
      '=Choose an exit',
      'pdx1a=remote.it pdx1a',
      'xoffice=Office',
      'xpat=Pat exit · pat@example.com’s',
      'xrouter=Home router · by its network',
    ])
    expect(described(page)).toEqual(['= (off)', 'pdx1a=2 devices', 'xoffice=', 'xpat=', 'xrouter='])
  })

  it('choosing a route leaves Protect as it is — off or on — and reads the device again', async () => {
    offWith('xoffice', 'Office')
    let page = await render()
    await click(choice(page, 'xpat'))
    expect(setRoute).toHaveBeenCalledWith('LAPTOP', 'xpat')
    expect(setExit).not.toHaveBeenCalled()
    expect(deviceExit).toHaveBeenCalledTimes(2)

    deviceExit.mockResolvedValue(on(office))
    page = await render()
    await click(choice(page, 'xrouter'))
    expect(setRoute).toHaveBeenLastCalledWith('LAPTOP', 'xrouter')
    expect(setExit).not.toHaveBeenCalled()
    // The route already chosen: nothing sent.
    await click(choice(page, 'xoffice'))
    expect(setRoute).toHaveBeenCalledTimes(2)
  })

  it('an API without keepProtect: choosing a route turns Protect on with it, and says so while off', async () => {
    keeps.mockResolvedValue(false)
    const page = await render()
    expect(helper(page)).toContain('Choosing an exit turns Protect on')
    await click(choice(page, 'xoffice'))
    expect(setExit).toHaveBeenCalledWith('LAPTOP', 'xoffice')
    expect(setRoute).not.toHaveBeenCalled()
    deviceExit.mockResolvedValue(on(office))
    expect(helper(await render())).not.toContain('turns Protect on')
  })

  it('while a change is being made, the controls are disabled and nothing else is sent', async () => {
    let answer: (value: unknown) => void = () => {}
    setRoute.mockImplementationOnce(() => new Promise(resolve => (answer = resolve)))
    offWith('xoffice', 'Office')
    const page = await render()
    await click(choice(page, 'xpat'))
    expect(select(page).dataset.disabled).toBe('true')
    expect(toggle(page).disabled).toBe(true)
    await click(choice(page, 'xrouter'))
    expect(setRoute).toHaveBeenCalledTimes(1)
    await act(async () => answer({}))
    expect(select(page).dataset.disabled).toBe('false')
  })

  it('a route no longer offered still shows, as itself; one the administrator does not allow is listed, not chosen', async () => {
    deviceExit.mockResolvedValue(on({ ...pats, id: 'xold', name: 'Old exit' }))
    let page = await render()
    expect(select(page).dataset.value).toBe('xold')
    expect(choices(page).at(-1)).toBe('xold=Old exit')
    deviceExit.mockResolvedValue(exitOf({ exitAllowed: ['pdx1a'] }))
    offered.mockResolvedValue([pdx, office])
    page = await render()
    expect(described(page)).toEqual(['= (off)', 'pdx1a=', 'xoffice=Not allowed by this machine’s administrator (off)'])
  })

  it('no exits for the device: said in the picker', async () => {
    offered.mockResolvedValue([])
    expect(choices(await render())).toEqual(['=No exits for this device'])
  })
})

describe('who set each, and what the administrator holds, per control', () => {
  const protectSet = (fields: any) =>
    settings.mockReturnValue([
      { name: 'protect', value: false, at: null, by: null, onDevice: false, control: 'cloud+local', ...fields },
    ])

  it('Protect: set in the portal, or on this computer by a signed-in person — ends at their sign-out', async () => {
    offWith('xoffice', 'Office')
    protectSet({ by: 'ann@example.com' })
    expect(protectLines(await render())).toEqual(['Set in the portal by ann@example.com'])
    protectSet({ by: 'pat', onDevice: true, signedIn: PAT })
    expect(protectLines(await render())).toEqual([
      'Set on this computer by pat@example.com — ends when pat@example.com signs out',
    ])
  })

  it('the route: who chose it, and whose exit the machine goes through', async () => {
    deviceExit.mockResolvedValue(
      on(pats, {
        exitSetOnDevice: true,
        exitSetOnDeviceBy: 'pat',
        exitSetOnDeviceSignedIn: PAT,
        exitThroughPerson: PAT,
      })
    )
    let page = await render()
    expect(helper(page)).toBe(
      'Set on this computer by pat@example.com — ends when pat@example.com signs outMachine-wide through pat@example.com’s exit Pat exit'
    )
    deviceExit.mockResolvedValue(exitOf({ exitSetOnDevice: true, exitSetOnDeviceAdmin: true }))
    offWith('xoffice', 'Office')
    page = await render()
    expect(helper(page)).toContain('Set on the device by its administrator')
    deviceExit.mockResolvedValue(exitOf({ exitSetBy: { email: 'ann@example.com' } }))
    page = await render()
    expect(helper(page)).toContain('Set in the portal by ann@example.com')
  })

  it('Protect held by its administrator’s control: read-only, saying so; the route still the portal’s', async () => {
    offWith('xoffice', 'Office')
    for (const [control, line] of [
      ['off', 'Turned off on the device by its administrator'],
      ['on', 'Turned on on the device by its administrator'],
      ['local', 'Set only on the device'],
    ]) {
      protectSet({ control })
      const page = await render()
      expect(toggle(page).disabled).toBe(true)
      expect(protectLines(page)).toEqual([line])
      expect(select(page).dataset.disabled).toBe('false')
      expect(helper(page)).not.toContain('Turn Protect on') // not the portal's to turn on
    }
  })

  it('the exit kept local, none allowed, or one pinned (exit_control): both read-only, the reason said', async () => {
    deviceExit.mockResolvedValue(on(office, { exitSetOnDevice: true, exitSetOnDeviceBy: 'bob', exitPolicy: 'local' }))
    let page = await render()
    expect(toggle(page).disabled).toBe(true)
    expect(select(page).dataset.disabled).toBe('true')
    expect(protectLines(page)).toEqual(['Set only on the device: its administrator keeps its exit local'])
    expect(helper(page)).toContain('Set on the device by bob')
    expect(helper(page)).not.toContain('keeps its exit local') // the lock's row says it
    expect(page.querySelector('[data-item="lock"]')?.textContent).toContain(
      'Its exit is chosen on the device only; the portal cannot change it'
    )

    deviceExit.mockResolvedValue(exitOf({ exitPolicy: 'never' }))
    offWith('xoffice', 'Office')
    page = await render()
    expect(toggle(page).disabled).toBe(true)
    expect(select(page).dataset.disabled).toBe('true')
    expect(page.querySelector('[data-item="lock"]')?.textContent).toContain(
      'This machine’s administrator allows it no exit'
    )

    deviceExit.mockResolvedValue(on(office, { exitPinned: 'xoffice' }))
    page = await render()
    expect(toggle(page).disabled).toBe(true)
    expect(select(page).dataset.disabled).toBe('true')
    expect(protectLines(page)).toEqual(['Set by this machine’s administrator'])
    expect(page.querySelector('[data-item="lock"]')?.textContent).toContain(
      'Pinned by this machine’s administrator to xoffice'
    )
  })
})

describe('one who does not manage the device', () => {
  it('sees Protect and its route as the device says them, read-only, and why', async () => {
    protect.mockResolvedValue({ on: true, route: 'pdx1a', routeName: 'remote.it pdx1a' })
    let page = await render(['VIEW'])
    expect(status(page)).toBe('Protecting — going out through remote.it pdx1a')
    expect(toggle(page).dataset.on).toBe('true')
    expect(toggle(page).disabled).toBe(true)
    expect(select(page).dataset.disabled).toBe('true')
    expect(select(page).dataset.value).toBe('pdx1a')
    expect(protectLines(page)).toEqual(['Only someone who manages this device changes Protect and its route'])
    expect(helper(page)).not.toContain('Turn Protect on')

    offWith('xoffice', 'Office')
    page = await render(['VIEW'])
    expect(status(page)).toBe('Off — traffic goes its usual way')
    await click(toggle(page))
    await click(choice(page, 'xpat'))
    expect(setExit).not.toHaveBeenCalled()
    expect(setRoute).not.toHaveBeenCalled()
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

  it('for one of remote.it’s exits as the route, Protect on or off: the device owner’s', async () => {
    deviceExit.mockResolvedValue(on(pdx))
    expect(usage(await render())).toBe('8.2 of 10 GB this month')
    expect(usageHint).toHaveBeenLastCalledWith('OWNER', 'exit', true)
    deviceExit.mockResolvedValue(exitOf())
    offWith('pdx1a')
    expect(usage(await render())).toBe('8.2 of 10 GB this month')
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
  it('Protect’s state, as the menu says it', () => {
    const state = (fields: any) => ({
      on: true,
      exit: null,
      route: 'xoffice',
      routeName: 'Office',
      dormant: false,
      offered: true,
      ...fields,
    })
    expect(statusLine(t, state({}), 'Office Mac', null)).toBe(
      'Protecting — going out through Office (device Office Mac)'
    )
    expect(statusLine(t, state({}), undefined, null)).toBe('Protecting — going out through Office')
    expect(statusLine(t, state({ on: false }), undefined, null)).toBe('Off — traffic goes its usual way')
    expect(statusLine(t, state({ dormant: true }), undefined, null)).toContain('Office has no device available')
    expect(statusLine(t, state({ offered: false }), undefined, null)).toContain('none of Office’s devices')
    expect(
      statusLine(t, state({}), 'Office Mac', { label: 'Not working on this device', words: undefined, color: 'danger' })
    ).toBe('Not working on this device')
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
      label: 'Not working on this device: the exit’s routes could not be set — traffic is blocked',
      words: undefined,
      color: 'warning',
    })
    expect(exitErrorLine(t, { code: 'dns-failed', message: 'its names could not be taken', at: null })).toEqual({
      label: 'Not working on this device',
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
    expect(choiceName(t, router)).toBe('Home router · by its network')
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
      'Set in the portal by ann@example.com'
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
      'Set on this computer by pat@example.com — ends when pat@example.com signs out'
    )
    expect(chosenLine(t, { ...onDevice, exitSetOnDeviceSignedIn: { id: 'PAT', email: null } })).toContain('by PAT —')
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
    expect(lentLine(t, pat)).toBe('Machine-wide through pat@example.com’s exit Pat exit')
    expect(lentLine(t, { ...pat, exitThroughPerson: null })).toBeNull()
    expect(lentLine(t, { ...pat, usesExit: null })).toBeNull()
  })

  it('says what the administrator decided', () => {
    expect(policyLine(t, none)).toBeNull()
    expect(policyLine(t, null)).toBeNull()
    expect(policyLine(t, { ...none, exitPolicy: 'local' })).toEqual({
      label: 'This machine’s administrator keeps its exit local',
      hint: 'Its exit is chosen on the device only; the portal cannot change it',
    })
    expect(policyLine(t, { ...none, exitPolicy: 'never' })).toEqual({
      label: 'This machine’s administrator allows it no exit',
      hint: 'Set on the device: sudo remoteit-device policy',
    })
    expect(policyLine(t, { ...none, exitPinned: 'xoffice' })).toEqual({
      label: 'Pinned by this machine’s administrator to xoffice',
      hint: 'The pinned exit holds over any chosen here',
    })
    expect(policyLine(t, { ...none, exitAllowed: ['xoffice', 'pdx1a'] })).toEqual({
      label: 'This machine’s administrator allows only some exits',
      hint: 'xoffice, pdx1a',
    })
    expect(policyLine(t, { ...none, exitAllowed: [] })?.hint).toBe('None is allowed')
    // No exit at all holds over any exit pinned or allowed.
    expect(
      policyLine(t, { ...none, exitPolicy: 'never', exitPinned: 'xoffice', exitAllowed: ['xoffice'] })?.label
    ).toBe('This machine’s administrator allows it no exit')
  })
})

// connectd's report while it cannot set the exit's routes on the machine (busybox's ip): graphql's Device.exitError.
const FAILED =
  "the exit's routes could not be set: ip -4 route replace blackhole default metric 4096 table 29801: invalid argument '29801' to 'table'; this machine's traffic goes out directly, not through the exit"
const HELD =
  "the exit's routes could not be set: ip -4 rule add fwmark 0x1: invalid argument; the kill switch holds this machine's traffic"
