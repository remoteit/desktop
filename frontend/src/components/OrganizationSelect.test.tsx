import React, { act } from 'react'
import { createRoot } from 'react-dom/client'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import en from '../i18n/locales/en/app.json'

/* The switcher with several sign-ins in use: an organization two accounts belong to is a row under each, saying whose
   it is, and picking a row selects the organization AS that account. There is no "Open as" any more. */
const { state, selectAs } = vi.hoisted(() => ({ state: {} as Record<string, any>, selectAs: vi.fn() }))
vi.mock('react-redux', () => ({
  // A new object each time, as the store's state is after a change: selectors remember by it.
  useSelector: (select: (s: any) => unknown) => select({ ...state }),
  useDispatch: () => ({ accounts: { selectAs } }),
}))
vi.mock('react-router-dom', () => ({
  useHistory: () => ({ push: vi.fn() }),
  useLocation: () => ({ pathname: '/devices' }),
}))
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (_key: string, text: any, values?: any) => {
      const opts = typeof text === 'object' ? text : values
      const words: string = typeof text === 'object' ? text.defaultValue ?? text.defaultValue_other : text
      return words.replace(/{{(\w+)}}/g, (_: string, k: string) => opts?.[k] ?? '')
    },
  }),
}))
vi.mock('../store', () => ({}))
vi.mock('../hooks/useMobile', () => ({ useMobile: () => false }))
vi.mock('../models/organization', () => ({
  getOwnOrganization: () => ({ id: '', name: '' }),
  defaultState: { id: '', name: '' },
}))
vi.mock('../models/accounts', () => ({}))
vi.mock('../models/plans', () => ({ REMOTEIT_PRODUCT_ID: 'remoteit' }))
vi.mock('../models/backend', () => ({ NOTICE_VERSION_ID: 'notice' }))
vi.mock('../services/browser', () => ({ default: {}, getLocalStorage: vi.fn() }))
vi.mock('../selectors/connections', () => ({ selectAllConnectionSessions: () => [] }))
vi.mock('./GuideBubble', () => ({ GuideBubble: ({ children }: any) => <>{children}</> }))
vi.mock('./Avatar', () => ({ Avatar: ({ email }: any) => <span data-avatar={email} /> }))
vi.mock('./Icon', () => ({ Icon: ({ name }: any) => <span data-icon={name} /> }))
vi.mock('./CreateOrganizationDialog', () => ({ CreateOrganizationDialog: () => null }))
vi.mock('./CloseOrganizationDialog', () => ({ CloseOrganizationDialog: () => null }))
// The tooltip's words, without hovering: what a row says it is.
vi.mock('@mui/material', async importOriginal => ({
  ...(await importOriginal<object>()),
  Tooltip: ({ title, children }: any) => (
    <span data-tip>
      <span data-says>{title}</span>
      {children}
    </span>
  ),
}))

import { OrganizationSelect } from './OrganizationSelect'
import { rowKey } from '../helpers/rowKey'
import { ThemeProvider, createTheme } from '@mui/material'

// The app's own colours, which the rail's styles name.
const colour = { main: '#000' }
const theme = createTheme({
  palette: {
    grayDarkest: colour,
    grayLighter: colour,
    grayLightest: colour,
    primaryLight: colour,
    alwaysWhite: colour,
    white: colour,
  } as any,
})
;(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true

const member = (id: string, name: string, roleName: string) => ({
  account: { id, email: '' },
  name,
  roleId: roleName.toUpperCase(),
  roleName,
  created: new Date(1),
  license: 'UNKNOWN',
})

beforeEach(() => {
  selectAs.mockReset()
  Object.keys(state).forEach(key => delete state[key])
  Object.assign(state, {
    auth: { user: { id: 'me' } },
    user: { id: 'me', email: 'me@x.test' },
    ui: { defaultSelection: {} },
    accounts: {
      activeId: 'acme',
      membership: [member('acme', 'Acme', 'Admin')],
      signIns: {
        'sub-work': {
          sub: 'sub-work',
          id: 'work',
          email: 'work@x.test',
          membership: [member('acme', 'Acme', 'Guest')],
        },
      },
      via: {},
    },
    // The organization as each of them read it: a row under each (helpers/rowKey).
    organization: {
      accounts: { acme: { id: 'acme', name: 'Acme' }, [rowKey('acme', 'sub-work')]: { id: 'acme', name: 'Acme' } },
    },
  })
})

async function rail() {
  const container = document.createElement('div')
  await act(async () =>
    createRoot(container).render(
      <ThemeProvider theme={theme}>
        <OrganizationSelect />
      </ThemeProvider>
    )
  )
  // Each row: what it says, whether it is the selected one, and its button.
  return [...container.querySelectorAll('[data-tip]')].map(tip => {
    const button = tip.querySelector('button')!
    return {
      says: [...tip.querySelector('[data-says]')!.childNodes].map(node => node.textContent).filter(Boolean),
      selected: button.getAttribute('aria-current') === 'true',
      key: button.getAttribute('data-row'),
      button,
    }
  })
}

describe('the switcher, with an organization two signed-in accounts belong to', () => {
  it('lists it under each account, each row saying whose it is and in what role; the page’s own person’s is selected', async () => {
    const rows = await rail()
    expect(rows.map(row => [row.key, row.says.join(' | '), row.selected])).toEqual([
      [null, 'Personal Account', false],
      [':acme', 'Acme - Admin | Via me@x.test', true],
      ['sub-work:work', 'work@x.test', false],
      ['sub-work:acme', 'Acme - Guest | Via work@x.test', false],
    ])
  })

  it('picking the other account’s row selects the organization as that account', async () => {
    const rows = await rail()
    await act(async () => rows[3].button.click())
    expect(selectAs).toHaveBeenCalledWith({ accountId: 'acme', sub: 'sub-work' })
    await act(async () => rows[1].button.click())
    expect(selectAs).toHaveBeenLastCalledWith({ accountId: 'acme', sub: '' })
  })

  it('marks only the row of the account serving it, once the other’s was picked', async () => {
    state.accounts = { ...state.accounts, via: { acme: 'sub-work' } }
    const rows = await rail()
    expect(rows.map(row => [row.key, row.selected])).toEqual([
      [null, false],
      [':acme', false],
      ['sub-work:work', false],
      ['sub-work:acme', true],
    ])
  })

  it('an organization one account alone belongs to says nothing of whose it is under the page’s own person', async () => {
    state.accounts = { ...state.accounts, signIns: {} }
    const rows = await rail()
    expect(rows.map(row => row.says.join(' | '))).toEqual(['Personal Account', 'Acme - Admin'])
  })

  it('each row of the shared organization carries its own account’s badge; no other row carries one', async () => {
    const badges = (rows: Awaited<ReturnType<typeof rail>>) =>
      rows.map(row => {
        const badge = row.button.querySelector('[data-badge]')
        return [row.key, badge?.getAttribute('data-badge') ?? null, badge?.getAttribute('aria-label') ?? null]
      })
    expect(badges(await rail())).toEqual([
      [null, null, null],
      [':acme', 'me@x.test', 'me@x.test'],
      ['sub-work:work', null, null],
      ['sub-work:acme', 'work@x.test', 'work@x.test'],
    ])
    // One account alone belongs to it: as it always was.
    state.accounts = { ...state.accounts, signIns: {} }
    expect(badges(await rail())).toEqual([
      [null, null, null],
      [':acme', null, null],
    ])
  })

  it('there is no "Open as": the catalogue has no word for it', () => {
    expect((en as any).nav.openAs).toBeUndefined()
    expect(JSON.stringify(en)).not.toMatch(/Open \{\{name\}\} as/)
  })
})
