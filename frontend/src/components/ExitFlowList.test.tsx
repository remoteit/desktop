import React, { act } from 'react'
import { createRoot } from 'react-dom/client'
import { describe, it, expect, vi, beforeEach } from 'vitest'

// A device's connections through exits: the last day's first, newest first, each with where it went, who on the
// computer opened it and through which exit — or that the device carried it as one —; more pages from next, a flow
// shown once however often it comes; an empty page with more to read says so and offers to look further; a refusal in
// graphql's words; nothing at all on an API without exitFlows.
const { flows } = vi.hoisted(() => ({ flows: vi.fn() }))
vi.mock('../services/post', () => ({ post: vi.fn() }))
vi.mock('../services/graphQL', () => ({ graphQLRequestWithReason: vi.fn() }))
vi.mock('../services/graphQLDaemon', () => ({ UNSUPPORTED: 'UNSUPPORTED' }))
vi.mock('../services/exitFlows', async importActual => ({
  ...(await importActual<typeof import('../services/exitFlows')>()),
  fetchExitFlows: flows,
}))
vi.mock('../helpers/dateHelper', () => ({ humanizeDuration: (ms: number) => `${ms / 1000}s` }))
vi.mock('./Timestamp', () => ({ Timestamp: ({ date }: any) => <>{date.toISOString()}</> }))
vi.mock('./Icon', () => ({ Icon: () => null }))
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (_key: string, text: string, values: Record<string, unknown> = {}) =>
      text.replace(/\{\{(\w+)\}\}/g, (_, name) => String(values[name])),
  }),
}))

import { ExitFlowList } from './ExitFlowList'
;(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true

const DEVICE = 'D1'
const flow = (id: string, fields = {}) => ({
  id,
  exitId: 'E1',
  exit: 'pdx1a',
  exitName: 'remote.it pdx1a',
  start: '2026-11-10T18:00:00.000Z',
  end: '2026-11-10T18:02:00.000Z',
  clientId: DEVICE,
  proto: 'tcp',
  destination: '93.184.216.34:443',
  up: 1200,
  down: 34000,
  localAccount: '501',
  personId: 'P1',
  personEmail: 'pat@example.com',
  ...fields,
})

const flush = () => act(async () => {})
let root: ReturnType<typeof createRoot> | undefined

async function render() {
  if (root) await act(async () => root!.unmount())
  document.body.innerHTML = ''
  const container = document.createElement('div')
  document.body.appendChild(container)
  root = createRoot(container)
  await act(async () => root!.render(<ExitFlowList scope={{ deviceId: DEVICE }} carrier={DEVICE} />))
  await flush()
  return container
}

const rows = (c: HTMLElement) => [...c.querySelectorAll<HTMLElement>('[data-flow]')]
const testId = (c: HTMLElement, id: string) => c.querySelector<HTMLElement>(`[data-testid="${id}"]`)

beforeEach(() => flows.mockReset())

describe('ExitFlowList', () => {
  it("the last day's, newest first, each with where, who and through which exit — or carried by this device", async () => {
    flows.mockResolvedValueOnce({
      flows: [
        flow('a'),
        flow('b', { exitId: DEVICE, clientId: 'C9', personId: null, personEmail: null, localAccount: null }),
      ],
      next: null,
    })
    const c = await render()
    expect(flows).toHaveBeenCalledWith({ deviceId: DEVICE }, expect.objectContaining({ hours: 24 }), undefined)
    expect(rows(c)).toHaveLength(2)
    expect(rows(c)[0].textContent).toContain('93.184.216.34:443 · tcp · pat@example.com on account 501')
    expect(rows(c)[0].textContent).toContain('through remote.it pdx1a')
    expect(rows(c)[1].textContent).toContain('carried as an exit')
    expect(testId(c, 'exit-flows-more')).toBeNull()
  })

  it('more pages from next, in the same window, a flow logged twice shown once', async () => {
    flows
      .mockResolvedValueOnce({ flows: [flow('a'), flow('b')], next: 'c1' })
      .mockResolvedValueOnce({ flows: [flow('b'), flow('c')], next: null })
    const c = await render()
    await act(async () => testId(c, 'exit-flows-more')!.click())
    await flush()
    expect(flows).toHaveBeenLastCalledWith({ deviceId: DEVICE }, { hours: 24, now: flows.mock.calls[0][1].now }, 'c1')
    expect(rows(c).map(r => r.getAttribute('data-flow'))).toEqual(['a', 'b', 'c'])
    expect(testId(c, 'exit-flows-more')).toBeNull()
  })

  it('an empty page with more to read says so, and looks further', async () => {
    flows.mockResolvedValueOnce({ flows: [], next: 'c1' }).mockResolvedValueOnce({ flows: [], next: null })
    const c = await render()
    expect(testId(c, 'exit-flows-none')!.textContent).toContain('there is more to look through')
    expect(testId(c, 'exit-flows-more')!.textContent).toBe('Look further')
    await act(async () => testId(c, 'exit-flows-more')!.click())
    await flush()
    expect(testId(c, 'exit-flows-none')!.textContent).toBe('No connections through an exit in this time.')
  })

  it("a refusal in graphql's words; nothing on an API without exitFlows", async () => {
    flows.mockResolvedValueOnce({ reason: 'This stage keeps no exit flow log' })
    let c = await render()
    expect(testId(c, 'exit-flows-error')!.textContent).toBe('This stage keeps no exit flow log')
    flows.mockResolvedValueOnce('UNSUPPORTED')
    c = await render()
    expect(c.textContent).toBe('')
  })
})
