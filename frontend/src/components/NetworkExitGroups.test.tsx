import React, { act } from 'react'
import { createRoot } from 'react-dom/client'
import { describe, it, expect, vi, beforeEach } from 'vitest'

const { exitGroups, setExitGroup, ownGroups } = vi.hoisted(() => ({
  exitGroups: vi.fn(async (_accountId?: string) => new Map() as any),
  setExitGroup: vi.fn(async (_networkId: string, _label: string, _exit: boolean) => ({} as any)),
  ownGroups: vi.fn(async (_accountId: string) => [] as any),
}))
vi.mock('../services/graphQLDeviceNetworks', () => ({
  graphQLNetworkExitGroups: exitGroups,
  graphQLSetNetworkExitGroup: setExitGroup,
}))
vi.mock('../services/graphQLProxyGroups', () => ({
  graphQLAccountProxyGroups: ownGroups,
  refusalOf: (result: any) => (result === 'ERROR' ? '' : result && 'reason' in result ? result.reason : undefined),
}))
vi.mock('./Gutters', () => ({ Gutters: ({ children }: any) => <>{children}</> }))
vi.mock('./Notice', () => ({ Notice: ({ children }: any) => <div data-notice>{children}</div> }))
vi.mock('./Icon', () => ({ Icon: () => null }))
vi.mock('../buttons/IconButton', () => ({
  IconButton: ({ title, icon, onClick, disabled }: any) => (
    <button data-icon={icon} disabled={disabled} onClick={onClick}>
      {title}
    </button>
  ),
}))
// The add choice: each group a button that picks it.
vi.mock('@mui/material', async () => {
  const actual: any = await vi.importActual('@mui/material')
  return {
    ...actual,
    TextField: ({ children, onChange }: any) => (
      <div data-choose>
        {React.Children.map(children, (child: any) => (
          <button data-pick={child.props.value} onClick={() => onChange({ target: { value: child.props.value } })}>
            {child.props.children}
          </button>
        ))}
      </div>
    ),
  }
})
vi.mock('react-i18next', () => {
  const fill = (text: string, values?: any) => text.replace(/{{(\w+)}}/g, (_, k) => values?.[k] ?? '')
  return { useTranslation: () => ({ t: (_key: string, text: string, values?: any) => fill(text, values) }) }
})

import { NetworkExitGroups, exitGroupLine } from './NetworkExitGroups'
;(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true

const t = ((_key: string, text: string, values?: any) => text.replace(/{{(\w+)}}/g, (_, k) => values?.[k] ?? '')) as any
const PAT = { id: 'PAT', email: 'pat@example.com' }
const network = (extra: any = {}) =>
  ({
    id: 'N1',
    name: 'Office',
    kind: 'NETWORK',
    permissions: ['VIEW', 'CONNECT', 'MANAGE'],
    owner: PAT,
    ...extra,
  } as any)
const mac = { label: 'gmac', name: 'Office Mac', offered: true, dormant: false, owner: PAT }
const router = { label: 'grouter', name: 'Home router', remoteit: false, offered: true }

async function render(props: any = {}) {
  document.body.innerHTML = ''
  const container = document.createElement('div')
  document.body.appendChild(container)
  await act(async () => createRoot(container).render(<NetworkExitGroups network={network(props)} accountId="PAT" />))
  return container
}
const click = async (button: Element) => act(async () => (button as HTMLElement).click())

beforeEach(() => {
  exitGroups.mockReset().mockResolvedValue(new Map([['N1', [mac]]]))
  setExitGroup.mockReset().mockResolvedValue({})
  ownGroups
    .mockReset()
    .mockResolvedValue([
      { ...router },
      { label: 'gmac', name: 'Office Mac', remoteit: false, offered: true },
      { label: 'gold', name: 'Old box', remoteit: false, offered: false },
      { label: 'pdx1a', name: 'pdx1a', remoteit: true, offered: true },
    ])
})

describe('a network’s exit groups', () => {
  it('lists the groups it makes available, each with what its devices may do with it now', async () => {
    const page = await render()
    expect(exitGroups).toHaveBeenCalledWith('PAT')
    expect(page.textContent).toContain('Exits')
    expect(page.textContent).toContain('Office Mac')
    expect(page.textContent).toContain('Its devices may choose it now')
  })

  it('its managers make one of the account’s own groups offered now available — not one already, nor remote.it’s', async () => {
    const page = await render()
    await click(page.querySelector('[data-icon="plus"]')!)
    expect([...page.querySelectorAll('[data-pick]')].map(b => b.getAttribute('data-pick'))).toEqual(['grouter'])
    exitGroups.mockResolvedValue(new Map([['N1', [mac, { ...router, dormant: false, owner: PAT }]]]))
    await click(page.querySelector('[data-pick="grouter"]')!)
    expect(setExitGroup).toHaveBeenCalledWith('N1', 'grouter', true)
    expect(page.textContent).toContain('Home router')
    expect(page.querySelector('[data-icon="plus"]')).toBeNull() // nothing left to add
  })

  it('and stop making one available; a refusal is said in graphql’s words', async () => {
    const page = await render()
    setExitGroup.mockResolvedValue({ reason: 'Not yours to give' })
    await click(page.querySelector('[data-icon="times"]')!)
    expect(setExitGroup).toHaveBeenCalledWith('N1', 'gmac', false)
    expect(page.querySelector('[data-notice]')?.textContent).toBe('Not yours to give')
  })

  it('one who sees it without managing it: the groups, neither add nor remove, and the account’s groups not asked', async () => {
    const page = await render({ permissions: ['VIEW', 'CONNECT'] })
    expect(page.textContent).toContain('Office Mac')
    expect(page.querySelector('[data-icon="plus"]')).toBeNull()
    expect(page.querySelector('[data-icon="times"]')).toBeNull()
    expect(ownGroups).not.toHaveBeenCalled()
  })

  it('none made available yet: says what one would do', async () => {
    exitGroups.mockResolvedValue(new Map([['N1', []]]))
    expect((await render()).textContent).toContain(
      'No exit group: its devices send their traffic out through an exit only'
    )
  })

  it('nothing on a link, or where the API has no network exit groups', async () => {
    expect((await render({ kind: 'LINK' })).textContent).toBe('')
    exitGroups.mockResolvedValue('UNSUPPORTED')
    expect((await render()).textContent).toBe('')
  })

  it('says a group dormant, or offered by none of its devices now, and whose it is when another account’s', () => {
    expect(exitGroupLine(t, { ...mac, offered: false, dormant: true }, 'PAT')).toBe(
      'Dormant: no device in it is in service, so it cannot be chosen until one is'
    )
    expect(exitGroupLine(t, { ...mac, offered: false }, 'PAT')).toBe('No device in it offers itself as an exit now')
    expect(exitGroupLine(t, { ...mac, owner: { id: 'NED', email: 'ned@example.com' } }, 'PAT')).toBe(
      'Its devices may choose it now · ned@example.com’s'
    )
  })
})
