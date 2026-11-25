import { beforeEach, describe, expect, it, vi } from 'vitest'

const { post, signIns, said } = vi.hoisted(() => ({ post: vi.fn(), signIns: vi.fn(), said: vi.fn() }))
vi.mock('./post', () => ({ post }))
vi.mock('./oidc', () => ({ oidcSignIns: signIns }))
vi.mock('./graphQL', () => ({
  graphQLGetErrors: (response: any, silent: boolean) => {
    if (response.data?.errors && !silent) said(response.data.errors)
    return response.data?.errors
  },
}))

import { endpointTicket } from './endpointTicket'

const BACK = 'https://web-acme.solo.r3proxy.com/page'
const URL = `${BACK}?__r3_ticket=T`
const given = (url: unknown = URL) => ({ data: { data: { endpointTicket: url } } })
const refused = (code?: string) => ({ data: { errors: [{ message: 'no', extensions: code && { code } }] } })
const primary = { sub: 'me', primary: true }
const work = { sub: 'work', primary: false }
const third = { sub: 'third', primary: false }

// What each is answered, by the sign-in asked: '' the page's own person.
const answers = (by: Record<string, unknown>) => post.mockImplementation(async (...args: any[]) => by[args[4].sub])
const asked = () => post.mock.calls.map(args => args[4])

beforeEach(() => {
  post.mockReset()
  said.mockReset()
  signIns.mockReset().mockReturnValue([primary, work, third])
})

describe('a ticket for an endpoint', () => {
  it('is the page’s own person’s where they may use it, and no other is asked', async () => {
    answers({ '': given() })
    expect(await endpointTicket('EP-1', BACK)).toEqual({ url: URL })
    expect(asked()).toEqual([{ sub: '' }])
    expect(post.mock.calls[0][0].query).toContain('endpointTicket(')
    expect(post.mock.calls[0][0].variables).toEqual({ endpointId: 'EP-1', returnUrl: BACK })
  })

  it('is the first other’s who may: each asked in turn, and none after', async () => {
    answers({ '': refused('NO_ACCESS'), work: given() })
    expect(await endpointTicket('EP-1', BACK)).toEqual({ url: URL })
    expect(asked()).toEqual([{ sub: '' }, { sub: 'work' }])
    expect(said).not.toHaveBeenCalled()
    post.mockClear()
    answers({ '': refused('NO_ACCESS'), work: refused('NOT_AUTHORIZED'), third: given() })
    expect(await endpointTicket('EP-1', BACK)).toEqual({ url: URL })
    expect(asked()).toEqual([{ sub: '' }, { sub: 'work' }, { sub: 'third' }])
  })

  it('is refused where none may, each asked once, and said once', async () => {
    answers({ '': refused('NO_ACCESS'), work: refused('NO_ACCESS'), third: refused('NO_ACCESS') })
    expect(await endpointTicket('EP-1', BACK)).toBe('REFUSED')
    expect(asked()).toHaveLength(3)
    expect(said).toHaveBeenCalledOnce()
  })

  it.each([
    ['the network', 'ERROR'],
    ['the server', refused('INTERNAL')],
    ['an answer that says no code', refused()],
  ])('a failure of %s is no refusal: no other is asked', async (_what, failure) => {
    answers({ '': failure, work: given() })
    expect(await endpointTicket('EP-1', BACK)).toBe('FAILED')
    expect(asked()).toEqual([{ sub: '' }])
  })

  it('nor is one of a later sign-in: what is after it is not asked', async () => {
    answers({ '': refused('NO_ACCESS'), work: 'ERROR', third: given() })
    expect(await endpointTicket('EP-1', BACK)).toBe('FAILED')
    expect(asked()).toEqual([{ sub: '' }, { sub: 'work' }])
  })

  it('an endpoint that is gone, or an address not its own, is refused whoever asks', async () => {
    answers({ '': refused('INVALID_ARGUMENT'), work: given() })
    expect(await endpointTicket('EP-1', BACK)).toBe('GONE')
    expect(asked()).toEqual([{ sub: '' }])
  })

  it('with one sign-in is asked as it, and no one else', async () => {
    signIns.mockReturnValue([primary])
    answers({ '': refused('NO_ACCESS') })
    expect(await endpointTicket('EP-1', BACK)).toBe('REFUSED')
    expect(asked()).toEqual([{ sub: '' }])
    expect(said).toHaveBeenCalledOnce()
    answers({ '': given() })
    expect(await endpointTicket('EP-1', BACK)).toEqual({ url: URL })
  })

  it('is asked of a sign-in that came while the one before it was', async () => {
    signIns.mockReturnValueOnce([primary]).mockReturnValue([primary, work])
    answers({ '': refused('NO_ACCESS'), work: given() })
    expect(await endpointTicket('EP-1', BACK)).toEqual({ url: URL })
  })

  it.each(['javascript:alert(1)', 'http://web-acme.solo.r3proxy.com/', null, 7])(
    'goes back to no address but an https one: %j',
    async url => {
      answers({ '': given(url), work: given() })
      expect(await endpointTicket('EP-1', BACK)).toBe('FAILED')
      expect(asked()).toHaveLength(1)
    }
  )
})
