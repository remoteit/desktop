import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { createMockBridge, MockBridgeOptions } from './thisDeviceMock'

// The token-source seam (services/oidc, "the SHELL's sign-in"): with thisDevice present and offering `auth`, the
// portal starts no flow, stores nothing, and asks the shell for every token, proof and account change; a plain
// browser (no transport) keeps its own sign-in.

const { leaveTo } = vi.hoisted(() => ({ leaveTo: vi.fn() }))
vi.mock('./browser', () => ({ default: { isNative: false, isElectron: false }, leaveTo }))
vi.mock('./chatPopout', () => ({ isChatPopout: false }))
vi.mock('../i18n', () => ({ default: { language: 'en', resolvedLanguage: 'en' } }))
vi.mock('../constants', () => ({
  OAUTH_ISSUER: 'https://login.solo.remote.it',
  OAUTH_CLIENT_ID: 'remoteit_portal',
  OAUTH_GRAPHQL_RESOURCE: 'https://cloud.solo.remote.it/api',
  OAUTH_MCP_RESOURCE: 'https://cloud.solo.remote.it/mcp',
  OAUTH_MCP_DETAIL: 'remoteit_mcp',
  OAUTH_AGENT_ACTOR: 'svc_ai_agent',
  OAUTH_ACCOUNT_RESOURCE: 'https://login.solo.remote.it/account/api',
  PROTOCOL: 'remoteit://',
  EMBEDDED: true,
}))

const API = 'https://cloud.solo.remote.it/api'

async function boot(options?: MockBridgeOptions | null) {
  vi.resetModules()
  const bridge = options === null ? undefined : createMockBridge(options)
  const td = await import('./thisDevice')
  if (bridge) td.registerBridgeTransport(async () => bridge.transport)
  const oidc = await import('./oidc')
  const reload = vi.fn()
  oidc.oidcShellHooks.reload = reload
  const used = await oidc.oidcUseShell()
  return { oidc, bridge, reload, used }
}

const fetchSpy = vi.fn()
beforeEach(() => {
  localStorage.clear()
  sessionStorage.clear()
  leaveTo.mockReset()
  fetchSpy.mockReset().mockRejectedValue(new Error('no network in this test'))
  vi.stubGlobal('fetch', fetchSpy)
})
afterEach(() => vi.unstubAllGlobals())

const stored = () => [...Object.keys(localStorage), ...Object.keys(sessionStorage)]

describe('with the shell signing in', () => {
  it('takes the shell’s person as signed in, with no flow and nothing stored', async () => {
    const { oidc, used } = await boot()
    expect(used).toBe(true)
    expect(oidc.oidcShell()).toBe(true)
    expect(oidc.oidcSignedIn()).toBe(true)
    expect(oidc.oidcClaims()).toMatchObject({ sub: 'sub-person', email: 'person@example.com' })
    expect(await oidc.oidcCompleteFromUrl()).toBeUndefined()
    expect(oidc.oidcGrantStale()).toBe(false)
    expect(oidc.oidcActor()).toBeNull()
    expect(stored()).toEqual([])
    expect(fetchSpy).not.toHaveBeenCalled() // no discovery, no token endpoint, no MCP metadata
  })

  it('asks the shell for an access token per resource, once while it is fresh', async () => {
    const { oidc, bridge } = await boot()
    expect(await oidc.oidcAccessToken(API)).toBe('token-for:sub-person:' + API)
    expect(await oidc.oidcAccessToken(API)).toBe('token-for:sub-person:' + API)
    const account = 'https://login.solo.remote.it/account/api'
    expect(await oidc.oidcAccessToken(account)).toBe('token-for:sub-person:' + account)
    const asked = bridge!.calls.filter(c => c.method === 'auth.accessToken').map(c => c.args.resource)
    expect(asked).toEqual([API, account])
    expect(await oidc.oidcAuthHeaders('POST', API + '/graphql', API)).toEqual({ authorization: 'Bearer token-for:sub-person:' + API })
    expect(stored()).toEqual([])
  })

  it('presents a DPoP-bound token with the shell’s proof, and makes no key of its own', async () => {
    const { oidc, bridge } = await boot({ tokenType: 'DPoP' })
    const headers = await oidc.oidcAuthHeaders('POST', API + '/graphql', API)
    expect(headers).toEqual({ authorization: 'DPoP token-for:sub-person:' + API, DPoP: 'proof:POST:' + API + '/graphql' })
    expect(bridge!.calls.find(c => c.method === 'auth.dpopProof')!.args).toEqual({
      method: 'POST',
      url: API + '/graphql',
      accessToken: 'token-for:sub-person:' + API,
    })
  })

  it('is signed out when the shell is: no token, and no flow of its own', async () => {
    const { oidc } = await boot({ accounts: [] })
    expect(oidc.oidcSignedIn()).toBe(false)
    expect(await oidc.oidcAccessToken(API)).toBe('')
    expect(fetchSpy).not.toHaveBeenCalled()
  })

  it('signs in through the shell, never leaving for the AS, and reloads as the new person', async () => {
    const { oidc, bridge, reload } = await boot({ accounts: [] })
    expect(await oidc.oidcStart({ prompt: 'select_account' })).toBe(true)
    expect(bridge!.calls.find(c => c.method === 'auth.signIn')!.args).toEqual({ addAccount: false })
    expect(leaveTo).not.toHaveBeenCalled()
    expect(reload).toHaveBeenCalled()
    expect(stored().filter(k => !k.startsWith('oidc.autoStarts'))).toEqual([])
  })

  it('leaves silent rounds to the shell', async () => {
    const { oidc, bridge } = await boot()
    expect(await oidc.oidcStart({ prompt: 'none', loginHint: 'person@example.com' })).toBe(false)
    expect(bridge!.calls.some(c => c.method === 'auth.signIn')).toBe(false)
  })

  it('signs out through the shell, and its own sign-out does not reload the page', async () => {
    const { oidc, bridge, reload } = await boot()
    expect(await oidc.oidcEndSession()).toBe(204)
    expect(bridge!.calls.find(c => c.method === 'auth.signOut')!.args).toEqual({ sub: 'sub-person' })
    oidc.oidcClearLocal()
    expect(oidc.oidcSignedIn()).toBe(false)
    await new Promise(r => setTimeout(r)) // the shell's auth event
    expect(reload).not.toHaveBeenCalled()
  })

  it('lists the shell’s accounts and switches through it', async () => {
    const { oidc, bridge, reload } = await boot({
      accounts: [
        { sub: 'sub-person', email: 'person@example.com', active: true },
        { sub: 'sub-other', email: 'other@example.com', active: false },
      ],
    })
    expect(oidc.oidcAccounts().map(a => [a.email, a.active, a.known])).toEqual([
      ['person@example.com', true, false],
      ['other@example.com', false, false],
    ])
    expect(oidc.oidcActivateAccount('sub-other')).toBe(false)
    expect(await oidc.oidcSelectKnownAccount('sub-other')).toBe(true)
    expect(bridge!.calls.find(c => c.method === 'auth.switch')!.args).toEqual({ sub: 'sub-other' })
    expect(reload).toHaveBeenCalledTimes(1)
  })

  it('reloads when the shell’s person changes under it (the menu signed someone else in)', async () => {
    const { bridge, reload } = await boot()
    bridge!.emit('auth', { active: { sub: 'sub-person', email: 'person@example.com', active: true } })
    await new Promise(r => setTimeout(r))
    expect(reload).not.toHaveBeenCalled()
    bridge!.emit('auth', { active: { sub: 'sub-else', email: 'else@example.com', active: true } })
    await new Promise(r => setTimeout(r))
    expect(reload).toHaveBeenCalledTimes(1)
  })
})

describe('without the shell signing in', () => {
  it('a plain browser (no transport) keeps its own sign-in', async () => {
    const { oidc, used } = await boot(null)
    expect(used).toBe(false)
    expect(oidc.oidcShell()).toBe(false)
    expect(oidc.oidcSignedIn()).toBe(false)
  })

  it('a shell that does not offer auth leaves the sign-in to the page', async () => {
    const { oidc, used, bridge } = await boot({ capabilities: ['status', 'vpn'] })
    expect(used).toBe(false)
    expect(oidc.oidcShell()).toBe(false)
    expect(bridge!.calls.map(c => c.method)).toEqual(['info'])
  })

  it('a shell of another major version is not used', async () => {
    const { used } = await boot({ info: { bridgeVersion: '2.0.0' } })
    expect(used).toBe(false)
  })
})
