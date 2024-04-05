import { createModel } from '@rematch/core'
import {
  graphQLSetOrganization,
  graphQLRemoveOrganization,
  graphQLSetMembers,
  graphQLRemoveMembers,
  graphQLAddCustomer,
  graphQLRemoveCustomer,
  graphQLSetIdentityProvider,
  graphQLCreateRole,
  graphQLUpdateRole,
  graphQLRemoveRole,
} from '../services/graphQLMutation'
import { getAccountIds } from './accounts'
import { graphQLFetchOrganizations, graphQLFetchGuests } from '../services/graphQLRequest'
import { selectActiveAccountId } from '../selectors/accounts'
import { selectOrganization, selectOrganizationReseller } from '../selectors/organizations'
import { AxiosResponse } from 'axios'
import { RootModel } from '.'
import { State } from '../store'

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
    description: 'Edit, delete, transfer and share devices and networks',
    icon: 'pencil',
  },
  ADMIN: {
    name: 'Administer',
    description: 'Manage organization tags, members and device registrations',
    icon: 'user-tag',
    user: true,
  },
}

export const DEFAULT_ROLE: IOrganizationRole = {
  id: '',
  name: '',
  tag: { operator: 'ANY', values: [] },
  permissions: ['VIEW', 'CONNECT'],
  access: 'NONE',
}

export const DEFAULT_RESELLER: IReseller = {
  name: '',
  email: '',
  logoUrl: '',
  // color: '#0096e7', // not used
  plans: [],
  customers: [],
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
  reseller: null | IReseller
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
  reseller: null,
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
    async fetch(_: void, state) {
      const ids: string[] = getAccountIds(state)
      const result = await graphQLFetchOrganizations(ids)
      if (result === 'ERROR') return
      const accounts = await dispatch.organization.parse({ result, ids })
      console.log('ORGANIZATION FETCH', accounts)
      if (accounts) await dispatch.organization.set({ accounts, initialized: true })
      else await dispatch.organization.clearActive()
    },

    async fetchGuests(_: void, state) {
      const accountId = selectActiveAccountId(state)
      const result = await graphQLFetchGuests(accountId)
      if (result === 'ERROR') return
      const guests = parseGuests(result)
      console.log('LOAD GUESTS', accountId, guests)
      await dispatch.organization.setActive({ guests, guestsLoaded: true, id: accountId })
    },

    async parse({ result, ids }: { result: AxiosResponse<any> | undefined; ids: string[] }) {
      const data = result?.data?.data?.login
      let orgs: IOrganizationAccountState['accounts'] = {}
      ids.forEach((id, index) => {
        if (!data?.[`_${index}`]) return
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
      const result = await graphQLSetOrganization({ ...params, accountId: organization.id })
      if (result !== 'ERROR') {
        if (!organization.id) dispatch.ui.set({ successMessage: 'Your organization has been created.' })
      }
      await dispatch.organization.fetch()
    },

    async setIdentityProvider(params: IIdentityProviderSettings, state) {
      dispatch.organization.set({ updating: true })
      const result = await graphQLSetIdentityProvider({ ...params, accountId: selectActiveAccountId(state) })
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
              : `The member “${members[0].user.email}” has been ${action}.`,
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
        dispatch.ui.set({ successMessage: `Successfully removed “${member.user?.email}”.` })
      }
    },

    async removeOrganization(_: void) {
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
        access: role.access,
        accountId: selectActiveAccountId(state),
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
      const result = await graphQLRemoveRole(role.id, selectActiveAccountId(state))

      if (result === 'ERROR') {
        dispatch.organization.fetch()
        return
      }

      dispatch.ui.set({ successMessage: `Successfully removed “${role.name}”.` })
      dispatch.organization.setActive({ roles })
    },

    async clearActive() {
      dispatch.organization.setActive({ ...defaultState })
    },

    async setReseller(params: Partial<IReseller>, state) {
      const previousReseller = selectOrganizationReseller(state) || { ...DEFAULT_RESELLER }
      const reseller = { ...previousReseller, ...params }
      dispatch.organization.setActive({ reseller })
      await dispatch.organization.setOrganization({ ...params })
    },

    async addCustomer({ id, emails }: { id: string; emails: string[] }) {
      const result = await graphQLAddCustomer(emails, id)
      if (result === 'ERROR') return

      if (!result?.data?.data?.addCustomer) {
        dispatch.ui.set({
          errorMessage:
            'One of the customers couldn’t be added. \
            Users must not have an existing subscription or belong to another reseller.',
        })
        return
      }

      await dispatch.ui.set({
        successMessage:
          emails.length > 1
            ? `Successfully added ${emails.length} customers.`
            : `Successfully added “${emails[0]}” as a customer.`,
      })

      await dispatch.organization.fetch()
    },

    async removeCustomer({ id, emails }: { id: string; emails: string[] }) {
      const result = await graphQLRemoveCustomer(emails, id)
      if (result === 'ERROR') return

      if (!result?.data?.data?.removeCustomer) {
        dispatch.ui.set({
          errorMessage: 'There was a problem removing a customer. Please contact support if the issue persists',
        })
        return
      }

      await dispatch.ui.set({
        successMessage:
          emails.length > 1
            ? `Successfully removed ${emails.length} customers.`
            : `Successfully removed “${emails[0]}” as a customer.`,
      })

      await dispatch.organization.fetch()
    },

    async setActive(params: Partial<IOrganizationState>, state) {
      const id = params.id || selectActiveAccountId(state)
      let org = { ...selectOrganization(state, id) }
      Object.keys(params).forEach(key => (org[key] = params[key]))
      const accounts = { ...state.organization.accounts }
      accounts[id] = org
      dispatch.organization.set({ accounts })
    },
  }),
  reducers: {
    set(state: IOrganizationAccountState, params: Partial<IOrganizationAccountState>) {
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
    reseller: data.reseller && {
      ...DEFAULT_RESELLER,
      ...data.reseller,
      customers: data.reseller.licenses.map((l): ICustomer => {
        const { user, ...license } = l
        return {
          id: user.id,
          email: user.email,
          created: user.created,
          reseller: user.reseller.email,
          license: parseLicense(license),
          limits: user.limits,
        }
      }),
    },
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

export function parseLicense(data): ILicense {
  return {
    ...data,
    // custom: true, // for development
    // plan: {
    //   ...data.plan,
    //   billing: true, // for development
    // },
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

export function getOwnOrganization(state: State) {
  const id = state.auth.user?.id || ''
  return selectOrganization(state, id)
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
