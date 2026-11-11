import React, { act } from 'react'
import { createRoot } from 'react-dom/client'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { DeviceExit } from '../services/graphQLExits'

const { deviceExit, offered, protect, setExit, usageHint, settings } = vi.hoisted(() => ({
  settings: vi.fn((_deviceId?: string) => [] as any[]),
  deviceExit: vi.fn(async (_deviceId: string) => null as any),
  offered: vi.fn(async (_deviceId?: string) => [] as any),
  protect: vi.fn(async (_deviceId: string) => null as any),
  setExit: vi.fn(async (_deviceId: string, _via: string | null) => ({} as any)),
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
vi.mock('../hooks/useDeviceSettings', () => ({
  useDeviceSettings: (deviceId?: string) => ({
    setting: (name: string) => settings(deviceId).find(s => s.name === name),
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
// A row: its label and sub-label, and its button (if any).
vi.mock('./ListItemSetting', () => ({
  ListItemSetting: ({ icon, label, subLabel, button, disabled, onButtonClick }: any) => (
    <div data-item={icon}>
      {label}
      {subLabel ? ` — ${subLabel}` : ''}
      {button ? (
        <button data-button disabled={disabled} onClick={onButtonClick}>
          {button}
        </button>
      ) : null}
    </div>
  ),
}))
// The choice: its value, whether it is disabled, and each option a button that picks it — clickable even while
// disabled, so the component's own guard is what is tested.
vi.mock('./SelectSetting', () => ({
  SelectSetting: ({ disabled, value, values, onChange }: any) => (
    <div data-select data-value={value} data-disabled={String(!!disabled)}>
      {values.map((each: any) => (
        <button key={each.key} data-choice={each.key} onClick={() => onChange(each.key)}>
          {each.name}
        </button>
      ))}
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

import { DeviceExitChoice, choiceName, chosenLine, lentLine, policyLine } from './DeviceExitSection'
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
  const device = { id: 'LAPTOP', name: 'Laptop', permissions, owner: OWNER } as any
  await act(async () => createRoot(container).render(<DeviceExitChoice device={device} />))
  return container
}
const click = async (element: Element | null | undefined) => act(async () => (element as HTMLElement).click())
const select = (page: HTMLElement) => page.querySelector('[data-select]') as HTMLElement
const choices = (page: HTMLElement) =>
  [...page.querySelectorAll('[data-choice]')].map(each => `${each.getAttribute('data-choice')}=${each.textContent}`)
const choice = (page: HTMLElement, key: string) => page.querySelector(`[data-choice="${key}"]`)
const notice = (page: HTMLElement) => page.querySelector('[data-notice]')?.textContent ?? null
const protectRow = (page: HTMLElement) => page.querySelector('[data-item="shield-alt"]')

beforeEach(() => {
  deviceExit.mockReset().mockResolvedValue(exitOf())
  offered.mockReset().mockResolvedValue([pdx, office, pats, router])
  protect.mockReset().mockResolvedValue(null)
  setExit.mockReset().mockResolvedValue({})
  usageHint.mockClear()
  settings.mockReset().mockReturnValue([])
})

describe('the exit a device’s traffic goes out through', () => {
  it('offers the exits offered for the device, named by why: remote.it’s and its account’s own by name, another account’s by whose it is, one its networks give it so', async () => {
    const page = await render()
    expect(offered).toHaveBeenCalledWith('LAPTOP')
    // Why each is offered is graphql's to say: nothing more is asked.
    expect(offered).toHaveBeenCalledTimes(1)
    expect(choices(page)).toEqual([
      '=None — its usual way out',
      'pdx1a=remote.it pdx1a',
      'xoffice=Office',
      'xpat=Pat exit · pat@example.com’s',
      'xrouter=Home router · by its network',
    ])
    expect(select(page).dataset.value).toBe('')
  })

  it('shows the exit in use as chosen; one no longer offered for it still shows, as itself', async () => {
    deviceExit.mockResolvedValue(exitOf({ usesExit: uses(office) }))
    let page = await render()
    expect(select(page).dataset.value).toBe('xoffice')
    expect(choices(page).filter(each => each.startsWith('xoffice='))).toEqual(['xoffice=Office'])

    deviceExit.mockResolvedValue(exitOf({ usesExit: uses({ ...pats, id: 'xold', name: 'Old exit' }) }))
    page = await render()
    expect(select(page).dataset.value).toBe('xold')
    expect(choices(page).at(-1)).toBe('xold=Old exit')
  })

  it('a dormant exit stays chosen, with no device available: its traffic goes its usual way until one is', async () => {
    deviceExit.mockResolvedValue(
      exitOf({
        usesExit: uses(spare, { offered: false, dormant: true }),
        usesExitThrough: { id: 'MAC', name: 'Office Mac' },
        exitDormant: true,
      })
    )
    const page = await render()
    expect(select(page).dataset.value).toBe('xspare')
    expect(choices(page).at(-1)).toBe('xspare=Spare · no device available')
    expect(page.textContent).toContain(
      'Its exit, Spare, is dormant — No device available: none of the exit’s devices carries its traffic, so its traffic goes its usual way, Protect off for it, until one does'
    )
    expect(page.textContent).not.toContain('takes its traffic now')
    expect(page.textContent).not.toContain('Going out through')
  })

  it('an exit none of whose devices takes its traffic now: said, its traffic stopped until one does', async () => {
    deviceExit.mockResolvedValue(exitOf({ usesExit: uses(office, { offered: false }) }))
    const page = await render()
    expect(page.textContent).toContain(
      'None of Office’s devices takes its traffic now — Its traffic stops until one does: a device added to the exit, or one of its devices offering itself again.'
    )
    expect(page.textContent).not.toContain('is dormant')
    expect(page.textContent).not.toContain('Going out through')
  })

  it('says the device of the exit its new connections go through now, where graphql says one', async () => {
    deviceExit.mockResolvedValue(exitOf({ usesExit: uses(office), usesExitThrough: { id: 'MAC', name: 'Office Mac' } }))
    let page = await render()
    expect(page.textContent).toContain(
      'Going out through Office Mac now — remote.it picks the device of the exit its new connections go through'
    )
    expect(page.textContent).not.toContain('takes its traffic now')

    deviceExit.mockResolvedValue(exitOf({ usesExit: uses(office) }))
    page = await render()
    expect(select(page).dataset.value).toBe('xoffice')
    expect(page.textContent).not.toContain('Going out through')
  })

  it('choosing an exit sends the device’s traffic out through it, and reads its exit again; None stops it', async () => {
    const page = await render()
    expect(deviceExit).toHaveBeenCalledTimes(1)
    await click(choice(page, 'xpat'))
    expect(setExit).toHaveBeenCalledWith('LAPTOP', 'xpat')
    expect(deviceExit).toHaveBeenCalledTimes(2)
    expect(notice(page)).toBeNull()

    await click(choice(page, ''))
    expect(setExit).toHaveBeenLastCalledWith('LAPTOP', null)
  })

  it('while a choice is being made, the choice is disabled and another is not sent', async () => {
    let answer: (value: unknown) => void = () => {}
    setExit.mockImplementationOnce(() => new Promise(resolve => (answer = resolve)))
    const page = await render()
    await click(choice(page, 'xpat'))
    expect(select(page).dataset.disabled).toBe('true')
    await click(choice(page, 'xoffice'))
    expect(setExit).toHaveBeenCalledTimes(1)
    await act(async () => answer({}))
    expect(select(page).dataset.disabled).toBe('false')
  })

  it('a refusal is said in graphql’s words, or that nothing was changed; it goes when closed, or once a choice goes through', async () => {
    const page = await render()
    setExit.mockResolvedValueOnce({ reason: 'Pat exit has no device in service: it can be chosen once one is' })
    await click(choice(page, 'xpat'))
    expect(notice(page)).toBe('Pat exit has no device in service: it can be chosen once one is')
    expect(deviceExit).toHaveBeenCalledTimes(2)

    setExit.mockResolvedValueOnce('ERROR')
    await click(choice(page, 'xoffice'))
    expect(notice(page)).toBe('It was not changed: try again.')
    await click(page.querySelector('[data-close]'))
    expect(notice(page)).toBeNull()

    setExit.mockResolvedValueOnce({ reason: 'Not an exit you or the device may use' })
    await click(choice(page, 'xrouter'))
    expect(notice(page)).toBe('Not an exit you or the device may use')
    await click(choice(page, 'xoffice'))
    expect(notice(page)).toBeNull()
  })

  it('one who does not manage the device: what the device says, and no choice', async () => {
    protect.mockResolvedValue({ on: false, route: 'xoffice', routeName: 'Office' })
    const page = await render(['VIEW'])
    expect(protectRow(page)?.textContent).toContain('Protect: off — route Office')
    expect(select(page)).toBeNull()
  })

  it('nothing where the API has no device exits or the device’s exit cannot be read, and nothing more is asked', async () => {
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

describe('Protect off on the device', () => {
  it('says the route it keeps, and turns Protect on through it by choosing that exit', async () => {
    protect.mockResolvedValue({ on: false, route: 'xoffice', routeName: 'Office (kept)' })
    const page = await render()
    expect(protect).toHaveBeenCalledWith('LAPTOP')
    expect(protectRow(page)?.textContent).toContain(
      'Protect: off — route Office (kept) — Turned off on the device, which keeps Office (kept) to route through when Protect is on again'
    )
    const on = protectRow(page)?.querySelector('[data-button]')
    expect(on?.textContent).toBe('Turn on')
    await click(on)
    expect(setExit).toHaveBeenCalledWith('LAPTOP', 'xoffice')
  })

  it('names the route by the exits offered where the device does not, else by its id', async () => {
    protect.mockResolvedValue({ on: false, route: 'xoffice', routeName: null })
    expect(protectRow(await render())?.textContent).toContain('Protect: off — route Office —')
    protect.mockResolvedValue({ on: false, route: 'xgone', routeName: null })
    expect(protectRow(await render())?.textContent).toContain('Protect: off — route xgone —')
  })

  it('one who does not manage the device, or a machine whose administrator keeps its exit local or allows none: said, not turned on here', async () => {
    protect.mockResolvedValue({ on: false, route: 'xoffice', routeName: 'Office' })
    let page = await render(['VIEW'])
    expect(protectRow(page)?.textContent).toContain('Protect: off — route Office')
    expect(page.querySelector('[data-button]')).toBeNull()
    for (const exitPolicy of ['local', 'never'] as const) {
      deviceExit.mockResolvedValue(exitOf({ exitPolicy }))
      page = await render()
      expect(protectRow(page)?.textContent).toContain('Protect: off — route Office')
      expect(page.querySelector('[data-button]')).toBeNull()
    }
  })

  it('not while its exit is dormant: Protect is off for it until a device of the exit is in service', async () => {
    protect.mockResolvedValue({ on: false, route: 'xspare', routeName: 'Spare' })
    deviceExit.mockResolvedValue(
      exitOf({ usesExit: uses(spare, { offered: false, dormant: true }), exitDormant: true })
    )
    let page = await render()
    expect(page.textContent).toContain('Its exit, Spare, is dormant')
    expect(page.textContent).not.toContain('Protect: off')
    expect(page.querySelector('[data-button]')).toBeNull()

    // Protect turned off as well, its exit kept dormant: the exit kept is said, with nothing to turn on through yet —
    // where, not dormant, it is turned on through it.
    deviceExit.mockResolvedValue(exitOf({ exitDormant: true }))
    page = await render()
    expect(select(page)).not.toBeNull()
    expect(page.querySelector('[data-item="moon"]')?.textContent).toBe(
      'Protect: off — its exit, Spare, is kept, with no device available — None of the exit’s devices carries its traffic: Protect can be turned on through it once one does. Or choose another exit.'
    )
    expect(protectRow(page)).toBeNull()
    expect(page.querySelector('[data-button]')).toBeNull()
    deviceExit.mockResolvedValue(exitOf({ exitDormant: false }))
    expect(protectRow(await render())?.textContent).toContain('Protect: off — route Spare')
  })

  it('nothing said while an exit is in use, while Protect is on, with no route kept, or where the device does not say', async () => {
    deviceExit.mockResolvedValue(exitOf({ usesExit: uses(office) }))
    protect.mockResolvedValue({ on: false, route: 'xoffice', routeName: 'Office' })
    let page = await render()
    expect(select(page).dataset.value).toBe('xoffice')
    expect(page.textContent).not.toContain('Protect: off')

    deviceExit.mockResolvedValue(exitOf())
    for (const kept of [
      { on: true, route: 'xoffice', routeName: 'Office' },
      { on: false, route: null, routeName: null },
      { on: null, route: 'xoffice', routeName: 'Office' },
      null,
      'UNSUPPORTED',
      'ERROR',
    ]) {
      protect.mockClear().mockResolvedValue(kept)
      page = await render()
      expect(protect).toHaveBeenCalledWith('LAPTOP')
      expect(select(page)).not.toBeNull()
      expect(page.textContent).not.toContain('Protect: off')
    }
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

  it('shows who set the exit and Protect', async () => {
    deviceExit.mockResolvedValue(
      exitOf({
        usesExit: uses(pats),
        exitSetOnDevice: true,
        exitSetOnDeviceBy: 'pat',
        exitSetOnDeviceSignedIn: PAT,
        exitThroughPerson: PAT,
      })
    )
    let page = await render()
    expect(page.textContent).toContain(
      'Set on this computer by pat@example.com — ends when pat@example.com signs out — Machine-wide through pat@example.com’s exit Pat exit'
    )

    deviceExit.mockResolvedValue(exitOf())
    protect.mockResolvedValue({ on: false, route: 'xoffice', routeName: 'Office' })
    settings.mockReturnValue([
      {
        name: 'protect',
        value: false,
        at: null,
        by: 'pat',
        onDevice: true,
        control: 'cloud+local',
        signedIn: PAT,
        admin: false,
      },
    ])
    page = await render()
    expect(protectRow(page)?.textContent).toContain(
      'Set on this computer by pat@example.com — ends when pat@example.com signs out. It keeps Office to route through when Protect is on again'
    )
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

  it('shows them, and locks the choice where the administrator keeps the exit local or allows none', async () => {
    deviceExit.mockResolvedValue(
      exitOf({ usesExit: uses(office), exitSetOnDevice: true, exitSetOnDeviceBy: 'bob', exitPolicy: 'local' })
    )
    let page = await render()
    expect(page.textContent).toContain('Set on the device by bob')
    expect(page.textContent).toContain(
      'This machine’s administrator keeps its exit local — Its exit is chosen on the device only; the portal cannot change it'
    )
    expect(select(page).dataset.disabled).toBe('true')

    deviceExit.mockResolvedValue(exitOf({ usesExit: uses(office), exitPolicy: 'never' }))
    page = await render()
    expect(page.textContent).toContain('This machine’s administrator allows it no exit')
    expect(select(page).dataset.disabled).toBe('true')

    deviceExit.mockResolvedValue(
      exitOf({ usesExit: uses(office), exitPinned: 'xoffice', exitSetBy: { email: 'ann@example.com' } })
    )
    page = await render()
    expect(page.textContent).toContain('Set in the portal by ann@example.com')
    expect(page.textContent).toContain('Pinned by this machine’s administrator to xoffice')
    expect(select(page).dataset.disabled).toBe('false')
  })

  it('says who chose it only while an exit is in use', async () => {
    deviceExit.mockResolvedValue(exitOf({ exitSetBy: { email: 'ann@example.com' } }))
    const page = await render()
    expect(select(page).dataset.value).toBe('')
    expect(page.textContent).not.toContain('Set by')
  })
})

describe('the account’s transfer this month, under the choice', () => {
  const usage = (page: HTMLElement) => page.querySelector('[data-usage]')?.textContent ?? null

  it('for one of remote.it’s exits in use: the device owner’s', async () => {
    deviceExit.mockResolvedValue(exitOf({ usesExit: uses(pdx) }))
    const page = await render()
    expect(usageHint).toHaveBeenLastCalledWith('OWNER', 'exit', true)
    expect(usage(page)).toBe('8.2 of 10 GB this month')
  })

  it('for the route Protect keeps while off, when it is one of remote.it’s', async () => {
    protect.mockResolvedValue({ on: false, route: 'pdx1a', routeName: null })
    const page = await render()
    expect(protectRow(page)?.textContent).toContain('Protect: off — route remote.it pdx1a')
    expect(usageHint).toHaveBeenLastCalledWith('OWNER', 'exit', true)
    expect(usage(page)).toBe('8.2 of 10 GB this month')
  })

  it('none for an own exit, for none in use, or for one who does not manage the device', async () => {
    const through = { id: 'E1', name: 'e1' }
    for (const [answer, permissions, shown] of [
      [exitOf({ usesExit: uses(office), usesExitThrough: through }), ['VIEW', 'MANAGE'], 'Going out through e1 now'],
      [exitOf(), ['VIEW', 'MANAGE'], 'None — its usual way out'],
      [exitOf({ usesExit: uses(pdx), usesExitThrough: through }), ['VIEW'], 'Going out through e1 now'],
    ] as const) {
      deviceExit.mockResolvedValue(answer)
      const page = await render([...permissions])
      expect(page.textContent).toContain(shown)
      expect(usageHint).toHaveBeenLastCalledWith('OWNER', 'exit', false)
      expect(usage(page)).toBeNull()
    }
    // The route Protect keeps, an own exit.
    protect.mockResolvedValue({ on: false, route: 'xoffice', routeName: null })
    deviceExit.mockResolvedValue(exitOf())
    const page = await render()
    expect(protectRow(page)?.textContent).toContain('Protect: off — route Office')
    expect(usage(page)).toBeNull()
  })
})
