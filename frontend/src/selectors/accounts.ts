import { createSelector } from 'reselect'
import { dateSort } from '../helpers/utilHelper'
import { State } from '../store'
import { getUserId, getUser, getActiveId, optionalAccountId, getMemberships } from './state'
import { getSignIns, selectAccountRoutes } from './signIns'

/* Every row of the switcher beyond the page's own account (selectors/signIns): the organizations the primary
   belongs to, then each further sign-in's own account and its organizations — one row per id. A row another sign-in
   serves says so (`via`); one more than one sign-in reaches lists them (`reach`), which is the choice offered. */
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
      if (route.sub) row.via = { sub: route.sub, email: route.email || '' }
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

export const selectMembership = createSelector(
  [selectActiveAccountId, selectMemberships, getThisMembership, isUserAccount],
  (accountId, memberships, thisMembership, isUserAccount): IMembership => {
    if (isUserAccount) return thisMembership
    return (
      memberships.find(m => m.account.id === accountId) ||
      (console.log('CANT FIND THIS MEMBERSHIP', thisMembership.license), thisMembership)
    )
  }
)
