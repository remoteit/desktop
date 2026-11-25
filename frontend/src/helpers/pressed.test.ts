import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { whenReleased } from './pressed'

const fire = (event: Event) => window.dispatchEvent(event)
const key = (type: string, name: string) => fire(new KeyboardEvent(type, { key: name }))

beforeEach(() => void vi.useFakeTimers())
afterEach(() => {
  vi.advanceTimersByTime(10_000)
  vi.useRealTimers()
})

describe('what is shown, and a press', () => {
  it('changes at once with none under way', () => {
    const change = vi.fn()
    whenReleased(change)
    expect(change).toHaveBeenCalledOnce()
  })

  it('waits for the pointer’s release, and the click it makes, in the order it came', () => {
    const order: string[] = []
    fire(new Event('pointerdown'))
    whenReleased(() => order.push('first'))
    whenReleased(() => order.push('second'))
    fire(new Event('pointerup'))
    order.push('click')
    vi.advanceTimersByTime(1)
    expect(order).toEqual(['click', 'first', 'second'])
  })

  it.each(['Enter', ' '])('waits for the key that activates: %j', name => {
    const change = vi.fn()
    key('keydown', name)
    whenReleased(change)
    expect(change).not.toHaveBeenCalled()
    key('keyup', name)
    vi.advanceTimersByTime(1)
    expect(change).toHaveBeenCalledOnce()
  })

  it('does not wait for another key', () => {
    const change = vi.fn()
    key('keydown', 'a')
    whenReleased(change)
    expect(change).toHaveBeenCalledOnce()
  })

  it.each(['pointercancel', 'blur'])('is let go by %s', name => {
    const change = vi.fn()
    fire(new Event('pointerdown'))
    whenReleased(change)
    fire(new Event(name))
    vi.advanceTimersByTime(1)
    expect(change).toHaveBeenCalledOnce()
  })

  it('is not held for good by a release that never comes', () => {
    const change = vi.fn()
    fire(new Event('pointerdown'))
    whenReleased(change)
    vi.advanceTimersByTime(5_000)
    expect(change).toHaveBeenCalledOnce()
  })
})
