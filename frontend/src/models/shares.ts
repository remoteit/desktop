import { createModel } from '@rematch/core'
import { graphQLRemoveDevice, graphQLShareDevice } from '../services/graphQLMutation'
import { getPermissions } from '../helpers/userHelper'
import { attributeName } from '../shared/nameHelper'
import { getDevices } from './accounts'
import { RootModel } from './rootModel'

type ShareParams = { [key: string]: any }

type CurrentDevice = {
  device: IDevice
  serviceID: string
  userSelected: IUserRef | undefined
  selectedServices: string[]
  users: string[]
  indeterminate: string[]
  script: boolean
  hasChange: boolean
  scriptIndeterminate: boolean
  shareChanged: boolean
}

type IShareState = {
  deleting: boolean
  updating: boolean
  sharing: boolean
  currentDevice?: CurrentDevice
}

const state: IShareState = {
  deleting: false,
  updating: false,
  sharing: false,
  currentDevice: undefined,
}

export default createModel<RootModel>()({
  state,
  effects: dispatch => ({
    async fetch(data: { email?: string; serviceID: string; device?: IDevice }, globalState) {
      const { set } = dispatch.shares
      const user = globalState.devices.contacts.find(c => c.email === data.email)
      const permissions = data.device && getPermissions(data.device, data.email)

      set({
        currentDevice: {
          device: data.device,
          serviceID: data.serviceID,
          userSelected: user,
          selectedServices: permissions?.services.map(s => s.id).filter(v => v) || [],
          script: permissions?.scripting || false,
          indeterminate: [],
          scriptIndeterminate: false,
        },
      })
    },
    async delete(userDevice: { deviceId: string; email: string }) {
      const { deviceId, email } = userDevice
      const { set } = dispatch.shares
      set({ deleting: true })
      const result = await graphQLRemoveDevice({ deviceId, email: [email] })
      if (result !== 'ERROR') {
        await dispatch.devices.fetchSingle({ id: deviceId })
        dispatch.ui.set({ successMessage: `${email} successfully removed.` })
      }
      set({ deleting: false })
    },

    async share(data: IShareProps, globalState) {
      const { set } = dispatch.shares
      const device = getDevices(globalState).find((d: IDevice) => d.id === data.deviceId)
      set({ sharing: true })
      const result = await graphQLShareDevice(data)
      if (result !== 'ERROR') {
        dispatch.ui.set({
          successMessage:
            data.email.length > 1
              ? `${data.email.length} accounts successfully shared to ${attributeName(device)}.`
              : `${attributeName(device)} successfully shared to ${data.email[0]}.`,
        })
      }
      set({ sharing: false })
    },

    async changeScript(script: boolean, globalState) {
      const state = globalState
      const { set } = dispatch.shares
      set({
        currentDevice: {
          ...state.shares.currentDevice,
          script,
        },
      })
    },

    async changeServices(selectedServices: string[], globalState) {
      const state = globalState
      const { set } = dispatch.shares
      set({
        currentDevice: {
          ...state.shares.currentDevice,
          selectedServices,
        },
      })
    },

    async changeIndeterminate(indeterminate: string[], globalState) {
      const { set } = dispatch.shares
      set({
        currentDevice: {
          ...globalState.shares.currentDevice,
          indeterminate,
        },
      })
    },

    async selectAllServices(_, globalState) {
      const { set } = dispatch.shares
      set({
        currentDevice: {
          ...globalState.shares.currentDevice,
          indeterminate: [],
        },
      })
    },

    async changeScriptIndeterminate(scriptIndeterminate: boolean, globalState) {
      const { set } = dispatch.shares
      set({
        currentDevice: {
          ...globalState.shares.currentDevice,
          scriptIndeterminate,
        },
      })
    },

    async selectContacts(emails: string[], globalState) {
      const { set } = dispatch.shares
      if (!globalState.shares.currentDevice) return

      let intersection: string[] = []

      const currentDevice = globalState.shares.currentDevice
      const { device, serviceID } = currentDevice
      const contacts = globalState.devices.contacts

      let userSelectedServices: string[][] = emails.map(email => {
        return device ? getPermissions(device, email, true).services.map(s => s.id) : []
      })

      let userSelectedScript: boolean[] = emails.map(email => {
        return device ? getPermissions(device, email).scripting : false
      })

      const match = userSelectedServices.map((services, index) => {
        intersection = index === 0 ? services : intersection.filter(value => services.includes(value))
        return intersection
      })
      const matchServices = match[match.length - 1]
      const indeterminateServices = userSelectedServices
        .flat()
        .filter((v, i, a) => a.indexOf(v) === i)
        .filter(value => !matchServices.includes(value))

      const unique: any = new Set(userSelectedScript)
      let scriptsValue = {}
      switch ([...Array.from(unique)].length) {
        case 1: {
          scriptsValue = {
            scriptIndeterminate: false,
            script: userSelectedScript[0],
          }
          break
        }
        case 0: {
          scriptsValue = {
            scriptIndeterminate: false,
            script: false,
          }
          break
        }
        default: {
          scriptsValue = {
            scriptIndeterminate: true,
            script: undefined,
          }
        }
      }

      const selectedServices = [...(matchServices ? [...matchServices, serviceID] : [serviceID])].filter(v => v)

      set({
        currentDevice: {
          ...currentDevice,
          ...scriptsValue,
          userSelected: contacts.find(c => emails.includes(c.email)),
          users: emails,
          indeterminate: indeterminateServices,
          selectedServices,
        },
      })
    },

    async updateDeviceState(infoUpdate: {
      device: IDevice
      emails: string[]
      scripting: boolean
      services: string[]
      isNew?: boolean
    }) {
      const { device, emails, scripting, services, isNew } = infoUpdate

      const sharedUsers = device.access.map(item => item.email)
      const newUsers: IUser[] = emails
        .map(email => ({ email, id: '', scripting }))
        .filter(item => !sharedUsers.includes(item.email) && item)
      if (isNew) {
        const access = device.access.filter(i => emails.includes(i.email))
        device.access =
          access.length === 0
            ? device.access.concat(newUsers)
            : device.access.map(_ac => (access.find(i => i.email === _ac.email) ? { ..._ac, scripting } : { ..._ac }))
      } else {
        device.access = device.access.map(_ac => ({ ..._ac, scripting }))
      }

      device.services.map(service => {
        if (!service.access) {
          service.access = []
        }
        service.access = services.includes(service.id)
          ? service.access.concat(newUsers)
          : service.access.filter(_ac => !newUsers.find(user => user.email === _ac.email))
        return service
      })
      await dispatch.devices.updateShareDevice(device)
      await dispatch.devices.fetchSingle({ id: device.id })
    },
  }),
  reducers: {
    set(state: IShareState, params: ShareParams) {
      Object.keys(params).forEach(key => (state[key] = params[key]))
      return state
    },
  },
})
