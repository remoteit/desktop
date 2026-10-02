import { describe, it, expect, vi } from 'vitest'

vi.mock('../services/Controller', () => ({ emit: vi.fn() }))
vi.mock('@capacitor/status-bar', () => ({ StatusBar: {}, Style: {} }))
vi.mock('../styling/theme', () => ({ isDarkMode: vi.fn() }))
vi.mock('../i18n', () => ({ default: {}, resolveLanguage: vi.fn() }))
vi.mock('../constants', async () => ({
  SIDEBAR_WIDTH: 0,
  LEGACY_SHARED_GRAPHQL_RE: (await vi.importActual<typeof import('../constants')>('../constants')).LEGACY_SHARED_GRAPHQL_RE,
}))
vi.mock('../selectors/accounts', () => ({ selectActiveAccountId: vi.fn() }))
vi.mock('../services/browser', () => ({ default: {}, getLocalStorage: vi.fn(), setLocalStorage: vi.fn() }))

import uiModel from './ui'
import { getLocalStorage } from '../services/browser'

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

describe('ui — restoreState and saved API targets', () => {
  const restore = async (apis: Record<string, unknown>) => {
    vi.mocked(getLocalStorage).mockImplementation((_state: any, key: string) => (key === 'ui-apis' ? apis : null))
    const dispatch = { ui: { set: vi.fn(), setTheme: vi.fn(), setLanguage: vi.fn() } }
    await (uiModel as any).effects(dispatch).restoreState(undefined, { ui: { apis: {} } })
    return dispatch.ui.set.mock.calls[0][0].apis
  }

  it('turns off a saved override on the shared-domain API the new login cannot mint for', async () => {
    const apis = await restore({
      switchApi: true,
      apiGraphqlURL: 'https://api.remote.it/graphql/beta',
      webSocketURL: 'wss://ws.remote.it/beta',
      agentURL: 'https://agent.dev.remote.it',
    })
    expect(apis).toEqual({ switchApi: false, apiGraphqlURL: '', webSocketURL: '', agentURL: 'https://agent.dev.remote.it' })
  })

  it('keeps a saved override on the unified front', async () => {
    const saved = {
      switchApi: true,
      apiGraphqlURL: 'https://cloud.dev.remote.it/api/graphql',
      webSocketURL: 'wss://cloud.dev.remote.it/api/ws',
    }
    expect(await restore(saved)).toEqual(saved)
  })
})
