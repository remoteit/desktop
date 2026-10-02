import { describe, it, expect, vi, beforeAll, afterAll, afterEach } from 'vitest'

const PINNING = [
  'VITE_OAUTH_ISSUER',
  'VITE_OAUTH_GRAPHQL_RESOURCE',
  'VITE_OAUTH_AGENT_RESOURCE',
  'VITE_OAUTH_MCP_RESOURCE',
  'VITE_GRAPHQL_API',
  'VITE_WEBSOCKET_URL',
  'VITE_AGENT_URL',
]

describe('stageHelper', () => {
  let helper: typeof import('./stageHelper')
  let constants: typeof import('../constants')
  let other: 'prod' | 'dev'

  beforeAll(async () => {
    PINNING.forEach(name => vi.stubEnv(name, ''))
    vi.resetModules()
    helper = await import('./stageHelper')
    constants = await import('../constants')
    other = constants.DEFAULT_STAGE === 'prod' ? 'dev' : 'prod'
  })
  afterAll(() => vi.unstubAllEnvs())
  afterEach(() => window.localStorage.clear())

  it('stores only a choice that differs from the default', () => {
    helper.chooseStage(other)
    expect(window.localStorage.getItem('r3.stage')).toBe(other)
    helper.chooseStage(constants.DEFAULT_STAGE)
    expect(window.localStorage.getItem('r3.stage')).toBeNull()
  })

  it('reloads only when the chosen stage differs from the running one', () => {
    expect(constants.STAGE).toBe(constants.DEFAULT_STAGE)
    const reload = vi.fn()
    helper.reloadIfStageChanged(reload)
    expect(reload).not.toHaveBeenCalled()
    helper.chooseStage(other)
    helper.reloadIfStageChanged(reload)
    expect(reload).toHaveBeenCalledTimes(1)
  })
})
