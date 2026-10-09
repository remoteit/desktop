import { describe, it, expect, vi, beforeEach } from 'vitest'

const { request, refresh, again } = vi.hoisted(() => ({
  request: vi.fn().mockResolvedValue({ data: { data: { setAccountSlug: 'acme-robotics' } } }),
  refresh: vi.fn(),
  again: vi.fn(),
}))
vi.mock('./post', () => ({ post: vi.fn() }))
vi.mock('./graphQL', () => ({ graphQLBasicRequest: request, graphQLGetErrors: vi.fn() }))
vi.mock('./graphQLDaemon', () => ({ UNSUPPORTED: 'UNSUPPORTED', withoutDeviceSessions: () => false }))
vi.mock('./deviceSessionInfo', () => ({ refreshDeviceSessionInfo: refresh, requestDeviceSessionInfo: again }))

import {
  setAccountSlug,
  setDeviceSubnetLabel,
  splitSubnetName,
  subnetLabel,
  validLabel,
  validSlug,
} from './subnetNames'

beforeEach(() => {
  request.mockClear()
  refresh.mockClear()
  again.mockClear()
})

// The same rules as graphql's (services/subnet-names.ts), so the portal says what graphql would refuse as it is typed.
describe('subnet name rules', () => {
  it("makes a device's name as graphql does: lower case letters and digits, at most 29", () => {
    expect(subnetLabel('Kitchen Pi!')).toBe('kitchenpi')
    expect(subnetLabel('web-1')).toBe('web1')
    expect(subnetLabel('x'.repeat(40))).toHaveLength(29)
  })

  it('a name has no dashes and at most 29 characters; graphql lower-cases what it is given', () => {
    expect(validLabel('kitchenpi')).toBe(true)
    expect(validLabel(' Kitchen2 ')).toBe(true)
    for (const bad of ['', 'kitchen-pi', 'kitchen pi', 'x'.repeat(30)]) expect(validLabel(bad)).toBe(false)
  })

  it('a slug is 3 to 32 letters, digits and single hyphens, not starting or ending with one', () => {
    expect(validSlug('acme')).toBe(true)
    expect(validSlug('acme-robotics-2')).toBe(true)
    for (const bad of ['ab', '-acme', 'acme-', 'ac--me', 'a'.repeat(33), 'acme.io']) expect(validSlug(bad)).toBe(false)
  })

  it('reads a full name back into the name and the rest: the first dash ends the name', () => {
    expect(splitSubnetName('kitchenpi-acme-corp.on.remote.it')).toEqual({
      label: 'kitchenpi',
      rest: '-acme-corp.on.remote.it',
    })
  })
})

describe('changing names', () => {
  it("names a device, lower-cased, and reads the device's name anew", async () => {
    await setDeviceSubnetLabel('D', ' Garage ')
    expect(request.mock.calls[0][1]).toEqual({ deviceId: 'D', label: 'garage' })
    expect(again).toHaveBeenCalledWith('D', true)
  })

  it("choosing the account's slug reads every device's name anew — and nothing when refused", async () => {
    expect(await setAccountSlug('Acme-Robotics', 'ORG')).toBe('acme-robotics')
    expect(request.mock.calls[0][1]).toEqual({ slug: 'acme-robotics', accountId: 'ORG' })
    expect(refresh).toHaveBeenCalledTimes(1)

    request.mockResolvedValueOnce('ERROR')
    expect(await setAccountSlug('taken')).toBeUndefined()
    expect(refresh).toHaveBeenCalledTimes(1)
  })
})
