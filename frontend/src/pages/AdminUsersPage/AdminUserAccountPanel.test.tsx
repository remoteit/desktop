import React, { act } from 'react'
import { createRoot } from 'react-dom/client'
import { MemoryRouter, Route } from 'react-router-dom'
import { ThemeProvider, createTheme } from '@mui/material/styles'
import { describe, it, expect, vi, beforeEach } from 'vitest'

// An admin's view of a user's account: the user's "Usage this month" group, read for that account; nothing of it when
// the read fails.
const { read } = vi.hoisted(() => ({ read: vi.fn() }))
vi.mock('../../services/transferUsage', () => ({ fetchTransferUsage: read, UNSUPPORTED: 'UNSUPPORTED' }))
vi.mock('../../helpers/dateHelper', () => ({ getLocale: () => 'en-US' }))
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (_key: string, text: any, values?: any) =>
      typeof text === 'string' ? text.replace(/{{(\w+)}}/g, (_: string, k: string) => values?.[k] ?? '') : _key,
  }),
}))
const USER = { id: 'USER-1', email: 'user@example.com', admin: false, info: { devices: { total: 2, online: 1 } } }
vi.mock('react-redux', () => ({
  useDispatch: () => ({ adminUsers: { fetchUserDetail: vi.fn(async () => {}), fetch: vi.fn() }, ui: { set: vi.fn() } }),
  useSelector: (selector: any) => selector({ adminUsers: { detailCache: { 'USER-1': USER } } }),
}))
vi.mock('../../store', () => ({}))
vi.mock('../../services/graphQLMutation', () => ({
  graphQLAdminUpdateEmail: vi.fn(),
  graphQLAdminDeleteUser: vi.fn(),
  graphQLRemoveAdmin: vi.fn(),
}))
vi.mock('./ChangeEmailDialog', () => ({ ChangeEmailDialog: () => null }))
vi.mock('../../components/Confirm', () => ({ Confirm: () => null }))
vi.mock('../../buttons/CopyIconButton', () => ({ CopyIconButton: () => null }))
vi.mock('../../components/Icon', () => ({ Icon: () => null }))
vi.mock('../../components/Title', () => ({ Title: ({ children }: any) => <span>{children}</span> }))
vi.mock('../../components/Container', () => ({
  Container: ({ header, children }: any) => (
    <div>
      {header}
      {children}
    </div>
  ),
}))

import { AdminUserAccountPanel } from './AdminUserAccountPanel'
import { lightColors } from '../../styling'
;(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true

const theme = createTheme({
  palette: Object.fromEntries(Object.entries(lightColors).map(([name, main]) => [name, { main }])) as any,
})

async function render() {
  const container = document.createElement('div')
  await act(async () =>
    createRoot(container).render(
      <ThemeProvider theme={theme}>
        <MemoryRouter initialEntries={['/admin/users/USER-1/account']}>
          <Route path="/admin/users/:userId/account">
            <AdminUserAccountPanel />
          </Route>
        </MemoryRouter>
      </ThemeProvider>
    )
  )
  return container
}

const usage = (kind: string) => ({
  kind,
  month: '2026-11',
  usedBytes: 2e9,
  allowanceBytes: 10e9,
  rateBps: 1e6,
  over: false,
  resetsAt: '2026-12-01T00:00:00.000Z',
  devices: [],
})

describe('AdminUserAccountPanel', () => {
  beforeEach(() => {
    read.mockReset()
  })

  it("shows the user's usage this month, read for their account", async () => {
    read.mockResolvedValue([usage('exit'), usage('proxy')])
    const c = await render()
    expect(read).toHaveBeenCalledWith('USER-1')
    const group = c.querySelector('[data-testid="transfer-usage"]')!
    expect(group.textContent).toContain('Usage this month')
    expect(group.querySelector('[data-testid="transfer-usage-exit"]')!.textContent).toContain('2 GB of 10 GB used')
    expect(group.querySelector('[data-testid="transfer-usage-proxy"]')).not.toBeNull()
  })

  it('hides the group when the read fails', async () => {
    read.mockResolvedValue('ERROR')
    let c = await render()
    expect(c.querySelector('[data-testid="transfer-usage"]')).toBeNull()
    expect(c.textContent).toContain('Device Summary')

    read.mockRejectedValue(new Error('network'))
    c = await render()
    expect(c.querySelector('[data-testid="transfer-usage"]')).toBeNull()
  })
})
