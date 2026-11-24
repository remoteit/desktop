import { store } from '../store'
import { RowKey, rowKey, rowSub } from '../helpers/rowKey'
import { RequestFor, getSignIns, idsKnown, rowsKnowing, noteAccountOf, selectAccountRoutes } from '../selectors/signIns'

/* A PAGE OPENED AT THE ADDRESS OF SOMETHING NO ROW HERE IS KNOWN TO HOLD. A read by id is made as the row looked at;
   where that finds nothing, and nothing known says whose the id is — no row's list holds it, it was read or made
   under none, and the caller named no account or row — it may be another sign-in's here to see. So the other rows
   are asked, read-only, in the sign-ins' order (the page's own person first): the first that finds it has its row
   selected — the account, as that sign-in — and the id noted under it, and the page shows it. Never for a change,
   never for something known, and with one sign-in in use nothing more is asked than the one read already made. */

type Found<T> = { answer: T; accountId: string; sub: string }

/** A read that could not be made, as against one that answered and found nothing. */
export const FAILED = 'ERROR' as const

// What was looked for and found nowhere: not looked for again while the page lives (a page that polls, a retry).
const nowhere = new Set<string>()

// For tests.
export const resetElsewhere = () => nowhere.clear()

export async function findElsewhere<T>({
  ids,
  asked,
  read,
  byAccount,
  accountOf,
}: {
  /** What was asked for, and found nothing as `asked`. */
  ids: string[]
  asked: RowKey
  /** The same read, made of `accountId` as `requestFor`'s sign-in: what it found; nothing, where it answered and has
   *  none; or 'ERROR' where it could not be asked (FAILED) — which says nothing of whether it is there. */
  read: (accountId: string, requestFor: RequestFor) => Promise<T | undefined | null | typeof FAILED>
  /** The read is of one account (a job, a file, a product of it): every account a sign-in reaches is asked. Else it is
   *  by id alone, and each sign-in is asked once. */
  byAccount?: boolean
  /** The account what was found is of (its owner), where the read is by id alone: the row selected is that account's
   *  where the sign-in that found it belongs to it, else the sign-in's own account. */
  accountOf?: (answer: T) => string | undefined
}): Promise<Found<T> | undefined> {
  const state = store.getState()
  const signIns = Object.values(getSignIns(state))
  if (!signIns.length) return
  const routes = selectAccountRoutes(state)
  const reached = (sub: string) => Object.keys(routes).filter(id => routes[id].reach.some(who => who.sub === sub))
  const own = (sub: string) => (sub ? getSignIns(state)[sub]?.id : state.auth.user?.id) || ''
  const found = async (accountId: string, sub: string, answer: T): Promise<Found<T>> => {
    const owner = byAccount ? accountId : accountOf?.(answer)
    const of = owner && reached(sub).includes(owner) ? owner : accountId
    noteAccountOf(of, ids, sub)
    await store.dispatch.accounts.selectAs({ accountId: of, sub })
    return { answer, accountId: of, sub }
  }
  // Known to be another row's — in its list, or noted there — and so not this one's to find: asked of the rows that
  // have it, and of no one else. (A page opened at the address of something an account not looked at holds.)
  if (idsKnown(state, ids)) {
    for (const { accountId, sub } of rowsKnowing(state, ids)) {
      if (byAccount ? rowKey(accountId, sub) === asked : sub === rowSub(asked)) continue
      const answer = await read(accountId, { sub })
      if (answer !== undefined && answer !== null && answer !== FAILED) return found(accountId, sub, answer)
    }
    return
  }
  // Remembered as nowhere for exactly who was asked — each account as each sign-in that reaches it: a sign-in brought
  // into use since, or an account one has joined, has not been asked, and may hold it.
  const pairs = Object.keys(routes)
    .flatMap(id => routes[id].reach.map(who => `${id}:${who.sub || ''}`))
    .sort()
  const key = [ids.join(' '), ...pairs].join('|')
  if (nowhere.has(key)) return
  let failed = false
  for (const sub of ['', ...signIns.map(signIn => signIn.sub)]) {
    const accounts = byAccount ? [own(sub), ...reached(sub).filter(id => id !== own(sub))] : [own(sub)]
    for (const accountId of accounts) {
      if (!accountId || (byAccount ? rowKey(accountId, sub) === asked : sub === rowSub(asked))) continue
      const answer = await read(accountId, { sub })
      if (answer === FAILED) failed = true
      if (answer === undefined || answer === null || answer === FAILED) continue
      return found(accountId, sub, answer)
    }
  }
  // Found nowhere — and remembered so only where everyone could be asked: one that failed may see it yet, and is
  // asked again the next time the page is opened.
  if (!failed) nowhere.add(key)
}
