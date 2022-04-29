import { createModel } from '@rematch/core'
import {
  graphQLSetOrganization,
  graphQLRemoveOrganization,
  graphQLSetMembers,
  graphQLRemoveMembers,
  graphQLSetSAML,
  graphQLCreateRole,
  graphQLUpdateRole,
  graphQLRemoveRole,
} from '../services/graphQLMutation'
import { graphQLBasicRequest } from '../services/graphQL'
import { getActiveAccountId, getActiveUser, getAccountIds, getMembership, isUserAccount } from './accounts'
import { selectRemoteitLicense, selectBaseLimits } from './plans'
import { ApplicationState } from '../store'
import { AxiosResponse } from 'axios'
import { RootModel } from './rootModel'

export const PERMISSION: ILookup<{ name: string; description: string; icon: string; system?: boolean }> = {
  VIEW: { name: 'View', description: 'See devices and their current state', icon: 'eye', system: true },
  CONNECT: { name: 'Connect', description: 'Connect to devices', icon: 'arrow-right' },
  SCRIPTING: { name: 'Script', description: 'Run device scripts', icon: 'code' },
  MANAGE: { name: 'Manage', description: 'Manage devices', icon: 'pencil' },
  ADMIN: { name: 'Administer', description: 'Manage organization users', icon: 'user-hard-hat' },
}

export const DEFAULT_ROLE: IOrganizationRole = {
  id: '',
  name: '',
  tag: { operator: 'ANY', values: [] },
  permissions: ['VIEW', 'CONNECT'],
}

export const SYSTEM_ROLES: IOrganizationRole[] = [
  {
    id: 'OWNER',
    name: 'Owner',
    system: true,
    permissions: ['VIEW', 'MANAGE', 'CONNECT', 'SCRIPTING', 'ADMIN'],
    disabled: true,
  },
]

export const graphQLLicensesLimits = `
  licenses {
    id
    updated
    created
    expiration
    valid
    quantity
    plan {
      id
      name
      description
      duration
      commercial
      billing
      product {
        id
        name
        description
      }
    }
    subscription {
      total
      status
      price {
        id
        amount
        currency
        interval
      }
      card {
        brand
        month
        year
        last
        name
        email
        phone
        postal
        country
        expiration
      }
    }
  }
  limits {
    name
    value
    actual
    license {
      id
    }
  }`

export const graphQLOrganization = `
  organization {
    id
    name
    require2FA
    domain
    samlEnabled
    providers
    verificationCNAME
    verificationValue
    verified
    created
    roles {
      id
      name
      system
      permissions
      tag {
        operator
        values
      }
    }
    members {
      created
      customRole {
        id
        name
      }
      license
      user {
        id
        email
      }
    }
  }`

export type IOrganizationState = {
  id: string
  name: string
  created?: Date
  account?: IUserRef
  licenses: ILicense[]
  limits: ILimit[]
  members: IOrganizationMember[]
  roles: IOrganizationRole[]
  require2FA: boolean
  domain?: string
  samlEnabled: boolean
  providers: null | IOrganizationProvider[]
  verificationCNAME?: string
  verificationValue?: string
  verified: boolean
}

const defaultState: IOrganizationState = {
  id: '',
  name: '',
  require2FA: false,
  domain: undefined,
  samlEnabled: false,
  providers: null,
  verificationCNAME: undefined,
  verificationValue: undefined,
  verified: false,
  created: undefined,
  members: [],
  roles: [...SYSTEM_ROLES],
  licenses: [],
  limits: [],
}

type IOrganizationAccountState = {
  initialized: boolean
  updating: boolean
  all: ILookup<IOrganizationState>
}

const defaultAccountState: IOrganizationAccountState = {
  initialized: false,
  updating: false,
  all: {},
}

export default createModel<RootModel>()({
  state: { ...defaultAccountState },
  effects: dispatch => ({
    async init() {
      await dispatch.organization.fetch()
      dispatch.organization.set({ initialized: true })
    },

    async fetch(_, state) {
      const ids: string[] = getAccountIds(state)
      const accountQueries = ids.map(
        (id, index) => `
        _${index}: account(id: "${id}") {
          ${graphQLOrganization}
          ${graphQLLicensesLimits}
        }`
      )
      const result = await graphQLBasicRequest(
        ` query {
            login {
              ${accountQueries.join('\n')}
            }
          }`
      )
      if (result === 'ERROR') return
      const all = await dispatch.organization.parse({ result, ids })
      if (all) await dispatch.organization.set({ all })
      else await dispatch.organization.clearActive()
    },

    async parse({ result, ids }: { result: AxiosResponse<any> | undefined; ids: string[] }) {
      const data = result?.data?.data?.login
      let orgs: IOrganizationAccountState['all'] = {}
      ids.forEach((id, index) => {
        const { organization, licenses, limits } = data[`_${index}`]
        orgs[id] = parseOrganization(organization)
        orgs[id].licenses = licenses?.map(l => parseLicense(l))
        orgs[id].limits = limits
      })
      return orgs
    },

    async setOrganization(params: IOrganizationSettings, state) {
      let organization = getOrganization(state)
      await dispatch.organization.setActive({ ...params, id: organization.id || state.auth.user?.id })
      const result = await graphQLSetOrganization(params)
      if (result === 'ERROR') {
        await dispatch.organization.fetch()
      } else if (!organization.id) {
        dispatch.ui.set({ successMessage: 'Your organization has been created.' })
      }
    },

    async setSAML(params: { enabled: boolean; metadata?: string }) {
      dispatch.organization.set({ updating: true })
      const result = await graphQLSetSAML(params)
      if (result !== 'ERROR') {
        dispatch.ui.set({ successMessage: params.enabled ? 'SAML enabled and metadata uploaded.' : 'SAML disabled.' })
      }
      await dispatch.organization.fetch()
      dispatch.organization.set({ updating: false })
    },

    async setMembers(members: IOrganizationMember[] = [], state) {
      const organization = getOrganization(state)
      let updated = [...organization.members]

      members.forEach(m => {
        const index = updated.findIndex(u => u.user.email === m.user.email)
        if (index > -1) updated[index] = m
        else updated.push(m)
      })
      await dispatch.organization.setActive({ members: updated })

      const action = updated.length > organization.members.length ? 'added' : 'updated'
      const member = members[0]
      const result = await graphQLSetMembers(
        members.map(member => member.user.email),
        organization.id,
        member.roleId,
        member.license
      )
      if (result === 'ERROR') {
        dispatch.organization.fetch()
      } else if (action === 'added') {
        dispatch.ui.set({
          successMessage:
            members.length > 1
              ? `${members.length} members have been ${action}.`
              : `The member '${members[0].user.email}' has been ${action}.`,
        })
      }
    },

    async removeMember(member: IOrganizationMember, state) {
      const organization = getOrganization(state)
      const result = await graphQLRemoveMembers([member.user.email], organization.id)
      if (result !== 'ERROR') {
        dispatch.organization.setActive({
          members: organization.members.filter(m => m.user.email !== member.user.email),
        })
        dispatch.ui.set({ successMessage: `Successfully removed ${member?.user?.email}.` })
      }
    },

    async removeOrganization(_, state) {
      const result = await graphQLRemoveOrganization()
      if (result !== 'ERROR') {
        dispatch.organization.clearActive()
        dispatch.ui.set({ successMessage: `Your organization has been removed.` })
      }
    },

    async setRole(role: IOrganizationRole, state) {
      let roles = [...getOrganization(state).roles]
      const index = roles.findIndex(r => r.id === role.id)
      const permissions: IPermission[] = ['CONNECT', 'MANAGE', 'SCRIPTING']

      let result
      if (index > -1) {
        roles[index] = role
        result = await graphQLUpdateRole({
          id: role.id,
          name: role.name,
          grant: role.permissions,
          revoke: permissions.filter(p => !role.permissions.includes(p)),
          tag: role.tag,
          accountId: getActiveAccountId(state),
        })
      } else {
        result = await graphQLCreateRole({ ...role, accountId: getActiveAccountId(state) })
        if (result !== 'ERROR') role.id = result?.data?.data?.createRole?.id
        roles.push(role)
      }

      if (result === 'ERROR') {
        dispatch.organization.fetch()
        return
      }

      dispatch.ui.set({
        successMessage: index > -1 ? `Successfully updated ${role.name}.` : `Successfully added ${role.name}.`,
      })

      await dispatch.organization.setActive({ roles })
      return role.id
    },

    async removeRole(role: IOrganizationRole, state) {
      let roles = [...getOrganization(state).roles]
      const index = roles.findIndex(r => r.id === role.id)
      if (index > -1) roles.splice(index, 1)
      const result = await graphQLRemoveRole(role.id, getActiveAccountId(state))

      if (result === 'ERROR') {
        dispatch.organization.fetch()
        return
      }

      dispatch.ui.set({ successMessage: `Successfully removed ${role.name}.` })
      dispatch.organization.setActive({ roles })
    },

    async clearActive() {
      dispatch.organization.setActive({ ...defaultState })
    },

    async setActive(params: ILookup<any>, state) {
      const id = getActiveAccountId(state)
      let org = { ...getOrganization(state) }
      Object.keys(params).forEach(key => (org[key] = params[key]))
      const all = { ...state.organization.all }
      all[id] = org
      dispatch.organization.set({ all })
    },
  }),
  reducers: {
    set(state: IOrganizationAccountState, params: ILookup<any>) {
      Object.keys(params).forEach(key => (state[key] = params[key]))
      return state
    },
    reset(state: IOrganizationAccountState) {
      state = { ...defaultAccountState }
      return state
    },
  },
})

export function getOwnOrganization(state: ApplicationState) {
  const id = state.auth.user?.id || ''
  return memberOrganization(state.organization.all, id)
}

export function getOrganization(state: ApplicationState, accountId?: string) {
  accountId = accountId || getActiveAccountId(state)
  return memberOrganization(state.organization.all, accountId)
}

export function memberOrganization(organization: ILookup<IOrganizationState>, accountId?: string) {
  return organization[accountId || ''] || { ...defaultState }
}

export function selectPermissions(state: ApplicationState, accountId?: string): IPermission[] | undefined {
  const membership = getMembership(state, accountId)
  const organization = getOrganization(state, accountId)
  return organization.roles.find(r => r.id === membership.roleId)?.permissions
}

export function selectLimitsLookup(state: ApplicationState, accountId?: string): ILookup<ILimit['value']> {
  const limits = selectBaseLimits(state, accountId)
  const notUser = !isUserAccount(state, accountId)

  const { limitsOverride } = state.ui
  let result = {}

  limits.forEach(l => {
    result[l.name] = limitsOverride[l.name] === undefined || notUser ? l.value : limitsOverride[l.name]
  })

  return result
}

export function parseOrganization(data: any): IOrganizationState {
  if (!data) return { ...defaultState }
  return {
    ...data,
    created: new Date(data.created),
    members: [
      ...data.members.map(m => ({
        ...m,
        roleId: m.customRole.id,
        roleName: m.customRole.name,
        created: new Date(m.created),
      })),
    ],
    roles: [
      ...defaultState.roles,
      ...data.roles.map(r => ({
        ...r,
        created: new Date(r.created),
      })),
    ],
  }
}

export function parseLicense(data) {
  if (!data) return null
  return {
    ...data,
    created: new Date(data.created),
    updated: new Date(data.updated),
    expiration: data.expiration && new Date(data.expiration),
    subscription: data.subscription && {
      ...data.subscription,
      card: data.subscription.card && {
        ...data.subscription.card,
        expiration: data.subscription.card.expiration && new Date(data.subscription.card.expiration),
      },
    },
  }
}

export function selectOwner(state: ApplicationState): IOrganizationMember | undefined {
  const user = getActiveUser(state)
  const license = selectRemoteitLicense(state)
  return (
    user && {
      created: new Date(user.created || ''),
      roleId: 'OWNER',
      license: license?.plan.commercial ? 'LICENSED' : 'UNLICENSED',
      organizationId: user.id,
      user: {
        id: user.id,
        email: user.email,
      },
    }
  )
}
