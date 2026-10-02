// socketio-auth delivers a refusal as its message string only, so the details ride as JSON behind a prefix.
const PREFIX = 'agent-owned:'

export type AgentOwner = {
  username: string
  command: string
}

export const agentOwnedMessage = (owner: AgentOwner) => PREFIX + JSON.stringify(owner)

export function parseAgentOwned(message?: string): AgentOwner | undefined {
  if (!message?.startsWith(PREFIX)) return undefined
  try {
    const owner = JSON.parse(message.slice(PREFIX.length))
    return typeof owner?.username === 'string' ? owner : undefined
  } catch {
    return undefined
  }
}
