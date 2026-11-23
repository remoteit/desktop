import React, { act } from 'react'
import { createRoot, Root } from 'react-dom/client'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

// The avatar menu's accounts in single mode and multi mode (graphql-api docs/ACCOUNT-LINKS.md): one selected and a
// click switches, or a check beside each; the check item Use several at once; and Sign out as each account's own
// secondary action.

const { oidc, auth, browser } = vi.hoisted(() => ({
  oidc: {
    accounts: [] as any[],
    several: false,
    offered: true,
    listeners: new Set<() => void>(),
  },
  auth: {
    activateAccount: vi.fn(),
    useAccount: vi.fn(),
    signOutAccount: vi.fn(),
    addAccount: vi.fn(),
    setSeveral: vi.fn(),
    signOut: vi.fn(),
  },
  browser: { hasBackend: false },
}))
vi.mock('../services/oidc', () => ({
  oidcAccounts: () => oidc.accounts,
  oidcSeveral: () => oidc.several,
  oidcSeveralOffered: () => oidc.offered,
  oidcRefreshBrowserAccounts: async () => undefined,
  oidcSubscribe: (listener: () => void) => {
    oidc.listeners.add(listener)
    return () => oidc.listeners.delete(listener)
  },
}))
vi.mock('react-redux', () => ({
  useSelector: (select: (state: any) => unknown) =>
    select({ auth: { user: { email: 'a@x.test' }, backendAuthenticated: false }, ui: {} }),
  useDispatch: () => ({ auth, accounts: { setVia: vi.fn() }, feedback: { set: vi.fn() }, ui: { setPersistent: vi.fn() } }),
}))
vi.mock('react-router-dom', () => ({ useHistory: () => ({ push: vi.fn(), replace: vi.fn() }) }))
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (_key: string, text: any, values?: any) => {
      const opts = typeof text === 'object' ? text : values
      const words: string = typeof text === 'object' ? text.defaultValue : text
      return words.replace(/{{(\w+)}}/g, (_: string, k: string) => opts?.[k] ?? '')
    },
  }),
}))
vi.mock('../store', () => ({}))
vi.mock('../hooks/useChatEnabled', () => ({ useHideSidebar: () => false }))
vi.mock('../models/plans', () => ({ selectLicenseIndicator: () => 0 }))
vi.mock('../selectors/accounts', () => ({ selectActiveUser: () => ({ id: 'personal', email: 'a@x.test' }) }))
vi.mock('../selectors/organizations', () => ({ selectOrganizationOptions: () => [] }))
vi.mock('../helpers/uiHelper', () => ({ isRemoteUI: () => false }))
vi.mock('../services/Controller', () => ({ emit: vi.fn() }))
vi.mock('../services/browser', () => ({ default: browser }))
vi.mock('../constants', () => ({ DESKTOP_HELP_LINK: 'https://help.test' }))
vi.mock('./ListItemLocation', () => ({ ListItemLocation: () => null }))
vi.mock('./ListItemLink', () => ({ ListItemLink: () => null }))
vi.mock('./Avatar', () => ({ Avatar: () => <i data-avatar /> }))
vi.mock('./Icon', () => ({ Icon: ({ name }: { name: string }) => <i data-icon={name} /> }))
vi.mock('./Quote', () => ({ Quote: ({ children }: any) => <>{children}</> }))

import { AvatarMenu } from './AvatarMenu'
;(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true

const account = (sub: string, more: object = {}) => ({
  sub,
  email: `${sub}@x.test`,
  active: false,
  known: false,
  signedIn: false,
  saved: true,
  ...more,
})
const a = account('a', { active: true, signedIn: true })

let root: Root
let container: HTMLElement
async function openMenu() {
  container = document.createElement('div')
  document.body.appendChild(container)
  root = createRoot(container)
  await act(async () => root.render(<AvatarMenu />))
  await act(async () => container.querySelector('button')!.click())
}
const menu = () => document.querySelector('[role="menu"]') as HTMLElement
/** A row of the menu, by a text it shows. */
const row = (text: string) =>
  [...menu().querySelectorAll<HTMLElement>('.MuiListItem-root, .MuiListItemButton-root')].find(item =>
    item.textContent!.includes(text)
  )!
const click = (element: Element) => act(async () => (element as HTMLElement).click())
const button = (within: Element, name: string) =>
  [...within.querySelectorAll('button')].find(each => each.textContent!.replace(/\u00a0/g, ' ').trim() === name)
const dialog = () => document.querySelector('[role="dialog"]') as HTMLElement | null

beforeEach(() => {
  Object.values(auth).forEach(spy => spy.mockReset())
  oidc.listeners.clear()
  oidc.several = false
  oidc.offered = true
  browser.hasBackend = false
})
afterEach(async () => {
  await act(async () => root.unmount())
  document.body.innerHTML = ''
})

describe('with one account used at a time', () => {
  beforeEach(() => {
    oidc.accounts = [a, account('b'), account('k', { known: true, saved: false })]
  })

  it('lists every account with the page’s person selected, and no checks', async () => {
    await openMenu()
    expect(row('a@x.test').querySelector('[data-icon="check"]')).not.toBeNull()
    expect(row('b@x.test').querySelector('[data-icon="check"]')).toBeNull()
    expect(menu().querySelectorAll('input[type="checkbox"][aria-label]')).toHaveLength(0)
    expect(row('k@x.test').textContent).toContain('Signed in on this browser')
  })

  it('switches to another account on a click', async () => {
    await openMenu()
    await click(row('b@x.test'))
    expect(auth.activateAccount).toHaveBeenCalledWith('b')
    expect(auth.useAccount).not.toHaveBeenCalled()
  })

  it('asks before switching where this computer’s connections would stop', async () => {
    browser.hasBackend = true
    await openMenu()
    await click(row('b@x.test'))
    expect(auth.activateAccount).not.toHaveBeenCalled()
    expect(dialog()!.textContent).toContain('Switching accounts will stop all connections.')
    await click(button(dialog()!, 'Switch')!)
    expect(auth.activateAccount).toHaveBeenCalledWith('b')
  })

  it('does nothing on a click of the page’s own person', async () => {
    await openMenu()
    await click(row('a@x.test'))
    expect(auth.activateAccount).not.toHaveBeenCalled()
  })

  it('offers Sign out on a saved account’s row — not on the page’s own, nor on one the browser only knows', async () => {
    await openMenu()
    expect(button(row('a@x.test'), 'Sign out')).toBeUndefined()
    expect(button(row('k@x.test'), 'Sign out')).toBeUndefined()
    await click(button(row('b@x.test'), 'Sign out')!)
    expect(auth.signOutAccount).toHaveBeenCalledWith('b')
    expect(auth.activateAccount).not.toHaveBeenCalled()
  })

  it('offers Use several at once, off, and turns it on without asking', async () => {
    await openMenu()
    const item = row('Use several at once')
    expect(item.querySelector<HTMLInputElement>('input[type="checkbox"]')!.checked).toBe(false)
    await click(item)
    expect(dialog()).toBeNull()
    expect(auth.setSeveral).toHaveBeenCalledWith(true)
  })

  it('offers no setting where there is none (a shell from before auth.mode)', async () => {
    oidc.offered = false
    await openMenu()
    expect(menu().textContent).not.toContain('Use several at once')
    expect(menu().textContent).toContain('Sign in on this device')
  })
})

describe('with several used at once', () => {
  beforeEach(() => {
    oidc.several = true
    oidc.accounts = [
      a,
      account('b', { signedIn: true }),
      account('c', { signedIn: true }),
      account('d'),
      account('k', { known: true, saved: false }),
    ]
  })
  const check = (email: string) => menu().querySelector<HTMLInputElement>(`input[aria-label="${email}"]`)!

  it('shows a check beside each account: those in use checked, the page’s own person’s not to be cleared', async () => {
    await openMenu()
    expect(['a', 'b', 'c', 'd', 'k'].map(sub => check(`${sub}@x.test`).checked)).toEqual([true, true, true, false, false])
    expect(check('a@x.test').disabled).toBe(true)
    expect(check('b@x.test').disabled).toBe(false)
    expect(menu().querySelector('[data-icon="check"]')).toBeNull()
  })

  it('unchecks an account in use on a click: taken out of use, not signed out, and the page’s person unchanged', async () => {
    await openMenu()
    await click(row('b@x.test'))
    expect(auth.useAccount).toHaveBeenCalledWith({ sub: 'b', use: false })
    expect(auth.signOutAccount).not.toHaveBeenCalled()
    expect(auth.activateAccount).not.toHaveBeenCalled()
  })

  it('checks a saved or known account on a click: brought into use', async () => {
    await openMenu()
    await click(row('d@x.test'))
    expect(auth.useAccount).toHaveBeenLastCalledWith({ sub: 'd', use: true })
    await click(row('k@x.test'))
    expect(auth.useAccount).toHaveBeenLastCalledWith({ sub: 'k', use: true })
  })

  it('keeps Sign out as each saved account’s own action, in use or not, apart from its check', async () => {
    await openMenu()
    await click(button(row('b@x.test'), 'Sign out')!)
    await click(button(row('d@x.test'), 'Sign out')!)
    expect(auth.signOutAccount.mock.calls).toEqual([['b'], ['d']])
    expect(auth.useAccount).not.toHaveBeenCalled()
    expect(button(row('k@x.test'), 'Sign out')).toBeUndefined()
  })

  it('asks before turning Use several at once off, naming who is signed out here and who stays', async () => {
    await openMenu()
    const item = row('Use several at once')
    expect(item.querySelector<HTMLInputElement>('input[type="checkbox"]')!.checked).toBe(true)
    await click(item)
    expect(auth.setSeveral).not.toHaveBeenCalled()
    const text = dialog()!.textContent!
    expect(text).toContain('b@x.test, c@x.test')
    expect(text).not.toContain('d@x.test')
    expect(text).toContain('You stay signed in as a@x.test')
    await click(button(dialog()!, 'Turn off')!)
    expect(auth.setSeveral).toHaveBeenCalledWith(false)
  })

  it('turns it off without asking when the page’s person is the only one in use', async () => {
    oidc.accounts = [a, account('d')]
    await openMenu()
    await click(row('Use several at once'))
    expect(dialog()).toBeNull()
    expect(auth.setSeveral).toHaveBeenCalledWith(false)
  })

  it('follows a change made elsewhere while it is open', async () => {
    await openMenu()
    oidc.several = false
    oidc.accounts = [a, account('b')]
    await act(async () => oidc.listeners.forEach(listener => listener()))
    expect(menu().querySelectorAll('input[type="checkbox"][aria-label]')).toHaveLength(0)
    expect(row('a@x.test').querySelector('[data-icon="check"]')).not.toBeNull()
  })
})
