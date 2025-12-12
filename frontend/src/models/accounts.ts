import { State } from '../store'
import { createModel } from '@rematch/core'
import { getDevices } from '../selectors/devices'
import { graphQLLeaveMembership } from '../services/graphQLMutation'
import { graphQLBasicRequest } from '../services/graphQL'
import { AxiosResponse } from 'axios'
import { mergeDevice } from './devices'
import { RootModel } from '.'

export type IAccountsState = {
  membership: IMembership[]
  activeId?: string // user.id
}

const accountsState: IAccountsState = {
  membership: [],
  activeId: undefined,
}

export default createModel<RootModel>()({
  state: { ...accountsState },
  effects: dispatch => ({
    async fetch() {
      const result = await graphQLBasicRequest(
        ` query Accounts {
              login {
                membership {
                  created
                  customRole {
                    id
                    name
                  }
                  license
                  organization {
                    name
                    account {
                      id
                      email
                    }
                  }
                }
              }
            }`
      )
      if (result === 'ERROR') return
      await dispatch.accounts.parse(result)
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
          name: m.organization.name,
        })),
      })
      if (!membership.find(m => m.organization.account.id === state.accounts.activeId)) {
        dispatch.accounts.set({ activeId: undefined })
      }
    },
    async select(accountId: string) {
      await dispatch.logs.reset()
      await dispatch.accounts.set({ activeId: accountId })
      dispatch.devices.fetchIfEmpty()
      dispatch.tags.fetchIfEmpty()
      dispatch.products.fetchIfEmpty()
    },
    async leaveMembership(id: string, state) {
      const { membership } = state.accounts
      const result = await graphQLLeaveMembership(id)
      if (result !== 'ERROR') {
        dispatch.accounts.set({ membership: membership.filter(m => m.account.id !== id), activeId: state.user.id })
        dispatch.ui.set({ successMessage: 'You have successfully left the organization.' })
      }
    },
    async setDevices({ devices, accountId }: { devices: IDevice[]; accountId?: string }) {
      await dispatch.devices.set({ all: devices, accountId })
    },
    /*
       Takes new list of devices and merges the existing into them
       -- forgets any existing devices that are not in the new devices
       -- used when new device list query is made
    */
    async truncateMergeDevices({ devices, accountId }: { devices?: IDevice[]; accountId: string }, state) {
      if (!devices) return
      const all = getDevices(state, accountId)
      const mergedDevices = devices.map(device => {
        const overwrite = all.find(o => o.id === device.id)
        if (!overwrite) return device
        return mergeDevice(overwrite, device)
      })

      await dispatch.accounts.setDevices({ devices: mergedDevices, accountId })
    },
    /*     
      Keeps the existing devices and device list order and merges in newly loaded device data
      -- For adding hidden device data or fully loaded device data
    */
    async mergeDevices({ devices, accountId }: { devices?: IDevice[]; accountId: string }, state) {
      if (!devices || !devices.length) return
      const all = getDevices(state, accountId)
      const devicesMap = new Map(devices.map(device => [device.id, device]))

      let mergedDevices: IDevice[] = all.map(overwrite => {
        const device = devicesMap.get(overwrite.id)
        if (device) {
          return mergeDevice(overwrite, device)
        } else {
          return overwrite
        }
      })

      const append: IDevice[] = devices.filter(k => !all.find(ow => ow.id === k.id))
      if (append.length) console.log('APPENDING DEVICES IN MERGE', { mergeDevice, append })

      await dispatch.accounts.setDevices({ devices: [...mergedDevices, ...append], accountId })
    },
    /* 
      Used when loading more devices from device list 
    */
    async appendUniqueDevices({ devices, accountId }: { devices?: IDevice[]; accountId: string }, state) {
      if (!devices?.length) return

      accountId = accountId || devices[0]?.accountId
      if (!accountId) return console.error('APPEND DEVICES WITH MISSING ACCOUNT ID', { accountId, devices })

      const devicesMap = new Map(devices.map(device => [device.id, device]))
      const existingDevices = getDevices(state, accountId).filter(ed => !devicesMap.has(ed.id))

      await dispatch.accounts.setDevices({
        devices: [...existingDevices, ...devices],
        accountId,
      })
    },
    async setDevice(
      { id, accountId, device, prepend }: { id: string; accountId?: string; device?: IDevice; prepend?: boolean },
      state
    ) {
      accountId = accountId || device?.accountId
      if (!accountId) return console.error('SET DEVICE WITH MISSING ACCOUNT ID', { id, accountId, device })

      const previousDevices = getDevices(state, accountId)
      let updated = false

      const devices = previousDevices
        .map(d => {
          if (d.id === id) {
            updated = true
            return device ? { ...device, hidden: d.hidden } : null
          }
          return d
        })
        .filter((d): d is IDevice => !!d)

      // Add if new
      if (!updated && device) prepend ? devices.unshift(device) : devices.push(device)
      await dispatch.accounts.setDevices({ devices, accountId })
    },
    /* 
      Remove all references to a device for cleanup after device is deleted
     */
    async removeDevice(id: string, state) {
      for (const accountId in state.devices) {
        const all = state.devices[accountId].all
        const filtered = all.filter(d => d.id !== id)
        if (filtered.length !== all.length) {
          await dispatch.accounts.setDevices({ devices: filtered, accountId })
          await dispatch.devices.set({ total: state.devices[accountId].total - 1, accountId })
        }
      }
    },
  }),
  reducers: {
    reset(state: IAccountsState) {
      state = { ...accountsState }
      return state
    },
    set(state: IAccountsState, params: Partial<IAccountsState>) {
      Object.keys(params).forEach(key => (state[key] = params[key]))
      return state
    },
  },
})

export function accountFromDevice(state: State, ownerId: string, access: string[]) {
  const userId = state.auth.user?.id || state.user.id
  const orgIds = state.accounts.membership.map(m => m.account.id)
  orgIds.push(userId) // add current user to accounts

  // My device
  if (userId === ownerId) return ownerId
  // Org device
  if (orgIds.includes(ownerId)) return ownerId
  // Shared device
  const sharedId = orgIds.find(a => access.includes(a))
  if (sharedId) return sharedId
  // Default
  return userId
}

export function getAccountIds(state: State) {
  let ids = state.accounts.membership.map(m => m.account.id)
  state.auth.user && ids.unshift(state.auth.user.id)
  return ids
}
