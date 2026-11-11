import { describe, it, expect, vi, beforeEach } from 'vitest'

const { post } = vi.hoisted(() => ({ post: vi.fn() }))
vi.mock('./post', () => ({ post }))

beforeEach(() => {
  vi.resetModules()
  post.mockReset()
})

describe('an exit’s devices counted, asked only where the API counts them', () => {
  it('the fields where Exit has serving; none where it does not', async () => {
    const { parseExitServing } = await import('./exitServing')
    expect(parseExitServing({ exit: { fields: [{ name: 'id' }, { name: 'serving' }] } })).toBe(
      'serving { devices carrying healthy draining }'
    )
    expect(parseExitServing({ exit: { fields: [{ name: 'id' }] } })).toBe('')
    expect(parseExitServing({ exit: null })).toBe('')
    expect(parseExitServing(undefined)).toBe('')
  })

  it('read once; asked again after a failed request', async () => {
    const { exitServingFields } = await import('./exitServing')
    post.mockResolvedValueOnce('ERROR')
    expect(await exitServingFields()).toBe('')
    post.mockResolvedValue({ data: { data: { exit: { fields: [{ name: 'serving' }] } } } })
    expect(await exitServingFields()).toBe('serving { devices carrying healthy draining }')
    expect(await exitServingFields()).toBe('serving { devices carrying healthy draining }')
    expect(post).toHaveBeenCalledTimes(2)
    expect(post.mock.calls[0][0].query).toContain('__type(name: "Exit")')
  })
})
