import React, { act } from 'react'
import { createRoot } from 'react-dom/client'
import { describe, it, expect, vi } from 'vitest'

const { signIns } = vi.hoisted(() => ({ signIns: vi.fn() }))
vi.mock('../hooks/useDeviceSignIns', () => ({ useDeviceSignIns: signIns }))
vi.mock('./Timestamp', () => ({ Timestamp: ({ date }: any) => <>{date.toISOString().slice(0, 10)}</> }))
vi.mock('./ListItemSetting', () => ({
  ListItemSetting: ({ label, subLabel }: any) => (
    <div data-item>
      {label}
      {subLabel ? <> — {subLabel}</> : null}
    </div>
  ),
}))
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (_key: string, text: string, values?: any) => text.replace(/{{(\w+)}}/g, (_, k) => values?.[k] ?? ''),
  }),
}))

import { DeviceSignIns } from './DeviceSignIns'
;(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true

async function render() {
  const container = document.createElement('div')
  await act(async () => createRoot(container).render(<DeviceSignIns deviceId="LAPTOP" />))
  return [...container.querySelectorAll('[data-item]')].map(item => item.textContent)
}

// Sign-ins per OS account (graphql-api docs/PROXY-GROUPS.md §15): each account's person, and whether they manage it.
describe('who is signed in on a device', () => {
  it('each account: the person, the account by name, whether they manage it, since when', async () => {
    signIns.mockReturnValue([
      {
        account: '501',
        name: 'pat',
        person: { id: 'PAT', email: 'pat@example.com' },
        since: '2026-11-10T20:00:00Z',
        manages: true,
      },
      {
        account: 'S-1-5-21-1-2-3-1013',
        name: null,
        person: { id: 'SAM', email: 'sam@example.com' },
        since: null,
        manages: false,
      },
    ])
    expect(await render()).toEqual([
      'pat@example.com on account pat — Can change Route through on the device · since 2026-11-10',
      'sam@example.com on account S-1-5-21-1-2-3-1013 — Sees Route through but cannot change it',
    ])
    expect(signIns).toHaveBeenCalledWith('LAPTOP')
  })

  it('an older daemon’s one sign-in: the machine’s, on no account', async () => {
    signIns.mockReturnValue([
      { account: null, name: null, person: { id: 'PAT', email: null }, since: '2026-11-10T20:00:00Z', manages: false },
    ])
    expect(await render()).toEqual([
      'PAT signed in — Sees Route through but cannot change it · since 2026-11-10',
    ])
  })

  it('no one: said; an API without sign-ins per account, or while read: nothing', async () => {
    signIns.mockReturnValue([])
    expect(await render()).toEqual(['No one is signed in on this device'])
    signIns.mockReturnValue(null)
    expect(await render()).toEqual([])
    signIns.mockReturnValue(undefined)
    expect(await render()).toEqual([])
  })
})
