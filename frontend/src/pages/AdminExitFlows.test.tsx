import React, { act } from 'react'
import { createRoot } from 'react-dom/client'
import { MemoryRouter } from 'react-router-dom'
import { describe, it, expect, vi, beforeEach } from 'vitest'

// The Exit flows tab of Admin → Proxies & exits: an address, a port, or both and a time looked up only when asked, the
// window passed to graphql as chosen; each flow with its exit by name, client device, account charged, who opened it,
// destination, duration and bytes; the flows found narrowed by exit, account, device or person and paged; and the
// unasked, empty, refused, failed, truncated and unserved states each said.
const { served, flows, machines } = vi.hoisted(() => ({ served: vi.fn(), flows: vi.fn(), machines: vi.fn() }))
// The service's own calls are its own test's (services/adminExitFlows.test.ts): here, its bounds and words, real.
vi.mock('../services/post', () => ({ post: vi.fn() }))
vi.mock('../services/graphQL', () => ({ graphQLRequestWithReason: vi.fn() }))
vi.mock('../services/graphQLDaemon', () => ({ UNSUPPORTED: 'UNSUPPORTED' }))
vi.mock('../services/adminExitFlows', async importActual => ({
  ...(await importActual<typeof import('../services/adminExitFlows')>()),
  adminExitFlowsServed: served,
  fetchAdminExitFlows: flows,
}))
vi.mock('../services/graphQLRemoteit', () => ({ graphQLRemoteitMachines: machines }))
vi.mock('../helpers/dateHelper', () => ({ humanizeDuration: (ms: number) => `${ms / 1000}s` }))
vi.mock('../components/Timestamp', () => ({ Timestamp: ({ date }: any) => <>{date.toISOString()}</> }))
vi.mock('../components/LoadingMessage', () => ({ LoadingMessage: () => <div data-testid="loading">loading</div> }))
vi.mock('../components/Gutters', () => ({ Gutters: ({ children }: any) => <div>{children}</div> }))
vi.mock('../components/Notice', () => ({ Notice: ({ children }: any) => <div data-notice>{children}</div> }))

import { AdminExitFlows, PAGE_SIZE, localInputValue, lookupReady } from './AdminExitFlows'
;(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true

const flow = (fields = {}) => ({
  exitId: 'X1',
  start: '2026-11-10T18:00:00.000Z',
  end: '2026-11-10T18:02:00.000Z',
  accountId: 'A1',
  accountEmail: 'owner@example.com',
  clientId: 'C1',
  sessionId: 'S1',
  proto: 'tcp',
  address: '203.0.113.7',
  port: 40123,
  destination: '93.184.216.34:443',
  up: 1200,
  down: 34000,
  localAccount: '501',
  personId: 'P1',
  personEmail: 'pat@example.com',
  ...fields,
})

const FOUND = {
  flows: [
    flow(),
    flow({ exitId: 'X2', accountId: 'A2', accountEmail: null, clientId: 'C2', personId: null, personEmail: null }),
    flow({ localAccount: null, personId: 'P2', personEmail: 'sam@example.com', clientId: 'C3' }),
  ],
  truncated: false,
  from: '2026-11-10T17:46:00.000Z',
  to: '2026-11-10T18:16:00.000Z',
}

const flush = () => act(async () => {})

let root: ReturnType<typeof createRoot> | undefined

// Each test on a body of its own: the last one's root unmounted first, menus and all.
async function render() {
  if (root) await act(async () => root!.unmount())
  document.body.innerHTML = ''
  const container = document.createElement('div')
  document.body.appendChild(container)
  root = createRoot(container)
  await act(async () =>
    root!.render(
      <MemoryRouter>
        <AdminExitFlows />
      </MemoryRouter>
    )
  )
  return container
}

const field = (c: HTMLElement, choice: string) => c.querySelector<HTMLInputElement>(`[data-choice="${choice}"]`)!

async function type(c: HTMLElement, choice: string, text: string) {
  const setValue = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')!.set!
  await act(async () => {
    setValue.call(field(c, choice), text)
    field(c, choice).dispatchEvent(new Event('input', { bubbles: true }))
  })
}

// Opens an MUI select and picks the option that reads `label`.
async function choose(c: HTMLElement, selector: string, label: string) {
  const select = c
    .querySelector(selector)!
    .closest('.MuiFormControl-root')!
    .querySelector('[role="combobox"], [role="button"]')!
  await act(async () => select.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, button: 0 })))
  const option = [...document.querySelectorAll<HTMLElement>('[role="option"]')].find(o => o.textContent === label)!
  await act(async () => option.click())
  await flush()
}

const lookUp = async (c: HTMLElement) => {
  await act(async () => c.querySelector<HTMLElement>('[data-testid="look-up"]')!.click())
  await flush()
}
const button = (c: HTMLElement) => c.querySelector<HTMLButtonElement>('[data-testid="look-up"]')!
const rows = (c: HTMLElement) => [...c.querySelectorAll<HTMLElement>('[data-flow]')]
const cell = (row: HTMLElement, name: string) => row.querySelector(`[data-cell="${name}"]`)!
const testId = (c: HTMLElement, id: string) => c.querySelector(`[data-testid="${id}"]`)

beforeEach(() => {
  served.mockReset().mockResolvedValue(true)
  flows.mockReset().mockResolvedValue(FOUND)
  machines.mockReset().mockResolvedValue([{ id: 'X1', name: 'pdx1a-1' }])
})

describe('lookupReady', () => {
  const form = { at: '2026-11-10T10:01', address: '', port: '', withinMinutes: 15, laterHours: 1, limit: 200 }
  it('wants a time and an address, a port in range, or both', () => {
    expect(lookupReady(form)).toBe(false)
    expect(lookupReady({ ...form, address: '203.0.113.7' })).toBe(true)
    expect(lookupReady({ ...form, port: '443' })).toBe(true)
    expect(lookupReady({ ...form, port: '70000' })).toBe(false)
    expect(lookupReady({ ...form, port: '443', at: '' })).toBe(false)
  })

  it('fills the time in local time', () => {
    const at = new Date(2026, 10, 10, 10, 1)
    expect(localInputValue(at)).toBe('2026-11-10T10:01')
  })
})

describe('AdminExitFlows', () => {
  it('says so where the API has no lookup, and looks nothing up', async () => {
    served.mockResolvedValue(false)
    const c = await render()
    expect(c.textContent).toContain('This API has no exit flow lookup.')
    expect(button(c)).toBeNull()
    expect(flows).not.toHaveBeenCalled()
  })

  it('looks up nothing until asked, and wants an address or a port first', async () => {
    const c = await render()
    expect(testId(c, 'flows-unasked')).not.toBeNull()
    expect(button(c).disabled).toBe(true)
    expect(flows).not.toHaveBeenCalled()
    await type(c, 'port', '443')
    expect(button(c).disabled).toBe(false)
  })

  it('passes the address, port, time and window as chosen', async () => {
    const c = await render()
    await type(c, 'address', ' 203.0.113.7 ')
    await type(c, 'port', '40123')
    await type(c, 'at', '2026-11-10T10:01')
    await choose(c, '[data-choice="within"]', '1 hour')
    await choose(c, '[data-choice="later"]', '6 hours later')
    await choose(c, '[data-choice="limit"]', '1000 flows')
    await lookUp(c)
    expect(flows).toHaveBeenCalledWith({
      at: new Date('2026-11-10T10:01'),
      address: '203.0.113.7',
      port: 40123,
      withinMinutes: 60,
      laterHours: 6,
      limit: 1000,
    })
  })

  it('shows each flow: exit by name, client, account charged, who opened it, destination, duration, bytes', async () => {
    const c = await render()
    await type(c, 'port', '40123')
    await lookUp(c)
    expect(testId(c, 'flows-window')!.textContent).toBe(
      '3 flows open between 2026-11-10T17:46:00.000Z and 2026-11-10T18:16:00.000Z'
    )
    const [first, second, third] = rows(c)
    expect(cell(first, 'exit').textContent).toBe('pdx1a-1203.0.113.7:40123')
    expect(cell(first, 'exit').querySelector('a')!.getAttribute('href')).toBe('/admin/devices/X1')
    expect(cell(first, 'client').querySelector('a')!.getAttribute('href')).toBe('/admin/devices/C1')
    expect(cell(first, 'account').querySelector('a')!.getAttribute('href')).toBe('/admin/users/A1')
    expect(cell(first, 'account').textContent).toBe('owner@example.com')
    expect(cell(first, 'opener').textContent).toBe('pat@example.com on account 501')
    expect(cell(first, 'destination').textContent).toBe('tcp 93.184.216.34:443')
    expect(cell(first, 'duration').textContent).toBe('120s')
    expect(cell(first, 'bytes').textContent).toBe('1.17 KB up · 33.2 KB down')

    // A gone exit by its ID; an account without an email by its ID; the OS account alone; the person alone.
    expect(cell(second, 'exit').querySelector('a')!.textContent).toBe('X2')
    expect(cell(second, 'account').textContent).toBe('A2')
    expect(cell(second, 'opener').textContent).toBe('OS account 501')
    expect(cell(third, 'opener').textContent).toBe('sam@example.com')
  })

  it('narrows the flows found by exit, account, device and person', async () => {
    const c = await render()
    await type(c, 'port', '40123')
    await lookUp(c)
    expect([...c.querySelectorAll('[data-narrow]')].map(n => n.getAttribute('data-narrow'))).toEqual([
      'exit',
      'account',
      'client',
      'person',
    ])

    await choose(c, '[data-narrow="exit"]', 'X2')
    expect(rows(c).map(r => cell(r, 'client').textContent)).toEqual(['C2'])

    await choose(c, '[data-narrow="exit"]', 'Every one')
    await choose(c, '[data-narrow="person"]', 'sam@example.com')
    expect(rows(c).map(r => cell(r, 'client').textContent)).toEqual(['C3'])

    await choose(c, '[data-narrow="account"]', 'A2')
    expect(rows(c)).toEqual([])
    expect(testId(c, 'flows-narrowed-empty')).not.toBeNull()
    expect(flows).toHaveBeenCalledTimes(1)
  })

  it('pages the flows found', async () => {
    flows.mockResolvedValue({
      ...FOUND,
      flows: Array.from({ length: PAGE_SIZE + 3 }, (_, i) => flow({ clientId: `C${i}` })),
    })
    const c = await render()
    await type(c, 'port', '40123')
    await lookUp(c)
    expect(rows(c)).toHaveLength(PAGE_SIZE)
    expect(testId(c, 'flows-page')!.textContent).toBe(`1–${PAGE_SIZE} of ${PAGE_SIZE + 3}`)
    expect(testId(c, 'flows-previous')!.hasAttribute('disabled')).toBe(true)
    await act(async () => (testId(c, 'flows-next') as HTMLElement).click())
    expect(rows(c).map(r => cell(r, 'client').textContent)).toEqual([
      `C${PAGE_SIZE}`,
      `C${PAGE_SIZE + 1}`,
      `C${PAGE_SIZE + 2}`,
    ])
    expect(testId(c, 'flows-next')!.hasAttribute('disabled')).toBe(true)
  })

  it('says when more matched than were given', async () => {
    flows.mockResolvedValue({ ...FOUND, truncated: true })
    const c = await render()
    await type(c, 'port', '40123')
    await lookUp(c)
    expect(testId(c, 'flows-truncated')).not.toBeNull()
    expect(rows(c)).toHaveLength(3)
  })

  it('says when none was found', async () => {
    flows.mockResolvedValue({ ...FOUND, flows: [] })
    const c = await render()
    await type(c, 'port', '40123')
    await lookUp(c)
    expect(testId(c, 'flows-empty')).not.toBeNull()
    expect(testId(c, 'flows-window')!.textContent).toContain('0 flows')
  })

  it('a refusal in graphql’s words, and a failure said as one', async () => {
    flows.mockResolvedValue({ reason: '203.0.113.x is not an IP address' })
    const c = await render()
    await type(c, 'address', '203.0.113.x')
    await lookUp(c)
    expect(testId(c, 'flows-refused')!.textContent).toBe('203.0.113.x is not an IP address')

    flows.mockResolvedValue('ERROR')
    await lookUp(c)
    expect(testId(c, 'flows-error')).not.toBeNull()
  })

  it('shows loading while a lookup runs, with no second lookup until it answers', async () => {
    let answer: (value: any) => void = () => {}
    flows.mockReturnValueOnce(new Promise(resolve => (answer = resolve)))
    const c = await render()
    await type(c, 'port', '40123')
    await act(async () => button(c).click())
    expect(testId(c, 'loading')).not.toBeNull()
    expect(button(c).disabled).toBe(true)
    await act(async () => answer(FOUND))
    expect(rows(c)).toHaveLength(3)
    expect(button(c).disabled).toBe(false)
  })
})
