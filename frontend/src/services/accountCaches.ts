/* What is kept of an account OUTSIDE the store — a hook's or a service's own map, a page's own state — is kept BY ROW
   as the store's is (helpers/rowKey): the account, as the sign-in whose row it was read through sees it. Both rows of
   an organization two people here belong to stay kept, and picking the other shows what was read for it. A map says
   here how it loses what it keeps (accountCache): the accounts that are rows no more (models/accounts forgetData),
   and the rows whose sign-in left (forgetRows). What a page or a part read for itself is read again where it is, as
   the sign-in of the row now looked through (hooks/useReadAgain) — the page stays as it is, with whatever the person
   has typed into it. */
import { requestSignInNow, selectRowNow } from '../selectors/signIns'
import { RowKey, rowAccount } from '../helpers/rowKey'

// `accountIds`: every row of each is gone. `rows`: these are. Both empty: the row looked through changed, nothing gone.
type Forget = (accountIds: string[], rows: string[]) => void

const caches = new Set<Forget>()

export const accountCache = (forget: Forget) => void caches.add(forget)

/** The row an account is looked at through now: the key a map kept by row reads and writes by. */
export const rowNow = (accountId: string): RowKey => selectRowNow(accountId)

/** Whether a row is among what a map is told to forget. */
export const forgotten = (row: string, accountIds: string[], rows: string[]) =>
  rows.includes(row) || accountIds.includes(rowAccount(row))

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
  caches.forEach(forget => forget(accountIds, []))
  dropped++
  followers.forEach(follower => follower())
}

/** Rows that are no more: a sign-in left, or left an organization, and its rows went with it. */
export function forgetRowCaches(rows: string[]) {
  if (!rows.length) return
  caches.forEach(forget => forget([], rows))
  dropped++
  followers.forEach(follower => follower())
}

/** The row looked through is another sign-in's now, nothing dropped: an account's row selected after another
 *  sign-in's. What is kept by row stays (each row's is its own), and what is kept by something both rows may hold — a
 *  device's, a service's — is let go; a page's own reads run again, as the sign-in of the row now looked through. */
export function rowChanged() {
  caches.forEach(forget => forget([], []))
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
