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
import { graphQLDetectedSchemes, redirectLoops } from './graphQLDetectedScheme'

beforeEach(() => {
  request.mockReset()
  vi.spyOn(console, 'error').mockImplementation(() => {})
})

describe('graphQLDetectedSchemes', () => {
  it('reads each service’s detected scheme, by service id', async () => {
    const detectedScheme = {
      set: 'http',
      serves: 'https',
      port: 443,
      detected: '2026-10-08T00:00:00Z',
      redirect: 'passed',
    }
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
    expect(request.mock.calls[0][0].data.query).toMatch(/detectedScheme \{ set serves port detected redirect \}/)
    expect(request.mock.calls[0][0].data.variables).toEqual({ id: ['D'] })
  })

  it('asks again without redirect where the API has no redirect yet, and leaves it out from then on', async () => {
    const detectedScheme = { set: 'http', serves: 'https', port: 443, detected: null }
    const answer = { data: { data: { login: { device: [{ id: 'D', services: [{ id: 'S', detectedScheme }] }] } } } }
    request
      .mockResolvedValueOnce({
        data: { errors: [{ message: 'Cannot query field "redirect" on type "ServiceDetectedScheme".' }] },
      })
      .mockResolvedValue(answer)
    expect(await graphQLDetectedSchemes('D')).toEqual({ S: detectedScheme })
    expect(await graphQLDetectedSchemes('D')).toEqual({ S: detectedScheme })
    expect(request).toHaveBeenCalledTimes(3)
    expect(request.mock.calls[1][0].data.query).toMatch(/detectedScheme \{ set serves port detected \}/)
    expect(request.mock.calls[2][0].data.query).not.toMatch(/redirect/)
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

describe('redirectLoops', () => {
  const http = { typeID: 7, port: 80 }
  const passed = { set: 'http', serves: 'https', port: 443, detected: null, redirect: 'passed' as const }

  it('loops when the device passed the redirect back to the browser, while the type is still plain HTTP', () => {
    expect(redirectLoops(passed, http)).toBe(true)
  })

  it('does not once the service is HTTPS on the port it redirects to', () => {
    expect(redirectLoops(passed, { typeID: 8, port: 443 })).toBe(false)
    expect(redirectLoops(passed, { typeID: 8, port: 8443 })).toBe(true)
  })

  it('does not when the device follows the redirect, found it otherwise, or found nothing', () => {
    expect(redirectLoops({ ...passed, redirect: 'followed' }, http)).toBe(false)
    expect(redirectLoops({ ...passed, redirect: null }, http)).toBe(false)
    expect(redirectLoops({ ...passed, redirect: undefined }, http)).toBe(false)
    expect(redirectLoops(null, http)).toBe(false)
    expect(redirectLoops(passed, undefined)).toBe(false)
  })
})
