import React, { act } from 'react'
import { createRoot } from 'react-dom/client'
import { describe, it, expect, vi, beforeEach } from 'vitest'

// A share's exit toggle on a device's share page (graphql-api docs/PROXY-GROUPS.md §11, "The bridge, retired"): a device
// in an own group is used as an exit through its group, so in place of the toggle the page says so and opens the group's
// share dialog for the person; a device in no group, or an API that shares no groups, keeps the toggle.

const { shareExit, setShareExit, deviceGroup, served } = vi.hoisted(() => ({
  shareExit: vi.fn(async (_deviceId: string, _email: string): Promise<any> => false),
  setShareExit: vi.fn(async (_deviceId: string, _email: string, _exit: boolean): Promise<any> => ({})),
  deviceGroup: vi.fn(async (_deviceId: string): Promise<any> => null),
  served: vi.fn(async () => true),
}))
vi.mock('../services/graphQLProxy', () => ({ graphQLShareExit: shareExit, graphQLSetShareExit: setShareExit }))
vi.mock('../services/graphQLProxyGroups', () => ({ graphQLDeviceGroup: deviceGroup, proxyGroupSharesServed: served }))
vi.mock('./ListItemSetting', () => ({
  ListItemSetting: ({ label, subLabel, toggle, button, onClick, onButtonClick }: any) => (
    <div data-setting data-toggle={toggle === undefined ? 'none' : String(toggle)}>
      <span data-label>{label}</span>
      <span data-sublabel>{subLabel}</span>
      {toggle !== undefined && <button data-toggle-button onClick={onClick} />}
      {button !== undefined && (
        <button data-action onClick={onButtonClick}>
          {button}
        </button>
      )}
    </div>
  ),
}))
vi.mock('./ProxyGroupShareDialog', () => ({
  ProxyGroupShareDialog: ({ group, emails }: any) => (
    <div data-dialog={group.label} data-emails={(emails ?? []).join('|')} />
  ),
}))
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (_key: string, text: string, values?: any) => text.replace(/{{(\w+)}}/g, (_, k) => values?.[k] ?? ''),
  }),
}))

import { ShareExitSetting } from './ShareExitSetting'
;(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true

const DEVICE = { id: 'MAC', permissions: ['VIEW', 'MANAGE'] } as any
const GROUP = {
  label: 'gaaa',
  name: 'Office Mac',
  remoteit: false,
  host: null,
  members: [{ id: 'MAC', name: 'Office Mac', kind: 'exit', state: 'active' }],
  users: 1,
  endpoints: 0,
  access: [] as any[],
}

async function render(device = DEVICE, email = 'sam@example.com') {
  const container = document.createElement('div')
  await act(async () => createRoot(container).render(<ShareExitSetting device={device} email={email} />))
  return container
}

describe("a share's exit toggle", () => {
  beforeEach(() => {
    shareExit.mockReset().mockResolvedValue(false)
    setShareExit.mockReset().mockResolvedValue({})
    deviceGroup.mockReset().mockResolvedValue(null)
    served.mockReset().mockResolvedValue(true)
  })

  it("a device in an own group: its exit is the group's, its Share opening the group's dialog for the person — no toggle", async () => {
    deviceGroup.mockResolvedValue(GROUP)
    const container = await render()
    expect(container.querySelector('[data-setting]')?.getAttribute('data-toggle')).toBe('none')
    expect(container.querySelector('[data-sublabel]')?.textContent).toBe(
      'Through its group, Office Mac: share the group to let them'
    )
    expect(shareExit).not.toHaveBeenCalled()
    expect(container.querySelector('[data-dialog]')).toBeNull()
    await act(async () => (container.querySelector('[data-action]') as HTMLButtonElement).click())
    expect(container.querySelector('[data-dialog]')?.getAttribute('data-dialog')).toBe('gaaa')
    expect(container.querySelector('[data-dialog]')?.getAttribute('data-emails')).toBe('sam@example.com')
    expect(setShareExit).not.toHaveBeenCalled()
  })

  it('one shared with the person already says so, and opens its dialog with no address chosen', async () => {
    deviceGroup.mockResolvedValue({ ...GROUP, access: [{ user: { id: 'SAM', email: 'Sam@Example.com' } }] })
    const container = await render()
    expect(container.querySelector('[data-sublabel]')?.textContent).toBe(
      'Through its group, Office Mac, which is shared with them'
    )
    await act(async () => (container.querySelector('[data-action]') as HTMLButtonElement).click())
    expect(container.querySelector('[data-dialog]')?.getAttribute('data-emails')).toBe('')
  })

  it('a group whose account the reader does not manage: said, with no Share', async () => {
    deviceGroup.mockResolvedValue({ ...GROUP, members: null })
    const container = await render()
    expect(container.querySelector('[data-sublabel]')?.textContent).toContain('Through its group, Office Mac')
    expect(container.querySelector('[data-action]')).toBeNull()
  })

  it("a device in no group, or one of remote.it's: the toggle, as before", async () => {
    shareExit.mockResolvedValue(true)
    let container = await render()
    expect(container.querySelector('[data-setting]')?.getAttribute('data-toggle')).toBe('true')
    await act(async () => (container.querySelector('[data-toggle-button]') as HTMLButtonElement).click())
    expect(setShareExit).toHaveBeenCalledWith('MAC', 'sam@example.com', false)
    deviceGroup.mockResolvedValue({ ...GROUP, remoteit: true })
    container = await render()
    expect(container.querySelector('[data-setting]')?.getAttribute('data-toggle')).toBe('true')
  })

  it('an API that shares no groups: the toggle, its group not asked', async () => {
    served.mockResolvedValue(false)
    const container = await render()
    expect(deviceGroup).not.toHaveBeenCalled()
    expect(container.querySelector('[data-setting]')?.getAttribute('data-toggle')).toBe('false')
  })

  it('nothing for someone who does not manage the device', async () => {
    deviceGroup.mockResolvedValue(GROUP)
    const container = await render({ id: 'MAC', permissions: ['VIEW'] } as any)
    expect(container.querySelector('[data-setting]')).toBeNull()
  })
})
