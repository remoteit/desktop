/**
 * Client for the ai-agent service (REST + SSE). Conversations are SERVER-side resources
 * now (permitteer docs/remoteit-ai-agent.md D11/Phase 5): each turn sends only the NEW
 * message; the server owns the durable transcript and journals every turn, so this
 * client's copy is a display cache, not the record.
 *
 * Auth rides the FIRST-PARTY session (permitteer docs/remoteit-ai-agent.md D2): every
 * request carries an agent-audience token from the oidc machinery plus a DPoP proof —
 * signed over the CANONICAL resource URL (audience + path), which is what the agent's
 * edge checks regardless of the proxy or override actually transporting the request.
 * No agent-specific credentials exist anywhere anymore.
 */
import { store } from '../store'
import { oidcAuthHeaders } from './oidc'
import { OAUTH_AGENT_RESOURCE } from '../constants'

/* The override must be https — the app's CSP blocks plain http. Shared with
   the Test Settings validation so what saves is exactly what engages. */
export const isSecureAgentURL = (url: string): boolean => /^https:\/\//i.test(url)

/* Base URL for the agent service, resolved per request. A Test UI override
   wins (Test Settings → Agent service URL, https only). Otherwise dev rides the
   vite proxy (same-origin, CSP-clean) even when VITE_AGENT_URL is set, staying
   out of CORS; builds have no proxy and use the deployed agent domain from
   VITE_AGENT_URL. */
export function agentURL(): string {
  const override = store.getState().ui.apis.agentURL
  if (override && isSecureAgentURL(override)) return override.replace(/\/+$/, '')
  return import.meta.env.DEV ? '/agent' : import.meta.env.VITE_AGENT_URL || '/agent'
}

/* The agent rejected our credential (401 reauth_required) — sign in again */
export class AgentAuthError extends Error {
  constructor() {
    super('Agent authentication required')
  }
}

/* A usage window (session/weekly) or the fleet is spent — the turn was refused before it ran.
   Carries which window and when it resets so the UI can say "resets at 4:30pm". */
/* The stream closed cleanly before a terminal event (done / error) — the server or an
   intermediary (a proxy idle timeout on a long turn, say) ended it mid-answer. Without this
   the turn resolved normally and a truncated answer looked complete. */
export class AgentStreamEndedError extends Error {
  constructor() {
    super('Agent stream ended before the turn completed')
    this.name = 'AgentStreamEndedError'
  }
}

export class UsageLimitError extends Error {
  constructor(message: string, readonly window: 'session' | 'weekly' | 'global', readonly resetsAt: string | null) {
    super(message)
  }
}

async function agentHeaders(method: string, path: string, json = true): Promise<Record<string, string>> {
  return {
    ...(json ? { 'Content-Type': 'application/json' } : {}),
    ...(await oidcAuthHeaders(method, `${OAUTH_AGENT_RESOURCE}${path}`, OAUTH_AGENT_RESOURCE)),
  }
}

export type AgentEvent =
  | { type: 'turn'; turnId: string }
  | { type: 'text_delta'; text: string }
  | { type: 'tool_call_start'; id: string; name: string; input: Record<string, unknown> }
  | { type: 'tool_call_result'; id: string; name: string; result: string; isError: boolean; durationMs: number }
  | { type: 'confirmation_required'; id: string; name: string; input: Record<string, unknown> }
  | { type: 'done'; stopReason: string | null }
  | { type: 'error'; message: string }

export type OrgSelection = { id: string; name: string }

/* Stream one chat turn: the NEW message only. Events arrive as SSE, opening with
   `turn {turnId}` — the id confirm() addresses. */
export async function streamChat(options: {
  conversationId: string
  text: string
  org?: OrgSelection
  signal?: AbortSignal
  onEvent: (event: AgentEvent) => void
}): Promise<void> {
  const { conversationId, text, org, signal, onEvent } = options
  const path = `/api/conversations/${encodeURIComponent(conversationId)}/messages`
  const response = await fetch(`${agentURL()}${path}`, {
    method: 'POST',
    headers: await agentHeaders('POST', path),
    body: JSON.stringify(org ? { text, org } : { text }),
    signal,
  })
  if (response.status === 401) throw new AgentAuthError()
  if (response.status === 429 || response.status === 503) {
    const body = (await response.json().catch(() => ({}))) as {
      error?: string
      code?: string
      window?: string
      resetsAt?: string
    }
    if (body.code === 'usage_limit')
      throw new UsageLimitError(
        body.error || 'Usage limit reached',
        (body.window as 'session' | 'weekly' | 'global') ?? 'session',
        body.resetsAt ?? null
      )
  }
  if (!response.ok || !response.body) throw new Error(`Agent request failed (${response.status})`)

  const reader = response.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''
  let terminal = false // a done or error event closed the turn — anything else at EOF is a cut-off
  const deliver = (block: string) => {
    let event = 'message'
    const dataLines: string[] = []
    for (const line of block.split('\n')) {
      if (line.startsWith('event:')) event = line.slice(6).trim()
      else if (line.startsWith('data:')) dataLines.push(line.slice(5).trimStart())
    }
    if (!dataLines.length) return
    if (event === 'done' || event === 'error') terminal = true
    onEvent({ type: event, ...JSON.parse(dataLines.join('\n')) } as AgentEvent)
  }
  /* An event ends at a blank line. SSE permits CRLF, LF or CR line endings, so normalise to LF
     before looking for it — a CRLF server would otherwise never produce the '\n\n' we search
     for, and every turn would finish silently empty. A CR at the very end of the buffer may be
     the first half of a CRLF split across reads, so it is held back for the next read. */
  const drain = (final = false) => {
    const hold = !final && buffer.endsWith('\r') ? '\r' : ''
    buffer = buffer.slice(0, buffer.length - hold.length).replace(/\r\n?/g, '\n') + hold
    let index: number
    while ((index = buffer.indexOf('\n\n')) !== -1) {
      deliver(buffer.slice(0, index))
      buffer = buffer.slice(index + 2)
    }
    // EOF: an event the server closed on without a trailing blank line is still an event.
    // EventSource discards it because it cannot know whether it is complete; our payloads are
    // JSON, so a successful parse IS that check — and a torn tail is dropped, not surfaced as
    // a parse error over a turn the user already watched finish.
    if (final && buffer.trim()) {
      try {
        deliver(buffer)
      } catch {
        /* truncated mid-event */
      }
      buffer = ''
    }
  }
  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    buffer += decoder.decode(value, { stream: true })
    drain()
  }
  buffer += decoder.decode() // flush a multi-byte sequence still pending in the decoder
  drain(true)
  // A clean close with no terminal event is a cut-off, not a completion. (A Stop never lands
  // here: aborting rejects reader.read() with an AbortError, which the caller ignores.)
  if (!terminal) throw new AgentStreamEndedError()
}

/* Approve or deny a write tool the agent paused on — addressed to the TURN */
export async function confirmTool(options: { turnId: string; toolUseId: string; approved: boolean }): Promise<void> {
  const path = `/api/turns/${encodeURIComponent(options.turnId)}/confirm`
  const response = await fetch(`${agentURL()}${path}`, {
    method: 'POST',
    headers: await agentHeaders('POST', path),
    body: JSON.stringify({ toolUseId: options.toolUseId, approved: options.approved }),
  })
  if (response.status === 401) throw new AgentAuthError()
  if (!response.ok) throw new Error(`Confirm failed (${response.status})`)
}

export type AgentHealth = 'ok' | 'unauthorized' | 'unreachable'

export async function agentHealth(): Promise<AgentHealth> {
  try {
    const response = await fetch(`${agentURL()}/api/health`, {
      headers: await agentHeaders('GET', '/api/health', false),
    })
    if (response.status === 401) return 'unauthorized'
    if (!response.ok) return 'unreachable'
    const body = (await response.json()) as { ok?: boolean }
    return body.ok ? 'ok' : 'unreachable'
  } catch {
    return 'unreachable'
  }
}

export type ConversationSummary = { id: string; title: string | null; createdAt: string; updatedAt: string }

/* The user's conversations, newest first (D11) — the history picker's source. */
export async function listConversations(): Promise<ConversationSummary[]> {
  const response = await fetch(`${agentURL()}/api/conversations`, {
    headers: await agentHeaders('GET', '/api/conversations', false),
  })
  // Don't turn an auth/service failure (401/403/5xx) into an empty list — loadConversations would
  // overwrite the last-known history as though the user had none. Throw so its catch keeps it.
  if (!response.ok) throw new Error(`listConversations: ${response.status}`)
  return ((await response.json()) as { conversations: ConversationSummary[] }).conversations
}

/* The server-side transcript (D11) — the durable copy this client's display caches. */
export async function fetchConversation(
  conversationId: string
): Promise<{ title: string | null; messages: Array<{ role: string; content: string }> } | null> {
  const path = `/api/conversations/${encodeURIComponent(conversationId)}`
  const response = await fetch(`${agentURL()}${path}`, { headers: await agentHeaders('GET', path, false) })
  // null means GONE (callers clear the local copy). An auth/service failure is NOT a deletion —
  // throw it so callers preserve the transcript and report, instead of discarding a live chat.
  if (response.status === 404) return null
  if (!response.ok) throw new Error(`fetchConversation: ${response.status}`)
  return (await response.json()) as { title: string | null; messages: Array<{ role: string; content: string }> }
}

/* The delete that actually deletes (D9): messages, turns, journal all cascade server-side. */
export async function deleteConversation(conversationId: string): Promise<boolean> {
  const path = `/api/conversations/${encodeURIComponent(conversationId)}`
  const response = await fetch(`${agentURL()}${path}`, {
    method: 'DELETE',
    headers: await agentHeaders('DELETE', path, false),
  })
  return response.ok
}

// --- Usage meter (permitteer docs/usage-limits.md D6) ---------------------------------

export type UsageWindow = {
  limitUsd: number
  spentUsd: number
  remainingUsd: number
  resetsAt: string | null
  unlimited: boolean
}
export type Usage = { session: UsageWindow; weekly: UsageWindow }

/* The user's two usage windows in dollars — drives the header meter. */
export async function fetchUsage(): Promise<Usage | null> {
  try {
    const response = await fetch(`${agentURL()}/api/usage`, { headers: await agentHeaders('GET', '/api/usage', false) })
    if (!response.ok) return null
    return (await response.json()) as Usage
  } catch {
    return null
  }
}

// --- Background work (permitteer docs/remoteit-ai-agent.md D6/Phase 6) -----------------

/* Where the enrollment ceremony starts — a top-level navigation to the agent, which
   redirects into the AS consent screen. Who enrolled is the AS's answer at the
   callback, so this URL needs no token. */
export const backgroundConnectUrl = (): string => `${agentURL()}/oauth/connect`

export async function backgroundStatus(): Promise<boolean> {
  try {
    const response = await fetch(`${agentURL()}/api/enrollment`, {
      headers: await agentHeaders('GET', '/api/enrollment', false),
    })
    if (!response.ok) return false
    return ((await response.json()) as { enrolled?: boolean }).enrolled === true
  } catch {
    return false
  }
}

/* Best-effort: revokes the agent's stored grant at the AS and empties its vault.
   Called from Background-work settings and from explicit sign-out (plan D8). */
export async function backgroundDisable(): Promise<void> {
  try {
    await fetch(`${agentURL()}/api/enrollment`, {
      method: 'DELETE',
      headers: await agentHeaders('DELETE', '/api/enrollment', false),
    })
  } catch {
    /* best-effort by design */
  }
}
