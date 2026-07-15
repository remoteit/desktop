/**
 * Client for the ai-agent service (REST + SSE). The service is stateless:
 * the client holds the transcript and resends it each turn.
 */

// Dev: relative path served by the vite proxy (same-origin, CSP-clean).
// Staging/prod: set VITE_AGENT_URL to the deployed agent service domain.
export const AGENT_URL = import.meta.env.VITE_AGENT_URL || '/agent'

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
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ conversationId, messages }),
    signal,
  })
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
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(options),
  })
  if (!response.ok) throw new Error(`Confirm failed (${response.status})`)
}

export async function agentHealth(): Promise<boolean> {
  try {
    const response = await fetch(`${AGENT_URL}/api/health`)
    if (!response.ok) return false
    const body = (await response.json()) as { ok?: boolean }
    return !!body.ok
  } catch {
    return false
  }
}
