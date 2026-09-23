import { describe, it, expect, vi, afterEach } from 'vitest'

// constants.ts reads import.meta.env at module evaluation, so each case stubs the env it depends
// on and re-imports a fresh copy.
const load = async (env: Record<string, string>) => {
  vi.resetModules()
  Object.entries(env).forEach(([key, value]) => vi.stubEnv(key, value))
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
