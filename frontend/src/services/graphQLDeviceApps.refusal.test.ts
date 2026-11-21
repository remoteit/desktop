import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

/* A many-device call graphql refuses as a whole, through the real request path (post, graphQLRequestWithReason): more
   than 500 devices (graphql resolvers/device-apps-resolver.ts devicesNamed, DEVICES_A_CALL_MAX) is the call's refusal,
   an INVALID_ARGUMENT whose extensions.message is "more than 500 devices: add it to a product" — not a
   DeviceAppChange of any device. */

const { uiSet, request } = vi.hoisted(() => ({ uiSet: vi.fn(), request: vi.fn() }))
vi.mock('../store', () => ({ store: { getState: () => ({ ui: {} }), dispatch: { ui: { set: uiSet } } } }))
vi.mock('./remoteit', () => ({ apiRequest: vi.fn((_method, _url, send) => send({ authorization: 'token' })) }))
vi.mock('../helpers/apiHelper', () => ({ getApiURL: () => 'https://api.test/graphql', getApiRestURL: () => 'https://api.test/graphql' }))
vi.mock('./Network', () => ({ default: { offline: vi.fn() } }))
vi.mock('axios', () => ({ default: { request } }))

import { graphQLAddDeviceApps, graphQLSetDeviceAppsRelease, refused } from './graphQLDeviceApps'

// graphql's answer, as its CustomError gives it: the code's text and the message in `message`, the message alone in
// extensions.
const TOO_MANY = {
  data: {
    data: null,
    errors: [
      {
        message: 'Invalid Arguments: more than 500 devices: add it to a product',
        extensions: { code: 'INVALID_ARGUMENT', args: ['deviceIds'], message: 'more than 500 devices: add it to a product' },
      },
    ],
  },
  headers: {},
}

beforeEach(() => {
  request.mockReset().mockResolvedValue(TOO_MANY)
  uiSet.mockReset()
  vi.spyOn(console, 'error').mockImplementation(() => {})
})
afterEach(() => vi.restoreAllMocks())

describe('more than 500 devices', () => {
  it('addDeviceApps (devices or a tag): the call refused, in graphql’s words — no per-device results, no snackbar', async () => {
    const ids = Array.from({ length: 501 }, (_, i) => `D${i}`)
    const answer = await graphQLAddDeviceApps('acme.backup', { deviceIds: ids })
    expect(refused(answer)).toBe(true)
    expect(answer).toEqual({ reason: 'More than 500 devices: add it to a product' })
    const tagged = await graphQLAddDeviceApps('acme.backup', { tags: { operator: 'ANY', values: ['office'] } })
    expect(tagged).toEqual({ reason: 'More than 500 devices: add it to a product' })
    expect(uiSet).not.toHaveBeenCalled()
  })

  it('setDeviceAppsRelease: the same', async () => {
    expect(await graphQLSetDeviceAppsRelease('acme.backup', ['D1'], { version: '' })).toEqual({
      reason: 'More than 500 devices: add it to a product',
    })
  })
})
