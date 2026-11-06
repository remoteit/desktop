import { describe, it, expect, vi } from 'vitest'
import { rememberPictures, userPicture, userPicturesSubscribe } from './userPictures'

describe('userPictures', () => {
  it('remembers each user found anywhere in a response, by email whatever its case', () => {
    rememberPictures({
      login: {
        account: { devices: { items: [{ owner: { id: 'u1', email: ' Ada@X.test ', picture: 'https://a/1' } }] } },
      },
    })
    expect(userPicture('ada@x.test')).toBe('https://a/1')
  })

  it('forgets a picture graphql now answers as none', () => {
    rememberPictures({ email: 'lin@x.test', picture: 'https://a/2' })
    rememberPictures({ email: 'lin@x.test', picture: null })
    expect(userPicture('lin@x.test')).toBeUndefined()
  })

  it('never remembers a picture that is not https', () => {
    rememberPictures({ email: 'eve@x.test', picture: 'http://a/6' })
    expect(userPicture('eve@x.test')).toBeUndefined()
  })

  it('keeps a picture an error nulled, forgetting one answered as none beside it', () => {
    const members = (zed: string | null, amy: string | null) => ({
      login: {
        _0: [{ user: { email: 'zed@x.test', picture: zed } }],
        _1: [{ user: { email: 'amy@x.test', picture: amy } }],
      },
    })
    rememberPictures(members('https://a/7', 'https://a/8'))
    rememberPictures(members(null, null), [{ path: ['login', '_0', 0, 'user', 'picture'] }])
    expect(userPicture('zed@x.test')).toBe('https://a/7')
    expect(userPicture('amy@x.test')).toBeUndefined()
  })

  it('forgets nothing on an error that names no path, and survives errors that are null', () => {
    rememberPictures({ email: 'liv@x.test', picture: 'https://a/9' })
    rememberPictures({ email: 'liv@x.test', picture: null }, [{}])
    expect(userPicture('liv@x.test')).toBe('https://a/9')
    expect(() => rememberPictures({ email: 'liv@x.test', picture: null }, null)).not.toThrow()
    expect(() => rememberPictures({ email: 'liv@x.test', picture: null }, [null])).not.toThrow()
  })

  it('keeps a picture when a response carries the email without asking for the picture', () => {
    rememberPictures({ email: 'kay@x.test', picture: 'https://a/3' })
    rememberPictures({ email: 'kay@x.test' })
    expect(userPicture('kay@x.test')).toBe('https://a/3')
  })

  it('tells listeners only when a picture changed', () => {
    const listener = vi.fn()
    const unsubscribe = userPicturesSubscribe(listener)
    rememberPictures({ email: 'max@x.test', picture: 'https://a/4' })
    rememberPictures({ email: 'max@x.test', picture: 'https://a/4' })
    rememberPictures({ email: 'nobody@x.test', picture: null })
    expect(listener).toHaveBeenCalledTimes(1)
    unsubscribe()
    rememberPictures({ email: 'max@x.test', picture: 'https://a/5' })
    expect(listener).toHaveBeenCalledTimes(1)
  })
})
