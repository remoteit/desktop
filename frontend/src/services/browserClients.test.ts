import { describe, it, expect, vi, beforeEach } from 'vitest'

const { request } = vi.hoisted(() => ({ request: vi.fn() }))
vi.mock('./graphQL', () => ({ graphQLBasicRequest: request }))

import { browserArg, browserFilterServed, resetBrowserFilter } from './browserClients'

beforeEach(() => {
  request.mockReset()
  resetBrowserFilter()
})

const devicesArgs = (args: string[]) => ({
  data: { data: { user: { fields: [{ name: 'id', args: [] }, { name: 'devices', args: args.map(name => ({ name })) }] } } },
})

describe('browserArg', () => {
  it('hidden by default, shown with the rest, or alone', () => {
    expect(browserArg(undefined)).toBe(false)
    expect(browserArg('hide')).toBe(false)
    expect(browserArg('show')).toBeUndefined()
    expect(browserArg('only')).toBe(true)
  })
})

describe('browserFilterServed', () => {
  it('only where the API’s device list takes browser, asked once', async () => {
    request.mockResolvedValue(devicesArgs(['size', 'platform', 'browser']))
    expect(await browserFilterServed()).toBe(true)
    expect(await browserFilterServed()).toBe(true)
    expect(request).toHaveBeenCalledTimes(1)
  })

  it('an API without it lists as before', async () => {
    request.mockResolvedValue(devicesArgs(['size', 'platform']))
    expect(await browserFilterServed()).toBe(false)
  })

  it('a failure is not kept: asked again next time', async () => {
    request.mockResolvedValueOnce('ERROR').mockResolvedValueOnce(devicesArgs(['browser']))
    expect(await browserFilterServed()).toBe(false)
    expect(await browserFilterServed()).toBe(true)
  })
})
