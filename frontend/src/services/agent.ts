/**
 * Client for the ai-agent service (REST + SSE). The service is stateless:
 * the client holds the transcript and resends it each turn.
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

/* The agent rejected our credential (401 reauth_required) — sign in again */
export class AgentAuthError extends Error {
  constructor() {
    super('Agent authentication required')
  }
}

async function agentHeaders(method: string, path: string, json = true): Promise<Record<string, string>> {
  return {
    ...(json ? { 'Content-Type': 'application/json' } : {}),
    ...(await oidcAuthHeaders(method, `${OAUTH_AGENT_RESOURCE}${path}`, OAUTH_AGENT_RESOURCE)),
  }
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
    headers: await agentHeaders('POST', '/api/chat'),
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
    headers: await agentHeaders('POST', '/api/chat/confirm'),
    body: JSON.stringify(options),
  })
  if (response.status === 401) throw new AgentAuthError()
  if (!response.ok) throw new Error(`Confirm failed (${response.status})`)
}

export type AgentHealth = 'ok' | 'unauthorized' | 'unreachable'

export async function agentHealth(): Promise<AgentHealth> {
  try {
    const response = await fetch(`${agentURL()}/api/health`, { headers: await agentHeaders('GET', '/api/health', false) })
    if (response.status === 401) return 'unauthorized'
    if (!response.ok) return 'unreachable'
    const body = (await response.json()) as { ok?: boolean }
    return body.ok ? 'ok' : 'unreachable'
  } catch {
    return 'unreachable'
  }
}
