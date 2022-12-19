import { createSelector } from 'reselect'
import { ApplicationState } from '../store'
import { getActiveAccountId, isUserAccount } from './accounts'
import { memberOrganization, IOrganizationState } from '../models/organization'

const getAccounts = (state: ApplicationState) => state.organization.accounts
const getTestLimits = (state: ApplicationState) => (state.plans.tests.limit ? state.plans.tests.limits : undefined)
const getLimitsOverride = (state: ApplicationState) => state.ui.limitsOverride

export const getOrganization = createSelector(
  [getAccounts, getActiveAccountId],
  (accounts, activeAccountId): IOrganizationState => memberOrganization(accounts, activeAccountId)
)

export const selectBaseLimits = createSelector(
  [getOrganization, getTestLimits],
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
