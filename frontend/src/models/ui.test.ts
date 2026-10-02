import { describe, it, expect, vi } from 'vitest'

vi.mock('../services/Controller', () => ({ emit: vi.fn() }))
vi.mock('@capacitor/status-bar', () => ({ StatusBar: {}, Style: {} }))
vi.mock('../styling/theme', () => ({ isDarkMode: vi.fn() }))
vi.mock('../i18n', () => ({ default: {}, resolveLanguage: vi.fn() }))
vi.mock('../constants', () => ({ SIDEBAR_WIDTH: 0, OAUTH_ISSUER: 'https://login.remote.it' }))
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

  const cleared = {
    issuer: 'https://login.remote.it',
    switchApi: false,
    customTarget: false,
    apiGraphqlURL: '',
    webSocketURL: '',
    agentURL: '',
  }

  it('clears overrides saved before they carried a login server, the shared-domain API included', async () => {
    for (const saved of [
      {
        switchApi: true,
        apiGraphqlURL: 'https://api.remote.it/graphql/beta',
        webSocketURL: 'wss://ws.remote.it/beta',
        agentURL: 'https://agent.dev.remote.it',
      },
      {
        switchApi: true,
        apiGraphqlURL: 'https://cloud.dev.remote.it/api/graphql',
        webSocketURL: 'wss://cloud.dev.remote.it/api/ws',
      },
    ])
      expect(await restore(saved)).toEqual(cleared)
  })

  it('drops overrides chosen under another login server, whichever account restores them', async () => {
    const apis = await restore({
      issuer: 'https://login.dev.remote.it',
      switchApi: true,
      customTarget: true,
      apiGraphqlURL: 'https://cloud.evan.remote.it/api/graphql',
      webSocketURL: 'wss://cloud.evan.remote.it/api/ws',
      agentURL: 'https://agent.evan.remote.it',
    })
    expect(apis).toEqual(cleared)
  })

  it('keeps overrides chosen under the running login server', async () => {
    const saved = {
      issuer: 'https://login.remote.it',
      switchApi: true,
      customTarget: true,
      apiGraphqlURL: 'https://cloud.dev.remote.it/api/graphql',
      agentURL: 'https://agent.example.test',
    }
    expect(await restore(saved)).toEqual(saved)
  })

  it('leaves settings with nothing chosen alone', async () => {
    expect(await restore({ switchApi: false, apiGraphqlURL: '' })).toEqual({ switchApi: false, apiGraphqlURL: '' })
  })
})
