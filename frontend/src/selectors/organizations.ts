import { createSelector } from 'reselect'
import { REMOTEIT_PRODUCT_ID } from '../models/plans'
import { getOrganizations, getTestLimits, getLimitsOverride, getPlansTests } from './state'
import { getActiveAccountId, isUserAccount, getActiveUser } from './accounts'
import { selectMembership } from './accounts'
import { defaultState } from '../models/organization'

export const selectOrganization = createSelector(
  [getActiveAccountId, getOrganizations],
  (accountId, organizations) => organizations[accountId] || defaultState
)

export const selectOrganizationName = createSelector(
  [selectOrganization],
  (organization): string => organization.name || 'Unknown'
)

export const selectLicenses = createSelector([getPlansTests, selectOrganization], (tests, organization) => {
  if (tests.license) return tests.licenses
  else return organization.licenses
})

export const selectRemoteitLicense = createSelector(
  [selectLicenses],
  (licenses): ILicense | null => licenses.find(l => l.plan.product.id === REMOTEIT_PRODUCT_ID) || null
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

export const selectPermissions = createSelector(
  [selectMembership, selectOrganization],
  (membership, organization): IPermission[] | undefined => {
    return organization.roles.find(r => r.id === membership.roleId)?.permissions
  }
)

export const selectOwner = createSelector(
  [getActiveUser, selectRemoteitLicense],
  (user, license): IOrganizationMember | undefined => {
    return {
      created: new Date(user.created || ''),
      roleId: 'OWNER',
      license: license?.plan.commercial ? 'LICENSED' : 'UNLICENSED',
      organizationId: user.id,
      user: {
        id: user.id,
        email: user.email,
      },
    }
  }
)
