import React, { act } from 'react'
import { createRoot } from 'react-dom/client'
import { describe, it, expect, vi, beforeEach } from 'vitest'

const { networkExits, setNetworkExit, accountExits } = vi.hoisted(() => ({
  networkExits: vi.fn(async (_accountId?: string) => new Map() as any),
  setNetworkExit: vi.fn(async (_networkId: string, _exit: string, _available: boolean) => ({} as any)),
  accountExits: vi.fn(async (_accountId: string) => ({ own: [], shared: [] } as any)),
}))
vi.mock('../services/graphQLExits', () => ({
  graphQLNetworkExits: networkExits,
  graphQLSetNetworkExit: setNetworkExit,
  graphQLAccountExits: accountExits,
}))
vi.mock('../services/graphQL', () => ({
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
// The add choice: each exit a button that picks it.
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

import { NetworkExits, exitLine } from './NetworkExits'
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
const mac = { id: 'xmac', name: 'Office Mac', remoteit: false, offered: true, dormant: false, owner: PAT }
const router = { id: 'xrouter', name: 'Home router', remoteit: false, offered: true, dormant: false, owner: PAT }
const spare = { id: 'xspare', name: 'Spare', remoteit: false, offered: false, dormant: true, owner: PAT }

async function render(props: any = {}) {
  document.body.innerHTML = ''
  const container = document.createElement('div')
  document.body.appendChild(container)
  await act(async () => createRoot(container).render(<NetworkExits network={network(props)} accountId="PAT" />))
  return container
}
const click = async (button: Element) => act(async () => (button as HTMLElement).click())

beforeEach(() => {
  networkExits.mockReset().mockResolvedValue(new Map([['N1', [mac]]]))
  setNetworkExit.mockReset().mockResolvedValue({})
  accountExits.mockReset().mockResolvedValue({ own: [router, mac, spare], shared: [] })
})

describe('a network’s exits', () => {
  it('lists the exits it makes available, each with what its devices may do with it now', async () => {
    const page = await render()
    expect(networkExits).toHaveBeenCalledWith('PAT')
    expect(page.textContent).toContain('Exits')
    expect(page.querySelector('[data-network-exit="xmac"]')?.textContent).toContain('Its devices may choose it now')
  })

  it('its managers make one of the account’s own exits available — not one already —, one with no device available said so', async () => {
    const page = await render()
    await click(page.querySelector('[data-icon="plus"]')!)
    expect([...page.querySelectorAll('[data-pick]')].map(b => b.getAttribute('data-pick'))).toEqual([
      'xrouter',
      'xspare',
    ])
    expect(page.querySelector('[data-pick="xspare"]')?.textContent).toBe('Spare · no device available')
    networkExits.mockResolvedValue(new Map([['N1', [mac, router]]]))
    await click(page.querySelector('[data-pick="xrouter"]')!)
    expect(setNetworkExit).toHaveBeenCalledWith('N1', 'xrouter', true)
    expect(page.querySelector('[data-network-exit="xrouter"]')).not.toBeNull()
  })

  it('and stop making one available; a refusal is said in graphql’s words', async () => {
    const page = await render()
    setNetworkExit.mockResolvedValue({ reason: 'Not yours to give' })
    await click(page.querySelector('[data-icon="times"]')!)
    expect(setNetworkExit).toHaveBeenCalledWith('N1', 'xmac', false)
    expect(page.querySelector('[data-notice]')?.textContent).toBe('Not yours to give')
  })

  it('one who sees it without managing it: the exits, neither add nor remove, and the account’s exits not asked', async () => {
    const page = await render({ permissions: ['VIEW', 'CONNECT'] })
    expect(page.textContent).toContain('Office Mac')
    expect(page.querySelector('[data-icon="plus"]')).toBeNull()
    expect(page.querySelector('[data-icon="times"]')).toBeNull()
    expect(accountExits).not.toHaveBeenCalled()
  })

  it('none made available yet: says what one would do', async () => {
    networkExits.mockResolvedValue(new Map([['N1', []]]))
    expect((await render()).textContent).toContain('No exit: its devices send their traffic out through an exit only')
  })

  it('nothing on a link, or where the API has no network exits', async () => {
    expect((await render({ kind: 'LINK' })).textContent).toBe('')
    networkExits.mockResolvedValue('UNSUPPORTED')
    expect((await render()).textContent).toBe('')
  })

  it('says an exit with no device available, or none of its devices taking traffic, and whose it is when another account’s', () => {
    expect(exitLine(t, { ...mac, offered: false, dormant: true }, 'PAT')).toBe(
      'No device available: it cannot be chosen until one of its devices is in service'
    )
    expect(exitLine(t, { ...mac, offered: false }, 'PAT')).toBe('None of its devices takes traffic now')
    expect(exitLine(t, { ...mac, owner: { id: 'NED', email: 'ned@example.com' } }, 'PAT')).toBe(
      'Its devices may choose it now · ned@example.com’s'
    )
  })
})
