import { createModel } from '@rematch/core'
import { ApplicationState } from '../store'
import { graphQLRequest, graphQLGetErrors } from '../services/graphQL'
import { graphQLLeaveMembership } from '../services/graphQLMutation'
import { AxiosResponse } from 'axios'
import { RootModel } from './rootModel'
import { apiError } from '../helpers/apiHelper'

const ACCOUNT_KEY = 'account'

export type IAccountsState = {
  membership: IOrganizationMembership[]
  activeId?: string // user.id
}

const accountsState: IAccountsState = {
  membership: [],
  activeId: undefined,
}

export default createModel<RootModel>()({
  state: accountsState,
  effects: dispatch => ({
    async init() {
      let activeId = window.localStorage.getItem(ACCOUNT_KEY)
      activeId = activeId && JSON.parse(activeId)
      if (activeId) dispatch.accounts.setActive(activeId)
      await dispatch.accounts.fetch()
    },
    async fetch() {
      try {
        const result = await graphQLRequest(
          ` query {
              login {
                membership {
                  created
                  role
                  organization {
                    id
                    name
                    samlName
                    account {
                      id
                      email
                    }
                  }
                }
              }
            }`
        )
        graphQLGetErrors(result)
        await dispatch.accounts.parse(result)
      } catch (error) {
        await apiError(error)
      }
    },
    async parse(gqlResponse: AxiosResponse<any> | undefined, state) {
      const gqlData = gqlResponse?.data?.data?.login
      console.log('MEMBERSHIPS', gqlData)
      if (!gqlData) return
      const membership: IOrganizationMembership[] = gqlData.membership || []
      dispatch.accounts.set({
        membership: membership.map(m => ({
          ...m,
          created: new Date(m.created),
        })),
      })
      if (!membership.find(m => m.organization.id === state.accounts.activeId)) {
        dispatch.accounts.setActive('')
      }
    },
    async leaveMembership(id: string, state) {
      const { membership } = state.accounts
      const result = await graphQLLeaveMembership(id)
      if (result !== 'ERROR') {
        dispatch.accounts.set({ membership: membership.filter(m => m.organization.id !== id) })
        dispatch.ui.set({ successMessage: `You have successfully left ${id}'s device list.` })
      }
    },
    async setDevices({ devices, accountId }: { devices: IDevice[]; accountId?: string }, state) {
      accountId = accountId || devices[0]?.accountId
      if (!devices) debugger
      if (!accountId) return console.error('SET DEVICES WITH MISSING ACCOUNT ID', { accountId, devices })
      const all = { ...state.devices.all }
      all[accountId] = devices
      dispatch.devices.set({ all })
    },
    async mergeDevices({ devices, accountId }: { devices?: IDevice[]; accountId: string }, state) {
      if (!devices) return
      accountId = accountId || devices[0]?.accountId
      if (!accountId) return console.error('MERGE DEVICES WITH MISSING ACCOUNT ID', { accountId, devices })
      const updatedDevices = getDevices(state, accountId).map(ud => {
        const index = devices.findIndex(d => d.id === ud.id)
        if (index >= 0) devices.splice(index, 1)
        return ud
      })
      dispatch.accounts.setDevices({
        devices: [...updatedDevices, ...devices],
        accountId,
      })
    },
    async appendUniqueDevices({ devices, accountId }: { devices?: IDevice[]; accountId: string }, state) {
      if (!devices) return
      accountId = accountId || devices[0]?.accountId
      if (!accountId) return console.error('APPEND DEVICES WITH MISSING ACCOUNT ID', { accountId, devices })
      const existingDevices = getDevices(state, accountId).filter(
        ed =>
          !devices.find(d => {
            if (d.id === ed.id) {
              d.hidden = d.hidden && ed.hidden
              return true
            }
            return false
          })
      )
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
    reset(state: IAccountsState) {
      state = accountsState
      return state
    },
    setActive(state: IAccountsState, id: string) {
      window.localStorage.setItem(ACCOUNT_KEY, JSON.stringify(id))
      state.activeId = id
      return state
    },
  },
})

export function isUserAccount(state: ApplicationState) {
  return getActiveAccountId(state) === state.auth.user?.id
}

export function getAccountIds(state: ApplicationState) {
  let ids = state.accounts.membership.map(m => m.organization.id)
  state.auth.user && ids.unshift(state.auth.user.id)
  return ids
}

export function getActiveAccountId(state: ApplicationState) {
  return state.accounts.activeId || state.auth.user?.id || ''
}

export function getDevices(state: ApplicationState, accountId?: string): IDevice[] {
  return state.devices.all[accountId || getActiveAccountId(state)] || []
}

export function getOwnDevices(state: ApplicationState): IDevice[] {
  return state.devices.all[state.auth.user?.id || ''] || []
}

export function getAllDevices(state: ApplicationState): IDevice[] {
  return (
    Object.keys(state.devices.all).reduce(
      (all: IDevice[], accountId) => all.concat(state.devices.all[accountId]),
      []
    ) || []
  )
}
