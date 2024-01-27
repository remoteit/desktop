import { createSelector } from 'reselect'
import { REMOTEIT_PRODUCT_ID } from '../models/plans'
import {
  getOrganizations,
  getPlans,
  getTestLimits,
  getLimitsOverride,
  getPlansTests,
  optionalSecondParam,
} from './state'
import { selectActiveAccountId, isUserAccount, getActiveUser } from './accounts'
import { defaultState, canMemberView } from '../models/organization'
import { selectMembership } from './accounts'

export const selectOrganization = createSelector(
  [selectActiveAccountId, getOrganizations, selectMembership],
  (accountId, organizations, membership) => {
    const organization = organizations[accountId] || defaultState
    return {
      ...organization,
      ...membership,
    }
  }
)

export const selectOrganizationName = createSelector(
  [selectOrganization],
  (organization): string => organization.name || 'Unknown'
)

export const selectMembersWithAccess = createSelector(
  [selectOrganization, optionalSecondParam],
  (organization, instance?: IInstance) =>
    organization.members.filter(m => canMemberView(organization.roles, m, instance)) || []
)

export const selectRemoteitPlans = createSelector([getPlans], plans => {
  return plans.filter(p => p.product.id === REMOTEIT_PRODUCT_ID)
})

export const selectLicenses = createSelector([getPlansTests, selectOrganization], (tests, organization) => {
  if (tests.license) return tests.licenses
  else return organization.licenses
})

export const selectRemoteitLicense = createSelector(
  [selectLicenses],
  (licenses): ILicense | null => licenses.find(l => l.plan.product.id === REMOTEIT_PRODUCT_ID) || null
)

export const selectPlan = createSelector([selectRemoteitPlans, selectRemoteitLicense], (plans, license) => {
  return plans.find(plan => plan.id === license?.plan?.id)
})

export const selectLimits = createSelector(
  [selectOrganization, getTestLimits],
  (organization, testLimits) => testLimits || organization.limits
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
