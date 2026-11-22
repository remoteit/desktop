import React, { act } from 'react'
import { createRoot } from 'react-dom/client'
import { describe, it, expect, vi } from 'vitest'

// The row alone: the page's reads and the parts beside it are not what is tested here.
vi.mock('../store', () => ({}))
vi.mock('../services/post', () => ({}))
vi.mock('../services/graphQL', () => ({}))
vi.mock('../services/graphQLDaemon', () => ({}))
vi.mock('../services/productPolicy', () => ({}))
vi.mock('../buttons/DeleteButton', () => ({ DeleteButton: () => null }))
vi.mock('../styling', () => ({ spacing: {} }))
vi.mock('@mui/material', async () => {
  const actual: any = await vi.importActual('@mui/material')
  return {
    ...actual,
    TextField: ({ select, label, value, disabled, children, onChange }: any) =>
      select ? (
        <div data-select={label} data-value={value}>
          {React.Children.map(children, (child: any) =>
            child ? (
              <button
                data-choice={child.props.value}
                disabled={disabled}
                onClick={() => onChange({ target: { value: child.props.value } })}
              >
                {child.props.children}
              </button>
            ) : null
          )}
        </div>
      ) : null,
  }
})
vi.mock('../services/graphQLMutation', () => ({}))
vi.mock('../hooks/useDeviceNetworks', () => ({}))
vi.mock('../hooks/useLabel', () => ({}))
vi.mock('../selectors/devices', () => ({}))
vi.mock('../selectors/tags', () => ({}))
vi.mock('../selectors/accounts', () => ({}))
vi.mock('../components/Link', () => ({}))
vi.mock('../components/LoadingMessage', () => ({}))
vi.mock('../components/Container', () => ({}))
vi.mock('../components/Gutters', () => ({}))
vi.mock('../components/Notice', () => ({}))
vi.mock('../components/Title', () => ({}))
vi.mock('../components/DeviceNetworkGraph', () => ({ DeviceNetworkGraph: () => null }))
vi.mock('../components/NetworkExits', () => ({ NetworkExits: () => null }))
vi.mock('../components/Icon', () => ({ Icon: () => null }))
vi.mock('../buttons/IconButton', () => ({
  IconButton: ({ title, onClick }: any) => (
    <button data-remove onClick={onClick}>
      {title}
    </button>
  ),
}))
vi.mock('react-i18next', () => {
  const fill = (text: string, values?: any) => text.replace(/{{(\w+)}}/g, (_, k) => values?.[k] ?? '')
  return { useTranslation: () => ({ t: (_key: string, text: string, values?: any) => fill(text, values) }) }
})

import { MemberRow } from './DeviceNetworkPage'
import type { NetworkMember } from '../services/graphQLDeviceNetworks'
;(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true

const member = (extra: Partial<NetworkMember> = {}): NetworkMember => ({
  deviceId: 'D1',
  role: 'TARGET',
  scope: 'LISTED',
  anyPort: false,
  ...extra,
})

async function render(props: Partial<React.ComponentProps<typeof MemberRow>> = {}) {
  const on = {
    onReach: vi.fn(),
    onReached: vi.fn(),
    onService: vi.fn(),
    onRemove: vi.fn(),
  }
  const container = document.createElement('div')
  await act(async () =>
    createRoot(container).render(
      <MemberRow
        name="pump"
        member={member()}
        services={[{ id: 'S1', name: 'ssh' }]}
        listed={new Set()}
        listedCount={0}
        alsoTagged={[]}
        editable
        {...on}
        {...props}
      />
    )
  )
  const choice = (select: string, value: string) =>
    container.querySelector(`[data-select="${select}"] [data-choice="${value}"]`) as HTMLButtonElement
  const value = (select: string) => container.querySelector(`[data-select="${select}"]`)!.getAttribute('data-value')
  const chip = (label: string) =>
    [...container.querySelectorAll('.MuiChip-root')].find(c => c.textContent === label) as HTMLElement | undefined
  return { container, on, choice, value, chip }
}

describe('a network member row', () => {
  it('shows the stored membership as the two controls', async () => {
    let row = await render({ member: member({ role: 'BOTH', scope: 'ALL', anyPort: true }) })
    expect(row.value('Can reach')).toBe('ALL')
    expect(row.value('Can be reached')).toBe('ALL_ANY_PORT')
    row = await render({ member: member({ role: 'INITIATOR' }) })
    expect(row.value('Can reach')).toBe('ALL')
    expect(row.value('Can be reached')).toBe('NOTHING')
    row = await render({ listed: new Set(['S1']), listedCount: 1 })
    expect(row.value('Can reach')).toBe('NOTHING')
    expect(row.value('Can be reached')).toBe('CHOSEN')
  })

  it('a membership of its own: both controls and its services set here, and removed here', async () => {
    const { container, on, choice } = await render()
    expect(container.querySelector('[data-remove]')).not.toBeNull()
    expect(container.textContent).toContain('Not set up yet')
    await act(async () => choice('Can reach', 'ALL').click())
    expect(on.onReach).toHaveBeenCalledWith(true)
    await act(async () => choice('Can be reached', 'ALL').click())
    expect(on.onReached).toHaveBeenCalledWith('ALL')
  })

  it('choosing services from nothing shows them to choose, and saves with the first', async () => {
    const { on, choice, chip } = await render()
    expect(chip('ssh')).toBeUndefined()
    await act(async () => choice('Can be reached', 'CHOSEN').click())
    expect(on.onReached).not.toHaveBeenCalled()
    await act(async () => chip('ssh')!.click())
    expect(on.onService).toHaveBeenCalledWith('S1')
  })

  it('one its product holds: not offered for removal, its controls fixed; what the network lists still changes', async () => {
    const { container, on, choice, chip } = await render({
      member: member({ fromProduct: true }),
      listed: new Set(['S1']),
      listedCount: 1,
    })
    expect(container.querySelector('[data-remove]')).toBeNull()
    expect(choice('Can reach', 'ALL').disabled).toBe(true)
    expect(choice('Can be reached', 'ALL').disabled).toBe(true)
    await act(async () => chip('ssh')!.click())
    expect(on.onService).toHaveBeenCalledWith('S1')
  })

  it('one its product holds as only reaching: no services to choose', async () => {
    const row = await render({ member: member({ fromProduct: true, role: 'INITIATOR' }) })
    expect(row.chip('ssh')).toBeUndefined()
  })

  it('says when a tag rule also covers the device', async () => {
    const { container } = await render({ alsoTagged: ['plant-2'] })
    expect(container.textContent).toContain('pump is also tagged plant-2. The settings here apply, not the tag rule.')
  })
})
