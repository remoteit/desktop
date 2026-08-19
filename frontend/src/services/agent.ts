/**
 * Client for the ai-agent service (REST + SSE). The service is stateless:
 * the client holds the transcript and resends it each turn.
 */
import { store } from '../store'
import { encryptString, decryptString, isEncrypted } from './secureStorage'

/* The override must be https — the app's CSP blocks plain http. Shared with
   the Test Settings validation so what saves is exactly what engages. */
export const isSecureAgentURL = (url: string): boolean => /^https:\/\//i.test(url)

/* Base URL for the agent service, resolved per request. The Test UI override
   wins (Test Settings → Override agent service). Otherwise dev rides the vite
   proxy (same-origin, CSP-clean) even when VITE_AGENT_URL is set, staying out
   of CORS; builds have no proxy and use the deployed agent domain from
   VITE_AGENT_URL. */
export function agentURL(): string {
  const { switchAgent, agentURL: override } = store.getState().ui.apis
  if (switchAgent && override && isSecureAgentURL(override)) return override.replace(/\/+$/, '')
  return import.meta.env.DEV ? '/agent' : import.meta.env.VITE_AGENT_URL || '/agent'
}

// Hydra credentials for the agent service (AUTH_MODE=hydra), written by the
// in-app sign-in flow (services/hydra.ts) — or a token pasted from the
// ai-agent dev harness as a fallback. Stored in localStorage (shared with the
// popout window) encrypted at rest via secureStorage.
const AGENT_TOKEN_KEY = 'agentToken'
const AGENT_SESSION_KEY = 'agentSession'

export type AgentSession = {
  refresh_token: string
  expires_at: number
  client_id: string
}

/* Tokens are encrypted at rest (secureStorage) so localStorage never holds
   them in clear text. Reads fall back to plaintext for a token pasted from
   the ai-agent dev harness and for values stored before encryption landed —
   the next write re-encrypts. */

export async function decodeAgentToken(raw: string | null): Promise<string | null> {
  if (!raw) return null
  return isEncrypted(raw) ? await decryptString(raw) : raw
}

export async function decodeAgentSession(raw: string | null): Promise<AgentSession | null> {
  if (!raw) return null
  try {
    const json = isEncrypted(raw) ? await decryptString(raw) : raw
    return json ? (JSON.parse(json) as AgentSession) : null
  } catch {
    return null
  }
}

export const getAgentToken = (): Promise<string | null> =>
  decodeAgentToken(window.localStorage.getItem(AGENT_TOKEN_KEY))

export async function setAgentToken(token: string | null): Promise<void> {
  if (token?.trim())
    window.localStorage.setItem(AGENT_TOKEN_KEY, await encryptString(token.trim().replace(/^Bearer\s+/i, '')))
  else window.localStorage.removeItem(AGENT_TOKEN_KEY)
}

export const getAgentSession = (): Promise<AgentSession | null> =>
  decodeAgentSession(window.localStorage.getItem(AGENT_SESSION_KEY))

export async function setAgentSession(session: AgentSession | null): Promise<void> {
  if (session) window.localStorage.setItem(AGENT_SESSION_KEY, await encryptString(JSON.stringify(session)))
  else window.localStorage.removeItem(AGENT_SESSION_KEY)
}

/* Synchronous read-and-clear for sign-out: the stored credentials must be
   gone before any await gives a signOut-triggered reload a chance to
   interrupt; the raw values are returned so revoke can still decode them */
export function takeAgentCredentials(): { token: string | null; session: string | null } {
  const token = window.localStorage.getItem(AGENT_TOKEN_KEY)
  const session = window.localStorage.getItem(AGENT_SESSION_KEY)
  window.localStorage.removeItem(AGENT_TOKEN_KEY)
  window.localStorage.removeItem(AGENT_SESSION_KEY)
  return { token, session }
}

/* The agent rejected our credential (401 reauth_required) — sign in again */
export class AgentAuthError extends Error {
  constructor() {
    super('Agent authentication required')
  }
}

async function agentHeaders(json = true): Promise<Record<string, string>> {
  const headers: Record<string, string> = json ? { 'Content-Type': 'application/json' } : {}
  const token = await getAgentToken()
  if (token) headers.Authorization = `Bearer ${token}`
  return headers
}

export type AgentEvent =
  | { type: 'text_delta'; text: string }
  | { type: 'tool_call_start'; id: string; name: string; input: Record<string, unknown> }
  | { type: 'tool_call_result'; id: string; name: string; result: string; isError: boolean; durationMs: number }
  | { type: 'confirmation_required'; id: string; name: string; input: Record<string, unknown> }
  | { type: 'done'; stopReason: string | null }
  | { type: 'error'; message: string }

export type AgentMessageParam = { role: 'user' | 'assistant'; content: string }

export type OrgSelection = { id: string; name: string }

/* Stream one chat turn. Events arrive as SSE: `event: <type>\ndata: <json>\n\n` */
export async function streamChat(options: {
  conversationId: string
  messages: AgentMessageParam[]
  org?: OrgSelection
  signal?: AbortSignal
  onEvent: (event: AgentEvent) => void
}): Promise<void> {
  const { conversationId, messages, org, signal, onEvent } = options
  const response = await fetch(`${agentURL()}/api/chat`, {
    method: 'POST',
    headers: await agentHeaders(),
    body: JSON.stringify(org ? { conversationId, messages, org } : { conversationId, messages }),
    signal,
  })
  if (response.status === 401) throw new AgentAuthError()
  if (!response.ok || !response.body) throw new Error(`Agent request failed (${response.status})`)

  const reader = response.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''
  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    buffer += decoder.decode(value, { stream: true })
    let index: number
    while ((index = buffer.indexOf('\n\n')) !== -1) {
      const block = buffer.slice(0, index)
      buffer = buffer.slice(index + 2)
      let event = 'message'
      const dataLines: string[] = []
      for (const line of block.split('\n')) {
        if (line.startsWith('event:')) event = line.slice(6).trim()
        else if (line.startsWith('data:')) dataLines.push(line.slice(5).trimStart())
      }
      if (dataLines.length) onEvent({ type: event, ...JSON.parse(dataLines.join('\n')) } as AgentEvent)
    }
  }
}

/* Approve or deny a write tool the agent paused on */
export async function confirmTool(options: {
  conversationId: string
  toolUseId: string
  approved: boolean
}): Promise<void> {
  const response = await fetch(`${agentURL()}/api/chat/confirm`, {
    method: 'POST',
    headers: await agentHeaders(),
    body: JSON.stringify(options),
  })
  if (response.status === 401) throw new AgentAuthError()
  if (!response.ok) throw new Error(`Confirm failed (${response.status})`)
}

export type AgentHealth = 'ok' | 'unauthorized' | 'unreachable'

export async function agentHealth(): Promise<AgentHealth> {
  try {
    const response = await fetch(`${agentURL()}/api/health`, { headers: await agentHeaders(false) })
    if (response.status === 401) return 'unauthorized'
    if (!response.ok) return 'unreachable'
    const body = (await response.json()) as { ok?: boolean }
    return body.ok ? 'ok' : 'unreachable'
  } catch {
    return 'unreachable'
  }
}
