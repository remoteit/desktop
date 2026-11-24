import { createSelector } from 'reselect'
import { REMOTEIT_PRODUCT_ID } from '../models/plans'
import { byName } from '../helpers/utilHelper'
import { State } from '../store'
import {
  getUser,
  getUserId,
  getOrganizations,
  getMemberships,
  getPlans,
  getLimitsOverride,
  getPlansTests,
  optionalCustomerId,
  optionalSecondParam,
} from './state'
import { selectActiveAccountId, isUserAccount, selectActiveUser } from './accounts'
import { defaultState, canMemberView, DEFAULT_ROLE } from '../models/organization'
import { selectMembership, selectMemberships } from './accounts'
import { getSignIns, selectAccountRoutes } from './signIns'

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

// `via`: the sign-in a row is reached through when it is not the page's own person; `reach`: every sign-in that
// reaches it, where more than one does. A sign-in's own account is a row whether or not it is an organization.
export const selectOrganizationOptions = createSelector(
  [selectMemberships, getOrganizations],
  (memberships, organizations) =>
    memberships
      .map(m => {
        const org = organizations[m.account.id] || defaultState
        return {
          id: m.account.id,
          email: m.account.email,
          name: org.name || m.name || (m.signIn ? m.account.email : undefined),
          roleId: m.roleId,
          roleName: m.roleName,
          disabled: !org.id && !m.signIn,
          via: m.via,
          reach: m.reach,
          signIn: m.signIn,
        }
      })
      .sort(byName)
)

/* THE SWITCHER'S ROWS: one for each account an organization is reached through. With several sign-ins in use, an
   organization two of them belong to is a row under each — the page's own person's organizations, then each further
   sign-in's own account and its organizations — and picking a row is how the person says who they act as there
   (models/accounts selectAs). `sub` is the row's sign-in ('' the page's own person) and `account` its email; `role`s
   are that account's own; `shared` where another account here has a row for the same organization, which is when a
   row says whose it is; `serving` on the row whose account the organization is served by now — the one row of an
   organization that can be the selected one. */
export type SwitcherRow = {
  key: string
  id: string
  sub: string
  account: string
  email: string
  name?: string
  roleId: string
  roleName: string
  disabled: boolean
  signIn?: boolean
  shared: boolean
  serving: boolean
}

export const selectSwitcherRows = createSelector(
  [getMemberships, getSignIns, selectAccountRoutes, getOrganizations, (state: State) => state.user?.email || ''],
  (memberships, signIns, routes, organizations, userEmail): SwitcherRow[] => {
    const row = (sub: string, account: string, m: IMembership, signIn?: boolean): SwitcherRow => {
      const id = m.account.id
      const org = organizations[id] || defaultState
      return {
        key: `${sub}:${id}`,
        id,
        sub,
        account,
        email: m.account.email,
        name: org.name || m.name || (signIn ? m.account.email : undefined),
        roleId: m.roleId,
        roleName: m.roleName,
        disabled: !org.id && !signIn,
        ...(signIn && { signIn }),
        shared: (routes[id]?.reach.length || 0) > 1,
        serving: (routes[id]?.sub || '') === sub,
      }
    }
    const of = (sub: string, account: string, list: IMembership[]) => list.map(m => row(sub, account, m)).sort(byName)
    return [
      ...of('', userEmail, memberships),
      ...Object.values(signIns).flatMap(signIn => [
        row(
          signIn.sub,
          signIn.email,
          {
            roleId: 'OWNER',
            roleName: 'Owner',
            license: 'UNKNOWN',
            created: new Date(0),
            account: { id: signIn.id, email: signIn.email },
          },
          true
        ),
        ...of(signIn.sub, signIn.email, signIn.membership),
      ]),
    ]
  }
)

/** Whose an account's row is where more than one account here has one for it: the email of the account serving it
 *  now. Undefined where one account alone reaches it — nothing to say. */
export const selectServingAccount = (state: State, accountId?: string): string | undefined => {
  const route = accountId ? selectAccountRoutes(state)[accountId] : undefined
  return route && route.reach.length > 1 ? route.email || state.user?.email || '' : undefined
}

/** The organizations the page's own person belongs to, in their own role there: what a page about that one person
 *  lists (their notifications, the device they register). Their memberships, not the switcher's rows: another
 *  sign-in picked to serve a row does not end their membership, nor make its role theirs. */
export const selectPrimaryOrganizationOptions = createSelector(
  [getMemberships, getOrganizations],
  (memberships, organizations) =>
    memberships
      .map(m => {
        const org = organizations[m.account.id] || defaultState
        return {
          id: m.account.id,
          email: m.account.email,
          name: org.name || m.name,
          roleId: m.roleId,
          roleName: m.roleName,
          disabled: !org.id,
          // Registration requires MANAGE (selectCanRegister), here by the person's own role.
          canRegister: !!org.roles?.find(r => r.id === m.roleId)?.permissions?.includes('MANAGE'),
        }
      })
      .sort(byName)
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
    // Built FROM the limits the API returned: a name no license has mentioned is simply
    // absent (falsy), and there is nothing for a Test page override to attach to.
    baseLimits.forEach(l => (result[l.name] = l.value))
    if (isUserAccount)
      Object.keys(result).forEach(name => {
        if (limitsOverride[name] !== undefined) result[name] = limitsOverride[name]
      })
    return result
  }
)

const NO_LIMITS: ILookup<ILimit['value']> = {}

export const selectUserLimitsLookup = (state: State): ILookup<ILimit['value']> => {
  const userId = getUserId(state)
  // An empty id would fall through selectActiveAccountId to the active account's limits
  return userId ? selectLimitsLookup(state, userId) : NO_LIMITS
}

export type IFeature = { name: string; value: boolean }

/* The boolean features the Test page lists: exactly the ones the signed-in user's license
   mentions. A feature no license carries has no row — it is granted (Admin → Add-ons for
   the add-ons), not switched on here. */
export const selectFeatures = createSelector([selectLimits], (limits): IFeature[] =>
  limits.filter(l => typeof l.value === 'boolean').map(l => ({ name: l.name, value: l.value as boolean }))
)

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
  [selectActiveUser, selectRemoteitLicense, selectMembership],
  (user, license, membership): IOrganizationMember | undefined => {
    if (membership.standalone) return undefined
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
