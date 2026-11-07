import React, { act } from 'react'
import { createRoot, Root } from 'react-dom/client'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { Exit } from '../services/graphQLExits'
import type { ExitDevice } from '../services/graphQLDeviceRuns'

const { store, offered, access, opened } = vi.hoisted(() => ({
  store: { value: undefined as any },
  offered: vi.fn(async (_deviceId?: string) => [] as any),
  access: { manages: true },
  opened: vi.fn(),
}))
// The account's exits are the store's (hooks/useAccountStore.ts): here, what it holds now.
vi.mock('../hooks/useAccountExits', () => ({ useAccountExits: () => ({ value: store.value, reload: vi.fn() }) }))
vi.mock('../hooks/useDeviceDisable', () => ({ useDisabledDevicesAccess: () => access.manages }))
vi.mock('../services/graphQLDaemon', () => ({ UNSUPPORTED: 'UNSUPPORTED' }))
vi.mock('../services/graphQLExits', () => ({ graphQLOfferedExits: offered }))
// A row: where it leads, its icon's colour, its name and its line, and what it holds.
vi.mock('../components/ListItemLocation', () => ({
  ListItemLocation: ({ to, icon, title, subtitle, children, ...props }: any) => (
    <div
      data-exit={props['data-exit']}
      data-shared={props['data-shared']}
      data-to={to}
      data-color={icon.props.color}
      onClick={() => opened(to)}
    >
      <div data-name>{title}</div>
      <div data-line>{subtitle}</div>
      {children}
    </div>
  ),
}))
// The chips are the device and network pages' own: here, each tag a button to click, or to take off, as given.
vi.mock('../components/Tags', () => ({
  Tags: ({ tags, onClick, onDelete }: any) => (
    <span data-tags={tags.map((tag: ITag) => tag.name).join('|')}>
      {tags.map((tag: ITag) => (
        <span key={tag.name}>
          {onClick && <button data-tag={tag.name} onClick={() => onClick(tag)} />}
          {onDelete && <button data-untag={tag.name} onClick={() => onDelete(tag)} />}
        </span>
      ))}
    </span>
  ),
}))
vi.mock('../components/Container', () => ({
  Container: ({ header, children }: any) => (
    <div>
      <div data-header>{header}</div>
      {children}
    </div>
  ),
}))
vi.mock('../components/Title', () => ({ Title: ({ children }: any) => <span data-title>{children}</span> }))
vi.mock('../components/Gutters', () => ({ Gutters: ({ children }: any) => <>{children}</> }))
vi.mock('../components/LoadingMessage', () => ({ LoadingMessage: () => <div data-loading /> }))
vi.mock('../components/Notice', () => ({
  Notice: ({ children, severity = 'info' }: any) => <div data-notice={severity}>{children}</div>,
}))
vi.mock('../components/Icon', () => ({ Icon: () => null }))
vi.mock('../buttons/IconButton', () => ({
  IconButton: ({ title, icon, to, onClick, disabled }: any) => (
    <button data-icon={icon} data-to={to} disabled={disabled} onClick={onClick}>
      {title}
    </button>
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

import { ExitsPage } from './ExitsPage'
;(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true

const ME = { id: 'ACCOUNT', email: 'me@example.com' }
const PAT = { id: 'PAT', email: 'pat@example.com' }
const LAB = { name: 'lab', color: 1 }
const PROD = { name: 'Prod', color: 2 }

const device = (id: string, name: string | null): ExitDevice => ({
  id,
  name,
  state: 'ACTIVE',
  joining: false,
  activeSince: null,
  drainingSince: null,
  checks: [],
  established: true,
  offering: true,
  refusal: null,
  health: null,
  disabled: false,
  lan: false,
  lanRefusal: null,
})
const exit = (id: string, name: string, more: Partial<Exit> = {}): Exit => ({
  id,
  name,
  remoteit: false,
  location: null,
  provider: '',
  activation: 'auto',
  manage: true,
  offered: true,
  dormant: false,
  owner: ME,
  devices: [],
  users: 0,
  access: [],
  tags: [],
  networks: null,
  ...more,
})

// Run by two devices, one with no name, and used by two.
const OFFICE = exit('xoffice', 'Office', {
  devices: [device('MAC', 'Office Mac'), device('PI', null)],
  users: 2,
  tags: [LAB, PROD],
})
// Its device in service takes no traffic now.
const GARAGE = exit('xgarage', 'Garage', {
  devices: [device('GPI', 'Garage Pi')],
  offered: false,
  tags: [{ name: 'prod', color: 2 }],
})
// No device runs it, and one uses it: no device available.
const SPARE = exit('xspare', 'Spare', { users: 1, offered: false, dormant: true })
const PATS = exit('xpat', 'Pat’s exit', { owner: PAT, devices: null, users: null })
// Offered to you: remote.it's, and one shared with you.
const PDX = { id: 'xpdx', name: 'remote.it pdx1a', remoteit: true, location: 'pdx1a', provider: 'AWS', owner: null }
const FRA = { id: 'xfra', name: 'remote.it fra1', remoteit: true, location: 'fra1', provider: '', owner: null }
const PATS_OFFERED = { id: 'xpat', name: 'Pat’s exit', remoteit: false, location: null, provider: '', owner: PAT }

const find = (selector: string) => document.body.querySelector(selector) as HTMLElement
const row = (id: string) => find(`[data-exit="${id}"]`)
const sharedRow = (id: string) => find(`[data-shared="${id}"]`)
const lineOf = (element: HTMLElement) => element.querySelector('[data-line]')?.textContent
const ownShown = () => [...document.body.querySelectorAll('[data-exit]')].map(each => each.getAttribute('data-exit'))
const click = (element: Element | null) => act(async () => (element as HTMLElement).click())

let root: Root | undefined
async function render() {
  if (root) {
    const old = root
    await act(async () => old.unmount())
  }
  document.body.innerHTML = ''
  const container = document.createElement('div')
  document.body.appendChild(container)
  root = createRoot(container)
  await act(async () => root!.render(<ExitsPage />))
}
// The store read again: the page shown with what it holds now, its own state kept.
const rerender = () => act(async () => root!.render(<ExitsPage />))

beforeEach(() => {
  access.manages = true
  store.value = { own: [OFFICE, GARAGE, SPARE], shared: [] }
  offered.mockReset().mockResolvedValue([])
})

describe('the exits page', () => {
  it('lists your own exits, each leading to its page with the devices it runs on and those using it', async () => {
    await render()
    expect(ownShown()).toEqual(['xoffice', 'xgarage', 'xspare'])
    expect(row('xoffice').getAttribute('data-to')).toBe('/exits/xoffice')
    expect(row('xoffice').querySelector('[data-name]')?.textContent).toBe('Office')
    expect(lineOf(row('xoffice'))).toBe('Runs on Office Mac, PI · 2 devices use it as their exit')
    expect(lineOf(row('xgarage'))).toBe('Runs on Garage Pi · No device uses it as its exit · Not taking traffic now')
    expect(row('xoffice').querySelector('[data-tags]')?.getAttribute('data-tags')).toBe('lab|Prod')
    expect(row('xspare').querySelector('[data-tags]')).toBeNull()
  })

  it('a dormant exit says it has no device available, its icon greyed', async () => {
    await render()
    expect(lineOf(row('xspare'))).toBe('Runs on no device · 1 device uses it as its exit · No device available')
    expect(row('xspare').getAttribute('data-color')).toBe('grayDark')
    expect(row('xoffice').getAttribute('data-color')).toBe('primary')
  })

  it('those other accounts share with you: whose each is, and whether a device of yours may use it now', async () => {
    store.value = {
      own: [OFFICE],
      shared: [
        PATS,
        exit('xold', 'Old Mac', { owner: PAT, devices: null, users: null, offered: false, dormant: true }),
        exit('xned', 'Ned’s exit', { owner: { id: 'NED', email: null }, devices: null, users: null }),
      ],
    }
    await render()
    expect(document.body.textContent).toContain('Shared with you')
    expect(sharedRow('xpat').getAttribute('data-to')).toBe('/exits/xpat')
    expect(lineOf(sharedRow('xpat'))).toBe('Shared by pat@example.com · A device of yours may use it')
    expect(lineOf(sharedRow('xold'))).toBe('Shared by pat@example.com · No device available')
    expect(sharedRow('xold').getAttribute('data-color')).toBe('grayDark')
    expect(lineOf(sharedRow('xned'))).toBe('A device of yours may use it')
    expect(sharedRow('xned').getAttribute('data-color')).toBe('primary')
    // Not among your own.
    expect(ownShown()).toEqual(['xoffice'])
  })

  it('none shared with you: no such list', async () => {
    await render()
    expect(document.body.textContent).not.toContain('Shared with you')
    expect(find('[data-shared]')).toBeNull()
  })

  it('none of your own yet: says how one is made, those shared with you listed still', async () => {
    store.value = { own: [], shared: [PATS] }
    await render()
    expect(ownShown()).toEqual([])
    expect(document.body.textContent).toContain('None yet: make an exit, then add the devices that run it.')
    expect(sharedRow('xpat')).not.toBeNull()
  })

  it('remote.it’s: those offered to you that are remote.it’s, each by its provider, else by its location', async () => {
    offered.mockResolvedValue([PDX, PATS_OFFERED, FRA])
    await render()
    expect(offered).toHaveBeenCalledWith()
    expect(document.body.textContent).toContain('remote.it’s')
    const remoteit = (id: string) => find(`[data-remoteit="${id}"]`)
    expect(remoteit('xpdx').querySelector('.MuiListItemText-primary')?.textContent).toBe('remote.it pdx1a')
    expect(remoteit('xpdx').querySelector('.MuiListItemText-secondary')?.textContent).toBe('AWS')
    expect(remoteit('xfra').querySelector('.MuiListItemText-secondary')?.textContent).toBe('fra1')
    expect(remoteit('xpat')).toBeNull()
  })

  it('no remote.it’s list where none of those offered is remote.it’s, or they could not be read', async () => {
    for (const answer of [[PATS_OFFERED], 'ERROR', 'UNSUPPORTED']) {
      offered.mockResolvedValue(answer)
      await render()
      expect(document.body.textContent).not.toContain('remote.it’s')
      expect(find('[data-remoteit]')).toBeNull()
    }
  })
})

describe('your exits by tag', () => {
  it('a tag clicked filters the list, and does not open its exit', async () => {
    await render()
    opened.mockClear()
    await click(row('xoffice').querySelector('[data-tag="lab"]'))
    expect(find('[data-tag-filter]').getAttribute('data-tag-filter')).toBe('lab')
    expect(opened).not.toHaveBeenCalled()
    await click(row('xoffice'))
    expect(opened).toHaveBeenCalledWith('/exits/xoffice')
  })

  it('a tag clicked shows only your exits carrying it, its name compared case aside', async () => {
    await render()
    expect(find('[data-tag-filter]')).toBeNull()
    await click(row('xoffice').querySelector('[data-tag="Prod"]'))
    expect(find('[data-tag-filter]').getAttribute('data-tag-filter')).toBe('Prod')
    expect(find('[data-tag-filter]').textContent).toContain('Exits tagged')
    expect(ownShown()).toEqual(['xoffice', 'xgarage'])
    await click(row('xoffice').querySelector('[data-tag="lab"]'))
    expect(find('[data-tag-filter]').getAttribute('data-tag-filter')).toBe('lab')
    expect(ownShown()).toEqual(['xoffice'])
  })

  it('the filter’s chip taken off shows them all again', async () => {
    await render()
    await click(row('xoffice').querySelector('[data-tag="lab"]'))
    expect(find('[data-tag-filter] [data-tags]').getAttribute('data-tags')).toBe('lab')
    await click(find('[data-tag-filter] [data-untag="lab"]'))
    expect(find('[data-tag-filter]')).toBeNull()
    expect(ownShown()).toEqual(['xoffice', 'xgarage', 'xspare'])
  })

  it('a tag none of your exits carries once they are read again: said so, the filter still there to clear', async () => {
    await render()
    await click(row('xoffice').querySelector('[data-tag="lab"]'))
    store.value = { own: [{ ...OFFICE, tags: [PROD] }, GARAGE, SPARE], shared: [] }
    await rerender()
    expect(ownShown()).toEqual([])
    expect(find('[data-tag-filter]').textContent).toContain('None of your exits carries it.')
    expect(document.body.textContent).not.toContain('None yet')
    await click(find('[data-tag-filter] [data-untag="lab"]'))
    expect(ownShown()).toEqual(['xoffice', 'xgarage', 'xspare'])
  })
})

describe('making an exit', () => {
  it('New exit, for those who may manage devices here, opens the page that makes one', async () => {
    await render()
    const add = find('[data-icon="plus"]')
    expect(add.textContent).toBe('New exit')
    expect(add.getAttribute('data-to')).toBe('/exits/new')
  })

  it('no New exit for anyone else, their exits listed still', async () => {
    access.manages = false
    await render()
    expect(find('[data-icon="plus"]')).toBeNull()
    expect(ownShown()).toEqual(['xoffice', 'xgarage', 'xspare'])
  })
})

describe('the exits not to be had', () => {
  it('while they are read: loading, nothing listed', async () => {
    store.value = undefined
    offered.mockResolvedValue([PDX])
    await render()
    expect(find('[data-loading]')).not.toBeNull()
    expect(find('[data-remoteit]')).toBeNull()
    expect(find('[data-header]').textContent).toContain('Exits')
  })

  it('a server without exits says so, nothing listed', async () => {
    store.value = 'UNSUPPORTED'
    offered.mockResolvedValue([PDX])
    await render()
    expect(find('[data-notice]').getAttribute('data-notice')).toBe('info')
    expect(find('[data-notice]').textContent).toBe('This server does not have exits.')
    expect(find('[data-exit]')).toBeNull()
    expect(find('[data-remoteit]')).toBeNull()
  })

  it('exits that could not be read: said as an error, nothing listed', async () => {
    store.value = 'ERROR'
    offered.mockResolvedValue([PDX])
    await render()
    expect(find('[data-notice]').getAttribute('data-notice')).toBe('error')
    expect(find('[data-notice]').textContent).toBe('The exits could not be read.')
    expect(find('[data-exit]')).toBeNull()
    expect(find('[data-remoteit]')).toBeNull()
  })

  it('read once the store has them: listed', async () => {
    store.value = undefined
    await render()
    store.value = { own: [OFFICE], shared: [] }
    await rerender()
    expect(find('[data-loading]')).toBeNull()
    expect(ownShown()).toEqual(['xoffice'])
  })
})
