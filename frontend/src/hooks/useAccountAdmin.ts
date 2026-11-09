import { useSelector } from 'react-redux'
import { selectPermissions } from '../selectors/organizations'
import { selectActiveAccountId } from '../selectors/accounts'

/* Whether you administer the account the portal is acting as — your own, or an organization whose role for you has
   ADMIN —; given an account, also that it is that one (none known, null, is not). What an account's own settings are
   offered to: its base for its proxies' names (pages/ProxyBasePage.tsx). graphql decides; this only says what to
   offer. */
export function useAccountAdmin(accountId?: string | null): boolean {
  const activeAccountId = useSelector(selectActiveAccountId)
  const admin = useSelector(selectPermissions).includes('ADMIN')
  return admin && (accountId === undefined || accountId === activeAccountId)
}
