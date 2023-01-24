import { createSelector } from 'reselect'
import { getUserId, getUser, getActiveId, optionalAccountId, getMemberships } from './state'

export const getActiveAccountId = createSelector(
  [getActiveId, getUserId, optionalAccountId],
  (activeId, userId, accountId) => accountId || activeId || userId
)

export const isUserAccount = createSelector(
  [getActiveAccountId, getUserId],
  (activeAccountId, userId) => activeAccountId === userId
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
    if (isUserAccount) {
      console.log('RETURN THIS MEMBERSHIP', thisMembership.license)
      return thisMembership
    }
    return (
      memberships.find(m => m.account.id === accountId) ||
      (console.log('CANT FIND THIS MEMBERSHIP', thisMembership.license), thisMembership)
    )
  }
)
