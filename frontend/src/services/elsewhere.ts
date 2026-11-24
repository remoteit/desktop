import { store } from '../store'
import { RowKey, rowKey, rowSub } from '../helpers/rowKey'
import { RequestFor, getSignIns, idsKnown, noteAccountOf, selectAccountRoutes } from '../selectors/signIns'

/* A PAGE OPENED AT THE ADDRESS OF SOMETHING NO ROW HERE IS KNOWN TO HOLD. A read by id is made as the row looked at;
   where that finds nothing, and nothing known says whose the id is — no row's list holds it, it was read or made
   under none, and the caller named no account or row — it may be another sign-in's here to see. So the other rows
   are asked, read-only, in the sign-ins' order (the page's own person first): the first that finds it has its row
   selected — the account, as that sign-in — and the id noted under it, and the page shows it. Never for a change,
   never for something known, and with one sign-in in use nothing more is asked than the one read already made. */

type Found<T> = { answer: T; accountId: string; sub: string }

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
  /** The same read, made of `accountId` as `requestFor`'s sign-in: what it found, or nothing. */
  read: (accountId: string, requestFor: RequestFor) => Promise<T | undefined | null>
  /** The read is of one account (a job, a file, a product of it): every account a sign-in reaches is asked. Else it is
   *  by id alone, and each sign-in is asked once. */
  byAccount?: boolean
  /** The account what was found is of (its owner), where the read is by id alone: the row selected is that account's
   *  where the sign-in that found it belongs to it, else the sign-in's own account. */
  accountOf?: (answer: T) => string | undefined
}): Promise<Found<T> | undefined> {
  const state = store.getState()
  const signIns = Object.values(getSignIns(state))
  if (!signIns.length || idsKnown(state, ids)) return
  const key = ids.join(' ')
  if (nowhere.has(key)) return
  const routes = selectAccountRoutes(state)
  const reached = (sub: string) => Object.keys(routes).filter(id => routes[id].reach.some(who => who.sub === sub))
  const own = (sub: string) => (sub ? getSignIns(state)[sub]?.id : state.auth.user?.id) || ''
  for (const sub of ['', ...signIns.map(signIn => signIn.sub)]) {
    const accounts = byAccount ? [own(sub), ...reached(sub).filter(id => id !== own(sub))] : [own(sub)]
    for (const accountId of accounts) {
      if (!accountId || (byAccount ? rowKey(accountId, sub) === asked : sub === rowSub(asked))) continue
      const answer = await read(accountId, { sub })
      if (answer === undefined || answer === null) continue
      const owner = byAccount ? accountId : accountOf?.(answer)
      const of = owner && reached(sub).includes(owner) ? owner : accountId
      noteAccountOf(of, ids, sub)
      await store.dispatch.accounts.selectAs({ accountId: of, sub })
      return { answer, accountId: of, sub }
    }
  }
  nowhere.add(key)
}
