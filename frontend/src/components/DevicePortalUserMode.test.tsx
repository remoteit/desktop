import React, { act } from 'react'
import { createRoot, Root } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { DevicePortalUserMode } from './DevicePortalUserMode'
import {
  PortalUserMode,
  readPortalUserMode,
  requestPortalUserMode,
  revokePortalUserMode,
} from '../services/devicePortalUserMode'

vi.mock('../services/devicePortalUserMode', () => ({
  readPortalUserMode: vi.fn(),
  requestPortalUserMode: vi.fn(),
  revokePortalUserMode: vi.fn(),
}))
vi.mock('../buttons/CopyIconButton', () => ({ CopyIconButton: () => null }))
vi.mock('@mui/material', async importOriginal => ({
  ...(await importOriginal<typeof import('@mui/material')>()),
  TextField: ({ label, value, onChange, children }: any) => (
    <select aria-label={label} value={value} onChange={onChange}>
      <option value="" />
      {children}
    </select>
  ),
  MenuItem: ({ value, children }: any) => <option value={value}>{children}</option>,
  Dialog: ({ open, children }: any) => (open ? <div role="dialog">{children}</div> : null),
}))
vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (_: string, text: string) => text }),
}))
;(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true

const person = { id: 'PAT', email: 'pat@example.com' }
const command = 'remoteit-device-solo'

describe('portal user mode', () => {
  let state: PortalUserMode
  let container: HTMLDivElement
  let root: Root

  beforeEach(() => {
    vi.clearAllMocks()
    state = {
      portalUserMode: [],
      userModeEligibility: {
        accounts: [{ name: 'sam', account: '501', requiresOsAdmin: false }],
        canRequestWholeDevice: true,
        blockedByLocalPolicy: false,
      },
    }
    vi.mocked(readPortalUserMode).mockImplementation(async () => ({ ...state }))
    container = document.createElement('div')
    root = createRoot(container)
  })

  afterEach(async () => act(async () => root.unmount()))

  const render = async () =>
    act(async () =>
      root.render(<DevicePortalUserMode deviceId="DEVICE" legacy={<div>Legacy switch</div>} command={command} />)
    )
  const pick = async (name: string) =>
    act(async () => {
      const select = container.querySelector('select')!
      select.value = name
      select.dispatchEvent(new Event('change', { bubbles: true }))
    })
  const click = async (label: string, dialog = false) =>
    act(async () => {
      const scope = dialog ? container.querySelector('[role=dialog]')! : container
      const button = [...scope.querySelectorAll('button')].find(button => button.textContent === label)
      if (!button) throw new Error(`Missing button: ${label}`)
      button.click()
    })

  it('is titled Full access, an Access level, and never says user mode', async () => {
    await render()
    expect(container.querySelector('h6')?.textContent).toBe('Full access')
    expect(container.textContent?.toLowerCase()).not.toContain('user mode')
  })

  it('sends the exact selected account for a user with a grant', async () => {
    state.userModeEligibility.canRequestWholeDevice = false
    vi.mocked(requestPortalUserMode).mockResolvedValue({ id: 'ACCOUNT' })
    await render()
    expect(container.querySelector('option[value="*"]')).toBeNull()
    await pick('sam/501')
    await click('Enable')
    expect(container.querySelector('[role=dialog]')).toBeTruthy()
    await click('Enable', true)
    expect(requestPortalUserMode).toHaveBeenCalledWith('DEVICE', {
      name: 'sam',
      account: '501',
      requiresOsAdmin: false,
    })
  })

  it('shows the approval instructions for a pending whole-device request', async () => {
    vi.mocked(requestPortalUserMode).mockImplementation(async () => {
      state.portalUserMode.push({
        id: 'WHOLE',
        person,
        name: null,
        account: null,
        requiresOsAdmin: true,
        state: 'pending',
      })
      return { id: 'WHOLE', approvalCode: 'test-approval-code' }
    })
    await render()
    await pick('*')
    await click('Enable')
    await click('Enable', true)
    expect(container.textContent).toContain(`${command} user-mode approve`)
    expect(container.textContent).toContain('test-approval-code')
    expect(requestPortalUserMode).toHaveBeenCalledWith('DEVICE', { name: null, account: null, requiresOsAdmin: true })
  })

  it('revokes a single binding by ID', async () => {
    state.portalUserMode = [
      { id: 'ACCOUNT', person, name: 'sam', account: '501', requiresOsAdmin: false, state: 'active' },
    ]
    vi.mocked(revokePortalUserMode).mockResolvedValue(true)
    await render()
    await click('Revoke sign-in')
    await click('Revoke sign-in', true)
    expect(revokePortalUserMode).toHaveBeenCalledWith('DEVICE', 'ACCOUNT')
  })

  it('keeps the approval code visible after a failed refresh and retries the read', async () => {
    vi.mocked(requestPortalUserMode).mockImplementation(async () => {
      vi.mocked(readPortalUserMode).mockResolvedValueOnce('ERROR')
      state.portalUserMode = [
        { id: 'WHOLE', person, name: null, account: null, state: 'pending', requiresOsAdmin: true },
      ]
      return { id: 'WHOLE', approvalCode: 'test-approval-code' }
    })
    await render()
    await pick('*')
    await click('Enable')
    await click('Enable', true)
    expect(container.textContent).toContain('Couldn’t load full access. Try again.')
    expect(container.textContent).toContain('test-approval-code')
    await click('Retry')
    expect(container.textContent).toContain('Waiting for OS admin approval')
    expect(container.textContent).not.toContain('Couldn’t load full access. Try again.')
    expect(container.textContent).toContain('test-approval-code')
  })

  it('falls back to the legacy control on an older device', async () => {
    vi.mocked(readPortalUserMode).mockResolvedValueOnce(null)
    await render()
    expect(container.textContent).toBe('Legacy switch')
  })
})
