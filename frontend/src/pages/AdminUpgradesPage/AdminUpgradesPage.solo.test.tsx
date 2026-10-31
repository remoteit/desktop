import React, { act } from 'react'
import { createRoot } from 'react-dom/client'
import { Provider } from 'react-redux'
import { MemoryRouter, Route } from 'react-router-dom'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import schema from './__fixtures__/solo-rolloutSchema.json'
import channels from './__fixtures__/solo-daemonChannels.json'
import rollouts from './__fixtures__/solo-daemonRollouts.json'

/* The page as the browser takes it, fed what solo answered on 2026-10-30 (one done rollout, the stable channel): the
   real services — post, the schema read, the queries — over a stubbed transport, and the real Container and Body. On
   app.solo the page showed its headings and nothing under them: Body stretched the first child of each element type to
   the full height, so every section after the first was out of sight. */
const { request, uiSet } = vi.hoisted(() => ({ request: vi.fn(), uiSet: vi.fn() }))
const state = { ui: { layout: { singlePanel: false }, columnWidths: {} }, auth: { user: { admin: true } } }
vi.mock('../../store', () => ({
  store: { getState: () => state, dispatch: { ui: { set: uiSet, deprecated: vi.fn() } } },
}))
vi.mock('../../services/remoteit', () => ({ apiHeaders: vi.fn().mockResolvedValue({ authorization: 'token' }) }))
vi.mock('../../helpers/apiHelper', () => ({
  getApiURL: () => 'https://cloud.solo.remote.it/api/graphql',
  getApiRestURL: () => 'https://cloud.solo.remote.it/api',
}))
vi.mock('../../services/Network', () => ({ default: { offline: vi.fn() } }))
vi.mock('axios', () => ({ default: { request } }))
vi.mock('../../services/browser', () => ({ default: { isMobile: false, isAndroid: false } }))
vi.mock('../../components/Icon', () => ({ Icon: () => null }))
vi.mock('../../components/Attributes', () => ({
  Attribute: class {
    defaultWidth = 150
    constructor(options: object) {
      Object.assign(this, options)
    }
    width = (widths: ILookup<number>) => widths[(this as any).id] || (this as any).defaultWidth
  },
}))
vi.mock('../../hooks/useContainerWidth', () => ({ useContainerWidth: () => ({ containerRef: { current: null } }) }))
vi.mock('../../hooks/useResizablePanel', () => ({
  useResizablePanel: () => ({ width: 500, panelRef: { current: null }, onDown: () => {}, grab: false }),
}))

import { ThemeProvider, createTheme } from '@mui/material/styles'
import { lightColors } from '../../styling'
import { resetRolloutSchema } from '../../services/graphQLDaemonRollout'
import { AdminUpgradesPage } from './AdminUpgradesPage'
;(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true
;(globalThis as any).ResizeObserver ??= class {
  observe() {}
  unobserve() {}
  disconnect() {}
}

const theme = createTheme({
  palette: Object.fromEntries(Object.entries(lightColors).map(([name, main]) => [name, { main }])) as any,
})
const store = { getState: () => state, subscribe: () => () => {}, dispatch: () => {} } as any

// solo's answers, by the operation the page sends.
const answer = (body: any) => ({ data: body, headers: {} })
function solo(config: { data: { query: string } }) {
  const query = config.data.query
  if (query.includes('DaemonRolloutFields')) return answer(schema)
  if (query.includes('daemonChannels')) return answer(channels)
  if (query.includes('daemonRollouts')) return answer(rollouts)
  if (query.includes('daemonRollout(')) return answer({ data: { daemonRollout: rollouts.data.daemonRollouts[0] } })
  throw new Error(`unexpected query ${query.slice(0, 40)}`)
}

async function render(path: string) {
  const el = document.createElement('div')
  document.body.appendChild(el)
  await act(async () =>
    createRoot(el).render(
      <Provider store={store}>
        <ThemeProvider theme={theme}>
          <MemoryRouter initialEntries={[path]}>
            <Route path="/admin/upgrades/:rolloutId?">
              <AdminUpgradesPage />
            </Route>
          </MemoryRouter>
        </ThemeProvider>
      </Provider>
    )
  )
  for (let i = 0; i < 5; i++) await act(async () => {})
  return el
}

// Body's scroll box: what it stretches is its first child of each type, so the content must be one element.
const scrollBoxChildren = (el: HTMLElement) =>
  [...el.querySelectorAll('.upgrades-scroll')].map(box => box.children.length)

beforeEach(() => {
  document.body.innerHTML = ''
  request.mockReset().mockImplementation(async (config: any) => solo(config))
  uiSet.mockReset()
  resetRolloutSchema()
})

describe("the Upgrades page on solo's answers", () => {
  it('shows the stable channel and the done rollout, as one scroll content', async () => {
    const el = await render('/admin/upgrades')
    const channel = el.querySelector('[data-channel="stable"]')!
    expect(channel).not.toBeNull()
    expect(channel.textContent).toContain('candidate 1.1.0.20261031011556 at 100%')
    expect(channel.querySelector('[data-delivery]')!.textContent).toContain('6,733 of 30,808 delivered')
    const row = el.querySelector('[data-rollout="65d73d95-3396-45b6-a81b-1f1b9fbad4e7"]')!
    expect(row).not.toBeNull()
    expect(row.textContent).toContain('done')
    expect(row.textContent).toContain('100% (4 of 4)')
    expect(scrollBoxChildren(el)).toEqual([1])
    expect(uiSet).not.toHaveBeenCalled() // no error banner
    expect(el.querySelector('[data-render-error]')).toBeNull()
  })

  it("shows the run's detail, as one scroll content", async () => {
    const el = await render('/admin/upgrades/65d73d95-3396-45b6-a81b-1f1b9fbad4e7')
    expect(el.querySelectorAll('[data-step]').length).toBe(4)
    expect(el.querySelector('[data-gate="presenceCpuMax"]')).not.toBeNull()
    expect(scrollBoxChildren(el)).toEqual([1, 1])
    expect(el.querySelector('[data-render-error]')).toBeNull()
  })

  it('a panel that fails to render says so, with the error', async () => {
    request.mockImplementation(async (config: any) =>
      config.data.query.includes('daemonChannels')
        ? answer({ data: { daemonChannels: [{ ...channels.data.daemonChannels[0], accounts: null }] } })
        : solo(config)
    )
    vi.spyOn(console, 'error').mockImplementation(() => {})
    const el = await render('/admin/upgrades')
    expect(el.textContent).toContain('Could not show the channels and rollouts')
    expect(el.querySelector('[data-render-error]')!.textContent).toMatch(/length/)
  })
})
