import { describe, it, expect, vi, beforeEach } from 'vitest'

const { graphQLNotificationSettings, state } = vi.hoisted(() => ({
  graphQLNotificationSettings: vi.fn(),
  state: { auth: { user: { id: 'user-1' } as { id: string } | undefined } },
}))

vi.mock('../services/graphQLMutation', () => ({ graphQLNotificationSettings }))
vi.mock('../services/graphQLRequest', () => ({}))
vi.mock('../services/remoteit', () => ({}))
vi.mock('../constants', () => ({}))
vi.mock('../i18n', () => ({ default: { t: (k: string) => k } }))
vi.mock('../store', () => ({ store: { getState: () => state } }))
vi.mock('axios', () => ({ default: {} }))

import userModel from './user'

const deferred = () => {
  let resolve: (value: unknown) => void = () => {}
  const promise = new Promise(r => (resolve = r))
  return { promise, resolve }
}

let dispatch: { user: { set: ReturnType<typeof vi.fn>; fetch: ReturnType<typeof vi.fn> } }
const effects = () => (userModel as any).effects(dispatch)

beforeEach(() => {
  vi.resetAllMocks()
  state.auth.user = { id: 'user-1' }
  dispatch = { user: { set: vi.fn(), fetch: vi.fn() } }
  graphQLNotificationSettings.mockResolvedValue({ data: {} })
})

describe('updateNotificationSettings', () => {
  it('stores the switch before the request, so a second switch builds on it', async () => {
    const pending = deferred()
    graphQLNotificationSettings.mockReturnValueOnce(pending.promise)
    const done = effects().updateNotificationSettings({ pushCategories: ['state'] })
    expect(dispatch.user.set).toHaveBeenCalledWith({ notificationSettings: { pushCategories: ['state'] } })

    pending.resolve({ data: {} })
    await done
  })

  it('sends writes one at a time, in the order they were made', async () => {
    const first = deferred()
    graphQLNotificationSettings.mockReturnValueOnce(first.promise)
    const a = effects().updateNotificationSettings({ pushCategories: ['state'] })
    const b = effects().updateNotificationSettings({ pushCategories: [] })
    await Promise.resolve()
    expect(graphQLNotificationSettings).toHaveBeenCalledTimes(1)

    first.resolve({ data: {} })
    await Promise.all([a, b])
    expect(graphQLNotificationSettings.mock.calls.map(([metadata]) => metadata)).toEqual([
      { pushCategories: ['state'] },
      { pushCategories: [] },
    ])
    expect(dispatch.user.fetch).not.toHaveBeenCalled()
  })

  it('re-fetches after a failed write, behind the writes already queued', async () => {
    const first = deferred()
    graphQLNotificationSettings.mockReturnValueOnce(first.promise)
    const a = effects().updateNotificationSettings({ pushCategories: ['state'] })
    const b = effects().updateNotificationSettings({ pushCategories: [] })

    first.resolve('ERROR')
    await Promise.all([a, b])
    await vi.waitFor(() => expect(dispatch.user.fetch).toHaveBeenCalledTimes(1))
    expect(dispatch.user.fetch.mock.invocationCallOrder[0]).toBeGreaterThan(
      graphQLNotificationSettings.mock.invocationCallOrder[1]
    )
  })

  it('drops a queued write once the signed-in account changed', async () => {
    const first = deferred()
    graphQLNotificationSettings.mockReturnValueOnce(first.promise)
    const a = effects().updateNotificationSettings({ pushCategories: ['state'] })
    await vi.waitFor(() => expect(graphQLNotificationSettings).toHaveBeenCalledTimes(1))
    const b = effects().updateNotificationSettings({ pushCategories: [] })
    state.auth.user = { id: 'user-2' }

    first.resolve({ data: {} })
    await Promise.all([a, b])
    expect(graphQLNotificationSettings).toHaveBeenCalledTimes(1)
  })
})
