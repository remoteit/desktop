import { describe, it, expect, vi } from 'vitest'

vi.mock('../constants', () => ({ AIRBRAKE_ID: 1, AIRBRAKE_KEY: 'key' }))
vi.mock('../helpers/versionHelper', () => ({ version: 'test' }))
vi.mock('../services/browser', () => ({ default: { environment: () => 'test' } }))

import { redactOAuthParams } from './ErrorBoundary'

describe('redactOAuthParams', () => {
  it("strips a sign-in callback's code and state from the reported URL and navigation history", () => {
    const shared = { type: 'location', from: '/?code=abc123&state=xyz&next=1', to: '/' }
    const notice = redactOAuthParams({
      errors: [],
      context: {
        url: 'http://127.0.0.1:29999/?state=xyz&code=abc123#/devices',
        history: [shared, { type: 'xhr', method: 'POST', url: 'https://login.remote.it/token', statusCode: 200 }],
      },
    })

    expect(notice.context.url).toBe('http://127.0.0.1:29999/?state=[redacted]&code=[redacted]#/devices')
    expect(notice.context.history[0]).toEqual({
      type: 'location',
      from: '/?code=[redacted]&state=[redacted]&next=1',
      to: '/',
    })
    expect(notice.context.history[1].statusCode).toBe(200)
    expect(shared.from).toBe('/?code=abc123&state=xyz&next=1')
  })
})
