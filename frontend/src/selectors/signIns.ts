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
export const getSignIns = (state: State): ILookup<ISignIn> => state.accounts?.signIns || NONE
const NO_MEMBERSHIPS: IMembership[] = []
const getPrimaryMemberships = (state: State) => state.accounts?.membership || NO_MEMBERSHIPS
const getUserId = (state: State) => state.auth?.user?.id || ''
const getActiveId = (state: State) => state.accounts?.activeId

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

const getActiveSub = (state: State) => state.accounts?.activeSub

/* EVERY ACCOUNT HERE, AND THE ROW IT IS LOOKED AT THROUGH. An account is reached by each sign-in that belongs to it
   (`reach`), and has a row under each. The one it is looked at through — whose sign-in asks where a request names the
   account alone (`sub`) — is: for the SELECTED account, the selected row (accounts.activeId with accounts.activeSub),
   while that sign-in still reaches it; for any other account, the page's own person's row where they belong to it,
   else the first sign-in's that does. Nothing else picks a sign-in for an account. */
export const selectAccountRoutes = createSelector(
  [getUserId, (state: State) => state.user?.email, getPrimaryMemberships, getSignIns, getActiveId, getActiveSub],
  (userId, userEmail, memberships, signIns, activeId, activeSub): ILookup<AccountRoute> => {
    const selected = activeId || userId
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
      if (first || (id === selected && who.sub === activeSub)) {
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

/** The sign-in an account is looked at through (selectAccountRoutes): its sub, or undefined for the page's own person
 *  and for an account no sign-in reaches. */
export const selectSignInSub = (state: State, accountId?: string): string | undefined =>
  accountId ? selectAccountRoutes(state)[accountId]?.sub : undefined

/* THE SELECTED ROW: an account (accounts.activeId, else the page's own) and the sign-in whose row of it was picked
   (accounts.activeSub, '' the page's own person) — kept while that sign-in still reaches the account. */
export const selectActiveSub = (state: State): string =>
  selectAccountRoutes(state)[getActiveId(state) || getUserId(state)]?.sub || ''

export const selectActiveRowKey = (state: State): RowKey =>
  rowKey(getActiveId(state) || getUserId(state), selectActiveSub(state))

/* THE ROW AN ACCOUNT IS LOOKED AT THROUGH (helpers/rowKey), as selectAccountRoutes says it: callers say an account by
   its id, and where the store keeps something by row, the row is this one. An account no one here reaches — and the
   lists the store keeps beside the accounts' — is its own key. */
export const selectRowOf = (state: State, accountId: string): RowKey =>
  rowKey(accountId, selectAccountRoutes(state)[accountId]?.sub)

/** The sign-in a connection or a session is of: the one it says (`sub`), and where it says none — it was stored before
 *  they were said — the page's own person where they belong to its account, else the sign-in that serves it. */
export const subOf = (routes: ILookup<AccountRoute>, accountId?: string, sub?: string): string => {
  if (sub !== undefined) return sub
  const route = accountId ? routes[accountId] : undefined
  return !route || route.reach.some(who => !who.sub) ? '' : route.sub || ''
}

// The lists the store keeps beside the rows', by their own names: a model's defaults, and the devices of connections
// no list holds.
export const BESIDE_ROWS: string[] = ['default', 'connections']

/** Every row a model that keeps by row (models/accounts BY_ROW) keeps something under. */
export function storedRows(state: State): RowKey[] {
  const { devices, products, partnerStats, networks, files, jobs, tags, organization, applicationTypes } = state
  const byRow = [
    devices,
    products,
    partnerStats,
    networks?.all,
    files?.all,
    jobs?.all,
    tags?.all,
    organization?.accounts,
    applicationTypes?.account,
  ]
  const rows = new Set<string>(byRow.flatMap(lookup => Object.keys(lookup || {})))
  return ([...rows] as RowKey[]).filter(row => !BESIDE_ROWS.includes(row))
}

/** The row a caller means: the account under the sign-in it says (`sub`), else the one it is looked at through. */
export const rowFor = (state: State, accountId: string, sub?: string): RowKey =>
  sub === undefined ? selectRowOf(state, accountId) : rowKey(accountId, sub)

/** A read made for a row: asked as the row's sign-in, its answer kept for that row (RequestFor.row). */
export const asRow = (row: RowKey): RequestFor => ({ sub: rowSub(row), row: true })

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

/* By ROW (helpers/rowKey): each list is kept under the row it was read for — an organization's under each sign-in
   that has read it — and a row holds what its lists do, and its account. A row is the account and the sign-in: the
   sign-in is whose request about what it holds is. */
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
    Object.keys(routes).forEach(id => row(id, routes[id].sub || '').ids.add(id))
    const hold = <T>(byRow: ILookup<T> | undefined, lists: (kept: T) => Held[]) =>
      Object.keys(byRow || {}).forEach(key => {
        const accountId = rowAccount(key)
        if (!routes[accountId] || !byRow![key]) return
        const held = row(accountId, rowSub(key))
        idsOf(lists(byRow![key])).forEach(each => held.ids.add(each))
      })
    hold(devices, kept => [kept.all, ...(kept.all || []).map((device: IDevice) => device.services)])
    hold(networks, kept => [kept])
    hold(jobs, kept => [kept])
    hold(files, kept => [kept])
    hold(products, kept => [kept.all])
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
const noted = new Map<string, Map<string, { accountId: string; sub?: string }>>()

/* Noted by ROW: the account, under the sign-in it was read or made as — said (`sub`), else the one the account is
   looked at through when this is called. (Before the store can be read — nothing is looked at yet — the account
   alone is noted, and means its row as it is looked at when asked.) */
export function noteAccountOf(accountId: string | undefined, ids: (string | undefined | null)[], sub?: string) {
  if (!accountId) return
  const as = sub ?? (stateNow ? rowSub(selectRowOf(stateNow(), accountId)) : undefined)
  ids.forEach(id => {
    if (!id) return
    if (!noted.has(id)) noted.set(id, new Map())
    noted.get(id)!.set(`${accountId} ${as ?? '?'}`, { accountId, sub: as })
  })
}

// The rows an id is noted under, those still rows.
const notedRows = (state: State, id: string): RowKey[] =>
  [...(noted.get(id)?.values() || [])]
    .filter(({ accountId }) => !!selectAccountRoutes(state)[accountId])
    .map(({ accountId, sub }) => rowFor(state, accountId, sub))
    .filter(row => !rowGone(state, row))

/** The row an account is looked at through now, read where no hook is (a service's own map kept by row). */
export const selectRowNow = (accountId: string): RowKey =>
  stateNow ? selectRowOf(stateNow(), accountId) : rowKey(accountId)

/** Whether anything known says whose one of these ids is: a row's list holds it, or it was read or made under one. */
export const idsKnown = (state: State, ids: string[]): boolean =>
  ids.some(id => noted.has(id)) || selectHeldRows(state).some(row => ids.some(id => row.ids.has(id)))

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

/* THE ROW AN EFFECT ACTS FOR. An effect that began in a row and has waited since sends what follows as that row's
   sign-in, whichever row is looked at by then: it says so around the call that sends it (sendAs), and the request
   made inside — one that does not itself say whose it is — is that sign-in's. Only for as long as the call takes to
   send: what a request function does after waiting is not covered, so it is for functions that send at once. */
let acting: RowKey | undefined

export function sendAs<T>(row: RowKey, send: () => T): T {
  const before = acting
  acting = row
  try {
    return send()
  } finally {
    acting = before
  }
}

/** What a request is asked as where the effect making it said its row (sendAs) and the request says no sign-in or
 *  account of its own. */
export const actingFor = (requestFor?: RequestFor): RequestFor | undefined =>
  acting !== undefined && requestFor?.sub === undefined && !requestFor?.account
    ? { ...requestFor, sub: rowSub(acting) }
    : requestFor

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
  const of = notedRows(state, id).map(rowAccount)
  const accounts = Object.keys(routes).filter(accountId => holding.includes(accountId) || of.includes(accountId))
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
  // Noted under more than one row here (an exit of one, shared with another): in the same order of preference.
  const of = ids.flatMap(id => notedRows(state, id))
  if (!of.length) return unknown()
  if (of.includes(rowKey(selected, selectedSub))) return selectedSub || undefined
  return of.some(row => !rowSub(row)) ? undefined : rowSub(of[0])
}
