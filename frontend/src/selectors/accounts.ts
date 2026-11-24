import { createSelector } from 'reselect'
import { dateSort } from '../helpers/utilHelper'
import { State } from '../store'
import { getUserId, getUser, getActiveId, optionalAccountId, getMemberships } from './state'
import { getSignIns, rowFor, selectAccountRoutes, selectRowOf } from './signIns'
import { RowKey, rowSub } from '../helpers/rowKey'

/* Every row of the switcher beyond the page's own account (selectors/signIns): the organizations the primary
   belongs to, then each further sign-in's own account and its organizations — one row per id. A row another sign-in
   is looked at through says so (`under`); one more than one sign-in reaches lists them (`reach`), which is the choice offered. */
export const selectMemberships = createSelector(
  [(state: State) => state.auth?.user?.id || '', getMemberships, getSignIns, selectAccountRoutes],
  (userId, memberships, signIns, routes): IMembership[] => {
    if (!Object.keys(signIns).length) return memberships
    const rows: IMembership[] = []
    const listed = new Set<string>([userId])
    const add = (id: string, own?: { email: string; created?: Date }) => {
      const route = routes[id]
      if (!route || listed.has(id)) return
      listed.add(id)
      const row: IMembership = route.membership
        ? { ...route.membership }
        : {
            roleId: 'OWNER',
            roleName: 'Owner',
            license: 'UNKNOWN',
            created: own?.created || new Date(0),
            account: { id, email: own?.email || route.email || '' },
          }
      if (route.signIn) row.signIn = true
      if (route.sub) row.under = { sub: route.sub, email: route.email || '' }
      if (route.reach.length > 1) row.reach = route.reach
      rows.push(row)
    }
    memberships.forEach(membership => add(membership.account.id))
    Object.values(signIns).forEach(signIn => {
      add(signIn.id, { email: signIn.email })
      signIn.membership.forEach(membership => add(membership.account.id))
    })
    return rows
  }
)

/*
  A new organization member's personal account is empty, so when they have never
  chosen an account themselves they belong in the organization they joined first.
  Undefined once they have chosen, which includes selecting their own account.
*/
export const selectDefaultAccountId = createSelector([getActiveId, getMemberships], (activeId, memberships) =>
  activeId
    ? undefined
    : memberships.filter(member => !member.standalone).sort((a, b) => dateSort(b.created, a.created))[0]?.account.id
)

export const selectShowOrganizations = (state: State) =>
  !!state.accounts.membership.length ||
  !!Object.keys(getSignIns(state)).length ||
  !!state.accounts.standaloneOrganizations

export const selectActiveAccountId = createSelector(
  [optionalAccountId, getActiveId, getUserId],
  (accountId, activeId, userId) => accountId || activeId || userId
)

/** The row an account is looked at through (selectors/signIns selectRowOf): the selected row where none is named. */
export const selectRow = (state: State, accountId?: string): RowKey =>
  selectRowOf(state, selectActiveAccountId(state, accountId))

export type RowSaid = { accountId?: string; sub?: string; row?: RowKey }

/** The row an effect acts for, and its account: the row said (one it began in, or a read was made for); the account
 *  under the sign-in said (`sub`: an event that sign-in was sent); else the row the account — the selected one where
 *  none is named — is looked at through now. */
export function rowSaid(state: State, of?: string | RowSaid | void): { accountId: string; row: RowKey } {
  const said = typeof of === 'string' ? { accountId: of } : of || {}
  const accountId = said.accountId || selectActiveAccountId(state)
  return { accountId, row: said.row ?? rowFor(state, accountId, said.sub) }
}

export const isUserAccount = createSelector(
  [selectActiveAccountId, getUserId],
  (activeAccountId, userId) => activeAccountId === userId
)

export const selectActiveUser = createSelector(
  [selectActiveAccountId, selectMemberships, getUser],
  (accountId, memberships, user): IUserRef => {
    const membershipOrganizations = memberships.map(m => ({
      id: m.account.id || '',
      email: m.standalone ? '' : m.account.email || 'unknown',
      // Another sign-in's own account has no joining date: it reads as the person's own, with none.
      created: m.signIn ? undefined : m.created,
    }))
    return membershipOrganizations.find(m => m.id === accountId) || user
  }
)

const getThisMembership = createSelector([getUser], user => ({
  roleId: 'OWNER',
  roleName: 'Owner',
  license: 'UNKNOWN',
  created: user.created || new Date(),
  account: {
    id: user.id,
    email: user.email,
  },
}))

// The sign-in of the row an account is looked at through ('' the page's own person): the selected row's where none
// is named.
const selectRowSub = (state: State, accountId?: string) => rowSub(selectRow(state, accountId))

/* The membership the account is looked at as: that of its row's own sign-in (helpers/rowKey) — in an organization two
   people here belong to, each row has its own role. */
export const selectMembership = createSelector(
  [
    selectActiveAccountId,
    selectMemberships,
    getThisMembership,
    isUserAccount,
    getMemberships,
    getSignIns,
    selectRowSub,
  ],
  (accountId, memberships, thisMembership, isUserAccount, primary, signIns, sub): IMembership => {
    if (isUserAccount) return thisMembership
    const found = memberships.find(m => m.account.id === accountId)
    const own = (sub ? signIns[sub]?.membership : primary)?.find(m => m.account.id === accountId)
    if (found && own) return { ...found, ...own }
    return found || (console.log('CANT FIND THIS MEMBERSHIP', thisMembership.license), thisMembership)
  }
)
