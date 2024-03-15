import { createSelector } from 'reselect'
import { REMOTEIT_PRODUCT_ID } from '../models/plans'
import {
  getUser,
  getOrganizations,
  getPlans,
  getTestLimits,
  getLimitsOverride,
  getPlansTests,
  optionalCustomerId,
  optionalSecondParam,
} from './state'
import { selectActiveAccountId, isUserAccount, selectActiveUser } from './accounts'
import { defaultState, canMemberView } from '../models/organization'
import { lookupLicenseManagePath } from '../models/plans'
import { selectMembership } from './accounts'

export const selectOrganization = createSelector(
  [selectActiveAccountId, getOrganizations, selectMembership, getUser],
  (accountId, organizations, myMembership, user) => {
    const organization = organizations[accountId] || defaultState
    const membership: IOrganizationMember = { ...myMembership, user, organizationId: organization.id }
    return {
      ...organization,
      membership,
    }
  }
)

export const selectOrganizationName = createSelector(
  [selectOrganization],
  (organization): string => organization.name || 'Unknown'
)

export const selectReseller = createSelector([selectOrganization], organization => {
  return organization.reseller
})

export const selectMembersWithAccess = createSelector(
  [selectOrganization, optionalSecondParam],
  (organization, instance?: IInstance) =>
    organization.members.filter(m => canMemberView(organization.roles, m, instance)) || []
)

export const selectRemoteitPlans = createSelector([getPlans], plans => {
  return plans.filter(p => p.product.id === REMOTEIT_PRODUCT_ID)
})

export const selectLicenses = createSelector(
  [getPlansTests, selectOrganization, optionalCustomerId],
  (tests, organization, customerId): ILicense[] => {
    if (tests.license) return tests.licenses
    if (organization.reseller && customerId) {
      const customer = organization.reseller.customers.find(c => c.id === customerId)
      return customer ? [customer.license] : []
    }
    return organization.licenses
  }
)

export const selectRemoteitLicense = createSelector(
  [selectLicenses],
  (licenses): ILicense | null => licenses.find(l => l.plan.product.id === REMOTEIT_PRODUCT_ID) || null
)

export const selectPlan = createSelector([selectRemoteitPlans, selectRemoteitLicense], (plans, license) => {
  return plans.find(plan => plan.id === license?.plan?.id)
})

export const selectLimits = createSelector(
  [selectOrganization, optionalCustomerId, getTestLimits],
  (organization, customerId, testLimits): ILimit[] => {
    if (organization.reseller && customerId)
      return organization.reseller.customers.find(c => c.id === customerId)?.limits || []
    return testLimits || organization.limits || []
  }
)

export const selectLimit = createSelector(
  [selectLimits, optionalSecondParam],
  (limits, limitName) => limits.find(limit => limit.name === limitName)?.value || 'P1D'
)

export const selectLimitsLookup = createSelector(
  [selectLimits, isUserAccount, getLimitsOverride],
  (baseLimits, isUserAccount, limitsOverride): ILookup<ILimit['value']> => {
    let result: ILookup<boolean> = {}
    baseLimits.forEach(l => {
      result[l.name] = limitsOverride[l.name] === undefined || !isUserAccount ? l.value : limitsOverride[l.name]
    })
    return result
  }
)

export const selectLicensesWithLimits = createSelector([selectLicenses, selectLimits], (licenses, limits) => {
  return {
    licenses: licenses.map(license => ({
      ...license,
      managePath: lookupLicenseManagePath(license.plan.product.id),
      limits: limits.filter(limit => limit.license?.id === license.id),
    })),
    limits: limits.filter(limit => !limit.license),
  }
})

export const selectPermissions = createSelector(
  [selectMembership, selectOrganization],
  (membership, organization): IPermission[] | undefined => {
    return organization.roles.find(r => r.id === membership.roleId)?.permissions
  }
)

export const selectOwner = createSelector(
  [selectActiveUser, selectRemoteitLicense],
  (user, license): IOrganizationMember | undefined => {
    return {
      created: user.created || new Date(),
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
