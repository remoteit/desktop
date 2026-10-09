import { describe, it, expect, vi, beforeEach } from 'vitest'

const { request } = vi.hoisted(() => ({ request: vi.fn() }))
vi.mock('../store', () => ({
  store: { getState: () => ({ ui: {} }), dispatch: { ui: { set: vi.fn(), deprecated: vi.fn() } } },
}))
vi.mock('./remoteit', () => ({ apiHeaders: vi.fn().mockResolvedValue({ authorization: 'token' }) }))
vi.mock('../helpers/apiHelper', () => ({ getApiURL: () => 'https://api.test/graphql' }))
vi.mock('./Network', () => ({ default: { offline: vi.fn() } }))
vi.mock('axios', () => ({ default: { request } }))

import { UNSUPPORTED } from './graphQLDaemon'
import { graphQLDetectedSchemes } from './graphQLDetectedScheme'

beforeEach(() => {
  request.mockReset()
  vi.spyOn(console, 'error').mockImplementation(() => {})
})

describe('graphQLDetectedSchemes', () => {
  it('reads each service’s detected scheme, by service id', async () => {
    const detectedScheme = { set: 'http', serves: 'https', port: 443, detected: '2026-10-08T00:00:00Z' }
    request.mockResolvedValue({
      data: {
        data: {
          login: {
            device: [
              {
                id: 'D',
                services: [
                  { id: 'S', detectedScheme },
                  { id: 'T', detectedScheme: null },
                ],
              },
            ],
          },
        },
      },
    })
    expect(await graphQLDetectedSchemes('D')).toEqual({ S: detectedScheme, T: null })
    expect(request.mock.calls[0][0].data.query).toMatch(/detectedScheme \{ set serves port detected \}/)
    expect(request.mock.calls[0][0].data.variables).toEqual({ id: ['D'] })
  })

  it('answers UNSUPPORTED where the API has no detectedScheme, and does not ask again', async () => {
    request.mockResolvedValue({
      data: { errors: [{ message: 'Cannot query field "detectedScheme" on type "Service".' }] },
    })
    expect(await graphQLDetectedSchemes('D')).toBe(UNSUPPORTED)
    expect(await graphQLDetectedSchemes('D')).toBe(UNSUPPORTED)
    expect(request).toHaveBeenCalledTimes(1)
  })
})
