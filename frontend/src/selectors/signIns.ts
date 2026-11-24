import { createSelector } from 'reselect'
import type { State } from '../store'
import { RowKey, rowAccount, rowKey, rowSub } from '../helpers/rowKey'

/* SEVERAL SIGN-INS ARE IN USE AT ONCE (docs/ACCOUNT-LINKS.md, "Existing org switcher"). The page's own person is the
   PRIMARY sign-in: auth.user, and accounts.membership, are theirs. Every further sign-in is kept in accounts.signIns
   by its sub, with its own account and the organizations it belongs to. The switcher lists them all as one set of
   rows, and each request carries the token of the sign-in that serves the account it asks about — which is what
   this file answers. Undefined always means the primary. */

/** A sign-in beside the page's own person: its own account id and email, and the organizations it belongs to. */
export type ISignIn = { sub: string; id: string; email: string; membership: IMembership[] }

/** Whose request it is, said by the caller: the sign-in outright, the account it asks about, or the ids of what it
 *  is `about` — read as the variables' ids are, and instead of them: for a REST path, which has no variables, and for
 *  a request whose variables also name something of another account (this machine's device, for a local port).
 *  `orAccount`: the account to ask as when nothing known says whose the ids are — the selected one, for a page opened
 *  at the address of something no list holds (an exit, a proxy), before any list that would say has been read. */
export type RequestFor = {
  account?: string
  sub?: string
  about?: string[]
  orAccount?: string
  /** Its answer is kept by row (helpers/rowKey): asked as `sub`, it goes to that sign-in's row of the account
   *  whichever row is looked at by the time it answers — so it is never stale, and never dropped for being so. */
  row?: boolean
}

const NONE: ILookup<ISignIn> = {}
const NO_CHOICE: ILookup<string> = {}
export const getSignIns = (state: State): ILookup<ISignIn> => state.accounts.signIns || NONE
export const getVia = (state: State): ILookup<string> => state.accounts.via || NO_CHOICE
const getPrimaryMemberships = (state: State) => state.accounts.membership
const getUserId = (state: State) => state.auth?.user?.id || ''
const getActiveId = (state: State) => state.accounts.activeId

export type AccountRoute = {
  /** The sign-in whose token requests about the account carry; undefined: the primary. */
  sub?: string
  email?: string
  /** Every sign-in that reaches the account ('' the primary), in the order they are preferred. */
  reach: { sub: string; email: string }[]
  /** The membership through the serving sign-in; none for a sign-in's own account. */
  membership?: IMembership
  /** The account is a sign-in's own. */
  signIn?: boolean
}

/* One row per account or organization id. An id two sign-ins reach is served by the primary, else by the first
   sign-in that reaches it — unless the person picked another for it (accounts.via), a choice kept only while that
   sign-in still reaches it. */
export const selectAccountRoutes = createSelector(
  [getUserId, (state: State) => state.user?.email, getPrimaryMemberships, getSignIns, getVia],
  (userId, userEmail, memberships, signIns, via): ILookup<AccountRoute> => {
    const routes: ILookup<AccountRoute> = {}
    const reach = (
      id: string,
      who: { sub: string; email: string },
      found: { membership?: IMembership; signIn?: boolean }
    ) => {
      if (!id) return
      const route = (routes[id] ??= { reach: [] })
      const first = !route.reach.length
      route.reach.push(who)
      if (first || via[id] === who.sub) {
        route.sub = who.sub || undefined
        route.email = who.sub ? who.email : undefined
        route.membership = found.membership
        route.signIn = found.signIn
      }
    }
    const primary = { sub: '', email: userEmail || '' }
    if (userId) reach(userId, primary, {})
    memberships.forEach(membership => reach(membership.account.id, primary, { membership }))
    Object.values(signIns).forEach(signIn => {
      const who = { sub: signIn.sub, email: signIn.email }
      reach(signIn.id, who, { signIn: true })
      signIn.membership.forEach(membership => reach(membership.account.id, who, { membership }))
    })
    return routes
  }
)

/** The sign-in that serves an account: its sub, or undefined for the primary and for an account no sign-in reaches. */
export const selectSignInSub = (state: State, accountId?: string): string | undefined =>
  accountId ? selectAccountRoutes(state)[accountId]?.sub : undefined

/* THE SELECTED ROW: an account (accounts.activeId, else the page's own) and the sign-in whose row of it was picked
   (accounts.activeSub, '' the page's own person) — kept while that sign-in still reaches the account, else the one
   that serves it (selectAccountRoutes). */
export const selectActiveSub = (state: State): string => {
  const route = selectAccountRoutes(state)[getActiveId(state) || getUserId(state)]
  const picked = state.accounts?.activeSub
  if (picked !== undefined && route?.reach.some(who => who.sub === picked)) return picked
  return route?.sub || ''
}

export const selectActiveRowKey = (state: State): RowKey =>
  rowKey(getActiveId(state) || getUserId(state), selectActiveSub(state))

/* THE ROW AN ACCOUNT IS LOOKED AT THROUGH (helpers/rowKey). Callers say an account by its id; where the store keeps
   something by row, the row is this one: for the selected account, the selected row; for any other account, the row
   under the sign-in last picked for it, else the page's own person's where they belong to it, else the first
   sign-in's that does (what selectAccountRoutes answers). An account no one here reaches — and the lists the store
   keeps beside the accounts' — is its own key. */
export const selectRowOf = (state: State, accountId: string): RowKey =>
  accountId === (getActiveId(state) || getUserId(state))
    ? selectActiveRowKey(state)
    : rowKey(accountId, selectAccountRoutes(state)[accountId]?.sub)

/** A row whose sign-in has left, or left the account, since: nothing is kept for it. (A key of no account here — a
 *  list the store keeps beside the rows' — is not a row, and is never gone.) */
export const rowGone = (state: State, row: RowKey): boolean => {
  const route = selectAccountRoutes(state)[rowAccount(row)]
  return route ? !route.reach.some(who => who.sub === rowSub(row)) : !!rowSub(row)
}

/** Everyone signed in here, by their own account id: the page's own person, then each sign-in beside them. */
export const selectPersonIds = createSelector([getUserId, getSignIns], (userId, signIns): string[] =>
  [userId, ...Object.values(signIns).map(signIn => signIn.id)].filter(Boolean)
)

/** The sign-in of a person signed in here, by their own account id: '' the primary; undefined, no one here. */
export const selectPersonSub = (state: State, personId?: string): string | undefined =>
  !personId
    ? undefined
    : personId === getUserId(state)
    ? ''
    : Object.values(getSignIns(state)).find(signIn => signIn.id === personId)?.sub

/* What each account's stored lists hold, by id — devices and their services, networks, scripts' jobs, files and
   products — so a request that names only such an id is made as the sign-in that serves the account holding it. */
type Held = { id: string }[] | undefined
const idsOf = (lists: Held[], more: (string | undefined)[] = []): Set<string> => {
  const ids = new Set<string>()
  lists.forEach(list => list?.forEach(item => item?.id && ids.add(item.id)))
  more.forEach(id => id && ids.add(id))
  return ids
}

/* By ROW (helpers/rowKey): a device is held by the row whose list it is in — an organization's under each sign-in that
   has read it — and what is not kept by row yet (networks, jobs, files, products) by the row its account is looked at
   through. A row is the account and the sign-in: the sign-in is whose request about what it holds is. */
type HeldRow = { accountId: string; sub: string; ids: Set<string> }

const selectHeldRows = createSelector(
  [
    (state: State) => state.devices,
    (state: State) => state.networks?.all,
    (state: State) => state.jobs?.all,
    (state: State) => state.files?.all,
    (state: State) => state.products,
    selectAccountRoutes,
  ],
  (devices, networks, jobs, files, products, routes): HeldRow[] => {
    const rows = new Map<string, HeldRow>()
    const row = (accountId: string, sub: string) => {
      const key = rowKey(accountId, sub)
      if (!rows.has(key)) rows.set(key, { accountId, sub, ids: new Set() })
      return rows.get(key)!
    }
    Object.keys(routes).forEach(id => {
      const held = row(id, routes[id].sub || '')
      idsOf([networks?.[id], jobs?.[id], files?.[id], products?.[id]?.all], [id]).forEach(each => held.ids.add(each))
    })
    Object.keys(devices || {}).forEach(key => {
      const accountId = rowAccount(key)
      if (!routes[accountId]) return
      const all: IDevice[] = devices[key]?.all || []
      const held = row(accountId, rowSub(key))
      idsOf([all, ...all.map(device => device.services)]).forEach(each => held.ids.add(each))
    })
    return [...rows.values()]
  }
)

// The accounts with a row that holds one of these ids.
const holdingAccounts = (state: State, ids: string[]): string[] => [
  ...new Set(
    selectHeldRows(state)
      .filter(row => ids.some(id => row.ids.has(id)))
      .map(row => row.accountId)
  ),
]

/* The ids no stored list holds, by the account they are of: what was just made and is not read into the store yet (a
   new service), and what is only ever read into a page (an exit, a proxy). Said where they are made or read with their
   account (noteAccountOf), so a later request that names one alone is still made as the sign-in that serves that
   account, not as the primary. An id may be read under more than one account (an exit shared with one, read again
   under its owner's): the selected one is used, then one the primary serves, then the first of the rest. For the
   page's life: none of it is state. */
const noted = new Map<string, Set<string>>()

export function noteAccountOf(accountId: string | undefined, ids: (string | undefined | null)[]) {
  if (!accountId) return
  ids.forEach(id => {
    if (!id) return
    if (!noted.has(id)) noted.set(id, new Set())
    noted.get(id)!.add(accountId)
  })
}

export const isNoted = (id: string) => noted.has(id)

/** The selected account, read where no hook is: by a request that asks as it when nothing says whose its id is. */
export const selectedAccountId = (state: State): string => state.accounts?.activeId || state.auth?.user?.id || ''

// For tests.
export const resetNotedAccounts = () => noted.clear()

// The strings a request's variables carry: its own, a list's, and those of an input object one level down.
const namedIds = (variables: ILookup<any> | undefined, nested = true): string[] => {
  const ids: string[] = []
  Object.values(variables || {}).forEach(value => {
    if (typeof value === 'string' && value) ids.push(value)
    else if (Array.isArray(value)) value.forEach(item => typeof item === 'string' && item && ids.push(item))
    else if (nested && value && typeof value === 'object') ids.push(...namedIds(value, false))
  })
  return ids
}

/** The person signed in for what a request is about — the sign-in's own account id: whose a local port or a
 *  connection opened for it is. */
export const selectPersonFor = (state: State, about: (string | undefined)[]): string => {
  const sub = requestSignIn(state, { about: about.filter((id): id is string => !!id) })
  return (sub && getSignIns(state)[sub]?.id) || getUserId(state)
}

/** The person a sign-in serving an account is — their email: who "you" are in a request made about it (the share a
 *  person leaves is theirs, not the page's own person's). */
export const selectPersonEmailFor = (state: State, accountId?: string): string => {
  const sub = selectSignInSub(state, accountId)
  return (sub && getSignIns(state)[sub]?.email) || state.auth?.user?.email || ''
}

/* WHAT A READ WAS ASKED AS. A read answers for the sign-in that served its accounts when it was asked. If another
   serves one of them by the time it answers (the person picked another, the one serving it left), the answer is the
   sign-in before's — its role, what it may see — and what was stored of the account has been dropped to be read
   again: the late answer must not put it back. So the accounts a request is about are taken with their sign-ins when
   it is sent (requestServing) and looked at again when it answers (servingChanged); services/post turns a read that
   has gone stale so into a failed one, which every model already leaves its stored data alone for.
   The accounts: the one the caller or the variables name, and those holding what they name; with the sign-in said
   outright (a request made once per sign-in), the accounts it says it is `about`. */
export type Serving = [accountId: string, sub: string | undefined][]

const NO_ACCOUNTS: Serving = []

export function requestServing(state: State, requestFor?: RequestFor, variables?: ILookup<any>): Serving {
  if (!state.accounts?.signIns || !Object.keys(state.accounts.signIns).length) return NO_ACCOUNTS
  // Kept by row: its answer goes to the row it was asked for, whatever is looked at by then.
  if (requestFor?.row) return NO_ACCOUNTS
  const routes = selectAccountRoutes(state)
  const named = [
    requestFor?.account,
    requestFor?.orAccount,
    variables?.accountId,
    ...(requestFor?.about ?? namedIds(variables)),
  ].filter((id): id is string => typeof id === 'string' && !!id)
  if (!named.length) return NO_ACCOUNTS
  const accounts = new Set<string>()
  named.forEach(id => {
    if (routes[id]) return accounts.add(id)
    holdingAccounts(state, [id]).forEach(accountId => accounts.add(accountId))
  })
  return [...accounts].map(accountId => [accountId, routes[accountId].sub])
}

/** Whether an account a request was about is no row here any more: no sign-in serves it. */
export const servingGone = (state: State, serving: Serving): boolean => {
  const routes = selectAccountRoutes(state)
  return serving.some(([accountId]) => !routes[accountId])
}

/** Whether an account a request was about is served by another sign-in now, or by none. */
export const servingChanged = (state: State, serving: Serving): boolean => {
  if (!serving.length) return false
  const routes = selectAccountRoutes(state)
  return serving.some(([accountId, sub]) => routes[accountId]?.sub !== sub)
}

/* The same, of the state as it is now, for a service that has no hook to read it by and must not bring the store in
   with it (the store says where its state is read, once it is made). The page's own person until then. */
let stateNow: (() => State) | undefined
export const readStateWith = (read: () => State) => void (stateNow = read)
export const requestSignInNow = (requestFor?: RequestFor, variables?: ILookup<any>): string | undefined =>
  stateNow ? requestSignIn(stateNow(), requestFor, variables) : undefined

/** Whether the page's own person reaches something, as far as is known: their sign-in serves, or reaches, an account
 *  whose stored list holds it or that it was read under — or nothing is known of it, and it is taken to be theirs.
 *  What this browser's one client, which is theirs, can open (services/browserGateway). Not who a request about it
 *  would be made as: a service of theirs shared with another sign-in whose account is selected is still theirs. */
export function primaryReachesNow(id?: string): boolean {
  if (!id || !stateNow) return true
  const state = stateNow()
  if (!state.accounts?.signIns || !Object.keys(state.accounts.signIns).length) return true
  const routes = selectAccountRoutes(state)
  const holding = holdingAccounts(state, [id])
  const accounts = Object.keys(routes).filter(accountId => holding.includes(accountId) || noted.get(id)?.has(accountId))
  return !accounts.length || accounts.some(accountId => routes[accountId].reach.some(who => !who.sub))
}

/* The sign-in a request is made as. With one sign-in in use there is nothing to decide. Otherwise, in order: what
   the caller said; the account the variables name (`accountId`, unless the caller says what the request is about:
   then it is data, and what it is about says first); the account whose stored lists hold an id the
   variables name — the selected account first, then any the primary serves, then the rest — so a change to a device
   reached only through another sign-in is made as that sign-in; the account an id no list holds was made or read
   under (noteAccountOf), in that same order where there are several; else the primary. A request about the person
   themselves (profile, billing, keys, contacts, plans, chat) names none of these and is always the primary's, so
   those pages never show one account's data under another's name. */
export function requestSignIn(state: State, requestFor?: RequestFor, variables?: ILookup<any>): string | undefined {
  if (requestFor?.sub !== undefined) return requestFor.sub || undefined
  if (!state.accounts?.signIns || !Object.keys(state.accounts.signIns).length) return undefined
  if (requestFor?.account) return selectSignInSub(state, requestFor.account)
  // An `accountId` among the variables is whose request it is — unless the caller says what the request is `about`:
  // then the variable is data (the account whose devices a network takes by tag, whose tags are set on it), and says
  // only where nothing known says whose what it is about is.
  const named: string | undefined =
    typeof variables?.accountId === 'string' && variables.accountId ? variables.accountId : undefined
  const about = requestFor?.about
  if (named && !about) return selectSignInSub(state, named)
  const unknown = () =>
    named ? selectSignInSub(state, named) : requestFor?.orAccount ? routes[requestFor.orAccount]?.sub : undefined
  const routes = selectAccountRoutes(state)
  const ids = about ?? namedIds(variables)
  if (!ids.length) return unknown()
  // The row that holds one of them says: the selected row first, then one of the page's own person's, then the first.
  const holding = selectHeldRows(state).filter(row => ids.some(id => row.ids.has(id)))
  const selected = getActiveId(state) || getUserId(state)
  const selectedSub = selectActiveSub(state)
  if (holding.some(row => row.accountId === selected && row.sub === selectedSub)) return selectedSub || undefined
  if (holding.some(row => !row.sub)) return undefined
  if (holding.length) return holding[0].sub
  // Noted under more than one account here (an exit of one, shared with another): in the same order of preference.
  const of = ids.flatMap(id => [...(noted.get(id) || [])]).filter(accountId => routes[accountId])
  if (!of.length) return unknown()
  if (selected && of.includes(selected)) return routes[selected].sub
  return of.some(accountId => !routes[accountId].sub) ? undefined : routes[of[0]].sub
}
