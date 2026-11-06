import React, { act } from 'react'
import { createRoot } from 'react-dom/client'
import { describe, it, expect, vi } from 'vitest'

const { exit, chooser, protect, setExit, publicExit, usage, deviceGroup, exitGroup, leave, deleteGroup, shared } =
  vi.hoisted(() => ({
    exit: vi.fn(),
    chooser: vi.fn(),
    protect: vi.fn(async () => null as any),
    setExit: vi.fn(async () => true as any),
    publicExit: vi.fn(async (_id: string) => undefined as boolean | undefined),
    usage: vi.fn(async (_accountId?: string) => [] as any),
    deviceGroup: vi.fn(async (_id: string) => null as any),
    exitGroup: vi.fn(async (_id: string) => null as any),
    leave: vi.fn(async (_id: string) => ({} as any)),
    deleteGroup: vi.fn(async (_label: string, _confirm: boolean) => ({} as any)),
    shared: vi.fn(async () => [] as any),
  }))
vi.mock('../services/graphQLProxy', () => ({
  graphQLDeviceExit: exit,
  graphQLDeviceExitChooser: chooser,
  graphQLDeviceProtect: protect,
  graphQLExits: async () => [{ id: 'EXIT', name: 'office' }],
  graphQLProxyPublicExit: publicExit,
  graphQLSetDeviceExit: setExit,
}))
vi.mock('../services/transferUsage', () => ({ fetchTransferUsage: usage, UNSUPPORTED: 'UNSUPPORTED' }))
vi.mock('../services/graphQLProxyGroups', () => ({
  graphQLDeviceGroup: deviceGroup,
  graphQLDeviceExitGroup: exitGroup,
  graphQLLeaveProxyGroup: leave,
  graphQLDeleteProxyGroup: deleteGroup,
  graphQLSharedProxyGroups: shared,
  refusalOf: (result: any) => (result === 'ERROR' ? '' : result && 'reason' in result ? result.reason : undefined),
}))
vi.mock('./Notice', () => ({ Notice: ({ children }: any) => <div data-notice>{children}</div> }))
vi.mock('../helpers/dateHelper', () => ({ getLocale: () => 'en-US' }))
vi.mock('./ListItemSetting', () => ({
  ListItemSetting: ({ label, subLabel, button, onButtonClick }: any) => (
    <div data-item>
      {label}
      {subLabel ? ` — ${subLabel}` : ''}
      {button ? <button onClick={onButtonClick}>{button}</button> : null}
    </div>
  ),
}))
vi.mock('../services/graphQLDeviceSettings', () => ({ settingOn: (s: any) => !!s?.value?.on }))
// A switch: its label and value, the confirmation it asks first (if any), and a click that flips it.
vi.mock('./DeviceSettingRow', () => ({
  DeviceSettingRow: ({ label, on, setting, confirm, confirmProps, onChange }: any) => (
    <div
      data-switch
      data-confirm={confirm ? confirmProps?.children : ''}
      onClick={() => onChange(!(on ?? setting.value.on))}
    >
      {label} {String(on ?? setting.value.on)}
    </div>
  ),
}))
vi.mock('./SelectSetting', () => ({
  SelectSetting: ({ disabled, value, values }: any) => (
    <div data-select data-value={value} data-choices={values.map((v: any) => `${v.key}=${v.name}`).join('|')}>
      {disabled ? 'locked' : 'open'}
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

import { DeviceExitChoice, DeviceExitOffer, chosenLine, policyLine } from './DeviceExitSection'
;(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true

const t = ((_key: string, text: string, values?: any) => text.replace(/{{(\w+)}}/g, (_, k) => values?.[k] ?? '')) as any
const none = {
  exitSetOnDevice: null,
  exitSetOnDeviceBy: null,
  exitSetBy: null,
  exitPolicy: 'cloud+local' as const,
  exitAllowed: null,
  exitPinned: null,
}

async function render(part: 'choice' | 'offer', settings?: any, permissions = ['MANAGE']) {
  const container = document.createElement('div')
  document.body.appendChild(container)
  const root = createRoot(container)
  const device = { id: 'LAPTOP', name: 'Laptop', permissions, owner: { id: 'OWNER' } } as any
  await act(async () =>
    root.render(
      part === 'choice' ? <DeviceExitChoice device={device} /> : <DeviceExitOffer device={device} settings={settings} />
    )
  )
  return container
}

describe('who chose the exit, and the machine’s policy', () => {
  it('says who chose it: on the device, by whom; or in the portal', () => {
    expect(chosenLine(t, { ...none, exitSetOnDevice: true, exitSetOnDeviceBy: 'bob' })).toBe('Set on the device by bob')
    expect(chosenLine(t, { ...none, exitSetOnDevice: true })).toBe('Set on the device')
    expect(chosenLine(t, { ...none, exitSetOnDevice: false, exitSetBy: { email: 'ann@example.com' } })).toBe(
      'Set by ann@example.com'
    )
    expect(chosenLine(t, null)).toBeNull()
  })

  it('says what the administrator decided', () => {
    expect(policyLine(t, none)).toBeNull()
    expect(policyLine(t, { ...none, exitPolicy: 'local' })?.label).toBe(
      'This machine’s administrator keeps its exit local'
    )
    expect(policyLine(t, { ...none, exitPolicy: 'never' })?.label).toBe(
      'This machine’s administrator allows it no exit'
    )
    expect(policyLine(t, { ...none, exitAllowed: ['EXIT'] })?.hint).toBe('EXIT')
    expect(policyLine(t, { ...none, exitPinned: 'EXIT' })?.label).toBe('Pinned by this machine’s administrator to EXIT')
  })

  it('shows them, and locks the choice under local', async () => {
    exit.mockResolvedValue({ offersExit: false, exit: { id: 'EXIT', name: 'office' } })
    chooser.mockResolvedValue({ ...none, exitSetOnDevice: true, exitSetOnDeviceBy: 'bob', exitPolicy: 'local' })
    const page = await render('choice')
    expect(page.textContent).toContain('Set on the device by bob')
    expect(page.textContent).toContain('keeps its exit local')
    expect(page.querySelector('[data-select]')?.textContent).toBe('locked')
    expect(page.textContent).not.toContain('exit node')
  })

  it('an API without the fields still shows the exit', async () => {
    exit.mockResolvedValue({ offersExit: false, exit: { id: 'EXIT', name: 'office' } })
    chooser.mockResolvedValue('UNSUPPORTED')
    const page = await render('choice')
    expect(page.querySelector('[data-select]')?.textContent).toBe('open')
    expect(page.textContent).not.toContain('Set on the device')
  })

  it('an API without device sessions shows neither', async () => {
    exit.mockResolvedValue('UNSUPPORTED')
    chooser.mockResolvedValue('UNSUPPORTED')
    expect((await render('choice')).textContent).toBe('')
    expect((await render('offer')).textContent).toBe('')
  })

  it('with device settings, whoever manages it switches it an exit node, and its LAN beneath while on', async () => {
    exit.mockResolvedValue({ offersExit: true, exit: null })
    chooser.mockResolvedValue(none)
    const setting = { name: 'exit_node', value: { on: true, lan: false }, control: 'cloud+local' }
    const settings = { setting: () => setting, set: vi.fn() }
    let page = await render('offer', settings)
    expect(page.querySelector('[data-select]')).toBeNull()
    const switches = [...page.querySelectorAll('[data-switch]')].map(e => e.textContent)
    expect(switches).toEqual(['Offer itself as an exit node true', 'Its local network too false'])

    page = await render('offer', settings, [])
    expect(page.querySelector('[data-switch]')).toBeNull()
    expect(page.textContent).toContain('Offers itself as an exit node')
  })

  it('Protect off on the device: its route said, and turned on through it by choosing it as the exit', async () => {
    exit.mockResolvedValue({ offersExit: false, exit: null })
    chooser.mockResolvedValue(none)
    protect.mockResolvedValue({ on: false, route: 'EXIT', routeName: 'e1' })
    setExit.mockClear()
    let page = await render('choice')
    expect(page.textContent).toContain('Protect: off — route e1')
    const on = page.querySelector('button')!
    expect(on.textContent).toBe('Turn on')
    await act(async () => on.click())
    expect(setExit).toHaveBeenCalledWith('LAPTOP', 'EXIT')

    // No name from the device: the exits list's, else the UID.
    protect.mockResolvedValue({ on: false, route: 'EXIT', routeName: null })
    expect((await render('choice')).textContent).toContain('Protect: off — route office')
    // Someone who does not manage it, or under the machine's local policy: said, not offered.
    expect((await render('choice', undefined, [])).querySelector('button')).toBeNull()
    chooser.mockResolvedValue({ ...none, exitPolicy: 'local' })
    expect((await render('choice')).querySelector('button')).toBeNull()

    // On (the exit shows), or no route kept, or an API before the field: nothing more.
    chooser.mockResolvedValue(none)
    exit.mockResolvedValue({ offersExit: false, exit: { id: 'EXIT', name: 'office' } })
    protect.mockResolvedValue({ on: true, route: 'EXIT', routeName: 'office' })
    expect((await render('choice')).textContent).not.toContain('Protect')
    exit.mockResolvedValue({ offersExit: false, exit: null })
    protect.mockResolvedValue('UNSUPPORTED')
    page = await render('choice')
    expect(page.textContent).not.toContain('Protect')
    protect.mockResolvedValue(null)
  })
})

describe('the account’s public-exit transfer under the exit picker', () => {
  const resetsAt = '2026-12-01T00:00:00.000Z'
  const resets = new Date(resetsAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
  const row = (fields = {}) => ({
    kind: 'exit',
    month: '2026-11',
    usedBytes: 8.2e9,
    allowanceBytes: 10e9,
    rateBps: 5e6,
    over: false,
    resetsAt,
    devices: [],
    ...fields,
  })
  const hint = (c: HTMLElement) => c.querySelector('[data-testid="transfer-usage-hint"]')
  const through = (id: string | null, isPublic: boolean | undefined) => {
    exit.mockResolvedValue({ offersExit: false, exit: id ? { id, name: 'e1' } : null })
    chooser.mockResolvedValue(none)
    protect.mockResolvedValue(null)
    publicExit.mockReset().mockResolvedValue(isPublic)
    usage.mockReset()
  }

  it.each([
    ['with an allowance', row(), '8.2 of 10 GB this month'],
    ['over it', row({ usedBytes: 12e9, over: true }), `Slowed to 5 Mbit/s until ${resets}`],
    ['with no allowance', row({ allowanceBytes: null }), '8.2 GB this month'],
  ])('through one of remote.it’s public exits, %s: the device owner’s', async (_, answer, text) => {
    through('E1', true)
    usage.mockResolvedValue([answer])
    const page = await render('choice')
    expect(publicExit).toHaveBeenCalledWith('E1')
    expect(usage).toHaveBeenCalledWith('OWNER')
    expect(hint(page)!.textContent).toBe(text)
    expect(hint(page)!.getAttribute('data-over')).toBe(answer.over ? 'true' : null)
  })

  it('the route kept while Protect is off counts as the exit', async () => {
    through(null, true)
    protect.mockResolvedValue({ on: false, route: 'E1', routeName: 'e1' })
    usage.mockResolvedValue([row()])
    const page = await render('choice')
    expect(publicExit).toHaveBeenCalledWith('E1')
    expect(hint(page)!.textContent).toBe('8.2 of 10 GB this month')
    protect.mockResolvedValue(null)
  })

  it('nothing for an exit not remote.it’s, none chosen, or an API that cannot say, and nothing asked', async () => {
    for (const [id, isPublic] of [
      ['EXIT', false],
      ['EXIT', undefined],
      [null, true],
    ] as const) {
      through(id, isPublic)
      usage.mockResolvedValue([row()])
      expect(hint(await render('choice'))).toBeNull()
      expect(usage).not.toHaveBeenCalled()
    }
    // Nor for someone who does not manage it: there is no picker.
    through('E1', true)
    expect(hint(await render('choice', undefined, []))).toBeNull()
  })

  it('nothing where the usage cannot be read, the exit choice unharmed', async () => {
    through('E1', true)
    usage.mockRejectedValue(new Error('network'))
    let page = await render('choice')
    expect(hint(page)).toBeNull()
    expect(page.querySelector('[data-select]')?.textContent).toBe('open')
    for (const answer of ['ERROR', 'UNSUPPORTED', []]) {
      usage.mockResolvedValue(answer)
      page = await render('choice')
      expect(hint(page)).toBeNull()
      expect(page.querySelector('[data-select]')?.textContent).toBe('open')
    }
  })
})

describe('an exit in a group', () => {
  const member = (id: string, kind = 'exit') => ({ id, name: id, kind, state: 'active' })
  const group = (members: any[]) => ({
    label: 'gabc123',
    name: 'Laptop exits',
    remoteit: false,
    host: null,
    members,
    users: 3,
    endpoints: 0,
  })
  const setting = { name: 'exit_node', value: { on: true, lan: false }, control: 'cloud+local' }
  const button = (text: string) =>
    [...document.body.querySelectorAll('button')].find(b => b.textContent?.includes(text)) as HTMLButtonElement
  const offer = (c: HTMLElement) => c.querySelector('[data-switch]') as HTMLElement

  async function offering(members: any[]) {
    document.body.innerHTML = ''
    exit.mockResolvedValue({ offersExit: true, exit: null })
    chooser.mockResolvedValue(none)
    deviceGroup.mockResolvedValue(group(members))
    leave.mockClear().mockResolvedValue({})
    deleteGroup.mockClear().mockResolvedValue({})
    const settings = { setting: () => setting, set: vi.fn(async () => true) }
    return { page: await render('offer', settings), settings }
  }

  it('the last exit in its group turned off: asks whether to delete the group too, keeping it by default', async () => {
    const { page, settings } = await offering([member('LAPTOP')])
    expect(offer(page).dataset.confirm).toBe('')
    await act(async () => offer(page).click())
    expect(document.body.textContent).toContain('Stop offering Laptop as an exit node?')
    expect(document.body.textContent).toContain('It is the last device in its group, Laptop exits.')
    expect(document.body.textContent).toContain('3 devices use it as their exit, and it has no endpoints.')
    await act(async () => button('Keep the group').click())
    expect(settings.set).toHaveBeenCalledWith('exit_node', { on: false, lan: false })
    expect(leave).not.toHaveBeenCalled()
    expect(deleteGroup).not.toHaveBeenCalled()
  })

  it('deleting the group too: its exit off, the device taken out of the group, then the group deleted, confirmed', async () => {
    const { page, settings } = await offering([member('LAPTOP')])
    await act(async () => offer(page).click())
    await act(async () => button('Delete the group too').click())
    expect(settings.set).toHaveBeenCalledWith('exit_node', { on: false, lan: false })
    expect(leave).toHaveBeenCalledWith('LAPTOP')
    expect(deleteGroup).toHaveBeenCalledWith('gabc123', true)
    // Taken out, but the group not deleted: said.
    const again = await offering([member('LAPTOP')])
    deleteGroup.mockResolvedValue({ reason: 'A device joined Laptop exits meanwhile: it is not deleted' })
    await act(async () => offer(again.page).click())
    await act(async () => button('Delete the group too').click())
    expect(document.body.textContent).toContain('A device joined Laptop exits meanwhile')
  })

  it('not the last device, or a proxy too: a plain confirmation of what happens to those using the group', async () => {
    let { page } = await offering([member('LAPTOP'), member('PI')])
    expect(offer(page).dataset.confirm).toBe(
      'Those using its group, Laptop exits, as their exit go out through another exit in it, or wait for one.'
    )
    ;({ page } = await offering([member('LAPTOP', 'own')]))
    expect(offer(page).dataset.confirm).toContain('It stays in its group, Laptop exits, as a proxy.')
    await act(async () => offer(page).click())
    expect(document.body.textContent).not.toContain('Keep the group')
  })

  it('a dormant exit: the group shown as its exit, said dormant — its traffic its usual way — and no Protect to turn on', async () => {
    document.body.innerHTML = ''
    exit.mockResolvedValue({ offersExit: false, exit: null })
    chooser.mockResolvedValue(none)
    // The device says Protect off, its route the group: dormant, that is not offered to turn on.
    protect.mockResolvedValue({ on: false, route: 'gabc123', routeName: 'Office Mac' })
    exitGroup.mockResolvedValue({ label: 'gabc123', group: { name: 'Office Mac' }, dormant: true })
    const page = await render('choice')
    expect(page.textContent).toContain('Its exit, Office Mac, is dormant')
    expect(page.textContent).toContain('its traffic goes its usual way, Protect off for it, until one is')
    expect(page.textContent).not.toContain('takes its traffic now')
    expect(page.textContent).not.toContain('Protect: off')
    expect(page.querySelector('[data-select]')?.getAttribute('data-value')).toBe('gabc123')
    protect.mockResolvedValue(null)
    exitGroup.mockResolvedValue(null)
  })

  it('the groups shared with you, offered, are among the exits, named with whose they are; one chosen shows as itself', async () => {
    document.body.innerHTML = ''
    chooser.mockResolvedValue(none)
    protect.mockResolvedValue(null)
    shared.mockResolvedValue([
      { label: 'gshared', name: 'Pat exits', offered: true, owner: { id: 'PAT', email: 'pat@example.com' } },
      { label: 'gempty', name: 'Old Mac', offered: false, owner: { id: 'PAT', email: 'pat@example.com' } },
    ])
    exit.mockResolvedValue({ offersExit: false, exit: null })
    exitGroup.mockResolvedValue(null)
    let select = (await render('choice')).querySelector('[data-select]')!
    expect(select.getAttribute('data-choices')).toBe(
      '=None — its usual way out|EXIT=office|gshared=Pat exits · shared by pat@example.com'
    )
    // Through it now, by its member: the group is what is chosen.
    exit.mockResolvedValue({ offersExit: false, exit: { id: 'MAC', name: 'Office Mac' } })
    exitGroup.mockResolvedValue({ label: 'gshared', group: null, dormant: false })
    select = (await render('choice')).querySelector('[data-select]')!
    expect(select.getAttribute('data-value')).toBe('gshared')
    expect(select.getAttribute('data-choices')).not.toContain('MAC=')
    shared.mockResolvedValue([])
    exitGroup.mockResolvedValue(null)
  })

  it('a device whose exit is a group with no device taking its traffic: the group shown as its exit, and why it waits', async () => {
    document.body.innerHTML = ''
    exit.mockResolvedValue({ offersExit: false, exit: null })
    chooser.mockResolvedValue(none)
    protect.mockResolvedValue(null)
    exitGroup.mockResolvedValue({ label: 'gabc123', group: { name: 'Office Mac' } })
    const page = await render('choice')
    expect(exitGroup).toHaveBeenCalledWith('LAPTOP')
    expect(page.textContent).toContain('No device in Office Mac takes its traffic now')
    // Through a member now, or none chosen: not asked, nothing said.
    exitGroup.mockClear().mockResolvedValue(null)
    exit.mockResolvedValue({ offersExit: false, exit: { id: 'EXIT', name: 'office' } })
    expect((await render('choice')).textContent).not.toContain('takes its traffic now')
    expect(exitGroup).not.toHaveBeenCalled()
  })
})
