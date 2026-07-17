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

export const agentIsLimited = (agent: IAuthorizedAgent): boolean => agent.reach != null

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
export function reachSummary(reach: IAccountReach[] | null | undefined, accountLabel: (id: string) => string): string {
  if (reach == null) return 'All devices'
  if (!reach.length) return 'No devices'
  if (reach.length === 1) {
    const rule = reach[0]
    const tags = rule.tags?.length ? ` (tags ${rule.tags.join(', ')})` : ''
    return `Limited to ${accountLabel(rule.account)}${tags}`
  }
  return `Limited to ${reach.length} accounts`
}

// How long a revoked agent's in-flight access token still works (stateless JWT verification):
// revoke kills refresh immediately, but the last access token lives out its TTL.
export function accessWindow(seconds: number): string {
  const mins = Math.round(seconds / 60)
  if (mins >= 1) return `${mins} minute${mins === 1 ? '' : 's'}`
  return `${seconds} seconds`
}
