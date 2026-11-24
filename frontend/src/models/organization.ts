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
import { getAccountIds, accountIdsByReach } from './accounts'
import { graphQLFetchOrganizations, graphQLFetchGuests, graphQLGetResellerReportUrl } from '../services/graphQLRequest'
import { selectOrganization, selectOrganizationReseller } from '../selectors/organizations'
import { rowSaid, selectActiveAccountId, selectRow } from '../selectors/accounts'
import { asRow, rowGone, sendAs } from '../selectors/signIns'
import { RowKey, rowKey, withoutAccounts, withoutRows, rekeyed } from '../helpers/rowKey'
import { AxiosResponse } from 'axios'
import { RootModel } from '.'
import { State } from '../store'
import i18n from '../i18n'
import { selectDeviceSessionsSetting } from '../hooks/useDeviceSessions'

export const PERMISSION: ILookup<{
  name: string
  description: string
  icon: string
  system?: boolean
  user?: boolean
  hidden?: boolean
  deviceSessions?: boolean
}> = {
  VIEW: { name: 'View', description: 'See devices and their current state', icon: 'eye', system: true },
  CONNECT: { name: 'Connect', description: 'Connect to device services', icon: 'arrow-right' },
  SCRIPTING: { name: 'Script', description: 'View and run device scripts', icon: 'scripting', hidden: false },
  MANAGE: {
    name: 'Manage',
    // Registering a device needs MANAGE, not ADMIN - the API gates it on
    // canManage(). See selectCanRegister in selectors/organizations.
    description: 'Register, edit, delete, transfer and share devices and networks',
    icon: 'pencil',
  },
  ADMIN: {
    name: 'Administer',
    description: 'Manage organization tags, scripts and members. View logs.',
    icon: 'user-pen',
    user: true,
  },
  // Exit nodes (device sessions): only by this explicit grant — connect access does not give it. Shown and sent only
  // where the device-session API is on (deviceSessionPermissions).
  EXIT: {
    name: 'Exit node',
    description: 'Send their traffic out through the devices — use them as exit nodes',
    icon: 'arrow-right-from-bracket',
    deviceSessions: true,
  },
}

// The permissions this client deals in: the device-session ones only with device sessions on — an API without them
// refuses a role that names one, even to revoke it.
export const deviceSessionPermissions = (deviceSessions: boolean) =>
  (Object.keys(PERMISSION) as IPermission[]).filter(p => deviceSessions || !PERMISSION[p].deviceSessions)

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
  // By ROW (helpers/rowKey): an account's organization as each sign-in that belongs to it sees it — its own role's
  // view of the members, roles, licenses and limits.
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
      // One request per sign-in, each about every account it reaches — an organization two of them belong to is read
      // as each, into its row under each (helpers/rowKey): the role, the members and the limits are that sign-in's
      // own view of it. A sign-in that cannot be asked leaves its rows as they were stored.
      const answers = await Promise.all(
        accountIdsByReach(state, ids).map(async ([sub, own]) => {
          const result = await graphQLFetchOrganizations(own, { sub, about: own, row: true })
          return result === 'ERROR' ? undefined : dispatch.organization.parse({ result, ids: own, sub })
        })
      )
      if (answers.every(answer => !answer)) return
      // What was answered goes in beside what is stored, as it is THEN — not over the whole of it as it was when
      // this was asked: another reading that overlaps this one (new rows, read at once) keeps what it found.
      const accounts: IOrganizationAccountState['accounts'] = Object.assign({}, ...answers)
      console.log('ORGANIZATION FETCH', accounts)
      await dispatch.organization.merge(accounts)
    },

    async fetchGuests(_: void, state) {
      // The row they are read for: asked as its sign-in, and kept under it whichever row is looked at by then.
      const { accountId, row } = rowSaid(state)
      const result = await graphQLFetchGuests(accountId, asRow(row))
      if (result === 'ERROR') {
        // Without guestsLoaded, OrganizationGuestList shows its spinner until remount.
        await dispatch.organization.setActive({ guestsLoaded: true, id: accountId, row })
        return
      }
      const guests = parseGuests(result)
      console.log('LOAD GUESTS', accountId, guests)
      await dispatch.organization.setActive({ guests, guestsLoaded: true, id: accountId, row })
    },

    // `sub`: the sign-in that was asked ('' the page's own person): each account goes under its row for that sign-in.
    async parse({ result, ids, sub }: { result: AxiosResponse<any>; ids: string[]; sub?: string }) {
      const data = result.data?.data?.login
      let orgs: IOrganizationAccountState['accounts'] = {}
      ids.forEach((id, index) => {
        if (!data?.[`_${index}`]) return
        const { organization, licenses, limits } = data[`_${index}`]
        const row = rowKey(id, sub)
        orgs[row] = parseOrganization(organization)
        orgs[row].licenses = licenses?.map(l => parseLicense(l))
        orgs[row].limits = limits
      })
      return orgs
    },

    async setOrganization(params: IOrganizationSettings, state) {
      let organization = selectOrganization(state)
      // No organization yet: it is created for the selected account, by the sign-in that serves it — named, since a
      // request that names no account is the page's own person's.
      const accountId = organization.id || selectActiveAccountId(state)
      await dispatch.organization.setActive({ ...params, id: accountId, row: selectRow(state) })
      // Sent as the row it began in, whichever row is looked at once the write above is done.
      const result = await sendAs(selectRow(state), () => graphQLSetOrganization({ ...params, accountId }))
      if (result !== 'ERROR') {
        if (!organization.id)
          dispatch.ui.set({
            successMessage: i18n.t('notices:organization.created', {
              defaultValue: 'Your organization has been created.',
            }),
          })
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
          errorMessage: i18n.t('notices:organization.updateFailed', {
            type: params.type,
            defaultValue: '{{type}} update failed, please validate your form data.',
          }),
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
      await dispatch.organization.setActive({ members: updated, row: selectRow(state) })

      const action = updated.length > organization.members.length ? 'added' : 'updated'
      const member = members[0]
      const result = await sendAs(selectRow(state), () =>
        graphQLSetMembers(
          members.map(member => member.user.email),
          organization.id || selectActiveAccountId(state),
          member.roleId,
          member.license
        )
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
      const result = await graphQLRemoveMembers([member.user.email], organization.id || selectActiveAccountId(state))
      if (result !== 'ERROR') {
        // The row it was removed in (this effect's own state), whichever row is looked at by now.
        dispatch.organization.setActive({
          members: organization.members.filter(m => m.user.email !== member.user.email),
          row: selectRow(state),
        })
        dispatch.ui.set({
          successMessage: i18n.t('notices:organization.removedNamed', {
            name: member.user?.email,
            defaultValue: 'Successfully removed “{{name}}”.',
          }),
        })
        dispatch.organization.fetch()
      }
    },

    async removeOrganization(_: void) {
      const result = await graphQLRemoveOrganization()
      if (result !== 'ERROR') {
        dispatch.organization.clearActive()
        dispatch.ui.set({
          successMessage: i18n.t('notices:organization.removed', {
            defaultValue: 'Your organization has been removed.',
          }),
        })
      }
    },

    async setRole(role: IOrganizationRole, state) {
      let roles = [...selectOrganization(state).roles]
      const index = roles.findIndex(r => r.id === role.id)
      const permissions = deviceSessionPermissions(selectDeviceSessionsSetting(state))
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
        result = await sendAs(selectRow(state), () => graphQLUpdateRole(data))
      } else {
        result = await sendAs(selectRow(state), () => graphQLCreateRole(data))
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

      await dispatch.organization.setActive({ roles, row: selectRow(state) })
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

      dispatch.ui.set({
        successMessage: i18n.t('notices:organization.removedNamed', {
          name: role.name,
          defaultValue: 'Successfully removed “{{name}}”.',
        }),
      })
      dispatch.organization.setActive({ roles, row: selectRow(state) })
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
          errorMessage: i18n.t('notices:organization.customerRemoveError', {
            defaultValue: 'There was a problem removing a customer. Please contact support if the issue persists',
          }),
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

    async resellerReportUrl(_: void, state): Promise<string | undefined> {
      const accountId = selectActiveAccountId(state)
      const response = await graphQLGetResellerReportUrl(accountId)
      console.log('RESPONSE', response)
      if (response === 'ERROR') {
        dispatch.ui.set({
          errorMessage: i18n.t('notices:organization.resellerReportError', {
            defaultValue: 'Failed to get reseller report URL',
          }),
        })
        return
      }
      const result = response?.data?.data?.login?.account?.organization?.reseller
      console.log('RESELLER REPORT URL', result.reportUrl)
      return result?.reportUrl
    },

    /* The one write of a row's organization. `row` is the key (helpers/rowKey): the row said — the one an effect
       began in, or a read was made for — else the one the account (`id`, or the selected one) is looked at through. */
    async setActive({ row: said, ...params }: Partial<IOrganizationState> & { row?: RowKey }, state) {
      // An answer for a row whose sign-in has left since it was asked: the row is gone, and is not put back.
      if (said && rowGone(state, said)) return
      const id = params.id || selectActiveAccountId(state)
      const row = said ?? selectRow(state, id)
      let org = { ...selectOrganization(state, id), ...state.organization.accounts[row] }
      Object.keys(params).forEach(key => (org[key] = params[key]))
      dispatch.organization.setRow({ row, organization: org })
    },
  }),
  reducers: {
    set(state: IOrganizationAccountState, params: Partial<IOrganizationAccountState>) {
      Object.keys(params).forEach(key => (state[key] = params[key]))
      return state
    },
    /** Accounts as just read, beside those stored: the rest stay as they are. */
    merge(state: IOrganizationAccountState, accounts: IOrganizationAccountState['accounts']) {
      state.accounts = { ...state.accounts, ...accounts }
      state.initialized = true
      return state
    },
    reset(state: IOrganizationAccountState) {
      state = { ...defaultAccountState }
      return state
    },
    /** An account's data dropped: its sign-in signed out, so it is no longer a row (models/accounts forgetData). */
    forget(state: IOrganizationAccountState, accountIds: string[]) {
      state.accounts = withoutAccounts(state.accounts, accountIds)
      return state
    },
    forgetRows(state: IOrganizationAccountState, rows: string[]) {
      state.accounts = withoutRows(state.accounts, rows)
      return state
    },
    rekey(state: IOrganizationAccountState, rows: ILookup<RowKey>) {
      state.accounts = rekeyed(state.accounts, rows)
      return state
    },
    setRow(state: IOrganizationAccountState, { row, organization }: { row: RowKey; organization: IOrganizationState }) {
      state.accounts = { ...state.accounts, [row]: organization }
      return state
    },
  },
})

function parseGuests(result: AxiosResponse<any>) {
  const guest = result.data?.data?.login?.account?.guest || []
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
    roles: [...defaultState.roles, ...data.roles],
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

export function canRoleView(role?: Partial<IOrganizationRole>, instance?: IInstance) {
  if (instance?.shared) return false
  if (!role?.permissions?.includes('VIEW')) return false
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
