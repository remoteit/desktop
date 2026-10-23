import React, { act } from 'react'
import { createRoot, Root } from 'react-dom/client'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

const state = { auth: { user: { id: 'USER' } }, user: { notificationSettings: {} as INotificationSetting } }
const organizations = [
  { id: 'ORG-A', email: 'a@example.com', name: 'Org A' },
  { id: 'ORG-B', email: 'b@example.com', name: 'Org B' },
]
const muted = vi.fn()
const setOrganization = vi.fn()

vi.mock('react-redux', () => ({ useSelector: (select: (s: typeof state) => unknown) => select(state) }))
vi.mock('../../store', () => ({ store: { getState: () => state } }))
vi.mock('../../selectors/organizations', () => ({ selectOrganizationOptions: () => organizations }))
vi.mock('../../components/Avatar', () => ({ Avatar: () => null }))
vi.mock('../../services/graphQLRequest', () => ({ graphQLMutedOrganizations: () => muted() }))
vi.mock('../../services/graphQLMutation', () => ({
  graphQLSetOrganizationNotifications: (...args: unknown[]) => setOrganization(...args),
}))
vi.mock('../../components/ListItemSetting', () => ({
  ListItemSetting: ({
    label,
    toggle,
    disabled,
    onClick,
  }: {
    label: string
    toggle: boolean
    disabled?: boolean
    onClick: () => void
  }) => (
    <button
      type="button"
      data-label={label}
      data-on={String(toggle)}
      data-disabled={String(!!disabled)}
      onClick={onClick}
    />
  ),
}))

Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true })

const mutedResponse = (list: string[]) => ({
  data: { data: { login: { notificationSettings: { mutedOrganizations: list } } } },
})

const deferred = <T,>() => {
  let resolve: (value: T) => void = () => {}
  const promise = new Promise<T>(r => (resolve = r))
  return { promise, resolve }
}

describe('OrganizationNotifications', () => {
  let root: Root
  let container: HTMLDivElement
  // The write queue lives at module level: a fresh import per test keeps one test's queue out of the next.
  let OrganizationNotifications: React.FC
  const button = (label = 'Org A') => container.querySelector<HTMLButtonElement>(`button[data-label="${label}"]`)

  const render = async () => {
    await act(async () => root.render(<OrganizationNotifications />))
  }

  beforeEach(async () => {
    vi.resetModules()
    ;({ OrganizationNotifications } = await import('./OrganizationNotifications'))
    container = document.createElement('div')
    document.body.appendChild(container)
    root = createRoot(container)
    muted.mockReset()
    setOrganization.mockReset()
    state.user.notificationSettings = {}
  })

  afterEach(() => {
    act(() => root.unmount())
    container.remove()
  })

  it('renders nothing when the API does not know the field yet', async () => {
    muted.mockResolvedValue('ERROR')
    await render()
    expect(container.innerHTML).toBe('')
  })

  it('shows each organization on unless it is muted', async () => {
    muted.mockResolvedValue(mutedResponse(['ORG-A']))
    await render()
    expect(button()?.dataset.on).toBe('false')
    expect(button('Org B')?.dataset.on).toBe('true')
  })

  it('matches muted organizations whatever the case of their ID', async () => {
    muted.mockResolvedValue(mutedResponse(['org-a']))
    await render()
    expect(button()?.dataset.on).toBe('false')
  })

  it('disables the switches while mobile push is off', async () => {
    state.user.notificationSettings = { pushNotifications: false }
    muted.mockResolvedValue(mutedResponse([]))
    await render()
    expect(button()?.dataset.disabled).toBe('true')
  })

  it('turning one off sends enabled false and keeps it off', async () => {
    muted.mockResolvedValue(mutedResponse([]))
    setOrganization.mockResolvedValue({})
    await render()
    await act(async () => button()?.click())
    expect(setOrganization).toHaveBeenCalledWith('ORG-A', false)
    expect(button()?.dataset.on).toBe('false')
    expect(muted).toHaveBeenCalledTimes(1)
  })

  it('a failed write reloads the list from the API', async () => {
    muted.mockResolvedValue(mutedResponse([]))
    setOrganization.mockResolvedValue('ERROR')
    await render()
    await act(async () => button()?.click())
    expect(muted).toHaveBeenCalledTimes(2)
    expect(button()?.dataset.on).toBe('true')
  })

  it('a failed write whose reload also fails keeps the section', async () => {
    muted.mockResolvedValueOnce(mutedResponse([])).mockResolvedValue('ERROR')
    setOrganization.mockResolvedValue('ERROR')
    await render()
    await act(async () => button()?.click())
    expect(muted).toHaveBeenCalledTimes(2)
    expect(button()).not.toBeNull()
  })

  it('reloads after a failed write only once the writes queued behind it have landed', async () => {
    const first = deferred<unknown>()
    const second = deferred<unknown>()
    muted.mockResolvedValueOnce(mutedResponse([])).mockResolvedValue(mutedResponse(['ORG-B']))
    setOrganization.mockReturnValueOnce(first.promise).mockReturnValueOnce(second.promise)
    await render()

    await act(async () => button()?.click())
    await act(async () => button('Org B')?.click())
    await act(async () => first.resolve('ERROR'))
    expect(muted).toHaveBeenCalledTimes(1)

    await act(async () => second.resolve({}))
    expect(muted).toHaveBeenCalledTimes(2)
    expect(button()?.dataset.on).toBe('true')
    expect(button('Org B')?.dataset.on).toBe('false')
  })
})
