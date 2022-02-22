import { createModel } from '@rematch/core'
import moment from 'moment'
import { ApplicationState } from '../store'
import { getLocalStorage, setLocalStorage } from '../services/Browser'
import { graphQLRequest, graphQLGetErrors, apiError } from '../services/graphQL'
import { graphQLLicenses, parseLicense } from './licensing'
import { graphQLLeaveMembership } from '../services/graphQLMutation'
import { AxiosResponse } from 'axios'
import { RootModel } from './rootModel'
import { graphQLCreateAccessKey, graphQLDeleteAccessKeys, graphQLGetAccessKeys, graphQLToggleAccessKeys } from '../services/graphQLAccessKeys'


const ACCOUNT_KEY = 'account'

export type IAccountsState = {
  membership: IOrganizationMembership[]
  activeId?: string // user.id
  keyArray?: []
  apiKey?: string
  key?: string
  secretKey?: string
}

const accountsState: IAccountsState = {
  membership: [],
  activeId: undefined,
  keyArray: [],
  apiKey: undefined
}

export default createModel<RootModel>()({
  state: accountsState,
  effects: dispatch => ({
    async init(_, globalState) {
      let activeId = getLocalStorage(globalState, ACCOUNT_KEY)
      if (activeId) dispatch.accounts.setActive(activeId)
      await dispatch.accounts.fetch()
    },
    async fetch() {
      try {
        const result = await graphQLRequest(
          ` query {
              login {
                apiKey {
                  key
                  updated
                }
                membership {
                  created
                  role
                  license
                  organization {
                    id
                    name
                    samlName
                    account {
                      id
                      email
                    }
                    ${graphQLLicenses}
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
          created: new Date(m.created),
          role: m.role,
          license: m.license,
          organization: {
            ...m.organization,
            licenses: m.organization?.licenses?.map(l => parseLicense(l)),
          },
        })),
        apiKey: gqlData.apiKey.key
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
        dispatch.ui.set({ successMessage: 'You have successfully left the organization.' })
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
    async fetchAccessKeys() {
      try {
        const result = await graphQLGetAccessKeys()
        graphQLGetErrors(result)
        const data = result?.data.data.login.accessKeys
        const arr = data.map(element => {
          let obj = {}
          obj['key'] = element.key
          let dateCr = moment(new Date(element.created)).format('MM/DD/YYYY')
          obj['createdDate'] = dateCr
          let dateLastUsed = element.lastUsed
            ? 'Last used ' +
            moment(new Date(element.lastUsed)).format('MM/DD/YYYY')
            : 'Never used'
          obj['lastUsed'] = dateLastUsed
          obj['enabled'] = element.enabled

          return obj
        })
        await dispatch.accounts.set({ keyArray: arr })
      } catch (error) {
        await apiError(error)
      }
    },
    async toggleAccessKeys(properties: { key: never, enabled: boolean, }) {
      try {
        const result = await graphQLToggleAccessKeys(properties)
        graphQLGetErrors(result)
        await dispatch.accounts.fetchAccessKeys()
      } catch (error) {
        await apiError(error)
      }
    },
    async deleteAccessKeys(properties: { key: string }) {
      try {
        const result = await graphQLDeleteAccessKeys(properties)
        graphQLGetErrors(result)
        await dispatch.accounts.fetchAccessKeys()
      } catch (error) {
        await apiError(error)
      }
    },
    async createAccessKey() {
      try {
        const result = await graphQLCreateAccessKey()
        graphQLGetErrors(result)
        const data = result?.data.data.createAccessKey
        dispatch.accounts.set({ key: data.key, secretKey: data.secret })
        await dispatch.accounts.fetchAccessKeys()
        // // setKey(data.key)
        // // setSecretKey(data.secret)
        // return result
      } catch (error) {
        await apiError(error)
      }

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

export function getActiveUser(state: ApplicationState): IUserRef | undefined {
  const id = getActiveAccountId(state)
  const membershipOrganizations = state.accounts.membership.map(m => ({
    id: m.organization.id,
    email: m.organization.name,
  }))
  return membershipOrganizations.find(m => m.id === id) || state.auth.user
}

export function getActiveOrganizationMembership(state: ApplicationState): IOrganizationMembership | undefined {
  const id = getActiveAccountId(state)
  return state.accounts.membership.find(m => m.organization.id === id)
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
