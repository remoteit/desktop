import { createModel } from '@rematch/core'
import {
  graphQLSetOrganization,
  graphQLRemoveOrganization,
  graphQLSetMembers,
  graphQLRemoveMembers,
  graphQLSetIdentityProvider,
  graphQLCreateRole,
  graphQLUpdateRole,
  graphQLRemoveRole,
} from '../services/graphQLMutation'
import { graphQLBasicRequest } from '../services/graphQL'
import { getActiveUser, getAccountIds } from './accounts'
import { selectMembership } from '../selectors/accounts'
import { getActiveAccountId } from '../selectors/accounts'
import { selectOrganization } from '../selectors/organizations'
import { selectRemoteitLicense } from '../selectors/plans'
import { ApplicationState } from '../store'
import { AxiosResponse } from 'axios'
import { RootModel } from '.'

export const PERMISSION: ILookup<{
  name: string
  description: string
  icon: string
  system?: boolean
  user?: boolean
  hidden?: boolean
}> = {
  VIEW: { name: 'View', description: 'See devices and their current state', icon: 'eye', system: true },
  CONNECT: { name: 'Connect', description: 'Connect to device services', icon: 'arrow-right' },
  SCRIPTING: { name: 'Script', description: 'Run device scripts', icon: 'scroll', hidden: true },
  MANAGE: {
    name: 'Manage',
    description: 'Edit, delete, register, transfer and share devices and networks',
    icon: 'pencil',
  },
  ADMIN: { name: 'Administer', description: 'Manage organization tags and members', icon: 'user-tag', user: true },
}

export const DEFAULT_ROLE: IOrganizationRole = {
  id: '',
  name: '',
  tag: { operator: 'ANY', values: [] },
  permissions: ['VIEW', 'CONNECT'],
  access: 'NONE',
}

export const SYSTEM_ROLES: IOrganizationRole[] = [
  {
    id: 'OWNER',
    name: 'Owner',
    system: true,
    permissions: ['VIEW', 'MANAGE', 'CONNECT', 'SCRIPTING', 'ADMIN'],
    disabled: true,
    access: 'ALL',
  },
  {
    id: 'GUEST',
    name: 'Guest',
    system: true,
    permissions: ['VIEW', 'CONNECT'],
    disabled: true,
    access: 'NONE',
  },
]

export type IOrganizationState = {
  id: string
  name: string
  created?: Date
  account?: IUserRef
  licenses: ILicense[]
  limits: ILimit[]
  guests: IGuest[]
  members: IOrganizationMember[]
  roles: IOrganizationRole[]
  domain?: string
  identityProvider?: {
    type: string
    clientId: string
    issuer: string
  }
  providers: null | IOrganizationProvider[]
  verificationCNAME?: string
  verificationValue?: string
  verified: boolean
  guestsLoaded: boolean
}

export const defaultState: IOrganizationState = {
  id: '',
  name: '',
  domain: undefined,
  identityProvider: undefined,
  providers: null,
  verificationCNAME: undefined,
  verificationValue: undefined,
  verified: false,
  created: undefined,
  members: [],
  roles: [...SYSTEM_ROLES],
  licenses: [],
  limits: [],
  guests: [],
  guestsLoaded: false,
}

type IOrganizationAccountState = {
  initialized: boolean
  updating: boolean
  accounts: ILookup<IOrganizationState>
}

const defaultAccountState: IOrganizationAccountState = {
  initialized: false,
  updating: false,
  accounts: {},
}

export default createModel<RootModel>()({
  state: { ...defaultAccountState },
  effects: dispatch => ({
    async init() {
      await dispatch.organization.fetch()
      dispatch.organization.set({ initialized: true })
    },

    async fetch(_: void, state) {
      const ids: string[] = getAccountIds(state)
      const accountQueries = ids.map(
        (id, index) => `
        _${index}: account(id: "${id}") {
          organization {
            id
            name
            domain
            created
            verified
            verificationCNAME
            verificationValue
            roles {
              id
              name
              system
              permissions
              access
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
            providers
            identityProvider {
              type
              clientId
              issuer
            }
          }
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
          }
        }`
      )
      const result = await graphQLBasicRequest(
        ` query Organizations {
            login {
              ${accountQueries.join('\n')}
            }
          }`
      )
      if (result === 'ERROR') return
      const accounts = await dispatch.organization.parse({ result, ids })
      if (accounts) await dispatch.organization.set({ accounts })
      else await dispatch.organization.clearActive()
    },

    async fetchGuests(_: void, state) {
      const accountId = getActiveAccountId(state)
      const result = await graphQLBasicRequest(
        ` query Guests($id: String) {
            login {
              account(id: $id) {
                guest {
                  user {
                    id
                    email
                  }
                  devices {
                    id
                  }
                  networks {
                    id
                  }
                }
              }
            }
          }`,
        { id: accountId }
      )
      if (result === 'ERROR') return
      const guests = parseGuests(result)
      await dispatch.organization.setActive({ guests, guestsLoaded: true, id: accountId })
    },

    async parse({ result, ids }: { result: AxiosResponse<any> | undefined; ids: string[] }) {
      const data = result?.data?.data?.login
      let orgs: IOrganizationAccountState['accounts'] = {}
      ids.forEach((id, index) => {
        if (!data[`_${index}`]) return
        const { organization, licenses, limits } = data[`_${index}`]
        orgs[id] = parseOrganization(organization)
        orgs[id].licenses = licenses?.map(l => parseLicense(l))
        orgs[id].limits = limits
      })
      return orgs
    },

    async setOrganization(params: IOrganizationSettings, state) {
      let organization = selectOrganization(state)
      await dispatch.organization.setActive({ ...params, id: organization.id || state.auth.user?.id })
      const result = await graphQLSetOrganization(params)
      if (result !== 'ERROR') {
        if (!organization.id) dispatch.ui.set({ successMessage: 'Your organization has been created.' })
      }
      await dispatch.organization.fetch()
    },

    async setIdentityProvider(params: IIdentityProviderSettings) {
      dispatch.organization.set({ updating: true })
      const result = await graphQLSetIdentityProvider(params)
      if (result !== 'ERROR') {
        dispatch.ui.set({
          successMessage: params.enabled ? `${params.type} enabled.` : `${params.type} disabled.`,
        })
      } else {
        dispatch.ui.set({
          errorMessage: `${params.type} update failed, please validate your form data.`,
        })
      }
      await dispatch.organization.fetch()
      dispatch.organization.set({ updating: false })
    },

    async setMembers(members: IOrganizationMember[] = [], state) {
      const organization = selectOrganization(state)
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
      if (result !== 'ERROR') {
        dispatch.ui.set({
          successMessage:
            members.length > 1
              ? `${members.length} members have been ${action}.`
              : `The member '${members[0].user.email}' has been ${action}.`,
        })
      }
      dispatch.organization.fetch()
    },

    async removeMember(member: IOrganizationMember, state) {
      const organization = selectOrganization(state)
      const result = await graphQLRemoveMembers([member.user.email], organization.id)
      if (result !== 'ERROR') {
        dispatch.organization.setActive({
          members: organization.members.filter(m => m.user.email !== member.user.email),
        })
        dispatch.ui.set({ successMessage: `Successfully removed ${member?.user?.email}.` })
      }
    },

    async removeOrganization(_: void, state) {
      const result = await graphQLRemoveOrganization()
      if (result !== 'ERROR') {
        dispatch.organization.clearActive()
        dispatch.ui.set({ successMessage: `Your organization has been removed.` })
      }
    },

    async setRole(role: IOrganizationRole, state) {
      let roles = [...selectOrganization(state).roles]
      const index = roles.findIndex(r => r.id === role.id)
      const permissions = Object.keys(PERMISSION) as IPermission[]
      const data = {
        id: role.id,
        name: role.name,
        grant: role.permissions,
        revoke: permissions.filter(p => !role.permissions.includes(p)),
        tag: role.tag,
        accountId: getActiveAccountId(state),
      }

      let result
      if (index > -1) {
        roles[index] = role
        result = await graphQLUpdateRole(data)
      } else {
        result = await graphQLCreateRole(data)
        if (result !== 'ERROR') role.id = result?.data?.data?.createRole?.id
        roles.push(role)
        dispatch.ui.set({ redirect: `/organization/roles/${role.id}` })
      }

      if (result === 'ERROR') {
        dispatch.organization.fetch()
        return
      }

      dispatch.ui.set({
        successMessage: index > -1 ? `Successfully updated ${role.name}.` : `Successfully added ${role.name}.`,
      })

      await dispatch.organization.setActive({ roles })
    },

    async removeRole(role: IOrganizationRole, state) {
      let roles = [...selectOrganization(state).roles]
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
      const id = params.id || getActiveAccountId(state)
      let org = { ...selectOrganization(state, id) }
      Object.keys(params).forEach(key => (org[key] = params[key]))
      const accounts = { ...state.organization.accounts }
      accounts[id] = org
      dispatch.organization.set({ accounts })
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

function parseGuests(result: AxiosResponse<any> | undefined) {
  const guest = result?.data?.data?.login?.account?.guest || []
  const parsed: IOrganizationState['guests'] = guest.map(g => ({
    id: g.user.id,
    email: g.user.email || g.user.id,
    deviceIds: g.devices.map(d => d.id),
    networkIds: g.networks.map(n => n.id),
  }))
  return parsed
}

export function parseOrganization(data: any): IOrganizationState {
  if (!data) return { ...defaultState }
  return {
    ...defaultState,
    ...data,
    // verified: true, // for development
    // identityProvider { // for development
    //   type:
    //   clientId
    //   issuer
    // },
    created: new Date(data.created),
    members: [
      ...data.members.map(m => ({
        ...m,
        roleId: m.customRole.id,
        roleName: m.customRole.name,
        created: new Date(m.created),
        user: {
          email: m.user.email || '',
          id: m.user.id || '',
        },
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

export function getOwnOrganization(state: ApplicationState) {
  const id = state.auth.user?.id || ''
  return selectOrganization(state, id)
}

export function getOrganizationName(state: ApplicationState, accountId?: string): string {
  return selectOrganization(state, accountId).name || 'Unknown'
}

export function selectPermissions(state: ApplicationState, accountId?: string): IPermission[] | undefined {
  const membership = selectMembership(state, accountId)
  const organization = selectOrganization(state, accountId)
  return organization.roles.find(r => r.id === membership.roleId)?.permissions
}

export function selectMembersWithAccess(state: ApplicationState, instance?: IInstance) {
  const organization = selectOrganization(state)
  return organization.members.filter(m => canMemberView(organization.roles, m, instance)) || []
}

export function canMemberView(roles: IOrganizationRole[], member: IOrganizationMember, instance?: IInstance) {
  if (!instance) return true
  const role = roles.find(r => r.id === member?.roleId)
  return canRoleView(role, instance)
}

export function canRoleView(role?: IOrganizationRole, instance?: IInstance) {
  if (instance?.shared) return false
  if (!role?.permissions.includes('VIEW')) return false
  if (role?.tag && instance?.tags) return canViewByTags(role.tag, instance.tags)
  return true
}

export function canViewByTags(filter: ITagFilter, tags: ITag[]) {
  const names = tags.map(t => t.name)
  if (filter.operator === 'ANY') {
    return filter.values.some(tag => names.includes(tag))
  } else if (filter.operator === 'ALL') {
    return filter.values.every(tag => names.includes(tag))
  }
  return true
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
