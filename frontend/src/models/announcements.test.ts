import { describe, it, expect, vi, beforeEach } from 'vitest'

const { graphQLBasicRequest, storeState } = vi.hoisted(() => ({
  graphQLBasicRequest: vi.fn(),
  storeState: { auth: { user: { id: 'USER-A' } as { id: string } | undefined } },
}))
vi.mock('../services/graphQL', () => ({ graphQLBasicRequest }))
vi.mock('../services/graphQLMutation', () => ({ graphQLReadNotice: vi.fn() }))
vi.mock('../store', () => ({ store: { getState: () => storeState } }))

import announcements from './announcements'

const response = { data: { data: { notices: [] } } }
const signedInAs = (id: string) => ({ auth: { user: { id } } })

let dispatch: {
  announcements: { parse: ReturnType<typeof vi.fn>; set: ReturnType<typeof vi.fn> }
  ui: { set: ReturnType<typeof vi.fn> }
}
const effects = () => (announcements as any).effects(dispatch)

beforeEach(() => {
  vi.resetAllMocks()
  graphQLBasicRequest.mockResolvedValue(response)
  dispatch = { announcements: { parse: vi.fn().mockResolvedValue([]), set: vi.fn() }, ui: { set: vi.fn() } }
  storeState.auth.user = { id: 'USER-A' }
})

describe('announcements.fetch', () => {
  it('stores the list and marks this session fetched', async () => {
    await effects().fetch(undefined, signedInAs('USER-A'))
    expect(dispatch.announcements.set).toHaveBeenCalledWith({ all: [] })
    expect(dispatch.ui.set).toHaveBeenCalledWith({ announcementsFetched: true })
  })

  it('drops a response that lands after the requesting account signed out', async () => {
    graphQLBasicRequest.mockImplementation(async () => {
      storeState.auth.user = undefined
      return response
    })
    await effects().fetch(undefined, signedInAs('USER-A'))
    expect(dispatch.announcements.set).not.toHaveBeenCalled()
    expect(dispatch.ui.set).not.toHaveBeenCalled()
  })
})
