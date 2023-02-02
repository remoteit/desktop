import { createSelector } from 'reselect'
import { getOrganizations, getTestLimits, getLimitsOverride } from './state'
import { getActiveAccountId, selectMembership, isUserAccount } from './accounts'
import { defaultState } from '../models/organization'

export const selectOrganization = createSelector(
  [getActiveAccountId, selectMembership, getOrganizations],
  (accountId, membership, organizations) =>
    organizations[accountId] || {
      ...defaultState,
      name: membership.name,
    }
)

export const selectBaseLimits = createSelector(
  [selectOrganization, getTestLimits],
  (organization, testLimits) => testLimits || organization.limits
)

export const selectLimitsLookup = createSelector(
  [selectBaseLimits, isUserAccount, getLimitsOverride],
  (baseLimits, isUserAccount, limitsOverride): ILookup<ILimit['value']> => {
    let result: ILookup<boolean> = {}

    baseLimits.forEach(l => {
      result[l.name] = limitsOverride[l.name] === undefined || !isUserAccount ? l.value : limitsOverride[l.name]
    })

    return result
  }
)
