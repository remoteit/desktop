import React, { act } from 'react'
import { createRoot, Root } from 'react-dom/client'
import { describe, it, expect, vi, beforeEach } from 'vitest'

const { state, candidates } = vi.hoisted(() => ({
  state: { devices: [] as IDevice[] },
  candidates: vi.fn(async (_kind: string, _of: any, _deviceIds?: string[]) => [] as any),
}))
vi.mock('react-redux', () => ({ useSelector: (select: (state: any) => any) => select(state) }))
vi.mock('../selectors/devices', () => ({ getAllDevices: (store: { devices: IDevice[] }) => store.devices }))
vi.mock('../services/graphQLDeviceRuns', () => ({ graphQLRunCandidates: candidates }))
vi.mock('./LoadingMessage', () => ({ LoadingMessage: () => <div data-loading /> }))
vi.mock('./Notice', () => ({
  Notice: ({ children, severity }: any) => <div data-notice={severity}>{children}</div>,
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

import { RunDevicePicker, addEach } from './RunDevicePicker'
;(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true

type Props = React.ComponentProps<typeof RunDevicePicker>

const NONE = { proxy: null, exit: null }
// A device weighed: fit, or why not; and what it runs now.
const candidate = (id: string, name: string, fields: any = {}) => ({ id, name, fit: true, refusal: null, runs: NONE, ...fields })
const runsExit = (id: string, name: string) => ({ proxy: null, exit: { state: 'ACTIVE', exit: { id, name } } })

const onAdd = vi.fn()
let root: Root
const picker = (props: Partial<Props>) => (
  <RunDevicePicker kind="exit" target="xoffice" ownerId="OWNER" onAdd={onAdd} {...props} />
)
async function render(props: Partial<Props> = {}) {
  document.body.innerHTML = ''
  const container = document.createElement('div')
  document.body.appendChild(container)
  root = createRoot(container)
  await act(async () => root.render(picker(props)))
  return container
}
const rerender = (props: Partial<Props>) => act(async () => root.render(picker(props)))
const click = async (element: Element | null | undefined) => act(async () => (element as HTMLElement).click())
const listed = (page: HTMLElement) =>
  [...page.querySelectorAll('[data-candidate]')].map(each => each.getAttribute('data-candidate'))
const row = (page: HTMLElement, id: string) => page.querySelector(`[data-candidate="${id}"]`) as HTMLElement
const chosen = (page: HTMLElement, id: string) =>
  (row(page, id)?.querySelector('input[type="checkbox"]') as HTMLInputElement).checked
const add = (page: HTMLElement) => page.querySelector('[data-add]') as HTMLButtonElement
const button = (page: HTMLElement, text: string) =>
  [...page.querySelectorAll('button')].find(each => each.textContent === text) as HTMLButtonElement | undefined
const search = (page: HTMLElement) => page.querySelector('input[type="text"]') as HTMLInputElement | null
async function type(input: HTMLInputElement, value: string) {
  const set = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')!.set!
  await act(async () => {
    set.call(input, value)
    input.dispatchEvent(new Event('input', { bubbles: true }))
  })
}
const OWNER = { id: 'OWNER', email: 'owner@example.com' }
const device = (id: string, name: string, fields: Partial<IDevice> = {}) =>
  ({ id, name, state: 'active', permissions: ['VIEW', 'MANAGE'], owner: OWNER, ...fields } as IDevice)

beforeEach(() => {
  onAdd.mockReset()
  state.devices = []
  candidates
    .mockReset()
    .mockResolvedValue([
      candidate('B1', 'Pi'),
      candidate('A1', 'Mac'),
      candidate('C1', 'Router', { fit: false, refusal: 'Its daemon is not online to say what it can be' }),
      candidate('R1', 'Running', { fit: false, refusal: 'It runs it already', runs: runsExit('xoffice', 'Office') }),
    ])
})

describe('choosing devices to run a proxy or an exit', () => {
  it('weighs the devices for its exit or proxy: those fit first by name, then those not, those running it already left out', async () => {
    const page = await render()
    expect(candidates).toHaveBeenCalledWith('exit', { id: 'xoffice' })
    expect(listed(page)).toEqual(['A1', 'B1', 'C1'])
    await render({ kind: 'proxy', target: 'P1' })
    expect(candidates).toHaveBeenLastCalledWith('proxy', { id: 'P1' })
  })

  it('one not fit is said by why, in graphql’s words, and cannot be chosen', async () => {
    const page = await render()
    expect(row(page, 'C1').textContent).toContain('Its daemon is not online to say what it can be')
    expect(row(page, 'C1').getAttribute('data-fit')).toBe('no')
    await click(row(page, 'C1'))
    expect(chosen(page, 'C1')).toBe(false)
    expect(add(page).disabled).toBe(true)
  })

  it('one fit says it can run it, or what it leaves to run it', async () => {
    candidates.mockResolvedValue([candidate('A1', 'Mac'), candidate('B1', 'Pi', { runs: runsExit('xold', 'Old exit') })])
    const page = await render()
    expect(row(page, 'A1').textContent).toContain('Can run it')
    expect(row(page, 'B1').textContent).toContain('Runs the exit Old exit: added, it leaves it')
  })

  it('adds those chosen, several at once; one chosen again is no longer chosen', async () => {
    const page = await render()
    expect(add(page).disabled).toBe(true)
    await click(row(page, 'A1'))
    await click(row(page, 'B1'))
    expect(add(page).textContent).toBe('Add 2 devices')
    await click(row(page, 'A1'))
    expect(add(page).textContent).toBe('Add 1 device')
    await click(add(page))
    expect(onAdd).toHaveBeenCalledWith(['B1'])
  })

  it('names its action as the caller does, and adds nothing while busy', async () => {
    const page = await render({ action: 'Run it', busy: true })
    await click(row(page, 'A1'))
    expect(add(page).textContent).toBe('Run it')
    expect(add(page).disabled).toBe(true)
  })

  it('may be skipped where the caller allows: named as it says, or “Not now”, and not while busy', async () => {
    const onSkip = vi.fn()
    let page = await render({ onSkip })
    await click(button(page, 'Not now'))
    expect(onSkip).toHaveBeenCalled()
    page = await render({ onSkip, skip: 'Later', busy: true })
    expect(button(page, 'Later')?.disabled).toBe(true)
    page = await render()
    expect(button(page, 'Not now')).toBeUndefined()
  })

  it('more than eight: a search narrows them by name, whatever its case, those chosen staying chosen', async () => {
    candidates.mockResolvedValue(Array.from({ length: 8 }, (_, n) => candidate(`D${n + 1}`, `Desk ${n + 1}`)))
    let page = await render()
    expect(search(page)).toBeNull()
    candidates.mockResolvedValue([
      ...Array.from({ length: 8 }, (_, n) => candidate(`D${n + 1}`, `Desk ${n + 1}`)),
      candidate('R9', 'Raspberry Pi'),
    ])
    page = await render()
    await click(row(page, 'D1'))
    await type(search(page)!, ' PI ')
    expect(listed(page)).toEqual(['R9'])
    await click(row(page, 'R9'))
    await type(search(page)!, '')
    expect(listed(page)).toHaveLength(9)
    expect(chosen(page, 'D1')).toBe(true)
    await click(add(page))
    expect(onAdd).toHaveBeenCalledWith(['D1', 'R9'])
  })

  it('a search set stays shown while it narrows the list, eight or fewer left too, until it is cleared', async () => {
    const nine = [...Array.from({ length: 8 }, (_, n) => candidate(`D${n + 1}`, `Desk ${n + 1}`)), candidate('R9', 'Pi')]
    candidates.mockResolvedValue(nine)
    const page = await render()
    await type(search(page)!, 'desk')
    expect(listed(page)).toHaveLength(8)
    // Two added meanwhile: read again, they run it, and are left out; the search stays shown to clear.
    candidates.mockResolvedValue([
      ...nine.slice(2),
      ...nine.slice(0, 2).map(each => ({ ...each, fit: false, runs: runsExit('xoffice', 'Office') })),
    ])
    await rerender({ refusals: {} })
    expect(search(page)?.value).toBe('desk')
    expect(listed(page)).toEqual(['D3', 'D4', 'D5', 'D6', 'D7', 'D8'])
    await type(search(page)!, '')
    expect(search(page)).toBeNull()
    expect(listed(page)).toHaveLength(7)
  })

  it('says each refusal by its device’s name, in graphql’s words, or that it was not added; and reads them again', async () => {
    const page = await render()
    expect(page.querySelector('[data-notice="warning"]')).toBeNull()
    expect(candidates).toHaveBeenCalledTimes(1)
    await rerender({ refusals: { B1: 'Its administrator forbids exits on the machine', A1: '', Z9: 'Not a device' } })
    expect([...page.querySelectorAll('[data-refused]')].map(each => each.textContent)).toEqual([
      'Pi: Its administrator forbids exits on the machine',
      'Mac: not added: try again',
      'Z9: Not a device',
    ])
    expect(candidates).toHaveBeenCalledTimes(2)
  })

  it('a chosen device no longer fit when read again is not added, nor chosen should it be fit again', async () => {
    const page = await render()
    await click(row(page, 'A1'))
    await click(row(page, 'B1'))
    // Mac was added and runs it now; Pi was refused, and is left chosen to try again.
    candidates.mockResolvedValue([
      candidate('B1', 'Pi'),
      candidate('A1', 'Mac', { fit: false, refusal: 'It runs it already', runs: runsExit('xoffice', 'Office') }),
    ])
    await rerender({ refusals: { B1: 'Not online' } })
    expect(listed(page)).toEqual(['B1'])
    expect(add(page).textContent).toBe('Add 1 device')
    await click(add(page))
    expect(onAdd).toHaveBeenCalledWith(['B1'])
    candidates.mockResolvedValue([candidate('B1', 'Pi'), candidate('A1', 'Mac')])
    await rerender({ refusals: {} })
    expect(chosen(page, 'A1')).toBe(false)
  })

  it('an account with too many devices to weigh whole: weighed by those the app has listed of it that you manage', async () => {
    state.devices = [
      device('A1', 'Mac'),
      device('B1', 'Pi', { permissions: ['VIEW'] }),
      device('C1', 'Router', { owner: { id: 'OTHER', email: 'other@example.com' } }),
      device('A1', 'Mac'),
    ]
    candidates
      .mockReset()
      .mockResolvedValueOnce({ reason: 'The account has 1,200 devices: name those to weigh (deviceIds), at most 1000' })
      .mockResolvedValueOnce([candidate('A1', 'Mac')])
    const page = await render()
    expect(candidates).toHaveBeenLastCalledWith('exit', { id: 'xoffice' }, ['A1'])
    expect(listed(page)).toEqual(['A1'])
  })

  it('a refusal with none to name instead: said in graphql’s words', async () => {
    candidates.mockReset().mockResolvedValue({ reason: 'No access' })
    const page = await render()
    expect(page.querySelector('[data-notice="error"]')?.textContent).toBe('No access')
    expect(add(page).disabled).toBe(true)
  })

  it('none to choose: says so, and adds nothing', async () => {
    candidates.mockResolvedValue([])
    const page = await render()
    expect(page.textContent).toContain('No device of this account that you manage is listed here.')
    expect(add(page).disabled).toBe(true)
  })
})

describe('adding devices to a local network proxy', () => {
  const OTHER = 'Laptop is on another network (10.0.0.0/24) than Office (192.168.1.0/24)'

  it('a device on another network than its own: not addable, said why in graphql’s words', async () => {
    candidates.mockResolvedValue([
      candidate('A1', 'Printer Pi'),
      candidate('L1', 'Laptop', { fit: false, refusal: OTHER }),
    ])
    const page = await render({ kind: 'proxy', target: 'P-LAN' })
    expect(candidates).toHaveBeenCalledWith('proxy', { id: 'P-LAN' })
    expect(listed(page)).toEqual(['A1', 'L1'])
    expect(row(page, 'L1').getAttribute('data-fit')).toBe('no')
    expect(row(page, 'L1').textContent).toBe(`Laptop${OTHER}`)
    await click(row(page, 'L1'))
    expect(chosen(page, 'L1')).toBe(false)
    expect(add(page).disabled).toBe(true)
  })

  it('one refused as it is added — the first added set another network —: said by its name in graphql’s words', async () => {
    candidates.mockResolvedValue([candidate('A1', 'Printer Pi'), candidate('L1', 'Laptop')])
    const page = await render({ kind: 'proxy', target: 'P-LAN' })
    await rerender({ kind: 'proxy', target: 'P-LAN', refusals: { L1: OTHER } })
    expect([...page.querySelectorAll('[data-refused]')].map(each => each.textContent)).toEqual([`Laptop: ${OTHER}`])
  })
})

describe('adding devices to an exit whose users reach its devices’ local networks', () => {
  const warning = (page: HTMLElement) => page.querySelector('[data-lan-warning]')?.textContent

  it('says so plainly before any is added, naming those chosen as they are chosen', async () => {
    const page = await render({ lan: true })
    expect(page.querySelector('[data-notice="warning"] [data-lan-warning]')).not.toBeNull()
    expect(warning(page)).toBe(
      'This exit lets its users reach its devices’ local networks: each device added opens its network to them.'
    )
    await click(row(page, 'A1'))
    expect(warning(page)).toBe(
      'This exit lets its users reach its devices’ local networks: adding Mac opens its network to them.'
    )
    await click(row(page, 'B1'))
    expect(warning(page)).toBe(
      'This exit lets its users reach its devices’ local networks: adding Mac, Pi opens their networks to them.'
    )
    expect(onAdd).not.toHaveBeenCalled()
    await click(add(page))
    expect(onAdd).toHaveBeenCalledWith(['A1', 'B1'])
  })

  it('nothing said for an exit whose users do not reach them, or for a proxy', async () => {
    let page = await render()
    await click(row(page, 'A1'))
    expect(warning(page)).toBeUndefined()
    page = await render({ kind: 'proxy', target: 'P1', lan: true })
    await click(row(page, 'A1'))
    expect(warning(page)).toBeUndefined()
  })
})

describe('adding devices one after another', () => {
  it('adds each in turn, the next once the one before is answered', async () => {
    const answers: ((result: { runs: unknown } | { reason: string }) => void)[] = []
    const each = vi.fn(
      (_id: string) => new Promise<{ runs: unknown } | { reason: string }>(resolve => answers.push(resolve))
    )
    const done = addEach(['A1', 'B1'], each)
    await new Promise(resolve => setTimeout(resolve, 0))
    expect(each.mock.calls.map(call => call[0])).toEqual(['A1'])
    answers[0]({ runs: {} })
    await new Promise(resolve => setTimeout(resolve, 0))
    expect(each.mock.calls.map(call => call[0])).toEqual(['A1', 'B1'])
    answers[1]({ runs: {} })
    expect(await done).toEqual({})
  })

  it('answers each refusal by device id, in graphql’s words — or none said —, and nothing for those added', async () => {
    const each = vi.fn(async (id: string) =>
      id === 'A1' ? { runs: {} } : id === 'B1' ? { reason: 'Its daemon cannot be a proxy' } : { reason: '' }
    )
    expect(await addEach(['A1', 'B1', 'C1'], each)).toEqual({ B1: 'Its daemon cannot be a proxy', C1: '' })
  })

  it('none to add: nothing asked', async () => {
    const each = vi.fn(async (_id: string) => ({ runs: {} }))
    expect(await addEach([], each)).toEqual({})
    expect(each).not.toHaveBeenCalled()
  })
})
