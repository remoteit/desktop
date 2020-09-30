import { createModel } from '@rematch/core'
import { ApplicationState } from '../store'
import { graphQLLinkAccount } from '../services/graphQLMutation'
import { graphQLGetErrors, graphQLHandleError } from '../services/graphQL'
import analyticsHelper from '../helpers/analyticsHelper'

const ACCOUNT_KEY = 'account'

type IAccountsState = ILookup & {
  member: IUser[]
  access: IUser[]
  activeId?: string // user.id
  devices: { [accountId: string]: IDevice[] }
}

type IGraphQLAccount = {
  scripting: boolean
  created: Date
  user: {
    id: string
    email: string
  }
}

const state: IAccountsState = {
  member: [],
  access: [],
  activeId: undefined,
  devices: {},
}

export default createModel({
  state,
  effects: (dispatch: any) => ({
    async init(_, globalState) {
      let activeId = window.localStorage.getItem(ACCOUNT_KEY)
      activeId = activeId && JSON.parse(activeId)
      dispatch.accounts.setActive(activeId)
    },
    async parse(gqlResponse: any, globalState) {
      const gqlData = gqlResponse?.data?.data?.login
      if (!gqlData) return
      const { parseAccounts } = dispatch.accounts
      const member: IUser[] = await parseAccounts(gqlData.member)
      const access: IUser[] = await parseAccounts(gqlData.access)
      dispatch.accounts.set({ member, access })
      if (!member.find(m => m.id === globalState.accounts.activeId)) {
        dispatch.accounts.setActive('')
      }
    },
    async parseAccounts(accounts: IGraphQLAccount[]): Promise<IUser[]> {
      return accounts.map(a => ({
        id: a.user.id,
        scripting: a.scripting,
        created: new Date(a.created),
        email: a.user.email,
      }))
    },
    //@TODO - switch to using account ID instead of emails
    async addAccess(emails: string[], globalState) {
      const { access } = globalState.accounts as ApplicationState['accounts']
      try {
        const result = await graphQLLinkAccount(emails, 'ADD')
        const errors = await graphQLGetErrors(result)
        if (!errors?.length) {
          analyticsHelper.track('addAccess')
          dispatch.accounts.set({ access: [...access, ...emails.map(email => ({ email, created: new Date() }))] })
          dispatch.ui.set({
            successMessage:
              emails.length > 1
                ? `${emails.length} accounts successfully linked.`
                : `${emails[0]} successfully linked to your account.`,
          })
        }
      } catch (error) {
        await graphQLHandleError(error)
      }
    },
    async removeAccess(email: string, globalState) {
      const { access } = globalState.accounts as ApplicationState['accounts']
      try {
        const result = await graphQLLinkAccount([email], 'REMOVE')
        const errors = await graphQLGetErrors(result)
        if (!errors?.length) {
          analyticsHelper.track('removedAccess')
          dispatch.accounts.set({ access: access.filter(user => user.email !== email) })
          dispatch.ui.set({ successMessage: `${email} successfully removed.` })
        }
      } catch (error) {
        await graphQLHandleError(error)
      }
    },
    async leaveMembership(email: string, globalState) {
      const { member } = globalState.accounts as ApplicationState['accounts']
      try {
        const result = await graphQLLinkAccount([email], 'LEAVE')
        const errors = await graphQLGetErrors(result)
        if (!errors?.length) {
          analyticsHelper.track('leaveMembership')
          dispatch.accounts.set({ member: member.filter(user => user.email !== email) })
          dispatch.ui.set({ successMessage: `You successfully left ${email}'s account.` })
        }
      } catch (error) {
        await graphQLHandleError(error)
      }
    },
    async setDevices({ devices: devices, accountId }: { devices: IDevice[]; accountId?: string }, globalState: any) {
      const allDevices = globalState.accounts.devices
      accountId = accountId || getAccountId(globalState)

      allDevices[accountId] = devices
      dispatch.accounts.set({ devices: allDevices })
    },
    async setDevice({ id, accountId, device }: { id: string; accountId?: string; device: IDevice }, globalState) {
      const { setDevices } = dispatch.accounts
      const devices = getDevices(globalState, accountId)

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
      setDevices({ devices, accountId })
    },
  }),
  reducers: {
    set(state: IAccountsState, params: ILookup) {
      Object.keys(params).forEach(key => (state[key] = params[key]))
    },
    setActive(state: IAccountsState, id: string) {
      window.localStorage.setItem(ACCOUNT_KEY, JSON.stringify(id))
      state.activeId = id
    },
  },
})

export function getAccountId(state: ApplicationState) {
  return state.accounts.activeId || state.auth.user?.id || ''
}

export function getDevices(state: ApplicationState, accountId?: string) {
  return state.accounts.devices[accountId || getAccountId(state)] || []
}

export function getOwnDevices(state: ApplicationState) {
  return state.accounts.devices[state.auth.user?.id || ''] || []
}
