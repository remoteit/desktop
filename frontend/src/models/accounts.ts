import { createModel } from '@rematch/core'
import { ApplicationState } from '../store'
import { graphQLLinkAccount } from '../services/graphQLMutation'
import { graphQLRequest, graphQLGetErrors, graphQLCatchError } from '../services/graphQL'
import { AxiosResponse } from 'axios'
import { RootModel } from './rootModel'
import analyticsHelper from '../helpers/analyticsHelper'

const ACCOUNT_KEY = 'account'

export type IAccountsState = {
  member: IUser[]
  access: IUser[]
  activeId?: string // user.id
}

type IGraphQLAccount = {
  scripting: boolean
  created: Date
  user: {
    id: string
    email: string
  }
}

const accountsState: IAccountsState = {
  member: [],
  access: [],
  activeId: undefined,
}

export default createModel<RootModel>()({
  state: accountsState,
  effects: dispatch => ({
    async init() {
      let activeId = window.localStorage.getItem(ACCOUNT_KEY)
      activeId = activeId && JSON.parse(activeId)
      if (activeId) dispatch.accounts.setActive(activeId)
      await dispatch.accounts.fetchMembers()
    },
    async fetchMembers() {
      try {
        const result = await graphQLRequest(
          ` query {
              login {
                member {
                  created
                  scripting
                  user {
                    id
                    email
                  }
                }
              }
            }`
        )
        graphQLGetErrors(result)
        await dispatch.accounts.parse(result)
      } catch (error) {
        await graphQLCatchError(error)
      }
    },
    async parse(gqlResponse: AxiosResponse<any>, state) {
      const gqlData = gqlResponse?.data?.data?.login
      if (!gqlData) return
      const { parseAccounts } = dispatch.accounts
      const member: IUser[] = await parseAccounts(gqlData.member)
      const access: IUser[] = await parseAccounts(gqlData.access)
      dispatch.accounts.set({ member, access })
      if (!member.find(m => m.id === state.accounts.activeId)) {
        dispatch.accounts.setActive('')
      }
    },
    async parseAccounts(accounts: IGraphQLAccount[]): Promise<IUser[]> {
      if (!accounts) return []
      return accounts.map(a => ({
        id: a.user.id,
        scripting: a.scripting,
        created: new Date(a.created),
        email: a.user.email,
      }))
    },
    //@TODO - switch to using account ID instead of emails
    async addAccess(emails: string[], state) {
      const { access } = state.accounts as ApplicationState['accounts']
      try {
        const result = await graphQLLinkAccount(emails, 'ADD')
        const errors = graphQLGetErrors(result)
        if (!errors?.length) {
          analyticsHelper.track('addAccess')
          dispatch.accounts.set({ access: [...access, ...emails.map(email => ({ email, created: new Date() }))] })
          dispatch.ui.set({
            successMessage:
              emails.length > 1
                ? `Your device list has been shared to ${emails.length} users.`
                : `Your device list has been shared to ${emails[0]}.`,
          })
        }
      } catch (error) {
        await graphQLCatchError(error)
      }
    },
    async removeAccess(email: string, state) {
      const { access } = state.accounts as ApplicationState['accounts']
      try {
        const result = await graphQLLinkAccount([email], 'REMOVE')
        const errors = graphQLGetErrors(result)
        if (!errors?.length) {
          analyticsHelper.track('removedAccess')
          dispatch.accounts.set({ access: access.filter(user => user.email !== email) })
          dispatch.ui.set({ successMessage: `${email} successfully removed.` })
        }
      } catch (error) {
        await graphQLCatchError(error)
      }
    },
    async leaveMembership(email: string, state) {
      const { member } = state.accounts as ApplicationState['accounts']
      try {
        const result = await graphQLLinkAccount([email], 'LEAVE')
        const errors = graphQLGetErrors(result)
        if (!errors?.length) {
          analyticsHelper.track('leaveMembership')
          dispatch.accounts.set({ member: member.filter(user => user.email !== email) })
          dispatch.ui.set({ successMessage: `You have successfully left ${email}'s device list.` })
        }
      } catch (error) {
        await graphQLCatchError(error)
      }
    },
    async setDevices({ devices, accountId }: { devices: IDevice[]; accountId: string }, state) {
      accountId = accountId || devices[0]?.accountId
      if (!accountId) return console.error('SET DEVICES WITH MISSING ACCOUNT ID', { accountId, devices })
      const all = state.devices.all
      all[accountId] = devices
      dispatch.devices.set({ all })
    },
    async appendUniqueDevices({ devices, accountId }: { devices?: IDevice[]; accountId: string }, state) {
      if (!devices) return
      accountId = accountId || devices[0]?.accountId
      if (!accountId) return console.error('SET DEVICES WITH MISSING ACCOUNT ID', { accountId, devices })
      const existingDevices = getDevices(state, accountId)
      devices = devices.filter(d => !existingDevices.find(e => e.id === d.id))
      dispatch.accounts.setDevices({
        devices: [...existingDevices, ...devices],
        accountId,
      })
    },
    async setDevice({ id, accountId, device }: { id: string; accountId?: string; device?: IDevice }, state) {
      accountId = accountId || device?.accountId
      if (!accountId) return console.error('SET DEVICE WITH MISSING ACCOUNT ID', { id, accountId, device })
      const devices = getDevices(state, accountId)

      let exists = false
      devices.forEach((d, index) => {
        if (d.id === id) {
          if (device) devices[index] = { ...device, hidden: d.hidden }
          else devices.splice(index, 1)
          exists = true
        }
      })

      // Add if new
      if (!exists && device) devices.push(device)
      await dispatch.accounts.setDevices({ devices, accountId })
    },
  }),
  reducers: {
    set(state: IAccountsState, params: ILookup<any>) {
      Object.keys(params).forEach(key => (state[key] = params[key]))
      return state
    },
    setActive(state: IAccountsState, id: string) {
      window.localStorage.setItem(ACCOUNT_KEY, JSON.stringify(id))
      state.activeId = id
      return state
    },
  },
})

export function getActiveAccountId(state: ApplicationState) {
  return state.accounts.activeId || state.auth.user?.id || ''
}

export function getDevices(state: ApplicationState, accountId?: string): IDevice[] {
  return state.devices.all[accountId || getActiveAccountId(state)] || []
}

export function getOwnDevices(state: ApplicationState): IDevice[] {
  return state.devices.all[state.auth.user?.id || ''] || []
}

export function getAllDevices(state: ApplicationState) {
  return Object.keys(state.devices.all).reduce(
    (all: IDevice[], accountId) => all.concat(state.devices.all[accountId]),
    []
  )
}
