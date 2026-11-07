import React, { act } from 'react'
import { createRoot, Root } from 'react-dom/client'
import { describe, it, expect, vi, beforeEach } from 'vitest'

const { state } = vi.hoisted(() => ({ state: { devices: [] as IDevice[] } }))
vi.mock('react-redux', () => ({ useSelector: (select: (state: any) => any) => select(state) }))
vi.mock('../selectors/devices', () => ({ getAllDevices: (store: { devices: IDevice[] }) => store.devices }))
vi.mock('./Notice', () => ({ Notice: ({ children }: any) => <div data-notice>{children}</div> }))
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

const OWNER = { id: 'OWNER', email: 'owner@example.com' }
const device = (id: string, name: string, fields: Partial<IDevice> = {}) =>
  ({ id, name, state: 'active', permissions: ['VIEW', 'MANAGE'], owner: OWNER, ...fields } as IDevice)

const onAdd = vi.fn()
let root: Root
const picker = (props: Partial<Props>) => (
  <RunDevicePicker kind="exit" ownerId="OWNER" exclude={[]} onAdd={onAdd} {...props} />
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
const candidate = (page: HTMLElement, id: string) => page.querySelector(`[data-candidate="${id}"]`)
const chosen = (page: HTMLElement, id: string) =>
  (candidate(page, id)?.querySelector('input[type="checkbox"]') as HTMLInputElement).checked
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

beforeEach(() => {
  onAdd.mockReset()
  state.devices = [device('A1', 'Mac'), device('B1', 'Pi'), device('C1', 'Nuc')]
})

describe('choosing devices to run a proxy or an exit', () => {
  it('lists the devices of its account that you manage, once each, by name — not another account’s, one you only see, a virtual or disabled one, or one running it already', async () => {
    state.devices = [
      device('B1', 'Mac'),
      device('A1', 'apple pi'),
      device('C1', 'Router', { owner: { id: 'OTHER', email: 'other@example.com' } }),
      device('D1', 'Shared', { permissions: ['VIEW', 'CONNECT'] }),
      device('E1', 'Printer', { virtual: true }),
      device('F1', 'Old', { disabled: true }),
      device('G1', 'Running'),
      device('B1', 'Mac'), // listed again, under another account the person is in
      device('H1', 'nuc', { owner: { id: 'owner', email: 'owner@example.com' } }),
    ]
    const page = await render({ ownerId: 'Owner', exclude: ['g1'] })
    expect(listed(page)).toEqual(['A1', 'B1', 'H1'])
  })

  it('says whether each is online: one offline is refused until it is', async () => {
    state.devices = [device('A1', 'Mac'), device('B1', 'Pi', { state: 'inactive' })]
    const page = await render()
    expect(candidate(page, 'A1')?.textContent).toBe('MacOnline')
    expect(candidate(page, 'B1')?.textContent).toBe('PiOffline: it is refused until it is online')
  })

  it('adds those chosen, several at once; one chosen again is no longer chosen', async () => {
    const page = await render()
    expect(add(page).disabled).toBe(true)
    await click(candidate(page, 'A1'))
    expect(chosen(page, 'A1')).toBe(true)
    expect(add(page).textContent).toBe('Add 1 device')
    await click(candidate(page, 'B1'))
    await click(candidate(page, 'C1'))
    await click(candidate(page, 'C1'))
    expect(chosen(page, 'C1')).toBe(false)
    expect(add(page).textContent).toBe('Add 2 devices')
    await click(add(page))
    expect(onAdd).toHaveBeenCalledWith(['A1', 'B1'])
  })

  it('names its action as the caller does, and adds nothing while busy', async () => {
    const page = await render({ action: 'Run it on these', busy: true })
    await click(candidate(page, 'A1'))
    expect(add(page).textContent).toBe('Run it on these')
    expect(add(page).disabled).toBe(true)
  })

  it('may be skipped where the caller allows: named as it says, or “Not now”, and not while busy', async () => {
    const onSkip = vi.fn()
    let page = await render({ onSkip })
    await click(button(page, 'Not now'))
    expect(onSkip).toHaveBeenCalledTimes(1)
    page = await render({ onSkip, skip: 'Later', busy: true })
    expect(button(page, 'Later')?.disabled).toBe(true)
    page = await render()
    expect(add(page)).not.toBeNull()
    expect(button(page, 'Not now')).toBeUndefined()
  })

  it('more than eight: a search narrows them by name, whatever its case, those chosen staying chosen', async () => {
    state.devices = Array.from({ length: 8 }, (_, n) => device(`D${n + 1}`, `Desk ${n + 1}`))
    let page = await render()
    expect(listed(page)).toHaveLength(8)
    expect(search(page)).toBeNull()

    state.devices = [...state.devices, device('R9', 'Raspberry Pi')]
    page = await render()
    expect(page.querySelector('label')?.textContent).toBe('Find a device')
    await click(candidate(page, 'D1'))
    await type(search(page)!, ' PI ')
    expect(listed(page)).toEqual(['R9'])
    await click(candidate(page, 'R9'))
    await type(search(page)!, '')
    expect(listed(page)).toHaveLength(9)
    expect(chosen(page, 'D1')).toBe(true)
    await click(add(page))
    expect(onAdd).toHaveBeenCalledWith(['D1', 'R9'])
  })

  it('says each refusal by its device’s name, in graphql’s words, or that it was not added', async () => {
    let page = await render()
    expect(page.querySelector('[data-notice]')).toBeNull()
    page = await render({
      refusals: { B1: 'Its daemon is not online to say whether it can be a proxy', A1: '', Z9: 'Not a device' },
    })
    expect([...page.querySelectorAll('[data-refused]')].map(each => each.textContent)).toEqual([
      'Pi: Its daemon is not online to say whether it can be a proxy',
      'Mac: not added: try again',
      'Z9: Not a device',
    ])
  })

  it('a chosen device it no longer lists — added meanwhile — is not added again', async () => {
    const page = await render()
    await click(candidate(page, 'A1'))
    await click(candidate(page, 'B1'))
    // Mac was added and runs it now; Pi was refused, and is left chosen to try again.
    await rerender({ exclude: ['A1'], refusals: { B1: 'Not online' } })
    expect(listed(page)).toEqual(['C1', 'B1'])
    expect(chosen(page, 'B1')).toBe(true)
    await click(add(page))
    expect(onAdd).toHaveBeenCalledWith(['B1'])
  })

  it('counts only the chosen devices it still lists', async () => {
    const page = await render()
    await click(candidate(page, 'A1'))
    await click(candidate(page, 'B1'))
    await rerender({ exclude: ['A1'], refusals: { B1: 'Not online' } })
    expect(add(page).textContent).toBe('Add 1 device')
  })

  it('a chosen device gone from the list and back is not chosen still', async () => {
    const page = await render()
    await click(candidate(page, 'A1'))
    await rerender({ exclude: ['A1'] })
    expect(add(page).disabled).toBe(true)
    await rerender({ exclude: [] })
    expect(chosen(page, 'A1')).toBe(false)
    expect(add(page).disabled).toBe(true)
  })

  it('a search set stays shown while it narrows the list, eight or fewer left too, until it is cleared', async () => {
    state.devices = [...Array.from({ length: 8 }, (_, n) => device(`D${n + 1}`, `Desk ${n + 1}`)), device('R9', 'Pi')]
    const page = await render()
    await type(search(page)!, 'desk')
    expect(listed(page)).toHaveLength(8)
    // Two added meanwhile: eight to choose from, the search still narrowing them, and still shown to clear.
    await rerender({ exclude: ['D1', 'D2'] })
    expect(search(page)?.value).toBe('desk')
    expect(listed(page)).toEqual(['D3', 'D4', 'D5', 'D6', 'D7', 'D8'])
    await type(search(page)!, '')
    expect(search(page)).toBeNull()
    expect(listed(page)).toHaveLength(7)
  })

  it('none to choose: says so, and adds nothing', async () => {
    state.devices = [device('A1', 'Mac', { owner: { id: 'OTHER', email: 'other@example.com' } })]
    const page = await render()
    expect(page.textContent).toContain('No device of this account that you manage is listed here.')
    expect(listed(page)).toEqual([])
    expect(add(page).disabled).toBe(true)
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
