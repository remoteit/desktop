import { createSelector } from 'reselect'
import { REMOTEIT_PRODUCT_ID } from '../models/plans'
import { PENDING_FEATURES, PENDING_FEATURE_DEFAULT } from '../constants'
import {
  getUser,
  getOrganizations,
  getPlans,
  getLimitsOverride,
  getPlansTests,
  optionalCustomerId,
  optionalSecondParam,
} from './state'
import { selectActiveAccountId, isUserAccount, selectActiveUser } from './accounts'
import { defaultState, canMemberView, DEFAULT_ROLE } from '../models/organization'
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

export const selectOrganizationReseller = createSelector([selectOrganization], organization => {
  return organization.reseller
})

export const selectResellerRef = createSelector([selectOrganizationReseller, getUser], (reseller, user) => {
  return reseller || user.reseller
})

export const selectCustomer = createSelector(
  [selectOrganizationReseller, optionalSecondParam],
  (reseller, customerId) => {
    return reseller?.customers.find(c => c.id === customerId)
  }
)

export const selectRole = createSelector([selectOrganization, selectMembership], (organization, membership) => {
  return organization.roles?.find(r => r.id === membership.roleId) || DEFAULT_ROLE
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

export const selectLimits = createSelector([selectOrganization], (organization): ILimit[] => {
  return organization.limits || []
})

export const selectLimit = createSelector(
  [selectLimits, optionalSecondParam],
  (limits, limitName): ILimit | undefined => limits.find(limit => limit.name === limitName)
)

/* Every feature gate in the app reads this: the account's licensed limits, with the
   Test page's overrides applied on top. Overrides are a PERSONAL-account tool — an
   organization's real entitlements are never faked, so what you see on an org is what
   its license actually grants. */
export const selectLimitsLookup = createSelector(
  [selectLimits, isUserAccount, getLimitsOverride],
  (baseLimits, isUserAccount, limitsOverride): ILookup<ILimit['value']> => {
    const result: ILookup<ILimit['value']> = {}
    // Flags this build knows about but no license carries yet: worth their dev default
    // until the API says otherwise, and — being named — something an override can take a
    // position on, which a name the lookup has never seen would not be.
    PENDING_FEATURES.forEach(name => (result[name] = PENDING_FEATURE_DEFAULT))
    baseLimits.forEach(l => (result[l.name] = l.value))
    if (isUserAccount)
      Object.keys(result).forEach(name => {
        if (limitsOverride[name] !== undefined) result[name] = limitsOverride[name]
      })
    return result
  }
)

export type IFeature = { name: string; value: boolean; pending?: boolean }

/* The boolean features the Test page lists: the ones this account's license mentions,
   plus the ones this build forward-declares. `pending` is the difference between "the
   license said no" and "no license has mentioned it yet" — the second is a flag still
   soft-launching, where the Test page switch is the only way to see the feature. */
export const selectFeatures = createSelector([selectLimits], (limits): IFeature[] => {
  const features: IFeature[] = limits
    .filter(l => typeof l.value === 'boolean')
    .map(l => ({ name: l.name, value: l.value as boolean }))
  for (const name of PENDING_FEATURES)
    if (!features.some(f => f.name === name)) features.push({ name, value: PENDING_FEATURE_DEFAULT, pending: true })
  return features
})

export const selectLicensesWithLimits = createSelector([selectLicenses, selectLimits], (licenses, limits) => {
  return {
    licenses: licenses.map(license => ({
      ...license,
      limits: limits.filter(limit => limit.license?.id === license.id),
    })),
    limits: limits.filter(limit => !limit.license),
  }
})

export const selectPermissions = createSelector(
  [selectMembership, selectOrganization],
  (membership, organization): IPermission[] => {
    return organization.roles.find(r => r.id === membership.roleId)?.permissions || []
  }
)

// Registration requires MANAGE, matching what the API enforces: graphql-api
// gates User.registrationCode/registrationCommand and RegistrationService on
// canManage() -> RolePermission.MANAGE.
//
// It is tempting to read the Roles screen's ADMIN blurb ("...and device
// registrations") as meaning ADMIN is required — it is not. A short-lived
// REGISTER permission existed in 2022 and was withdrawn (graphql-api ece69b36
// "revert REGISTER permission"), which is also why some copy used to ask for a
// non-existent "register permission".
export const selectCanRegister = createSelector([selectPermissions], (permissions): boolean =>
  permissions.includes('MANAGE')
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

export const selectAvailableUsers = createSelector(
  [state => selectLimit(state, undefined, 'org-users')],
  (limit): number => Math.max(limit?.value - limit?.actual || -1, 0)
)
