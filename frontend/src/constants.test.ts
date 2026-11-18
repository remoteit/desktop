import { describe, it, expect, vi, afterEach } from 'vitest'

// constants.ts reads import.meta.env at module evaluation, so each case stubs the env it depends
// on and re-imports a fresh copy.
const load = async (env: Record<string, string | boolean>) => {
  vi.resetModules()
  Object.entries(env).forEach(([key, value]) => vi.stubEnv(key, value as string))
  return await import('./constants')
}

afterEach(() => vi.unstubAllEnvs())

/* The socket fallback must pair with the EFFECTIVE graphql URL. Pairing it with the OAuth
   resource split API and event traffic across stages whenever VITE_GRAPHQL_API pointed at a
   legacy stage while the resource stayed a cloud tree. */
describe('constants — WEBSOCKET_URL fallback pairs with the effective GraphQL URL', () => {
  it("a cloud-tree resource with no overrides → the tree's own graphql and /ws", async () => {
    const c = await load({
      VITE_OAUTH_GRAPHQL_RESOURCE: 'https://cloud.dev.remote.it/api',
      VITE_GRAPHQL_API: '',
      VITE_WEBSOCKET_URL: '',
    })
    expect(c.GRAPHQL_API).toBe('https://cloud.dev.remote.it/api/graphql')
    expect(c.WEBSOCKET_URL).toBe('wss://cloud.dev.remote.it/api/ws')
  })

  it("a legacy-stage VITE_GRAPHQL_API beside a cloud resource → that stage's socket, not the tree's", async () => {
    const c = await load({
      VITE_OAUTH_GRAPHQL_RESOURCE: 'https://cloud.remote.it/api',
      VITE_GRAPHQL_API: 'https://graphql.dev.remote.it/graphql',
      VITE_WEBSOCKET_URL: '',
    })
    expect(c.GRAPHQL_API).toBe('https://graphql.dev.remote.it/graphql')
    expect(c.WEBSOCKET_URL).toBe('wss://ws.dev.remote.it/v1')
  })

  it("a cloud-tree VITE_GRAPHQL_API beside a legacy resource → that tree's /ws", async () => {
    const c = await load({
      VITE_OAUTH_GRAPHQL_RESOURCE: 'https://graphql.remote.it/graphql',
      VITE_GRAPHQL_API: 'https://cloud.dev.remote.it/api/graphql',
      VITE_WEBSOCKET_URL: '',
    })
    expect(c.WEBSOCKET_URL).toBe('wss://cloud.dev.remote.it/api/ws')
  })

  it('an explicit VITE_WEBSOCKET_URL always wins', async () => {
    const c = await load({
      VITE_GRAPHQL_API: 'https://graphql.dev.remote.it/graphql',
      VITE_WEBSOCKET_URL: 'wss://custom.example.com/ws',
    })
    expect(c.WEBSOCKET_URL).toBe('wss://custom.example.com/ws')
  })
})

describe('constants — stage', () => {
  const unpinned = {
    VITE_OAUTH_ISSUER: '',
    VITE_OAUTH_GRAPHQL_RESOURCE: '',
    VITE_OAUTH_AGENT_RESOURCE: '',
    VITE_OAUTH_MCP_RESOURCE: '',
    VITE_GRAPHQL_API: '',
    VITE_WEBSOCKET_URL: '',
    VITE_AGENT_URL: '',
    DEV: false,
  }
  const loadAt = async (version: string, env: Record<string, string | boolean> = {}) => {
    vi.doMock('../package.json', () => ({ default: { version } }))
    return await load({ ...unpinned, ...env })
  }
  const endpoints = (c: Awaited<ReturnType<typeof load>>) => [
    c.OAUTH_ISSUER,
    c.OAUTH_GRAPHQL_RESOURCE,
    c.OAUTH_AGENT_RESOURCE,
    c.OAUTH_MCP_RESOURCE,
    c.GRAPHQL_API,
    c.WEBSOCKET_URL,
    c.AGENT_URL,
  ]
  const DEV_ENDPOINTS = [
    'https://login.dev.remote.it',
    'https://cloud.dev.remote.it/api',
    'https://agent.dev.remote.it',
    'https://cloud.dev.remote.it/mcp',
    'https://cloud.dev.remote.it/api/graphql',
    'wss://cloud.dev.remote.it/api/ws',
    'https://agent.dev.remote.it',
  ]

  afterEach(() => {
    window.localStorage.clear()
    vi.doUnmock('../package.json')
  })

  it('a plain version defaults to production, its agent included', async () => {
    const c = await loadAt('3.49.2')
    expect(c.STAGE).toBe('prod')
    expect(endpoints(c)).toEqual([
      'https://login.remote.it',
      'https://cloud.remote.it/api',
      'https://agent.remote.it',
      'https://cloud.remote.it/mcp',
      'https://cloud.remote.it/api/graphql',
      'wss://cloud.remote.it/api/ws',
      'https://agent.remote.it',
    ])
  })

  it('an alpha or beta version defaults to dev, every endpoint with it', async () => {
    for (const version of ['3.50.0-beta.1', '3.50.0-alpha.2']) {
      const c = await loadAt(version)
      expect(c.STAGE).toBe('dev')
      expect(endpoints(c)).toEqual(DEV_ENDPOINTS)
    }
  })

  it('a stored choice beats the version default', async () => {
    window.localStorage.setItem('r3.stage', 'dev')
    expect(endpoints(await loadAt('3.49.2'))).toEqual(DEV_ENDPOINTS)
    window.localStorage.setItem('r3.stage', 'prod')
    expect((await loadAt('3.50.0-beta.1')).STAGE).toBe('prod')
  })

  it('a stored value that names no stage is ignored', async () => {
    for (const junk of ['toString', 'staging', '']) {
      window.localStorage.setItem('r3.stage', junk)
      expect((await loadAt('3.49.2')).STAGE).toBe('prod')
    }
  })

  it('any endpoint set by the build pins it, so a stored choice cannot split login from endpoint', async () => {
    window.localStorage.setItem('r3.stage', 'dev')
    const c = await loadAt('3.49.2', { VITE_OAUTH_AGENT_RESOURCE: 'https://agent.example.test' })
    expect(c.STAGE_PINNED).toBe(true)
    expect(c.OAUTH_ISSUER).toBe('https://login.remote.it')
  })

  it('an issuer pinned by the build wins over a stored choice and names its stage', async () => {
    window.localStorage.setItem('r3.stage', 'prod')
    for (const issuer of ['https://login.dev.remote.it', 'https://login.dev.remote.it/']) {
      const c = await loadAt('3.49.2', { VITE_OAUTH_ISSUER: issuer })
      expect(c.STAGE_PINNED).toBe(true)
      expect(c.STAGE).toBe('dev')
      expect(endpoints(c).slice(1, 6)).toEqual(DEV_ENDPOINTS.slice(1, 6))
      expect(c.AGENT_URL).toBe('/agent')
    }
  })
})
