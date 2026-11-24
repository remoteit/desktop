/* What is kept of an account OUTSIDE the store — a hook's or a service's own map by account id, a page's own state —
   is read as whichever sign-in served the account then. When the account's stored data is dropped (models/accounts
   forgetData: its sign-in left, or another serves it from now on) these go with it: a map says here how it is dropped
   (accountCache), and what a page or a part read for itself is read again where it is, as the sign-in serving the
   account now (hooks/useReadAgain) — the page stays as it is, with whatever the person has typed into it. */
type Forget = (accountIds: string[]) => void

const caches = new Set<Forget>()

export const accountCache = (forget: Forget) => void caches.add(forget)

// How many times accounts' data has been dropped: what a page's own reads follow.
let dropped = 0
const followers = new Set<() => void>()

export const accountsDropped = () => dropped

export function followAccountsDropped(follower: () => void) {
  followers.add(follower)
  return () => {
    followers.delete(follower)
  }
}

export function forgetAccountCaches(accountIds: string[]) {
  if (!accountIds.length) return
  caches.forEach(forget => forget(accountIds))
  dropped++
  followers.forEach(follower => follower())
}
