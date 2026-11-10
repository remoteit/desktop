import React, { act } from 'react'
import { createRoot, Root } from 'react-dom/client'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

const { read, revokeOne, revokeAll, identity, sessions, info } = vi.hoisted(() => ({
  read: vi.fn(),
  revokeOne: vi.fn(),
  revokeAll: vi.fn(),
  identity: { current: { joinKeys: true } as any },
  sessions: { current: true },
  info: { current: { agent: { running: 'connectd-go 5.7.0' } } as any },
}))
vi.mock('../services/deviceIdentity', () => ({
  graphQLDeviceJoinKeys: read,
  graphQLRevokeDeviceJoinKey: revokeOne,
  graphQLRevokeDeviceJoinKeys: revokeAll,
}))
vi.mock('../hooks/useDeviceIdentity', () => ({ useDeviceIdentity: () => identity.current }))
vi.mock('../hooks/useDeviceSessions', () => ({ useDeviceSessions: () => sessions.current }))
vi.mock('../hooks/useDeviceSessionInfo', () => ({
  useDeviceSessionInfo: (id?: string) => (id ? info.current : undefined),
}))
// The confirmation is Confirm's own: here, its words, and the action as confirmed.
vi.mock('../buttons/ConfirmIconButton', () => ({
  ConfirmIconButton: ({ title, confirmProps, onClick, disabled }: any) => (
    <div data-confirm={title}>
      <div data-confirm-body>{confirmProps?.children}</div>
      <button disabled={disabled} onClick={onClick}>
        {title}
      </button>
    </div>
  ),
}))
vi.mock('../buttons/DynamicButton', () => ({
  DynamicButton: ({ title, onClick, disabled }: any) => (
    <button disabled={disabled} onClick={onClick}>
      {title}
    </button>
  ),
}))
vi.mock('./IssueDeviceJoinKeyDialog', () => ({
  IssueDeviceJoinKeyDialog: ({ device }: any) => <div data-issue-dialog={device.id} />,
}))
vi.mock('./ColorChip', () => ({ ColorChip: ({ label }: any) => <span data-chip>{label}</span> }))
vi.mock('./Timestamp', () => ({ Timestamp: ({ date }: any) => <span>{date.toISOString()}</span> }))
vi.mock('./Notice', () => ({ Notice: ({ children }: any) => <div data-notice>{children}</div> }))
vi.mock('react-i18next', () => {
  const fill = (text: string, values?: any) => text.replace(/{{(\w+)}}/g, (_, k) => values?.[k] ?? '')
  return {
    useTranslation: () => ({
      t: (_key: string, a: any, b?: any) => (typeof a === 'string' ? fill(a, b) : fill(a.defaultValue, a)),
    }),
  }
})

import { DeviceJoinKeys, joinKeysOffered, keyState } from './DeviceJoinKeys'
;(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true

const device = (over: Partial<IDevice> = {}) =>
  ({
    id: 'D1',
    name: 'Kiosk',
    state: 'active',
    lastReported: new Date('2026-11-09T10:00:00Z'),
    permissions: ['VIEW', 'MANAGE'],
    ...over,
  } as IDevice)

const key = (over: any = {}) => ({
  id: 'k1',
  name: 'USB stick',
  created: '2026-11-01T10:00:00Z',
  expires: null,
  revoked: null,
  lastUsed: '2026-11-09T09:00:00Z',
  boots: 4,
  stale: false,
  ...over,
})

let root: Root
let container: HTMLDivElement
const text = () => container.textContent || ''
const button = (label: string) =>
  [...container.querySelectorAll('button')].find(b => b.textContent?.trim() === label) as HTMLButtonElement

async function render(d = device()) {
  container = document.createElement('div')
  document.body.appendChild(container)
  root = createRoot(container)
  await act(async () => root.render(<DeviceJoinKeys device={d} />))
}

beforeEach(() => {
  document.body.innerHTML = ''
  read.mockReset().mockResolvedValue([key()])
  revokeOne.mockReset().mockResolvedValue(undefined)
  revokeAll.mockReset().mockResolvedValue(undefined)
  identity.current = { joinKeys: true }
  sessions.current = true
  info.current = { agent: { running: 'connectd-go 5.7.0' } }
})

afterEach(() => act(() => root?.unmount()))

describe('DeviceJoinKeys', () => {
  it('is offered only where the API serves keys, to whoever manages the device, Control Link features on', async () => {
    identity.current = { joinKeys: false }
    await render()
    expect(text()).toBe('')
    identity.current = { joinKeys: true }
    sessions.current = false
    await render()
    expect(text()).toBe('')
    sessions.current = true
    await render(device({ permissions: ['VIEW'] }))
    await render(device({ virtual: true }))
    expect(read).not.toHaveBeenCalled()
  })

  it('lists each key with its boots, last boot and expiry; revoked and expired keys say so', async () => {
    read.mockResolvedValue([
      key({ id: 'k3', name: 'Image v2', lastUsed: null, boots: 0, expires: '2027-01-01T00:00:00Z' }),
      key({ id: 'k2', name: 'Old image', expires: '2026-01-01T00:00:00Z' }),
      key({ id: 'k1', name: 'Leaked', revoked: '2026-11-02T10:00:00Z' }),
    ])
    await render()
    expect(text()).toContain('Device Join Keys')
    expect(text()).toContain('Image v2')
    expect(text()).toContain('No boot yet')
    expect(text()).toContain('Boots: 0')
    expect(text()).toContain('Expires 2027-01-01T00:00:00.000Z')
    expect(text()).toContain('Last boot 2026-11-09T09:00:00.000Z')
    expect(text()).toContain('Boots: 4')
    const chips = [...container.querySelectorAll('[data-chip]')].map(c => c.textContent)
    expect(chips).toEqual(['Expired', 'Revoked'])
    // Only a key in force can be revoked.
    expect(container.querySelectorAll('[data-join-key] [data-confirm="Revoke Key"]')).toHaveLength(1)
  })

  it('flags a key in force with no boot for 30 days, as a suggestion only', async () => {
    read.mockResolvedValue([key({ stale: true }), key({ id: 'k0', name: 'Gone', stale: true, revoked: '2026-11-02' })])
    await render()
    expect([...container.querySelectorAll('[data-chip]')].map(c => c.textContent)).toEqual([
      'No boot in 30 days',
      'Revoked',
    ])
    expect(text()).toContain('Only a suggestion — some devices boot rarely.')
    expect(text().match(/No boot with this key for 30 days/g)).toHaveLength(1)
  })

  it('issues a key; with two in force it says to revoke one first', async () => {
    await render()
    await act(async () => button('Issue Key').click())
    expect(container.querySelector('[data-issue-dialog="D1"]')).not.toBeNull()

    read.mockResolvedValue([key({ id: 'k2' }), key()])
    await render()
    expect(button('Issue Key').disabled).toBe(true)
    expect(text()).toContain('Two keys are in force, the most a device has: revoke one before issuing another.')
  })

  it('revokes one key, warning when it is the last in force, and reads the list again', async () => {
    await render()
    expect(container.querySelector('[data-join-key] [data-confirm-body]')!.textContent).toContain(
      'This is its only key in force: the device cannot come back at its next boot'
    )
    read.mockResolvedValue([key({ revoked: '2026-11-09T12:00:00Z' })])
    await act(async () => button('Revoke Key').click())
    expect(revokeOne).toHaveBeenCalledWith('D1', 'k1')
    expect(read).toHaveBeenCalledTimes(2)
    expect(text()).toContain('Revoked')
  })

  it('revokes every key, saying the device cannot come back until a new one is issued', async () => {
    await render()
    const all = container.querySelector('[data-confirm="Revoke all keys"]')!
    expect(all.textContent).toContain(
      'every key stops working at once, and the device cannot come back at its next boot until a new key is issued'
    )
    await act(async () => button('Revoke all keys').click())
    expect(revokeAll).toHaveBeenCalledWith('D1')
  })

  it("shows graphql's refusal", async () => {
    revokeAll.mockResolvedValue('Not authorized to manage this device')
    await render()
    await act(async () => button('Revoke all keys').click())
    const notices = [...container.querySelectorAll('[data-notice]')].filter(n => !n.closest('[data-confirm-body]'))
    expect(notices.map(n => n.textContent)).toEqual(['Not authorized to manage this device'])
  })

  it('a device that does not report and has never been online is offered keys; a Classic device online is not', async () => {
    info.current = { agent: null }
    read.mockResolvedValue([])
    await render(device({ state: 'inactive', lastReported: undefined as any }))
    expect(text()).toContain('No join keys yet.')
    await render(device())
    expect(text()).toBe('')
  })
})

describe('joinKeysOffered and keyState', () => {
  it('offers keys to a reporting device, one with keys, or one never online', () => {
    const online = device()
    expect(joinKeysOffered(online, true, [])).toBe(true)
    expect(joinKeysOffered(online, false, [key()])).toBe(true)
    expect(joinKeysOffered(online, false, [])).toBe(false)
    expect(joinKeysOffered(device({ state: 'inactive', lastReported: undefined as any }), false, [])).toBe(true)
  })

  it('a key is in force until revoked or past its expiry', () => {
    const now = Date.parse('2026-11-09T12:00:00Z')
    expect(keyState(key(), now)).toBeUndefined()
    expect(keyState(key({ expires: '2026-11-09T11:59:00Z' }), now)).toBe('expired')
    expect(keyState(key({ expires: '2026-11-10T00:00:00Z' }), now)).toBeUndefined()
    expect(keyState(key({ revoked: '2026-11-01T00:00:00Z', expires: '2026-01-01T00:00:00Z' }), now)).toBe('revoked')
  })

  it("graphql's inForce, where it says, over this machine's clock", () => {
    const now = Date.parse('2026-11-09T12:00:00Z')
    expect(keyState(key({ inForce: true, expires: '2026-11-09T11:59:00Z' }), now)).toBeUndefined()
    expect(keyState(key({ inForce: false, expires: '2026-11-10T00:00:00Z' }), now)).toBe('expired')
    expect(keyState(key({ inForce: false, revoked: '2026-11-01T00:00:00Z' }), now)).toBe('revoked')
  })
})
