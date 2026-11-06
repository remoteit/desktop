import { describe, it, expect } from 'vitest'
import { inOrder } from './inOrder'

const deferred = <T>() => {
  let resolve: (value: T) => void = () => {}
  const promise = new Promise<T>(r => (resolve = r))
  return { promise, resolve }
}

describe('inOrder', () => {
  it('runs each task only after the one before it settles', async () => {
    const run = inOrder()
    const first = deferred<string>()
    const order: string[] = []
    const a = run(async () => order.push('a start') && first.promise)
    const b = run(async () => order.push('b'))
    await Promise.resolve()
    expect(order).toEqual(['a start'])

    first.resolve('a')
    await Promise.all([a, b])
    expect(order).toEqual(['a start', 'b'])
  })

  it('keeps going after a task fails', async () => {
    const run = inOrder()
    const failed = run(async () => {
      throw new Error('boom')
    })
    await expect(failed).rejects.toThrow('boom')
    await expect(run(async () => 'next')).resolves.toBe('next')
  })

  it('drops a task whose key changed before it ran', async () => {
    let account = 'a'
    const run = inOrder(() => account)
    const gate = deferred<void>()
    const ran: string[] = []
    run(() => gate.promise)
    const queued = run(async () => ran.push('a write'))
    account = 'b'
    gate.resolve()

    await expect(queued).resolves.toBeUndefined()
    expect(ran).toEqual([])
  })
})
