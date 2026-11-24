/* What is kept of an account OUTSIDE the store — a hook's or a service's own map by account id, a page's own state —
   is read as whichever sign-in served the account then. When the account's stored data is dropped (models/accounts
   forgetData: its sign-in left, or another serves it from now on) these go with it: a map says here how it is dropped
   (accountCache), and what a page or a part read for itself is read again where it is, as the sign-in serving the
   account now (hooks/useReadAgain) — the page stays as it is, with whatever the person has typed into it. */
import { requestSignInNow } from '../selectors/signIns'

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

/** The row looked through is another sign-in's now, no account's data dropped: an account's row selected after
 *  another sign-in's. What is kept by account stays (each account's is its own row's), and what is kept by something
 *  both rows may hold — a device's, a service's — is let go; a page's own reads run again, as the sign-in of the row
 *  now looked through. */
export function rowChanged() {
  caches.forEach(forget => forget([]))
  dropped++
  followers.forEach(follower => follower())
}

/* One read for everyone who asks in the same moment — one per device for every part of a page showing it, say — as
   the same sign-in: a device in two rows is read once for each, never one sign-in's read handed to the other. A read
   still out when accounts' data is dropped was asked as the sign-in before: it is not handed to whoever asks after,
   who are given a read of their own, made as the sign-in serving the account now. */
export function sharedRead<T>(read: (key: string) => Promise<T>) {
  const reading = new Map<string, Promise<T>>()
  const forget = () => reading.clear()
  accountCache(forget)
  const shared = (key: string): Promise<T> => {
    const asked = `${requestSignInNow({ about: [key] }) ?? ''} ${key}`
    let answer = reading.get(asked)
    if (!answer) {
      const made: Promise<T> = read(key).finally(() => reading.get(asked) === made && reading.delete(asked))
      answer = made
      reading.set(asked, made)
    }
    return answer
  }
  return Object.assign(shared, { forget })
}
