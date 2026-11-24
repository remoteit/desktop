import React, { act } from 'react'
import { createRoot } from 'react-dom/client'
import { describe, it, expect, vi, beforeEach } from 'vitest'

// The list read again where it is — another sign-in comes to serve the account (hooks/useReadAgain) — keeps what the
// person had ticked, where it is still listed; and one that cannot be read then shows none of what was read before.
const { fetchDisabled } = vi.hoisted(() => ({ fetchDisabled: vi.fn() }))
vi.mock('react-redux', () => ({
  useSelector: (select: any) => select({ ui: { destroying: false } }),
  useDispatch: () => ({ devices: { restore: vi.fn() } }),
}))
vi.mock('../store', () => ({}))
vi.mock('../selectors/accounts', () => ({ selectActiveAccountId: () => 'ACME' }))
vi.mock('../services/deviceDisable', () => ({
  deviceDisableFields: async () => '',
  disabledAdaptor: () => ({ disabled: true }),
  graphQLFetchDisabledDevices: fetchDisabled,
}))
vi.mock('../hooks/useDeviceDisable', () => ({
  useDecommissionRule: () => () => false,
  useDeviceDisable: () => true,
  useDisabledDevicesAccess: () => true,
}))
vi.mock('../components/DisabledDeviceNotice', () => ({ disabledDescription: () => '' }))
vi.mock('../components/DecommissionDialog', () => ({ DecommissionDialog: () => null }))
vi.mock('../components/ListItemCheckbox', () => ({
  ListItemCheckbox: ({ checked, onClick, label }: any) => (
    <label data-row>
      <input type="checkbox" checked={checked} onChange={event => onClick(event.target.checked)} />
      {label}
    </label>
  ),
}))
vi.mock('../components/LoadingMessage', () => ({ LoadingMessage: () => <div data-loading /> }))
vi.mock('../components/TargetPlatform', () => ({ TargetPlatform: () => null }))
vi.mock('../buttons/IconButton', () => ({ IconButton: () => null }))
vi.mock('../components/Container', () => ({
  Container: ({ header, children }: any) => (
    <div>
      {header}
      {children}
    </div>
  ),
}))
vi.mock('../components/Gutters', () => ({ Gutters: ({ children }: any) => <>{children}</> }))
vi.mock('../components/Notice', () => ({ Notice: ({ children }: any) => <div data-notice>{children}</div> }))
vi.mock('../components/Title', () => ({ Title: ({ children }: any) => <>{children}</> }))
vi.mock('../components/Body', () => ({ Body: ({ children }: any) => <div data-body>{children}</div> }))
vi.mock('../components/Icon', () => ({ Icon: () => null }))
vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (_key: string, text: any) => (typeof text === 'string' ? text : _key) }),
}))

import { DisabledDevicesPage } from './DisabledDevicesPage'
import { forgetAccountCaches } from '../services/accountCaches'
;(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true

const listed = (...ids: string[]) => ({
  data: { data: { login: { account: { devices: { total: ids.length, items: ids.map(id => ({ id, name: id })) } } } } },
})
const rows = (container: HTMLElement) =>
  [...container.querySelectorAll<HTMLInputElement>('[data-row] input')].map(input => [
    input.parentElement!.textContent,
    input.checked,
  ])

async function open() {
  const container = document.createElement('div')
  document.body.appendChild(container)
  await act(async () => createRoot(container).render(<DisabledDevicesPage />))
  return container
}
const tick = (container: HTMLElement, name: string) =>
  act(async () =>
    [...container.querySelectorAll<HTMLInputElement>('[data-row] input')]
      .find(input => input.parentElement!.textContent === name)!
      .click()
  )

beforeEach(() => fetchDisabled.mockReset())

describe('the disabled devices, read again as another sign-in', () => {
  it('keep what was ticked where it is still listed, and drop only what is not', async () => {
    fetchDisabled.mockResolvedValueOnce(listed('pi', 'nas', 'cam'))
    const container = await open()
    await tick(container, 'pi')
    await tick(container, 'cam')

    // The sign-in now serving the account manages two of them.
    fetchDisabled.mockResolvedValueOnce(listed('pi', 'nas'))
    await act(async () => forgetAccountCaches(['ACME']))
    expect(fetchDisabled).toHaveBeenCalledTimes(2)
    expect(rows(container)).toEqual([
      ['pi', true],
      ['nas', false],
    ])
  })

  it('show none of what was read before when they cannot be read', async () => {
    fetchDisabled.mockResolvedValueOnce(listed('pi', 'nas'))
    const container = await open()
    await tick(container, 'pi')

    fetchDisabled.mockResolvedValueOnce('ERROR')
    await act(async () => forgetAccountCaches(['ACME']))
    expect(rows(container)).toEqual([])
    expect(container.querySelector('[data-notice]')!.textContent).toBe('Disabled devices could not be read.')
  })
})
