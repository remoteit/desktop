import { createSelector } from 'reselect'
import { getUserId, getUser, getActiveId, optionalAccountId, getMemberships } from './state'

export const getActiveAccountId = createSelector(
  [optionalAccountId, getActiveId, getUserId],
  (accountId, activeId, userId) => accountId || activeId || userId
)

export const isUserAccount = createSelector(
  [getActiveAccountId, getUserId],
  (activeAccountId, userId) => activeAccountId === userId
)

export const getActiveUser = createSelector(
  [getActiveAccountId, getMemberships, getUser],
  (accountId, memberships, user): IUserRef => {
    const membershipOrganizations = memberships.map(m => ({
      id: m.account.id || '',
      email: m.account.email || 'unknown',
      created: m.created,
    }))
    return membershipOrganizations.find(m => m.id === accountId) || user
  }
)

const getThisMembership = createSelector([getUser], user => ({
  roleId: 'OWNER',
  roleName: 'Owner',
  license: 'UNKNOWN',
  // license: remoteitLicense?.valid ? 'LICENSED' : 'UNLICENSED',
  created: user.created || new Date(),
  account: {
    id: user.id,
    email: user.email,
  },
}))

export const selectMembership = createSelector(
  [getActiveAccountId, getMemberships, getThisMembership, isUserAccount],
  (accountId, memberships, thisMembership, isUserAccount): IMembership => {
    if (isUserAccount) return thisMembership
    return (
      memberships.find(m => m.account.id === accountId) ||
      (console.log('CANT FIND THIS MEMBERSHIP', thisMembership.license), thisMembership)
    )
  }
)
