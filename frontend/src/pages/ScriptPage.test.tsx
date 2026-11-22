import React, { act } from 'react'
import { createRoot, Root } from 'react-dom/client'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

const { state, dispatch } = vi.hoisted(() => ({
  state: { value: {} as any },
  dispatch: { jobs: { fetchByFileIds: vi.fn() } },
}))
vi.mock('react-redux', () => ({ useSelector: (select: any) => select(state.value), useDispatch: () => dispatch }))
vi.mock('react-router-dom', () => ({
  Redirect: ({ to }: any) => <div data-redirect={to.pathname} />,
  useHistory: () => ({ push: vi.fn() }),
  useParams: () => ({ fileID: 'F1' }),
}))
vi.mock('../selectors/accounts', () => ({ selectActiveAccountId: (s: any) => s.active }))
vi.mock('../selectors/scripting', () => ({
  selectFile: (s: any, _: any, id: string) => s.files.all[s.active]?.find((f: any) => f.id === id),
  selectJobs: () => [],
}))
vi.mock('../components/Container', () => ({
  Container: ({ header, children }: any) => (
    <div data-page>
      {header}
      {children}
    </div>
  ),
}))
vi.mock('../components/LoadingMessage', () => ({ LoadingMessage: () => <div data-loading /> }))
vi.mock('../components/ListItemLocation', () => ({ ListItemLocation: ({ title }: any) => <div>{title}</div> }))
vi.mock('../components/LinearProgress', () => ({ LinearProgress: () => null }))
vi.mock('../components/JobStatusIcon', () => ({ JobStatusIcon: () => null }))
vi.mock('../components/JobRunResult', () => ({ JobFailureNote: () => null }))
vi.mock('../components/ReactiveTagNames', () => ({ ReactiveTagNames: () => null }))
vi.mock('../components/Duration', () => ({ Duration: () => null }))
vi.mock('../components/Notice', () => ({ Notice: ({ children }: any) => <div>{children}</div> }))
vi.mock('../components/Title', () => ({ Title: ({ children }: any) => <span>{children}</span> }))
vi.mock('../components/Gutters', () => ({ Gutters: ({ children }: any) => <div>{children}</div> }))
vi.mock('../components/Icon', () => ({ Icon: () => null }))
vi.mock('../buttons/IconButton', () => ({ IconButton: () => null }))
vi.mock('../helpers/jobHelper', () => ({ jobRunTotal: () => 0 }))
vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (_k: string, text: any) => (typeof text === 'string' ? text : '') }),
}))

import { ScriptPage } from './ScriptPage'
;(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true

const SCRIPT = {
  id: 'F1',
  name: 'hello',
  created: '2026-11-20T00:00:00Z',
  updated: '2026-11-20T00:00:00Z',
  versions: [],
}

let root: Root
let container: HTMLElement
async function render() {
  container = document.createElement('div')
  document.body.appendChild(container)
  root = createRoot(container)
  await act(async () => root.render(<ScriptPage />))
  return container
}
afterEach(() => {
  act(() => root.unmount())
  container.remove()
})
beforeEach(() => {
  dispatch.jobs.fetchByFileIds.mockReset()
})

describe('a script’s page, opened by its address (a reload)', () => {
  it('waits while the account’s scripts are read, rather than leaving for the Scripts list', async () => {
    // As a reload starts: nothing read yet, the first read under way.
    state.value = { active: 'A1', files: { all: {}, fetching: true } }
    let page = await render()
    expect(page.querySelector('[data-redirect]')).toBeNull()
    expect(page.querySelector('[data-loading]')).not.toBeNull()
    act(() => root.unmount())
    container.remove()
    // Another account's scripts read, this one's not yet.
    state.value = { active: 'A1', files: { all: { U1: [] }, fetching: false } }
    page = await render()
    expect(page.querySelector('[data-redirect]')).toBeNull()
  })

  it('shows the script once they are read', async () => {
    state.value = { active: 'A1', files: { all: { A1: [SCRIPT] }, fetching: false } }
    const page = await render()
    expect(page.textContent).toContain('hello')
    expect(page.querySelector('[data-redirect]')).toBeNull()
  })

  it('leaves for the Scripts list only once they are read and it is not among them', async () => {
    state.value = { active: 'A1', files: { all: { A1: [] }, fetching: false } }
    const page = await render()
    expect(page.querySelector('[data-redirect]')?.getAttribute('data-redirect')).toBe('/scripts')
  })
})
