import { createModel } from '@rematch/core'
import { ApplicationState } from '../store'
import { selectRemoteitLicense } from './plans'
import { getLocalStorage, setLocalStorage } from '../services/Browser'
import { graphQLRequest, graphQLGetErrors, apiError } from '../services/graphQL'
import { graphQLLeaveMembership } from '../services/graphQLMutation'
import { AxiosResponse } from 'axios'
import { RootModel } from '.'

const ACCOUNT_KEY = 'account'

export type IAccountsState = {
  membership: IMembership[]
  activeId?: string // user.id
}

const accountsState: IAccountsState = {
  membership: [],
  activeId: undefined,
}

export default createModel<RootModel>()({
  state: accountsState,
  effects: dispatch => ({
    async init(_: void, globalState) {
      let activeId = getLocalStorage(globalState, ACCOUNT_KEY)
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
                  customRole {
                    id
                    name
                  }
                  license
                  organization {
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
      const membership = gqlData.membership || []
      dispatch.accounts.set({
        membership: membership.map(m => ({
          created: new Date(m.created),
          roleId: m.customRole.id,
          roleName: m.customRole.name,
          license: m.license || [],
          account: m.organization.account,
        })),
      })
      if (!membership.find(m => m.organization.account.id === state.accounts.activeId)) {
        dispatch.accounts.setActive('')
      }
    },
    async leaveMembership(id: string, state) {
      const { membership } = state.accounts
      const result = await graphQLLeaveMembership(id)
      if (result !== 'ERROR') {
        dispatch.accounts.set({ membership: membership.filter(m => m.account.id !== id) })
        dispatch.ui.set({ successMessage: 'You have successfully left the organization.' })
      }
    },
    async setDevices({ devices, accountId }: { devices: IDevice[]; accountId?: string }, state) {
      accountId = accountId || devices[0]?.accountId
      if (!accountId) return console.error('SET DEVICES WITH MISSING ACCOUNT ID', { accountId, devices })
      dispatch.devices.set({ all: devices, accountId })
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
    async setActive(id: string, globalState) {
      setLocalStorage(globalState, ACCOUNT_KEY, id)
      dispatch.accounts.set({ activeId: id })
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
  },
})

export function accountFromDevice(state: ApplicationState, device?: IDevice) {
  return device?.accountId || getActiveAccountId(state)
}

export function isUserAccount(state: ApplicationState, accountId?: string) {
  return (accountId || getActiveAccountId(state)) === state.auth.user?.id
}

export function getAccountIds(state: ApplicationState) {
  let ids = state.accounts.membership.map(m => m.account.id)
  state.auth.user && ids.unshift(state.auth.user.id)
  return ids
}

export function getActiveAccountId(state: ApplicationState) {
  return state.accounts.activeId || state.auth.user?.id || ''
}

export function getActiveUser(state: ApplicationState): IUserRef {
  const id = getActiveAccountId(state)
  const membershipOrganizations = state.accounts.membership.map(m => ({
    id: m.account.id || '',
    email: m.account.email || 'unknown',
    created: m.created,
  }))
  return membershipOrganizations.find(m => m.id === id) || state.user
}

export function getMembership(state: ApplicationState, accountId?: string): IMembership {
  const thisMembership = () => ({
    roleId: 'OWNER',
    roleName: 'Owner',
    license: selectRemoteitLicense(state)?.valid ? 'LICENSED' : 'UNLICENSED',
    created: state.auth.user?.created || new Date(),
    account: {
      id: state.auth.user?.id || '',
      email: state.auth.user?.email || 'unknown',
    },
  })
  if (isUserAccount(state, accountId)) return thisMembership()
  accountId = accountId || getActiveAccountId(state)
  return state.accounts.membership.find(m => m.account.id === accountId) || thisMembership()
}

export function getDeviceModel(state: ApplicationState, accountId?: string) {
  return state.devices[accountId || getActiveAccountId(state)] || state.devices.default
}

export function getDevices(state: ApplicationState, accountId?: string): IDevice[] {
  return getDeviceModel(state, accountId).all || []
}

export function getOwnDevices(state: ApplicationState): IDevice[] {
  return getDeviceModel(state, state.auth.user?.id || '').all || []
}

export function getAllDevices(state: ApplicationState): IDevice[] {
  return (
    Object.keys(state.devices).reduce((all: IDevice[], accountId) => all.concat(state.devices[accountId].all), []) || []
  )
}
