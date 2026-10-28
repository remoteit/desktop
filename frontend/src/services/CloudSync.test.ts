import { describe, it, expect, vi } from 'vitest'

const { dispatch } = vi.hoisted(() => ({ dispatch: { ui: { set: vi.fn() } } }))

vi.mock('./Network', () => ({ default: { on: vi.fn(), off: vi.fn() } }))
vi.mock('../store', () => ({ store: { getState: vi.fn() }, dispatch }))
vi.mock('../selectors/devices', () => ({ selectDeviceModelAttributes: vi.fn() }))

import cloudSync from './CloudSync'

describe('CloudSync.call', () => {
  it.each([true, false])('runs every fetch and clears the spinner when one throws (parallel: %s)', async parallel => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    const after = vi.fn()

    await cloudSync.call([() => Promise.reject(new Error('sessions')), after], parallel)

    expect(after).toHaveBeenCalled()
    expect(dispatch.ui.set).toHaveBeenLastCalledWith({ fetching: false })
  })
})
