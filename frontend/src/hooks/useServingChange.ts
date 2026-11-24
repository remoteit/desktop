import { useRef } from 'react'
import { useSelector } from 'react-redux'
import { State } from '../store'
import { selectActiveAccountId } from '../selectors/accounts'
import { selectSignInSub } from '../selectors/signIns'

/* How many times another sign-in has come to serve the selected account while it stayed selected (the person picked
   another for it, or the one serving it left). A key for what shows the account: the pages and parts that read for
   themselves when the account changes hold what the sign-in before was shown, and its permissions — mounted again,
   they read as the one serving it now. Selecting another account is not such a change: that they follow already. */
export function useServingChange(): number {
  const accountId = useSelector(selectActiveAccountId)
  const sub = useSelector((state: State) => selectSignInSub(state, accountId))
  const last = useRef({ accountId, sub, changes: 0 })
  if (last.current.accountId !== accountId) last.current = { accountId, sub, changes: last.current.changes }
  else if (last.current.sub !== sub) last.current = { accountId, sub, changes: last.current.changes + 1 }
  return last.current.changes
}
