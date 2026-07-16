import { useMemo } from 'react'
import { useSelector } from 'react-redux'
import { State } from '../../store'

// Friendly labels for the device-capability scopes an agent may hold.
export const CAPABILITY_LABEL: { [scope: string]: string } = {
  'device:read': 'View devices',
  'device:write': 'Manage devices',
  'device:connect': 'Connect',
  'device:execute': 'Run scripts',
  'user:read': 'View account',
  'org:read': 'View organization',
}

export function capabilityLabel(scope: string): string {
  return CAPABILITY_LABEL[scope] || scope
}

export const agentIsLimited = (agent: IAuthorizedAgent): boolean =>
  !!(agent.reach && (agent.reach.accounts != null || agent.reach.tags != null))

// Resolve an account id to a human label (the account email, or "you" for the signed-in user).
// A hook so the list/detail share one implementation; memoized to keep the map reference stable.
export function useAccountLabel(): (id: string) => string {
  const membership = useSelector((state: State) => state.accounts.membership)
  const meId = useSelector((state: State) => state.auth.user?.id || state.user.id)
  const meEmail = useSelector((state: State) => state.auth.user?.email || state.user.email)

  return useMemo(() => {
    const map: { [id: string]: string } = {}
    if (meId) map[meId] = meEmail ? `${meEmail} (you)` : 'Your devices'
    membership.forEach(m => (map[m.account.id] = m.account.email))
    return (id: string) => map[id] || id
  }, [membership, meId, meEmail])
}

export function reachSummary(reach: IAgentReach | undefined, accountLabel: (id: string) => string): string {
  if (!reach || (reach.accounts == null && reach.tags == null)) return 'Can reach all your devices'
  const parts: string[] = []
  if (reach.accounts) {
    parts.push(reach.accounts.length === 1 ? accountLabel(reach.accounts[0]) : `${reach.accounts.length} accounts`)
  }
  if (reach.tags) parts.push(`tags ${reach.tags.join(', ')} (${reach.tagOperator === 'ALL' ? 'all' : 'any'})`)
  return `Limited to ${parts.join(' and ')}`
}
