import React, { act } from 'react'
import { createRoot, Root } from 'react-dom/client'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

const { catalog, push, state } = vi.hoisted(() => ({
  catalog: vi.fn(),
  push: vi.fn(),
  state: { value: { user: { id: 'U1' }, active: 'U1' } },
}))
vi.mock('react-router-dom', () => ({ useHistory: () => ({ push }) }))
vi.mock('react-redux', () => ({ useSelector: (select: any) => select(state.value) }))
vi.mock('../selectors/accounts', () => ({ selectActiveAccountId: (s: any) => s.active }))
vi.mock('../services/graphQLAppCatalog', () => ({ graphQLAppCatalog: catalog, UNSERVED: 'UNSERVED' }))
vi.mock('../components/Container', () => ({ Container: ({ header, children }: any) => <div>{header}{children}</div> }))
vi.mock('../components/Title', () => ({ Title: ({ children }: any) => <span data-title>{children}</span> }))
vi.mock('../components/Gutters', () => ({ Gutters: ({ children }: any) => <div>{children}</div> }))
vi.mock('../components/Notice', () => ({ Notice: ({ children }: any) => <div data-notice>{children}</div> }))
vi.mock('../components/LoadingMessage', () => ({ LoadingMessage: () => <div data-loading /> }))
vi.mock('../components/Icon', () => ({ Icon: () => null }))
vi.mock('react-i18next', () => {
  const fill = (text: string, values?: any) => text.replace(/{{(\w+)}}/g, (_, k) => values?.[k] ?? '')
  return {
    useTranslation: () => ({
      t: (_key: string, a: any, b?: any) =>
        typeof a === 'string' ? fill(a, b) : fill(a.count === 1 ? a.defaultValue_one : a.defaultValue_other, a),
    }),
  }
})

import { AppsPage } from './AppsPage'
import { MOCK_CATALOG } from '../services/__fixtures__/appCatalogMock'
;(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true

// The mocks are in graphql's shape already.
const APPS = MOCK_CATALOG.map(({ devices, ...app }) => app)

let root: Root
let container: HTMLElement
async function render() {
  container = document.createElement('div')
  document.body.appendChild(container)
  root = createRoot(container)
  await act(async () => root.render(<AppsPage />))
  return container
}
afterEach(() => {
  act(() => root.unmount())
  container.remove()
})
beforeEach(() => {
  push.mockReset()
  catalog.mockReset().mockResolvedValue(APPS)
  state.value = { user: { id: 'U1' }, active: 'U1' }
})

const click = (el: Element | null) => act(async () => (el as HTMLElement).click())
const row = (page: HTMLElement, id: string) => page.querySelector(`[data-catalog-app="${id}"]`) as HTMLElement

describe('Apps, the account’s catalogue', () => {
  it('a row an app: what it does first, platforms by name, what it needs, devices, then publisher with Verified and Yours', async () => {
    const page = await render()
    expect(catalog).toHaveBeenCalledWith(undefined)
    const backup = row(page, 'acme.backup')
    expect(backup.querySelector('[data-catalog-publisher]')?.textContent).toBe('By Acme · Verified: acme.com · Yours')
    // A restricted app needs nothing more: nothing said.
    expect(backup.querySelector('[data-catalog-runs]')).toBeNull()
    expect(backup.querySelector('[data-catalog-platforms]')?.textContent).toBe('Linux · Linux (musl)')
    expect(backup.querySelector('[data-catalog-description]')?.textContent).toBe('Nightly backups to your bucket.')
    expect(backup.querySelector('[data-catalog-aside]')?.textContent).toBe('On 4 devices')
    const console = row(page, 'remoteit.console')
    expect(console.querySelector('[data-catalog-runs]')?.textContent).toBe('Needs full control of the device')
    // What it asks of remote.it, beside Runs as root; an ordinary app asks nothing.
    expect(console.querySelector('[data-catalog-capabilities]')?.textContent).toBe(
      'Keeps accounts for the people you share with · Signs people in with their Remote.It certificate · Lets AI run commands you allow'
    )
    expect(backup.querySelector('[data-catalog-capabilities]')).toBeNull()
    expect(console.querySelector('[data-catalog-platforms]')?.textContent).toBe('Linux · macOS · Windows')
    expect(row(page, 'remoteit.files').querySelector('[data-catalog-aside]')).toBeNull()
    // The console is named Terminal, for what people use it as.
    expect(console.textContent).toMatch(/^Terminal/)
    expect(console.textContent).not.toContain('Console')
  })

  it('a row opens the app; Add to devices opens Add', async () => {
    const page = await render()
    await click(row(page, 'acme.backup').querySelector('.MuiListItemButton-root'))
    expect(push).toHaveBeenCalledWith('/apps/acme.backup')
    await click(page.querySelector('[data-apps-add="acme.backup"]'))
    expect(push).toHaveBeenCalledWith('/apps/acme.backup/add')
  })

  it('no release on this stage: said, and it cannot be added', async () => {
    catalog.mockResolvedValue([{ ...APPS[1], version: null }])
    const page = await render()
    expect(row(page, 'remoteit.files').querySelector('[data-catalog-platforms]')?.textContent).toBe('Not available yet')
    expect((page.querySelector('[data-apps-add="remoteit.files"]') as HTMLButtonElement).disabled).toBe(true)
  })

  it('searched by name, publisher or description', async () => {
    const page = await render()
    const search = page.querySelector('[data-apps-search]') as HTMLInputElement
    await act(async () => {
      const set = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')!.set!
      set.call(search, 'acme')
      search.dispatchEvent(new Event('input', { bubbles: true }))
    })
    expect([...page.querySelectorAll('[data-catalog-app]')].map(el => el.getAttribute('data-catalog-app'))).toEqual(['acme.backup'])
  })

  it('an organization’s catalogue for its account; an API without one says so', async () => {
    state.value = { user: { id: 'U1' }, active: 'ORG' }
    catalog.mockResolvedValue('UNSERVED')
    const page = await render()
    expect(catalog).toHaveBeenCalledWith('ORG')
    expect(page.querySelector('[data-notice]')?.textContent).toBe('This server does not have the app catalogue yet.')
  })
})
