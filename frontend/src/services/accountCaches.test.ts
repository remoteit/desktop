import { describe, it, expect, vi } from 'vitest'
import { forgetAccountCaches, sharedRead } from './accountCaches'

/* A device's apps are read once for every part of a page that asks in the same moment (hooks/useDeviceApps). When
   another sign-in comes to serve the account while that read is out, whoever asks next must not be handed it: it was
   asked as the sign-in before, and answers nothing they may use. */
describe('a read shared by everyone who asks in the same moment', () => {
  it('is one read for them all, and another once it has answered', async () => {
    const answers: ((value: string) => void)[] = []
    const read = vi.fn(
      (key: string) => new Promise<string>(resolve => answers.push(value => resolve(`${key}:${value}`)))
    )
    const shared = sharedRead(read)
    const [first, second] = [shared('device'), shared('device')]
    expect(read).toHaveBeenCalledTimes(1)
    answers[0]('apps')
    expect(await first).toBe('device:apps')
    expect(await second).toBe('device:apps')
    shared('device')
    expect(read).toHaveBeenCalledTimes(2)
  })

  it('is not the one still out from before accounts’ data was dropped: that was asked as the sign-in before', async () => {
    const answers: ((value: string) => void)[] = []
    const read = vi.fn(() => new Promise<string>(resolve => answers.push(resolve)))
    const shared = sharedRead(read)
    const before = shared('device')
    forgetAccountCaches(['account'])
    const after = shared('device')
    expect(read).toHaveBeenCalledTimes(2)
    // The old one answering does not take the new one's place: the next to ask shares the new.
    answers[0]('as the sign-in before')
    await before
    expect(shared('device')).toBe(after)
    expect(read).toHaveBeenCalledTimes(2)
    answers[1]('as the sign-in now')
    expect(await after).toBe('as the sign-in now')
  })
})
