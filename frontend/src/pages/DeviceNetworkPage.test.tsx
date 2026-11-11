import React, { act } from 'react'
import { createRoot } from 'react-dom/client'
import { describe, it, expect, vi } from 'vitest'

// The row alone: the page's reads and the parts beside it are not what is tested here.
vi.mock('../store', () => ({}))
vi.mock('../services/graphQLDeviceNetworks', () => ({
  initiates: (member: any) => member.role !== 'TARGET',
  targeted: (member: any) => member.role !== 'INITIATOR',
}))
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
    onInitiator: vi.fn(),
    onAll: vi.fn(),
    onAnyPort: vi.fn(),
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
        allOn={false}
        summary="Target: Exposes nothing"
        editable
        {...on}
        {...props}
      />
    )
  )
  const chip = (label: string) =>
    [...container.querySelectorAll('.MuiChip-root')].find(c => c.textContent === label) as HTMLElement
  return { container, on, chip }
}

describe('a network member row', () => {
  it('a membership of its own: its role and services set here, and removed here', async () => {
    const { container, on, chip } = await render()
    expect(container.querySelector('[data-remove]')).not.toBeNull()
    await act(async () => chip('Initiator').click())
    await act(async () => chip('ssh').click())
    expect(on.onInitiator).toHaveBeenCalled()
    expect(on.onService).toHaveBeenCalledWith('S1')
  })

  it('one its product holds: not offered for removal, its role not changed here; what the network lists still is', async () => {
    const { container, on, chip } = await render({ member: member({ fromProduct: true }) })
    expect(container.querySelector('[data-remove]')).toBeNull()
    for (const label of ['Initiator', 'All services', 'Any port']) await act(async () => chip(label).click())
    expect(on.onInitiator).not.toHaveBeenCalled()
    expect(on.onAll).not.toHaveBeenCalled()
    expect(on.onAnyPort).not.toHaveBeenCalled()
    await act(async () => chip('ssh').click())
    expect(on.onService).toHaveBeenCalledWith('S1')
  })

  it('one its product holds as an initiator, or exposing all: nothing on it to change here', async () => {
    let row = await render({ member: member({ fromProduct: true, role: 'INITIATOR' }) })
    await act(async () => row.chip('ssh').click())
    expect(row.on.onService).not.toHaveBeenCalled()
    row = await render({ member: member({ fromProduct: true, scope: 'ALL' }), allOn: true })
    await act(async () => row.chip('ssh').click())
    expect(row.on.onService).not.toHaveBeenCalled()
  })
})
