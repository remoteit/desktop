import { describe, it, expect, vi } from 'vitest'

vi.mock('../services/Controller', () => ({ emit: vi.fn() }))
vi.mock('@capacitor/status-bar', () => ({ StatusBar: {}, Style: {} }))
vi.mock('../styling/theme', () => ({ isDarkMode: vi.fn() }))
vi.mock('../i18n', () => ({ default: {}, resolveLanguage: vi.fn() }))
vi.mock('../constants', () => ({ SIDEBAR_WIDTH: 0 }))
vi.mock('../selectors/accounts', () => ({ selectActiveAccountId: vi.fn() }))
vi.mock('../services/browser', () => ({ default: {}, getLocalStorage: vi.fn(), setLocalStorage: vi.fn() }))

import uiModel from './ui'

describe('ui — clearAutoLaunch', () => {
  const run = (pending: string | undefined, connectionId: string) => {
    const dispatch = { ui: { set: vi.fn() } }
    ;(uiModel as any).effects(dispatch).clearAutoLaunch(connectionId, { ui: { autoLaunch: pending } })
    return dispatch.ui.set
  }

  it('clears the pending launch for that connection', () => {
    expect(run('service-1', 'service-1')).toHaveBeenCalledWith({ autoLaunch: undefined })
  })

  it("leaves another connection's pending launch alone", () => {
    expect(run('service-2', 'service-1')).not.toHaveBeenCalled()
  })
})
