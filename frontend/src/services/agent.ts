/**
 * Client for the ai-agent service (REST + SSE). The service is stateless:
 * the client holds the transcript and resends it each turn.
 */

// Dev: relative path served by the vite proxy (same-origin, CSP-clean).
// Staging/prod: set VITE_AGENT_URL to the deployed agent service domain.
export const AGENT_URL = import.meta.env.VITE_AGENT_URL || '/agent'

// Hydra credentials for the agent service (AUTH_MODE=hydra), written by the
// in-app sign-in flow (services/hydra.ts) — or a token pasted from the
// ai-agent dev harness as a fallback. localStorage matches where Amplify
// keeps the Cognito session today.
const AGENT_TOKEN_KEY = 'agentToken'
const AGENT_SESSION_KEY = 'agentSession'

export type AgentSession = {
  refresh_token: string
  expires_at: number
  client_id: string
}

export const getAgentToken = (): string | null => window.localStorage.getItem(AGENT_TOKEN_KEY)

export function setAgentToken(token: string | null): void {
  if (token?.trim()) window.localStorage.setItem(AGENT_TOKEN_KEY, token.trim().replace(/^Bearer\s+/i, ''))
  else window.localStorage.removeItem(AGENT_TOKEN_KEY)
}

export function getAgentSession(): AgentSession | null {
  try {
    const raw = window.localStorage.getItem(AGENT_SESSION_KEY)
    return raw ? (JSON.parse(raw) as AgentSession) : null
  } catch {
    return null
  }
}

export function setAgentSession(session: AgentSession | null): void {
  if (session) window.localStorage.setItem(AGENT_SESSION_KEY, JSON.stringify(session))
  else window.localStorage.removeItem(AGENT_SESSION_KEY)
}

/* The agent rejected our credential (401 reauth_required) — sign in again */
export class AgentAuthError extends Error {
  constructor() {
    super('Agent authentication required')
  }
}

function agentHeaders(json = true): Record<string, string> {
  const headers: Record<string, string> = json ? { 'Content-Type': 'application/json' } : {}
  const token = getAgentToken()
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

/* Stream one chat turn. Events arrive as SSE: `event: <type>\ndata: <json>\n\n` */
export async function streamChat(options: {
  conversationId: string
  messages: AgentMessageParam[]
  signal?: AbortSignal
  onEvent: (event: AgentEvent) => void
}): Promise<void> {
  const { conversationId, messages, signal, onEvent } = options
  const response = await fetch(`${AGENT_URL}/api/chat`, {
    method: 'POST',
    headers: agentHeaders(),
    body: JSON.stringify({ conversationId, messages }),
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
  const response = await fetch(`${AGENT_URL}/api/chat/confirm`, {
    method: 'POST',
    headers: agentHeaders(),
    body: JSON.stringify(options),
  })
  if (response.status === 401) throw new AgentAuthError()
  if (!response.ok) throw new Error(`Confirm failed (${response.status})`)
}

export type AgentHealth = 'ok' | 'unauthorized' | 'unreachable'

export async function agentHealth(): Promise<AgentHealth> {
  try {
    const response = await fetch(`${AGENT_URL}/api/health`, { headers: agentHeaders(false) })
    if (response.status === 401) return 'unauthorized'
    if (!response.ok) return 'unreachable'
    const body = (await response.json()) as { ok?: boolean }
    return body.ok ? 'ok' : 'unreachable'
  } catch {
    return 'unreachable'
  }
}
