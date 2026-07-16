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

export const agentIsLimited = (agent: IAuthorizedAgent): boolean => !!(agent.reach && agent.reach.accounts != null)

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

// A concise one-liner for the row; the detail page renders the full per-account breakdown.
export function reachSummary(reach: IAgentReach | undefined, accountLabel: (id: string) => string): string {
  if (!reach || reach.accounts == null) return 'Can reach all your devices'
  if (!reach.accounts.length) return 'No device access'
  if (reach.accounts.length === 1) {
    const rule = reach.accounts[0]
    const tags = rule.tags?.length ? ` (tags ${rule.tags.join(', ')})` : ''
    return `Limited to ${accountLabel(rule.account)}${tags}`
  }
  return `Limited to ${reach.accounts.length} accounts`
}
