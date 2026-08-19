import http from 'http'
import crypto from 'crypto'
import { exec } from 'child_process'
import fs from 'fs'
import path from 'path'
import EventBus from './EventBus'
import Logger from './Logger'
import environment from './environment'
import { OAUTH_ISSUER, OAUTH_CLIENT_ID, OAUTH_GRAPHQL_RESOURCE, OAUTH_REDIRECT_MODE, PROTOCOL } from './constants'

/**
 * The desktop's OIDC client (permitteer docs/remoteit-desktop-login.md, Phase 2).
 *
 * This process OWNS authentication: it launches the system browser at the AS, captures
 * the authorization code (loopback listener in dev, remoteit:// deep link when
 * packaged — both registered on the client), exchanges it with PKCE, and holds the
 * ROTATING refresh token. The renderer never sees a refresh token: it asks for the
 * current access token over the local socket and holds it in memory only.
 *
 * Two contracts learned the hard way and load-bearing here:
 * - `resource` rides EVERY token/refresh request. The identity lane defaults `aud` to
 *   the issuer otherwise, and the r3 authorizer pins audiences — an issuer-audience
 *   token is useless at graphql.
 * - Refresh tokens are single-use and rotate; a concurrent second refresh is token
 *   REUSE and revokes the whole family. All refreshes serialize through one in-flight
 *   promise, and the rotated token persists before anything else proceeds.
 */

type Tokens = {
  refresh_token: string
  id_token?: string
  // per-resource access tokens, cached to their expiry
  access?: { [resource: string]: { token: string; exp: number } }
}

type Discovery = {
  authorization_endpoint: string
  token_endpoint: string
  end_session_endpoint?: string
}

type PendingFlow = {
  verifier: string
  state: string
  nonce: string
  redirectUri: string
  server?: http.Server
}

const b64u = (b: Buffer) => b.toString('base64url')
const decodeJwt = (jwt?: string): any => {
  try {
    return jwt ? JSON.parse(Buffer.from(jwt.split('.')[1], 'base64url').toString()) : undefined
  } catch {
    return undefined
  }
}

export class Oidc {
  static EVENTS = {
    signedIn: 'oidc/signed-in', // { claims } — id-token claims (email, sub, amr…)
    signedOut: 'oidc/signed-out',
    error: 'oidc/error', // { message }
    openUrl: 'oidc/open-url', // { url } — ElectronApp opens the system browser
  }

  private tokens?: Tokens
  private pending?: PendingFlow
  private discovery?: Discovery
  private refreshing?: Promise<void>
  // Injected by ElectronApp (shell.openExternal). EventBus can't signal "handled": the
  // Controller's EventRelay subscribes to EVERY event to forward it, so listener-counting
  // always looks handled even when nothing opens a browser.
  private opener?: (url: string) => void
  // Electron safeStorage, injected by ElectronApp once the app is ready. Until then (or
  // headless) the store falls back to a 0600 plain file with a loud log line.
  private cipher?: { encryptString(s: string): Buffer; decryptString(b: Buffer): string; isEncryptionAvailable(): boolean }

  get configured() {
    return !!OAUTH_ISSUER
  }

  get signedIn() {
    return !!this.tokens?.refresh_token
  }

  get claims(): any {
    return decodeJwt(this.tokens?.id_token)
  }

  useOpener(opener: (url: string) => void) {
    this.opener = opener
  }

  useSafeStorage(cipher: Oidc['cipher']) {
    this.cipher = cipher
    // Re-persist whatever a plain-file boot loaded, now encrypted.
    if (this.tokens) this.persist()
  }

  async load() {
    if (!this.configured) return
    try {
      const raw = fs.readFileSync(this.storePath())
      const text = this.cipher?.isEncryptionAvailable()
        ? this.cipher.decryptString(raw)
        : raw.toString('utf8')
      this.tokens = JSON.parse(text)
      Logger.info('OIDC TOKENS LOADED', { signedIn: this.signedIn })
    } catch {
      /* no stored session */
    }
  }

  /** Start (or restart) the sign-in journey: browser out, code back, tokens stored. */
  start = async () => {
    if (!this.configured) {
      EventBus.emit(Oidc.EVENTS.error, { message: 'OAUTH_ISSUER is not configured' })
      return
    }
    const d = await this.discover()
    this.cancelPending()

    const verifier = b64u(crypto.randomBytes(48))
    const state = b64u(crypto.randomBytes(16))
    const nonce = b64u(crypto.randomBytes(16))
    const flow: PendingFlow = { verifier, state, nonce, redirectUri: '' }

    if (OAUTH_REDIRECT_MODE === 'loopback') {
      const server = http.createServer((req, res) => {
        const url = new URL(req.url || '/', 'http://127.0.0.1')
        if (url.pathname !== '/authCallback') return res.writeHead(404).end()
        res.writeHead(200, { 'content-type': 'text/html' })
        res.end('<h3>Signed in &mdash; you can close this tab and return to Remote.It.</h3>')
        this.completeFromQuery(url.searchParams)
      })
      await new Promise<void>((ok, fail) => {
        server.once('error', fail)
        server.listen(0, '127.0.0.1', ok)
      })
      const port = (server.address() as any).port
      flow.server = server
      flow.redirectUri = `http://127.0.0.1:${port}/authCallback`
    } else {
      flow.redirectUri = PROTOCOL + 'authCallback'
    }

    this.pending = flow
    const authorize = new URL(d.authorization_endpoint)
    const params: Record<string, string> = {
      client_id: OAUTH_CLIENT_ID,
      redirect_uri: flow.redirectUri,
      response_type: 'code',
      code_challenge: b64u(crypto.createHash('sha256').update(flow.verifier).digest()),
      code_challenge_method: 'S256',
      scope: 'openid email full',
      state: flow.state,
      nonce: flow.nonce,
    }
    for (const [k, v] of Object.entries(params)) authorize.searchParams.set(k, v)
    Logger.info('OIDC START', { mode: OAUTH_REDIRECT_MODE, redirectUri: flow.redirectUri })
    this.openInBrowser(authorize.toString())
  }

  /** ElectronApp injects shell.openExternal; HEADLESS dev (backend under plain node,
   * web frontend on vite) has none, so the OS opener runs. The event still fires for
   * observers, but never decides whether a browser opens. */
  private openInBrowser(url: string) {
    EventBus.emit(Oidc.EVENTS.openUrl, { url })
    if (this.opener) return this.opener(url)
    const opener = process.platform === 'darwin' ? 'open' : process.platform === 'win32' ? 'start ""' : 'xdg-open'
    Logger.info('OIDC OPENING BROWSER (headless)', { opener })
    exec(`${opener} '${url.replace(/'/g, '')}'`, error => {
      if (error) Logger.warn('OIDC HEADLESS BROWSER OPEN FAILED', { error })
    })
  }

  /** Deep-link delivery (scheme mode): ElectronApp forwards remoteit://authCallback?… here. */
  handleCallbackUrl = (url: string) => {
    try {
      const query = url.includes('?') ? url.slice(url.indexOf('?') + 1) : ''
      this.completeFromQuery(new URLSearchParams(query))
    } catch (error) {
      Logger.warn('OIDC CALLBACK PARSE FAILED', { url, error })
    }
  }

  private completeFromQuery = async (params: URLSearchParams) => {
    const flow = this.pending
    if (!flow) return Logger.warn('OIDC CALLBACK WITHOUT PENDING FLOW')
    if (params.get('state') !== flow.state) {
      Logger.warn('OIDC STATE MISMATCH')
      return EventBus.emit(Oidc.EVENTS.error, { message: 'Sign-in state mismatch — try again.' })
    }
    const error = params.get('error')
    if (error) {
      this.cancelPending()
      Logger.warn('OIDC AUTHORIZE ERROR', { error })
      return EventBus.emit(Oidc.EVENTS.error, { message: params.get('error_description') || error })
    }
    const code = params.get('code') || ''
    this.cancelPending()
    try {
      // Exchange WITH the graphql resource: the primary access token comes out bound to
      // the API audience; the id token still names this client.
      const body = await this.tokenRequest({
        grant_type: 'authorization_code',
        code,
        code_verifier: flow.verifier,
        redirect_uri: flow.redirectUri,
        resource: OAUTH_GRAPHQL_RESOURCE,
      })
      const claims = decodeJwt(body.id_token)
      if (claims?.nonce !== flow.nonce) throw new Error('id_token nonce mismatch')
      const at = decodeJwt(body.access_token)
      this.tokens = {
        refresh_token: body.refresh_token,
        id_token: body.id_token,
        access: { [OAUTH_GRAPHQL_RESOURCE]: { token: body.access_token, exp: at?.exp ?? 0 } },
      }
      this.persist()
      Logger.info('OIDC SIGNED IN', { email: claims?.email, sub: claims?.sub })
      EventBus.emit(Oidc.EVENTS.signedIn, { claims })
    } catch (error: any) {
      Logger.warn('OIDC EXCHANGE FAILED', { error: error?.message })
      EventBus.emit(Oidc.EVENTS.error, { message: 'Sign-in failed — try again.' })
    }
  }

  /**
   * The renderer's (and any backend caller's) token source. Serves from cache while
   * fresh; otherwise ONE refresh runs and everyone awaits it — rotation makes a second
   * concurrent refresh token REUSE, which revokes the family.
   */
  getAccessToken = async (resource: string = OAUTH_GRAPHQL_RESOURCE): Promise<{ token: string; exp: number } | undefined> => {
    if (!this.signedIn) return undefined
    const cached = this.tokens?.access?.[resource]
    const now = Math.floor(Date.now() / 1000)
    if (cached && cached.exp - now > 30) return cached
    if (!this.refreshing) {
      this.refreshing = this.refresh(resource).finally(() => (this.refreshing = undefined))
    }
    await this.refreshing
    return this.tokens?.access?.[resource]
  }

  private refresh = async (resource: string) => {
    const refreshToken = this.tokens?.refresh_token
    if (!refreshToken) return
    try {
      const body = await this.tokenRequest({
        grant_type: 'refresh_token',
        refresh_token: refreshToken,
        resource,
      })
      const at = decodeJwt(body.access_token)
      this.tokens = {
        refresh_token: body.refresh_token || refreshToken, // rotated — persist FIRST
        id_token: body.id_token || this.tokens?.id_token,
        access: { ...this.tokens?.access, [resource]: { token: body.access_token, exp: at?.exp ?? 0 } },
      }
      this.persist()
    } catch (error: any) {
      Logger.warn('OIDC REFRESH FAILED', { error: error?.message })
      // A dead grant (revoked / expired session / family revoked on reuse) is a sign-out,
      // not a retry loop. Transient network errors keep the session; the next call retries.
      if (error?.oauthError === 'invalid_grant') this.signOutLocal()
    }
  }

  /** RP-initiated logout: revoke the named session at the AS, then clear locally. */
  signOut = async () => {
    const d = this.configured ? await this.discover().catch(() => undefined) : undefined
    const idToken = this.tokens?.id_token
    this.signOutLocal()
    if (d?.end_session_endpoint && idToken) {
      const url = new URL(d.end_session_endpoint)
      url.searchParams.set('id_token_hint', idToken)
      url.searchParams.set('post_logout_redirect_uri', PROTOCOL + 'signoutCallback')
      this.openInBrowser(url.toString())
    }
  }

  private signOutLocal() {
    this.tokens = undefined
    try {
      fs.rmSync(this.storePath(), { force: true })
    } catch {
      /* nothing stored */
    }
    EventBus.emit(Oidc.EVENTS.signedOut)
  }

  private async tokenRequest(params: Record<string, string>): Promise<any> {
    const d = await this.discover()
    const response = await fetch(d.token_endpoint, {
      method: 'POST',
      headers: { 'content-type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ client_id: OAUTH_CLIENT_ID, ...params }),
    })
    const body: any = await response.json().catch(() => ({}))
    if (!response.ok || !body.access_token) {
      const error: any = new Error(body.error_description || body.error || `token endpoint ${response.status}`)
      error.oauthError = body.error
      throw error
    }
    return body
  }

  private async discover(): Promise<Discovery> {
    if (this.discovery) return this.discovery
    const response = await fetch(`${OAUTH_ISSUER}/.well-known/openid-configuration`)
    if (!response.ok) throw new Error(`discovery failed: ${response.status}`)
    this.discovery = (await response.json()) as Discovery
    return this.discovery
  }

  private persist() {
    if (!this.tokens) return
    const text = JSON.stringify(this.tokens)
    try {
      if (this.cipher?.isEncryptionAvailable()) {
        fs.writeFileSync(this.storePath(), this.cipher.encryptString(text), { mode: 0o600 })
      } else {
        // Headless / pre-ready fallback. Loud on purpose: packaged builds re-persist
        // encrypted the moment ElectronApp injects safeStorage.
        Logger.warn('OIDC TOKENS STORED WITHOUT OS KEYCHAIN (safeStorage unavailable)')
        fs.writeFileSync(this.storePath(), text, { mode: 0o600 })
      }
    } catch (error) {
      Logger.error('OIDC TOKEN PERSIST FAILED', { error })
    }
  }

  private storePath() {
    return path.join(environment.userPath, 'oidc.dat')
  }

  private cancelPending() {
    this.pending?.server?.close()
    this.pending = undefined
  }
}

export default new Oidc()
